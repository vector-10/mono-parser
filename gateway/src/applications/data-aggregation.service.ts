import { Injectable, Logger } from '@nestjs/common';
import { MonoService } from 'src/mono/mono.service';

@Injectable()
export class DataAggregationService {
  private readonly logger = new Logger(DataAggregationService.name);

  constructor(private monoService: MonoService) {}

  async gatherApplicantData(accountId: string, monoApiKey: string, bvn?: string) {
    this.logger.log(`Starting data aggregation for account ${accountId}`);

    const results: any = {
      accountId,
      success: true,
      errors: [],
    };


    const dataPromises = {
      accountDetails: this.fetchSafely(
        () => this.monoService.getAccountDetails(accountId, monoApiKey),
        'accountDetails'
      ),
      balance: this.fetchSafely(
        () => this.monoService.getAccountBalance(accountId, monoApiKey),
        'balance'
      ),
      transactions: this.fetchSafely(
        () => this.monoService.getTransactions(accountId, monoApiKey),
        'transactions'
      ),
      income: this.fetchSafely(
        () => this.monoService.getIncome(accountId, monoApiKey),
        'income'
      ),
      incomeRecords: this.fetchSafely(
        () => this.monoService.getIncomeRecords(accountId, monoApiKey),
        'incomeRecords'
      ),
      credits: this.fetchSafely(
        () => this.monoService.getCredits(accountId, monoApiKey),
        'credits'
      ),
      debits: this.fetchSafely(
        () => this.monoService.getDebits(accountId, monoApiKey),
        'debits'
      ),
      identity: this.fetchSafely(
        () => this.monoService.getIdentity(accountId, monoApiKey),
        'identity'
      ),
      insights: this.fetchSafely(
        () => this.monoService.getStatementInsights(accountId, monoApiKey),
        'insights'
      ),
      assets: this.fetchSafely(
        () => this.monoService.getAssets(accountId, monoApiKey),
        'assets'
      ),
      earnings: this.fetchSafely(
        () => this.monoService.getEarnings(accountId, monoApiKey),
        'earnings'
      ),
    };


    if (bvn) {
      dataPromises['creditHistory'] = this.fetchSafely(
        () => this.monoService.getCreditHistory(bvn, monoApiKey),
        'creditHistory'
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
        this.logger.error(`Failed to fetch ${key}:`, result.reason);
      }
    });

    if (results.errors.length > 0) {
      results.success = false;
      this.logger.warn(
        `Data aggregation completed with ${results.errors.length} errors`
      );
    } else {
      this.logger.log(`Data aggregation completed successfully`);
    }

    return results;
  }

  private async fetchSafely<T>(
    fetchFn: () => Promise<T>,
    name: string
  ): Promise<T> {
    try {
      return await fetchFn();
    } catch (error) {
      this.logger.error(`Error fetching ${name}:`, error);
      throw error; 
    }
  }
}