import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class MonoService {
  private readonly logger = new Logger(MonoService.name);
  private readonly monoBaseUrl: string;

  constructor(private configService: ConfigService) {
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
  ) {
    try {
      const response = await axios.post(
        `${this.monoBaseUrl}/accounts/initiate`,
        {
         customer: { name: applicantName, email: applicantEmail },
         meta: { 
          user_id: applicantId, // CRITICAL: This allows our Webhook to find the right person
          ref: `applicant_${applicantId}_${Date.now()}` 
        },
          scope: 'auth',
          redirect_url:
            redirectUrl || `${this.configService.get('APP_URL')}/auth/callback`,
        },
        { headers: this.getHeaders(monoApiKey) },
      );
      return {
        widgetUrl: response.data.data.mono_url,
      };
    } catch (error: any) {
      this.logger.error('Mono initiate failed', error.response?.data || error);
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
      this.logger.error('Mono auth failed', error.response?.data || error);
      throw error;
    }
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
        'Failed to fetch account details',
        error.response?.data || error,
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
        'Failed to fetch balance',
        error.response?.data || error,
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
        'Failed to fetch transactions',
        error.response?.data || error,
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
        'Income initiation failed',
        error.response?.data || error,
      );
      throw error;
    }
  }

  async getStatementInsights(accountId: string, monoApiKey: string) {
    try {
      const response = await axios.get(
        `${this.monoBaseUrl}/accounts/${accountId}/statement/insights`,
        {
          headers: this.getHeaders(monoApiKey),
        },
      );
      return response.data;
    } catch (error: any) {
      this.logger.error(
        'Insights initiation failed',
        error.response?.data || error,
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
        'Creditworthiness failed',
        error.response?.data || error,
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
      this.logger.error('Identity fetch failed', error.response?.data || error);
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
        'Credit history lookup failed',
        error.response?.data || error,
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
      this.logger.error('Unlink failed', error.response?.data || error);
      throw error;
    }
  }
}
