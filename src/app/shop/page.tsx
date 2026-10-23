"use client";

import { useState, useMemo, Suspense, useEffect } from "react";
import React from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { 
  SearchX, 
  Loader2, 
  Filter, 
  SlidersHorizontal, 
  ChevronRight, 
  Home,
  LayoutGrid,
  Zap,
  Ticket,
  Copy,
  FileText,
  ArrowRight,
  TrendingUp,
  Sparkles,
  X,
  Package
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription,
  SheetTrigger
} from "@/components/ui/sheet";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ShopFilterContent } from "@/components/shop/ShopFilterContent";
import { ShopHeader } from "@/components/shop/ShopHeader";
import { SubCategoryPills } from "@/components/shop/SubCategoryPills";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n/i18n-context";
import { useFirestore, useCollection } from "@/firebase";
import { collection, query, where, limit, getDocs, doc, getDoc, orderBy } from "firebase/firestore";
import { ProductCard, ProductCardSkeleton } from "@/components/ProductCard";
import { getExpandedCriteria, unifiedSearchFilter } from "@/lib/shop-utils";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { trackEvent, trackViewItemList } from "@/lib/analytics";

/**
 * 商店內容組件 - 支援 Slug 解析與 SEO 路由
 */
function ShopContent() {
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const db = useFirestore();
  
  const urlQuery = searchParams.get('q') || "";
  const categoryParam = searchParams.get('category');
  const brandParam = searchParams.get('brand');

  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedOrigins, setSelectedOrigins] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("newest");
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  
  const [displayLimit, setDisplayLimit] = useState(24);
  const [renderStage, setRenderStage] = useState(1);
  const [resolvedCategoryId, setResolvedCategoryId] = useState<string | null>(null);

  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setRenderStage(2);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // 核心：解析分類 Slug 或 ID
  useEffect(() => {
    const resolveCategory = async () => {
      if (!categoryParam || !db) {
        setResolvedCategoryId(null);
        setSelectedCategories([]);
        return;
      }

      try {
        const slugQuery = query(collection(db, 'categories'), where('slug', '==', categoryParam), limit(1));
        const slugSnap = await getDocs(slugQuery);
        
        if (!slugSnap.empty) {
          const id = slugSnap.docs[0].id;
          setResolvedCategoryId(id);
          setSelectedCategories([id]);
        } else {
          setResolvedCategoryId(categoryParam);
          setSelectedCategories([categoryParam]);
        }
      } catch (e) {
        setResolvedCategoryId(categoryParam);
        setSelectedCategories([categoryParam]);
      }
    };
    resolveCategory();
  }, [categoryParam, db]);

  useEffect(() => {
    if (brandParam) setSelectedBrands([brandParam]);
    else setSelectedBrands([]);
  }, [brandParam]);

  useEffect(() => {
    setDisplayLimit(24);
    setIsSearching(true);
    const timer = setTimeout(() => {
      setIsSearching(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [urlQuery, selectedCategories, selectedBrands, selectedOrigins, priceRange, sortBy]);

  const catsQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'categories'));
  }, [db]);
  const { data: allDbCategories, loading: catsLoading } = useCollection<any>(catsQuery);

  const promosQuery = useMemo(() => {
    if (!db || renderStage < 2) return null;
    return query(
      collection(db, 'promotions'), 
      where('status', '==', 'active'),
      where('isPublic', '==', true),
      orderBy('updatedAt', 'desc'),
      limit(10) 
    );
  }, [db, renderStage]);
  const { data: allPromos } = useCollection<any>(promosQuery);
  
  const productsQuery = useMemo(() => {
    if (!db || renderStage < 2) return null;
    return query(
      collection(db, 'public_products'),
      where('status', '==', 'Active'),
      orderBy('createdAt', 'desc'),
      limit(2000) // 提升至 2000 件產品
    );
  }, [db, renderStage]);
  const { data: products, loading: productsLoading } = useCollection<any>(productsQuery);

  const breadcrumbPath = useMemo(() => {
    if (!resolvedCategoryId || !allDbCategories) return [];
    const path: any[] = [];
    let currentId: string | null = resolvedCategoryId;
    let safetyCounter = 0;

    while (currentId && currentId !== 'none' && safetyCounter < 10) {
      const targetId: string = currentId;
      const cat = allDbCategories.find(c => c.id === targetId);
      if (cat) {
        path.unshift(cat);
        currentId = (cat.parentId && cat.parentId !== 'none') ? cat.parentId : null;
      } else {
        currentId = null;
      }
      safetyCounter++;
    }
    return path;
  }, [resolvedCategoryId, allDbCategories]);

  const allFilteredProducts = useMemo(() => {
    if (!products) return [];

    let result = unifiedSearchFilter(products, urlQuery);
    result = result.filter(p => p.inStoreOnly !== true);

    if (selectedCategories.length > 0) {
      const criteria = getExpandedCriteria(selectedCategories, allDbCategories || []);
      result = result.filter(p => {
        const pCats = Array.isArray(p.categories) ? p.categories : [p.categories];
        return pCats.some((catId: any) => criteria.ids.includes(String(catId)));
      });
    }

    if (selectedBrands.length > 0) {
      result = result.filter(p => {
        const brandsStr = (String(p.primaryBrand || "") + " " + String(p.brands || "")).toLowerCase();
        return selectedBrands.some(b => brandsStr.includes(b.toLowerCase()));
      });
    }

    if (selectedOrigins.length > 0) {
      result = result.filter(p => p.spec?.origin && selectedOrigins.includes(p.spec.origin));
    }

    result = result.filter(p => {
      const price = (p.salePrice > 0 ? p.salePrice : p.price);
      return price >= priceRange[0] && price <= priceRange[1];
    });

    result = result.sort((a, b) => {
      if (sortBy === 'newest') return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
      if (sortBy === 'popular') return (b.addedToCartCount || 0) - (a.addedToCartCount || 0);
      const valA = a.salePrice > 0 ? a.salePrice : a.price;
      const valB = b.salePrice > 0 ? b.salePrice : b.price;
      if (sortBy === 'price-low') return valA - valB;
      if (sortBy === 'price-high') return valB - valA;
      return 0;
    });

    return result;
  }, [products, allDbCategories, urlQuery, selectedCategories, selectedBrands, selectedOrigins, priceRange, sortBy]);

  // 追蹤：瀏覽清單與搜尋行為
  useEffect(() => {
    if (renderStage >= 2 && allFilteredProducts.length > 0) {
      if (urlQuery) {
        trackEvent('search', { search_term: urlQuery });
      } else {
        const listName = resolvedCategoryId 
          ? (allDbCategories?.find(c => c.id === resolvedCategoryId)?.name_zh || "Category List")
          : "Shop All";
        trackViewItemList(listName, allFilteredProducts);
      }
    }
  }, [allFilteredProducts, urlQuery, resolvedCategoryId, renderStage, allDbCategories]);

  const availableOrigins = useMemo(() => {
    if (!products) return [];
    const set = new Set<string>();
    products.forEach(p => { if (p.spec?.origin) set.add(p.spec.origin); });
    return Array.from(set).sort();
  }, [products]);

  const getCatName = (cat: any) => lang === 'en' ? (cat.name_en || cat.name_zh) : (cat.name_zh || cat.name_en);

  const subCategories = useMemo(() => {
    if (!allDbCategories) return [];
    const parentId = resolvedCategoryId || "none";
    return allDbCategories.filter(cat => 
      (cat.parentId || "none") === parentId && 
      cat.isVisible !== false
    ).sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));
  }, [resolvedCategoryId, allDbCategories]);

  const paginatedProducts = useMemo(() => {
    return allFilteredProducts.slice(0, displayLimit);
  }, [allFilteredProducts, displayLimit]);

  const handleResetFilters = () => {
    setPriceRange([0, 10000]);
    setSelectedCategories([]);
    setSelectedBrands([]);
    setSelectedOrigins([]);
    router.push("/shop");
  };

  const toggleOrigin = (origin: string) => {
    setSelectedOrigins(prev => prev.includes(origin) ? prev.filter(o => o !== origin) : [...prev, origin]);
  };

  const isGlobalLoading = catsLoading || productsLoading || isSearching || renderStage < 2;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow pb-20">
        <div className="bg-muted/30 border-b py-6">
          <div className="container px-4 mx-auto">
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground overflow-x-auto no-scrollbar pb-1">
                <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1.5"><Home className="h-3.5 w-3.5" />{lang === 'en' ? 'Home' : '首頁'}</Link>
                <ChevronRight className="h-3.5 w-3.5 opacity-30" />
                <Link href="/shop" className={cn("hover:text-primary transition-colors", !resolvedCategoryId && "text-foreground font-bold")}>{t.nav.shop}</Link>
                {breadcrumbPath.map((cat) => (
                  <React.Fragment key={cat.id}>
                    <ChevronRight className="h-3.5 w-3.5 opacity-30" />
                    <Link href={`/shop?category=${cat.slug || cat.id}`} className="hover:text-primary transition-colors truncate">
                      {getCatName(cat)}
                    </Link>
                  </React.Fragment>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-black font-headline uppercase tracking-tighter">
                  {resolvedCategoryId && allDbCategories?.find(c => c.id === resolvedCategoryId) ? getCatName(allDbCategories.find(c => c.id === resolvedCategoryId)) : t.nav.shop}
                </h1>
                
                <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
                  <SheetContent side="bottom" className="h-[85dvh] bottom-16 rounded-t-[2.5rem] border-none p-0 overflow-hidden flex flex-col z-[90]">
                    <SheetHeader className="p-6 border-b bg-primary/5 text-left">
                      <SheetTitle className="text-xl font-black flex items-center gap-3"><Filter className="h-5 w-5 text-primary" />進階篩選</SheetTitle>
                    </SheetHeader>
                    <div className="flex-1 overflow-y-auto p-6 pb-24">
                      <ShopFilterContent 
                        categories={allDbCategories || []} 
                        selectedCategories={selectedCategories} 
                        onToggleCategory={(id) => setSelectedCategories(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])} 
                        availableOrigins={availableOrigins}
                        selectedOrigins={selectedOrigins}
                        onToggleOrigin={toggleOrigin}
                        priceRange={priceRange} 
                        onPriceRangeChange={setPriceRange} 
                        searchQuery={urlQuery} 
                        lang={lang} 
                        t={t} 
                        onReset={handleResetFilters} 
                      />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t border-dashed pb-safe">
                      <Button className="w-full h-14 rounded-2xl font-black text-lg bg-primary text-primary-foreground shadow-xl" onClick={() => setIsFilterSheetOpen(false)}>套用篩選結果</Button>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>
        </div>
        
        <div className="container px-4 mx-auto mt-8">
          <div className="flex flex-col lg:flex-row gap-10">
            <aside className="hidden lg:flex w-72 shrink-0 flex-col gap-8 sticky top-[156px] h-fit">
              {renderStage >= 2 ? (
                <div className="p-8 bg-white rounded-[2.5rem] border shadow-sm space-y-8 animate-in fade-in duration-500">
                  <ShopFilterContent 
                    categories={allDbCategories || []}
                    selectedCategories={selectedCategories}
                    onToggleCategory={(id) => setSelectedCategories(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])}
                    availableOrigins={availableOrigins}
                    selectedOrigins={selectedOrigins}
                    onToggleOrigin={toggleOrigin}
                    priceRange={priceRange}
                    onPriceRangeChange={setPriceRange}
                    searchQuery={urlQuery}
                    lang={lang}
                    t={t}
                    onReset={handleResetFilters}
                  />
                </div>
              ) : (
                <Skeleton className="h-[500px] w-full rounded-[2.5rem]" />
              )}
            </aside>

            <div className="flex-grow space-y-6">
              {!isGlobalLoading && subCategories.length > 0 && <SubCategoryPills subCategories={subCategories} lang={lang} query={urlQuery} />}

              {!isGlobalLoading && (
                <ShopHeader 
                  count={allFilteredProducts.length} 
                  sortBy={sortBy} 
                  onSortChange={setSortBy} 
                  lang={lang} 
                  t={t}
                  onOpenFilters={() => setIsFilterSheetOpen(true)}
                />
              )}

              {isGlobalLoading ? (
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <ProductCardSkeleton key={i} />
                  ))}
                </div>
              ) : allFilteredProducts.length === 0 ? (
                <div className="py-32 text-center border-4 border-dashed rounded-[3rem] bg-muted/5 space-y-6">
                  <SearchX className="h-16 w-16 text-muted-foreground mx-auto opacity-20" />
                  <div className="space-y-2"><p className="text-xl font-black">未找到相關產品</p></div>
                </div>
              ) : (
                <div className="space-y-12">
                  <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4">
                    {paginatedProducts.map((p) => (
                      <div key={p.id} className="animate-in fade-in duration-500">
                        <ProductCard product={p} allPromos={allPromos} allCategories={allDbCategories} />
                      </div>
                    ))}
                  </div>

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
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <ShopContent />
    </Suspense>
  );
}
