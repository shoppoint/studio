
"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Bot, Zap, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { useI18n } from "@/lib/i18n/i18n-context";
import { cn } from "@/lib/utils";
import { useFirestore, useCollection } from "@/firebase";
import { collection, query, where, orderBy, limit } from "firebase/firestore";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Skeleton } from "@/components/ui/skeleton";

interface HeroBannerProps {
  shouldLoad?: boolean;
}

/**
 * 智慧 Hero Banner 組件 (效能穩定版)
 * 優化：嚴格控制載入順序，查詢期間顯示 Skeleton 消除閃爍感。
 */
export function HeroBanner({ shouldLoad = true }: HeroBannerProps) {
  const { lang } = useI18n();
  const db = useFirestore();
  const isEn = lang === 'en';
  const [hasTimedOut, setHasTimedOut] = useState(false);

  // 1. 抓取已勾選「顯示在橫幅」的文章
  const bannerArticlesQuery = useMemo(() => {
    if (!db || !shouldLoad) return null;
    return query(
      collection(db, 'articles'),
      where('showOnBanner', '==', true),
      where('status', '==', 'published'),
      orderBy('bannerWeight', 'desc'),
      limit(5)
    );
  }, [db, shouldLoad]);

  const { data: articles, loading } = useCollection<any>(bannerArticlesQuery);

  // 設定一個 1.5 秒的超時保護，如果資料庫太慢，則切換到靜態橫幅
  useEffect(() => {
    if (loading && shouldLoad) {
      const timer = setTimeout(() => setHasTimedOut(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [loading, shouldLoad]);

  // 2. 靜態備援橫幅
  const staticBanners = useMemo(() => [
    {
      id: "static-1",
      tagline: isEn ? "Let us help you choose" : "讓我們陪您一起挑選",
      summary: isEn ? "Whether it's gift-giving dilemmas or finding quality goods, our Smart Assistant is ready to chat anytime." : "無論是挑選禮物的煩惱，還是對好物的疑惑，我們隨時都在。",
      cta: isEn ? "Ask Assistant" : "問問小助手",
      link: "/faq",
      bgClass: "bg-[#FEF9C3]",
      textColor: "text-amber-950",
      centered: true,
      imageUrl: PlaceHolderImages.find(img => img.id === 'hero-bg')?.imageUrl,
      design: <Bot className="absolute -right-10 -bottom-10 h-64 w-64 rotate-12 opacity-20 pointer-events-none" />
    },
    {
      id: "static-2",
      tagline: isEn ? "Clearance Mega Sale" : "激減清貨特賣",
      summary: isEn ? "Don't miss out! Premium goods at clearance prices. Limited stock available." : "絕不能錯過！優質好物以震撼清貨價發售，數量有限，售完即止。",
      cta: isEn ? "Shop Clearance" : "立即搶購",
      link: "/clearance",
      bgClass: "bg-orange-600",
      textColor: "text-white",
      design: <Zap className="absolute right-[-20px] top-[-20px] h-72 w-72 text-white opacity-20 -rotate-12 pointer-events-none fill-current" />
    }
  ], [isEn]);

  const activeBanners = useMemo(() => {
    if (!shouldLoad) return [];
    
    // 如果正在讀取且尚未超時，返回空數組讓渲染層顯示 Skeleton
    if (loading && !hasTimedOut) return [];

    if (articles && articles.length > 0) {
      return articles.map((art: any) => {
        const l = isEn ? 'en' : 'zh';
        return {
          id: art.id,
          tagline: art.bannerHeading?.[l] || art.title?.[l] || "",
          summary: art.bannerSubtitle?.[l] || art.excerpt?.[l] || "",
          cta: art.bannerCtaText?.[l] || (isEn ? "Read More" : "閱讀更多"),
          link: art.bannerTargetUrl || `/news/${art.id}`,
          imageUrl: art.coverImage,
          isDynamic: true
        };
      });
    }
    
    return staticBanners;
  }, [articles, loading, isEn, shouldLoad, staticBanners, hasTimedOut]);

  // 如果正在加載且未超時，顯示骨架屏
  if (!shouldLoad || (loading && !hasTimedOut)) {
    return (
      <div className="w-full h-[280px] md:h-[400px] rounded-[2.5rem] overflow-hidden">
        <Skeleton className="w-full h-full animate-pulse" />
      </div>
    );
  }

  return (
    <div className="w-full h-[280px] md:h-[400px] animate-in fade-in duration-500">
      <Carousel opts={{ loop: true }} plugins={[Autoplay({ delay: 6000 })]}>
        <CarouselContent>
          {activeBanners.map((banner: any, index: number) => (
            <CarouselItem key={banner.id}>
              <div className={cn(
                "relative flex w-full h-[280px] md:h-[400px] items-center overflow-hidden rounded-[2.5rem] shadow-xl",
                banner.bgClass || "bg-slate-900"
              )}>
                {banner.imageUrl ? (
                  <>
                    <Image 
                      src={banner.imageUrl} 
                      alt={banner.tagline} 
                      fill 
                      className="object-cover transition-transform duration-[10s] scale-105"
                      priority={index === 0}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
                  </>
                ) : banner.design}

                <div className={cn("container relative z-10 px-8 md:px-16", banner.centered && "text-center")}>
                  <div className={cn(
                    "max-w-2xl space-y-4", 
                    banner.textColor || "text-white",
                    banner.centered && "mx-auto"
                  )}>
                    <div className="space-y-2">
                      {banner.isDynamic && (
                        <Badge className="bg-primary/20 text-primary border-primary/20 text-[10px] font-black uppercase tracking-tighter mb-2">
                          <Sparkles className="h-3 w-3 mr-1" /> Featured
                        </Badge>
                      )}
                      <h2 className="text-2xl font-black sm:text-4xl md:text-5xl font-headline leading-tight tracking-tighter">
                        {banner.tagline}
                      </h2>
                    </div>
                    <p className="text-xs md:text-lg font-medium opacity-90 leading-relaxed max-w-lg line-clamp-2 md:line-clamp-none">
                      {banner.summary}
                    </p>
                    <Button asChild size="lg" className={cn(
                      "rounded-xl font-black mt-2 md:mt-6 shadow-lg h-11 md:h-14 px-8 md:px-10 gap-3",
                      banner.bgClass === "bg-orange-600" ? "bg-white text-orange-600 hover:bg-slate-100" : "bg-primary text-primary-foreground"
                    )}>
                      <Link href={banner.link} prefetch={false}>
                        {banner.cta} <ArrowRight className="h-5 w-5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
}
