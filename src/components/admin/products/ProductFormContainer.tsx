"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  Zap, 
  Wand2,
  XCircle,
  Store,
  Sparkles,
  Gavel
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n/i18n-context";
import { useToast } from "@/hooks/use-toast";
import { useUser, useAuth, useFirestore, useCollection } from "@/firebase";
import { doc, updateDoc, addDoc, serverTimestamp, collection, query, where, limit, orderBy, setDoc, getDoc, Timestamp } from "firebase/firestore";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { processBackInStock } from "@/services/communication-service";
import { generateProductContent } from "@/ai/flows/generate-product-description-flow";
import { calculateIsClearance, generateProductSearchIndex } from "@/lib/shop-utils";
import { syncProductEmbeddingAction } from "@/app/actions/ai-search-actions";
import { generateSlug } from "@/lib/utils";

import { ProductBasicsTab } from "./ProductBasicsTab";
import { ProductSpecsTab } from "./ProductSpecsTab";
import { ProductPricingTab } from "./ProductPricingTab";
import { ProductMediaTab } from "./ProductMediaTab";
import { ProductContentTab } from "./ProductContentTab";
import { ProductRelationsTab } from "./ProductRelationsTab";
import { ProductLegalTab } from "./ProductLegalTab";

interface ProductFormContainerProps {
  mode: 'new' | 'edit';
  productId?: string;
  initialData?: any;
  isVendor?: boolean;
}

/**
 * 產品表單容器 - 狀態提升優化版 (V16)
 * 修正：徹底移除獨立銷售統計分頁，所有銷售分析功能已轉移至系統概覽。
 */
