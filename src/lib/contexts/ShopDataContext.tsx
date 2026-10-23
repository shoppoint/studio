
"use client";

import React, { createContext, useContext, useMemo, useState, useEffect } from "react";
import { useFirestore, useCollection } from "@/firebase";
import { collection, query, where, orderBy } from "firebase/firestore";
import { cn } from "@/lib/utils";

interface ShopDataContextType {
  categories: any[] | null;
  promotions: any[] | null;
  brands: any[] | null;
  loading: boolean;
}

const ShopDataContext = createContext<ShopDataContextType | undefined>(undefined);

/**
 * 全域數據共享提供者 (效能優化版)
 * 策略：三階段抓取。首屏優先抓取促銷（用於顯示標籤），隨後載入分類與品牌。
 */
export function ShopDataProvider({ children }: { children: React.ReactNode }) {
  const db = useFirestore();
  const [shouldLoadDeepData, setShouldLoadDeepData] = useState(false);

  useEffect(() => {
    // 延遲執行非核心數據抓取，優先讓出頻寬給產品詳情頁的主請求
    const timer = setTimeout(() => setShouldLoadDeepData(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  // 1. 全域促銷 (優先級：高 - 用於計算產品標籤與購物車折扣)
  const promosQuery = useMemo(() => {
    if (!db) return null;
    return query(
      collection(db, 'promotions'),
      where('status', '==', 'active')
    );
  }, [db]);
  const { data: promotions, loading: promosLoading } = useCollection<any>(promosQuery);

  // 2. 全域分類 (優先級：中)
  const catsQuery = useMemo(() => {
    if (!db || !shouldLoadDeepData) return null;
    return query(
      collection(db, 'categories'),
      where('isVisible', '==', true),
      orderBy('displayOrder', 'asc')
    );
  }, [db, shouldLoadDeepData]);
  const { data: categories, loading: catsLoading } = useCollection<any>(catsQuery);

  // 3. 全域品牌 (優先級：低)
  const brandsQuery = useMemo(() => {
    if (!db || !shouldLoadDeepData) return null;
    return query(
      collection(db, 'brands'),
      where('status', '==', 'Active')
    );
  }, [db, shouldLoadDeepData]);
  const { data: brands, loading: brandsLoading } = useCollection<any>(brandsQuery);

  const value = useMemo(() => ({
    categories,
    promotions,
    brands,
    loading: promosLoading
  }), [categories, promotions, brands, promosLoading]);

  return (
    <ShopDataContext.Provider value={value}>
      {children}
    </ShopDataContext.Provider>
  );
}

export function useShopData() {
  const context = useContext(ShopDataContext);
  if (context === undefined) {
    throw new Error("useShopData must be used within a ShopDataProvider");
  }
  return context;
}
