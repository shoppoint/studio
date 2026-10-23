"use client";

import React from "react";
import { 
  Gavel, 
  Building2, 
  Warehouse, 
  Truck, 
  ShieldAlert, 
  Info, 
  AlertTriangle,
  FileText,
  FlaskConical,
  Tags,
  Check,
  MapPin,
  RefreshCcw,
  Zap
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const LEGAL_TAGS = [
  { id: "poison", label_zh: "毒藥 POISON", label_en: "POISON" },
  { id: "keep_away", label_zh: "遠離孩童 KEEP OUT OF REACH OF CHILDREN", label_en: "KEEP OUT OF REACH OF CHILDREN" },
  { id: "refrigerate", label_zh: "需冷藏 REFRIGERATE", label_en: "REFRIGERATE" },
  { id: "adult_18", label_zh: "18+ 禁售 (成人用品)", label_en: "18+ RESTRICTED (ADULT)" },
  { id: "liquor_18", label_zh: "令人醺醉的酒類", label_en: "INTOXICATING LIQUOR" },
  { id: "flammable", label_zh: "易燃 FLAMMABLE", label_en: "FLAMMABLE" },
  { id: "harmful", label_zh: "有害有害 HARMFUL", label_en: "HARMFUL" }
];

export function ProductLegalTab({ formData, onInputChange, lang, brands }: any) {
  const { toast } = useToast();
  const isEn = lang === 'en';

  const handleSpecChange = (field: string, value: any) => {
    onInputChange("spec", { ...(formData.spec || {}), [field]: value });
  };

  /**
   * 核心功能：從品牌檔案同步製造商資料
   */
  const handleSyncFromBrand = () => {
    if (!formData.primaryBrand) {
      toast({ title: "尚未選取主要品牌", variant: "destructive" });
      return;
    }

    const brandName = formData.primaryBrand.trim().toLowerCase();
    const match = brands?.find((b: any) => 
      (b.name_zh && b.name_zh.trim().toLowerCase() === brandName) ||
      (b.name_en && b.name_en.trim().toLowerCase() === brandName)
    );

    if (!match) {
      toast({ title: "找不到品牌檔案", description: `系統中無「${formData.primaryBrand}」的詳細設定。`, variant: "warning" });
      return;
    }

    const nextSpec = { ...(formData.spec || {}) };
    let syncCount = 0;

    if (match.mfrName_zh) { nextSpec.mfrName_zh = match.mfrName_zh; syncCount++; }
    if (match.mfrName_en) { nextSpec.mfrName_en = match.mfrName_en; syncCount++; }
    if (match.mfrAddress_zh) { nextSpec.mfrAddress_zh = match.mfrAddress_zh; syncCount++; }
    if (match.mfrAddress_en) { nextSpec.mfrAddress_en = match.mfrAddress_en; syncCount++; }

    if (syncCount > 0) {
      onInputChange("spec", nextSpec);
      toast({ title: "同步成功", description: `已從「${formData.primaryBrand}」導入 ${syncCount} 項製造商資訊。` });
    } else {
      toast({ title: "無可用資料", description: "該品牌檔案尚未填寫製造商資訊。", variant: "warning" });
    }
  };

  const toggleLegalTag = (tagLabel: string) => {
    const current = Array.isArray(formData.spec?.legalTags) ? formData.spec.legalTags : [];
    const next = current.includes(tagLabel) 
      ? current.filter((t: string) => t !== tagLabel) 
      : [...current, tagLabel];
    handleSpecChange("legalTags", next);
  };

  const renderBilingualField = (label: string, fieldPrefix: string, icon: any, isTextArea = false) => {
    const Icon = icon;
    const Component: any = isTextArea ? Textarea : Input;

    return (
      <div className="space-y-4">
        <Label className="text-xs font-black uppercase text-muted-foreground flex items-center gap-2 ml-1">
          <Icon className="h-3.5 w-3.5 text-primary" /> {label}
        </Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <div className="flex justify-between items-center px-1">
              <span className="text-[9px] font-black text-primary uppercase">繁體中文</span>
            </div>
            <Component 
              value={formData.spec?.[`${fieldPrefix}_zh`] || ""} 
              onChange={(e: any) => handleSpecChange(`${fieldPrefix}_zh`, e.target.value)}
              className={cn("bg-muted/20 border-none rounded-xl text-sm font-bold", isTextArea ? "min-h-[100px]" : "h-11")}
            />
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between items-center px-1">
              <span className="text-[9px] font-black text-primary uppercase">English</span>
            </div>
            <Component 
              value={formData.spec?.[`${fieldPrefix}_en`] || ""} 
              onChange={(e: any) => handleSpecChange(`${fieldPrefix}_en`, e.target.value)}
              className={cn("bg-muted/20 border-none rounded-xl text-sm font-bold", isTextArea ? "min-h-[100px]" : "h-11")}
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-300">
      <div className="px-2 space-y-1">
        <h2 className="text-2xl font-black flex items-center gap-3">
          <Gavel className="h-6 w-6 text-primary" />
          標籤與合規資訊 (Legal Labels)
        </h2>
        <p className="text-xs text-muted-foreground font-bold">
          在此填寫法定標籤所需的詳細資訊。您可以手動輸入，或從「主要品牌」快速同步。
        </p>
      </div>

      <Card className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden">
        <CardHeader className="bg-muted/10 border-b py-5 px-8 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-black flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" /> 製造商與廠商資料 (Manufacturer)
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-9 rounded-xl border-primary text-primary font-black gap-2 bg-white shadow-sm hover:bg-primary/5 transition-all"
            onClick={handleSyncFromBrand}
          >
            <RefreshCcw className="h-3.5 w-3.5" />
            同步品牌資料
          </Button>
        </CardHeader>
        <CardContent className="p-8 space-y-8">
          {renderBilingualField("製造商名稱 (Manufacturer Name)", "mfrName", Building2)}
          {renderBilingualField("製造商地址 (Manufacturer Address)", "mfrAddress", MapPin, true)}
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden">
        <CardHeader className="bg-muted/10 border-b py-5 px-8">
          <CardTitle className="text-base font-black flex items-center gap-2">
            <Warehouse className="h-5 w-5 text-primary" /> 貯存與使用指示 (Storage & Directions)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 space-y-8">
          {renderBilingualField("貯存方法 (Storage)", "storageInstructions", Warehouse, true)}
          {renderBilingualField("使用方法 (Directions for Use)", "usageInstructions", Info, true)}
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden">
        <CardHeader className="bg-muted/10 border-b py-5 px-8">
          <CardTitle className="text-base font-black flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-primary" /> 技術參數 (Technical Data)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 space-y-8">
          {renderBilingualField("有效成分 (Active Ingredients)", "activeIngredients", FlaskConical, true)}
          {renderBilingualField("適用範圍 (Use Scope)", "useScope", Tags, true)}
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden border-l-4 border-slate-400">
        <CardHeader className="bg-muted/10 border-b py-5 px-8">
          <CardTitle className="text-base font-black flex items-center gap-2">
            <Info className="h-5 w-5 text-slate-500" /> 額外資訊 (Extra Information)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 space-y-8">
          {renderBilingualField("自訂額外規格或備註 (Extra Info)", "custom", Info, true)}
        </CardContent>
      </Card>

      <Card className="border-none shadow-xl bg-slate-900 text-white rounded-[2.5rem] overflow-hidden border-l-[12px] border-orange-500">
        <CardHeader className="bg-white/5 border-b p-8">
          <CardTitle className="text-xl font-black flex items-center gap-3 text-orange-400 uppercase tracking-tight">
            <AlertTriangle className="h-6 w-6" /> 注意事項與安全警示
          </CardTitle>
          <CardDescription className="text-slate-400 font-medium">
            整合警告字眼、過敏原提醒及急救方法。此部分資料對安全合規至關重要。
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8 space-y-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-orange-400 ml-1">注意事項 (繁體中文)</Label>
              <Textarea 
                value={formData.spec?.caution_zh || ""} 
                onChange={(e) => handleSpecChange("caution_zh", e.target.value)}
                className="min-h-[150px] bg-white/10 border-none text-white rounded-2xl p-4 text-sm leading-relaxed"
                placeholder="例如：請遠離火源。若不慎觸及眼睛..."
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-orange-400 ml-1">Caution / First Aid (English)</Label>
              <Textarea 
                value={formData.spec?.caution_en || ""} 
                onChange={(e) => handleSpecChange("caution_en", e.target.value)}
                className="min-h-[150px] bg-white/10 border-none text-white rounded-2xl p-4 text-sm leading-relaxed"
                placeholder="e.g. Keep away from heat. If contact with eyes..."
              />
            </div>
          </div>

          <Separator className="bg-white/10" />

          <div className="space-y-4">
            <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">法定樣板標籤勾選 (Legal Tags)</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {LEGAL_TAGS.map((tag) => {
                const isSelected = formData.spec?.legalTags?.includes(tag.label_zh);
                return (
                  <div 
                    key={tag.id} 
                    onClick={() => toggleLegalTag(tag.label_zh)}
                    className={cn(
                      "p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-3",
                      isSelected ? "border-orange-500 bg-orange-500/10" : "border-white/10 bg-white/5 hover:border-white/30"
                    )}
                  >
                    <div className={cn(
                      "h-5 w-5 rounded border-2 flex items-center justify-center transition-all",
                      isSelected ? "bg-orange-50 border-orange-500 text-white" : "border-white/20"
                    )}>
                      {isSelected && <Check className="h-3.5 w-3.5" strokeWidth={4} />}
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-black leading-tight text-white">{tag.label_zh}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
