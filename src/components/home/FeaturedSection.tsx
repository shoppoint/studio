
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Sparkles, Trophy, Loader2, ArrowRight } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductCard, ProductCardSkeleton } from "@/components/ProductCard";
import { RankingList } from "@/components/RankingList";
import { useI18n } from "@/lib/i18n/i18n-context";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { getExpandedCriteria } from "@/lib/shop-utils";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface FeaturedSectionProps {
  featured: any[] | null;
  arrivals: any[] | null;
  clearance: any[] | null;
  loading: boolean;
  snapshot?: any;
  allPromos?: any[] | null;
  allCategories?: any[] | null;
  allActiveProducts?: any[] | null;
  allBrands?: any[] | null;
  categories: any[] | null;
}

/**
 * 精選產品與排行榜組件 (優化版：支援全量快照數據)
 */
export function FeaturedSection({ 
  featured, arrivals, clearance, loading, snapshot, 
  allPromos = null, 
  allCategories = null,
  allActiveProducts = null,
  allBrands = null,
  categories
}: FeaturedSectionProps) {
  const { t, lang } = useI18n();
  const [selectedCatId, setSelectedCatId] = useState("all");
  const [randomFeatured, setRandomFeatured] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const relevantMainCategories = useMemo(() => {
    if (!featured || !categories) return [];
    const usedMainCatIds = new Set<string>();
    featured.forEach(p => {
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
  }, [featured, categories]);

  useEffect(() => {
    if (!featured || featured.length === 0) {
      setRandomFeatured([]);
      return;
    }
    let pool = featured;
    if (selectedCatId !== 'all' && categories) {
      const criteria = getExpandedCriteria([selectedCatId], categories);
      pool = featured.filter(p => {
        const pCats = Array.isArray(p.categories) ? p.categories : [p.categories];
        return pCats.some((catId: any) => criteria.ids.includes(String(catId)));
      });
    }
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    setRandomFeatured(shuffled.slice(0, 10));
  }, [featured, selectedCatId, categories]);

  /**
   * 核心：混合強化邏輯。
   * 如果快照中已有完整資料（由新版 AdminDashboard 產生），則直接使用。
   * 如果只有 ID，則嘗試從目前的 arrivals (allActiveProducts) 中補全。
   */
  const enrichList = useCallback((list: any[]) => {
    if (!list) return [];
    return list.map(item => {
      // 如果 item 已經具備主要圖片和價格，直接回傳
      if (item.imageUrl && (item.price || item.salePrice)) return item;

      // 否則嘗試從目前的 100 件新品中尋找匹配項
      const productId = item.id || item.productId;
      const latestData = allActiveProducts?.find(p => p.id === productId);
      return latestData ? { ...item, ...latestData } : item;
    });
  }, [allActiveProducts]);

  const bestSellers = useMemo(() => {
    if (snapshot?.bestSellers) return enrichList(snapshot.bestSellers);
    return enrichList(featured?.slice(0, 10).sort(() => 0.5 - Math.random()).slice(0, 10) || []);
  }, [snapshot?.bestSellers, featured, enrichList]);

  const trending = useMemo(() => {
    if (snapshot?.trending) return enrichList(snapshot.trending);
    return enrichList(arrivals?.slice(0, 10).sort(() => 0.5 - Math.random()).slice(0, 10) || []);
  }, [snapshot?.trending, arrivals, enrichList]);

  const popular = useMemo(() => {
    if (snapshot?.popular) return enrichList(snapshot.popular);
    const pool = (clearance && clearance.length > 0) ? clearance : featured;
    return enrichList(pool?.slice(0, 10).sort(() => 0.5 - Math.random()).slice(0, 10) || []);
  }, [snapshot?.popular, clearance, featured, enrichList]);

  const desktopPairedItems = useMemo(() => {
    const pairs = [];
    for (let i = 0; i < randomFeatured.length; i += 2) {
      if (randomFeatured[i]) {
        pairs.push(randomFeatured.slice(i, i + 2));
      }
    }
    return pairs;
  }, [randomFeatured]);

  const getCatName = (cat: any) => lang === 'en' ? (cat.name_en || cat.name_zh) : (cat.name_zh || cat.name_en);

  if (!mounted) {
    return (
      <section className="py-12 md:py-16 min-h-[600px]">
        <div className="container px-4 mx-auto grid grid-cols-1 lg:grid-cols-10 gap-16">
          <div className="lg:col-span-4 space-y-8">
            <Skeleton className="h-8 w-48 mb-6" />
            <div className="grid grid-cols-2 gap-4">
              <ProductCardSkeleton compact />
              <ProductCardSkeleton compact />
            </div>
          </div>
          <div className="lg:col-span-6 space-y-8">
            <Skeleton className="h-8 w-48 mb-6" />
            <Skeleton className="h-[600px] w-full rounded-[2rem]" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-12 md:py-16 overflow-hidden">
      <div className="container px-4 mx-auto grid grid-cols-1 lg:grid-cols-10 gap-12 lg:gap-16">
        <div className="lg:col-span-4 space-y-6 md:space-y-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl md:text-2xl font-black font-headline tracking-tight flex items-center gap-3 text-slate-900">
                <Sparkles className="h-5 w-5 md:h-6 md:w-6 text-primary animate-pulse" />
                {t.sections.recommended_goods}
              </h3>
              <Button asChild variant="ghost" size="sm" className="text-primary font-bold gap-1 rounded-xl">
                <Link href="/recommendations">{t.sections.view_all} <ArrowRight className="h-4 w-4" /></Link>
              </Button>
            </div>

            {relevantMainCategories.length > 0 && (
              <ScrollArea className="w-full whitespace-nowrap h-12">
                <div className="flex gap-2 pb-2">
                  <Button 
                    variant={selectedCatId === 'all' ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "rounded-full font-bold h-8 px-4 text-[10px] transition-all", 
                      selectedCatId === 'all' ? "bg-primary text-primary-foreground shadow-sm" : "bg-white border-muted-foreground/20"
                    )}
                    onClick={() => setSelectedCatId('all')}
                  >
                    {lang === 'en' ? 'All' : '全部'}
                  </Button>
                  {relevantMainCategories.map(cat => (
                    <Button 
                      key={cat.id}
                      variant={selectedCatId === cat.id ? "default" : "outline"}
                      size="sm"
                      className={cn(
                        "rounded-full font-bold h-8 px-4 text-[10px] transition-all", 
                        selectedCatId === cat.id ? "bg-primary text-primary-foreground shadow-sm" : "bg-white border-muted-foreground/20"
                      )}
                      onClick={() => setSelectedCatId(cat.id)}
                    >
                      {getCatName(cat)}
                    </Button>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" className="hidden" />
              </ScrollArea>
            )}
          </div>
          
          <div>
            {loading ? (
              <div className="flex gap-4">
                <ProductCardSkeleton compact />
                <ProductCardSkeleton compact />
              </div>
            ) : (
              <div className="relative">
                <div className="lg:hidden">
                  <Carousel opts={{ align: "start", containScroll: "trimSnaps" }} className="w-full">
                    <CarouselContent className="-ml-3">
                      {randomFeatured.map((p) => (
                        <CarouselItem key={p.id} className="pl-3 basis-[45%] sm:basis-[35%] md:basis-1/3">
                          <ProductCard product={p} compact allPromos={allPromos} allCategories={allCategories} allBrands={allBrands} />
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                  </Carousel>
                </div>

                <div className="hidden lg:block">
                  <Carousel opts={{ align: "start", loop: true }} className="w-full">
                    <CarouselContent className="-ml-4">
                      {desktopPairedItems.map((pair, idx) => (
                        <CarouselItem key={idx} className="pl-4 basis-1/2">
                          <div className="flex flex-col gap-4">
                            {pair.map((p) => (
                              <ProductCard key={p.id} product={p} compact allPromos={allPromos} allCategories={allCategories} allBrands={allBrands} />
                            ))}
                          </div>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious className="-left-12 bg-white border-primary/20 text-primary hover:bg-primary hover:text-white shadow-md" />
                    <CarouselNext className="-right-12 bg-white border-primary/20 text-primary hover:bg-primary hover:text-white shadow-md" />
                  </Carousel>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-6 space-y-6 md:space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-xl md:text-2xl font-black font-headline tracking-tight flex items-center gap-3 text-slate-900">
              <Trophy className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              {t.sections.rankings_title}
            </h3>
          </div>
          <Tabs defaultValue="new" className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-11 md:h-12 rounded-2xl mb-6 bg-muted/50 p-1 border">
              <TabsTrigger value="new" className="font-black text-[10px] md:text-xs rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all">
                {t.sections.rank_trending}
              </TabsTrigger>
              <TabsTrigger value="best" className="font-black text-[10px] md:text-xs rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all">
                {t.sections.rank_sales}
              </TabsTrigger>
              <TabsTrigger value="pop" className="font-black text-[10px] md:text-xs rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm data-[state=active]:text-primary transition-all">
                {t.sections.rank_views}
              </TabsTrigger>
            </TabsList>
            
            <div className="min-h-[400px]">
              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 bg-white border rounded-2xl">
                      <Skeleton className="h-8 w-8 rounded-lg" />
                      <Skeleton className="h-12 w-12 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <ScrollArea className="h-[600px] pr-4 -mr-4">
                  <TabsContent value="new" className="mt-0 animate-in fade-in slide-in-from-right-2 duration-500">
                    <RankingList products={trending} lang={lang} allPromos={allPromos} allCategories={allCategories} allBrands={allBrands} />
                  </TabsContent>
                  <TabsContent value="best" className="mt-0 animate-in fade-in slide-in-from-right-2 duration-500">
                    <RankingList products={bestSellers} lang={lang} allPromos={allPromos} allCategories={allCategories} allBrands={allBrands} />
                  </TabsContent>
                  <TabsContent value="pop" className="mt-0 animate-in fade-in slide-in-from-right-2 duration-500">
                    <RankingList products={popular} lang={lang} allPromos={allPromos} allCategories={allCategories} allBrands={allBrands} />
                  </TabsContent>
                </ScrollArea>
              )}
            </div>
          </Tabs>
        </div>
      </div>
    </section>
  );
}
