import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { MonoModule } from './mono/mono.module';
import { PrismaModule } from "./prisma/prisma.module"
import { WebhooksModule } from './webhooks/webhooks.module';
import { ApplicantsModule } from './applicants/applicants.module';

@Module({
  imports: [AuthModule, UsersModule, MonoModule, WebhooksModule, ApplicantsModule, PrismaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
