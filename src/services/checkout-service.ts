'use client';

import { 
  Firestore, 
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
  limit
} from 'firebase/firestore';
import { format } from "date-fns";

/**
 * @fileOverview 結帳輔助服務 (實時效期校對版)
 */

/**
 * 核心：實時效期感知庫存檢查 (Real-time Expiry-aware Pre-flight Check)
 * 邏輯：
 * 1. 抓取網店預設履行地點 (Default Hub)。
 * 2. 針對所有 Deny 政策的貨品，重新抓取最新的 Batches。
 * 3. 僅求和「未過期」的批次數量。
 */
export async function validateStockAvailability(db: Firestore, items: any[]): Promise<string[]> {
  const issues: string[] = [];
  const todayStr = format(new Date(), "yyyy-MM-dd");

  try {
    // 1. 獲取網店預設出貨點 ID
    const locQuery = query(collection(db, 'locations'), where('isDefaultFulfillmentSource', '==', true), limit(1));
    const locSnap = await getDocs(locQuery);
    const defaultHubId = locSnap.empty ? null : locSnap.docs[0].id;

    if (!defaultHubId) {
      console.warn("[Stock Validation] No default fulfillment source found.");
      return [];
    }

    // 2. 獲取產品 ID 列表
    const itemIds = items.map((it: any) => it.id).filter(Boolean);
    if (itemIds.length === 0) return [];

    // 3. 實時抓取最新產品資料 (Bypass Cache)
    const productPromises = itemIds.map(id => getDoc(doc(db, 'public_products', id)));
    const snaps = await Promise.all(productPromises);

    snaps.forEach((snap) => {
      if (!snap.exists()) return;
      const pData = snap.data();
      const cartItem = items.find((it: any) => it.id === snap.id);
      
      // 只有「拒絕超賣」的貨品需要強校驗
      if (cartItem && pData.inventoryPolicy === 'Deny') {
        const batches = Array.isArray(pData.batches) ? pData.batches : [];
        
        // 關鍵：動態計算未過期且在該地點的實體總和
        const sellable = batches
          .filter((b: any) => b.locationId === defaultHubId && (!b.expiryDate || b.expiryDate >= todayStr))
          .reduce((sum: number, b: any) => sum + (Number(b.quantity) || 0), 0);
          
        if (sellable < cartItem.qty) {
          issues.push(pData.productName_zh || cartItem.name);
        }
      }
    });
  } catch (e) {
    console.error("[Stock Validation Error]", e);
  }
  return issues;
}

/**
 * 原有的 processOrderSubmission 已在 Checkout 頁面被 submitOrderAction 取代。
 */
export async function processOrderSubmission(db: any, data: any) {
  throw new Error("Deprecated: Use submitOrderAction from @/app/actions/checkout-actions instead.");
}
