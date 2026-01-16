import { Module } from '@nestjs/common';
import { MonoController } from './mono.controller';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { MonoService } from './mono.service';

@Module({
  imports: [ConfigModule],
  controllers: [MonoController],
  providers: [MonoService, PrismaService],
  exports: [MonoService]
})
export class MonoModule {}
