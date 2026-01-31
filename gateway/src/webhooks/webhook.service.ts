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
      const bankAccount = await this.prisma.bankAccount.upsert({
        where: { monoAccountId },
        update: {
          updatedAt: new Date(),
          accountName: accountData?.name,
          accountNumber: accountData?.accountNumber,
          balance: accountData?.balance,
          institution: accountData?.institution?.name,
        },
        create: {
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
        ` Successfully linked Bank to Applicant `,
      );
      this.eventsGateway.emitToUser(bankAccount.applicant.fintechId, 'account_linked', {
        applicantId,
        accountId: bankAccount.id,
        institution: bankAccount.institution,
        accountNumber: bankAccount.accountNumber,
      });
      return { status: 'success', accountId: bankAccount.id };
    } catch (error) {
      this.logger.error(
        { err: error, monoAccountId, applicantId },
        `Failed to upsert bank account: ${error.message}`,
      );
      return { status: 'error', reason: 'database_failure' };
    }
  }

  async handleAccountReauthorised(data: any) {
    const { account: monoAccountId } = data;
    await this.prisma.bankAccount.update({
      where: { monoAccountId },
      data: { updatedAt: new Date() },
    });
    this.logger.info({ monoAccountId }, `Bank Account reauthorised`);
    return { status: 'success' };
  }
}