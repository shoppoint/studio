"use client";

import { useMemo, useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useI18n } from "@/lib/i18n/i18n-context";
import { 
  ChevronRight, 
  Truck, 
  Clock, 
  Globe, 
  ShieldCheck, 
  ExternalLink, 
  Package, 
  AlertTriangle, 
  MapPin, 
  Store, 
  Info, 
  CheckCircle2, 
  Loader2, 
  Plane, 
  HelpCircle, 
  Zap, 
  CalendarDays, 
  Phone 
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { cn } from "@/lib/utils";
import { HARDCODED_SHIPPING_ZONES } from "@/lib/constants/shipping-data";
import { useFirestore, useCollection } from "@/firebase";
import { collection, query, where, orderBy } from "firebase/firestore";

const DAYS_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

export default function ShippingPolicyPage() {
  const { t, lang } = useI18n();
  const db = useFirestore();
  const isEn = lang === 'en';

  const locationsQuery = useMemo(() => {
    if (!db) return null;
    return query(
      collection(db, 'locations'),
      where('status', '==', 'Active'),
      where('isPickupEnabled', '==', true)
    );
  }, [db]);

  const { data: locations, loading: locLoading } = useCollection<any>(locationsQuery);

  const zones = HARDCODED_SHIPPING_ZONES;

  const sfTrackingUrl = "https://www.sf-express.com/hk/tc/dynamic_function/waybill/";
  const sfLogo = PlaceHolderImages.find(img => img.id === "sf-logo");
  const hkPostLogo = PlaceHolderImages.find(img => img.id === "hkpost-logo");

  const groupedMethods = useMemo(() => {
    const hk: any[] = [];
    const overseas: any[] = [];

    zones.forEach(zone => {
      const isHkZone = zone.countries.some((c: string) => c.toLowerCase().includes("hong kong"));
      
      if (zone.methods) {
        Object.entries(zone.methods).forEach(([id, config]: [string, any]) => {
          if (config.enabled) {
            const methodData = { id, zoneName: zone.name, ...config };
            if (isHkZone) hk.push(methodData);
            else overseas.push(methodData);
          }
        });
      }
    });

    return { hk, overseas };
  }, [zones]);

  const renderLocationList = () => {
    if (locLoading) return <div className="py-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
    if (!locations || locations.length === 0) return null;

    return (
      <div className="mt-8 space-y-6 animate-in slide-in-from-top-4 duration-700">
        <div className="flex items-center gap-3 px-2">
          <MapPin className="h-5 w-5 text-primary" />
          <h4 className="font-black text-lg text-slate-800">{isEn ? 'Available Pickup Points' : '目前可用自取點及門市'}</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {locations.map((loc: any) => {
            const locName = isEn ? (loc.name_en || loc.name_zh) : (loc.name_zh || loc.name_en);
            const addr = loc.address || {};
            const fullAddr = isEn 
              ? `${addr.flat ? addr.flat + ', ' : ''}${addr.floor ? addr.floor + '/F, ' : ''}${addr.building_en || addr.building || ''}, ${addr.street_en || addr.street || ''}, ${addr.district}, ${addr.area}`
              : `${addr.area}${addr.district}${addr.subDistrict}${addr.building_zh || addr.building || ''}${addr.street_zh || addr.street || ''}${addr.floor ? addr.floor + '樓' : ''}${addr.flat || ''}`;

            const min = loc.pickupLeadTimeMin;
            const max = loc.pickupLeadTimeMax;
            let leadTimeLabel = null;
            
            if (min !== undefined && min !== null) {
              const minNum = Number(min);
              const maxNum = Number(max);
              leadTimeLabel = minNum === maxNum ? `${minNum}` : `${minNum}~${maxNum}`;
            }

            return (
              <Card key={loc.id} className="border-none shadow-sm bg-white rounded-3xl overflow-hidden border border-muted ring-1 ring-black/5">
                <CardContent className="p-6 space-y-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h5 className="font-black text-primary text-base">{locName}</h5>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[9px] font-black uppercase border-primary/20 text-primary bg-primary/5">
                          {loc.type === 'physical' ? (isEn ? 'Physical Store' : '實體分店') : (isEn ? 'Pickup Point' : '合作自取點')}
                        </Badge>
                        {leadTimeLabel && (
                          <Badge variant="outline" className="text-[9px] font-black uppercase bg-indigo-50 text-indigo-700 border-none">
                            {isEn ? `Est. ${leadTimeLabel} days` : `預計 ${leadTimeLabel} 工作天`}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                      <p className="text-xs text-slate-600 leading-relaxed font-medium">{fullAddr}</p>
                    </div>
                    {loc.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-slate-400 shrink-0" />
                        <p className="text-xs text-slate-600 font-bold">{loc.phone}</p>
                      </div>
                    )}
                  </div>

                  <Separator className="border-dashed" />

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground tracking-widest">
                      <Clock className="h-3 w-3" /> {isEn ? 'Business Hours' : '營業時間'}
                    </div>
                    <div className="grid grid-cols-1 gap-1.5">
                      {DAYS_ORDER.map((day) => {
                        const hours = loc.weeklyHours?.[day];
                        if (!hours) return null;
                        return (
                          <div key={day} className="flex justify-between items-center text-[11px]">
                            <span className="font-medium text-slate-500">{t.days[day as keyof typeof t.days]}</span>
                            {hours.isOpen ? (
                              <span className="font-bold text-slate-700">{hours.open} - {hours.close}</span>
                            ) : (
                              <span className="text-red-400 font-bold">{isEn ? 'Closed' : '休息'}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  const renderMethodCard = (m: any) => {
    const isSF = (m.name_zh || "").includes("順豐");
    const isHKP = (m.name_zh || "").includes("郵政") || (m.name_zh || "").includes("智");
    const isStore = m.isPickup === true;
    const threshold = Number(m.threshold) || 0;
    const fee = Number(m.fee) || 0;

    return (
      <div key={m.id} className="space-y-4">
        <Card className="border-none shadow-md bg-white rounded-[2rem] overflow-hidden border border-muted hover:shadow-xl transition-all duration-300">
          <div className="flex flex-col md:flex-row">
            <div className={cn(
              "p-8 flex items-center justify-center shrink-0 w-full md:w-48",
              isSF ? "bg-muted/30" : isHKP ? "bg-muted/30" : isStore ? "bg-primary/20" : "bg-blue-50"
            )}>
              <div className="relative h-20 w-24 flex items-center justify-center">
                {isSF && sfLogo?.imageUrl ? (
                  <Image src={sfLogo.imageUrl} alt="SF" fill className="object-contain" />
                ) : isHKP && hkPostLogo?.imageUrl ? (
                  <Image src={hkPostLogo.imageUrl} alt="HKP" fill className="object-contain" />
                ) : isStore ? (
                  <Store className="h-12 w-12 text-primary" />
                ) : (
                  <Truck className="h-12 w-12 text-blue-600" />
                )}
              </div>
            </div>
            <CardContent className="p-8 flex-1 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-2xl font-bold font-headline">
                    {isEn ? (m.name_en || m.name) : (m.name_zh || m.name)}
                  </h3>
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{m.zoneName}</p>
                </div>
                {isStore && <Badge className="bg-primary text-primary-foreground font-black px-4 py-1 rounded-full shadow-sm">免費 FREE</Badge>}
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 rounded-2xl border border-green-100">
                  <p className="text-[10px] font-black text-green-700 uppercase">{isEn ? "Min. Spend" : "最低消費門檻"}</p>
                  <p className="text-lg font-black text-green-800">
                    {isStore 
                      ? (isEn ? "No Minimum" : "無限制") 
                      : (threshold > 0 ? `$${threshold} ${isEn ? "or above" : "或以上"}` : (isEn ? "No Free Shipping" : "不設免運費優惠"))
                    }
                  </p>
                </div>
                <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100">
                  <p className="text-[10px] font-black text-orange-700 uppercase">{isEn ? "Shipping Fee" : "運費收費"}</p>
                  <p className="text-lg font-black text-orange-800">
                    {isStore ? (isEn ? "免費 FREE" : "免費 FREE") : (m.collect ? (isEn ? "Freight Collect" : "運費到付") : (fee > 0 ? `$${fee}` : (isEn ? "免費 FREE" : "免費 FREE")))}
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-sm text-muted-foreground">
                {m.notes && (
                  <div className="flex items-start gap-2">
                    <Info className="h-4 w-4 text-primary mt-0.5" />
                    <p className="italic">{m.notes}</p>
                  </div>
                )}
                {isSF && (
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-primary mt-0.5" />
                    <p>
                      {isEn ? "Track at " : "運單追蹤："}
                      <a href={sfTrackingUrl} target="_blank" rel="noreferrer" className="text-primary font-bold hover:underline inline-flex items-center gap-1">
                        SF Express <ExternalLink className="h-3 w-3" />
                      </a>
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </div>
        </Card>
        {isStore && renderLocationList()}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-primary/10 py-12 md:py-20 border-b">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4 uppercase tracking-widest font-bold">
              <Link href="/" className="hover:text-primary transition-colors">{t.nav.home}</Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground font-medium">{t.legal.shipping}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black font-headline tracking-tighter">
              {t.legal.shipping}
            </h1>
            <div className="mt-6 max-w-3xl space-y-4">
              <p className="text-muted-foreground text-lg font-medium leading-relaxed">
                {isEn 
                  ? "We offer flexible local delivery and international shipping options to get your favorites to you safely. Browse our current rates and free shipping thresholds below to find the best way to receive your order."
                  : "我們為您提供靈活的本地配送及海外寄送方案，致力於將每一份精選好物安全送到您手中。您可於下方查看各類配送方式的運費詳情及免運費優惠，挑選最適合您的收貨方式。"}
              </p>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-16">
          <div className="max-w-5xl mx-auto space-y-12">
            <Tabs defaultValue="hk" className="w-full">
              <div className="flex justify-center mb-12">
                <TabsList className="bg-muted/50 h-14 p-1.5 rounded-2xl w-full max-w-md">
                  <TabsTrigger value="hk" className="rounded-xl flex-1 font-black uppercase text-xs tracking-widest gap-2">
                    <MapPin className="h-4 w-4" /> {isEn ? "Hong Kong" : "香港地區"}
                  </TabsTrigger>
                  <TabsTrigger value="overseas" className="rounded-xl flex-1 font-black uppercase text-xs tracking-widest gap-2">
                    <Plane className="h-4 w-4" /> {isEn ? "Overseas" : "海外地區"}
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="hk" className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
                <div className="grid grid-cols-1 gap-8">
                  {groupedMethods.hk.length === 0 ? (
                    <div className="p-12 text-center border-2 border-dashed rounded-[3rem] bg-muted/5">
                      <p className="text-muted-foreground italic">目前暫無香港地區的運送方式。</p>
                    </div>
                  ) : (
                    groupedMethods.hk.map(renderMethodCard)
                  )}
                </div>
              </TabsContent>

              <TabsContent value="overseas" className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                <div className="grid grid-cols-1 gap-8">
                  {groupedMethods.overseas.length === 0 ? (
                    <div className="p-12 text-center border-2 border-dashed rounded-[3rem] bg-muted/5">
                      <p className="text-muted-foreground italic">目前暫無海外地區的運送方式。</p>
                    </div>
                  ) : (
                    groupedMethods.overseas.map(renderMethodCard)
                  )}
                </div>

                <div className="bg-red-50 p-8 rounded-[2.5rem] border-2 border-red-100 space-y-4 shadow-sm mt-12">
                  <div className="flex items-center gap-3 text-red-600">
                    <ShieldCheck className="h-6 w-6 text-red-600" />
                    <h4 className="font-black uppercase tracking-widest text-sm">{isEn ? "Overseas Order Policy" : "海外客戶訂購聲明"}</h4>
                  </div>
                  <p className="text-sm text-red-800 leading-relaxed font-bold">
                    {isEn 
                      ? "Overseas customers are responsible for checking local import regulations. SHOP POINT is not liable for items seized by customs. No refunds will be provided in such cases."
                      : "海外客人需自行檢查該貨品能否寄送至當地。如寄送後有扣關、被沒收或因當地政策無法寄送的情況，本店一概不會負責及安排退款。"}
                  </p>
                </div>
              </TabsContent>
            </Tabs>

            <Separator className="my-16" />

            {/* Help Callout */}
            <div className="text-center space-y-6 bg-muted/30 p-10 rounded-[3rem] border border-dashed border-primary/20">
              <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                <HelpCircle className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">{isEn ? "Questions about Shipping?" : "對配送有任何疑問？"}</h3>
                <p className="text-sm text-muted-foreground">
                  {isEn 
                    ? "Our support team is here to assist you with any special logistics requirements." 
                    : "我們的客服團隊隨時準備協助您處理任何特殊的物流需求。"}
                </p>
              </div>
              <div className="flex justify-center gap-4">
                <Button asChild className="rounded-full px-8 bg-primary font-bold shadow-lg">
                  <Link href="/contact">{t.contact.title}</Link>
                </Button>
              </div>
            </div>

          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
