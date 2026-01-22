import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class ApplicationsService {
  constructor(private prisma: PrismaService) {}

  async createApplication(
    fintechId: string,
    applicantId: string,
    amount: number,
    tenor: number,
  ) {
    // Verify applicant belongs to fintech
    const applicant = await this.prisma.applicant.findFirst({
      where: { id: applicantId, fintechId },
      include: { bankAccounts: true },
    });

    if (!applicant) {
      throw new NotFoundException('Applicant not found or unauthorized');
    }

    if (!applicant.bankAccounts.length) {
      throw new BadRequestException('Applicant has not linked a bank account');
    }

    // Create application with PROCESSING status
    const application = await this.prisma.application.create({
      data: {
        applicantId,
        amount,
        status: 'PROCESSING',
      },
      include: {
        applicant: {
          include: {
            bankAccounts: true,
          },
        },
      },
    });

    // Return immediately - processing happens in background
    return application;
  }

  async findOne(applicationId: string, fintechId: string) {
    const application = await this.prisma.application.findFirst({
      where: {
        id: applicationId,
        applicant: { fintechId },
      },
      include: {
        applicant: {
          include: {
            bankAccounts: true,
          },
        },
      },
    });

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    return application;
  }

  async findAll(fintechId: string, status?: string) {
    return this.prisma.application.findMany({
      where: {
        applicant: { fintechId },
        ...(status && { status }),
      },
      include: {
        applicant: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatus(
    applicationId: string,
    status: string,
    score?: number,
    decision?: any,
  ) {
    return this.prisma.application.update({
      where: { id: applicationId },
      data: {
        status,
        score,
        decision,
        updatedAt: new Date(),
      },
    });
  }
}