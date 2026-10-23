
"use client";

import { useState } from "react";
import { 
  X, 
  Search, 
  ChevronDown,
  Check,
  Barcode as BarcodeIcon,
  Globe,
  Wand2,
  SearchCode,
  Gift,
  Store,
  Loader2,
  Zap,
  Tag as TagIcon,
  Award,
  Tags,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const GIFT_TAGS = [
  { code: "gift:kids", label: "小朋友" },
  { code: "gift:elders", label: "長輩健康" },
  { code: "gift:partner", label: "甜蜜伴侶" },
  { code: "gift:friends", label: "好友精品" },
  { code: "gift:event", label: "活動／離職小禮物" },
  { code: "gift:seasonal", label: "節日禮品" },
];

export function ProductBasicsTab({ 
  formData, 
  onInputChange, 
  categories, 
  brands, 
  vendors,
  lang,
  onAiGenerate,
  onSuggestSlug,
  aiLoading,
  isVendor = false 
}: any) {
  const { toast } = useToast();
  const [catSearch, setCatSearch] = useState("");
  const [secondaryBrandSearch, setSecondaryBrandSearch] = useState("");
  const [primaryBrandSearch, setPrimaryBrandSearch] = useState("");

  const normalizedStatus = formData.status?.toLowerCase() === 'active' ? "Active" : "Inactive";

  const toggleCategory = (catId: string) => {
    const current = Array.isArray(formData.categories) ? formData.categories : [];
    const next = current.includes(catId) ? current.filter((id: string) => id !== id) : [...current, catId];
    onInputChange("categories", Array.from(new Set(next)));
  };

  const toggleCollabBrand = (brandName: string) => {
    const current = Array.isArray(formData.collabBrands) ? formData.collabBrands : [];
    const next = current.includes(brandName) ? current.filter((b: string) => b !== brandName) : [...current, brandName];
    onInputChange("collabBrands", Array.from(new Set(next)));
  };

  const appendGiftTag = (code: string) => {
    const current = formData.searchKeywordsRaw || "";
    if (current.includes(code)) {
      toast({ title: "標籤已存在", description: `「${code}」已經在標籤清單中。` });
      return;
    }
    const next = current ? `${current}, ${code}` : code;
    onInputChange("searchKeywordsRaw", next);
    toast({ title: "標籤已加入", description: `已將「${code}」加入中文標籤欄位。` });
  };

  const getCatName = (cat: any) => lang === 'en' ? (cat.name_en || cat.name_zh) : (cat.name_zh || cat.name_en);

  return (
    <CardContent className="p-8 space-y-12 animate-in fade-in duration-300">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="space-y-6">
          <div className="grid gap-2">
            <Label className="text-xs font-black uppercase text-muted-foreground ml-1">產品名稱 (中文)</Label>
            <Input value={formData.productName_zh || ""} onChange={(e) => onInputChange('productName_zh', e.target.value)} className="h-12 text-lg font-bold rounded-xl bg-muted/20 border-none" />
          </div>
          <div className="grid gap-2">
            <Label className="text-xs font-black uppercase text-muted-foreground ml-1">產品名稱 (English)</Label>
            <Input value={formData.productName_en || ""} onChange={(e) => onInputChange('productName_en', e.target.value)} className="h-12 text-lg font-bold rounded-xl bg-muted/20 border-none" />
          </div>

          <div className="grid gap-2">
            <Label className="text-xs font-black uppercase text-muted-foreground ml-1">網址 Slug (URL Path)</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Globe className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  value={formData.slug || ""} 
                  onChange={(e) => onInputChange('slug', e.target.value)} 
                  className="h-11 pl-10 bg-muted/20 border-none rounded-xl font-mono text-xs" 
                  placeholder="e.g. organic-honey-500g"
                />
              </div>
              <Button 
                variant="outline" 
                className="h-11 rounded-xl border-primary text-primary font-bold gap-2 px-4 bg-white"
                onClick={(e) => { e.preventDefault(); onSuggestSlug(); }}
                type="button"
              >
                <Wand2 className="h-4 w-4" />
                <span className="hidden sm:inline">建議 Slug</span>
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="grid gap-2">
              <Label className="text-xs font-black uppercase text-muted-foreground ml-1">產品狀態 (Status)</Label>
              <Select value={normalizedStatus} onValueChange={(v) => onInputChange("status", v)}>
                <SelectTrigger className="h-11 bg-primary/5 rounded-xl font-bold text-primary border-primary/20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-none shadow-2xl">
                  <SelectItem value="Active" className="font-bold text-green-600">Active (上架中)</SelectItem>
                  <SelectItem value="Inactive" className="font-bold text-muted-foreground">Inactive (已下架)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label className="text-xs font-black uppercase text-muted-foreground ml-1">產品狀況 (Condition)</Label>
              <Select value={formData.condition || "New"} onValueChange={(v) => onInputChange("condition", v)}>
                <SelectTrigger className="h-11 bg-muted/20 rounded-xl font-bold border-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-none shadow-2xl">
                  <SelectItem value="New">全新 (New)</SelectItem>
                  <SelectItem value="Used">二手 (Used)</SelectItem>
                  <SelectItem value="Refurbished">翻新 (Refurbished)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label className="text-xs font-black uppercase flex items-center gap-2 text-muted-foreground ml-1">
              <Store className="h-3.5 w-3.5 text-primary" /> 
              所屬合作商店 (Vendor)
            </Label>
            {isVendor ? (
              <div className="h-11 bg-muted/20 border-none rounded-xl flex items-center px-4 font-bold text-sm text-primary">
                {vendors?.find((v: any) => v.id === formData.vendorId)?.name || formData.vendorId || "未分配商店"}
                <Badge className="ml-auto bg-white/50 text-muted-foreground border-none text-[8px] font-black uppercase h-5">Locked</Badge>
              </div>
            ) : (
              <Select value={formData.vendorId || "none"} onValueChange={(v) => onInputChange("vendorId", v === "none" ? "" : v)}>
                <SelectTrigger className="h-11 bg-muted/20 border-none rounded-xl font-bold text-sm">
                  <SelectValue placeholder="選擇合作商店..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-none shadow-2xl">
                  <SelectItem value="none" className="text-muted-foreground italic">-- 平台自營 (Internal) --</SelectItem>
                  {vendors?.map((v: any) => (
                    <SelectItem key={v.id} value={v.id || ''} className="font-bold">{v.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <div className="space-y-10">
          <div className="grid gap-2">
            <Label className="text-xs font-black uppercase text-muted-foreground ml-1">產品分類 (多選)</Label>
            <div className="flex flex-wrap gap-2 p-4 bg-muted/20 rounded-2xl border-2 border-dashed">
              {!formData.categories || formData.categories.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">尚未選取分類...</p>
              ) : (
                formData.categories.map((catId: string) => {
                  const cat = categories?.find((c: any) => c.id === catId);
                  return (
                    <Badge key={catId} variant="secondary" className="bg-white border shadow-sm pr-1 py-1 gap-1">
                      {cat ? getCatName(cat) : catId}
                      <button onClick={() => toggleCategory(catId)} className="hover:text-destructive transition-colors">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  );
                })
              )}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 rounded-lg border-dashed bg-white font-bold ml-auto">
                    <Plus className="h-3 w-3 mr-1" /> 選取分類
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-0 rounded-2xl shadow-2xl border-none">
                  <div className="p-2 border-b">
                    <Input 
                      placeholder="搜尋分類 (中/英)..." 
                      value={catSearch} 
                      onChange={(e) => setCatSearch(e.target.value)} 
                      className="h-8 text-xs" 
                    />
                  </div>
                  <ScrollArea className="h-64 p-2">
                    <div className="space-y-1">
                      {categories?.filter((cat: any) => {
                        const searchLower = catSearch.toLowerCase();
                        return (cat.name_zh || "").toLowerCase().includes(searchLower) || 
                               (cat.name_en || "").toLowerCase().includes(searchLower);
                      }).map((cat: any) => (
                        <div key={cat.id} className="flex items-center space-x-2 p-2 hover:bg-muted rounded-xl cursor-pointer" onClick={() => toggleCategory(cat.id)}>
                          <Checkbox checked={(formData.categories || []).includes(cat.id)} onCheckedChange={() => {}} />
                          <label className="text-xs font-medium cursor-pointer flex-1">{getCatName(cat)}</label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid gap-2">
              <Label className="text-xs font-black uppercase text-muted-foreground ml-1 flex items-center gap-2">
                <Award className="h-3.5 w-3.5 text-primary" /> 主要品牌 (Primary)
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-11 justify-between rounded-xl bg-muted/20 border-none font-bold text-sm text-left overflow-hidden">
                    <span className="truncate">{formData.primaryBrand || "選擇主要品牌..."}</span>
                    <ChevronDown className="h-4 w-4 opacity-50 shrink-0" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-0 rounded-2xl shadow-2xl border-none">
                  <div className="p-2 border-b">
                    <Input 
                      placeholder="搜尋品牌 (中/英)..." 
                      value={primaryBrandSearch} 
                      onChange={(e) => setPrimaryBrandSearch(e.target.value)} 
                      className="h-8 text-xs" 
                    />
                  </div>
                  <ScrollArea className="h-60">
                    <div className="p-1">
                      {brands?.filter((b: any) => {
                        const searchLower = primaryBrandSearch.toLowerCase();
                        return (b.name_en || "").toLowerCase().includes(searchLower) || 
                               (b.name_zh || "").toLowerCase().includes(searchLower);
                      }).map((b: any) => {
                        const bName = lang === 'en' ? (b.name_en || b.name_zh) : (b.name_zh || b.name_en);
                        return (
                          <button 
                            key={b.id} 
                            className="w-full text-left px-3 py-2 text-xs hover:bg-primary/10 rounded-lg flex items-center justify-between" 
                            onClick={() => onInputChange("primaryBrand", bName)}
                          >
                            {bName}
                            {formData.primaryBrand === bName && <Check className="h-3 w-3 text-primary" />}
                          </button>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </PopoverContent>
              </Popover>
            </div>

            <div className="grid gap-2">
              <Label className="text-xs font-black uppercase text-muted-foreground ml-1 flex items-center gap-2">
                <Tags className="h-3.5 w-3.5 text-primary" /> 聯乘品牌 (Collabs - 可多選)
              </Label>
              <div className="flex flex-wrap gap-2 p-4 bg-muted/10 rounded-2xl border-2 border-dashed min-h-[60px]">
                {(!formData.collabBrands || formData.collabBrands.length === 0) ? (
                  <p className="text-xs text-muted-foreground italic px-1">尚未選取聯乘品牌...</p>
                ) : (
                  formData.collabBrands.map((bName: string) => (
                    <Badge key={bName} variant="secondary" className="bg-white border text-xs font-bold pr-1 h-8 shadow-sm">
                      {bName}
                      <button onClick={() => toggleCollabBrand(bName)} className="ml-1 p-1 hover:text-destructive transition-colors"><X className="h-3.5 w-3.5" /></button>
                    </Badge>
                  ))
                )}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 rounded-lg border-dashed bg-white font-bold ml-auto">
                      <Plus className="h-3.5 w-3.5 mr-1" /> 增加
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-0 rounded-2xl shadow-2xl border-none">
                    <div className="p-2 border-b"><Input placeholder="搜尋品牌 (中/英)..." value={secondaryBrandSearch} onChange={e => setSecondaryBrandSearch(e.target.value)} className="h-8 text-xs" /></div>
                    <ScrollArea className="h-60">
                      <div className="p-1">
                        {brands?.filter((b: any) => {
                          const searchLower = secondaryBrandSearch.toLowerCase();
                          return (b.name_en || "").toLowerCase().includes(searchLower) || 
                                 (b.name_zh || "").toLowerCase().includes(searchLower);
                        }).map((b: any) => {
                          const bName = lang === 'en' ? (b.name_en || b.name_zh) : (b.name_zh || b.name_en);
                          const isSelected = formData.collabBrands?.includes(bName);
                          return (
                            <button 
                              key={b.id} 
                              className={cn(
                                "w-full text-left px-3 py-2 text-xs rounded-lg flex items-center justify-between group",
                                isSelected ? "bg-primary/10 text-primary" : "hover:bg-muted"
                              )} 
                              onClick={() => toggleCollabBrand(bName)}
                            >
                              {bName}
                              {isSelected ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3 opacity-0 group-hover:opacity-100" />}
                            </button>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Separator className="border-dashed" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="grid gap-2">
          <Label className="text-xs font-black uppercase text-muted-foreground ml-1">SKU 編碼 (Internal Code)</Label>
          <Input 
            value={formData.sku || ""} 
            onChange={(e) => onInputChange('sku', e.target.value)} 
            className="h-11 bg-muted/20 border-none rounded-xl font-mono" 
            placeholder="例如: W-ER-001"
          />
        </div>
        <div className="grid gap-2">
          <Label className="text-xs font-black uppercase text-muted-foreground ml-1">條碼 (GTIN / Barcode)</Label>
          <div className="relative">
            <BarcodeIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              value={formData.barcode || ""} 
              onChange={(e) => onInputChange('barcode', e.target.value)} 
              className="h-11 pl-10 bg-muted/20 border-none rounded-xl font-mono" 
              placeholder="例如: 6901234567890"
            />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-primary/5 border-primary/20">
          <CardHeader className="py-5 px-8 border-b border-primary/10">
            <CardTitle className="text-sm font-black flex items-center gap-2 text-primary uppercase tracking-widest">
              <SearchCode className="h-5 w-5" /> 站內搜尋與禮物專區標籤 (SEARCH & GIFT TAGS)
            </CardTitle>
            <CardDescription>
              這些標籤用於強化搜尋結果，並決定產品顯示在「禮物專區」的哪個分類負。
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">中文標籤 (ZH)</Label>
                  {!isVendor && (
                    <button 
                      type="button"
                      className="h-6 text-primary font-black text-[9px] uppercase hover:underline flex items-center gap-1"
                      onClick={(e) => { e.preventDefault(); onAiGenerate(); }}
                      disabled={aiLoading}
                    >
                      {aiLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />} AI 同步生成
                    </button>
                  )}
                </div>
                <Input 
                  value={formData.searchKeywordsRaw || ""} 
                  onChange={(e) => onInputChange('searchKeywordsRaw', e.target.value)} 
                  className="bg-white border-none rounded-xl h-11 text-xs font-bold" 
                  placeholder="例如：藍芽, 降噪, gift:kids" 
                />
              </div>
              <div className="grid gap-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">英文標籤 (EN)</Label>
                <Input 
                  value={formData.searchKeywordsRaw_en || ""} 
                  onChange={(e) => onInputChange('searchKeywordsRaw_en', e.target.value)} 
                  className="bg-white border-none rounded-xl h-11 text-xs font-bold" 
                  placeholder="e.g. Wireless, Noise Cancelling, gift:kids" 
                />
              </div>
            </div>

            <div className="bg-[#1A1A4D] p-6 sm:p-8 rounded-[2rem] shadow-xl relative overflow-hidden group border border-white/10">
              <div className="flex flex-col sm:flex-row items-start gap-6 relative z-10">
                <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center text-white border border-white/20 shrink-0 shadow-lg">
                  <Gift className="h-6 w-6" />
                </div>
                <div className="flex-1 space-y-5">
                  <div>
                    <h4 className="font-black text-white uppercase tracking-wider text-sm">
                      禮物專區精準分類指南 (GIFT ZONE GUIDE)
                    </h4>
                    <p className="text-white/60 text-[11px] mt-1 leading-relaxed">
                      要在「禮物專區」準確分類，請在標籤中加入以下代碼 (不分中英文欄位)：
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {GIFT_TAGS.map((tag) => (
                      <button
                        key={tag.code}
                        type="button"
                        onClick={() => appendGiftTag(tag.code)}
                        className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/30 transition-all text-left group/tag"
                      >
                        <span className="text-[11px] font-mono text-white/90 font-bold">{tag.code} <span className="text-white/40 font-sans ml-1">({tag.label})</span></span>
                        <Plus className="h-3 w-3 text-white/40 group-hover/tag:text-primary transition-colors" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-2">
        <div className="flex items-center justify-between ml-1">
          <Label className="text-xs font-black uppercase text-muted-foreground">Google 產品分類 (GMC Taxonomy)</Label>
          <a 
            href="https://www.google.com/basepages/producttype/taxonomy.en-US.txt" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-[10px] font-black text-primary hover:underline uppercase"
          >
            <SearchCode className="h-3 w-3" />
            查看官方分類表 (en-US)
          </a>
        </div>
        <Input 
          value={formData.googleProductCategory || ""} 
          onChange={(e) => onInputChange("googleProductCategory", e.target.value)} 
          className="h-11 bg-muted/20 border-none rounded-xl"
          placeholder="例如: Food, Beverages & Tobacco > Food Items"
        />
      </div>
    </CardContent>
  );
}
