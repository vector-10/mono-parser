import { Controller, Put, Post, Body, Request, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Put('api-key')
  async updateApiKey(
    @Request() req,
    @Body('monoApiKey') monoApiKey: string,
  ) {
    return this.usersService.updateMonoApiKey(req.user.id, monoApiKey);
  }

  @Put('webhook-url')
  async updateWebhookUrl(
    @Request() req,
    @Body('webhookUrl') webhookUrl: string,
  ) {
    return this.usersService.updateWebhookUrl(req.user.id, webhookUrl);
  }

  @Post('rotate-api-key')
  async rotateApiKey(@Request() req) {
    return this.usersService.rotateApiKey(req.user.id);
  }
}
