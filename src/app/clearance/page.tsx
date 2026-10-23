
"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import Link from "next/link";
import { 
  Zap, 
  LayoutGrid, 
  SearchX, 
  Loader2, 
  ChevronRight, 
  Home,
  ArrowRight
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n/i18n-context";
import { useFirestore, useCollection } from "@/firebase";
import { collection, query, where, limit, orderBy } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { ProductCard, ProductCardSkeleton } from "@/components/ProductCard";
import { calculateIsClearance, getExpandedCriteria } from "@/lib/shop-utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

function ClearanceContent() {
  const { t, lang } = useI18n();
  const db = useFirestore();
  const [selectedMainCat, setSelectedMainCat] = useState("all");
  const [displayLimit, setDisplayLimit] = useState(24);
  const [renderStage, setRenderStage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => setRenderStage(2), 500);
    return () => clearTimeout(timer);
  }, []);

  const categoriesQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'categories'), where('isVisible', '==', true), orderBy('displayOrder', 'asc'));
  }, [db]);
  const { data: allCategories, loading: catsLoading } = useCollection<any>(categoriesQuery);

  const promosQuery = useMemo(() => {
    if (!db || renderStage < 2) return null;
    return query(collection(db, 'promotions'), where('status', '==', 'active'));
  }, [db, renderStage]);
  const { data: allPromos } = useCollection<any>(promosQuery);

  const clearanceQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'public_products'), where('status', '==', 'Active'), where('isClearance', '==', true), limit(200));
  }, [db]);
  const { data: indexedClearance, loading: productsLoading } = useCollection<any>(clearanceQuery);

  const allFilteredProducts = useMemo(() => {
    if (!indexedClearance) return [];
    let pool = indexedClearance.filter(p => p.inStoreOnly !== true);
    if (selectedMainCat === 'all') return pool;
    const criteria = getExpandedCriteria([selectedMainCat], allCategories || []);
    return pool.filter(p => {
      const pCats = Array.isArray(p.categories) ? p.categories : [p.categories];
      return pCats.some((catId: any) => criteria.ids.includes(String(catId)));
    });
  }, [indexedClearance, selectedMainCat, allCategories]);

  const paginatedProducts = useMemo(() => allFilteredProducts.slice(0, displayLimit), [allFilteredProducts, displayLimit]);
  const isGlobalLoading = catsLoading || productsLoading || renderStage < 2;

  const getCatName = (cat: any) => lang === 'en' ? (cat.name_en || cat.name_zh) : (cat.name_zh || cat.name_en);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow">
        <section className="relative py-16 overflow-hidden bg-orange-600 md:py-24">
          <div className="container relative z-10 px-4 mx-auto text-center text-white">
            <h1 className="text-4xl font-black tracking-tighter md:text-6xl font-headline mb-4">{t.clearance.title}</h1>
            <p className="max-w-2xl mx-auto text-lg font-medium text-white/80">{t.clearance.subtitle}</p>
          </div>
        </section>

        <div className="sticky top-14 lg:top-[156px] z-40 bg-white/95 backdrop-blur-md border-b shadow-sm">
          <div className="container mx-auto px-4">
            <ScrollArea className="w-full whitespace-nowrap py-4">
              <div className="flex items-center gap-3">
                <Button 
                  variant={selectedMainCat === 'all' ? 'default' : 'outline'}
                  className={cn("rounded-full h-10 px-8 font-black uppercase text-[10px]", selectedMainCat === 'all' && "bg-orange-600 text-white")}
                  onClick={() => setSelectedMainCat('all')}
                >
                  {lang === 'en' ? 'All' : '全部'}
                </Button>
                {allCategories?.filter(c => !c.parentId || c.parentId === 'none').map(cat => (
                  <Button 
                    key={cat.id}
                    variant={selectedMainCat === cat.id ? 'default' : 'outline'}
                    className={cn("rounded-full h-10 px-6 font-black uppercase text-[10px]", selectedMainCat === cat.id && "bg-orange-600 text-white")}
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

        <div className="container px-4 mx-auto py-12">
          {isGlobalLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {Array.from({ length: 12 }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : allFilteredProducts.length === 0 ? (
            <div className="py-32 text-center border-4 border-dashed rounded-[3rem] bg-muted/5 space-y-6">
              <SearchX className="h-16 w-16 text-muted-foreground mx-auto opacity-20" />
              <p className="text-xl font-black">{t.clearance.empty}</p>
            </div>
          ) : (
            <div className="space-y-12">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {paginatedProducts.map((p) => <ProductCard key={p.id} product={p} isClearance allPromos={allPromos} allCategories={allCategories} />)}
              </div>
              {allFilteredProducts.length > displayLimit && (
                <div className="py-12 flex justify-center border-t border-dashed">
                  <Button variant="outline" className="rounded-2xl h-14 px-12 font-black border-2 border-orange-600 text-orange-600" onClick={() => setDisplayLimit(prev => prev + 24)}>
                    {t.sections.load_more} <ArrowRight className="ml-2 h-5 w-5" />
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

export default function ClearancePage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <ClearanceContent />
    </Suspense>
  );
}
