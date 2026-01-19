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
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*', // Restrict in production
  },
})
export class EventsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // Generic method to emit events to specific clients or broadcast
  emitToClient(clientId: string, event: string, data: any) {
    this.server.to(clientId).emit(event, data);
  }

  // Broadcast to all connected clients
  broadcast(event: string, data: any) {
    this.server.emit(event, data);
  }

  // Emit to room (useful for per-fintech channels)
  emitToRoom(room: string, event: string, data: any) {
    this.server.to(room).emit(event, data);
  }

  // Subscribe clients to rooms (e.g., by fintechId)
  subscribeToRoom(client: Socket, room: string) {
    client.join(room);
    this.logger.log(`Client ${client.id} joined room: ${room}`);
  }

  // Application-specific events
  @SubscribeMessage('create_application')
  handleCreateApplication(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    data: {
      applicantId: string;
      amount: number;
      tenor: number;
      fintechId: string;
    },
  ) {
    // Emit back to acknowledge
    client.emit('application_received', {
      message: '⏳ Application submitted. Starting analysis...',
      data,
    });

    // The actual processing will be handled by ApplicationProcessorService
    // This gateway just handles the WebSocket communication
    return { received: true, clientId: client.id };
  }

  // Progress updates for applications
  emitApplicationProgress(clientId: string, message: string) {
    this.emitToClient(clientId, 'application_progress', { message });
  }

  // Application completion
  emitApplicationComplete(clientId: string, data: any) {
    this.emitToClient(clientId, 'application_complete', data);
  }

  // Application error
  emitApplicationError(clientId: string, message: string) {
    this.emitToClient(clientId, 'application_error', { message });
  }
}