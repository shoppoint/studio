import { initiatePaymentAction } from "@/app/actions/payment-actions";

/**
 * 前端調用服務 (修正類型定義以匹配 Action 回傳)
 */
export async function startYedpayPayment(orderId: string, amount: number, method: string) {
  try {
    const responseData = await initiatePaymentAction({
      orderId,
      amount,
      paymentData: { method }
    });
    
    if (responseData.success && responseData.checkoutUrl) {
      // 成功：重定向至 Yedpay 安全支付頁面
      window.location.href = responseData.checkoutUrl;
    } else {
      const errMsg = responseData.message || "無法建立支付連結";
      throw new Error(errMsg);
    }
  } catch (error: any) {
    console.error("Payment Service Client Error:", error);
    const message = error.message || "建立支付連結失敗，請檢查您的網絡或聯繫客服。";
    throw new Error(message);
  }
}