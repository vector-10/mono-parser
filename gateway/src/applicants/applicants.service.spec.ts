import { Test, TestingModule } from '@nestjs/testing';
import { PinoLogger } from 'nestjs-pino';
import { ApplicantsService } from './applicants.service';
import { PrismaService } from 'src/prisma/prisma.service';

describe('ApplicantsService', () => {
  let service: ApplicantsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ApplicantsService,
        { provide: PrismaService, useValue: { applicant: { findMany: jest.fn(), findUnique: jest.fn() } } },
        { provide: PinoLogger,    useValue: { setContext: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() } },
      ],
    }).compile();

    service = module.get<ApplicantsService>(ApplicantsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
