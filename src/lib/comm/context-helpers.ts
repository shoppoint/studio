
/**
 * @fileOverview 通訊系統上下文輔助工具 (Context Helpers) - 強化版
 * 負責將 Firestore 原始數據轉換為電郵範本可用的變數。
 */

import { format } from "date-fns";
import { 
  AREA_NAME_MAP, 
  DISTRICT_NAME_MAP, 
  SUB_DISTRICT_NAME_MAP 
} from "../address-data";

/**
 * 運送方式名稱映射表 (回退方案)
 */
const SHIPPING_METHOD_MAP: Record<string, Record<string, string>> = {
  zh: {
    sf_locker: "順豐站／智能櫃 (SF Station/Locker)",
    SFLOCKER: "順豐站／智能櫃 (SF Station/Locker)",
    hk_post: "香港郵政智易取 (HK Post iPostal)",
    HKPOST: "香港郵政智易取 (HK Post iPostal)",
    sf_direct: "順豐速遞 (直送) (SF Direct)",
    SFDIRECT: "順豐速遞 (直送) (SF Direct)",
    home_delivery: "宅配直送 (Home Delivery)",
    HOME: "宅配直送 (Home Delivery)",
    pickup: "門市自取 (In-store Pickup)",
    PICKUP: "門市自取 (In-store Pickup)",
    standard: "標準配送 (Standard Shipping)"
  },
  en: {
    sf_locker: "SF Station / Locker",
    SFLOCKER: "SF Station / Locker",
    hk_post: "HK Post iPostal",
    HKPOST: "HK Post iPostal",
    sf_direct: "SF Express (Direct)",
    SFDIRECT: "SF Express (Direct)",
    home_delivery: "Home Delivery",
    HOME: "Home Delivery",
    pickup: "In-store Pickup",
    PICKUP: "In-store Pickup",
    standard: "Standard Shipping"
  }
};

/**
 * 格式化地址為字串 (強化版：確保地址不為空)
 */
export function formatAddress(addr: any): string {
  if (!addr || typeof addr !== 'object') return "";
  
  const parts: string[] = [];
  
  // 1. 處理單位細節
  let unitParts: string[] = [];
  if (addr.flat) unitParts.push(`Flat ${addr.flat}`);
  if (addr.floor) unitParts.push(`${addr.floor}/F`);
  if (addr.block) unitParts.push(`Block ${addr.block}`);
  
  if (unitParts.length > 0) parts.push(unitParts.join(", "));

  // 2. 處理建築與街道
  if (addr.building) parts.push(String(addr.building));
  if (addr.street) parts.push(String(addr.street));

  // 3. 處理行政區劃
  const regionParts: string[] = [];
  if (addr.subDistrict) regionParts.push(SUB_DISTRICT_NAME_MAP[addr.subDistrict] || String(addr.subDistrict));
  if (addr.district) regionParts.push(DISTRICT_NAME_MAP[addr.district] || String(addr.district));
  if (addr.area) regionParts.push(AREA_NAME_MAP[addr.area] || String(addr.area));
  
  if (regionParts.length > 0) {
    parts.push(regionParts.filter(Boolean).join(", "));
  }

  // 4. 國家
  if (addr.country && addr.country !== "Hong Kong") parts.push(String(addr.country));

  const result = parts.filter(p => p && p.trim() !== "").join("<br/>");
  return result || "---";
}

/**
 * 生成產品明細 HTML 表格 (用於電郵)
 * 已優化：自動過濾 isInternalGift 項目，不顯示於給客人的電郵中。
 */
