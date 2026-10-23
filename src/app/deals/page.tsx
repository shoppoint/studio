
"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  Zap, 
  Tag, 
  Truck, 
  Copy, 
  ArrowRight,
  Percent,
  Info,
  Heart,
  FileText,
  ShoppingBag,
  Loader2,
  Ticket,
  HeartHandshake,
  ChevronRight,
  CheckCircle2,
  ArrowDown,
  Sparkles
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useI18n } from "@/lib/i18n/i18n-context";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useUser, useFirestore, useCollection, useDoc } from "@/firebase";
import { collection, query, where, orderBy, doc, limit } from "firebase/firestore";
import { format } from "date-fns";
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselNext, 
  CarouselPrevious 
} from "@/components/ui/carousel";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ProductCard, ProductCardSkeleton } from "@/components/ProductCard";
import { getExpandedCriteria, findAllActivePromos } from "@/lib/shop-utils";

function DealsContent() {
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const db = useFirestore();
  const { userData } = useUser();

  const [limitAuto, setLimitAuto] = useState(6);
  const [limitCoupon, setLimitCoupon] = useState(6);
  const [limitImpact, setLimitImpact] = useState(6);

  // 1. 獲取所有促銷活動
  const promosQuery = useMemo(() => {
    if (!db) return null;
    return query(
      collection(db, 'promotions'),
      where('status', '==', 'active'),
      where('isPublic', '==', true),
      orderBy('updatedAt', 'desc')
    );
  }, [db]);

  const { data: rawPromos, loading: promosLoading } = useCollection<any>(promosQuery);

  // 2. 獲取產品與分類用於交叉比對
  const productsQuery = useMemo(() => {
    if (!db) return null;
    return query(
      collection(db, 'public_products'),
      where('status', '==', 'Active'),
      limit(500) // 擴大抓取範圍以確保優惠產品不遺漏
    );
  }, [db]);
  const { data: allProducts, loading: productsLoading } = useCollection<any>(productsQuery);

  const categoriesQuery = useMemo(() => {
    if (!db) return null;
    return query(
      collection(db, 'categories'),
      where('isVisible', '==', true)
    );
  }, [db]);
  const { data: allCategories } = useCollection<any>(categoriesQuery);

  const [publicPromos, setPublicPromos] = useState<any[]>([]);

  useEffect(() => {
    if (!rawPromos) return;
    const todayStr = format(new Date(), "yyyy-MM-dd");
    const filtered = rawPromos.filter(p => {
      if (p.startsAt && p.startsAt > todayStr) return false;
      if (p.endsAt && p.endsAt < todayStr) return false;
      return true;
    });
    setPublicPromos(filtered);
  }, [rawPromos]);

  const { automaticDeals, couponDeals, impactDeals } = useMemo(() => {
    return {
      automaticDeals: publicPromos.filter(p => !p.isImpactCampaign && !p.code),
      couponDeals: publicPromos.filter(p => !p.isImpactCampaign && p.code),
      impactDeals: publicPromos.filter(p => p.isImpactCampaign === true)
    };
  }, [publicPromos]);

  /**
   * 核心邏輯：篩選出受惠於目前 listed 促銷規則的產品
   */
  const promotedProducts = useMemo(() => {
    if (!allProducts || publicPromos.length === 0) return [];
    
    // 排除「只限門市」的產品
    const sellablePool = allProducts.filter(p => p.inStoreOnly !== true);

    return sellablePool.filter(product => {
      const activePromos = findAllActivePromos(product, publicPromos, allCategories || [], userData);
      return activePromos.length > 0;
    }).slice(0, 20); // 輪播限制在前 20 件熱門優惠貨品
  }, [allProducts, publicPromos, allCategories, userData]);

  const handleCopyCode = async (code: string) => {
    if (!code) return;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(code);
        toast({ title: lang === 'en' ? "Code Copied!" : "優惠碼已複製", description: code });
      } else {
        throw new Error("Clipboard unavailable");
      }
    } catch (err) {
      toast({ title: lang === 'en' ? "Promo Code" : "優惠代碼", description: code });
    }
  };

  const isGlobalLoading = promosLoading || productsLoading;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow">
        <section className="bg-primary/10 py-12 md:py-20 relative overflow-hidden text-center border-b">
          <div className="absolute top-0 right-0 p-12 opacity-5"><Ticket className="h-64 w-64" /></div>
          <div className="container relative z-10 mx-auto px-4">
            <h1 className="text-4xl md:text-6xl font-black font-headline tracking-tighter mb-4">
              {lang === 'en' ? "Special Offers" : "特惠資訊與活動"}
            </h1>
            <p className="text-muted-foreground text-lg font-medium max-w-2xl mx-auto">
              掌握全站最新的直減優惠、專屬折扣碼及公益聯乘活動。
            </p>
          </div>
        </section>

        <div className="container mx-auto px-4 py-16 space-y-24">
          {isGlobalLoading ? (
            <div className="py-20 text-center flex flex-col items-center gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">正在獲取最新優惠...</p>
            </div>
          ) : (
            <div className="space-y-32 pb-20">
              
              {/* 0. NEW: Promoted Products Carousel */}
              {promotedProducts.length > 0 && (
                <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shrink-0">
                        <Sparkles className="h-6 w-6 fill-current animate-pulse" />
                      </div>
                      <div className="space-y-1">
                        <h2 className="text-2xl md:text-3xl font-black font-headline tracking-tight">{lang === 'en' ? 'Hot Deal Items' : '本週特惠貨品精選'}</h2>
                        <p className="text-sm text-muted-foreground font-medium">根據目前活動規則為您選出的熱門優惠產品。</p>
                      </div>
                    </div>
                  </div>

                  <div className="relative group/carousel px-2">
                    <Carousel opts={{ align: "start", loop: true, containScroll: "trimSnaps" }} className="w-full">
                      <CarouselContent className="-ml-3 md:-ml-4">
                        {promotedProducts.map((p) => (
                          <CarouselItem key={p.id} className="pl-3 md:pl-4 basis-[45%] sm:basis-[35%] md:basis-1/3 lg:basis-1/4 xl:basis-1/5">
                            <div className="h-full py-2">
                              <ProductCard 
                                product={p} 
                                compact 
                                allPromos={publicPromos} 
                                allCategories={allCategories}
                              />
                            </div>
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      <div className="hidden lg:block">
                        <CarouselPrevious className="absolute -left-6 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white border-2 border-primary/20 text-primary shadow-xl hover:bg-primary hover:text-white transition-all z-20" />
                        <CarouselNext className="absolute -right-6 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white border-2 border-primary/20 text-primary shadow-xl hover:bg-primary hover:text-white transition-all z-20" />
                      </div>
                    </Carousel>
                  </div>
                </section>
              )}

              {/* 1. Automatic Direct Deals */}
              {automaticDeals.length > 0 && (
                <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className="flex items-center gap-4 mb-10">
                    <div className="h-12 w-12 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 shadow-sm shrink-0">
                      <Zap className="h-6 w-6 fill-current" />
                    </div>
                    <div className="space-y-1">
                      <h2 className="text-2xl md:text-3xl font-black font-headline tracking-tight">{lang === 'en' ? 'Automatic Deals' : '限定直減優惠'}</h2>
                      <p className="text-sm text-muted-foreground font-medium">無需輸入代碼，結帳時系統將根據規則自動套用。</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {automaticDeals.slice(0, limitAuto).map((promo) => (
                      <PromoCard key={promo.id} promo={promo} lang={lang} onCopy={handleCopyCode} />
                    ))}
                  </div>
                  {automaticDeals.length > limitAuto && (
                    <div className="mt-12 text-center">
                      <Button variant="outline" className="rounded-2xl h-12 px-10 font-bold border-muted-foreground/20 hover:bg-muted/50 gap-2" onClick={() => setLimitAuto(prev => prev + 6)}>
                        顯示更多優惠 <ArrowDown className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </section>
              )}

              {/* 2. Coupon Code Campaigns */}
              {couponDeals.length > 0 && (
                <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className="flex items-center gap-4 mb-10">
                    <div className="h-12 w-12 rounded-2xl bg-red-100 flex items-center justify-center text-red-600 shadow-sm shrink-0">
                      <Ticket className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <h2 className="text-2xl md:text-3xl font-black font-headline tracking-tight">{lang === 'en' ? 'Exclusive Coupons' : '專屬優惠碼活動'}</h2>
                      <p className="text-sm text-muted-foreground font-medium">請在結帳頁面手動輸入以下優惠碼以獲取扣減。</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {couponDeals.slice(0, limitCoupon).map((promo) => (
                      <PromoCard key={promo.id} promo={promo} lang={lang} onCopy={handleCopyCode} />
                    ))}
                  </div>
                  {couponDeals.length > limitCoupon && (
                    <div className="mt-12 text-center">
                      <Button variant="outline" className="rounded-2xl h-12 px-10 font-bold border-muted-foreground/20 hover:bg-muted/50 gap-2" onClick={() => setLimitCoupon(prev => prev + 6)}>
                        顯示更多代碼 <ArrowDown className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </section>
              )}

              {/* 3. CSR Impact Campaigns */}
              {impactDeals.length > 0 && (
                <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className="flex items-center gap-4 mb-10">
                    <div className="h-12 w-12 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
                      <HeartHandshake className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <h2 className="text-2xl md:text-3xl font-black font-headline tracking-tight text-indigo-900">{lang === 'en' ? 'Impact Campaigns' : '公益聯乘活動'}</h2>
                      <p className="text-sm text-muted-foreground font-medium">選購此類別產品，我們將與您一起為社區出一分力。</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {impactDeals.slice(0, limitImpact).map((promo) => (
                      <PromoCard key={promo.id} promo={promo} lang={lang} onCopy={handleCopyCode} isImpact />
                    ))}
                  </div>
                  {impactDeals.length > limitImpact && (
                    <div className="mt-12 text-center">
                      <Button variant="outline" className="rounded-2xl h-12 px-10 font-bold border-indigo-200 text-indigo-700 hover:bg-indigo-50 gap-2" onClick={() => setLimitImpact(prev => prev + 6)}>
                        顯示更多公益活動 <ArrowDown className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </section>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

function PromoCard({ promo, lang, onCopy, isImpact = false }: any) {
  const title = lang === 'en' ? (promo.name?.en || promo.name?.zh) : (promo.name?.zh || promo.name?.en);
  const summary = lang === 'en' ? (promo.publicSummary?.en || promo.publicSummary?.zh) : (promo.publicSummary?.zh || promo.publicSummary?.en);
  
  return (
    <Card className={cn(
      "border-none shadow-lg rounded-[2.5rem] overflow-hidden bg-white flex flex-col h-full group hover:shadow-2xl transition-all duration-500",
      isImpact ? "border-l-8 border-indigo-600" : ""
    )}>
      <div className="relative aspect-[2/1] bg-muted overflow-hidden">
        {promo.imageUrl ? (
          <Image src={promo.imageUrl} alt={title} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-primary/5">
            {isImpact ? <HeartHandshake className="h-12 w-12 text-indigo-100" /> : <Ticket className="h-12 w-12 text-primary/10" />}
          </div>
        )}
        {promo.isImpactCampaign && (
          <div className="absolute top-4 left-4">
            <Badge className="bg-indigo-600 text-white border-none font-black text-[10px] px-3 h-6 uppercase shadow-lg">CSR</Badge>
          </div>
        )}
      </div>
      <CardContent className="p-8 flex-1 flex flex-col justify-between gap-6">
        <div className="space-y-3">
          <h3 className={cn("text-xl font-black font-headline leading-tight", isImpact ? "text-indigo-950" : "text-slate-900")}>
            {title}
          </h3>
          <p className="text-muted-foreground text-sm leading-relaxed italic line-clamp-3">
            {summary}
          </p>
        </div>

        <div className="space-y-4">
          {promo.code && (
            <div className="bg-muted/50 p-3 rounded-2xl flex items-center justify-between border border-dashed group-hover:border-primary/30 transition-colors">
              <div className="space-y-0.5">
                <p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">PROMO CODE</p>
                <code className="font-mono font-black text-xl text-primary tracking-widest">{promo.code}</code>
              </div>
              <Button size="icon" variant="ghost" onClick={() => onCopy(promo.code)} className="h-10 w-10 rounded-xl hover:bg-primary hover:text-white transition-all">
                <Copy className="h-5 w-5" />
              </Button>
            </div>
          )}

          <Button asChild className={cn(
            "w-full h-14 font-black rounded-2xl shadow-xl hover:scale-[1.02] transition-all gap-2 text-lg",
            isImpact ? "bg-indigo-600 text-white hover:bg-indigo-700" : "bg-primary text-primary-foreground"
          )}>
            <Link href={promo.targetUrl || "/shop"}>
              {lang === 'en' ? 'Shop Now' : '立即選購'}
              <ArrowRight className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DealsPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <DealsContent />
    </Suspense>
  );
}
