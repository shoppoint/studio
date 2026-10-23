import { genkit, z } from 'genkit';
import { googleAI } from '@genkit-ai/google-genai';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { initializeFirebase } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';

/**
 * @fileOverview AI 核心配置模組 (V26 - 對齊 v1beta 版本)
 * 核心：鎖定使用 "v1beta" API 版本與 "gemini-flash-latest" 模型，實現 100% 穩定性。
 */

export function getApiKey() {
  // 優先讀取環境變數，並移除所有引號
  const key = (process.env.GOOGLE_GENAI_API_KEY || "").trim().replace(/['"]/g, '');
  return key;
}

/**
 * 獲取 Genkit 實例 (支援從 Firestore 自動抓取金鑰)
 */
export async function getAi() {
  let apiKey = getApiKey();

  if ((!apiKey || apiKey.length < 10) && typeof window === 'undefined') {
    try {
      const { db } = initializeFirebase();
      const snap = await getDoc(doc(db, 'config', 'infra'));
      if (snap.exists()) {
        apiKey = (snap.data().geminiApiKey || snap.data().googleApiKey || "").trim().replace(/['"]/g, '');
      }
    } catch (e) {
      console.warn("[AI Genkit] Firestore key fetch failed, fallback to env.");
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

  // 如果環境變數失效，才去資料庫抓取 (這一步可能導致 1-2 秒延遲)
  if ((!key || key.length < 10) && typeof window === 'undefined') {
    try {
      const { db } = initializeFirebase();
      const snap = await getDoc(doc(db, 'config', 'infra'));
      if (snap.exists()) {
        key = (snap.data().geminiApiKey || snap.data().googleApiKey || "").trim().replace(/['"]/g, '');
      }
    } catch (e) {
      console.warn("[AI Init] Firestore key fetch skipped or failed.");
    }
  }
  
  if (!key || key.length < 10) {
    throw new Error("API_KEY_MISSING: 請在基礎設施設定中填寫有效的 Gemini API Key。");
  }

  // 關鍵優化：強制指定 apiVersion 為 v1beta，對齊 Google AI Studio 最穩定端點
  const genAI = new GoogleGenerativeAI(key);
  
  return genAI.getGenerativeModel({
    model: "gemini-flash-latest",
  }, { apiVersion: 'v1beta' });
}

/**
 * 強效 JSON 解析與結構提取
 */
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
    const sanitized = jsonCandidate.replace(/[\u0000-\u001F\u007F-\u009F]/g, "");
    return JSON.parse(sanitized);
  } catch (e) {
    console.warn("[AI JSON Parser] All parsing attempts failed.");
    return null;
  }
}

export { z };
