import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { PrismaService } from 'src/prisma/prisma.service';
import { MonoService } from 'src/mono/mono.service';

@Injectable()
export class DataAggregationService {
  constructor(
    private monoService: MonoService,
    private prisma: PrismaService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(DataAggregationService.name);
  }

  async gatherApplicantData(
    accountId: string,
    monoApiKey: string,
    bvn?: string,
  ) {
    this.logger.info({ accountId }, 'Starting data aggregation for account');

    const results: any = {
      accountId,
      success: true,
      errors: [],
    };

    const dataPromises = {
      accountDetails: this.fetchSafely(
        () => this.monoService.getAccountDetails(accountId, monoApiKey),
        'accountDetails',
      ),
      balance: this.fetchSafely(
        () => this.monoService.getAccountBalance(accountId, monoApiKey),
        'balance',
      ),
      transactions: this.fetchSafely(
        () => this.monoService.getTransactions(accountId, monoApiKey),
        'transactions',
      ),
      income: this.fetchSafely(
        () => this.monoService.getIncome(accountId, monoApiKey),
        'income',
      ),
      incomeRecords: this.fetchSafely(
        () => this.monoService.getIncomeRecords(accountId, monoApiKey),
        'incomeRecords',
      ),
      credits: this.fetchSafely(
        () => this.monoService.getCredits(accountId, monoApiKey),
        'credits',
      ),
      debits: this.fetchSafely(
        () => this.monoService.getDebits(accountId, monoApiKey),
        'debits',
      ),
      identity: this.fetchSafely(
        () => this.monoService.getIdentity(accountId, monoApiKey),
        'identity',
      ),
      insights: this.fetchSafely(
        () => this.monoService.getStatementInsights(accountId, monoApiKey),
        'insights',
      ),
      assets: this.fetchSafely(
        () => this.monoService.getAssets(accountId, monoApiKey),
        'assets',
      ),
      earnings: this.fetchSafely(
        () => this.monoService.getEarnings(accountId, monoApiKey),
        'earnings',
      ),
    };

    if (bvn) {
      dataPromises['creditHistory'] = this.fetchSafely(
        () => this.monoService.getCreditHistory(bvn, monoApiKey),
        'creditHistory',
      );
    }

    const settled = await Promise.allSettled(Object.values(dataPromises));

    const keys = Object.keys(dataPromises);
    settled.forEach((result, index) => {
      const key = keys[index];
      if (result.status === 'fulfilled') {
        results[key] = result.value;
      } else {
        results.errors.push({
          endpoint: key,
          error: result.reason?.message || 'Unknown error',
        });
        this.logger.error(
          { err: result.reason, endpoint: key },
          `Failed to fetch ${key}`,
        );
      }
    });

    if (results.errors.length > 0) {
      results.success = false;
      this.logger.warn(
        {
          errorCount: results.errors.length,
          errors: results.errors,
          accountId,
        },
        'Data aggregation completed with errors',
      );
    } else {
      this.logger.info(
        { accountId },
        'Data aggregation completed successfully',
      );
    }

    return results;
  }

  async gatherMultiAccountData(
    accountIds: string[],
    monoApiKey: string,
    bvn?: string,
  ) {
    this.logger.info(
      { accountIds, count: accountIds.length },
      'Starting multi-account data aggregation',
    );

    if (!accountIds.length) {
      throw new Error('No account IDs provided');
    }

    const accountsDataPromises = accountIds.map((accountId) =>
      this.gatherApplicantData(accountId, monoApiKey, bvn),
    );

    const accountsData = await Promise.all(accountsDataPromises);

    const accountsWithErrors = accountsData.filter((data) => !data.success);
    if (accountsWithErrors.length > 0) {
      this.logger.warn(
        {
          totalAccounts: accountIds.length,
          accountsWithErrors: accountsWithErrors.length,
        },
        'Some accounts had errors during data aggregation',
      );
    }

    const formattedAccounts = accountsData.map((data, index) => ({
      account_id: accountIds[index],
      account_details: data.accountDetails || {},
      balance: data.balance || 0,
      transactions: data.transactions || [],
      income_records: data.incomeRecords || {},
      credits: data.credits || {},
      debits: data.debits || {},
      identity: data.identity || null,
    }));

    this.logger.info(
      {
        totalAccounts: accountIds.length,
        successfulAccounts: accountsData.filter((d) => d.success).length,
      },
      'Multi-account data aggregation completed',
    );

    return {
      accounts: formattedAccounts,
      totalAccounts: accountIds.length,
      successfulAccounts: accountsData.filter((d) => d.success).length,
    };
  }

  async testMultiAccountAggregation(applicantId: string, fintechId: string) {
    this.logger.info(
      { applicantId, fintechId },
      'Testing multi-account aggregation',
    );

    const applicant = await this.prisma.applicant.findFirst({
      where: { id: applicantId, fintechId },
      include: {
        bankAccounts: true,
        fintech: true,
      },
    });

    if (!applicant) {
      throw new Error('Applicant not found or unauthorized');
    }

    if (!applicant.bankAccounts.length) {
      throw new Error('Applicant has no linked bank accounts');
    }

    const accountIds = applicant.bankAccounts.map((acc) => acc.monoAccountId);
    const monoApiKey = applicant.fintech.monoApiKey;

    if (!monoApiKey) {
      throw new Error('Fintech has no Mono API key configured');
    }

    this.logger.info(
      { applicantId, accountCount: accountIds.length },
      'Gathering data for test',
    );

    return this.gatherMultiAccountData(
      accountIds,
      monoApiKey,
      applicant.bvn || undefined,
    );
  }

  private async fetchSafely<T>(
    fetchFn: () => Promise<T>,
    name: string,
  ): Promise<T> {
    try {
      return await fetchFn();
    } catch (error) {
      this.logger.error({ err: error, name }, `Error fetching`);
      throw error;
    }
  }
}
