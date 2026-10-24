/**
 * @fileOverview 核心自動化處理中心 (V22.5 最終狀態守衛版)
 * 修正：徹底解決 Webhook 恢復「已退款/已取消」訂單的問題。
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
 * 邏輯：接收外部支付訊號，並實施嚴格的狀態守衛。
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
      
      // 1. 冪等性檢查：已經付款則忽略
      if (data.paymentStatus === 'paid') {
        return res.status(200).send("ALREADY_PAID");
      }

      // 2. 核心狀態守衛：攔截已手動退款或取消的訂單
      // 這是解決您提到的「狀態回彈」問題的關鍵
      const isTerminated = data.status === 'cancelled' || data.paymentStatus === 'refunded';
      
      if (isTerminated) {
        const logEntry = `\n[${timestamp}] [Yedpay Webhook] 收到付款訊號 (Status: ${status})，但已被系統攔截。原因：該訂單目前處於最終狀態 (${data.status}/${data.paymentStatus})，防止自動恢復。`;
        await orderRef.update({ 
          internalNotes: (data.internalNotes || "") + logEntry,
          updatedAt: FieldValue.serverTimestamp()
        });
        return res.status(200).send("ORDER_ALREADY_TERMINATED");
      }

      // 3. 正常付款流程：更新為已付款
      const logEntry = `\n[${timestamp}] [Yedpay Webhook] 成功接收付款訊號 (Status: ${status})。`;
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

// 其餘 handleOrderUpdate 保持不變...
exports.handleOrderCreated = onDocumentCreated({ document: "orders/{orderId}", database: DB_NAME, region: REGION }, async (event) => { /* ... */ });
exports.handleOrderUpdate = onDocumentUpdated({ document: "orders/{orderId}", database: DB_NAME, region: REGION }, async (event) => { /* ... */ });
