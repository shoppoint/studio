
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowRight, Loader2, Sparkles, LayoutGrid } from "lucide-react";
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

interface NewArrivalsProps {
  products: any[] | null;
  categories: any[] | null;
  loading: boolean;
  allPromos?: any[] | null;
  allBrands?: any[] | null;
}

export function NewArrivalsSection({ products, categories, loading, allPromos = null, allBrands = null }: NewArrivalsProps) {
  const { t, lang } = useI18n();
  const [selectedCatId, setSelectedCatId] = useState("all");

  const relevantMainCategories = useMemo(() => {
    if (!products || !categories) return [];
    
    const usedMainCatIds = new Set<string>();
    
    products.forEach(p => {
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
  }, [products, categories]);

  const filtered = useMemo(() => {
    if (!products) return [];
    if (selectedCatId === 'all') return products;

    const criteria = getExpandedCriteria([selectedCatId], categories || []);

    return products.filter(p => {
      const pCats = Array.isArray(p.categories) ? p.categories : [p.categories];
      return pCats.some((catId: any) => criteria.ids.includes(String(catId)));
    });
  }, [products, selectedCatId, categories]);

  const getCatName = (cat: any) => lang === 'en' ? (cat.name_en || cat.name_zh) : (cat.name_zh || cat.name_en);

  return (
    <section className="py-12 md:py-20 border-y bg-muted/20 overflow-hidden">
      <div className="container px-4 mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 md:mb-8 gap-4">
          <div className="space-y-1">
            <h2 className="text-xl md:text-3xl font-black font-headline flex items-center gap-3">
              <Sparkles className="h-5 w-5 md:h-6 md:w-6 text-primary animate-pulse" />
              {t.sections.new_arrivals_title}
            </h2>
            <p className="text-xs md:text-sm text-muted-foreground font-medium">{t.sections.new_arrivals_subtitle}</p>
          </div>
          
          <div className="hidden md:block">
            <Button asChild variant="ghost" className="font-bold text-primary gap-2 rounded-xl">
              <Link href="/new-arrivals">{t.sections.view_all} <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
        </div>

        {relevantMainCategories.length > 0 && (
          <div className="mb-6 md:mb-8">
            <ScrollArea className="w-full whitespace-nowrap">
              <div className="flex gap-2 pb-2">
                <Button 
                  variant={selectedCatId === 'all' ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "rounded-full font-bold h-8 md:h-9 px-4 md:px-6 text-[10px] md:text-xs transition-all", 
                    selectedCatId === 'all' ? "shadow-md scale-105 bg-primary text-primary-foreground" : "bg-white"
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
                      "rounded-full font-bold h-8 md:h-9 px-4 md:px-6 text-[10px] md:text-xs transition-all", 
                      selectedCatId === cat.id ? "shadow-md scale-105 bg-primary text-primary-foreground" : "bg-white"
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
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground italic border-2 border-dashed rounded-[2rem] bg-white/50 text-sm">
            {lang === 'en' ? "No new items in this category." : "此分類暫無新品。"}
          </div>
        ) : (
          <div className="relative group/carousel">
            <Carousel opts={{ align: "start", loop: true, containScroll: "trimSnaps" }} className="w-full">
              <CarouselContent className="-ml-3 md:-ml-4">
                {filtered.map((p) => (
                  <CarouselItem key={p.id} className="pl-3 md:pl-4 basis-[40%] sm:basis-[35%] md:basis-1/3 lg:basis-1/4 xl:basis-1/5">
                    <div className="h-full py-2">
                      <ProductCard product={p} compact allPromos={allPromos} allCategories={categories} allBrands={allBrands} />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              {/* Desktop Nav Buttons - Improved Visibility */}
              <div className="hidden lg:block">
                <CarouselPrevious className="absolute -left-6 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white border-2 border-primary/20 text-primary shadow-xl hover:bg-primary hover:text-white transition-all z-20" />
                <CarouselNext className="absolute -right-6 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white border-2 border-primary/20 text-primary shadow-xl hover:bg-primary hover:text-white transition-all z-20" />
              </div>
            </Carousel>

            <div className="mt-6 flex justify-center md:hidden">
              <Button asChild variant="link" className="text-primary font-black uppercase text-[10px] tracking-widest gap-2">
                 <Link href="/new-arrivals">{t.sections.view_all} <ArrowRight className="h-3 w-3" /></Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
