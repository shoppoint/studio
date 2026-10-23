'use server';
/**
 * @fileOverview AI 個人化 EDM 生成助手 (穩定版 - 鎖定 Flash)
 */

import { getNativeModel, safeJsonParse } from '@/ai/genkit';

export type GenerateEdmInput = {
  userInterests: string[];
  userTier: string;
  weeklyTheme: string;
  featuredProducts: Array<{
    name: string;
    category: string;
    price: number;
  }>;
  language: string;
};

export type GenerateEdmOutput = {
  subject: string;
  previewText: string;
  htmlBody: string;
  logicUsed: string;
};

export async function generatePersonalizedEdm(input: GenerateEdmInput): Promise<GenerateEdmOutput> {
  const promptText = `
    Generate a personalized e-commerce newsletter. 
    User Interests: ${input.userInterests.join(', ')}
    Theme: ${input.weeklyTheme}
    Tier: ${input.userTier}
    
    STRICT RULE: OUTPUT ONLY RAW JSON.
    SCHEMA:
    {
      "subject": "string",
      "previewText": "string",
      "htmlBody": "string",
      "logicUsed": "string"
    }
  `;

  try {
    const model = await getNativeModel();
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: promptText }] }],
      generationConfig: {
        responseMimeType: "application/json",
        maxOutputTokens: 2500
      }
    });
    
    const response = await result.response;
    return safeJsonParse(response.text()) || { subject: "", previewText: "", htmlBody: "", logicUsed: "" };
  } catch (e: any) {
    throw new Error("AI 個人化 EDM 生成失敗");
  }
}
