import { Module } from '@nestjs/common';
import { ApplicationsController } from './applications.controller';
import { ApplicationsService } from './applications.service';
import { DataAggregationService } from './data-aggregation.service';
import { ApplicationProcessorService } from './applications-processor.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { EventsModule } from 'src/events/events.module';
import { MonoModule } from 'src/mono/mono.module';

@Module({
  imports: [PrismaModule, MonoModule, EventsModule],
  controllers: [ApplicationsController],
  providers: [
    ApplicationsService,
    DataAggregationService,
    ApplicationProcessorService,
  ],
  exports: [ApplicationsService, ApplicationProcessorService],
})
export class ApplicationsModule {}