export function ProductFormContainer({ mode, productId, initialData, isVendor = false }: ProductFormContainerProps) {
  const router = useRouter();
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const db = useFirestore();
  const { user, userData } = useUser();

  const [currentTab, setCurrentTab] = useState("basics");
  const [loading, setLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [formData, setFormData] = useState<any>(null);

  const [aiLoading, setAiLoading] = useState<Record<string, boolean>>({
    keywords: false,
    seo: false,
    summary: false,
    detailed: false,
    faq: false
  });

  const categoriesQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'categories'), where('isVisible', '==', true), orderBy('displayOrder', 'asc'));
  }, [db]);
  const { data: categories } = useCollection<any>(categoriesQuery);

  const brandsQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'brands'));
  }, [db]);
  const { data: brands } = useCollection<any>(brandsQuery);

  const vendorsQuery = useMemo(() => {
    if (!db || isVendor) return null;
    return query(collection(db, 'vendors'), orderBy('name'));
  }, [db, isVendor]);
  const { data: vendors } = useCollection<any>(vendorsQuery);

  const allProductsQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'public_products'), where('status', '==', 'Active'));
  }, [db]);
  const { data: allProducts } = useCollection<any>(allProductsQuery);

  const locationsQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'locations'));
  }, [db]);
  const { data: locations } = useCollection<any>(locationsQuery);

  const vendorQuery = useMemo(() => (isVendor && user && db) ? query(
    collection(db, 'vendors'), 
    where('linkedUserId', '==', user.uid),
    limit(1)
  ) : null, [db, user, isVendor]);
  const { data: vendorList } = useCollection<any>(vendorQuery);
  const vendor = vendorList?.[0];

  useEffect(() => {
    if (initialData && !formData) {
      setFormData({
        ...initialData,
        shelfPrice: initialData.shelfPrice || 0,
        isGmcPhotoRequired: !!initialData.isGmcPhotoRequired,
        shelfPhotoUrl: initialData.shelfPhotoUrl || "",
        images: Array.isArray(initialData.images) ? initialData.images.map((url: string) => ({ url, isMain: url === initialData.imageUrl })) : (initialData.imageUrl ? [{url: initialData.imageUrl, isMain: true}] : [])
      });
    }
  }, [initialData, formData]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) { e.preventDefault(); e.returnValue = ''; }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleSuggestSlug = () => {
    const text = formData.productName_en || formData.productName_zh || "";
    if (text) handleInputChange('slug', generateSlug(text));
  };

  const executeAiGeneration = async (mode: 'summary' | 'detailed' | 'faq' | 'seo') => {
    if (aiLoading[mode]) return;
    if (!formData.productName_zh && !formData.productName_en) {
      toast({ title: "資訊不足", description: "請先填寫產品名稱以供 AI 分析。", variant: "destructive" });
      return;
    }

    setAiLoading(prev => ({ ...prev, [mode]: true }));
    try {
      const result = await generateProductContent({
        productName_en: formData.productName_en,
        productName_zh: formData.productName_zh,
        ingredients_en: formData.ingredients_en,
        ingredients_zh: formData.ingredients_zh,
        primaryBrand: formData.primaryBrand,
        collabBrands: formData.collabBrands,
        sku: formData.sku,
        barcode: formData.barcode,
        spec: formData.spec,
        mode: mode
      });

      if (!result) throw new Error("AI 服務無回應");

      setFormData((prev: any) => {
        const next = JSON.parse(JSON.stringify(prev));
        ['en', 'zh'].forEach(l => {
          const lk = l as 'en' | 'zh';
          const r = result[lk];
          if (!r) return;
          if (mode === 'summary') next[`description_${lk}`] = r.content || r.summary || next[`description_${lk}`];
          else if (mode === 'detailed') next[`longDescription_${lk}`] = r.content || r.detailed || next[`longDescription_${lk}`];
          else if (mode === 'faq') { if (Array.isArray(r.faqs)) next[`faqs_${lk}`] = r.faqs; }
          else if (mode === 'seo') {
            next[`seoTitle_${lk}`] = r.metaTitle || next[`seoTitle_${lk}`];
            next[`seoDescription_${lk}`] = r.metaDescription || next[`seoDescription_${lk}`];
            next[`seoKeywords_${lk}`] = r.externalSearchTags || next[`seoKeywords_${lk}`];
            const tagsField = lk === 'zh' ? 'searchKeywordsRaw' : 'searchKeywordsRaw_en';
            next[tagsField] = r.internalSearchTags || next[tagsField];
          }
        });
        return next;
      });
      setIsDirty(true);
      toast({ title: "AI 生成成功" });
    } catch (e: any) { toast({ title: "AI 生成失敗", description: e.message, variant: "destructive" }); } finally { setAiLoading(prev => ({ ...prev, [mode]: false })); }
  };

  const handleSave = async () => {
    if (loading) return; 
    if (!formData || !db) return;
    setLoading(true);
    const searchIndex = generateProductSearchIndex(formData, categories || []);
    const isClearance = calculateIsClearance({ ...formData, price: Number(formData.price), salePrice: Number(formData.salePrice) });

    const finalData: any = { 
      ...formData, 
      isClearance,
      shelfPrice: Number(formData.shelfPrice) || 0,
      vendorId: isVendor ? vendor?.id : formData.vendorId,
      price: Number(formData.price) || 0, 
      salePrice: Number(formData.salePrice) || 0, 
      stock: Number(formData.stock) || 0, 
      onlineStock: Number(formData.onlineStock) || 0, 
      searchIndex, 
      images: formData.images.map((img:any) => img.url), 
      updatedAt: serverTimestamp() 
    };

    try {
      if (mode === 'new') {
        finalData.createdAt = serverTimestamp();
        const docRef = await addDoc(collection(db, 'public_products'), finalData);
        syncProductEmbeddingAction(docRef.id).catch(() => {});
      } else {
        await updateDoc(doc(db, 'public_products', productId!), finalData);
        syncProductEmbeddingAction(productId!).catch(() => {});
      }
      setIsDirty(false);
      router.push(isVendor ? "/vendor/products" : "/admin/products");
    } catch (error: any) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: mode === 'new' ? 'public_products' : `public_products/${productId}`,
        operation: mode === 'new' ? 'create' : 'update',
        requestResourceData: finalData,
      }));
    } finally { setLoading(false); }
  };

  if (!formData) return <div className="h-96 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-24 animate-in fade-in">
      <div className="flex items-center justify-between sticky top-0 z-30 bg-background/80 backdrop-blur py-4 border-b px-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => { if(isDirty && !confirm("確定退出？")) return; router.back(); }} className="rounded-full"><ArrowLeft className="h-5 w-5" /></Button>
          <h1 className="text-2xl font-black font-headline">{mode === 'new' ? '新增產品' : '編輯產品'}</h1>
        </div>
        <div className="flex gap-3">
          {isDirty && <Badge variant="outline" className="h-11 px-4 border-orange-200 text-orange-600 bg-orange-50 font-bold uppercase animate-pulse">Unsaved</Badge>}
          <Button className="bg-primary text-primary-foreground font-black shadow-lg rounded-xl h-11 px-8" onClick={handleSave} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            {isVendor && mode === 'new' ? "提交送審" : "儲存產品"}
          </Button>
        </div>
      </div>

      <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
        <TabsList className="w-full justify-start border-b h-12 bg-transparent gap-8 p-0 mb-8 overflow-x-auto no-scrollbar pb-1 px-4">
          {[
            { id: 'basics', label: '基本資訊' },
            { id: 'specs', label: '規格參數' },
            { id: 'legal', label: '標籤合規' },
            { id: 'pricing', label: '定價庫存' },
            { id: 'media', label: '相簿' },
            { id: 'content', label: '詳情內容' },
            { id: 'relations', label: '關聯 SEO' }
          ].map(tab => (
            <TabsTrigger key={tab.id} value={tab.id} className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary px-0 pb-4 font-bold text-sm uppercase">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <div className="px-4">
          <TabsContent value="basics"><ProductBasicsTab formData={formData} onInputChange={handleInputChange} categories={categories} brands={brands} vendors={isVendor ? [vendor] : vendors} lang={lang} isVendor={isVendor} onAiGenerate={() => executeAiGeneration('seo')} onSuggestSlug={handleSuggestSlug} aiLoading={aiLoading.seo} /></TabsContent>
          <TabsContent value="specs"><ProductSpecsTab formData={formData} onInputChange={handleInputChange} /></TabsContent>
          <TabsContent value="legal"><ProductLegalTab formData={formData} onInputChange={handleInputChange} lang={lang} brands={brands} /></TabsContent>
          <TabsContent value="pricing"><ProductPricingTab formData={formData} onInputChange={handleInputChange} locations={locations} isVendor={isVendor} allowedLocationIds={isVendor ? vendor?.allowedLocationIds : []} /></TabsContent>
          <TabsContent value="media"><ProductMediaTab formData={formData} onInputChange={handleInputChange} productId={productId || 'new'} /></TabsContent>
          <TabsContent value="content"><ProductContentTab formData={formData} onInputChange={handleInputChange} isVendor={isVendor} onAiGenerate={executeAiGeneration} aiLoading={aiLoading} /></TabsContent>
          <TabsContent value="relations"><ProductRelationsTab formData={formData} onInputChange={handleInputChange} allProducts={allProducts} productId={productId || 'new'} lang={lang} isVendor={isVendor} onAiSeoGenerate={() => executeAiGeneration('seo')} aiLoading={aiLoading.seo} /></TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
