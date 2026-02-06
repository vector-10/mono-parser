import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private lastGeminiCall: number = 0;
  private readonly GEMINI_REQUEST_DELAY = 10000;

  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(GeminiService.name);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  }

  async explainLoanDecision(analysisData: any): Promise<string> {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastGeminiCall;
    if (timeSinceLastCall < this.GEMINI_REQUEST_DELAY) {
      const waitTime = this.GEMINI_REQUEST_DELAY - timeSinceLastCall;
      this.logger.info({ waitTime }, 'Rate limiting Gemini request');
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    this.lastGeminiCall = Date.now();

    const decision = analysisData.decision || {};

    const prompt = `You are a financial analyst explaining loan decisions to fintech credit officers.

Given this credit analysis result:
- Credit Score: ${analysisData.score || 'N/A'}
- Decision: ${decision.decision || decision.status || 'N/A'}
- Status: ${decision.status || 'N/A'}
- Recommended Tenor: ${decision.recommended_tenor || 'N/A'} months
- Maximum Tenor: ${decision.max_tenor || 'N/A'} months

Reasons for Decision:
${decision.reasons ? decision.reasons.map((r: string) => `- ${r}`).join('\n') : 'No reasons provided'}

Additional Details:
${JSON.stringify(decision, null, 2)}

Write a professional credit decision explanation with the following structure:

PARAGRAPH 1: State the decision (APPROVED/DENIED) and credit score (X out of 1000). Explain what this score indicates about creditworthiness.

PARAGRAPH 2: Explain the PRIMARY strength - affordability. Include specific numbers: proposed monthly payment, affordability cap percentage, and how it compares.

PARAGRAPH 3: Detail the income analysis. Include safe monthly income, maximum repayment capacity, and how the requested payment compares as a fraction of capacity.

PARAGRAPH 4: Discuss tenor fit. Explain the requested tenor and how it aligns with system-provided eligible options (range from X to Y months).

PARAGRAPH 5: Highlight strong underlying metrics with specific scores (Debt Service Capacity, Income Stability, Spending Behavior) and what they indicate about repayment reliability.

PARAGRAPH 6: State the final approved amount and tenor based on all factors analyzed.

PARAGRAPH 7: Provide 2-3 actionable recommendations for maintaining strong credit standing and potential future improvements.

IMPORTANT RULES:
- NO greeting ("Good morning team" etc.)
- NO applicant IDs or technical identifiers
- Use ONE line breaks between paragraphs (\n)
- Write 7 distinct paragraphs
- Use specific numbers from the data
- Keep language professional but simple
- Do NOT use markdown formatting like ** or # - just plain text with line breaks`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();

      text = text
        .replace(/\*\*/g, '')
        .replace(/#{1,6}\s/g, '')
        .trim();

      this.logger.info('Gemini explanation generated successfully');
      return text;
    } catch (error) {
      this.logger.error({ err: error }, 'Gemini API failed');
      throw new Error('Failed to generate explanation');
    }
  }
}
