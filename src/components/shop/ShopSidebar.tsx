
"use client";

import React from "react";
import { ShopFilterContent } from "./ShopFilterContent";

interface ShopSidebarProps {
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

/**
 * 商店側邊欄 (優化版：實施固定頂部佈局，避免長頁面下的操作不便)
 */
export function ShopSidebar(props: ShopSidebarProps) {
  return (
    <aside className="hidden lg:block w-72 shrink-0 p-8 bg-white rounded-[2.5rem] border shadow-sm sticky top-28 max-h-[calc(100vh-140px)] overflow-hidden flex flex-col">
      <div className="flex-1 overflow-y-auto pr-2 -mr-2 no-scrollbar">
        <ShopFilterContent {...props} />
      </div>
    </aside>
  );
}
