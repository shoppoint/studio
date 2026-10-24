/**
 * @fileOverview 通訊系統上下文輔助工具 (Context Helpers) - 強化版
 * 修正：優化 Regex 以確保 {{{itemsTable}}} 等多層括號變數能被精確識別並替換。
 */

import { format } from "date-fns";
import { 
  AREA_NAME_MAP, 
  DISTRICT_NAME_MAP, 
  SUB_DISTRICT_NAME_MAP 
} from "../address-data";

/**
 * 運送方式名稱映射表
 */
const SHIPPING_METHOD_MAP: Record<string, Record<string, string>> = {
  zh: {
    sf_locker: "順豐站／智能櫃 (SF Station/Locker)",
    hk_post: "香港郵政智易取 (HK Post iPostal)",
    sf_direct: "順豐速遞 (直送) (SF Direct)",
    home_delivery: "宅配直送 (Home Delivery)",
    pickup: "門市自取 (In-store Pickup)",
    standard: "標準配送 (Standard Shipping)"
  },
  en: {
    sf_locker: "SF Station / Locker",
    hk_post: "HK Post iPostal",
    sf_direct: "SF Express (Direct)",
    home_delivery: "Home Delivery",
    pickup: "In-store Pickup",
    standard: "Standard Shipping"
  }
};

/**
 * 格式化地址為字串
 */
export function formatAddress(addr: any): string {
  if (!addr || typeof addr !== 'object') return "";
  const parts: string[] = [];
  let unitParts: string[] = [];
  if (addr.flat) unitParts.push(`Flat ${addr.flat}`);
  if (addr.floor) unitParts.push(`${addr.floor}/F`);
  if (addr.block) unitParts.push(`Block ${addr.block}`);
  if (unitParts.length > 0) parts.push(unitParts.join(", "));
  if (addr.building) parts.push(String(addr.building));
  if (addr.street) parts.push(String(addr.street));
  const regionParts: string[] = [];
  if (addr.subDistrict) regionParts.push(SUB_DISTRICT_NAME_MAP[addr.subDistrict] || String(addr.subDistrict));
  if (addr.district) regionParts.push(DISTRICT_NAME_MAP[addr.district] || String(addr.district));
  if (addr.area) regionParts.push(AREA_NAME_MAP[addr.area] || String(addr.area));
  if (regionParts.length > 0) parts.push(regionParts.filter(Boolean).join(", "));
  if (addr.country && addr.country !== "Hong Kong") parts.push(String(addr.country));
  return parts.filter(p => p && p.trim() !== "").join("<br/>") || "---";
}

/**
 * 生成產品明細 HTML 表格
 */
