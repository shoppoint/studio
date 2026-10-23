"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  Gift, 
  ChevronRight, 
  Baby, 
  Heart, 
  Users, 
  Sparkles, 
  Loader2,
  PackageSearch,
  ArrowRight,
  UserPlus,
  ShieldCheck,
  ShoppingBag,
  Info,
  Clock,
  ArrowUp,
  Activity,
  Smile,
  Briefcase,
  PartyPopper
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/i18n-context";
import { useFirestore, useCollection } from "@/firebase";
import { collection, query, where, limit, orderBy } from "firebase/firestore";
import { ProductCard } from "@/components/ProductCard";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export default function GiftZonePage() {
  const { t, lang } = useI18n();
  const db = useFirestore();
  const isEn = lang === 'en';
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  // 1. 核心修正：擴大搜尋池至 1000 件，並按最後更新時間排序
  const productsQuery = useMemo(() => {
    if (!db) return null;
    return query(
      collection(db, 'public_products'),
      where('status', '==', 'Active'),
      orderBy('updatedAt', 'desc'),
      limit(1000)
    );
  }, [db]);

  const { data: allProducts, loading: productsLoading } = useCollection<any>(productsQuery);

  // 2. 獲取促銷、分類與品牌資料用於卡片渲染
  const promosQuery = useMemo(() => db ? query(collection(db, 'promotions'), where('status', '==', 'active')) : null, [db]);
  const { data: allPromos } = useCollection<any>(promosQuery);
  
  const catsQuery = useMemo(() => db ? query(collection(db, 'categories'), where('isVisible', '==', true)) : null, [db]);
  const { data: allCategories } = useCollection<any>(catsQuery);

  const brandsQuery = useMemo(() => db ? query(collection(db, 'brands')) : null, [db]);
  const { data: allBrands } = useCollection<any>(brandsQuery);

  /**
   * 核心分類邏輯：掃描中英文標籤及索引字串
   */
  const giftGroups = useMemo(() => {
    if (!allProducts) return [];

    const filterByTag = (tag: string) => allProducts.filter(p => {
      const searchPool = [
        p.searchKeywordsRaw,
        p.searchKeywordsRaw_en,
        p.searchIndex
      ].filter(Boolean).join(" ").toLowerCase();
      
      return searchPool.includes(tag.toLowerCase());
    });

    return [
      {
        id: "kids",
        tag: "gift:kids",
        title: isEn ? "For Kids" : "小朋友驚喜",
        subtitle: isEn ? "Toys and fun items for the little ones." : "啟發創意與快樂的童趣選物。",
        icon: Baby,
        color: "text-blue-600 bg-blue-50",
        items: filterByTag("gift:kids")
      },
      {
        id: "elders",
        tag: "gift:elders",
        title: isEn ? "For Elders" : "長輩健康關懷",
        subtitle: isEn ? "Health and wellness gifts for your parents." : "細心呵護長輩健康的優質首選。",
        icon: Activity,
        color: "text-green-600 bg-green-50",
        items: filterByTag("gift:elders")
      },
      {
        id: "partner",
        tag: "gift:partner",
        title: isEn ? "For Partner" : "甜蜜伴侶精選",
        subtitle: isEn ? "Romantic gestures for your special one." : "表達愛意與品味的浪漫禮物。",
        icon: Heart,
        color: "text-pink-600 bg-pink-50",
        items: filterByTag("gift:partner")
      },
      {
        id: "friends",
        tag: "gift:friends",
        title: isEn ? "For Friends" : "好友精品禮物",
        subtitle: isEn ? "Thoughtful tokens for your besties." : "分享喜悅，送給最懂您的好朋友。",
        icon: Smile,
        color: "text-orange-600 bg-orange-50",
        items: filterByTag("gift:friends")
      },
      {
        id: "event",
        tag: "gift:event",
        title: isEn ? "Corporate & Farewell" : "活動／離職小禮物",
        subtitle: isEn ? "Perfect tokens for events or to thank colleagues." : "適合公司活動、感謝同伴或離職散貨的小巧心思。",
        icon: Briefcase,
        color: "text-indigo-600 bg-indigo-50",
        items: filterByTag("gift:event")
      },
      {
        id: "seasonal",
        tag: "gift:seasonal",
        title: isEn ? "Seasonal & Festive" : "節日禮品",
        subtitle: isEn ? "Curated limited items for the holidays." : "精選節慶限定禮品，與摯愛分享節日喜悅。",
        icon: PartyPopper,
        color: "text-red-600 bg-red-50",
        items: filterByTag("gift:seasonal")
      }
    ].filter(group => group.items.length > 0);
  }, [allProducts, isEn]);

  const scrollToSection = (id: string) => {
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-primary/10 py-16 md:py-24 border-b relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-5"><Gift className="h-64 w-64 text-primary" /></div>
          <div className="container mx-auto px-4 text-center relative z-10">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-4 uppercase tracking-widest font-bold">
              <Link href="/" className="hover:text-primary transition-colors">{t.nav.home}</Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground">{t.nav.gifts}</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black font-headline tracking-tighter mb-4">{t.nav.gifts}</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-medium">
              {isEn ? "Curated collections for every special someone in your life." : "為您生命中每一位重要的人，挑選一份承載溫度的禮物。"}
            </p>
          </div>
        </section>

        {/* Quick Nav Pills */}
        {!productsLoading && giftGroups.length > 0 && (
          <div className="sticky top-14 md:top-24 z-40 bg-white/90 backdrop-blur-md border-b shadow-sm">
            <div className="container mx-auto px-4 py-4">
              <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex gap-2">
                  {giftGroups.map((group) => (
                    <Button 
                      key={group.id} 
                      variant="outline" 
                      className="rounded-full h-10 px-6 font-bold hover:bg-primary transition-all flex items-center gap-2"
                      onClick={() => scrollToSection(group.id)}
                    >
                      <group.icon className="h-4 w-4" />
                      {group.title}
                    </Button>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" className="hidden" />
              </ScrollArea>
            </div>
          </div>
        )}

        <div className="container mx-auto px-4 py-12 space-y-24">
          {productsLoading ? (
            <div className="py-20 text-center flex flex-col items-center gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">正在為您挑選精選好物...</p>
            </div>
          ) : giftGroups.length === 0 ? (
            <div className="py-32 text-center border-4 border-dashed rounded-[3rem] bg-muted/5 space-y-6">
              <PackageSearch className="h-16 w-16 text-muted-foreground mx-auto opacity-20" />
              <div className="space-y-2">
                <p className="text-xl font-black">禮物專區正在補貨中</p>
                <p className="text-sm text-muted-foreground">目前尚未有產品被標記為推薦禮物。</p>
              </div>
              <Button asChild className="rounded-xl font-bold bg-primary px-8">
                <Link href="/shop">瀏覽所有產品</Link>
              </Button>
            </div>
          ) : (
            giftGroups.map((group) => (
              <section 
                key={group.id} 
                ref={(el) => { sectionRefs.current[group.id] = el; }} 
                className="scroll-mt-44 animate-in fade-in slide-in-from-bottom-4 duration-700"
              >
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
                  <div className="flex items-start gap-5">
                    <div className={cn("h-16 w-16 rounded-[1.5rem] flex items-center justify-center shadow-inner shrink-0", group.color)}>
                      <group.icon className="h-8 w-8" />
                    </div>
                    <div className="space-y-1">
                      <h2 className="text-3xl font-black font-headline tracking-tighter">{group.title}</h2>
                      <p className="text-muted-foreground font-medium">{group.subtitle}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="h-7 px-4 rounded-lg font-black text-[10px] uppercase tracking-widest bg-white border-muted-foreground/20">
                    {group.items.length} {isEn ? 'Items' : '件貨品'}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                  {group.items.slice(0, 15).map((p) => (
                    <ProductCard 
                      key={p.id} 
                      product={p} 
                      allPromos={allPromos} 
                      allCategories={allCategories} 
                      allBrands={allBrands}
                    />
                  ))}
                </div>

                {group.items.length > 15 && (
                  <div className="mt-10 text-center">
                    <Button asChild variant="outline" className="rounded-2xl h-14 px-10 border-primary text-primary font-black gap-2 hover:bg-primary hover:text-white transition-all">
                      <Link href={`/shop?q=${group.tag}`}>
                        {isEn ? `View All ${group.title}` : `查看全部「${group.title}」`}
                        <ArrowRight className="h-5 w-5" />
                      </Link>
                    </Button>
                  </div>
                )}
              </section>
            ))
          )}
        </div>

        {/* Gift Guide Footer */}
        <section className="container mx-auto px-4 pb-24">
          <Card className="border-none shadow-xl bg-slate-900 text-white rounded-[3rem] overflow-hidden">
            <CardContent className="p-10 md:p-16 flex flex-col md:flex-row items-center gap-12 text-center md:text-left">
              <div className="h-24 w-24 rounded-3xl bg-primary/20 flex items-center justify-center text-primary shrink-0 border border-primary/20">
                <Sparkles className="h-12 w-12" />
              </div>
              <div className="flex-1 space-y-4">
                <h3 className="text-3xl font-black font-headline">找不到心水禮物？</h3>
                <p className="text-slate-400 text-lg leading-relaxed max-w-2xl font-medium">
                  點擊右下角的 AI 購物小助手，輸入您的預算及送禮對象，讓我們為您提供量身定制的建議。
                </p>
                <div className="pt-4 flex flex-wrap justify-center md:justify-start gap-4">
                  <Button 
                    className="bg-primary text-primary-foreground font-black h-14 px-10 rounded-2xl shadow-lg hover:scale-105 transition-transform"
                    onClick={() => window.dispatchEvent(new CustomEvent('open-smart-assistant'))}
                  >
                    啟動 AI 推薦 <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Back to top button */}
        <button 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-24 right-6 md:bottom-8 md:right-8 h-12 w-12 bg-white shadow-2xl rounded-full border border-muted flex items-center justify-center hover:bg-muted transition-colors z-50 group"
        >
          <ArrowUp className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
        </button>
      </main>
      <Footer />
    </div>
  );
}
