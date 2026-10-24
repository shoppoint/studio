import { replaceVariables } from "./context-helpers";

/**
 * @fileOverview 電郵渲染引擎 (Template Renderer) - 完整組件支持版 (V3)
 * 修正：新增訂單狀態進度條 (order_status_tracker) 渲染邏輯。
 */

const LABELS: Record<string, Record<string, string>> = {
  zh: {
    order_id: "訂單編號",
    date: "訂單日期",
    summary: "訂單結算摘要",
    subtotal: "貨品小計",
    shipping: "運費",
    discounts: "優惠扣減",
    total: "應付總額",
    method: "運送方式",
    tracking: "物流單號",
    pickup_point: "取貨地點",
    shipping_addr: "收貨地址 Shipping Address",
    billing_addr: "賬單地址 Billing Address",
    customer_info: "顧客資訊",
    item: "產品項目",
    qty: "數量",
    price: "金額",
    points_reward: "獲得積分",
    status_placed: "已下單",
    status_processing: "配貨中",
    status_shipped: "已發貨",
    status_delivered: "已完成"
  },
  en: {
    order_id: "Order ID",
    date: "Order Date",
    summary: "Order Summary",
    subtotal: "Subtotal",
    shipping: "Shipping",
    discounts: "Discounts",
    total: "Total Amount",
    method: "Shipping Method",
    tracking: "Tracking No.",
    pickup_point: "Pickup Point",
    shipping_addr: "Shipping Address",
    billing_addr: "Billing Address",
    customer_info: "Customer Info",
    item: "Item",
    qty: "Qty",
    price: "Subtotal",
    points_reward: "Points Earned",
    status_placed: "Placed",
    status_processing: "Processing",
    status_shipped: "Shipped",
    status_delivered: "Delivered"
  }
};