export function generateItemsTable(items: any[], lang: string): string {
  if (!items || !Array.isArray(items) || items.length === 0) return "";
  const isEn = lang === 'en';
  const visibleItems = items.filter(it => !it.isInternalGift);
  if (visibleItems.length === 0) return "";

  const rows = visibleItems.map(item => {
    const p = Number(item.price) || 0;
    const q = Number(item.qty) || 0;
    const d = item.discountType === 'percent' ? (p * (Number(item.discount) || 0) / 100) : (Number(item.discount) || 0);
    const adj = Number(item.adjustment) || 0;
    const total = ((p - d) * q) + adj;

    return `
      <tr>
        <td style="padding: 12px 10px; border-bottom: 1px solid #edf2f7; font-size: 13px; vertical-align: top;">
          <div style="font-weight: bold; color: #1a202c;">${item.name || "--"}</div>
          <div style="font-size: 10px; color: #a0aec0; margin-top: 2px;">SKU: ${item.sku || "--"}</div>
        </td>
        <td style="padding: 12px 10px; border-bottom: 1px solid #edf2f7; text-align: center; font-size: 13px;">${q}</td>
        <td style="padding: 12px 10px; border-bottom: 1px solid #edf2f7; text-align: right; font-size: 13px; font-weight: 900; color: #1a202c;">$${total.toFixed(1)}</td>
      </tr>`;
  }).join('');

  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin: 10px 0;">
      <thead style="background-color: #f8fafc;">
        <tr>
          <th align="left" style="padding: 10px; font-size: 11px; font-weight: 900; color: #718096; text-transform: uppercase;">貨品 Item</th>
          <th align="center" style="padding: 10px; font-size: 11px; font-weight: 900; color: #718096; text-transform: uppercase;">數量 Qty</th>
          <th align="right" style="padding: 10px; font-size: 11px; font-weight: 900; color: #718096; text-transform: uppercase;">金額 Total</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>`;
}

/**
 * 強化版變數替換引擎 - 修正 Regex 以同時支援 {{key}} 與 {{{key}}}
 */
export function replaceVariables(text: any, context: Record<string, any>): string {
  if (typeof text !== 'string') return "";
  // 修正 Regex: 支援雙重或三重括號，並確保正確捕捉鍵名
  return text.replace(/\{\{\{?([^{}]+?)\}\}\}?/g, (match, key) => {
    const cleanKey = key.trim();
    if (context[cleanKey] !== undefined && context[cleanKey] !== null) {
      return String(context[cleanKey]);
    }
    return match; 
  });
}

/**
 * 生成全方位通知上下文
 */
export function getNotificationContext(data: any, genConfig: any, lang: any): Record<string, any> {
  const langStr = String(lang || 'zh-HK').toLowerCase();
  const isEn = langStr.startsWith('en');
  const lKey = isEn ? 'en' : 'zh';
  const tz = genConfig?.timezone || 'Asia/Hong_Kong';
  
  const map = SHIPPING_METHOD_MAP[lKey] || SHIPPING_METHOD_MAP["zh"];
  const resolvedMethodName = map[data.shippingMethodId] || data.shippingMethodName || "標準配送";

  let pickupLocation = data.pickupLocation || "--";
  if (data.selectedPoint) {
    pickupLocation = isEn ? (data.selectedPoint.name_en || data.selectedPoint.name_zh) : (data.selectedPoint.name_zh || data.selectedPoint.name_en);
    if (data.selectedPoint.code) pickupLocation = `[${data.selectedPoint.code}] ${pickupLocation}`;
  }

  let orderDate = "--";
  try {
    const rawDate = data.createdAt;
    const d = (rawDate?.seconds) ? new Date(rawDate.seconds * 1000) : (rawDate instanceof Date ? rawDate : new Date());
    orderDate = d.toLocaleString('zh-HK', { timeZone: tz });
  } catch (e) { orderDate = new Date().toLocaleString('zh-HK', { timeZone: tz }); }

  const subtotalValue = Number(data.subtotal || 0);
  const shippingFeeValue = Number(data.shippingFee || 0);
  const discountValue = Number(data.discountAmount || data.orderDiscount || 0);
  const totalValue = Number(data.total || (subtotalValue + shippingFeeValue - discountValue));

  // 建立純文字產品清單供站內通知使用
  const itemsList = (data.items || []).filter((it: any) => !it.isInternalGift).map((it: any) => `- ${it.name} x${it.qty}`).join('\n');

  return {
    orderId: String(data.orderId || data.id || "--"),
    orderDate: orderDate,
    customerName: String(data.customerName || data.customerInfo?.name || "Customer"),
    customerEmail: String(data.customerInfo?.email || data.email || ""),
    subtotal: subtotalValue.toFixed(1),
    shippingFee: shippingFeeValue.toFixed(1),
    discountAmount: discountValue.toFixed(1),
    totalAmount: totalValue.toFixed(1),
    shippingMethod: String(resolvedMethodName),
    trackingNo: String(data.trackingNo || (isEn ? "Pending" : "待發貨")),
    pickupLocation: String(pickupLocation),
    shippingAddress: formatAddress(data.shippingAddress || data.billingAddress),
    billingAddress: formatAddress(data.billingAddress || data.shippingAddress),
    itemsTable: generateItemsTable(data.items || [], langStr),
    itemsList: itemsList,
    storeName: String(genConfig?.storeName?.[lKey] || "SHOP POINT"),
    currentYear: new Date().getFullYear(),
    lang: lKey
  };
}
