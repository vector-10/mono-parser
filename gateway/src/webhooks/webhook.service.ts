import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PinoLogger } from 'nestjs-pino';
import { EventsGateway } from 'src/events/events.gateway';

@Injectable()
export class MonoWebhookService {
  constructor(
    private prisma: PrismaService,
    private readonly logger: PinoLogger,
     private readonly eventsGateway: EventsGateway,
  ) {
    this.logger.setContext(MonoWebhookService.name);
  }

  async handleAccountLinked(data: any) {
    this.logger.info({ payload: data }, 'Full payload received');

    const accountData = data.account;
    const monoAccountId = accountData?._id ;
    const applicantId = data.meta?.user_id;

     if (!monoAccountId) {
      this.logger.error({ payload: data }, `Missing account ID in webhook`);
      return { status: 'error', reason: 'missing_account_id' };
    }

     if (!applicantId) {
      this.logger.info(
        { monoAccountId },
        'Account connected, waiting for full data',
      );
      return {
        status: 'acknowledged',
        message: 'Waiting for account_updated event',
      };
    }

    this.logger.info({ monoAccountId, applicantId }, 'Parsed webhook data');   

    try {

      const existingAccount = await this.prisma.bankAccount.findUnique({
        where: { monoAccountId },
      })

      if(existingAccount) {
        const updated = await this.prisma.bankAccount.update({
          where: { monoAccountId },
          data: {
            updatedAt: new Date(),
            accountName: accountData?.name,
            accountNumber: accountData?.accountNumber,
            balance: accountData?.balance,
            institution: accountData?.institution?.name,
          },
          include: { applicant: true }
        });
        this.logger.info(
          { monoAccountId, applicantId },
          ` Successfully updated Applicant Data with new bank Account `,
        );
        this.eventsGateway.emitToUser(updated.applicant.fintechId, 'account_already_linked', {
          applicantId,
          accountId: updated.id,
          institution: updated.institution,
          accountNumber: updated.accountNumber,
        });
        return { status: 'success', accountId: updated.id, linked:false };
      }

       const bankAccount = await this.prisma.bankAccount.create({
        data: {
          monoAccountId,
          applicantId,
          accountName: accountData?.name,
          accountNumber: accountData?.accountNumber,
          balance: accountData?.balance,
          institution: accountData?.institution?.name,
        },
        include: { applicant: true },
      });

      this.logger.info(
        { monoAccountId, applicantId },
        'New bank account linked successfully',
      );

     this.eventsGateway.emitToUser(
        bankAccount.applicant.fintechId,
        'account_linked',
        {
          applicantId,
          accountId: bankAccount.id,
          institution: bankAccount.institution,
          accountNumber: bankAccount.accountNumber,
        },
      );return { status: 'success', accountId: bankAccount.id, linked: true };
    } catch (error) {
      this.logger.error(
        { err: error, monoAccountId, applicantId },
        `Failed to link bank account: ${error.message}`,
      );
      return { status: 'error', reason: 'database_failure' };
    }
  }

  async handleAccountReauthorised(data: any) {
    const monoAccountId = data.account?._id;  
    await this.prisma.bankAccount.update({
      where: { monoAccountId },
      data: { updatedAt: new Date() },
    });
    this.logger.info({ monoAccountId }, `Bank Account reauthorised`);
    return { status: 'success' };
  }
}