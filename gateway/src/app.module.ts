import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ApplicationsModule } from './applications/applications.module';
import { UsersModule } from './users/users.module';
import { EventsModule } from './events/events.module';  
import { MonoModule } from './mono/mono.module';
import { PrismaModule } from "./prisma/prisma.module"
import { WebhooksModule } from './webhooks/webhooks.module';
import { ApplicantsModule } from './applicants/applicants.module';
import { EventsGateway } from './events/events.gateway';

@Module({
  imports: [AuthModule, UsersModule, MonoModule, EventsModule, WebhooksModule, ApplicationsModule, ApplicantsModule, PrismaModule],
  controllers: [AppController],
  providers: [AppService, EventsGateway],
})
export class AppModule {}
