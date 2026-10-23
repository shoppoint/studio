'use server';

/**
 * 產品內容 AI 生成助手 - 專業行銷文案極致優化版 (V15)
 * 
 * 修正重點：
 * 1. 角色重塑：頂尖行銷撰稿人。嚴禁撰寫「說明書」式的陳述。
 * 2. 標題革命：絕對禁止使用「產品概述、結構、功能、適用場景、材質規格、保養建議」等通用標題。
 * 3. 數據隔離：嚴禁在文案中提及 SKU、Barcode、重量、尺寸等已在規格表存在的數字。
 * 4. 格式強控：詳細描述 Subheading 後必須換行；簡介必須包含 <strong> 關鍵字且不換行。
 * 5. 渠道屏蔽：持續禁用「官方、正貨、直送、原裝進口」等字眼。
 */

import { getNativeModel, safeJsonParse } from '@/ai/genkit';
import { HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

export type ProductContentInput = {
  productName_en?: string;
  productName_zh?: string;
  primaryBrand?: string;
  collabBrands?: string[];
  ingredients_en?: string;
  ingredients_zh?: string;
  sku?: string;
  barcode?: string;
  spec?: any; 
  mode: 'summary' | 'detailed' | 'faq' | 'seo';
};

function getResponseSchema(mode: string) {
  const baseProperties: any = {};
  
  if (mode === 'faq') {
    const faqSchema = {
      type: "array",
      items: {
        type: "object",
        properties: {
          q: { type: "string", description: "A practical question focused on usage value or product comparison." },
          a: { type: "string", description: "A persuasive and professional answer that helps the customer decide to buy." }
        },
        required: ["q", "a"]
      }
    };
    baseProperties.en = { type: "object", properties: { faqs: faqSchema }, required: ["faqs"] };
    baseProperties.zh = { type: "object", properties: { faqs: faqSchema }, required: ["faqs"] };
  } else if (mode === 'seo') {
    const seoFields = {
      type: "object",
      properties: {
        metaTitle: { type: "string" },
        metaDescription: { type: "string" },
        internalSearchTags: { type: "string", description: "Keywords for internal search index, comma separated." },
        externalSearchTags: { type: "string", description: "High-traffic SEO keywords for external search engines, comma separated." }
      },
      required: ["metaTitle", "metaDescription", "internalSearchTags", "externalSearchTags"]
    };
    baseProperties.en = seoFields;
    baseProperties.zh = seoFields;
  } else {
    const textField = {
      type: "object",
      properties: {
        content: { type: "string", description: "The generated marketing HTML content." }
      },
      required: ["content"]
    };
    baseProperties.en = textField;
    baseProperties.zh = textField;
  }

  return {
    type: "object",
    properties: baseProperties,
    required: ["en", "zh"]
  };
}

export async function generateProductContent(input: ProductContentInput) {
  const factContext = `
    Product: ${input.productName_zh} / ${input.productName_en}
    Brand: ${input.primaryBrand}
    Ingredients: ${(input.ingredients_zh || "").substring(0, 500)}
    Specs: ${JSON.stringify(input.spec || {})}
  `.trim();

  try {
    const model = await getNativeModel();
    
    let taskInstruction = "";
    if (input.mode === 'faq') {
      taskInstruction = `
        Generate 6 professional FAQ pairs.
        [RULES]
        - DO NOT ask/answer about: Storage, Allergens, Origin, Expiry, or "Official/Authentic" status.
        - Focus on: "How it feels", "How it tastes", "Why choose this over others", "Hidden tips".
      `;
    } else if (input.mode === 'summary') {
      taskInstruction = `
        Generate a concise HTML <ul> list with exactly 5 points.
        [STRICT FORMAT]
        - Each <li> must follow: <li><strong>[Benefit Key]</strong>: Explanation text...</li>
        - The [Benefit Key] must be an ATTRACTIVE FEATURE, not a spec (e.g., use "質感溫潤" instead of "材質").
        - NO line breaks inside <li>.
        [CONTENT GOAL]
        - Focus on value and emotion. BAN mention of SKU, Barcode, or "Official/Direct" claims.
      `;
    } else if (input.mode === 'detailed') {
      taskInstruction = `
        Generate a 5-paragraph narrative in HTML.
        
        [STRICT SUBHEADING RULE]
        - Each paragraph MUST start with a PRODUCT-SPECIFIC heading in <strong> tags.
        - CRITICAL: Add a <br/> immediately after the <strong> closing tag.
        - ABSOLUTELY FORBIDDEN HEADINGS: "產品概述", "結構與功能", "適用場景", "材質規格", "保養建議", "產品背景", "概述", "規格", "功能".
        - Heading Example: "<strong>傳承自北海道的職人手作</strong><br/>..."
        
        [NARRATIVE GUIDELINES]
        - Tell a story. Describe the "moment of use".
        - BAN Authenticity Claims: "官方授權", "正貨", "日本/海外直送", "日本/海外原裝進口", "平行進口".
        - BAN SKU/Barcode/Specific numeric specs in the text.
        - BAN Clichés: "繁忙都市", "生活節奏快", "急速生活", "香港天氣", "潮濕多雨", "應付壓力".
        - BAN Flowery Fluff: "匠心", "極致", "卓越", "完美", "震撼", "打造", "呈現".
      `;
    } else if (input.mode === 'seo') {
      taskInstruction = `
        Generate high-intent SEO metadata. 
      `;
    }

    const promptText = `
      ACT AS: A World-Class E-commerce Marketing Director and Copywriter.
      TONE: Persuasive, professional, and sophisticated.
      
      [FACTUAL CONTEXT - USE AS EVIDENCE ONLY, DO NOT COPY AS TEXT]
      ${factContext}
      
      [YOUR TASK]
      ${taskInstruction}
      
      [LANGUAGE RULES]
      1. 'zh' fields: MUST be in Traditional Chinese (Hong Kong Style - 港式繁體).
         - NO simplified characters.
      2. 'en' fields: Professional International English.
      
      [FORMATTING]
      - Output MUST be valid RAW JSON. No Markdown.
    `;

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: promptText }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: getResponseSchema(input.mode) as any,
        temperature: 0.4, 
        maxOutputTokens: 3800, 
      },
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE }
      ]
    });

    const response = await result.response;
    const rawText = response.text();
    const parsed = safeJsonParse(rawText);
    
    if (!parsed) {
      throw new Error("AI 回傳格式解析失敗。");
    }

    return parsed;
  } catch (e: any) {
    console.error("[AI Content Flow Error]", e.message);
    throw new Error(e.message || "AI 服務目前無法回應。");
  }
}
