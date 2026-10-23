"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { TrendingUp, Loader2, ArrowRight, Flame, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ProductCard";
import { useI18n } from "@/lib/i18n/i18n-context";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { getExpandedCriteria } from "@/lib/shop-utils";

interface TrendingSectionProps {
  products: any[] | null;
  categories: any[] | null;
  loading: boolean;
  allPromos?: any[] | null;
  allCategories?: any[] | null;
  allBrands?: any[] | null;
}

/**
 * 人氣熱銷排行區塊 - 混合加權版 (V3)
 * 邏輯：1. 從資料庫按興趣度(addedToCartCount)抓取候選池。
 *       2. 在前端應用「近期活躍度(updatedAt)」加權，計算 Hybrid Score。
 *       3. 確保高人氣老產品與近期爆紅款都能進入清單。
 */
export function TrendingSection({ products, categories, loading, allPromos, allCategories, allBrands }: TrendingSectionProps) {
  const { lang, t } = useI18n();
  const [selectedCatId, setSelectedCatId] = useState("all");
  const isEn = lang === 'en';

  // 1. 計算出現在熱銷清單中的相關主分類
  const relevantMainCategories = useMemo(() => {
    if (!products || !categories) return [];
    
    const usedMainCatIds = new Set<string>();
    
    products.forEach(p => {
      const pCats = Array.isArray(p.categories) ? p.categories : [p.categories];
      pCats.forEach((catId: string) => {
        let current = categories.find(c => String(c.id) === String(catId));
        while (current && current.parentId && current.parentId !== "none" && current.parentId !== "") {
          const parent = categories.find(c => String(c.id) === String(current.parentId));
          if (!parent) break;
          current = parent;
        }
        if (current) usedMainCatIds.add(current.id);
      });
    });

    return categories.filter(c => usedMainCatIds.has(c.id) && (!c.parentId || c.parentId === "none" || c.parentId === ""));
  }, [products, categories]);

  // 2. 混合加權排序邏輯
  const filteredTrending = useMemo(() => {
    if (!products) return [];
    
    const now = Date.now();
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

    // A. 計算加權得分
    const scoredPool = products.map(p => {
      const totalInterest = Number(p.addedToCartCount) || 0;
      
      // 計算近期活躍加分 (Recency Bonus)
      let recencyBonus = 0;
      if (p.updatedAt?.seconds) {
        const lastActivityMs = p.updatedAt.seconds * 1000;
        const timeDiff = now - lastActivityMs;
        
        // 如果 7 天內有更新（有人加入購物車），則獲得 20%~50% 的額外權重加分
        if (timeDiff < SEVEN_DAYS_MS) {
          const recencyFactor = 1 - (timeDiff / SEVEN_DAYS_MS);
          recencyBonus = totalInterest * 0.5 * recencyFactor;
        }
      }

      return {
        ...p,
        _hybridScore: totalInterest + recencyBonus
      };
    });

    // B. 按得分排序
    let pool = scoredPool.sort((a, b) => b._hybridScore - a._hybridScore);
    
    // 排除門市限定
    pool = pool.filter(p => p.inStoreOnly !== true);

    if (selectedCatId === 'all') return pool.slice(0, 15);

    // C. 類別過濾
    const criteria = getExpandedCriteria([selectedCatId], categories || []);
    return pool.filter(p => {
      const pCats = Array.isArray(p.categories) ? p.categories : [p.categories];
      return pCats.some((catId: any) => criteria.ids.includes(String(catId)));
    }).slice(0, 15);
  }, [products, selectedCatId, categories]);

  const getCatName = (cat: any) => lang === 'en' ? (cat.name_en || cat.name_zh) : (cat.name_zh || cat.name_en);

  return (
    <section className="py-12 md:py-20 border-b overflow-hidden bg-white">
      <div className="container px-4 mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div className="space-y-1">
            <h2 className="text-xl md:text-3xl font-black font-headline flex items-center gap-3 text-slate-900">
              <Flame className="h-5 w-5 md:h-6 md:w-6 text-orange-600 fill-current" />
              {isEn ? "Trending Now" : "人氣熱銷"}
            </h2>
            <p className="text-xs md:text-sm text-muted-foreground font-medium">基於興趣累積與近期活躍度綜合推薦。</p>
          </div>
          <div className="hidden md:block">
            <Button asChild variant="ghost" className="font-bold text-primary gap-2 rounded-xl">
              <Link href="/shop?sort=popular">{t.sections.view_all} <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
        </div>

        {relevantMainCategories.length > 0 && (
          <div className="mb-8">
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-2 pb-2">
                <Button 
                  variant={selectedCatId === 'all' ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "rounded-full font-bold h-9 px-6 text-xs transition-all", 
                    selectedCatId === 'all' ? "shadow-md scale-105 bg-primary text-primary-foreground" : "bg-white border-muted-foreground/20"
                  )}
                  onClick={() => setSelectedCatId('all')}
                >
                  {isEn ? 'All Trending' : '全部熱銷'}
                </Button>
                {relevantMainCategories.map(cat => (
                  <Button 
                    key={cat.id}
                    variant={selectedCatId === cat.id ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "rounded-full font-bold h-8 md:h-9 px-4 md:px-6 text-[10px] md:text-xs transition-all", 
                      selectedCatId === cat.id ? "shadow-md scale-105 bg-primary text-primary-foreground" : "bg-white border-muted-foreground/20"
                    )}
                    onClick={() => setSelectedCatId(cat.id)}
                  >
                    {getCatName(cat)}
                  </Button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" className="hidden" />
            </ScrollArea>
          </div>
        )}

        {loading ? (
          <div className="py-24 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          </div>
        ) : filteredTrending.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground italic border-2 border-dashed rounded-[2rem] bg-muted/5 text-sm">
            {isEn ? "No items found in this category." : "此分類目前暫無熱銷數據。"}
          </div>
        ) : (
          <div className="relative group/carousel">
            <Carousel opts={{ align: "start", loop: true, containScroll: "trimSnaps" }} className="w-full">
              <CarouselContent className="-ml-3 md:-ml-4">
                {filteredTrending.map((p) => (
                  <CarouselItem key={p.id} className="pl-3 md:pl-4 basis-[45%] sm:basis-[35%] md:basis-1/3 lg:basis-1/4 xl:basis-1/5">
                    <div className="h-full py-2">
                      <ProductCard 
                        product={p} 
                        compact 
                        allPromos={allPromos} 
                        allCategories={allCategories || categories} 
                        allBrands={allBrands} 
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
        )}
      </div>
    </section>
  );
}