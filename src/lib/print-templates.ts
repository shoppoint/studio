/**
 * @fileOverview POS & Order Management Print Templates - A4 Invoice Optimized (V7 - Global Analytics Pro)
 */

import { format } from "date-fns";
import { 
  AREA_NAME_MAP, 
  DISTRICT_NAME_MAP, 
  SUB_DISTRICT_NAME_MAP,
  COUNTRY_NAME_MAP
} from "./address-data";

const PAYMENT_BILINGUAL_MAP: Record<string, string> = {
  visa: "信用卡 Credit Card (Visa/Master)",
  alipay: "支付寶 AlipayHK",
  wechat: "微信支付 WeChat Pay",
  fps: "轉數快 FPS",
  payme: "PayMe",
  octopus: "八達通 Octopus",
  bank: "銀行轉帳 Bank Transfer",
  pay_in_store: "到店付款 Pay In-store",
  cash: "現金 Cash",
  credits_redemption: "積分/現金券全額抵扣 Credits Redemption",
  kpay_visa: "KPay - Visa/Master",
  kpay_alipay: "KPay - AlipayHK",
  kpay_wechat: "KPay - WeChat Pay",
  kpay_octopus: "KPay - Octopus",
  kpay_payme: "KPay - PayMe"
};

const SHIPPING_BILINGUAL_MAP: Record<string, string> = {
  sf_locker: "順豐站／智能櫃 SF Station / Locker",
  hk_post: "香港郵政智易取 HK Post iPostal",
  sf_direct: "順豐速遞 (直送) SF Express (Direct)",
  home_delivery: "宅配直送 Home Delivery",
  pickup: "門市自取 In-store Pickup",
  intl_express: "國際快遞 International Express",
  sf_macau: "順豐速遞 (澳門) SF Express (Macau)",
  sf_taiwan: "順豐速遞 (台灣) SF Express (Taiwan)",
  sf_china: "順豐速遞 (內地) SF Express (Mainland)"
};

/**
 * 格式化地址物件為四行 HTML
 */
function formatA4AddressLines(addr: any) {
  if (!addr) return "---";
  const lines: string[] = [];

  const line1Parts = [];
  if (addr.flat) line1Parts.push(`Flat ${addr.flat}`);
  if (addr.floor) line1Parts.push(`${addr.floor}/F`);
  if (addr.block) line1Parts.push(`Block ${addr.block}`);
  if (line1Parts.length > 0) lines.push(line1Parts.join(", "));

  if (addr.building) lines.push(addr.building);
  if (addr.street) lines.push(addr.street);

  const line4Parts = [];
  if (addr.subDistrict) line4Parts.push(SUB_DISTRICT_NAME_MAP[addr.subDistrict] || addr.subDistrict);
  if (addr.district) line4Parts.push(DISTRICT_NAME_MAP[addr.district] || addr.district);
  if (addr.area) line4Parts.push(AREA_NAME_MAP[addr.area] || addr.area);
  if (addr.country) line4Parts.push(COUNTRY_NAME_MAP[addr.country] || addr.country);
  if (line4Parts.length > 0) lines.push(line4Parts.join(", "));

  return lines.join("<br/>");
}

/**
 * 生成訂單發票或裝箱單 HTML (A4) - 全中英對照版
 */
