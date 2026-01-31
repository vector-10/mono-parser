import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { CreateApplicantDto } from './dto/create-applicant.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ApplicantsService {
  constructor(
    private prisma: PrismaService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(ApplicantsService.name);
  }

  async createApplicant(fintechId: string, data: CreateApplicantDto) {
    try {
      return await this.prisma.applicant.create({
        data: {
          ...data,
          fintechId,
        },
      });
    } catch (error) {
      this.logger.error({ err: error, fintechId }, "Failed to create applicant")
      throw error;
    }
  }

  async findAll(fintechId: string) {
    return this.prisma.applicant.findMany({
      where: {
        fintechId,
      },
      include: {
        bankAccounts: true,
      },
    });
  }

  async findOne(applicantId: string, fintechId: string) {
    return this.prisma.applicant.findFirst({
      where: {
        id: applicantId,
        fintechId,
      },
      include: {
        bankAccounts: true,
        applications: true,
      },
    });
  }
}
