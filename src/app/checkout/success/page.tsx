"use client";

import { useMemo, useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { 
  CheckCircle2, 
  ShoppingBag, 
  ArrowRight, 
  Loader2,
  Package,
  Printer,
  X,
  Clock as ClockIcon,
  AlertTriangle,
  MessageCircle,
  Sparkles,
  Truck,
  MapPin,
  CreditCard,
  Landmark,
  Copy,
  Smartphone,
  Store,
  Info,
  RefreshCcw,
  Zap,
  QrCode,
  ShieldCheck,
  UserPlus,
  Coins
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useI18n } from "@/lib/i18n/i18n-context";
import { useUser, useDoc, useFirestore } from "@/firebase";
import { doc } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { generateOrderDocHtml } from "@/lib/print-templates";
import { initiatePaymentAction, verifyYedpayPaymentAction } from "@/app/actions/payment-actions";
import { trackPurchase } from "@/lib/analytics";
import { LoginDialog } from "@/components/auth/LoginDialog";

/**
 * 訂單成功與付款核對頁面
 */
function CheckoutSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t, lang } = useI18n();
  const db = useFirestore();
  const { toast } = useToast();
  const { user } = useUser();
  
  const orderId = searchParams.get('orderId') || "";
  const [isRetryingOnline, setIsRetryingOnline] = useState(false);
  const [conversionFired, setConversionFired] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState<'pending' | 'success' | 'checking'>('checking');

  // 實時監聽訂單文件
  const orderRef = useMemo(() => orderId ? doc(db!, 'orders', orderId) : null, [db, orderId]);
  const { data: order, loading: orderLoading } = useDoc<any>(orderRef);
  const { data: payConfig } = useDoc<any>(db ? doc(db, 'config', 'payment') : null);

  const isEn = lang === 'en';

  useEffect(() => {
    if (!orderId) return;
    sessionStorage.removeItem('last_attempted_order_id');
  }, [orderId]);

  /**
   * 補救機制：不再主動修改狀態。
   * 此頁面僅作為訊息呈現，確認動作必須在前頁 Checkout 完成寫入。
   */
  useEffect(() => {
    if (order && order.isConfirmed === false) {
      console.log(`[Success Page] Detected unconfirmed order: ${orderId}. Waiting for Webhook or Manual intervention.`);
    }
  }, [order, orderId]);

  /**
   * 邏輯：主動向 Yedpay 查詢付款狀態
   */
  useEffect(() => {
    const runVerification = async () => {
      if (!orderId || !db) return;
      
      if (order?.paymentStatus === 'paid') {
        setVerifyStatus('success');
        return;
      }

      try {
        const res = await verifyYedpayPaymentAction(orderId);
        if (res.success && res.status === 'paid') {
          setVerifyStatus('success');
        } else {
          setVerifyStatus('pending');
        }
      } catch (e) {
        setVerifyStatus('pending');
      }
    };

    if (order && !orderLoading) {
      runVerification();
    }
  }, [orderId, db, order?.paymentStatus, orderLoading]);

  useEffect(() => {
    if (order && !conversionFired) {
      const isPaidOrPending = order.paymentStatus === 'paid' || order.paymentStatus === 'pending' || verifyStatus === 'success';
      if (isPaidOrPending) {
        trackPurchase(order);
        setConversionFired(true);
      }
    }
  }, [order, conversionFired, verifyStatus]);

  const handleRetryOnlinePayment = async () => {
    if (!order || isRetryingOnline) return;
    setIsRetryingOnline(true);
    try {
      const res = await initiatePaymentAction({
        orderId: order.orderId || order.id,
        amount: order.total,
        paymentData: { method: order.paymentMethod || 'visa' }
      });
      if (res.success && res.checkoutUrl) {
        window.location.href = res.checkoutUrl;
      } else {
        throw new Error(res.message || "Retry failed");
      }
    } catch (e: any) {
      toast({ title: "無法重新發起支付", description: e.message, variant: "destructive" });
    } finally {
      setIsRetryingOnline(false);
    }
  };

  const handlePrint = () => {
    if (!order) return;
    const win = window.open('', '_blank', 'width=1000,height=900');
    if (win) { 
      const visibleItems = (order.items || []).filter((it: any) => !it.isInternalGift);
      win.document.write(generateOrderDocHtml('invoice', order, visibleItems, order.subtotal || 0, order.shippingFee || 0, order.total || 0)); 
      win.document.close(); 
    }
  };

  const handleCopy = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast({ title: isEn ? "Copied" : "已複製", description: label });
  };

  if (orderLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!order) return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <div className="flex-grow py-24 text-center space-y-6 animate-in fade-in">
        <X className="h-16 w-16 text-destructive mx-auto opacity-20" />
        <div className="space-y-2"><h2 className="text-2xl font-black">找不到訂單資訊</h2></div>
      </div>
      <Footer />
    </div>
  );

  const isPaid = order.paymentStatus === 'paid' || verifyStatus === 'success';
  const orderMethod = String(order.paymentMethod || "").toLowerCase();
  const isOnlineMethod = ['visa', 'alipay', 'wechat', 'mastercard'].includes(orderMethod);
  const isPayInStore = orderMethod === 'pay_in_store';
  const isPayMe = orderMethod === 'payme';
  const isFps = orderMethod === 'fps';
  const isBank = orderMethod === 'bank';
  const isOctopus = orderMethod === 'octopus';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-12 max-w-6xl">
        <div className="text-center space-y-4 pt-10">
          <div className={cn(
            "h-24 w-24 rounded-full flex items-center justify-center mx-auto shadow-2xl border-4 border-white transition-all", 
            isPaid ? "bg-green-500 text-white" : "bg-orange-500 text-white"
          )}>
            {isPaid ? <CheckCircle2 className="h-14 w-14" /> : <ClockIcon className="h-12 w-12" />}
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-black font-headline tracking-tighter">
              {isPaid ? (isEn ? "Payment Verified!" : "付款已完成") : isPayInStore ? (isEn ? "Order Reserved" : "訂單已預留") : (isEn ? "Order Received" : "訂單已收到")}
            </h1>
            <p className="text-muted-foreground font-medium max-w-md mx-auto">{isPaid ? "感謝您的購買！我們已收到款項。" : "訂單已建立，請按照下方指引完成付款。"}</p>
          </div>
          <div className="flex justify-center gap-3">
            <Badge variant="outline" className="bg-white px-4 py-1.5 font-mono text-sm border-primary/20 text-primary">#{order.orderId || order.id}</Badge>
            <Badge className={cn("font-black px-4 py-1.5 uppercase text-[10px] shadow-sm border-none", isPaid ? "bg-green-600 text-white" : "bg-orange-600 text-white")}>
              {isPaid ? "PAID" : "PENDING"}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mt-12">
          <div className="lg:col-span-8 space-y-8">
            {isOnlineMethod && !isPaid && (
              <Card className="border-none shadow-xl bg-white rounded-[2.5rem] overflow-hidden border-t-8 border-orange-500">
                 <CardHeader className="bg-orange-50 p-8 border-b">
                   <CardTitle className="text-2xl font-black flex items-center gap-3 text-orange-900">
                     <CreditCard className="h-7 w-7" /> 付款尚未完成
                   </CardTitle>
                   <CardDescription className="text-orange-800 font-medium">我們尚未收到您的線上付款。如果之前支付失敗，請點擊下方按鈕重試。</CardDescription>
                 </CardHeader>
                 <CardContent className="p-8 flex flex-col items-center">
                    <Button 
                      className="w-full sm:w-auto min-w-[300px] h-16 bg-orange-600 hover:bg-orange-700 text-white font-black text-xl rounded-2xl shadow-xl gap-3 active:scale-95 transition-all"
                      onClick={handleRetryOnlinePayment}
                      disabled={isRetryingOnline}
                    >
                      {isRetryingOnline ? <Loader2 className="h-6 w-6 animate-spin" /> : <Zap className="h-6 w-6 fill-current" />}
                      立即重新進行支付
                    </Button>
                 </CardContent>
              </Card>
            )}

            {(isPayMe || isFps || isBank || isOctopus) && !isPaid && (
              <Card className="border-none shadow-xl bg-white rounded-[2.5rem] overflow-hidden border-t-8 border-indigo-600">
                <CardHeader className="bg-indigo-50 p-8 border-b">
                  <CardTitle className="text-2xl font-black flex items-center gap-3"><Landmark className="h-7 w-7" /> 手動付款指引</CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  {isPayMe && (
                    <div className="flex flex-col md:flex-row items-center gap-10">
                      <div className="relative aspect-square w-48 shrink-0 border-4 border-white shadow-xl rounded-3xl overflow-hidden"><Image src={payConfig?.paymeQrUrl || "/payme-qr.png"} alt="PayMe" fill className="object-contain p-2" unoptimized /></div>
                      <div className="space-y-4">
                        <h4 className="font-black text-sm uppercase text-slate-400">PayMe 步驟</h4>
                        <p className="text-sm font-bold">1. 打開 PayMe 手機應用程式<br/>2. 按「向商店付款」內的一掃即付<br/>3. 掃描此 QR PayMe 二維碼<br/>4. 輸入銀碼後按確定</p>
                      </div>
                    </div>
                  )}
                  {isOctopus && (
                    <div className="flex flex-col md:flex-row items-center gap-10">
                      <div className="relative aspect-square w-48 shrink-0 border-4 border-white shadow-xl rounded-3xl overflow-hidden"><Image src={payConfig?.octopusQrUrl || "/octopus-qr.png"} alt="Octopus" fill className="object-contain p-2" unoptimized /></div>
                      <div className="space-y-4">
                        <h4 className="font-black text-sm uppercase text-slate-400">八達通步驟</h4>
                        <p className="text-sm font-bold">1. 打開 八達通 手機應用程式<br/>2. 使用掃碼功能掃描左側 QR<br/>3. 輸入銀碼後按確定並完成支付</p>
                      </div>
                    </div>
                  )}
                  {(isFps || isBank) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <div className="flex justify-between items-center p-3 bg-muted/20 rounded-xl">
                          <div><span className="text-[10px] uppercase block opacity-60">FPS ID</span><span className="font-black text-lg text-indigo-700">{payConfig?.fpsId || "161931316"}</span></div>
                          <Button variant="ghost" size="icon" onClick={() => handleCopy(payConfig?.fpsId || "161931316", "FPS")}><Copy className="h-4 w-4" /></Button>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-muted/20 rounded-xl">
                          <div><span className="text-[10px] uppercase block opacity-60">HSBC Account</span><span className="font-bold">{payConfig?.bankAccountNo || "---"}</span></div>
                          <Button variant="ghost" size="icon" onClick={() => handleCopy(payConfig?.bankAccountNo, "銀行帳號")}><Copy className="h-4 w-4" /></Button>
                        </div>
                      </div>
                      <div className="bg-muted/30 p-6 rounded-2xl border border-dashed text-xs italic leading-relaxed">請將轉帳收據截圖發送至我們的 WhatsApp 或電郵，並註明訂單編號以供核實。</div>
                    </div>
                  )}

                  <Separator className="border-dashed" />

                  {/* WhatsApp Verification Shortcut */}
                  <div className="bg-green-50 p-6 rounded-2xl border border-green-100 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in slide-in-from-bottom-2 duration-500">
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 shrink-0 shadow-sm border border-green-200">
                        <MessageCircle className="h-6 w-6" />
                      </div>
                      <div className="space-y-1 text-left">
                        <p className="text-sm font-black text-green-900 uppercase tracking-tight">
                          {isEn ? "WhatsApp Fast Verification" : "WhatsApp 快速核對"}
                        </p>
                        <p className="text-xs text-green-800 leading-relaxed font-medium">
                          {isEn 
                            ? "After payment, please send the payment record via WhatsApp. We will verify and arrange shipment as soon as possible."
                            : "付款後，請將付款紀錄透過 WhatsApp 發送給我們核對，核實後會盡快回覆及安排出貨。"}
                        </p>
                      </div>
                    </div>
                    <Button asChild className="w-full sm:w-auto h-12 bg-green-600 hover:bg-green-700 text-white font-black rounded-xl shadow-lg gap-2 shrink-0">
                      <a 
                        href={`https://wa.me/85253252555?text=${encodeURIComponent(isEn ? `I have completed the payment for order #${order.orderId || order.id}. Here is my receipt.` : `我已完成訂單 #${order.orderId || order.id} 的付款，這是我的付款紀錄收據。`)}`} 
                        target="_blank" 
                        rel="noreferrer"
                      >
                        <MessageCircle className="h-4 w-4" />
                        {isEn ? "Send Record" : "發送付款紀錄"}
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="border-none shadow-sm overflow-hidden bg-white rounded-[2rem]">
              <CardHeader className="bg-muted/30 border-b py-5 px-8"><CardTitle className="text-lg flex items-center gap-3"><Package className="h-5 w-5" /> 訂購產品明細</CardTitle></CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-dashed">
                  {(order.items || []).filter((it:any) => !it.isInternalGift).map((item: any, idx: number) => (
                    <div key={idx} className="p-6 flex gap-6">
                      <div className="h-20 w-20 rounded-xl bg-muted relative overflow-hidden shrink-0 border">{item.image && <Image src={item.image} alt="" fill className="object-cover" unoptimized />}</div>
                      <div className="flex-1 min-w-0 py-1"><p className="text-[10px] font-black text-primary uppercase">{item.brand}</p><h4 className="font-bold text-sm md:text-base truncate">{item.name}</h4><p className="text-xs text-muted-foreground font-bold">Qty: {item.qty} • Price: ${Number(item.price).toFixed(1)}</p></div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <Card className="border-none shadow-md bg-primary rounded-3xl overflow-hidden text-primary-foreground">
              <div className="p-8 space-y-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase opacity-60">Order Total</p>
                  <h3 className="text-4xl font-black">${Number(order.total).toFixed(1)}</h3>
                </div>
                
                <Button 
                  variant="ghost" 
                  className="w-full rounded-xl font-black h-11 bg-white text-slate-900 hover:bg-slate-50 transition-colors shadow-sm" 
                  onClick={handlePrint}
                >
                  <Printer className="h-4 w-4 mr-2" /> 列印發票
                </Button>
                
                <div className="space-y-3">
                  <Button asChild className="w-full rounded-xl font-black h-11 bg-white text-slate-900 hover:bg-slate-100 transition-colors shadow-lg gap-2 border-none">
                    <Link href="/">
                      <ShoppingBag className="h-4 w-4" /> 繼續購物
                    </Link>
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="border-none shadow-sm bg-white rounded-3xl p-8 space-y-4">
               <div className="flex items-center gap-3 text-indigo-600">
                  <Coins className="h-5 w-5" />
                  <span className="font-black text-sm uppercase tracking-widest">LOYALTY REWARDS</span>
               </div>
               <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-muted-foreground">本次累積積分:</span>
                  <span className="text-xl font-black text-indigo-700">+{order.earnedPoints || 0}</span>
               </div>
               <p className="text-[10px] text-muted-foreground leading-relaxed italic">
                  * 積分將於訂單標記為「已送達/已取貨」後自動存入帳戶。
               </p>
            </Card>
          </div>
        </div>

        {(!user || user.isAnonymous) && (
          <div className="mt-12">
            <Card className="border-none shadow-2xl bg-indigo-900 text-white rounded-[2.5rem] overflow-hidden animate-in slide-in-from-bottom-6 duration-700">
              <CardContent className="p-10 flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="h-16 w-16 rounded-3xl bg-white/10 flex items-center justify-center text-primary shrink-0 border border-white/20 shadow-lg">
                    <Sparkles className="h-8 w-8 fill-current animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-black font-headline tracking-tight">別讓本次積分過期！</h3>
                    <p className="text-indigo-200 text-sm leading-relaxed max-w-md">
                      這筆交易為您賺取了 <span className="text-white font-black">{order.earnedPoints || 0} 積分</span>。現在註冊即可立即存入您的帳戶，並自動同步收貨地址。
                    </p>
                  </div>
                </div>
                <LoginDialog trigger={
                  <Button className="bg-primary text-primary-foreground font-black px-12 h-14 rounded-2xl shadow-xl hover:scale-105 transition-all text-lg gap-2">
                    <UserPlus className="h-5 w-5" /> 立即註冊領取
                  </Button>
                } />
              </CardContent>
            </Card>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (<Suspense fallback={null}><CheckoutSuccessContent /></Suspense>);
}