export function generateOrderDocHtml(type: 'invoice' | 'packing_slip', order: any, items: any[], subtotal: number, shippingFee: number, total: number) {
  const orderDate = order.createdAt?.seconds ? new Date(order.createdAt.seconds * 1000) : new Date();
  const formattedDate = format(orderDate, "yyyy-MM-dd");
  const logoUrl = "/logo.png";

  const itemsHtml = items.map(it => {
    const originalPrice = Number(it.price) || 0;
    const discValue = Number(it.discount) || 0;
    const discountAmountPerUnit = it.discountType === 'percent' ? (originalPrice * discValue / 100) : discValue;
    const salePrice = originalPrice - discountAmountPerUnit;
    const rowTotal = (salePrice * Number(it.qty)) + (Number(it.adjustment) || 0);
    
    return `
      <tr style="break-inside: avoid;">
        <td style="padding: 12px 0; border-bottom: 1px solid #eee; font-size: 13px; font-weight: 600; color: #1a1a1a;">${it.name}</td>
        <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: center; font-size: 13px; color: #666;">$${originalPrice.toFixed(1)}</td>
        <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: center; font-size: 13px; font-weight: 900; color: #1a1a1a;">$${salePrice.toFixed(1)}</td>
        <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: center; font-size: 13px;">${it.qty}</td>
        <td style="padding: 12px 0; border-bottom: 1px solid #eee; text-align: right; font-size: 14px; font-weight: 900; color: #000;">$${rowTotal.toFixed(1)}</td>
      </tr>
    `;
  }).join('');

  // 核心計算：折扣差額 = (產品原始總價 + 運費) - 客戶實際支付總額
  const totalDiscounts = Math.max(0, (Number(subtotal) + Number(shippingFee)) - Number(total));
  
  const methodId = order.shippingMethodId || "";
  const shippingMethodBilingual = SHIPPING_BILINGUAL_MAP[methodId] || order.shippingMethodName || "標準配送 Standard Shipping";
  const paymentMethodBilingual = PAYMENT_BILINGUAL_MAP[order.paymentMethod?.toLowerCase()] || order.paymentMethod?.toUpperCase() || "CASH";

  return `
    <!DOCTYPE html>
    <html style="color-scheme: light; background-color: white !important;">
      <head>
        <meta charset="utf-8">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&family=Noto+Sans+HK:wght@400;500;700;900&display=swap');
          * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          html, body { margin: 0; padding: 0; width: 210mm; min-height: 297mm; background-color: white !important; color: #1a1a1a !important; }
          body { 
            font-family: 'Inter', 'Noto Sans HK', sans-serif; 
            background: white !important;
            margin: 0 auto;
          }
          
          .a4-container { width: 210mm; min-height: 297mm; position: relative; }
          
          .header-wrapper { padding: 15mm 15mm 2mm 15mm; }
          .content-wrapper { padding: 0 15mm; padding-bottom: 40mm; }

          .header-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
          .brand-box { display: flex; align-items: center; gap: 15px; }
          .logo { height: 44px; width: auto; }
          .brand-text { font-size: 22px; font-weight: 900; letter-spacing: -1px; }
          .brand-url { font-size: 10px; color: #666; font-weight: 500; display: block; }
          .doc-type { font-size: 38px; font-weight: 900; letter-spacing: -2px; text-transform: uppercase; margin: 0; color: #000; }
          .header-line { border-bottom: 3px solid #000; margin-bottom: 15px; }

          .meta-section { margin-bottom: 12px; font-size: 13px; font-weight: 700; color: #1a1a1a; line-height: 1.4; display: flex; justify-content: space-between; }
          
          .address-grid { display: flex; gap: 40px; margin-bottom: 30px; }
          .address-box { flex: 1; }
          .address-box h4 { font-size: 9px; font-weight: 900; text-transform: uppercase; color: #777; border-bottom: 1px solid #f0f0f0; padding-bottom: 4px; margin-bottom: 10px; letter-spacing: 0.5px; }
          .address-box h2 { font-size: 18px; font-weight: 900; margin: 0 0 8px 0; }
          .address-content { font-size: 12px; line-height: 1.5; color: #333; font-weight: 500; min-height: 70px; }
          .address-contact { font-size: 11px; margin-top: 8px; font-weight: 600; color: #444; }

          .items-table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
          .items-table th { 
            text-align: left; padding: 10px 0; border-top: 2px solid #000; border-bottom: 1px solid #000; 
            font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; 
          }
          
          .summary-section { display: flex; justify-content: space-between; margin-top: 15px; align-items: flex-start; }
          .info-col { width: 52%; }
          .info-block { margin-bottom: 20px; }
          .info-block h4 { font-size: 9px; font-weight: 900; text-transform: uppercase; color: #000; margin-bottom: 6px; letter-spacing: 0.5px; opacity: 0.7; }
          .info-block p { font-size: 11px; font-weight: 700; margin: 0; color: #1a1a1a; }

          .summary-box { width: 300px; background: #f9fafb; border-radius: 20px; padding: 20px; border: 1px solid #f0f0f0; }
          .sum-item { display: flex; justify-content: space-between; font-size: 13px; font-weight: 700; margin-bottom: 8px; color: #555; }
          .sum-item.discount { color: #e53e3e; }
          .sum-item.total { border-top: 2px solid #000; margin-top: 12px; padding-top: 12px; font-size: 22px; font-weight: 900; color: #000; }
          
          .thank-you { text-align: center; margin: 40px 0 20px 0; font-size: 16px; font-weight: 900; color: #1a1a1a; }

          .footer-container { 
            position: fixed;
            bottom: 0;
            left: 0;
            width: 210mm;
            height: 90px;
            z-index: 1000;
          }
          .footer-bar { 
            background-color: #f2eae1; 
            padding: 18px 40px; 
            width: 100%; 
            height: 100%;
            position: relative;
            overflow: hidden;
          }
          .footer-bar:after {
            content: "";
            position: absolute;
            right: 0;
            top: 0;
            bottom: 0;
            width: 32%;
            background-color: #1a1a1a;
            clip-path: polygon(20% 0, 100% 0, 100% 100%, 0% 100%);
          }
          .footer-row { display: flex; gap: 40px; margin-bottom: 5px; position: relative; z-index: 10; }
          .footer-item { font-size: 10px; font-weight: 600; color: #333; }
          .footer-item b { font-weight: 900; color: #000; }
          .footer-address-line { font-size: 10px; font-weight: 600; color: #333; margin-top: 1px; text-align: left; position: relative; z-index: 10; }

          @media print {
            @page { size: A4; margin: 0; }
            body { margin: 0 auto; width: 210mm; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="a4-container">
          <div class="header-wrapper">
            <div class="header-top">
              <div class="brand-box">
                <img src="${logoUrl}" class="logo" />
                <div>
                  <div class="brand-text">SHOP POINT</div>
                  <div class="brand-url">https://shoppoint.hk</div>
                </div>
              </div>
              <h1 class="doc-type">INVOICE</h1>
            </div>
            <div class="header-line"></div>
            <div class="meta-section">
              <div style="font-weight: 900;">訂單編號 ORDER# : ${order.orderId || order.id}</div>
              <div style="font-weight: 900;">日期 DATE: ${formattedDate}</div>
            </div>
          </div>

          <div class="content-wrapper">
            <div class="address-grid">
              <div class="address-box">
                <h4>賬單地址 BILLING ADDRESS:</h4>
                <h2>${order.customerInfo?.name || "顧客"}</h2>
                <div class="address-content">${formatA4AddressLines(order.billingAddress || order.shippingAddress)}</div>
                <div class="address-contact">
                  <div><b>電郵 EMAIL :</b> ${order.customerInfo?.email || "--"}</div>
                  <div><b>電話 PHONE :</b> ${order.customerInfo?.phone || "--"}</div>
                </div>
              </div>
              <div class="address-box">
                <h4>收貨地址 SHIPPING ADDRESS:</h4>
                <h2>${order.customerInfo?.name || "顧客"}</h2>
                <div class="address-content">${formatA4AddressLines(order.shippingAddress)}</div>
                <div class="address-contact">
                  <div><b>電郵 EMAIL :</b> ${order.customerInfo?.email || "--"}</div>
                  <div><b>電話 PHONE :</b> ${order.customerInfo?.phone || "--"}</div>
                </div>
              </div>
            </div>

            <table class="items-table">
              <thead>
                <tr>
                  <th style="width: 45%;">產品項目 PRODUCT</th>
                  <th style="text-align: center; width: 15%;">原價 LIST PRICE</th>
                  <th style="text-align: center; width: 15%;">特價 SALE PRICE</th>
                  <th style="text-align: center; width: 10%;">數量 QTY</th>
                  <th style="text-align: right; width: 15%;">合計 TOTAL</th>
                </tr>
              </thead>
              <tbody>${itemsHtml}</tbody>
            </table>

            <div class="summary-section">
              <div class="info-col">
                <div className="info-block">
                  <h4>配送詳情 LOGISTICS</h4>
                  <p>${shippingMethodBilingual}</p>
                </div>
                <div className="info-block">
                  <h4>付款方式及條款 PAYMENT & TERMS</h4>
                  <p>${paymentMethodBilingual}</p>
                </div>
              </div>
              <div class="summary-box">
                <div class="sum-item">
                  <span>小計 SUBTOTAL</span>
                  <span>$${Number(subtotal).toFixed(1)}</span>
                </div>
                <div class="sum-item">
                  <span>運費 SHIPPING</span>
                  <span>$${Number(shippingFee).toFixed(1)}</span>
                </div>
                ${totalDiscounts > 0.1 ? `
                  <div class="sum-item discount">
                    <span>優惠扣減 DISCOUNT</span>
                    <span>-$${totalDiscounts.toFixed(1)}</span>
                  </div>
                ` : ''}
                <div class="sum-item total">
                  <span>總額 TOTAL</span>
                  <span>$${Number(total).toFixed(1)}</span>
                </div>
              </div>
            </div>

            <div class="thank-you">
              感謝您的惠顧！ Thank you for your purchase!
            </div>
          </div>

          <div class="footer-container">
            <div class="footer-bar">
              <div class="footer-row">
                <div class="footer-item"><b>PHONE.</b> +852 5325-2555 (WhatsApp Only)</div>
                <div class="footer-item"><b>EMAIL.</b> info@shoppoint.hk</div>
              </div>
              <div class="footer-address-line">
                <b>ADDRESS.</b> 香港新界屯門青菱徑3號時尚電腦城地庫B17號舖
              </div>
              <div class="footer-address-line">
                B17, Basement, U-Town Shopping Arcade, 3 Tsing Ling Path, Tuen Mun, N.T. Hong Kong
              </div>
            </div>
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 800);
          };
        </script>
      </body>
    </html>
  `;
}

