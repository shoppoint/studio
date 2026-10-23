
"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  Gift, 
  Coins, 
  Package,
  Image as ImageIcon,
  Plus,
  Upload,
  UserCheck,
  Zap,
  Calendar,
  Ticket,
  Clock,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useI18n } from "@/lib/i18n/i18n-context";
import { useToast } from "@/hooks/use-toast";
import { useStorage, useUser, useFirestore, useDoc, useCollection } from "@/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { collection, query, where, orderBy, doc, updateDoc, serverTimestamp, setDoc, getDoc } from "firebase/firestore";
import { Progress } from "@/components/ui/progress";
import { compressImage } from "@/lib/image-utils";
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export default function EditRewardPage() {
  const router = useRouter();
  const params = useParams();
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const storage = useStorage();
  const db = useFirestore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const rewardId = params.rewardId as string;

  // 改為從 Config 文件讀取
  const rewardsConfigRef = useMemo(() => db ? doc(db, 'config', 'marketing_rewards') : null, [db]);
  const { data: rewardsConfig, loading: dataLoading } = useDoc<any>(rewardsConfigRef);

  const productsQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'public_products'), where('status', '==', 'Active'), orderBy('productName_zh'));
  }, [db]);
  const { data: allProducts } = useCollection<any>(productsQuery);

  const promosQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'promotions'), where('status', '==', 'active'));
  }, [db]);
  const { data: allPromos } = useCollection<any>(promosQuery);

  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [redeemMode, setRedeemMode] = useState("manual");
  const [formData, setFormData] = useState<any>(null);

  useEffect(() => {
    if (rewardsConfig && !formData) {
      const item = rewardsConfig.items?.find((it: any) => it.id === rewardId);
      if (item) {
        setFormData({
          ...item,
          pointsRequired: item.pointsRequired?.toString() || "",
          additionalCash: item.additionalCash?.toString() || "0",
          stock: item.stock?.toString() || "100",
          limitPerUser: item.limitPerUser?.toString() || "1",
          totalQuota: item.totalQuota?.toString() || "100",
          validityDays: item.validityDays?.toString() || "",
          eligibleTiers: Array.isArray(item.eligibleTiers) ? item.eligibleTiers : ["classic", "gold", "platinum"]
        });
        setRedeemMode(item.redeemMode || (item.productId ? "product" : "manual"));
      }
    }
  }, [rewardsConfig, formData, rewardId]);

  const handleMultilingualChange = (langKey: 'en' | 'zh', value: string) => {
    setFormData((prev: any) => ({ ...prev, title: { ...prev.title, [langKey]: value } }));
  };

  const handleProductSelect = (prodId: string) => {
    const product = allProducts?.find((p: any) => p.id === prodId);
    if (product) {
      setFormData((prev: any) => ({
        ...prev,
        productId: prodId,
        linkedPromoId: "",
        title: { en: product.productName_en || product.productName_zh, zh: product.productName_zh || product.productName_en },
        imageUrl: product.imageUrl || ""
      }));
    }
  };

  const handlePromoSelect = (promoId: string) => {
    const promo = allPromos?.find((p: any) => p.id === promoId);
    if (promo) {
      setFormData((prev: any) => ({
        ...prev,
        linkedPromoId: promoId,
        productId: "",
        title: { en: promo.name?.en || promo.name?.zh, zh: promo.name?.zh || promo.name?.en },
        imageUrl: promo.imageUrl || ""
      }));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const compressedBlob = await compressImage(file, 800, 0.8);
      const fileName = `rewards/${rewardId}_${Date.now()}.webp`;
      const storageRef = ref(storage, fileName);
      const uploadTask = uploadBytesResumable(storageRef, compressedBlob, { contentType: 'image/webp' });
      uploadTask.on('state_changed', (snap) => setUploadProgress((snap.bytesTransferred / snap.totalBytes) * 100), null, async () => {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        setFormData((prev: any) => ({ ...prev, imageUrl: downloadURL }));
        setUploadProgress(0); setLoading(false);
      });
    } catch (e) { setLoading(false); }
  };

  const handleSave = async () => {
    if (!formData || !rewardsConfigRef) return;
    setLoading(true);
    
    const updatedItem = {
      ...formData,
      pointsRequired: Number(formData.pointsRequired) || 0,
      additionalCash: Number(formData.additionalCash) || 0,
      stock: Number(formData.stock) || 0,
      totalQuota: Number(formData.totalQuota) || 0,
      limitPerUser: Number(formData.limitPerUser) || 1,
      validityDays: formData.validityDays ? Number(formData.validityDays) : null,
      redeemMode: redeemMode,
      updatedAt: new Date().toISOString()
    };

    try {
      const nextItems = rewardsConfig.items?.map((it: any) => it.id === rewardId ? updatedItem : it) || [];
      await updateDoc(rewardsConfigRef, {
        items: nextItems,
        updatedAt: serverTimestamp()
      });
      toast({ title: t.common.success, description: "換領項目已更新。" });
      router.push("/admin/marketing");
    } catch (err: any) {
      toast({ title: "儲存失敗", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (dataLoading || !formData) return <div className="h-96 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4"><Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-5 w-5" /></Button><h1 className="text-3xl font-bold font-headline">編輯換領項目 (穩定版)</h1></div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.back()}>{t.common.cancel}</Button>
          <Button className="bg-primary text-primary-foreground font-black shadow-md rounded-xl h-11 px-8" onClick={handleSave} disabled={loading}>{loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}儲存變更</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-sm overflow-hidden rounded-3xl">
            <CardHeader className="bg-primary/5"><CardTitle className="text-sm font-black uppercase tracking-widest">換領來源設定 (Redeem Mode)</CardTitle></CardHeader>
            <CardContent className="pt-6">
              <RadioGroup value={redeemMode} onValueChange={setRedeemMode} className="grid grid-cols-3 gap-4">
                <div className={cn("p-4 border-2 rounded-2xl flex flex-col items-center gap-2 cursor-pointer transition-all", redeemMode === 'coupon' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:bg-muted/50')} onClick={() => setRedeemMode('coupon')}>
                  <RadioGroupItem value="coupon" id="coupon" className="sr-only" />
                  <Ticket className={cn("h-6 w-6", redeemMode === 'coupon' ? "text-primary" : "text-muted-foreground")} />
                  <span className="text-xs font-bold text-center">自動化優惠券</span>
                </div>
                <div className={cn("p-4 border-2 rounded-2xl flex flex-col items-center gap-2 cursor-pointer transition-all", redeemMode === 'product' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:bg-muted/50')} onClick={() => setRedeemMode('product')}>
                  <RadioGroupItem value="product" id="product" className="sr-only" />
                  <Package className={cn("h-6 w-6", redeemMode === 'product' ? "text-primary" : "text-muted-foreground")} />
                  <span className="text-xs font-bold text-center">關聯實體產品</span>
                </div>
                <div className={cn("p-4 border-2 rounded-2xl flex flex-col items-center gap-2 cursor-pointer transition-all", redeemMode === 'manual' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:bg-muted/50')} onClick={() => setRedeemMode('manual')}>
                  <RadioGroupItem value="manual" id="manual" className="sr-only" />
                  <Zap className={cn("h-6 w-6", redeemMode === 'manual' ? "text-primary" : "text-muted-foreground")} />
                  <span className="text-xs font-bold text-center">手動發放項目</span>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
            <CardHeader><CardTitle className="flex items-center gap-2 font-black uppercase text-sm tracking-widest"><Gift className="h-5 w-5 text-primary" />項目內容詳情</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              {redeemMode === 'product' && (
                <div className="grid gap-2 p-4 bg-muted/20 rounded-xl border border-dashed animate-in slide-in-from-top-2">
                  <Label htmlFor="productSelect" className="font-bold">目標庫存產品</Label>
                  <Select value={formData.productId} onValueChange={handleProductSelect}>
                    <SelectTrigger className="bg-white rounded-xl"><SelectValue placeholder="搜尋產品..." /></SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-2xl">
                      {allProducts?.map((p: any) => (<SelectItem key={p.id} value={p.id}>{p.productName_zh}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {redeemMode === 'coupon' && (
                <div className="grid gap-2 p-4 bg-primary/5 rounded-xl border-2 border-primary/20 border-dashed animate-in slide-in-from-top-2">
                  <Label className="font-black text-primary">連結促銷規則</Label>
                  <Select value={formData.linkedPromoId} onValueChange={handlePromoSelect}>
                    <SelectTrigger className="bg-white rounded-xl border-none"><SelectValue placeholder="選擇優惠規則..." /></SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-2xl">
                      {allPromos?.map((p: any) => (<SelectItem key={p.id} value={p.id}>{p.name?.zh || p.name?.en} ({p.code || "Auto"})</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <Tabs defaultValue="zh">
                <TabsList className="bg-muted/50 mb-2"><TabsTrigger value="en">EN</TabsTrigger><TabsTrigger value="zh">中文</TabsTrigger></TabsList>
                <TabsContent value="en"><Input value={formData.title.en} onChange={(e) => handleMultilingualChange('en', e.target.value)} className="h-11 rounded-xl" /></TabsContent>
                <TabsContent value="zh"><Input value={formData.title.zh} onChange={(e) => handleMultilingualChange('zh', e.target.value)} className="h-11 rounded-xl font-bold" /></TabsContent>
              </Tabs>
              <div className="grid gap-4">
                <Label className="text-[10px] font-black uppercase text-muted-foreground">展示圖片</Label>
                <div className="flex items-start gap-6">
                  <div className="h-32 w-32 rounded-[2rem] bg-muted border-2 border-dashed flex items-center justify-center shrink-0 overflow-hidden relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    {formData.imageUrl ? <img src={formData.imageUrl} className="h-full w-full object-cover" /> : <ImageIcon className="h-8 w-8 text-muted-foreground/50" />}
                  </div>
                  <div className="flex-1 space-y-3"><Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={loading} className="rounded-xl font-bold h-9">上傳圖片</Button><input type="file" className="hidden" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" /><div className="mt-2">{uploadProgress > 0 && <Progress value={uploadProgress} className="h-1" />}</div></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white border-l-4 border-indigo-600">
            <CardHeader className="bg-indigo-50/50 border-b"><CardTitle className="text-sm font-black uppercase text-indigo-700 flex items-center gap-2"><Calendar className="h-4 w-4" /> 有效期限設定</CardTitle></CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="grid gap-2"><Label className="text-[10px] font-black uppercase ml-1">換領開始日期</Label><Input type="date" value={formData.startsAt} onChange={(e) => setFormData((p: any) => ({ ...p, startsAt: e.target.value }))} className="h-10" /></div>
              <div className="grid gap-2"><Label className="text-[10px] font-black uppercase ml-1">換領結束日期</Label><Input type="date" value={formData.endsAt} onChange={(e) => setFormData((p: any) => ({ ...p, endsAt: e.target.value }))} className="h-10" /></div>
              
              <Separator className="border-dashed" />
              
              <div className="grid gap-2">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] font-black uppercase text-indigo-700 flex items-center gap-2"><Clock className="h-3.5 w-3.5" /> 換領後使用期限</Label>
                  <Badge variant="outline" className="text-[8px] border-indigo-200">相對期限</Badge>
                </div>
                <div className="relative">
                  <Input 
                    type="number" 
                    placeholder="例如：60" 
                    value={formData.validityDays} 
                    onChange={(e) => setFormData((p: any) => ({ ...p, validityDays: e.target.value }))} 
                    className="h-11 bg-muted/20 border-none rounded-xl font-bold pr-12" 
                  />
                  <span className="absolute right-3 top-3 text-[10px] font-black text-muted-foreground uppercase">Days</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
            <CardHeader className="bg-muted/5 border-b"><CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground">換領門檻與配額</CardTitle></CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid gap-2"><Label className="text-[10px] font-black uppercase ml-1">所需積分</Label><div className="relative"><Coins className="absolute left-3 top-3 h-5 w-5 text-indigo-400" /><Input className="pl-10 h-11 bg-muted/20 border-none rounded-xl font-black text-indigo-600 text-lg" type="number" value={formData.pointsRequired} onChange={(e) => setFormData((p: any) => ({ ...p, pointsRequired: e.target.value }))} /></div></div>
              <div className="grid gap-2"><Label className="flex items-center gap-2 font-bold text-xs"><UserCheck className="h-4 w-4" /> 限領次數</Label><Input type="number" value={formData.limitPerUser} onChange={(e) => setFormData((p: any) => ({ ...p, limitPerUser: e.target.value }))} /></div>
              <div className="grid gap-2"><Label className="flex items-center gap-2 font-bold text-xs"><Package className="h-4 w-4" /> 總配額</Label><Input type="number" value={formData.totalQuota} onChange={(e) => setFormData((p: any) => ({ ...p, totalQuota: e.target.value }))} /></div>
              <Separator className="border-dashed" />
              <div className="grid gap-2"><Label className="text-xs font-bold">狀態</Label><Select value={formData.status} onValueChange={(v) => setFormData((p: any) => ({ ...p, status: v }))}><SelectTrigger className="h-10"><SelectValue /></SelectTrigger><SelectContent className="rounded-xl"><SelectItem value="active">Active (可換領)</SelectItem><SelectItem value="hidden">Hidden (隱藏)</SelectItem></SelectContent></Select></div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
