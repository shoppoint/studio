
"use client";

import React from "react";
import { Package, Minus, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

/**
 * 手動建立訂單 - 產品清單表格 (支援單品手動扣減與贈品標籤)
 */
export function NewOrderItemsTable({ items, onUpdateQty, onUpdatePrice, onUpdateDiscount, onUpdateDiscountType, onRemove }: any) {
  return (
    <div className="border rounded-2xl overflow-hidden bg-white shadow-sm">
      <Table>
        <TableHeader className="bg-muted/5">
          <TableRow>
            <TableHead className="pl-8">產品</TableHead>
            <TableHead className="w-24 text-center">數量</TableHead>
            <TableHead className="w-32 text-center">單價</TableHead>
            <TableHead className="w-44 text-center">單品扣減 (Discount)</TableHead>
            <TableHead className="text-right pr-8">小計</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="py-12 text-center text-muted-foreground italic">
                尚未加入任何產品
              </TableCell>
            </TableRow>
          ) : (
            items.map((item: any) => {
              const price = Number(item.price) || 0;
              const qty = Number(item.qty) || 0;
              const discVal = Number(item.discount) || 0;
              
              const deductionPerUnit = item.discountType === 'percent' ? (price * discVal / 100) : discVal;
              const rowTotal = (price - deductionPerUnit) * qty;

              return (
                <TableRow key={item.cartItemId} className="group hover:bg-muted/30 transition-colors">
                  <TableCell className="pl-8 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-muted overflow-hidden border">
                        {item.image ? <img src={item.image} className="object-cover w-full h-full" /> : <Package className="h-4 w-4 m-3 opacity-20" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm truncate">{item.name}</p>
                          {item.isInternalGift && (
                            <Badge className="bg-primary text-primary-foreground text-[10px] h-5 font-black border-none uppercase shadow-sm">贈品 GIFT</Badge>
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground font-mono">{item.sku}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center border rounded-lg h-8 overflow-hidden bg-white">
                      <button type="button" className="px-2 hover:bg-muted" onClick={() => onUpdateQty(item.cartItemId, -1)}><Minus className="h-3 w-3" /></button>
                      <span className="w-8 text-center text-xs font-bold">{item.qty}</span>
                      <button type="button" className="px-2 hover:bg-muted" onClick={() => onUpdateQty(item.cartItemId, 1)}><Plus className="h-3 w-3" /></button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Input 
                      type="number" 
                      value={item.price} 
                      onChange={(e) => onUpdatePrice(item.cartItemId, parseFloat(e.target.value) || 0)}
                      disabled={item.isInternalGift}
                      className="h-8 text-right font-bold text-sm bg-muted/10 border-none"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 bg-muted/10 p-0.5 rounded-lg border">
                      <Input 
                        type="number" 
                        value={item.discount} 
                        onChange={(e) => onUpdateDiscount(item.cartItemId, parseFloat(e.target.value) || 0)}
                        disabled={item.isInternalGift}
                        className="h-7 border-none bg-white focus-visible:ring-0 text-right text-xs font-bold"
                      />
                      <Select value={item.discountType} onValueChange={(v) => onUpdateDiscountType(item.cartItemId, v)} disabled={item.isInternalGift}>
                        <SelectTrigger className="h-7 w-14 text-[10px] bg-white border-none shadow-sm font-black"><SelectValue /></SelectTrigger>
                        <SelectContent className="rounded-xl border-none shadow-2xl">
                          <SelectItem value="amount">$</SelectItem>
                          <SelectItem value="percent">%</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TableCell>
                  <TableCell className="text-right pr-8">
                    <div className="flex items-center justify-end gap-3">
                      <span className="font-black text-sm text-primary">
                        ${rowTotal.toFixed(1)}
                      </span>
                      <button type="button" onClick={() => onRemove(item.cartItemId)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
