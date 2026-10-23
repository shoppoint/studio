"use client";

import { 
  Package, 
  ShieldCheck, 
  Info, 
  Apple, 
  Flame, 
  Droplets, 
  ChevronDown,
  Sparkles,
  Zap,
  Loader2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { COUNTRIES } from "@/lib/address-data";

const ALLERGEN_OPTIONS = [
  { id: "gluten", label: "含有麩質的穀類 (Gluten)" },
  { id: "crustaceans", label: "甲殼類動物 (Crustaceans)" },
  { id: "eggs", label: "蛋類 (Eggs)" },
  { id: "fish", label: "魚類 (Fish)" },
  { id: "peanuts", label: "花生 (Peanuts)" },
  { id: "soybeans", label: "大豆 (Soybeans)" },
  { id: "milk", label: "奶類 (Milk)" },
  { id: "tree_nuts", label: "木本堅果 (Tree Nuts)" },
  { id: "sulphites", label: "亞硫酸鹽 (Sulphites)" }
];

export function ProductSpecsTab({ formData, onInputChange }: any) {
  const handleSpecChange = (field: string, value: any) => {
    onInputChange("spec", { ...formData.spec, [field]: value });
  };

  const handleNutritionChange = (field: string, value: any) => {
    onInputChange("nutrition", { ...(formData.nutrition || {}), [field]: value });
  };

  const toggleAllergen = (id: string) => {
    const current = formData.allergens || [];
    const next = current.includes(id) ? current.filter((a: string) => a !== id) : [...current, id];
    onInputChange("allergens", next);
  };

  return (
    <CardContent className="p-8 space-y-10 animate-in fade-in duration-300">
      {/* 1. 物理規格 */}
      <div className="space-y-6">
        <h4 className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-2 border-b pb-2">
          <Package className="h-3.5 w-3.5" /> 物理尺寸與重量
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="grid gap-2">
            <Label className="text-xs font-black uppercase">外盒尺寸 (長 x 闊 x 高)</Label>
            <div className="flex gap-2">
              <Input placeholder="長" value={formData.length || ""} onChange={(e) => onInputChange("length", e.target.value)} className="h-11 rounded-xl bg-muted/20 border-none text-center" />
              <Input placeholder="闊" value={formData.width || ""} onChange={(e) => onInputChange("width", e.target.value)} className="h-11 rounded-xl bg-muted/20 border-none text-center" />
              <Input placeholder="高" value={formData.height || ""} onChange={(e) => onInputChange("height", e.target.value)} className="h-11 rounded-xl bg-muted/20 border-none text-center" />
              <Select value={formData.dimensionUnit || "cm"} onValueChange={(v) => onInputChange("dimensionUnit", v)}>
                <SelectTrigger className="w-24 h-11 bg-muted/20 border-none rounded-xl font-bold"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-xl border-none shadow-2xl">
                  <SelectItem value="cm">cm</SelectItem>
                  <SelectItem value="mm">mm</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label className="text-xs font-black uppercase">淨重 / 容量 (Weight)</Label>
            <div className="flex gap-2">
              <Input value={formData.spec?.netWeight || ""} onChange={(e) => handleSpecChange("netWeight", e.target.value)} className="h-11 bg-muted/20 border-none rounded-xl" />
              <Select value={formData.spec?.netWeightUnit || "g"} onValueChange={(v) => handleSpecChange("netWeightUnit", v)}>
                <SelectTrigger className="w-24 h-11 bg-muted/20 border-none rounded-xl font-bold"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-xl border-none shadow-2xl">
                  <SelectItem value="g">g</SelectItem>
                  <SelectItem value="kg">kg</SelectItem>
                  <SelectItem value="ml">ml</SelectItem>
                  <SelectItem value="L">L</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>

      {/* 2. 食品與營養 (HK 7+1 / GMC 對齊) */}
      <div className="space-y-6">
        <h4 className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-2 border-b pb-2">
          <Apple className="h-3.5 w-3.5 text-green-600" /> 食品資訊與營養標籤 (7+1 標準)
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* 過敏原 */}
          <div className="space-y-4">
            <Label className="text-xs font-black uppercase text-muted-foreground">主要過敏原 (Allergens)</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-muted/10 p-4 rounded-2xl border border-dashed">
              {ALLERGEN_OPTIONS.map(opt => (
                <div key={opt.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`allergen-${opt.id}`} 
                    checked={(formData.allergens || []).includes(opt.id)}
                    onCheckedChange={() => toggleAllergen(opt.id)}
                  />
                  <label htmlFor={`allergen-${opt.id}`} className="text-[10px] font-bold leading-none cursor-pointer">{opt.label}</label>
                </div>
              ))}
            </div>
          </div>

          {/* 7+1 表格輸入 */}
          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <Label className="text-xs font-black uppercase text-muted-foreground">營養成分 (每 100g / 100ml)</Label>
              <Input 
                placeholder="食用份量 (e.g. 100g)" 
                value={formData.nutrition?.serving_size || ""} 
                onChange={(e) => handleNutritionChange("serving_size", e.target.value)}
                className="h-7 w-32 text-[10px] font-bold border-none bg-muted/30 rounded-lg text-center"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: "energy_kcal", label: "能量 (Energy)", unit: "kcal" },
                { id: "protein_g", label: "蛋白質 (Protein)", unit: "g" },
                { id: "fat_total_g", label: "總脂肪 (Total Fat)", unit: "g" },
                { id: "fat_saturated_g", label: "飽和脂肪", unit: "g" },
                { id: "fat_trans_g", label: "反式脂肪", unit: "g" },
                { id: "carbohydrates_g", label: "碳水化合物", unit: "g" },
                { id: "sugars_g", label: "糖 (Sugars)", unit: "g" },
                { id: "sodium_mg", label: "鈉 (Sodium)", unit: "mg" }
              ].map(field => (
                <div key={field.id} className="relative group">
                  <Label className="text-[9px] font-black uppercase opacity-60 ml-1 mb-1 block">{field.label}</Label>
                  <div className="relative">
                    <Input 
                      type="number" 
                      step="0.1"
                      value={formData.nutrition?.[field.id] || ""} 
                      onChange={(e) => handleNutritionChange(field.id, e.target.value)} 
                      className="h-10 pr-10 bg-muted/20 border-none rounded-xl font-bold text-xs"
                    />
                    <span className="absolute right-3 top-2.5 text-[9px] font-black text-muted-foreground uppercase">{field.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. 合規 */}
      <div className="space-y-6">
        <h4 className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-2 border-b pb-2">
          <ShieldCheck className="h-3.5 w-3.5" /> 合規與特殊參數
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="grid gap-2">
            <Label className="text-xs font-black uppercase">原產地 (Origin)</Label>
            <Select value={formData.spec?.origin || "Hong Kong"} onValueChange={(v) => handleSpecChange("origin", v)}>
              <SelectTrigger className="h-11 bg-muted/20 border-none rounded-xl font-bold"><SelectValue /></SelectTrigger>
              <SelectContent className="rounded-xl border-none shadow-2xl max-h-60">{COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label className="text-xs font-black uppercase">數量與單位 (Qty per Unit)</Label>
            <div className="flex gap-2">
              <Input type="number" value={formData.spec?.qty || ""} onChange={(e) => handleSpecChange("qty", e.target.value)} className="h-11 bg-muted/20 border-none rounded-xl" />
              <Input value={formData.spec?.qtyUnit || "pcs"} onChange={(e) => handleSpecChange("qtyUnit", e.target.value)} className="w-24 h-11 bg-muted/20 border-none rounded-xl font-bold" placeholder="單位" />
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="grid gap-2"><Label className="text-xs font-black uppercase">除害劑註冊編號 (Pesticide Reg)</Label><Input value={formData.spec?.pesticideReg || ""} onChange={(e) => handleSpecChange("pesticideReg", e.target.value)} className="h-11 bg-muted/20 border-none rounded-xl" /></div>
          <div className="grid gap-2"><Label className="text-xs font-black uppercase">除害劑牌照號碼 (Pesticide Lic)</Label><Input value={formData.spec?.pesticideLic || ""} onChange={(e) => handleSpecChange("pesticideLic", e.target.value)} className="h-11 bg-muted/20 border-none rounded-xl" /></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="grid gap-2"><Label className="text-xs font-black uppercase">耐熱溫度</Label><div className="relative"><Input type="number" value={formData.spec?.heatTemp || ""} onChange={(e) => handleSpecChange("heatTemp", e.target.value)} className="h-11 bg-muted/20 border-none rounded-xl" /><span className="absolute right-3 top-3 text-xs opacity-50">°C</span></div></div>
          <div className="grid gap-2"><Label className="text-xs font-black uppercase">耐冷溫度</Label><div className="relative"><Input type="number" value={formData.spec?.coldTemp || ""} onChange={(e) => handleSpecChange("coldTemp", e.target.value)} className="h-11 bg-muted/20 border-none rounded-xl" /><span className="absolute right-3 top-3 text-xs opacity-50">°C</span></div></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="grid gap-2">
            <Label className="text-xs font-black uppercase">微波爐加熱 (Microwave)</Label>
            <Select value={formData.spec?.microwave || "none"} onValueChange={(v) => handleSpecChange("microwave", v)}>
              <SelectTrigger className="h-11 bg-muted/20 border-none rounded-xl font-bold"><SelectValue /></SelectTrigger>
              <SelectContent className="rounded-xl border-none shadow-2xl">
                <SelectItem value="none">不適用</SelectItem>
                <SelectItem value="can">可以</SelectItem>
                <SelectItem value="cannot">不可以</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label className="text-xs font-black uppercase">洗碗機清洗 (Dishwasher)</Label>
            <Select value={formData.spec?.dishwasher || "none"} onValueChange={(v) => handleSpecChange("dishwasher", v)}>
              <SelectTrigger className="h-11 bg-muted/20 border-none rounded-xl font-bold"><SelectValue /></SelectTrigger>
              <SelectContent className="rounded-xl border-none shadow-2xl">
                <SelectItem value="none">不適用</SelectItem>
                <SelectItem value="can">可以</SelectItem>
                <SelectItem value="cannot">不可以</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </CardContent>
  );
}
