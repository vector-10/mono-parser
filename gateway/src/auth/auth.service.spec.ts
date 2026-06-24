import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { getQueueToken } from '@nestjs/bullmq';
import { createHash } from 'crypto';
import { AuthService } from './auth.service';
import { UsersService } from 'src/users/users.service';
import { TokenService } from './token.service';

function sha256(value: string) {
  return createHash('sha256').update(value).digest('hex');
}

const mockUsersService = {
  findByEmail: jest.fn(),
  create: jest.fn(),
  updateOTP: jest.fn(),
  verifyEmail: jest.fn(),
  generateAndStoreApiKey: jest.fn(),
  validatePassword: jest.fn(),
  updatePassword: jest.fn(),
};

const mockTokenService = {
  generateAccessToken: jest.fn(),
  generateRefreshToken: jest.fn(),
  revokeRefreshToken: jest.fn(),
  revokeAllUserTokens: jest.fn(),
};

const mockEmailQueue = { add: jest.fn() };

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService,            useValue: mockUsersService },
        { provide: TokenService,            useValue: mockTokenService },
        { provide: getQueueToken('emails'), useValue: mockEmailQueue   },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  // ── signup ──────────────────────────────────────────────────────────────────

  describe('signup', () => {
    const dto = { email: 'ada@acme.com', password: 'pass', name: 'Ada', companyName: 'Acme' };

    it('throws ConflictException when a verified user already exists', async () => {
      mockUsersService.findByEmail.mockResolvedValue({ isVerified: true });
      await expect(service.signup(dto)).rejects.toThrow(ConflictException);
    });

    it('resends OTP without creating a new user when the existing user is unverified', async () => {
      mockUsersService.findByEmail.mockResolvedValue({ id: 'u1', isVerified: false });

      const result = await service.signup(dto);

      expect(mockUsersService.create).not.toHaveBeenCalled();
      expect(mockUsersService.updateOTP).toHaveBeenCalledWith('u1', expect.any(String), expect.any(Date));
      expect(mockEmailQueue.add).toHaveBeenCalledWith('send-otp', expect.objectContaining({ email: dto.email }));
      expect(result.message).toMatch(/resent/i);
    });

    it('creates a new user and queues an OTP email for a fresh signup', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      mockUsersService.create.mockResolvedValue({ id: 'new-id' });

      const result = await service.signup(dto);

      expect(mockUsersService.create).toHaveBeenCalledWith(dto.email, dto.password, dto.name, dto.companyName);
      expect(mockEmailQueue.add).toHaveBeenCalledWith('send-otp', expect.objectContaining({ email: dto.email }));
      expect(result.message).toMatch(/Registration successful/i);
    });
  });

  // ── verifyOTP ───────────────────────────────────────────────────────────────

  describe('verifyOTP', () => {
    it('throws when user does not exist', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      await expect(service.verifyOTP({ email: 'x@x.com', otp: '123456' })).rejects.toThrow(UnauthorizedException);
    });

    it('throws when OTP hash does not match', async () => {
      mockUsersService.findByEmail.mockResolvedValue({ otp: 'wrong-hash', otpExpiry: new Date(Date.now() + 60_000) });
      await expect(service.verifyOTP({ email: 'x@x.com', otp: '000000' })).rejects.toThrow(UnauthorizedException);
    });

    it('throws when OTP is expired', async () => {
      const otp = '123456';
      mockUsersService.findByEmail.mockResolvedValue({ otp: sha256(otp), otpExpiry: new Date(Date.now() - 1_000) });
      await expect(service.verifyOTP({ email: 'x@x.com', otp })).rejects.toThrow(UnauthorizedException);
    });

    it('returns tokens, apiKey, and user on success', async () => {
      const otp = '123456';
      const user = {
        id: 'u1', email: 'ada@acme.com', name: 'Ada', companyName: 'Acme',
        otp: sha256(otp), otpExpiry: new Date(Date.now() + 60_000),
      };
      mockUsersService.findByEmail.mockResolvedValue(user);
      mockUsersService.generateAndStoreApiKey.mockResolvedValue({ apiKey: 'ak-123', webhookSecret: 'ws-456' });
      mockTokenService.generateAccessToken.mockReturnValue('access-token');
      mockTokenService.generateRefreshToken.mockResolvedValue('refresh-token');

      const result = await service.verifyOTP({ email: user.email, otp });

      expect(result.access_token).toBe('access-token');
      expect(result.refresh_token).toBe('refresh-token');
      expect(result.apiKey).toBe('ak-123');
      expect(result.user.email).toBe(user.email);
    });
  });

  // ── login ───────────────────────────────────────────────────────────────────

  describe('login', () => {
    it('throws when user does not exist', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      await expect(service.login({ email: 'x@x.com', password: 'p' })).rejects.toThrow(UnauthorizedException);
    });

    it('throws when user email is not verified', async () => {
      mockUsersService.findByEmail.mockResolvedValue({ isVerified: false });
      await expect(service.login({ email: 'x@x.com', password: 'p' })).rejects.toThrow(UnauthorizedException);
    });

    it('throws when password is invalid', async () => {
      mockUsersService.findByEmail.mockResolvedValue({ isVerified: true, password: 'hash' });
      mockUsersService.validatePassword.mockResolvedValue(false);
      await expect(service.login({ email: 'x@x.com', password: 'wrong' })).rejects.toThrow(UnauthorizedException);
    });

    it('returns tokens and user data on valid credentials', async () => {
      const user = { id: 'u1', email: 'ada@acme.com', name: 'Ada', companyName: 'Acme', isVerified: true, password: 'hashed' };
      mockUsersService.findByEmail.mockResolvedValue(user);
      mockUsersService.validatePassword.mockResolvedValue(true);
      mockTokenService.generateAccessToken.mockReturnValue('at');
      mockTokenService.generateRefreshToken.mockResolvedValue('rt');

      const result = await service.login({ email: user.email, password: 'correct' });

      expect(result.access_token).toBe('at');
      expect(result.user.id).toBe('u1');
      expect(result.user.companyName).toBe('Acme');
    });
  });

  // ── requestPasswordReset ─────────────────────────────────────────────────────

  describe('requestPasswordReset', () => {
    it('returns the same generic message without sending email when user is not found (prevents enumeration)', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      const result = await service.requestPasswordReset({ email: 'unknown@x.com' });

      expect(mockEmailQueue.add).not.toHaveBeenCalled();
      expect(result.message).toMatch(/If this email/i);
    });

    it('queues a reset email when the user exists and is verified', async () => {
      const user = { id: 'u1', email: 'ada@acme.com', name: 'Ada', isVerified: true };
      mockUsersService.findByEmail.mockResolvedValue(user);

      await service.requestPasswordReset({ email: user.email });

      expect(mockEmailQueue.add).toHaveBeenCalledWith(
        'send-password-reset',
        expect.objectContaining({ email: user.email }),
      );
    });
  });

  // ── resetPassword ────────────────────────────────────────────────────────────

  describe('resetPassword', () => {
    it('throws when user does not exist', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);
      await expect(service.resetPassword({ email: 'x@x.com', otp: '0', newPassword: 'new' })).rejects.toThrow(UnauthorizedException);
    });

    it('throws when OTP is expired', async () => {
      const otp = '123456';
      mockUsersService.findByEmail.mockResolvedValue({ otp: sha256(otp), otpExpiry: new Date(Date.now() - 1_000) });
      await expect(service.resetPassword({ email: 'x@x.com', otp, newPassword: 'new' })).rejects.toThrow(UnauthorizedException);
    });

    it('updates the password and revokes all refresh tokens on success', async () => {
      const otp = '123456';
      const user = { id: 'u1', otp: sha256(otp), otpExpiry: new Date(Date.now() + 60_000) };
      mockUsersService.findByEmail.mockResolvedValue(user);

      const result = await service.resetPassword({ email: 'x@x.com', otp, newPassword: 'newpass' });

      expect(mockUsersService.updatePassword).toHaveBeenCalledWith('u1', 'newpass');
      expect(mockTokenService.revokeAllUserTokens).toHaveBeenCalledWith('u1');
      expect(result.message).toMatch(/reset successfully/i);
    });
  });
});
