
"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Filter, Search, X, Globe, Tags, MapPin } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { COUNTRY_NAME_MAP } from "@/lib/address-data";

interface ShopFilterContentProps {
  categories: any[];
  selectedCategories: string[];
  onToggleCategory: (id: string) => void;
  availableOrigins: string[];
  selectedOrigins: string[];
  onToggleOrigin: (id: string) => void;
  priceRange: number[];
  onPriceRangeChange: (val: number[]) => void;
  searchQuery: string;
  lang: string;
  t: any;
  onReset: () => void;
}

export function ShopFilterContent({
  categories,
  selectedCategories,
  onToggleCategory,
  availableOrigins,
  selectedOrigins,
  onToggleOrigin,
  priceRange,
  onPriceRangeChange,
  searchQuery,
  lang,
  t,
  onReset
}: ShopFilterContentProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [localSearch, setLocalSearch] = useState(searchQuery);
  const isZh = lang === 'zh-HK';

  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== searchQuery) {
        const params = new URLSearchParams(window.location.search);
        if (localSearch.trim()) {
          params.set('q', localSearch.trim());
        } else {
          params.delete('q');
        }
        router.push(`${pathname}?${params.toString()}`);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [localSearch, searchQuery, router, pathname]);

  const hasActiveFilters = searchQuery || 
    priceRange[0] !== 0 || 
    priceRange[1] !== 10000 || 
    selectedCategories.length > 0 || 
    selectedOrigins.length > 0;

  const getCatName = (cat: any) => isZh ? (cat.name_zh || cat.name_en) : (cat.name_en || cat.name_zh);
  const getOriginName = (origin: string) => isZh ? (COUNTRY_NAME_MAP[origin] || origin) : origin;

  return (
    <div className="space-y-8">
      {/* Header with Clear All */}
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-primary">
          <Filter className="h-4 w-4" />{t.common.filters}
        </h3>
        {hasActiveFilters && (
          <button onClick={onReset} className="text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors underline decoration-primary/30">
            {t.common.clear_all}
          </button>
        )}
      </div>

      {/* 1. Keyword Search */}
      <div className="space-y-3">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
          {lang === 'en' ? "Search in Results" : "在結果中搜尋"}
        </h4>
        <div className="relative group">
          <Search className="absolute left-3 top-3 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input 
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder={lang === 'en' ? "Name, brand, SKU..." : "產品、品牌、編碼..."}
            className="pl-9 h-10 bg-muted/20 border-none rounded-xl text-xs font-bold focus-visible:ring-primary/30"
          />
          {localSearch && (
            <button 
              onClick={() => setLocalSearch("")}
              className="absolute right-2 top-2.5 p-1 text-muted-foreground hover:text-primary"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      
      <Separator className="border-dashed" />

      {/* 2. Origin Filter (Now at Position 2 as requested) */}
      {availableOrigins.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 text-primary" /> {isZh ? '產地篩選' : 'Country of Origin'}
          </h4>
          <ScrollArea className="h-40 pr-4">
            <div className="space-y-2">
              {availableOrigins.map(origin => (
                <div key={origin} className="flex items-center space-x-2 group">
                  <Checkbox 
                    id={`filter-origin-${origin}`} 
                    checked={selectedOrigins.includes(origin)}
                    onCheckedChange={() => onToggleOrigin(origin)}
                    className="rounded-md"
                  />
                  <Label 
                    htmlFor={`filter-origin-${origin}`} 
                    className="text-xs font-bold text-slate-700 cursor-pointer group-hover:text-primary transition-colors flex-1"
                  >
                    {getOriginName(origin)}
                  </Label>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      <Separator className="border-dashed" />

      {/* 3. Categories Filter (Position 3) */}
      {categories.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
            <Tags className="h-3.5 w-3.5 text-primary" /> {t.nav.categories}
          </h4>
          <ScrollArea className="h-56 pr-4">
            <div className="space-y-2">
              {categories.filter(c => !c.parentId || c.parentId === 'none').map(cat => (
                <div key={cat.id} className="flex items-center space-x-2 group">
                  <Checkbox 
                    id={`filter-cat-${cat.id}`} 
                    checked={selectedCategories.includes(cat.id)}
                    onCheckedChange={() => onToggleCategory(cat.id)}
                    className="rounded-md"
                  />
                  <Label 
                    htmlFor={`filter-cat-${cat.id}`} 
                    className="text-xs font-bold text-slate-700 cursor-pointer group-hover:text-primary transition-colors flex-1"
                  >
                    {getCatName(cat)}
                  </Label>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      <Separator className="border-dashed" />

      {/* 4. Price Range */}
      <div className="space-y-4">
        <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
          {lang === 'en' ? "Price Range" : "價格範圍"}
        </h4>
        <Slider max={10000} step={100} value={priceRange} onValueChange={onPriceRangeChange} />
        <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase">
          <span>$0</span>
          <span>$10,000+</span>
        </div>
        <p className="text-[10px] text-center font-black text-primary bg-primary/5 py-2 rounded-lg border border-primary/10">
          ${priceRange[0]} — ${priceRange[1]}
        </p>
      </div>
    </div>
  );
}
