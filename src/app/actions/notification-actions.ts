'use server';

import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { triggerNotification } from '@/services/communication-service';

/**
 * @fileOverview 管理員手動通知 Action (Admin SDK 加固版)
 * 使用 Admin SDK 繞過安全性規則，解決 Server Action 權限報錯問題。
 */

function getAdminDb() {
  if (getApps().length === 0) {
    initializeApp();
  }
  // 強制使用具名資料庫
  return getFirestore("shoppoint-hk");
}

/**
 * 手動觸發特定訂單的通知電郵
 */
export async function sendManualOrderNotificationAction(orderId: string, event: string, lang: string) {
  try {
    const db = getAdminDb();
    
    if (!orderId || !event) throw new Error("Missing params");
    
    // 使用 Admin SDK 讀取訂單 (Bypass rules)
    const orderSnap = await db.collection('orders').doc(orderId).get();
    if (!orderSnap.exists) throw new Error("Order not found.");

    const orderData = orderSnap.data();
    
    // triggerNotification 已支援傳入 Admin Firestore 實例
    const res = await triggerNotification(db as any, event, {
      ...orderData,
      id: orderId,
      orderId: orderId
    }, lang, true); 

    return res;
  } catch (error: any) {
    console.error("[Manual Notification Action] Fatal Error:", error.message);
    return { success: false, message: error.message };
  }
}
