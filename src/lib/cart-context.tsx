"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from "react";
import { usePathname } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useCollection, useAuth, useUser } from "@/firebase";
import { collection, query, where, doc, updateDoc, increment, serverTimestamp } from "firebase/firestore";
import { useI18n } from "@/lib/i18n/i18n-context";
import { syncAbandonedCartAction } from "@/app/actions/cart-actions";
import { trackEvent } from "@/lib/analytics";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  qty: number;
  image: string;
  brand: string;
  inventoryPolicy: string;
  availableStock: number;
  categories?: string[]; 
  selected?: boolean; 
  sku?: string; 
  slug?: string; 
  promoHint?: string;
  preOrderExpectedDate?: string; 
  collabBrands?: string[];
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  toggleSelect: (id: string) => void; 
  selectAll: (checked: boolean) => void; 
  clearCart: () => void;
  subtotal: number;
  itemCount: number;
  selectedCount: number;
  appliedPromo: any | null; // 新增：全域已套用優惠券
  setAppliedPromo: (promo: any | null) => void; // 新增：更新方法
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [appliedPromo, setAppliedPromo] = useState<any | null>(null); // 新增狀態

  const { lang } = useI18n();
  const { toast } = useToast();
  const db = useFirestore();
  const pathname = usePathname();
  const { user, userData } = useUser();
  const syncTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastProcessedProductsRef = useRef<string>("");

  // 1. 從 LocalStorage 載入購物車與優惠券
  useEffect(() => {
    const savedCart = localStorage.getItem("omnicart-shopping-cart");
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (e) {
        console.error("Failed to parse cart", e);
      }
    }

    const savedPromo = localStorage.getItem("omnicart-applied-promo");
    if (savedPromo) {
      try {
        setAppliedPromo(JSON.parse(savedPromo));
      } catch (e) {}
    }
  }, []);

  const itemIdsKey = useMemo(() => items.map(i => i.id).sort().join(','), [items]);
  
  // 2. 實時監聽產品最新狀態
  const productsQuery = useMemo(() => {
    if (!db || items.length === 0) return null;
    const ids = items.map(i => i.id).filter(Boolean);
    if (ids.length === 0) return null;
    return query(collection(db, 'public_products'), where('__name__', 'in', ids.slice(0, 30)));
  }, [db, itemIdsKey]);

  const { data: dbProducts } = useCollection<any>(productsQuery);

  useEffect(() => {
    if (!dbProducts || dbProducts.length === 0) return;

    const currentFingerprint = dbProducts.map(p => `${p.id}-${p.salePrice || p.price}-${p.onlineStock}-${p.sku}-${(p.categories || []).join(',')}`).join('|');
    if (currentFingerprint === lastProcessedProductsRef.current) return;
    lastProcessedProductsRef.current = currentFingerprint;

    let hasChanges = false;

    const updatedItems = items.map(item => {
      const latestData = dbProducts.find(p => p.id === item.id);
      if (latestData) {
        const latestPrice = latestData.salePrice > 0 ? latestData.salePrice : latestData.price;
        const latestStock = Number(latestData.onlineStock) || 0;
        const latestName = lang === 'en' ? (latestData.productName_en || latestData.productName_zh) : (latestData.productName_zh || latestData.productName_en);
        const latestPolicy = latestData.inventoryPolicy || 'Deny';
        const latestSku = latestData.sku || "";
        const latestSlug = latestData.slug || "";
        const latestExpectedDate = latestData.preOrderExpectedDate || "";
        const latestCategories = Array.isArray(latestData.categories) ? latestData.categories : (latestData.categories ? [latestData.categories] : []);
        const latestBrand = latestData.primaryBrand || latestData.brands || "";
        const latestCollabs = Array.isArray(latestData.collabBrands) ? latestData.collabBrands : [];
        
        let promoHint = "";
        const hasSale = latestData.salePrice > 0 && latestData.salePrice < latestData.price;
        if (hasSale) {
          const discount = Math.round((1 - latestData.salePrice / latestData.price) * 100);
          promoHint = lang === 'en' ? `${discount}% OFF` : `${10 - discount/10}折起`;
        }

        let finalQty = item.qty;
        if (latestPolicy === 'Deny' && item.qty > latestStock) {
          finalQty = Math.max(0, latestStock);
        }

        const isSame = 
          item.price === latestPrice && 
          item.availableStock === latestStock && 
          item.name === latestName && 
          item.promoHint === promoHint && 
          item.inventoryPolicy === latestPolicy &&
          item.qty === finalQty &&
          item.sku === latestSku &&
          item.slug === latestSlug &&
          item.preOrderExpectedDate === latestExpectedDate &&
          JSON.stringify(item.categories) === JSON.stringify(latestCategories) &&
          item.brand === latestBrand &&
          JSON.stringify(item.collabBrands) === JSON.stringify(latestCollabs);

        if (!isSame) {
          hasChanges = true;
          return { 
            ...item, 
            qty: finalQty, 
            price: latestPrice, 
            availableStock: latestStock, 
            name: latestName, 
            promoHint, 
            inventoryPolicy: latestPolicy,
            sku: latestSku,
            slug: latestSlug,
            preOrderExpectedDate: latestExpectedDate,
            categories: latestCategories,
            brand: latestBrand,
            collabBrands: latestCollabs
          };
        }
      }
      return item;
    });

    if (hasChanges) {
      setItems(updatedItems);
    }
  }, [dbProducts, lang, items]);

  // 3. 持久化至 LocalStorage
  useEffect(() => {
    localStorage.setItem("omnicart-shopping-cart", JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem("omnicart-applied-promo", JSON.stringify(appliedPromo));
  }, [appliedPromo]);

  // 4. 同步遺棄購物車
  useEffect(() => {
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    
    syncTimerRef.current = setTimeout(async () => {
      if (items.length === 0) return;

      let cartSessionId = localStorage.getItem("cart_session_id");
      if (!cartSessionId) {
        cartSessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        localStorage.setItem("cart_session_id", cartSessionId);
      }

      const currentSubtotal = items.reduce((acc, item) => acc + item.price * item.qty, 0);

      await syncAbandonedCartAction({
        cartId: cartSessionId,
        items: items.map(i => ({ 
          id: i.id, 
          name: i.name, 
          price: i.price, 
          qty: i.qty, 
          brand: i.brand, 
          sku: i.sku || "", 
          promoHint: i.promoHint || "",
          preOrderExpectedDate: i.preOrderExpectedDate || ""
        })),
        total: currentSubtotal,
        customer: { 
          uid: user?.uid || null, 
          name: userData?.displayName || "Guest", 
          email: user?.email || null, 
          phone: userData?.phone || null 
        },
        sourcePath: pathname
      });
    }, 3000); 

    return () => { if (syncTimerRef.current) clearTimeout(syncTimerRef.current); };
  }, [items, user, userData, pathname]);

  const addItem = useCallback((newItem: CartItem) => {
    trackEvent('add_to_cart', {
      currency: 'HKD',
      value: newItem.price * newItem.qty,
      items: [{
        item_id: newItem.id,
        item_name: newItem.name,
        price: newItem.price,
        quantity: newItem.qty,
        item_brand: newItem.brand,
        item_category: newItem.categories?.[0]
      }]
    });

    if (db) {
      updateDoc(doc(db, 'public_products', newItem.id), {
        addedToCartCount: increment(1),
        updatedAt: serverTimestamp()
      }).catch(() => {});
    }

    const isDeny = newItem.inventoryPolicy === 'Deny';
    if (isDeny && newItem.availableStock <= 0) {
      toast({ variant: "warning", title: lang === 'en' ? "Out of Stock" : "暫無存貨" });
      return;
    }

    setItems((prev) => {
      const existing = prev.find((i) => i.id === newItem.id);
      const currentQtyInCart = existing ? existing.qty : 0;
      const nextTotalQty = currentQtyInCart + newItem.qty;

      if (isDeny && nextTotalQty > newItem.availableStock) {
        toast({ variant: "warning", title: lang === 'en' ? "Stock Limit" : "已達庫存上限" });
        if (existing) return prev.map(i => i.id === newItem.id ? { ...i, qty: newItem.availableStock, selected: true } : i);
        return [...prev, { ...newItem, qty: newItem.availableStock, selected: true }];
      }

      toast({ title: lang === 'en' ? "Added to Cart" : "已加入購物車" });
      if (existing) return prev.map((i) => i.id === newItem.id ? { ...i, qty: nextTotalQty, selected: true } : i);
      return [...prev, { ...newItem, selected: true }];
    });
  }, [db, toast, lang]);

  const removeItem = useCallback((id: string) => setItems((prev) => prev.filter((i) => i.id !== id)), []);
  
  const updateQty = useCallback((id: string, qty: number) => {
    setItems((prev) => {
      const item = prev.find(i => i.id === id);
      if (!item) return prev;
      const targetQty = Math.max(1, qty);
      if (qty > item.qty && item.inventoryPolicy === 'Deny' && targetQty > item.availableStock) {
        toast({ 
          variant: "warning", 
          title: lang === 'en' ? "Stock Limit" : "已達庫存上限", 
          description: lang === 'en' ? "Cannot add more items than available in stock." : "抱歉，目前該產品庫存有限，無法再增加數量。"
        });
        return prev.map(i => i.id === id ? { ...i, qty: item.availableStock } : i);
      }
      return prev.map((i) => i.id === id ? { ...i, qty: targetQty } : i);
    });
  }, [lang, toast]);

  const toggleSelect = useCallback((id: string) => setItems((prev) => prev.map(item => item.id === id ? { ...item, selected: !item.selected } : item)), []);
  const selectAll = useCallback((checked: boolean) => setItems((prev) => prev.map(item => ({ ...item, selected: checked }))), []);
  
  const clearCart = useCallback(() => { 
    setItems([]); 
    setAppliedPromo(null); // 核心修正：同時清除優惠券
    localStorage.removeItem("omnicart-shopping-cart"); 
    localStorage.removeItem("omnicart-applied-promo");
  }, []);
  
  const subtotal = useMemo(() => items.filter(i => i.selected !== false).reduce((acc, item) => acc + item.price * item.qty, 0), [items]);
  const itemCount = useMemo(() => items.reduce((acc, item) => acc + item.qty, 0), [items]);
  const selectedCount = useMemo(() => items.filter(i => i.selected !== false).reduce((acc, item) => acc + item.qty, 0), [items]);

  return (
    <CartContext.Provider value={{ 
      items, addItem, removeItem, updateQty, toggleSelect, selectAll, clearCart, subtotal, itemCount, selectedCount,
      appliedPromo, setAppliedPromo 
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) throw new Error("useCart must be used within a CartProvider");
  return context;
}
