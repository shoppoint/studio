"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  ArrowRight,
  Save, 
  Loader2, 
  Zap, 
  Tag, 
  Layers, 
  Trash2, 
  Plus,
  Info,
  Globe,
  X,
  Package,
  Search,
  Sparkles,
  FileText,
  Image as ImageIcon,
  Upload,
  Calendar,
  HeartHandshake,
  Crown,
  Layers as StackingIcon,
  Ticket,
  AlertTriangle,
  Clock,
  CalendarDays,
  Award,
  UserCheck,
  Mail,
  Lock,
  UserPlus,
  Send,
  Check,
  CheckCircle2,
  Building2,
  Box,
  Tags,
  Percent,
  Coins,
  Link as LinkIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useI18n } from "@/lib/i18n/i18n-context";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useStorage, useUser, useFirestore, useCollection } from "@/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { doc, updateDoc, addDoc, serverTimestamp, collection, query, where, limit, orderBy, deleteDoc } from "firebase/firestore";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { compressImage } from "@/lib/image-utils";
import { Checkbox } from "@/components/ui/checkbox";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { triggerNotification } from "@/services/communication-service";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface PromotionFormContainerProps {
  mode: 'new' | 'edit';
  promoId?: string;
  initialData?: any;
  isVendor?: boolean;
  isImpact?: boolean;
}

/**
 * 促銷活動表單容器
 * 修正：加入 if (loading) return 守衛，防止重複點擊儲存。
 */
