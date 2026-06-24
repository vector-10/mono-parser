import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TokenService } from './token.service';
import { PrismaService } from 'src/prisma/prisma.service';

const mockPrisma = {
  refreshToken: {
    create:     jest.fn(),
    findUnique: jest.fn(),
    updateMany: jest.fn(),
  },
};

const mockJwtService    = { sign: jest.fn() };
const mockConfigService = { get: jest.fn((_key: string, def: any) => def) };

describe('TokenService', () => {
  let service: TokenService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenService,
        { provide: JwtService,      useValue: mockJwtService    },
        { provide: PrismaService,   useValue: mockPrisma        },
        { provide: ConfigService,   useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<TokenService>(TokenService);
  });

  // ── generateAccessToken ──────────────────────────────────────────────────────

  describe('generateAccessToken', () => {
    it('signs with sub and email claims and returns the JWT string', () => {
      mockJwtService.sign.mockReturnValue('signed-jwt');

      const token = service.generateAccessToken('u1', 'u@x.com');

      expect(mockJwtService.sign).toHaveBeenCalledWith(
        { sub: 'u1', email: 'u@x.com' },
        expect.any(Object),
      );
      expect(token).toBe('signed-jwt');
    });
  });

  // ── generateRefreshToken ─────────────────────────────────────────────────────

  describe('generateRefreshToken', () => {
    it('stores a hashed token in the database and returns the 128-char hex raw token', async () => {
      mockPrisma.refreshToken.create.mockResolvedValue({});

      const raw = await service.generateRefreshToken('u1');

      expect(mockPrisma.refreshToken.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ userId: 'u1' }) }),
      );
      expect(raw).toMatch(/^[0-9a-f]{128}$/);
    });

    it('never stores the raw token — only its SHA-256 hash', async () => {
      mockPrisma.refreshToken.create.mockResolvedValue({});

      const raw        = await service.generateRefreshToken('u1');
      const storedHash = mockPrisma.refreshToken.create.mock.calls[0][0].data.tokenHash;

      expect(storedHash).not.toBe(raw);
      expect(storedHash).toHaveLength(64);
    });
  });

  // ── validateRefreshToken ─────────────────────────────────────────────────────

  describe('validateRefreshToken', () => {
    it('throws when no matching token exists in the database', async () => {
      mockPrisma.refreshToken.findUnique.mockResolvedValue(null);
      await expect(service.validateRefreshToken('raw')).rejects.toThrow(UnauthorizedException);
    });

    it('revokes all tokens for the user and throws when a revoked token is reused (token-theft detection)', async () => {
      mockPrisma.refreshToken.findUnique.mockResolvedValue({
        revoked: true, userId: 'u1', expiresAt: new Date(Date.now() + 10_000),
      });

      await expect(service.validateRefreshToken('raw')).rejects.toThrow(UnauthorizedException);
      expect(mockPrisma.refreshToken.updateMany).toHaveBeenCalled();
    });

    it('throws when the token is expired', async () => {
      mockPrisma.refreshToken.findUnique.mockResolvedValue({
        revoked: false, userId: 'u1', expiresAt: new Date(Date.now() - 1_000),
      });
      await expect(service.validateRefreshToken('raw')).rejects.toThrow(UnauthorizedException);
    });

    it('returns the stored token record when the token is valid', async () => {
      const stored = { revoked: false, userId: 'u1', expiresAt: new Date(Date.now() + 10_000), user: { id: 'u1' } };
      mockPrisma.refreshToken.findUnique.mockResolvedValue(stored);

      const result = await service.validateRefreshToken('raw-token');

      expect(result).toBe(stored);
    });
  });
});
