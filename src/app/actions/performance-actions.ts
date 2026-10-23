'use server';

/**
 * @fileOverview 效能審計 Server Action (加固版)
 * 修正：改進 JSON 解析邏輯，防止 Unexpected end of JSON input。
 */

export async function runPerformanceAuditAction(url: string, apiKey?: string) {
  if (!apiKey || apiKey.length < 10) {
    return { 
      success: false, 
      message: "請先在「基礎設施」設定中填寫有效的 Google Public API Key。" 
    };
  }

  const targetUrl = url || "https://shoppoint.hk";

  try {
    console.log(`[Audit] Connecting to Google PageSpeed Insights for ${targetUrl}...`);
    
    // 呼叫 Google PageSpeed Insights API (手機版測試)
    const endpoint = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(targetUrl)}&key=${apiKey}&category=PERFORMANCE&strategy=mobile`;

    const response = await fetch(endpoint, {
      method: 'GET',
      cache: 'no-store'
    }).catch(err => {
      throw new Error("無法建立與 Google 伺服器的連線，請檢查您的伺服器網路狀態。");
    });

    const responseText = await response.text();
    if (!responseText || responseText.trim() === "") {
      throw new Error(`Google API 回傳了空內容 (Status: ${response.status})。`);
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      throw new Error("Google API 回傳了無效的格式。");
    }

    if (!response.ok) {
      throw new Error(data.error?.message || `Google API 回傳錯誤 (${response.status})。`);
    }

    const lighthouse = data.lighthouseResult;
    const auditResults = lighthouse.audits;

    // 提取核心指標
    const score = Math.round(lighthouse.categories.performance.score * 100);
    const lcpValue = auditResults['largest-contentful-paint']?.numericValue / 1000 || 0; // 秒
    const tbtValue = auditResults['total-blocking-time']?.numericValue || 0; // 毫秒
    const clsValue = auditResults['cumulative-layout-shift']?.numericValue || 0;

    return { 
      success: true, 
      message: "Lighthouse 審計成功完成。",
      data: {
        lcp: parseFloat(lcpValue.toFixed(2)),
        fid: Math.round(tbtValue), 
        cls: parseFloat(clsValue.toFixed(3)),
        score: score
      }
    };
  } catch (error: any) {
    console.error("[Performance Audit Action Error]", error.message);
    return { 
      success: false, 
      message: error.message || "執行審計時發生非預期錯誤。" 
    };
  }
}
