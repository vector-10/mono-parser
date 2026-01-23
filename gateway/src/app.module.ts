import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ApplicationsModule } from './applications/applications.module';
import { UsersModule } from './users/users.module';
import { EventsModule } from './events/events.module';
import { MonoModule } from './mono/mono.module';
import { PrismaModule } from './prisma/prisma.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { ApplicantsModule } from './applicants/applicants.module';
import { EventsGateway } from './events/events.gateway';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',

        transport:
          process.env.NODE_ENV !== 'production'
            ? {
                target: 'pino-pretty',
                options: {
                  colorize: true,
                  translateTime: 'SYS:HH:MM:ss',
                  ignore: 'pid,hostname',
                },
              }
            : undefined,
        autoLogging: true,
      },
    }),
    AuthModule,
    UsersModule,
    MonoModule,
    EventsModule,
    WebhooksModule,
    ApplicationsModule,
    ApplicantsModule,
    PrismaModule,
  ],
  controllers: [AppController],
  providers: [AppService, EventsGateway],
})
export class AppModule {}
