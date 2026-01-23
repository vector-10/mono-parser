import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { MonoService } from 'src/mono/mono.service';

@Injectable()
export class DataAggregationService {
  constructor(
    private monoService: MonoService,
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

  private async fetchSafely<T>(
    fetchFn: () => Promise<T>,
    name: string,
  ): Promise<T> {
    try {
      return await fetchFn();
    } catch (error) {
      this.logger.error({err: error, name}, `Error fetching`);
      throw error;
    }
  }
}
