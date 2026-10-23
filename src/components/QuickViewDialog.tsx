"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  Eye, 
  ShoppingBag, 
  Minus, 
  Plus, 
  CheckCircle2, 
  ArrowRight,
  Package,
  Sparkles,
  XCircle,
  Tag,
  Warehouse,
  Globe,
  Store,
  Calendar,
  Zap,
  Info,
  Loader2,
  Bell,
  AlertTriangle,
  ShoppingCart,
  MapPin,
  Mail,
  UserPlus,
  ChevronDown,
  ChevronUp,
  Flame,
  Clock,
  Truck,
  CalendarDays,
  Share2,
  Facebook,
  Instagram,
  Smartphone,
  MessageSquare,
  Copy,
  Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogTrigger 
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useI18n } from "@/lib/i18n/i18n-context";
import { useCart } from "@/lib/cart-context";
import { cn } from "@/lib/utils";
import { useUser, useAuth, useFirestore, useDoc, useCollection } from "@/firebase";
import { collection, query, where, doc, serverTimestamp, addDoc, getDoc, getDocs, limit } from "firebase/firestore";
import { findAllActivePromos, getPromoShortLabel, getPromoPriceLabel } from "@/lib/shop-utils";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoginDialog } from "@/components/auth/LoginDialog";
import { COUNTRY_NAME_MAP } from "@/lib/address-data";
import { format } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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

const LinktreeIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
    <path d="M21.32 9.5h-5.83V2.41L12 0 8.51 2.41V9.5H2.68v4.99h5.83v7.1h2.98V14.49h1.02v7.1h2.98V14.49h5.83V9.5z" />
  </svg>
);

interface QuickViewProps {
  product: any;
  buttonVariant?: "secondary" | "outline" | "ghost";
}

