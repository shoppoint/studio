import { 
  CreditCard, 
  Wallet, 
  MessageCircle, 
  Landmark, 
  Smartphone, 
  DollarSign, 
  QrCode,
  Building2,
  Ticket,
  Coins,
  Sparkles
} from "lucide-react";

/**
 * @fileOverview 全通路統一支付方式定義 - 渠道過濾版
 * 包含 15+ 種支付途徑，供 POS、Admin 及 Checkout 同步引用。
 * 修正：將積分抵扣設為 web: false，防止在結帳頁面重複顯示。
 */

export const PAYMENT_METHODS = [
  // 1. KPay 實體卡機系列 (僅限 POS 使用)
  { id: "kpay_visa", label: "KPay - Visa/Master", icon: CreditCard, type: "kpay", web: false },
  { id: "kpay_amex", label: "KPay - AMEX", icon: CreditCard, type: "kpay", web: false },
  { id: "kpay_alipay", label: "KPay - AlipayHK", icon: Wallet, type: "kpay", web: false },
  { id: "kpay_wechat", label: "KPay - WeChat Pay", icon: MessageCircle, type: "kpay", web: false },
  { id: "kpay_unionpay", label: "KPay - UnionPay (銀聯)", icon: CreditCard, type: "kpay", web: false },
  { id: "kpay_jcb", label: "KPay - JCB", icon: CreditCard, type: "kpay", web: false },
  { id: "kpay_boc", label: "KPay - BOCPay", icon: Landmark, type: "kpay", web: false },
  { id: "kpay_cloud", label: "KPay - 雲支付", icon: Smartphone, type: "kpay", web: false },
  
  // 2. 手動核對與現金
  { id: "cash", label: "現金收款 (Cash)", icon: DollarSign, type: "manual", web: false },
  { id: "fps", label: "轉數快 (FPS)", icon: Smartphone, type: "manual", web: true },
  { id: "payme", label: "PayMe (個人/Business)", icon: QrCode, type: "manual", web: true },
  { id: "octopus", label: "八達通 (Octopus)", icon: Smartphone, type: "manual", web: true },
  { id: "bank", label: "銀行轉帳 (Bank Transfer)", icon: Landmark, type: "manual", web: true },
  { id: "pay_in_store", label: "到店付款 (Pay In-Store)", icon: Building2, type: "manual", web: true },
  
  // 3. 特殊抵扣類 (POS/後台錄入/結帳自動觸發)
  // web: false 確保它們不會出現在 Checkout 的支付方式勾選清單中，因為系統會自動計算
  { id: "cash_coupon", label: "現金券 (Cash Coupon)", icon: Ticket, type: "manual", web: false },
  { id: "credits_redemption", label: "全額積分抵扣 (Credits)", icon: Sparkles, type: "manual", web: false },
  { id: "points_redemption", label: "積分部分抵扣 (Points)", icon: Coins, type: "manual", web: false },
  
  // 4. 網上即時支付 (Yedpay/Stripe)
  { id: "visa", label: "信用卡 (Visa/Master)", icon: CreditCard, type: "online", web: true },
  { id: "alipay", label: "支付寶 (AlipayHK)", icon: Wallet, type: "online", web: true },
  { id: "wechat", label: "微訊支付 (WeChat Pay)", icon: MessageCircle, type: "online", web: true }
];

export const getPaymentLabel = (id: string) => {
  const method = PAYMENT_METHODS.find(m => m.id === id);
  return method ? method.label : id;
};
