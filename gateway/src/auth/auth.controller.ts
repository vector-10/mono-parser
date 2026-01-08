import { Controller, Post, Get, Body, Request, UseGuards } from '@nestjs/common';
import  { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
    constructor(private authService: AuthService) {}

    @Post('signup')
    async signup(@Body() signupDto: SignupDto) {
        return this.authService.signup(signupDto);
    }

    @Post('verify-otp')
    async verifyOTP(@Body() verifyotpDto: VerifyOtpDto) {
        return this.authService.verifyOTP(verifyotpDto);
    }

    @Post('resend-otp')
    async resendOTP(@Body() resendOtpDto: ResendOtpDto) {
        return this.authService.resendOTP(resendOtpDto);
    }

    @Post('login')
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    @Get('me')                                                              
    @UseGuards(JwtAuthGuard)
    async getProfile(@Request() req) {
        return req.user;
    }

}
