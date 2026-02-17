import { Module } from '@nestjs/common';
import { MonoController } from './mono.controller';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { MonoService } from './mono.service';
import { MonoApiKeyGuard } from 'src/auth/guards/mono-api-key.guard';

@Module({
  imports: [ConfigModule],
  controllers: [MonoController],
  providers: [MonoService, PrismaService, MonoApiKeyGuard],
  exports: [MonoService]
})
export class MonoModule {}
