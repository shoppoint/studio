'use server';

/**
 * @fileOverview 文章內容 AI 生成助手 - 部署環境穩定性優化版
 */

import { getNativeModel, safeJsonParse } from '@/ai/genkit';
import { HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

export type GenerateArticleInput = {
  concept?: string;
  currentTitle?: string;
  currentContent?: string;
  category?: string;
  mode: 'full' | 'summary' | 'seo';
};

export async function generateArticleContent(input: GenerateArticleInput) {
  try {
    const model = await getNativeModel();
    const promptText = `
      Generate a high-quality lifestyle article for a Hong Kong audience. 
      CONCEPT: "${input.concept || input.currentTitle}". 
      MODE: ${input.mode}. 
      
      [STRICT LANGUAGE RULES]
      1. 'zh' field MUST be in **Hong Kong Traditional Chinese (繁體中文 - 港式口吻)**.
      2. ABSOLUTELY NO Simplified Chinese characters.
      3. Use engaging, local HK terminology.
      4. 'en' field MUST be 100% English.

      Return ONLY raw JSON. No Markdown.
      SCHEMA:
      {
        "en": {
          "title": "string",
          "excerpt": "string",
          "content": "string",
          "metaTitle": "string",
          "metaDescription": "string",
          "keywords": "string"
        },
        "zh": {
          "title": "string",
          "excerpt": "string",
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
        maxOutputTokens: 3500
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
    throw new Error("文章生成中斷：" + e.message);
  }
}
