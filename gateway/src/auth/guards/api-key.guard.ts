import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash } from 'crypto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req    = context.switchToHttp().getRequest();
    const apiKey = req.headers['x-api-key'];

    if (!apiKey) {
      throw new UnauthorizedException('Missing x-api-key header');
    }

    const hash = createHash('sha256').update(apiKey).digest('hex');

    const user = await this.prisma.user.findUnique({
      where: { apiKey: hash },
      select: { id: true, monoApiKey: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid API key');
    }

    if (!user.monoApiKey) {
      throw new UnauthorizedException('Mono API key not configured for this account');
    }

    req.user       = { id: user.id };
    req.monoApiKey = user.monoApiKey;
    return true;
  }
}
