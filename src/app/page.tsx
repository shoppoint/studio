
"use client";

import { useMemo, useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useFirestore, useCollection, useDoc } from "@/firebase";
import { collection, query, where, orderBy, limit, doc } from "firebase/firestore";
import { useShopData } from "@/lib/contexts/ShopDataContext";
import { Loader2 } from "lucide-react";

// Optimized Functional Components
import { HeroBanner } from "@/components/home/HeroBanner";
import { PromoSidebar } from "@/components/home/PromoSidebar";
import { FeaturedSection } from "@/components/home/FeaturedSection";
import { NewArrivalsSection } from "@/components/home/NewArrivalsSection";
import { ClearanceSection } from "@/components/home/ClearanceSection";
import { NewsSection } from "@/components/home/NewsSection";
import { GiftGuideSection } from "@/components/home/GiftGuideSection";
import { TrendingSection } from "@/components/home/TrendingSection";

/**
 * 首頁根組件 - 階梯式三段載入版 (V21 - 統一數據源快照)
 */
export default function Home() {
  const db = useFirestore();
  const { categories, promotions, brands } = useShopData();
  const [mounted, setMounted] = useState(false);
  const [renderStage, setRenderStage] = useState(1);

  useEffect(() => {
    setMounted(true);
    const t2 = setTimeout(() => setRenderStage(2), 300);
    const t3 = setTimeout(() => setRenderStage(3), 1200);
    return () => { clearTimeout(t2); clearTimeout(t3); };
  }, []);

  // --- Core Data Fetching ---
  // 核心修正：將資料來源從 rankings 改為 stats_summary，以對齊後台精算按鈕
  const statsSummaryRef = useMemo(() => db ? doc(db, 'config', 'stats_summary') : null, [db]);
  const { data: statsSnapshot, loading: statsLoading } = useDoc<any>(statsSummaryRef);

  // 1. 好物推介池
  const featuredQuery = useMemo(() => {
    if (!db || !mounted) return null;
    return query(
      collection(db, 'public_products'),
      where('status', '==', 'Active'),
      where('isFeatured', '==', 'Yes'),
      orderBy('createdAt', 'desc'),
      limit(100)
    );
  }, [db, mounted]);
  const { data: featuredRaw, loading: featuredLoading } = useCollection<any>(featuredQuery);
  const featured = useMemo(() => featuredRaw?.filter(p => p.inStoreOnly !== true) || [], [featuredRaw]);

  // 2. 新品上架池
  const arrivalsQuery = useMemo(() => {
    if (!db || !mounted) return null;
    return query(
      collection(db, 'public_products'),
      where('status', '==', 'Active'),
      orderBy('createdAt', 'desc'),
      limit(100) 
    );
  }, [db, mounted]);
  const { data: arrivalsRaw, loading: arrivalsLoading } = useCollection<any>(arrivalsQuery);
  const arrivals = useMemo(() => arrivalsRaw?.filter(p => p.inStoreOnly !== true) || [], [arrivalsRaw]);

  // 3. 人氣熱銷池
  const trendingQuery = useMemo(() => {
    if (!db || !mounted || renderStage < 3) return null;
    return query(
      collection(db, 'public_products'),
      where('status', '==', 'Active'),
      orderBy('addedToCartCount', 'desc'),
      limit(150)
    );
  }, [db, mounted, renderStage]);
  const { data: trendingRaw, loading: trendingLoading } = useCollection<any>(trendingQuery);

  // 4. 清貨特價池
  const clearanceQuery = useMemo(() => {
    if (!db || !mounted || renderStage < 3) return null;
    return query(
      collection(db, 'public_products'),
      where('status', '==', 'Active'),
      where('isClearance', '==', true),
      orderBy('createdAt', 'desc'),
      limit(100)
    );
  }, [db, mounted, renderStage]);
  const { data: clearanceRaw, loading: clearanceLoading } = useCollection<any>(clearanceQuery);
  const clearance = useMemo(() => clearanceRaw?.filter(p => p.inStoreOnly !== true) || [], [clearanceRaw]);

  // 5. 最新消息
  const newsQuery = useMemo(() => {
    if (!db || !mounted || renderStage < 3) return null;
    return query(
      collection(db, 'articles'),
      where('status', '==', 'published'),
      orderBy('createdAt', 'desc'),
      limit(4)
    );
  }, [db, mounted, renderStage]);
  const { data: latestNews, loading: newsLoading } = useCollection<any>(newsQuery);

  const sidebarPromos = useMemo(() => {
    if (!promotions) return [];
    return promotions.filter(p => p.isPublic === true).slice(0, 8);
  }, [promotions]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow">
        
        {/* Stage 1: 第一視覺核心 */}
        <FeaturedSection 
          featured={featured} 
          arrivals={arrivals} 
          clearance={clearance} 
          loading={featuredLoading || statsLoading} 
          snapshot={statsSnapshot}
          allPromos={promotions}
          allCategories={categories}
          allBrands={brands}
          categories={categories}
          allActiveProducts={arrivals}
        />

        {/* Stage 2: 次屏與焦點橫幅 */}
        {renderStage >= 2 && (
          <div className="animate-in fade-in duration-700">
            <NewArrivalsSection 
              products={arrivals} 
              categories={categories} 
              loading={arrivalsLoading} 
              allPromos={promotions}
              allBrands={brands}
            />

            <section className="bg-muted/10 border-y overflow-hidden py-8 md:py-16">
              <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 items-stretch">
                  <div className="lg:col-span-7">
                    <HeroBanner shouldLoad={mounted} />
                  </div>
                  <div className="lg:col-span-3">
                    <PromoSidebar promos={sidebarPromos} loading={!promotions} />
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* Stage 3: 長尾推薦與內容 */}
        {renderStage >= 3 && (
          <div className="animate-in fade-in duration-1000">
            <ClearanceSection 
              products={clearance} 
              categories={categories} 
              loading={clearanceLoading} 
              allPromos={promotions}
              allBrands={brands}
            />

            <GiftGuideSection 
              products={featured} 
              loading={featuredLoading}
              allPromos={promotions}
              allCategories={categories}
              allBrands={brands}
            />

            <TrendingSection 
              products={trendingRaw} 
              categories={categories} 
              loading={trendingLoading} 
              allPromos={promotions}
              allCategories={categories}
              allBrands={brands}
            />

            <NewsSection articles={latestNews} loading={newsLoading} />
          </div>
        )}

        {renderStage < 3 && (
          <div className="py-20 flex flex-col items-center justify-center gap-4 opacity-20">
             <Loader2 className="h-6 w-6 animate-spin" />
             <p className="text-[10px] font-black uppercase tracking-widest">Optimizing view...</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
