import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './user.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  providers: [UsersService, PrismaService],
  exports: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
