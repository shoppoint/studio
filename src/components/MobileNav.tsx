"use client"

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { 
  Search, 
  LayoutGrid, 
  ShoppingCart, 
  User, 
  ShieldCheck, 
  LogOut, 
  Sparkles, 
  ShoppingBag, 
  Trash2, 
  ArrowRight, 
  X, 
  Package, 
  Loader2, 
  ChevronRight, 
  Zap, 
  PackageCheck, 
  Menu, 
  Minus, 
  Plus, 
  TrendingUp, 
  Award, 
  Gift, 
  Ticket, 
  Check,
  Truck,
  Info
} from "lucide-react";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetDescription
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n/i18n-context";
import { Badge } from "@/components/ui/badge";
import { useUser, useAuth, useFirestore, useCollection, useDoc } from "@/firebase";
import { useCart } from "@/lib/cart-context";
import { signOut } from "firebase/auth";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { collection, query, where, orderBy, getDocs, limit, doc } from "firebase/firestore";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LoginDialog } from "./auth/LoginDialog";
import { useToast } from "@/hooks/use-toast";
import { getPromoShortLabel, calculateDiscountForPromo, findBestActivePromo } from "@/lib/shop-utils";
import { ShippingMilestoneTracker } from "./cart/ShippingMilestoneTracker";
import { useShopData } from "@/lib/contexts/ShopDataContext";

