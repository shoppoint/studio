'use server';
/**
 * @fileOverview 平台 FAQ 客服助手 (穩定版 - 鎖定 Flash)
 */

import { getNativeModel, safeJsonParse } from '@/ai/genkit';

export type FaqAssistantInput = {
  query: string;
  language: string;
};

export type FaqAssistantOutput = {
  answer: string;
};

export async function askFaqAssistant(input: FaqAssistantInput): Promise<FaqAssistantOutput> {
  const isEn = input.language.startsWith('en');
  const promptText = `
    You are a SHOP POINT Customer Support Concierge.
    
    [CONTEXT]
    - Shop: SHOP POINT (Hong Kong)
    - Shipping: HK local free over $500. Under $500 depends on method.
    - Payments: Visa, Master, AlipayHK, WeChat Pay, PayMe, Octopus, FPS.
    - Returns: 7-day return for eligible items.
    
    [USER QUERY]
    ${input.query}
    
    [INSTRUCTIONS]
    1. Answer warmly and professionally.
    2. Use ${isEn ? "English" : "Traditional Chinese (Hong Kong style)"}.
    3. Return ONLY raw JSON.
    
    SCHEMA:
    { "answer": "string" }
  `;

  try {
    const model = await getNativeModel();
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: promptText }] }],
      generationConfig: {
        responseMimeType: "application/json",
        maxOutputTokens: 1000
      }
    });

    const response = await result.response;
    const parsed = safeJsonParse(response.text());
    return parsed || { answer: isEn ? "I'm currently busy, please try again." : "抱歉，系統忙碌中。請稍後再試。" };
  } catch (e: any) {
    return { answer: isEn ? "AI service is temporarily unavailable." : "AI 服務暫時無法連線。" };
  }
}
