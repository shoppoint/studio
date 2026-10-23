"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  LayoutGrid,
  Image as ImageIcon,
  Plus,
  Wand2,
  Search,
  Sparkles,
  Tags,
  Globe,
  Zap,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/lib/i18n/i18n-context";
import { useToast } from "@/hooks/use-toast";
import { useStorage, useUser, useFirestore, useCollection } from "@/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { doc, updateDoc, addDoc, serverTimestamp, collection, query, orderBy, setDoc } from "firebase/firestore";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Progress } from "@/components/ui/progress";
import { compressImage } from "@/lib/image-utils";
import { generateCategoryContent } from "@/ai/flows/generate-category-content-flow";
import { generateSlug } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

interface CategoryFormContainerProps {
  mode: 'new' | 'edit';
  categoryId?: string;
  initialData?: any;
}

export function CategoryFormContainer({ mode, categoryId, initialData }: CategoryFormContainerProps) {
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
  const [isDirty, setIsDirty] = useState(false);
  const [formData, setFormData] = useState<any>(null);

  const allCategoriesQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'categories'), orderBy('displayOrder', 'asc'));
  }, [db]);
  const { data: rawCategories } = useCollection<any>(allCategoriesQuery);

  const categoryOptions = useMemo(() => {
    if (!rawCategories) return [];
    
    const getDescendantIds = (list: any[], targetId: string): string[] => {
      const children = list.filter(c => c.parentId === targetId);
      let ids = children.map(c => c.id);
      children.forEach(child => { ids = [...ids, ...getDescendantIds(list, child.id)]; });
      return ids;
    };

    const forbiddenIds = mode === 'edit' ? [categoryId, ...getDescendantIds(rawCategories, categoryId!)] : [];
    const eligibleList = rawCategories.filter(c => !forbiddenIds.includes(c.id));

    const buildFlatTree = (list: any[], parentId: string | null = "none", depth = 0): any[] => {
      let results: any[] = [];
      const children = list.filter(c => (c.parentId || "none") === parentId);
      children.forEach(child => {
        results.push({ ...child, depth });
        results = [...results, ...buildFlatTree(list, child.id, depth + 1)];
      });
      return results;
    };

    return buildFlatTree(eligibleList);
  }, [rawCategories, categoryId, mode]);

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !storage) return;

    setLoading(true);
    try {
      const compressedBlob = await compressImage(file, 800, 0.75);
      const fileName = `categories/${Date.now()}_category.webp`;
      const storageRef = ref(storage, fileName);
      const uploadTask = uploadBytesResumable(storageRef, compressedBlob, { contentType: 'image/webp' });

      uploadTask.on('state_changed', 
        (snap) => setUploadProgress((snap.bytesTransferred / snap.totalBytes) * 100),
        (error) => { toast({ title: "Upload Error", variant: "destructive" }); },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          handleFieldChange("imageUrl", downloadURL);
          setUploadProgress(0); setLoading(false);
          toast({ title: t.common.success, description: "圖片已上傳" });
        }
      );
    } catch (error) { setLoading(false); }
  };

  const handleAiGenerate = async (genMode: 'description' | 'seo') => {
    if (aiLoading) return;
    const currentName = formData?.name_zh || formData?.name_en;
    if (!currentName) { 
      toast({ title: "資訊不足", description: "請先輸入分類名稱以供 AI 參考。", variant: "destructive" }); 
      return; 
    }
    
    setAiLoading(true);
    try {
      const parentCat = rawCategories?.find((c: any) => c.id === formData.parentId);
      const parentName = parentCat ? (parentCat.name_zh || parentCat.name_en) : undefined;
      const contextDescription = formData.description_zh || formData.description_en || "";

      const result = await generateCategoryContent({
        categoryName: currentName,
        parentCategoryName: parentName,
        mode: genMode,
        description: contextDescription
      });

      setFormData((prev: any) => {
        const next = JSON.parse(JSON.stringify(prev));
        ['en', 'zh'].forEach(lk => {
          const langKey = lk as 'en' | 'zh';
          const data = result[langKey];
          if (!data) return;

          if (genMode === 'description') {
            if (data.content) next[`description_${langKey}`] = data.content;
          }
          if (data.metaTitle) next[`seoTitle_${langKey}`] = data.metaTitle;
          if (data.metaDescription) next[`seoDescription_${langKey}`] = data.metaDescription;
          if (data.keywords) next[`keywords_${langKey}`] = data.keywords;
        });
        return next;
      });
      setIsDirty(true);
      toast({ title: "AI 生成成功" });
    } catch (error: any) { 
      toast({ title: "AI 生成失敗", description: error.message, variant: "destructive" }); 
    } finally { setAiLoading(false); }
  };

  const handleSave = async () => {
    if (loading) return; // 物理防止重複點擊
    if (!formData || !db) return;
    setLoading(true);
    const dataToSave = { 
      ...formData, 
      displayOrder: Number(formData.displayOrder || 0), 
      updatedAt: serverTimestamp() 
    };

    try {
      if (mode === 'new') {
        dataToSave.createdAt = serverTimestamp();
        await addDoc(collection(db, 'categories'), dataToSave);
        toast({ title: t.common.success, description: "新分類已建立" });
      } else {
        await updateDoc(doc(db, 'categories', categoryId!), dataToSave);
        toast({ title: t.common.success, description: "分類資料已更新" });
      }
      setIsDirty(false);
      router.push("/admin/categories");
    } catch (error: any) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: mode === 'new' ? 'categories' : `categories/${categoryId}`,
        operation: mode === 'new' ? 'create' : 'update',
        requestResourceData: dataToSave,
      }));
    } finally { setLoading(false); }
  };

  if (!formData) return <div className="h-96 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const getCatNameLocal = (cat: any) => lang === 'en' ? (cat.name_en || cat.name_zh) : (cat.name_zh || cat.name_en);

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => { if(isDirty && !confirm("確定退出？")) return; router.back(); }} className="rounded-full"><ArrowLeft className="h-5 w-5" /></Button>
          <div>
            <h1 className="text-3xl font-bold font-headline">{mode === 'new' ? '新增產品分類' : '編輯分類資訊'}</h1>
            {mode === 'edit' && <p className="text-muted-foreground text-xs font-mono">ID: {categoryId}</p>}
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
          <CardHeader className="bg-muted/10 border-b flex flex-row items-center justify-between py-4 px-8">
            <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest"><LayoutGrid className="h-5 w-5 text-primary" />基本資料</CardTitle>
            <Button variant="ghost" size="sm" className="h-8 text-primary gap-2 font-black border border-primary/20 hover:bg-primary/5 px-4" onClick={() => handleAiGenerate('description')} disabled={aiLoading}>
              {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4 fill-current" />} AI 同步生成簡介
            </Button>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="grid gap-2">
                <Label className="font-bold">網址 Slug</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Globe className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input value={formData.slug || ""} onChange={(e) => handleFieldChange("slug", e.target.value)} className="h-11 pl-9 font-mono text-xs" />
                  </div>
                  <Button variant="outline" className="rounded-xl h-11 px-4 font-bold" onClick={handleSuggestSlug}><Wand2 className="h-4 w-4" /></Button>
                </div>
              </div>
              <div className="grid gap-2">
                <Label className="font-bold">父級分類</Label>
                <Select value={formData.parentId || "none"} onValueChange={(val) => handleFieldChange("parentId", val === "none" ? null : val)}>
                  <SelectTrigger className="h-11 bg-muted/20 border-none rounded-xl font-bold"><SelectValue placeholder="None (Root)" /></SelectTrigger>
                  <SelectContent className="rounded-xl border-none shadow-2xl max-h-80">
                    <SelectItem value="none" className="font-black text-primary">無 (最頂層分類)</SelectItem>
                    <Separator className="my-1" />
                    {categoryOptions.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <span className="flex items-center gap-1">{Array(cat.depth).fill("—").join("")}{cat.depth > 0 && " "}{getCatNameLocal(cat)}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="flex items-center justify-between mb-4">
                <Label className="font-bold">名稱與介紹</Label>
                <TabsList className="bg-muted/50 scale-90"><TabsTrigger value="en">EN</TabsTrigger><TabsTrigger value="zh">中文</TabsTrigger></TabsList>
              </div>
              {['en', 'zh'].map(l => (
                <TabsContent key={l} value={l} className="space-y-4 animate-in fade-in">
                  <div className="grid gap-2"><Label className="text-xs uppercase font-bold text-muted-foreground">分類名稱 ({l.toUpperCase()})</Label><Input value={formData[`name_${l}`] || ""} onChange={(e) => handleFieldChange(`name_${l}`, e.target.value)} className="h-11 font-bold" /></div>
                  <div className="grid gap-2"><Label className="text-xs text-muted-foreground uppercase font-black">簡介 ({l.toUpperCase()})</Label><Textarea className="h-32 bg-muted/20 border-none leading-relaxed" value={formData[`description_${l}`] || ""} onChange={(e) => handleFieldChange(`description_${l}`, e.target.value)} /></div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white border-l-4 border-blue-500">
          <CardHeader className="bg-blue-50/50 border-b flex flex-row items-center justify-between py-4 px-8">
            <CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-blue-700"><Search className="h-5 w-5" />SEO 搜尋優化</CardTitle>
            <Button variant="outline" size="sm" className="h-8 text-blue-600 border-blue-200 hover:bg-blue-100 font-bold gap-1" onClick={() => handleAiGenerate('seo')} disabled={aiLoading}>
              {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-3 w-3" />} AI 生成
            </Button>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <Tabs defaultValue="zh">
              <div className="flex items-center justify-between mb-4"><Label className="font-bold text-xs uppercase">SEO 詳情</Label><TabsList className="bg-muted/50 scale-90"><TabsTrigger value="en">EN</TabsTrigger><TabsTrigger value="zh">中</TabsTrigger></TabsList></div>
              {['en', 'zh'].map(l => (
                <TabsContent key={l} value={l} className="space-y-4">
                  <div className="grid gap-2"><Label className="text-xs font-bold">SEO 標題 ({l.toUpperCase()})</Label><Input value={formData[`seoTitle_${l}`] || ""} onChange={(e) => handleFieldChange(`seoTitle_${l}`, e.target.value)} /></div>
                  <div className="grid gap-2"><Label className="text-xs font-bold">SEO 描述 ({l.toUpperCase()})</Label><Textarea value={formData[`seoDescription_${l}`] || ""} onChange={(e) => handleFieldChange(`seoDescription_${l}`, e.target.value)} className="h-20" /></div>
                  <div className="grid gap-2"><Label className="text-xs font-bold">關鍵字 ({l.toUpperCase()})</Label><Input value={formData[`keywords_${l}`] || ""} onChange={(e) => handleFieldChange(`keywords_${l}`, e.target.value)} /></div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
          <CardHeader className="bg-muted/10 border-b py-4 px-8"><CardTitle className="flex items-center gap-2 text-sm font-black uppercase tracking-widest"><ImageIcon className="h-5 w-5 text-primary" />代表圖片與顯示設定</CardTitle></CardHeader>
          <CardContent className="p-8 space-y-8">
            <div className="flex items-center gap-6">
              <div className="h-32 w-32 rounded-2xl bg-muted border-2 border-dashed flex items-center justify-center shrink-0 overflow-hidden relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                {formData.imageUrl ? <img src={formData.imageUrl} className="h-full w-full object-cover" alt="preview" /> : <ImageIcon className="h-8 w-8 text-muted-foreground/50" />}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><Button variant="secondary" size="sm" className="font-bold">上載圖片</Button></div>
              </div>
              <div className="flex-1 space-y-4">
                <div className="grid gap-2"><Label className="text-xs font-bold">顯示順序 (越小越前)</Label><Input type="number" value={formData.displayOrder ?? 0} onChange={(e) => handleFieldChange("displayOrder", e.target.value)} className="h-10 bg-muted/20 border-none rounded-xl font-black text-primary" /></div>
                <div className="flex items-center justify-between p-3 bg-muted/10 rounded-xl">
                  <Label className="text-xs font-bold">前台顯示狀態</Label>
                  <Switch checked={formData.isVisible !== false} onCheckedChange={(v) => handleFieldChange("isVisible", v)} />
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
