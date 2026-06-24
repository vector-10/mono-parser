import { Test, TestingModule } from '@nestjs/testing';
import { MonoController } from './mono.controller';
import { MonoService } from './mono.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { MonoApiKeyGuard } from 'src/auth/guards/mono-api-key.guard';

describe('MonoController', () => {
  let controller: MonoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MonoController],
      providers: [
        { provide: MonoService,   useValue: {} },
        { provide: PrismaService, useValue: {} },
      ],
    })
      .overrideGuard(JwtAuthGuard).useValue({ canActivate: () => true })
      .overrideGuard(MonoApiKeyGuard).useValue({ canActivate: () => true })
      .compile();

    controller = module.get<MonoController>(MonoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
