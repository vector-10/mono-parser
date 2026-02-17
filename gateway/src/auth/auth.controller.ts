import {
  Controller,
  Post,
  Get,
  Body,
  Request,
  Res,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { RequestResetDto } from './dto/request-reset.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

const REFRESH_TOKEN_COOKIE = 'refresh_token';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

@Controller('auth')
export class AuthController {
  private readonly isProduction: boolean;

  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {
    this.isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';
  }

  private setRefreshTokenCookie(res: Response, refreshToken: string) {
    res.cookie(REFRESH_TOKEN_COOKIE, refreshToken, {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: this.isProduction ? 'strict' : 'lax',
      path: '/api/auth',
      maxAge: SEVEN_DAYS_MS,
    });
  }

  private clearRefreshTokenCookie(res: Response) {
    res.cookie(REFRESH_TOKEN_COOKIE, '', {
      httpOnly: true,
      secure: this.isProduction,
      sameSite: this.isProduction ? 'strict' : 'lax',
      path: '/api/auth',
      maxAge: 0,
    });
  }

  private getRefreshTokenFromCookie(req: any): string | undefined {
    return req.cookies?.[REFRESH_TOKEN_COOKIE];
  }

  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Post('signup')
  async signup(@Body() signupDto: SignupDto) {
    return this.authService.signup(signupDto);
  }

  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @Post('verify-otp')
  async verifyOTP(
    @Body() verifyotpDto: VerifyOtpDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.verifyOTP(verifyotpDto);
    this.setRefreshTokenCookie(res, result.refresh_token);
    const { refresh_token, ...response } = result;
    return response;
  }

  @Throttle({ default: { ttl: 60000, limit: 3 } })
  @Post('resend-otp')
  async resendOTP(@Body() resendOtpDto: ResendOtpDto) {
    return this.authService.resendOTP(resendOtpDto);
  }

  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(loginDto);
    this.setRefreshTokenCookie(res, result.refresh_token);
    const { refresh_token, ...response } = result;
    return response;
  }

  @Throttle({ default: { ttl: 60000, limit: 3 } })
  @Post('request-reset')
  async requestPasswordReset(@Body() requestResetDto: RequestResetDto) {
    return this.authService.requestPasswordReset(requestResetDto);
  }

  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Post('reset-password')
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }

  @Throttle({ default: { ttl: 60000, limit: 20 } })
  @Post('refresh')
  async refresh(
    @Request() req,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = this.getRefreshTokenFromCookie(req);
    if (!refreshToken) {
      this.clearRefreshTokenCookie(res);
      throw new UnauthorizedException('No refresh token provided');
    }
    const result = await this.authService.refresh(refreshToken);
    this.setRefreshTokenCookie(res, result.refresh_token);
    return { access_token: result.access_token };
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(
    @Request() req,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = this.getRefreshTokenFromCookie(req);
    this.clearRefreshTokenCookie(res);
    if (refreshToken) {
      return this.authService.logout(refreshToken);
    }
    return { message: 'Logged out successfully' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req) {
    return this.authService.validateUser(req.user.id);
  }
}
