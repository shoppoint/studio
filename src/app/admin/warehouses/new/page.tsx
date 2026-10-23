"use client";

import { useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  Warehouse, 
  MapPin, 
  Truck, 
  Store,
  Phone,
  Clock,
  Plus, 
  Trash2,
  Calendar as CalendarIcon,
  CheckCircle2,
  Eye,
  EyeOff,
  Globe,
  Coins,
  Zap,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useI18n } from "@/lib/i18n/i18n-context";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { useFirestore } from "@/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { HK_ADDRESS_DATA, AREA_NAME_MAP, DISTRICT_NAME_MAP, SUB_DISTRICT_NAME_MAP, COUNTRIES, COUNTRY_NAME_MAP } from "@/lib/address-data";

type WeekDay = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
const DAYS_ORDER: WeekDay[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function NewWarehousePage() {
  const router = useRouter();
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const db = useFirestore();
  const isZh = lang === 'zh-HK';

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("zh");
  const [addressTab, setAddressTab] = useState("zh");

  const [formData, setFormData] = useState({
    name_en: "",
    name_zh: "",
    type: "online",
    isDefaultFulfillmentSource: false,
    isVisible: true,
    isPickupEnabled: false, 
    payoutType: "fixed",    
    payoutValue: 0,        
    pickupLeadTimeMin: 1,    
    pickupLeadTimeMax: 3,    
    status: "Active",
    phone: "",
    gmcStoreCode: "", 
    weeklyHours: {
      monday: { isOpen: true, open: "09:00", close: "18:00" },
      tuesday: { isOpen: true, open: "09:00", close: "18:00" },
      wednesday: { isOpen: true, open: "09:00", close: "18:00" },
      thursday: { isOpen: true, open: "09:00", close: "18:00" },
      friday: { isOpen: true, open: "09:00", close: "18:00" },
      saturday: { isOpen: true, open: "10:00", close: "16:00" },
      sunday: { isOpen: false, open: "00:00", close: "00:00" }
    },
    specialHours: [] as any[],
    address: {
      area: "",
      district: "",
      subDistrict: "",
      street_en: "",
      street_zh: "",
      building_en: "",
      building_zh: "",
      block_en: "",
      block_zh: "",
      floor_en: "",
      floor_zh: "",
      flat_en: "",
      flat_zh: ""
    }
  });

  const districtOptions = useMemo(() => {
    if (!formData.address.area || !HK_ADDRESS_DATA[formData.address.area]) return [];
    return Object.keys(HK_ADDRESS_DATA[formData.address.area]);
  }, [formData.address.area]);

  const subDistrictOptions = useMemo(() => {
    if (!formData.address.area || !formData.address.district) return [];
    return HK_ADDRESS_DATA[formData.address.area][formData.address.district] || [];
  }, [formData.address.area, formData.address.district]);

  const handleAddressChange = (field: string, value: string) => {
    setFormData(prev => {
      const newAddress = { ...prev.address, [field]: value };
      if (field === 'area') { newAddress.district = ""; newAddress.subDistrict = ""; }
      if (field === 'district') { newAddress.subDistrict = ""; }
      return { ...prev, address: newAddress };
    });
  };

  const handleWeeklyHourChange = (day: WeekDay, field: 'isOpen' | 'open' | 'close', value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      weeklyHours: {
        ...prev.weeklyHours,
        [day]: { ...prev.weeklyHours[day], [field]: value }
      }
    }));
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!formData.name_en && !formData.name_zh) {
      toast({ title: "Name Required", description: "Please enter at least one language for warehouse name.", variant: "destructive" });
      return;
    }

    setLoading(true);
    const locationsRef = collection(db, 'locations');
    const dataToSave = {
      ...formData,
      payoutValue: Number(formData.payoutValue) || 0,
      pickupLeadTimeMin: Number(formData.pickupLeadTimeMin) || 0,
      pickupLeadTimeMax: Number(formData.pickupLeadTimeMax) || 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    addDoc(locationsRef, dataToSave)
      .then(() => {
        toast({ title: t.common.success, description: "New location established in Firestore." });
        router.push("/admin/warehouses");
      })
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: 'locations',
          operation: 'create',
          requestResourceData: dataToSave,
        });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => setLoading(false));
  };

  const whT = t.admin.warehouses;
  const formT = whT.form;
  const addrT = t.checkout.address_fields;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-5 w-5" /></Button>
          <div>
            <h1 className="text-3xl font-bold font-headline">{whT.add_warehouse}</h1>
            <p className="text-muted-foreground">Define a new inventory node in shoppoint-hk.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.back()}>取消</Button>
          <Button className="bg-primary text-primary-foreground font-black shadow-lg rounded-xl h-11 px-8" onClick={handleSave} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            儲存地點
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-6">
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
            <CardHeader className="bg-muted/10 border-b pb-4"><CardTitle className="flex items-center gap-2 font-black uppercase text-sm tracking-widest"><Warehouse className="h-5 w-5 text-primary" />基本識別</CardTitle></CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid gap-4">
                <Label htmlFor="type">地點用途類型</Label>
                <Select value={formData.type} onValueChange={(val) => setFormData(prev => ({ ...prev, type: val }))}>
                  <SelectTrigger className="h-11 rounded-xl bg-muted/20 border-none font-bold"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl border-none shadow-2xl">
                    <SelectItem value="online"><div className="flex items-center gap-2"><Truck className="h-4 w-4" /> 網店中心 / 集運倉</div></SelectItem>
                    <SelectItem value="physical"><div className="flex items-center gap-2"><Store className="h-4 w-4" /> 實體分店 / 合作點</div></SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Tabs defaultValue="zh" onValueChange={setActiveTab}>
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">地點顯示名稱</Label>
                  <TabsList className="bg-muted/50 scale-90"><TabsTrigger value="en">EN</TabsTrigger><TabsTrigger value="zh">中文</TabsTrigger></TabsList>
                </div>
                <TabsContent value="en">
                  <Input placeholder="e.g. Tuen Mun Collection Point" value={formData.name_en} onChange={(e) => setFormData(prev => ({ ...prev, name_en: e.target.value }))} className="h-11 rounded-xl" />
                </TabsContent>
                <TabsContent value="zh">
                  <Input placeholder="例如：屯門分店自取點" value={formData.name_zh} onChange={(e) => setFormData(prev => ({ ...prev, name_zh: e.target.value }))} className="h-11 rounded-xl font-bold" />
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* 合作夥伴與自取點營運設定 */}
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-indigo-900 text-white border-l-4 border-primary">
            <CardHeader className="bg-white/5 border-b py-5 px-8">
               <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
                 <Zap className="h-5 w-5 text-primary fill-current" />
                 合作自取點營運設定
               </CardTitle>
               <CardDescription className="text-indigo-200">在此設定合作店的結帳權限與佣金結算邏輯。</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="flex items-center justify-between p-4 bg-white/10 rounded-2xl border border-white/10">
                <div className="space-y-0.5">
                  <Label className="text-sm font-black uppercase text-white">啟用為自取點 (Self-Pickup)</Label>
                  <p className="text-[10px] text-indigo-200 font-medium">開啟後，顧客在網店結帳時可選取此地點作為收貨點。</p>
                </div>
                <Switch checked={formData.isPickupEnabled} onCheckedChange={(v) => setFormData(p => ({...p, isPickupEnabled: v}))} />
              </div>

              {formData.isPickupEnabled && (
                <div className="space-y-6 animate-in slide-in-from-top-2">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="grid gap-2">
                      <Label className="text-[10px] font-black uppercase text-indigo-300 ml-1">佣金計算類型</Label>
                      <Select value={formData.payoutType} onValueChange={(v) => handleInputChange("payoutType", v)}>
                        <SelectTrigger className="h-11 bg-white/10 border-none rounded-xl text-white font-bold"><SelectValue /></SelectTrigger>
                        <SelectContent className="rounded-xl border-none shadow-2xl">
                          <SelectItem value="fixed">固定金額 (每單 $X)</SelectItem>
                          <SelectItem value="percent">按訂單百分比 (%)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-[10px] font-black uppercase text-indigo-300 ml-1">數值 (Value)</Label>
                      <div className="relative">
                        <Input 
                          type="number" 
                          value={formData.payoutValue} 
                          onChange={e => setFormData(p => ({...p, payoutValue: Number(e.target.value)}))} 
                          className="h-11 bg-white/10 border-none rounded-xl text-white font-black pl-8" 
                        />
                        <span className="absolute left-3 top-3 text-xs opacity-40">{formData.payoutType === 'fixed' ? '$' : '%'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label className="text-[10px] font-black uppercase text-indigo-300 ml-1">預計到貨天數範圍 (Lead Time Days)</Label>
                    <div className="flex items-center gap-3">
                      <Input 
                        type="number"
                        placeholder="最少"
                        value={formData.pickupLeadTimeMin} 
                        onChange={e => handleInputChange("pickupLeadTimeMin", Number(e.target.value))} 
                        className="h-11 bg-white/10 border-none rounded-xl text-white font-black text-center" 
                      />
                      <span className="text-white font-black">~</span>
                      <Input 
                        type="number"
                        placeholder="最多"
                        value={formData.pickupLeadTimeMax} 
                        onChange={e => handleInputChange("pickupLeadTimeMax", Number(e.target.value))} 
                        className="h-11 bg-white/10 border-none rounded-xl text-white font-black text-center" 
                      />
                      <span className="text-xs text-indigo-200 font-bold">工作天</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
            <CardHeader className="bg-muted/10 border-b pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 font-black uppercase text-sm tracking-widest"><MapPin className="h-5 w-5 text-primary" />{formT.location}</CardTitle>
                <Tabs value={addressTab} onValueChange={setAddressTab} className="w-auto"><TabsList className="h-8 bg-muted/50"><TabsTrigger value="en" className="text-[10px]">EN</TabsTrigger><TabsTrigger value="zh" className="text-[10px]">中文</TabsTrigger></TabsList></Tabs>
              </div>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground">{addrT.area}</Label>
                  <Select value={formData.address.area} onValueChange={(val) => handleAddressChange('area', val)}>
                    <SelectTrigger className="bg-muted/20 border-none h-11 font-bold"><SelectValue placeholder="Area" /></SelectTrigger>
                    <SelectContent>
                      {Object.keys(HK_ADDRESS_DATA).map(a => (
                        <SelectItem key={a} value={a}>{isZh ? (AREA_NAME_MAP[a] || a) : a}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground">{addrT.district}</Label>
                  <Select value={formData.address.district} onValueChange={(val) => handleAddressChange('district', val)} disabled={!formData.address.area}>
                    <SelectTrigger className="bg-muted/20 border-none h-11 font-bold"><SelectValue placeholder="District" /></SelectTrigger>
                    <SelectContent>
                      {districtOptions.map(d => (
                        <SelectItem key={d} value={d}>{isZh ? (DISTRICT_NAME_MAP[d] || d) : d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground">{addrT.sub_district}</Label>
                  <Select value={formData.address.subDistrict} onValueChange={(val) => handleAddressChange('subDistrict', val)} disabled={!formData.address.district}>
                    <SelectTrigger className="bg-muted/20 border-none h-11 font-bold"><SelectValue placeholder="Sub" /></SelectTrigger>
                    <SelectContent>
                      {subDistrictOptions.map(s => (
                        <SelectItem key={s} value={s}>{isZh ? (SUB_DISTRICT_NAME_MAP[s] || s) : s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {['en', 'zh'].map((l) => (
                  <div key={l} className={addressTab === l ? "space-y-4 contents" : "hidden"}>
                    <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-muted-foreground">{addrT.street}</Label><Input className="bg-muted/20 border-none h-11" value={formData.address[`street_${l}` as keyof typeof formData.address] as string} onChange={(e) => handleAddressChange(`street_${l}`, e.target.value)} /></div>
                    <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-muted-foreground">{addrT.building}</Label><Input className="bg-muted/20 border-none h-11" value={formData.address[`building_${l}` as keyof typeof formData.address] as string} onChange={(e) => handleAddressChange(`building_${l}`, e.target.value)} /></div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-muted-foreground">{addrT.floor}</Label><Input className="bg-muted/20 border-none h-11 text-center" value={addressTab === 'en' ? formData.address.floor_en : formData.address.floor_zh} onChange={(e) => handleAddressChange(addressTab === 'en' ? 'floor_en' : 'floor_zh', e.target.value)} /></div>
                <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-muted-foreground">{addrT.flat}</Label><Input className="bg-muted/20 border-none h-11 text-center" value={addressTab === 'en' ? formData.address.flat_en : formData.address.flat_zh} onChange={(e) => handleAddressChange(addressTab === 'en' ? 'flat_en' : 'flat_zh', e.target.value)} /></div>
                <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-muted-foreground">{addrT.block}</Label><Input className="bg-muted/20 border-none h-11 text-center" value={addressTab === 'en' ? formData.address.block_en : formData.address.block_zh} onChange={(e) => handleAddressChange(addressTab === 'en' ? 'block_en' : 'block_zh', e.target.value)} /></div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
            <CardHeader className="bg-primary/5 pb-4"><CardTitle className="flex items-center gap-2 font-black uppercase text-sm tracking-widest"><Clock className="h-5 w-5 text-primary" />{formT.weekly_title}</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableBody>
                  {DAYS_ORDER.map((day) => (
                    <TableRow key={day} className="hover:bg-transparent">
                      <TableCell className="pl-6 font-bold text-xs uppercase">{t.days[day]}</TableCell>
                      <TableCell><Switch checked={formData.weeklyHours[day].isOpen} onCheckedChange={(val) => handleWeeklyHourChange(day, 'isOpen', val)} /></TableCell>
                      <TableCell className="pr-6">
                        {formData.weeklyHours[day].isOpen ? (
                          <div className="flex items-center gap-2">
                            <Input type="time" className="h-8 w-24 text-[10px] p-1 px-2 border-none bg-muted/30" value={formData.weeklyHours[day].open} onChange={(e) => handleWeeklyHourChange(day, 'open', e.target.value)} />
                            <Input type="time" className="h-8 w-24 text-[10px] p-1 px-2 border-none bg-muted/30" value={formData.weeklyHours[day].close} onChange={(e) => handleWeeklyHourChange(day, 'close', e.target.value)} />
                          </div>
                        ) : <span className="text-[10px] font-black text-muted-foreground/50 uppercase">Closed</span>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
            <CardHeader className="bg-muted/10"><CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">系統配置</CardTitle></CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid gap-2"><Label className="text-xs font-bold uppercase">聯絡電話</Label><Input placeholder="+852..." className="h-11 bg-muted/20 border-none rounded-xl" value={formData.phone} onChange={(e) => setFormData(p => ({...p, phone: e.target.value}))} /></div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/10">
                  <div className="space-y-0.5"><Label className="text-sm font-black uppercase">設為網店出貨預設點</Label><p className="text-[10px] text-muted-foreground leading-tight">用於自動計算網店庫存總量。</p></div>
                  <Switch checked={formData.isDefaultFulfillmentSource} onCheckedChange={(v) => setFormData(p => ({...p, isDefaultFulfillmentSource: v}))} />
                </div>

                <div className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl border border-dashed">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-black uppercase flex items-center gap-2">
                      <Eye className="h-4 w-4" /> 產品頁顯示分店庫存
                    </Label>
                    <p className="text-[10px] text-muted-foreground leading-tight">開啟後顧客可在產品頁面看到此店現貨狀況。</p>
                  </div>
                  <Switch checked={formData.isVisible} onCheckedChange={(v) => setFormData(p => ({...p, isVisible: v}))} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
