import { Test, TestingModule } from '@nestjs/testing';
import { ApplicantsController } from './applicants.controller';
import { ApplicantsService } from './applicants.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

describe('ApplicantsController', () => {
  let controller: ApplicantsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ApplicantsController],
      providers: [
        { provide: ApplicantsService, useValue: {} },
      ],
    })
      .overrideGuard(JwtAuthGuard).useValue({ canActivate: () => true })
      .compile();

    controller = module.get<ApplicantsController>(ApplicantsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
