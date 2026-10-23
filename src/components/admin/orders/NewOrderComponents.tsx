
"use client";

import React, { useMemo, useState } from "react";
import { 
  User, 
  MapPin, 
  Building2, 
  Package, 
  Minus, 
  Plus, 
  Trash2, 
  CreditCard, 
  PlusCircle, 
  X,
  Truck,
  MapPinned,
  Map as MapIcon, 
  Store,
  Info,
  CheckCircle2,
  Warehouse,
  Gift,
  Hash,
  Wallet,
  MessageCircle,
  Smartphone,
  Landmark,
  QrCode,
  DollarSign,
  Copy
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { HK_ADDRESS_DATA, AREA_NAME_MAP, DISTRICT_NAME_MAP, SUB_DISTRICT_NAME_MAP, COUNTRIES, COUNTRY_NAME_MAP } from "@/lib/address-data";
import { useI18n } from "@/lib/i18n/i18n-context";
import { PAYMENT_METHODS } from "@/lib/constants/payment-methods";
import { format } from "date-fns";

/**
 * 獨立的地址表單欄位元件 - 修正地址物件回傳邏輯與欄位鎖定策略
 */
function AddressFormFields({ type, data, onUpdate, addrT, isDisabled = false, isZh, errors = {} }: any) {
  const safeData = useMemo(() => ({
    lastName: data?.lastName || "",
    firstName: data?.firstName || "",
    email: data?.email || "",
    phone: data?.phone || "",
    companyName: data?.companyName || "",
    country: data?.country || "Hong Kong",
    area: data?.area || "",
    district: data?.district || "",
    subDistrict: data?.subDistrict || "",
    building: data?.building || "",
    street: data?.street || "",
    floor: data?.floor || "",
    flat: data?.flat || "",
    block: data?.block || ""
  }), [data]);
  
  const districtOptions = useMemo(() => 
    safeData.area && HK_ADDRESS_DATA[safeData.area] ? Object.keys(HK_ADDRESS_DATA[safeData.area]) : []
  , [safeData.area]);

  const subDistrictOptions = useMemo(() => 
    safeData.area && safeData.district && HK_ADDRESS_DATA[safeData.area] && HK_ADDRESS_DATA[safeData.area][safeData.district] 
      ? HK_ADDRESS_DATA[safeData.area][safeData.district] 
      : []
  , [safeData.area, safeData.district]);

  const handleAddrUpdate = (f: string, v: string) => {
    const nextAddr = { ...safeData, [f]: v };
    if (f === 'area') { nextAddr.district = ""; nextAddr.subDistrict = ""; }
    if (f === 'district') { nextAddr.subDistrict = ""; }
    onUpdate(type, nextAddr);
  };

  const isHK = safeData.country === 'Hong Kong';

  return (
    <div className={cn("space-y-4 p-6 bg-muted/20 rounded-3xl border border-dashed transition-all")}>
      {/* 管理後台應隨時允許編輯地址，即便選取了自取點 (移除 isDisabled 鎖定) */}
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-1.5"><Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">{addrT.last_name}</Label><Input value={safeData.lastName} onChange={e => handleAddrUpdate('lastName', e.target.value)} className="h-10 bg-white rounded-xl border-none shadow-sm" /></div>
        <div className="grid gap-1.5"><Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">{addrT.first_name}</Label><Input value={safeData.firstName} onChange={e => handleAddrUpdate('firstName', e.target.value)} className="h-10 bg-white rounded-xl border-none shadow-sm" /></div>
      </div>
      <div className="grid gap-1.5">
        <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1 flex items-center gap-2">
          <Building2 className="h-3 w-3 text-primary" />
          {addrT.company_name}
        </Label>
        <Input value={safeData.companyName} onChange={e => handleAddrUpdate('companyName', e.target.value)} className="h-10 bg-white rounded-xl border-none shadow-sm" placeholder="Optional" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-1.5"><Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">{addrT.phone}</Label><Input value={safeData.phone} onChange={e => handleAddrUpdate('phone', e.target.value)} className="h-10 bg-white rounded-xl border-none shadow-sm" /></div>
        <div className="grid gap-1.5"><Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">{addrT.email}</Label><Input value={safeData.email} onChange={e => handleAddrUpdate('email', e.target.value)} className="h-10 bg-white border-none rounded-xl shadow-sm" /></div>
      </div>
      
      <Separator className="opacity-50 border-dashed" />
      
      <div className="grid gap-4">
        <div className="grid gap-1.5">
          <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">{addrT.country}</Label>
          <Select value={safeData.country} onValueChange={(v) => handleAddrUpdate('country', v)}>
            <SelectTrigger className="bg-white border-none h-10 rounded-xl font-bold shadow-sm"><SelectValue placeholder="Select Country" /></SelectTrigger>
            <SelectContent className="rounded-xl border-none shadow-2xl">{COUNTRIES.map(c => <SelectItem key={c} value={c}>{isZh ? (COUNTRY_NAME_MAP[c] || c) : c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        
        {isHK && (
          <div className="grid grid-cols-3 gap-2">
            <div className="grid gap-1.5">
              <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">區域</Label>
              <Select value={safeData.area} onValueChange={v => handleAddrUpdate('area', v)}>
                <SelectTrigger className="h-10 bg-white border-none rounded-xl text-xs shadow-sm"><SelectValue placeholder="Area" /></SelectTrigger>
                <SelectContent>{Object.keys(HK_ADDRESS_DATA).map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">地區</Label>
              <Select value={safeData.district} onValueChange={v => handleAddrUpdate('district', v)} disabled={!safeData.area}>
                <SelectTrigger className="h-10 bg-white border-none rounded-xl text-xs shadow-sm"><SelectValue placeholder="District" /></SelectTrigger>
                <SelectContent>{districtOptions.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">分區</Label>
              <Select value={safeData.subDistrict} onValueChange={(val) => handleAddrUpdate('subDistrict', val)} disabled={!safeData.district}>
                <SelectTrigger className="h-10 bg-white border-none rounded-xl text-xs shadow-sm"><SelectValue placeholder="Sub" /></SelectTrigger>
                <SelectContent>{subDistrictOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="grid gap-1.5"><Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">{addrT.flat}</Label><Input value={safeData.flat} onChange={e => handleAddrUpdate('flat', e.target.value)} className="h-10 bg-white border-none rounded-xl text-center shadow-sm" /></div>
        <div className="grid gap-1.5"><Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">{addrT.floor}</Label><Input value={safeData.floor} onChange={e => handleAddrUpdate('floor', e.target.value)} className="h-10 bg-white border-none rounded-xl text-center shadow-sm" /></div>
        <div className="grid gap-1.5"><Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">{addrT.block}</Label><Input value={safeData.block} onChange={e => handleAddrUpdate('block', e.target.value)} className="h-10 bg-white border-none rounded-xl text-center shadow-sm" /></div>
      </div>

      <div className="grid gap-1.5"><Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">{addrT.building}</Label><Input value={safeData.building} onChange={e => handleAddrUpdate('building', e.target.value)} className="h-10 bg-white border-none rounded-xl shadow-sm" /></div>
      <div className="grid gap-1.5"><Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">{addrT.street}</Label><Input value={safeData.street} onChange={e => handleAddrUpdate('street', e.target.value)} className="h-10 bg-white border-none rounded-xl shadow-sm" /></div>
    </div>
  );
}

export function OrderItemsTable({ items, onUpdateQty, onUpdatePrice, onUpdateDiscount, onUpdateDiscountType, onRemove }: any) {
  return (
    <div className="border rounded-2xl overflow-hidden bg-white shadow-sm">
      <Table>
        <TableHeader className="bg-muted/5">
          <TableRow>
            <TableHead className="pl-8">產品</TableHead>
            <TableHead className="w-24 text-center">數量</TableHead>
            <TableHead className="w-32 text-center">單價</TableHead>
            <TableHead className="w-40 text-center">折扣</TableHead>
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
            items.map((item: any) => (
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
                          <Badge className="bg-primary text-primary-foreground text-[8px] h-4 font-black border-none uppercase shadow-sm">GIFT</Badge>
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
                    className="h-8 text-right font-bold text-sm"
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Input 
                      type="number" 
                      value={item.discount} 
                      onChange={(e) => onUpdateDiscount(item.cartItemId, parseFloat(e.target.value) || 0)}
                      disabled={item.isInternalGift}
                      className="h-8 text-right text-xs"
                    />
                    <Select value={item.discountType} onValueChange={(v) => onUpdateDiscountType(item.cartItemId, v)} disabled={item.isInternalGift}>
                      <SelectTrigger className="h-8 w-16 text-[10px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="amount">$</SelectItem>
                        <SelectItem value="percent">%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TableCell>
                <TableCell className="text-right pr-8">
                  <div className="flex items-center justify-end gap-3">
                    <span className="font-black text-sm text-primary">
                      ${((item.price - (item.discountType === 'percent' ? (item.price * item.discount / 100) : item.discount)) * item.qty).toFixed(1)}
                    </span>
                    <button type="button" onClick={() => onRemove(item.cartItemId)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export function AddressSection({ formData, onChange, labels, selectedPoint }: any) {
  const { lang } = useI18n();
  const isZh = lang === 'zh-HK';

  const handleCopyShippingToBilling = () => {
    onChange('billingAddress', { ...formData.shippingAddress });
  };

  return (
    <div className="space-y-12 animate-in fade-in">
      <div className="grid grid-cols-1 gap-12">
        {/* Shipping Address */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-xs font-black uppercase text-primary tracking-widest flex items-center gap-2">
              <MapPin className="h-4 w-4" /> 收貨人與地址 (Shipping)
            </h4>
            <Badge variant="outline" className="text-[10px] font-black uppercase border-primary/20 text-primary">Step 1</Badge>
          </div>
          <AddressFormFields type="shippingAddress" data={formData.shippingAddress} onUpdate={onChange} addrT={labels} isZh={isZh} isDisabled={false} />
        </div>

        {/* Billing Address */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-xs font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
              <Building2 className="h-4 w-4" /> 賬單資訊 (Billing)
            </h4>
            <Button 
              type="button"
              variant="outline" 
              size="sm" 
              className="h-8 rounded-xl font-black text-[10px] uppercase gap-1.5 border-primary/30 text-primary bg-white hover:bg-primary hover:text-white transition-all shadow-sm"
              onClick={handleCopyShippingToBilling}
            >
              <Copy className="h-3 w-3" /> 同收貨地址
            </Button>
          </div>
          <AddressFormFields type="billingAddress" data={formData.billingAddress} onUpdate={onChange} addrT={labels} isZh={isZh} />
        </div>
      </div>
    </div>
  );
}
