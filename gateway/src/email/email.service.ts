import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { otpEmailTemplate } from './templates/otp.templates';
import * as brevo from '@getbrevo/brevo';

@Injectable()
export class EmailService {
  private apiInstance: brevo.TransactionalEmailsApi;
  private senderEmail: string;
  private senderName: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('BREVO_API_KEY')!;
    this.senderEmail = this.configService.get<string>('BREVO_SENDER_EMAIL')!;
    this.senderName = this.configService.get<string>('BREVO_SENDER_NAME')!;

    this.apiInstance = new brevo.TransactionalEmailsApi();
    this.apiInstance.setApiKey(
      brevo.TransactionalEmailsApiApiKeys.apiKey,
      apiKey,
    );
  }

  private async sendEmail(
    to: string,
    subject: string,
    htmlContent: string,
    recipientName?: string,
  ) {
    const sendSmtpEmail = new brevo.SendSmtpEmail();

    sendSmtpEmail.subject = subject;
    sendSmtpEmail.to = [{ email: to, name: recipientName }];
    sendSmtpEmail.sender = { email: this.senderEmail, name: this.senderName };
    sendSmtpEmail.htmlContent = htmlContent;

    try {
      await this.apiInstance.sendTransacEmail(sendSmtpEmail);
      return { success: true };
    } catch (error) {
      console.error('Email sending failed:', error);
      console.log(error)
      throw error;
    }
  }

  async sendOTP(email: string, otp: string, name?: string) {
    const htmlContent = otpEmailTemplate(name || 'there', otp);

    return this.sendEmail(
      email,
      'Your Krediloop Verification Code',
      htmlContent,
      name,
    );
  }
}