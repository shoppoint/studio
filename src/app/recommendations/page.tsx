
"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { 
  Sparkles, 
  SearchX, 
  Loader2, 
  ChevronRight, 
  LayoutGrid, 
  Package, 
  ArrowRight, 
  Home 
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/i18n-context";
import { useFirestore, useCollection } from "@/firebase";
import { collection, query, where, limit, orderBy } from "firebase/firestore";
import { ProductCard, ProductCardSkeleton } from "@/components/ProductCard";
import { getExpandedCriteria } from "@/lib/shop-utils";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export default function RecommendationsPage() {
  const { t, lang } = useI18n();
  const db = useFirestore();
  const [selectedMainCat, setSelectedMainCat] = useState("all");
  const [displayLimit, setDisplayLimit] = useState(24);

  // 1. 獲取所有分類用於分頁導覽
  const categoriesQuery = useMemo(() => {
    if (!db) return null;
    return query(
      collection(db, 'categories'),
      where('isVisible', '==', true),
      orderBy('displayOrder', 'asc')
    );
  }, [db]);
  const { data: allCategories, loading: catsLoading } = useCollection<any>(categoriesQuery);

  // 2. 獲取所有促銷活動用於產品卡片顯示
  const promosQuery = useMemo(() => {
    if (!db) return null;
    return query(
      collection(db, 'promotions'),
      where('status', '==', 'active')
    );
  }, [db]);
  const { data: allPromos } = useCollection<any>( promosQuery);

  // 3. 獲取所有精選產品
  const featuredQuery = useMemo(() => {
    if (!db) return null;
    return query(
      collection(db, 'public_products'),
      where('status', '==', 'Active'),
      where('isFeatured', '==', 'Yes'),
      orderBy('createdAt', 'desc'),
      limit(200)
    );
  }, [db]);

  const { data: featuredProducts, loading: productsLoading } = useCollection<any>(featuredQuery);

  // 提取主類別 (parentId 為空或 none)
  const mainCategories = useMemo(() => {
    if (!allCategories) return [];
    return allCategories.filter(c => !c.parentId || c.parentId === "none" || c.parentId === "");
  }, [allCategories]);

  // 每當篩選類別變動，重置顯示數量
  useEffect(() => {
    setDisplayLimit(24);
  }, [selectedMainCat]);

  // 執行過濾邏輯
  const allFilteredProducts = useMemo(() => {
    if (!featuredProducts) return [];
    
    // 核心修正：全站隱藏「只限門市」產品
    let result = featuredProducts.filter(p => p.inStoreOnly !== true);
    
    if (selectedMainCat === 'all') return result;
    
    // 使用 expanded criteria 確保包含所有子類別產品
    const criteria = getExpandedCriteria([selectedMainCat], allCategories || []);
    return result.filter(p => {
      const pCats = Array.isArray(p.categories) ? p.categories : (p.categories ? [p.categories] : []);
      return pCats.some((catId: any) => criteria.ids.includes(String(catId)));
    });
  }, [featuredProducts, selectedMainCat, allCategories]);

  // 視口切片渲染
  const paginatedProducts = useMemo(() => {
    return allFilteredProducts.slice(0, displayLimit);
  }, [allFilteredProducts, displayLimit]);

  const getCatName = (cat: any) => lang === 'en' ? (cat.name_en || cat.name_zh) : (cat.name_zh || cat.name_en);
  const loading = catsLoading || productsLoading;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-primary/10 py-16 md:py-24 border-b text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-5"><Sparkles className="h-64 w-64 text-primary" /></div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-4 uppercase tracking-widest font-bold">
              <Link href="/" className="hover:text-primary transition-colors">{t.nav.home}</Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground">{t.sections.recommended_goods}</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black font-headline tracking-tighter mb-4">{t.sections.recommended_goods}</h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto font-medium">為您精選的好物推薦，探索更多生活靈感。</p>
          </div>
        </section>

        {/* Category Pills Header - 修正電腦版吸頂位移以避開 Navbar (156px 為安全高度) */}
        <div className="sticky top-14 lg:top-[156px] z-40 bg-white/95 backdrop-blur-md border-b shadow-sm transition-all duration-300">
          <div className="container mx-auto px-4">
            <ScrollArea className="w-full whitespace-nowrap py-4">
              <div className="flex items-center gap-3">
                <Button 
                  variant={selectedMainCat === 'all' ? 'default' : 'outline'}
                  className={cn(
                    "rounded-full h-10 px-8 font-black uppercase text-[10px] tracking-widest transition-all", 
                    selectedMainCat === 'all' ? "bg-primary text-primary-foreground shadow-lg scale-105" : "hover:border-primary/50"
                  )}
                  onClick={() => setSelectedMainCat('all')}
                >
                  {lang === 'en' ? 'All' : '全部'}
                </Button>
                {mainCategories.map(cat => (
                  <Button 
                    key={cat.id}
                    variant={selectedMainCat === cat.id ? 'default' : 'outline'}
                    className={cn(
                      "rounded-full h-10 px-6 font-black uppercase text-[10px] tracking-widest transition-all", 
                      selectedMainCat === cat.id ? "bg-primary text-primary-foreground shadow-lg scale-105" : "hover:border-primary/50"
                    )}
                    onClick={() => setSelectedMainCat(cat.id)}
                  >
                    {getCatName(cat)}
                  </Button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" className="hidden" />
            </ScrollArea>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12">
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {Array.from({ length: 12 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : allFilteredProducts.length === 0 ? (
            <div className="py-32 text-center border-4 border-dashed rounded-[3rem] bg-muted/5 space-y-6">
              <SearchX className="h-16 w-16 text-muted-foreground mx-auto opacity-20" />
              <div className="space-y-2">
                <p className="text-xl font-black">此類別暫無推介產品</p>
                <p className="text-sm text-muted-foreground">嘗試查看其他類別或瀏覽全部商品。</p>
              </div>
              <Button onClick={() => setSelectedMainCat('all')} className="rounded-xl font-bold bg-primary px-8">顯示所有推介</Button>
            </div>
          ) : (
            <div className="space-y-12">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {paginatedProducts.map((p: any) => (
                  <div key={p.id} className="animate-in fade-in duration-500">
                    <ProductCard product={p} allPromos={allPromos} allCategories={allCategories} />
                  </div>
                ))}
              </div>

              {/* Load More Button */}
              {allFilteredProducts.length > displayLimit && (
                <div className="py-12 flex justify-center border-t border-dashed">
                  <Button 
                    variant="outline" 
                    className="rounded-2xl h-14 px-12 font-black bg-white border-2 border-primary text-primary hover:bg-primary hover:text-white transition-all shadow-lg group"
                    onClick={() => setDisplayLimit(prev => prev + 24)}
                  >
                    {t.sections.load_more}
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
