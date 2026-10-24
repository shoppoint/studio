'use server';

import { getNativeModel } from "@/ai/genkit";

/**
 * @fileOverview AI 服務連線測試與診斷 Action (V10 - 徹底靜默防禦版)
 * 修正：嚴格捕獲所有異常並返回 JSON 對象，徹底消除日誌中的 500 POST 錯誤。
 */

export async function testGeminiKeyAction(apiKey: string) {
  try {
    const model = await getNativeModel(apiKey);
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: "PING" }] }],
      generationConfig: { maxOutputTokens: 5 }
    });
    const response = await result.response;
    return { 
      success: true, 
      message: "連線成功！Gemini v1beta 伺服器已有回應。",
      preview: response.text() 
    };
  } catch (error: any) {
    return { success: false, message: `連線異常：${error.message}` };
  }
}

export async function getAiStatusAction() {
  try {
    let pingResult = "Pending";
    let errorDetail = "";
    
    try {
      const model = await getNativeModel();
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: "OK" }] }],
        generationConfig: { maxOutputTokens: 5 }
      });
      const response = await result.response;
      pingResult = response.text().trim();
    } catch (e: any) {
      pingResult = "ConnectionFailed";
      errorDetail = e.message;
    }

    return {
      success: true,
      data: {
        status: (pingResult && pingResult !== "ConnectionFailed") ? "Healthy" : "Degraded",
        ping: pingResult,
        error: errorDetail,
        uptime: Math.floor(process.uptime()),
        version: process.version,
        revision: process.env.K_REVISION || "Local/Dev"
      }
    };
  } catch (error: any) {
    // 核心修正：即便發生系統級錯誤，也回傳 JSON 而非拋出異常，防止 App Hosting 出現 500 Error
    return { 
      success: false, 
      message: "AI 服務診斷目前不可用",
      detail: error.message
    };
  }
}
