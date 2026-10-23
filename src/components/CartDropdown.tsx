"use client";

import { useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart, Trash2, ArrowRight, ShoppingBag, Sparkles, Ticket, Minus, Plus, Zap, Truck, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { useI18n } from "@/lib/i18n/i18n-context";
import { useCart } from "@/lib/cart-context";
import { useToast } from "@/hooks/use-toast";
import { useUser, useFirestore, useCollection } from "@/firebase";
import { collection, query, where } from "firebase/firestore";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { calculateDiscountForPromo, getPromoShortLabel } from "@/lib/shop-utils";
import { ShippingMilestoneTracker } from "./cart/ShippingMilestoneTracker";

export function CartDropdown() {
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const { items, removeItem, itemCount, subtotal, updateQty } = useCart();
  const { userData } = useUser();
  const db = useFirestore();

  const promosQuery = useMemo(() => {
    if (!db) return null;
    return query(
      collection(db, 'promotions'), 
      where('status', '==', 'active')
    );
  }, [db]);
  const { data: allPromos } = useCollection<any>(promosQuery);

  /**
   * 智慧優惠併用與排他性計算
   */
  const promoInfo = useMemo(() => {
    const selectedItems = items.filter(i => i.selected !== false);
    if (!allPromos || subtotal <= 0 || selectedItems.length === 0) return { amount: 0, appliedPromos: [] as any[] };
    
    const todayStr = format(new Date(), "yyyy-MM-dd");

    // 1. 獲取所有適用的候選活動 (排除過期, 排除手動優惠碼)
    const candidates = allPromos.filter(p => {
      if (p.code) return false; 
      if (p.startsAt && p.startsAt > todayStr) return false;
      if (p.endsAt && p.endsAt < todayStr) return false;
      return true;
    }).map(p => {
      const result = calculateDiscountForPromo(p, selectedItems, subtotal, userData);
      return {
        ...p,
        discount: result.discount,
        displayName: getPromoShortLabel(p, lang)
      };
    }).filter(r => r.discount > 0);

    // 2. 分類：可合併 (Stackable) 與 獨佔 (Exclusive)
    const stackable = candidates.filter(p => p.isStackable !== false);
    const exclusive = candidates.filter(p => p.isStackable === false);

    const stackableSum = stackable.reduce((sum, p) => sum + p.discount, 0);

    // 3. 擇優模式
    let finalDiscount = stackableSum;
    let finalApplied = stackable;

    exclusive.forEach(p => {
      if (p.discount > finalDiscount) {
        finalDiscount = p.discount;
        finalApplied = [p];
      }
    });

    return { amount: finalDiscount, appliedPromos: finalApplied };
  }, [allPromos, subtotal, lang, items, userData]);

  const total = useMemo(() => {
    return Math.ceil(Math.max(0, subtotal - promoInfo.amount) * 10) / 10;
  }, [subtotal, promoInfo.amount]);

  const isEn = lang === 'en';

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full relative">
          <ShoppingCart className="h-5 w-5" />
          {itemCount > 0 && <Badge className="absolute -right-1 -top-1 h-4 min-w-4 p-0.5 text-[10px] bg-primary text-primary-foreground border-2 border-white font-black">{itemCount}</Badge>}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 sm:w-96 p-0 border-none shadow-2xl rounded-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-primary/10 px-6 py-4 border-b"><h3 className="font-black text-sm uppercase tracking-wider flex items-center gap-2"><ShoppingCart className="h-4 w-4" />{t.cart.title}</h3></div>
        <div className="max-h-[400px] overflow-y-auto">
          {items.length === 0 ? (
            <div className="p-12 text-center space-y-4"><div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto"><ShoppingBag className="h-8 w-8 text-muted-foreground" /></div><p className="text-sm text-muted-foreground font-bold">{t.cart.empty}</p></div>
          ) : (
            <div className="p-4 space-y-4">
              {items.map((item) => (
                <div key={item.id} className={cn("flex gap-4 group transition-opacity", item.selected === false && "opacity-40")}>
                  <Link href={`/product/${item.slug || item.id}`} className="h-16 w-16 rounded-lg bg-muted relative overflow-hidden shrink-0 border">
                    {item.image && <Image src={item.image} alt={item.name} fill className="object-cover" />}
                  </Link>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex justify-between items-start">
                      <Link href={`/product/${item.slug || item.id}`} className="block flex-1 min-w-0">
                        <h4 className="text-xs font-bold truncate pr-4 hover:text-primary transition-colors">{item.name}</h4>
                      </Link>
                      <button onClick={() => removeItem(item.id)} className="text-muted-foreground hover:text-destructive shrink-0"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                    
                    {item.inventoryPolicy === 'PreOrder' && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        <Badge className="bg-indigo-600 text-white border-none font-black text-[8px] h-4 px-1.5 uppercase shadow-sm">
                          <Zap className="h-2 w-2 mr-1 fill-current animate-pulse" />
                          {isEn ? 'PRE-ORDER' : '限定預購'}
                        </Badge>
                        {item.preOrderExpectedDate && (
                          <span className="text-[8px] font-black text-indigo-700 bg-indigo-50 px-1.5 rounded flex items-center gap-1">
                            <Truck className="h-2 w-2" /> 
                            {isEn ? `Expected: ${item.preOrderExpectedDate}` : `預計到貨: ${item.preOrderExpectedDate}`}
                          </span>
                        )}
                      </div>
                    )}

                    {/* 追加貨品提示 */}
                    {item.qty > item.availableStock && item.inventoryPolicy === 'Allow' && (
                      <p className="text-[9px] font-bold text-orange-600 mt-1 flex items-center gap-1">
                        <Info className="h-2.5 w-2.5" />
                        {isEn ? "Quantity exceeds stock, delivery may be delayed" : "訂購超過存貨數量，配送時間可能延長"}
                      </p>
                    )}

                    <div className="flex justify-between items-center mt-2">
                      <div className="flex items-center bg-muted/50 rounded-lg h-7 overflow-hidden border">
                        <button className="px-2 hover:bg-muted transition-colors" onClick={() => updateQty(item.id, item.qty - 1)}><Minus className="h-3 w-3" /></button>
                        <span className="w-6 text-center text-[10px] font-black">{item.qty}</span>
                        <button className="px-2 hover:bg-muted transition-colors" onClick={() => updateQty(item.id, item.qty + 1)}><Plus className="h-3 w-3" /></button>
                      </div>
                      <span className="text-sm font-black text-orange-600">${(item.price * item.qty).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        {items.length > 0 && (
          <div className="p-6 bg-muted/20 border-t space-y-3">
            {/* Shipping Milestone Tracker - 修復：使用折扣後金額 */}
            <div className="px-1 mb-2">
              <ShippingMilestoneTracker subtotal={subtotal - promoInfo.amount} variant="compact" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center"><span className="text-[9px] font-black uppercase text-muted-foreground">Subtotal</span><span className="text-sm font-bold">${subtotal.toFixed(2)}</span></div>
              
              {promoInfo.amount > 0 && (
                <div className="space-y-1 pt-1">
                  {promoInfo.appliedPromos.map((p, idx) => (
                    <div key={idx} className="flex justify-between items-center text-green-600 font-bold text-[10px] animate-in slide-in-from-right-2">
                      <span className="flex items-center gap-1"><Sparkles className="h-2.5 w-2.5" /> {p.displayName}</span>
                      {p.discount > 0 && <span>-${p.discount.toFixed(1)}</span>}
                    </div>
                  ))}
                </div>
              )}

              <Separator className="border-dashed my-2" />
              <div className="flex justify-between items-center"><span className="text-[10px] font-black uppercase text-muted-foreground">總額 Total</span><span className="text-xl font-black text-orange-600">${total.toFixed(2)}</span></div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button asChild variant="outline" className="rounded-xl font-bold h-11 text-xs"><Link href="/cart">{lang === 'zh-HK' ? "查看購物車" : "View Cart"}</Link></Button>
              <Button asChild className="rounded-xl font-black bg-primary h-11 text-xs"><Link href="/checkout">{lang === 'zh-HK' ? "結帳" : "Checkout"}</Link></Button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