export function MobileNav() {
  const { t, lang } = useI18n();
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAdmin } = useUser();
  const { selectedCount } = useCart();
  const auth = useAuth();
  const db = useFirestore();

  const [openExplore, setOpenExplore] = useState(false);
  const [openCategories, setOpenCategories] = useState(false);
  const [openCart, setOpenCart] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const generalConfigRef = useMemo(() => {
    if (!db) return null;
    return doc(db, 'config', 'general');
  }, [db]);
  const { data: generalConfig } = useDoc<any>(generalConfigRef);

  const logoUrl = useMemo(() => generalConfig?.logoUrl || "/logo.png", [generalConfig]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  const isRealUser = user && !user.isAnonymous;

  if (!mounted) return null;

  return (
    <>
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-[100] bg-background/95 backdrop-blur-md border-t border-muted/50 pb-safe shadow-[0_-4px_12px_rgba(0,0,0,0.1)]">
        <div className="flex items-center justify-around h-16">
          <button onClick={() => setOpenCategories(true)} className={cn("flex flex-col items-center justify-center flex-1 gap-1", openCategories ? "text-primary" : "text-muted-foreground")}>
            <LayoutGrid className="h-5 w-5" /><span className="text-[10px] font-black uppercase tracking-tighter">{t.nav.categories}</span>
          </button>
          <button onClick={() => setOpenExplore(true)} className={cn("flex flex-col items-center justify-center flex-1 gap-1", openExplore ? "text-primary" : "text-muted-foreground")}>
            <Search className="h-5 w-5" /><span className="text-[10px] font-black uppercase tracking-tighter">{t.nav.explore}</span>
          </button>
          <div className="flex-1 flex justify-center">
            <Link href="/" className="h-12 w-12 relative bg-primary rounded-full p-2 shadow-2xl -translate-y-3 border-4 border-background active:scale-95 transition-transform" prefetch={false}>
              {!logoError && logoUrl ? <Image src={logoUrl} alt="Logo" fill className="object-contain p-2.5" onError={() => setLogoError(true)} unoptimized /> : <div className="h-full w-full flex items-center justify-center text-primary-foreground font-black text-xs">SP</div>}
            </Link>
          </div>
          <button onClick={() => setOpenCart(true)} className={cn("flex flex-col items-center justify-center flex-1 gap-1 relative", openCart ? "text-primary" : "text-muted-foreground")}>
            <ShoppingCart className="h-5 w-5" />
            {selectedCount > 0 && <Badge className="absolute -top-1 right-3 h-5 min-w-5 flex items-center justify-center text-[10px] bg-red-600 text-white border-2 border-background font-black">{selectedCount}</Badge>}
            <span className="text-[10px] font-black uppercase tracking-tighter">{t.nav.cart}</span>
          </button>
          <div className="flex-1 flex flex-col items-center justify-center">
            {isRealUser ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className={`flex flex-col items-center justify-center w-full gap-1 ${pathname.startsWith('/profile') ? "text-primary" : "text-muted-foreground"}`}>
                    <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-[9px] font-black text-primary-foreground border-2 border-background shadow-sm">{user.email?.charAt(0).toUpperCase()}</div>
                    <span className="text-[10px] font-black uppercase tracking-tighter">{t.nav.account}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="top" align="center" className="w-64 mb-4 rounded-xl shadow-2xl p-2"><DropdownMenuItem asChild><Link href="/profile" className="flex items-center gap-3 py-2.5 px-4 font-bold cursor-pointer"><User className="h-4 w-4" /> {t.nav.account}</Link></DropdownMenuItem><DropdownMenuItem onClick={handleLogout} className="flex items-center gap-3 py-2.5 px-4 text-destructive font-bold cursor-pointer"><LogOut className="h-4 w-4" /> {t.nav.logout}</DropdownMenuItem></DropdownMenuContent>
              </DropdownMenu>
            ) : <LoginDialog trigger={<button className="flex flex-col items-center justify-center w-full gap-1 text-muted-foreground"><User className="h-5 w-5" /><span className="text-[10px] font-black uppercase tracking-tighter">{t.nav.account}</span></button>} />}
          </div>
        </div>
      </div>

      <Sheet open={openCategories} onOpenChange={setOpenCategories}>
        <SheetContent side="bottom" className="h-[85dvh] bottom-16 rounded-t-[2.5rem] border-none p-0 overflow-hidden flex flex-col z-[90]">
          <SheetHeader className="p-6 border-b shrink-0 text-left bg-primary/5"><SheetTitle className="text-xl font-black flex items-center gap-3"><LayoutGrid className="h-5 w-5 text-primary" /> {t.nav.categories_all}</SheetTitle></SheetHeader>
          <div className="flex-1 overflow-hidden"><MobileCategoryContent onClose={() => setOpenCategories(false)} /></div>
        </SheetContent>
      </Sheet>

      <Sheet open={openExplore} onOpenChange={setOpenExplore}>
        <SheetContent side="bottom" className="h-[85dvh] bottom-16 rounded-t-[2.5rem] border-none p-0 overflow-hidden flex flex-col z-[90]">
          <SheetHeader className="p-6 border-b shrink-0 text-left bg-primary/5"><SheetTitle className="text-xl font-black flex items-center gap-3"><Search className="h-5 w-5 text-primary" /> {lang === 'en' ? "Explore" : "搜尋與探索"}</SheetTitle></SheetHeader>
          <div className="flex-1 overflow-hidden"><MobileSearchContent onClose={() => setOpenExplore(false)} /></div>
        </SheetContent>
      </Sheet>

      <Sheet open={openCart} onOpenChange={setOpenCart}>
        <SheetContent side="bottom" className="h-[85dvh] bottom-16 rounded-t-[2.5rem] border-none p-0 overflow-hidden flex flex-col z-[90]">
          <SheetHeader className="p-5 border-b bg-primary/5 shrink-0 text-left"><SheetTitle className="text-xl font-black flex items-center gap-3"><ShoppingCart className="h-5 w-5 text-primary" /> {t.cart.my_cart}</SheetTitle></SheetHeader>
          <MobileCartContent onClose={() => setOpenCart(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}

function MobileCartContent({ onClose }: any) {
  const { lang, t } = useI18n();
  const { items, removeItem, subtotal, updateQty } = useCart();
  const { userData } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [couponCode, setCouponCode] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [appliedCouponInfo, setAppliedCouponInfo] = useState<any>(null);

  const isZh = lang === 'zh-HK';

  const promosQuery = useMemo(() => db ? query(collection(db, 'promotions'), where('status', '==', 'active')) : null, [db]);
  const { data: allPromos } = useCollection<any>(promosQuery);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim() || !db) return;
    setIsApplyingCoupon(true);
    try {
      const q = query(collection(db, 'promotions'), where('code', '==', couponCode.trim().toUpperCase()));
      const snap = await getDocs(q);
      if (snap.empty) toast({ title: isZh ? "無效代碼" : "Invalid Code", variant: "destructive" });
      else { setAppliedCouponInfo(snap.docs[0].data()); toast({ title: isZh ? "已套用" : "Applied" }); }
    } finally { setIsApplyingCoupon(false); }
  };

  const promoInfo = useMemo(() => {
    const activeItems = items.filter(i => i.selected !== false);
    if (!allPromos || subtotal <= 0 || !activeItems.length) return { discount: 0, appliedPromos: [] as any[] };
    const today = format(new Date(), "yyyy-MM-dd");
    const candidates = allPromos.filter(p => {
      if (p.isPublic === false && (!appliedCouponInfo || p.code !== appliedCouponInfo.code)) return false;
      if (!appliedCouponInfo && p.code) return false;
      return (!p.startsAt || p.startsAt <= today) && (!p.endsAt || p.endsAt >= today);
    }).map(p => ({ ...p, discount: calculateDiscountForPromo(p, activeItems, subtotal, userData).discount, displayName: getPromoShortLabel(p, lang) }))
    .filter(r => r.discount > 0);
    return { discount: candidates.reduce((s, p) => s + p.discount, 0), appliedPromos: candidates };
  }, [allPromos, items, subtotal, userData, appliedCouponInfo, lang]);

  if (items.length === 0) return <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-4 text-muted-foreground"><ShoppingBag className="h-16 w-16 opacity-20" /><p>{t.cart.empty}</p></div>;

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <ScrollArea className="flex-1 px-5 pt-4">
        <div className="space-y-4 pb-8">
          <ShippingMilestoneTracker subtotal={subtotal - promoInfo.discount} variant="compact" />
          <div className="space-y-3">
            {items.map(it => (
              <div key={it.id} className="flex gap-3 p-3 bg-white border rounded-2xl shadow-sm relative">
                <div className="h-16 w-16 rounded-xl bg-muted overflow-hidden shrink-0 border">{it.image && <Image src={it.image} alt="" width={64} height={64} className="object-cover" />}</div>
                <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                  <h4 className="text-xs font-bold truncate pr-6">{it.name}</h4>
                  
                  {it.inventoryPolicy === 'PreOrder' && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      <Badge className="bg-indigo-600 text-white border-none font-black text-[7px] h-4 px-1.5 uppercase shadow-sm">
                        <Zap className="h-2.5 w-2.5 mr-1 fill-current animate-pulse" />
                        {lang === 'zh-HK' ? '限定預購' : 'PRE-ORDER'}
                      </Badge>
                      {it.preOrderExpectedDate && (
                        <span className="text-[7px] font-black text-indigo-700 bg-indigo-50 px-1.5 rounded flex items-center gap-1">
                          <Truck className="h-2 w-2" /> 
                          {lang === 'zh-HK' ? `預計到貨: ${it.preOrderExpectedDate}` : `Arrival: ${it.preOrderExpectedDate}`}
                        </span>
                      )}
                    </div>
                  )}

                  {/* 追加貨品提示 */}
                  {it.qty > it.availableStock && it.inventoryPolicy === 'Allow' && (
                    <p className="text-[8px] font-bold text-orange-600 mt-1 flex items-center gap-1">
                      <Info className="h-2.5 w-2.5" />
                      {lang === 'zh-HK' ? "訂購超過存貨數量，配送時間可能延長" : "Backorder included, delivery may be delayed"}
                    </p>
                  )}

                  <div className="flex justify-between items-end">
                    <div className="flex items-center bg-muted/40 rounded-lg h-7 overflow-hidden border">
                      <button className="px-2" onClick={() => updateQty(it.id, it.qty - 1)}><Minus className="h-3 w-3" /></button>
                      <span className="w-6 text-center text-[10px] font-black">{it.qty}</span>
                      <button className="px-2" onClick={() => updateQty(it.id, it.qty + 1)}><Plus className="h-3 w-3" /></button>
                    </div>
                    <span className="text-sm font-black text-orange-600">${(it.price * it.qty).toFixed(1)}</span>
                  </div>
                </div>
                <button onClick={() => removeItem(it.id)} className="absolute top-2 right-2 p-1 text-muted-foreground"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>
      <div className="p-4 bg-white border-t space-y-3 shadow-lg pb-safe">
        <div className="flex gap-2">
          <Input 
            value={couponCode} 
            onChange={e => setCouponCode(e.target.value.toUpperCase())} 
            className="h-9 rounded-xl bg-muted/30 text-[10px] font-black" 
            placeholder={isZh ? "優惠代碼" : "COUPON"} 
          />
          <Button size="sm" onClick={handleApplyCoupon} disabled={isApplyingCoupon}>
            {isApplyingCoupon ? "..." : (isZh ? "套用" : "Apply")}
          </Button>
        </div>
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] font-black uppercase text-muted-foreground">
            <span>{isZh ? "小計" : "Subtotal"}</span>
            <span>${subtotal.toFixed(1)}</span>
          </div>
          {promoInfo.discount > 0 && (
            <div className="flex justify-between text-[10px] font-bold text-green-600">
              <span>{isZh ? "已套用優惠" : "Discounts"}</span>
              <span>-${promoInfo.discount.toFixed(1)}</span>
            </div>
          )}
          <div className="flex justify-between text-xl font-black text-orange-600 border-t border-dashed pt-1">
            <span>{isZh ? "總額" : "Total"}</span>
            <span>${(subtotal - promoInfo.discount).toFixed(1)}</span>
          </div>
        </div>
        <Button asChild className="w-full h-12 rounded-xl font-black bg-primary shadow-xl" onClick={onClose}><Link href="/checkout">{t.checkout.title}</Link></Button>
      </div>
    </div>
  );
}

