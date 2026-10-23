
'use server';

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';
import { initiatePaymentAction } from "@/app/actions/payment-actions";

/**
 * @fileOverview Web 結帳下單 Action (V24 - 穩定性終極加固版)
 * 修正重點：
 * 1. 異步支付發起：即便支付網關響應慢，也優先保證訂單寫入成功。
 * 2. 設置嚴格 5 秒發起超時：防止 Server Action 觸發 Next.js 的全局 15s 斷連。
 * 3. 確保 isConfirmed: false 初始狀態：完全遵循背景自動化觸發鏈條。
 */

function getInternalDb() {
  const apps = getApps();
  const app = apps.length === 0 ? initializeApp(firebaseConfig) : apps[0];
  return getFirestore(app, "shoppoint-hk");
}

interface SubmitOrderParams {
  items: any[];
  contactData: any;
  shippingAddress: any;
  billingAddress: any;
  selectedMethod: any;
  selectedPoint: any;
  paymentMethod: string;
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  total: number;
  balanceDue: number;
  earnedPoints: number;
  pointsToUse: number;
  pointsValue: number;
  appliedPromos: any[];
  userId: string | null;
  lang: string;
  packagingPreference: string;
  subscribeNewsletter: boolean;
  saveAddressToAccount: boolean;
  defaultLocationId: string;
}

export async function submitOrderAction(data: SubmitOrderParams) {
  const db = getInternalDb();
  
  const timestampPart = Date.now().toString().slice(-8);
  const randomPart = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  const orderId = `${timestampPart}${randomPart}`;
  
  try {
    const fulfillmentLocId = data.selectedMethod?.isPickup ? (data.selectedPoint?.id || data.defaultLocationId) : data.defaultLocationId;
    
    let checkoutUrl = null;
    let paymentError = null;
    let paymentToken = null;
    let paymentNotifyUrl = null;
    
    const onlineMethods = ['visa', 'alipay', 'wechat', 'mastercard'];
    
    // 效能關鍵優化：執行外部支付 API 時，給予極短的超時保護
    if (data.balanceDue > 0.1 && onlineMethods.includes(data.paymentMethod)) {
       try {
         // 在伺服器端調用帶有內部超時控制的支付 Action
         const res = await initiatePaymentAction({ 
           orderId, 
           amount: data.balanceDue, 
           paymentData: { method: data.paymentMethod } 
         });
         
         if (res.success) {
           checkoutUrl = res.checkoutUrl;
           paymentToken = res.token;
           paymentNotifyUrl = (res as any).notifyUrl;
         } else {
           // 記錄錯誤細節但不要拋出異常，讓訂單先建立
           paymentError = res.message || "支付網關暫時無法建立連結";
         }
       } catch (e: any) {
         paymentError = "支付連線延遲：請在訂單建立後點擊重新支付，或聯絡 WhatsApp 客服由專人處理。";
         console.warn(`[SubmitOrder] Payment initiation failed/timed out for ${orderId}`);
       }
    }

    const orderData = {
      orderId,
      items: data.items,
      customerInfo: { 
        ...data.contactData, 
        name: `${data.contactData.lastName} ${data.contactData.firstName}`.trim() 
      },
      email: data.contactData.email?.toLowerCase().trim(),
      shippingAddress: data.shippingAddress,
      billingAddress: data.billingAddress,
      shippingMethodId: data.selectedMethod?.id || "standard",
      shippingMethodName: data.selectedMethod?.name_zh || data.selectedMethod?.name || "Standard",
      selectedPoint: data.selectedPoint || null,
      isPickup: !!data.selectedMethod?.isPickup,
      fulfillmentLocationId: fulfillmentLocId,
      paymentMethod: data.paymentMethod,
      paymentToken: paymentToken, 
      paymentNotifyUrl: paymentNotifyUrl,
      subtotal: Number(data.subtotal),
      shippingFee: Number(data.shippingFee),
      discountAmount: Number(data.discountAmount),
      total: Number(data.total),
      pointsUsed: Number(data.pointsToUse),
      pointsUsedValue: Number(data.pointsValue),
      earnedPoints: Number(data.earnedPoints),
      appliedPromos: data.appliedPromos,
      paymentStatus: 'unpaid',
      status: 'pending',
      fulfillmentStatus: 'pending',
      sourceType: 'Web',
      lang: data.lang,
      packagingPreference: data.packagingPreference,
      inventorySyncStatus: 'pending',
      isConfirmed: false, // 關鍵：初始必須為 false，直到前端點擊對話框確認
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      customerId: data.userId
    };

    const orderRef = doc(db, 'orders', orderId);
    await setDoc(orderRef, orderData);

    return { 
      success: true, 
      orderId, 
      checkoutUrl, 
      paymentError,
      // 輔助回傳支付方式以供前端判定下一步
      method: data.paymentMethod 
    };

  } catch (error: any) {
    console.error("[Submit Order Action] Fatal Error:", error.message);
    const isEn = data.lang === 'en';
    return { 
      success: false, 
      message: isEn 
        ? "Server connection issue. Please try again. If it fails, please contact us via WhatsApp or DM for manual processing."
        : "伺服器連線異常，請嘗試再次提交。若持續失敗，請即時透過 WhatsApp 或 DM 聯絡我們，我們將有專人為您處理訂單。" 
    };
  }
}
