import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { otpEmailTemplate } from './templates/otp.templates';
import axios from 'axios';

@Injectable()
export class EmailService {
  private senderEmail: string;
  private apiKey: string;
  private senderName: string;

  constructor(private configService: ConfigService) {
    this.apiKey = this.configService.get<string>('BREVO_API_KEY')!;
    this.senderEmail = this.configService.get<string>('BREVO_SENDER_EMAIL')!;
    this.senderName = this.configService.get<string>('BREVO_SENDER_NAME')!;


  }

  private async sendEmail(
    to: string,
    subject: string,
    htmlContent: string,
    recipientName?: string,
  ) {
    try {
      await axios.post(
        'https://api.brevo.com/v3/smtp/email',
        {
          sender: { email: this.senderEmail, name: this.senderName },
          to: [{ email: to, name: recipientName }],
          subject,
          htmlContent,
        },
        {
          headers: {
            'api-key': this.apiKey,
            'Content-Type': 'application/json',
          },
        },
      );
      return { success: true };
    } catch (error) {
      console.error('Email sending failed:', error.response?.data || error);
      throw error;
    }
  }

  async sendOTP(email: string, otp: string, name?: string) {
    const htmlContent = otpEmailTemplate(name || 'there', otp);

    return this.sendEmail(
      email,
      'Your Mono Parser Verification Code',
      htmlContent,
      name,
    );
  }
}