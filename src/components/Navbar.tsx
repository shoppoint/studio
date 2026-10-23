"use client";

import { useState, useEffect, useMemo, useRef, Suspense } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { 
  Search, 
  LayoutGrid, 
  User, 
  ShieldCheck, 
  LogOut, 
  ChevronDown, 
  ChevronRight, 
  Bot, 
  Languages, 
  Package, 
  Loader2, 
  Zap,
  X,
  Sparkles,
  Award,
  ShoppingCart,
  TrendingUp,
  History,
  Copy,
  Gift,
  FileText,
  Home,
  ArrowRight,
  MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useI18n } from "@/lib/i18n/i18n-context";
import { useUser, useAuth, useFirestore, useCollection, useDoc } from "@/firebase";
import { signOut } from "firebase/auth";
import { cn } from "@/lib/utils";
import { CartDropdown } from "./CartDropdown";
import { MegaMenuContent } from "./navigation/MegaMenuContent";
import { collection, query, where, limit, getDocs, doc, orderBy } from "firebase/firestore";
import { Badge } from "@/components/ui/badge";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { LoginDialog } from "./auth/LoginDialog";
import { NotificationBell } from "./NotificationBell";
import { useShopData } from "@/lib/contexts/ShopDataContext";
import { findBestActivePromo, getPromoShortLabel } from "@/lib/shop-utils";
import Image from "next/image";

