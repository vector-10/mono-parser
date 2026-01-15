import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ApplicantsService {
  private readonly logger = new Logger(ApplicantsService.name);

  constructor(private prisma: PrismaService) {}

  async createApplicant(fintechId: string, data: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    bvn?: string;
  }) {
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