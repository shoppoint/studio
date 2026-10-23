'use server';

import { getEmbedding } from "@/ai/flows/ai-search-flow";
import { initializeFirebase } from '@/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getProductEmbeddingText } from "@/lib/shop-utils";

/**
 * @fileOverview AI 搜尋相關 Server Actions (穩定連線版)
 * 修正：將指令改為 'use server'，確保 API Key 與資料庫操作在伺服器端安全執行。
 */

/**
 * 生成產品向量 (用於後台同步)
 */
export async function generateProductVectorAction(text: string) {
  try {
    if (!text || text.trim().length < 2) {
      return { success: false, message: "Text too short or empty" };
    }
    
    const vector = await getEmbedding(text);
    
    if (!vector || !Array.isArray(vector) || vector.length === 0) {
      throw new Error("AI returned an empty or invalid vector array.");
    }

    return { 
      success: true, 
      vector: Array.from(vector).map(val => Number(val)) 
    };
  } catch (error: any) {
    const errorMsg = error.message || "Internal AI Processing Error";
    console.error("[Action Error] generateProductVectorAction failed:", errorMsg);
    return { 
      success: false, 
      message: errorMsg
    };
  }
}

/**
 * 背景同步產品 Embedding
 */
export async function syncProductEmbeddingAction(productId: string) {
  if (!productId) return { success: false, message: "Missing Product ID" };

  try {
    const { db } = initializeFirebase();
    const productRef = doc(db, 'public_products', productId);
    const snap = await getDoc(productRef);

    if (!snap.exists()) {
      throw new Error("Product not found during background sync.");
    }

    const product = snap.data();
    const embeddingText = getProductEmbeddingText(product);
    
    console.log(`[Background AI] Generating embedding for: ${productId}`);
    
    // 呼叫 Embedding Flow
    const vector = await getEmbedding(embeddingText);

    if (vector && Array.isArray(vector)) {
      await updateDoc(productRef, {
        embedding: vector,
        embeddingUpdatedAt: serverTimestamp()
      });
      console.log(`[Background AI] Embedding backfilled for: ${productId}`);
      return { success: true };
    }
    
    throw new Error("Empty vector received");
  } catch (e: any) {
    console.warn(`[Background AI Sync] Skipped for ${productId}:`, e.message);
    return { success: false, message: e.message };
  }
}

/**
 * 生成搜尋詞向量 (用於前台搜尋)
 */
export async function getQueryVectorAction(queryText: string) {
  if (!queryText || queryText.trim().length < 2) return null;
  try {
    const result = await getEmbedding(queryText);
    if (!result || !Array.isArray(result) || result.length === 0) {
      throw new Error("Invalid vector format.");
    }
    return Array.from(result).map(num => Number(num));
  } catch (e: any) {
    console.error("[AI Search Action] getQueryVectorAction failed:", e.message);
    return null;
  }
}
