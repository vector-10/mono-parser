import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { EmailService } from 'src/email/email.service';
import { UsersService } from 'src/users/users.service';
import { TokenService } from 'src/auth/token.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';

@Injectable()
export class AuthService {
  constructor(
    private tokenService: TokenService,
    private emailService: EmailService,
    private usersService: UsersService,
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

      await this.usersService.updateOTP(existingUser.id, otp, expiresAt);
      await this.emailService.sendOTP(signupDto.email, otp, signupDto.name);

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

    await this.usersService.updateOTP(user.id, otp, expiresAt);
    await this.emailService.sendOTP(signupDto.email, otp, signupDto.name);

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

    if (user.otp !== verifyotpDto.otp) {
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
        apiKey: user.apiKey,
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

    await this.usersService.updateOTP(user.id, otp, expiresAt);
    await this.emailService.sendOTP(user.email, otp, user.name);

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
        apiKey: user.apiKey,
      },
    };
  }

  async refresh(refreshToken: string) {
    const storedToken =
      await this.tokenService.validateRefreshToken(refreshToken);

    // Revoke the old refresh token (rotation)
    await this.tokenService.revokeRefreshToken(refreshToken);

    // Issue new pair
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
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
