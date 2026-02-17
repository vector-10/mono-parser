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
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        companyName: true,
        monoApiKey: true,
      },
    });

    if (!user) return null;

    const { monoApiKey, ...rest } = user;
    return { ...rest, hasMonoApiKey: !!monoApiKey };
  }

  async updateOTP(userId: string, otp: string | null, expiresAt: Date | null) {
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

  async updatePassword(userId: string, newPassword: string) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    return this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }

  async updateMonoApiKey(userId: string, monoApiKey: string, monoPublicKey: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { monoApiKey, monoPublicKey },
      select: {
        id: true,
        email: true,
        name: true,
        companyName: true,
      },
    });

    return { ...user, hasMonoApiKey: true };
  }
}
