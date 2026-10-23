"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  Image as ImageIcon, 
  Globe,
  Eye,
  Wand2,
  Sparkles,
  Zap,
  Plus,
  X,
  Check,
  Layout,
  Search,
  Package,
  UserCircle,
  Share2,
  Calendar as CalendarIcon,
  Tags,
  Ticket
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
import { useStorage, useUser, useFirestore, useCollection } from "@/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { doc, setDoc, addDoc, serverTimestamp, collection, query, orderBy, Timestamp } from "firebase/firestore";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Progress } from "@/components/ui/progress";
import { compressImage } from "@/lib/image-utils";
import { generateArticleContent } from "@/ai/flows/generate-article-content-flow";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

interface ArticleFormContainerProps {
  mode: 'new' | 'edit';
  articleId?: string;
  initialData?: any;
}

const ARTICLE_CATEGORIES = [
  { id: 'news', label: '官方消息 (News)' },
  { id: 'tips', label: '生活貼士 (Tips)' },
  { id: 'recipe', label: '美味食譜 (Recipes)' },
  { id: 'promo', label: '優惠活動 (Promos)' },
  { id: 'recommended', label: '好物推介 (Recommend)' },
  { id: 'lifestyle', label: '生活品味 (Lifestyle)' },
  { id: 'health', label: '健康百科 (Health)' }
];

