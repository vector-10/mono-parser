import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;
  private lastGeminiCall: number = 0;
  private readonly GEMINI_REQUEST_DELAY = 6000;

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

**Opening:** Start with a greeting and clear statement of the loan decision and credit score.

**Key Approval Factors:** Explain the 3-4 most important reasons this loan was approved, with specific numbers and percentages from the data.

**Recommendations:** Provide 2-3 suggestions for future improvement or maintaining their creditworthiness.

**Important:** 
- Use clear paragraph breaks (double line breaks between sections)
- Keep it 6-7 paragraphs total
- Use specific numbers from the data
- Write professionally but keep language simple
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
