
"use client";

import { useMemo, useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { 
  ChevronRight, 
  Zap, 
  LayoutGrid, 
  SearchX, 
  Loader2, 
  PackageCheck, 
  Home,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/i18n-context";
import { useUser, useFirestore, useCollection } from "@/firebase";
import { collection, query, where, orderBy, limit } from "firebase/firestore";
import { ProductCard, ProductCardSkeleton } from "@/components/ProductCard";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { getExpandedCriteria } from "@/lib/shop-utils";

function NewArrivalsContent() {
  const { t, lang } = useI18n();
  const db = useFirestore();
  const [selectedCatId, setSelectedCatId] = useState("all");
  const [displayLimit, setDisplayLimit] = useState(24);
  const [renderStage, setRenderStage] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => setRenderStage(2), 500);
    return () => clearTimeout(timer);
  }, []);

  const categoriesQuery = useMemo(() => {
    if (!db) return null;
    return query(
      collection(db, 'categories'),
      where('isVisible', '==', true),
      orderBy('displayOrder', 'asc')
    );
  }, [db]);
  const { data: categories, loading: catsLoading } = useCollection<any>(categoriesQuery);

  const promosQuery = useMemo(() => {
    if (!db || renderStage < 2) return null;
    return query(collection(db, 'promotions'), where('status', '==', 'active'));
  }, [db, renderStage]);
  const { data: allPromos } = useCollection<any>(promosQuery);

  const arrivalsQuery = useMemo(() => {
    if (!db) return null;
    return query(
      collection(db, 'public_products'),
      where('status', '==', 'Active'),
      orderBy('createdAt', 'desc'),
      limit(100)
    );
  }, [db]);
  const { data: allProducts, loading: productsLoading } = useCollection<any>(arrivalsQuery);

  const relevantMainCategories = useMemo(() => {
    if (!allProducts || !categories) return [];
    const usedMainCatIds = new Set<string>();
    allProducts.forEach(p => {
      const pCats = Array.isArray(p.categories) ? p.categories : [p.categories];
      pCats.forEach((catId: string) => {
        let current = categories.find(c => c.id === catId);
        while (current && current.parentId && current.parentId !== "none" && current.parentId !== "") {
          const parent = categories.find(c => c.id === current.parentId);
          if (!parent) break;
          current = parent;
        }
        if (current) usedMainCatIds.add(current.id);
      });
    });
    return categories.filter(c => usedMainCatIds.has(c.id) && (!c.parentId || c.parentId === "none" || c.parentId === ""));
  }, [allProducts, categories]);

  const allFilteredProducts = useMemo(() => {
    if (!allProducts) return [];
    let result = allProducts.filter(p => p.inStoreOnly !== true);
    if (selectedCatId === 'all') return result;
    const criteria = getExpandedCriteria([selectedCatId], categories || []);
    return result.filter(p => {
      const pCats = Array.isArray(p.categories) ? p.categories : [p.categories];
      return pCats.some((catId: any) => criteria.ids.includes(String(catId)));
    });
  }, [allProducts, selectedCatId, categories]);

  const paginatedProducts = useMemo(() => {
    return allFilteredProducts.slice(0, displayLimit);
  }, [allFilteredProducts, displayLimit]);

  const getCatName = (cat: any) => lang === 'en' ? (cat.name_en || cat.name_zh) : (cat.name_zh || cat.name_en);
  const isGlobalLoading = catsLoading || productsLoading || renderStage < 2;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow">
        <section className="bg-primary/10 py-16 md:py-24 border-b">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-6xl font-black font-headline tracking-tighter mb-4">{t.new_arrivals_page.title}</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-medium">{t.new_arrivals_page.subtitle}</p>
          </div>
        </section>

        <div className="sticky top-14 lg:top-[156px] z-40 bg-white/95 backdrop-blur-md border-b shadow-sm">
          <div className="container mx-auto px-4">
            <ScrollArea className="w-full whitespace-nowrap py-4">
              <div className="flex items-center gap-3">
                <Button 
                  variant={selectedCatId === 'all' ? 'default' : 'outline'}
                  className={cn("rounded-full h-10 px-8 font-black uppercase text-[10px]", selectedCatId === 'all' && "bg-primary text-primary-foreground")}
                  onClick={() => setSelectedCatId('all')}
                >
                  {lang === 'en' ? 'All' : '全部'}
                </Button>
                {relevantMainCategories.map(cat => (
                  <Button 
                    key={cat.id}
                    variant={selectedCatId === cat.id ? 'default' : 'outline'}
                    className={cn("rounded-full h-10 px-6 font-black uppercase text-[10px]", selectedCatId === cat.id && "bg-primary text-primary-foreground")}
                    onClick={() => setSelectedCatId(cat.id)}
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
          {isGlobalLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {Array.from({ length: 12 }).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : allFilteredProducts.length === 0 ? (
            <div className="py-32 text-center border-4 border-dashed rounded-[3rem] bg-muted/5 space-y-6">
              <SearchX className="h-16 w-16 text-muted-foreground mx-auto opacity-20" />
              <p className="text-xl font-black">{t.new_arrivals_page.empty}</p>
            </div>
          ) : (
            <div className="space-y-12">
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {paginatedProducts.map((p) => <ProductCard key={p.id} product={p} allPromos={allPromos} allCategories={categories} />)}
              </div>
              {allFilteredProducts.length > displayLimit && (
                <div className="py-12 flex justify-center border-t border-dashed">
                  <Button variant="outline" className="rounded-2xl h-14 px-12 font-black border-2 border-primary text-primary" onClick={() => setDisplayLimit(prev => prev + 24)}>
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

export default function NewArrivalsPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <NewArrivalsContent />
    </Suspense>
  );
}
