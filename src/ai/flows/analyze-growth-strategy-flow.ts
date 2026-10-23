'use server';
/**
 * @fileOverview AI 每週增長策略分析助手 (穩定版 - 鎖定 Flash)
 */

import { getNativeModel, safeJsonParse } from '@/ai/genkit';

export type AnalyzeGrowthInput = {
  context: string;
  salesData: Array<{
    date: string;
    amount: number;
    orderCount: number;
  }>;
  topProducts: Array<{
    name: string;
    views: number;
    sales: number;
  }>;
  searchTrends: string[];
  analyticsSummary: {
    ga4_active_users: number;
    fb_pixel_events: number;
    top_traffic_source: string;
  };
  language: string;
};

export type AnalyzeGrowthOutput = {
  demandInsight: string;
  inventoryAdvice: string;
  marketingStrategy: string;
  socialMediaPlan: string;
  summary: string;
};

export async function analyzeGrowthStrategy(input: AnalyzeGrowthInput): Promise<AnalyzeGrowthOutput> {
  const salesTrendStr = input.salesData.map(d => `[${d.date}: $${d.amount}, ${d.orderCount} orders]`).join(', ');
  const topProductsStr = input.topProducts.map(p => `[${p.name}: ${p.views} pool, ${p.sales} sales]`).join(', ');
  const searchKeywordsStr = input.searchTrends.join(', ');

  const promptText = `
    You are an expert e-commerce data analyst for SHOP POINT. 
    Analyze metrics and provide a growth strategy.

    DATA CONTEXT:
    - Sales: ${salesTrendStr}
    - Top Items: ${topProductsStr}
    - Trends: ${searchKeywordsStr}
    - Analytics: Users: ${input.analyticsSummary.ga4_active_users}, Source: ${input.analyticsSummary.top_traffic_source}

    Language: ${input.language === 'en' ? 'English' : 'Traditional Chinese (HK)'}

    STRICT RULE: OUTPUT ONLY RAW JSON.
    SCHEMA:
    {
      "demandInsight": "string",
      "inventoryAdvice": "string",
      "marketingStrategy": "string",
      "socialMediaPlan": "string",
      "summary": "string"
    }
  `;

  try {
    const model = await getNativeModel();
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: promptText }] }],
      generationConfig: {
        responseMimeType: "application/json",
        maxOutputTokens: 2000
      }
    });
    
    const response = await result.response;
    return safeJsonParse(response.text()) || { demandInsight: "", inventoryAdvice: "", marketingStrategy: "", socialMediaPlan: "", summary: "" };
  } catch (e: any) {
    throw new Error("AI 增長策略生成失敗");
  }
}
