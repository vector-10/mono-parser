import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import { MonoService } from './mono.service';

describe('MonoService', () => {
  let service: MonoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MonoService,
        { provide: ConfigService, useValue: { get: jest.fn() } },
        { provide: PinoLogger,    useValue: { setContext: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() } },
      ],
    }).compile();

    service = module.get<MonoService>(MonoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
