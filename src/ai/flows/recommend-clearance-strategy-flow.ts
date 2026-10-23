'use server';
/**
 * @fileOverview AI 即期品清貨定價助手 (穩定版 - 鎖定 Flash)
 */

import { getNativeModel, safeJsonParse } from '@/ai/genkit';

export type RecommendClearanceInput = {
  productName: string;
  daysLeft: number;
  stockQty: number;
  originalPrice: number;
  language: string;
};

export type RecommendClearanceOutput = {
  suggestedDiscount: number;
  strategyTitle: string;
  marketingCopy: string;
  rationale: string;
};

export async function recommendClearanceStrategy(input: RecommendClearanceInput): Promise<RecommendClearanceOutput> {
  const promptText = `
    Suggest a clearance strategy for: ${input.productName}.
    Days left until expiry: ${input.daysLeft}
    Stock: ${input.stockQty}
    Original Price: ${input.originalPrice}
    
    STRICT RULE: OUTPUT ONLY RAW JSON.
    SCHEMA:
    {
      "suggestedDiscount": number,
      "strategyTitle": "string",
      "marketingCopy": "string",
      "rationale": "string"
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
    return safeJsonParse(response.text()) || { suggestedDiscount: 0, strategyTitle: "", marketingCopy: "", rationale: "" };
  } catch (e: any) {
    throw new Error("AI 清貨策略生成失敗");
  }
}
