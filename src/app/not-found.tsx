"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import Link from 'next/link';
import { 
  SearchX, 
  Home, 
  ShoppingBag, 
  Zap, 
  Sparkles, 
  ChevronRight, 
  Info, 
  Loader2, 
  MessageCircle,
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { ProductCard, ProductCardSkeleton } from "@/components/ProductCard";
import { useFirestore, useCollection } from "@/firebase";
import { collection, query, where, limit, orderBy } from "firebase/firestore";
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselNext, 
  CarouselPrevious 
} from "@/components/ui/carousel";
import { useI18n } from "@/lib/i18n/i18n-context";

/**
 * 404 內容組件 - 強化支援聯繫與熱門產品推薦
 */
function NotFoundContent() {
  const { t, lang } = useI18n();
  const db = useFirestore();
  const [mounted, setMounted] = useState(false);
  const isEn = lang === 'en';

  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. 抓取精選產品作為推薦池
  const featuredQuery = useMemo(() => {
    if (!db) return null;
    return query(
      collection(db, 'public_products'),
      where('status', '==', 'Active'),
      where('isFeatured', '==', 'Yes'),
      orderBy('createdAt', 'desc'),
      limit(10)
    );
  }, [db]);

  const { data: products, loading } = useCollection<any>(featuredQuery);

  const whatsappUrl = "https://wa.me/85253252555";

  if (!mounted) return null;

  return (
    <div className="w-full space-y-20 animate-in fade-in duration-700 py-12">
      {/* 核心錯誤訊息區 */}
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="space-y-6">
          <div className="h-24 w-24 bg-primary/10 rounded-full flex items-center justify-center text-primary mx-auto shadow-inner">
            <SearchX className="h-12 w-12" />
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-black font-headline tracking-tighter text-slate-900">
              找不到頁面 (404)
            </h1>
            <p className="text-slate-500 max-w-md mx-auto leading-relaxed text-sm font-medium">
              抱歉，您訪問的網址可能已過期或被移動。如果您在搜尋特定貨品時遇到困難，請隨時聯絡我們。
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button asChild className="rounded-2xl h-14 px-10 font-black bg-primary text-primary-foreground shadow-xl gap-2 hover:scale-105 transition-transform">
              <Link href="/">
                <Home className="h-5 w-5" /> 返回首頁
              </Link>
            </Button>
            <Button variant="outline" asChild className="rounded-2xl h-14 px-10 font-black bg-green-50 border-green-200 text-green-700 hover:bg-green-600 hover:text-white transition-all gap-2">
              <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-5 w-5" /> WhatsApp 支援
              </a>
            </Button>
          </div>
        </div>

        {/* 導航分流卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          <Link href="/new-arrivals" className="p-6 bg-white border rounded-3xl hover:border-primary/30 hover:shadow-lg transition-all text-left group">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
              <Sparkles className="h-5 w-5 animate-pulse" />
            </div>
            <h3 className="font-black text-sm uppercase mb-1">新品上架</h3>
            <p className="text-[10px] text-muted-foreground leading-tight">查看本週最新到貨優質良品。</p>
            <ChevronRight className="h-4 w-4 mt-4 text-primary opacity-0 group-hover:opacity-100 transition-all" />
          </Link>
          
          <Link href="/clearance" className="p-6 bg-white border rounded-3xl hover:border-orange-200 hover:shadow-lg transition-all text-left group">
            <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 mb-4">
              <Zap className="h-5 w-5 fill-current" />
            </div>
            <h3 className="font-black text-sm uppercase mb-1">清貨特賣</h3>
            <p className="text-[10px] text-muted-foreground leading-tight">即期品及斷碼貨品驚喜折扣。</p>
            <ChevronRight className="h-4 w-4 mt-4 text-orange-600 opacity-0 group-hover:opacity-100 transition-all" />
          </Link>

          <Link href="/faq" className="p-6 bg-white border rounded-3xl hover:border-blue-200 hover:shadow-lg transition-all text-left group">
            <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 mb-4">
              <Info className="h-5 w-5" />
            </div>
            <h3 className="font-black text-sm uppercase mb-1">常見問題</h3>
            <p className="text-[10px] text-muted-foreground leading-tight">全能購物助手隨時為您效勞。</p>
            <ChevronRight className="h-4 w-4 mt-4 text-blue-600 opacity-0 group-hover:opacity-100 transition-all" />
          </Link>
        </div>
      </div>

      {/* 產品推薦輪播區塊 (挽留顧客的核心) */}
      <section className="space-y-8 animate-in slide-in-from-bottom-8 duration-1000">
        <div className="flex items-center justify-between px-2">
          <div className="space-y-1">
            <h2 className="text-2xl font-black font-headline flex items-center gap-3 text-slate-900">
              <TrendingUp className="h-6 w-6 text-primary" />
              {isEn ? "Guess You May Like" : "別空手而回！猜您感興趣"}
            </h2>
            <p className="text-sm text-muted-foreground font-medium">雖然沒找到該頁面，但這些熱門選物或許適合您。</p>
          </div>
          <Button asChild variant="ghost" className="font-bold text-primary gap-2 rounded-xl hidden sm:flex">
            <Link href="/recommendations">查看所有推介 <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : !products || products.length === 0 ? null : (
          <div className="relative">
            <Carousel opts={{ align: "start", loop: true }} className="w-full">
              <CarouselContent className="-ml-4">
                {products.map((p: any) => (
                  <CarouselItem key={p.id} className="pl-4 basis-[45%] sm:basis-1/3 lg:basis-1/4 xl:basis-1/5">
                    <div className="h-full py-2">
                      <ProductCard product={p} compact />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="hidden lg:block">
                <CarouselPrevious className="-left-6 bg-white border-primary/20 text-primary hover:bg-primary hover:text-white shadow-xl transition-all z-20" />
                <CarouselNext className="-right-6 bg-white border-primary/20 text-primary hover:bg-primary hover:text-white shadow-xl transition-all z-20" />
              </div>
            </Carousel>
          </div>
        )}
      </section>
    </div>
  );
}

/**
 * 404 頁面根組件
 */
export default function NotFound() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      <main className="flex-grow flex flex-col items-center justify-center p-6 text-center bg-muted/5">
        <div className="container mx-auto max-w-6xl">
          <Suspense fallback={<div className="py-24"><Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" /></div>}>
            <NotFoundContent />
          </Suspense>
        </div>
      </main>
      <Footer />
    </div>
  );
}
