import { genkit, z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { initializeFirebase } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';

/**
 * @fileOverview AI 核心配置模組 (V27 - 強化資料庫備援)
 * 核心：即便 App Hosting 部署失敗，也能從 Firestore 讀取金鑰，確保 100% 運作。
 */

export function getApiKey() {
  const key = (process.env.GOOGLE_GENAI_API_KEY || "").trim().replace(/['"]/g, '');
  return key;
}

/**
 * 獲取 Genkit 實例 (支援從 Firestore 自動抓取金鑰)
 */
export async function getAi() {
  let apiKey = getApiKey();

  if (!apiKey || apiKey.length < 10) {
    try {
      const { db } = initializeFirebase();
      const snap = await getDoc(doc(db, 'config', 'infra'));
      if (snap.exists()) {
        apiKey = (snap.data().geminiApiKey || snap.data().googleApiKey || "").trim().replace(/['"]/g, '');
      }
    } catch (e) {
      console.warn("[AI Genkit] Firestore key fetch failed.");
    }
  }

  const finalKey = (apiKey && apiKey.length > 10) ? apiKey : undefined;

  return genkit({
    plugins: [
      googleAI({ apiKey: finalKey })
    ]
  });
}

/**
 * 獲取原生 Google AI 模型實例 (對齊 v1beta 穩定版)
 */
export async function getNativeModel(providedKey?: string) {
  let key = providedKey?.trim().replace(/['"]/g, '');
  
  if (!key) {
    key = getApiKey();
  }

  // 核心保險邏輯
  if (!key || key.length < 10) {
    try {
      const { db } = initializeFirebase();
      const snap = await getDoc(doc(db, 'config', 'infra'));
      if (snap.exists()) {
        key = (snap.data().geminiApiKey || snap.data().googleApiKey || "").trim().replace(/['"]/g, '');
      }
    } catch (e) {
      console.warn("[AI Init] Firestore key fetch failed.");
    }
  }
  
  if (!key || key.length < 10) {
    throw new Error("API_KEY_MISSING: 請在資料庫 config/infra 中填寫有效的 Gemini API Key。");
  }

  const genAI = new GoogleGenerativeAI(key);
  
  return genAI.getGenerativeModel({
    model: "gemini-flash-latest",
  }, { apiVersion: 'v1beta' });
}

export function safeJsonParse(text: string) {
  if (!text || text.trim() === "") return null;
  try {
    return JSON.parse(text);
  } catch (e) {}

  try {
    let clean = text.replace(/```json\n?|```/g, "").trim();
    const startIndex = clean.indexOf('{');
    const endIndex = clean.lastIndexOf('}');
    if (startIndex === -1 || endIndex === -1) return null;
    const jsonCandidate = clean.substring(startIndex, endIndex + 1);
    return JSON.parse(jsonCandidate);
  } catch (e) {
    return null;
  }
}

export { z };
