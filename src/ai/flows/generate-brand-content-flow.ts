'use server';

/**
 * @fileOverview 品牌故事 AI 生成助手 - 專注傳承與法律合規版
 * 修正：嚴格禁用「官方」、「專門店」、「授權經銷」等敏感詞彙以規避法律風險。
 */

import { getNativeModel, safeJsonParse } from '@/ai/genkit';
import { HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

export type GenerateBrandContentInput = {
  brandName: string;
  websiteUrl?: string;
  categoryNames?: string[];
};

export async function generateBrandContent(input: GenerateBrandContentInput) {
  try {
    const model = await getNativeModel();
    const promptText = `
      You are an expert Brand Heritage Strategist.
      Generate a compelling brand story and SEO data for: "${input.brandName}". 
      CATEGORIES: ${input.categoryNames?.join(', ')}.
      
      [CONTENT GUIDELINES]
      1. Focus strictly on brand history, heritage, craftsmanship, and core vision.
      2. TONE: Elegant, professional, and trustworthy.
      
      [STRICT NEGATIVE CONSTRAINTS - LEGAL COMPLIANCE]
      - ABSOLUTELY NO mention of "Official" (官方/官網), "Specialty Store / Shop" (專門店/專賣店), "Flagship Store" (旗艦店), or "Authorized Distributor/Dealer" (授權代理/授權經銷).
      - DO NOT describe the business as an "Exclusive Agent" unless specified.
      - DO NOT include sales jargon like "In-stock" (現貨), "Shop now" (立即購買), or "Available now".
      - Keep it as a timeless brand introduction suitable for a global audience.

      [LANGUAGE RULES]
      1. 'zh' field: Traditional Chinese (Professional/Formal). NO simplified characters.
      2. 'en' field: Pure, high-end English.

      Return ONLY raw JSON.
      SCHEMA:
      {
        "en": {
          "content": "string",
          "metaTitle": "string",
          "metaDescription": "string",
          "keywords": "string"
        },
        "zh": {
          "content": "string",
          "metaTitle": "string",
          "metaDescription": "string",
          "keywords": "string"
        }
      }
    `;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: promptText }] }],
      generationConfig: {
        responseMimeType: "application/json",
        maxOutputTokens: 3000
      },
      safetySettings: [
        { 
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, 
          threshold: HarmBlockThreshold.BLOCK_NONE 
        }
      ]
    });

    const response = await result.response;
    return safeJsonParse(response.text());
  } catch (e: any) {
    throw new Error("品牌內容生成中斷：" + e.message);
  }
}
