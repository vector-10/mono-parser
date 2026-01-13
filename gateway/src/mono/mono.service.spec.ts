import { Test, TestingModule } from '@nestjs/testing';
import { MonoService } from './mono.service';

describe('MonoService', () => {
  let service: MonoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MonoService],
    }).compile();

    service = module.get<MonoService>(MonoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
