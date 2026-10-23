'use server';

/**
 * @fileOverview AI 向量搜尋與 Embedding 生成 (修正模型路徑為 v1beta 對齊版)
 */

import { getAi } from '@/ai/genkit';

export async function getEmbedding(text: string): Promise<number[]> {
  try {
    const ai = await getAi();
    
    // 使用基礎 embedding 模型名稱
    const embedding = await ai.embed({
      embedder: 'googleai/text-embedding-004',
      content: text
    });
    
    if (!embedding || embedding.length === 0) {
      throw new Error("Empty embedding returned");
    }

    return Array.from(embedding).map(val => Number(val));
  } catch (e: any) {
    console.error("[AI Action] Embedding failed:", e.message);
    throw e;
  }
}
