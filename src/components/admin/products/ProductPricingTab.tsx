
"use client";

import { 
  History, 
  Plus, 
  Trash2, 
  Zap, 
  Package, 
  ShoppingCart, 
  Warehouse, 
  RefreshCcw,
  Percent,
  Star,
  Monitor,
  AlertTriangle,
  EyeOff,
  Info,
  CheckCircle2,
  Globe,
  Tag as TagIcon,
  Palette,
  Check,
  CalendarDays,
  Clock,
  Store
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useMemo, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const PRESET_COLORS = [
  { name: "Brand Gold", bg: "#FFD700", text: "#000000" },
  { name: "Success Green", bg: "#10B981", text: "#FFFFFF" },
  { name: "Sky Blue", bg: "#3B82F6", text: "#FFFFFF" },
  { name: "Danger Red", bg: "#EF4444", text: "#FFFFFF" },
  { name: "Warning Orange", bg: "#F59E0B", text: "#FFFFFF" },
  { name: "Deep Indigo", bg: "#6366F1", text: "#FFFFFF" },
  { name: "Sweet Pink", bg: "#EC4899", text: "#FFFFFF" },
  { name: "Modern Slate", bg: "#64748B", text: "#FFFFFF" },
  { name: "Pure Black", bg: "#000000", text: "#FFFFFF" },
  { name: "Minimal White", bg: "#FFFFFF", text: "#000000" },
];

export function ProductPricingTab({ 
  formData, 
  onInputChange, 
  locations,
  isVendor = false,
  allowedLocationIds = [] 
}: any) {
  const { toast } = useToast();

  const eligibleLocations = useMemo(() => {
    if (!locations) return [];
    if (!isVendor) return locations.filter((l: any) => l.status === 'Active');
    return locations.filter((l: any) => l.status === 'Active' && allowedLocationIds.includes(l.id));
  }, [locations, isVendor, allowedLocationIds]);

  const defaultHub = useMemo(() => 
    eligibleLocations?.find((loc: any) => loc.isDefaultFulfillmentSource) || eligibleLocations[0]
  , [eligibleLocations]);

  const syncInventory = useCallback((updatedBatches: any[]) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const totalSellable = updatedBatches
      .filter(b => !b.expiryDate || b.expiryDate >= todayStr)
      .reduce((acc, b) => acc + (Number(b.quantity) || 0), 0);
    onInputChange("stock", totalSellable);

    const newWarehouseMap: Record<string, number> = {};
    updatedBatches.forEach(b => {
      if (b.locationId && (!b.expiryDate || b.expiryDate >= todayStr)) {
        newWarehouseMap[b.locationId] = (newWarehouseMap[b.locationId] || 0) + (Number(b.quantity) || 0);
      }
    });
    onInputChange("warehouseStock", newWarehouseMap);

    const webHub = locations?.find((l: any) => l.isDefaultFulfillmentSource);
    if (webHub) {
      const hubQty = newWarehouseMap[webHub.id] || 0;
      onInputChange("onlineStock", hubQty);
    }
  }, [locations, onInputChange]);

  const addBatch = () => {
    const newBatch = { 
      batchId: `B-${Date.now().toString().slice(-4)}`, 
      expiryDate: "", 
      quantity: 0, 
      locationId: defaultHub?.id || "", 
      note: "" 
    };
    const next = [...(formData.batches || []), newBatch];
    onInputChange("batches", next);
    syncInventory(next);
  };

  const updateBatch = (index: number, field: string, value: any) => {
    const next = [...(formData.batches || [])];
    next[index] = { ...next[index], [field]: value };
    onInputChange("batches", next);
    syncInventory(next);
  };

  const removeBatch = (index: number) => {
    const next = (formData.batches || []).filter((_: any, i: number) => i !== index);
    onInputChange("batches", next);
    syncInventory(next);
  };

  const aggregatedStockByLocation = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const agg: Record<string, number> = {};
    formData.batches?.forEach((b: any) => {
      if (b.locationId && (!b.expiryDate || b.expiryDate >= todayStr)) {
        agg[b.locationId] = (agg[b.locationId] || 0) + (Number(b.quantity) || 0);
      }
    });
    return agg;
  }, [formData.batches]);

  const totalSellableCount = useMemo(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    return formData.batches?.filter((b: any) => !b.expiryDate || b.expiryDate >= todayStr).reduce((acc: number, b: any) => acc + (Number(b.quantity) || 0), 0) || 0;
  }, [formData.batches]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in duration-300">
      <div className="lg:col-span-7 space-y-8">
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white border-l-4 border-indigo-500">
          <CardHeader className="bg-indigo-50/50 border-b flex flex-row items-center justify-between py-4 px-8">
            <div className="space-y-0.5">
              <CardTitle className="text-lg flex items-center gap-2 text-indigo-700">
                <History className="h-5 w-5" /> 進貨批次與分倉管理
              </CardTitle>
              <CardDescription className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest">
                {isVendor ? "權限限制：僅能存取已獲授權的地點" : "自動過濾模式：已過期批次將不計入前台庫存"}
              </CardDescription>
            </div>
            <Button size="sm" variant="outline" className="h-9 rounded-xl border-indigo-200 text-indigo-700 font-bold gap-1.5 shadow-sm bg-white" onClick={addBatch}>
              <Plus className="h-4 w-4" /> 新增批次
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-dashed">
              {!formData.batches || formData.batches.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground italic text-xs">
                  尚未輸入批次資料。點擊上方按鈕新增進貨記錄。
                </div>
              ) : (
                formData.batches.map((batch: any, index: number) => {
                  const todayStr = new Date().toISOString().split('T')[0];
                  const isExpired = batch.expiryDate && batch.expiryDate < todayStr;
                  return (
                    <div key={index} className={cn(
                      "p-6 grid grid-cols-12 gap-4 items-end border-b last:border-0 border-dashed animate-in slide-in-from-top-2",
                      isExpired && "bg-red-50/50 opacity-80"
                    )}>
                      <div className="col-span-2 space-y-1.5">
                        <Label className="text-[9px] font-black uppercase opacity-60">批次 ID</Label>
                        <Input value={batch.batchId || ""} onChange={(e) => updateBatch(index, "batchId", e.target.value)} className="h-10 bg-muted/20 border-none rounded-xl text-[10px] font-bold" />
                      </div>
                      <div className="col-span-3 space-y-1.5">
                        <Label className="text-[9px] font-black uppercase opacity-60">儲存地點</Label>
                        <Select value={batch.locationId || ""} onValueChange={(v) => updateBatch(index, "locationId", v)}>
                          <SelectTrigger className="h-10 bg-muted/20 border-none rounded-xl text-[10px] font-bold">
                            <SelectValue placeholder="選擇分倉" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-none shadow-2xl">
                            {eligibleLocations.map((l: any) => (
                              <SelectItem key={l.id} value={l.id || ''}>
                                <div className="flex items-center gap-2">
                                  {l.isDefaultFulfillmentSource && <Zap className="h-3 w-3 text-primary fill-current" />}
                                  {l.name_zh || l.name_en}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-3 space-y-1.5">
                        <div className="flex justify-between items-center">
                          <Label className="text-[9px] font-black uppercase opacity-60">賞味/使用期限</Label>
                          {isExpired && <Badge className="bg-red-600 text-white h-4 text-[7px] font-black px-1 border-none">EXPIRED</Badge>}
                        </div>
                        <Input type="date" value={batch.expiryDate || ""} onChange={(e) => updateBatch(index, "expiryDate", e.target.value)} className={cn("h-10 bg-muted/20 border-none rounded-xl text-[10px] font-bold", isExpired && "text-red-600")} />
                      </div>
                      <div className="col-span-3 space-y-1.5">
                        <Label className="text-[9px] font-black uppercase opacity-60">入貨數量</Label>
                        <Input type="number" value={batch.quantity ?? 0} onChange={(e) => updateBatch(index, "quantity", e.target.value)} className="h-10 bg-muted/20 border-none rounded-xl text-center font-black text-sm" />
                      </div>
                      <div className="col-span-1">
                        <Button variant="ghost" size="icon" className="h-10 w-10 text-destructive hover:bg-red-50 rounded-xl" onClick={() => removeBatch(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
          <CardFooter className="bg-muted/10 p-4 px-8 border-t flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="text-[10px] font-black uppercase opacity-60">可銷售庫存總計 (排除過期)</span>
            </div>
            <span className="text-xl font-black text-indigo-600">{totalSellableCount} Units</span>
          </CardFooter>
        </Card>

        <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
          <CardHeader className="bg-muted/10 border-b py-4 px-8">
            <CardTitle className="text-lg flex items-center gap-2">
              <TagIcon className="h-5 w-5 text-primary" />
              客製化標籤 (Custom Badge)
            </CardTitle>
            <CardDescription>顯示於產品左上角的特殊醒目標示。</CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">標籤文字 (中/英)</Label>
                  <Input 
                    placeholder="中文內容 (如：限時優惠)" 
                    value={formData.badgeText_zh || ""} 
                    onChange={e => onInputChange('badgeText_zh', e.target.value)}
                    className="h-10 rounded-xl"
                  />
                  <Input 
                    placeholder="English Text (e.g. Hot Deal)" 
                    value={formData.badgeText_en || ""} 
                    onChange={e => onInputChange('badgeText_en', e.target.value)}
                    className="h-10 rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-4">
                 <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">色彩風格預覽</Label>
                 <div className="flex flex-col items-center justify-center p-6 bg-muted/20 rounded-2xl border-2 border-dashed relative">
                    {formData.badgeText_zh || formData.badgeText_en ? (
                      <Badge 
                        style={{ backgroundColor: formData.badgeBgColor || "#FFD700", color: formData.badgeTextColor || "#000000" }}
                        className="h-8 px-6 rounded-full font-black text-xs uppercase shadow-lg border-none animate-in zoom-in"
                      >
                        {formData.badgeText_zh || formData.badgeText_en}
                      </Badge>
                    ) : (
                      <p className="text-[10px] text-muted-foreground italic font-medium">請輸入文字以觀看預覽</p>
                    )}
                 </div>
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1 flex items-center gap-2">
                <Palette className="h-3 w-3 text-primary" /> 快速配色方案
              </Label>
              <div className="grid grid-cols-5 sm:grid-cols-10 gap-3">
                {PRESET_COLORS.map((preset) => (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      onInputChange('badgeBgColor', preset.bg);
                      onInputChange('badgeTextColor', preset.text);
                    }}
                    className={cn(
                      "h-10 w-full rounded-xl border-2 flex items-center justify-center transition-all hover:scale-110",
                      formData.badgeBgColor === preset.bg ? "border-primary shadow-md ring-2 ring-primary/20" : "border-transparent"
                    )}
                    style={{ backgroundColor: preset.bg }}
                    title={preset.name}
                  >
                    {formData.badgeBgColor === preset.bg && <Check className="h-4 w-4" style={{ color: preset.text }} />}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
          <CardHeader className="bg-muted/10 border-b"><CardTitle className="text-lg">銷售定價與政策</CardTitle></CardHeader>
          <CardContent className="p-8 space-y-8">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2"><Label className="text-xs font-black uppercase">原價 ($)</Label><Input type="number" value={formData.price ?? 0} onChange={(e) => onInputChange('price', e.target.value)} className="h-12 bg-muted/20 border-none rounded-xl" /></div>
              <div className="grid gap-2"><Label className="text-xs font-black uppercase text-primary">特價 ($)</Label><Input type="number" value={formData.salePrice ?? 0} onChange={(e) => onInputChange('salePrice', e.target.value)} className="h-12 bg-primary/5 border-2 border-primary/20 rounded-xl font-black text-primary" /></div>
            </div>
            
            <Separator className="border-dashed" />

            <div className="grid gap-4">
              <Label className="text-xs font-black uppercase flex items-center gap-2"><Zap className="h-4 w-4 text-primary" /> 庫存超賣政策 (Overselling)</Label>
              <Select value={formData.inventoryPolicy || "Deny"} onValueChange={(v) => onInputChange("inventoryPolicy", v)}>
                <SelectTrigger className="h-12 rounded-xl bg-muted/20 border-none font-bold"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-xl border-none shadow-2xl border-none">
                  <SelectItem value="Deny">拒絕超賣 (不允許零庫存下單)</SelectItem>
                  <SelectItem value="Allow">允許超賣 (庫存可為負數)</SelectItem>
                  <SelectItem value="PreOrder">預購模式 (允許下單並標註預購)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 pt-2">
              <div className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl border border-dashed">
                <div className="space-y-0.5">
                  <Label className="font-bold flex items-center gap-2">
                    <Store className="h-4 w-4 text-primary" /> 只限門市自取
                  </Label>
                  <p className="text-[10px] text-muted-foreground">可網上購買，但含有該產品的訂單只可選擇門市自取。</p>
                </div>
                <Switch 
                  checked={!!formData.limitToPickup} 
                  onCheckedChange={(v) => onInputChange("limitToPickup", v)} 
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl border border-dashed">
                <div className="space-y-0.5">
                  <Label className="font-bold flex items-center gap-2">
                    <EyeOff className="h-4 w-4 text-primary" /> 只限門市購買
                  </Label>
                  <p className="text-[10px] text-muted-foreground">只會在手動訂單 & POS 顯示及購買，不會在網站上顯示。</p>
                </div>
                <Switch 
                  checked={!!formData.inStoreOnly} 
                  onCheckedChange={(v) => onInputChange("inStoreOnly", v)} 
                />
              </div>
            </div>

            {formData.inventoryPolicy === 'PreOrder' && (
              <div className="p-6 bg-primary/5 rounded-[2rem] border-2 border-primary/20 border-dashed space-y-6 animate-in slide-in-from-top-2">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-primary" />
                  <span className="text-sm font-black uppercase text-primary tracking-tight">預購專屬設定 (Pre-order Details)</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="grid gap-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1 flex items-center gap-2">
                      <Clock className="h-3 w-3" /> 預購截止日期 (銷售期限)
                    </Label>
                    <Input 
                      type="date" 
                      value={formData.preOrderDeadline || ""} 
                      onChange={(e) => onInputChange("preOrderDeadline", e.target.value)} 
                      className="h-11 bg-white border-none rounded-xl font-bold shadow-sm"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1 flex items-center gap-2">
                      <Package className="h-3 w-3" /> 預計到貨日期
                    </Label>
                    <Input 
                      type="date" 
                      value={formData.preOrderExpectedDate || ""} 
                      onChange={(e) => onInputChange("preOrderExpectedDate", e.target.value)} 
                      className="h-11 bg-white border-none rounded-xl font-bold shadow-sm"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="grid gap-4">
              <div className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl border border-dashed">
                <div className="space-y-0.5"><Label className="font-bold flex items-center gap-2"><Star className="h-4 w-4 text-amber-500" /> 精選產品 (Featured)</Label><p className="text-[10px] text-muted-foreground">顯示於首頁推介</p></div>
                <Switch checked={formData.isFeatured === 'Yes'} onCheckedChange={(v) => onInputChange("isFeatured", v ? 'Yes' : 'No')} />
              </div>
              <div className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl border border-dashed">
                <Label className="font-bold flex items-center gap-2"><Monitor className="h-4 w-4" /> POS 系統顯示</Label>
                <Switch checked={formData.showInPos !== false} onCheckedChange={(v) => onInputChange("showInPos", v)} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-5 space-y-8">
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden border-l-4 border-green-500 bg-white">
          <CardHeader className="bg-green-50/50 border-b py-5 px-6">
            <CardTitle className="text-sm font-black uppercase text-green-900 flex items-center gap-2">
              <Globe className="h-4 w-4" /> 網店可售數量 (已過濾過期批次)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-primary/5 p-4 rounded-2xl border border-primary/20 shadow-inner">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase text-primary">Web Sellable Stock</p>
                  <p className="text-4xl font-black text-primary">{formData.onlineStock ?? 0}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-white flex items-center justify-center text-primary shadow-sm">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
              </div>
            </div>

            <Separator className="border-dashed" />

            <div className="space-y-3">
              <Label className="text-xs font-black uppercase opacity-60 flex items-center gap-2"><Warehouse className="h-4 w-4" /> 實時各分倉存量 (僅計未過期)</Label>
              <div className="grid gap-2">
                {eligibleLocations.map((loc: any) => {
                  const isDefault = loc.isDefaultFulfillmentSource;
                  const qty = aggregatedStockByLocation[loc.id] || 0;
                  return (
                    <div key={loc.id} className={cn(
                      "flex justify-between items-center text-sm p-3 rounded-xl transition-all border",
                      isDefault ? "bg-primary/5 border-primary/20 ring-1 ring-primary/10" : "bg-muted/20 border-transparent"
                    )}>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-muted-foreground">{loc.name_zh}</span>
                        {isDefault && <Badge className="h-4 text-[7px] font-black bg-primary text-primary-foreground border-none px-1">WEB HUB</Badge>}
                      </div>
                      <span className={cn("font-black", isDefault ? "text-primary text-base" : "text-muted-foreground")}>{qty}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
