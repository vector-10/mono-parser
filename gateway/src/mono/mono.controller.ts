import { Controller, Request } from '@nestjs/common';
import { Post } from "@nestjs/common"
import { MonoService } from './mono.service';

@Controller('mono')
export class MonoController {
    constructor(private monoService: MonoService) {}

    @Post('initiate')
    async initiate(@Request() req) {
        const user = req.user;
        const monoKey = user.monoApiKey;
        
        return this.monoService.initiateAccountLinking(user.id, monoKey)
    }
}
