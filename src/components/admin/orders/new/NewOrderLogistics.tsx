"use client";

import React from "react";
import { Truck, Warehouse, MapPinned, Map as MapIcon, Info } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function NewOrderLogistics({ formData, onChange, methods, locations, selectedPoint, onMethodChange, onOpenSf, onOpenHkPost, onOpenStore, isEn }: any) {
  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h4 className="text-xs font-black uppercase text-primary tracking-widest flex items-center gap-2"><Truck className="h-4 w-4" /> 配送方式與費率</h4>
          <RadioGroup value={formData.selectedMethodId} onValueChange={onMethodChange} className="grid gap-2">
            {methods.length === 0 ? (
              <div className="p-10 text-center border-2 border-dashed rounded-2xl bg-muted/10 flex flex-col items-center gap-2">
                <Info className="h-6 w-6 text-muted-foreground/30" />
                <p className="text-xs text-muted-foreground font-bold italic">
                  此國家/地區目前無可用配送方式，請先在「平台設定 &gt; 物流」中設定對應分區。
                </p>
              </div>
            ) : methods.map((m: any) => {
              const threshold = Number(m.threshold) || 0;
              const isFreeByThreshold = Number(formData.subtotal || 0) >= threshold && threshold > 0;
              const isPickup = m.isPickup === true;
              return (
                <div key={m.id} className={cn("flex flex-col border-2 p-5 rounded-2xl cursor-pointer transition-all", formData.selectedMethodId === m.id ? "border-primary bg-primary/5" : "border-muted hover:bg-muted/30")} onClick={() => onMethodChange(m.id)}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <RadioGroupItem value={m.id} id={m.id} />
                      <div className="cursor-pointer">
                        <Label htmlFor={m.id} className="font-bold text-sm cursor-pointer">{isEn ? (m.name_en || m.name) : (m.name_zh || m.name)}</Label>
                        <p className="text-[10px] text-muted-foreground mt-1">{m.notes}</p>
                      </div>
                    </div>
                    <div className="text-right">{isPickup || isFreeByThreshold ? <span className="font-black text-xs text-green-600">FREE</span> : m.collect ? <Badge className="bg-orange-600 text-white border-none font-black text-[10px] uppercase px-3 h-6 rounded-lg">運費到付</Badge> : <span className="font-black text-xs text-primary">${m.fee || 0}</span>}</div>
                  </div>
                  
                  {formData.selectedMethodId === m.id && (m.isPickup || (m.name_zh || "").includes("站") || (m.name_zh || "").includes("櫃") || (m.name_zh || "").includes("智")) && (
                    <div className="mt-4 pt-4 border-t border-primary/10 animate-in slide-in-from-top-2">
                      {selectedPoint ? (
                        <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-primary/20 shadow-inner">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0"><MapPinned className="h-5 w-5" /></div>
                            <div className="min-w-0"><p className="text-xs font-black truncate">{isEn ? selectedPoint.name_en : selectedPoint.name_zh}</p><p className="text-[10px] text-muted-foreground mt-1">{isEn ? selectedPoint.address_en : selectedPoint.address_zh}</p></div>
                          </div>
                          <button className="h-8 rounded-xl font-bold text-xs text-primary px-3 hover:bg-primary/5 transition-colors" onClick={(e) => { e.stopPropagation(); if (m.name_zh?.includes("順豐")) onOpenSf(); else if (m.name_zh?.includes("智")) onOpenHkPost(); else onOpenStore(); }}>更改</button>
                        </div>
                      ) : (
                        <Button className="w-full h-12 rounded-xl font-black bg-white border-2 border-primary text-primary hover:bg-primary hover:text-white transition-all gap-2" onClick={(e) => { e.stopPropagation(); if (m.name_zh?.includes("順豐")) onOpenSf(); else if (m.name_zh?.includes("智")) onOpenHkPost(); else onOpenStore(); }}><MapIcon className="h-4 w-4 mr-2" /> 選擇收貨地點／分店</Button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </RadioGroup>
          <div className="grid gap-2 pt-2">
            <Label className="text-[10px] font-black uppercase">實收運費 (手動覆蓋)</Label>
            <Input type="number" value={formData.shippingFee} onChange={e => onChange('shippingFee', e.target.value)} className="h-10 bg-muted/20 border-none rounded-xl font-black text-primary" />
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-xs font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2"><Warehouse className="h-4 w-4" /> 履行庫存點 (Fulfillment)</h4>
          <Select value={formData.fulfillmentLocationId} onValueChange={v => onChange('fulfillmentLocationId', v)}>
            <SelectTrigger className="h-12 bg-muted/20 border-none rounded-2xl font-bold">
              <SelectValue placeholder="選擇出貨倉庫/門市..." />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-none shadow-2xl">
              {locations?.map((loc: any) => (
                <SelectItem key={loc.id} value={loc.id}>
                  <div className="flex items-center gap-2">
                    {loc.type === 'physical' ? '🏪' : '📦'} {loc.name_zh || loc.name_en}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