/**
 * 生成感熱收據 HTML (針對 80mm/76mm 熱感打印機優化 - V5 完整版)
 */
export function generateReceiptHtml(order: any) {
  const visibleItems = (order.items || []).filter((it: any) => !it.isInternalGift);
  const totalQty = visibleItems.reduce((acc: number, it: any) => acc + it.qty, 0);
  const subtotal = Number(order.subtotal || 0);
  const total = Number(order.total || 0);
  const discountAmount = Math.max(0, subtotal - total);
  
  const dateStr = order.createdAt?.seconds 
    ? format(new Date(order.createdAt.seconds * 1000), 'yyyy-MM-dd HH:mm:ss') 
    : format(new Date(), 'yyyy-MM-dd HH:mm:ss');

  const itemsHtml = visibleItems.map((it: any) => {
    const price = Number(it.price) || 0;
    const disc = it.discountType === 'percent' ? (price * (Number(it.discount) || 0) / 100) : (Number(it.discount) || 0);
    const finalRowTotal = ((price - disc) * it.qty) + (Number(it.adjustment) || 0);
    
    return `
      <tr>
        <td style="padding: 6px 0; font-size: 13px; line-height: 1.2; vertical-align: top; word-break: break-word;">${it.name}</td>
        <td align="center" style="padding: 6px 4px; font-size: 13px; vertical-align: top;">${it.qty}</td>
        <td align="right" style="padding: 6px 0; font-size: 13px; font-weight: bold; vertical-align: top; white-space: nowrap;">$ ${finalRowTotal.toFixed(1)}</td>
      </tr>
    `;
  }).join('');

  return `
    <!DOCTYPE html>
    <html style="color-scheme: light !important; background-color: white !important;">
      <head>
        <meta charset="utf-8">
        <title>Receipt ${order.orderId || order.id}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
          * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          html, body { background-color: white !important; color: black !important; }
          body { width: 76mm; margin: 0; padding: 0; font-family: 'Inter', sans-serif; }
          .receipt-container { width: 76mm; padding: 6mm; background-color: white !important; }
          .center { text-align: center; }
          .logo { width: 20mm; margin-bottom: 5px; }
          .shop-name { font-size: 20px; font-weight: 900; letter-spacing: -1px; }
          .divider { border-top: 1.5px solid #000; margin: 10px 0; }
          .divider-dashed { border-top: 1px dashed #666; margin: 8px 0; }
          table { width: 100%; border-collapse: collapse; }
          .table-header { font-size: 10px; font-weight: 900; text-transform: uppercase; border-bottom: 1px solid #000; padding-bottom: 4px; }
          .summary-row { display: flex; justify-content: space-between; font-size: 13px; font-weight: 600; margin-bottom: 4px; }
          .total-row { display: flex; justify-content: space-between; align-items: center; margin-top: 8px; padding-top: 8px; border-top: 2px solid #000; }
          .total-label { font-size: 16px; font-weight: 900; }
          .total-amount { font-size: 24px; font-weight: 900; }
          .footer-info { font-size: 10px; color: #333; line-height: 1.4; margin-top: 15px; text-align: center; }
          .thank-you { font-size: 14px; font-weight: 900; margin: 20px 0 10px 0; }
          @media print { @page { margin: 0; size: auto; } body { background-color: white !important; } }
        </style>
      </head>
      <body>
        <div class="receipt-container">
          <div class="center">
            <img src="/logo.png" class="logo" />
            <div class="shop-name">SHOP POINT</div>
            <div style="font-size: 10px; font-weight: 800; margin-top: 2px;">SALES RECEIPT 銷售單據</div>
          </div>
          
          <div class="divider"></div>
          
          <div style="font-size: 12px; font-weight: 700;">單號 Order #: ${order.orderId || order.id}</div>
          <div style="font-size: 12px; font-weight: 700;">日期 Date: ${dateStr}</div>
          
          <div class="divider"></div>
          
          <table>
            <thead>
              <tr class="table-header">
                <th align="left" style="padding-bottom: 4px;">貨品 Items</th>
                <th align="center" style="padding-bottom: 4px;">數量 Qty</th>
                <th align="right" style="padding-bottom: 4px;">價格 Price</th>
              </tr>
            </thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          
          <div class="divider-dashed"></div>
          
          <div class="summary-row">
            <span>項目數量 Total Items:</span>
            <span>${totalQty}</span>
          </div>
          <div class="summary-row">
            <span>貨品小計 Subtotal:</span>
            <span>$ ${subtotal.toFixed(1)}</span>
          </div>
          ${discountAmount > 0.1 ? `
            <div class="summary-row" style="color: #000;">
              <span>折扣優惠 Discounts:</span>
              <span>-$ ${discountAmount.toFixed(1)}</span>
            </div>
          ` : ''}
          
          <div class="total-row">
            <span class="total-label">總數 TOTAL</span>
            <span class="total-amount">$ ${total.toFixed(1)}</span>
          </div>
          
          <div class="center thank-you">
            感謝您的惠顧！<br/>Thank you for your purchase!
          </div>
          
          <div class="divider-dashed"></div>
          
          <div class="footer-info">
            <div style="font-weight: 900; margin-bottom: 4px;">聯絡與支援 Contact & Support:</div>
            <div>WhatsApp: +852 5325-2555</div>
            <div>Email: info@shoppoint.hk</div>
            <div>Web: https://shoppoint.hk</div>
            <div style="margin-top: 8px; font-weight: 700;">
              新界屯門青菱徑3號時尚電腦城地庫B17<br/>
              B17, Basement, U-Town Arcade, Tuen Mun
            </div>
          </div>
        </div>
        <script>
          window.onload = function() { 
            setTimeout(function() {
              window.print();
            }, 600);
          };
        </script>
      </body>
    </html>
  `;
}

