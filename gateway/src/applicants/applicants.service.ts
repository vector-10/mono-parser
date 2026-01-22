import { Injectable, Logger } from '@nestjs/common';
import { CreateApplicantDto } from './dto/create-applicant.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ApplicantsService {
  private readonly logger = new Logger(ApplicantsService.name);

  constructor(private prisma: PrismaService) {}

  async createApplicant(fintechId: string, data: CreateApplicantDto) {
    try {
      return await this.prisma.applicant.create({
        data: {
          ...data,
          fintechId, 
        },
      });
    } catch (error) {
      this.logger.error('Failed to create applicant', error);
      throw error;
    }
  }

  async findAll(fintechId: string) {
    return this.prisma.applicant.findMany({
      where: {
        applicant: {fintechId}
      }, 
      include: {
        applicant: true
      }
    })
  }

  async findOne(applicantId: string, fintechId: string) {
    return this.prisma.applicant.findFirst({
      where: {
        id: applicantId,
        fintechId, 
      },
      include: {
        bankAccounts: true, 
      }
    });
  }
}