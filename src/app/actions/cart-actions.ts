
'use server';

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

/**
 * @fileOverview 購物車後端同步 Action (Client SDK 版 - 穩定模式)
 * 修正：切換至 Client SDK 以確保在生產環境中與 Checkout 流程具備相同的連線穩定度。
 */

function getInternalDb() {
  const apps = getApps();
  const app = apps.length === 0 ? initializeApp(firebaseConfig) : apps[0];
  return getFirestore(app, "shoppoint-hk");
}

interface SyncCartParams {
  cartId: string;
  items: any[];
  total: number;
  customer: {
    uid: string | null;
    name: string;
    email: string | null;
    phone: string | null;
  };
  sourcePath?: string;
}

/**
 * 伺服器端同步遺棄購物車
 * 使用 Client SDK 模式，需配合已放寬寫入權限的 firestore.rules。
 */
export async function syncAbandonedCartAction(params: SyncCartParams) {
  const { cartId, items, total, customer, sourcePath } = params;
  
  try {
    const db = getInternalDb();
    const cartRef = doc(db, 'abandoned_carts', cartId);
    
    // 檢查是否已經轉化為訂單
    const snap = await getDoc(cartRef);
    if (snap.exists() && snap.data()?.status === 'recovered') {
      return { success: true, message: "Cart already recovered" };
    }

    // 執行寫入
    await setDoc(cartRef, {
      items,
      total: Number(total) || 0,
      status: snap.exists() ? (snap.data()?.status || 'pending') : 'pending',
      customer,
      sourcePath: sourcePath || "Unknown",
      updatedAt: serverTimestamp()
    }, { merge: true });

    return { success: true };
  } catch (error: any) {
    console.error("[Cart Sync Error]:", error.message);
    return { success: false, message: error.message };
  }
}
