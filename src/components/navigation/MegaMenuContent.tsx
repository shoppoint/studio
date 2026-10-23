"use client";

import React from "react";
import Link from "next/link";
import { 
  ChevronRight, 
  ArrowRight,
  Award,
  Smartphone,
  Shirt,
  Home as HomeIcon,
  Sparkles as BeautyIcon,
  Coffee,
  Package,
  Baby,
  Dumbbell,
  Stethoscope
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const CATEGORY_STYLE_MAP: Record<string, { icon: any, color: string }> = {
  "electronics": { icon: Smartphone, color: "text-blue-600 bg-blue-50" },
  "電子": { icon: Smartphone, color: "text-blue-600 bg-blue-50" },
  "fashion": { icon: Shirt, color: "text-pink-600 bg-pink-50" },
  "時裝": { icon: Shirt, color: "text-pink-600 bg-pink-50" },
  "時尚": { icon: Shirt, color: "text-pink-600 bg-pink-50" },
  "home": { icon: HomeIcon, color: "text-orange-600 bg-orange-50" },
  "家居": { icon: HomeIcon, color: "text-orange-600 bg-orange-50" },
  "beauty": { icon: BeautyIcon, color: "text-purple-600 bg-purple-50" },
  "美容": { icon: BeautyIcon, color: "text-purple-600 bg-purple-50" },
  "food": { icon: Coffee, color: "text-green-600 bg-green-50" },
  "食品": { icon: Coffee, color: "text-green-600 bg-green-50" },
  "grocery": { icon: Coffee, color: "text-green-600 bg-green-50" },
  "baby": { icon: Baby, color: "text-cyan-600 bg-cyan-50" },
  "母嬰": { icon: Baby, color: "text-cyan-600 bg-cyan-50" },
  "sports": { icon: Dumbbell, color: "text-red-600 bg-red-50" },
  "運動": { icon: Dumbbell, color: "text-red-600 bg-red-50" },
  "health": { icon: Stethoscope, color: "text-teal-600 bg-teal-50" },
  "健康": { icon: Stethoscope, color: "text-teal-600 bg-teal-50" },
};

interface MegaMenuContentProps {
  categoryTree: any[];
  activeCategoryId: string | null;
  setActiveCategoryId: (id: string) => void;
  onCategoryClick: (idOrSlug: string) => void;
  lang: string;
  t: any;
}

export function MegaMenuContent({
  categoryTree,
  activeCategoryId,
  setActiveCategoryId,
  onCategoryClick,
  lang,
  t
}: MegaMenuContentProps) {
  const activeCategory = categoryTree.find(c => c.id === activeCategoryId) || categoryTree[0];
  const isEn = lang === 'en';
  
  const getCatName = (cat: any) => lang === 'en' ? (cat.name_en || cat.name_zh) : (cat.name_zh || cat.name_en);
  
  const getStyle = (name: string) => {
    const key = Object.keys(CATEGORY_STYLE_MAP).find(k => name.toLowerCase().includes(k.toLowerCase()));
    return key ? CATEGORY_STYLE_MAP[key] : { icon: Package, color: "text-slate-600 bg-slate-50" };
  };

  return (
    <div className="flex h-[550px]">
      {/* Level 1: Left Sidebar */}
      <aside className="w-[260px] bg-muted/20 border-r py-6">
        <ScrollArea className="h-full px-3">
          <div className="space-y-1">
            {categoryTree.map((category) => {
              const style = getStyle(category.name_zh || category.name_en || "");
              const isActive = activeCategoryId === category.id;
              return (
                <button
                  key={category.id}
                  onMouseEnter={() => setActiveCategoryId(category.id)}
                  onClick={() => onCategoryClick(category.slug || category.id)}
                  className={cn(
                    "w-full flex items-center justify-between p-3 rounded-2xl transition-all duration-200 group",
                    isActive ? "bg-white shadow-md scale-[1.02] ring-1 ring-primary/10" : "hover:bg-white/60 text-muted-foreground"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn("h-8 w-8 rounded-xl flex items-center justify-center transition-all", isActive ? style.color : "bg-muted/50")}>
                      <style.icon className="h-4 w-4" />
                    </div>
                    <span className={cn("text-[13px] font-black transition-colors", isActive ? "text-primary" : "group-hover:text-foreground")}>
                      {getCatName(category)}
                    </span>
                  </div>
                  <ChevronRight className={cn("h-4 w-4 transition-all", isActive ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2")} />
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </aside>

      {/* Level 2 & 3: Main Content */}
      <main className="flex-1 bg-white p-10 flex flex-col">
        <div className="flex items-center justify-between mb-10">
          <div className="space-y-1">
            <h2 className="text-3xl font-black font-headline tracking-tighter flex items-center gap-3">
              {activeCategory && getCatName(activeCategory)}
            </h2>
            <p className="text-sm text-muted-foreground font-medium">
              {isEn ? "Explore all featured items and multi-level categories" : "探索所有精選商品及多層級子分類"}
            </p>
          </div>
          <Button asChild variant="outline" className="rounded-full font-bold border-primary text-primary px-6" onClick={() => onCategoryClick(activeCategory?.slug || activeCategory?.id)}>
            <Link href={`/shop?category=${activeCategory?.slug || activeCategory?.id}`} prefetch={false}>
              {t.sections.view_all} <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>

        <ScrollArea className="flex-1">
          {/* 三層分類佈局：Level 2 為標題，Level 3 為下方清單 */}
          <div className="grid grid-cols-3 gap-y-12 gap-x-8 pr-6">
            {activeCategory?.children?.map((child: any) => (
              <div key={child.id} className="space-y-5 animate-in fade-in slide-in-from-left-2">
                {/* Level 2 Title */}
                <Link 
                  href={`/shop?category=${child.slug || child.id}`} 
                  onClick={() => onCategoryClick(child.slug || child.id)}
                  prefetch={false}
                  className="text-sm font-black uppercase tracking-widest text-primary border-b-2 border-primary/20 pb-1.5 inline-block hover:border-primary transition-colors"
                >
                  {getCatName(child)}
                </Link>

                {/* Level 3 List */}
                <ul className="space-y-2.5">
                  {child.children && child.children.length > 0 ? (
                    child.children.map((sub: any) => (
                      <li key={sub.id}>
                        <Link 
                          href={`/shop?category=${sub.slug || sub.id}`} 
                          onClick={() => onCategoryClick(sub.slug || sub.id)}
                          prefetch={false}
                          className="text-sm text-slate-700 hover:text-primary hover:translate-x-1 transition-all flex items-center group/item font-medium"
                        >
                          <ChevronRight className="h-3 w-3 opacity-0 -ml-4 group-hover/item:opacity-100 group-hover/item:ml-0 transition-all mr-1 text-primary" />
                          {getCatName(sub)}
                        </Link>
                      </li>
                    ))
                  ) : (
                    <li className="text-[11px] text-muted-foreground/50 italic font-medium">
                      {isEn ? "No sub-categories" : "暫無更細分分類"}
                    </li>
                  )}
                  {/* 查看全部 Level 2 連結 */}
                  <li className="pt-1">
                    <Link 
                      href={`/shop?category=${child.slug || child.id}`}
                      className="text-[11px] font-black text-muted-foreground/70 hover:text-primary uppercase flex items-center gap-1"
                      onClick={() => onCategoryClick(child.slug || child.id)}
                    >
                      {isEn ? "Browse All" : "瀏覽所有"} {getCatName(child)} <ChevronRight className="h-2.5 w-2.5" />
                    </Link>
                  </li>
                </ul>
              </div>
            ))}
          </div>
        </ScrollArea>
        
        <div className="mt-8 pt-6 border-t border-dashed flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0"><Award className="h-5 w-5" /></div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong>{isEn ? "Smart Navigation:" : "智能導覽："}</strong> {isEn ? "We've optimized the structure based on product relevance. If you're looking for a specific brand, try searching directly." : "我們已根據產品關聯性優化了導覽結構。如果您在找特定的子品牌，可以嘗試直接在搜尋欄輸入。"}
          </p>
        </div>
      </main>
    </div>
  );
}