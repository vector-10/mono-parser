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
      const text = result.response.text().trim();
      this.logger.info('AI review chat response generated');
      return text;
    } catch (error) {
      this.logger.error({ err: error }, 'AI review chat failed');
      throw new Error('Failed to generate response');
    }
  }

  private buildReviewSystemPrompt(app: any): string {
    return `You are an AI credit review assistant helping a loan officer evaluate a loan application.

Application data:
${JSON.stringify(app, null, 2)}

Your role:
- Answer questions about this specific application clearly and concisely
- Help the officer understand the credit score, risk factors, strengths, and weaknesses
- Suggest follow-up questions or documents if needed
- Help draft summaries for managers or stakeholders
- Provide balanced analysis grounded in the data above
- Never make the final approval or decline decision — that is the officer's responsibility

If asked about something not present in the data, say so clearly. Keep responses professional and focused.`;
  }
}
