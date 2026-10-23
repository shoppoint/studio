
"use client";

import { useState, useMemo, useEffect } from "react";
import { 
  BarChart3, 
  TrendingUp, 
  Package, 
  ShoppingCart, 
  Users, 
  ArrowRight, 
  Loader2, 
  Target, 
  RefreshCcw, 
  AlertTriangle,
  History,
  FileBarChart,
  PackageSearch,
  FileWarning,
  ShoppingCart as ShoppingCartIcon,
  Zap,
  ShieldCheck,
  Tags,
  Award,
  Layers,
  Search,
  CheckCircle2,
  DatabaseZap,
  Info,
  Globe,
  MousePointer2,
  PieChart as PieIcon
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useI18n } from "@/lib/i18n/i18n-context";
import { useFirestore, useCollection, useDoc } from "@/firebase";
import { collection, query, where, orderBy, limit, doc, setDoc, updateDoc, serverTimestamp, getDocs } from "firebase/firestore";
import { format, subDays, startOfDay, endOfDay, addDays } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";
import { AccountingReportDialog } from "@/components/admin/orders/AccountingReportDialog";
import { ProductPerformanceTab } from "@/components/admin/dashboard/ProductPerformanceTab";

const COLORS = ['#FACC15', '#6366F1', '#F97316', '#10B981', '#8B5CF6', '#EC4899'];

