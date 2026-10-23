
"use client";

import { useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  Gift, 
  Coins, 
  Package,
  Image as ImageIcon,
  Plus, 
  UserCheck, 
  Search, 
  Zap, 
  Info,
  Calendar,
  Ticket,
  Check,
  Clock,
  X,
  ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useStorage, useUser, useFirestore, useCollection, useDoc } from "@/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { Progress } from "@/components/ui/progress";
import { compressImage } from "@/lib/image-utils";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { collection, query, where, orderBy, doc, setDoc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export default function NewRewardPage() {
  const router = useRouter();
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const storage = useStorage();
  const db = useFirestore();
  const { user } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [redeemMode, setRedeemMode] = useState("manual");

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

  const [formData, setFormData] = useState({
    title: { en: "", zh: "" },
    pointsRequired: "",
    additionalCash: "0",
    stock: "100",
    imageUrl: "",
    productId: "",
    linkedPromoId: "", 
    limitPerUser: "1",
    totalQuota: "100",
    validityDays: "", 
    status: "active",
    startsAt: "", 
    endsAt: "",   
    eligibleTiers: ["classic", "gold", "platinum"]
  });

  const handleMultilingualChange = (langKey: 'en' | 'zh', value: string) => {
    setFormData(prev => ({
      ...prev,
      title: { ...prev.title, [langKey]: value }
    }));
  };

  const handleTierToggle = (tier: string) => {
    setFormData(prev => ({
      ...prev,
      eligibleTiers: prev.eligibleTiers.includes(tier) 
        ? prev.eligibleTiers.filter(t => t !== tier)
        : [...prev.eligibleTiers, tier]
    }));
  };

  const handleProductSelect = (prodId: string) => {
    const product = allProducts?.find((p: any) => p.id === prodId);
    if (product) {
      setFormData(prev => ({
        ...prev,
        productId: prodId,
        linkedPromoId: "",
        title: { 
          en: product.productName_en || product.productName_zh, 
          zh: product.productName_zh || product.productName_en 
        },
        imageUrl: product.imageUrl || ""
      }));
    }
  };

  const handlePromoSelect = (promoId: string) => {
    const promo = allPromos?.find((p: any) => p.id === promoId);
    if (promo) {
      setFormData(prev => ({
        ...prev,
        linkedPromoId: promoId,
        productId: "",
        title: { 
          en: promo.name?.en || promo.name?.zh, 
          zh: promo.name?.zh || promo.name?.en 
        },
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
      const fileName = `rewards/${Date.now()}_reward.webp`;
      const storageRef = ref(storage, fileName);
      const uploadTask = uploadBytesResumable(storageRef, compressedBlob, { contentType: 'image/webp' });

      uploadTask.on('state_changed', 
        (snapshot) => setUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
        (error) => { toast({ title: "Upload Error", description: error.message, variant: "destructive" }); setLoading(false); },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          setFormData(prev => ({ ...prev, imageUrl: downloadURL }));
          setUploadProgress(0);
          setLoading(false);
          toast({ title: t.common.success, description: "Item image uploaded." });
        }
      );
    } catch (error: any) {
      toast({ title: "Processing Error", description: error.message, variant: "destructive" });
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.title.en && !formData.title.zh) {
      toast({ title: "Required", description: "Reward title is required.", variant: "destructive" });
      return;
    }
    if (!db) return;
    
    setLoading(true);
    const newId = `reward_${Date.now()}`;
    const rewardItem = {
      ...formData,
      id: newId,
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
      // 方案一：寫入單一 Config 文件的 Items 數組中
      const configRef = doc(db, 'config', 'marketing_rewards');
      const snap = await getDoc(configRef);
      const currentItems = snap.exists() ? (snap.data().items || []) : [];
      
      await setDoc(configRef, {
        items: [...currentItems, rewardItem],
        updatedAt: serverTimestamp()
      }, { merge: true });

      toast({ title: t.common.success, description: "換領項目已發布並存儲至設定文件。" });
      router.push("/admin/marketing");
    } catch (err: any) {
      toast({ title: "儲存失敗", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const tiersT = t.profile.tiers;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-5 w-5" /></Button>
          <div>
            <h1 className="text-3xl font-bold font-headline">新增換領項目 (穩定版)</h1>
            <p className="text-muted-foreground">此項目將儲存於 config/marketing_rewards 以避開權限問題。</p>
          </div>
        </div>
        <Button className="bg-primary text-primary-foreground shadow-md h-11 px-8 rounded-xl font-black" onClick={handleSave} disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          發布項目
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-sm overflow-hidden rounded-3xl">
            <CardHeader className="bg-primary/5">
              <CardTitle className="text-sm font-black uppercase tracking-widest">換領來源設定 (Redeem Mode)</CardTitle>
            </CardHeader>
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
                  <Label htmlFor="productSelect" className="flex items-center gap-2 font-bold"><Package className="h-4 w-4" /> 選擇目標庫存產品</Label>
                  <Select value={formData.productId} onValueChange={handleProductSelect}>
                    <SelectTrigger id="productSelect" className="bg-white rounded-xl"><SelectValue placeholder="搜尋產品..." /></SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-2xl">
                      {allProducts?.map((p: any) => (
                        <SelectItem key={p.id} value={p.id}>{p.productName_zh}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {redeemMode === 'coupon' && (
                <div className="grid gap-2 p-4 bg-primary/5 rounded-xl border-2 border-primary/20 border-dashed animate-in slide-in-from-top-2">
                  <Label htmlFor="promoSelect" className="flex items-center gap-2 font-black text-primary"><Ticket className="h-4 w-4" /> 連結系統促銷規則</Label>
                  <Select value={formData.linkedPromoId} onValueChange={handlePromoSelect}>
                    <SelectTrigger id="promoSelect" className="bg-white rounded-xl border-none"><SelectValue placeholder="選擇優惠規則..." /></SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-2xl">
                      {allPromos?.map((p: any) => (
                        <SelectItem key={p.id} value={p.id}>{p.name?.zh || p.name?.en} ({p.code || "Auto"})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Tabs defaultValue="zh">
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">換領顯示名稱</Label>
                  <TabsList className="bg-muted/50 h-8 p-0.5 rounded-lg">
                    <TabsTrigger value="en" className="text-[10px] font-bold">EN</TabsTrigger>
                    <TabsTrigger value="zh" className="text-[10px] font-bold">中文</TabsTrigger>
                  </TabsList>
                </div>
                <TabsContent value="en">
                  <Input placeholder="e.g. $50 Cash Coupon" value={formData.title.en} onChange={(e) => handleMultilingualChange('en', e.target.value)} className="h-11 rounded-xl" />
                </TabsContent>
                <TabsContent value="zh">
                  <Input placeholder="例如：$50 現金券" value={formData.title.zh} onChange={(e) => handleMultilingualChange('zh', e.target.value)} className="h-11 rounded-xl font-bold" />
                </TabsContent>
              </Tabs>

              <div className="grid gap-4">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">展示圖片</Label>
                <div className="flex items-start gap-6">
                  <div 
                    className="h-32 w-32 rounded-[2rem] bg-muted border-2 border-dashed flex items-center justify-center shrink-0 overflow-hidden relative group cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {formData.imageUrl ? <img src={formData.imageUrl} className="h-full w-full object-cover" alt="Preview" /> : <ImageIcon className="h-8 w-8 text-muted-foreground/50" />}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><Plus className="h-6 w-6 text-white" /></div>
                  </div>
                  <div className="flex-1 space-y-3">
                    <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={loading} className="rounded-xl font-bold h-9">上傳圖片</Button>
                    {uploadProgress > 0 && <Progress value={uploadProgress} className="h-1" />}
                    <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white border-l-4 border-indigo-600">
            <CardHeader className="bg-indigo-50/50 border-b">
              <CardTitle className="text-sm font-black uppercase tracking-widest text-indigo-700 flex items-center gap-2">
                <Calendar className="h-4 w-4" /> 有效期限設定
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-6">
              <div className="grid gap-2"><Label className="text-[10px] font-black uppercase ml-1">換領開始日期</Label><Input type="date" value={formData.startsAt} onChange={(e) => setFormData(p => ({ ...p, startsAt: e.target.value }))} className="h-10 rounded-xl" /></div>
              <div className="grid gap-2"><Label className="text-[10px] font-black uppercase ml-1">換領結束日期</Label><Input type="date" value={formData.endsAt} onChange={(e) => setFormData(p => ({ ...p, endsAt: e.target.value }))} className="h-10 rounded-xl" /></div>
              
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
                    onChange={(e) => setFormData(p => ({ ...p, validityDays: e.target.value }))} 
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
              <div className="grid gap-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">所需積分</Label>
                <div className="relative">
                  <Coins className="absolute left-3 top-3 h-5 w-5 text-indigo-400" />
                  <Input className="pl-10 h-11 bg-muted/20 border-none rounded-xl font-black text-indigo-600 text-lg shadow-inner" type="number" placeholder="500" value={formData.pointsRequired} onChange={(e) => setFormData(p => ({ ...p, pointsRequired: e.target.value }))} />
                </div>
              </div>
              <div className="grid gap-2"><Label className="flex items-center gap-2 font-bold text-xs text-primary"><UserCheck className="h-4 w-4" /> 用戶限領次數</Label><Input type="number" value={formData.limitPerUser} onChange={(e) => setFormData(p => ({ ...p, limitPerUser: e.target.value }))} className="h-10 rounded-xl" /></div>
              <div className="grid gap-2"><Label className="flex items-center gap-2 font-bold text-xs text-primary"><Package className="h-4 w-4" /> 全域總配額</Label><Input type="number" value={formData.totalQuota} onChange={(e) => setFormData(p => ({ ...p, totalQuota: e.target.value }))} className="h-10 rounded-xl" /></div>
              <Separator className="border-dashed" />
              <div className="grid gap-2">
                <Label className="text-xs font-bold">預設狀態</Label>
                <Select value={formData.status} onValueChange={(v) => setFormData(p => ({ ...p, status: v }))}>
                  <SelectTrigger className="h-10 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl"><SelectItem value="active">Active (可換領)</SelectItem><SelectItem value="hidden">Hidden (隱藏)</SelectItem></SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-3xl overflow-hidden border-l-4 border-primary">
            <CardHeader className="bg-primary/5 border-b"><CardTitle className="text-sm font-black uppercase flex items-center gap-2 text-primary"><ShieldCheck className="h-4 w-4" />適用等級限制</CardTitle></CardHeader>
            <CardContent className="space-y-3 pt-6">
                {["classic", "gold", "platinum"].map((tier) => (
                  <div key={tier} className="flex items-center space-x-3 p-3 rounded-2xl border-2 border-transparent hover:bg-muted/50 transition-all cursor-pointer" onClick={() => handleTierToggle(tier)}>
                    <Checkbox checked={formData.eligibleTiers.includes(tier)} onCheckedChange={() => {}} className="rounded-full" />
                    <Label className="text-sm font-black cursor-pointer flex-1 uppercase tracking-tighter">{tiersT[tier as keyof typeof tiersT] || tier}</Label>
                  </div>
                ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
