
"use client";

import { useMemo, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { 
  CheckCircle2, 
  ShoppingBag, 
  ArrowRight, 
  Loader2,
  Package,
  Truck,
  Zap,
  Landmark,
  Copy,
  Info,
  MapPin,
  CreditCard,
  Printer,
  X,
  Calendar,
  Clock as ClockIcon,
  QrCode,
  AlertTriangle,
  FileCheck,
  UserPlus,
  Sparkles,
  Gift,
  Mail,
  ShoppingCart,
  Coins,
  ChevronRight,
  MinusCircle,
  MessageSquare,
  Hash,
  ExternalLink
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
import { format } from "date-fns";

export default function UserOrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { t, lang } = useI18n();
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const orderId = params.orderId as string;
  const isEn = lang === 'en';

  const orderRef = useMemo(() => orderId ? doc(db!, 'orders', orderId) : null, [db, orderId]);
  const { data: order, loading: orderLoading } = useDoc<any>(orderRef);

  const paymentConfigRef = useMemo(() => db ? doc(db, 'config', 'payment') : null, [db]);
  const { data: payConfig } = useDoc<any>(paymentConfigRef);

  const handleCopy = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast({ title: isEn ? "Copied" : "已複製", description: label });
  };

  /**
   * 核心過濾：隱藏標註為內部贈品的項目
   */
  const visibleItems = useMemo(() => {
    if (!order?.items) return [];
    return order.items.filter((item: any) => !item.isInternalGift);
  }, [order?.items]);

  const trackingNumbers = useMemo(() => {
    if (!order?.trackingNo) return [];
    return order.trackingNo.split(',').map((s: string) => s.trim()).filter(Boolean);
  }, [order?.trackingNo]);

  const handlePrint = () => {
    if (!order) return;
    const win = window.open('', '_blank', 'width=1000,height=900');
    if (!win) return;
    win.document.write(generateOrderDocHtml('invoice', order, visibleItems, order.subtotal || 0, order.shippingFee || 0, order.total || 0));
    win.document.close();
  };

  if (orderLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;

  if (!order || (user && order.customerId !== user.uid && order.customerInfo?.email !== user.email)) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <div className="flex-grow flex flex-col items-center justify-center p-20 space-y-6">
          <X className="h-16 w-16 text-muted-foreground/20" />
          <h2 className="text-2xl font-black font-headline">找不到訂單資訊</h2>
          <Button variant="outline" asChild className="rounded-xl"><Link href="/profile?tab=orders">返回我的訂單</Link></Button>
        </div>
        <Footer />
      </div>
    );
  }

  const isPaid = order.paymentStatus === 'paid';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-12 max-w-6xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground uppercase tracking-widest font-black">
              <Link href="/profile?tab=orders" className="hover:text-primary transition-colors">Orders</Link>
              <ChevronRight className="h-4 w-4" />
              <span>Details</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black font-headline tracking-tighter">訂單詳情 #{order.orderId || order.id.slice(-8)}</h1>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="rounded-xl h-11 bg-white gap-2 font-bold" onClick={handlePrint}><Printer className="h-4 w-4" /> 列印單據</Button>
            <Button variant="ghost" asChild className="rounded-xl h-11 font-bold gap-2 text-primary hover:bg-primary/5">
              <Link href="/contact"><MessageSquare className="h-4 w-4" /> 聯絡客服</Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-8">
            <div className={cn(
              "rounded-[2rem] p-6 border-none shadow-lg animate-in fade-in flex items-center gap-4",
              isPaid ? "bg-green-600 text-white" : "bg-orange-600 text-white"
            )}>
              <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center shrink-0 shadow-inner">
                {isPaid ? <CheckCircle2 className="h-6 w-6" /> : <ClockIcon className="h-6 w-6" />}
              </div>
              <div>
                <p className="text-xl font-black mb-1">{isPaid ? (isEn ? "Payment Received" : "付款已完成") : (isEn ? "Awaiting Payment" : "等待核實款項")}</p>
                <div className="text-white/90 font-medium text-sm">
                  <p>{isPaid ? (isEn ? "Your order is being prepared." : "您的訂單正在準備中，我們會儘快安排出貨。") : (isEn ? "Please ensure you have completed the transfer and sent the receipt." : "請確保您已完成轉帳並傳送收據截圖。")}</p>
                  {!isPaid && (
                    <Link href="/payment-methods" className="inline-flex items-center gap-1.5 text-white font-black underline underline-offset-4 hover:opacity-80 mt-2 transition-all">
                      {isEn ? "View Payment Instructions" : "點此查看付款方式指引"} <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* 物流追蹤區塊 - 支援多號碼 */}
            {trackingNumbers.length > 0 && (
              <Card className="border-none shadow-sm overflow-hidden bg-white rounded-3xl border-l-4 border-primary">
                <CardHeader className="bg-primary/5 py-4 px-8 border-b">
                  <CardTitle className="text-sm font-black uppercase text-primary flex items-center gap-2">
                    <Truck className="h-4 w-4" /> {isEn ? "Package Tracking" : "貨品物流追蹤"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     {trackingNumbers.map((num: string, idx: number) => (
                       <div key={idx} className="p-4 bg-muted/20 rounded-2xl flex items-center justify-between group hover:bg-white hover:shadow-md transition-all border border-transparent hover:border-primary/20">
                         <div className="space-y-1">
                           <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">
                             {isEn ? `Tracking No. ${idx + 1}` : `物流單號 ${idx + 1}`}
                           </p>
                           <p className="font-mono font-bold text-slate-800">{num}</p>
                         </div>
                         <div className="flex items-center gap-1">
                           <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg" onClick={() => handleCopy(num, `Tracking ${idx+1}`)}>
                             <Copy className="h-3.5 w-3.5" />
                           </Button>
                           <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg text-primary" asChild>
                              <a href={`https://www.sf-express.com/hk/tc/dynamic_function/waybill/?billNo=${num}`} target="_blank" rel="noreferrer">
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                           </Button>
                         </div>
                       </div>
                     ))}
                   </div>
                   {trackingNumbers.length > 1 && (
                     <div className="p-3 bg-blue-50 rounded-xl flex items-center gap-2 border border-blue-100">
                        <Info className="h-4 w-4 text-blue-600 shrink-0" />
                        <p className="text-[10px] text-blue-800 font-medium italic">
                          {isEn ? "Your order has been split into multiple packages." : "您的訂單已分拆為多個包裹寄出。"}
                        </p>
                     </div>
                   )}
                </CardContent>
              </Card>
            )}

            <Card className="border-none shadow-sm overflow-hidden bg-white rounded-[2rem]">
              <CardHeader className="bg-muted/30 border-b py-5 px-8"><CardTitle className="text-lg flex items-center gap-3"><Package className="h-5 w-5" /> {isEn ? 'Items Ordered' : '訂購產品'}</CardTitle></CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-dashed">
                  {visibleItems.map((item: any) => {
                     const price = Number(item.price) || 0;
                     const qty = Number(item.qty) || 0;
                     const itemDiscVal = Number(item.discount) || 0;
                     const itemAdjustment = Number(item.adjustment || 0);

                     const manualDeductionPerUnit = item.discountType === 'percent' ? (price * itemDiscVal / 100) : itemDiscVal;
                     const rowManualDeduction = (manualDeductionPerUnit * qty) - itemAdjustment;

                     const orderManualDiscountTotal = visibleItems.reduce((acc: number, it: any) => {
                        const itPrice = Number(it.price) || 0;
                        const itQty = Number(it.qty) || 0;
                        const itDisc = Number(it.discount) || 0;
                        const itAdj = Number(it.adjustment || 0);
                        const d = it.discountType === 'percent' ? (itPrice * itDisc / 100) : itDisc;
                        return acc + (d * itQty) - itAdj;
                     }, 0);
                     
                     const rowBaseTotal = (price * qty) - rowManualDeduction;
                     const orderBaseTotal = (Number(order.subtotal) || 0) - orderManualDiscountTotal;
                     
                     const shareRatio = orderBaseTotal > 0 ? (rowBaseTotal / orderBaseTotal) : 0;
                     const rowAutoDeduction = (Number(order.discountAmount) || 0) * shareRatio;

                     const totalRowDeduction = rowManualDeduction + rowAutoDeduction;
                     const rowFinalTotal = (price * qty) - totalRowDeduction;

                     return (
                        <div key={item.id} className="p-6 flex gap-4 md:gap-6 hover:bg-muted/10 transition-colors">
                          <div className="h-20 w-20 md:h-24 md:w-24 rounded-xl bg-muted relative overflow-hidden shrink-0 border shadow-inner">
                            {item.image ? <Image src={item.image} alt={item.name} fill className="object-cover" /> : <div className="h-full w-full bg-slate-100" />}
                          </div>
                          <div className="flex-1 min-w-0 flex flex-col justify-between">
                            <div className="space-y-1">
                              <p className="text-[10px] font-black text-primary uppercase">{item.brand}</p>
                              <h4 className="font-bold text-sm md:text-base truncate">{item.name}</h4>
                              <div className="flex items-center gap-3">
                                <p className="text-xs text-muted-foreground font-bold">Qty: {item.qty} • Price: ${Number(item.price).toFixed(1)}</p>
                              </div>
                            </div>
                            
                            {totalRowDeduction > 0 && (
                              <div className="flex flex-wrap items-center gap-2 mt-2 p-2 bg-red-50 rounded-xl border border-red-100 w-fit animate-in slide-in-from-left-2">
                                <MinusCircle className="h-3 w-3 text-red-500" />
                                <span className="text-[10px] font-black text-red-700 uppercase">
                                  折扣與優惠扣減: -${totalRowDeduction.toFixed(1)}
                                </span>
                                {rowAutoDeduction > 0 && <Badge variant="outline" className="text-[7px] font-black h-4 px-1 border-green-200 text-green-600 bg-white">PROMO APPLIED</Badge>}
                              </div>
                            )}

                            <div className="flex justify-between items-end mt-2">
                              <Button variant="link" size="sm" asChild className="h-auto p-0 text-primary font-bold text-xs"><Link href={`/product/${item.id}`}>{t.common.view} <ArrowRight className="ml-1 h-3 w-3" /></Link></Button>
                              <p className="font-black text-lg text-orange-600">${rowFinalTotal.toFixed(1)}</p>
                            </div>
                          </div>
                        </div>
                     );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6 lg:col-span-4">
            <Card className="border-none shadow-md bg-white overflow-hidden rounded-3xl">
              <div className="bg-primary/10 px-6 py-4 border-b"><h3 className="font-bold text-sm uppercase tracking-wider">{t.cart.summary}</h3></div>
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t.cart.subtotal}</span><span className="font-bold">${Number(order.subtotal || 0).toFixed(1)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">{t.cart.shipping}</span><span className="font-bold">{order.shippingFee === 0 ? "FREE" : `$${Number(order.shippingFee || 0).toFixed(1)}`}</span></div>
                <Separator />
                <div className="flex justify-between text-xl font-black text-orange-600"><span>{t.cart.total}</span><span>${Number(order.total || 0).toFixed(1)}</span></div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-white rounded-3xl">
              <CardHeader className="pb-3"><CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" />{t.checkout.shipping_address}</CardTitle></CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-1">
                  <p className="font-bold text-sm">{order.customerInfo?.name}</p>
                  <p className="text-xs text-muted-foreground">{order.customerInfo?.phone}</p>
                  <div className="text-xs text-muted-foreground leading-relaxed mt-2 p-3 bg-muted/20 rounded-xl border border-dashed">
                    {order.shippingAddress?.area}, {order.shippingAddress?.district}<br/>{order.shippingAddress?.building}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-white rounded-3xl">
              <CardHeader className="pb-3"><CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2"><CreditCard className="h-4 w-4 text-primary" />{t.checkout.payment_method}</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-bold uppercase">{order.paymentMethod}</p>
                  <Badge variant={isPaid ? 'default' : 'outline'} className={cn(
                    "text-[10px] font-black uppercase",
                    isPaid ? t.checkout.payment_confirmed : (isEn ? 'UNPAID' : '尚未付款')
                  )}>
                    {isPaid ? t.checkout.payment_confirmed : (isEn ? 'UNPAID' : '尚未付款')}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
