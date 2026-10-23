
"use client";

export const dynamic = 'force-dynamic';

import { useMemo, useState, useEffect, useRef, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { 
  ChevronRight, 
  Calendar, 
  User, 
  ArrowLeft,
  Share2,
  Tag,
  Clock,
  Bookmark,
  FileText,
  Sparkles,
  ArrowRight,
  Zap,
  Ticket,
  Copy,
  ShoppingBag,
  CheckCircle2,
  Bell,
  AlertTriangle,
  Heart,
  MessageCircle,
  Loader2,
  Home,
  TrendingUp,
  Send,
  Trash2,
  Star,
  LayoutGrid,
  Search,
  Facebook,
  Instagram,
  Smartphone,
  XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n/i18n-context";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useUser, useAuth, useFirestore, useDoc, useCollection } from "@/firebase";
import { useCart } from "@/lib/cart-context";
import { 
  doc, 
  serverTimestamp, 
  getDocs, 
  collection, 
  query, 
  where, 
  limit, 
  orderBy,
  increment,
  runTransaction,
  onSnapshot,
  updateDoc,
  getDoc,
  addDoc,
  type Transaction 
} from "firebase/firestore";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { ProductCard } from "@/components/ProductCard";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { LoginDialog } from "@/components/auth/LoginDialog";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { findAllActivePromos, getPromoShortLabel, getPromoPriceLabel } from "@/lib/shop-utils";
import { trackViewItem } from "@/lib/analytics";

// 階段性組件導入
import { ProductMedia } from "@/components/product/ProductMedia";
import { ProductPurchaseActions } from "@/components/product/ProductPurchaseActions";
import { ProductDetailsTabs, AlcoholLegalNotice } from "@/components/product/ProductDetailsTabs";
import { ProductCarousels } from "@/components/product/ProductCarousels";

// Custom Branded SVGs
const XIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
  </svg>
);

const ThreadsIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10c2.11 0 4.076-.656 5.71-1.776l-1.173-1.635C15.222 19.516 13.684 20 12 20c-4.418 0-8-3.582-8-8s3.582-8 8-8 8 3.582 8 8v.5c0 1.105-.895 2-2 2s-2-.895-2-2v-3c0-1.105-.895-2-2-2s-2 .895-2 2v3.312c-.588-.813-1.534-1.312-2.583-1.312-1.933 0-3.5 1.567-3.5 3.5s1.567 3.5 3.5 3.5c1.049 0 1.995-.499 2.583-1.312.23.43.674.812 1.254.812 2.209 0 4-1.791 4-4v-.5c0-2.112-.832-4.161-2.344-5.719C16.161 6.84 14.112 6 12 6s-1.09 0-1.09 0zM12 16c-1.105 0-2-.895-2-2s.895-2 2-2 2 .895 2 2-.895 2-2 2z" />
  </svg>
);

function WhatsappIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.03 0C5.449 0 .081 5.377.077 11.967c0 2.105.547 4.16 1.587 6.006L0 24l6.149-1.613a11.83 11.83 0 005.874 1.552h.005c6.581 0 11.95-5.377 11.953-11.967a11.82 11.82 0 00-3.502-8.472" />
    </svg>
  );
}

/**
 * 產品詳情主容器
 */
