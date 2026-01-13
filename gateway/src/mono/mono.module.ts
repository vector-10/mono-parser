import { Module } from '@nestjs/common';
import { MonoController } from './mono.controller';
import { MonoService } from './mono.service';

@Module({
  controllers: [MonoController],
  providers: [MonoService]
})
export class MonoModule {}
