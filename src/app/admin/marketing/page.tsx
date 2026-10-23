
"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { 
  Megaphone, 
  Gift, 
  Zap, 
  Plus, 
  Settings2, 
  TrendingUp,
  Percent,
  Coins,
  Ticket,
  Clock,
  MoreVertical,
  Edit2,
  Trash2,
  Loader2,
  Globe,
  Store,
  Save,
  Package,
  Sparkles,
  UserPlus,
  HeartHandshake,
  Activity,
  FileCheck,
  Upload,
  Image as ImageIcon,
  Calendar as CalendarIcon,
  PlusCircle,
  X,
  Info,
  Heart,
  Layers,
  CheckCircle2,
  Star,
  Users,
  Award
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useI18n } from "@/lib/i18n/i18n-context";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useFirestore, useCollection, useDoc, useStorage } from "@/firebase";
import { collection, query, orderBy, deleteDoc, doc, setDoc, serverTimestamp, where, updateDoc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { compressImage } from "@/lib/image-utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function MarketingAdmin() {
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const db = useFirestore();
  const storage = useStorage();
  const mktT = t.admin.marketing;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState("promotions");
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // 1. 獲取所有促銷活動
  const allPromosQuery = useMemo(() => {
    if (!db) return null;
    return query(
      collection(db, 'promotions'), 
      orderBy('updatedAt', 'desc')
    );
  }, [db]);
  const { data: allRawPromos, loading: promosLoading } = useCollection<any>(allPromosQuery);

  // 2. 獲取產品與分類用於名稱解析
  const productsQuery = useMemo(() => db ? query(collection(db, 'public_products')) : null, [db]);
  const { data: allProducts } = useCollection<any>(productsQuery);

  const categoriesQuery = useMemo(() => db ? query(collection(db, 'categories')) : null, [db]);
  const { data: allCategories } = useCollection<any>(categoriesQuery);

  const promos = useMemo(() => {
    if (!allRawPromos) return [];
    return allRawPromos.filter(p => p.isImpactCampaign !== true);
  }, [allRawPromos]);

  const impactCampaigns = useMemo(() => {
    if (!allRawPromos) return [];
    return allRawPromos.filter(p => p.isImpactCampaign === true);
  }, [allRawPromos]);

  // 3. 換領項目 (改為從單一 Config 文件讀取，解決權限問題)
  const rewardsConfigRef = useMemo(() => db ? doc(db, 'config', 'marketing_rewards') : null, [db]);
  const { data: rewardsConfig, loading: rewardsLoading } = useDoc<any>(rewardsConfigRef);
  const rewards = useMemo(() => rewardsConfig?.items || [], [rewardsConfig]);

  // 4. 積分與邀請獎勵配置
  const loyaltyConfigRef = useMemo(() => db ? doc(db, 'config', 'loyalty') : null, [db]);
  const { data: loyaltyData, loading: loyaltyLoading } = useDoc<any>(loyaltyConfigRef);
  const [loyaltyForm, setLoyaltyForm] = useState({ 
    pointsToCash: "100", 
    spendToPoints: "10", 
    welcomePoints: "100",
    referralRewardPoints: "500",
    referralRewardPromoId: "none",
    welcomePromoId: "none",
    reviewRewardClassic: "10",
    reviewRewardGold: "20",
    reviewRewardPlatinum: "30"
  });

  useEffect(() => {
    if (loyaltyData) {
      setLoyaltyForm({
        pointsToCash: loyaltyData.pointsToCash?.toString() || "100",
        spendToPoints: loyaltyData.spendToPoints?.toString() || "10",
        welcomePoints: loyaltyData.welcomePoints?.toString() || "100",
        referralRewardPoints: loyaltyData.referralRewardPoints?.toString() || "500",
        referralRewardPromoId: loyaltyData.referralRewardPromoId || "none",
        welcomePromoId: loyaltyData.welcomePromoId || "none",
        reviewRewardClassic: loyaltyData.reviewRewardClassic?.toString() || "10",
        reviewRewardGold: loyaltyData.reviewRewardGold?.toString() || "20",
        reviewRewardPlatinum: loyaltyData.reviewRewardPlatinum?.toString() || "30"
      });
    }
  }, [loyaltyData]);

  // 5. CSR 影響力日誌配置
  const impactRef = useMemo(() => db ? doc(db, 'config', 'impact') : null, [db]);
  const { data: impactData, loading: impactLoading } = useDoc<any>(impactRef);
  const [impactForm, setImpactForm] = useState({ totalDonated: 0, charityCount: 3, records: [] as any[] });
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [editingRecordIdx, setEditingRecordIdx] = useState<number | null>(null);
  const [recordForm, setRecordForm] = useState({ type: "donation", charityName: "", amount: "", date: "", purpose: "", receiptUrl: "" });

  useEffect(() => {
    if (impactData) {
      setImpactForm({
        totalDonated: impactData.totalDonated || 0,
        charityCount: impactData.charityCount || 0,
        records: impactData.records || []
      });
    }
  }, [impactData]);

  const handleSaveLoyalty = () => {
    if (!db || !loyaltyConfigRef) return;
    setLoading(true);
    const data = { 
      ...loyaltyForm,
      pointsToCash: Number(loyaltyForm.pointsToCash), 
      spendToPoints: Number(loyaltyForm.spendToPoints), 
      welcomePoints: Number(loyaltyForm.welcomePoints),
      referralRewardPoints: Number(loyaltyForm.referralRewardPoints),
      reviewRewardClassic: Number(loyaltyForm.reviewRewardClassic),
      reviewRewardGold: Number(loyaltyForm.reviewRewardGold),
      reviewRewardPlatinum: Number(loyaltyForm.reviewRewardPlatinum),
      updatedAt: serverTimestamp() 
    };
    setDoc(loyaltyConfigRef, data, { merge: true }).then(() => toast({ title: t.common.success })).finally(() => setLoading(false));
  };

  const handleSaveLedger = () => {
    if (!db || !impactRef) return;
    setLoading(true);
    const calculatedTotal = impactForm.records.reduce((acc, r) => acc + (Number(r.amount) || 0), 0);
    const uniqueCharities = new Set(impactForm.records.map(r => r.charityName)).size;
    const data = { ...impactForm, totalDonated: calculatedTotal, charityCount: uniqueCharities > 0 ? uniqueCharities : impactForm.charityCount, updatedAt: serverTimestamp() };
    setDoc(impactRef, data, { merge: true }).then(() => toast({ title: "Ledger Updated" })).finally(() => setLoading(false));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const blob = await compressImage(file, 1200, 0.8);
      const sRef = ref(storage, `impact/receipt_${Date.now()}.webp`);
      const uploadTask = uploadBytesResumable(sRef, blob, { contentType: 'image/webp' });
      uploadTask.on('state_changed', (snap) => setUploadProgress((snap.bytesTransferred / snap.totalBytes) * 100), null, async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        setRecordForm(p => ({ ...p, receiptUrl: url }));
        setUploadProgress(0); setLoading(false);
      });
    } catch (e) { setLoading(false); }
  };

  const addOrUpdateRecord = () => {
    const next = [...impactForm.records];
    if (editingRecordIdx !== null) next[editingRecordIdx] = { ...recordForm, amount: Number(recordForm.amount) };
    else next.unshift({ ...recordForm, amount: Number(recordForm.amount), id: `rec_${Date.now()}` });
    setImpactForm(p => ({ ...p, records: next }));
    setIsRecordModalOpen(false);
    setRecordForm({ type: "donation", charityName: "", amount: "", date: "", purpose: "", receiptUrl: "" });
  };

  const handleDeleteReward = async (id: string) => {
    if (!db || !rewardsConfigRef) return;
    if (!confirm(lang === 'en' ? "Confirm delete?" : "確定刪除此換領項目？")) return;
    
    setLoading(true);
    try {
      const nextItems = rewards.filter((item: any) => item.id !== id);
      await updateDoc(rewardsConfigRef, {
        items: nextItems,
        updatedAt: serverTimestamp()
      });
      toast({ title: t.common.success, description: "項目已移除" });
    } catch (e) {
      toast({ title: "刪除失敗", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePromo = (id: string) => {
    if (!db) return;
    if (!confirm(lang === 'en' ? "Confirm delete?" : "確定刪除？")) return;
    deleteDoc(doc(db, 'promotions', id)).then(() => toast({ title: t.common.success }));
  };

  const getTargetLabel = (promo: any) => {
    if (promo.targetType === 'all') return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-[10px] font-bold">全站產品</Badge>;
    
    const count = promo.targetIds?.length || 0;
    
    if (promo.targetType === 'category') {
      const firstId = promo.targetIds?.[0];
      const cat = allCategories?.find(c => c.id === firstId);
      const name = cat ? (lang === 'en' ? cat.name_en : cat.name_zh) : "類別";
      return <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 text-[10px] font-bold">{name}{count > 1 ? ` +${count - 1}` : ""}</Badge>;
    }
    
    if (promo.targetType === 'product') {
      const firstId = promo.targetIds?.[0];
      const prod = allProducts?.find(p => p.id === firstId);
      const name = prod ? (lang === 'en' ? prod.productName_en : prod.productName_zh) : "產品";
      return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 text-[10px] font-bold">{name}{count > 1 ? ` +${count - 1}` : ""}</Badge>;
    }

    if (promo.targetType === 'brand') {
      const name = promo.targetIds?.[0] || "品牌";
      return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 text-[10px] font-bold">{name}{count > 1 ? ` +${count - 1}` : ""}</Badge>;
    }

    return <span className="text-xs text-muted-foreground">--</span>;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">{mktT.title}</h1>
          <p className="text-muted-foreground">{mktT.subtitle}</p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'promotions' && (
            <Button className="bg-primary text-primary-foreground shadow-lg rounded-xl h-11 px-6 font-black" asChild>
              <Link href="/admin/marketing/promotions/new"><Plus className="mr-2 h-4 w-4" /> {mktT.add_promo}</Link>
            </Button>
          )}
          {activeTab === 'store' && (
            <Button className="bg-primary text-primary-foreground shadow-lg rounded-xl h-11 px-6 font-black" asChild>
              <Link href="/admin/marketing/rewards/new">
                <Plus className="mr-2 h-4 w-4" /> {mktT.add_reward}
              </Link>
            </Button>
          )}
          {activeTab === 'csr' && (
            <Button className="bg-indigo-600 text-white shadow-lg rounded-xl h-11 px-6 font-black gap-2" asChild>
              <Link href="/admin/marketing/impact/campaigns/new"><Heart className="h-4 w-4" /> 建立公益活動</Link>
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 md:w-[800px] mb-8 bg-muted/50 p-1 rounded-2xl h-12">
          <TabsTrigger value="promotions" className="rounded-xl font-bold"><Zap className="h-4 w-4 mr-2" /> 促銷管理</TabsTrigger>
          <TabsTrigger value="loyalty" className="rounded-xl font-bold"><Coins className="h-4 w-4 mr-2" /> 積分與獎勵</TabsTrigger>
          <TabsTrigger value="store" className="rounded-xl font-bold"><Gift className="h-4 w-4 mr-2" /> 換領商城</TabsTrigger>
          <TabsTrigger value="csr" className="rounded-xl font-bold text-indigo-600"><HeartHandshake className="h-4 w-4 mr-2" /> 社會責任 (CSR)</TabsTrigger>
        </TabsList>

        <TabsContent value="promotions" className="space-y-6">
          <Card className="border-none shadow-sm overflow-hidden rounded-3xl bg-white">
            <CardContent className="p-0">
              {promosLoading ? <div className="p-12 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div> : promos.length === 0 ? (
                <div className="p-20 text-center flex flex-col items-center gap-4"><Ticket className="h-12 w-12 text-muted-foreground opacity-20" /><p className="text-muted-foreground font-medium">目前暫無促銷活動。</p></div>
              ) : (
                <Table>
                  <TableHeader className="bg-muted/5"><TableRow><TableHead className="pl-8">促銷活動名稱</TableHead><TableHead>優惠碼 / 類型</TableHead><TableHead>套用對象</TableHead><TableHead>價值 / 邏輯</TableHead><TableHead>狀態</TableHead><TableHead className="text-right pr-8">操作</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {promos.map((p: any) => (
                      <TableRow key={p.id} className="group hover:bg-muted/30 transition-colors">
                        <TableCell className="pl-8 py-4 font-bold">{lang === 'en' ? (p.name?.en || p.name?.zh) : (p.name?.zh || p.name?.en)}</TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                             <code className="bg-muted px-2 py-1 rounded text-[10px] font-mono uppercase w-fit">{p.code || "自動套用"}</code>
                             <span className="text-[9px] font-bold text-muted-foreground mt-1 uppercase">{p.type?.replace(/_/g, ' ')}</span>
                          </div>
                        </TableCell>
                        <TableCell>{getTargetLabel(p)}</TableCell>
                        <TableCell className="font-black text-primary">
                          {p.type === 'buy_x_get_y' ? `Buy ${p.buyX} Get ${p.getY}` : p.type === 'points_multiplier' ? `${p.pointsMultiplier}x Points` : `${p.value}${p.type === 'percentage' || p.type === 'qty_discount' ? '%' : '$'}`}
                        </TableCell>
                        <TableCell><Badge variant={p.status === 'active' ? 'default' : 'secondary'} className="text-[10px] font-black uppercase">{p.status}</Badge></TableCell>
                        <TableCell className="text-right pr-8">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" asChild className="rounded-full"><Link href={`/admin/marketing/promotions/${p.id}`}><Edit2 className="h-4 w-4" /></Link></Button>
                            <Button variant="ghost" size="icon" className="text-destructive rounded-full" onClick={() => handleDeletePromo(p.id)}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="loyalty" className="animate-in fade-in duration-300">
          <Card className="border-none shadow-sm max-w-4xl bg-white rounded-3xl overflow-hidden">
            <CardHeader className="bg-muted/5 border-b"><CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2"><Settings2 className="h-5 w-5 text-primary" />積分發放與混合推薦獎勵</CardTitle></CardHeader>
            <CardContent className="space-y-10 pt-8">
              {loyaltyLoading ? <div className="py-12 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div> : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  {/* Left Column: Basic Rewards */}
                  <div className="space-y-8">
                    <h4 className="font-black text-xs uppercase tracking-widest text-muted-foreground flex items-center gap-2"><Zap className="h-4 w-4" /> 基礎積分與迎新禮</h4>
                    <div className="grid gap-6">
                      <div className="grid gap-2">
                        <Label className="text-[10px] font-black uppercase">新會員迎新積分 (Welcome Pts)</Label>
                        <div className="relative">
                          <UserPlus className="absolute left-3 top-3.5 h-5 w-5 text-primary/40" />
                          <Input value={loyaltyForm.welcomePoints} onChange={(e) => setLoyaltyForm(p => ({ ...p, welcomePoints: e.target.value }))} className="pl-10 h-12 text-2xl font-black rounded-xl text-primary bg-primary/5 border-primary/20" />
                        </div>
                      </div>
                      
                      <div className="grid gap-2">
                        <Label className="text-[10px] font-black uppercase">加碼：迎新專屬優惠券</Label>
                        <Select value={loyaltyForm.welcomePromoId || "none"} onValueChange={(v) => setLoyaltyForm(p => ({...p, welcomePromoId: v}))}>
                          <SelectTrigger className="h-12 rounded-xl bg-muted/20 border-none font-bold">
                            <SelectValue placeholder="選擇一張優惠券作為迎新禮..." />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl shadow-2xl">
                             <SelectItem value="none" className="text-muted-foreground italic">不發放額外優惠券</SelectItem>
                             {promos.map((p:any) => <SelectItem key={p.id} value={p.id || 'none'}>{p.name?.zh || p.name?.en} ({p.code || "Auto"})</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2"><Label className="text-[10px] font-black uppercase">抵扣比例 (Pts = $1)</Label><Input value={loyaltyForm.pointsToCash} onChange={(e) => setLoyaltyForm(p => ({ ...p, pointsToCash: e.target.value }))} className="h-11 rounded-xl bg-muted/20 border-none font-bold" /></div>
                        <div className="grid gap-2"><Label className="text-[10px] font-black uppercase">賺取比例 ($ = 1 Pt)</Label><Input value={loyaltyForm.spendToPoints} onChange={(e) => setLoyaltyForm(p => ({ ...p, spendToPoints: e.target.value }))} className="h-11 rounded-xl bg-muted/20 border-none font-bold" /></div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Referral MGM */}
                  <div className="space-y-8">
                    <h4 className="font-black text-xs uppercase tracking-widest text-indigo-600 flex items-center gap-2"><Users className="h-4 w-4" /> 好友邀請獎勵 (MGM)</h4>
                    <div className="p-6 bg-indigo-50/50 rounded-[2rem] border border-indigo-100 space-y-6">
                      <div className="grid gap-2">
                        <Label className="text-[10px] font-black uppercase text-indigo-700">1. 推薦人積分獎賞 (Points)</Label>
                        <div className="relative">
                          <Gift className="absolute left-3 top-3.5 h-5 w-5 text-indigo-400" />
                          <Input type="number" value={loyaltyForm.referralRewardPoints} onChange={(e) => setLoyaltyForm(p => ({ ...p, referralRewardPoints: e.target.value }))} className="pl-10 h-12 text-2xl font-black rounded-xl text-indigo-600 bg-white border-indigo-200" />
                        </div>
                      </div>

                      <div className="grid gap-2">
                        <Label className="text-[10px] font-black uppercase text-indigo-700">2. 推薦人加碼：專屬優惠券</Label>
                        <Select value={loyaltyForm.referralRewardPromoId || "none"} onValueChange={(v) => setLoyaltyForm(p => ({...p, referralRewardPromoId: v}))}>
                          <SelectTrigger className="h-12 rounded-xl bg-white border-indigo-100 shadow-sm font-bold">
                            <SelectValue placeholder="朋友首單後發給推薦人的券..." />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl shadow-2xl">
                             <SelectItem value="none" className="text-muted-foreground italic">僅發放積分獎勵</SelectItem>
                             {promos.map((p:any) => <SelectItem key={p.id} value={p.id || 'none'}>{p.name?.zh || p.name?.en} ({p.code || "Auto"})</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>

                      <Separator className="bg-indigo-100" />
                      
                      <div className="space-y-2">
                        <p className="text-[10px] text-indigo-800 leading-relaxed font-bold italic">
                          <Info className="h-3 w-3 inline mr-1" />
                          邏輯：當「被邀請人」完成首張訂單並標記為「已送達」時，系統會自動在「推薦人」錢包發放上述積分及優惠券。
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <Button className="w-full h-14 bg-primary text-primary-foreground font-black rounded-2xl shadow-lg" onClick={handleSaveLoyalty} disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}儲存規則設定</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="store" className="animate-in fade-in duration-300">
          <Card className="border-none shadow-sm overflow-hidden rounded-3xl bg-white">
            <CardHeader className="bg-muted/10 p-6 border-b flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary shadow-sm"><CheckCircle2 className="h-5 w-5" /></div>
              <div className="space-y-0.5">
                <CardTitle className="text-base font-black uppercase">換領項目列表</CardTitle>
                <CardDescription>管理顧客可使用積分兌換的禮品或現金券。</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {rewardsLoading ? <div className="p-12 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" /></div> : rewards.length === 0 ? (
                <div className="p-20 text-center flex flex-col items-center gap-4"><Package className="h-12 w-12 text-muted-foreground opacity-20" /><p className="text-muted-foreground font-medium">目前換領商城暫無商品。</p></div>
              ) : (
                <Table>
                  <TableHeader className="bg-muted/5"><TableRow><TableHead className="pl-8">商品名稱</TableHead><TableHead>所需積分</TableHead><TableHead>追加金額</TableHead><TableHead>剩餘名額</TableHead><TableHead className="text-right pr-8">操作</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {rewards.map((item: any) => (
                      <TableRow key={item.id || 'reward-key'} className="group hover:bg-muted/30 transition-colors">
                        <TableCell className="pl-8 py-4 font-bold">{lang === 'en' ? (item.title?.en || item.title?.zh) : (item.title?.zh || item.title?.en)}</TableCell>
                        <TableCell><Badge className="bg-primary text-primary-foreground font-black">{item.pointsRequired} Pts</Badge></TableCell>
                        <TableCell className="font-bold">${item.additionalCash || 0}</TableCell>
                        <TableCell className="text-xs font-bold">{item.stock} left</TableCell>
                        <TableCell className="text-right pr-8 space-x-1">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" asChild className="rounded-full"><Link href={`/admin/marketing/rewards/${item.id}`}><Edit2 className="h-4 w-4" /></Link></Button>
                            <Button variant="ghost" size="icon" className="text-destructive rounded-full" onClick={() => handleDeleteReward(item.id)}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="csr" className="space-y-12 animate-in fade-in duration-300">
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-xl font-black font-headline flex items-center gap-3"><Zap className="h-5 w-5 text-indigo-600 fill-current animate-pulse" />正在進行的公益活動</h3>
            </div>
            <Card className="border-none shadow-sm overflow-hidden rounded-3xl bg-white">
              <CardContent className="p-0">
                {promosLoading ? <div className="p-12 text-center"><Loader2 className="h-8 w-8 animate-spin text-indigo-600" /></div> : impactCampaigns.length === 0 ? (
                  <div className="p-16 text-center text-muted-foreground italic">目前無進行中的聯乘公益活動。</div>
                ) : (
                  <Table>
                    <TableHeader className="bg-indigo-50/50"><TableRow><TableHead className="pl-8">活動名稱</TableHead><TableHead>受惠機構</TableHead><TableHead>計算方式</TableHead><TableHead>數值</TableHead><TableHead className="text-right pr-8">操作</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {impactCampaigns.map((c: any) => (
                        <TableRow key={c.id || 'impact-key'} className="group hover:bg-indigo-50/20">
                          <TableCell className="pl-8 py-5 font-black text-indigo-900">{lang === 'en' ? (c.name?.en || c.name?.zh) : (c.name?.zh || c.name?.en)}</TableCell>
                          <TableCell className="font-bold text-sm">{c.donationCharity}</TableCell>
                          <TableCell className="text-[10px] font-black uppercase text-muted-foreground">{c.donationType?.replace(/_/g, ' ')}</TableCell>
                          <TableCell className="font-black text-indigo-600">{c.donationValue}{c.donationType === 'percent_of_total' ? '%' : '$'}</TableCell>
                          <TableCell className="text-right pr-8">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" asChild className="rounded-full"><Link href={`/admin/marketing/impact/campaigns/${c.id}`}><Edit2 className="h-4 w-4" /></Link></Button>
                              <Button variant="ghost" size="icon" className="text-destructive rounded-full" onClick={() => handleDeletePromo(c.id)}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>

          <Separator className="border-dashed" />

          <div className="space-y-6">
            <Card className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden border-l-4 border-indigo-600">
              <CardHeader className="bg-indigo-50/50 border-b p-8">
                <div className="flex items-center justify-between">
                  <div><CardTitle className="text-xl font-black flex items-center gap-3"><HeartHandshake className="h-6 w-6 text-indigo-600" />社會責任報告 (Impact Ledger) 歷史紀錄</CardTitle><CardDescription>管理已結算的捐款紀錄與官方收據公示。</CardDescription></div>
                  <Button className="bg-indigo-600 text-white font-black rounded-xl shadow-lg gap-2" onClick={() => { setEditingRecordIdx(null); setRecordForm({ type: "donation", charityName: "", amount: "", date: "", purpose: "", receiptUrl: "" }); setIsRecordModalOpen(true); }}><PlusCircle className="h-4 w-4" /> 錄入新紀錄</Button>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 bg-indigo-50 rounded-2xl text-center space-y-1"><p className="text-[10px] font-black uppercase text-indigo-400 tracking-widest">已累積捐款總額</p><h3 className="text-3xl font-black text-indigo-900">$ {impactForm.totalDonated.toLocaleString()}</h3></div>
                  <div className="p-6 bg-muted/20 rounded-2xl text-center space-y-1"><p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">合作受惠機構</p><h3 className="text-3xl font-black">{impactForm.charityCount} 門</h3></div>
                </div>
                <Table>
                  <TableHeader className="bg-muted/5"><TableRow><TableHead className="pl-6">日期與類型</TableHead><TableHead>機構名稱</TableHead><TableHead>金額 / 規模</TableHead><TableHead>用途與收據</TableHead><TableHead className="text-right pr-6">操作</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {impactForm.records.length === 0 ? <TableRow><TableCell colSpan={5} className="py-12 text-center italic text-muted-foreground">尚無明細紀錄</TableCell></TableRow> : impactForm.records.map((rec, i) => (
                      <TableRow key={i} className="group hover:bg-muted/10">
                        <TableCell className="pl-6"><p className="text-xs font-bold">{rec.date}</p><Badge variant="outline" className={cn("text-[8px] font-black uppercase", rec.type === 'donation' ? "border-green-200 text-green-600 bg-green-50" : "border-blue-200 text-blue-600 bg-blue-50")}>{rec.type}</Badge></TableCell>
                        <TableCell className="font-bold text-sm">{rec.charityName}</TableCell>
                        <TableCell className="font-black text-indigo-600">$ {Number(rec.amount).toLocaleString()}</TableCell>
                        <TableCell><div className="flex items-center gap-2"><p className="text-xs line-clamp-1 max-w-[150px]">{rec.purpose}</p>{rec.receiptUrl && <a href={rec.receiptUrl} target="_blank" rel="noreferrer"><FileCheck className="h-4 w-4 text-green-600" /></a>}</div></TableCell>
                        <TableCell className="text-right pr-6 space-x-1"><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingRecordIdx(i); setRecordForm(rec); setIsRecordModalOpen(true); }}><Edit2 className="h-3.5 w-3.5" /></Button><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setImpactForm(p => ({...p, records: p.records.filter((_, idx) => idx !== i)}))}><Trash2 className="h-3.5 w-3.5" /></Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                <Button className="w-full h-14 bg-indigo-600 text-white font-black text-lg rounded-2xl shadow-xl gap-2" onClick={handleSaveLedger} disabled={loading}><Save className="h-5 w-5" /> 儲存並同步社會責任報告</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* 錄入歷史對話框 */}
      <Dialog open={isRecordModalOpen} onOpenChange={setIsRecordModalOpen}>
        <DialogContent className="rounded-3xl sm:max-w-md p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-8 bg-muted/10 border-b">
            <DialogTitle className="text-2xl font-black font-headline">錄入影響力明細</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh]">
            <div className="p-8 space-y-5">
              <div className="grid gap-1.5"><Label className="text-[10px] font-black uppercase opacity-60">類型</Label><Select value={recordForm.type} onValueChange={v => setRecordForm(p => ({...p, type: v}))}><SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger><SelectContent className="rounded-xl"><SelectItem value="donation">現金捐款</SelectItem><SelectItem value="event">合作活動 / 贈送</SelectItem></SelectContent></Select></div>
              <div className="grid gap-1.5"><Label className="text-[10px] font-black uppercase opacity-60">機構名稱</Label><Input value={recordForm.charityName} onChange={e => setRecordForm(p => ({...p, charityName: e.target.value}))} className="rounded-xl" placeholder="例如：奧比斯" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5"><Label className="text-[10px] font-black uppercase opacity-60">金額 ($)</Label><Input type="number" value={recordForm.amount} onChange={e => setRecordForm(p => ({...p, amount: e.target.value}))} className="rounded-xl font-bold" /></div>
                <div className="grid gap-1.5"><Label className="text-[10px] font-black uppercase opacity-60">日期</Label><Input type="date" value={recordForm.date} onChange={e => setRecordForm(p => ({...p, date: e.target.value}))} className="rounded-xl" /></div>
              </div>
              <div className="grid gap-1.5"><Label className="text-[10px] font-black uppercase opacity-60">用途描述</Label><Textarea value={recordForm.purpose} onChange={e => setRecordForm(p => ({...p, purpose: e.target.value}))} className="rounded-xl h-20" placeholder="簡述款項用途..." /></div>
              <div className="space-y-3">
                <Label className="text-[10px] font-black uppercase opacity-60">收據照片</Label>
                <div className="aspect-video bg-muted/20 border-2 border-dashed rounded-2xl flex items-center justify-center relative group overflow-hidden cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                  {recordForm.receiptUrl ? <img src={recordForm.receiptUrl} className="object-contain w-full h-full p-2" /> : <ImageIcon className="h-8 w-8 text-muted-foreground/30" />}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center"><Button variant="secondary" size="sm" className="font-bold">上傳照片</Button></div>
                </div>
                <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" />
                {uploadProgress > 0 && <Progress value={uploadProgress} className="h-1" />}
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="p-8 bg-muted/10 border-t">
            <Button className="w-full h-12 rounded-xl font-black text-lg" onClick={addOrUpdateRecord}>{editingRecordIdx !== null ? "更新明細" : "加入明細"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

