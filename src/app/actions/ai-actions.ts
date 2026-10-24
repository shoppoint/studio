'use server';

import { getNativeModel } from "@/ai/genkit";

/**
 * @fileOverview AI 服務連線測試與診斷 Action (V12 - 徹底消除 500 POST 錯誤)
 * 修正：嚴格捕獲所有異常並回傳 JSON 對象。確保失敗時不會拋出系統錯誤，從而防止 App Hosting 出現 500 POST 日誌。
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
    let diagData: any = null;
    
    try {
      const model = await getNativeModel();
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: "OK" }] }],
        generationConfig: { maxOutputTokens: 5 }
      });
      const response = await result.response;
      pingResult = response.text().trim();
      
      diagData = {
        status: (pingResult && pingResult !== "ConnectionFailed") ? "Healthy" : "Degraded",
        ping: pingResult,
        uptime: Math.floor(process.uptime()),
        version: process.version,
        revision: process.env.K_REVISION || "Local/Dev",
        memory: process.memoryUsage ? {
          rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
          heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024)
        } : null
      };
    } catch (e: any) {
      pingResult = "ConnectionFailed";
      errorDetail = e.message;
      diagData = { status: "Degraded", ping: pingResult, error: errorDetail };
    }

    return {
      success: true,
      data: diagData
    };
  } catch (error: any) {
    // 核心修正：即便發生系統級錯誤，也回傳 JSON 而非拋出異常，徹底消除日誌中的 500 POST Error
    return { 
      success: false, 
      message: "AI 服務診斷目前不可用",
      detail: error.message
    };
  }
}