function ProductDetailContent() {
  const params = useParams();
  const router = useRouter();
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const db = useFirestore();
  const { user, userData } = useUser();
  const { addItem } = useCart();
  
  const productIdOrSlug = params?.productId as string;

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [isNotifyLoading, setIsNotifyLoading] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  
  const [quantity, setQuantity] = useState(1);
  const [renderStage, setRenderStage] = useState(1);

  useEffect(() => {
    const timer2 = setTimeout(() => setRenderStage(2), 300);
    const timer3 = setTimeout(() => setRenderStage(3), 1200);
    return () => { clearTimeout(timer2); clearTimeout(timer3); };
  }, []);

  const isEn = lang === 'en';

  useEffect(() => {
    let isCancelled = false;
    const fetchProduct = async () => {
      if (!db || !productIdOrSlug) return;
      setLoading(true);
      let redirecting = false;
      try {
        const slugQuery = query(collection(db, 'public_products'), where('slug', '==', productIdOrSlug), limit(1));
        const slugSnap = await getDocs(slugQuery);
        let finalProduct: any = null;
        if (!slugSnap.empty) {
          const data = slugSnap.docs[0].data();
          finalProduct = { ...data, id: slugSnap.docs[0].id };
          if (!isCancelled) setProduct(finalProduct);
        } else {
          const idRef = doc(db, 'public_products', productIdOrSlug);
          const idSnap = await getDoc(idRef);
          if (idSnap.exists()) {
            const data = idSnap.data();
            if (data.slug && data.slug !== productIdOrSlug) {
              if (!isCancelled) {
                setIsRedirecting(true);
                router.replace(`/product/${data.slug}`);
              }
              return; 
            }
            finalProduct = { ...data, id: idSnap.id };
            if (!isCancelled) setProduct(finalProduct);
          } else { if (!isCancelled) setProduct(null); }
        }
        if (finalProduct && !isCancelled) {
          // 追蹤：瀏覽產品行為
          trackViewItem(finalProduct);

          const stored = localStorage.getItem('recently_viewed_ids');
          let currentList = [];
          if (stored) { try { currentList = JSON.parse(stored); if (!Array.isArray(currentList)) currentList = []; } catch (e) { currentList = []; } }
          const newList = [finalProduct.id, ...currentList.filter((id: string) => id !== finalProduct.id)].slice(0, 15);
          localStorage.setItem('recently_viewed_ids', JSON.stringify(newList));
        }
      } catch (e) { console.error("Product fetch error", e); } finally { if (!isCancelled && !isRedirecting) setLoading(false); }
    };
    fetchProduct();
    return () => { isCancelled = true; };
  }, [db, productIdOrSlug, router, isRedirecting]);

  const alertsQuery = useMemo(() => {
    if (!db || !product?.id || !user || user.isAnonymous || renderStage < 2) return null;
    return query(collection(db, 'stock_alerts'), where('productId', '==', product.id), where('status', '==', 'pending'));
  }, [db, product?.id, user, renderStage]);
  const { data: alerts } = useCollection<any>(alertsQuery);

  const totalDemandQty = useMemo(() => { if (!alerts) return 0; return alerts.reduce((acc, alert) => acc + (Number(alert.requestedQty) || 1), 0); }, [alerts]);
  const promosQuery = useMemo(() => (db && renderStage >= 2) ? query(collection(db, 'promotions'), where('status', '==', 'active')) : null, [db, renderStage]);
  const { data: allPromos } = useCollection<any>(promosQuery);
  const locationsQuery = useMemo(() => (db && renderStage >= 2) ? query(collection(db, 'locations'), where('status', '==', 'Active')) : null, [db, renderStage]);
  const { data: locations } = useCollection<any>(locationsQuery);
  const catsQuery = useMemo(() => (db && renderStage >= 2) ? query(collection(db, 'categories'), where('isVisible', '==', true)) : null, [db, renderStage]);
  const { data: allCategories } = useCollection<any>(catsQuery);
  const brandsQuery = useMemo(() => (db && renderStage >= 2) ? query(collection(db, 'brands')) : null, [db, renderStage]);
  const { data: allBrands } = useCollection<any>(brandsQuery);

  const breadcrumbPath = useMemo(() => {
    if (!product?.categories || !allCategories || product.categories.length === 0) return [];
    const mainCatId = Array.isArray(product.categories) ? product.categories[0] : product.categories;
    const path: any[] = [];
    let currentId = mainCatId;
    let safetyCounter = 0;
    while (currentId && currentId !== 'none' && safetyCounter < 10) {
      const cat = allCategories.find(c => c.id === currentId);
      if (cat) { path.unshift(cat); currentId = cat.parentId || null; } else { currentId = null; }
      safetyCounter++;
    }
    return path;
  }, [product?.categories, allCategories]);

  const productName = useMemo(() => { if (!product) return ""; return isEn ? (product.productName_en || product.productName_zh) : (product.productName_zh || product.productName_en); }, [product, isEn]);
  const productDesc = useMemo(() => { if (!product) return ""; return isEn ? (product.description_en || product.description_zh) : (product.description_zh || product.description_en); }, [product, isEn]);
  const images = useMemo(() => { if (!product) return []; const imgs = (product.images && Array.isArray(product.images)) ? product.images.map((img: any) => typeof img === 'string' ? img : img.url) : [product.imageUrl]; return imgs.filter((img: any) => typeof img === 'string' && img.trim() !== ""); }, [product]);
  
  // 核心修正：動態計算可售庫存 (嚴格排除過期批次)
  const sellableStock = useMemo(() => {
    const todayStr = format(new Date(), "yyyy-MM-dd");
    if (!product?.batches || !Array.isArray(product.batches)) return Number(product?.onlineStock) || 0;
    return product.batches
      .filter((b: any) => !b.expiryDate || b.expiryDate >= todayStr)
      .reduce((acc: number, b: any) => acc + (Number(b.quantity) || 0), 0);
  }, [product?.batches, product?.onlineStock]);

  const isOutOfStock = useMemo(() => sellableStock <= 0, [sellableStock]);
  const currentPrice = useMemo(() => { if (!product) return 0; return product.salePrice > 0 ? product.salePrice : product.price; }, [product]);

  const earliestExpiry = useMemo(() => {
    if (!product?.batches || !Array.isArray(product.batches)) return null;
    const todayStr = format(new Date(), "yyyy-MM-dd");
    const activeBatchesWithStock = product.batches.filter((b: any) => b.expiryDate && b.expiryDate >= todayStr && (Number(b.quantity) || 0) > 0 );
    if (activeBatchesWithStock.length === 0) return null;
    const sorted = [...activeBatchesWithStock].sort((a: any, b: any) => a.expiryDate.localeCompare(b.expiryDate));
    return sorted[0].expiryDate;
  }, [product]);

  const isLiquorProduct = useMemo(() => product?.spec?.legalTags?.includes("令人醺醉的酒類"), [product]);

  const handleNotifyMe = async (email: string, requestedQty: number) => {
    if (!db || !email || !product) return;
    setIsNotifyLoading(true);
    try {
      await addDoc(collection(db, 'stock_alerts'), { userId: user?.uid || null, email, customerName: userData?.displayName || email.split('@')[0], productId: product.id, productName, sku: product.sku || "", requestedQty: Number(requestedQty) || 1, status: 'pending', createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      toast({ title: t.product.notify_me_success });
    } catch (e: any) { toast({ title: t.common.error, description: e.message, variant: "destructive" }); } finally { setIsNotifyLoading(false); }
  };

  const handleAddToCart = () => {
    if (!product) return;
    addItem({ id: product.id || productIdOrSlug, name: productName, price: currentPrice, qty: quantity, image: images[0] || "", brand: product.primaryBrand || "", inventoryPolicy: product.inventoryPolicy || 'Deny', availableStock: sellableStock, categories: Array.isArray(product.categories) ? product.categories : [product.categories], slug: product.slug || "", preOrderExpectedDate: product.preOrderExpectedDate || "", collabBrands: product.collabBrands || [] });
  };

  const activePromos = useMemo(() => { if (renderStage < 2) return []; return findAllActivePromos(product, allPromos || [], allCategories || [], userData); }, [product, allPromos, allCategories, userData, renderStage]);
  const getCatName = (cat: any) => isEn ? (cat.name_en || cat.name_zh) : (cat.name_zh || cat.name_en);

  const localizedBrands = useMemo(() => {
    if (!product || renderStage < 2) return [];
    const brandsList: { id: string, name: string, isPrimary: boolean, href?: string }[] = [];
    const findBrandMatch = (rawName: string) => { if (!allBrands) return null; const cleanRaw = rawName.trim().toLowerCase(); return allBrands.find((b: any) => (b.name_zh && b.name_zh.trim().toLowerCase() === cleanRaw) || (b.name_en && b.name_en.trim().toLowerCase() === cleanRaw)); };
    if (product.primaryBrand) { const match = findBrandMatch(product.primaryBrand); brandsList.push({ id: 'primary', name: isEn ? (match?.name_en || product.primaryBrand) : product.primaryBrand, isPrimary: true, href: match ? `/brands/${match.slug || match.id}` : undefined }); }
    if (Array.isArray(product.collabBrands)) { product.collabBrands.forEach((b: string, i: number) => { if (b && b !== product.primaryBrand) { const match = findBrandMatch(b); brandsList.push({ id: `collab-${i}`, name: isEn ? (match?.name_en || b) : b, isPrimary: false, href: match ? `/brands/${match.slug || match.id}` : undefined }); } }); }
    return brandsList;
  }, [product, allBrands, isEn, renderStage]);

  // 結構化數據 (SEO 加固)
  const jsonLd = useMemo(() => {
    if (!product) return null;
    return {
      "@context": "https://schema.org/",
      "@type": "Product",
      "name": productName,
      "image": images[0] || "",
      "description": productDesc.replace(/<[^>]*>?/gm, '').substring(0, 160),
      "brand": { "@type": "Brand", "name": product.primaryBrand || "SHOP POINT" },
      "sku": product.sku || product.id,
      "offers": {
        "@type": "Offer",
        "url": `https://shoppoint.hk/product/${product.slug || product.id}`,
        "priceCurrency": "HKD",
        "price": currentPrice,
        "itemCondition": "https://schema.org/NewCondition",
        "availability": isOutOfStock ? "https://schema.org/OutOfStock" : "https://schema.org/InStock"
      }
    };
  }, [product, productName, images, productDesc, currentPrice, isOutOfStock]);

  if (loading || isRedirecting) return <div className="min-h-screen flex flex-col bg-background"><Navbar /><div className="flex-grow flex items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div><Footer /></div>;
  if (!product) return <div className="min-h-screen flex flex-col bg-background"><Navbar /><main className="flex-grow flex flex-col items-center justify-center p-6 text-center space-y-6"><XCircle className="h-16 w-16 text-muted-foreground/20" /><div className="space-y-2"><h2 className="text-2xl font-black">找不到產品資訊</h2></div><Button variant="outline" asChild className="rounded-xl font-bold px-8 h-12"><Link href="/shop">返回商店首頁</Link></Button></main><Footer /></div>;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />}
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="animate-in fade-in duration-700">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8 overflow-x-auto no-scrollbar whitespace-nowrap pb-2">
            <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1.5 shrink-0"><Home className="h-3.5 w-3.5" />{isEn ? 'Home' : '首頁'}</Link>
            <ChevronRight className="h-3.5 w-3.5 opacity-30 shrink-0" /><Link href="/shop" className="hover:text-primary transition-colors shrink-0">{t.nav.shop}</Link>
            {breadcrumbPath.map((cat) => (
              <Suspense key={cat.id} fallback={null}>
                <ChevronRight className="h-3.5 w-3.5 opacity-30 shrink-0" /><Link href={`/shop?category=${cat.id}`} className="hover:text-primary transition-colors shrink-0">{getCatName(cat)}</Link>
              </Suspense>
            ))}
            <ChevronRight className="h-3.5 w-3.5 opacity-30 shrink-0" /><span className="text-foreground font-bold truncate">{productName}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16">
            <div className="lg:hidden space-y-4 mb-2">
              <div className="flex flex-wrap gap-2">
                {localizedBrands.map((b) => (
                  <Link key={b.id} href={b.href || "#"} className={cn(!b.href && "pointer-events-none")}>
                    <Badge variant="outline" className={cn("rounded-full px-3 h-6 font-bold text-[10px] uppercase transition-all hover:scale-105", b.isPrimary ? "border-primary text-amber-600 shadow-sm" : "border-muted-foreground/20 text-muted-foreground")}>{b.name}</Badge>
                  </Link>
                ))}
              </div>
              <h1 className="text-3xl font-black font-headline leading-tight tracking-tighter">{productName}</h1>
              <div className="prose prose-neutral prose-sm max-w-none text-muted-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: productDesc }} />
            </div>

            <ProductMedia product={product} productName={productName} images={images} activeImage={activeImage} setActiveImage={setActiveImage} shareOptions={[]} />
            
            <div className="flex flex-col space-y-6">
              <div className="hidden lg:block space-y-4">
                <div className="flex flex-wrap gap-2">
                  {localizedBrands.map((b) => (
                    <Link key={b.id} href={b.href || "#"} className={cn(!b.href && "pointer-events-none")}>
                      <Badge variant="outline" className={cn("rounded-full px-3 h-6 font-bold text-[10px] uppercase transition-all hover:scale-105", b.isPrimary ? "border-primary text-amber-600 shadow-sm" : "border-muted-foreground/20 text-muted-foreground")}>{b.name}</Badge>
                    </Link>
                  ))}
                </div>
                <h1 className="text-3xl md:text-4xl font-black font-headline leading-tight tracking-tighter">{productName}</h1>
                <div className="prose prose-neutral prose-sm max-w-none text-muted-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: productDesc }} />
              </div>
              {isLiquorProduct && <AlcoholLegalNotice />}
              <ProductPurchaseActions product={product} productName={productName} lang={lang} t={t} currentPrice={currentPrice} subPrice={0} hasDiscount={product.salePrice > 0} isOutOfStock={isOutOfStock} locations={locations || []} addItem={handleAddToCart} user={user} onNotifyMe={handleNotifyMe} isNotifyLoading={isNotifyLoading} applicablePromos={activePromos} quantity={quantity} setQuantity={setQuantity} demandCount={totalDemandQty} earliestExpiry={earliestExpiry} sellableStock={sellableStock} />
            </div>
          </div>

          {renderStage >= 2 && <div className="mt-20 animate-in fade-in duration-700"><ProductDetailsTabs product={product} lang={lang} t={t} user={user} userData={userData} allBrands={allBrands} /></div>}
          {renderStage >= 3 && <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000"><ProductCarousels product={product} t={t} lang={lang} /></div>}
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function ProductDetailPage() {
  return (
    <Suspense fallback={<div className="h-[60vh] flex items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}>
      <ProductDetailContent />
    </Suspense>
  );
}
