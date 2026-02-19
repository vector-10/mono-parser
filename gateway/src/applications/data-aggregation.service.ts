import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { PrismaService } from 'src/prisma/prisma.service';
import { MonoService } from 'src/mono/mono.service';

// ─── What this service does ────────────────────────────────────────────────────
//
// Builds the per-account data bundle that the brain service expects.
//
// Enrichments (income, statement insights) are STORED on BankAccount when they
// arrive asynchronously after account linking. At analysis time we simply READ
// them from the database — no live Mono calls for those two.
//
// We do still call Mono live for three things that change frequently and are
// cheap to fetch:
//   - transactions  (always latest)
//   - balance       (always latest)
//   - identity      (cached by Mono; cheap)
//
// Credit history (BVN-level) is fetched separately in ApplicationProcessorService
// because it belongs to the applicant, not to any individual bank account.

@Injectable()
export class DataAggregationService {
  constructor(
    private readonly monoService: MonoService,
    private readonly prisma: PrismaService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(DataAggregationService.name);
  }

  // Gather data for a single Mono account.
  // monoAccountId is Mono's account _id (stored as BankAccount.monoAccountId).
  async gatherAccountData(monoAccountId: string, monoApiKey: string) {
    this.logger.info({ monoAccountId }, 'Gathering account data');

    // ── Read stored enrichments from DB ─────────────────────────────────────
    // These were saved when Mono sent the income webhook and when the
    // statement insights polling job completed. If they are null it means
    // enrichment has not finished yet — the processor should have checked
    // enrichmentStatus before calling us.
    const stored = await this.prisma.bankAccount.findUnique({
      where: { monoAccountId },
      select: { incomeData: true, statementInsightsData: true },
    });

    // ── Call Mono live for frequently-changing data ──────────────────────────
    const [accountDetails, balance, transactions, identity] = await Promise.allSettled([
      this.monoService.getAccountDetails(monoAccountId, monoApiKey),
      this.monoService.getAccountBalance(monoAccountId, monoApiKey),
      this.monoService.getTransactions(monoAccountId, monoApiKey),
      this.monoService.getIdentity(monoAccountId, monoApiKey),
    ]);

    // Log any live-fetch failures — they are non-fatal; the brain handles nulls
    (
      [
        ['accountDetails', accountDetails],
        ['balance', balance],
        ['transactions', transactions],
        ['identity', identity],
      ] as [string, PromiseSettledResult<any>][]
    ).forEach(([name, result]) => {
      if (result.status === 'rejected') {
        this.logger.warn(
          { err: result.reason, monoAccountId, endpoint: name },
          `Live fetch failed for ${name}`,
        );
      }
    });

    return {
      account_id:         monoAccountId,
      account_details:    accountDetails.status === 'fulfilled' ? accountDetails.value : {},
      balance:            balance.status      === 'fulfilled'   ? balance.value        : 0,
      transactions:       transactions.status === 'fulfilled'   ? transactions.value   : [],
      identity:           identity.status     === 'fulfilled'   ? identity.value       : null,
      // Stored enrichments — null if enrichment is incomplete
      income:             stored?.incomeData            ?? null,
      statement_insights: stored?.statementInsightsData ?? null,
    };
  }

  // Gather data for every Mono account linked to an applicant.
  // monoAccountIds is an array of Mono account _ids (BankAccount.monoAccountId values).
  async gatherMultiAccountData(monoAccountIds: string[], monoApiKey: string) {
    this.logger.info(
      { count: monoAccountIds.length },
      'Starting multi-account data aggregation',
    );

    if (!monoAccountIds.length) {
      throw new Error('No account IDs provided');
    }

    const results = await Promise.all(
      monoAccountIds.map((id) => this.gatherAccountData(id, monoApiKey)),
    );

    this.logger.info({ count: results.length }, 'Multi-account aggregation complete');

    return results;
  }
}
