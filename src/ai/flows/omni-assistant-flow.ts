'use server';

/**
 * @fileOverview 全能購物助手 AI - 對話式導航與 FAQ 優化版
 * 
 * 修正重點：
 * 1. 強化網頁導航指令：明確告知 AI 全站路由地圖。
 * 2. 結構化輸出：AI 不僅回傳文字，還會回傳建議的「動作按鈕 (Action Button)」。
 * 3. 核心 FAQ 知識庫：將運費、門市、積分規則直接寫入 System Prompt 以提升速度。
 */

import { getNativeModel, safeJsonParse } from '@/ai/genkit';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc, collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';

export type OmniAssistantInput = {
  query: string;
  language: string;
  history?: { role: 'user' | 'ai', content: string }[];
  userContext?: { 
    isLoggedIn: boolean; 
    displayName?: string; 
    email?: string; 
    currentPath?: string;
  };
};

export type OmniAssistantOutput = {
  answer: string;
  suggestedAction?: {
    label: string;
    url: string;
  };
  requireStaffFollowup?: boolean;
  category?: "product" | "order" | "shipping" | "account" | "other";
};

/**
 * 全站導航地圖 - 供 AI 引用
 */
const SITE_MAP = `
- 首頁 Home: /
- 所有產品 Shop: /shop
- 最新優惠 Deals: /deals
- 清貨特價 Clearance: /clearance
- 類別瀏覽 Categories: /categories
- 禮物專區 Gift Zone: /gifts
- 新品上架 New Arrivals: /new-arrivals
- 最新消息/食譜 News: /news
- 追蹤訂單/歷史 Order History: /profile?tab=orders
- 會員獎賞/換領 Rewards: /profile/rewards
- 我的電子錢包 Coupons: /profile/coupons
- 運送政策 Shipping: /shipping
- 退換政策 Returns: /returns
- 聯絡我們 Contact: /contact
- 幫助中心 FAQ: /faq
`;

/**
 * 核心業務規則 - 供 AI 立即回答
 */
const BUSINESS_KNOWLEDGE = `
[SHIPPING 運費規則]
- 智易取 (iPostal): $100 免運費 (否則 $13)
- 順豐站/櫃: $120 免運費 (否則到付)
- 宅配直送: $300 免運費 (否則 $30)
- 順豐直送: $500 免運費 (否則到付)

[LOYALTY 積分規則]
- 消費 $10 = 1 積分
- 100 積分 = $1 現金抵扣
- 註冊即送迎新積分
- 推薦好友完成首單，雙方均有獎賞

[STORE 門市資訊]
- 地址: 新界屯門青菱徑 3 號時尚電腦城地庫 B17 號舖
- 時間: 週一至週六 12:00-19:00 (週日及公眾假期休息)
`;

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    answer: { type: "string", description: "給客人的友善回覆，支援 Markdown 粗體" },
    suggestedAction: {
      type: "object",
      properties: {
        label: { type: "string", description: "按鈕文字，例如：查看運費表" },
        url: { type: "string", description: "按鈕連結路徑" }
      }
    },
    category: { type: "string", enum: ["product", "order", "shipping", "account", "other"] }
  },
  required: ["answer"]
} as const;

export async function askOmniAssistant(input: OmniAssistantInput): Promise<OmniAssistantOutput> {
  const { query: userQuery, language, history, userContext } = input;
  const isEn = language.startsWith('en');
  const lKey = isEn ? 'en' : 'zh';
  const { db } = initializeFirebase();

  let dynamicContext = "";
  try {
    // 僅抓取最關鍵的動態資訊：活躍促銷與最新公告
    const [genSnap, promosSnap] = await Promise.all([
      getDoc(doc(db, 'config', 'general')),
      getDocs(query(collection(db, 'promotions'), where('status', '==', 'active'), where('isPublic', '==', true), limit(3)))
    ]);

    const gen = genSnap.exists() ? genSnap.data() : {};
    const shopName = gen.storeName?.[lKey] || "SHOP POINT";
    
    dynamicContext += `[CURRENT SHOP] ${shopName}\n`;
    
    const promoList = promosSnap.docs.map(d => `- ${d.data().name?.[lKey] || d.data().name?.zh}: Code [${d.data().code || "Auto Apply"}]`).join('\n');
    if (promoList) dynamicContext += `[ACTIVE PROMOS]\n${promoList}\n`;

  } catch (e) {
    console.error("[AI Assistant] Context fetch failed.");
  }

  const promptText = `
    ACT AS: The Store Concierge for SHOP POINT (Hong Kong). 
    LANGUAGE: Use ${isEn ? "English" : "Traditional Chinese (Hong Kong Style / 港式繁體)"}.
    
    KNOWLEDGE BASE:
    ${BUSINESS_KNOWLEDGE}
    
    SITE NAVIGATION (Always guide users here):
    ${SITE_MAP}
    
    [USER CONTEXT]
    - Name: ${userContext?.displayName || "Guest"}
    - Logged In: ${userContext?.isLoggedIn}
    - Current Path: ${userContext?.currentPath}
    
    [INSTRUCTIONS]
    1. Be warm, professional, and CONCISE.
    2. Primary Goal: Answer FAQ questions immediately and guide users to the relevant page.
    3. Suggested Action: If you mention a feature or page, return a suggestedAction object with the URL.
    4. If a customer is frustrated or has a complex issue, suggest using the "/contact" page to reach staff.
    5. Always use **bold** for key info like prices, codes, or locations.
    
    [USER QUERY]
    ${userQuery}
    
    RETURN ONLY RAW JSON matching the schema.
  `;

  try {
    const model = await getNativeModel();
    const result = await model.generateContent({
      contents: [
        ...(history || []).map(h => ({ 
          role: h.role === 'ai' ? 'model' : 'user' as any, 
          parts: [{ text: h.content }] 
        })),
        { role: 'user', parts: [{ text: promptText }] }
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA as any,
      }
    });

    const response = await result.response;
    const parsed = safeJsonParse(response.text());
    
    return parsed || { 
      answer: isEn ? "I'm here to help! Please tell me what you're looking for." : "您好！請問有什麼我可以幫到您？" 
    };
  } catch (e: any) {
    console.error("[AI Flow Error]", e.message);
    return { answer: isEn ? "Service busy, please try again." : "助手目前繁忙，請稍後再試。" };
  }
}
