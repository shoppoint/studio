"use client";

import React, { useMemo, useCallback } from "react";
import { Search, Filter, Package, Gift, Loader2, Sparkles, XCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { findBestActivePromo, getPromoShortLabel } from "@/lib/shop-utils";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface ProductExplorerProps {
  products: any[] | null;
  categories: any[] | null;
  loading: boolean;
  searchQuery: string;
  onSearchChange: (val: string) => void;
  selectedCategoryId: string;
  onCategoryChange: (val: string) => void;
  onAddToCart: (product: any, isGift?: boolean) => void;
  lang: string;
  allPromos?: any[] | null;
  currentLocationId: string;
}

/**
 * 產品瀏覽器：負責搜尋、分類過濾與產品卡片渲染 (POS 專用優化版)
 * 優化：將 Loader 替換為骨架屏 (Skeleton) 以提升體驗感。
 */
export function ProductExplorer({
  products,
  categories,
  loading,
  searchQuery,
  onSearchChange,
  selectedCategoryId,
  onCategoryChange,
  onAddToCart,
  lang,
  allPromos = null,
  currentLocationId
}: ProductExplorerProps) {
  
  /**
   * 構建用於下拉選單的分層扁平列表
   */
  const categoryOptions = useMemo(() => {
    if (!categories) return [];
    
    const buildFlatTree = (list: any[], parentId: string | null = "none", depth = 0): any[] => {
      let results: any[] = [];
      const children = list.filter(c => (c.parentId || "none") === parentId);
      
      children.forEach(child => {
        results.push({ ...child, depth });
        results = [...results, ...buildFlatTree(list, child.id, depth + 1)];
      });
      
      return results;
    };

    return buildFlatTree(categories);
  }, [categories]);

  /**
   * 核心：計算特定地點的庫存
   */
  const getLocalStock = useCallback((p: any) => {
    if (!p || !currentLocationId) return 0;
    if (Array.isArray(p.batches) && p.batches.length > 0) {
      return p.batches
        .filter((b: any) => b.locationId === currentLocationId)
        .reduce((sum: number, b: any) => sum + (Number(b.quantity) || 0), 0);
    }
    return Number(p.warehouseStock?.[currentLocationId] || 0);
  }, [currentLocationId]);

  /**
   * 核心過濾邏輯
   */
  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter(p => {
      const search = searchQuery.toLowerCase().trim();
      const name = ((p.productName_zh || "") + (p.productName_en || "")).toLowerCase();
      const sku = (p.sku || "").toLowerCase();
      const barcode = (p.barcode || "").toLowerCase();
      const brand = ((p.brands || "") + (p.primaryBrand || "")).toLowerCase();
      const keywords = (p.searchIndex || "").toLowerCase();
      
      const matchesSearch = !search || 
        name.includes(search) || 
        sku.includes(search) || 
        barcode.includes(search) ||
        brand.includes(search) ||
        keywords.includes(search);
        
      const pCats = Array.isArray(p.categories) ? p.categories : (p.categories ? [p.categories] : []);
      const matchesCategory = selectedCategoryId === "all" || pCats.includes(selectedCategoryId);
      
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategoryId]);

  /**
   * 掃描器優化：處理 Enter 鍵 (通常是條碼掃描器觸發)
   */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && filteredProducts.length === 1) {
      const p = filteredProducts[0];
      const stock = getLocalStock(p);
      // 只有在有庫存或允許超賣時才自動加入
      if (p.inventoryPolicy === 'Allow' || stock > 0) {
        onAddToCart(p);
        onSearchChange(""); // 加入後清空，準備下一掃
        e.preventDefault();
      }
    }
  };

  const getCatName = (cat: any) => lang === 'en' ? (cat.name_en || cat.name_zh) : (cat.name_zh || cat.name_en);

  return (
    <div className="flex-1 flex flex-col gap-6 overflow-hidden">
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-4 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="掃描 Barcode 或輸入關鍵字..." 
            className="pl-10 h-14 bg-white border-none shadow-sm rounded-2xl text-lg font-bold" 
            value={searchQuery} 
            onChange={(e) => onSearchChange(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
          />
        </div>
        <Select value={selectedCategoryId} onValueChange={onCategoryChange}>
          <SelectTrigger className="h-14 w-64 bg-white border-none shadow-sm rounded-2xl font-bold">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-primary" />
              <SelectValue placeholder="所有分類" />
            </div>
          </SelectTrigger>
          <SelectContent className="rounded-2xl border-none shadow-2xl max-h-[500px]">
            <SelectItem value="all" className="font-black text-primary">所有產品類別</SelectItem>
            <Separator className="my-1" />
            {categoryOptions.map(cat => (
              <SelectItem key={cat.id} value={cat.id}>
                <span className="flex items-center gap-1">
                  {Array(cat.depth).fill("—").join("")}
                  {cat.depth > 0 && " "}
                  {getCatName(cat)}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ScrollArea className="flex-1">
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 pr-4 pb-12">
          {loading ? (
            Array.from({ length: 15 }).map((_, i) => (
              <Card key={i} className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-white animate-pulse">
                <div className="aspect-square bg-muted" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-2 bg-muted rounded w-1/2" />
                  <div className="flex justify-between items-center mt-3">
                    <div className="h-6 bg-muted rounded w-1/3" />
                    <div className="h-4 bg-muted rounded w-1/4" />
                  </div>
                </div>
              </Card>
            ))
          ) : filteredProducts.length === 0 ? (
            <div className="col-span-full py-20 text-center text-muted-foreground italic">
              沒有找到相符的產品。
            </div>
          ) : (
            filteredProducts.map(product => {
              const localStock = getLocalStock(product);
              const isOut = localStock <= 0 && product.inventoryPolicy === 'Deny';
              const bestPromo = findBestActivePromo(product, allPromos, categories);
              const promoLabel = getPromoShortLabel(bestPromo, lang);

              return (
                <Card 
                  key={product.id} 
                  className={cn(
                    "group border-none shadow-sm hover:shadow-xl transition-all cursor-pointer bg-white overflow-hidden rounded-[2rem] relative",
                    isOut && "opacity-60 grayscale-[0.8]"
                  )}
                  onClick={() => onAddToCart(product)}
                >
                  <div className="aspect-square bg-muted relative overflow-hidden">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} className="object-cover h-full w-full group-hover:scale-110 transition-transform duration-500" alt="" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground/20">
                        <Package className="h-10 w-10" />
                      </div>
                    )}
                    
                    {isOut && (
                      <div className="absolute inset-0 z-10 bg-black/40 flex items-center justify-center">
                        <div className="text-center animate-in zoom-in duration-300">
                          <Badge className="bg-white text-black border-none font-black px-4 py-1.5 rounded-full text-xs shadow-2xl">SOLD OUT</Badge>
                        </div>
                      </div>
                    )}

                    <Button 
                      variant="secondary" 
                      size="icon" 
                      className="absolute top-2 right-2 h-9 w-9 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 shadow-lg text-primary z-20"
                      onClick={(e) => { e.stopPropagation(); onAddToCart(product, true); }}
                    >
                      <Gift className="h-4 w-4" />
                    </Button>
                    
                    {promoLabel && !isOut && (
                      <div className="absolute bottom-2 left-2 z-10 animate-in zoom-in">
                        <Badge className="bg-orange-600 text-white border-none font-black text-[8px] px-2 h-5 flex items-center gap-1 uppercase shadow-md">
                          <Sparkles className="h-2.5 w-2.5 fill-current" /> {promoLabel}
                        </Badge>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h4 className={cn("font-bold text-sm truncate leading-tight", isOut && "text-muted-foreground")}>
                      {product.productName_zh || product.productName_en}
                    </h4>
                    <p className="text-[10px] text-muted-foreground font-mono truncate">{product.sku}</p>
                    <div className="flex items-center justify-between mt-1.5">
                      <p className={cn("font-black text-xl", isOut ? "text-slate-400" : "text-primary")}>
                        ${product.salePrice > 0 ? product.salePrice : product.price}
                      </p>
                      {isOut ? (
                        <span className="text-[9px] font-black text-red-500 uppercase flex items-center gap-1">
                          <XCircle className="h-3 w-3" /> Out
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold text-green-600">Stock: {localStock}</span>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
