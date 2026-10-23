"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  ChevronRight, 
  Award, 
  LayoutGrid, 
  ArrowUp, 
  Loader2, 
  Package,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useI18n } from "@/lib/i18n/i18n-context";
import { useUser, useFirestore, useCollection } from "@/firebase";
import { collection, query, where, orderBy } from "firebase/firestore";
import { cn } from "@/lib/utils";

export default function BrandsPage() {
  const { t, lang } = useI18n();
  const db = useFirestore();
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  
  // 效能階梯狀態
  const [renderStage, setRenderStage] = useState(1);

  useEffect(() => {
    // Stage 2: 800ms 後渲染剩餘品牌分類
    const timer = setTimeout(() => setRenderStage(2), 800);
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

  const brandsQuery = useMemo(() => {
    if (!db) return null;
    return query(
      collection(db, 'brands'),
      where('status', '==', 'Active'),
      orderBy('name_zh', 'asc')
    );
  }, [db]);
  const { data: brands, loading: brandsLoading } = useCollection<any>(brandsQuery);

  const groupedBrands = useMemo(() => {
    if (!categories || !brands) return [];
    return categories.map(cat => {
      const associatedBrands = brands.filter(brand => Array.isArray(brand.categories) && brand.categories.includes(cat.id));
      return { ...cat, brands: associatedBrands };
    }).filter(group => group.brands.length > 0);
  }, [categories, brands]);

  // 拆分渲染列表：前 3 組優先渲染
  const priorityGroups = useMemo(() => groupedBrands.slice(0, 3), [groupedBrands]);
  const deferredGroups = useMemo(() => groupedBrands.slice(3), [groupedBrands]);

  const scrollToSection = (id: string) => {
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const getCatName = (cat: any) => lang === 'en' ? (cat.name_en || cat.name_zh) : (cat.name_zh || cat.name_en);
  const getBrandName = (brand: any) => lang === 'en' ? (brand.name_en || brand.name_zh) : (brand.name_zh || brand.name_en);
  const loading = catsLoading || brandsLoading;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow pb-20">
        <section className="bg-primary/10 py-16 md:py-24 border-b">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-6xl font-black font-headline tracking-tighter mb-4">{t.brands.title}</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-medium">{t.brands.subtitle}</p>
          </div>
        </section>

        {loading ? (
          <div className="h-96 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground animate-pulse">精算品牌名錄中...</p>
          </div>
        ) : groupedBrands.length === 0 ? (
          <div className="py-24 text-center"><Package className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" /></div>
        ) : (
          <>
            <div className="sticky top-14 lg:top-[156px] z-40 bg-white/80 backdrop-blur-md border-b shadow-sm transition-all duration-300">
              <div className="container mx-auto px-4">
                <ScrollArea className="w-full whitespace-nowrap py-4">
                  <div className="flex gap-2">
                    {groupedBrands.map((group) => (
                      <Button 
                        key={group.id} 
                        variant="outline" 
                        className="rounded-full h-10 px-6 font-bold hover:bg-primary hover:text-primary-foreground transition-all" 
                        onClick={() => scrollToSection(group.id)}
                      >
                        {getCatName(group)}
                      </Button>
                    ))}
                  </div>
                  <ScrollBar orientation="horizontal" className="hidden" />
                </ScrollArea>
              </div>
            </div>

            <div className="container mx-auto px-4 py-12 space-y-32">
              {priorityGroups.map((group) => (
                <BrandGroupSection 
                  key={group.id} 
                  group={group} 
                  sectionRefs={sectionRefs} 
                  getCatName={getCatName} 
                  getBrandName={getBrandName} 
                />
              ))}

              {renderStage >= 2 ? (
                deferredGroups.map((group) => (
                  <BrandGroupSection 
                    key={group.id} 
                    group={group} 
                    sectionRefs={sectionRefs} 
                    getCatName={getCatName} 
                    getBrandName={getBrandName} 
                  />
                ))
              ) : deferredGroups.length > 0 ? (
                <div className="py-20 flex justify-center opacity-30">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : null}
            </div>
          </>
        )}

        <button 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} 
          className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-6 md:bottom-8 md:right-8 h-12 w-12 bg-white shadow-2xl rounded-full border border-muted flex items-center justify-center hover:bg-muted transition-colors z-50 group shadow-primary/20"
        >
          <ArrowUp className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
        </button>
      </main>
      <Footer />
    </div>
  );
}

function BrandGroupSection({ group, sectionRefs, getCatName, getBrandName }: any) {
  return (
    <section ref={(el) => { sectionRefs.current[group.id] = el; }} className="scroll-mt-64 animate-in fade-in duration-700">
      <div className="flex items-center gap-4 mb-10">
        <h2 className="text-2xl md:text-3xl font-black font-headline tracking-tighter">{getCatName(group)}</h2>
        <div className="flex-grow border-t border-dashed border-muted-foreground/20" />
        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-black h-6 px-3">{group.brands.length} Brands</Badge>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
        {group.brands.map((brand: any) => (
          <Link key={brand.id} href={`/brands/${brand.slug || brand.id}`}>
            <Card className="group border-none shadow-sm hover:shadow-xl transition-all duration-500 rounded-3xl overflow-hidden bg-white text-center flex flex-col h-full ring-1 ring-muted">
              <CardContent className="p-6 space-y-4 flex flex-col items-center flex-1">
                <div className="relative h-20 w-20 md:h-24 md:w-24 rounded-2xl bg-muted overflow-hidden border p-2 flex items-center justify-center group-hover:scale-110 transition-transform duration-500 bg-white shadow-inner">
                  {brand.logoUrl ? (
                    <Image src={brand.logoUrl} alt={getBrandName(brand)} fill className="object-contain p-2" />
                  ) : (
                    <Award className="h-8 w-8 text-muted-foreground/20" />
                  )}
                </div>
                <div className="space-y-1 flex-1">
                  <h3 className="font-bold text-sm md:text-base group-hover:text-primary transition-colors leading-tight">
                    {getBrandName(brand)}
                  </h3>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
