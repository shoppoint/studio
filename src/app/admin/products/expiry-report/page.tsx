"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Calendar, 
  AlertTriangle, 
  Zap, 
  Search, 
  Download,
  Info,
  ChevronRight,
  Loader2,
  Percent,
  MapPin
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useI18n } from "@/lib/i18n/i18n-context";
import { differenceInDays, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { recommendClearanceStrategy, type RecommendClearanceOutput } from "@/ai/flows/recommend-clearance-strategy-flow";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useCollection } from "@/firebase";
import { collection, query, where, orderBy } from "firebase/firestore";

export default function ExpiryReportPage() {
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const db = useFirestore();
  const prodT = t.admin.products;
  const urgT = prodT.urgency;

  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [isAiDialogOpend, setIsAiDialogOpened] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<RecommendClearanceOutput | null>(null);
  const [selectedBatchData, setSelectedBatchData] = useState<any | null>(null);

  const productsQuery = useMemo(() => {
    if (!db) return null;
    return query(
      collection(db, 'public_products'),
      where('status', '==', 'Active')
    );
  }, [db]);

  const { data: rawProducts, loading } = useCollection<any>(productsQuery);

  const locationsQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'locations'));
  }, [db]);
  const { data: locations } = useCollection<any>(locationsQuery);

  const getLocName = (id: string) => {
    const loc = locations?.find(l => l.id === id);
    if (!loc) return id || "Unknown";
    return lang === 'en' ? (loc.name_en || loc.name_zh) : (loc.name_zh || loc.name_en);
  };

  const allBatches = useMemo(() => {
    if (!rawProducts) return [];
    const flattened: any[] = [];
    rawProducts.forEach(p => {
      const pName = lang === 'en' ? (p.productName_en || p.productName_zh) : (p.productName_zh || p.productName_en);
      if (Array.isArray(p.batches) && p.batches.length > 0) {
        p.batches.forEach((b: any) => {
          flattened.push({
            ...b,
            productId: p.id,
            productName: pName,
            sku: p.sku,
            price: p.price,
            vendor: p.vendorId || "Internal",
            totalProductStock: p.stock // 用於核對
          });
        });
      }
    });
    return flattened;
  }, [rawProducts, lang]);

  const getUrgencyData = (expiryStr: string) => {
    if (!expiryStr) return { label: "N/A", variant: "secondary", color: "text-muted-foreground", days: 999, bucket: 'safe' };
    const today = new Date();
    const expiry = parseISO(expiryStr);
    const days = differenceInDays(expiry, today);

    if (days < 0) return { label: urgT.expired, variant: "destructive", color: "text-red-600 bg-red-50", days, bucket: 'expired' };
    if (days < 30) return { label: urgT.urgent, variant: "default", color: "bg-orange-500 text-white", days, bucket: '1mo' };
    if (days < 60) return { label: "2個月內", variant: "outline", color: "bg-amber-50 text-amber-700 border-amber-200", days, bucket: '2mo' };
    if (days < 90) return { label: "3個月內", variant: "outline", color: "bg-yellow-50 text-yellow-800 border-yellow-200", days, bucket: '3mo' };
    return { label: urgT.safe, variant: "secondary", color: "text-muted-foreground", days, bucket: 'safe' };
  };

  const filteredBatches = useMemo(() => {
    return allBatches.filter(b => {
      const urgency = getUrgencyData(b.expiryDate);
      const matchesTab = activeTab === 'all' || urgency.bucket === activeTab;
      const matchesSearch = b.productName.toLowerCase().includes(searchQuery.toLowerCase()) || b.sku.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTab && matchesSearch;
    }).sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
  }, [allBatches, activeTab, searchQuery]);

  const stats = useMemo(() => {
    const res = { expired: 0, urgent: 0, mo2: 0, mo3: 0 };
    allBatches.forEach(b => {
      const u = getUrgencyData(b.expiryDate);
      if (u.bucket === 'expired') res.expired++;
      if (u.bucket === '1mo') res.urgent++;
      if (u.bucket === '2mo') res.mo2++;
      if (u.bucket === '3mo') res.mo3++;
    });
    return res;
  }, [allBatches]);

  const handleOpenAiStrategy = async (batch: any) => {
    setSelectedBatchData(batch);
    setAiResult(null);
    setIsAiDialogOpened(true);
    setIsAiLoading(true);
    try {
      const urgency = getUrgencyData(batch.expiryDate);
      const result = await recommendClearanceStrategy({
        productName: batch.productName,
        daysLeft: urgency.days,
        stockQty: batch.quantity,
        originalPrice: batch.price,
        language: lang
      });
      setAiResult(result);
    } catch (e) { console.error(e); } finally { setIsAiLoading(false); }
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-full">
            <Link href="/admin/products"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <h1 className="text-3xl font-black font-headline tracking-tight">批次效期與同步報表</h1>
            <p className="text-muted-foreground">識別即將到期的特定批次。系統已自動同步批次總和至產品庫存。</p>
          </div>
        </div>
        <Button variant="outline" className="gap-2 rounded-xl h-11 border-muted-foreground/20 font-bold px-6">
          <Download className="h-4 w-4" /> 匯出清單
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm bg-red-50/50">
          <CardContent className="p-4">
            <p className="text-[10px] font-black text-red-600 uppercase mb-1">{urgT.expired} 批次</p>
            <h3 className="text-2xl font-black text-red-700">{stats.expired}</h3>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-orange-50/50">
          <CardContent className="p-4">
            <p className="text-[10px] font-black text-orange-600 uppercase mb-1">1個月內</p>
            <h3 className="text-2xl font-black text-orange-700">{stats.urgent}</h3>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-amber-50/50">
          <CardContent className="p-4">
            <p className="text-[10px] font-black text-amber-600 uppercase mb-1">2個月內</p>
            <h3 className="text-2xl font-black text-amber-700">{stats.mo2}</h3>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-yellow-50/50">
          <CardContent className="p-4">
            <p className="text-[10px] font-black text-yellow-600 uppercase mb-1">3個月內</p>
            <h3 className="text-2xl font-black text-yellow-700">{stats.mo3}</h3>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-white rounded-3xl">
        <CardHeader className="bg-muted/5 border-b space-y-6 p-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="搜尋產品、SKU 或批次號..." 
              className="pl-10 h-11 bg-white border-none shadow-inner rounded-xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-muted/20 p-1 h-12 rounded-xl grid grid-cols-5 w-full">
              <TabsTrigger value="all" className="rounded-lg font-bold text-xs uppercase">全部</TabsTrigger>
              <TabsTrigger value="expired" className="rounded-lg font-bold text-xs uppercase data-[state=active]:bg-red-500">已過期</TabsTrigger>
              <TabsTrigger value="1mo" className="rounded-lg font-bold text-xs uppercase data-[state=active]:bg-orange-500">1個月</TabsTrigger>
              <TabsTrigger value="2mo" className="rounded-lg font-bold text-xs uppercase data-[state=active]:bg-amber-500">2個月</TabsTrigger>
              <TabsTrigger value="3mo" className="rounded-lg font-bold text-xs uppercase data-[state=active]:bg-yellow-500">3個月</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/5">
              <TableRow>
                <TableHead className="pl-8">產品與批次</TableHead>
                <TableHead>存放地點</TableHead>
                <TableHead>批次剩餘 (Batch Qty)</TableHead>
                <TableHead>產品總量 (Total Stock)</TableHead>
                <TableHead>到期日 / 狀態</TableHead>
                <TableHead className="text-right pr-8">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="h-40 text-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></TableCell></TableRow>
              ) : filteredBatches.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="h-40 text-center text-muted-foreground italic">無符合項目。</TableCell></TableRow>
              ) : (
                filteredBatches.map((b, idx) => {
                  const urgency = getUrgencyData(b.expiryDate);
                  return (
                    <TableRow key={idx} className="group hover:bg-muted/10 transition-colors">
                      <TableCell className="pl-8 py-5">
                        <div className="space-y-0.5">
                          <p className="font-bold text-sm leading-tight">{b.productName}</p>
                          <Badge variant="outline" className="text-[8px] font-black h-4 border-indigo-200 text-indigo-600 bg-indigo-50">BATCH: {b.batchId}</Badge>
                        </div>
                      </TableCell>
                      <TableCell><div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground"><MapPin className="h-3 w-3 text-primary" />{getLocName(b.locationId)}</div></TableCell>
                      <TableCell className="font-black text-sm text-orange-600">{b.quantity} <span className="text-[10px] font-normal text-muted-foreground">units</span></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-sm">{b.totalProductStock}</span>
                          {b.totalProductStock !== b.quantity && <Info className="h-3 w-3 text-blue-500" />}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="text-xs font-mono font-bold">{b.expiryDate}</p>
                          <Badge className={cn("border-none font-black text-[9px] uppercase px-2 py-0.5", urgency.color)}>{urgency.label}</Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <Button size="sm" variant="ghost" className="h-9 rounded-xl font-black gap-1.5 text-primary hover:bg-primary/10" onClick={() => handleOpenAiStrategy(b)}><Zap className="h-3.5 w-3.5" /> AI 建議</Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isAiDialogOpend} onOpenChange={setIsAiDialogOpened}>
        <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="bg-primary p-8 text-primary-foreground">
            <DialogTitle className="text-2xl font-black font-headline">批次清貨策略建議</DialogTitle>
            <DialogDescription className="text-primary-foreground/80 font-medium">針對批次 {selectedBatchData?.batchId} 之去化建議。</DialogDescription>
          </DialogHeader>
          <div className="p-8 space-y-6">
            {isAiLoading ? <div className="py-12 flex flex-col items-center justify-center space-y-4"><Loader2 className="h-10 w-10 animate-spin text-primary" /><p className="text-sm font-bold text-muted-foreground">正在精算策略...</p></div> : aiResult ? (
              <div className="space-y-6 animate-in fade-in duration-500">
                <div className="bg-white p-6 rounded-3xl border border-primary/10 shadow-sm flex justify-between items-center">
                  <div className="space-y-1"><p className="text-[10px] font-black text-muted-foreground uppercase">建議折扣</p><h3 className="text-4xl font-black text-orange-600">{aiResult.suggestedDiscount}% OFF</h3></div>
                  <Percent className="h-10 w-10 text-orange-200" />
                </div>
                <div className="space-y-2"><Label className="text-xs font-black uppercase text-muted-foreground">活動名稱</Label><p className="font-bold text-lg p-4 bg-muted/20 rounded-2xl">{aiResult.strategyTitle}</p></div>
                <div className="space-y-2"><Label className="text-xs font-black uppercase text-muted-foreground">策略說明</Label><p className="text-xs text-muted-foreground leading-relaxed italic bg-white p-4 rounded-2xl border border-dashed">"{aiResult.rationale}"</p></div>
              </div>
            ) : null}
          </div>
          <DialogFooter className="p-8 bg-muted/10 border-t flex gap-3"><Button variant="ghost" className="flex-1 h-12 rounded-xl font-bold" onClick={() => setIsAiDialogOpened(false)}>取消</Button><Button className="flex-[2] bg-primary text-primary-foreground font-black h-12 rounded-xl shadow-lg gap-2" onClick={() => setIsAiDialogOpened(false)} disabled={isAiLoading || !aiResult}><Zap className="h-4 w-4 fill-current" /> 立即採納</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
