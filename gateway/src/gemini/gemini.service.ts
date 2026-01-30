import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class GeminiService {
  private genAI: GoogleGenerativeAI;
  private model: any;

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

Provide a clear, professional explanation of:
1. Why this decision was made
2. The most important factors that influenced it  
3. What the applicant could do to improve their chances

Keep it concise (3-4 paragraphs) and use simple language. Focus on actionable insights.`;

  try {
    const result = await this.model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    this.logger.info('Gemini explanation generated successfully');
    return text;
  } catch (error) {
    this.logger.error({ err: error }, 'Gemini API failed');
    throw new Error('Failed to generate explanation');
  }
}}