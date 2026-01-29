import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { PinoLogger } from 'nestjs-pino';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  namespace: '/api',
  cors: {
    origin: '*',
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(EventsGateway.name);
  }

  handleConnection(client: Socket) {
    this.logger.info(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.info(`Client disconnected: ${client.id}`);
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

  emitToUser(userId: string, event: string, data: any) {
    const userRoom = `user:${userId}`;
    this.server.to(userRoom).emit(event, data);
    this.logger.info({ userId, event }, 'Emitted event to user');
  }

  subscribeToRoom(client: Socket, room: string) {
    client.join(room);
    this.logger.info(`Client ${client.id} joined room: ${room}`);
  }

  @SubscribeMessage('join_user_room')
  handleJoinUserRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string },
  ) {
    const userRoom = `user:${data.userId}`;
    client.join(userRoom);
    this.logger.info(`Client ${client.id} joined user room: ${userRoom}`);
    return { joined: true, room: userRoom };
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
