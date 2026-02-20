import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { PrismaService } from 'src/prisma/prisma.service';


@Injectable()
export class DataAggregationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(DataAggregationService.name);
  }

  async gatherAccountData(monoAccountId: string) {
    this.logger.info({ monoAccountId }, 'Reading account data from DB');

    const stored = await this.prisma.bankAccount.findUnique({
      where: { monoAccountId },
      select: {
        accountDetailsData:    true,
        balanceData:           true,
        transactionsData:      true,
        identityData:          true,
        incomeData:            true,
        statementInsightsData: true,
      },
    });

    if (!stored) {
      this.logger.warn({ monoAccountId }, 'BankAccount not found in DB');
    }

    return {
      account_id:         monoAccountId,
      account_details:    stored?.accountDetailsData    ?? {},
      balance:            stored?.balanceData            ?? 0,
      transactions:       stored?.transactionsData       ?? [],
      identity:           stored?.identityData           ?? null,
      income:             stored?.incomeData             ?? null,
      statement_insights: stored?.statementInsightsData  ?? null,
    };
  }

  
  async gatherMultiAccountData(monoAccountIds: string[]) {
    this.logger.info(
      { count: monoAccountIds.length },
      'Starting multi-account data read from DB',
    );

    if (!monoAccountIds.length) {
      throw new Error('No account IDs provided');
    }

    const results = await Promise.all(
      monoAccountIds.map((id) => this.gatherAccountData(id)),
    );

    this.logger.info({ count: results.length }, 'Multi-account DB read complete');

    return results;
  }
}