export function ArticleFormContainer({ mode, articleId, initialData }: ArticleFormContainerProps) {
  const router = useRouter();
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const storage = useStorage();
  const db = useFirestore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("zh");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [aiLoading, setAiLoading] = useState<Record<string, boolean>>({ summary: false, seo: false });
  const [productSearch, setProductSearch] = useState("");
  const [promoSearch, setPromoSearch] = useState("");
  const [catSearch, setCatSearch] = useState("");
  const [isDirty, setIsDirty] = useState(false);
  const [formData, setFormData] = useState<any>(null);
  
  // 日期處理狀態
  const [publishDate, setPublishDate] = useState("");

  // 資料獲取
  const promosQuery = useMemo(() => db ? query(collection(db, 'promotions'), orderBy('updatedAt', 'desc')) : null, [db]);
  const { data: promos } = useCollection<any>(promosQuery);

  const productsQuery = useMemo(() => db ? query(collection(db, 'public_products'), orderBy('productName_zh')) : null, [db]);
  const { data: allProducts } = useCollection<any>(productsQuery);

  const filteredProducts = useMemo(() => {
    if (!allProducts) return [];
    const q = productSearch.toLowerCase().trim();
    return allProducts.filter((p: any) => 
      (p.productName_zh || "").toLowerCase().includes(q) || 
      (p.productName_en || "").toLowerCase().includes(q) || 
      (p.sku || "").toLowerCase().includes(q)
    ).slice(0, 50);
  }, [allProducts, productSearch]);

  const filteredPromos = useMemo(() => {
    if (!promos) return [];
    const q = promoSearch.toLowerCase().trim();
    return promos.filter((p: any) => 
      (p.name?.zh || "").toLowerCase().includes(q) || 
      (p.name?.en || "").toLowerCase().includes(q) || 
      (p.code || "").toLowerCase().includes(q)
    ).slice(0, 50);
  }, [promos, promoSearch]);

  const filteredCategories = useMemo(() => {
    const q = catSearch.toLowerCase().trim();
    if (!q) return ARTICLE_CATEGORIES;
    return ARTICLE_CATEGORIES.filter(c => c.label.toLowerCase().includes(q) || c.id.includes(q));
  }, [catSearch]);

  useEffect(() => {
    if (initialData && !formData) {
      // 遷移舊數據：將單一 category 轉為陣列 categories
      const legacyCategory = initialData.category;
      const categories = Array.isArray(initialData.categories) 
        ? initialData.categories 
        : (legacyCategory ? [legacyCategory] : []);

      // 遷移舊數據：將單一 promotionId 轉為陣列 promotionIds
      const legacyPromoId = initialData.promotionId;
      const promotionIds = Array.isArray(initialData.promotionIds)
        ? initialData.promotionIds
        : (legacyPromoId && legacyPromoId !== 'none' ? [legacyPromoId] : []);

      setFormData({ 
        ...initialData,
        categories,
        promotionIds
      });
      
      // 初始化發布日期
      if (initialData.createdAt?.seconds) {
        setPublishDate(format(new Date(initialData.createdAt.seconds * 1000), "yyyy-MM-dd'T'HH:mm"));
      } else if (mode === 'new') {
        setPublishDate(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
      }
    }
  }, [initialData, formData, mode]);

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleMultilingualChange = (field: string, langKey: 'en' | 'zh', value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: { ...prev[field], [langKey]: value }
    }));
    setIsDirty(true);
  };

  const toggleCategory = (catId: string) => {
    const current = Array.isArray(formData.categories) ? formData.categories : [];
    const next = current.includes(catId) ? current.filter((id: string) => id !== catId) : [...current, catId];
    handleFieldChange("categories", next);
  };

  const togglePromotion = (pId: string) => {
    const current = Array.isArray(formData.promotionIds) ? formData.promotionIds : [];
    const next = current.includes(pId) ? current.filter((id: string) => id !== pId) : [...current, pId];
    handleFieldChange("promotionIds", next);
  };

  const toggleRelatedProduct = (pid: string) => {
    const current = Array.isArray(formData.relatedProductIds) ? formData.relatedProductIds : [];
    const next = current.includes(pid) ? current.filter((id: string) => id !== pid) : [...current, pid];
    handleFieldChange("relatedProductIds", next);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !storage) return;

    setLoading(true);
    try {
      const compressedBlob = await compressImage(file, 1200, 0.8);
      const fileName = `articles/${Date.now()}_cover.webp`;
      const storageRef = ref(storage, fileName);
      const uploadTask = uploadBytesResumable(storageRef, compressedBlob, { contentType: 'image/webp' });

      uploadTask.on('state_changed', 
        (snap) => setUploadProgress((snap.bytesTransferred / snap.totalBytes) * 100),
        (err) => { toast({ title: "Upload Error", variant: "destructive" }); setLoading(false); },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          handleFieldChange("coverImage", downloadURL);
          setUploadProgress(0); setLoading(false);
          toast({ title: t.common.success, description: "封面圖片已更新" });
        }
      );
    } catch (error) { setLoading(false); }
  };

  const handleAiGenerate = async (genMode: 'summary' | 'seo') => {
    const langKey = activeTab === 'en' ? 'en' : 'zh';
    const currentTitle = formData.title[langKey];
    const currentContent = formData.content[langKey];

    if (!currentTitle) {
      toast({ title: "資訊不足", description: "請先輸入文章標題以便 AI 分析內容。", variant: "destructive" });
      return;
    }

    setAiLoading(prev => ({ ...prev, [genMode]: true }));
    try {
      const result = await generateArticleContent({
        currentTitle: currentTitle,
        currentContent: currentContent,
        category: Array.isArray(formData.categories) ? formData.categories[0] : "general",
        mode: genMode,
      });

      setFormData((prev: any) => {
        const next = JSON.parse(JSON.stringify(prev));
        ['en', 'zh'].forEach(l => {
          const lk = l as 'en' | 'zh';
          const langData = result[lk];
          if (!langData) return; 

          if (genMode === 'summary') {
            if (langData.excerpt) next.excerpt[lk] = langData.excerpt;
          } else if (genMode === 'seo') {
            if (langData.metaTitle) next.metaTitle[lk] = langData.metaTitle;
            if (langData.metaDescription) next.metaDescription[lk] = langData.metaDescription;
            if (langData.keywords) next.keywords[lk] = langData.keywords;
          }
        });
        return next;
      });
      setIsDirty(true);
      toast({ title: t.common.success, description: `AI 已同步生成雙語 ${genMode === 'summary' ? '摘要' : 'SEO'} 內容` });
    } catch (error) { toast({ title: t.common.error, variant: "destructive" }); } finally {
      setAiLoading(prev => ({ ...prev, [genMode]: false }));
    }
  };

  const handleSave = async () => {
    if (!formData || !db) return;
    setLoading(true);
    
    // 處理手動日期轉換
    let finalCreatedAt = serverTimestamp() as any;
    if (publishDate) {
      try {
        finalCreatedAt = Timestamp.fromDate(parseISO(publishDate));
      } catch (e) {
        console.warn("Date parse failed, using current time");
      }
    }

    // 同時儲存第一個分類和第一個優惠到 legacy 欄位以保證向後兼容
    const dataToSave = { 
      ...formData, 
      category: Array.isArray(formData.categories) ? (formData.categories[0] || "news") : "news",
      promotionId: Array.isArray(formData.promotionIds) ? (formData.promotionIds[0] || "none") : "none",
      createdAt: finalCreatedAt,
      updatedAt: serverTimestamp() 
    };

    try {
      if (mode === 'new') {
        await addDoc(collection(db, 'articles'), dataToSave);
        toast({ title: t.common.success, description: "文章已發布" });
      } else {
        await setDoc(doc(db, 'articles', articleId!), dataToSave, { merge: true });
        toast({ title: t.common.success, description: "文章已更新" });
      }
      setIsDirty(false);
      router.push("/admin/articles");
    } catch (error: any) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: mode === 'new' ? 'articles' : `articles/${articleId}`,
        operation: mode === 'new' ? 'create' : 'update',
        requestResourceData: dataToSave,
      }));
    } finally { setLoading(false); }
  };

  const getProductDisplayName = (pid: string) => {
    const p = allProducts?.find((it: any) => it.id === pid);
    if (!p) return pid;
    return lang === 'en' ? (p.productName_en || p.productName_zh) : (p.productName_zh || p.productName_en);
  };

  const getPromoDisplayName = (pId: string) => {
    const p = promos?.find((it: any) => it.id === pId);
    if (!p) return pId;
    return p.name?.zh || p.name?.en || pId;
  };

  if (!formData) return <div className="h-96 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => { if(isDirty && !confirm("您有未儲存的變更，確定要退出嗎？")) return; router.back(); }} className="rounded-full"><ArrowLeft className="h-5 w-5" /></Button>
          <div>
            <h1 className="text-3xl font-bold font-headline">{mode === 'new' ? '新增文章' : '編輯文章'}</h1>
            {mode === 'edit' && <p className="text-muted-foreground">ID: <span className="font-mono text-xs">{articleId}</span></p>}
          </div>
        </div>
        <div className="flex gap-2">
          {mode === 'edit' && (
            <Button variant="outline" className="rounded-xl h-11" asChild>
              <Link href={`/news/${articleId}`}>
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4" /> 預覽
                </div>
              </Link>
            </Button>
          )}
          <Button className="bg-primary text-primary-foreground font-black shadow-lg rounded-xl h-11 px-8" onClick={handleSave} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {t.common.save}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
            <CardHeader className="bg-muted/5 border-b"><CardTitle>內容編輯器</CardTitle></CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid gap-2"><Label className="font-bold">網址 Slug</Label><Input value={formData.slug} onChange={(e) => handleFieldChange("slug", e.target.value)} className="h-11 bg-muted/20 border-none rounded-xl" /></div>

              <Tabs defaultValue="zh" onValueChange={setActiveTab}>
                <div className="flex items-center justify-between mb-4">
                  <Label className="font-bold">文章語言內容</Label>
                  <TabsList className="bg-muted/50 h-9 p-1 rounded-xl"><TabsTrigger value="en" className="rounded-lg px-6 text-xs font-bold">EN</TabsTrigger><TabsTrigger value="zh" className="rounded-lg px-6 text-xs font-bold">中文</TabsTrigger></TabsList>
                </div>
                {['en', 'zh'].map((l) => (
                  <TabsContent key={l} value={l} className="space-y-6 animate-in fade-in duration-300">
                    <div className="grid gap-2"><Label className="text-xs font-bold uppercase text-muted-foreground ml-1">標題 ({l.toUpperCase()})</Label><Input value={formData.title[l as 'en'|'zh']} onChange={(e) => handleMultilingualChange("title", l as 'en'|'zh', e.target.value)} className="text-lg font-bold h-12 bg-muted/20 border-none rounded-xl" /></div>
                    <div className="grid gap-2">
                      <div className="flex items-center justify-between"><Label className="text-xs font-bold uppercase text-muted-foreground ml-1">摘要</Label><Button variant="ghost" size="sm" className="h-6 text-primary gap-1 font-black text-[9px] uppercase" onClick={() => handleAiGenerate('summary')} disabled={aiLoading.summary}>{aiLoading.summary ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />} AI 生成摘要</Button></div>
                      <Textarea value={formData.excerpt[l as 'en'|'zh']} onChange={(e) => handleMultilingualChange("excerpt", l as 'en'|'zh', e.target.value)} className="h-20 bg-muted/20 border-none rounded-xl text-sm" />
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-xs font-bold uppercase text-muted-foreground ml-1">詳細內容</Label>
                      <RichTextEditor variant="standard" value={formData.content[l as 'en'|'zh']} onChange={(v) => handleMultilingualChange("content", l as 'en'|'zh', v)} />
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white border-l-4 border-blue-500">
            <CardHeader className="bg-blue-50/50 border-b py-4 px-8 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-blue-700 flex items-center gap-2">
                <Globe className="h-5 w-5" /> 搜尋引擎優化 (SEO)
              </CardTitle>
              <Button variant="outline" size="sm" className="h-8 text-blue-600 border-blue-200 hover:bg-blue-100 font-bold gap-1" onClick={() => handleAiGenerate('seo')} disabled={aiLoading.seo}>
                {aiLoading.seo ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />} AI 生成 SEO
              </Button>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
               <Tabs defaultValue="zh">
                 <div className="flex justify-between items-center mb-4"><Label className="text-xs font-bold uppercase">SEO 詳情</Label><TabsList className="bg-muted/50 h-8 p-0.5 rounded-lg"><TabsTrigger value="en" className="text-[9px] font-bold">EN</TabsTrigger><TabsTrigger value="zh" className="text-[9px] font-bold">中</TabsTrigger></TabsList></div>
                 {['en', 'zh'].map(l => (
                   <TabsContent key={l} value={l} className="space-y-4">
                     <div className="grid gap-2"><Label className="text-[10px] font-black uppercase opacity-60">SEO 標題 ({l.toUpperCase()})</Label><Input value={formData[`metaTitle`]?.[l as 'en'|'zh']} onChange={(e) => handleMultilingualChange("metaTitle", l as 'en'|'zh', e.target.value)} className="h-10 bg-muted/10 border-none rounded-xl font-bold" /></div>
                     <div className="grid gap-2"><Label className="text-[10px] font-black uppercase opacity-60">SEO 描述 ({l.toUpperCase()})</Label><Textarea value={formData[`metaDescription`]?.[l as 'en'|'zh']} onChange={(e) => handleMultilingualChange("metaDescription", l as 'en'|'zh', e.target.value)} className="h-20 bg-muted/10 border-none rounded-xl text-xs leading-relaxed" /></div>
                     <div className="grid gap-2"><Label className="text-[10px] font-black uppercase opacity-60">關鍵字 ({l.toUpperCase()})</Label><Input value={formData[`keywords`]?.[l as 'en'|'zh']} onChange={(e) => handleMultilingualChange("keywords", l as 'en'|'zh', e.target.value)} className="h-10 bg-muted/10 border-none rounded-xl text-xs" /></div>
                   </TabsContent>
                 ))}
               </Tabs>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden border-l-4 border-indigo-600">
            <CardHeader className="bg-indigo-50/50 border-b flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-indigo-700 flex items-center gap-2"><Layout className="h-4 w-4" /> 首頁橫幅設定</CardTitle>
              <Switch checked={formData.showOnBanner} onCheckedChange={(v) => handleFieldChange("showOnBanner", v)} />
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {formData.showOnBanner && (
                <div className="space-y-4 animate-in slide-in-from-top-2">
                  <Tabs defaultValue="zh">
                    <TabsList className="bg-muted/50 h-7 p-0.5 rounded-lg mb-2"><TabsTrigger value="en" className="text-[9px] font-bold">EN</TabsTrigger><TabsTrigger value="zh" className="text-[9px] font-bold">中</TabsTrigger></TabsList>
                    {['en', 'zh'].map(l => (
                      <TabsContent key={l} value={l} className="space-y-3">
                        <div className="grid gap-1.5"><Label className="text-[10px] font-black uppercase opacity-60">橫幅大標題</Label><Input value={formData.bannerHeading[l as 'en'|'zh']} onChange={e => handleMultilingualChange('bannerHeading', l as 'en'|'zh', e.target.value)} className="h-9 bg-muted/10 border-none rounded-lg text-xs font-bold" /></div>
                        <div className="grid gap-1.5"><Label className="text-[10px] font-black uppercase opacity-60">橫幅副標題</Label><Input value={formData.bannerSubtitle[l as 'en'|'zh']} onChange={e => handleMultilingualChange('bannerSubtitle', l as 'en'|'zh', e.target.value)} className="h-9 bg-muted/10 border-none rounded-lg text-xs" /></div>
                        <div className="grid gap-1.5"><Label className="text-[10px] font-black uppercase opacity-60">按鈕文字</Label><Input value={formData.bannerCtaText[l as 'en'|'zh']} onChange={e => handleMultilingualChange('bannerCtaText', l as 'en'|'zh', e.target.value)} className="h-9 bg-muted/10 border-none rounded-lg text-[10px] font-black" /></div>
                      </TabsContent>
                    ))}
                  </Tabs>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
            <CardHeader className="bg-muted/5 border-b py-4 px-6"><CardTitle className="text-xs font-black uppercase text-muted-foreground tracking-widest">發布設定</CardTitle></CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid gap-2">
                <Label className="text-xs font-bold uppercase text-muted-foreground ml-1 flex items-center gap-2">
                  <CalendarIcon className="h-3 w-3 text-primary" /> 發布日期 (Published Date)
                </Label>
                <Input type="datetime-local" value={publishDate} onChange={(e) => { setPublishDate(e.target.value); setIsDirty(true); }} className="h-11 bg-muted/20 border-none rounded-xl font-bold" />
              </div>

              <div className="grid gap-2">
                <Label className="font-bold flex items-center gap-2"><UserCircle className="h-4 w-4 text-primary" /> 發佈人名稱</Label>
                <Input value={formData.author} onChange={(e) => handleFieldChange("author", e.target.value)} className="h-11 bg-muted/20 border-none rounded-xl font-bold" />
              </div>

              <div className="grid gap-2">
                <Label className="font-bold flex items-center gap-2"><Tags className="h-4 w-4 text-primary" /> 文章分類 (可多選)</Label>
                <div className="flex flex-wrap gap-2 p-3 bg-muted/10 rounded-xl border-2 border-dashed min-h-[60px]">
                  {(formData.categories || []).length === 0 ? (
                    <p className="text-[10px] text-muted-foreground italic px-1">尚未選擇分類...</p>
                  ) : (
                    formData.categories.map((cId: string) => (
                      <Badge key={cId} variant="secondary" className="bg-white border shadow-sm pr-1 py-1 gap-1">
                        {ARTICLE_CATEGORIES.find(c => c.id === cId)?.label || cId}
                        <button onClick={() => toggleCategory(cId)} className="hover:text-destructive"><X className="h-3 w-3" /></button>
                      </Badge>
                    ))
                  )}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="h-7 rounded-lg border-dashed bg-white font-bold ml-auto">
                        <Plus className="h-3 w-3 mr-1" /> 選取
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-0 rounded-2xl shadow-2xl border-none">
                      <div className="p-2 border-b">
                        <div className="relative">
                          <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
                          <Input placeholder="搜尋分類..." value={catSearch} onChange={e => setCatSearch(e.target.value)} className="h-8 pl-7 text-xs" />
                        </div>
                      </div>
                      <ScrollArea className="h-64 p-2">
                        <div className="space-y-1">
                          {filteredCategories.map((c) => (
                            <div key={c.id} className="flex items-center space-x-2 p-2 hover:bg-muted rounded-xl cursor-pointer" onClick={() => toggleCategory(c.id)}>
                              <Checkbox checked={(formData.categories || []).includes(c.id)} onCheckedChange={() => {}} />
                              <label className="text-xs font-medium flex-1 cursor-pointer">{c.label}</label>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="grid gap-2">
                <Label className="font-bold">發布狀態</Label>
                <Select value={formData.status} onValueChange={(val) => handleFieldChange("status", val)}>
                  <SelectTrigger className="h-11 bg-muted/20 border-none rounded-xl font-bold"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl"><SelectItem value="draft">草稿 (Draft)</SelectItem><SelectItem value="published">正式發布 (Published)</SelectItem></SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden border-l-4 border-primary">
            <CardHeader className="bg-primary/5 border-b py-4 px-6"><CardTitle className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2"><Zap className="h-4 w-4" /> 關聯促銷與產品</CardTitle></CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid gap-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">關聯優惠 (Promotions - 可多選)</Label>
                <div className="flex flex-wrap gap-2 p-3 bg-muted/10 rounded-xl border-2 border-dashed min-h-[60px]">
                  {(formData.promotionIds || []).length === 0 ? (
                    <p className="text-[10px] text-muted-foreground italic px-1">無關聯優惠...</p>
                  ) : (
                    formData.promotionIds.map((pId: string) => (
                      <Badge key={pId} variant="secondary" className="bg-white border shadow-sm pr-1 py-1 gap-1">
                        {getPromoDisplayName(pId)}
                        <button onClick={() => togglePromotion(pId)} className="hover:text-destructive"><X className="h-3 w-3" /></button>
                      </Badge>
                    ))
                  )}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="h-7 rounded-lg border-dashed bg-white font-bold ml-auto">
                        <Plus className="h-3 w-3 mr-1" /> 選取
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72 p-0 rounded-2xl shadow-2xl border-none">
                      <div className="p-2 border-b">
                        <div className="relative">
                          <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
                          <Input placeholder="搜尋優惠名稱..." value={promoSearch} onChange={e => setPromoSearch(e.target.value)} className="h-8 pl-7 text-xs" />
                        </div>
                      </div>
                      <ScrollArea className="h-64 p-2">
                        <div className="space-y-1">
                          {filteredPromos.map((p: any) => (
                            <div key={p.id} className="flex items-center space-x-2 p-2 hover:bg-muted rounded-xl cursor-pointer" onClick={() => togglePromotion(p.id)}>
                              <Checkbox checked={(formData.promotionIds || []).includes(p.id)} onCheckedChange={() => {}} />
                              <div className="min-w-0 flex-1">
                                <label className="text-xs font-bold truncate block cursor-pointer">{p.name?.zh || p.name?.en}</label>
                                {p.code && <p className="text-[10px] text-primary font-mono">{p.code}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="grid gap-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">文中推介產品 (Related Products)</Label>
                <div className="flex flex-wrap gap-2 p-3 bg-muted/10 rounded-xl border border-dashed min-h-[60px]">
                  {(formData.relatedProductIds || []).length === 0 ? (
                    <p className="text-[10px] text-muted-foreground italic">尚未選取產品...</p>
                  ) : (
                    formData.relatedProductIds.map((pid: string) => (
                      <Badge key={pid} variant="secondary" className="gap-1 pr-1 bg-white border shadow-sm max-w-full">
                        <span className="truncate max-w-[120px]">{getProductDisplayName(pid)}</span>
                        <button type="button" onClick={() => toggleRelatedProduct(pid)} className="hover:text-destructive"><X className="h-3 w-3" /></button>
                      </Badge>
                    ))
                  )}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="h-7 rounded-lg border-dashed bg-white font-bold ml-auto">
                        <Plus className="h-3 w-3 mr-1" /> 選取
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72 p-0 rounded-2xl shadow-2xl border-none">
                      <div className="p-2 border-b">
                        <div className="relative">
                          <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
                          <Input placeholder="搜尋名稱或 SKU..." value={productSearch} onChange={e => setProductSearch(e.target.value)} className="h-8 pl-7 text-xs" />
                        </div>
                      </div>
                      <ScrollArea className="h-64 p-2">
                        <div className="space-y-1">
                          {filteredProducts.map((p: any) => (
                            <div key={p.id} className="flex items-center gap-2 p-2 hover:bg-muted rounded-xl cursor-pointer" onClick={() => toggleRelatedProduct(p.id)}>
                              <div className="h-8 w-8 rounded bg-muted flex items-center justify-center shrink-0 border overflow-hidden">
                                {p.imageUrl ? <img src={p.imageUrl} className="object-cover h-full w-full" /> : <Package className="h-3 w-3 opacity-20" />}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-bold truncate">{p.productName_zh}</p>
                                <p className="text-[8px] text-muted-foreground font-mono">{p.sku}</p>
                              </div>
                              {formData.relatedProductIds?.includes(p.id) && <Check className="h-3 w-3 text-primary" />}
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm overflow-hidden rounded-3xl bg-white">
            <CardHeader className="bg-muted/5 border-b py-4 px-6"><CardTitle className="text-xs font-black uppercase text-muted-foreground tracking-widest">封面圖片</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="h-48 w-full bg-muted flex items-center justify-center cursor-pointer relative group" onClick={() => fileInputRef.current?.click()}>
                {formData.coverImage ? <img src={formData.coverImage} className="h-full w-full object-cover" /> : <ImageIcon className="h-10 w-10 text-muted-foreground/30" />}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><Button variant="secondary" size="sm" className="font-bold">更換圖片</Button></div>
              </div>
              <div className="p-4">{uploadProgress > 0 && <Progress value={uploadProgress} className="h-1" />}<input type="file" className="hidden" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" /></div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
