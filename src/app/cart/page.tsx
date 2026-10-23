"use client";

import { useState, useEffect, useMemo, Suspense, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  Trash2, 
  Minus, 
  Plus, 
  ArrowLeft, 
  ShoppingBag, 
  ChevronRight, 
  Zap, 
  AlertTriangle, 
  Info, 
  Clock,
  Sparkles,
  Loader2,
  PlusCircle,
  CheckCircle2,
  History,
  ArrowRight,
  Tag,
  Ticket,
  X,
  CheckSquare,
  Square,
  Package,
  HeartHandshake,
  Eye,
  CreditCard,
  Truck,
  UserPlus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Separator } from "@/components/ui/separator";
import { useI18n } from "@/lib/i18n/i18n-context";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useCart } from "@/lib/cart-context";
import { useUser, useFirestore, useCollection } from "@/firebase";
import { collection, query, where, getDocs, limit, doc } from "firebase/firestore";
import { format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import { getPromoShortLabel, calculateDiscountForPromo } from "@/lib/shop-utils";
import { ProductCarousels } from "@/components/product/ProductCarousels";
import { QuickViewDialog } from "@/components/QuickViewDialog";
import { ShippingMilestoneTracker } from "@/components/cart/ShippingMilestoneTracker";
import { LoginDialog } from "@/components/auth/LoginDialog";
import { validateStockAvailability } from "@/services/checkout-service";

/**
 * 購物車頁面 - 實施結帳前庫存強校對
 */
function CartContent() {
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const { items, updateQty, removeItem, toggleSelect, selectAll, subtotal, appliedPromo: appliedCouponInfo, setAppliedPromo: setAppliedCouponInfo } = useCart();
  const router = useRouter();
  const db = useFirestore();
  const { user, userData } = useUser();
  
  const cartT = t.cart;
  const isEn = lang === 'en';

  const [mounted, setMounted] = useState(false);
  const [couponCode, setCouponCode] = useState(appliedCouponInfo?.code || "");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [randomList, setRandomList] = useState<any[]>([]);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem('recently_viewed_ids');
    if (stored) {
      try { setRecentIds(JSON.parse(stored)); } catch (e) {}
    }
  }, []);

  const productsQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'public_products'), where('status', '==', 'Active'), limit(100));
  }, [db]);
  const { data: allActiveProducts } = useCollection<any>(productsQuery);

  const promosQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'promotions'), where('status', '==', 'active'));
  }, [db]);
  const { data: allPromos } = useCollection<any>( promosQuery);

  const recentProductsQuery = useMemo(() => {
    if (!db || !recentIds.length) return null;
    return query(collection(db, 'public_products'), where('status', '==', 'Active'), where('__name__', 'in', recentIds.slice(0, 10)));
  }, [db, recentIds]);
  const { data: recentlyViewedProducts } = useCollection<any>(recentProductsQuery);

  useEffect(() => {
    if (allActiveProducts && allActiveProducts.length > 0) {
      const cartIds = items.map(i => i.id);
      const shuffled = [...allActiveProducts]
        .filter(p => !cartIds.includes(p.id))
        .sort(() => 0.5 - Math.random())
        .slice(0, 10);
      setRandomList(shuffled);
    }
  }, [allActiveProducts, items]);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim() || !db) return;
    setIsApplyingCoupon(true);
    try {
      const q = query(collection(db, 'promotions'), where('code', '==', couponCode.trim().toUpperCase()), where('status', '==', 'active'));
      const snap = await getDocs(q);
      if (snap.empty) {
        toast({ title: isEn ? "Invalid Code" : "無效優惠碼", variant: "destructive" });
        setAppliedCouponInfo(null);
      } else {
        const p = snap.docs[0].data();
        setAppliedCouponInfo({ id: snap.docs[0].id, ...p });
        toast({ title: isEn ? "Coupon Applied" : "優惠碼已套用" });
      }
    } catch (e) {
      toast({ title: "Error", variant: "destructive" });
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  /**
   * 進入結帳頁面前的最後一道防線 (Point 1: Cart Page Check)
   */
  const handleProceedToCheckout = async () => {
    if (!db || isValidating) return;
    setIsValidating(true);
    
    try {
      const selectedItems = items.filter(i => i.selected !== false);
      const stockIssues = await validateStockAvailability(db, selectedItems);
      
      if (stockIssues.length > 0) {
        toast({
          title: isEn ? "Availability Changed" : "庫存狀況已變動",
          description: isEn 
            ? `Sorry, ${stockIssues.join(", ")} is now out of stock.` 
            : `很抱歉，${stockIssues.join(", ")} 剛剛已售罄。請移除後再繼續。`,
          variant: "warning" // 改為黃色提示
        });
      } else {
        router.push("/checkout");
      }
    } catch (e) {
      toast({ title: "驗證超時", variant: "destructive" });
    } finally {
      setIsValidating(false);
    }
  };

  const promoInfo = useMemo(() => {
    const selectedItems = items.filter(i => i.selected !== false);
    if (!allPromos || subtotal <= 0 || selectedItems.length === 0) return { discount: 0, appliedPromos: [] as any[], cashPayment: 0 };
    
    const todayStr = format(new Date(), "yyyy-MM-dd");

    const candidates = allPromos.filter(p => {
      if (p.isPublic === false && (!appliedCouponInfo || p.code !== appliedCouponInfo.code)) return false;
      if (!appliedCouponInfo && (p.code || p.isPublic === false)) return false;
      if (p.startsAt && p.startsAt > todayStr) return false;
      if (p.endsAt && p.endsAt < todayStr) return false;
      return true;
    }).map(p => {
      const result = calculateDiscountForPromo(p, selectedItems, subtotal, userData);
      return { ...p, discount: result.discount, isPayment: result.isPayment, displayName: getPromoShortLabel(p, lang) };
    }).filter(r => r.discount > 0);

    const stackable = candidates.filter(p => p.isStackable !== false);
    const exclusive = candidates.filter(p => p.isStackable === false);

    let bestExclusive = exclusive[0];
    exclusive.forEach(p => { if (p.discount > (bestExclusive?.discount || 0)) bestExclusive = p; });

    const finalApplied = bestExclusive ? [bestExclusive] : stackable;
    const marketingDiscount = finalApplied.filter(p => !p.isPayment).reduce((sum, p) => sum + p.discount, 0);
    const cashPayment = finalApplied.filter(p => p.isPayment).reduce((sum, p) => sum + p.discount, 0);

    return { discount: marketingDiscount, appliedPromos: finalApplied, cashPayment: cashPayment };
  }, [items, subtotal, appliedCouponInfo, lang, userData, allPromos]);

  const total = useMemo(() => {
    return Math.ceil(Math.max(0, subtotal - promoInfo.discount) * 10) / 10;
  }, [subtotal, promoInfo.discount]);

  if (!mounted) return <div className="h-screen flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-12">
        <h1 className="text-3xl font-black font-headline mb-8">{cartT.title}</h1>
        {items.length === 0 ? (
          <div className="py-24 text-center space-y-6">
            <ShoppingBag className="h-24 w-24 text-muted-foreground/20 mx-auto" />
            <h2 className="text-2xl font-black">{cartT.empty}</h2>
            <Button asChild className="bg-primary px-12 h-14 font-black rounded-2xl shadow-lg">
              <Link href="/shop">{cartT.continue_shopping}</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-8 space-y-8">
              {(!user || user.isAnonymous) && (
                <Card className="border-none shadow-xl bg-slate-900 text-white rounded-[2rem] overflow-hidden animate-in fade-in duration-700">
                  <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                      <div className="h-14 w-14 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shrink-0"><Sparkles className="h-7 w-7 fill-current animate-pulse" /></div>
                      <div className="text-left space-y-1"><h3 className="text-xl font-black font-headline">現在登入，購物更輕鬆</h3><p className="text-slate-400 text-sm">註冊帳戶即可同步購物車、儲存收貨地址並賺取積分獎賞。</p></div>
                    </div>
                    <LoginDialog trigger={<Button className="bg-primary text-primary-foreground font-black px-10 h-12 rounded-xl shadow-lg hover:scale-105 transition-all">登入 / 註冊</Button>} />
                  </CardContent>
                </Card>
              )}

              <div className="animate-in slide-in-from-top-4 duration-700">
                 <ShippingMilestoneTracker subtotal={subtotal - promoInfo.discount} variant="full" />
              </div>

              <div className="bg-white p-4 rounded-2xl border shadow-sm flex items-center justify-between px-6">
                <div className="flex items-center gap-3">
                  <Checkbox checked={items.every(i => i.selected !== false)} onCheckedChange={(c) => selectAll(!!c)} />
                  <Label className="text-sm font-black uppercase">{isEn ? 'Select All' : '全選貨品'} ({items.length})</Label>
                </div>
              </div>
              
              <div className="space-y-4">
                {items.map((item) => (
                  <Card key={item.id} className={cn("border-none shadow-sm rounded-[2rem] bg-white transition-all", item.selected === false && "opacity-60")}>
                    <CardContent className="p-6 flex gap-6 items-center">
                      <Checkbox checked={item.selected !== false} onCheckedChange={() => toggleSelect(item.id)} />
                      <Link href={`/product/${item.slug || item.id}`} className="h-24 w-24 rounded-2xl bg-muted relative overflow-hidden shrink-0 border shadow-inner">
                        {item.image && <Image src={item.image} alt={item.name} fill className="object-cover" />}
                      </Link>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <Link href={`/product/${item.slug || item.id}`} className="min-w-0 flex-1 group">
                            <p className="text-[10px] font-black text-primary uppercase">{item.brand}</p>
                            <h3 className="font-bold text-lg truncate group-hover:text-primary transition-colors">{item.name}</h3>
                          </Link>
                          <button onClick={() => removeItem(item.id)} className="text-muted-foreground hover:text-destructive shrink-0"><Trash2 className="h-4 w-4" /></button>
                        </div>
                        
                        {/* 追加貨品提示 */}
                        {item.qty > item.availableStock && item.inventoryPolicy === 'Allow' && (
                          <div className="mt-2 p-2 bg-orange-50 rounded-xl border border-dashed border-orange-200 flex items-center gap-2 animate-in slide-in-from-left-2">
                             <Info className="h-3 w-3 text-orange-600" />
                             <span className="text-[10px] font-black text-orange-700 uppercase">
                               {isEn ? "Quantity exceeds stock, delivery may be delayed" : "訂購超過存貨數量，配送時間可能延長"}
                             </span>
                          </div>
                        )}

                        <div className="flex justify-between items-end mt-4">
                          <div className="flex items-center border rounded-xl overflow-hidden h-9 bg-muted/20">
                            <button className="px-3" onClick={() => updateQty(item.id, item.qty - 1)}><Minus className="h-3 w-3" /></button>
                            <span className="w-8 text-center font-bold text-xs">{item.qty}</span>
                            <button className="px-3" onClick={() => updateQty(item.id, item.qty + 1)}><Plus className="h-3 w-3" /></button>
                          </div>
                          <p className="font-black text-xl text-orange-600">${(item.price * item.qty).toFixed(1)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
            
            <div className="lg:col-span-4 space-y-6">
              <Card className="border-none shadow-sm bg-white rounded-3xl p-6">
                <Label className="text-[10px] font-black uppercase text-muted-foreground mb-2 block">優惠代碼 / 現金券</Label>
                <div className="flex gap-2">
                  <Input value={couponCode} onChange={e => setCouponCode(e.target.value.toUpperCase())} className="rounded-xl uppercase font-black" placeholder="CODE" />
                  <Button onClick={handleApplyCoupon} disabled={isApplyingCoupon || !couponCode}>{isApplyingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : "套用"}</Button>
                </div>
                {appliedCouponInfo && (
                  <div className="mt-3 flex items-center justify-between p-2 bg-green-50 rounded-xl border border-dashed border-green-200">
                    <span className="text-[10px] font-bold text-green-700 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> 已套用: {appliedCouponInfo.code}</span>
                    <button onClick={() => { setAppliedCouponInfo(null); setCouponCode(""); }} className="text-muted-foreground hover:text-destructive"><X className="h-3 w-3" /></button>
                  </div>
                )}
              </Card>

              <Card className="border-none shadow-xl bg-white rounded-[2.5rem] overflow-hidden">
                <div className="bg-primary/10 px-8 py-5 border-b"><h2 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2"><ShoppingBag className="h-4 w-4" />{cartT.summary}</h2></div>
                <CardContent className="p-8 space-y-6">
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm"><span>小計</span><span className="font-bold">${subtotal.toFixed(1)}</span></div>
                    {promoInfo.discount > 0 && (
                      <div className="space-y-2 pt-2 animate-in slide-in-from-right-2">
                        <p className="text-[10px] font-black uppercase text-muted-foreground opacity-60">已套用折扣:</p>
                        {promoInfo.appliedPromos.map((p, idx) => (
                          <div key={idx} className="flex justify-between items-center text-green-600 font-bold text-xs">
                            <span className="flex items-center gap-1">{p.type === 'fixed' ? <CreditCard className="h-3 w-3" /> : <Ticket className="h-3 w-3" />} {p.displayName}</span>
                            <span>-${p.discount.toFixed(1)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    <Separator className="border-dashed" />
                    <div className="flex justify-between items-center"><span className="text-base font-black uppercase">{cartT.total}</span><span className="text-4xl font-black text-orange-600">${total.toFixed(1)}</span></div>
                  </div>
                  <Button 
                    onClick={handleProceedToCheckout} 
                    className="w-full h-16 bg-primary text-primary-foreground text-xl font-black rounded-2xl shadow-lg gap-2"
                    disabled={isValidating || items.length === 0}
                  >
                    {isValidating ? <Loader2 className="h-6 w-6 animate-spin" /> : cartT.checkout}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
        <div className="mt-20">
          <ProductCarousels recentlyViewed={recentlyViewedProducts} randomProducts={randomList} t={t} lang={lang} />
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function CartPage() {
  return (<Suspense fallback={null}><CartContent /></Suspense>);
}
