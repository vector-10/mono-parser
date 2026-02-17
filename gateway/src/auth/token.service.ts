import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { randomBytes, createHash } from 'crypto';

@Injectable()
export class TokenService {
  private readonly accessTokenExpiry: string;
  private readonly refreshTokenExpiryDays: number;

  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    this.accessTokenExpiry = this.configService.get<string>('ACCESS_TOKEN_EXPIRY', '15m');
    this.refreshTokenExpiryDays = this.configService.get<number>('REFRESH_TOKEN_EXPIRY_DAYS', 7);
  }

  generateAccessToken(userId: string, email: string) {
    return this.jwtService.sign(
      { sub: userId, email },
      { expiresIn: this.accessTokenExpiry as any },
    );
  }

  async generateRefreshToken(userId: string): Promise<string> {
    const rawToken = randomBytes(64).toString('hex');
    const tokenHash = this.hashToken(rawToken);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.refreshTokenExpiryDays);

    await this.prisma.refreshToken.create({
      data: {
        tokenHash,
        userId,
        expiresAt,
      },
    });

    return rawToken;
  }

  async validateRefreshToken(rawToken: string) {
    const tokenHash = this.hashToken(rawToken);

    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (storedToken.revoked) {
      await this.revokeAllUserTokens(storedToken.userId);
      throw new UnauthorizedException('Refresh token has been revoked');
    }

    if (storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token has expired');
    }

    return storedToken;
  }

  async revokeRefreshToken(rawToken: string) {
    const tokenHash = this.hashToken(rawToken);
    await this.prisma.refreshToken.updateMany({
      where: { tokenHash },
      data: { revoked: true },
    });
  }

  async revokeAllUserTokens(userId: string) {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true },
    });
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }
}
