"use client";

import { useMemo, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { 
  Star, 
  FlaskConical, 
  MessageCircle, 
  Loader2, 
  Send, 
  User as UserIcon,
  Sparkles,
  HelpCircle,
  Apple,
  GanttChartSquare,
  CheckCircle2,
  Coins,
  AlertTriangle,
  Info,
  Warehouse,
  Truck,
  Building2,
  MapPin,
  Gavel,
  ShieldCheck,
  Phone,
  FileText,
  Calendar,
  ChevronRight,
  ArrowRight
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useUser, useAuth, useFirestore, useCollection, useDoc } from "@/firebase";
import { 
  doc, 
  serverTimestamp, 
  getDoc,
  getDocs, 
  collection, 
  query, 
  where, 
  limit, 
  orderBy,
  setDoc,
  deleteDoc,
  increment,
  runTransaction,
  onSnapshot,
  type Transaction 
} from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { COUNTRY_NAME_MAP } from "@/lib/address-data";

/**
 * 過敏原中英文映射表
 */
const ALLERGEN_MAP: Record<string, { zh: string, en: string }> = {
  gluten: { zh: "含有麩質的穀類", en: "Gluten" },
  crustaceans: { zh: "甲殼類動物", en: "Crustaceans" },
  eggs: { zh: "蛋類", en: "Eggs" },
  fish: { zh: "魚類", en: "Fish" },
  peanuts: { zh: "花生", en: "Peanuts" },
  soybeans: { zh: "大豆", en: "Soybeans" },
  milk: { zh: "奶類", en: "Milk" },
  tree_nuts: { zh: "木本堅果", en: "Tree Nuts" },
  sulphites: { zh: "亞硫酸鹽", en: "Sulphites" }
};

interface ProductDetailsTabsProps {
  product: any;
  lang: string;
  t: any;
  user: any;
  userData: any;
  allBrands?: any[] | null;
}

export function AlcoholLegalNotice() {
  return (
    <div className="my-6 border-2 border-[#1A1A4D] bg-[#FCE4EC] rounded-2xl overflow-hidden shadow-sm animate-in zoom-in duration-500">
      <div className="p-5 md:p-6 space-y-4 text-center">
        <p className="text-sm md:text-base font-black text-[#1A1A4D] leading-tight font-headline italic">
          Under the law of Hong Kong, intoxicating liquor must not be sold or supplied to a minor in the course of business.
        </p>
        <p className="text-base md:text-lg font-black text-[#1A1A4D] leading-snug tracking-tighter">
          根據香港法律，不得在業務過程中，向未成年人售賣或供應令人醺醉的酒類。
        </p>
      </div>
    </div>
  );
}

function PesticidePoisonNotice() {
  return (
    <div className="inline-block border-2 border-black bg-white overflow-hidden shadow-sm animate-in zoom-in duration-500">
      <div className="px-5 py-1 text-center border-b-2 border-black">
        <span className="text-xl font-black text-black">毒藥</span>
      </div>
      <div className="px-5 py-1 text-center bg-black">
        <span className="text-lg font-black text-white tracking-widest">POISON</span>
      </div>
    </div>
  );
}

function PesticideChildrenNotice() {
  return (
    <div className="my-4 border-2 border-black bg-white rounded-lg overflow-hidden shadow-sm animate-in slide-in-from-top-2 duration-500">
      <div className="p-4 flex flex-col items-center gap-2 text-center">
        <div className="flex items-center gap-3">
          <AlertTriangle className="h-6 w-6 text-black" strokeWidth={3} />
          <span className="text-lg font-black text-black uppercase tracking-widest">CAUTION 注意</span>
        </div>
        <div className="h-px bg-black w-full my-1 opacity-20" />
        <p className="text-base md:text-xl font-black text-black leading-tight uppercase">
          KEEP OUT OF REACH OF CHILDREN 遠離孩童
        </p>
      </div>
    </div>
  );
}

export function ProductDetailsTabs({
  product, lang, t, user, userData, allBrands = null
}: ProductDetailsTabsProps) {
  const db = useFirestore();
  const { toast } = useToast();
  const isEn = lang === 'en';

  const [shouldLoad, setShouldLoad] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShouldLoad(true), 300);
    return () => clearTimeout(timer);
  }, []);

  // 1. 評論數據
  const reviewsQuery = useMemo(() => {
    if (!db || !product?.id || !shouldLoad) return null;
    return query(collection(db, 'public_products', product.id, 'reviews'), orderBy('createdAt', 'desc'));
  }, [db, product?.id, shouldLoad]);

  const { data: reviews, loading: reviewsLoading } = useCollection<any>(reviewsQuery);

  // 2. 相關內容數據
  const relatedArticlesQuery = useMemo(() => {
    if (!db || !product?.id || !shouldLoad) return null;
    return query(
      collection(db, 'articles'),
      where('status', '==', 'published'),
      where('relatedProductIds', 'array-contains', product.id),
      orderBy('createdAt', 'desc')
    );
  }, [db, product?.id, shouldLoad]);

  const { data: relatedArticles, loading: articlesLoading } = useCollection<any>(relatedArticlesQuery);

  const loyaltyConfigRef = useMemo(() => (db && shouldLoad) ? doc(db, 'config', 'loyalty') : null, [db, shouldLoad]);
  const { data: loyaltyConfig } = useDoc<any>(loyaltyConfigRef);

  /**
   * 核心連動邏輯：嘗試獲取品牌檔案中的製造商資訊
   */
  const brandData = useMemo(() => {
    if (!allBrands || !product?.primaryBrand) return null;
    const rawBrand = String(product.primaryBrand).trim().toLowerCase();
    return allBrands.find(b => 
      (b.name_zh && b.name_zh.trim().toLowerCase() === rawBrand) ||
      (b.name_en && b.name_en.trim().toLowerCase() === rawBrand)
    );
  }, [allBrands, product?.primaryBrand]);

  const earliestExpiry = useMemo(() => {
    if (!product?.batches || !Array.isArray(product.batches)) return null;
    const todayStr = format(new Date(), "yyyy-MM-dd");
    
    const activeBatchesWithStock = product.batches.filter((b: any) => 
      b.expiryDate && 
      b.expiryDate >= todayStr && 
      (Number(b.quantity) || 0) > 0
    );
    
    if (activeBatchesWithStock.length === 0) return null;
    const sorted = [...activeBatchesWithStock].sort((a: any, b: any) => a.expiryDate.localeCompare(b.expiryDate));
    return sorted[0].expiryDate;
  }, [product]);

  const isLiquorProduct = useMemo(() => 
    product.spec?.legalTags?.includes("令人醺醉的酒類")
  , [product]);

  const isPoisonProduct = useMemo(() => 
    product.spec?.legalTags?.includes("毒藥 POISON")
  , [product]);

  const isChildrenWarningRequired = useMemo(() => 
    product.spec?.legalTags?.includes("遠離孩童 KEEP OUT OF REACH OF CHILDREN")
  , [product]);

  /**
   * 修正：加入品牌連動判斷
   * 只要「產品層級」或「品牌層級」具備製造商資料，即顯示該分頁。
   */
  const hasLegalInfo = useMemo(() => {
    const s = product.spec || {};
    const b = brandData || {};
    return !!(
      s.mfrName_zh || s.mfrName_en || b.mfrName_zh || b.mfrName_en ||
      s.storageInstructions_zh || s.storageInstructions_en || 
      s.caution_zh || s.caution_en || 
      s.custom_zh || s.custom_en ||
      (Array.isArray(s.legalTags) && s.legalTags.length > 0)
    );
  }, [product, brandData]);

  /**
   * 輔助：優先獲取產品層級資料，若無則回退至品牌層級
   */
  const getLinkedValue = (prodField: string, brandField: string) => {
    const pVal = product.spec?.[prodField];
    if (pVal && pVal.trim() !== "") return { value: pVal, isInherited: false };
    
    const bVal = brandData?.[brandField];
    if (bVal && bVal.trim() !== "") return { value: bVal, isInherited: true };
    
    return { value: "", isInherited: false };
  };

  const specsList = useMemo(() => {
    if (!product) return [];
    const list = [];
    const spec = product.spec || {};
    
    if (spec.origin) {
      list.push({ label: isEn ? "Origin" : "原產地", value: COUNTRY_NAME_MAP[spec.origin] || spec.origin });
    }
    if (spec.qty) {
      list.push({ label: isEn ? "Quantity" : "規格/數量", value: `${spec.qty} ${spec.qtyUnit || ''}` });
    }
    if (spec.netWeight) {
      list.push({ label: isEn ? "Net Weight" : "淨重/容量", value: `${spec.netWeight}${spec.netWeightUnit || ''}` });
    }
    if (earliestExpiry) {
      list.push({ label: t.product.best_before_label, value: earliestExpiry });
    }
    
    if (spec.pesticideReg) list.push({ label: isEn ? "Pesticide Reg. No." : "除害劑註冊編號", value: spec.pesticideReg });
    if (spec.pesticideLic) list.push({ label: isEn ? "Pesticide License No." : "除害劑牌照號碼", value: spec.pesticideLic });
    if (spec.heatTemp) list.push({ label: isEn ? "Heat Resistance" : "耐熱溫度", value: `${spec.heatTemp}°C` });
    if (spec.coldTemp) list.push({ label: isEn ? "Cold Resistance" : "耐冷溫度", value: `${spec.coldTemp}°C` });
    
    const translateBoolean = (val: string) => {
      if (val === 'can') return isEn ? "Can" : "可以";
      if (val === 'cannot') return isEn ? "Cannot" : "不可以";
      return isEn ? "N/A" : "不適用";
    };
    
    if (spec.microwave && spec.microwave !== 'none') list.push({ label: isEn ? "Microwave Safe" : "微波爐加熱", value: translateBoolean(spec.microwave) });
    if (spec.dishwasher && spec.dishwasher !== 'none') list.push({ label: isEn ? "Dishwasher Safe" : "洗碗機清洗", value: translateBoolean(spec.dishwasher) });
    
    const customVal = isEn ? (spec.custom_en || spec.custom) : (spec.custom_zh || spec.custom);
    if (customVal) list.push({ label: isEn ? "More Info" : "額外資訊", value: customVal });
    
    return list;
  }, [product, isEn, earliestExpiry, t.product.best_before_label]);

  const nutritionData = useMemo(() => {
    if (!product.nutrition) return [];
    return [
      { label: isEn ? "Energy" : "能量", value: product.nutrition.energy_kcal, unit: "kcal" },
      { label: isEn ? "Protein" : "蛋白質", value: product.nutrition.protein_g, unit: "g" },
      { label: isEn ? "Total Fat" : "總脂肪", value: product.nutrition.fat_total_g, unit: "g" },
      { label: isEn ? "Saturated Fat" : "飽和脂肪", value: product.nutrition.fat_saturated_g, unit: "g" },
      { label: isEn ? "Trans Fat" : "反式脂肪", value: product.nutrition.fat_trans_g, unit: "g" },
      { label: isEn ? "Carbohydrates" : "碳水化合物", value: product.nutrition.carbohydrates_g, unit: "g" },
      { label: isEn ? "Sugars" : "糖", value: product.nutrition.sugars_g, unit: "g" },
      { label: isEn ? "Sodium" : "鈉", value: product.nutrition.sodium_mg, unit: "mg" }
    ].filter(item => item.value !== undefined && item.value !== "" && item.value !== null);
  }, [product.nutrition, isEn]);

  const expectedReviewPoints = useMemo(() => {
    if (!loyaltyConfig) return 10;
    const tier = userData?.tier || 'classic';
    return Number(loyaltyConfig[`reviewReward${tier.charAt(0).toUpperCase() + tier.slice(1)}`]) || 10;
  }, [loyaltyConfig, userData?.tier]);

  const onSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || user.isAnonymous || !product || !reviewComment.trim() || !db) return;
    setIsSubmittingReview(true);
    try {
      const reviewId = `rev_${user.uid}_${Date.now()}`;
      const reviewData = { 
        rating: reviewRating, 
        comment: reviewComment.trim(), 
        authorName: userData?.displayName || user.email?.split('@')[0], 
        authorUid: user.uid, 
        productId: product.id, 
        productName: isEn ? (product.productName_en || product.productName_zh) : (product.productName_zh || product.productName_en),
        createdAt: serverTimestamp() 
      };
      await runTransaction(db, async (transaction: Transaction) => {
        transaction.set(doc(db, 'public_products', product.id, 'reviews', reviewId), reviewData);
        transaction.set(doc(db, 'global_reviews', reviewId), reviewData);
        transaction.update(doc(db, 'users', user.uid), { points: increment(expectedReviewPoints), updatedAt: serverTimestamp() });
      });
      toast({ title: t.product.review_success });
      setReviewComment("");
    } catch (err: any) { toast({ title: t.common.error, variant: "destructive" }); } finally { setIsSubmittingReview(false); }
  };

  const localizedFaqs = isEn ? (product.faqs_en || []) : (product.faqs_zh || []);

  if (!shouldLoad) return <div className="h-64 flex items-center justify-center opacity-30"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  // 獲取連動後的製造商資料
  const mfrName = getLinkedValue('mfrName', 'mfrName');
  const mfrAddr = getLinkedValue('mfrAddress', 'mfrAddress');

  return (
    <Tabs defaultValue="description" className="w-full">
      <TabsList className="w-full justify-start border-b rounded-none h-auto p-0 bg-white sticky top-14 lg:top-[156px] z-30 gap-8 overflow-x-auto no-scrollbar pb-1 transition-all duration-300">
        <TabsTrigger value="description" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-4 font-bold text-sm uppercase tracking-widest">{t.product.description}</TabsTrigger>
        {relatedArticles && relatedArticles.length > 0 && (
          <TabsTrigger value="insights" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-4 font-bold text-sm uppercase tracking-widest flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            {isEn ? "Insights" : "好物誌"}
          </TabsTrigger>
        )}
        <TabsTrigger value="ingredients" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-4 font-bold text-sm uppercase tracking-widest">{isEn ? "Facts" : "成分與營養"}</TabsTrigger>
        <TabsTrigger value="specs" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-4 font-bold text-sm uppercase tracking-widest">{t.product.specifications}</TabsTrigger>
        {hasLegalInfo && <TabsTrigger value="legal" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-4 font-bold text-sm uppercase tracking-widest">注意事項</TabsTrigger>}
        {localizedFaqs.length > 0 && <TabsTrigger value="faq" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-4 font-bold text-sm uppercase tracking-widest">{isEn ? "FAQ" : "常見問題"}</TabsTrigger>}
        <TabsTrigger value="reviews" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-4 font-bold text-sm uppercase tracking-widest">{t.product.reviews} ({reviews?.length || 0})</TabsTrigger>
      </TabsList>
      
      <div className="py-8 min-h-[300px]">
        <TabsContent value="description" className="mt-0 animate-in fade-in duration-500">
          <div className="max-w-3xl prose prose-neutral max-w-none prose-p:text-lg prose-p:leading-relaxed prose-p:text-muted-foreground prose-headings:font-black prose-img:rounded-3xl" dangerouslySetInnerHTML={{ __html: isEn ? (product.longDescription_en || product.longDescription_zh || "") : (product.longDescription_zh || product.longDescription_en || "") }} />
          {isLiquorProduct && <AlcoholLegalNotice />}
        </TabsContent>

        <TabsContent value="insights" className="mt-0 animate-in fade-in duration-500">
          <div className="max-w-5xl space-y-8">
            <div className="space-y-1">
              <h3 className="text-xl font-black">{isEn ? "Related Insights & Stories" : "關於此貨品的好物誌"}</h3>
              <p className="text-sm text-muted-foreground">{isEn ? "Discover recipes, tips, and deeper stories behind this product." : "探索有關此產品的食譜、小貼士及深度故事。"}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {relatedArticles?.map((art: any) => (
                <Link key={art.id} href={`/news/${art.id}`}>
                  <Card className="group border-none shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden bg-white rounded-3xl h-full flex flex-col">
                    <div className="relative aspect-[21/9] overflow-hidden bg-muted">
                      {art.coverImage && <Image src={art.coverImage} alt="" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />}
                    </div>
                    <CardContent className="p-6 space-y-3">
                      <div className="flex items-center gap-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                        <span className="flex items-center gap-1"><Calendar className="h-3 w-3 text-primary" /> {art.createdAt?.seconds ? format(new Date(art.createdAt.seconds * 1000), 'yyyy-MM-dd') : '--'}</span>
                        <Badge variant="outline" className="h-4 text-[8px] font-black border-primary/20 text-primary uppercase">{art.category || 'News'}</Badge>
                      </div>
                      <h4 className="font-bold text-base group-hover:text-primary transition-colors leading-tight line-clamp-1">
                        {isEn ? (art.title?.en || art.title?.zh) : (art.title?.zh || art.title?.en)}
                      </h4>
                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {isEn ? (art.excerpt?.en || art.excerpt?.zh) : (art.excerpt?.zh || art.excerpt?.en)}
                      </p>
                      <div className="pt-2 flex items-center text-primary font-black text-[10px] uppercase tracking-widest gap-1.5">
                        {isEn ? 'Read Insight' : '閱讀全文'} <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-all" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="ingredients" className="mt-0 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl">
            <div className="bg-muted/20 p-8 rounded-[2.5rem] border border-dashed border-muted-foreground/20 space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><FlaskConical className="h-5 w-5" /></div>
                <h3 className="text-xl font-bold">{isEn ? "Ingredients & Allergens" : "產品成分與過敏原"}</h3>
              </div>
              <div className="space-y-4">
                <div className="prose prose-sm max-w-none text-muted-foreground leading-relaxed whitespace-pre-line" dangerouslySetInnerHTML={{ __html: isEn ? (product.ingredients_en || "No ingredient data available.") : (product.ingredients_zh || "暫無成分資料。") }} />
                {Array.isArray(product.allergens) && product.allergens.length > 0 && (
                  <div className="pt-4 space-y-2">
                    <p className="text-[10px] font-black uppercase text-red-600 tracking-widest">Allergen Warning / 過敏原提示</p>
                    <div className="flex flex-wrap gap-2">
                      {product.allergens.map((a: string) => {
                        const info = ALLERGEN_MAP[a];
                        const label = info ? `${info.zh} (${info.en})` : a.replace('_', ' ');
                        return (
                          <Badge key={a} variant="outline" className="bg-red-50 text-red-700 border-red-100 text-[10px] px-3 font-bold uppercase">
                            {label}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {nutritionData.length > 0 && (
              <div className="bg-white border rounded-[2rem] p-8 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600"><Apple className="h-5 w-5" /></div>
                    <h3 className="text-xl font-bold">{isEn ? "Nutrition Facts" : "營養成分表"}</h3>
                  </div>
                  {product.nutrition?.serving_size && <Badge variant="secondary" className="text-[10px] font-bold">Per {product.nutrition.serving_size}</Badge>}
                </div>
                <div className="space-y-0 border-t border-black">
                  {nutritionData.map((item, idx) => (
                    <div key={idx} className="flex justify-between py-2.5 border-b border-muted">
                      <span className="text-sm font-bold text-slate-600">{item.label}</span>
                      <span className="text-sm font-black">{item.value}{item.unit}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="specs" className="mt-0 animate-in fade-in duration-500">
          <div className="max-w-4xl space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-1 bg-white border rounded-[2rem] p-8 shadow-sm">
              {specsList.length === 0 ? (
                <p className="col-span-2 text-center text-muted-foreground italic py-10">No detailed specifications available.</p>
              ) : specsList.map((item, i) => (
                <div key={i} className="flex justify-between py-3 border-b border-muted last:border-0 md:odd:border-r md:odd:pr-6 md:even:pl-6">
                  <span className="text-muted-foreground font-bold text-xs uppercase tracking-wider">{item.label}</span>
                  <span className="font-black text-sm text-slate-900">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="legal" className="mt-0 animate-in fade-in duration-500">
          <div className="max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div className="space-y-8">
              {(isPoisonProduct || isChildrenWarningRequired) && (
                <section className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase text-red-600 tracking-widest flex items-center gap-2">
                    <ShieldCheck className="h-3.5 w-3.5" /> 除害劑法定警示 Pesticide Warnings
                  </h4>
                  <div className="flex flex-col gap-4">
                    {isChildrenWarningRequired && <PesticideChildrenNotice />}
                    {isPoisonProduct && <PesticidePoisonNotice />}
                  </div>
                </section>
              )}

              {(mfrName.value || mfrAddr.value) && (
                <section className="space-y-3">
                  <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5 text-primary" /> 製造商資訊 Manufacturer
                  </h4>
                  <div className="p-6 bg-white border rounded-3xl shadow-sm space-y-2 relative overflow-hidden">
                    {mfrName.isInherited && (
                       <Badge variant="outline" className="absolute top-4 right-4 bg-primary/5 text-primary border-primary/20 text-[8px] font-black uppercase">Brand Default</Badge>
                    )}
                    <p className="font-black text-slate-900">{mfrName.value || "--"}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                      {mfrAddr.value || "--"}
                    </p>
                  </div>
                </section>
              )}

              {(product.spec?.storageInstructions_zh || product.spec?.storageInstructions_en || product.spec?.usageInstructions_zh || product.spec?.usageInstructions_en) && (
                <section className="space-y-6">
                  { (product.spec?.storageInstructions_zh || product.spec?.storageInstructions_en) && (
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                        <Warehouse className="h-3.5 w-3.5 text-primary" /> 貯存方法 Storage
                      </h4>
                      <p className="text-sm text-slate-700 bg-muted/20 p-5 rounded-2xl border border-dashed leading-relaxed italic">
                        {isEn ? (product.spec.storageInstructions_en || product.spec.storageInstructions_zh) : (product.spec.storageInstructions_zh || product.spec.storageInstructions_en)}
                      </p>
                    </div>
                  )}
                  { (product.spec?.usageInstructions_zh || product.spec?.usageInstructions_en) && (
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                        <Truck className="h-3.5 w-3.5 text-primary" /> 使用方法 Directions
                      </h4>
                      <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed whitespace-pre-line" dangerouslySetInnerHTML={{ __html: isEn ? (product.spec.usageInstructions_en || product.spec.usageInstructions_zh) : (product.spec.usageInstructions_zh || product.spec.usageInstructions_en) }} />
                    </div>
                  )}
                </section>
              )}

              {(product.spec?.custom_zh || product.spec?.custom_en) && (
                <section className="space-y-3">
                   <h4 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                     <Info className="h-3.5 w-3.5 text-primary" /> 額外資訊 Extra Info
                   </h4>
                   <div className="p-6 bg-slate-50 border rounded-3xl shadow-sm text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                     {isEn ? (product.spec.custom_en || product.spec.custom_zh) : (product.spec.custom_zh || product.spec.custom_en)}
                   </div>
                </section>
              )}
            </div>

            <div className="space-y-8">
              {isLiquorProduct && <AlcoholLegalNotice />}

              <Card className="border-none shadow-xl bg-slate-900 text-white rounded-[2.5rem] overflow-hidden border-l-[10px] border-orange-500">
                <CardHeader className="bg-white/5 border-b p-8">
                  <CardTitle className="text-xl font-black flex items-center gap-3 text-orange-400">
                    <AlertTriangle className="h-6 w-6" /> 注意事項與安全警示
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  { (product.spec?.caution_zh || product.spec?.caution_en) && (
                    <div className="space-y-2">
                      <p className="text-sm text-slate-300 leading-relaxed italic whitespace-pre-line">
                        "{isEn ? (product.spec.caution_en || product.spec.caution_zh) : (product.spec.caution_zh || product.spec.caution_en)}"
                      </p>
                    </div>
                  )}

                  {Array.isArray(product.spec?.legalTags) && product.spec.legalTags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {product.spec.legalTags.map((tag: string, idx: number) => (
                        <Badge key={idx} className="bg-orange-500 text-white border-none font-black text-[10px] px-3 h-7 uppercase shadow-sm">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {(product.spec?.activeIngredients_zh || product.spec?.activeIngredients_en) && (
                <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100 space-y-3">
                   <h4 className="text-[10px] font-black uppercase text-blue-700 tracking-widest flex items-center gap-2">
                     <FlaskConical className="h-3.5 w-3.5" /> 有效成分 Active Ingredients
                   </h4>
                   <p className="text-xs text-blue-900 font-bold leading-relaxed">
                     {isEn ? (product.spec.activeIngredients_en || product.spec.activeIngredients_zh) : (product.spec.activeIngredients_zh || product.spec.activeIngredients_en)}
                   </p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="faq" className="mt-0 animate-in fade-in duration-500">
          <div className="max-w-3xl space-y-6">
            <Accordion type="single" collapsible className="w-full space-y-3">
              {localizedFaqs.map((faq: any, i: number) => (
                <AccordionItem key={i} value={`faq-${i}`} className="border-none">
                  <AccordionTrigger className="text-left font-black p-5 bg-muted/20 rounded-2xl hover:no-underline transition-all">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="p-6 text-muted-foreground leading-relaxed text-base bg-white border-x border-b rounded-b-2xl -mt-1 shadow-inner">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </TabsContent>
        
        <TabsContent value="reviews" className="mt-0 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-7 space-y-6">
              {reviewsLoading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : !reviews || reviews.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-3xl bg-muted/10 text-muted-foreground italic">
                  <MessageCircle className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p>{t.product.no_reviews}</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {reviews.map((rev: any) => (
                    <div key={rev.id} className="p-6 bg-white border rounded-2xl shadow-sm space-y-3 relative overflow-hidden transition-all hover:shadow-md">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center font-bold text-xs text-primary-foreground">
                            {rev.authorName?.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-bold text-sm">{rev.authorName}</span>
                        </div>
                        <div className="flex gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className={cn("h-3 w-3", i < rev.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/20")} />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {rev.comment}
                      </p>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold text-right opacity-50">
                        {rev.createdAt?.seconds ? format(new Date(rev.createdAt.seconds * 1000), 'yyyy-MM-dd HH:mm') : '--'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="lg:col-span-5">
              {user ? (
                <Card className="border-none shadow-lg bg-white rounded-3xl overflow-hidden border-2 border-primary/10">
                  <CardHeader className="bg-primary/5 border-b py-5 px-8">
                    <CardTitle className="text-lg flex items-center gap-2 text-primary font-black uppercase">
                      <Sparkles className="h-5 w-5 fill-current" /> {t.product.write_review}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8 space-y-8">
                    <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-center gap-3">
                      <Coins className="h-5 w-5 text-indigo-600" />
                      <p className="text-xs font-black text-indigo-800 uppercase tracking-tight">{t.product.review_reward_hint}</p>
                    </div>
                    <div className="space-y-4">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">您的評分</Label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button key={star} onClick={() => setReviewRating(star)} className="focus:outline-none transform transition-transform active:scale-90">
                            <Star className={cn("h-9 w-9 transition-all", star <= reviewRating ? "fill-yellow-400 text-yellow-400 scale-110 drop-shadow-md" : "text-muted-foreground/20")} />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="grid gap-3">
                      <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">心得內容</Label>
                      <Textarea 
                        className="min-h-[140px] bg-muted/20 border-none rounded-2xl p-4 text-sm"
                        placeholder={isEn ? "Share your authentic experience..." : "分享您的真實使用心得..."}
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                      />
                    </div>
                    <Button 
                      className="w-full h-14 rounded-2xl font-black text-lg bg-primary text-primary-foreground shadow-xl gap-2"
                      disabled={isSubmittingReview || !reviewComment.trim()}
                      onClick={onSubmitReview}
                    >
                      {isSubmittingReview ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                      {t.product.submit_review}
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="p-10 border-4 border-dashed rounded-[3rem] bg-muted/5 text-center space-y-6">
                  <UserIcon className="h-8 w-8 text-muted-foreground/20 mx-auto" />
                  <p className="text-sm text-muted-foreground">請先登入以發表評價並領取積分獎勵。</p>
                  <Button asChild className="rounded-xl font-bold bg-primary px-10 h-12 shadow-md">
                    <Link href="/login">立即登入</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </div>
    </Tabs>
  );
}