export function QuickViewDialog({ product: initialProduct, buttonVariant = "secondary" }: QuickViewProps) {
  const { t, lang } = useI18n();
  const { addItem } = useCart();
  const db = useFirestore();
  const { user, userData } = useUser();
  const { toast } = useToast();
  
  const [isOpen, setIsOpen] = useState(false);
  const [qty, setQty] = useState(1);
  const [isNotifyLoading, setIsNotifyLoading] = useState(false);
  const isEn = lang === 'en';
  const isRealUser = user && !user.isAnonymous;

  const productRef = useMemo(() => {
    if (!db || (!initialProduct?.id && !initialProduct?.productId)) return null;
    return doc(db, 'public_products', initialProduct.id || initialProduct.productId);
  }, [db, initialProduct]);

  const { data: liveProduct, loading: isLiveLoading } = useDoc<any>(productRef);

  const product = useMemo(() => liveProduct || initialProduct, [liveProduct, initialProduct]);

  const getStockForLocation = useCallback((locId: string) => {
    if (!product) return 0;
    if (Array.isArray(product.batches) && product.batches.length > 0) {
      return product.batches
        .filter((b: any) => b.locationId === locId)
        .reduce((sum: number, b: any) => sum + (Number(b.quantity) || 0), 0);
    }
    return (product.warehouseStock && product.warehouseStock[locId]) || 0;
  }, [product]);

  const earliestExpiry = useMemo(() => {
    if (!product?.batches || !Array.isArray(product.batches)) return null;
    const todayStr = format(new Date(), "yyyy-MM-dd");

    const activeBatchesWithStock = product.batches.filter((b: any) => 
      b.expiryDate && 
      b.expiryDate >= todayStr && 
      (Number(b.quantity) || 0) > 0 
    );

    if (activeBatchesWithStock.length === 0) return null;
    const sorted = [...activeBatchesWithStock].sort((a: any, b: any) => a.expiryDate.localeCompare(b.expiryDate));
    return sorted[0].expiryDate;
  }, [product]);

  const alertsQuery = useMemo(() => {
    if (!db || !product?.id || !isOpen || !user || user.isAnonymous) return null;
    return query(
      collection(db, 'stock_alerts'), 
      where('productId', '==', product.id),
      where('status', '==', 'pending')
    );
  }, [db, product?.id, isOpen, user]);
  const { data: alerts } = useCollection<any>(alertsQuery);

  const totalDemandQty = useMemo(() => {
    if (!alerts) return 0;
    return alerts.reduce((acc, alert) => acc + (Number(alert.requestedQty) || 1), 0);
  }, [alerts]);

  const productName = isEn ? (product.productName_en || product.productName_zh) : (product.productName_zh || product.productName_en);
  const productDesc = isEn ? (product.description_en || product.description_zh) : (product.description_zh || product.description_en);
  const currentPrice = product.salePrice > 0 ? product.salePrice : product.price;
  const hasDiscount = product.salePrice > 0 && product.price > product.salePrice;
  const validImage = typeof (product.imageUrl || product.image) === 'string';
  const stock = Number(product.onlineStock) || 0;
  
  const isDeniedOutOfStock = stock <= 0 && product.inventoryPolicy === 'Deny';
  const isPreOrder = product.inventoryPolicy === 'PreOrder';

  const promosQuery = useMemo(() => {
    if (!db || !isOpen) return null;
    return query(collection(db, 'promotions'), where('status', '==', 'active'));
  }, [db, isOpen]);
  const { data: allPromos } = useCollection<any>(promosQuery);

  const catsQuery = useMemo(() => {
    if (!db || !isOpen) return null;
    return query(collection(db, 'categories'), where('isVisible', '==', true));
  }, [db, isOpen]);
  const { data: allCategories } = useCollection<any>(catsQuery);

  const brandsQuery = useMemo(() => {
    if (!db || !isOpen) return null;
    return query(collection(db, 'brands'));
  }, [db, isOpen]);
  const { data: allBrands } = useCollection<any>(brandsQuery);

  const locationsQuery = useMemo(() => {
    if (!db || !isOpen) return null;
    return query(collection(db, 'locations'), where('status', '==', 'Active'));
  }, [db, isOpen]);
  const { data: locations } = useCollection<any>(locationsQuery);

  const activePromos = useMemo(() => {
    return findAllActivePromos(product, allPromos, allCategories || [], userData);
  }, [product, allPromos, allCategories, userData]);

  const localizedBrands = useMemo(() => {
    const brandsList: { id: string, name: string, isPrimary: boolean, href?: string }[] = [];
    const findBrandMatch = (rawName: string) => {
      const cleanRaw = rawName.trim().toLowerCase();
      return allBrands?.find(b => 
        (b.name_zh && b.name_zh.trim().toLowerCase() === cleanRaw) ||
        (b.name_en && b.name_en.trim().toLowerCase() === cleanRaw)
      );
    };
    if (product.primaryBrand) {
      const match = findBrandMatch(product.primaryBrand);
      brandsList.push({ id: 'primary', name: isEn ? (match?.name_en || product.primaryBrand) : product.primaryBrand, isPrimary: true, href: match ? `/brands/${match.slug || match.id}` : undefined });
    }
    if (Array.isArray(product.collabBrands)) {
      product.collabBrands.forEach((b: string, i: number) => {
        if (b && b !== product.primaryBrand) {
          const match = findBrandMatch(b);
          brandsList.push({ id: `collab-${i}`, name: isEn ? (match?.name_en || b) : b, isPrimary: false, href: match ? `/brands/${match.slug || match.id}` : undefined });
        }
      });
    }
    return brandsList;
  }, [product, allBrands, isEn]);

  useEffect(() => { setQty(1); }, [product.id]);

  const handleAdd = () => {
    if (isDeniedOutOfStock) return;
    addItem({ 
      id: product.id || initialProduct.id || initialProduct.productId, 
      name: productName, 
      price: currentPrice, 
      qty: qty, 
      image: (product.imageUrl || product.image) || "", 
      brand: product.primaryBrand || product.brands || "", 
      sku: product.sku || "", 
      inventoryPolicy: product.inventoryPolicy || 'Deny', 
      availableStock: stock, 
      categories: Array.isArray(product.categories) ? product.categories : (product.categories ? [product.categories] : []),
      slug: product.slug || "",
      preOrderExpectedDate: product.preOrderExpectedDate || "",
      collabBrands: product.collabBrands || []
    });
  };

  const handleNotifyMe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!db || !product || !isRealUser || !user?.email) return;
    setIsNotifyLoading(true);
    try {
      const cleanEmail = user.email.toLowerCase().trim();
      await addDoc(collection(db, 'stock_alerts'), { userId: user.uid, email: cleanEmail, customerName: userData?.displayName || cleanEmail.split('@')[0], productId: product.id, productName: productName, sku: product.sku || "", requestedQty: Number(qty) || 1, status: 'pending', createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
      toast({ title: isEn ? "Subscribed!" : "訂閱成功", description: t.product.notify_me_success });
    } catch (e: any) { toast({ title: t.common.error, description: e.message, variant: "destructive" }); } finally { setIsNotifyLoading(false); }
  };

  // 分享連結生成邏輯
  const handleCopyLink = () => {
    const baseUrl = typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}` : "";
    const productUrl = `${baseUrl}/product/${product.slug || product.id}`;
    navigator.clipboard.writeText(productUrl);
    toast({ title: isEn ? "Link Copied!" : "連結已複製" });
  };

  const getShareOptions = () => {
    const baseUrl = typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}` : "";
    const productUrl = `${baseUrl}/product/${product.slug || product.id}`;
    const text = isEn ? `Check out this product: ${productName}` : `我在 SHOP POINT 發現了這款好物：${productName}`;
    const encodedUrl = encodeURIComponent(productUrl);
    const encodedText = encodeURIComponent(text);

    return [
      { id: 'whatsapp', label: 'WhatsApp', icon: WhatsappIcon, color: 'bg-[#25D366]', link: `https://wa.me/?text=${encodedText}%20${encodedUrl}` },
      { id: 'facebook', label: 'Facebook', icon: Facebook, color: 'bg-[#1877F2]', link: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}` },
      { id: 'threads', label: 'Threads', icon: ThreadsIcon, color: 'bg-black', link: `https://www.threads.net/intent/post?text=${encodedText}%20${encodedUrl}` },
      { id: 'x', label: 'X', icon: XIcon, color: 'bg-black', link: `https://x.com/intent/tweet?text=${encodedText}&url=${encodedUrl}` },
      { id: 'telegram', label: 'Telegram', icon: Send, color: 'bg-[#0088cc]', link: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}` },
      { id: 'signal', label: 'Signal', icon: MessageSquare, color: 'bg-[#3a76f0]', link: `sgnl://send?text=${encodedText}%20${encodedUrl}` },
      { id: 'instagram', label: 'Instagram', icon: Instagram, color: 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600', onClick: handleCopyLink },
      { id: 'linktree', label: 'Linktree', icon: LinktreeIcon, color: 'bg-[#25D366]', onClick: handleCopyLink },
      { id: 'copy', label: isEn ? 'Copy' : '複製連結', icon: Copy, color: 'bg-slate-700', onClick: handleCopyLink },
    ];
  };

  return (
    <div className={cn("contents")}>
      <button className={cn("h-8 w-8 sm:h-9 sm:w-9 rounded-xl flex items-center justify-center transition-all border shadow-sm", buttonVariant === 'secondary' ? "bg-white/90 backdrop-blur-sm text-muted-foreground hover:text-primary" : "bg-muted/10 hover:bg-muted")} onClick={(e) => { e.stopPropagation(); setIsOpen(true); }}>
        <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
      </button>

      <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if(!open) setQty(1); }}>
        <DialogContent className="sm:max-w-[850px] p-0 overflow-hidden border-none rounded-[2rem] sm:rounded-[2.5rem] shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <ScrollArea className="max-h-[90vh]">
            <div className="grid grid-cols-1 md:grid-cols-2 h-full">
              <div className="relative aspect-square bg-muted">
                {(product.imageUrl || product.image) ? (
                  <Image src={product.imageUrl || product.image} alt={productName} fill className={cn("object-cover", (isDeniedOutOfStock || isLiveLoading) && "grayscale opacity-60")} />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground/30"><Package className="h-20 w-20" /></div>
                )}
                {isLiveLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-[2px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                )}
                {isDeniedOutOfStock && !isLiveLoading && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <div className="text-center space-y-2 animate-in zoom-in duration-300">
                      <Badge className="bg-white text-black border-none font-black px-6 py-2 rounded-full text-lg shadow-2xl">SOLD OUT</Badge>
                      <p className="text-white/80 text-[10px] font-bold uppercase tracking-widest">{isEn ? 'Restocking Soon' : '補貨中'}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 sm:p-10 space-y-6 flex flex-col justify-start bg-white">
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {localizedBrands.map((b) => (
                      <Link key={b.id} href={b.href || "#"} className={cn(!b.href && "pointer-events-none")}>
                        <Badge variant="outline" className={cn("rounded-full px-3 h-6 font-bold text-[10px] uppercase transition-all hover:scale-105", b.isPrimary ? "border-primary text-amber-600 shadow-sm" : "border-muted-foreground/20 text-muted-foreground")}>{b.name}</Badge>
                      </Link>
                    ))}
                    {isPreOrder && (
                      <Badge className="bg-indigo-600 text-white border-none font-black text-[10px] uppercase px-3 h-6 rounded-full flex items-center gap-1.5 shadow-sm">
                        <Zap className="h-3 w-3 fill-current animate-pulse" />
                        {isEn ? 'Pre-Order' : '限定預購'}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <DialogTitle className="text-2xl md:text-3xl font-black font-headline leading-tight tracking-tighter">{productName}</DialogTitle>
                    
                    {/* 快速查看分享按鈕 */}
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="h-10 w-10 rounded-full flex items-center justify-center hover:bg-primary/10 transition-colors shrink-0">
                          <Share2 className="h-5 w-5 text-primary" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent align="end" className="w-72 p-0 border-none shadow-2xl rounded-3xl overflow-hidden z-[250]">
                         <div className="bg-primary/10 px-6 py-3 border-b">
                           <h3 className="font-black text-[10px] uppercase tracking-widest text-primary flex items-center gap-2">
                             <Share2 className="h-3.5 w-3.5" /> Share Product
                           </h3>
                         </div>
                         <div className="p-3 grid grid-cols-4 gap-3 bg-white">
                           {getShareOptions().map((opt) => (
                             <div key={opt.id} className="flex flex-col items-center gap-1">
                               {opt.link ? (
                                 <a href={opt.link} target="_blank" rel="noreferrer" className={cn("h-10 w-10 rounded-xl flex items-center justify-center text-white shadow-sm transition-all hover:scale-110", opt.color)}>
                                   <opt.icon className="h-4 w-4" />
                                 </a>
                               ) : (
                                 <button onClick={opt.onClick} className={cn("h-10 w-10 rounded-xl flex items-center justify-center text-white shadow-sm transition-all hover:scale-110", opt.color)}>
                                   <opt.icon className="h-4 w-4" />
                                 </button>
                               )}
                               <span className="text-[8px] font-black uppercase text-muted-foreground truncate w-full text-center">{opt.label}</span>
                             </div>
                           ))}
                         </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="flex items-baseline gap-3">
                    <span className="text-4xl font-black text-orange-600 tracking-tighter">${currentPrice}</span>
                    {hasDiscount && <span className="text-lg font-bold line-through text-muted-foreground opacity-50">${product.price}</span>}
                  </div>
                  
                  {activePromos.length > 0 && !isDeniedOutOfStock && (
                    <div className="space-y-3 animate-in slide-in-from-left-4 duration-500">
                      <div className="flex flex-wrap gap-2">
                        {activePromos.map((promo, idx) => (
                          <div key={idx} className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <Badge className="bg-orange-600 text-white border-none font-black text-[10px] uppercase h-6 px-3 gap-1.5 shadow-sm">
                                <Sparkles className="h-3 w-3 fill-current" /> {getPromoShortLabel(promo, lang)}
                              </Badge>
                              {getPromoPriceLabel(product, promo, lang) && (
                                <span className="text-xs font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-100">
                                  {getPromoPriceLabel(product, promo, lang)}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {isPreOrder && (
                  <div className="p-4 bg-indigo-50 rounded-2xl border-2 border-indigo-100 grid grid-cols-2 gap-4">
                    {product.preOrderExpectedDate && (
                      <div className="space-y-0.5">
                        <p className="text-[8px] font-black text-indigo-400 uppercase">Expected Arrival</p>
                        <p className="text-xs font-black text-indigo-900">{product.preOrderExpectedDate}</p>
                      </div>
                    )}
                    <div className="flex items-center justify-end">
                      <Badge className="bg-indigo-600 text-white font-black text-[8px] h-5">PRE-ORDER</Badge>
                    </div>
                  </div>
                )}

                <Separator className="border-dashed" />

                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2"><Info className="h-3 w-3" /> {t.product.description}</h4>
                  <div className="text-sm text-muted-foreground leading-relaxed line-clamp-4 prose prose-sm" dangerouslySetInnerHTML={{ __html: productDesc }} />
                </div>

                <div className="p-4 bg-muted/20 rounded-2xl border border-dashed space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground font-bold"><Globe className="h-4 w-4 text-primary" /> {t.product.online_stock}</span>
                    <span className={cn("font-black", stock > 0 ? "text-green-600" : (isPreOrder ? "text-indigo-600" : "text-red-500"))}>
                      {stock > 0 ? `${stock} ${t.product.in_stock}` : (isPreOrder ? (isEn ? 'Pre-Order' : '預購') : t.product.out_of_stock)}
                    </span>
                  </div>

                  <Separator className="border-muted/30" />

                  <div className="space-y-2">
                    <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest px-1">分店即時庫存</p>
                    <div className="grid gap-1.5">
                      {locations?.filter((loc: any) => loc.status === 'Active' && loc.isVisible !== false).map((loc: any) => {
                        const stockQty = getStockForLocation(loc.id);
                        const locName = isEn ? (loc.name_en || loc.name_zh) : (loc.name_zh || loc.name_en);
                        return (
                          <div key={loc.id} className="flex items-center justify-between text-sm px-2 py-1 bg-white/50 rounded-lg">
                            <span className="flex items-center gap-2 text-muted-foreground text-[11px]">
                              {loc.type === 'physical' ? <Store className="h-3 w-3 text-primary" /> : <Warehouse className="h-3 w-3 text-primary" />}
                              {locName}
                            </span>
                            {stockQty > 0 ? (
                              <span className="text-green-600 font-bold flex items-center gap-1 text-[11px]"><CheckCircle2 className="h-3 w-3" /> {t.product.in_stock}</span>
                            ) : (
                              <span className="text-muted-foreground/40 font-bold flex items-center gap-1 text-[11px]"><XCircle className="h-3 w-3" /> {t.product.out_of_stock}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex flex-col gap-4">
                  <div className="flex items-center gap-4">
                    {!isDeniedOutOfStock ? (
                      <>
                        <div className="flex items-center border rounded-xl overflow-hidden h-11 bg-muted/30 shadow-inner">
                          <button className="px-4 hover:bg-muted transition-colors" onClick={() => setQty(q => Math.max(1, q - 1))} disabled={qty <= 1}><Minus className="h-4 w-4" /></button>
                          <span className="w-12 text-center font-black text-lg">{qty}</span>
                          <button 
                            className="px-4 hover:bg-muted transition-colors" 
                            onClick={() => {
                              const stockVal = Number(product.onlineStock) || 0;
                              if (product.inventoryPolicy === 'Deny' && qty >= stockVal) {
                                toast({ variant: "warning", title: isEn ? "Stock Limit" : "已達庫存上限" });
                                return;
                              }
                              setQty(q => q + 1);
                            }}
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        <button className="flex-1 h-12 bg-primary text-primary-foreground font-black rounded-xl shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2" onClick={handleAdd} disabled={isLiveLoading}>
                          <ShoppingCart className="h-5 w-5" /> {isLiveLoading ? "..." : (isPreOrder ? (isEn ? 'Pre-order' : '立即預購') : t.product.add_to_cart)}
                        </button>
                      </>
                    ) : isRealUser ? (
                      <button className="flex-1 h-12 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-xl shadow-lg gap-2" onClick={handleNotifyMe} disabled={isNotifyLoading || isLiveLoading}>
                        {isNotifyLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Bell className="h-5 w-5" />} {isEn ? 'Notify Me' : '到貨通知我'}
                      </button>
                    ) : (
                      <div className="flex-1"><LoginDialog trigger={<Button className="w-full h-12 bg-primary text-primary-foreground font-black rounded-xl shadow-lg gap-2"><UserPlus className="h-5 w-5" /> {isEn ? "Sign In to Notify" : "登入以訂閱通知"}</Button>} /></div>
                    )}
                  </div>
                  <Button variant="link" asChild className="text-xs font-black text-primary hover:underline h-auto p-0"><Link href={`/product/${product.slug || product.id}`} prefetch={false}>{t.product.view_details_reviews} <ArrowRight className="h-3 w-3 ml-1" /></Link></Button>
                </div>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
