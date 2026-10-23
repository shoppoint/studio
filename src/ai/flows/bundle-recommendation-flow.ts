'use server';
/**
 * @fileOverview AI 組合加購建議助手 (穩定版 - 鎖定 Flash)
 */

import { getNativeModel, safeJsonParse } from '@/ai/genkit';

export type BundleRecommendationInput = {
  cartItems: Array<{
    name: string;
    category: string;
    price: number;
  }>;
  language: string;
};

export type BundleRecommendationOutput = {
  recommendations: Array<{
    name: string;
    reason: string;
    estimatedPrice: number;
    category: string;
    discountTag?: string;
  }>;
  logicSummary: string;
};

export async function getBundleRecommendations(input: BundleRecommendationInput): Promise<BundleRecommendationOutput> {
  const cartStr = input.cartItems.map(i => `- ${i.name} (Category: ${i.category})`).join('\n');
  const promptText = `
    Suggest 3 complementary products based on these cart items: 
    ${cartStr}
    
    Language: ${input.language === 'en' ? 'English' : 'Traditional Chinese (HK)'}
    
    STRICT RULE: OUTPUT ONLY RAW JSON.
    SCHEMA:
    {
      "recommendations": [{"name": "string", "reason": "string", "estimatedPrice": number, "category": "string"}],
      "logicSummary": "string"
    }
  `;

  try {
    const model = await getNativeModel();
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: promptText }] }],
      generationConfig: {
        responseMimeType: "application/json",
        maxOutputTokens: 1500
      }
    });
    
    const response = await result.response;
    return safeJsonParse(response.text()) || { recommendations: [], logicSummary: "" };
  } catch (e: any) {
    throw new Error("AI 組合建議生成失敗");
  }
}
