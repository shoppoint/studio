"use client";

import React from "react";
import Image from "next/image";
import { ShoppingBag, Package, ShieldCheck, Ticket, Coins } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useI18n } from "@/lib/i18n/i18n-context";
import { cn } from "@/lib/utils";

export function CheckoutSummary({ 
  items, subtotal, shippingFee, total, isPickup, pointsDiscount = 0, autoDiscount = 0, appliedPromos = [], isFreightCollect = false,
  methodSelected = false
}: any) {
  const { lang, t } = useI18n();
  const isEn = lang === 'en';

  return (
    <Card className="border-none shadow-xl bg-white sticky top-24 overflow-hidden rounded-[2.5rem]">
      <div className="bg-primary/10 px-8 py-5 border-b">
        <h2 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
          <ShoppingBag className="h-4 w-4" /> {t.cart.summary}
        </h2>
      </div>
      <CardContent className="p-8 space-y-6">
        <ScrollArea className="max-h-[30vh] pr-4 -mr-4">
          <div className="space-y-4">
            {items.map((item: any) => (
              <div key={item.id} className="flex gap-4 group">
                <div className="h-14 w-14 rounded-xl bg-muted relative overflow-hidden shrink-0 border">
                  {item.image ? (
                    <Image src={item.image} alt={item.name} fill className="object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full opacity-10"><Package className="h-6 w-6" /></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black text-primary uppercase truncate">{item.brand}</p>
                  <p className="text-xs font-bold truncate pr-4">{item.name}</p>
                  <p className="text-[10px] text-muted-foreground">Qty: {item.qty} × ${item.price}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <Separator className="border-dashed" />

        <div className="space-y-4 text-sm font-medium">
          <div className="flex justify-between">
            <span>{isEn ? 'Subtotal' : '貨品小計'}</span>
            <span className="font-bold">${subtotal.toFixed(1)}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="flex items-center gap-2">{isEn ? 'Shipping' : '運費'} {isPickup && <Badge className="bg-green-100 text-green-700 border-none text-[8px] h-4">PICKUP</Badge>}</span>
            <span className={cn("font-bold", (methodSelected && (shippingFee === 0 || isFreightCollect)) && "text-green-600")}>
              {!methodSelected ? (isEn ? "--" : "待確定") : 
               isFreightCollect ? (isEn ? 'Freight Collect' : '運費到付') : 
               (shippingFee === 0 ? 'FREE' : `$${shippingFee.toFixed(1)}`)}
            </span>
          </div>

          {(autoDiscount > 0 || pointsDiscount > 0) && (
            <div className="space-y-2 pt-2 animate-in slide-in-from-right-2">
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest opacity-60">折扣與扣減:</p>
              {autoDiscount > 0 && (
                <div className="flex justify-between items-center text-green-600 font-bold">
                  <span className="flex items-center gap-1"><Ticket className="h-3 w-3" /> {appliedPromos.join(' + ')}</span>
                  <span>-${autoDiscount.toFixed(1)}</span>
                </div>
              )}
              {pointsDiscount > 0 && (
                <div className="flex justify-between items-center text-amber-600 font-bold">
                  <span className="flex items-center gap-1"><Coins className="h-3 w-3" /> 積分抵扣</span>
                  <span>-${pointsDiscount.toFixed(1)}</span>
                </div>
              )}
            </div>
          )}

          <Separator className="border-dashed" />
          
          <div className="flex justify-between items-center pt-2">
            <span className="text-base font-black uppercase">{t.cart.total}</span>
            <span className="text-4xl font-black text-orange-600 tracking-tighter">${total.toFixed(1)}</span>
          </div>
        </div>

        <div className="p-4 bg-muted/20 rounded-2xl flex items-start gap-3">
          <ShieldCheck className="h-4 w-4 text-primary mt-0.5" />
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            {isEn ? "Tax included. Final amount may vary based on chosen shipping method." : "已包含稅項。最終金額可能會因所選配送方式而有所調整。"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
