import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { ApplicationsModule } from 'src/applications/applications.module';
import { EmailModule } from 'src/email/email.module';
import { ApplicationProcessor } from './queue.application-processor.service';
import { EmailProcessor } from './queue.email-processor.service';
import { QueueController } from './queue.controller';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get<string>('REDIS_URL');

        if (redisUrl) {
          const parsed = new URL(redisUrl);
          return {
            connection: {
              host: parsed.hostname,
              port: parseInt(parsed.port, 10) || 6379,
              password: parsed.password || undefined,
              username: parsed.username || 'default',
            },
          };
        }

        return {
          connection: {
            host: configService.get<string>('REDIS_HOST', 'redis'),
            port: configService.get<number>('REDIS_PORT', 6379),
            password: configService.get<string>('REDIS_PASSWORD'),
            username: configService.get<string>('REDIS_USERNAME', 'default'),
          },
        };
      },
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: 'applications',
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
        removeOnComplete: 100,
        removeOnFail: 200,
      },
    }),
    BullModule.registerQueue({
      name: 'emails',
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 3000,
        },
        removeOnComplete: 50,
        removeOnFail: 100,
      },
    }),
    forwardRef(() => ApplicationsModule),
    EmailModule,
  ],
  providers: [ApplicationProcessor, EmailProcessor],
  controllers:[QueueController],
  exports: [BullModule],
})
export class QueueModule {}
