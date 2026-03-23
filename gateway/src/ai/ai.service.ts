import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PinoLogger } from 'nestjs-pino';

type ChatMessage = { role: 'user' | 'assistant'; content: string };

@Injectable()
export class AIService {
  private genAI: GoogleGenerativeAI;

  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(AIService.name);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  async explainLoanDecision(analysisData: any): Promise<string> {
    const d = analysisData.decision || {};
    const breakdown = d.score_breakdown || {};
    const approval = d.approval_details || null;
    const counterOffer = d.counter_offer || null;
    const explainability = d.explainability || {};
    const riskFactors: any[] = d.risk_factors || [];
    const manualReasons: string[] = d.manual_review_reasons || [];

    const prompt = `You are a financial analyst explaining loan decisions to fintech credit officers.

Credit Analysis Result:
- Decision: ${d.decision || 'N/A'}
- Score: ${analysisData.score || 'N/A'} / 850 — Band: ${d.score_band || 'N/A'}

Score Breakdown:
- Credit History: ${breakdown.credit_history ?? 'N/A'}
- Income Stability: ${breakdown.income_stability ?? 'N/A'}
- Cash Flow Health: ${breakdown.cash_flow_health ?? 'N/A'}
- Debt Service Capacity: ${breakdown.debt_service_capacity ?? 'N/A'}
- Account Behaviour: ${breakdown.account_behavior ?? 'N/A'}

${
  approval
    ? `Approved Terms:
- Amount: ${approval.approved_amount} | Tenor: ${approval.approved_tenor} months
- Monthly Payment: ${approval.monthly_payment} | Rate: ${approval.interest_rate}%
- DTI Ratio: ${approval.dti_ratio}
${approval.conditions?.length ? `- Conditions: ${approval.conditions.join(', ')}` : ''}`
    : ''
}

${
  counterOffer
    ? `Counter Offer:
- Amount: ${counterOffer.offered_amount} | Tenor: ${counterOffer.offered_tenor} months
- Monthly Payment: ${counterOffer.monthly_payment}
- Reason: ${counterOffer.reason}`
    : ''
}

${manualReasons.length ? `Manual Review Triggers:\n${manualReasons.map((r: string) => `- ${r}`).join('\n')}` : ''}

Risk Factors:
${riskFactors.length ? riskFactors.map((r: any) => `- [${r.severity}] ${r.factor}: ${r.detail}`).join('\n') : 'None identified'}

Explainability:
- Primary Reason: ${explainability.primary_reason || 'N/A'}
- Strengths: ${explainability.key_strengths?.join('; ') || 'N/A'}
- Weaknesses: ${explainability.key_weaknesses?.join('; ') || 'N/A'}

Write a clear, professional explanation for a loan officer. Cover: what the decision means and why, the score breakdown, key strengths and weaknesses, affordability picture with specific numbers, any risk factors or manual review triggers, and the final outcome or counter-offer. Use specific numbers. No greeting, no markdown, no applicant IDs. Plain text with single line breaks between paragraphs.`;

    try {
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
      });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();

      text = text
        .replace(/\*\*/g, '')
        .replace(/#{1,6}\s/g, '')
        .trim();

      this.logger.info('AI explanation generated successfully');
      return text;
    } catch (error) {
      this.logger.error({ err: error }, 'AI API failed');
      throw new Error('Failed to generate explanation');
    }
  }

  async reviewChat(
    applicationData: any,
    message: string,
    history: ChatMessage[],
  ): Promise<string> {
    const systemInstruction = this.buildReviewSystemPrompt(applicationData);

    const model = this.genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction,
    });

    const geminiHistory = history.map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    const chat = model.startChat({ history: geminiHistory });

    try {
      const result = await chat.sendMessage(message);
      const text = result.response
        .text()
        .replace(/\*\*/g, '')
        .replace(/#{1,6}\s/g, '')
        .trim();
      this.logger.info('AI review chat response generated');
      return text;
    } catch (error) {
      this.logger.error({ err: error }, 'AI review chat failed');
      throw new Error('Failed to generate response');
    }
  }

  private buildReviewSystemPrompt(app: any): string {
    const d = app.decision || {};
    const approval = d.approval_details || null;
    const counterOffer = d.counter_offer || null;
    const explainability = d.explainability || {};
    const breakdown = d.score_breakdown || {};
    const riskFactors: any[] = d.risk_factors || [];
    const manualReasons: string[] = d.manual_review_reasons || [];
    const applicant = app.applicant || {};

    return `You are an AI credit review assistant helping a loan officer evaluate a loan application.

Applicant: ${applicant.firstName || ''} ${applicant.lastName || ''} | Email: ${applicant.email || 'N/A'}
Loan: ${app.amount} over ${app.tenor} months at ${app.interestRate}% | Purpose: ${app.purpose || 'N/A'}
Status: ${app.status} | Score: ${app.score ?? 'N/A'} (${d.score_band || 'N/A'})
Decision: ${d.decision || 'N/A'}

Score Breakdown:
- Credit History: ${breakdown.credit_history ?? 'N/A'}
- Income Stability: ${breakdown.income_stability ?? 'N/A'}
- Cash Flow Health: ${breakdown.cash_flow_health ?? 'N/A'}
- Debt Service Capacity: ${breakdown.debt_service_capacity ?? 'N/A'}
- Account Behaviour: ${breakdown.account_behavior ?? 'N/A'}

${approval ? `Approved Terms: ${approval.approved_amount} over ${approval.approved_tenor}mo — ₦${approval.monthly_payment}/mo — DTI ${approval.dti_ratio}` : ''}
${counterOffer ? `Counter Offer: ${counterOffer.offered_amount} over ${counterOffer.offered_tenor}mo — ₦${counterOffer.monthly_payment}/mo — ${counterOffer.reason}` : ''}

Strengths: ${explainability.key_strengths?.join('; ') || 'N/A'}
Weaknesses: ${explainability.key_weaknesses?.join('; ') || 'N/A'}
Primary Reason: ${explainability.primary_reason || 'N/A'}

Risk Factors: ${riskFactors.length ? riskFactors.map((r: any) => `[${r.severity}] ${r.factor}: ${r.detail}`).join(' | ') : 'None'}
Manual Review Triggers: ${manualReasons.length ? manualReasons.join('; ') : 'None'}

Your role:
- Answer questions about this specific application clearly and concisely
- Help the officer understand the score, risk factors, strengths, and weaknesses
- Suggest counter-offers, follow-up questions, or documents if relevant
- Help draft summaries for managers or stakeholders
- Never make the final approval or decline decision — that is the officer's responsibility

If asked about something not in the data above, say so clearly. Keep responses professional and concise. Do not use markdown formatting — no bold, no headers, no bullet asterisks. Plain text only.`;
  }
}
