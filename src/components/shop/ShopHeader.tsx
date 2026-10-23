
"use client";

import React from "react";
import { ShoppingBag, ArrowUpDown, SlidersHorizontal } from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ShopHeaderProps {
  count: number;
  sortBy: string;
  onSortChange: (val: string) => void;
  lang: string;
  t: any;
  onOpenFilters: () => void;
}

/**
 * 商店列表標題組件 (排序與統計中心)
 */
export function ShopHeader({ 
  count, sortBy, onSortChange, lang, t, onOpenFilters
}: ShopHeaderProps) {
  const isEn = lang === 'en';

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-3xl border shadow-sm px-6">
      {/* 產品總數統計 */}
      <div className="flex items-center gap-3 w-full sm:w-auto">
        <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
          <ShoppingBag className="h-5 w-5" />
        </div>
        <div className="space-y-0.5">
          <p className="font-black text-sm text-slate-900">
            {count} {isEn ? 'Items Found' : '件產品'}
          </p>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">Result Pool</p>
        </div>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto">
        {/* 手機端專用：顯現的篩選按鈕 */}
        <Button 
          variant="outline" 
          size="sm" 
          className="lg:hidden flex-1 h-10 rounded-xl font-bold gap-2 border-muted-foreground/10 bg-white"
          onClick={onOpenFilters}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          {t.common.filters}
        </Button>

        {/* 排序選單 - 在所有平台顯現 */}
        <div className="flex-1 sm:flex-none">
          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger className="h-10 w-full sm:w-48 rounded-xl border-muted-foreground/10 bg-muted/20 font-bold text-xs">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="h-3.5 w-3.5 text-primary" />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-xl border-none shadow-2xl z-[100]">
              <SelectItem value="newest" className="font-bold text-xs">{t.common.newest}</SelectItem>
              <SelectItem value="popular" className="font-bold text-xs">{t.common.popular}</SelectItem>
              <SelectItem value="price-low" className="font-bold text-xs">{t.common.price_low}</SelectItem>
              <SelectItem value="price-high" className="font-bold text-xs">{t.common.price_high}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
