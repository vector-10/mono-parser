import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { PrismaService } from '../prisma/prisma.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { TokenService } from './token.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from '../users/users.module';
import { QueueModule } from '../queues/queue.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) {
          throw new Error('JWT_SECRET environment variable is not set');
        }
        return {
          secret,
          signOptions: {
            expiresIn: configService.get<string>('ACCESS_TOKEN_EXPIRY', '15m') as any,
          },
        };
      },
      inject: [ConfigService],
    }),
    QueueModule,
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, PrismaService, TokenService, JwtStrategy],
})
export class AuthModule {}
