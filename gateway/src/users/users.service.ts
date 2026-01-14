import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) {}

    async create(
    email: string,
    password: string,
    name: string,
    companyName: string,
  ) {
    const hashedPassword = await bcrypt.hash(password, 10);

    return this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        companyName,
      },
      select: {
        id: true,
        email: true,
        name: true,
        companyName: true,
        apiKey: true,
        monoApiKey: true,
        isVerified: true,
        otp: true,
        otpExpiry: true,
      },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findById(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        companyName: true,
        apiKey: true,
        monoApiKey: true,
      },
    });
  }

  async updateOTP(userId: string, otp: string, expiresAt: Date) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        otp,
        otpExpiry: expiresAt,
      },
    });
  }

  async verifyEmail(userId: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: {
        isVerified: true,
        otp: null,
        otpExpiry: null,
      },
    });
  }

  async validatePassword(plainPassword: string, hashedPassword: string) {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

}
