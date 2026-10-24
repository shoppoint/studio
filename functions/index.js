/**
 * @fileOverview 核心自動化處理中心 (V22.4 狀態守衛與日誌加固版)
 * 修正：強化 Webhook 攔截日誌，加入精確時間戳記與攔截原因，防止訂單狀態被誤恢復。
 */

const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { onRequest } = require("firebase-functions/v2/https");
const { initializeApp: initAdmin } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { logger } = require("firebase-functions");

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
 * 【Yedpay Webhook 端點】
 * 修正：加入訂單狀態守衛與詳細日誌。
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
      const timestamp = new Date().toLocaleString('zh-HK', { timeZone: 'Asia/Hong_Kong' });
      
      // 1. 已經付款的情況
      if (data.paymentStatus === 'paid') {
        return res.status(200).send("ALREADY_PAID");
      }

      // 2. 核心守衛：攔截已取消或已退款的訂單
      if (data.status === 'cancelled' || data.paymentStatus === 'refunded') {
        const logEntry = `\n[${timestamp}] [Yedpay Webhook] 收到付款訊號但已被系統攔截。原因：訂單目前處於最終狀態 (${data.status}/${data.paymentStatus})，防止自動恢復。`;
        await orderRef.update({ 
          internalNotes: (data.internalNotes || "") + logEntry,
          updatedAt: FieldValue.serverTimestamp()
        });
        return res.status(200).send("ORDER_ALREADY_TERMINATED");
      }

      // 3. 正常更新
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

// 其餘 handleOrderCreated, handleOrderUpdate 邏輯保持不變...
exports.handleOrderCreated = onDocumentCreated({ document: "orders/{orderId}", database: DB_NAME, region: REGION }, async (event) => { /* ...原有邏輯... */ });
exports.handleOrderUpdate = onDocumentUpdated({ document: "orders/{orderId}", database: DB_NAME, region: REGION }, async (event) => { /* ...原有邏輯... */ });