/**
 * 生成 POS 銷售統計報表 HTML (A4 格式 - 專業加固版)
 */
export function generateReportHtml(data: any, dateRange: string, locationName: string) {
  const itemRows = Object.entries(data.itemMap || {}).map(([name, qty]) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee; font-size: 13px; color: #333;">${name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; font-size: 13px; text-align: right; font-weight: 900;">x ${qty}</td>
    </tr>
  `).join('');

  const orderRows = (data.orderList || []).map((o: any) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee; font-size: 11px; font-family: monospace;">#${o.orderId}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; font-size: 11px; color: #666;">${o.time}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; font-size: 11px; text-transform: uppercase; font-weight: 700;">${o.method}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; font-size: 11px; text-align: right; color: #e53e3e;">-$${o.discount.toFixed(1)}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; font-size: 12px; text-align: right; font-weight: 900;">$${o.total.toFixed(1)}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html style="color-scheme: light;">
      <head>
        <meta charset="utf-8">
        <title>POS Sales Report - ${locationName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
          body { font-family: 'Inter', sans-serif; padding: 50px; color: #1a1a1a; background-color: white; line-height: 1.5; }
          .header { text-align: center; border-bottom: 5px solid #FACC15; padding-bottom: 30px; margin-bottom: 30px; }
          .logo { height: 60px; margin-bottom: 15px; }
          .report-title { font-size: 28px; font-weight: 900; letter-spacing: -1px; margin: 0; }
          .meta-info { font-size: 12px; color: #666; font-weight: 600; margin-top: 10px; }
          
          .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin: 30px 0; }
          .stat-card { background: #f8f9fa; padding: 25px; border-radius: 24px; text-align: center; border: 1px solid #eee; }
          .stat-card h3 { font-size: 24px; font-weight: 900; margin: 0; color: #000; }
          .stat-card p { font-size: 10px; font-weight: 900; text-transform: uppercase; color: #718096; margin-top: 5px; letter-spacing: 1px; }

          .payout-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin-bottom: 40px; }
          .payout-box { background: #fff; border: 2px solid #f0f0f0; border-radius: 20px; padding: 20px; }
          .payout-row { display: flex; justify-content: space-between; font-size: 13px; font-weight: 700; padding: 8px 0; border-bottom: 1px solid #f7f7f7; }
          .payout-row:last-child { border-bottom: none; }
          .section-title { font-size: 12px; font-weight: 900; text-transform: uppercase; color: #FACC15; margin-bottom: 15px; letter-spacing: 1px; }

          table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
          th { text-align: left; padding: 12px 10px; background: #fafafa; border-bottom: 2px solid #000; font-size: 11px; font-weight: 900; text-transform: uppercase; }
          
          .footer { text-align: center; font-size: 10px; color: #a0aec0; margin-top: 50px; border-top: 1px dashed #eee; padding-top: 20px; }
          
          @media print { @page { size: A4; margin: 15mm; } body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="/logo.png" class="logo" />
          <h1 class="report-title">POS 門市銷售統計報表</h1>
          <div class="meta-info">
            分店: <b>${locationName}</b> | 期間: <b>${dateRange}</b>
          </div>
        </div>

        <div class="summary-grid">
          <div class="stat-card"><h3>${data.count}</h3><p>總成交單數</p></div>
          <div class="stat-card" style="border-color: #FACC15;"><h3>$ ${data.total.toLocaleString()}</h3><p>總營業額 (GROSS)</p></div>
          <div class="stat-card"><h3>$ ${(data.count > 0 ? data.total / data.count : 0).toFixed(1)}</h3><p>平均客單價 (AOV)</p></div>
        </div>

        <div class="payout-grid">
          <div class="payout-box">
            <h4 class="section-title">支付方式細分 PAYOUTS</h4>
            <div class="payout-row"><span>現金 Cash:</span><span>$ ${data.cash.toFixed(1)}</span></div>
            <div class="payout-row"><span>八達通 Octopus:</span><span>$ ${data.octopus.toFixed(1)}</span></div>
            <div class="payout-row"><span>PayMe:</span><span>$ ${data.payme.toFixed(1)}</span></div>
            <div class="payout-row" style="color: #3182ce;"><span>KPay 刷卡匯總:</span><span>$ ${data.kpayTotal.toFixed(1)}</span></div>
          </div>
          <div class="payout-box">
             <h4 class="section-title">銷量排行 TOP ITEMS</h4>
             <div style="max-height: 180px; overflow: hidden;">
               ${Object.entries(data.itemMap || {}).slice(0, 5).map(([name, qty]) => `
                 <div class="payout-row"><span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 180px;">${name}</span><span>x${qty}</span></div>
               `).join('')}
             </div>
          </div>
        </div>

        <h4 class="section-title">交易明細列表 ORDER DETAILS</h4>
        <table>
          <thead>
            <tr>
              <th>單號 ID</th>
              <th>時間 TIME</th>
              <th>支付方法 METHOD</th>
              <th style="text-align:right;">折扣 DISC.</th>
              <th style="text-align:right;">金額 TOTAL</th>
            </tr>
          </thead>
          <tbody>${orderRows}</tbody>
        </table>

        <div class="footer">
          此報表由 SHOP POINT POS 系統自動生成於 ${new Date().toLocaleString()}<br/>
          https://shoppoint.hk
        </div>

        <script>window.onload = function() { setTimeout(function(){ window.print(); }, 800); };</script>
      </body>
    </html>
  `;
}

/**
 * 生成全通路詳細會計對帳報表 HTML (A4 格式 - 最終強化版 V3)
 */
export function generateDetailedAccountingReportHtml(data: any, dateRange: string) {
  // 生成支付方式匯總
  const paymentRows = Object.entries(data.paymentSummary || {})
    .filter(([_, val]) => (val as number) > 0)
    .map(([method, val]) => `
      <div style="padding: 10px 15px; border-bottom: 1px solid #f0f0f0; display: flex; justify-content: space-between; font-size: 12px;">
        <span style="font-weight: 700; text-transform: uppercase; color: #4a5568;">${PAYMENT_BILINGUAL_MAP[method.toLowerCase()] || method}</span>
        <span style="font-weight: 900; color: #1a1a1a;">$ ${(val as number).toFixed(1)}</span>
      </div>
    `).join('');

  // 生成產品銷量排行
  const productRows = Object.entries(data.productSummary || {})
    .sort((a: any, b: any) => b[1] - a[1])
    .slice(0, 20)
    .map(([name, qty]) => `
      <tr>
        <td style="padding: 8px 10px; border-bottom: 1px solid #f7f7f7; font-size: 11px;">${name}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #f7f7f7; font-size: 11px; text-align: right; font-weight: 900;">${qty}</td>
      </tr>
    `).join('');

  // 生成分組訂單表格
  const renderOrderTable = (title: string, list: any[]) => {
    if (!list || list.length === 0) return `<p style="font-size: 11px; color: #999; font-style: italic; margin-bottom: 30px;">-- 此渠道暫無交易 --</p>`;
    
    const rows = list.map(o => `
      <tr>
        <td style="padding: 8px 10px; border-bottom: 1px solid #eee; font-size: 10px; font-family: monospace;">#${o.orderId}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #eee; font-size: 10px;">${o.date}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #eee; font-size: 10px; font-weight: 700;">${o.name}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #eee; font-size: 10px; text-transform: uppercase;">${o.method}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #eee; font-size: 11px; text-align: right; font-weight: 900;">$${o.total.toFixed(1)}</td>
      </tr>
    `).join('');

    return `
      <div style="margin-bottom: 35px;">
        <h4 style="font-size: 11px; font-weight: 900; text-transform: uppercase; color: #2d3748; background: #edf2f7; padding: 6px 12px; border-radius: 8px; margin-bottom: 10px;">${title} 交易明細 (${list.length})</h4>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="text-align: left; background: #fafafa;">
              <th style="padding: 8px 10px; font-size: 9px; font-weight: 900; border-bottom: 1px solid #000;">單號 ID</th>
              <th style="padding: 8px 10px; font-size: 9px; font-weight: 900; border-bottom: 1px solid #000;">日期 DATE</th>
              <th style="padding: 8px 10px; font-size: 9px; font-weight: 900; border-bottom: 1px solid #000;">顧客 CUSTOMER</th>
              <th style="padding: 8px 10px; font-size: 9px; font-weight: 900; border-bottom: 1px solid #000;">支付方式</th>
              <th style="padding: 8px 10px; font-size: 9px; font-weight: 900; border-bottom: 1px solid #000; text-align: right;">成交金額</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  };

  const channelSummaryBoxes = Object.entries(data.channelSummary || {}).map(([channel, stats]: [string, any]) => `
    <div style="flex: 1; padding: 15px; background: #f8fafc; border-radius: 20px; border: 1px solid #e2e8f0; text-align: center;">
      <p style="margin: 0; font-size: 9px; font-weight: 900; text-transform: uppercase; color: #64748b; letter-spacing: 1px;">${channel} 渠道</p>
      <p style="margin: 5px 0 0 0; font-size: 18px; font-weight: 900; color: #1a1a1a;">$ ${stats.amount.toLocaleString()}</p>
      <p style="margin: 2px 0 0 0; font-size: 9px; font-weight: 700; color: #94a3b8;">${stats.count} 筆訂單</p>
    </div>
  `).join('');

  return `
    <!DOCTYPE html>
    <html style="color-scheme: light;">
      <head>
        <meta charset="utf-8">
        <title>Global Accounting Report - SHOP POINT</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
          body { font-family: 'Inter', sans-serif; padding: 25mm 15mm; color: #1a1a1a; background-color: white; }
          .header { text-align: center; border-bottom: 4px solid #FACC15; padding-bottom: 20px; margin-bottom: 30px; }
          .logo { height: 44px; margin-bottom: 8px; }
          
          .summary-cards { display: flex; gap: 15px; margin-bottom: 25px; }
          .stat-card { flex: 1; background: #1a1a1a; color: white; padding: 20px; border-radius: 20px; text-align: center; }
          .stat-card h3 { font-size: 24px; font-weight: 900; margin: 0; color: #FACC15; }
          .stat-card p { font-size: 9px; font-weight: 900; text-transform: uppercase; margin-top: 5px; opacity: 0.7; }
          
          .section-title { font-size: 12px; font-weight: 900; text-transform: uppercase; border-left: 4px solid #FACC15; padding-left: 10px; margin: 35px 0 15px 0; }
          
          .analytics-grid { display: flex; gap: 20px; margin-bottom: 30px; }
          .analytics-box { flex: 1; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; }
          .analytics-header { background: #f8fafc; padding: 10px 15px; border-bottom: 1px solid #e2e8f0; font-size: 10px; font-weight: 900; text-transform: uppercase; }

          @media print { @page { size: A4; margin: 0; } body { padding: 15mm; } }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="/logo.png" class="logo" />
          <h1 style="font-size: 22px; font-weight: 900; margin: 0;">全通路營運會計對帳報表</h1>
          <p style="font-size: 11px; color: #666; margin-top: 4px;">期間 Period: <b>${dateRange}</b></p>
        </div>

        <div class="summary-cards">
          <div class="stat-card"><h3>$ ${data.totalGmv.toLocaleString()}</h3><p>總成交額 (GMV)</p></div>
          <div class="stat-card"><h3>$ ${data.totalDiscount.toLocaleString()}</h3><p>總折扣扣減 (Disc.)</p></div>
          <div class="stat-card"><h3>$ ${data.aov.toFixed(1)}</h3><p>平均客單價 (AOV)</p></div>
        </div>

        <div class="section-title">渠道營收匯總 CHANNEL PERFORMANCE</div>
        <div style="display: flex; gap: 12px;">${channelSummaryBoxes}</div>

        <div class="analytics-grid">
          <div class="analytics-box">
             <div class="analytics-header">支付工具清算統計 PAYMENT METHODS</div>
             <div>${paymentRows}</div>
          </div>
          <div class="analytics-box">
             <div class="analytics-header">產品銷量排行榜 TOP SELLING ITEMS</div>
             <table style="width: 100%; border-collapse: collapse;">
                <tbody>${productRows}</tbody>
             </table>
          </div>
        </div>

        <div class="section-title">分組交易明細 TRANSACTION LEDGER</div>
        ${renderOrderTable("網店渠道 WEB ORDERS", data.groupedOrders.Web)}
        ${renderOrderTable("實體門市 POS ORDERS", data.groupedOrders.POS)}
        ${renderOrderTable("後台手動 MANUAL ORDERS", data.groupedOrders.Manual)}

        <div style="text-align: center; font-size: 9px; color: #94a3b8; margin-top: 40px; border-top: 1px dashed #e2e8f0; padding-top: 20px;">
          此報表由 SHOP POINT ERP 系統證明於 ${new Date().toLocaleString()}<br/>
          https://shoppoint.hk
        </div>

        <script>window.onload = function() { setTimeout(function(){ window.print(); }, 1000); };</script>
      </body>
    </html>
  `;
}

/**
 * 生成商家結算發票 HTML (A4)
 */
export function generateVendorPayoutInvoiceHtml(data: any) {
  const itemRows = data.items.map((o: any) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">#${o.id}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${o.date}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;">${o.productName}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${o.qty}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${o.lineTotal.toFixed(1)}</td>
    </tr>
  `).join('');

  return `
    <!DOCTYPE html>
    <html style="color-scheme: light;">
      <head><meta charset="utf-8"><style>body { font-family: sans-serif; padding: 40px; background-color: white; } table { width: 100%; border-collapse: collapse; }</style></head>
      <body>
        <div style="text-align: center; border-bottom: 5px solid #FACC15; padding-bottom: 20px;">
          <h1>銷售報表</h1>
          <p>商家: ${data.vendorName} | 期間: ${data.dateRange}</p>
        </div>
        <div style="margin: 30px 0; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px;">
          <div style="background: #f8f9fa; padding: 20px; text-align: center;"><h3>$ ${data.gross.toLocaleString()}</h3><p>銷售總額</p></div>
          <div style="background: #fff5f5; padding: 20px; text-align: center;"><h3>-$ ${data.commissionAmount.toLocaleString()}</h3><p>佣金 (${data.commissionRate}%)</p></div>
          <div style="background: #f0fdf4; padding: 20px; text-align: center;"><h3>$ ${data.net.toLocaleString()}</h3><p>應付商家</p></div>
        </div>
        <table>
          <thead><tr><th>單號</th><th>日期</th><th>產品</th><th>數量</th><th style="text-align:right;">合計</th></tr></thead>
          <tbody>${itemRows}</tbody>
        </table>
        <script>window.onload = function() { setTimeout(function(){ window.print(); }, 500); };</script>
      </body>
    </html>
  `;
}
