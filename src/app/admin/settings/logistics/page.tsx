"use client";

import { useState, useMemo, useEffect } from "react";
import { 
  Truck, 
  MapPin, 
  Save, 
  Loader2,
  Globe,
  Settings2,
  Database,
  Search,
  AlertTriangle,
  Code,
  Info,
  ChevronRight,
  Zap,
  ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/i18n-context";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useCollection, useUser } from "@/firebase";
import { query, collection, where } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { ShippingMethodCard } from "@/components/admin/settings/ShippingMethodCard";
import { Badge } from "@/components/ui/badge";
import { HARDCODED_SHIPPING_ZONES } from "@/lib/constants/shipping-data";

/**
 * 物流設定頁面 (加固版：切換至代碼管理模式)
 */
export default function LogisticsSettings() {
  const { t, lang } = useI18n();
  const db = useFirestore();
  const { loading: userLoading } = useUser();
  
  // 使用硬編碼資料作為唯一來源
  const zones = HARDCODED_SHIPPING_ZONES;
  const [selectedZoneId, setSelectedZoneId] = useState<string>(zones[0].id);

  // 僅保留 Physical Locations 的 Firestore 讀取，因為這部分可能變動較大
  const locationsQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'locations'), where('status', '==', 'Active'));
  }, [db]);
  const { data: allLocations } = useCollection<any>(locationsQuery);

  const physicalLocations = useMemo(() => {
    if (!allLocations) return [];
    return allLocations.filter(loc => loc.type === 'physical');
  }, [allLocations]);

  const selectedZone = useMemo(() => {
    return zones.find(z => z.id === selectedZoneId) || zones[0];
  }, [zones, selectedZoneId]);

  if (userLoading) {
    return <div className="h-96 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      {/* 穩定性通知面板 */}
      <div className="p-6 bg-slate-900 text-white rounded-[2.5rem] shadow-xl border-l-8 border-primary space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <h3 className="font-black text-sm uppercase tracking-widest">代碼鎖定模式 (Hardcoded Mode)</h3>
          </div>
          <Badge className="bg-primary text-primary-foreground border-none font-black text-[10px]">STABLE</Badge>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          為了確保結帳流程 100% 穩定，目前的物流配置已切換為「代碼管理模式」。<br/>
          這意味著運送分區與方式直接由程式碼控制，不再受資料庫權限影響。如需修改費率或增減區域，請編輯 <code>src/lib/constants/shipping-data.ts</code> 檔案。
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Sidebar */}
        <aside className="w-full md:w-72 shrink-0 space-y-4">
          <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
            <CardHeader className="bg-muted/10 border-b py-4 px-6">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Globe className="h-4 w-4" /> 運送區域
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 space-y-1">
              {zones.map(zone => (
                <div 
                  key={zone.id}
                  onClick={() => setSelectedZoneId(zone.id)}
                  className={cn(
                    "w-full flex items-center justify-between p-3 px-4 rounded-2xl transition-all cursor-pointer group",
                    selectedZoneId === zone.id ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-muted/50 text-muted-foreground"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <MapPin className={cn("h-4 w-4", selectedZoneId === zone.id ? "fill-current" : "")} />
                    <div className="text-left">
                      <p className="font-bold text-sm leading-tight">{zone.name}</p>
                      <p className={cn("text-[9px] font-black uppercase opacity-60", selectedZoneId === zone.id ? "text-white" : "text-primary")}>
                        {zone.countries?.length || 0} Regions
                      </p>
                    </div>
                  </div>
                  <ChevronRight className={cn("h-4 w-4 opacity-0 group-hover:opacity-50 transition-opacity", selectedZoneId === zone.id && "opacity-100")} />
                </div>
              ))}
            </CardContent>
          </Card>
        </aside>

        {/* Main Setting View */}
        <div className="flex-1 space-y-6 min-w-0">
          <div className="space-y-8 animate-in slide-in-from-right-2 duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm"><Settings2 className="h-6 w-6" /></div>
                <div>
                  <h2 className="text-2xl font-black font-headline tracking-tight">{selectedZone.name}</h2>
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">目前有效配置預覽 (唯讀)</p>
                </div>
              </div>
              <Button variant="ghost" className="rounded-xl font-bold h-11 border-dashed border-2 pointer-events-none opacity-50">
                <Code className="mr-2 h-4 w-4" /> 編輯代碼以修改
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {Object.entries(selectedZone.methods).map(([methodId, config]) => (
                <ShippingMethodCard 
                  key={methodId} 
                  id={methodId} 
                  config={config} 
                  lang={lang} 
                  physicalLocations={physicalLocations} 
                  onUpdate={() => {}} // 唯讀模式
                  onRemove={() => {}} 
                />
              ))}
            </div>
            
            <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100 flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-blue-900 uppercase">如何更新資料？</p>
                <p className="text-xs text-blue-800 leading-relaxed">
                  目前的資料直接由 <code>HARDCODED_SHIPPING_ZONES</code> 常量驅動。請將變更請求告知您的開發人員或 AI 助手，修改檔案後重新部署即可。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
