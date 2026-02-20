import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { PrismaService } from 'src/prisma/prisma.service';

// ─── What this service does ────────────────────────────────────────────────────
//
// Builds the per-account data bundle that the brain service expects.
//
// ALL data is read from the database — nothing is fetched live from Mono here.
//
// How each field gets into the DB:
//   accountDetails, balance, transactions, identity
//       → fetched synchronously in _triggerEnrichments immediately after account link
//   income
//       → stored when mono.events.account_income webhook arrives
//   statementInsights
//       → stored when the BullMQ enrichment poller job completes
//   creditWorthiness
//       → stored when mono.events.account_credit_worthiness webhook arrives
//
// By the time the fintech calls /analyze, all of this should already be in the DB.
// The enrichmentStatus === 'READY' gate in ApplicationProcessorService ensures we
// never score on incomplete data.

@Injectable()
export class DataAggregationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(DataAggregationService.name);
  }

  // Gather all stored data for a single Mono account.
  // monoAccountId is Mono's account _id (stored as BankAccount.monoAccountId).
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
        creditWorthinessData:  true,
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
      credit_worthiness:  stored?.creditWorthinessData   ?? null,
    };
  }

  // Gather stored data for every Mono account linked to an applicant.
  // monoAccountIds is an array of Mono account _ids (BankAccount.monoAccountId values).
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
