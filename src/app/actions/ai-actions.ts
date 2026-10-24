'use server';

import { getNativeModel } from "@/ai/genkit";

/**
 * @fileOverview AI 服務連線測試與診斷 Action (V9 - 靜默診斷強化版)
 * 職責：執行背景預熱並回傳診斷資訊。
 * 修正：確保任何錯誤都被捕獲並以 success: false 形式回傳，防止觸發 Next.js 500 錯誤。
 */

export async function testGeminiKeyAction(apiKey: string) {
  try {
    const model = await getNativeModel(apiKey);
    
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: "PING" }] }],
      generationConfig: { maxOutputTokens: 5 }
    });
    
    const response = await result.response;
    const text = response.text();

    return { 
      success: true, 
      message: "連線成功！Gemini v1beta 伺服器已有回應。",
      preview: text 
    };
  } catch (error: any) {
    console.warn("[AI Test Action] Captured Warning:", error.message);
    let friendlyMsg = error.message;
    
    if (error.message?.includes('API_KEY_INVALID')) {
      friendlyMsg = "API 金鑰無效，請檢查設定。";
    } else if (error.message?.includes('PERMISSION_DENIED')) {
      friendlyMsg = "權限不足，請確認金鑰已啟用 Gemini API 權限。";
    }

    return { 
      success: false, 
      message: `連線異常：${friendlyMsg}` 
    };
  }
}

export async function getAiStatusAction() {
  try {
    const mem = process.memoryUsage();
    const uptime = process.uptime();
    
    let pingResult = "Pending";
    let errorDetail = "";
    
    try {
      // 執行極小量生成作為喚醒訊號
      const model = await getNativeModel();
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: "OK" }] }],
        generationConfig: { maxOutputTokens: 5 }
      });
      const response = await result.response;
      pingResult = response.text().trim();
    } catch (e: any) {
      pingResult = "ConnectionFailed";
      errorDetail = e.message || "Unknown Connection Error";
    }

    return {
      success: true,
      data: {
        status: (pingResult && pingResult !== "ConnectionFailed") ? "Healthy" : "Degraded",
        ping: pingResult,
        api_version: "v1beta",
        error: errorDetail,
        uptime: Math.floor(uptime),
        memory: {
          rss: Math.round(mem.rss / 1024 / 1024),
          heapUsed: Math.round(mem.heapUsed / 1024 / 1024)
        },
        version: process.version,
        env: process.env.NODE_ENV,
        revision: process.env.K_REVISION || "Local/Dev"
      }
    };
  } catch (error: any) {
    // 關鍵修正：回傳 JSON 而非拋出異常，防止 App Hosting 日誌出現 500 Error
    console.warn("[AI Status Action] Silent error handled:", error.message);
    return { 
      success: false, 
      message: "AI 服務診斷目前不可用",
      detail: error.message
    };
  }
}
