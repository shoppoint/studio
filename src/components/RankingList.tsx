"use client";

import Link from "next/link";
import { ChevronRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import { findAllActivePromos, getPromoShortLabel, getPromoPriceLabel } from "@/lib/shop-utils";
import { QuickViewDialog } from "./QuickViewDialog";
import { useUser } from "@/firebase";
import { Badge } from "@/components/ui/badge";

interface RankingListProps {
  products: any[] | null;
  lang: string;
  allPromos?: any[] | null;
  allCategories?: any[] | null;
  allBrands?: any[] | null;
}

/**
 * 排行榜組件 (優化版：支援多優惠標籤與折實價顯示)
 */
export function RankingList({ products, lang, allPromos = null, allCategories = null, allBrands = null }: RankingListProps) {
  const { userData } = useUser();
  if (!products || products.length === 0) return null;
  const isEn = lang === 'en';

  return (
    <div className="grid grid-cols-1 gap-2 md:gap-2.5">
      {products.map((p, i) => {
        const pName = lang === 'en' ? (p.productName_en || p.productName_zh) : (p.productName_zh || p.productName_en);
        const currentPrice = p.salePrice > 0 ? p.salePrice : p.price;
        const stock = Number(p.onlineStock) || 0;
        const isDeniedOutOfStock = stock <= 0 && p.inventoryPolicy === 'Deny';
        
        const productPath = p.slug ? `/product/${p.slug}` : `/product/${p.id || p.productId}`;
        
        // 強化品牌在地化邏輯
        const rawBrandRaw = p.primaryBrand || p.brands || "";
        const firstBrand = String(rawBrandRaw).split(',')[0].trim();
        let brandDisplayName = firstBrand;

        if (isEn && allBrands) {
          const match = allBrands.find(b => 
            (b.name_zh && b.name_zh.trim().toLowerCase() === firstBrand.toLowerCase()) ||
            (b.name_en && b.name_en.trim().toLowerCase() === firstBrand.toLowerCase())
          );
          if (match) {
            brandDisplayName = match.name_en || firstBrand;
          }
        }

        // 計算適用促銷
        const activePromos = findAllActivePromos(p, allPromos, allCategories || [], userData);

        return (
          <div key={p.id || p.productId || i} className="relative group">
            <Link 
              href={productPath} 
              className={cn(
                "flex items-center gap-3 md:gap-4 p-2.5 md:p-3 bg-white border rounded-2xl transition-all group/card",
                isDeniedOutOfStock ? "opacity-70 bg-slate-50" : "hover:shadow-md"
              )}
            >
              {/* Ranking Number */}
              <div className={cn(
                "h-7 w-7 md:h-8 md:w-8 rounded-lg flex items-center justify-center font-black text-xs transition-colors shrink-0",
                isDeniedOutOfStock ? "bg-muted text-muted-foreground" : 
                i < 3 ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted group-hover/card:bg-primary/20 group-hover/card:text-primary"
              )}>
                {i + 1}
              </div>

              {/* Thumbnail */}
              <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl overflow-hidden shrink-0 border bg-muted relative shadow-inner">
                {p.imageUrl ? (
                  <img src={p.imageUrl} className={cn("object-cover h-full w-full", isDeniedOutOfStock && "grayscale")} alt="" />
                ) : (
                  <div className="h-full w-full bg-slate-100" />
                )}
              </div>

              {/* Product Info */}
              <div className="flex-1 min-w-0 pr-10">
                <div className="flex flex-col gap-0.5">
                  <p className="text-[8px] md:text-[9px] font-black text-amber-600 uppercase tracking-widest truncate">
                    {brandDisplayName || "SHOP POINT"}
                  </p>
                  <h4 className={cn("font-bold text-xs md:text-sm truncate leading-tight transition-colors", isDeniedOutOfStock ? "text-muted-foreground" : "group-hover/card:text-primary")}>
                    {pName}
                  </h4>
                  <div className="flex items-center flex-wrap gap-x-2 gap-y-1">
                    <p className={cn("font-black text-xs md:text-sm", isDeniedOutOfStock ? "text-slate-400" : "text-orange-600")}>
                      ${currentPrice}
                    </p>
                    
                    {!isDeniedOutOfStock && activePromos.length > 0 && (
                      <div className="flex items-center gap-1">
                        {activePromos.slice(0, 1).map((promo, pIdx) => (
                          <Badge key={pIdx} className="bg-orange-600 text-white border-none text-[8px] h-4 px-1.5 font-black uppercase flex items-center gap-1 animate-in fade-in shrink-0">
                            <Sparkles className="h-2 w-2 fill-current" />
                            {getPromoShortLabel(promo, lang)}
                          </Badge>
                        ))}
                        {getPromoPriceLabel(p, activePromos[0], lang) && (
                          <span className="text-[8px] font-black text-orange-600 bg-orange-50 px-1 py-0.5 rounded border border-orange-100 animate-in fade-in">
                            {getPromoPriceLabel(p, activePromos[0], lang)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground opacity-30 group-hover/card:opacity-100 group-hover/card:translate-x-1 transition-all" />
            </Link>
            
            <div className="absolute right-10 top-1/2 -translate-y-1/2">
              <QuickViewDialog 
                product={p} 
                buttonVariant="secondary" 
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}