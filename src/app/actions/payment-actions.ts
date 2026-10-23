
'use server';

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

/**
 * @fileOverview 支付發起與主動校對服務 - 效能優化版
 * 修正：加入 AbortController 實施 8 秒強制超時保護，防止外部 API 拖垮伺服器回應速度。
 */

function getInternalDb() {
  const apps = getApps();
  const app = apps.length === 0 ? initializeApp(firebaseConfig) : apps[0];
  return getFirestore(app, "shoppoint-hk");
}

interface InitiatePaymentParams {
  orderId: string;
  amount: number;
  paymentData?: { method: string };
  testConfig?: {
    apiKey?: string;
    storeId?: string;
    environment?: string;
  };
}

export async function initiatePaymentAction(params: InitiatePaymentParams) {
  const { orderId, amount, paymentData, testConfig } = params;
  
  // 建立超時控制
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 秒超時

  try {
    const db = getInternalDb();
    let apiKey = testConfig?.apiKey;
    let storeId = testConfig?.storeId;
    let environment = testConfig?.environment;

    if (!apiKey || !storeId) {
      const configSnap = await getDoc(doc(db, 'config', 'payment'));
      const config = configSnap.exists() ? configSnap.data() : {};
      apiKey = (config.yedpayApiKey || "").trim().replace(/['"]/g, '');
      storeId = (config.yedpayStoreId || "").trim().replace(/['"]/g, '');
      environment = config.yedpayEnvironment || "production";
    }

    if (!apiKey || !storeId) return { success: false, message: "支付配置缺失" };

    const baseUrl = 'https://shoppoint.hk';
    const apiBaseUrl = environment === 'sandbox' ? "https://api-staging.yedpay.com" : "https://api.yedpay.com";
    const endpoint = `${apiBaseUrl}/v1/online-payment`;
    
    const webhookUrl = `https://yedpaywebhook-a5lwwa4ofa-de.a.run.app/`;

    const formData = new URLSearchParams();
    formData.append('store_id', String(storeId));
    formData.append('amount', Number(amount).toFixed(2));
    formData.append('currency', 'HKD');
    formData.append('custom_id', String(orderId));
    formData.append('subject', `Order #${orderId} | SHOP POINT`);
    formData.append('return_url', `${baseUrl}/checkout/success?orderId=${orderId}`);
    formData.append('return_url_failed', `${baseUrl}/checkout/success?orderId=${orderId}&status=failed`);
    formData.append('notify_url', webhookUrl);
    formData.append('wallet', 'HK');
    
    if (paymentData?.method) {
      const m = paymentData.method.toLowerCase();
      if (m === 'alipay') formData.append('gateway_code', '4_2');
      else if (m === 'wechat') formData.append('gateway_code', '8_2');
      else if (m === 'visa' || m === 'mastercard') formData.append('gateway_code', '12_1');
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `API-KEY ${apiKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
        "Accept": "application/json"
      },
      body: formData.toString(),
      cache: 'no-store',
      signal: controller.signal // 綁定超時訊號
    });

    clearTimeout(timeoutId); // 請求成功，清除定時器

    const responseText = await response.text();
    if (!responseText || responseText.trim() === "") {
      return { success: false, message: "支付網關回應超時，請重新嘗試支付或聯絡 WhatsApp 客服。" };
    }

    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      return { success: false, message: "支付請求處理中，請稍後檢查狀態或聯絡客服。" };
    }

    if (result.success && result.data?.checkout_url) {
      return { 
        success: true, 
        checkoutUrl: result.data.checkout_url,
        token: result.data.token,
        notifyUrl: webhookUrl 
      };
    }

    return { success: false, message: result.message || "支付請求未獲得核准" };
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      return { success: false, message: "支付網關反應緩慢，訂單已暫存，請稍後手動重試支付或聯絡專人跟進。" };
    }
    return { success: false, message: error.message };
  }
}

/**
 * 主動校對 Yedpay 支付狀態 (備援方案)
 */
export async function verifyYedpayPaymentAction(orderId: string) {
  if (!orderId) return { success: false };
  
  try {
    const db = getInternalDb();
    const orderRef = doc(db, 'orders', orderId);
    const orderSnap = await getDoc(orderRef);
    
    if (!orderSnap.exists()) return { success: false, message: "Order not found" };
    const orderData = orderSnap.data();

    if (orderData.paymentStatus === 'paid') return { success: true, status: 'paid' };

    const paymentToken = orderData.paymentToken;
    if (!paymentToken) return { success: false, message: "No payment token" };

    const configSnap = await getDoc(doc(db, 'config', 'payment'));
    const config = configSnap.exists() ? configSnap.data() : {};
    
    const apiKey = (config.yedpayApiKey || "").trim().replace(/['"]/g, '');
    const environment = config.yedpayEnvironment || "production";
    const apiBaseUrl = environment === 'sandbox' ? "https://api-staging.yedpay.com" : "https://api.yedpay.com";

    const response = await fetch(`${apiBaseUrl}/v1/online-payment/${paymentToken}`, {
      headers: { "Authorization": `API-KEY ${apiKey}` },
      cache: 'no-store'
    });

    const responseText = await response.text();
    if (!responseText || responseText.trim() === "") {
      return { success: false, status: 'unpaid' };
    }

    try {
      const result = JSON.parse(responseText);
      return { 
        success: true, 
        status: result.success ? result.data?.status : 'unpaid' 
      };
    } catch (e) {
      return { success: false, status: 'unpaid' };
    }
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}
