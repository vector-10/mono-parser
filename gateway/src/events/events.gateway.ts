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
    origin: '*', 
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

  emitToClient(clientId: string, event: string, data: any) {
    this.server.to(clientId).emit(event, data);
  }


  broadcast(event: string, data: any) {
    this.server.emit(event, data);
  }


  emitToRoom(room: string, event: string, data: any) {
    this.server.to(room).emit(event, data);
  }


  subscribeToRoom(client: Socket, room: string) {
    client.join(room);
    this.logger.log(`Client ${client.id} joined room: ${room}`);
  }

  
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

    client.emit('application_received', {
      message: '⏳ Application submitted. Starting analysis...',
      data,
    });

    return { received: true, clientId: client.id };
  }

  emitApplicationProgress(clientId: string, message: string) {
    this.emitToClient(clientId, 'application_progress', { message });
  }


  emitApplicationComplete(clientId: string, data: any) {
    this.emitToClient(clientId, 'application_complete', data);
  }


  emitApplicationError(clientId: string, message: string) {
    this.emitToClient(clientId, 'application_error', { message });
  }
}