
/**
 * @fileOverview 核心自動化處理中心 (V22.2 嚴格庫存控管版)
 * 職責：1. 扣庫存；2. 確認後發信；3. 支付成功流轉；4. 取消沖銷。
 * 修正：補齊發信時的 BCC 管理員抄送邏輯，並確保嚴格執行 Web 來源檢查。
 */

const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { onRequest } = require("firebase-functions/v2/https");
const { initializeApp: initAdmin } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { logger } = require("firebase-functions");

// 初始化 Firebase Admin
initAdmin();

const DB_NAME = "shoppoint-hk";
const REGION = "asia-east1";

function getDb() {
  return getFirestore(DB_NAME);
}

function findValueByKey(obj, targetKey) {
  if (!obj || typeof obj !== 'object') return undefined;
  if (obj.hasOwnProperty(targetKey)) return obj[targetKey];
  for (const key in obj) {
    if (typeof obj[key] === 'object') {
      const found = findValueByKey(obj[key], targetKey);
      if (found !== undefined) return found;
    }
  }
  return undefined;
}

/**
 * 強化版通知上下文生成器 (JavaScript 版) - 修正時區對齊與變數補全
 */
function getNotificationContext(data, genConfig, lang) {
  const isEn = String(lang || 'zh').startsWith('en');
  const lKey = isEn ? 'en' : 'zh';
  const tz = genConfig?.timezone || 'Asia/Hong_Kong';
  
  const formatAddress = (addr) => {
    if (!addr) return "";
    const parts = [];
    if (addr.flat || addr.floor || addr.block) {
      const units = [];
      if (addr.flat) units.push(`Flat ${addr.flat}`);
      if (addr.floor) units.push(`${addr.floor}/F`);
      if (addr.block) units.push(`Block ${addr.block}`);
      parts.push(units.join(", "));
    }
    if (addr.building) parts.push(addr.building);
    if (addr.street) parts.push(addr.street);
    if (addr.district || addr.area) {
      const region = [addr.subDistrict, addr.district, addr.area].filter(Boolean);
      if (region.length > 0) parts.push(region.join(", "));
    }
    if (addr.country && addr.country !== "Hong Kong") parts.push(addr.country);
    return parts.join("<br/>");
  };

  const generateItemsTable = (items) => {
    if (!items || !Array.isArray(items)) return "";
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
          <td style="padding: 12px 10px; border-bottom: 1px solid #edf2f7; text-align: center; font-size: 13px; vertical-align: top; color: #4a5568;">${q}</td>
          <td style="padding: 12px 10px; border-bottom: 1px solid #edf2f7; text-align: right; font-size: 13px; font-weight: 900; vertical-align: top; color: #1a202c;">$${total.toFixed(1)}</td>
        </tr>`;
    }).join('');

    return `
      <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin: 10px 0;">
        <thead style="background-color: #f8fafc;">
          <tr>
            <th align="left" style="padding: 10px; font-size: 11px; font-weight: 900; color: #718096; text-transform: uppercase; border-bottom: 2px solid #e2e8f0;">貨品 Item</th>
            <th align="center" style="padding: 10px; font-size: 11px; font-weight: 900; color: #718096; text-transform: uppercase; border-bottom: 2px solid #e2e8f0;">數量 Qty</th>
            <th align="right" style="padding: 10px; font-size: 11px; font-weight: 900; color: #718096; text-transform: uppercase; border-bottom: 2px solid #e2e8f0;">金額 Total</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>`;
  };

  const subtotal = Number(data.subtotal || 0);
  const shipping = Number(data.shippingFee || 0);
  const discount = Number(data.discountAmount || data.orderDiscount || 0);
  const total = Number(data.total || (subtotal + shipping - discount));

  const orderDate = data.createdAt 
    ? new Date(data.createdAt._seconds * 1000 || data.createdAt.seconds * 1000).toLocaleString('zh-HK', { timeZone: tz }) 
    : "--";

  let pickupLocation = data.pickupLocation || "--";
  if (data.selectedPoint) {
    pickupLocation = isEn ? (data.selectedPoint.name_en || data.selectedPoint.name_zh) : (data.selectedPoint.name_zh || data.selectedPoint.name_en);
    if (data.selectedPoint.code) pickupLocation = `[${data.selectedPoint.code}] ${pickupLocation}`;
  }

  return {
    orderId: data.orderId || data.id || "--",
    orderDate: orderDate,
    customerName: data.customerInfo?.name || data.customerName || "Customer",
    customerEmail: data.customerInfo?.email || data.email || "",
    customerPhone: data.customerInfo?.phone || data.phone || "",
    subtotal: subtotal.toFixed(1),
    shippingFee: shipping.toFixed(1),
    discountAmount: discount.toFixed(1),
    totalAmount: total.toFixed(1),
    shippingMethod: data.shippingMethodName || "--",
    trackingNo: data.trackingNo || (isEn ? "Pending" : "待發貨"),
    pickupLocation: pickupLocation,
    shippingAddress: formatAddress(data.shippingAddress || data.billingAddress),
    billingAddress: formatAddress(data.billingAddress || data.shippingAddress),
    itemsTable: generateItemsTable(data.items),
    storeName: genConfig?.storeName?.[lKey] || "SHOP POINT",
    currentYear: new Date().getFullYear(),
    lang: lKey
  };
}

/**
 * 強化版電郵渲染引擎 (JavaScript 版) - 增加全組件支持
 */
function renderEmailHtml(blocks, context) {
  const replace = (str) => {
    if (!str || typeof str !== 'string') return "";
    return str.replace(/\{\{\{?([^{}]+)\}\}\}?/g, (match, key) => {
      const cleanKey = key.trim();
      return context[cleanKey] !== undefined ? String(context[cleanKey]) : match;
    });
  };

  const renderedBlocks = (blocks || []).map(block => {
    const d = block.data || {};
    const t = block.type;
    
    if (t === 'logo') {
      const align = d.align === 'center' ? 'center' : 'left';
      return `<div style="text-align: ${align}; margin-bottom: 30px;"><img src="https://shoppoint.hk/logo.png" style="max-height: 50px; display: inline-block;" alt="Logo"></div>`;
    }
    if (t === 'hero') {
      return `<div style="margin-bottom: 30px;"><img src="${d.url}" style="width: 100%; border-radius: 20px; box-shadow: 0 4px 10px rgba(0,0,0,0.05);" alt="Banner"></div>`;
    }
    if (t === 'text') {
      return `<div style="margin-bottom: 30px;">
        ${d.title ? `<h2 style="font-size: 24px; font-weight: 900; color: #1a202c; margin: 0 0 15px 0; letter-spacing: -0.5px;">${replace(d.title)}</h2>` : ""}
        <div style="font-size: 15px; color: #4a5568; line-height: 1.8;">${replace(d.content || d.msg || "")}</div>
      </div>`;
    }
    if (t === 'order_meta') {
      return `<div style="margin-bottom: 30px;">
        <table width="100%" cellpadding="15" cellspacing="0" style="background-color: #f8fafc; border-radius: 16px; border: 1px solid #edf2f7;">
          <tr>
            <td>
              <p style="margin: 0; font-size: 10px; font-weight: 900; color: #a0aec0; text-transform: uppercase; letter-spacing: 1px;">ORDER#</p>
              <p style="margin: 4px 0 0 0; font-size: 20px; font-weight: 900; color: #1a202c;">${context.orderId}</p>
            </td>
            <td align="right">
              <p style="margin: 0; font-size: 10px; font-weight: 900; color: #a0aec0; text-transform: uppercase; letter-spacing: 1px;">DATE</p>
              <p style="margin: 4px 0 0 0; font-size: 15px; font-weight: 700; color: #4a5568;">${context.orderDate}</p>
            </td>
          </tr>
        </table>
      </div>`;
    }
    if (t === 'order_summary') {
      return `<div style="margin-bottom: 30px;">
        <table width="100%" cellpadding="25" cellspacing="0" style="background-color: #f9fafb; border-radius: 24px; border: 1px solid #e2e8f0;">
          <tr>
            <td>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr><td style="padding: 8px 0; font-size: 15px; color: #4a5568;">小計 Subtotal</td><td align="right" style="padding: 8px 0; font-size: 15px; font-weight: bold;">$${context.subtotal}</td></tr>
                <tr><td style="padding: 8px 0; font-size: 15px; color: #4a5568;">運費 Shipping</td><td align="right" style="padding: 8px 0; font-size: 15px; font-weight: bold;">$${context.shippingFee}</td></tr>
                <tr><td style="padding: 8px 0; font-size: 15px; color: #e53e3e;">優惠扣減 Discounts</td><td align="right" style="padding: 8px 0; font-size: 15px; font-weight: bold; color: #e53e3e;">-$${context.discountAmount}</td></tr>
                <tr><td colspan="2" style="padding: 15px 0; border-bottom: 1px dashed #cbd5e0;"></td></tr>
                <tr><td style="padding: 20px 0 0 0; font-size: 18px; font-weight: 900; color: #1a202c; text-transform: uppercase;">總額 TOTAL</td><td align="right" style="padding: 20px 0 0 0; font-size: 32px; font-weight: 900; color: #f59e0b;">$${context.totalAmount}</td></tr>
              </table>
            </td>
          </tr>
        </table>
      </div>`;
    }
    if (t === 'products') {
      return `<div style="margin-bottom: 30px; border: 1px solid #edf2f7; border-radius: 18px; overflow: hidden;">${context.itemsTable}</div>`;
    }
    if (t === 'shipping_address' || t === 'billing_address') {
      const isShip = t === 'shipping_address';
      return `<div style="margin-bottom: 30px; padding: 25px; border: 1.5px dashed #e2e8f0; border-radius: 20px;">
        <p style="margin: 0 0 10px 0; font-size: 11px; font-weight: 900; color: #f59e0b; text-transform: uppercase; letter-spacing: 1px;">${isShip ? "SHIPPING ADDRESS" : "BILLING ADDRESS"}</p>
        <p style="margin: 0; font-size: 15px; font-weight: bold; color: #1a202c; line-height: 1.7;">${isShip ? context.shippingAddress : context.billingAddress}</p>
      </div>`;
    }
    if (t === 'pickup_point') {
      return `<div style="margin-bottom: 30px; padding: 20px; background-color: #fffaf0; border-radius: 16px; border: 1.5px solid #feebc8;">
        <p style="margin: 0 0 8px 0; font-size: 10px; font-weight: 900; color: #dd6b20; text-transform: uppercase;">取貨地點 PICKUP POINT</p>
        <p style="margin: 0; font-size: 14px; font-weight: 800; color: #2d3748;">${context.pickupLocation}</p>
      </div>`;
    }
    if (t === 'customer_details') {
      return `<div style="margin-bottom: 30px; padding: 20px; background-color: #f7fafc; border-radius: 16px; border: 1px solid #edf2f7;">
        <p style="margin: 0 0 10px 0; font-size: 10px; font-weight: 900; color: #718096; text-transform: uppercase;">顧客資訊 CUSTOMER INFO</p>
        <p style="margin: 0; font-size: 16px; font-weight: bold; color: #1a202c;">${context.customerName}</p>
        <p style="margin: 5px 0 0 0; font-size: 13px; color: #4a5568;">${context.customerEmail} • ${context.customerPhone}</p>
      </div>`;
    }
    if (t === 'shipping_details') {
      return `<div style="margin-bottom: 30px;">
        <table width="100%" cellpadding="18" cellspacing="0" style="background-color: #f8fafc; border-radius: 16px; border: 1px solid #e2e8f0;">
          <tr>
            <td>
              <p style="margin: 0; font-size: 10px; font-weight: 900; color: #a0aec0; text-transform: uppercase;">運送方式 METHOD</p>
              <p style="margin: 4px 0 0 0; font-size: 15px; font-weight: 800; color: #2d3748;">${context.shippingMethod}</p>
            </td>
            <td align="right">
              <p style="margin: 0; font-size: 10px; font-weight: 900; color: #a0aec0; text-transform: uppercase;">追蹤單號 TRACKING</p>
              <p style="margin: 4px 0 0 0; font-size: 15px; font-weight: 800; font-family: monospace; color: #f59e0b;">${context.trackingNo}</p>
            </td>
          </tr>
        </table>
      </div>`;
    }
    if (t === 'button') {
      return `<div style="margin-bottom: 30px; text-align: center; padding: 15px 0;">
        <a href="${replace(d.url)}" style="display: inline-block; padding: 20px 50px; background-color: #f59e0b; color: #000000; font-size: 17px; font-weight: 900; border-radius: 18px; text-transform: uppercase; text-decoration: none;">
          ${replace(d.label)}
        </a>
      </div>`;
    }
    return "";
  }).join('');

  return `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
      <body style="font-family: sans-serif; color: #1a202c; margin: 0; padding: 0; background-color: #f7fafc;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f7fafc; padding: 30px 0;">
          <tr>
            <td>
              <table width="100%" style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; border: 1px solid #e2e8f0;" cellpadding="0" cellspacing="0" border="0" align="center">
                <tr>
                  <td style="padding: 35px 25px;">
                    ${renderedBlocks}
                    <div style="padding-top: 40px; text-align: center; border-top: 1px dashed #e2e8f0; color: #a0aec0; font-size: 11px;">
                      <p>&copy; ${context.currentYear} ${context.storeName}. All rights reserved.</p>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>`;
}

/**
 * 【1. handleOrderCreated】
 * 職責：僅執行庫存扣減。
 */
exports.handleOrderCreated = onDocumentCreated({
  document: "orders/{orderId}",
  database: DB_NAME, 
  region: REGION
}, async (event) => {
  const orderId = event.params.orderId;
  const orderData = event.data.data();
  const db = getDb();
  const todayStr = new Date(new Date().getTime() + 8 * 3600000).toISOString().split('T')[0];

  if (orderData.inventorySyncStatus === 'success') return;

  try {
    await db.runTransaction(async (transaction) => {
      let locId = orderData.fulfillmentLocationId;
      if (!locId) {
        const locationsRef = db.collection('locations').where('isDefaultFulfillmentSource', '==', true).limit(1);
        const locSnap = await transaction.get(locationsRef);
        locId = locSnap.empty ? null : locSnap.docs[0].id;
      }
      if (!locId) throw new Error("No fulfillment location assigned.");

      const locRef = db.collection('locations').doc(locId);
      const locDataSnap = await transaction.get(locRef);
      const isDefaultHub = locDataSnap.data()?.isDefaultFulfillmentSource || false;

      const items = orderData.items || [];
      const itemIds = Array.from(new Set(items.map(it => String(it.productId || it.id))));
      const productSnaps = [];
      for (const pid of itemIds) productSnaps.push(await transaction.get(db.collection('public_products').doc(pid)));

      for (let i = 0; i < itemIds.length; i++) {
        const pSnap = productSnaps[i];
        if (!pSnap.exists) continue;
        const pData = pSnap.data();
        const qtyToDeduct = items.filter(it => String(it.productId || it.id) === itemIds[i]).reduce((sum, it) => sum + (Number(it.qty) || 1), 0);
        let batches = Array.isArray(pData.batches) ? [...pData.batches] : [];
        let rem = qtyToDeduct;
        
        const validLocalBatches = batches
          .filter(b => b.locationId === locId && (!b.expiryDate || b.expiryDate >= todayStr))
          .sort((a, b) => (a.expiryDate || "9999").localeCompare(b.expiryDate || "9999"));

        for (const b of validLocalBatches) {
          if (rem <= 0) break;
          if (b.quantity > 0) {
            const d = Math.min(b.quantity, rem);
            b.quantity -= d;
            rem -= d;
          }
        }
        
        if (rem > 0) throw new Error(`Insufficient unexpired stock for ${pData.productName_zh || itemIds[i]} at ${locId}`);

        const sellableTotalStock = batches.filter(b => !b.expiryDate || b.expiryDate >= todayStr).reduce((acc, b) => acc + (Number(b.quantity) || 0), 0);
        const sellableLocStock = batches.filter(b => b.locationId === locId && (!b.expiryDate || b.expiryDate >= todayStr)).reduce((acc, b) => acc + (Number(b.quantity) || 0), 0);
        
        const updates = { batches, stock: sellableTotalStock, [`warehouseStock.${locId}`]: sellableLocStock, updatedAt: FieldValue.serverTimestamp() };
        if (isDefaultHub) updates.onlineStock = sellableLocStock;
        transaction.update(pSnap.ref, updates);
      }
      transaction.update(db.collection('orders').doc(orderId), { inventorySyncStatus: 'success', updatedAt: FieldValue.serverTimestamp() });
    });
  } catch (e) {
    logger.error(`[OrderCreated Error] ${orderId}:`, e.message);
    await db.collection('orders').doc(orderId).update({ inventorySyncStatus: 'failed', inventorySyncError: e.message });
  }
});

/**
 * 【2. handleOrderUpdate】
 */
exports.handleOrderUpdate = onDocumentUpdated({
  document: "orders/{orderId}",
  database: DB_NAME, 
  region: REGION
}, async (event) => {
  const before = event.data.before.data();
  const after = event.data.after.data();
  const orderId = event.params.orderId;
  const db = getDb();
  const todayStr = new Date(new Date().getTime() + 8 * 3600000).toISOString().split('T')[0];

  // 1. 訂單確認發信
  if (!before.isConfirmed && after.isConfirmed && after.sourceType === 'Web') {
    try {
      const { Resend } = require("resend");
      const [commSnap, genSnap, tempSnap] = await Promise.all([
        db.collection('config').doc('communication').get(), 
        db.collection('config').doc('general').get(),
        db.collection('notification_templates').doc(after.isPickup ? 'order_placed_pickup' : 'order_placed').get()
      ]);
      const commData = commSnap.data() || {};
      const apiKey = (commData.resendApiKey || "").trim().replace(/['"]/g, '');
      const recipient = after.email || after.customerInfo?.email;
      const bcc = commData.email?.bccEmail || "";

      if (apiKey && recipient) {
        const resend = new Resend(apiKey);
        const langKey = (after.lang || 'zh').startsWith('en') ? 'en' : 'zh';
        const content = tempSnap.exists ? (tempSnap.data()[langKey] || tempSnap.data()['zh'] || {}) : {};
        const context = getNotificationContext(after, genSnap.data(), langKey);
        const bccList = bcc ? [bcc] : undefined;

        await resend.emails.send({ 
          from: `"SHOP POINT" <info@shoppoint.hk>`, 
          to: [recipient], 
          bcc: bccList,
          subject: replaceVariables(content.emailSubject || "訂單成立確認", context), 
          html: renderEmailHtml(content.emailBlocks || [], context) 
        });
      }
    } catch (e) { logger.error(`[FirstEmail Error] ${orderId}:`, e.message); }
  }

  // 2. 付款成功發信
  if (before.paymentStatus !== 'paid' && after.paymentStatus === 'paid' && after.sourceType === 'Web') {
    await db.collection('orders').doc(orderId).update({ fulfillmentStatus: 'processing', updatedAt: FieldValue.serverTimestamp() });
    try {
      const { Resend } = require("resend");
      const [commSnap, genSnap, tempSnap] = await Promise.all([
        db.collection('config').doc('communication').get(), 
        db.collection('config').doc('general').get(), 
        db.collection('notification_templates').doc('order_processing').get()
      ]);
      const commData = commSnap.data() || {};
      const apiKey = (commData.resendApiKey || "").trim().replace(/['"]/g, '');
      const recipient = after.email || after.customerInfo?.email;
      const bcc = commData.email?.bccEmail || "";

      if (apiKey && recipient) {
        const resend = new Resend(apiKey);
        const langKey = (after.lang || 'zh').startsWith('en') ? 'en' : 'zh';
        const content = tempSnap.exists ? (tempSnap.data()[langKey] || tempSnap.data()['zh'] || {}) : {};
        const context = getNotificationContext(after, genSnap.data(), langKey);
        const bccList = bcc ? [bcc] : undefined;

        await resend.emails.send({ 
          from: `"SHOP POINT" <info@shoppoint.hk>`, 
          to: [recipient], 
          bcc: bccList,
          subject: replaceVariables(content.emailSubject || "付款成功通知", context), 
          html: renderEmailHtml(content.emailBlocks || [], context) 
        });
      }
    } catch (e) { logger.error(`[PaidEmail Error] ${orderId}:`, e.message); }
  }

  if (before.status !== 'cancelled' && after.status === 'cancelled' && after.inventorySyncStatus === 'success') {
    try {
      await db.runTransaction(async (transaction) => {
        const locId = after.fulfillmentLocationId; if (!locId) return;
        const items = after.items || [];
        const itemIds = Array.from(new Set(items.map(it => String(it.productId || it.id))));
        for (const pid of itemIds) {
          const pRef = db.collection('public_products').doc(pid);
          const pSnap = await transaction.get(pRef); if (!pSnap.exists) continue;
          const pData = pSnap.data();
          const qtyToReturn = items.filter(it => String(it.productId || it.id) === pid).reduce((sum, it) => sum + (Number(it.qty) || 1), 0);
          let batches = Array.isArray(pData.batches) ? [...pData.batches] : [];
          batches.push({ batchId: `REVERSE-${orderId.slice(-4)}`, quantity: qtyToReturn, locationId: locId, expiryDate: "", note: "Cancelled order rollback" });
          const sellableTotalStock = batches.filter(b => !b.expiryDate || b.expiryDate >= todayStr).reduce((acc, b) => acc + (Number(b.quantity) || 0), 0);
          const sellableLocStock = batches.filter(b => b.locationId === locId && (!b.expiryDate || b.expiryDate >= todayStr)).reduce((acc, b) => acc + (Number(b.quantity) || 0), 0);
          const updates = { batches, stock: sellableTotalStock, [`warehouseStock.${locId}`]: sellableLocStock, updatedAt: FieldValue.serverTimestamp() };
          const locData = await db.collection('locations').doc(locId).get();
          if (locData.data()?.isDefaultFulfillmentSource) updates.onlineStock = sellableLocStock;
          transaction.update(pRef, updates);
        }
        transaction.update(db.collection('orders').doc(orderId), { inventorySyncStatus: 'reversed' });
      });
    } catch (e) { logger.error(`[Reversal Error] ${orderId}:`, e.message); }
  }
});

function replaceVariables(text, context) {
  if (typeof text !== 'string') return "";
  return text.replace(/\{\{\{?([^{}]+)\}\}\}?/g, (match, key) => {
    const cleanKey = key.trim();
    return context[cleanKey] !== undefined ? String(context[cleanKey]) : match; 
  });
}

/**
 * 【Yedpay Webhook 端點】
 * 修正：加入訂單狀態守衛。若訂單已處於「已取消」或「已退款」狀態，則忽略來自網關的「已支付」覆蓋請求。
 */
exports.yedpayWebhook = onRequest({ region: REGION, cors: true }, async (req, res) => {
  let body = req.body || {};
  if (Buffer.isBuffer(body)) { try { body = JSON.parse(body.toString()); } catch (e) {} }
  const customId = findValueByKey(body, 'custom_id');
  const status = findValueByKey(body, 'status');
  
  if (customId && String(status).toLowerCase() === 'paid') {
    const db = getDb();
    const orderRef = db.collection('orders').doc(String(customId));
    const snap = await orderRef.get();
    
    if (snap.exists) {
      const data = snap.data();
      
      // 核心守衛：如果訂單已經是「已付款」，直接回傳
      if (data.paymentStatus === 'paid') {
        return res.status(200).send("ALREADY_PAID");
      }

      // 核心守衛：如果訂單已經處於「已取消」或「已退款」狀態，攔截 Webhook 的自動恢復
      if (data.status === 'cancelled' || data.paymentStatus === 'refunded') {
        const timestamp = new Date().toLocaleString('zh-HK', { timeZone: 'Asia/Hong_Kong' });
        const logEntry = `\n[${timestamp}] [Yedpay Webhook] 收到付款訊號但已攔截 (原因：訂單已處於最終狀態 ${data.status}/${data.paymentStatus})`;
        await orderRef.update({ 
          internalNotes: (data.internalNotes || "") + logEntry,
          updatedAt: FieldValue.serverTimestamp()
        });
        return res.status(200).send("ORDER_ALREADY_TERMINATED");
      }

      const timestamp = new Date().toLocaleString('zh-HK', { timeZone: 'Asia/Hong_Kong' });
      const logEntry = `\n[${timestamp}] [Yedpay Webhook] 成功接收付款訊號 (Status: ${status})`;
      
      await orderRef.update({ 
        paymentStatus: 'paid', 
        isConfirmed: true, 
        internalNotes: (data.internalNotes || "") + logEntry, 
        updatedAt: FieldValue.serverTimestamp() 
      });
      res.status(200).send("OK");
    } else {
      res.status(404).send("Order Not Found");
    }
  } else {
    res.status(200).send("Ignored");
  }
});
