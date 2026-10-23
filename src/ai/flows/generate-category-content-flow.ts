'use server';

/**
 * 分類內容 AI 生成助手 - 精簡專業版
 */

import { getNativeModel, safeJsonParse } from '@/ai/genkit';
import { HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

export type GenerateCategoryContentInput = {
  categoryName: string;
  parentCategoryName?: string;
  mode: 'description' | 'seo';
  description?: string; 
};

export async function generateCategoryContent(input: GenerateCategoryContentInput) {
  try {
    const model = await getNativeModel();
    const promptText = `
      You are a World-Class E-commerce SEO and Content Specialist.
      Generate marketing and SEO content for product category: "${input.categoryName}". 
      PARENT CATEGORY: ${input.parentCategoryName || "None"}.
      CONTEXT: ${input.description}. 
      MODE: ${input.mode}.

      [STRICT GUIDELINES]
      1. Keep it professional, sophisticated, and CONCISE. 
      2. Focus strictly on the product range, functional use cases, and technical benefits.
      3. ABSOLUTELY NO lifestyle clichés (e.g., "busy life", "city rush", "urban lifestyle").
      4. Avoid generic fluff like "one-stop shop" or "best selection".
      
      [LANGUAGE RULES]
      1. 'zh' field MUST be in Hong Kong Traditional Chinese. No Simplified Chinese.
      2. 'en' field MUST be 100% English.

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
        maxOutputTokens: 2500,
        temperature: 0.4
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
    throw new Error("分類內容生成中斷：" + e.message);
  }
}