function NavbarContent() {
  const { t, lang, setLang } = useI18n();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isAdmin } = useUser();
  const { categories: allDbCategories, promotions: allPromos } = useShopData();
  const auth = useAuth();
  const db = useFirestore();

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || "");
  const [isMegaMenuOpen, setIsMegaMenuOpen] = useState(false);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestedProducts, setSuggestedProducts] = useState<any[]>([]);
  const [suggestedCategories, setSuggestedCategories] = useState<any[]>([]);
  
  const [localProductsIndex, setLocalProductsIndex] = useState<any[]>([]);
  const [isIndexLoaded, setIsIndexLoaded] = useState(false);
  const [isIndexLoading, setIsIndexLoading] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const mobileSearchContainerRef = useRef<HTMLDivElement>(null);

  const rankingConfigRef = useMemo(() => {
    if (!db) return null;
    return doc(db, 'config', 'rankings');
  }, [db]);
  const { data: rankingData } = useDoc<any>(rankingConfigRef);

  const generalConfigRef = useMemo(() => {
    if (!db) return null;
    return doc(db, 'config', 'general');
  }, [db]);
  const { data: generalConfig } = useDoc<any>(generalConfigRef);

  const logoUrl = useMemo(() => generalConfig?.logoUrl || "/logo.png", [generalConfig]);

  useEffect(() => {
    setMounted(true);
    const handleClickOutside = (event: MouseEvent) => {
      const isOutsideDesktop = searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node);
      const isOutsideMobile = mobileSearchContainerRef.current && !mobileSearchContainerRef.current.contains(event.target as Node);
      
      if (isOutsideDesktop && isOutsideMobile) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchLocalIndex = async () => {
    if (!db || isIndexLoaded || isIndexLoading) return;
    setIsIndexLoading(true);
    try {
      const snap = await getDocs(query(
        collection(db, 'public_products'), 
        where('status', '==', 'Active'),
        orderBy('createdAt', 'desc'), 
        limit(2000)
      ));
      
      const list = snap.docs
        .map(d => {
          const data = d.data();
          return {
            id: d.id,
            slug: data.slug || null, 
            inStoreOnly: data.inStoreOnly,
            productName_zh: String(data.productName_zh || ""),
            productName_en: String(data.productName_en || ""),
            searchIndex: (String(data.productName_zh) + " " + String(data.productName_en) + " " + String(data.sku) + " " + String(data.brands || data.primaryBrand)).toLowerCase(),
            imageUrl: data.imageUrl,
            price: data.price,
            salePrice: data.salePrice,
            // 修正：必須補齊這些欄位，findBestActivePromo 才能正確匹配品牌與分類優惠
            primaryBrand: data.primaryBrand || "",
            collabBrands: data.collabBrands || [],
            brand: data.primaryBrand || data.brands || "SHOP POINT",
            categories: data.categories || []
          };
        })
        .filter(p => p.inStoreOnly !== true);

      setLocalProductsIndex(list);
      setIsIndexLoaded(true);
    } catch (e) {
      console.warn("[Navbar] Index fetch failed", e);
    } finally {
      setIsIndexLoading(false);
    }
  };

  const categoryTree = useMemo(() => {
    if (!allDbCategories) return [];
    const buildTree = (parentId: string | null): any[] => {
      return allDbCategories
        .filter(cat => (cat.parentId || "none") === (parentId || "none"))
        .map(cat => ({ ...cat, children: buildTree(cat.id) }));
    };
    return buildTree("none");
  }, [allDbCategories]);

  useEffect(() => {
    const handler = setTimeout(() => {
      const q = searchQuery.trim().toLowerCase();
      if (q.length < 1) { 
        setSuggestedProducts([]); 
        setSuggestedCategories([]); 
        return; 
      }

      const matchedCats = allDbCategories?.filter(c => 
        (c.name_zh || "").toLowerCase().includes(q) || (c.name_en || "").toLowerCase().includes(q)
      ).slice(0, 5) || [];
      setSuggestedCategories(matchedCats);

      if (isIndexLoaded) {
        const matchedProds = localProductsIndex.filter(p => p.searchIndex.includes(q)).slice(0, 10);
        setSuggestedProducts(matchedProds);
      }
    }, 200); 

    return () => clearTimeout(handler);
  }, [searchQuery, localProductsIndex, allDbCategories, isIndexLoaded]);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;
    (document.activeElement as HTMLElement)?.blur();
    router.push(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
    setShowSuggestions(false);
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  const getCatName = (cat: any) => lang === 'en' ? (cat.name_en || cat.name_zh) : (cat.name_zh || cat.name_en);
  const isRealUser = user && !user.isAnonymous;
  const isEn = lang === 'en';

  const trendingKeywords = useMemo(() => {
    if (!rankingData) return ["無線耳機", "維他命", "護膚品"];
    const keywordsStr = isEn ? rankingData.manualKeywords_en : rankingData.manualKeywords_zh;
    const finalStr = keywordsStr || rankingData.manualKeywords || "無線耳機, 維他命";
    return finalStr.split(',').map((s: string) => s.trim()).filter(Boolean);
  }, [rankingData, isEn]);

  if (!mounted) return <nav className="h-16 w-full bg-white border-b sticky top-0 z-50 animate-pulse" />;

  const renderSuggestions = () => (
    <div className={cn(
      "absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-primary/10 overflow-hidden z-[60] animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[85vh]",
      "lg:w-full"
    )}>
      <ScrollArea className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-8">
          <div className="space-y-3">
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest opacity-60 ml-1">熱門搜尋</p>
            <div className="flex flex-wrap gap-2">
              {trendingKeywords.map((tag: string) => (
                <Badge key={tag} variant="secondary" className="px-5 py-2 rounded-xl cursor-pointer hover:bg-primary/10 transition-all font-bold text-amber-700" onClick={() => { setSearchQuery(tag); router.push(`/shop?q=${tag}`); setShowSuggestions(false); }}>{tag}</Badge>
              ))}
            </div>
          </div>

          {suggestedCategories.length > 0 && (
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest opacity-60 ml-1">相關分類</p>
              <div className="grid grid-cols-2 gap-2">
                {suggestedCategories.map(cat => (
                  <button key={cat.id} onClick={() => { router.push(`/shop?category=${cat.id}`); setShowSuggestions(false); }} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted text-xs font-bold transition-all text-left bg-muted/20 border-none"><LayoutGrid className="h-4 w-4 text-primary" />{getCatName(cat)}</button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest opacity-60 ml-1">
              {searchQuery.length >= 1 ? "產品建議" : "今日推薦"}
            </p>
            <div className="space-y-1">
              {(searchQuery.length >= 1 ? suggestedProducts : localProductsIndex.slice(0, 5)).map(p => {
                // 計算當前產品的促銷標籤
                const bestPromo = findBestActivePromo(p, allPromos, allDbCategories);
                const promoLabel = getPromoShortLabel(bestPromo, lang);

                return (
                  <Link 
                    key={p.id} 
                    href={`/product/${p.slug || p.id}`} 
                    className="flex items-center gap-4 p-3 rounded-2xl hover:bg-primary/5 transition-all group border border-transparent hover:border-primary/10"
                    onClick={() => setShowSuggestions(false)}
                  >
                    <div className="h-12 w-12 rounded-xl bg-muted overflow-hidden shrink-0 border border-muted-foreground/10">
                      {p.imageUrl ? <img src={p.imageUrl} className="object-cover w-full h-full" alt="" /> : <Package className="h-5 w-5 m-3.5 opacity-10" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold truncate group-hover:text-primary transition-colors">{p.productName_zh || p.productName_en}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-[9px] text-muted-foreground font-black uppercase tracking-tighter">{p.brand || "SHOP POINT"}</p>
                        {promoLabel && (
                          <Badge className="bg-orange-600 text-white border-none h-4 px-1.5 font-black text-[8px] uppercase gap-1 animate-in zoom-in">
                            <Sparkles className="h-2.5 w-2.5 fill-current" /> {promoLabel}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-orange-600">${p.salePrice || p.price}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground opacity-30 group-hover/card:opacity-100 group-hover/card:translate-x-1 transition-all" />
                  </Link>
                );
              })}
              {searchQuery.length >= 1 && suggestedProducts.length === 0 && (
                <div className="py-12 text-center text-muted-foreground italic text-xs border-2 border-dashed rounded-3xl">
                  找不到相關產品，試試其他關鍵字。
                </div>
              )}
            </div>
          </div>
        </div>
        <ScrollBar orientation="vertical" />
      </ScrollArea>
      
      {searchQuery.length >= 1 && (
        <div className="p-4 bg-muted/40 border-t border-dashed shrink-0">
          <Button 
            className="w-full h-14 rounded-2xl font-black text-sm uppercase tracking-widest bg-primary text-primary-foreground gap-2 shadow-xl hover:scale-[1.01] transition-all"
            onClick={() => handleSearchSubmit()}
          >
            查看所有關於「{searchQuery}」的結果 <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <>
      <header className="lg:hidden w-full bg-white border-b border-muted/50 pb-2 relative z-50">
        <div className="px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            {!logoError && logoUrl && (
              <div className="relative w-7 h-7">
                <Image 
                  src={logoUrl} 
                  alt="Logo" 
                  fill 
                  className="object-contain" 
                  onError={() => setLogoError(true)}
                  unoptimized 
                />
              </div>
            )}
            <span className="text-xl font-black tracking-tighter font-headline">SHOP <span className="text-primary">POINT</span></span>
          </Link>
          <div className="flex items-center gap-1">
            <NotificationBell />
          </div>
        </div>

        <div className="px-4 mb-3 relative" ref={mobileSearchContainerRef}>
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="absolute left-4 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              type="search" 
              placeholder={t.nav.search} 
              className="w-full pl-10 h-10 bg-muted/40 border-none rounded-full text-sm font-medium shadow-inner"
              value={searchQuery}
              onFocus={() => { setShowSuggestions(true); fetchLocalIndex(); }}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
          {showSuggestions && renderSuggestions()}
        </div>

        <div className="px-4 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-6 text-xs font-black uppercase tracking-tight pb-3 w-max">
            <Link href="/shop" className="hover:text-primary transition-colors">{t.nav.shop}</Link>
            <Link href="/new-arrivals" className="hover:text-primary transition-colors">{t.nav.arrivals}</Link>
            <Link href="/brands" className="hover:text-primary transition-colors">{t.nav.brands}</Link>
            <Link href="/gifts" className="hover:text-primary transition-colors">{t.nav.gifts}</Link>
            <Link href="/clearance" className="text-orange-600 font-black flex items-center gap-1 hover:opacity-80 transition-all">
              <Zap className="h-3 w-3 fill-current" />
              {t.nav.clearance}
            </Link>
            <Link href="/deals" className="hover:text-primary transition-colors">{t.nav.deals}</Link>
            <Link href="/recommendations" className="hover:text-primary transition-colors">{isEn ? 'Featured' : '精選'}</Link>
            <Link href="/news" className="hover:text-primary transition-colors">{t.nav.news}</Link>
          </div>
        </div>
      </header>

      <header className="hidden lg:block sticky top-0 z-50 bg-background shadow-md w-full">
        <div className="bg-muted/30 border-b border-muted/50 py-1.5">
          <div className="container mx-auto px-4 flex items-center justify-between">
            <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-wider text-muted-foreground/80">
              <DropdownMenu>
                <DropdownMenuTrigger className="hover:text-amber-700 transition-colors flex items-center gap-1 focus:outline-none">
                  <Languages className="h-3 w-3" /> {lang === 'en' ? 'English' : '繁體中文'} <ChevronDown className="h-2 w-2" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="rounded-xl border-none shadow-2xl">
                  <DropdownMenuItem onClick={() => setLang("en")}>English</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLang("zh-HK")}>繁體中文 (香港)</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Separator orientation="vertical" className="h-3 bg-muted-foreground/20" />
              <button onClick={() => window.dispatchEvent(new CustomEvent('open-smart-assistant'))} className="hover:text-amber-700 transition-colors flex items-center gap-1 text-amber-700 font-black">
                <MessageSquare className="h-3 w-3" /> {lang === 'en' ? 'Help Center' : '客服小助手'}
              </button>
            </div>
          </div>
        </div>

        <div className="container mx-auto h-16 px-4 flex items-center justify-between gap-8 bg-white">
          <Link href="/" className="flex items-center space-x-3 shrink-0 group">
            {!logoError && logoUrl && (
              <div className="relative w-8 h-8">
                <Image 
                  src={logoUrl} 
                  alt="Logo" 
                  fill 
                  className="object-contain" 
                  onError={() => setLogoError(true)}
                  unoptimized 
                />
              </div>
            )}
            <span className="text-xl font-black tracking-tighter font-headline group-hover:text-primary transition-colors">SHOP <span className="text-primary">POINT</span></span>
          </Link>

          <div className="flex-grow max-w-2xl relative" ref={searchContainerRef}>
            <form onSubmit={handleSearchSubmit} className="relative group">
              <Search className="absolute left-4 top-2.5 h-4 w-4 text-muted-foreground group-focus-within:text-amber-700 transition-colors" />
              <Input 
                type="search" 
                placeholder={t.nav.search} 
                className="w-full pl-11 pr-12 h-10 bg-muted/40 border-none rounded-xl font-medium focus-visible:ring-primary/20 shadow-inner"
                value={searchQuery}
                onFocus={() => { setShowSuggestions(true); fetchLocalIndex(); }}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="absolute right-4 top-2 flex items-center gap-2">
                {isIndexLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />}
                {searchQuery && <button type="button" onClick={() => setSearchQuery("")} className="text-muted-foreground"><X className="h-3.5 w-3.5" /></button>}
              </div>
            </form>
            
            {showSuggestions && renderSuggestions()}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <NotificationBell />
            <CartDropdown />
            {isRealUser ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-[9px] font-black text-primary-foreground border-2 border-white shadow-sm focus:outline-none">
                    {user.email?.charAt(0).toUpperCase()}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-2xl border-none p-2 mt-2">
                  <DropdownMenuLabel className="text-center font-black pb-2 pt-1 uppercase text-[10px] text-muted-foreground tracking-widest">{user.displayName || "我的帳戶"}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="rounded-lg"><Link href="/profile" className="font-bold flex items-center gap-3 py-2.5 px-4 cursor-pointer" prefetch={false}><User className="h-4 w-4" /> {t.nav.account}</Link></DropdownMenuItem>
                  {isAdmin && <DropdownMenuItem asChild className="bg-primary/5 text-amber-700 focus:bg-primary/10 rounded-lg"><Link href="/admin/dashboard" className="font-bold flex items-center gap-3 py-2.5 px-4 cursor-pointer" prefetch={false}><ShieldCheck className="h-4 w-4" /> {t.nav.admin_panel}</Link></DropdownMenuItem>}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive font-bold py-2.5 px-4 rounded-lg cursor-pointer flex items-center gap-3"><LogOut className="h-4 w-4" /> {t.nav.logout}</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : <LoginDialog trigger={<Button variant="outline" className="rounded-xl h-9 font-black px-5 border-primary/20 text-amber-700 hover:bg-primary/5 text-xs"><User className="h-3.5 w-3.5" /> {isEn ? "Sign In" : "登入"}</Button>} />}
          </div>
        </div>

        <div className="border-t border-muted/50 bg-white">
          <div className="container mx-auto h-11 flex items-center px-4">
            <div className="flex items-center gap-x-5 text-[11px] font-black uppercase tracking-tight h-full">
              <Popover open={isMegaMenuOpen} onOpenChange={setIsMegaMenuOpen}>
                <PopoverTrigger asChild>
                  <button className="hover:text-amber-700 transition-colors flex items-center gap-1.5 h-full border-b-2 border-transparent hover:border-primary group focus:outline-none">
                    <LayoutGrid className="h-4 w-4" /> {t.nav.categories} <ChevronDown className="h-3 w-3 group-data-[state=open]:rotate-180 transition-transform" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-screen max-w-screen-xl p-0 border-none shadow-2xl rounded-b-[2.5rem] bg-white overflow-hidden" align="center">
                  <MegaMenuContent categoryTree={categoryTree} activeCategoryId={activeCategoryId || (categoryTree[0]?.id)} setActiveCategoryId={setActiveCategoryId} onCategoryClick={(id) => { setIsMegaMenuOpen(false); router.push(`/shop?category=${id}`); }} lang={lang} t={t} />
                </PopoverContent>
              </Popover>

              <Link href="/new-arrivals" className="hover:text-amber-700 flex items-center h-full border-b-2 border-transparent hover:border-primary group gap-1.5"><Sparkles className="h-4 w-4 text-primary animate-pulse" /> {t.nav.arrivals}</Link>
              <Link href="/brands" className="hover:text-amber-700 flex items-center h-full border-b-2 border-transparent hover:border-primary gap-1.5"><Award className="h-4 w-4" /> {t.nav.brands}</Link>
              <Link href="/gifts" className="hover:text-amber-700 flex items-center h-full border-b-2 border-transparent hover:border-primary gap-1.5"><Gift className="h-4 w-4" /> {t.nav.gifts}</Link>
              <Link href="/news" className="hover:text-amber-700 flex items-center h-full border-b-2 border-transparent hover:border-primary gap-1.5"><FileText className="h-4 w-4" /> {t.nav.news}</Link>
              <Link href="/recommendations" className="hover:text-amber-700 flex items-center h-full border-b-2 border-transparent hover:border-primary">{t.nav.recommendations}</Link>
              <Link href="/deals" className="hover:text-amber-700 flex items-center h-full border-b-2 border-transparent hover:border-primary">{t.nav.deals}</Link>
              <Link href="/shop" className="hover:text-amber-700 flex items-center h-full border-b-2 border-transparent hover:border-primary">{t.nav.shop}</Link>
              <Link href="/clearance" className="text-orange-600 flex items-center h-full border-b-2 border-transparent hover:border-orange-600 gap-1.5"><Zap className="h-4 w-4 fill-current" />{t.nav.clearance}</Link>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}

export function Navbar() {
  return (
    <Suspense fallback={<nav className="h-16 w-full bg-white border-b sticky top-0 z-50 animate-pulse" />}>
      <NavbarContent />
    </Suspense>
  );
}
