import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { QueueModule } from 'src/queues/queue.module';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';
import { DataAggregationService } from './data-aggregation.service';
import { ApplicationProcessorService } from './applications-processor.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { MonoModule } from 'src/mono/mono.module';
import { AIModule } from 'src/ai/ai.module';
import { RiskPolicyModule } from 'src/risk-policy/risk-policy.module';

@Module({
  imports: [ConfigModule, PrismaModule, forwardRef(() => QueueModule), MonoModule, AIModule, RiskPolicyModule],
  controllers: [ApplicationsController],
  providers: [
    ApplicationsService,
    DataAggregationService,
    ApplicationProcessorService,
  ],
  exports: [ApplicationsService, ApplicationProcessorService],
})
export class ApplicationsModule {}
