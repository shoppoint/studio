
"use client";

import React, { useMemo, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  User, 
  MapPin, 
  Building2, 
  Truck, 
  MapPinned, 
  Map as MapIcon, 
  Store,
  Info, 
  CheckCircle2, 
  Zap, 
  Coins, 
  Smartphone, 
  CreditCard, 
  Landmark, 
  QrCode, 
  ShoppingBag, 
  Mail, 
  Phone,
  Save, X, Ticket, Sparkles, Package, Check,
  ArrowRight,
  PartyPopper, 
  ShieldCheck, 
  AlertCircle, 
  AlertTriangle, 
  UserCircle, 
  Crown,
  Loader2,
  CalendarDays,
  Clock,
  Leaf,
  Box,
  Lock,
  UserPlus
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { HK_ADDRESS_DATA, AREA_NAME_MAP, DISTRICT_NAME_MAP, SUB_DISTRICT_NAME_MAP, COUNTRIES, COUNTRY_NAME_MAP } from "@/lib/address-data";
import { useI18n } from "@/lib/i18n/i18n-context";
import { PAYMENT_METHODS } from "@/lib/constants/payment-methods";
import { format, isAfter, parseISO } from "date-fns";
import { SavedAddressPicker } from "./SavedAddressPicker";
import { ScrollArea } from "@/components/ui/scroll-area";
import { query, collection, where, getDocs } from "firebase/firestore";
import { useFirestore } from "@/firebase";
import { Switch } from "@/components/ui/switch";
import { LoginDialog } from "@/components/auth/LoginDialog";
import { HARDCODED_SHIPPING_ZONES } from "@/lib/constants/shipping-data";

/**
 * 獨立的地址表單欄位元件 - 修正顯示語言與映射邏輯
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
          <Select value={safeData.country} onValueChange={(v) => handleAddrUpdate('country', v)} disabled={isDisabled}>
            <SelectTrigger className="bg-white border-none h-10 rounded-xl font-bold shadow-sm"><SelectValue placeholder="Select Country" /></SelectTrigger>
            <SelectContent className="rounded-xl border-none shadow-2xl">
              {COUNTRIES.map(c => <SelectItem key={c} value={c}>{isZh ? (COUNTRY_NAME_MAP[c] || c) : c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        
        {isHK && (
          <div className="grid grid-cols-3 gap-2">
            <div className="grid gap-1.5">
              <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">{addrT.area}</Label>
              <Select value={safeData.area} onValueChange={v => handleAddrUpdate('area', v)} disabled={isDisabled}>
                <SelectTrigger className="h-10 bg-white border-none rounded-xl text-xs shadow-sm"><SelectValue placeholder="Area" /></SelectTrigger>
                <SelectContent>
                  {Object.keys(HK_ADDRESS_DATA).map(a => (
                    <SelectItem key={a} value={a}>
                      {isZh ? (AREA_NAME_MAP[a] || a) : a}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">{addrT.district}</Label>
              <Select value={safeData.district} onValueChange={v => handleAddrUpdate('district', v)} disabled={!safeData.area || isDisabled}>
                <SelectTrigger className="h-10 bg-white border-none rounded-xl text-xs shadow-sm"><SelectValue placeholder="District" /></SelectTrigger>
                <SelectContent>
                  {districtOptions.map(d => (
                    <SelectItem key={d} value={d}>
                      {isZh ? (DISTRICT_NAME_MAP[d] || d) : d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">{addrT.sub_district}</Label>
              <Select value={safeData.subDistrict} onValueChange={(val) => handleAddrUpdate('subDistrict', val)} disabled={!safeData.district || isDisabled}>
                <SelectTrigger className="h-10 bg-white border-none rounded-xl text-xs shadow-sm"><SelectValue placeholder="Sub" /></SelectTrigger>
                <SelectContent>
                  {subDistrictOptions.map(s => (
                    <SelectItem key={s} value={s}>
                      {isZh ? (SUB_DISTRICT_NAME_MAP[s] || s) : s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="grid gap-1.5"><Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">{addrT.flat}</Label><Input value={safeData.flat} onChange={e => handleAddrUpdate('flat', e.target.value)} disabled={isDisabled} className="h-10 bg-white border-none rounded-xl text-center shadow-sm" /></div>
        <div className="grid gap-1.5"><Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">{addrT.floor}</Label><Input value={safeData.floor} onChange={e => handleAddrUpdate('floor', e.target.value)} disabled={isDisabled} className="h-10 bg-white border-none rounded-xl text-center shadow-sm" /></div>
        <div className="grid gap-1.5"><Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">{addrT.block}</Label><Input value={safeData.block} onChange={e => handleAddrUpdate('block', e.target.value)} disabled={isDisabled} className="h-10 bg-white border-none rounded-xl text-center shadow-sm" /></div>
      </div>

      <div className="grid gap-1.5"><Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">{addrT.building}</Label><Input value={safeData.building} onChange={e => handleAddrUpdate('building', e.target.value)} disabled={isDisabled} className="h-10 bg-white border-none rounded-xl shadow-sm" /></div>
      <div className="grid gap-1.5"><Label className="text-[9px] font-black uppercase text-muted-foreground ml-1">{addrT.street}</Label><Input value={safeData.street} onChange={e => handleAddrUpdate('street', e.target.value)} disabled={isDisabled} className="h-10 bg-white border-none rounded-xl shadow-sm" /></div>
    </div>
  );
}

/**
 * 1. 聯絡資訊區塊
 */
export function ContactSection({ 
  contactData, onUpdate, onApplySaved, t, errors, isLoggedIn = false
}: { 
  contactData: any, onUpdate: (f: string, v: any) => void, onApplySaved?: (addr: any) => void,
  t: any, errors?: Record<string, string>, isLoggedIn?: boolean
}) {
  const { lang } = useI18n();
  const isEn = lang === 'en';
  const addrT = t.checkout.address_fields;

  return (
    <div className="space-y-6">
      {!isLoggedIn && (
        <Card className="border-none shadow-xl bg-slate-900 text-white rounded-[2rem] overflow-hidden animate-in fade-in duration-700">
           <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                 <div className="h-14 w-14 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shrink-0 border border-primary/20">
                    <Sparkles className="h-7 w-7 fill-current animate-pulse" />
                 </div>
                 <div className="text-left space-y-1">
                    <h3 className="text-lg font-black font-headline tracking-tight">登入或登記以賺取積分</h3>
                    <p className="text-slate-400 text-xs font-medium">現在登入可直接套用地址資料，並在此筆訂單獲得積分獎賞。</p>
                 </div>
              </div>
              <LoginDialog trigger={
                <Button className="bg-primary text-primary-foreground font-black px-10 h-12 rounded-xl shadow-lg shrink-0 hover:scale-105 transition-all">
                  立即登入 / 註冊
                </Button>
              } />
           </CardContent>
        </Card>
      )}

      <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
        <CardHeader className="bg-muted/10 border-b py-5 px-6 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-black uppercase flex items-center gap-2">
            <User className="h-5 w-5 text-primary" /> {isEn ? "Personal Contact Details" : "個人聯絡資料"}
          </CardTitle>
          {isLoggedIn && onApplySaved && <SavedAddressPicker onSelect={onApplySaved} />}
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="grid gap-2">
              <Label className={cn("text-xs font-bold", errors?.lastName && "text-destructive")}>
                {addrT.last_name} <span className="text-red-500">*</span>
              </Label>
              <Input 
                value={contactData.lastName || ""} 
                onChange={(e) => onUpdate('lastName', e.target.value)} 
                className={cn("h-11 rounded-xl", errors?.lastName && "border-destructive ring-destructive/20")} 
                placeholder={isEn ? "e.g. Smith" : "例如：陳"} 
              />
            </div>
            <div className="grid gap-2">
              <Label className={cn("text-xs font-bold", errors?.firstName && "text-destructive")}>
                {addrT.first_name} <span className="text-red-500">*</span>
              </Label>
              <Input 
                value={contactData.firstName || ""} 
                onChange={(e) => onUpdate('firstName', e.target.value)} 
                className={cn("h-11 rounded-xl", errors?.firstName && "border-destructive ring-destructive/20")} 
                placeholder={isEn ? "e.g. John" : "例如：小明"} 
              />
            </div>
          </div>
          
          <div className="grid gap-2">
            <Label className="text-xs font-bold flex items-center gap-2">
              <Building2 className="h-3.5 w-3.5 text-primary" />
              {addrT.company_name}
            </Label>
            <Input 
              value={contactData.companyName || ""} 
              onChange={(e) => onUpdate('companyName', e.target.value)} 
              className="h-11 rounded-xl" 
              placeholder={isEn ? "Optional" : "選填"} 
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="grid gap-2">
              <Label className={cn("text-xs font-bold", errors?.email && "text-destructive")}>{addrT.email} <span className="text-red-500">*</span></Label>
              <Input type="email" value={contactData.email || ""} onChange={(e) => onUpdate('email', e.target.value)} className={cn("h-11 rounded-xl", errors?.email && "border-destructive ring-destructive/20")} placeholder="example@mail.com" />
            </div>
            <div className="grid gap-2">
              <Label className={cn("text-xs font-bold", errors?.phone && "text-destructive")}>{addrT.phone} <span className="text-red-500">*</span></Label>
              <Input type="tel" value={contactData.phone || ""} onChange={(e) => onUpdate('phone', e.target.value)} className={cn("h-11 rounded-xl", errors?.phone && "border-destructive ring-destructive/20")} placeholder="+852 91234567" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * 2. 賬單地址區塊
 */
export function BillingAddressSection({ 
  addressData, onUpdate, onApplySaved, t, isLoggedIn = false, errors = {}
}: { 
  addressData: any, onUpdate: (t: string, data: any) => void, onApplySaved?: (addr: any) => void,
  t: any, isLoggedIn?: boolean, errors?: any
}) {
  const addrT = t.checkout.address_fields;
  const { lang } = useI18n();
  const isZh = lang === 'zh-HK';

  return (
    <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
      <CardHeader className="bg-muted/10 border-b py-5 px-6 flex flex-row items-center justify-between">
        <CardTitle className="text-base font-black flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" /> {t.checkout.billing_address}
        </CardTitle>
        {isLoggedIn && onApplySaved && <SavedAddressPicker onSelect={onApplySaved} />}
      </CardHeader>
      <CardContent className="p-8">
        <AddressFormFields type="billing" data={addressData} onUpdate={onUpdate} addrT={addrT} isZh={isZh} errors={errors} />
      </CardContent>
    </Card>
  );
}

/**
 * 3. 收貨地址區塊
 */
export function ShippingAddressSection({ 
  addressData, onUpdate, onApplySaved, t, selectedPoint, sameAsBilling, setSameAsBilling, isLoggedIn = false, errors = {}
}: { 
  addressData: any, onUpdate: (t: string, data: any) => void, onApplySaved?: (addr: any) => void,
  t: any, selectedPoint?: any, sameAsBilling: boolean, setSameAsBilling: (v: boolean) => void, isLoggedIn?: boolean, errors?: any
}) {
  const { lang } = useI18n();
  const isEn = lang === 'en';
  const isZh = lang === 'zh-HK';
  const addrT = t.checkout.address_fields;
  return (
    <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
      <CardHeader className="bg-muted/10 border-b py-5 px-6 flex flex-row items-center justify-between">
        <div className="flex items-center gap-4">
          <CardTitle className="text-base font-black flex items-center gap-2">
            <MapPin className="h-5 w-5 text-primary" /> {t.checkout.shipping_address}
          </CardTitle>
          {isLoggedIn && onApplySaved && <SavedAddressPicker onSelect={onApplySaved} />}
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="same-as-billing" className="text-xs font-bold cursor-pointer">
            {isEn ? 'Same as billing address' : '與賬單地址相同'}
          </Label>
          <Switch id="same-as-billing" checked={sameAsBilling} onCheckedChange={setSameAsBilling} disabled={!!selectedPoint} />
        </div>
      </CardHeader>
      <CardContent className="p-8">
        {sameAsBilling && !selectedPoint ? (
          <div className="bg-muted/20 p-6 rounded-2xl border border-dashed text-center">
            <p className="text-sm text-muted-foreground italic font-medium">
              {isEn ? "Using the same destination as billing address." : "將使用與賬單地址相同的運送目的地。"}
            </p>
          </div>
        ) : (
          <AddressFormFields type="shipping" data={addressData} onUpdate={onUpdate} addrT={addrT} isZh={isZh} isDisabled={!!selectedPoint} errors={errors} />
        )}
      </CardContent>
    </Card>
  );
}

/**
 * 4. 配送方式區塊
 */
export function ShippingMethodSection({
  availableMethods, selectedMethodId, onSelectMethod, subtotal, selectedPoint, onOpenSf, onOpenHkPost, onOpenStore, isEn, t, errors = {}
}: any) {
  return (
    <Card className={cn("border-none shadow-sm rounded-3xl overflow-hidden bg-white border-l-4", errors.shippingMethod ? "border-destructive" : "border-primary")}>
      <CardHeader className={cn("border-b py-5 px-6", errors.shippingMethod ? "bg-destructive/5" : "bg-primary/5")}>
        <div className="flex justify-between items-center">
          <CardTitle className={cn("text-base font-black flex items-center gap-2", errors.shippingMethod && "text-destructive")}>
            <Truck className="h-4 w" /> {t.checkout.shipping_method}
          </CardTitle>
          {errors.shippingMethod && <Badge variant="destructive" className="animate-pulse">{errors.shippingMethod}</Badge>}
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <RadioGroup value={selectedMethodId || ""} onValueChange={onSelectMethod} className="grid grid-cols-1 gap-3">
          {availableMethods.map((m: any) => {
            const threshold = Number(m.threshold) || 0;
            const isFreeByThreshold = threshold > 0 && subtotal >= threshold;
            const isPickup = m.isPickup === true;
            const isPointPickupType = m.isPickup || m.id === 'sf_locker' || m.id === 'hk_post';

            return (
              <div key={m.id} className={cn("flex flex-col border-2 p-5 rounded-2xl cursor-pointer transition-all", selectedMethodId === m.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/30')} onClick={() => onSelectMethod(m.id)}>
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <RadioGroupItem value={m.id} id={m.id} />
                    <Label htmlFor={m.id} className="cursor-pointer">
                      <p className="font-black text-sm">{isEn ? (m.name_en || m.name) : (m.name_zh || m.name)}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {isPickup ? (
                          <Badge className="bg-primary text-primary-foreground font-black text-[8px] px-2 h-5 border-none uppercase shadow-sm">
                            <CheckCircle2 className="h-2.5 w-2.5 mr-1" /> {isEn ? 'Free 免費' : '免費 FREE'}
                          </Badge>
                        ) : threshold > 0 ? (
                          <Badge variant="outline" className={cn("text-[8px] font-black uppercase px-2 h-5 border-none", isFreeByThreshold ? "bg-green-50 text-white shadow-sm" : "bg-primary/10 text-primary")}>
                            {isFreeByThreshold ? (
                              <span className="flex items-center gap-1"><CheckCircle2 className="h-2.5 w-2.5" /> {isEn ? 'FREE SHIPPING ACHIEVED' : '已享免運費'}</span>
                            ) : (
                              <span>{isEn ? `FREE OVER $${threshold}` : `滿 $${threshold} 免運費`}</span>
                            )}
                          </Badge>
                        ) : null}
                        <p className="text-[10px] text-muted-foreground leading-tight">{isEn ? m.notes_en : m.notes_zh}</p>
                      </div>
                    </Label>
                  </div>
                  <div className="text-right">
                    {isPickup || isFreeByThreshold ? (
                      <span className="font-black text-sm text-green-600">FREE</span>
                    ) : m.collect ? (
                      <Badge className="bg-orange-600 text-white border-none font-black text-[10px] uppercase px-3 h-6 rounded-lg">
                        {isEn ? 'Freight Collect' : '運費到付'}
                      </Badge>
                    ) : (
                      <span className="font-black text-sm text-primary">${m.fee}</span>
                    )}
                  </div>
                </div>
                {selectedMethodId === m.id && isPointPickupType && (
                  <div className="mt-4 pt-4 border-t border-primary/10 animate-in slide-in-from-top-2">
                    {selectedPoint ? (
                      <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-primary/20 shadow-inner">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0"><MapPinned className="h-5 w-5" /></div>
                          <div className="min-w-0">
                             <p className="text-xs font-black truncate">{isEn ? selectedPoint.name_en : selectedPoint.name_zh}</p>
                             <div className="flex items-center gap-2 mt-1">
                                <p className="text-[10px] text-muted-foreground truncate">{isEn ? selectedPoint.address_en : selectedPoint.address_zh}</p>
                                {(selectedPoint.pickupLeadTimeMin !== undefined && selectedPoint.pickupLeadTimeMax !== undefined) && (
                                   <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-100 text-[9px] font-black h-5 flex items-center gap-1">
                                      <Clock className="h-3 w-3" /> 預計 {
                                        selectedPoint.pickupLeadTimeMin === selectedPoint.pickupLeadTimeMax 
                                          ? Number(selectedPoint.pickupLeadTimeMin)
                                          : `${Number(selectedPoint.pickupLeadTimeMin)}~${Number(selectedPoint.pickupLeadTimeMax)}`
                                      } 工作天
                                   </Badge>
                                )}
                             </div>
                          </div>
                        </div>
                        <button className="h-8 rounded-xl font-bold text-xs text-primary px-3 hover:bg-primary/5 transition-colors" onClick={() => { 
                          const n = (isEn ? m.name_en : m.name_zh) || "";
                          if(n.includes('順豐')) onOpenSf(); 
                          else if(n.includes('智')) onOpenHkPost(); 
                          else onOpenStore(); 
                        }}>更換</button>
                      </div>
                    ) : (
                      <Button className="w-full h-12 rounded-xl bg-white border-2 border-primary text-primary hover:bg-primary hover:text-white font-black" onClick={() => { 
                        const n = (isEn ? m.name_en : m.name_zh) || "";
                        if(n.includes('順豐')) onOpenSf(); 
                        else if(n.includes('智')) onOpenHkPost(); 
                        else onOpenStore(); 
                      }}><MapIcon className="h-4 w-4 mr-2" /> {isEn ? "Select Pickup Point/Branch" : "選擇取貨地點／分店"}</Button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </RadioGroup>
      </CardContent>
    </Card>
  );
}

/**
 * 5. 付款與折扣區塊
 */
export function PaymentDiscountSection({
  paymentMethod, setPaymentMethod, pointsToUse, setPointsToUse, maxPoints, loyaltyConfig, subtotal, shippingFee, autoDiscount, cashPayment, isPickup, t, 
  couponCode, setCouponCode, onApplyCoupon, isApplyingCoupon, appliedCoupon, balanceDue
}: any) {
  const { lang } = useI18n();
  const isEn = lang === 'en';
  const pointsToCashRatio = Number(loyaltyConfig?.pointsToCash) || 100;
  
  const maxSpendOffsetByRule = subtotal * 0.5;
  const remainingBeforePoints = Math.max(0, subtotal + shippingFee - autoDiscount - cashPayment);
  const maxSpendOffsetValue = Math.min(maxSpendOffsetByRule, remainingBeforePoints);
  const maxRedeemablePoints = Math.min(maxPoints, Math.floor(maxSpendOffsetValue * pointsToCashRatio));
  
  const filteredPaymentMethods = PAYMENT_METHODS.filter(method => {
    const isWebEnabled = (method as any).web !== false;
    const isStoreOnly = method.id === 'pay_in_store';
    return isWebEnabled && (isStoreOnly ? isPickup : true);
  });

  const isFullyCovered = balanceDue <= 0;
  
  return (
    <div className="space-y-8 animate-in fade-in">
      <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white border-l-4 border-primary">
        <CardHeader className="bg-primary/5 border-b py-5 px-6">
          <CardTitle className="text-base font-black uppercase flex items-center gap-2 text-primary">
            <Ticket className="h-5 w-5" /> {isEn ? "Promo Code / Cash Coupon" : "優惠代碼或現金券代號"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 space-y-4">
          {appliedCoupon ? (
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-2xl border-2 border-dashed border-green-200 animate-in zoom-in">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-green-500 text-white flex items-center justify-center shadow-sm">
                  <Check className="h-5 w-5" strokeWidth={4} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-green-700 tracking-widest">Applied 成功套用</p>
                  <p className="font-bold text-lg text-green-800 uppercase font-mono">{appliedCoupon.code}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm" onClick={() => onApplyCoupon("")} className="h-8 text-xs font-bold text-red-600 hover:bg-red-50">
                移除
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input 
                placeholder={isEn ? "Enter code..." : "輸入代碼..."} 
                className="h-12 bg-muted/20 border-none rounded-2xl font-black uppercase tracking-widest text-lg px-6" 
                value={couponCode || ""} 
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())} 
              />
              <Button 
                className="h-12 px-8 rounded-2xl font-black shadow-lg gap-2" 
                onClick={() => onApplyCoupon(couponCode)} 
                disabled={isApplyingCoupon || !couponCode?.trim()}
              >
                {isApplyingCoupon ? <Loader2 className="h-4 w-4 animate-spin" /> : (isEn ? "Apply" : "套用")}
              </Button>
            </div>
          )}
          <p className="text-[10px] text-muted-foreground italic ml-1">
            {isEn ? "* Only one code can be applied per order." : "* 每筆訂單僅限套用一個代碼。"}
          </p>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white border-l-4 border-amber-500">
        <CardHeader className="bg-amber-50/50 border-b py-5 px-6">
          <CardTitle className="text-base font-black uppercase flex items-center gap-2 text-amber-700">
            <Coins className="h-5 w-5 text-amber-700" /> {isEn ? "Member Points Redemption" : "會員積分抵扣"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          <div className="flex justify-between items-center bg-muted/20 p-4 rounded-2xl">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase text-muted-foreground">{isEn ? 'Available Points Balance' : '可用積分餘額'}</p>
              <p className="text-2xl font-black text-slate-800">{maxPoints} Pts</p>
            </div>
            <div className="text-right space-y-1">
              <p className="text-[10px] font-black uppercase text-muted-foreground">{isEn ? 'Estimated Points Offset' : '預計抵扣金額'}</p>
              <p className="text-2xl font-black text-amber-600">-${(pointsToUse / pointsToCashRatio).toFixed(1)}</p>
            </div>
          </div>
          <div className="space-y-4">
            <Slider value={[pointsToUse]} max={maxRedeemablePoints} step={pointsToCashRatio} onValueChange={(v) => setPointsToUse(v[0])} className="py-4" />
            <div className="flex justify-between text-[10px] font-bold text-muted-foreground uppercase">
              <span>0 Pts</span>
              <span>Max: {maxRedeemablePoints} Pts</span>
            </div>
          </div>
          <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 flex items-center gap-3">
            <Zap className="h-4 w-4 text-primary fill-current" />
            <p className="text-[11px] text-primary font-bold">
              {isEn ? `Every ${pointsToCashRatio} points = HK$1. Points are treated as cash offset during checkout.` : `每 ${pointsToCashRatio} 積分可抵扣 HK$1 現金。積分將作為支付抵扣使用。`}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className={cn("border-none shadow-sm rounded-3xl overflow-hidden bg-white border-l-4 transition-all", isFullyCovered ? "border-green-500" : "border-primary")}>
        <CardHeader className={cn("border-b py-5 px-6", isFullyCovered ? "bg-green-50/50" : "bg-primary/5")}>
          <CardTitle className={cn("text-base font-black uppercase flex items-center gap-2", isFullyCovered && "text-green-700")}>
            <CreditCard className="h-5 w-5" /> {isEn ? "Select Payment Method" : "選擇付款方式"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {isFullyCovered ? (
            <div className="p-10 text-center space-y-6 bg-green-50 rounded-[2.5rem] border-2 border-dashed border-green-200 animate-in zoom-in">
              <div className="h-20 w-20 bg-green-500 rounded-full flex items-center justify-center mx-auto text-white shadow-lg">
                <PartyPopper className="h-10 w-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-green-900">{isEn ? "Balance Fully Covered!" : "餘額已由積分/現金券全額支付"}</h3>
                <p className="text-sm text-green-800 font-medium">您不需要選擇其他付款方式。點擊下方「最後核對」即可完成訂單。</p>
              </div>
            </div>
          ) : (
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredPaymentMethods.map((method) => (
                <div key={method.id} className={cn("flex items-center space-x-3 p-4 border-2 rounded-2xl cursor-pointer transition-all", paymentMethod === method.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50 border-muted')} onClick={() => setPaymentMethod(method.id)}>
                  <RadioGroupItem value={method.id} id={method.id} />
                  <Label htmlFor={method.id} className="flex-1 cursor-pointer flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center text-primary shadow-sm"><method.icon className="h-4 w-4" /></div>
                    <span className="font-bold text-sm">{method.label}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}
          
          <Separator className="my-8 border-dashed" />
          <div className="p-5 bg-blue-50 rounded-[1.5rem] border border-blue-100 flex items-start gap-3 shadow-sm">
            <ShieldCheck className="h-5 w-5 text-blue-600 mt-0.5" />
            <p className="text-xs text-blue-800 leading-relaxed font-medium">
              {isEn 
                ? "Your payment info is processed with professional third-party encryption. We do not store your full credit card details, to maximize transaction security."
                : "您的支付資訊將透過第三方專業的加密技術處理。我們不會儲存您的完整信用卡資料，以最大程度確保交易安全。"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * 6. 最後核對區塊
 */
export function OrderReviewSection({
  contactData, shippingAddress, billingAddress, selectedMethodName, selectedPoint, paymentMethod, selectedItems, subscribeNewsletter, setSubscribeNewsletter, saveAddressToAccount, setSaveAddressToAccount, isLoggedIn = false, agreedToTerms, setAgreedToTerms, isEn, t, balanceDue,
  packagingPreference, setPackagingPreference
}: any) {
  const db = useFirestore();
  const [stockIssues, setStockIssues] = useState<string[]>([]);
  const [isValidating, setIsValidating] = useState(true);
  
  useEffect(() => {
    const validateStock = async () => {
      setIsValidating(true); const issues: string[] = [];
      try {
        const itemIds = selectedItems.map((it: any) => it.id);
        const q = query(collection(db!, 'public_products'), where('__name__', 'in', itemIds));
        const snap = await getDocs(q);
        snap.docs.forEach(doc => {
          const pData = doc.data(); const cartItem = selectedItems.find((it: any) => it.id === doc.id);
          if (cartItem && pData.inventoryPolicy === 'Deny') { const available = Number(pData.onlineStock) || 0; if (available < cartItem.qty) issues.push(pData.productName_zh || cartItem.name); }
        });
      } catch (e: any) { 
        console.error(e); 
      }
      setStockIssues(issues); setIsValidating(false);
    };
    if (selectedItems.length > 0) validateStock();
  }, [selectedItems, db]);

  const currentMethod = balanceDue <= 0 
    ? { label: isEn ? "Full Credits Redemption" : "全額抵扣支付", icon: Sparkles }
    : (PAYMENT_METHODS.find(m => m.id === paymentMethod) || { label: paymentMethod, icon: CreditCard });

  // 核心邏輯：計算訂單中所有貨品的最晚預購到貨日
  const latestPreOrderDate = useMemo(() => {
    const preOrderItems = selectedItems.filter((it: any) => it.inventoryPolicy === 'PreOrder' && it.preOrderExpectedDate);
    if (preOrderItems.length === 0) return null;
    
    return preOrderItems.reduce((latest: string, current: any) => {
      if (!latest) return current.preOrderExpectedDate;
      try {
        return isAfter(parseISO(current.preOrderExpectedDate), parseISO(latest)) 
          ? current.preOrderExpectedDate 
          : latest;
      } catch (e) { return latest; }
    }, "");
  }, [selectedItems]);

  // 核心邏輯：偵測訂單中是否包含「追加貨品」 ( Allow Overselling 且 qty > availableStock )
  const hasBackorderedItems = useMemo(() => {
    return selectedItems.some((it: any) => it.inventoryPolicy === 'Allow' && it.qty > it.availableStock);
  }, [selectedItems]);

  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500 pb-20">
      {stockIssues.length > 0 && (<div className="p-6 bg-red-600 text-white rounded-[2rem] shadow-xl flex items-start gap-4 animate-in zoom-in-95"><AlertTriangle className="h-8 w-8 shrink-0 animate-pulse" /><div className="space-y-1"><h4 className="font-black uppercase text-sm tracking-widest">{isEn ? 'Stock Alert' : '庫庫存變動警告'}</h4><p className="text-sm font-medium leading-relaxed">{isEn ? 'Sorry, the following items just sold out or have insufficient stock:' : '很抱議，以下貨品剛剛已被搶購一空或庫庫存不足：'}<br/><span className="font-black">{stockIssues.join(", ")}</span><br/>{isEn ? 'Please return to cart to adjust.' : '請返回購物車調整數量。'}</p><Button asChild variant="outline" size="sm" className="mt-2 bg-white text-red-600 border-none font-bold rounded-xl h-8"><Link href="/cart">{isEn ? 'Back to Cart' : '返回購物車'}</Link></Button></div></div>)}
      
      {/* 預購合併出貨公告 */}
      {latestPreOrderDate && (
        <Card className="border-none shadow-xl bg-indigo-600 text-white rounded-[2.5rem] overflow-hidden animate-in zoom-in duration-500">
          <CardContent className="p-8 flex items-start gap-6">
            <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center text-white shrink-0 shadow-lg border border-white/20">
              <Truck className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h4 className="text-lg font-black font-headline tracking-tight">合併出貨特別通知 (Shipping Note)</h4>
              <p className="text-sm text-indigo-50 font-medium leading-relaxed">
                {isEn 
                  ? `This order contains pre-order items. The entire order will be shipped together once all items are available (Estimated after ${latestPreOrderDate}).` 
                  : `您的訂單內包含預購貨品，整張訂單將會於所有貨品到齊後（預計 ${latestPreOrderDate} 後）一併發貨。`}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 追加貨品延遲通知 (NEW) */}
      {hasBackorderedItems && (
        <Card className="border-none shadow-xl bg-orange-600 text-white rounded-[2.5rem] overflow-hidden animate-in zoom-in duration-500">
           <CardContent className="p-8 flex items-start gap-6">
              <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center text-white shrink-0 shadow-lg border border-white/20">
                <Clock className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h4 className="text-lg font-black font-headline tracking-tight">{isEn ? "Delivery Extension Notice" : "配送延遲通知"}</h4>
                <p className="text-sm text-orange-50 font-medium leading-relaxed">
                  {isEn 
                    ? "This order contains backordered items, delivery may be delayed." 
                    : "此訂單包含追加貨品，配送時間可能延長。"}
                </p>
              </div>
           </CardContent>
        </Card>
      )}

      <Card className="border-none shadow-sm rounded-[2.5rem] overflow-hidden bg-white">
        <CardHeader className="bg-muted/10 border-b py-6 px-8">
          <CardTitle className="text-xl font-black flex items-center gap-3">
            {isValidating ? <Loader2 className="h-6 w-6 animate-spin" /> : <CheckCircle2 className="h-6 w-6 text-primary" />} 
            {isEn ? "Final Order Review" : "訂單資料最終核對"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 space-y-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-8">
              <section className="space-y-3">
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                  <User className="h-3.5 w-3.5" /> {isEn ? "Contact & Billing Details" : "聯絡資訊與賬單"}
                </p>
                <div className="p-5 bg-muted/20 rounded-2xl border border-dashed text-sm font-bold space-y-3">
                  <div className="space-y-1">
                    <p className="text-base font-black text-slate-900">{contactData.lastName} {contactData.firstName}</p>
                    <p className="text-xs text-muted-foreground font-medium">{contactData.phone} • {contactData.email}</p>
                  </div>
                  <Separator className="opacity-50" />
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase opacity-60">{isEn ? 'Billing Address' : '賬單地址 Billing'}</p>
                    <p className="text-xs font-bold leading-relaxed">{billingAddress.area}, {billingAddress.district}<br/>{billingAddress.building}</p>
                  </div>
                </div>
              </section>
              <section className="space-y-3">
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                  <Truck className="h-3.5 w-3.5" /> {isEn ? 'Shipping Details' : '運送詳情 (Shipping)'}
                </p>
                <div className="p-5 bg-muted/20 rounded-2xl border border-dashed space-y-3">
                  <p className="font-black text-primary flex items-center gap-2">{selectedMethodName}</p>
                  {selectedPoint && (
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-primary/10">
                      <div className="flex items-center justify-between mb-2">
                         <p className="text-xs font-black text-slate-800">{isEn ? selectedPoint.name_en : selectedPoint.name_zh}</p>
                         {(selectedPoint.pickupLeadTimeMin !== undefined && selectedPoint.pickupLeadTimeMax !== undefined) && (
                            <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-100 text-[9px] font-black h-5 flex items-center gap-1">
                               <Clock className="h-3 w-3" /> 預計 {
                                 Number(selectedPoint.pickupLeadTimeMin) === Number(selectedPoint.pickupLeadTimeMax) 
                                   ? Number(selectedPoint.pickupLeadTimeMin)
                                   : `${Number(selectedPoint.pickupLeadTimeMin)}~${Number(selectedPoint.pickupLeadTimeMax)}`
                               } 工作天
                            </Badge>
                         )}
                      </div>
                      <p className="text-[10px] text-muted-foreground leading-relaxed italic">{isEn ? selectedPoint.address_en : selectedPoint.address_zh}</p>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground leading-relaxed pt-1">
                    {shippingAddress.area}, {shippingAddress.district}, {shippingAddress.subDistrict}<br/>
                    {shippingAddress.building}, {shippingAddress.street}{shippingAddress.floor && `, ${shippingAddress.floor}/F`}{shippingAddress.flat && `, Flat ${shippingAddress.flat}`}
                  </p>
                </div>
              </section>
            </div>
            <div className="space-y-8">
              <section className="space-y-3">
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                  <CreditCard className="h-3.5 w-3.5" /> {isEn ? 'Payment Details' : '支付詳情'}
                </p>
                <div className="p-5 bg-primary/5 rounded-2xl border-2 border-primary/20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center text-primary shadow-sm"><currentMethod.icon className="h-4 w-4" /></div>
                    <span className="font-black text-primary text-base">
                      {currentMethod.label}
                    </span>
                  </div>
                  <Badge variant="outline" className="bg-white text-primary border-primary/20 text-[10px] font-bold uppercase">Ready</Badge>
                </div>
              </section>
              <section className="space-y-3">
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                  <ShoppingBag className="h-3.5 w-3.5" /> {isEn ? 'Order Items' : '訂購清單'} ({selectedItems.length})
                </p>
                <ScrollArea className="h-44 p-4 bg-muted/20 rounded-2xl border border-dashed shadow-inner">
                  <div className="space-y-4">
                    {selectedItems.map((it: any) => (
                      <div key={it.id} className="flex justify-between items-start gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                             <p className="text-xs font-bold truncate">{it.name}</p>
                             {it.qty > it.availableStock && it.inventoryPolicy === 'Allow' && (
                               <Badge className="bg-orange-100 text-orange-700 border-none text-[8px] h-4 font-black">BACKORDER</Badge>
                             )}
                          </div>
                          <p className="text-[10px] text-muted-foreground font-medium flex items-center gap-2">
                            x{it.qty}
                            {it.inventoryPolicy === 'PreOrder' && it.preOrderExpectedDate && (
                              <Badge variant="outline" className="text-[8px] h-3 px-1 border-indigo-200 text-indigo-700 bg-white">
                                ARRIVAL: {it.preOrderExpectedDate}
                              </Badge>
                            )}
                          </p>
                        </div>
                        <span className="font-black text-xs text-slate-800">${(it.price * it.qty).toFixed(1)}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </section>
            </div>
          </div>
          
          <Separator className="border-dashed" />
          
          <div className="space-y-8 max-w-2xl mx-auto">
            {/* 緊湊型包裝偏好選取區塊 */}
            <div className="p-5 bg-white border-2 border-green-600/20 rounded-[2rem] space-y-4 shadow-sm">
              <div className="flex items-center gap-2 px-1">
                <Leaf className="h-4 w-4 text-green-600" />
                <span className="text-[10px] font-black uppercase text-green-800 tracking-widest">
                  {isEn ? "Packaging Preference" : "出貨包裝偏好"}
                </span>
              </div>
              <RadioGroup value={packagingPreference} onValueChange={setPackagingPreference} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div 
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all",
                    packagingPreference === 'eco' ? "border-green-600 bg-green-50 ring-1 ring-green-600/10" : "border-muted hover:border-green-100"
                  )}
                  onClick={() => setPackagingPreference('eco')}
                >
                  <RadioGroupItem value="eco" id="pkg-eco" className="shrink-0" />
                  <div className="min-w-0">
                    <Label htmlFor="pkg-eco" className="text-xs font-bold cursor-pointer block leading-tight">
                      {isEn ? "Eco-friendly" : "環保出貨 (Eco)"}
                    </Label>
                    <p className="text-[9px] text-muted-foreground truncate">優先使用循環包材</p>
                  </div>
                </div>
                
                <div 
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all",
                    packagingPreference === 'new' ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600/10" : "border-muted hover:border-blue-100"
                  )}
                  onClick={() => setPackagingPreference('new')}
                >
                  <RadioGroupItem value="new" id="pkg-new" className="shrink-0" />
                  <div className="min-w-0">
                    <Label htmlFor="pkg-new" className="text-xs font-bold cursor-pointer block leading-tight">
                      {isEn ? "Brand New Box" : "全新包裝 (New)"}
                    </Label>
                    <p className="text-[9px] text-muted-foreground truncate">使用全新 SHOP POINT 紙箱</p>
                  </div>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-4">
              <div className="flex items-start space-x-3 p-5 bg-primary/5 rounded-2xl border border-primary/10 shadow-sm transition-all hover:bg-primary/10">
                <Checkbox id="newsletter-sub" checked={subscribeNewsletter} onCheckedChange={(v) => setSubscribeNewsletter(!!v)} className="mt-1" />
                <Label htmlFor="newsletter-sub" className="text-xs font-bold leading-relaxed cursor-pointer text-slate-700">
                  {isEn ? "I would like to receive the latest product info and member offers." : "我想收到 SHOP POINT 的最新產品資訊及專屬會員優惠。"}
                </Label>
              </div>
              <div className="flex items-start space-x-3 p-5 bg-muted/10 rounded-2xl border border-muted-foreground/10">
                <Checkbox id="terms-agreed" checked={agreedToTerms} onCheckedChange={(v) => setAgreedToTerms(!!v)} className="mt-1" />
                <Label htmlFor="terms-agreed" className="text-xs font-bold leading-relaxed cursor-pointer text-muted-foreground">
                  {isEn ? "I have read and agree to the SHOP POINT " : "我已閱讀並同意 SHOP POINT 的 "} 
                  <Link href="/terms" className="text-primary underline">{isEn ? 'Terms of Service' : '服務條款'}</Link> 
                  {isEn ? " and " : " 與 "} 
                  <Link href="/privacy" className="text-primary underline">{isEn ? 'Privacy Policy' : '私隱政策'}</Link>。
                </Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * 7. 結帳摘要區塊
 */
export function CheckoutSummary({ 
  items, subtotal, shippingFee, total, balanceDue, isPickup, pointsDiscount = 0, autoDiscount = 0, cashPayment = 0, appliedPromos = [], isFreightCollect = false, expectedPoints = 0,
  methodSelected = false, isLoggedIn = false
}: { 
  items: any[], subtotal: number, shippingFee: number, total: number, balanceDue: number, isPickup?: boolean, pointsDiscount?: number, autoDiscount?: number, cashPayment?: number, appliedPromos?: any[], isFreightCollect?: boolean, expectedPoints?: number,
  methodSelected?: boolean, isLoggedIn?: boolean
}) {
  const { lang, t } = useI18n();
  const isEn = lang === 'en';

  // 核心偵測：是否包含追加貨品
  const hasBackorderedItems = useMemo(() => {
    return items.some((it: any) => it.inventoryPolicy === 'Allow' && it.qty > it.availableStock);
  }, [items]);

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
            {items.map((item) => (
              <div key={item.id} className="flex gap-4 group">
                <div className="h-14 w-14 rounded-xl bg-muted relative overflow-hidden shrink-0 border shadow-inner">
                  {item.image ? (
                    <Image src={item.image} alt={item.name} fill className="object-cover" />
                  ) : (
                    <div className="flex items-center justify-center h-full opacity-10"><Package className="h-6 w-6" /></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black text-primary uppercase truncate">{item.brand}</p>
                  <p className="text-xs font-bold truncate pr-4">{item.name}</p>
                  <p className="text-[10px] text-muted-foreground flex items-center gap-1.5 flex-wrap">
                    Qty: {item.qty} × ${item.price}
                    {item.inventoryPolicy === 'PreOrder' && item.preOrderExpectedDate && (
                      <Badge variant="outline" className="text-[8px] h-3 px-1 border-indigo-200 text-indigo-700 bg-white">
                        {item.preOrderExpectedDate}
                      </Badge>
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* 摘要追加提示 (NEW) */}
        {hasBackorderedItems && (
           <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 flex items-start gap-3 animate-in shake-in-y duration-1000">
              <Clock className="h-4 w-4 text-orange-600 shrink-0 mt-0.5" />
              <p className="text-[10px] text-orange-800 font-bold leading-relaxed">
                {isEn 
                  ? "Quantity exceeds stock, delivery may be delayed" 
                  : "訂購超過存貨數量，配送時間可能延長"}
              </p>
           </div>
        )}

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

          {autoDiscount > 0 && (
            <div className="space-y-2 pt-2 animate-in slide-in-from-right-2">
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest opacity-60">{isEn ? 'Campaign Discounts' : '促銷活動扣減'}:</p>
              {appliedPromos.filter((p:any) => !p.isPayment).map((p:any, idx:number) => (
                <div key={idx} className="flex justify-between items-center text-green-600 font-bold text-xs">
                  <span className="flex items-center gap-1"><Ticket className="h-3 w-3" /> {p.displayName}</span>
                  <span>-${Number(p.discount || 0).toFixed(1)}</span>
                </div>
              ))}
            </div>
          )}

          <Separator className="border-dashed" />
          
          <div className="flex justify-between items-center pt-2">
            <span className="text-base font-black uppercase">{t.cart.total}</span>
            <span className="text-2xl font-black text-slate-800">${total.toFixed(1)}</span>
          </div>

          {(cashPayment > 0 || pointsDiscount > 0) && (
            <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 space-y-3 animate-in zoom-in">
              <p className="text-[10px] font-black uppercase text-indigo-700 tracking-widest">{isEn ? 'Applied Credits' : '已付抵扣金額'}</p>
              
              {cashPayment > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-indigo-800 flex items-center gap-2">
                    <CreditCard className="h-3.5 w-3.5" /> {isEn ? 'Cash Coupons' : '已付現金券'}
                  </span>
                  <span className="font-black text-indigo-800">-${cashPayment.toFixed(1)}</span>
                </div>
              )}

              {pointsDiscount > 0 && (
                <div className="flex justify-between items-center border-t border-indigo-200/50 pt-2">
                  <span className="text-xs font-bold text-amber-700 flex items-center gap-2">
                    <Coins className="h-3.5 w-3.5" /> {isEn ? 'Points Applied' : '積分抵扣'}
                  </span>
                  <span className="font-black text-amber-700">-${pointsDiscount.toFixed(1)}</span>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between items-center pt-4 border-t-2 border-black">
            <span className="text-base font-black uppercase text-orange-600">{isEn ? 'Balance Due' : '最後應付餘額'}</span>
            <span className="text-4xl font-black text-orange-600 tracking-tighter">${balanceDue.toFixed(1)}</span>
          </div>
        </div>

        {/* 獎勵預覽：誘發註冊動機 */}
        <div className={cn(
          "p-4 rounded-2xl border-2 flex items-center justify-between animate-in slide-in-from-bottom-2",
          isLoggedIn ? "bg-indigo-50 border-indigo-100" : "bg-primary/5 border-primary/20 border-dashed"
        )}>
          <div className="flex items-center gap-3">
            <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shadow-sm", isLoggedIn ? "bg-indigo-600 text-white" : "bg-white text-primary")}>
               <Coins className="h-5 w-5" />
            </div>
            <div>
               <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{isEn ? 'Points Reward' : '預計賺取積分'}</p>
               <p className={cn("font-black text-lg", isLoggedIn ? "text-indigo-700" : "text-primary")}>+{expectedPoints} Pts</p>
            </div>
          </div>
          {!isLoggedIn && (
            <LoginDialog trigger={
              <Button size="sm" className="h-8 rounded-lg bg-primary text-primary-foreground font-black text-[10px] uppercase shadow-md">
                登入領取
              </Button>
            } />
          )}
        </div>

        <div className="p-4 bg-muted/20 rounded-2xl flex items-start gap-3">
          <ShieldCheck className="h-4 w-4 text-primary mt-0.5" />
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            {isEn ? "Your payment info is processed with professional third-party encryption. We do not store your full credit card details." : "您的支付資訊將透過第三方專業的加密技術處理。我們不會儲存您的完整信用卡資料。"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
