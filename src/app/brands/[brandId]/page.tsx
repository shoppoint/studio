"use client";

export const dynamic = 'force-dynamic';

import { useMemo, useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { 
  ChevronRight, 
  ArrowLeft,
  Award,
  Loader2,
  Info,
  SearchX,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Package,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useI18n } from "@/lib/i18n/i18n-context";
import { useUser, useFirestore, useDoc, useCollection } from "@/firebase";
import { collection, query, where, doc, limit, getDocs, getDoc, or, and } from "firebase/firestore";
import { ProductCard } from "@/components/ProductCard";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export default function BrandDetailPage() {
  const { t, lang } = useI18n();
  const params = useParams();
  const router = useRouter();
  const db = useFirestore();
  const brandIdOrSlug = params.brandId as string;

  const [brand, setBrand] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showFullStory, setShowFullStory] = useState(false);
  
  // 階梯載入狀態
  const [stage, setStage] = useState(1);

  useEffect(() => {
    // Stage 2 (300ms): 產品清單與促銷數據
    const timer2 = setTimeout(() => setStage(2), 300);
    // Stage 3 (1200ms): 推薦其他品牌
    const timer3 = setTimeout(() => setStage(3), 1200);
    return () => { clearTimeout(timer2); clearTimeout(timer3); };
  }, []);

  useEffect(() => {
    const fetchBrand = async () => {
      if (!db) return;
      setLoading(true);
      let redirecting = false;
      
      try {
        const slugQuery = query(collection(db, 'brands'), where('slug', '==', brandIdOrSlug), limit(1));
        const slugSnap = await getDocs(slugQuery);
        
        if (!slugSnap.empty) {
          setBrand({ ...slugSnap.docs[0].data(), id: slugSnap.docs[0].id });
        } else {
          const idRef = doc(db, 'brands', brandIdOrSlug);
          const idSnap = await getDoc(idRef);
          
          if (idSnap.exists()) {
            const data = idSnap.data();
            if (data.slug && data.slug !== brandIdOrSlug) {
              if (!redirecting) {
                redirecting = true;
                router.replace(`/brands/${data.slug}`);
              }
              return; 
            }
            setBrand({ ...data, id: idSnap.id });
          } else {
            setBrand(null);
          }
        }
      } catch (e) {
        console.error("Brand fetch error", e);
      } finally {
        if (!redirecting) setLoading(false);
      }
    };
    if (brandIdOrSlug) fetchBrand();
  }, [db, brandIdOrSlug, router]);

  // 獲取產品數據
  const productsQuery = useMemo(() => {
    if (!db || !brand || stage < 2) return null;
    const nameToFilter = brand.name_zh || brand.name_en;
    
    return query(
      collection(db, 'public_products'),
      and(
        where('status', '==', 'Active'),
        or(
          where('primaryBrand', '==', nameToFilter),
          where('collabBrands', 'array-contains', nameToFilter)
        )
      ),
      limit(40)
    );
  }, [db, brand, stage]);

  const { data: products, loading: productsLoading } = useCollection<any>(productsQuery);

  // 核心修正：抓取促銷活動、分類及品牌資料，以供 ProductCard 計算標籤
  const promosQuery = useMemo(() => (db && stage >= 2) ? query(collection(db, 'promotions'), where('status', '==', 'active')) : null, [db, stage]);
  const { data: allPromos } = useCollection<any>(promosQuery);

  const catsQuery = useMemo(() => (db && stage >= 2) ? query(collection(db, 'categories'), where('isVisible', '==', true)) : null, [db, stage]);
  const { data: allCategories } = useCollection<any>(catsQuery);

  const brandsQuery = useMemo(() => (db && stage >= 2) ? query(collection(db, 'brands')) : null, [db, stage]);
  const { data: allBrands } = useCollection<any>(brandsQuery);

  const relatedBrandsQuery = useMemo(() => {
    if (!db || !brand || !brand.categories || stage < 3) return null;
    return query(
      collection(db, 'brands'),
      where('status', '==', 'Active'),
      where('categories', 'array-contains', brand.categories[0]),
      limit(10)
    );
  }, [db, brand, stage]);
  const { data: relatedBrands } = useCollection<any>(relatedBrandsQuery);

  const getBrandName = (b: any) => lang === 'en' ? (b.name_en || b.name_zh) : (b.name_zh || b.name_en);

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;

  if (!brand) return (
    <div className="h-screen flex flex-col items-center justify-center space-y-6">
      <Award className="h-16 w-16 text-muted-foreground/30" />
      <h2 className="text-2xl font-black font-headline">Brand Not Found</h2>
      <Button variant="outline" onClick={() => router.push("/brands")} className="rounded-xl font-bold"><ArrowLeft className="mr-2 h-4 w-4" /> {t.brands.back_to_brands}</Button>
    </div>
  );

  const story = lang === 'en' ? (brand.description_en || brand.description_zh) : (brand.description_zh || brand.description_en);
  const isStoryLong = story && story.length > 200;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow">
        {/* Stage 1: Brand Banner & Identity */}
        <section className="bg-primary/10 relative overflow-hidden border-b animate-in fade-in duration-700">
          <div className="container mx-auto px-4 py-12 md:py-20 relative z-10">
            <div className="flex flex-col md:flex-row items-center md:items-end gap-8 md:gap-12">
              <div className="relative h-32 w-32 md:h-48 md:w-48 rounded-[2.5rem] bg-white shadow-2xl p-6 flex items-center justify-center shrink-0 overflow-hidden ring-4 ring-white">
                {brand.logoUrl ? <Image src={brand.logoUrl} alt={getBrandName(brand)} fill className="object-contain p-6" priority /> : <Award className="h-16 w-16 text-primary/20" />}
              </div>
              <div className="flex-1 text-center md:text-left space-y-4">
                <div className="flex flex-col md:flex-row md:items-center gap-3 justify-center md:justify-start">
                  <h1 className="text-4xl md:text-6xl font-black font-headline tracking-tighter leading-tight">{getBrandName(brand)}</h1>
                </div>
              </div>
            </div>
          </div>
        </section>

        <div className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Sidebar: Brand Story */}
            <div className="lg:col-span-4 space-y-8">
              <div className="space-y-6 bg-white p-8 rounded-[2.5rem] border shadow-sm sticky top-28">
                <h2 className="text-xl font-black font-headline flex items-center gap-3 border-b pb-4 text-slate-800">
                  <Info className="h-5 w-5 text-primary" />
                  {t.brands.brand_story}
                </h2>
                <div className="space-y-4">
                  <div className={cn(
                    "text-muted-foreground text-sm leading-relaxed italic whitespace-pre-line transition-all duration-500",
                    !showFullStory && isStoryLong && "line-clamp-[8] overflow-hidden"
                  )}>
                    {story || (lang === 'en' ? "No brand story available." : "暫無品牌故事。")}
                  </div>
                  {isStoryLong && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowFullStory(!showFullStory)}
                      className="text-primary font-black uppercase text-[10px] tracking-widest hover:bg-primary/5 p-0 h-auto"
                    >
                      {showFullStory ? <><ChevronUp className="h-3 w-3 mr-1" /> {lang === 'en' ? 'Show Less' : '收起故事'}</> : <><ChevronDown className="h-3 w-3 mr-1" /> {lang === 'en' ? 'Read Full Story' : '閱讀完整故事'}</>}
                    </Button>
                  )}
                </div>

                {/* Stage 3: Discovery (Related Brands) */}
                {stage >= 3 && relatedBrands && relatedBrands.length > 1 && (
                  <div className="pt-8 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-700">
                    <Separator className="border-dashed" />
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                      <Sparkles className="h-3 w-3 text-primary" />
                      More from same Category
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      {relatedBrands.filter(b => b.id !== brand.id).slice(0, 4).map(b => (
                        <Link key={b.id} href={`/brands/${b.slug || b.id}`}>
                          <div className="group space-y-2 text-center">
                            <div className="aspect-square bg-muted/30 rounded-2xl border flex items-center justify-center p-3 group-hover:border-primary/30 transition-all">
                              {b.logoUrl ? <img src={b.logoUrl} className="max-h-full object-contain" /> : <Award className="h-4 w-4 opacity-10" />}
                            </div>
                            <p className="text-[10px] font-bold truncate group-hover:text-primary">{getBrandName(b)}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Main: Products List */}
            <div className="lg:col-span-8 space-y-10">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black font-headline tracking-tight">
                  {t.brands.products_by.replace('{brand}', getBrandName(brand))}
                </h3>
              </div>

              {stage >= 2 ? (
                productsLoading ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="space-y-4">
                        <div className="aspect-square bg-muted animate-pulse rounded-[2rem]" />
                        <div className="h-4 bg-muted animate-pulse rounded w-3/4" />
                        <div className="h-4 bg-muted animate-pulse rounded w-1/4" />
                      </div>
                    ))}
                  </div>
                ) : !products || products.length === 0 ? (
                  <div className="py-24 text-center border-4 border-dashed rounded-[3rem] bg-muted/10">
                    <SearchX className="h-12 w-12 text-muted-foreground/30 mx-auto" />
                    <p className="font-bold text-muted-foreground mt-4">{t.brands.no_products}</p>
                    <Button asChild variant="link" className="mt-2 text-primary">
                      <Link href="/shop">Browse other quality goods <ArrowRight className="ml-1 h-3 w-3" /></Link>
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {products.map((p: any) => (
                      <ProductCard 
                        key={p.id} 
                        product={p} 
                        allPromos={allPromos} 
                        allCategories={allCategories} 
                        allBrands={allBrands}
                      />
                    ))}
                  </div>
                )
              ) : (
                <div className="py-32 flex flex-col items-center justify-center gap-4 opacity-30">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-[10px] font-black uppercase tracking-widest">載入產品目錄中...</p>
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