function MobileSearchContent({ onClose }: any) {
  const { lang, t } = useI18n();
  const router = useRouter();
  const db = useFirestore();
  const { categories: allDbCategories, promotions: allPromos } = useShopData();
  const [search, setSearch] = useState("");
  const [localIndex, setLocalIndex] = useState<any[]>([]);
  const isEn = lang === 'en';

  // Fetch Ranking Data for Trending Keywords
  const rankingConfigRef = useMemo(() => {
    if (!db) return null;
    return doc(db, 'config', 'rankings');
  }, [db]);
  const { data: rankingData } = useDoc<any>(rankingConfigRef);

  const trendingKeywords = useMemo(() => {
    if (!rankingData) return ["無線耳機", "維他命", "護膚品"];
    const keywordsStr = isEn ? rankingData.manualKeywords_en : rankingData.manualKeywords_zh;
    const finalStr = keywordsStr || rankingData.manualKeywords || "無線耳機, 維他命";
    return finalStr.split(',').map((s: string) => s.trim()).filter(Boolean);
  }, [rankingData, isEn]);

  useEffect(() => {
    const fetchIdx = async () => {
      if(!db) return;
      const snap = await getDocs(query(
        collection(db, 'public_products'), 
        where('status', '==', 'Active'),
        orderBy('createdAt', 'desc'), 
        limit(2000)
      ));
      const items = snap.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          slug: data.slug || null, 
          inStoreOnly: data.inStoreOnly,
          productName_zh: data.productName_zh || "",
          productName_en: data.productName_en || "",
          imageUrl: data.imageUrl,
          salePrice: data.salePrice,
          price: data.price,
          // 修正：補齊主要品牌、聯乘品牌與分類欄位，供 findBestActivePromo 正確解析
          primaryBrand: data.primaryBrand || "",
          collabBrands: data.collabBrands || [],
          categories: data.categories || [],
          brand: data.primaryBrand || data.brands || "SHOP POINT",
          searchIndex: (String(data.productName_zh || "") + " " + String(data.productName_en || "")).toLowerCase()
        };
      }).filter(p => p.inStoreOnly !== true);
      setLocalIndex(items);
    };
    fetchIdx();
  }, [db]);

  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (q.length < 1) return [];
    return localIndex.filter(p => p.searchIndex.includes(q)).slice(0, 15);
  }, [search, localIndex]);

  const showDefaults = search.trim().length < 1;

  return (
    <div className="h-full flex flex-col bg-slate-50/50">
      <div className="p-6 bg-white shrink-0">
        <form onSubmit={(e) => { e.preventDefault(); if(search) { router.push(`/shop?q=${search}`); onClose(); } }}>
          <Input 
            autoFocus 
            placeholder={t.nav.search} 
            className="h-12 bg-muted/40 border-none rounded-2xl font-bold" 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </form>
      </div>
      <ScrollArea className="flex-1 p-6">
        <div className="space-y-8">
          {showDefaults ? (
            <>
              {/* Trending Keywords */}
              <div className="space-y-3">
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest opacity-60 ml-1">熱門搜尋</p>
                <div className="flex flex-wrap gap-2">
                  {trendingKeywords.map((tag: string) => (
                    <Badge 
                      key={tag} 
                      variant="secondary" 
                      className="px-4 py-1.5 rounded-xl cursor-pointer hover:bg-primary/10 transition-all font-bold text-amber-700" 
                      onClick={() => { setSearch(tag); router.push(`/shop?q=${tag}`); onClose(); }}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Today's Recommendations */}
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest opacity-60 ml-1">今日推薦 (Recommendations)</p>
                <div className="space-y-2">
                  {localIndex.slice(0, 8).map(p => {
                    const bestPromo = findBestActivePromo(p, allPromos, allDbCategories);
                    const promoLabel = getPromoShortLabel(bestPromo, lang);

                    return (
                      <Link 
                        key={p.id} 
                        href={`/product/${p.slug || p.id}`} 
                        onClick={onClose} 
                        className="flex items-center gap-4 p-3 bg-white border rounded-2xl shadow-sm hover:border-primary/30 transition-all"
                      >
                        <div className="h-12 w-12 rounded-xl overflow-hidden bg-muted shrink-0">
                          {p.imageUrl ? <img src={p.imageUrl} className="object-cover h-full w-full" /> : <Package className="h-5 w-5 m-3.5 opacity-10" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm truncate">{lang === 'en' ? (p.productName_en || p.productName_zh) : p.productName_zh}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-[9px] text-muted-foreground font-black uppercase tracking-tighter">{p.brand}</p>
                            {promoLabel && (
                              <Badge className="bg-orange-600 text-white border-none h-4 px-1.5 font-black text-[8px] uppercase gap-1">
                                <Sparkles className="h-2.5 w-2.5 fill-current" /> {promoLabel}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-black text-orange-600">${p.salePrice || p.price}</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            /* Search Results */
            <div className="space-y-2">
              {results.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground italic text-xs border-2 border-dashed rounded-3xl">
                  找不到相關產品
                </div>
              ) : (
                results.map(p => {
                  const bestPromo = findBestActivePromo(p, allPromos, allDbCategories);
                  const promoLabel = getPromoShortLabel(bestPromo, lang);

                  return (
                    <Link key={p.id} href={`/product/${p.slug || p.id}`} onClick={onClose} className="flex items-center gap-4 p-3 bg-white border rounded-2xl shadow-sm">
                      <div className="h-12 w-12 rounded-xl overflow-hidden bg-muted shrink-0">
                        {p.imageUrl ? <img src={p.imageUrl} className="object-cover h-full w-full" /> : <Package className="h-5 w-5 m-3.5 opacity-10" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm truncate">{lang === 'en' ? (p.productName_en || p.productName_zh) : (p.productName_zh || p.productName_en)}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-[9px] text-muted-foreground font-black uppercase tracking-tighter">{p.brand}</p>
                          {promoLabel && (
                            <Badge className="bg-orange-600 text-white border-none h-4 px-1.5 font-black text-[8px] uppercase gap-1">
                              <Sparkles className="h-2.5 w-2.5 fill-current" /> {promoLabel}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black text-orange-600">${p.salePrice || p.price}</p>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          )}
        </div>
      </ScrollArea>
      {!showDefaults && (
        <div className="p-6 pb-safe border-t bg-white">
          <Button className="w-full h-12 rounded-xl font-black bg-primary" onClick={() => { if(search) { router.push(`/shop?q=${search}`); onClose(); } }}>
            {lang === 'en' ? 'Search All Results' : '搜尋全部結果'}
          </Button>
        </div>
      )}
    </div>
  );
}

function MobileCategoryContent({ onClose }: any) {
  const { lang } = useI18n();
  const router = useRouter();
  const db = useFirestore();
  const catsQuery = useMemo(() => db ? query(collection(db, 'categories'), where('isVisible', '==', true), orderBy('displayOrder', 'asc')) : null, [db]);
  const { data: cats, loading } = useCollection<any>(catsQuery);
  const getCatName = (cat: any) => lang === 'en' ? (cat.name_en || cat.name_zh) : (cat.name_zh || cat.name_en);

  if(loading) return <div className="p-20 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div>;

  return (
    <ScrollArea className="h-full bg-slate-50/50">
      <div className="p-6 space-y-6">
        {cats?.filter(c => !c.parentId || c.parentId === 'none').map(cat => (
          <div key={cat.id} className="space-y-3">
            <button className="text-xl font-black flex items-center justify-between w-full" onClick={() => { router.push(`/shop?category=${cat.id}`); onClose(); }}>{getCatName(cat)}<ChevronRight className="h-5 w-5 text-primary" /></button>
            <div className="grid grid-cols-2 gap-2">
              {cats.filter(sub => sub.parentId === cat.id).map(sub => (
                <Button key={sub.id} variant="ghost" className="justify-start h-10 bg-white border shadow-sm text-xs font-bold rounded-xl" onClick={() => { router.push(`/shop?category=${sub.id}`); onClose(); }}>{getCatName(sub)}</Button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
