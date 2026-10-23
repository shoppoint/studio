
"use client";

import React, { useMemo, useState, useEffect } from "react";
import { Truck, MapPin, Hash, MapPinned, Map as MapIcon, User, Globe, Store, Mail, Phone, Building2, Loader2, Info, Crown, UserCircle, Plus, Trash2, PlusCircle } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LocationPickerDialog } from "@/components/checkout/LocationPickerDialog";
import { HK_ADDRESS_DATA, AREA_NAME_MAP, DISTRICT_NAME_MAP, SUB_DISTRICT_NAME_MAP, COUNTRIES, COUNTRY_NAME_MAP } from "@/lib/address-data";
import { useI18n } from "@/lib/i18n/i18n-context";

/**
 * 獨立的地址表單欄位組件
 */
function AddressFormFields({ type, data, onUpdate, addrT, isEditMode, isZh }: any) {
  const dOptions = useMemo(() => data?.area && HK_ADDRESS_DATA[data.area] ? Object.keys(HK_ADDRESS_DATA[data.area]) : [], [data?.area]);
  const sdOptions = useMemo(() => data?.area && data?.district && HK_ADDRESS_DATA[data.area] && HK_ADDRESS_DATA[data.area][data.district] ? HK_ADDRESS_DATA[data.area][data.district] : [], [data?.area, data?.district]);
  
  const handleFieldChange = (f: string, v: string) => {
    onUpdate(type, f, v);
  };

  if (!data) return null;

  return (
    <div className="space-y-4 p-6 bg-white rounded-3xl border shadow-sm">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="grid gap-1.5">
          <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">{addrT.country}</Label>
          <Select value={data.country || "Hong Kong"} onValueChange={v => handleFieldChange('country', v)} disabled={!isEditMode}>
            <SelectTrigger className="h-10 bg-muted/20 border-none rounded-xl font-bold"><SelectValue /></SelectTrigger>
            <SelectContent className="rounded-xl border-none shadow-2xl">
              {COUNTRIES.map(c=><SelectItem key={c} value={c}>{isZh?COUNTRY_NAME_MAP[c]||c:c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">{addrT.area}</Label>
          <Select value={data.area} onValueChange={v => handleFieldChange('area', v)} disabled={!isEditMode}>
            <SelectTrigger className="h-10 bg-muted/20 border-none rounded-xl font-bold"><SelectValue placeholder="Area" /></SelectTrigger>
            <SelectContent className="rounded-xl">
              {Object.keys(HK_ADDRESS_DATA).map(a=><SelectItem key={a} value={a}>{isZh?AREA_NAME_MAP[a]||a:a}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-1.5">
          <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">{addrT.district}</Label>
          <Select value={data.district} onValueChange={v => handleFieldChange('district', v)} disabled={!isEditMode || !data.area}>
            <SelectTrigger className="h-10 bg-muted/20 border-none rounded-xl font-bold"><SelectValue placeholder="District" /></SelectTrigger>
            <SelectContent className="rounded-xl">
              {dOptions.map(d=><SelectItem key={d} value={d}>{isZh?DISTRICT_NAME_MAP[d]||d:d}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-1.5">
          <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">{addrT.sub_district}</Label>
          <Select value={data.subDistrict} onValueChange={(val) => handleFieldChange('subDistrict', val)} disabled={!isEditMode || !data.district}>
            <SelectTrigger className="h-10 bg-muted/20 border-none rounded-xl font-bold"><SelectValue placeholder="Sub" /></SelectTrigger>
            <SelectContent className="rounded-xl">
              {sdOptions.map(s=><SelectItem key={s} value={s}>{isZh?SUB_DISTRICT_NAME_MAP[s]||s:s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      <Separator className="border-dashed" />
      <div className="grid gap-4">
        <div className="grid gap-1.5">
          <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1 flex items-center gap-2">
            <Building2 className="h-3 w-3 text-primary" />
            {addrT.company_name}
          </Label>
          <Input value={data.companyName || ""} onChange={e => handleFieldChange('companyName', e.target.value)} disabled={!isEditMode} className="h-10 bg-muted/20 border-none rounded-xl" />
        </div>
        <div className="grid gap-1.5"><Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">{addrT.building}</Label><Input value={data.building || ""} onChange={e => handleFieldChange('building', e.target.value)} disabled={!isEditMode} className="h-10 bg-muted/20 border-none rounded-xl" /></div>
        <div className="grid gap-1.5"><Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">{addrT.street}</Label><Input value={data.street || ""} onChange={e => handleFieldChange('street', e.target.value)} disabled={!isEditMode} className="h-10 bg-muted/20 border-none rounded-xl" /></div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="grid gap-1.5"><Label className="text-[9px] font-bold text-center">{addrT.flat}</Label><Input value={data.flat || ""} onChange={e => handleFieldChange('flat', e.target.value)} disabled={!isEditMode} className="h-10 bg-muted/20 border-none rounded-xl text-center" /></div>
        <div className="grid gap-1.5"><Label className="text-[9px] font-bold text-center">{addrT.floor}</Label><Input value={data.floor || ""} onChange={e => handleFieldChange('floor', e.target.value)} disabled={!isEditMode} className="h-10 bg-muted/20 border-none rounded-xl text-center" /></div>
        <div className="grid gap-1.5"><Label className="text-[9px] font-bold text-center">{addrT.block}</Label><Input value={data.block || ""} onChange={e => handleFieldChange('block', e.target.value)} disabled={!isEditMode} className="h-10 bg-muted/20 border-none rounded-xl text-center" /></div>
      </div>
    </div>
  );
}

/**
 * 訂單詳情 - 物流與地址分頁
 */
export function LogisticsTab({ 
  order, isEditMode, trackingNo, setTrackingNo, 
  shippingAddress, setShippingAddress, 
  billingAddress, setBillingAddress, 
  contactData, setContactData, 
  selectedMethodId, setSelectedMethodId, 
  selectedPoint, setSelectedPoint, 
  shippingFee, setShippingFee, 
  zones, lang, memberData, locations
}: any) {
  const { t } = useI18n();
  const isEn = lang === 'en';
  const isZh = lang === 'zh-HK';

  const [isSfPickerOpen, setIsSfPickerOpen] = useState(false);
  const [isHkPostPickerOpen, setIsHkPostPickerOpen] = useState(false);
  const [isStorePickerOpen, setIsStorePickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");
  const [allSfLocations, setAllSfLocations] = useState<any[]>([]);
  const [allHkPostLocations, setAllHkPostLocations] = useState<any[]>([]);
  const [isLLoading, setIsLLoading] = useState(false);

  // 關鍵修正：不再在 useMemo 中過濾掉空字串，以允許新增輸入框顯示
  const trackingNumbers = useMemo(() => {
    if (!trackingNo) return [""];
    return trackingNo.split(',').map((s: string) => s.trim());
  }, [trackingNo]);

  useEffect(() => {
    if (!isEditMode) return;
    const loadLogisticsData = async () => {
      setIsLLoading(true);
      try {
        const sfPaths = ['/data/sf-locations-hk.json', '/data/sf-locations-kln.json', '/data/sf-locations-nt.json', '/data/sf-locations-nt-2.json', '/data/sf-locations-islands.json', '/data/sf-locations-extra.json'];
        const hkpPaths = ['/data/hkpost-locations-hk.json', '/data/hkpost-locations-kln.json', '/data/hkpost-locations-nt.json'];
        const safeFetch = async (p: string) => { try { const r = await fetch(p); return r.ok ? await r.json() : { locations: [] }; } catch { return { locations: [] }; } };
        const [sfRes, hkpRes] = await Promise.all([Promise.all(sfPaths.map(safeFetch)), Promise.all(hkpPaths.map(safeFetch))]);
        setAllSfLocations(sfRes.flatMap(r => r.locations || [])); 
        setAllHkPostLocations(hkpRes.flatMap(r => r.locations || []));
      } finally { setIsLLoading(false); }
    };
    loadLogisticsData();
  }, [isEditMode]);

  const availableMethods = useMemo(() => {
    if (!zones || zones.length === 0) return [];
    const targetCountry = (shippingAddress?.country || "Hong Kong").trim().toLowerCase();
    let zone = zones.find((z: any) => Array.isArray(z.countries) && z.countries.some((c: string) => c.trim().toLowerCase().includes(targetCountry)));
    if (!zone && targetCountry.includes('hong kong')) zone = zones.find((z: any) => z.name.toLowerCase().includes('hong kong'));
    if (!zone) zone = zones.find((z: any) => z.name.toLowerCase().includes('other') || z.name.toLowerCase().includes('international'));
    if (!zone || !zone.methods) return [];
    return Object.entries(zone.methods).filter(([_, config]: [string, any]) => config.enabled).map(([id, config]: [string, any]) => ({ id, ...config }));
  }, [zones, shippingAddress?.country]);

  const selectedMethod = useMemo(() => availableMethods.find((m: any) => m.id === selectedMethodId), [availableMethods, selectedMethodId]);

  const resolvedMethodDisplayName = useMemo(() => {
    if (selectedMethod) {
      return lang === 'en' ? (selectedMethod.name_en || selectedMethod.name) : (selectedMethod.name_zh || selectedMethod.name);
    }
    return order?.shippingMethodName || order?.shippingMethodId || "--";
  }, [selectedMethod, order, lang]);

  const handleMethodChange = (id: string) => {
    if (id !== selectedMethodId) {
      setSelectedMethodId(id);
      setSelectedPoint(null);
    }
  };

  const handleSelectPoint = (point: any, type: string) => {
    setSelectedPoint(point);
    const newAddr = { ...shippingAddress };
    const isEnMode = lang === 'en';

    if (type === 'store') {
       const locAddr = point.address || {};
       newAddr.area = locAddr.area || ""; 
       newAddr.district = locAddr.district || ""; 
       newAddr.subDistrict = locAddr.subDistrict || "";
       newAddr.street = (isEnMode ? locAddr.street_en : locAddr.street_zh) || "";

       let bld = (isEnMode ? locAddr.building_en : locAddr.building_zh) || "";
       if (point.gmcStoreCode) bld = `[${point.gmcStoreCode}] ${bld}`;
       newAddr.building = bld;

       newAddr.floor = (isEnMode ? locAddr.floor_en : locAddr.floor_zh) || "";
       newAddr.flat = (isEnMode ? locAddr.flat_en : locAddr.flat_zh) || "";
       newAddr.block = (isEnMode ? locAddr.block_en : locAddr.block_zh) || "";
    } else {
       newAddr.area = point.area_zh || point.area_en;
       newAddr.district = point.district_zh || point.district_en;
       newAddr.building = `[${point.code}] ` + (isEnMode ? point.name_en : point.name_zh);
       newAddr.street = isEnMode ? point.address_en : point.address_zh;
       newAddr.subDistrict = ""; newAddr.floor = ""; newAddr.flat = ""; newAddr.block = "";
    }
    setShippingAddress(newAddr);
    setIsSfPickerOpen(false); setIsHkPostPickerOpen(false); setIsStorePickerOpen(false);
  };

  const handleAddrUpdate = (type: 'shipping' | 'billing', field: string, val: any) => {
    if (type === 'shipping') setShippingAddress((p:any) => ({ ...p, [field]: val }));
    else setBillingAddress((p:any) => ({ ...p, [field]: val }));
  };

  const updateTrackingNumber = (index: number, value: string) => {
    const list = [...trackingNumbers];
    list[index] = value;
    setTrackingNo(list.join(', '));
  };

  const addTrackingNumber = () => {
    setTrackingNo((prev: string) => {
      const base = prev ? prev.trim() : "";
      if (base && !base.endsWith(',')) return `${base}, `;
      return base + " ";
    });
  };

  const removeTrackingNumber = (index: number) => {
    const list = trackingNumbers.filter((_:any, i:number) => i !== index);
    setTrackingNo(list.join(', '));
  };

  return (
    <div className="space-y-12 animate-in fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="space-y-8">
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase text-primary tracking-widest flex items-center gap-2"><Truck className="h-4 w-4" /> 配送方式與單號</h4>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">配送渠道 (Method)</Label>
                {isEditMode ? (
                  <Select value={selectedMethodId || "none"} onValueChange={handleMethodChange}>
                    <SelectTrigger className="h-11 bg-muted/20 border-none rounded-xl font-bold"><SelectValue placeholder="選擇運送方式" /></SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-2xl">
                      {availableMethods.length === 0 ? (
                        <div className="p-6 text-center space-y-2">
                          <p className="text-xs text-muted-foreground italic">目前區域無配送方式</p>
                        </div>
                      ) : availableMethods.map((m: any) => (
                        <SelectItem key={m.id} value={m.id}>{isEn ? (m.name_en || m.name) : (m.name_zh || m.name)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : <div className="h-11 flex items-center px-4 bg-muted/20 rounded-xl font-bold">{resolvedMethodDisplayName}</div>}
              </div>
              
              {isEditMode && selectedMethodId && (selectedMethod?.isPickup || selectedMethod?.name_zh?.includes("站") || selectedMethod?.name_zh?.includes("智") || selectedMethod?.name_zh?.includes("櫃") || selectedMethod?.name_en?.includes("SF") || selectedMethod?.name_en?.includes("iPostal")) && (
                <div className="mt-4 pt-4 border-t border-primary/10 animate-in slide-in-from-top-2">
                  {selectedPoint ? (
                    <div className="flex items-center justify-between p-4 bg-white rounded-2xl border border-primary/20 shadow-inner">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0"><MapPinned className="h-5 w-5" /></div>
                        <div className="min-w-0"><p className="text-xs font-black truncate">{isEn ? selectedPoint.name_en : selectedPoint.name_zh}</p><p className="text-[10px] text-muted-foreground mt-1">{isEn ? selectedPoint.address_en : selectedPoint.address_zh}</p></div>
                      </div>
                      <button className="h-8 rounded-xl font-bold text-xs text-primary px-3 hover:bg-primary/5 transition-colors" onClick={() => { 
                        const n = (isEn ? selectedMethod?.name_en : selectedMethod?.name_zh) || "";
                        if(n.includes('順豐')) setIsSfPickerOpen(true); 
                        else if(n.includes('智')) setIsHkPostPickerOpen(true); 
                        else setIsStorePickerOpen(true); 
                      }}>更換</button>
                    </div>
                  ) : (
                    <Button className="w-full h-11 rounded-xl bg-white border-2 border-primary text-primary hover:bg-primary hover:text-white font-black" onClick={() => { 
                      const n = (isEn ? selectedMethod?.name_en : selectedMethod?.name_zh) || "";
                      if(n.includes('順豐')) setIsSfPickerOpen(true); 
                      else if(n.includes('智')) setIsHkPostPickerOpen(true); 
                      else setIsStorePickerOpen(true); 
                    }}><MapIcon className="h-4 w-4 mr-2" /> 選擇收貨地點／分店</Button>
                  )}
                </div>
              )}

              <div className="grid gap-3">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">物流追蹤號碼 (Tracking Nos.)</Label>
                <div className="space-y-2">
                  {trackingNumbers.map((num: string, idx: number) => (
                    <div key={idx} className="flex gap-2 animate-in slide-in-from-left-2">
                      <div className="relative flex-1">
                        <Hash className="absolute left-3 top-3 h-4 w-4 opacity-40" />
                        <Input 
                          value={num} 
                          onChange={e => updateTrackingNumber(idx, e.target.value)} 
                          disabled={!isEditMode} 
                          className="pl-9 h-11 bg-muted/20 border-none rounded-xl font-mono text-indigo-700 font-bold" 
                          placeholder={isEn ? `Tracking No. ${idx+1}` : `快遞單號 ${idx+1}`} 
                        />
                      </div>
                      {isEditMode && (
                        <Button variant="ghost" size="icon" className="h-11 w-11 text-destructive hover:bg-red-50 rounded-xl" onClick={() => removeTrackingNumber(idx)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {isEditMode && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="rounded-xl border-dashed h-9 w-full font-bold gap-2 text-muted-foreground"
                      onClick={addTrackingNumber}
                    >
                      <Plus className="h-3.5 w-3.5" /> 增加另一組追蹤號碼
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid gap-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">實收物流費用 ($)</Label>
                <div className="relative"><span className="absolute left-3 top-3 text-xs opacity-40">$</span><Input type="number" value={shippingFee} onChange={e => setShippingFee(e.target.value)} disabled={!isEditMode} className="pl-7 h-11 bg-muted/20 border-none rounded-xl font-bold" /></div>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <h4 className="text-xs font-black uppercase text-muted-foreground flex items-center gap-2 tracking-widest"><User className="h-4 w-4" /> 顧客聯絡資料</h4>
            <div className="p-6 bg-muted/10 rounded-[2rem] space-y-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-white border flex items-center justify-center font-bold text-xs shadow-sm">
                    {contactData.lastName?.charAt(0) || "G"}
                  </div>
                  <div>
                    <p className="font-bold text-sm">{contactData.lastName} {contactData.firstName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {(!memberData || memberData.role === 'Guest') ? (
                        <Badge variant="secondary" className="text-[8px] font-black uppercase border-none h-4 px-2 bg-slate-200 text-slate-600">
                          <UserCircle className="h-2 w-2 mr-1" /> Guest 訪客
                        </Badge>
                      ) : (
                        <>
                          <Badge variant="outline" className="text-[8px] font-black uppercase border-primary/20 text-primary h-4 px-2">Member</Badge>
                          {memberData?.tier && (
                            <Badge className={cn(
                              "text-[8px] font-black uppercase border-none h-4 px-2 gap-1",
                              memberData.tier === 'platinum' ? "bg-slate-900 text-white" : 
                              memberData.tier === 'gold' ? "bg-amber-400 text-amber-950" : 
                              "bg-slate-200 text-slate-700"
                            )}>
                              <Crown className="h-2.5 w-2.5" />
                              {t.profile.tiers[memberData.tier as keyof typeof t.profile.tiers] || memberData.tier}
                            </Badge>
                          )}
                          <Badge className={cn(
                            "text-[8px] font-black uppercase border-none h-4 px-2 text-white",
                            memberData.role === 'Superadmin' ? "bg-red-600" : 
                            memberData.role === 'Vendor' ? "bg-indigo-600" : 
                            "bg-blue-600"
                          )}>
                            {memberData.role}
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <Separator className="border-white/20" />
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="text-[10px] font-bold">姓氏 Last Name</Label>
                  <Input value={contactData.lastName || ""} onChange={e => setContactData({...contactData, lastName: e.target.value})} disabled={!isEditMode} className="h-10 bg-white" />
                </div>
                <div className="grid gap-2">
                  <Label className="text-[10px] font-bold">名字 First Name</Label>
                  <Input value={contactData.firstName || ""} onChange={e => setContactData({...contactData, firstName: e.target.value})} disabled={!isEditMode} className="h-10 bg-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2"><Label className="text-[10px] font-bold">電話 Phone</Label><Input value={contactData.phone || ""} onChange={e => setContactData({...contactData, phone: e.target.value})} disabled={!isEditMode} className="h-10 bg-white" /></div>
                <div className="grid gap-2"><Label className="text-[10px] font-bold">電郵 Email</Label><Input value={contactData.email || ""} onChange={e => setContactData({...contactData, email: e.target.value})} disabled={!isEditMode} className="h-10 bg-white" /></div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase text-primary flex items-center gap-3 tracking-widest"><MapPin className="h-4 w-4" /> 收貨地址 Shipping Address</h4>
            <AddressFormFields type="shipping" data={shippingAddress} onUpdate={handleAddrUpdate} addrT={t.checkout.address_fields} isEditMode={isEditMode} isZh={isZh} />
          </div>
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase text-muted-foreground flex items-center gap-3 tracking-widest"><Building2 className="h-4 w-4" /> 賬單地址 Billing Address</h4>
            <AddressFormFields type="billing" data={billingAddress} onUpdate={handleAddrUpdate} addrT={t.checkout.address_fields} isEditMode={isEditMode} isZh={isZh} />
          </div>
        </div>
      </div>
      
      {isEditMode && (
        <>
          <LocationPickerDialog isOpen={isSfPickerOpen} onOpenChange={setIsSfPickerOpen} title="選擇順豐網點" data={allSfLocations} onSelect={p => handleSelectPoint(p, 'sf')} search={pickerSearch} onSearchChange={setPickerSearch} isEn={isEn} isLoading={isLLoading} />
          <LocationPickerDialog isOpen={isHkPostPickerOpen} onOpenChange={setIsHkPostPickerOpen} title="選擇智郵站" data={allHkPostLocations} onSelect={p => handleSelectPoint(p, 'hkpost')} search={pickerSearch} onSearchChange={setPickerSearch} isEn={isEn} isLoading={isLLoading} />
          <LocationPickerDialog isOpen={isStorePickerOpen} onOpenChange={setIsStorePickerOpen} title="選擇取貨分店" data={locations?.filter((l: any) => l.isPickupEnabled).map((l: any) => ({ ...l, code: l.gmcStoreCode || l.id })) || []} onSelect={p => handleSelectPoint(p, 'store')} search={pickerSearch} onSearchChange={setPickerSearch} isEn={isEn} />
        </>
      )}
    </div>
  );
}
