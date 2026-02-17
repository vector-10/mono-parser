import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { createHash, randomInt } from 'crypto';
import { UsersService } from 'src/users/users.service';
import { TokenService } from 'src/auth/token.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { RequestResetDto } from './dto/request-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private tokenService: TokenService,
    private usersService: UsersService,
    @InjectQueue('emails') private readonly emailQueue: Queue,
  ) {}

  async signup(signupDto: SignupDto) {
    const existingUser = await this.usersService.findByEmail(signupDto.email);

    if (existingUser?.isVerified) {
      throw new ConflictException('Email already registered. Please Login');
    }

    if (existingUser && !existingUser.isVerified) {
      const otp = this.generateOTP();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 10);

      await this.usersService.updateOTP(existingUser.id, this.hashOTP(otp), expiresAt);
      await this.emailQueue.add('send-otp', {
        email: signupDto.email,
        otp,
        name: signupDto.name,
      });

      return {
        message: 'Verification email resent. Please check your email.',
        email: signupDto.email,
      };
    }

    const user = await this.usersService.create(
      signupDto.email,
      signupDto.password,
      signupDto.name,
      signupDto.companyName,
    );

    const otp = this.generateOTP();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    await this.usersService.updateOTP(user.id, this.hashOTP(otp), expiresAt);
    await this.emailQueue.add('send-otp', {
      email: signupDto.email,
      otp,
      name: signupDto.name,
    });

    return {
      message: 'Registration successful. Please verify your email.',
      email: signupDto.email,
    };
  }

  async verifyOTP(verifyotpDto: VerifyOtpDto) {
    const user = await this.usersService.findByEmail(verifyotpDto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or OTP');
    }

    if (user.otp !== this.hashOTP(verifyotpDto.otp)) {
      throw new UnauthorizedException('Invalid OTP');
    }

    if (!user.otpExpiry || user.otpExpiry < new Date()) {
      throw new UnauthorizedException('OTP expired');
    }

    await this.usersService.verifyEmail(user.id);

    const access_token = this.tokenService.generateAccessToken(
      user.id,
      user.email,
    );
    const refresh_token = await this.tokenService.generateRefreshToken(user.id);

    return {
      message: 'Email verified successfully',
      access_token,
      refresh_token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        companyName: user.companyName,
      },
    };
  }

  async resendOTP(resendOtpDto: ResendOtpDto) {
    const user = await this.usersService.findByEmail(resendOtpDto.email);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.isVerified) {
      throw new ConflictException('Email is already verified');
    }

    const otp = this.generateOTP();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    await this.usersService.updateOTP(user.id, this.hashOTP(otp), expiresAt);
    await this.emailQueue.add('resend-otp', {
      email: user.email,
      otp,
      name: user.name,
    });

    return {
      message: 'OTP resent successfully',
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isVerified) {
      throw new UnauthorizedException('Please verify your email first');
    }

    const isPasswordValid = await this.usersService.validatePassword(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const access_token = this.tokenService.generateAccessToken(
      user.id,
      user.email,
    );
    const refresh_token = await this.tokenService.generateRefreshToken(user.id);

    return {
      access_token,
      refresh_token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        companyName: user.companyName,
      },
    };
  }

  async requestPasswordReset(requestResetDto: RequestResetDto) {
    const user = await this.usersService.findByEmail(requestResetDto.email);

    if (!user) {
      return { message: 'If this email is registered, a reset code has been sent.' };
    }

    if (!user.isVerified) {
      throw new UnauthorizedException('Please verify your email first');
    }

    const otp = this.generateOTP();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    await this.usersService.updateOTP(user.id, this.hashOTP(otp), expiresAt);
    await this.emailQueue.add('send-password-reset', {
      email: user.email,
      otp,
      name: user.name,
    });

    return { message: 'If this email is registered, a reset code has been sent.' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const user = await this.usersService.findByEmail(resetPasswordDto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid email or OTP');
    }

    if (user.otp !== this.hashOTP(resetPasswordDto.otp)) {
      throw new UnauthorizedException('Invalid OTP');
    }

    if (!user.otpExpiry || user.otpExpiry < new Date()) {
      throw new UnauthorizedException('OTP expired');
    }

    await this.usersService.updatePassword(user.id, resetPasswordDto.newPassword);

    await this.usersService.updateOTP(user.id, null, null);
    await this.tokenService.revokeAllUserTokens(user.id);

    return { message: 'Password reset successfully. Please log in with your new password.' };
  }

  async refresh(refreshToken: string) {
    const storedToken =
      await this.tokenService.validateRefreshToken(refreshToken);

    await this.tokenService.revokeRefreshToken(refreshToken);

    const access_token = this.tokenService.generateAccessToken(
      storedToken.user.id,
      storedToken.user.email,
    );
    const refresh_token = await this.tokenService.generateRefreshToken(
      storedToken.userId,
    );

    return { access_token, refresh_token };
  }

  async logout(refreshToken: string) {
    await this.tokenService.revokeRefreshToken(refreshToken);
    return { message: 'Logged out successfully' };
  }

  async validateUser(userId: string) {
    return this.usersService.findById(userId);
  }

  private generateOTP(): string {
    return randomInt(100000, 999999).toString();
  }

  private hashOTP(otp: string): string {
    return createHash('sha256').update(otp).digest('hex');
  }
}
