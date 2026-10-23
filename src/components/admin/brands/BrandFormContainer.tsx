"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  Award,
  Image as ImageIcon,
  Wand2,
  Globe,
  Upload,
  Sparkles,
  Search,
  Tags,
  Plus,
  Check,
  X,
  Zap,
  Store,
  Building2,
  MapPin,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useI18n } from "@/lib/i18n/i18n-context";
import { useToast } from "@/hooks/use-toast";
import { generateBrandContent } from "@/ai/flows/generate-brand-content-flow";
import { generateCategoryContent } from "@/ai/flows/generate-category-content-flow";
import { useStorage, useFirestore, useCollection } from "@/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { doc, updateDoc, addDoc, serverTimestamp, collection, query, orderBy } from "firebase/firestore";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Progress } from "@/components/ui/progress";
import { compressImage } from "@/lib/image-utils";
import { generateSlug } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

interface BrandFormContainerProps {
  mode: 'new' | 'edit';
  brandId?: string;
  initialData?: any;
}

/**
 * 品牌檔案表單容器 (V2)
 * 修正：加入 if (loading) return 守衛，防止重複點擊儲存。
 */
export function BrandFormContainer({ mode, brandId, initialData }: BrandFormContainerProps) {
  const router = useRouter();
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const storage = useStorage();
  const db = useFirestore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("zh");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [catSearch, setCatSearch] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [formData, setFormData] = useState<any>(null);

  const categoriesQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'categories'), orderBy('displayOrder', 'asc'));
  }, [db]);
  const { data: allCategories } = useCollection<any>(categoriesQuery);

  const filteredCategories = useMemo(() => {
    if (!allCategories) return [];
    const q = catSearch.toLowerCase();
    return allCategories.filter(cat => (cat.name_en || "").toLowerCase().includes(q) || (cat.name_zh || "").toLowerCase().includes(q));
  }, [allCategories, catSearch]);

  useEffect(() => {
    if (initialData && !formData) {
      setFormData({ ...initialData });
    }
  }, [initialData, formData]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleSuggestSlug = () => {
    const text = formData?.name_en || formData?.name_zh || "";
    if (text) handleFieldChange('slug', generateSlug(text));
  };

  const toggleCategory = (catId: string) => {
    const current = Array.isArray(formData.categories) ? formData.categories : [];
    const next = current.includes(catId) ? current.filter((id: string) => id !== catId) : [...current, catId];
    handleFieldChange("categories", next);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !storage) return;

    setLoading(true);
    try {
      const compressedBlob = await compressImage(file, 400, 0.85);
      const fileName = `brands/${Date.now()}_logo.webp`;
      const storageRef = ref(storage, fileName);
      const uploadTask = uploadBytesResumable(storageRef, compressedBlob, { contentType: 'image/webp' });

      uploadTask.on('state_changed', 
        (snap) => setUploadProgress((snap.bytesTransferred / snap.totalBytes) * 100),
        (error) => { toast({ title: "Upload Error", variant: "destructive" }); },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          handleFieldChange("logoUrl", downloadURL);
          setUploadProgress(0); setLoading(false);
          toast({ title: t.common.success, description: "Logo 已上傳" });
        }
      );
    } catch (error) { setLoading(false); }
  };

  const handleAiGenerate = async (genMode: 'description' | 'seo') => {
    if (aiLoading) return;
    const currentName = formData?.name_zh || formData?.name_en;
    if (!currentName) { 
      toast({ title: "資訊不足", description: "請先輸入品牌名稱。", variant: "destructive" }); 
      return; 
    }
    
    setAiLoading(true);
    try {
      if (genMode === 'description') {
        const selectedCatNames = (formData.categories || []).map((id: string) => {
          const cat = allCategories?.find((c: any) => c.id === id);
          return cat ? (cat.name_zh || cat.name_en) : "";
        }).filter(Boolean);

        const result = await generateBrandContent({
          brandName: currentName,
          websiteUrl: formData.websiteUrl,
          categoryNames: selectedCatNames
        });
        
        if (!result) throw new Error("AI 服務超時或無回應，請提供更多背景資料後再試。");

        setFormData((prev: any) => {
          const next = JSON.parse(JSON.stringify(prev));
          if (result.en?.content) next.description_en = result.en.content;
          if (result.zh?.content) next.description_zh = result.zh.content;
          return next;
        });
      } else {
        const contextDescription = formData.description_zh || formData.description_en || "";

        const result = await generateCategoryContent({ 
          categoryName: currentName, 
          mode: 'seo',
          description: contextDescription 
        });

        if (!result) throw new Error("AI 服務暫時繁忙，無法生成 SEO 資料。");

        setFormData((prev: any) => {
          const next = JSON.parse(JSON.stringify(prev));
          if (result.en) {
            next.seoTitle_en = result.en.metaTitle || "";
            next.seoDescription_en = result.en.metaDescription || "";
            next.keywords_en = result.en.keywords || "";
          }
          if (result.zh) {
            next.seoTitle_zh = result.zh.metaTitle || "";
            next.seoDescription_zh = result.zh.metaDescription || "";
            next.keywords_zh = result.zh.keywords || "";
          }
          return next;
        });
      }
      setIsDirty(true);
      toast({ title: "AI 生成成功", description: "內容已自動填入對應欄位。" });
    } catch (error: any) { 
      console.error("[Brand AI Generate Error]", error.message);
      toast({ 
        title: "AI 生成失敗", 
        description: error.message || "伺服器超時，請稍後再試一次。", 
        variant: "destructive" 
      }); 
    } finally { setAiLoading(false); }
  };

  const handleSave = async () => {
    if (loading) return; // 物理防止重複點擊
    if (!formData || !db) return;
    setLoading(true);
    const dataToSave = { ...formData, updatedAt: serverTimestamp() };

    try {
      if (mode === 'new') {
        dataToSave.createdAt = serverTimestamp();
        await addDoc(collection(db, 'brands'), dataToSave);
        toast({ title: t.common.success, description: "品牌檔案已建立" });
      } else {
        await updateDoc(doc(db, 'brands', brandId!), dataToSave);
        toast({ title: t.common.success, description: "品牌資料已更新" });
      }
      setIsDirty(false);
      router.push("/admin/brands");
    } catch (error: any) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: mode === 'new' ? 'brands' : `brands/${brandId}`,
        operation: mode === 'new' ? 'create' : 'update',
        requestResourceData: dataToSave,
      }));
    } finally { setLoading(false); }
  };

  if (!formData) return <div className="h-96 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const getCatNameLocal = (cat: any) => lang === 'en' ? (cat.name_en || cat.name_zh) : (cat.name_zh || cat.name_en);

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => { if(isDirty && !confirm("確定退出？")) return; router.back(); }} className="rounded-full"><ArrowLeft className="h-5 w-5" /></Button>
          <div>
            <h1 className="text-3xl font-bold font-headline">{mode === 'new' ? '新增品牌檔案' : '編輯品牌資訊'}</h1>
            {mode === 'edit' && <p className="text-muted-foreground text-xs font-mono">ID: {brandId}</p>}
          </div>
        </div>
        <div className="flex gap-2">
          {isDirty && <Badge variant="outline" className="h-11 px-4 border-orange-200 text-orange-600 bg-orange-50 font-bold uppercase animate-pulse">Unsaved</Badge>}
          <Button className="bg-primary text-primary-foreground font-black shadow-lg rounded-xl h-11 px-8" onClick={handleSave} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {t.common.save}
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
          <CardHeader className="bg-muted/10 border-b py-4 px-8 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2"><Award className="h-5 w-5 text-primary" />品牌識別</CardTitle>
            <Button variant="ghost" size="sm" className="h-8 text-primary gap-2 font-black border border-primary/20 hover:bg-primary/5 px-4" onClick={() => handleAiGenerate('description')} disabled={aiLoading}>
              {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4 fill-current" />} AI 同步生成故事
            </Button>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="grid gap-2">
                <Label className="font-bold">網址 Slug</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Globe className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input value={formData.slug} onChange={(e) => handleFieldChange("slug", e.target.value)} className="h-11 pl-9 font-mono text-xs" />
                  </div>
                  <Button variant="outline" className="rounded-xl h-11 px-4 font-bold" onClick={handleSuggestSlug}><Wand2 className="h-4 w-4" /></Button>
                </div>
              </div>
              <div className="grid gap-2"><Label className="font-bold">官方網站</Label><Input value={formData.websiteUrl} onChange={(e) => handleFieldChange("websiteUrl", e.target.value)} className="h-11" placeholder="https://..." /></div>
            </div>

            <div className="grid gap-2">
              <Label className="font-bold">主營類別</Label>
              <div className="flex flex-wrap gap-2 p-4 bg-muted/20 rounded-2xl border-2 border-dashed">
                {(formData.categories || []).length === 0 ? <p className="text-xs text-muted-foreground italic">尚未選取類別...</p> : (
                  formData.categories.map((catId: string) => {
                    const cat = allCategories?.find((c: any) => c.id === catId);
                    return (<Badge key={catId} variant="secondary" className="bg-white border shadow-sm pr-1 py-1 gap-1">{cat ? getCatNameLocal(cat) : catId}<button onClick={() => toggleCategory(catId)}><X className="h-3 w-3" /></button></Badge>);
                  })
                )}
                <Popover>
                  <PopoverTrigger asChild><Button variant="outline" size="sm" className="h-7 rounded-lg border-dashed bg-white font-bold ml-auto"><Plus className="h-3 w-3 mr-1" /> 選擇</Button></PopoverTrigger>
                  <PopoverContent className="w-64 p-0 rounded-2xl shadow-2xl border-none">
                    <div className="p-3 border-b"><Input placeholder="搜尋..." value={catSearch} onChange={(e) => setCatSearch(e.target.value)} className="h-8 text-xs" /></div>
                    <ScrollArea className="h-64 p-2">
                      <div className="space-y-1">
                        {filteredCategories.map((cat: any) => (
                          <div key={cat.id} className="flex items-center space-x-2 p-2 hover:bg-muted rounded-xl cursor-pointer" onClick={() => toggleCategory(cat.id)}>
                            <Checkbox checked={(formData.categories || []).includes(cat.id)} onCheckedChange={() => {}} />
                            <label className="text-xs font-medium flex-1 cursor-pointer">{getCatNameLocal(cat)}</label>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="flex items-center justify-between mb-4"><Label className="font-bold">名稱與故事</Label><TabsList className="bg-muted/50 scale-90"><TabsTrigger value="en">EN</TabsTrigger><TabsTrigger value="zh">中文</TabsTrigger></TabsList></div>
              {['en', 'zh'].map(l => (
                <TabsContent key={l} value={l} className="space-y-4">
                  <div className="grid gap-2"><Label className="text-xs uppercase font-bold text-muted-foreground">品牌名稱 ({l.toUpperCase()})</Label><Input value={formData[`name_${l}`]} onChange={(e) => handleFieldChange(`name_${l}`, e.target.value)} className="h-11" /></div>
                  <div className="grid gap-2"><Label className="text-xs text-muted-foreground uppercase font-black">品牌故事 ({l.toUpperCase()})</Label><Textarea className="h-32 bg-muted/20 border-none leading-relaxed" value={formData[`description_${l}`]} onChange={(e) => handleFieldChange(`description_${l}`, e.target.value)} /></div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        {/* 新增：製造商連動資訊區塊 */}
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white border-l-4 border-primary">
          <CardHeader className="bg-primary/5 border-b py-5 px-8">
            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-primary">
              <Building2 className="h-5 w-5" /> 法定製造商資訊 (Brand Level)
            </CardTitle>
            <CardDescription>在此設定後，該品牌旗下產品若未填寫製造商資料，將自動套用此處設定。</CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                   <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">製造商名稱 (中/英)</Label>
                   <div className="space-y-2">
                      <Input placeholder="繁體中文名稱" value={formData.mfrName_zh || ""} onChange={e => handleFieldChange('mfrName_zh', e.target.value)} className="h-10 bg-muted/20 border-none rounded-xl font-bold" />
                      <Input placeholder="English Name" value={formData.mfrName_en || ""} onChange={e => handleFieldChange('mfrName_en', e.target.value)} className="h-10 bg-muted/20 border-none rounded-xl" />
                   </div>
                </div>
                <div className="space-y-4">
                   <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">製造商地址 (中/英)</Label>
                   <div className="space-y-2">
                      <Textarea placeholder="繁體中文地址" value={formData.mfrAddress_zh || ""} onChange={e => handleFieldChange('mfrAddress_zh', e.target.value)} className="h-20 bg-muted/20 border-none rounded-xl text-xs" />
                      <Textarea placeholder="English Address" value={formData.mfrAddress_en || ""} onChange={e => handleFieldChange('mfrAddress_en', e.target.value)} className="h-20 bg-muted/20 border-none rounded-xl text-xs" />
                   </div>
                </div>
             </div>
             <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-start gap-3">
               <Info className="h-4 w-4 text-blue-600 mt-0.5 shrink-0" />
               <p className="text-[10px] text-blue-800 leading-relaxed font-medium">
                 設定完成後，產品詳情頁的「注意事項」分頁會自動同步顯示這些數據。若個別產品有獨立製造商，可在產品編輯頁自行覆蓋。
               </p>
             </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white border-l-4 border-blue-500">
          <CardHeader className="bg-blue-50/50 border-b flex flex-row items-center justify-between py-4 px-8">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-blue-700 flex items-center gap-2"><Search className="h-5 w-5" />SEO 優化</CardTitle>
            <Button variant="outline" size="sm" className="h-8 text-blue-600 border-blue-200 hover:bg-blue-100 font-bold gap-1" onClick={() => handleAiGenerate('seo')} disabled={aiLoading}>
              {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-3 w-3" />} AI 生成
            </Button>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
             <Tabs defaultValue="zh">
               <div className="flex justify-between items-center mb-4"><Label className="text-xs font-bold uppercase">SEO 詳情</Label><TabsList className="bg-muted/50 scale-90"><TabsTrigger value="en">EN</TabsTrigger><TabsTrigger value="zh">中</TabsTrigger></TabsList></div>
               {['en', 'zh'].map(l => (
                 <TabsContent key={l} value={l} className="space-y-4">
                   <div className="grid gap-2"><Label className="text-xs font-bold">SEO 標題 ({l.toUpperCase()})</Label><Input value={formData[`seoTitle_${l}`]} onChange={(e) => handleFieldChange(`seoTitle_${l}`, e.target.value)} /></div>
                   <div className="grid gap-2"><Label className="text-xs font-bold">SEO 描述 ({l.toUpperCase()})</Label><Textarea value={formData[`seoDescription_${l}`]} onChange={(e) => handleFieldChange(`seoDescription_${l}`, e.target.value)} className="h-20" /></div>
                   <div className="grid gap-2"><Label className="text-xs font-bold">關鍵字 ({l.toUpperCase()})</Label><Input value={formData[`keywords_${l}`]} onChange={(e) => handleFieldChange(`keywords_${l}`, e.target.value)} /></div>
                 </TabsContent>
               ))}
             </Tabs>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
          <CardHeader className="bg-muted/10 border-b py-4 px-8"><CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2"><ImageIcon className="h-5 w-5 text-primary" />品牌標誌與狀態</CardTitle></CardHeader>
          <CardContent className="p-8 space-y-8">
            <div className="flex items-center gap-6">
              <div className="h-32 w-32 rounded-2xl bg-muted border-2 border-dashed flex items-center justify-center shrink-0 overflow-hidden relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                {formData.logoUrl ? <img src={formData.logoUrl} className="h-full w-full object-contain p-4" /> : <ImageIcon className="h-8 w-8 text-muted-foreground/50" />}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><Button variant="secondary" size="sm" className="font-bold">更換標誌</Button></div>
              </div>
              <div className="flex-1 space-y-4">
                <div className="grid gap-2"><Label className="text-xs font-bold">目前狀態</Label>
                  <Select value={formData.status} onValueChange={(v) => handleFieldChange("status", v)}>
                    <SelectTrigger className="h-11 bg-muted/20 border-none rounded-xl font-bold"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-2xl"><SelectItem value="Active">Active (啟用中)</SelectItem><SelectItem value="Inactive">Inactive (停用)</SelectItem></SelectContent>
                  </Select>
                </div>
                {uploadProgress > 0 && <Progress value={uploadProgress} className="h-1" />}
                <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
