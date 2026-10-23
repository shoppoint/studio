
"use client";

import { useMemo, useState, useEffect } from "react";
import { 
  Carousel, 
  CarouselContent, 
  CarouselItem, 
  CarouselNext, 
  CarouselPrevious 
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import { 
  PlusCircle, 
  ArrowRight, 
  History, 
  Sparkles, 
  Zap, 
  Loader2 
} from "lucide-react";
import { ProductCard } from "@/components/ProductCard";
import Link from "next/link";
import { useFirestore, useCollection } from "@/firebase";
import { collection, query, where, limit } from "firebase/firestore";

interface ProductCarouselsProps {
  product?: any;
  recentlyViewed?: any[] | null;
  randomProducts?: any[] | null;
  t: any;
  lang: string;
}

/**
 * 第三階段載入：探索與留存區 (Discovery & Retention Area)
 * 負責渲染相關產品、加購配件、隨機推薦及最近瀏覽。
 * 修正：將導航按鈕設為絕對定位並置於輪播容器左右邊緣內，確保在所有螢幕都能穩定顯示。
 */
export function ProductCarousels({ 
  product, 
  recentlyViewed: preFetchedRecentlyViewed,
  randomProducts: preFetchedRandomProducts,
  t, 
  lang
}: ProductCarouselsProps) {
  const db = useFirestore();
  const isEn = lang === 'en';
  const [shouldLoad, setShouldLoad] = useState(false);

  // Stage 3 觸發器：1.2s 延遲，避開所有首屏關鍵路徑
  useEffect(() => {
    const timer = setTimeout(() => setShouldLoad(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  // 延遲抓取促銷與分類資料
  const promosQuery = useMemo(() => {
    if (!db || !shouldLoad) return null;
    return query(collection(db, 'promotions'), where('status', '==', 'active'));
  }, [db, shouldLoad]);
  const { data: allPromos } = useCollection<any>(promosQuery);

  const catsQuery = useMemo(() => {
    if (!db || !shouldLoad) return null;
    return query(collection(db, 'categories'), where('isVisible', '==', true));
  }, [db, shouldLoad]);
  const { data: allCategories } = useCollection<any>(catsQuery);

  // 1. 加購配件 (Upselling)
  const accessoryIds = useMemo(() => 
    (shouldLoad && product) ? (product.accessoryProductIds || []).filter(Boolean).slice(0, 10) : []
  , [product, shouldLoad]);

  const accessoriesQuery = useMemo(() => {
    if (!db || accessoryIds.length === 0) return null;
    return query(collection(db, 'public_products'), where('status', '==', 'Active'), where('__name__', 'in', accessoryIds));
  }, [db, accessoryIds]);
  const { data: accessories } = useCollection<any>(accessoriesQuery);

  // 2. 相關產品 (Similar Items)
  const relatedIds = useMemo(() => 
    (shouldLoad && product) ? (product.relatedProducts || []).filter(Boolean).slice(0, 10) : []
  , [product, shouldLoad]);

  const relatedProductsQuery = useMemo(() => {
    if (!db || relatedIds.length === 0) return null;
    return query(collection(db, 'public_products'), where('status', '==', 'Active'), where('__name__', 'in', relatedIds));
  }, [db, relatedIds]);
  const { data: relatedProducts } = useCollection<any>(relatedProductsQuery);

  // 3. 最近瀏覽
  const recentIdsList = useMemo(() => {
    if (!shouldLoad) return [];
    const stored = localStorage.getItem('recently_viewed_ids');
    if (!stored) return [];
    try {
      const ids = JSON.parse(stored);
      return ids.filter((id: string) => id !== product?.id).slice(0, 10);
    } catch (e) { return []; }
  }, [product?.id, shouldLoad]);

  const recentProductsQuery = useMemo(() => {
    if (!db || recentIdsList.length === 0 || preFetchedRecentlyViewed) return null;
    return query(collection(db, 'public_products'), where('status', '==', 'Active'), where('__name__', 'in', recentIdsList));
  }, [db, recentIdsList, preFetchedRecentlyViewed]);
  const { data: recentlyViewedItems } = useCollection<any>(recentProductsQuery);

  const finalRecentlyViewed = preFetchedRecentlyViewed || recentlyViewedItems;

  // 4. 隨機池 (Discovery)
  const randomPoolQuery = useMemo(() => 
    (db && shouldLoad && !preFetchedRandomProducts) ? query(collection(db, 'public_products'), where('status', '==', 'Active'), limit(40)) : null
  , [db, shouldLoad, preFetchedRandomProducts]);
  const { data: randomPool } = useCollection<any>(randomPoolQuery);
  
  const shuffledRandom = useMemo(() => {
    if (preFetchedRandomProducts) return preFetchedRandomProducts;
    if (!randomPool) return [];
    return [...randomPool].filter(p => p.id !== product?.id).sort(() => 0.5 - Math.random()).slice(0, 10);
  }, [randomPool, product?.id, preFetchedRandomProducts]);

  if (!shouldLoad) return null;

  const NavButtons = () => (
    <div className="hidden lg:block">
      <CarouselPrevious className="absolute -left-6 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white border-2 border-primary/20 text-primary shadow-xl hover:bg-primary hover:text-white transition-all z-20" />
      <CarouselNext className="absolute -right-6 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white border-2 border-primary/20 text-primary shadow-xl hover:bg-primary hover:text-white transition-all z-20" />
    </div>
  );

  return (
    <div className="mt-20 space-y-24 pb-20">
      {/* 1. 配件推介 */}
      {accessories && accessories.length > 0 && (
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black font-headline flex items-center gap-3 text-slate-900">
              <PlusCircle className="h-6 w-6 text-primary" />
              {isEn ? "Frequently Bought Together" : "加購配件推薦"}
            </h2>
          </div>
          <div className="relative">
            <Carousel opts={{ align: "start", loop: true }} className="w-full">
              <CarouselContent className="-ml-4">
                {accessories.map((p) => (
                  <CarouselItem key={p.id} className="pl-4 basis-[45%] sm:basis-1/3 lg:basis-1/4 xl:basis-1/5">
                    <ProductCard product={p} compact allPromos={allPromos} allCategories={allCategories} />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <NavButtons />
            </Carousel>
          </div>
        </section>
      )}

      {/* 2. 相似產品 */}
      {relatedProducts && relatedProducts.length > 0 && (
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black font-headline flex items-center gap-3 text-slate-900">
              <Zap className="h-6 w-6 text-primary fill-current" />
              {isEn ? "You May Also Like" : "相似選擇推薦"}
            </h2>
          </div>
          <div className="relative">
            <Carousel opts={{ align: "start", loop: true }} className="w-full">
              <CarouselContent className="-ml-4">
                {relatedProducts.map((p) => (
                  <CarouselItem key={p.id} className="pl-4 basis-[45%] sm:basis-1/3 lg:basis-1/4 xl:basis-1/5">
                    <ProductCard product={p} compact allPromos={allPromos} allCategories={allCategories} />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <NavButtons />
            </Carousel>
          </div>
        </section>
      )}

      {/* 3. 隨機驚喜 */}
      {shuffledRandom && shuffledRandom.length > 0 && (
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black font-headline flex items-center gap-3 text-slate-900">
              <Sparkles className="h-6 w-6 text-primary" />
              {isEn ? "Recommended for You" : "為您推薦的驚喜好物"}
            </h2>
            <Button asChild variant="ghost" className="rounded-full font-bold text-primary gap-2">
              <Link href="/shop">
                {t.sections.view_all} <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="relative">
            <Carousel opts={{ align: "start", loop: true }} className="w-full">
              <CarouselContent className="-ml-4">
                {shuffledRandom.map((p) => (
                  <CarouselItem key={p.id} className="pl-4 basis-[45%] sm:basis-1/3 lg:basis-1/4 xl:basis-1/5">
                    <ProductCard product={p} compact allPromos={allPromos} allCategories={allCategories} />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <NavButtons />
            </Carousel>
          </div>
        </section>
      )}

      {/* 4. 最近瀏覽 */}
      {finalRecentlyViewed && finalRecentlyViewed.length > 0 && (
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 pt-12 border-t border-dashed">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black font-headline flex items-center gap-3 opacity-60">
              <History className="h-6 w-6 text-muted-foreground" />
              {isEn ? "Recently Viewed" : "最近瀏覽產品"}
            </h2>
          </div>
          <div className="relative">
            <Carousel opts={{ align: "start", loop: true }} className="w-full">
              <CarouselContent className="-ml-4">
                {finalRecentlyViewed.map((p) => (
                  <CarouselItem key={p.id} className="pl-4 basis-[45%] sm:basis-1/3 lg:basis-1/4 xl:basis-1/5">
                    <ProductCard product={p} compact allPromos={allPromos} allCategories={allCategories} />
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="hidden lg:block">
                <CarouselPrevious className="absolute -left-6 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white border-muted-foreground/10 text-muted-foreground hover:bg-muted shadow-sm z-20" />
                <CarouselNext className="absolute -right-6 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white border-muted-foreground/10 text-muted-foreground hover:bg-muted shadow-sm z-20" />
              </div>
            </Carousel>
          </div>
        </section>
      )}
    </div>
  );
}
