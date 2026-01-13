import { Controller, Request, Post, UseGuards } from '@nestjs/common';
import { MonoService } from './mono.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('mono')
@UseGuards(JwtAuthGuard)
export class MonoController {
    constructor(private monoService: MonoService) {}

    @Post('initiate')
    async initiate(@Request() req) {
        const user = req.user;
        if(!user.monoApiKey) {
            throw new Error('Mono API key not configured for this user')
        }
        
        return this.monoService.initiateAccountLinking(user.id, user.name, user.email, user.monoApiKey)
    }
}
