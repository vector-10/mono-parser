import { Module } from '@nestjs/common';
import { MonoController } from './mono.controller';
import { ConfigModule } from '@nestjs/config';
import { MonoService } from './mono.service';

@Module({
  imports: [ConfigModule],
  controllers: [MonoController],
  providers: [MonoService],
  exports: [MonoService]
})
export class MonoModule {}
