import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { ApplicationProcessorService } from './applications-processor.service';

@WebSocketGateway({
  cors: {
    origin: '*', // For development - restrict in production
  },
  namespace: '/applications',
})
export class ApplicationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ApplicationsGateway.name);

  constructor(
    private applicationsService: ApplicationsService,
    private applicationProcessor: ApplicationProcessorService,
  ) {}

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('create_application')
  async handleCreateApplication(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: {
      applicantId: string;
      amount: number;
      tenor: number;
      fintechId: string; // You'll get this from JWT in production
    },
  ) {
    try {
      this.logger.log(`Creating application for applicant ${data.applicantId}`);

      // Send acknowledgment
      client.emit('application_created', {
        message: '⏳ Application submitted. Starting analysis...',
      });

      // Create application
      const application = await this.applicationsService.createApplication(
        data.fintechId,
        data.applicantId,
        data.amount,
        data.tenor,
      );

      // Emit application ID
      client.emit('application_created', {
        applicationId: application.id,
        message: '✓ Application created',
      });

      // Process in background with progress updates
      await this.processWithUpdates(client, application.id);
    } catch (error) {
      this.logger.error('Failed to create application:', error);
      client.emit('application_error', {
        message: `Failed to create application: ${error.message}`,
      });
    }
  }

  private async processWithUpdates(client: Socket, applicationId: string) {
    try {
      // Emit progress: Fetching data
      client.emit('progress', {
        message: '📊 Fetching bank account data...',
      });

      // Simulate data fetching steps (replace with actual steps later)
      await this.sleep(1000);
      client.emit('progress', {
        message: '✓ Bank account verified',
      });

      await this.sleep(1000);
      client.emit('progress', {
        message: '💳 Analyzing transactions...',
      });

      await this.sleep(1000);
      client.emit('progress', {
        message: '💰 Analyzing income patterns...',
      });

      // Actually process the application
      const result = await this.applicationProcessor.processApplication(
        applicationId,
      );

      if (result.success) {
        // Get final application with decision
        const application = await this.applicationsService.findOne(
          applicationId,
          'temp-fintech-id', // Replace with actual fintechId
        );

        client.emit('application_complete', {
          applicationId: application.id,
          status: application.status,
          score: application.score,
          decision: application.decision,
          message: '✅ Analysis complete!',
        });
      } else {
        client.emit('application_error', {
          message: `Processing failed: ${result.error}`,
        });
      }
    } catch (error) {
      this.logger.error(
        `Failed to process application ${applicationId}:`,
        error,
      );
      client.emit('application_error', {
        message: `Processing failed: ${error.message}`,
      });
    }
  }

  // Helper to simulate delays
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Method to emit updates from anywhere in your app
  emitProgress(applicationId: string, message: string) {
    this.server.emit('progress', { applicationId, message });
  }

  emitComplete(applicationId: string, data: any) {
    this.server.emit('application_complete', { applicationId, ...data });
  }
}