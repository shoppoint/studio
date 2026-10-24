/**
 * @fileOverview 核心自動化處理中心 (V22.8 最終狀態守衛與審計日誌版)
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
 * 實施嚴格的冪等性與狀態守衛，防止「殭屍訂單」復活。
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
      
      // 1. 冪等性檢查：已經付款則忽略，避免重複處理
      if (data.paymentStatus === 'paid') {
        return res.status(200).send("ALREADY_PAID");
      }

      // 2. 核心狀態守衛：攔截已取消、已退款或已完成的訂單
      // 防止 Webhook 將最終狀態的訂單拉回「處理中」
      const isTerminated = data.status === 'cancelled' || data.paymentStatus === 'refunded' || data.status === 'completed';
      
      if (isTerminated) {
        const logEntry = `\n[${timestamp}] [Yedpay Webhook] 收到付款成功訊號，但已被攔截。原因：訂單目前處於最終狀態 (${data.status}/${data.paymentStatus})，系統拒絕自動恢復狀態。`;
        await orderRef.update({ 
          internalNotes: (data.internalNotes || "") + logEntry,
          updatedAt: FieldValue.serverTimestamp()
        });
        return res.status(200).send("ORDER_ALREADY_TERMINATED");
      }

      // 3. 正常付款流程：更新為已付款
      const logEntry = `\n[${timestamp}] [Yedpay Webhook] 成功接收付款訊號。`;
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
