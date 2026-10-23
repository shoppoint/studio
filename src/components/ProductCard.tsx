
"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  ShoppingBag, 
  Package,
  CheckCircle2,
  Zap,
  XCircle,
  Sparkles,
  Loader2,
  Bell,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useI18n } from "@/lib/i18n/i18n-context";
import { useCart } from "@/lib/cart-context";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { QuickViewDialog } from "./QuickViewDialog";
import { findAllActivePromos, getPromoShortLabel, getPromoPriceLabel } from "@/lib/shop-utils";
import { useUser } from "@/firebase";
import { ToastAction } from "@/components/ui/toast";
import { format } from "date-fns";

interface ProductCardProps {
  product: any;
  compact?: boolean;
  isClearance?: boolean;
  allPromos?: any[] | null;
  allCategories?: any[] | null;
  allBrands?: any[] | null;
}

export function ProductCard({ 
  product, 
  compact = false, 
  isClearance = false, 
  allPromos = null, 
  allCategories = null,
  allBrands = null
}: ProductCardProps) {
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const { addItem } = useCart();
  const { userData } = useUser();
  
  const productName = lang === 'en' ? (product.productName_en || product.productName_zh) : (product.productName_zh || product.productName_en);
  const currentPrice = product.salePrice > 0 ? product.salePrice : product.price;
  const hasDiscount = product.salePrice > 0 && product.price > product.salePrice;
  const discountPercent = hasDiscount ? Math.round((1 - product.salePrice / product.price) * 100) : 0;
  
  const imageUrl = product.imageUrl || product.image;
  const validImage = typeof imageUrl === 'string' && imageUrl.trim() !== "";
  
  // 核心修正：效期動態求和
  const sellableStock = useMemo(() => {
    const todayStr = format(new Date(), "yyyy-MM-dd");
    if (!product.batches || !Array.isArray(product.batches)) return Number(product.onlineStock) || 0;
    
    // 只計算未過期的數量
    return product.batches
      .filter((b: any) => !b.expiryDate || b.expiryDate >= todayStr)
      .reduce((acc: number, b: any) => acc + (Number(b.quantity) || 0), 0);
  }, [product.batches, product.onlineStock]);

  const isDeniedOutOfStock = sellableStock <= 0 && product.inventoryPolicy === 'Deny';

  const brandDisplayName = useMemo(() => {
    const rawBrand = product.primaryBrand || product.brands || "";
    if (lang === 'en' && allBrands) {
      const match = allBrands.find(b => 
        (b.name_zh && b.name_zh.trim().toLowerCase() === rawBrand.trim().toLowerCase()) ||
        (b.name_en && b.name_en.trim().toLowerCase() === rawBrand.trim().toLowerCase())
      );
      return match?.name_en || rawBrand || "SHOP POINT";
    }
    return rawBrand || "SHOP POINT";
  }, [product, allBrands, lang]);

  const activePromos = useMemo(() => {
    return findAllActivePromos(product, allPromos, allCategories || [], userData);
  }, [product, allPromos, allCategories, userData]);

  const productPath = product.slug ? `/product/${product.slug}` : `/product/${product.id || product.productId}`;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isDeniedOutOfStock) {
      toast({ 
        title: lang === 'en' ? "Out of Stock" : "暫無存貨", 
        description: lang === 'en' ? "Item is out of stock." : "此產品目前缺貨，您可以訂閱到貨通知。",
        variant: "warning",
        action: (
          <ToastAction altText="Notify Me" asChild>
            <Link href={productPath}>{lang === 'en' ? 'Notify Me' : '到貨通知'}</Link>
          </ToastAction>
        )
      });
      return;
    }

    addItem({
      id: product.id || product.productId,
      name: productName,
      price: currentPrice,
      qty: 1,
      image: validImage ? imageUrl : "",
      brand: product.primaryBrand || product.brands || "",
      sku: product.sku || "",
      slug: product.slug || "",
      inventoryPolicy: product.inventoryPolicy || 'Deny',
      availableStock: sellableStock,
      categories: Array.isArray(product.categories) ? product.categories : (product.categories ? [product.categories] : []),
      preOrderExpectedDate: product.preOrderExpectedDate || "",
      collabBrands: product.collabBrands || []
    });
  };

  return (
    <Card className={cn(
      "flex flex-col h-full overflow-hidden transition-all duration-300 bg-white border-none shadow-sm group hover:shadow-xl cursor-default rounded-[1.25rem] sm:rounded-[2.5rem]",
      compact ? "p-0" : "",
      isDeniedOutOfStock && "opacity-80"
    )}>
      <div className="relative aspect-square overflow-hidden bg-muted block group/img">
        <Link href={productPath} className="absolute inset-0 z-10">
          <span className="sr-only">View Product</span>
        </Link>
        
        {validImage ? (
          <Image 
            src={imageUrl} 
            alt={productName} 
            fill 
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            className={cn("object-cover transition-transform duration-500 group-hover/img:scale-110", isDeniedOutOfStock && "grayscale opacity-60")} 
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground/30"><Package className="h-8 w-8 sm:h-12 w-12" /></div>
        )}

        <div className={cn(
          "absolute inset-x-2 bottom-2 flex transition-all translate-y-4 opacity-0 group-hover/img:opacity-100 group-hover/img:translate-y-0 duration-300 z-20",
          compact ? "gap-1" : "gap-2"
        )}>
          <QuickViewDialog product={product} buttonVariant="secondary" />
          <Button 
            className={cn(
              "flex-1 gap-1 font-black shadow-md rounded-xl active:scale-95 transition-all shrink-0", 
              compact ? "h-8 px-1" : "h-9 gap-2",
              isDeniedOutOfStock ? "bg-orange-600 hover:bg-orange-700 text-white shadow-lg" : (isClearance ? "bg-orange-600 hover:bg-orange-700 text-white" : "bg-primary text-primary-foreground")
            )} 
            onClick={handleAdd}
          >
            {isDeniedOutOfStock ? <Bell className="h-3.5 w-3.5" /> : <ShoppingBag className="h-3.5 w-3.5" />}
            <span className={cn("text-[10px] sm:text-xs", compact ? "hidden sm:inline" : "inline")}>
              {isDeniedOutOfStock ? (lang === 'en' ? 'Notify' : '通知我') : (lang === 'en' ? 'Add' : '加入')}
            </span>
          </Button>
        </div>
      </div>

      <CardContent className={cn("flex flex-col justify-between flex-1", compact ? "p-3" : "p-4 sm:p-6")}>
        <div className="space-y-1">
          <div className={cn("text-[9px] sm:text-[10px] font-black text-amber-600 uppercase tracking-widest truncate mb-0.5 min-h-[14px]", isDeniedOutOfStock && "opacity-50")}>
            {brandDisplayName}
          </div>
          <Link href={productPath}>
            <h3 className={cn("font-bold transition-colors line-clamp-2 leading-tight", compact ? "text-[12px] h-9" : "text-sm sm:text-base h-12", isDeniedOutOfStock ? "text-muted-foreground" : "hover:text-primary")}>{productName}</h3>
          </Link>
        </div>
        
        <div className="pt-2 flex flex-col gap-2">
          <div className="flex items-baseline gap-1.5 min-h-[28px]">
            <span className={cn("font-black tracking-tighter", compact ? "text-lg" : "text-xl sm:text-2xl", isDeniedOutOfStock ? "text-slate-400" : "text-orange-600")}>${currentPrice}</span>
          </div>
          <div className="min-h-[24px]">
            {!isDeniedOutOfStock && activePromos.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 animate-in fade-in duration-500">
                {activePromos.slice(0, 1).map((promo, idx) => (
                  <Badge key={idx} variant="outline" className="px-1.5 h-5 bg-orange-600 text-white border-none font-black text-[8px] uppercase">
                    {getPromoShortLabel(promo, lang)}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ProductCardSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <Card className={cn(
      "flex flex-col h-full overflow-hidden bg-white border-none shadow-sm rounded-[1.25rem] sm:rounded-[2.5rem]",
      compact ? "p-0" : ""
    )}>
      <Skeleton className="aspect-square w-full" />
      <div className={cn("p-4 sm:p-6 space-y-4", compact ? "p-3" : "")}>
        <div className="space-y-2">
          <Skeleton className="h-3 w-1/4" />
          <Skeleton className="h-4 w-full" />
        </div>
        <div className="flex justify-between items-center pt-2">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-8 w-1/4 rounded-xl" />
        </div>
      </div>
    </Card>
  );
}
