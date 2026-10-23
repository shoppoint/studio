"use client";

import { 
  Layers, 
  PlusCircle, 
  Globe, 
  Camera, 
  Info, 
  Search, 
  Plus, 
  X, 
  Upload,
  Loader2,
  Tag,
  KeyRound,
  Sparkles,
  Zap,
  Palette,
  Image as ImageIcon,
  Share2,
  CheckCircle2,
  AlertTriangle,
  Barcode,
  Check,
  Wand2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { useState, useRef } from "react";
import { useStorage } from "@/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { compressImage } from "@/lib/image-utils";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export function ProductRelationsTab({ formData, onInputChange, allProducts, productId, lang, isVendor = false, onAiSeoGenerate, aiLoading: parentAiLoading }: any) {
  const { toast } = useToast();
  const storage = useStorage();
  const shelfInputRef = useRef<HTMLInputElement>(null);
  
  const [search, setSearch] = useState("");
  const [accessorySearch, setAccessorySearch] = useState("");
  const [uploading, setUploading] = useState(false);
  const [langTab, setLangTab] = useState("zh");

  const aiLoading = parentAiLoading;

  const handleShelfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const blob = await compressImage(file, 1200, 0.85);
      const sRef = ref(storage, `products/${productId}/shelf_${Date.now()}.webp`);
      const uploadTask = uploadBytesResumable(sRef, blob, { contentType: 'image/webp' });
      await new Promise<void>((resolve, reject) => {
        uploadTask.on('state_changed', null, reject, async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          onInputChange("shelfPhotoUrl", url);
          resolve();
        });
      });
      toast({ title: "貨架照片已上傳" });
    } catch (err: any) {
      toast({ title: "上傳失敗", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const getName = (p: any) => lang === 'en' ? (p.productName_en || p.productName_zh) : (p.productName_zh || p.productName_en);

  const addRelatedProduct = (pId: string) => {
    const current = Array.isArray(formData.relatedProducts) ? formData.relatedProducts : [];
    if (current.includes(pId)) { toast({ title: "產品已在清單中" }); return; }
    onInputChange("relatedProducts", [...current, pId]);
  };

  const addAccessoryProduct = (pId: string) => {
    const current = Array.isArray(formData.accessoryProductIds) ? formData.accessoryProductIds : [];
    if (current.includes(pId)) { toast({ title: "產品已在清單中" }); return; }
    onInputChange("accessoryProductIds", [...current, pId]);
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-300">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="border-none shadow-sm rounded-3xl bg-white">
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Layers className="h-5 w-5 text-primary" /> 相關產品關聯</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted/20 border-2 border-dashed rounded-2xl min-h-[100px]">
              <div className="flex flex-wrap gap-2 mb-4">
                {(formData.relatedProducts || []).map((id: string) => {
                  const p = allProducts?.find((it: any) => it.id === id);
                  return (
                    <Badge key={id} variant="secondary" className="gap-1 pr-1 bg-white border shadow-sm">
                      <span className="max-w-[150px] truncate">{p ? getName(p) : id}</span>
                      <button type="button" onClick={() => onInputChange("relatedProducts", (formData.relatedProducts || []).filter((i:any) => i !== id))} className="hover:text-destructive"><X className="h-3 w-3" /></button>
                    </Badge>
                  );
                })}
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full h-10 border-dashed rounded-xl bg-white font-bold"><Plus className="h-4 w-4 mr-2 text-primary" /> 選取產品</Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-0 rounded-2xl shadow-2xl border-none">
                  <div className="p-2 border-b"><Input placeholder="搜尋..." value={search} onChange={e => setSearch(e.target.value)} className="h-9 text-xs" /></div>
                  <ScrollArea className="h-60"><div className="p-1 space-y-1">{allProducts?.filter((p:any) => (p.productName_zh + (p.productName_en || "")).toLowerCase().includes(search.toLowerCase())).map((p:any) => (<button key={p.id} type="button" className="w-full text-left px-3 py-2 text-xs hover:bg-primary/10 rounded-lg flex items-center justify-between group" onClick={() => addRelatedProduct(p.id)}><span className="truncate flex-1">{getName(p)}</span><Plus className="h-3 w-3 text-primary opacity-0 group-hover:opacity-100" /></button>))}</div></ScrollArea>
                </PopoverContent>
              </Popover>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-3xl bg-white">
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><PlusCircle className="h-5 w-5 text-primary" /> 配件產品 (Upselling)</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted/20 border-2 border-dashed rounded-2xl min-h-[100px]">
              <div className="flex flex-wrap gap-2 mb-4">
                {(formData.accessoryProductIds || []).map((id: string) => {
                  const p = allProducts?.find((it: any) => it.id === id);
                  return (
                    <Badge key={id} variant="secondary" className="gap-1 pr-1 bg-white border border-primary/20 shadow-sm text-primary">
                      <span className="max-w-[150px] truncate">{p ? getName(p) : id}</span>
                      <button type="button" onClick={() => onInputChange("accessoryProductIds", (formData.accessoryProductIds || []).filter((i:any) => i !== id))} className="hover:text-destructive"><X className="h-3 w-3" /></button>
                    </Badge>
                  );
                })}
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full h-10 border-dashed rounded-xl bg-white font-bold"><Plus className="h-4 w-4 mr-2 text-primary" /> 增加配件</Button>
                </PopoverTrigger>
                <PopoverContent className="w-72 p-0 rounded-2xl shadow-2xl border-none">
                  <div className="p-2 border-b"><Input placeholder="搜尋配件..." value={accessorySearch} onChange={e => setAccessorySearch(e.target.value)} className="h-9 text-xs" /></div>
                  <ScrollArea className="h-60"><div className="p-1 space-y-1">{allProducts?.filter((p:any) => (p.productName_zh + (p.productName_en || "")).toLowerCase().includes(accessorySearch.toLowerCase())).map((p:any) => (<button key={p.id} type="button" className="w-full text-left px-3 py-2 text-xs hover:bg-primary/10 rounded-lg flex items-center justify-between group" onClick={() => addAccessoryProduct(p.id)}><span className="truncate flex-1">{getName(p)}</span><Plus className="h-3 w-3 text-primary opacity-0 group-hover:opacity-100" /></button>))}</div></ScrollArea>
                </PopoverContent>
              </Popover>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm rounded-3xl border-l-4 border-blue-500 overflow-hidden w-full">
        <CardHeader className="bg-blue-50/50 border-b py-6 px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-xl font-black flex items-center gap-2 text-blue-700"><Globe className="h-6 w-6" /> 外部搜尋優化 (External SEO)</CardTitle>
            <CardDescription>配置此產品在搜尋引擎的顯示方式。生成時會同步更新「站內搜尋標籤」。</CardDescription>
          </div>
          {!isVendor && (
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="h-10 bg-blue-100 text-blue-700 border-none px-4 gap-2 font-black hidden sm:flex"><CheckCircle2 className="h-4 w-4" /> 整合站內標籤同步</Badge>
              <Button className="bg-blue-600 text-white font-black h-11 px-8 rounded-xl shadow-lg gap-2" onClick={onAiSeoGenerate} disabled={aiLoading}>
                {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} 同步生成雙語 SEO 與標籤
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="p-8 space-y-8">
          <Tabs value={langTab} onValueChange={setLangTab}>
            <div className="flex justify-between items-center mb-6">
               <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">SEO 多語言內容</Label>
               <TabsList className="bg-muted/50 h-9 p-1 rounded-xl"><TabsTrigger value="en" className="px-6 rounded-lg text-xs font-bold">EN</TabsTrigger><TabsTrigger value="zh" className="px-6 rounded-lg text-xs font-bold">中</TabsTrigger></TabsList>
            </div>
            {['en', 'zh'].map(l => (
              <TabsContent key={l} value={l} className="space-y-8 animate-in fade-in">
                <div className="grid gap-3"><Label className="text-xs font-black uppercase text-muted-foreground ml-1">Meta Title ({l.toUpperCase()})</Label><Input value={formData[`seoTitle_${l}`] || ""} onChange={(e) => onInputChange(`seoTitle_${l}`, e.target.value)} className="bg-muted/20 border-none rounded-xl h-12 text-lg font-bold" /></div>
                <div className="grid gap-3"><Label className="text-xs font-black uppercase text-muted-foreground ml-1">Meta Description ({l.toUpperCase()})</Label><Textarea value={formData[`seoDescription_${l}`] || ""} onChange={(e) => {onInputChange(`seoDescription_${l}`, e.target.value)}} className="bg-muted/20 border-none rounded-2xl min-h-[120px] p-4 text-sm leading-relaxed" /></div>
                <div className="grid gap-3">
                  <Label className="text-xs font-black uppercase text-muted-foreground ml-1 flex items-center gap-2"><Share2 className="h-3 w-3 text-blue-600" /> 外部搜尋關鍵字 (External Keywords - {l.toUpperCase()})</Label>
                  <Input value={formData[`seoKeywords_${l}`] || ""} onChange={(e) => onInputChange(`seoKeywords_${l}`, e.target.value)} className="bg-muted/20 border-none rounded-xl h-11 font-medium text-blue-700" placeholder="引流詞：日本代購, 免運費, 送禮..." />
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-white border-l-4 border-orange-500">
        <CardHeader className="bg-orange-50/50 border-b py-5 px-8">
          <CardTitle className="text-lg flex items-center gap-2 text-orange-900">
            <Camera className="h-5 w-5" /> GMC 在地庫存驗證助手 (Real-world Ready)
          </CardTitle>
          <CardDescription>
            此區塊專為 Google 抽查「實體店面庫存」而設。請確保實體店價格與後台 100% 同步。
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-10">
          <div className="space-y-8">
            <div className="flex items-center justify-between p-4 bg-orange-100/30 rounded-2xl border border-orange-200">
              <div className="space-y-0.5">
                <Label className="text-sm font-black text-orange-900">需要 GMC 照片驗證</Label>
                <p className="text-[9px] text-orange-700 font-medium">標記此產品為 Google 實地抽查項目。</p>
              </div>
              <Switch checked={formData.isGmcPhotoRequired || false} onCheckedChange={(v) => onInputChange("isGmcPhotoRequired", v)} />
            </div>

            <div className="grid gap-2">
              <Label className="text-xs font-black uppercase text-orange-800 ml-1">實體店面標價 (Shelf Price)</Label>
              <div className="relative">
                <Input 
                  type="number" 
                  step="0.1"
                  value={formData.shelfPrice ?? 0} 
                  onChange={(e) => onInputChange("shelfPrice", Number(e.target.value))} 
                  className="h-12 bg-muted/20 border-none rounded-xl font-black text-2xl text-orange-600 pl-8" 
                />
                <span className="absolute left-3 top-3 text-xs font-black opacity-30">$</span>
              </div>
              <p className="text-[10px] text-muted-foreground italic px-1">
                * 實體店標籤價格必須與此數值完全一致，這也是 Feed 同步至 Google 的最終數據。
              </p>
            </div>

            <div className="p-6 bg-orange-50 rounded-[2rem] border-2 border-dashed border-orange-200 space-y-4">
              <p className="text-[10px] font-black text-orange-800 uppercase flex items-center gap-2 tracking-widest">
                <CheckCircle2 className="h-3.5 w-3.5" /> 拍攝合格率檢核清單 (CHECKLIST)
              </p>
              <ul className="space-y-3 text-[11px] text-orange-900 font-bold leading-relaxed">
                <li className="flex items-start gap-2">
                   <div className="h-4 w-4 rounded-full bg-white flex items-center justify-center shrink-0 border border-orange-200 mt-0.5"><Check className="h-2.5 w-2.5" /></div>
                   照片必須清晰包含：產品包裝上的條碼 (GTIN)
                </li>
                <li className="flex items-start gap-2">
                   <div className="h-4 w-4 rounded-full bg-white flex items-center justify-center shrink-0 border border-orange-200 mt-0.5"><Check className="h-2.5 w-2.5" /></div>
                   照片必須清晰包含：貨架上顯示的價格標籤
                </li>
                <li className="flex items-start gap-2">
                   <div className="h-4 w-4 rounded-full bg-white flex items-center justify-center shrink-0 border border-orange-200 mt-0.5"><Check className="h-2.5 w-2.5" /></div>
                   兩者需位於同一張照片內，且背景可識別為實體店內
                </li>
              </ul>
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-xs font-black uppercase text-orange-800 ml-1">貨架標籤照片 (Proof of Existence)</Label>
            <div 
              className={cn(
                "aspect-video rounded-3xl border-2 border-dashed bg-muted/20 flex items-center justify-center relative group overflow-hidden cursor-pointer shadow-inner transition-all",
                formData.shelfPhotoUrl ? "border-orange-500/50" : "border-muted-foreground/30 hover:border-orange-500"
              )}
              onClick={() => shelfInputRef.current?.click()}
            >
              {formData.shelfPhotoUrl ? (
                <img src={formData.shelfPhotoUrl} className="object-contain w-full h-full p-2" alt="Shelf proof" />
              ) : (
                <div className="text-center space-y-2">
                  <Camera className="h-10 w-10 text-muted-foreground/30 mx-auto" />
                  <p className="text-[10px] font-black text-muted-foreground uppercase">點擊上傳實拍照片</p>
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Button variant="secondary" size="sm" className="font-black rounded-xl shadow-lg gap-2">
                  {uploading ? <Loader2 className="animate-spin h-4 w-4" /> : <Upload className="h-4 w-4" />}
                  {formData.shelfPhotoUrl ? "更新照片" : "立即上傳照片"}
                </Button>
              </div>
            </div>
            
            {uploading && (
              <div className="px-2">
                <Progress value={80} className="h-1 animate-pulse" />
              </div>
            )}
            
            <input type="file" ref={shelfInputRef} className="hidden" onChange={handleShelfUpload} accept="image/*" />

            <div className="bg-slate-50 p-4 rounded-2xl flex items-start gap-3">
              <Info className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
              <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                若 Google 抽查失敗，請刪除此照片並重新拍攝。照片應為原圖，避免過度修圖或加水印。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