export function generateItemsTable(items: any[], lang: string): string {
  if (!items || !Array.isArray(items) || items.length === 0) return "No items";
  const isEn = lang === 'en';
  
  // 核心過濾：隱藏內部贈品
  const visibleItems = items.filter(it => !it.isInternalGift);
  if (visibleItems.length === 0) return "";

  const rows = visibleItems.map(item => {
    const itemPrice = Number(item.price) || 0;
    const itemQty = Number(item.qty) || 0;
    const itemDiscount = Number(item.discount || 0);
    const itemAdjustment = Number(item.adjustment || 0);
    
    // 計算單項最終金額
    const discountAmountPerUnit = item.discountType === 'percent' ? (itemPrice * itemDiscount / 100) : itemDiscount;
    const finalPrice = ((itemPrice - discountAmountPerUnit) * itemQty) + itemAdjustment;

    return `
      <tr>
        <td style="padding: 12px 10px; border-bottom: 1px solid #edf2f7; font-size: 13px; vertical-align: top;">
          <div style="font-weight: bold; color: #1a202c;">${String(item.name || "--")}</div>
          <div style="font-size: 10px; color: #a0aec0; margin-top: 2px;">SKU: ${String(item.sku || "--")}</div>
        </td>
        <td style="padding: 12px 10px; border-bottom: 1px solid #edf2f7; text-align: center; font-size: 13px; vertical-align: top; color: #4a5568;">${itemQty}</td>
        <td style="padding: 12px 10px; border-bottom: 1px solid #edf2f7; text-align: right; font-size: 13px; font-weight: 900; vertical-align: top; color: #1a202c;">$${finalPrice.toFixed(1)}</td>
      </tr>
    `;
  }).join('');

  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin: 10px 0;">
      <thead style="background-color: #f8fafc;">
        <tr>
          <th align="left" style="padding: 10px; font-size: 11px; font-weight: 900; color: #718096; text-transform: uppercase; border-bottom: 2px solid #e2e8f0;">${isEn ? 'Item' : '貨品'}</th>
          <th align="center" style="padding: 10px; font-size: 11px; font-weight: 900; color: #718096; text-transform: uppercase; border-bottom: 2px solid #e2e8f0;">${isEn ? 'Qty' : '數量'}</th>
          <th align="right" style="padding: 10px; font-size: 11px; font-weight: 900; color: #718096; text-transform: uppercase; border-bottom: 2px solid #e2e8f0;">${isEn ? 'Total' : '金額'}</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

/**
 * 生成純文字產品列表 (用於站內通知/WhatsApp)
 */
export function generateItemsTextList(items: any[], lang: string): string {
  if (!items || !Array.isArray(items)) return "";
  const visibleItems = items.filter(it => !it.isInternalGift);
  return visibleItems.map(it => `- ${it.name} x${it.qty}`).join("\n");
}

/**
 * 強化版變數替換引擎 - 支援 {{key}} 與 {{{key}}}
 */
export function replaceVariables(text: any, context: Record<string, any>): string {
  if (typeof text !== 'string') return "";
  // 核心修正：更強韌的 Regex，確保能正確處理 {{{三括號}}}
  return text.replace(/\{\{\{?([^{}]+)\}\}\}?/g, (match, key) => {
    const cleanKey = key.trim();
    if (context[cleanKey] !== undefined && context[cleanKey] !== null) {
      return String(context[cleanKey]);
    }
    return match; 
  });
}

/**
 * 生成全方位通知上下文 - 修正時區對齊與變數補全
 */
export function getNotificationContext(data: any, genConfig: any, lang: any): Record<string, any> {
  const langStr = String(lang || 'zh-HK').toLowerCase();
  const isEn = langStr.startsWith('en');
  const lKey = isEn ? 'en' : 'zh';
  const tz = genConfig?.timezone || 'Asia/Hong_Kong';
  
  // 1. 運送方式解析
  let resolvedMethodName = data.shippingMethodName || "";
  if (!resolvedMethodName || resolvedMethodName === data.shippingMethodId || resolvedMethodName.startsWith('method_')) {
    const methodId = String(data.shippingMethodId || "");
    const map = SHIPPING_METHOD_MAP[lKey] || SHIPPING_METHOD_MAP["zh"];
    resolvedMethodName = map[methodId] || map[methodId.toUpperCase()] || data.shippingMethodName || "標準配送";
  }

  // 2. 自取點解析
  let pickupLocation = data.pickupLocation || "--";
  if (data.selectedPoint) {
    pickupLocation = isEn ? (data.selectedPoint.name_en || data.selectedPoint.name_zh) : (data.selectedPoint.name_zh || data.selectedPoint.name_en);
    if (data.selectedPoint.code) pickupLocation = `[${data.selectedPoint.code}] ${pickupLocation}`;
  }

  // 3. 日期解析
  let orderDate = "--";
  try {
    const rawDate = data.createdAt;
    const d = rawDate && rawDate.toDate ? rawDate.toDate() : 
            rawDate && rawDate.seconds ? new Date(rawDate.seconds * 1000) : 
            (rawDate instanceof Date ? rawDate : new Date());
    orderDate = d.toLocaleString('zh-HK', { timeZone: tz });
  } catch (e) {
    orderDate = new Date().toLocaleString('zh-HK', { timeZone: tz });
  }

  // 4. 金額總結
  const subtotalValue = Number(data.subtotal || 0);
  const shippingFeeValue = Number(data.shippingFee || 0);
  const discountValue = (Number(data.orderDiscount || 0) + Number(data.couponDiscount || 0) + Number(data.pointsUsedValue || 0) + Number(data.discountAmount || 0));
  const totalValue = Number(data.total || (subtotalValue + shippingFeeValue - discountValue));

  return {
    orderId: String(data.orderId || data.id || "--"),
    orderDate: orderDate,
    customerName: String(data.customerName || data.customerInfo?.name || data.displayName || data.customer?.name || "Customer"),
    customerEmail: String(data.customerInfo?.email || data.email || ""),
    customerPhone: String(data.customerInfo?.phone || data.phone || ""),
    subtotal: subtotalValue.toFixed(1),
    shippingFee: shippingFeeValue.toFixed(1),
    discountAmount: discountValue.toFixed(1),
    totalAmount: totalValue.toFixed(1),
    shippingMethod: String(resolvedMethodName),
    trackingNo: String(data.trackingNo || (isEn ? "Awaiting Dispatch" : "待發貨")),
    pickupLocation: String(pickupLocation),
    shippingAddress: formatAddress(data.shippingAddress || data.billingAddress),
    billingAddress: formatAddress(data.billingAddress || data.shippingAddress),
    itemsTable: generateItemsTable(data.items || [], langStr),
    itemsList: generateItemsTextList(data.items || [], langStr),
    storeName: String(genConfig?.storeName?.[lKey] || "SHOP POINT"),
    supportEmail: String(genConfig?.storeEmail || "info@shoppoint.hk"),
    supportPhone: String(genConfig?.storePhone || "+852 5325 2555"),
    currentYear: new Date().getFullYear(),
    productName: String(data.productName || ""),
    newTier: String(data.newTier || ""),
    couponCode: String(data.couponCode || ""),
    lang: lKey
  };
}
