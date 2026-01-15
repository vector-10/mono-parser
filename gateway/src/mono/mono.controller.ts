import {
  Controller,
  Request,
  Post,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { MonoService } from './mono.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';


@Controller('mono')
@UseGuards(JwtAuthGuard)
export class MonoController {
  constructor(private readonly monoService: MonoService) {}

  @Post('initiate')
  async initiate(@Request() req) {
    if (!req.user.monoApiKey) {
      throw new BadRequestException('Mono API key not configured.');
    }

    return this.monoService.initiateAccountLinking(
      req.user.id,
      req.user.name,
      req.user.email,
      req.user.monoApiKey,
    );
  }
}
