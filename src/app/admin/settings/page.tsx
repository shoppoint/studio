"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { 
  Save, 
  Loader2, 
  Mail, 
  Phone, 
  MapPin, 
  Image as ImageIcon, 
  Upload,
  Zap,
  Layout,
  Building,
  Languages,
  Clock,
  Search,
  Globe,
  Calendar,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useI18n } from "@/lib/i18n/i18n-context";
import { useToast } from "@/hooks/use-toast";
import { useStorage, useUser, useFirestore, useDoc } from "@/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { compressImage } from "@/lib/image-utils";
import { Progress } from "@/components/ui/progress";
import { HK_ADDRESS_DATA, AREA_NAME_MAP, DISTRICT_NAME_MAP, SUB_DISTRICT_NAME_MAP, COUNTRIES, COUNTRY_NAME_MAP } from "@/lib/address-data";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

const DAYS_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'holiday'];

export default function GeneralSettings() {
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const db = useFirestore();
  const storage = useStorage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [addressLangTab, setAddressLangTab] = useState("zh");
  const [seoLangTab, setSeoLangTab] = useState("zh");

  const configRef = useMemo(() => {
    if (!db) return null;
    return doc(db, 'config', 'general');
  }, [db]);
  const { data: configData, loading: configLoading } = useDoc<any>(configRef);

  const [formData, setFormData] = useState({
    storeName: { en: "SHOP POINT", zh: "SHOP POINT" },
    storeEmail: "info@shoppoint.hk",
    storePhone: "+852 5325 2555",
    storeAddress: {
      area: "New Territories",
      district: "Tuen Mun",
      subDistrict: "Tuen Mun",
      street_en: "3 Tsing Ling Path",
      street_zh: "青菱徑 3 號",
      building_en: "U-Town Shopping Arcade",
      building_zh: "時尚電腦城",
      block_en: "",
      block_zh: "",
      floor_en: "Basement",
      floor_zh: "地庫",
      flat_en: "B17",
      flat_zh: "B17",
      country: "Hong Kong"
    },
    operatingHours: {
      monday: { isOpen: true, open: "12:00", close: "19:00" },
      tuesday: { isOpen: true, open: "12:00", close: "19:00" },
      wednesday: { isOpen: true, open: "12:00", close: "19:00" },
      thursday: { isOpen: true, open: "12:00", close: "19:00" },
      friday: { isOpen: true, open: "12:00", close: "19:00" },
      saturday: { isOpen: true, open: "12:00", close: "19:00" },
      sunday: { isOpen: false, open: "00:00", close: "00:00" },
      holiday: { isOpen: false, open: "00:00", close: "00:00" }
    },
    logoUrl: "/logo.png",
    faviconUrl: "/favicon.ico",
    defaultLanguage: "zh-HK",
    timezone: "Asia/Hong_Kong",
    seo: {
      title: { en: "SHOP POINT | Premium Marketplace", zh: "SHOP POINT | 優質購物平台" },
      description: { en: "Sourcing quality goods from around the world.", zh: "穿梭世界各地尋找優質良品。" }
    }
  });

  useEffect(() => {
    if (configData) {
      const rawHours = configData.operatingHours || {};
      const migratedHours: any = {};
      
      const defaultState = { isOpen: true, open: "12:00", close: "19:00" };
      
      DAYS_ORDER.forEach(day => {
        const val = rawHours[day];
        if (typeof val === 'string') {
          if (val === '休息' || val.toLowerCase() === 'closed') {
            migratedHours[day] = { isOpen: false, open: "12:00", close: "19:00" };
          } else if (val.includes(' - ')) {
            const [open, close] = val.split(' - ');
            migratedHours[day] = { isOpen: true, open: open || "12:00", close: close || "19:00" };
          } else {
            migratedHours[day] = { ...defaultState };
          }
        } else if (val && typeof val === 'object') {
          migratedHours[day] = val;
        } else {
          migratedHours[day] = { ...defaultState, isOpen: day !== 'sunday' && day !== 'holiday' };
        }
      });

      setFormData(prev => ({
        ...prev,
        ...configData,
        storeName: { ...prev.storeName, ...(configData.storeName || {}) },
        seo: { 
          title: { ...prev.seo.title, ...(configData.seo?.title || {}) },
          description: { ...prev.seo.description, ...(configData.seo?.description || {}) }
        },
        storeAddress: {
          ...prev.storeAddress,
          ...(configData.storeAddress || {})
        },
        operatingHours: migratedHours
      }));
    }
  }, [configData]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleOperatingHoursChange = (day: string, field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      operatingHours: {
        ...prev.operatingHours,
        [day]: { ...prev.operatingHours[day], [field]: value }
      }
    }));
  };

  const handleAddressChange = (field: string, value: string) => {
    setFormData(prev => {
      const newAddress = { ...prev.storeAddress, [field]: value };
      if (field === 'area') { newAddress.district = ""; newAddress.subDistrict = ""; }
      if (field === 'district') { newAddress.subDistrict = ""; }
      return { ...prev, storeAddress: newAddress };
    });
  };

  const districtOptions = useMemo(() => {
    const area = formData.storeAddress.area;
    return area && HK_ADDRESS_DATA[area] ? Object.keys(HK_ADDRESS_DATA[area]) : [];
  }, [formData.storeAddress.area]);

  const subDistrictOptions = useMemo(() => {
    const { area, district } = formData.storeAddress;
    return area && district && HK_ADDRESS_DATA[area] && HK_ADDRESS_DATA[area][district]
      ? HK_ADDRESS_DATA[area][district] || [] 
      : [];
  }, [formData.storeAddress.area, formData.storeAddress.district]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'favicon') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const compressedBlob = await compressImage(file, type === 'favicon' ? 64 : 600, 0.85);
      const fileName = `config/${type}_${Date.now()}.webp`;
      const storageRef = ref(storage, fileName);
      const uploadTask = uploadBytesResumable(storageRef, compressedBlob, { contentType: 'image/webp' });

      uploadTask.on('state_changed', 
        (snapshot: any) => setUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
        (error: any) => { toast({ title: "上傳錯誤", variant: "destructive" }); setLoading(false); },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          setFormData(prev => ({ ...prev, [type === 'favicon' ? 'faviconUrl' : 'logoUrl']: downloadURL }));
          setUploadProgress(0); setLoading(false);
          toast({ title: t.common.success });
        }
      );
    } catch (error: any) { setLoading(false); }
  };

  const handleSave = async () => {
    if (!db || !configRef) return;
    setLoading(true);
    try {
      await setDoc(configRef, { ...formData, updatedAt: serverTimestamp() }, { merge: true });
      toast({ title: t.common.success });
    } catch (e) { toast({ title: t.common.error, variant: "destructive" }); } finally { setLoading(false); }
  };

  const setT = t.admin.settings;
  const addrT = t.checkout.address_fields;
  const isZh = lang === 'zh-HK';

  if (configLoading) return <div className="h-96 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex justify-between items-center px-2">
        <h2 className="text-xl font-black font-headline uppercase flex items-center gap-3"><Zap className="h-6 w-6 text-primary" />{setT.general}</h2>
        <Button className="bg-primary text-primary-foreground font-black rounded-xl h-11 px-8 shadow-lg hover:scale-105 transition-transform" onClick={handleSave} disabled={loading}>
          {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}{t.common.save}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
            <CardHeader className="bg-muted/10 border-b pb-4"><CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2"><Layout className="h-4 w-4" />Branding & Contact</CardTitle></CardHeader>
            <CardContent className="space-y-8 pt-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                   <Label className="text-[10px] font-black uppercase ml-1">Store Logo</Label>
                   <div className="h-32 w-full rounded-2xl border-2 border-dashed bg-muted/20 flex items-center justify-center relative group overflow-hidden cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                     {formData.logoUrl ? <img src={formData.logoUrl} className="h-20 object-contain p-2" /> : <ImageIcon className="h-10 w-10 text-muted-foreground/30" />}
                     <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center"><Button variant="secondary" size="sm" className="font-bold">Upload Logo</Button></div>
                   </div>
                   <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => handleFileUpload(e, 'logo')} accept="image/*" />
                </div>
                <div className="space-y-4">
                   <Label className="text-[10px] font-black uppercase ml-1">Favicon</Label>
                   <div className="h-32 w-full rounded-2xl border-2 border-dashed bg-muted/20 flex items-center justify-center relative group overflow-hidden cursor-pointer" onClick={() => faviconInputRef.current?.click()}>
                     {formData.faviconUrl ? <img src={formData.faviconUrl} className="h-10 w-10 object-contain" /> : <ImageIcon className="h-10 w-10 text-muted-foreground/30" />}
                     <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center"><Button variant="secondary" size="sm" className="font-bold">Upload Favicon</Button></div>
                   </div>
                   <input type="file" ref={faviconInputRef} className="hidden" onChange={(e) => handleFileUpload(e, 'favicon')} accept="image/*" />
                </div>
              </div>
              
              <Separator className="border-dashed" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="grid gap-2"><Label className="text-[10px] font-black uppercase">Store Name (ZH)</Label><Input value={formData.storeName.zh} onChange={e => handleInputChange("storeName", { ...formData.storeName, zh: e.target.value })} className="h-11 bg-muted/20 border-none rounded-xl font-bold" /></div>
                <div className="grid gap-2"><Label className="text-[10px] font-black uppercase">Store Name (EN)</Label><Input value={formData.storeName.en} onChange={e => handleInputChange("storeName", { ...formData.storeName, en: e.target.value })} className="h-11 bg-muted/20 border-none rounded-xl font-bold" /></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="grid gap-2"><Label className="text-[10px] font-black uppercase">Store Contact Email</Label><Input value={formData.storeEmail} onChange={e => handleInputChange("storeEmail", e.target.value)} className="h-11 bg-muted/20 border-none rounded-xl font-mono" /></div>
                <div className="grid gap-2"><Label className="text-[10px] font-black uppercase">Store Contact Phone</Label><Input value={formData.storePhone} onChange={e => handleInputChange("storePhone", e.target.value)} className="h-11 bg-muted/20 border-none rounded-xl font-bold" /></div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden border-l-4 border-primary">
            <CardHeader className="bg-primary/5 border-b py-5 px-8">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {setT.operating_hours}
              </CardTitle>
              <CardDescription>使用開關與時間選取器設定全站通用的營業時間。</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid grid-cols-1 gap-y-4">
                {DAYS_ORDER.map((day) => {
                  const hours = (formData.operatingHours as any)[day];
                  const label = day === 'holiday' ? '公眾假期 (Holidays)' : t.days[day as keyof typeof t.days];

                  return (
                    <div key={day} className="flex flex-col sm:flex-row items-center justify-between p-4 bg-muted/10 rounded-2xl border border-dashed gap-4">
                      <div className="flex items-center gap-4 w-full sm:w-auto">
                        <Switch 
                          checked={hours.isOpen} 
                          onCheckedChange={(val) => handleOperatingHoursChange(day, 'isOpen', val)} 
                        />
                        <Label className="font-bold text-sm uppercase tracking-wider min-w-[100px]">
                          {label}
                        </Label>
                      </div>
                      
                      {hours.isOpen ? (
                        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                          <Input 
                            type="time" 
                            className="h-10 w-32 rounded-xl bg-white border-none shadow-sm font-bold text-center p-2" 
                            value={hours.open} 
                            onChange={(e) => handleOperatingHoursChange(day, 'open', e.target.value)} 
                          />
                          <span className="text-muted-foreground font-black">-</span>
                          <Input 
                            type="time" 
                            className="h-10 w-32 rounded-xl bg-white border-none shadow-sm font-bold text-center p-2" 
                            value={hours.close} 
                            onChange={(e) => handleOperatingHoursChange(day, 'close', e.target.value)} 
                          />
                        </div>
                      ) : (
                        <Badge variant="outline" className="h-10 px-6 rounded-xl border-dashed text-muted-foreground font-black uppercase bg-white/50">
                          Closed 休息
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
              <p className="text-[10px] text-muted-foreground italic flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                設定的時間將自動反映於「幫助中心」、「聯絡我們」及「關於我們」頁面。
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
            <CardHeader className="bg-muted/10 border-b flex flex-row items-center justify-between py-4 px-8">
              <CardTitle className="text-sm font-black uppercase flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" />Office Address</CardTitle>
              <Tabs value={addressLangTab} onValueChange={setAddressLangTab} className="w-auto"><TabsList className="h-8 bg-muted/50"><TabsTrigger value="zh" className="text-[10px]">中文</TabsTrigger><TabsTrigger value="en" className="text-[10px]">EN</TabsTrigger></TabsList></Tabs>
            </CardHeader>
            <CardContent className="space-y-8 pt-8">
              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Area</Label><Select value={formData.storeAddress.area} onValueChange={v => handleAddressChange('area', v)}><SelectTrigger className="h-11 bg-muted/20 border-none rounded-xl"><SelectValue /></SelectTrigger><SelectContent>{Object.keys(HK_ADDRESS_DATA).map(a => <SelectItem key={a} value={a}>{isZh ? (AREA_NAME_MAP[a] || a) : a}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-2"><Label className="text-[10px] font-black uppercase">District</Label><Select value={formData.storeAddress.district} onValueChange={v => handleAddressChange('district', v)} disabled={!formData.storeAddress.area}><SelectTrigger className="h-11 bg-muted/20 border-none rounded-xl"><SelectValue /></SelectTrigger><SelectContent>{districtOptions.map(d => <SelectItem key={d} value={d}>{isZh ? (DISTRICT_NAME_MAP[d] || d) : d}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-2"><Label className="text-[10px] font-black uppercase">Sub</Label><Select value={formData.storeAddress.subDistrict} onValueChange={v => handleAddressChange('subDistrict', v)} disabled={!formData.storeAddress.district}><SelectTrigger className="h-11 bg-muted/20 border-none rounded-xl"><SelectValue /></SelectTrigger><SelectContent>{subDistrictOptions.map(s => <SelectItem key={s} value={s}>{isZh ? (SUB_DISTRICT_NAME_MAP[s] || s) : s}</SelectItem>)}</SelectContent></Select></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="grid gap-2"><Label className="text-[10px] font-black uppercase">Building ({addressLangTab})</Label><Input value={(formData.storeAddress as any)[`building_${addressLangTab}`]} onChange={e => handleAddressChange(`building_${addressLangTab}`, e.target.value)} className="h-11 bg-muted/20 border-none rounded-xl" /></div>
                <div className="grid gap-2"><Label className="text-[10px] font-black uppercase">Street ({addressLangTab})</Label><Input value={(formData.storeAddress as any)[`street_${addressLangTab}`]} onChange={e => handleAddressChange(`street_${addressLangTab}`, e.target.value)} className="h-11 bg-muted/20 border-none rounded-xl" /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-muted-foreground">{addrT.floor}</Label><Input className="bg-muted/20 border-none h-11 text-center" value={addressLangTab === 'en' ? (formData.storeAddress.floor_en || "") : (formData.storeAddress.floor_zh || "")} onChange={(e) => handleAddressChange(addressLangTab === 'en' ? 'floor_en' : 'floor_zh', e.target.value)} /></div>
                <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-muted-foreground">{addrT.flat}</Label><Input className="bg-muted/20 border-none h-11 text-center" value={addressLangTab === 'en' ? (formData.storeAddress.flat_en || "") : (formData.storeAddress.flat_zh || "")} onChange={(e) => handleAddressChange(addressLangTab === 'en' ? 'flat_en' : 'flat_zh', e.target.value)} /></div>
                <div className="space-y-2"><Label className="text-[10px] font-black uppercase text-muted-foreground">{addrT.block}</Label><Input className="bg-muted/20 border-none h-11 text-center" value={addressLangTab === 'en' ? (formData.storeAddress.block_en || "") : (formData.storeAddress.block_zh || "")} onChange={(e) => handleAddressChange(addressLangTab === 'en' ? 'block_en' : 'block_zh', e.target.value)} /></div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-8">
          <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
            <CardHeader className="bg-muted/10 border-b pb-4"><CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2"><Languages className="h-4 w-4" />Localization & Time</CardTitle></CardHeader>
            <CardContent className="space-y-6 pt-8">
              <div className="grid gap-2">
                <Label className="text-xs font-bold uppercase">Default Language</Label>
                <Select value={formData.defaultLanguage} onValueChange={v => handleInputChange("defaultLanguage", v)}>
                  <SelectTrigger className="h-11 bg-muted/20 border-none rounded-xl font-bold"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl"><SelectItem value="zh-HK">繁體中文 (Hong Kong)</SelectItem><SelectItem value="en">English (US)</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label className="text-xs font-bold uppercase flex items-center gap-2"><Clock className="h-3.5 w-3.5" /> System Timezone</Label>
                <Select value={formData.timezone} onValueChange={v => handleInputChange("timezone", v)}>
                  <SelectTrigger className="h-11 bg-muted/20 border-none rounded-xl font-bold font-mono text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="Asia/Hong_Kong">Asia/Hong_Kong (UTC+8)</SelectItem>
                    <SelectItem value="UTC">UTC (Universal Time)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl bg-slate-900 text-white rounded-[2rem] overflow-hidden">
            <CardHeader className="bg-white/5 border-b pb-4 px-6 flex flex-row items-center justify-between">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                <Search className="h-4 w-4" /> Global SEO
              </CardTitle>
              <Tabs value={seoLangTab} onValueChange={setSeoLangTab} className="w-auto">
                <TabsList className="h-7 bg-white/10 p-0.5"><TabsTrigger value="zh" className="text-[8px]">中</TabsTrigger><TabsTrigger value="en" className="text-[8px]">EN</TabsTrigger></TabsList>
              </Tabs>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label className="text-[10px] font-black uppercase opacity-60">Meta Title ({seoLangTab.toUpperCase()})</Label>
                  <Input 
                    value={formData.seo.title[seoLangTab as 'zh'|'en']} 
                    onChange={e => handleInputChange("seo", { ...formData.seo, title: { ...formData.seo.title, [seoLangTab]: e.target.value } })}
                    className="h-10 bg-white/10 border-none rounded-xl text-white font-bold text-xs" 
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-[10px] font-black uppercase opacity-60">Meta Description ({seoLangTab.toUpperCase()})</Label>
                  <Textarea 
                    value={formData.seo.description[seoLangTab as 'zh'|'en']} 
                    onChange={e => handleInputChange("seo", { ...formData.seo, description: { ...formData.seo.description, [seoLangTab]: e.target.value } })}
                    className="min-h-[100px] bg-white/10 border-none rounded-2xl text-white text-[10px] leading-relaxed" 
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
