import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { EmailService } from 'src/email/email.service';
import { TokenService } from 'src/auth/token.service';
import * as bcrypt from 'bcrypt';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private tokenService: TokenService,
    private emailService: EmailService,
  ) {}

  async signup(signupDto: SignupDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: signupDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }
    const hashedPassword = await bcrypt.hash(signupDto.password, 10);

    const user = await this.prisma.user.create({
      email: signupDto.email,
      password: hashedPassword,
      name: signupDto.name,
      companyName: signupDto.companyName,
    });

    const otp = this.generateOTP();
    await this.saveOTP(user.id, otp);
    await this.emailService.sendOTP(signupDto.email, otp, signupDto.name);

    return {
      message: 'Registration successful. Please verify your email.',
      email: signupDto.email,
    };
  }

  async verifyOTP(verifyotpDto: VerifyOtpDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: verifyotpDto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or OTP');
    }

    if (user.otp !== verifyotpDto.otp) {
      throw new UnauthorizedException('Invalid OTP');
    }

    if (!user.otpExpiry || user.otpExpiry < new Date()) {
      throw new UnauthorizedException('OTP expired');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        otp: null,
        otpExpiry: null,
      },
    });

    const access_token = this.tokenService.generateAccessToken(
      user.id,
      user.email,
    );

    return {
      message: 'Email verified successfully',
      access_token,
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
    const user = await this.prisma.user.findUnique({
      where: { email: resendOtpDto.email },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.isVerified) {
      throw new ConflictException('Email is already verified');
    }

    const otp = this.generateOTP();
    await this.saveOTP(user.id, otp);
    await this.emailService.sendOTP(user.email, otp, user.name);

    return {
      message: 'OTP resent successfully',
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isVerified) {
      throw new UnauthorizedException('Please verify your email first');
    }

    const isPasswordValid = await bcrypt.compare(
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

    return {
      access_token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        companyName: user.companyName,
        apiKey: user.apiKey,
      },
    };
  }

  async validateUser(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        companyName: true,
        apiKey: true,
      },
    });
  }

  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private async saveOTP(userId: string, otp: string) {
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        otp,
        otpExpiry: expiresAt,
      },
    });
  }
}
