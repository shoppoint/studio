
'use server';

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, query, where, limit, getDocs, doc, getDoc } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

/**
 * @fileOverview 訪客訂單追蹤 (具名資料庫鎖定版)
 * 修正：強制指定資料庫名稱為 "shoppoint-hk"，解決 Server Action 預設讀取 (default) 的問題。
 */

function getInternalDb() {
  const apps = getApps();
  // 確保使用 Client SDK 以 API Key 方式連線，避免 Token 刷新 500 錯誤
  const app = apps.length === 0 ? initializeApp(firebaseConfig) : apps[0];
  // 強制鎖定專案的具名資料庫
  return getFirestore(app, "shoppoint-hk");
}

export async function lookupOrderAction(orderId: string, identifier: string) {
  const db = getInternalDb();
  const cleanId = orderId.trim();
  const cleanIdentifier = identifier.trim().toLowerCase();

  try {
    if (!cleanId || !cleanIdentifier) {
      return { success: false, message: "Missing required fields." };
    }

    // 1. 優先策略：直接按文件 ID 查詢 (不受索引延遲影響的最快路徑)
    const docRef = doc(db, 'orders', cleanId);
    const docSnap = await getDoc(docRef);

    let orderData: any = null;
    let orderDocId = "";

    if (docSnap.exists()) {
      orderData = docSnap.data();
      orderDocId = docSnap.id;
    } else {
      // 備援策略：如果 ID 不匹配文件 ID，則搜尋 orderId 欄位
      const ordersRef = collection(db, 'orders');
      const q = query(ordersRef, where('orderId', '==', cleanId), limit(1));
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        orderData = snap.docs[0].data();
        orderDocId = snap.docs[0].id;
      }
    }

    if (!orderData) {
      console.log(`[Lookup] Order ${cleanId} not found in shoppoint-hk database.`);
      return { success: false, message: "Order not found." };
    }

    // 2. 身分驗證：加強型匹配 (處理空格與格式)
    const dbEmail = String(orderData.customerInfo?.email || orderData.email || "").toLowerCase().trim();
    
    // 清洗電話號碼：只保留數字以進行匹配
    const dbPhoneClean = String(orderData.customerInfo?.phone || orderData.phone || "").replace(/\D/g, "");
    const inputCleaned = cleanIdentifier.replace(/\D/g, "");

    const isEmailMatch = dbEmail === cleanIdentifier;
    // 如果輸入的是電話，且資料庫電話包含輸入的數字序列（例如輸入 91234567 匹配 +852 91234567）
    const isPhoneMatch = inputCleaned.length >= 8 && dbPhoneClean.includes(inputCleaned);

    if (!isEmailMatch && !isPhoneMatch) {
      console.log(`[Lookup] Identity mismatch for order ${cleanId}. Input: ${cleanIdentifier}`);
      return { success: false, message: "Identity mismatch." };
    }

    // 3. 回傳安全脫敏的資料
    return {
      success: true,
      order: {
        orderId: orderData.orderId || orderDocId,
        status: orderData.status,
        fulfillmentStatus: orderData.fulfillmentStatus,
        paymentStatus: orderData.paymentStatus,
        createdAt: orderData.createdAt?.seconds ? new Date(orderData.createdAt.seconds * 1000).toISOString() : null,
        items: (orderData.items || []).map((it: any) => ({
          name: it.name,
          qty: it.qty,
          price: it.price,
          image: it.image,
          sku: it.sku || ""
        })),
        total: orderData.total,
        shippingMethodName: orderData.shippingMethodName,
        trackingNo: orderData.trackingNo || null,
        isPickup: orderData.isPickup,
        selectedPoint: orderData.selectedPoint ? {
          name_zh: orderData.selectedPoint.name_zh,
          name_en: orderData.selectedPoint.name_en,
          address_zh: orderData.selectedPoint.address_zh,
          address_en: orderData.selectedPoint.address_en
        } : null
      }
    };

  } catch (error: any) {
    console.error("[Lookup Action] Error:", error.message);
    return { success: false, message: "System error. Please try later." };
  }
}
