import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { ApplicationsModule } from "src/applications/applications.module";
import { ApplicationProcessor } from "./queue.application-processor.service";


@Module({
    imports: [
        BullModule.forRoot({
            connection: {
                host: process.env.REDIS_HOST || 'localhost',
                port: parseInt(process.env.REDIS_PORT) || 6379,
            },
        }),
        BullModule.registerQueue({
            name: 'applications'
        }),
        ApplicationsModule
    ],
    providers: [ApplicationProcessor],  
    exports: [BullModule],
})

export class QueueModule {}