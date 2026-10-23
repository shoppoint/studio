'use server';
/**
 * @fileOverview AI 產品 SEO 診斷助手 (穩定版 - 鎖定 Flash)
 */

import { getNativeModel, safeJsonParse } from '@/ai/genkit';

export type AnalyzeSeoInput = {
  productName: string;
  description: string;
  category?: string;
  language: string;
};

export type AnalyzeSeoOutput = {
  score: number;
  tips: string[];
  missingKeywords: string[];
};

export async function analyzeProductSeo(input: AnalyzeSeoInput): Promise<AnalyzeSeoOutput> {
  const promptText = `
    You are an expert E-commerce SEO auditor. 
    Analyze the following product for search friendliness.

    PRODUCT: ${input.productName}
    DESC: ${input.description.substring(0, 500)}
    LANG: ${input.language}

    STRICT RULE: OUTPUT ONLY RAW JSON.
    SCHEMA:
    {
      "score": number,
      "tips": ["tip1", "tip2"],
      "missingKeywords": ["kw1", "kw2"]
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
    return safeJsonParse(response.text()) || { score: 0, tips: [], missingKeywords: [] };
  } catch (e: any) {
    throw new Error("AI SEO 診斷失敗");
  }
}
