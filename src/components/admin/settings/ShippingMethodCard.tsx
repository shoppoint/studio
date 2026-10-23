
"use client";

import React from "react";
import { 
  Package, 
  Trash2, 
  Store, 
  Warehouse, 
  Languages, 
  Check, 
  Info,
  X
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface ShippingMethodCardProps {
  id: string;
  config: any;
  lang: string;
  physicalLocations: any[];
  onUpdate: (id: string, field: string, value: any) => void;
  onRemove: (id: string) => void;
}

/**
 * 配送方式編輯卡片組件
 * 負責單一方式的詳細配置，包含門市自取連動邏輯
 */
export function ShippingMethodCard({
  id,
  config,
  lang,
  physicalLocations,
  onUpdate,
  onRemove
}: ShippingMethodCardProps) {
  
  const toggleLocation = (locationId: string) => {
    const currentIds = config.locationIds || [];
    const nextIds = currentIds.includes(locationId)
      ? currentIds.filter((id: string) => id !== locationId)
      : [...currentIds, locationId];
    onUpdate(id, 'locationIds', nextIds);
  };

  return (
    <Card className="border shadow-none rounded-[2rem] bg-white overflow-hidden hover:border-primary/20 transition-all group">
      <CardHeader className="py-5 border-b flex flex-row items-center justify-between bg-muted/5 px-6">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center text-primary shadow-sm">
            <Package className="h-4 w-4" />
          </div>
          <div className="space-y-0.5">
            <p className="font-black text-base leading-tight">
              {lang === 'en' ? (config.name_en || config.name_zh) : (config.name_zh || config.name_en)}
            </p>
            <p className="text-[9px] font-black uppercase text-muted-foreground opacity-60">ID: {id}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase text-muted-foreground">Enabled</span>
            <Switch 
              checked={config.enabled} 
              onCheckedChange={(v) => onUpdate(id, 'enabled', v)} 
            />
          </div>
          <button 
            onClick={() => onRemove(id)}
            className="p-2 text-destructive opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 rounded-full"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </CardHeader>

      {config.enabled && (
        <CardContent className="p-6 space-y-8 animate-in slide-in-from-top-2">
          {/* Bilingual Name Inputs */}
          <div className="grid gap-4 p-4 bg-muted/20 rounded-2xl border-2 border-dashed">
            <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
              <Languages className="h-3 w-3" /> 配送方式名稱 (中英文)
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold">English Name</Label>
                <Input 
                  value={config.name_en} 
                  onChange={(e) => onUpdate(id, 'name_en', e.target.value)} 
                  className="h-10 bg-white border-none rounded-xl text-xs font-bold" 
                  placeholder="e.g. SF Express"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold">中文名稱</Label>
                <Input 
                  value={config.name_zh} 
                  onChange={(e) => onUpdate(id, 'name_zh', e.target.value)} 
                  className="h-10 bg-white border-none rounded-xl text-xs font-bold" 
                  placeholder="例如：順豐速運"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-primary/5 rounded-2xl border border-primary/10">
            <div className="space-y-0.5">
              <Label className="text-sm font-bold flex items-center gap-2 text-primary">
                <Store className="h-4 w-4" /> 門市自取模式 (Store Pickup)
              </Label>
              <p className="text-[10px] text-muted-foreground">開啟後，顧客在結帳時可選擇具體的取貨分店。</p>
            </div>
            <Switch 
              checked={config.isPickup} 
              onCheckedChange={(v) => onUpdate(id, 'isPickup', v)} 
            />
          </div>

          {config.isPickup && (
            <div className="space-y-4 animate-in fade-in">
              <div className="flex items-center gap-2 text-xs font-black uppercase text-muted-foreground tracking-widest">
                <Warehouse className="h-4 w-4" /> 選擇可供取貨的地點 (Select Locations)
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {physicalLocations.length === 0 ? (
                  <div className="col-span-2 p-4 border rounded-xl border-dashed text-center text-xs text-muted-foreground">
                    <Info className="h-4 w-4 mx-auto mb-2 opacity-50" />
                    尚未在「倉庫與庫存管理」中設定任何「實體分店」。
                  </div>
                ) : (
                  physicalLocations.map(loc => (
                    <div 
                      key={loc.id} 
                      onClick={() => toggleLocation(loc.id)}
                      className={cn(
                        "p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between",
                        config.locationIds?.includes(loc.id) ? "border-primary bg-primary/5" : "border-muted hover:border-primary/20"
                      )}
                    >
                      <div className="space-y-0.5 min-w-0">
                        <p className="font-bold text-xs truncate">{lang === 'en' ? (loc.name_en || loc.name_zh) : (loc.name_zh || loc.name_en)}</p>
                        <p className="text-[9px] text-muted-foreground truncate">{loc.address?.district}</p>
                      </div>
                      <div className={cn(
                        "h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0", 
                        config.locationIds?.includes(loc.id) ? "bg-primary border-primary text-white" : "border-muted-foreground/20"
                      )}>
                        {config.locationIds?.includes(loc.id) && <Check className="h-3 w-3" strokeWidth={4} />}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="grid gap-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">免運費門檻 (HK$)</Label>
              <Input 
                type="number" 
                value={config.threshold} 
                onChange={(e) => onUpdate(id, 'threshold', e.target.value)} 
                className="h-11 bg-muted/20 border-none rounded-xl font-bold" 
              />
              <p className="text-[9px] text-muted-foreground italic px-1">輸入 "0" 則代表不設免運費優惠。</p>
            </div>
            <div className="grid gap-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">固定運費 (HK$)</Label>
              <Input 
                type="number" 
                value={config.fee} 
                onChange={(e) => onUpdate(id, 'fee', e.target.value)} 
                className="h-11 bg-muted/20 border-none rounded-xl font-bold" 
              />
            </div>
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl sm:col-span-2">
              <div className="space-y-0.5">
                <Label className="text-xs font-bold">開啟「運費到付」模式</Label>
                <p className="text-[10px] text-muted-foreground">貨到後由顧客支付運費。</p>
              </div>
              <Switch 
                checked={config.collect} 
                onCheckedChange={(v) => onUpdate(id, 'collect', v)} 
              />
            </div>
          </div>
          
          <div className="grid gap-2">
            <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">配送備註</Label>
            <Textarea 
              value={config.notes} 
              onChange={(e) => onUpdate(id, 'notes', e.target.value)} 
              className="h-24 bg-muted/10 border-none rounded-2xl text-sm" 
              placeholder="例如：自取時間提醒..." 
            />
          </div>
        </CardContent>
      )}
    </Card>
  );
}

