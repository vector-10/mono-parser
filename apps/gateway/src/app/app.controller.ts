import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService, private readonly prismaService: PrismaService) {}

  @Get()
  getData() {
    return this.appService.getData();
  }

  @Get('test-db')
  async checkDatabase() {
    try {
      // This is a "ping" to the database
      await this.prismaService.$queryRaw`SELECT 1`;
      console.log(' Manual DB Check: Connection is healthy.');
      return {
        status: 'Online',
        message: 'The Gateway is successfully connected to the Docker Postgres database!',
        timestamp: new Date().toISOString(),
      };
    } catch (error:any) {
      console.error(' Manual DB Check Failed:', error.message);
      return {
        status: 'Offline',
        message: 'Database connection failed',
        error: error.message,
      };
    }
  }
}
