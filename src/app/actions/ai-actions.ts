'use server';

import { getNativeModel } from "@/ai/genkit";

/**
 * @fileOverview AI 服務連線測試與診斷 Action (V7 - 對齊 v1beta)
 */

/**
 * 測試當前 AI 服務連線狀況
 */
export async function testGeminiKeyAction(apiKey: string) {
  try {
    const model = await getNativeModel(apiKey);
    
    // 使用簡單的提示詞測試連線
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
    console.error("[AI Test Action Error]:", error.message);
    let friendlyMsg = error.message;
    
    if (error.message?.includes('API_KEY_INVALID')) {
      friendlyMsg = "API 金鑰無效，請檢查設定。";
    } else if (error.message?.includes('PERMISSION_DENIED')) {
      friendlyMsg = "權限不足，請確認金鑰已啟用 Gemini API 權限。";
    } else if (error.message?.includes('QUOTA')) {
      friendlyMsg = "已超過 Google AI 免費額度限制。";
    } else if (error.message?.includes('503')) {
      friendlyMsg = "服務暫時不可用 (503)，請確保模型名稱正確。";
    }

    return { 
      success: false, 
      message: `連線異常：${friendlyMsg}` 
    };
  }
}

/**
 * 獲取 AI 容器診斷資訊與執行預熱 (Warming)
 */
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
      console.log(`[AI Status Action] Hot-start failed: ${e.message}`);
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
    return { 
      success: false, 
      message: error.message || "AI 服務目前無法啟動，請檢查環境變數配置。" 
    };
  }
}
