import { Test, TestingModule } from '@nestjs/testing';
import { MonoController } from './mono.controller';

describe('MonoController', () => {
  let controller: MonoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [MonoController],
    }).compile();

    controller = module.get<MonoController>(MonoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
