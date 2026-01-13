import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class MonoService {
  private readonly monoBaseUrl: string;

  constructor(private configService: ConfigService) {
    this.monoBaseUrl =
      this.configService.get<string>('MONO_BASE_URL') ||
      'https://api.withmono.com/v2';
  }

  async initiateAccountLinking(
    userId: string,
    userName: string,
    userEmail: string,
    monoApiKey: string,
    redirectUrl?: string,
  ) {
    try {
      const response = await axios.post(
        `${this.monoBaseUrl}/accounts/initiate`,
        {
          customer: { name: userName, email: userEmail },
          meta: { ref: `user_${userId}_${Date.now()}` },
          scope: 'auth',
          redirect_url:
            redirectUrl || `${this.configService.get('APP_URL')}/auth/callback`,
        },
        {
          headers: {
            'mono-sec-key': monoApiKey,
            'Content-Type': 'application/json',
          },
        },
      );
      return {
        widgetUrl: response.data.data.mono_url,
        customerId: response.data.data.customer,
        scope: response.data.data.scope,
        createdAt: response.data.data.created_at,
      };
    } catch (error) {
      console.error('Mono initiate failed:', error.response?.data || error);
      throw error;
    }
  }

  async getAccountAuth(code: string, monoApiKey: string) {
    try {
      const response = await axios.post(
        `${this.monoBaseUrl}/accounts/auth`,
        {
          code,
        },
        {
          headers: {
            'mono-sec-key': monoApiKey,
            'Content-Type': 'application/json',
          },
        },
      );

      return {
        accountId: response.data.data.id,
      };
    } catch (error) {
      console.error('Mono auth failed:', error.response?.data || error);
      throw error;
    }
  }

  async reauthorizeAccount(
    accountId: string,
    monoApiKey: string,
    redirectUrl?: string,
  ) {
    try {
      const response = await axios.post(
        `${this.monoBaseUrl}/accounts/initiate`,
        {
          meta: {
            ref: `reauth_${accountId}_${Date.now()}`,
          },
          scope: 'reauth',
          account: accountId,
          redirect_url:
            redirectUrl || `${this.configService.get('APP_URL')}/auth/callback`,
        },
        {
          headers: {
            'mono-sec-key': monoApiKey,
            'Content-Type': 'application/json',
          },
        },
      );

      return {
        widgetUrl: response.data.data.mono_url, 
        customerId: response.data.data.customer,
        scope: response.data.data.scope,
        createdAt: response.data.data.created_at,
      };
    } catch (error) {
      console.error('Mono reauthorize failed:', error.response?.data || error);
      throw error;
    }
  }
}