export function renderEmailHtml(blocks: any[], context: Record<string, any>): string {
  const langKey = context.lang === 'en' ? 'en' : 'zh';
  const labels = LABELS[langKey] || LABELS["zh"];
  const content = Array.isArray(blocks) ? blocks.map(block => renderBlock(block, context, labels)).join('') : "";
  
  return `
    <!DOCTYPE html>
    <html lang="${langKey === 'en' ? 'en' : 'zh-HK'}">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1a202c; margin: 0; padding: 0; background-color: #f7fafc; }
          .container { width: 100%; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; border: 1px solid #e2e8f0; }
          .inner { padding: 35px 25px; }
          img { max-width: 100%; height: auto; display: block; }
          a { text-decoration: none; color: #f59e0b; font-weight: bold; }
          table { border-collapse: collapse; }
        </style>
      </head>
      <body>
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f7fafc; padding: 30px 0;">
          <tr>
            <td>
              <table class="container" cellpadding="0" cellspacing="0" border="0" align="center" style="background-color: #ffffff;">
                <tr>
                  <td>
                    <div class="inner">
                      ${content}
                    </div>
                    <div style="padding: 40px 25px; text-align: center; border-top: 1px dashed #e2e8f0; background-color: #f8fafc; color: #a0aec0; font-size: 11px;">
                      <p style="margin: 0 0 5px 0;">&copy; ${context.currentYear} ${context.storeName}. All rights reserved.</p>
                      <p style="margin: 0;">SHOP POINT Limited - 穿梭世界各地尋找優質良品</p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

function renderBlock(block: any, context: Record<string, any>, labels: any): string {
  const { type, data } = block;
  if (!data) return "";

  const baseUrl = "https://shoppoint.hk";
  const wrap = (html: string) => `<div style="margin-bottom: 30px;">${html}</div>`;
  
  const ensureAbsolute = (url: any) => {
    if (!url || typeof url !== 'string') return "";
    if (url.startsWith('http')) return url;
    return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  switch (type) {
    case 'logo':
      const align = data.align === 'center' ? 'center' : 'left';
      return wrap(`<div style="text-align: ${align};"><img src="${ensureAbsolute(data.url || "/logo.png")}" style="max-height: 50px; display: inline-block;" alt="Store Logo"></div>`);

    case 'hero':
      return wrap(`<img src="${ensureAbsolute(data.url)}" style="width: 100%; border-radius: 20px; box-shadow: 0 4px 10px rgba(0,0,0,0.05);" alt="Banner">`);

    case 'text':
      return wrap(`
        ${data.title ? `<h2 style="font-size: 24px; font-weight: 900; color: #1a202c; margin: 0 0 15px 0; letter-spacing: -0.5px;">${replaceVariables(data.title, context)}</h2>` : ""}
        <div style="font-size: 15px; color: #4a5568; line-height: 1.8;">${replaceVariables(data.content || data.msg || "", context)}</div>
      `);

    case 'order_status_tracker':
      const status = context.fulfillmentStatus || "pending";
      const isPickup = context.isPickup;
      
      let step = 1;
      if (['processing', 'reserved'].includes(status)) step = 2;
      if (['shipped', 'ready_pickup'].includes(status)) step = 3;
      if (['delivered', 'picked_up', 'completed'].includes(status)) step = 4;
      if (status === 'cancelled') step = 0;

      const getColor = (s: number) => step >= s ? "#f59e0b" : "#e2e8f0";
      const getTxtColor = (s: number) => step >= s ? "#000000" : "#a0aec0";

      return wrap(`
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
          <tr>
            <td align="center" style="width: 25%;">
              <div style="width: 12px; height: 12px; border-radius: 50%; background-color: ${getColor(1)}; margin-bottom: 8px;"></div>
              <div style="font-size: 10px; font-weight: 900; color: ${getTxtColor(1)}; text-transform: uppercase;">${labels.status_placed}</div>
            </td>
            <td style="padding-top: 5px;"><div style="height: 2px; background-color: ${getColor(2)};"></div></td>
            <td align="center" style="width: 25%;">
              <div style="width: 12px; height: 12px; border-radius: 50%; background-color: ${getColor(2)}; margin-bottom: 8px;"></div>
              <div style="font-size: 10px; font-weight: 900; color: ${getTxtColor(2)}; text-transform: uppercase;">${labels.status_processing}</div>
            </td>
            <td style="padding-top: 5px;"><div style="height: 2px; background-color: ${getColor(3)};"></div></td>
            <td align="center" style="width: 25%;">
              <div style="width: 12px; height: 12px; border-radius: 50%; background-color: ${getColor(3)}; margin-bottom: 8px;"></div>
              <div style="font-size: 10px; font-weight: 900; color: ${getTxtColor(3)}; text-transform: uppercase;">${isPickup ? "待取貨" : labels.status_shipped}</div>
            </td>
            <td style="padding-top: 5px;"><div style="height: 2px; background-color: ${getColor(4)};"></div></td>
            <td align="center" style="width: 25%;">
              <div style="width: 12px; height: 12px; border-radius: 50%; background-color: ${getColor(4)}; margin-bottom: 8px;"></div>
              <div style="font-size: 10px; font-weight: 900; color: ${getTxtColor(4)}; text-transform: uppercase;">${labels.status_delivered}</div>
            </td>
          </tr>
        </table>
      `);

    case 'order_meta':
      return wrap(`
        <table width="100%" cellpadding="15" cellspacing="0" style="background-color: #f8fafc; border-radius: 16px; border: 1px solid #edf2f7;">
          <tr>
            <td>
              <p style="margin: 0; font-size: 10px; font-weight: 900; color: #a0aec0; text-transform: uppercase; letter-spacing: 1px;">${labels.order_id}</p>
              <p style="margin: 4px 0 0 0; font-size: 20px; font-weight: 900; color: #1a202c;">${context.orderId}</p>
            </td>
            <td align="right">
              <p style="margin: 0; font-size: 10px; font-weight: 900; color: #a0aec0; text-transform: uppercase; letter-spacing: 1px;">${labels.date}</p>
              <p style="margin: 4px 0 0 0; font-size: 15px; font-weight: 700; color: #4a5568;">${context.orderDate}</p>
            </td>
          </tr>
        </table>
      `);

    case 'order_summary':
      return wrap(`
        <table width="100%" cellpadding="25" cellspacing="0" style="background-color: #f9fafb; border-radius: 24px; border: 1px solid #e2e8f0;">
          <tr>
            <td>
              <p style="margin: 0 0 20px 0; font-size: 12px; font-weight: 900; color: #a0aec0; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1px solid #edf2f7; padding-bottom: 10px;">${labels.summary}</p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 8px 0; font-size: 15px; color: #4a5568;">${labels.subtotal}</td>
                  <td align="right" style="padding: 8px 0; font-size: 15px; font-weight: bold;">$${context.subtotal}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 15px; color: #4a5568;">${labels.shipping}</td>
                  <td align="right" style="padding: 8px 0; font-size: 15px; font-weight: bold;">$${context.shippingFee}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-size: 15px; color: #e53e3e;">${labels.discounts}</td>
                  <td align="right" style="padding: 8px 0; font-size: 15px; font-weight: bold; color: #e53e3e;">-$${context.discountAmount}</td>
                </tr>
                <tr><td colspan="2" style="padding: 15px 0; border-bottom: 1px dashed #cbd5e0;"></td></tr>
                <tr>
                  <td style="padding: 20px 0 0 0; font-size: 18px; font-weight: 900; color: #1a202c; text-transform: uppercase;">${labels.total}</td>
                  <td align="right" style="padding: 20px 0 0 0; font-size: 32px; font-weight: 900; color: #f59e0b;">$${context.totalAmount}</td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      `);

    case 'shipping_address':
    case 'billing_address':
      const isShipping = type === 'shipping_address';
      const addrValue = isShipping ? context.shippingAddress : context.billingAddress;
      if (!addrValue) return "";
      return wrap(`
        <div style="padding: 25px; border: 1.5px dashed #e2e8f0; border-radius: 20px; background-color: #ffffff;">
          <p style="margin: 0 0 10px 0; font-size: 11px; font-weight: 900; color: #f59e0b; text-transform: uppercase; letter-spacing: 1px;">${isShipping ? labels.shipping_addr : labels.billing_addr}</p>
          <p style="margin: 0; font-size: 15px; font-weight: bold; color: #1a202c; line-height: 1.7;">${addrValue}</p>
        </div>
      `);

    case 'customer_details':
      return wrap(`
        <div style="padding: 20px; background-color: #f7fafc; border-radius: 16px; border: 1px solid #edf2f7;">
          <p style="margin: 0 0 10px 0; font-size: 10px; font-weight: 900; color: #718096; text-transform: uppercase;">${labels.customer_info}</p>
          <p style="margin: 0; font-size: 16px; font-weight: bold; color: #1a202c;">${context.customerName}</p>
          <p style="margin: 5px 0 0 0; font-size: 13px; color: #4a5568;">${context.customerEmail} • ${context.customerPhone}</p>
        </div>
      `);

    case 'shipping_details':
      return wrap(`
        <table width="100%" cellpadding="18" cellspacing="0" style="background-color: #f8fafc; border-radius: 16px; border: 1px solid #e2e8f0;">
          <tr>
            <td>
              <p style="margin: 0; font-size: 10px; font-weight: 900; color: #a0aec0; text-transform: uppercase;">${labels.method}</p>
              <p style="margin: 4px 0 0 0; font-size: 15px; font-weight: 800; color: #2d3748;">${context.shippingMethod}</p>
            </td>
            <td align="right">
              <p style="margin: 0; font-size: 10px; font-weight: 900; color: #a0aec0; text-transform: uppercase;">${labels.tracking}</p>
              <p style="margin: 4px 0 0 0; font-size: 15px; font-weight: 800; font-family: monospace; color: #f59e0b;">${context.trackingNo}</p>
            </td>
          </tr>
        </table>
      `);

    case 'pickup_point':
      return wrap(`
        <div style="padding: 20px; background-color: #fffaf0; border-radius: 16px; border: 1.5px solid #feebc8;">
          <p style="margin: 0 0 8px 0; font-size: 10px; font-weight: 900; color: #dd6b20; text-transform: uppercase;">${labels.pickup_point}</p>
          <p style="margin: 0; font-size: 14px; font-weight: 800; color: #2d3748;">${context.pickupLocation}</p>
        </div>
      `);

    case 'membership_upgrade':
      return wrap(`
        <div style="padding: 40px 20px; text-align: center; background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); border-radius: 24px; color: #fff; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);">
           <p style="margin: 0; font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px;">CONGRATULATIONS</p>
           <h2 style="margin: 10px 0; font-size: 32px; font-weight: 900; text-transform: uppercase;">Tier Upgrade!</h2>
           <p style="margin: 0; font-size: 18px; font-weight: bold;">New Tier: ${context.newTier}</p>
           <p style="margin: 15px 0 0 0; font-size: 13px; opacity: 0.8;">${replaceVariables(data.msg || "", context)}</p>
        </div>
      `);

    case 'stock_notice':
      return wrap(`
        <div style="padding: 30px; background-color: #eff6ff; border-radius: 24px; border: 2px solid #bee3f8; text-align: center;">
          <p style="margin: 0 0 10px 0; font-size: 11px; font-weight: 900; color: #1e40af; text-transform: uppercase; letter-spacing: 2px;">${labels.back_in_stock}</p>
          <h3 style="margin: 0 0 10px 0; font-size: 22px; font-weight: 900; color: #2d3748;">${context.productName}</h3>
          <p style="margin: 0; font-size: 14px; color: #1e3a8a; line-height: 1.6;">${replaceVariables(data.msg || "", context)}</p>
        </div>
      `);

    case 'abandoned_cart':
      return wrap(`
        <div style="padding: 30px; background-color: #fff1f2; border-radius: 24px; border: 2px solid #fecdd3; text-align: center;">
          <p style="margin: 0 0 10px 0; font-size: 11px; font-weight: 900; color: #9f1239; text-transform: uppercase; letter-spacing: 2px;">Don't forget your items!</p>
          <p style="margin: 0 0 20px 0; font-size: 14px; color: #881337; font-weight: bold;">${replaceVariables(data.msg || "", context)}</p>
          <div style="background-color: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #feb2b2;">
            ${context.itemsTable}
          </div>
        </div>
      `);

    case 'products':
      return wrap(`
        <p style="font-size: 11px; font-weight: 900; color: #a0aec0; text-transform: uppercase; margin-bottom: 12px; letter-spacing: 1px;">${labels.item} DETAILS</p>
        <div style="border: 1px solid #edf2f7; border-radius: 18px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.02);">
          ${context.itemsTable}
        </div>
      `);

    case 'button':
      return wrap(`
        <div style="text-align: center; padding: 15px 0;">
          <a href="${replaceVariables(data.url, context)}" style="display: inline-block; padding: 20px 50px; background-color: #f59e0b; color: #000000; font-size: 17px; font-weight: 900; border-radius: 18px; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 10px 15px -3px rgba(250, 204, 21, 0.3);">
            ${replaceVariables(data.label, context)}
          </a>
        </div>
      `);

    case 'coupon':
      return wrap(`
        <div style="padding: 30px; border: 3px dashed #f59e0b; border-radius: 20px; background-color: #fffdf2; text-align: center;">
          <p style="margin: 0; font-size: 11px; font-weight: 900; color: #b45309; text-transform: uppercase; letter-spacing: 2px;">Exclusive Offer</p>
          <h2 style="margin: 10px 0; font-size: 36px; font-weight: 900; color: #f59e0b;">${data.discount || "SPECIAL GIFT"}</h2>
          <div style="background-color: #ffffff; display: inline-block; padding: 12px 30px; border-radius: 10px; border: 1px solid #fcd34d; font-family: monospace; font-size: 24px; font-weight: 900; letter-spacing: 4px; color: #1a202c;">
            ${context.couponCode}
          </div>
          <p style="margin: 15px 0 0 0; font-size: 11px; color: #718096; font-style: italic;">Enter this code at checkout to enjoy the discount.</p>
        </div>
      `);

    case 'social_links':
      return wrap(`
        <div style="text-align: center; padding: 20px 0;">
          <p style="font-size: 10px; font-weight: 900; color: #a0aec0; text-transform: uppercase; margin-bottom: 15px; letter-spacing: 1px;">Stay Connected</p>
          <div style="font-size: 0;">
            <a href="https://facebook.com/shoppoint.hk" style="margin: 0 10px;"><img src="${baseUrl}/icons/fb.png" width="24" height="24" style="display:inline-block;" alt="FB"></a>
            <a href="https://instagram.com/shoppoint.hk" style="margin: 0 10px;"><img src="${baseUrl}/icons/ig.png" width="24" height="24" style="display:inline-block;" alt="IG"></a>
          </div>
        </div>
      `);

    default:
      return "";
  }
}