export default function AdminDashboard() {
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const db = useFirestore();
  const router = useRouter();
  const dashT = t.admin.dashboard;

  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("sales");
  const [auditSubTab, setAuditSubTab] = useState("products");
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isRebuilding, setIsRebuilding] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // 1. 優先讀取高速統計摘要
  const statsSummaryRef = useMemo(() => db ? doc(db, 'config', 'stats_summary') : null, [db]);
  const { data: summary, loading: summaryLoading } = useDoc<any>(statsSummaryRef);

  // 2. 現場讀取基礎數據 (用於計算或回退)
  const ordersQuery = useMemo(() => (db) ? query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(1000)) : null, [db]);
  const { data: rawOrders } = useCollection<any>(ordersQuery);

  const productsQuery = useMemo(() => (db) ? query(collection(db, 'public_products'), where('status', '==', 'Active'), limit(2000)) : null, [db]);
  const { data: rawProducts } = useCollection<any>(productsQuery);

  const handleRebuildStats = async () => {
    if (!db || isRebuilding) return;
    setIsRebuilding(true);
    
    try {
      toast({ title: "開始更新數據", description: "正在掃描全站訂單、庫存與市場趨勢..." });

      const [ordersSnap, productsSnap, catsSnap, brandsSnap, locationsSnap] = await Promise.all([
        getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(1000))),
        getDocs(query(collection(db, 'public_products'), where('status', '==', 'Active'))),
        getDocs(collection(db, 'categories')),
        getDocs(collection(db, 'brands')),
        getDocs(query(collection(db, 'locations'), where('isDefaultFulfillmentSource', '==', true), limit(1)))
      ]);

      const defaultHubId = locationsSnap.empty ? null : locationsSnap.docs[0].id;
      
      const productsMap = new Map();
      productsSnap.docs.forEach(d => {
        const data = d.data();
        if (data.inStoreOnly !== true) {
          productsMap.set(d.id, data);
        }
      });

      const channelStats: Record<string, number> = { Web: 0, POS: 0, Manual: 0 };
      const revenueMap = new Map();
      const productSalesMap = new Map();

      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const sevenDaysAgo = subDays(now, 7);

      ordersSnap.docs.forEach(d => {
        const o = d.data();
        if (o.paymentStatus === 'paid' && o.status !== 'cancelled') {
          const gmv = Number(o.total) || 0;
          const source = o.sourceType || 'Web';
          channelStats[source] = (channelStats[source] || 0) + gmv;
          
          let dt: Date;
          if (o.createdAt?.seconds) {
            dt = new Date(o.createdAt.seconds * 1000);
            const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
            const cur = revenueMap.get(key) || { gmv: 0, count: 0 };
            cur.gmv += gmv; cur.count += 1;
            revenueMap.set(key, cur);
          } else {
            dt = new Date();
          }

          (o.items || []).forEach((it: any) => {
            const id = String(it.productId || it.id || "");
            if (!id || !productsMap.has(id)) return;

            const cur = productSalesMap.get(id) || { id, count: 0, recentCount: 0 };
            const qty = Number(it.qty) || 1;
            cur.count += qty;
            if (dt >= sevenDaysAgo) cur.recentCount += qty;
            productSalesMap.set(id, cur);
          });
        }
      });

      const revenueTrend = Array.from(revenueMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .slice(-6)
        .map(([name, data]) => ({ name, ...data }));
      
      const lowStockItems: any[] = [];
      const nearExpiryItems: any[] = [];
      const problematicProducts: any[] = [];
      const problematicCategories: any[] = [];
      const problematicBrands: any[] = [];
      let perfectCount = 0;
      const expiryThreshold = addDays(now, 90);

      for (const d of productsSnap.docs) {
        const p = d.data();
        const name = p.productName_zh || p.productName_en || "Unnamed";
        const batches = Array.isArray(p.batches) ? p.batches : [];

        const sellableTotal = batches
          .filter((b: any) => !b.expiryDate || b.expiryDate >= todayStr)
          .reduce((acc: number, b: any) => acc + (Number(b.quantity) || 0), 0);
        
        const sellableAtHub = batches
          .filter((b: any) => b.locationId === defaultHubId && (!b.expiryDate || b.expiryDate >= todayStr))
          .reduce((acc: number, b: any) => acc + (Number(b.quantity) || 0), 0);

        if (p.stock !== sellableTotal || p.onlineStock !== sellableAtHub) {
          await updateDoc(d.ref, {
            stock: sellableTotal,
            onlineStock: sellableAtHub,
            updatedAt: serverTimestamp()
          });
        }

        if (sellableAtHub < 10) lowStockItems.push({ id: d.id, name, qty: sellableAtHub });
        
        batches.forEach((b: any) => {
          if (b.expiryDate && new Date(b.expiryDate) < expiryThreshold && Number(b.quantity) > 0) {
            nearExpiryItems.push({ id: d.id, name, expiryDate: b.expiryDate, batchId: b.batchId });
          }
        });

        const issues = [];
        if (!p.description_zh || !p.description_en) issues.push('content');
        if (!p.slug) issues.push('slug');
        if (!p.imageUrl) issues.push('media');
        if (!p.seoTitle_zh || !p.seoDescription_zh) issues.push('seo');
        if (issues.length > 0) problematicProducts.push({ id: d.id, displayName: name, issues, entityType: 'product', subInfo: p.sku });
        else perfectCount++;
      }

      catsSnap.docs.forEach(d => {
        const c = d.data();
        if (!c.slug || !c.name_zh) problematicCategories.push({ id: d.id, displayName: c.name_zh || d.id, issues: ['slug', 'seo'], entityType: 'category' });
      });
      brandsSnap.docs.forEach(d => {
        const b = d.data();
        if (!b.slug || !b.name_zh) problematicBrands.push({ id: d.id, displayName: b.name_zh || d.id, issues: ['slug', 'seo'], entityType: 'brand' });
      });

      const enrichWithDisplayInfo = (list: any[]) => {
        return list.map(item => {
          const p = productsMap.get(item.id);
          if (!p) return null;
          return {
            ...item,
            productName_zh: p.productName_zh || "",
            productName_en: p.productName_en || "",
            imageUrl: p.imageUrl || "",
            price: Number(p.price) || 0,
            salePrice: Number(p.salePrice) || 0,
            primaryBrand: p.primaryBrand || p.brands || "SHOP POINT",
            brands: p.brands || "",
            slug: p.slug || "",
            inventoryPolicy: p.inventoryPolicy || 'Deny',
            onlineStock: Number(p.onlineStock) || 0,
            batches: p.batches || []
          };
        }).filter(Boolean);
      };

      const bestSellers = enrichWithDisplayInfo(
        Array.from(productSalesMap.values())
          .sort((a, b) => b.count - a.count)
          .slice(0, 10)
      );

      const trending = enrichWithDisplayInfo(
        Array.from(productSalesMap.values())
          .sort((a, b) => b.recentCount - a.recentCount)
          .slice(0, 10)
      );

      const popular = enrichWithDisplayInfo(
        productsSnap.docs
          .map(d => ({ 
            id: d.id, 
            addedToCartCount: Number(d.data().addedToCartCount) || 0 
          }))
          .sort((a, b) => b.addedToCartCount - a.addedToCartCount)
          .slice(0, 30)
      ).slice(0, 10);

      const summaryPayload = {
        revenueTrend,
        channelDistribution: Object.entries(channelStats).map(([name, value]) => ({ name, value })),
        inventory: { lowStockCount: lowStockItems.length, nearExpiryCount: nearExpiryItems.length, lowStockItems, nearExpiryItems },
        health: { total: productsSnap.size + catsSnap.size + brandsSnap.size, perfect: perfectCount, problematicProducts, problematicCategories, problematicBrands },
        bestSellers,
        trending,
        popular,
        lastUpdated: serverTimestamp()
      };

      await setDoc(doc(db, 'config', 'stats_summary'), summaryPayload, { merge: true });
      
      toast({ title: "數據精算完成", description: "過期庫存與門市限定貨品已從排行中剔除。" });
      router.refresh();
    } catch (e: any) {
      console.error("[Dashboard Rebuild] Error:", e);
      toast({ title: "更新失敗", description: e.message, variant: "destructive" });
    } finally {
      setIsRebuilding(false);
    }
  };

  const issueLabelMap: Record<string, string> = { content: "描述不全", seo: "SEO 未優化", media: "媒體缺失", slug: "網址缺失", keywords: "搜尋標籤缺失", google_category: "GMC 分類缺失" };

  const renderAuditTable = (items: any[]) => {
    if (!items || items.length === 0) return <div className="p-20 text-center space-y-4"><ShieldCheck className="h-12 w-12 mx-auto text-green-500 opacity-20" /><p className="text-muted-foreground italic font-medium">該類別資料目前皆符合標準。</p></div>;
    return (
      <ScrollArea className="h-[500px]">
        <Table>
          <TableHeader className="bg-muted/5"><TableRow><TableHead className="pl-8">名稱 / 識別</TableHead><TableHead>診斷缺失項目</TableHead><TableHead className="text-right pr-8">操作</TableHead></TableRow></TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id} className="group hover:bg-muted/30 transition-all border-dashed">
                <TableCell className="pl-8 py-4"><p className="font-bold text-sm text-slate-800">{item.displayName}</p><p className="text-[9px] text-muted-foreground font-mono">{item.subInfo || item.id}</p></TableCell>
                <TableCell><div className="flex flex-wrap gap-1.5">{(item.issues || []).map((issue: string) => (<Badge key={issue} variant="outline" className="bg-red-50 text-red-600 border-red-200 text-[8px] font-black uppercase">{issueLabelMap[issue] || issue}</Badge>))}</div></TableCell>
                <TableCell className="text-right pr-8"><Button size="sm" variant="ghost" className="h-8 rounded-xl font-bold text-primary" asChild><Link href={item.entityType === 'product' ? `/admin/products/${item.id}` : item.entityType === 'category' ? `/admin/categories/${item.id}` : `/admin/brands/${item.id}`}>修復 <ArrowRight className="h-3 w-3 ml-1" /></Link></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    );
  };

  if (!mounted || (summaryLoading && !summary)) return <div className="h-[80vh] flex flex-col items-center justify-center gap-4"><Loader2 className="h-10 w-10 animate-spin text-primary" /><p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">載入全域數據摘要中...</p></div>;

  const stats = summary;

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black font-headline tracking-tight">{dashT.title}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className={cn("border-none h-5 text-[9px] font-black uppercase", summary ? "bg-green-50 text-green-700" : "bg-orange-50 text-orange-600")}>{summary ? "Stats Sync Active" : "No Summary Found"}</Badge>
            <p className="text-muted-foreground text-xs font-medium">最後更新: {stats?.lastUpdated?.seconds ? format(new Date(stats.lastUpdated.seconds * 1000), "HH:mm:ss") : "尚未精算"}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className="rounded-xl h-12 px-6 font-bold border-primary/20 text-primary bg-primary/5 gap-2" 
            onClick={handleRebuildStats}
            disabled={isRebuilding}
          >
            {isRebuilding ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
            更新數據
          </Button>
          <Button variant="outline" className="rounded-xl h-12 px-6 font-bold border-indigo-100 text-indigo-700 bg-indigo-50/30 gap-2" onClick={() => setIsReportOpen(true)}>
            <FileBarChart className="h-4 w-4" /> 會計對帳
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-muted/50 p-1 h-12 rounded-2xl w-full sm:w-auto grid grid-cols-5 mb-8 border">
          <TabsTrigger value="sales" className="rounded-xl px-8 font-bold gap-2"><TrendingUp className="h-4 w-4" /> 銷售與通路</TabsTrigger>
          <TabsTrigger value="performance" className="rounded-xl px-8 font-bold gap-2"><PieIcon className="h-4 w-4" /> 產品分析</TabsTrigger>
          <TabsTrigger value="inventory" className="rounded-xl px-8 font-bold gap-2"><PackageSearch className="h-4 w-4" /> 庫存與預警</TabsTrigger>
          <TabsTrigger value="demand" className="rounded-xl px-8 font-bold gap-2"><Zap className="h-4 w-4" /> 市場傾向</TabsTrigger>
          <TabsTrigger value="health" className="rounded-xl px-8 font-bold gap-2"><FileWarning className="h-4 w-4" /> 資料質量</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <Card className="lg:col-span-8 border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
              <CardHeader className="p-8 border-b">
                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary" /> 營收趨勢分析</CardTitle>
              </CardHeader>
              <CardContent className="h-[350px] p-8">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={stats?.revenueTrend || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" fontSize={11} />
                    <YAxis fontSize={11} tickFormatter={(v) => `$${v.toLocaleString()}`} />
                    <Tooltip />
                    <Line type="monotone" dataKey="gmv" stroke="#FACC15" strokeWidth={4} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="lg:col-span-4 border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden">
              <CardHeader className="p-8 border-b">
                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2"><Target className="h-5 w-5 text-primary" /> 通路銷售佔比</CardTitle>
              </CardHeader>
              <CardContent className="h-[350px] p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={stats?.channelDistribution || []} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={8} dataKey="value">
                      {(stats?.channelDistribution || []).map((_:any, index:number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-8 animate-in fade-in">
          <ProductPerformanceTab products={rawProducts || []} />
        </TabsContent>

        <TabsContent value="inventory" className="space-y-8 animate-in fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="border-none shadow-sm rounded-[2rem] bg-white border-l-4 border-orange-500">
              <CardHeader className="bg-orange-50/50 p-6 border-b flex flex-row items-center justify-between">
                <div><CardTitle className="text-base font-black flex items-center gap-2 text-orange-900"><AlertTriangle className="h-5 w-5 text-orange-600" /> 低庫存產品</CardTitle></div>
                <Badge className="bg-orange-600 text-white border-none">{stats?.inventory?.lowStockCount || 0}</Badge>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableBody>
                      {(!stats?.inventory?.lowStockItems || stats.inventory.lowStockItems.length === 0) ? <TableRow><TableCell className="py-20 text-center italic text-muted-foreground">無低庫存產品</TableCell></TableRow> : stats.inventory.lowStockItems.map((p: any) => (<TableRow key={p.id} className="group hover:bg-muted/30"><TableCell className="pl-8 py-4 font-bold text-sm">{p.name}</TableCell><TableCell className="text-right pr-8"><span className="text-xs font-black text-orange-600">餘 {p.qty} 件</span></TableCell></TableRow>))}</TableBody></Table></ScrollArea></CardContent></Card>
            <Card className="border-none shadow-sm rounded-[2rem] bg-white border-l-4 border-indigo-600">
              <CardHeader className="bg-indigo-50/50 p-6 border-b flex flex-row items-center justify-between">
                <div><CardTitle className="text-base font-black flex items-center gap-2 text-indigo-900"><History className="h-5 w-5 text-indigo-600" /> 即將到期批次</CardTitle></div>
                <Badge className="bg-indigo-600 text-white border-none">{stats?.inventory?.nearExpiryCount || 0}</Badge>
              </CardHeader>
              <CardContent className="p-0">
                <ScrollArea className="h-[400px]">
                  <Table>
                    <TableBody>
                      {(!stats?.inventory?.nearExpiryItems || stats.inventory.nearExpiryItems.length === 0) ? <TableRow><TableCell className="py-20 text-center italic text-muted-foreground">無即將到期產品</TableCell></TableRow> : stats.inventory.nearExpiryItems.map((b: any, i: number) => (<TableRow key={i} className="group hover:bg-muted/30"><TableCell className="pl-8 py-4"><p className="font-bold text-sm">{b.name}</p><p className="text-[9px] opacity-40">BATCH: {b.batchId}</p></TableCell><TableCell className="text-right pr-8"><span className="text-xs font-black text-red-600">{b.expiryDate}</span></TableCell></TableRow>))}</TableBody></Table></ScrollArea></CardContent></Card>
          </div>
        </TabsContent>

        <TabsContent value="demand" className="space-y-8 animate-in fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <Card className="border-none shadow-sm bg-white rounded-2xl border-l-4 border-indigo-600"><CardContent className="p-6"><p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">平均遺棄金額</p><h3 className="text-2xl font-black text-indigo-600">$ {(stats?.demand?.avgAbandonedValue || 0).toFixed(1)}</h3></CardContent></Card>
             <Card className="border-none shadow-sm bg-white rounded-2xl border-l-4 border-primary"><CardContent className="p-6"><p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">近期加購會話</p><h3 className="text-2xl font-black text-primary">{stats?.demand?.totalSessions || 0}</h3></CardContent></Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <Card className="lg:col-span-8 border-none shadow-sm rounded-[2rem] overflow-hidden bg-white border-l-4 border-primary">
              <CardHeader className="bg-primary/5 p-6 border-b"><CardTitle className="text-base font-black flex items-center gap-2"><ShoppingCartIcon className="h-5 w-5 text-primary" /> 遺棄產品排行 (Trend Insight)</CardTitle></CardHeader>
              <CardContent className="p-0"><ScrollArea className="h-[400px]"><Table><TableBody>{(!stats?.demand?.topItems || stats.demand.topItems.length === 0) ? <TableRow><TableCell className="py-20 text-center text-muted-foreground italic">尚無行為數據</TableCell></TableRow> : stats.demand.topItems.map((p:any, i:number) => (<TableRow key={i} className="group hover:bg-muted/30"><TableCell className="pl-8 py-5"><p className="font-bold text-sm">{p.name}</p><p className="text-[9px] font-black text-muted-foreground uppercase">Lost Value: ${p.value.toLocaleString()}</p></TableCell><TableCell className="text-right pr-8"><Badge className="bg-orange-100 text-orange-700 border-none font-black px-4">{p.count} 次遺棄</Badge></TableCell></TableRow>))}</TableBody></Table></ScrollArea></CardContent>
            </Card>
            
            <Card className="lg:col-span-4 border-none shadow-sm rounded-[2rem] overflow-hidden bg-white border-l-4 border-indigo-600">
              <CardHeader className="bg-indigo-50/50 p-6 border-b"><CardTitle className="text-base font-black flex items-center gap-2"><Globe className="h-5 w-5 text-indigo-700" /> 加購路徑效能</CardTitle></CardHeader>
              <CardContent className="p-0"><ScrollArea className="h-[400px]"><Table><TableBody>{(!stats?.demand?.topSources || stats.demand.topSources.length === 0) ? <TableRow><TableCell className="py-20 text-center text-muted-foreground italic">尚無來源數據</TableCell></TableRow> : stats.demand.topSources.map((s:any, i:number) => (<TableRow key={i} className="group hover:bg-muted/30"><TableCell className="pl-8 py-4"><div className="flex items-center gap-2"><div className="h-8 w-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-700"><MousePointer2 className="h-3.5 w-3.5" /></div><p className="text-xs font-bold font-mono truncate max-w-[150px]">{s.path}</p></div></TableCell><TableCell className="text-right pr-8"><span className="text-xs font-black text-slate-800">{s.count} 次</span></TableCell></TableRow>))}</TableBody></Table></ScrollArea></CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="health" className="animate-in fade-in duration-300">
          <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden border-l-4 border-green-500">
            <CardHeader className="p-8 border-b flex flex-row items-center justify-between bg-muted/5">
              <div className="space-y-1"><CardTitle className="text-lg flex items-center gap-2">全域內容與 Slug 審計報告</CardTitle><CardDescription>包含產品標籤、GMC 分類、SEO 優化及網址 Slug。</CardDescription></div>
              <Badge className="bg-green-500 text-white h-7 px-4 rounded-full font-black">{stats?.health?.total ? `${stats.health.perfect} / ${stats.health.total} Perfect` : "Calculating..."}</Badge>
            </CardHeader>
            <CardContent className="p-6">
              <Tabs value={auditSubTab} onValueChange={setAuditSubTab} className="w-full">
                <TabsList className="bg-muted/50 p-1 h-10 rounded-xl mb-6 w-fit border">
                  <TabsTrigger value="products" className="rounded-lg px-6 font-bold text-xs gap-2">產品 ({stats?.health?.problematicProducts?.length || 0})</TabsTrigger>
                  <TabsTrigger value="categories" className="rounded-lg px-6 font-bold text-xs gap-2">分類 ({stats?.health?.problematicCategories?.length || 0})</TabsTrigger>
                  <TabsTrigger value="brands" className="rounded-lg px-6 font-bold text-xs gap-2">品牌 ({stats?.health?.problematicBrands?.length || 0})</TabsTrigger>
                </TabsList>
                <TabsContent value="products" className="mt-0">{renderAuditTable(stats?.health?.problematicProducts || [])}</TabsContent>
                <TabsContent value="categories" className="mt-0">{renderAuditTable(stats?.health?.problematicCategories || [])}</TabsContent>
                <TabsContent value="brands" className="mt-0">{renderAuditTable(stats?.health?.problematicBrands || [])}</TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <AccountingReportDialog isOpen={isReportOpen} onOpenChange={setIsReportOpen} orders={rawOrders || []} />
    </div>
  );
}
