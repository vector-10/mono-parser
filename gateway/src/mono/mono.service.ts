import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PinoLogger } from 'nestjs-pino';
import axios from 'axios';

@Injectable()
export class MonoService {
  private readonly monoBaseUrl: string;

  constructor(
    private configService: ConfigService,
    private readonly logger: PinoLogger,
  ) {
    this.logger.setContext(MonoService.name);
    this.monoBaseUrl =
      this.configService.get<string>('MONO_BASE_URL') ||
      'https://api.withmono.com/v2';
  }

  private getHeaders(apiKey: string) {
    return {
      'mono-sec-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
  }

  async initiateAccountLinking(
    applicantId: string,
    applicantName: string,
    applicantEmail: string,
    monoApiKey: string,
    redirectUrl?: string,
    applicationId?: string,
  ) {
    try {
      const response = await axios.post(
        `${this.monoBaseUrl}/accounts/initiate`,
        {
          customer: { name: applicantName, email: applicantEmail },
          meta: {
            user_id: applicantId,
            ref: applicationId ?? `applicant_${applicantId}_${Date.now()}`,
            ...(applicationId && { application_id: applicationId }),
          },
          scope: 'auth',
          redirect_url:
            redirectUrl ||
            `${this.configService.get('APP_URL') || process.env.APP_URL}/api/mono/auth/callback`,
        },
        { headers: this.getHeaders(monoApiKey) },
      );
      return {
        widgetUrl: response.data.data.mono_url,
      };
    } catch (error: any) {
      this.logger.error({ err: error.response?.data }, 'Mono initiate failed');
      throw error;
    }
  }

  async getAccountAuth(code: string, monoApiKey: string) {
    try {
      const response = await axios.post(
        `${this.monoBaseUrl}/accounts/auth`,
        { code },
        { headers: this.getHeaders(monoApiKey) },
      );
      return { accountId: response.data.data.id };
    } catch (error: any) {
      this.logger.error({ err: error.response?.data }, 'Mono auth failed');
      throw error;
    }
  }

  async exchangeToken(code: string, apiKey: string) {
    const url = 'https://api.withmono.com/account/auth';

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'mono-sec-key': apiKey,
      },
      body: JSON.stringify({ code }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Mono exchange token failed: ${error}`);
    }

    return response.json();
  }

  async getAccountDetails(accountId: string, monoApiKey: string) {
    try {
      const response = await axios.get(
        `${this.monoBaseUrl}/accounts/${accountId}`,
        {
          headers: { 'mono-sec-key': monoApiKey },
        },
      );
      return response.data.data;
    } catch (error: any) {
      this.logger.error(
        { err: error.response?.data },
        'Failed to fetch account details',
      );
      throw error;
    }
  }

  async getAccountBalance(accountId: string, monoApiKey: string) {
    try {
      const response = await axios.get(
        `${this.monoBaseUrl}/accounts/${accountId}/balance`,
        {
          headers: { 'mono-sec-key': monoApiKey },
        },
      );
      return response.data.data.balance;
    } catch (error: any) {
      this.logger.error(
        { err: error.response?.data },
        'Failed to fetch balance',
      );
      throw error;
    }
  }

  async getTransactions(accountId: string, monoApiKey: string) {
    try {
      const response = await axios.get(
        `${this.monoBaseUrl}/accounts/${accountId}/transactions`,
        {
          headers: { 'mono-sec-key': monoApiKey },
        },
      );
      return response.data.data;
    } catch (error: any) {
      this.logger.error(
        { err: error.response?.data },
        'Failed to fetch transactions',
      );
      throw error;
    }
  }

  async getIncome(accountId: string, monoApiKey: string) {
    try {
      const response = await axios.get(
        `${this.monoBaseUrl}/accounts/${accountId}/income`,
        {
          headers: this.getHeaders(monoApiKey),
        },
      );
      return response.data;
    } catch (error: any) {
      this.logger.error(
        { err: error.response?.data },
        'Income initiation failed',
      );
      throw error;
    }
  }

  async triggerStatementInsightsJob(
    accountId: string,
    monoApiKey: string,
  ): Promise<string> {
    try {
      const response = await axios.post(
        `${this.monoBaseUrl}/accounts/${accountId}/statement/insights`,
        {},
        { headers: this.getHeaders(monoApiKey) },
      );
    
      const jobId: string = response.data?.data?.id ?? response.data?.data?.jobId;
      if (!jobId) {
        throw new Error('Mono did not return a jobId for statement insights');
      }
      return jobId;
    } catch (error: any) {
      this.logger.error(
        { err: error.response?.data },
        'Failed to trigger statement insights job',
      );
      throw error;
    }
  }


  async pollEnrichmentRecord(jobId: string, monoApiKey: string) {
    try {
      const response = await axios.get(
        `https://api.withmono.com/v2/enrichments/record/${jobId}`,
        { headers: this.getHeaders(monoApiKey) },
      );
      return response.data?.data ?? response.data;
    } catch (error: any) {
      this.logger.error(
        { err: error.response?.data, jobId },
        'Failed to poll enrichment record',
      );
      throw error;
    }
  }

  async getCreditWorthiness(
    accountId: string,
    monoApiKey: string,
    loanData: any,
  ) {
    try {
      const response = await axios.post(
        `${this.monoBaseUrl}/accounts/${accountId}/creditworthiness`,
        { ...loanData, run_credit_check: true },
        { headers: this.getHeaders(monoApiKey) },
      );
      return response.data;
    } catch (error: any) {
      this.logger.error(
        { err: error.response?.data },
        'Creditworthiness failed',
      );
      throw error;
    }
  }

  async getIdentity(accountId: string, monoApiKey: string) {
    try {
      const response = await axios.get(
        `${this.monoBaseUrl}/accounts/${accountId}/identity`,
        {
          headers: { 'mono-sec-key': monoApiKey },
        },
      );
      return response.data.data;
    } catch (error: any) {
      this.logger.error({ err: error.response?.data }, 'Identity fetch failed');
      throw error;
    }
  }

  async getCreditHistory(
    bvn: string,
    monoApiKey: string,
    provider: string = 'all',
  ) {
    try {
      const response = await axios.post(
        `https://api.withmono.com/v3/lookup/credit-history/${provider}`,
        { bvn },
        { headers: this.getHeaders(monoApiKey) },
      );
      return response.data.data;
    } catch (error: any) {
      this.logger.error(
        { err: error.response?.data },
        'Credit history lookup failed',
      );
      throw error;
    }
  }

  async getAllAccounts(monoApiKey: string, page: number = 1) {
    try {
      const response = await axios.get(`${this.monoBaseUrl}/accounts`, {
        headers: this.getHeaders(monoApiKey),
        params: { page },
      });
      return response.data;
    } catch (error: any) {
      this.logger.error(
        { err: error.response?.data },
        'Accounts list fetch failed',
      );
      throw error;
    }
  }

  async unlinkAccount(accountId: string, monoApiKey: string) {
    try {
      await axios.post(
        `${this.monoBaseUrl}/accounts/${accountId}/unlink`,
        {},
        { headers: this.getHeaders(monoApiKey) },
      );
    } catch (error: any) {
      this.logger.error({ err: error.response?.data }, 'Unlink failed');
      throw error;
    }
  }
}
