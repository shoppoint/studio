'use server';
/**
 * @fileOverview 平台通知系統 AI 撰寫助手 (穩定版 - 鎖定 Flash)
 */

import { getNativeModel, safeJsonParse } from '@/ai/genkit';

export type GenerateNotificationInput = {
  triggerEvent: string;
  concept?: string;
  storeName?: string;
  language: string;
  channel: 'email' | 'whatsapp' | 'in_app';
};

export type GenerateNotificationOutput = {
  subject?: string;
  content: string;
};

export async function generateNotificationContent(input: GenerateNotificationInput): Promise<GenerateNotificationOutput> {
  const promptText = `
    Generate notification content.
    Channel: ${input.channel}
    Event: ${input.triggerEvent}
    Context: ${input.concept}
    Language: ${input.language}
    
    STRICT RULE: OUTPUT ONLY RAW JSON.
    SCHEMA: { "subject": "string", "content": "string" }
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
    return safeJsonParse(response.text()) || { content: "" };
  } catch (e: any) {
    throw new Error("AI 通知內容生成失敗");
  }
}