export function PromotionFormContainer({ mode, promoId, initialData, isVendor = false, isImpact = false }: PromotionFormContainerProps) {
  const router = useRouter();
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const db = useFirestore();
  const storage = useStorage();
  const { user } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [isNotifying, setIsNotifying] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [pickerSearch, setPickerSearch] = useState("");
  const [isDirty, setIsDirty] = useState(false);

  const vendorQuery = useMemo(() => (isVendor && user && db) ? query(
    collection(db, 'vendors'), 
    where('linkedUserId', '==', user.uid),
    limit(1)
  ) : null, [db, user, isVendor]);
  const { data: vendorList } = useCollection<any>(vendorQuery);
  const vendor = vendorList?.[0];

  const productsRawQuery = useMemo(() => {
    if (!db) return null;
    let base = collection(db, "public_products");
    if (isVendor) {
      if (!vendor) return null;
      return query(base, where('vendorId', '==', vendor.id), orderBy("productName_zh"));
    }
    return query(base, orderBy("productName_zh"));
  }, [db, isVendor, vendor]);
  const { data: allProducts } = useCollection<any>(productsRawQuery);

  const categoriesRawQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, "categories"), where('isVisible', '==', true), orderBy("displayOrder", "asc"));
  }, [db]);
  const { data: allCategories } = useCollection<any>(categoriesRawQuery);

  const brandsRawQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, "brands"), where('status', '==', 'Active'), orderBy("name_zh", "asc"));
  }, [db]);
  const { data: allBrands } = useCollection<any>(brandsRawQuery);

  const [formData, setFormData] = useState<any>(null);

  useEffect(() => {
    if (initialData && !formData) {
      setFormData({
        ...initialData,
        name: initialData.name || { en: "", zh: "" },
        shortLabel: initialData.shortLabel || { en: "", zh: "" },
        publicSummary: initialData.publicSummary || { en: "", zh: "" },
        targetType: initialData.targetType || "all",
        targetIds: Array.isArray(initialData.targetIds) ? initialData.targetIds : [],
        eligibleTiers: Array.isArray(initialData.eligibleTiers) ? initialData.eligibleTiers : ["classic", "gold", "platinum"],
        minSpend: initialData.minSpend || 0,
        minQty: initialData.minQty || 1,
        targetUrl: initialData.targetUrl || "/shop",
        totalQuota: initialData.totalQuota === null ? "" : (initialData.totalQuota || ""),
        limitPerUser: initialData.limitPerUser === 0 ? "0" : (initialData.limitPerUser || ""),
        buyX: initialData.buyX || 1,
        getY: initialData.getY || 1,
        discountOnY: initialData.discountOnY || 100,
        fixedPriceY: initialData.fixedPriceY || 0,
        caseDiscountType: initialData.caseDiscountType || "fixed_price",
        recurrenceType: initialData.recurrenceType || "none",
        recurrenceValue: initialData.recurrenceValue || "",
        restrictedToEmail: initialData.restrictedToEmail || "",
        isPublic: initialData.isPublic !== false,
        pointsMultiplier: initialData.pointsMultiplier || 1,
        status: initialData.status || "active"
      });
    }
  }, [initialData, formData]);

  const targetLabel = formData?.targetType === 'product' ? '指定產品' : formData?.targetType === 'category' ? '指定類別' : formData?.targetType === 'brand' ? '指定品牌' : '全站適用';
  const targetItemsPool = formData?.targetType === 'product' ? allProducts : formData?.targetType === 'category' ? allCategories : formData?.targetType === 'brand' ? allBrands : [];

  const filteredPickerPool = useMemo(() => {
    if (!targetItemsPool) return [];
    const q = pickerSearch.toLowerCase().trim();
    if (!q) return targetItemsPool.slice(0, 50);

    return targetItemsPool.filter((it: any) => {
      const nameZh = String(it.productName_zh || it.name_zh || "").toLowerCase();
      const nameEn = String(it.productName_en || it.name_en || "").toLowerCase();
      const sku = String(it.sku || "").toLowerCase();
      const id = String(it.id || "").toLowerCase();
      return nameZh.includes(q) || nameEn.includes(q) || sku.includes(q) || id.includes(q);
    }).slice(0, 50);
  }, [targetItemsPool, pickerSearch]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleMultilingualChange = (field: 'name' | 'publicSummary' | 'shortLabel', langKey: 'en' | 'zh', value: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: { ...prev[field], [langKey]: value } }));
    setIsDirty(true);
  };

  const toggleBrandTarget = (it: any) => {
    const current: string[] = Array.isArray(formData.targetIds) ? formData.targetIds : [];
    const aliases = [it.name_zh, it.name_en].filter(Boolean);
    const isSelected = aliases.some(name => current.includes(name));
    
    let next: string[];
    if (isSelected) {
      next = current.filter((id: string) => !aliases.includes(id));
    } else {
      next = [...current, ...aliases];
    }
    
    handleFieldChange("targetIds", Array.from(new Set(next)));
  };

  const toggleTargetId = (id: string) => {
    const current = Array.isArray(formData.targetIds) ? formData.targetIds : [];
    const next = current.includes(id) ? current.filter((i: string) => i !== id) : [...current, id];
    handleFieldChange("targetIds", next);
  };

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !db) return;
    setLoading(true);
    try {
      const compressedBlob = await compressImage(file, 1200, 0.8);
      const fileName = `promotions/${Date.now()}_banner.webp`;
      const storageRef = ref(storage, fileName);
      const uploadTask = uploadBytesResumable(storageRef, compressedBlob, { contentType: 'image/webp' });
      uploadTask.on('state_changed', 
        (snap) => setUploadProgress((snap.bytesTransferred / snap.totalBytes) * 100), 
        null, 
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          handleInputChange("imageUrl", downloadURL);
          setUploadProgress(0); setLoading(false);
          toast({ title: "Banner Updated" });
        }
      );
    } catch (e) { setLoading(false); }
  };

  const handleNotifyCustomers = async () => {
    if (!db || !formData || !formData.restrictedToEmail) return;
    const emails = formData.restrictedToEmail.split(',').map((e: string) => e.trim()).filter(Boolean);
    if (emails.length === 0) return;
    setIsNotifying(true);
    let successCount = 0;
    try {
      for (const email of emails) {
        const res = await triggerNotification(db, 'cash_coupon_notice', {
          email, couponCode: formData.code || "AUTO", value: formData.value, name: formData.name, endsAt: formData.endsAt
        }, 'zh-HK', true);
        if (res.success) successCount++;
      }
      toast({ title: "通知已發送", description: `成功向 ${successCount} 位受眾寄出電郵通知。` });
    } catch (e: any) {
      toast({ title: "發送中斷", description: e.message, variant: "destructive" });
    } finally { setIsNotifying(false); }
  };

  const handleSave = async () => {
    if (loading) return; // 物理防止重複點擊
    if (!formData || !db) return;
    if (isVendor && !vendor) {
      toast({ title: "權限錯誤", description: "找不到您的商家檔案。", variant: "destructive" });
      return;
    }
    setLoading(true);
    
    const dataToSave: any = { 
      ...formData, 
      value: Number(formData.value) || 0, 
      minSpend: Number(formData.minSpend) || 0,
      minQty: Number(formData.minQty) || 1,
      buyX: Number(formData.buyX) || 1,
      getY: Number(formData.getY) || 1,
      discountOnY: Number(formData.discountOnY) || 100,
      fixedPriceY: Number(formData.fixedPriceY) || 0,
      pointsMultiplier: Number(formData.pointsMultiplier) || 1,
      totalQuota: formData.totalQuota === "" ? null : Number(formData.totalQuota),
      limitPerUser: formData.limitPerUser === "" ? 0 : Number(formData.limitPerUser),
      updatedAt: serverTimestamp() 
    };

    try {
      if (mode === 'new') {
        dataToSave.createdAt = serverTimestamp();
        if (isVendor) dataToSave.vendorId = vendor?.id;
        await addDoc(collection(db, 'promotions'), dataToSave);
      } else {
        await updateDoc(doc(db, 'promotions', promoId!), dataToSave);
      }
      setIsDirty(false);
      router.push(isImpact ? "/admin/marketing?tab=csr" : (isVendor ? "/vendor/promotions" : "/admin/marketing"));
    } catch (error: any) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: mode === 'new' ? 'promotions' : `promotions/${promoId}`,
        operation: mode === 'new' ? 'create' : 'update',
        requestResourceData: dataToSave,
      }));
    } finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!db || !promoId) return;
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'promotions', promoId));
      router.push(isImpact ? "/admin/marketing?tab=csr" : (isVendor ? "/vendor/promotions" : "/admin/marketing"));
    } catch (e) { setLoading(false); }
  };

  const getItemName = (id: string) => {
    if (formData.targetType === 'product') {
      const p = allProducts?.find((it:any) => it.id === id);
      return p ? (p.productName_zh || p.productName_en) : id;
    }
    if (formData.targetType === 'category') {
      const c = allCategories?.find((it:any) => it.id === id);
      return c ? (c.name_zh || c.name_en) : id;
    }
    if (formData.targetType === 'brand') {
      return id;
    }
    return id;
  };

  if (!formData) return <div className="h-96 flex flex-col items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-30 bg-background/80 backdrop-blur py-4 border-b px-2">
        <div className="flex items-center gap-4">
          <button onClick={() => { if(isDirty && !confirm("確定退出？")) return; router.back(); }} className="h-10 w-10 rounded-full hover:bg-muted flex items-center justify-center transition-all">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-3xl font-black font-headline tracking-tighter">
            {isImpact ? (mode === 'new' ? '建立公益聯乘活動' : '編輯公益聯乘活動') : (mode === 'new' ? '建立新促銷' : '編輯促銷詳情')}
          </h1>
        </div>
        <div className="flex gap-2">
          {mode === 'edit' && <Button variant="outline" className="rounded-xl h-11 border-destructive text-destructive font-bold" onClick={() => setIsDeleteDialogOpen(true)} disabled={loading}><Trash2 className="mr-2 h-4 w-4" /> 刪除</Button>}
          <Button className="bg-primary text-primary-foreground font-black shadow-lg rounded-xl h-11 px-8" onClick={handleSave} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} {isVendor && mode === 'new' ? "提交並送審" : t.common.save}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
            <CardHeader className="bg-muted/10 border-b flex flex-row items-center justify-between py-4 px-8">
              <CardTitle className="text-lg flex items-center gap-2">{isImpact ? <HeartHandshake className="h-5 w-5 text-indigo-600" /> : <Tag className="h-5 w-5 text-primary" />} 基本資訊與套用對象</CardTitle>
              <div className="flex items-center gap-2"><Label className="text-[10px] font-black uppercase text-muted-foreground">公開顯示</Label><Switch checked={formData.isPublic} onCheckedChange={(v) => handleInputChange("isPublic", v)} /></div>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="grid gap-2">
                  <Label className="text-xs font-bold uppercase">活動狀態 (Status)</Label>
                  <Select value={formData.status} onValueChange={(v) => handleInputChange("status", v)}>
                    <SelectTrigger className="h-11 bg-muted/20 border-none rounded-xl font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-2xl">
                      <SelectItem value="active" className="text-green-600 font-bold">Active (啟用中)</SelectItem>
                      <SelectItem value="inactive" className="text-muted-foreground font-bold">Inactive (停用)</SelectItem>
                      <SelectItem value="pending" className="text-orange-600 font-bold">Pending (待審核)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label className="text-xs font-bold uppercase">優惠代碼 (Code)</Label>
                  <Input className="font-mono h-11 uppercase bg-muted/20 border-none rounded-xl" value={formData.code || ""} onChange={(e) => handleInputChange("code", e.target.value.toUpperCase())} placeholder="不填則為自動套用" />
                </div>
                <div className="grid gap-2">
                  <Label className="text-xs font-bold uppercase">適用渠道</Label>
                  <Select value={formData.scope} onValueChange={(v) => handleInputChange("scope", v)}>
                    <SelectTrigger className="h-11 bg-muted/20 border-none rounded-xl font-bold"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-2xl"><SelectItem value="both">線上與實體分店</SelectItem><SelectItem value="online">僅限線上網店</SelectItem><SelectItem value="store">僅限實體門市</SelectItem></SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div className="grid gap-2">
                  <Label className="text-xs font-black uppercase text-primary tracking-widest flex items-center gap-2"><LinkIcon className="h-3.5 w-3.5" /> 跳轉目標網址 (Target URL)</Label>
                  <Input value={formData.targetUrl || "/shop"} onChange={(e) => handleInputChange("targetUrl", e.target.value)} className="h-11 bg-muted/20 border-none rounded-xl font-mono text-sm" placeholder="例如: /shop?category=beauty" />
                  <p className="text-[10px] text-muted-foreground italic ml-1">* 當顧客在「特惠資訊」頁面點擊此活動時，將會跳轉至此網址。</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
                <div className="space-y-4">
                  <Label className="text-xs font-black uppercase text-primary tracking-widest flex items-center gap-2">
                    <Layers className="h-4 w-4" /> 適用產品範圍 (Target Type)
                  </Label>
                  <Select value={formData.targetType} onValueChange={(v) => { handleInputChange("targetType", v); handleInputChange("targetIds", []); }}>
                    <SelectTrigger className="h-11 bg-muted/20 border-none rounded-xl font-black">
                      <SelectValue placeholder="選擇套用對象..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl shadow-2xl border-none">
                      <SelectItem value="all">全站所有產品 (Global)</SelectItem>
                      <SelectItem value="product">指定產品 (Specific Products)</SelectItem>
                      <SelectItem value="category">指定類別 (Specific Categories)</SelectItem>
                      <SelectItem value="brand">指定品牌 (Specific Brands)</SelectItem>
                    </SelectContent>
                  </Select>

                  {formData.targetType !== 'all' && (
                    <div className="p-4 bg-muted/10 rounded-2xl border-2 border-dashed space-y-4 animate-in slide-in-from-top-2">
                      <div className="flex flex-wrap gap-2">
                        {formData.targetIds.length === 0 ? (
                          <p className="text-[10px] text-muted-foreground italic px-2">尚未選取任何 {targetLabel}...</p>
                        ) : (
                          formData.targetIds.map((id: string) => (
                            <Badge key={id} variant="secondary" className="bg-white border shadow-sm pr-1 py-1 gap-1">
                              <span className="max-w-[150px] truncate">{getItemName(id)}</span>
                              <button onClick={() => toggleTargetId(id)} className="hover:text-destructive transition-colors"><X className="h-3 w-3" /></button>
                            </Badge>
                          ))
                        )}
                      </div>
                      
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" size="sm" className="h-9 rounded-xl border-primary text-primary font-bold gap-1.5 bg-white shadow-sm">
                            <Plus className="h-3.5 w-3.5" /> 選取 {targetLabel}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 p-0 rounded-2xl shadow-2xl border-none">
                          <div className="p-3 border-b">
                            <div className="relative">
                              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                              <Input 
                                placeholder={lang === 'en' ? "Search Name or SKU..." : "搜尋名稱或編號..."} 
                                value={pickerSearch} 
                                onChange={(e) => setPickerSearch(e.target.value)} 
                                className="pl-8 h-9 text-xs" 
                              />
                            </div>
                          </div>
                          <ScrollArea className="h-72">
                             <div className="p-2 space-y-1">
                                {filteredPickerPool.map((it: any) => {
                                  const isBrandType = formData.targetType === 'brand';
                                  const isSelected = isBrandType 
                                    ? [it.name_zh, it.name_en].filter(Boolean).some(name => formData.targetIds.includes(name))
                                    : formData.targetIds.includes(it.id);

                                  const displayName = it.productName_zh || it.name_zh || it.productName_en || it.name_en;
                                  const subName = it.productName_en || it.name_en || it.sku;
                                  
                                  return (
                                    <button 
                                      key={it.id}
                                      onClick={() => isBrandType ? toggleBrandTarget(it) : toggleTargetId(it.id)}
                                      className={cn(
                                        "w-full text-left p-2.5 rounded-xl text-xs transition-all flex items-center justify-between group",
                                        isSelected ? "bg-primary/10 text-primary" : "hover:bg-muted"
                                      )}
                                    >
                                      <div className="flex items-center gap-3 min-w-0">
                                        <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0 border overflow-hidden">
                                          {it.imageUrl || it.logoUrl ? <img src={it.imageUrl || it.logoUrl} className="object-cover w-full h-full" /> : 
                                           formData.targetType === 'product' ? <Box className="h-4 w-4 opacity-20" /> : <Tags className="h-4 w-4 opacity-20" />}
                                        </div>
                                        <div className="min-w-0">
                                          <p className="font-bold truncate max-w-[150px]">{displayName}</p>
                                          {subName && subName !== displayName && <p className="text-[9px] opacity-60 truncate font-mono uppercase">{subName}</p>}
                                        </div>
                                      </div>
                                      {isSelected ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4 opacity-0 group-hover:opacity-40" />}
                                    </button>
                                  );
                                })}
                             </div>
                          </ScrollArea>
                        </PopoverContent>
                      </Popover>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-6 bg-blue-50 rounded-[2rem] border-2 border-dashed border-blue-200 space-y-4">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shadow-sm"><UserCheck className="h-5 w-5" /></div>
                      <div>
                        <h4 className="font-black text-blue-900 text-sm uppercase">限定特定使用者支付 (Assign to Member)</h4>
                        <p className="text-[10px] text-blue-700 font-medium">指定電郵後，僅該會員能使用。支援多個電郵，請以逗號分隔。</p>
                      </div>
                    </div>
                    {mode === 'edit' && formData.restrictedToEmail && formData.type === 'cash_coupon' && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="rounded-lg h-9 font-black text-[10px] uppercase gap-2 border-primary/20 text-primary bg-white shadow-sm hover:bg-primary hover:text-white transition-all"
                        onClick={handleNotifyCustomers}
                        disabled={isNotifying}
                      >
                        {isNotifying ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                        通知顧客
                      </Button>
                    )}
                 </div>
                 <div className="grid gap-2">
                   <Label className="text-[9px] font-black text-blue-800 uppercase ml-1">指定使用者電郵 (Comma separated)</Label>
                   <Input 
                     placeholder="a@mail.com, b@mail.com (留空則開放)" 
                     value={formData.restrictedToEmail || ""} 
                     onChange={(e) => handleInputChange("restrictedToEmail", e.target.value)} 
                     className="h-11 bg-white border-blue-200 rounded-xl font-bold text-sm"
                   />
                 </div>
              </div>

              <Tabs defaultValue="zh">
                <TabsList className="bg-muted/50 mb-4"><TabsTrigger value="en">EN</TabsTrigger><TabsTrigger value="zh">中文</TabsTrigger></TabsList>
                {["en", "zh"].map(l => (
                  <TabsContent key={l} value={l} className="space-y-6 animate-in fade-in">
                    <div className="grid gap-2"><Label>活動名稱 ({l.toUpperCase()})</Label><Input value={formData.name[l as "en"|"zh"] || ""} onChange={(e) => handleMultilingualChange("name", l as "en"|"zh", e.target.value)} className="h-11 font-bold" /></div>
                    <div className="grid gap-2"><Label className="flex items-center gap-2 text-primary tracking-widest text-[10px] font-black uppercase"><Sparkles className="h-3 w-3" /> 優惠短標籤</Label><Input value={formData.shortLabel[l as "en"|"zh"] || ""} onChange={(e) => handleMultilingualChange("shortLabel", l as "en"|"zh", e.target.value)} placeholder="如：買一送一 / 7折" className="rounded-xl" /></div>
                    <div className="grid gap-2"><Label className="text-[10px] font-black uppercase">對外簡介</Label><Textarea className="h-24 bg-muted/20 border-none rounded-2xl p-4" value={formData.publicSummary[l as "en"|"zh"] || ""} onChange={(e) => handleMultilingualChange("publicSummary", l as "en"|"zh", e.target.value)} /></div>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden border-l-4 border-orange-500">
            <CardHeader className="bg-orange-50/50 border-b py-5 px-8"><CardTitle className="text-lg flex items-center gap-2 text-orange-900"><Zap className="h-5 w-5" />折扣邏輯與門檻</CardTitle></CardHeader>
            <CardContent className="p-8 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="grid gap-2">
                  <Label className="text-xs font-bold uppercase">優惠與支付類型</Label>
                  <Select value={formData.type} onValueChange={(v) => handleInputChange("type", v)}>
                    <SelectTrigger className="h-11 font-bold"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-2xl border-none">
                      <SelectItem value="percentage" className="font-bold">百分比折扣 (%) - 折扣類</SelectItem>
                      <SelectItem value="fixed" className="font-bold">固定減免金額 ($) - 折扣類</SelectItem>
                      <SelectItem value="qty_discount" className="text-orange-700 font-black">多買多折 (按數量百分比)</SelectItem>
                      <SelectItem value="cash_coupon" className="text-indigo-700 font-black">現金券 / 補償金 ($) - 支付類</SelectItem>
                      <SelectItem value="buy_x_get_y">買 X 送 Y (Buy X Get Y)</SelectItem>
                      <SelectItem value="case_discount">組合價 / 階梯價</SelectItem>
                      <SelectItem value="points_multiplier">積分加倍</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {formData.type !== 'buy_x_get_y' && formData.type !== 'case_discount' && formData.type !== 'points_multiplier' && (
                  <div className="grid gap-2 animate-in fade-in">
                     <Label className="text-xs font-bold uppercase">{formData.type === "percentage" || formData.type === "qty_discount" ? "折扣百分比 (%)" : "金額 (Amount $)"}</Label>
                     <Input type="number" value={formData.value || 0} onChange={(e) => handleInputChange("value", e.target.value)} className="h-11 text-lg font-black" />
                  </div>
                )}

                {formData.type === 'points_multiplier' && (
                  <div className="grid gap-2 animate-in fade-in">
                    <Label className="text-xs font-bold uppercase">積分倍率 (Multiplier)</Label>
                    <div className="relative">
                      <Coins className="absolute left-3 top-3 h-5 w-5 text-indigo-500" />
                      <Input type="number" step="0.1" value={formData.pointsMultiplier || 1} onChange={(e) => handleInputChange("pointsMultiplier", e.target.value)} className="pl-10 h-11 text-lg font-black text-indigo-700" />
                    </div>
                  </div>
                )}
              </div>

              {formData.type === 'buy_x_get_y' && (
                <div className="p-6 bg-orange-50/50 rounded-2xl border border-orange-200 grid grid-cols-2 md:grid-cols-4 gap-4 animate-in slide-in-from-top-2">
                   <div className="grid gap-1.5"><Label className="text-[10px] font-black uppercase">買幾件 (X)</Label><Input type="number" value={formData.buyX || 1} onChange={e => handleInputChange('buyX', e.target.value)} className="bg-white rounded-xl font-bold" /></div>
                   <div className="grid gap-1.5"><Label className="text-[10px] font-black uppercase">送幾件 (Y)</Label><Input type="number" value={formData.getY || 1} onChange={e => handleInputChange('getY', e.target.value)} className="bg-white rounded-xl font-bold" /></div>
                   <div className="grid gap-1.5"><Label className="text-[10px] font-black uppercase">第 Y 件折扣 (%)</Label><Input type="number" value={formData.discountOnY || 100} onChange={e => handleInputChange('discountOnY', e.target.value)} className="bg-white rounded-xl font-black text-orange-600" /><p className="text-[8px] opacity-60">100% = 免費</p></div>
                   <div className="grid gap-1.5"><Label className="text-[10px] font-black uppercase">或 第 Y 件固定價 ($)</Label><Input type="number" value={formData.fixedPriceY || 0} onChange={e => handleInputChange('fixedPriceY', e.target.value)} className="bg-white rounded-xl font-bold" /></div>
                </div>
              )}

              {formData.type === 'case_discount' && (
                <div className="p-6 bg-orange-50/50 rounded-2xl border border-orange-200 grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-2">
                   <div className="grid gap-1.5">
                     <Label className="text-[10px] font-black uppercase">組合類型</Label>
                     <Select value={formData.caseDiscountType} onValueChange={v => handleInputChange('caseDiscountType', v)}>
                       <SelectTrigger className="bg-white rounded-xl"><SelectValue /></SelectTrigger>
                       <SelectContent className="rounded-xl"><SelectItem value="fixed_price">固定總價 (例如：2件 $99)</SelectItem><SelectItem value="amount_off">每組減免 (例如：每 2件減 $10)</SelectItem><SelectItem value="percent_off">每組享折扣 (例如：每 2件享 8折)</SelectItem></SelectContent>
                     </Select>
                   </div>
                   <div className="grid gap-1.5"><Label className="text-[10px] font-black uppercase">組合目標價值 (Amount / %)</Label><Input type="number" value={formData.value || 0} onChange={e => handleInputChange('value', e.target.value)} className="bg-white rounded-xl font-black text-orange-600" /></div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                <div className="grid gap-2"><Label className="text-xs font-bold uppercase">最低消費金額 (Min. Spend $)</Label><Input type="number" value={formData.minSpend || 0} onChange={(e) => handleInputChange("minSpend", e.target.value)} className="h-11 bg-muted/20 border-none rounded-xl font-bold" /></div>
                <div className="grid gap-2">
                  <Label className="text-xs font-bold uppercase">{formData.type === 'qty_discount' ? '最低購買數量 (Min. Qty) *' : '最低購買數量 (Min. Qty)'}</Label>
                  <Input type="number" value={formData.minQty || 1} onChange={(e) => handleInputChange("minQty", e.target.value)} className="h-11 bg-muted/20 border-none rounded-xl font-bold" />
                </div>
              </div>

              <Separator className="border-dashed" />

              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase text-muted-foreground flex items-center gap-2 tracking-widest px-1">
                   <UserCheck className="h-4 w-4" /> 使用次數與用戶限制
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="grid gap-2">
                    <Label className="text-xs font-bold uppercase">全域總使用配額 (Total Quota)</Label>
                    <Input 
                      type="number" 
                      value={formData.totalQuota || ""} 
                      onChange={(e) => handleInputChange("totalQuota", e.target.value)} 
                      className="h-11 bg-muted/20 border-none rounded-xl font-bold" 
                      placeholder="不填或 0 代表無上限"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-xs font-bold uppercase">每位用戶限用次數 (Limit Per User)</Label>
                    <Input 
                      type="number" 
                      value={formData.limitPerUser || ""} 
                      onChange={(e) => handleInputChange("limitPerUser", e.target.value)} 
                      className="h-11 bg-muted/20 border-none rounded-xl font-bold" 
                      placeholder="不填或 0 代表無上限"
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-muted/20 rounded-xl border border-dashed text-xs text-muted-foreground flex items-start gap-2">
                <Info className="h-4 w-4 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="leading-relaxed font-medium">
                    <b>折扣類</b>會直接減少產品單價或訂單總額。
                  </p>
                  <p className="leading-relaxed font-medium">
                    <b>支付類 (現金券)</b> 不會改變產品定價，而是作為付款方式的一部分。
                  </p>
                  <p className="leading-relaxed font-medium text-indigo-700">
                    <b>多買多折</b>：當符合最低購買數量時，整組適配產品將按百分比折扣。
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white border-l-4 border-amber-500">
            <CardHeader className="bg-amber-50/50 py-4 px-6 flex items-center gap-2"><Calendar className="h-4 w-4 text-amber-700" /><CardTitle className="text-xs font-black uppercase text-amber-700">有效日期區間</CardTitle></CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid gap-1.5"><Label className="text-[10px] font-black uppercase opacity-60">開始日期</Label><Input type="date" value={formData.startsAt || ""} onChange={(e) => handleInputChange("startsAt", e.target.value)} className="h-11 rounded-xl" /></div>
              <div className="grid gap-1.5"><Label className="text-[10px] font-black uppercase opacity-60">結束日期</Label><Input type="date" value={formData.endsAt || ""} onChange={(e) => handleInputChange("endsAt", e.target.value)} className="h-11 rounded-xl" /></div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden border-l-4 border-indigo-600">
            <CardHeader className="bg-indigo-50/50 border-b py-4 px-6"><CardTitle className="text-xs font-black uppercase text-indigo-700 flex items-center gap-2"><StackingIcon className="h-4 w-4" /> 併用與等級限制</CardTitle></CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl">
                <Label className="text-xs font-bold">可與其他優惠併用</Label>
                <Switch checked={formData.isStackable} onCheckedChange={(v) => handleInputChange("isStackable", v)} />
              </div>
              <Separator className="border-dashed" />
              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1 flex items-center gap-2"><Crown className="h-4 w-4 text-amber-500" /> 適用會員等級</Label>
                <div className="p-4 bg-muted/10 rounded-2xl space-y-2 border">
                  {['classic', 'gold', 'platinum'].map(tier => (
                    <div key={tier} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer" onClick={() => {
                      const next = formData.eligibleTiers?.includes(tier) ? formData.eligibleTiers.filter((t:string)=>t!==tier) : [...(formData.eligibleTiers||[]), tier];
                      handleInputChange("eligibleTiers", next);
                    }}>
                      <Checkbox checked={formData.eligibleTiers?.includes(tier)} onCheckedChange={()=>{}} />
                      <Label className="text-xs font-black uppercase cursor-pointer flex-1">{tier}</Label>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm overflow-hidden rounded-3xl bg-white">
            <CardHeader className="bg-muted/5 border-b py-4 px-6"><CardTitle className="text-xs font-black uppercase text-muted-foreground tracking-widest">橫幅圖片</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="h-48 w-full bg-muted flex items-center justify-center cursor-pointer relative group" onClick={() => fileInputRef.current?.click()}>
                {formData.imageUrl ? <img src={formData.imageUrl} className="h-full w-full object-cover" /> : <ImageIcon className="h-10 w-10 text-muted-foreground/30" />}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><Button variant="secondary" size="sm" className="font-bold">更換圖片</Button></div>
              </div>
              <div className="p-4">{uploadProgress > 0 && <Progress value={uploadProgress} className="h-1" />}<input type="file" className="hidden" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" /></div>
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="rounded-[2.5rem]">
          <AlertDialogHeader><AlertDialogTitle className="font-black text-2xl">確認刪除促銷？</AlertDialogTitle><AlertDialogDescription>此動作將立即停止該折扣套用於您的產品。</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl font-bold h-11">取消</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive text-white rounded-xl font-black h-11 px-8" onClick={handleDelete}>確認刪除</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
