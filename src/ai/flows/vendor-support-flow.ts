'use server';
/**
 * @fileOverview 商家支援 AI 助手 (穩定版 - 鎖定 Flash)
 */

import { getNativeModel, safeJsonParse } from '@/ai/genkit';

export type VendorSupportInput = {
  query: string;
  language: string;
};

export type VendorSupportOutput = {
  answer: string;
};

export async function askVendorAssistant(input: VendorSupportInput): Promise<VendorSupportOutput> {
  const promptText = `
    You are a Partner Success Assistant for SHOP POINT. 
    Help the vendor with their operational query.
    
    QUERY: ${input.query}
    
    STRICT RULE: OUTPUT ONLY RAW JSON. { "answer": "string" }
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
    return safeJsonParse(response.text()) || { answer: "暫時無法獲取商家支援建議。" };
  } catch (e: any) {
    return { answer: "暫時無法獲取商家支援建議。" };
  }
}
