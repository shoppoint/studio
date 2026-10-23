
"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  ShieldCheck,
  Package,
  MapPin,
  Coins,
  History,
  Ban,
  CheckCircle2,
  Plus, 
  Minus, 
  Sparkles, 
  Heart, 
  Smartphone, 
  Info, 
  UserCog, 
  Crown, 
  LayoutGrid, 
  Eye, 
  ShoppingCart, 
  Clock, 
  AlertTriangle,
  Globe,
  Key,
  PlusCircle,
  MinusCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useI18n } from "@/lib/i18n/i18n-context";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useFirestore, useDoc, useUser, useCollection } from "@/firebase";
import { doc, updateDoc, serverTimestamp, collection, query, where, orderBy, increment, addDoc } from "firebase/firestore";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const AGE_RANGES = ["Under 18", "18-24", "25-34", "35-44", "45-54", "55-64", "65+"];

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const db = useFirestore();
  const { user: currentUser } = useUser();
  const userId = params.userId as string;

  const userRef = useMemo(() => {
    if (!db || !currentUser || !userId) return null;
    return doc(db, 'users', userId);
  }, [db, currentUser, userId]);
  const { data: userData, loading: dataLoading } = useDoc<any>(userRef);

  const loyaltyConfigRef = useMemo(() => {
    if (!db) return null;
    return doc(db, 'config', 'loyalty');
  }, [db]);
  const { data: loyaltyConfig } = useDoc<any>(loyaltyConfigRef);

  const ordersQuery = useMemo(() => {
    if (!db || !userId) return null;
    return query(
      collection(db, 'orders'),
      where('customerId', '==', userId),
      orderBy('createdAt', 'desc')
    );
  }, [db, userId]);

  const { data: userOrders, loading: ordersLoading } = useCollection<any>(ordersQuery);

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustReason, setAdjustAmountReason] = useState("");
  
  const [formData, setFormData] = useState<any>(null);

  useEffect(() => {
    if (userData) {
      setFormData({
        ...userData,
        displayName: userData.displayName || "",
        email: userData.email || "",
        phone: userData.phone || "",
        birthday: userData.birthday || "",
        role: userData.role || "Customer",
        tier: userData.tier || "classic",
        status: userData.status || "Active",
        points: userData.points || 0,
        interests: userData.interests || [],
        skinType: userData.skinType || "Normal",
        ageRange: userData.ageRange || "25-34",
        signInProvider: userData.signInProvider || "---"
      });
    }
  }, [userData]);

  const pendingPoints = useMemo(() => {
    if (!userOrders) return 0;
    const spendToPoints = loyaltyConfig?.spendToPoints || 10;
    return userOrders
      .filter(o => o.paymentStatus === 'paid' && o.fulfillmentStatus !== 'delivered' && o.fulfillmentStatus !== 'picked_up' && !o.pointsAwarded)
      .reduce((acc, o) => acc + Math.floor((o.total || 0) / spendToPoints), 0);
  }, [userOrders, loyaltyConfig]);

  const handleFieldChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!formData || !userRef) return;
    setLoading(true);
    const updateData = { ...formData, updatedAt: serverTimestamp() };
    updateDoc(userRef, updateData)
      .then(() => {
        toast({ title: t.common.success, description: "Customer information updated." });
        router.push("/admin/users");
      })
      .catch(async (serverError) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ path: userRef.path, operation: 'update', requestResourceData: updateData }));
      })
      .finally(() => setLoading(false));
  };

  const handleAdjustPoints = async (isAdd: boolean) => {
    if (!formData || !userRef || !db) return;
    const amount = parseInt(adjustAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "無效金額", description: "請輸入有效的正整數。", variant: "destructive" });
      return;
    }
    
    setLoading(true);
    const finalAmount = isAdd ? amount : -amount;
    const updatePointsData = { 
      points: increment(finalAmount), 
      updatedAt: serverTimestamp() 
    };

    try {
      await updateDoc(userRef, updatePointsData);
      
      // 記錄一筆日誌 (Log) 到 enquiries 作為內部備忘
      await addDoc(collection(db, 'enquiries'), {
        userId,
        name: formData.displayName,
        email: formData.email,
        category: 'system',
        subject: `[積分手動調整] ${isAdd ? '增加' : '扣減'} ${amount} 積分`,
        message: `管理員手動調整了積分。理由：${adjustReason || '未提供理由'}\n異動量：${finalAmount}\n操作人：${currentUser?.email}`,
        source: 'Manual',
        status: 'resolved',
        createdAt: serverTimestamp()
      });

      setAdjustAmount("");
      setAdjustAmountReason("");
      toast({ title: "積分已調整", description: `已成功${isAdd ? '增加' : '扣除'} ${amount} 積分。` });
    } catch (error: any) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ 
        path: userRef.path, 
        operation: 'update', 
        requestResourceData: updatePointsData 
      }));
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered': return <Badge className="bg-green-100 text-green-800 border-green-200 h-5 px-2 rounded text-[10px] font-black uppercase">Delivered</Badge>;
      case 'shipped': return <Badge className="bg-blue-100 text-blue-800 border-blue-200 h-5 px-2 rounded text-[10px] font-black uppercase">Shipped</Badge>;
      case 'processing': return <Badge className="bg-orange-100 text-orange-800 border-orange-200 h-5 px-2 rounded text-[10px] font-black uppercase">Processing</Badge>;
      case 'pending': return <Badge variant="outline" className="h-5 px-2 rounded text-[10px] font-black uppercase border-amber-200 text-amber-700 bg-amber-50">Pending</Badge>;
      case 'cancelled': return <Badge variant="destructive" className="h-5 px-2 rounded text-[10px] font-black uppercase">Cancelled</Badge>;
      default: return <Badge variant="secondary" className="h-5 px-2 rounded text-[10px] font-black uppercase">{status}</Badge>;
    }
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case 'paid': return <Badge className="bg-green-100 text-green-800 border-none h-5 px-2 rounded text-[9px] font-black uppercase">PAID</Badge>;
      case 'unpaid': return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 h-5 px-2 rounded text-[9px] font-black uppercase">UNPAID</Badge>;
      default: return <Badge variant="secondary" className="h-5 px-2 rounded text-[9px] font-black uppercase">{status}</Badge>;
    }
  };

  if (dataLoading || !formData) return <div className="h-96 flex flex-col items-center justify-center space-y-4"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="text-sm font-bold text-muted-foreground tracking-widest uppercase">Fetching user data...</p></div>;

  const profT = t.profile;
  const intT = profT.interests;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full"><ArrowLeft className="h-5 w-5" /></Button>
          <div><h1 className="text-3xl font-bold font-headline">User Details</h1><p className="text-muted-foreground">UID: <span className="font-mono text-xs">{userId}</span></p></div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl h-11" onClick={() => router.back()}>{t.common.cancel}</Button>
          <Button className="bg-primary text-primary-foreground font-black shadow-lg rounded-xl h-11 px-8" onClick={handleSave} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}儲存變更
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-none shadow-sm overflow-hidden text-center bg-white rounded-[2rem]">
            <div className="h-20 bg-primary/10 relative" />
            <CardContent className="relative pt-0 px-6 pb-6 text-center md:text-left">
              <div className="flex justify-center -mt-10 mb-4"><Avatar className="h-24 w-24 border-4 border-white shadow-xl"><AvatarFallback className="bg-primary text-primary-foreground text-2xl font-black">{(formData.displayName || formData.email || "U").charAt(0).toUpperCase()}</AvatarFallback></Avatar></div>
              <h2 className="text-xl font-black">{formData.displayName || "未具名用戶"}</h2>
              <p className="text-xs text-muted-foreground mb-4 font-mono">{formData.email}</p>
              
              <div className="flex flex-wrap justify-center gap-2 mb-6">
                <Badge variant={formData.status === 'Active' ? 'default' : 'destructive'} className="rounded-full px-3 h-6 border-none text-[10px] font-black uppercase">{formData.status === 'Active' ? <CheckCircle2 className="h-3 w-3 mr-1" /> : <Ban className="h-3 w-3 mr-1" />}{formData.status}</Badge>
                <Badge className={cn("rounded-full border-none px-3 h-6 text-[10px] font-black uppercase shadow-sm", formData.tier === 'gold' ? "bg-amber-100 text-amber-700" : formData.tier === 'platinum' ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-700")}>{formData.tier?.toUpperCase() || "CLASSIC"}</Badge>
              </div>

              <div className="p-4 bg-muted/20 rounded-2xl border border-dashed flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">登入方式</span>
                <div className="flex items-center gap-2">
                  {formData.signInProvider === 'google.com' ? <Globe className="h-4 w-4 text-blue-600" /> : <Key className="h-4 w-4 text-amber-600" />}
                  <span className="text-xs font-bold uppercase">{formData.signInProvider?.replace('.com', '')}</span>
                </div>
              </div>
            </CardContent>
            <Separator className="border-dashed" />
            <div className="p-6 grid grid-cols-2 gap-4 divide-x divide-dashed">
              <div className="space-y-1"><p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Points Balance</p><p className="text-3xl font-black text-primary">{formData.points}</p></div>
              <div className="space-y-1">
                <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest flex items-center justify-center gap-1.5"><Clock className="h-3 w-3" /> Pending Points</p>
                <p className="text-2xl font-black text-orange-400">+{pendingPoints}</p>
              </div>
            </div>
          </Card>

          <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden border-l-4 border-amber-500">
            <CardHeader className="bg-amber-50/50 border-b"><CardTitle className="text-xs font-black uppercase tracking-widest text-amber-700 flex items-center gap-2"><Coins className="h-4 w-4" /> 積分手動調整</CardTitle></CardHeader>
            <CardContent className="p-6 space-y-4">
               <div className="space-y-2">
                 <Label className="text-[10px] font-bold uppercase">調整點數</Label>
                 <Input 
                   type="number" 
                   placeholder="輸入欲異動的點數..." 
                   className="h-11 bg-muted/20 border-none rounded-xl font-black text-xl text-amber-600"
                   value={adjustAmount}
                   onChange={e => setAdjustAmount(e.target.value)}
                 />
               </div>
               <div className="space-y-2">
                 <Label className="text-[10px] font-bold uppercase">調整理由 (必填)</Label>
                 <Input 
                   placeholder="例如：手動補發、退款扣減..." 
                   className="h-10 text-xs rounded-xl"
                   value={adjustReason}
                   onChange={e => setAdjustAmountReason(e.target.value)}
                 />
               </div>
               <div className="flex gap-2 pt-2">
                 <Button 
                   className="flex-1 bg-green-600 text-white font-black rounded-xl h-12 shadow-md gap-1"
                   onClick={() => handleAdjustPoints(true)}
                   disabled={loading || !adjustAmount || !adjustReason}
                 >
                   <PlusCircle className="h-4 w-4" /> 補發積分
                 </Button>
                 <Button 
                   variant="outline"
                   className="flex-1 border-red-200 text-red-600 font-black rounded-xl h-12 gap-1"
                   onClick={() => handleAdjustPoints(false)}
                   disabled={loading || !adjustAmount || !adjustReason}
                 >
                   <MinusCircle className="h-4 w-4" /> 扣減積分
                 </Button>
               </div>
               <p className="text-[10px] text-muted-foreground italic text-center">調整後將自動記錄日誌於資料庫。</p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
            <CardHeader className="bg-muted/5 border-b"><CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2"><UserCog className="h-4 w-4 text-primary" />Access & Rank</CardTitle></CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid gap-2"><Label className="text-xs font-bold">Platform Role</Label><Select value={formData.role} onValueChange={(v) => handleFieldChange("role", v)}><SelectTrigger className="h-11 bg-muted/20 border-none rounded-xl font-bold text-sm"><SelectValue /></SelectTrigger><SelectContent className="rounded-xl border-none shadow-2xl"><SelectItem value="Customer">Customer (標準顧客)</SelectItem><SelectItem value="Vendor">Vendor (合作商家)</SelectItem><SelectItem value="ShopManager">Shop Manager (店舖經理)</SelectItem><SelectItem value="Superadmin">Superadmin (最高權限)</SelectItem></SelectContent></Select></div>
              <div className="grid gap-2"><Label className="text-xs font-bold flex items-center gap-2"><Crown className="h-4 w-4 text-amber-500" /> Member Tier</Label><Select value={formData.tier} onValueChange={(v) => handleFieldChange("tier", v)}><SelectTrigger className="h-11 bg-muted/20 border-none rounded-xl font-bold text-sm"><SelectValue /></SelectTrigger><SelectContent className="rounded-xl border-none shadow-2xl"><SelectItem value="classic">{profT.tiers.classic}</SelectItem><SelectItem value="gold" className="text-amber-600 font-bold">{profT.tiers.gold}</SelectItem><SelectItem value="platinum" className="text-indigo-600 font-bold">{profT.tiers.platinum}</SelectItem></SelectContent></Select></div>
              <div className="grid gap-2"><Label className="text-xs font-bold">Account Status</Label><Select value={formData.status} onValueChange={(v) => handleFieldChange("status", v)}><SelectTrigger className="h-11 bg-muted/20 border-none rounded-xl font-bold text-sm"><SelectValue /></SelectTrigger><SelectContent className="rounded-xl border-none shadow-2xl"><SelectItem value="Active">Active (啟用中)</SelectItem><SelectItem value="Suspended" className="text-destructive">Suspended (停權中)</SelectItem></SelectContent></Select></div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full justify-start bg-transparent border-b border-muted rounded-none p-0 h-auto gap-8 overflow-x-auto no-scrollbar pb-1">
              <TabsTrigger value="profile" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-4 font-black uppercase text-[10px] tracking-widest">User Profile</TabsTrigger>
              <TabsTrigger value="preferences" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-4 font-black uppercase text-[10px] tracking-widest">Preferences</TabsTrigger>
              <TabsTrigger value="orders" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-0 pb-4 font-black uppercase text-[10px] tracking-widest">Order History</TabsTrigger>
            </TabsList>
            <TabsContent value="profile" className="pt-6 space-y-6 animate-in fade-in duration-300">
              <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
                <CardContent className="pt-8 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="grid gap-2"><Label htmlFor="name" className="text-xs font-bold flex items-center gap-2 text-muted-foreground"><User className="h-3.5 w-3.5" /> {profT.display_name}</Label><Input id="name" value={formData.displayName} onChange={(e) => handleFieldChange('displayName', e.target.value)} className="h-11 bg-muted/20 border-none rounded-xl" /></div>
                    <div className="grid gap-2"><Label htmlFor="email" className="text-xs font-bold flex items-center gap-2 text-muted-foreground"><Mail className="h-3.5 w-3.5" /> {profT.email}</Label><Input id="email" value={formData.email} onChange={(e) => handleFieldChange('email', e.target.value)} className="h-11 bg-muted/20 border-none rounded-xl" /></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="grid gap-2"><Label htmlFor="phone" className="text-xs font-bold flex items-center gap-2 text-muted-foreground"><Phone className="h-3.5 w-3.5" /> 手機電話</Label><Input id="phone" value={formData.phone} onChange={(e) => handleFieldChange('phone', e.target.value)} className="h-11 bg-muted/20 border-none rounded-xl" /></div>
                    <div className="grid gap-2"><Label htmlFor="birthday" className="text-xs font-bold flex items-center gap-2 text-muted-foreground"><Calendar className="h-3.5 w-3.5" /> {profT.birthday} (MM-DD)</Label><Input id="birthday" placeholder="e.g. 05-20" value={formData.birthday} onChange={(e) => handleFieldChange('birthday', e.target.value)} className="h-11 bg-muted/20 border-none rounded-xl font-mono" /></div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="preferences" className="pt-6 space-y-6 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-none shadow-sm rounded-2xl bg-white"><CardHeader className="pb-3"><CardTitle className="text-sm font-black uppercase text-primary flex items-center gap-2"><LayoutGrid className="h-4 w-4" /> {intT.age_range}</CardTitle></CardHeader><CardContent><Select value={formData.ageRange} onValueChange={(v) => handleFieldChange("ageRange", v)}><SelectTrigger className="h-10 rounded-xl bg-muted/20 border-none font-bold"><SelectValue /></SelectTrigger><SelectContent className="rounded-xl border-none shadow-2xl">{AGE_RANGES.map(range => <SelectItem key={range} value={range}>{range}</SelectItem>)}</SelectContent></Select></CardContent></Card>
                <Card className="border-none shadow-sm rounded-2xl bg-white"><CardHeader className="pb-3"><CardTitle className="text-sm font-black uppercase text-primary flex items-center gap-2"><Heart className="h-4 w-4" /> {intT.categories}</CardTitle></CardHeader><CardContent><div className="flex flex-wrap gap-2">{formData.interests?.map((cat: string) => (<Badge key={cat} variant="secondary" className="rounded-lg h-6 px-3 bg-muted/50 border-none font-bold text-xs">{cat}</Badge>))} {(!formData.interests || formData.interests.length === 0) && <span className="text-xs text-muted-foreground italic">No interests.</span>}</div></CardContent></Card>
              </div>
            </TabsContent>
            <TabsContent value="orders" className="pt-6 animate-in fade-in duration-300">
              <Card className="border-none shadow-sm overflow-hidden bg-white rounded-3xl">
                <CardContent className="p-0">
                  {ordersLoading ? (<div className="py-20 text-center flex flex-col items-center gap-4"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="text-xs font-bold text-muted-foreground uppercase">Syncing Orders...</p></div>) : !userOrders || userOrders.length === 0 ? (<div className="py-20 text-center space-y-4"><ShoppingCart className="h-12 w-12 text-muted-foreground/20 mx-auto" /><p className="text-sm text-muted-foreground font-bold">{profT.no_orders}</p></div>) : (
                    <Table>
                      <TableHeader className="bg-muted/5"><TableRow><TableHead className="pl-6">Order ID</TableHead><TableHead>Date</TableHead><TableHead>Payment</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Total</TableHead><TableHead className="text-right pr-6">Action</TableHead></TableRow></TableHeader>
                      <TableBody>{userOrders.map((o) => (<TableRow key={o.id} className="group hover:bg-muted/30"><TableCell className="pl-6 font-black text-xs">#{o.orderId || o.id.split('-').pop()}</TableCell><TableCell className="text-[10px] text-muted-foreground font-bold uppercase">{o.createdAt?.seconds ? format(new Date(o.createdAt.seconds * 1000), 'yyyy-MM-dd') : '--'}</TableCell><TableCell>{getPaymentBadge(o.paymentStatus || 'unpaid')}</TableCell><TableCell>{getStatusBadge(o.fulfillmentStatus || o.status || 'pending')}</TableCell><TableCell className="text-right font-black text-primary">${(o.total || 0).toFixed(2)}</TableCell><TableCell className="text-right pr-6"><Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" asChild><Link href={`/admin/orders/${o.id}`}><Eye className="h-4 w-4" /></Link></Button></TableCell></TableRow>))}</TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
