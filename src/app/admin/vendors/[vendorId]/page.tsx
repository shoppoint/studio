"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  Store, 
  DollarSign, 
  Package,
  TrendingUp,
  Printer,
  ChevronRight,
  ShoppingCart,
  Eye,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useI18n } from "@/lib/i18n/i18n-context";
import { useFirestore, useDoc, useCollection } from "@/firebase";
import { doc, collection, query, where, orderBy, limit } from "firebase/firestore";
import { format, startOfDay, endOfDay, isWithinInterval, parseISO } from "date-fns";
import { generateVendorPayoutInvoiceHtml } from "@/lib/print-templates";
import { ScrollArea } from "@/components/ui/scroll-area";
import { VendorFormContainer } from "@/components/admin/vendors/VendorFormContainer";
import { Separator } from "@/components/ui/separator";

export default function AdminEditVendorPage() {
  const params = useParams();
  const router = useRouter();
  const { lang } = useI18n();
  const db = useFirestore();
  const vendorId = params.vendorId as string;

  const [activeTab, setActiveTab] = useState("profile");
  const [reportStart, setReportStart] = useState(format(new Date(), "yyyy-MM-01"));
  const [reportEnd, setReportEnd] = useState(format(new Date(), "yyyy-MM-dd"));

  // 1. 獲取商店資料
  const vendorRef = useMemo(() => {
    if (!db || !vendorId) return null;
    return doc(db, 'vendors', vendorId);
  }, [db, vendorId]);
  const { data: vendorData, loading: dataLoading } = useDoc<any>(vendorRef);

  // 2. 獲取該賣家的產品
  const productsQuery = useMemo(() => {
    if (!db || !vendorId) return null;
    return query(collection(db, 'public_products'), where('vendorId', '==', vendorId));
  }, [db, vendorId]);
  const { data: vendorProducts, loading: productsLoading } = useCollection<any>(productsQuery);

  // 3. 獲取大宗訂單數據用於對帳
  const ordersQuery = useMemo(() => db ? query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(1000)) : null, [db]);
  const { data: allOrders, loading: ordersLoading } = useCollection<any>(ordersQuery);

  const reconciliation = useMemo(() => {
    if (!allOrders || !vendorData || !vendorProducts) return { gross: 0, commission: 0, net: 0, items: [] };
    const start = startOfDay(parseISO(reportStart));
    const end = endOfDay(parseISO(reportEnd));
    const vendorProdIds = new Set(vendorProducts.map(p => p.id));
    
    let gross = 0;
    const vendorItems: any[] = [];

    allOrders.filter(o => {
      if (!o.createdAt?.seconds || o.status === 'cancelled' || o.paymentStatus !== 'paid') return false;
      const oDate = new Date(o.createdAt.seconds * 1000);
      return isWithinInterval(oDate, { start, end });
    }).forEach(order => {
      (order.items || []).forEach((it: any) => {
        if (it.vendorId === vendorId || vendorProdIds.has(it.productId) || vendorProdIds.has(it.id)) {
          const itemGross = (Number(it.price) || 0) * (Number(it.qty) || 1);
          gross += itemGross;
          vendorItems.push({
            id: order.orderId || order.id,
            date: format(new Date(order.createdAt.seconds * 1000), 'yyyy-MM-dd'),
            productName: it.name,
            qty: it.qty,
            price: Number(it.price),
            lineTotal: itemGross
          });
        }
      });
    });

    const commRate = Number(vendorData?.commission || 10);
    const commission = gross * (commRate / 100);
    return { gross, commission, net: gross - commission, items: vendorItems, commRate };
  }, [allOrders, vendorData, vendorId, vendorProducts, reportStart, reportEnd]);

  const handlePrintPayout = () => {
    const html = generateVendorPayoutInvoiceHtml({
      vendorName: vendorData.name,
      vendorId: vendorId,
      dateRange: `${reportStart} ~ ${reportEnd}`,
      gross: reconciliation.gross,
      commissionRate: reconciliation.commRate,
      commissionAmount: reconciliation.commission,
      net: reconciliation.net,
      bankName: vendorData.bankName,
      bankAccountNo: vendorData.bankAccountNo,
      bankAccountName: vendorData.bankAccountName,
      items: reconciliation.items
    });
    const win = window.open('', '_blank', 'width=1000,height=900');
    if (win) { win.document.write(html); win.document.close(); }
  };

  if (dataLoading) return <div className="h-96 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-6xl auto space-y-8 pb-24">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full"><ArrowLeft className="h-5 w-5" /></Button>
        <div>
          <h1 className="text-3xl font-black font-headline tracking-tighter">合作商店深度管理</h1>
          <p className="text-muted-foreground text-xs font-mono">Vendor: {vendorData?.name} ({vendorId})</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-muted/50 p-1 h-12 rounded-2xl w-full sm:w-auto grid grid-cols-3 mb-8 border">
          <TabsTrigger value="profile" className="rounded-xl px-8 font-bold gap-2"><Store className="h-4 w-4" /> 商家檔案</TabsTrigger>
          <TabsTrigger value="catalog" className="rounded-xl px-8 font-bold gap-2"><Package className="h-4 w-4" /> 產品目錄</TabsTrigger>
          <TabsTrigger value="finance" className="rounded-xl px-8 font-bold gap-2"><DollarSign className="h-4 w-4" /> 營收結算</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="animate-in fade-in">
          <VendorFormContainer mode="edit" vendorId={vendorId} initialData={vendorData} />
        </TabsContent>

        <TabsContent value="catalog" className="animate-in fade-in">
          <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
            <CardHeader className="border-b bg-muted/5 p-6 flex flex-row items-center justify-between">
               <div className="space-y-1">
                 <CardTitle className="text-lg flex items-center gap-2"><Package className="h-5 w-5 text-primary" /> 產品清單</CardTitle>
                 <CardDescription>管理此商家旗下的所有上架產品。</CardDescription>
               </div>
               <Badge className="bg-primary text-primary-foreground font-black h-8 px-4 text-sm">{vendorProducts?.length || 0} SKUs</Badge>
            </CardHeader>
            <CardContent className="p-0">
               {productsLoading ? <div className="py-20 text-center"><Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" /></div> : (
                 <Table>
                   <TableHeader className="bg-muted/5">
                     <TableRow>
                       <TableHead className="pl-8">產品名稱 / SKU</TableHead>
                       <TableHead>價格</TableHead>
                       <TableHead>總庫存</TableHead>
                       <TableHead>狀態</TableHead>
                       <TableHead className="text-right pr-8">操作</TableHead>
                     </TableRow>
                   </TableHeader>
                   <TableBody>
                     {vendorProducts?.map((p: any) => (
                       <TableRow key={p.id} className="group hover:bg-muted/30 transition-colors">
                         <TableCell className="pl-8 py-4">
                           <div className="flex items-center gap-4">
                             <div className="h-10 w-10 rounded-lg bg-muted overflow-hidden shrink-0 border">
                               {p.imageUrl ? <img src={p.imageUrl} className="object-cover h-full w-full" /> : <Package className="h-4 w-4 m-3 opacity-20" />}
                             </div>
                             <div className="min-w-0">
                               <p className="font-bold text-sm truncate">{p.productName_zh || p.productName_en}</p>
                               <p className="text-[10px] text-muted-foreground font-mono">{p.sku || 'NO-SKU'}</p>
                             </div>
                           </div>
                         </TableCell>
                         <TableCell className="font-black text-primary">${p.salePrice > 0 ? p.salePrice : p.price}</TableCell>
                         <TableCell className="text-xs font-bold">{p.stock || 0} units</TableCell>
                         <TableCell><Badge variant={p.status === 'Active' ? 'default' : 'secondary'} className="text-[9px] font-black uppercase">{p.status}</Badge></TableCell>
                         <TableCell className="text-right pr-8">
                           <Button variant="ghost" size="icon" className="rounded-full" asChild>
                             <Link href={`/admin/products/${p.id}`}><Eye className="h-4 w-4" /></Link>
                           </Button>
                         </TableCell>
                       </TableRow>
                     ))}
                   </TableBody>
                 </Table>
               )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="finance" className="space-y-8 animate-in fade-in">
           <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
             <CardHeader className="bg-muted/5 border-b p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="space-y-1">
                  <CardTitle className="text-xl font-black flex items-center gap-3"><TrendingUp className="h-6 w-6 text-primary" /> 銷售結算審計</CardTitle>
                  <CardDescription>選擇日期區間以計算該時段內此商家的應付佣金與實收。</CardDescription>
                </div>
                <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border">
                  <Input type="date" value={reportStart} onChange={e => setReportStart(e.target.value)} className="h-10 border-none bg-muted/20 font-bold" />
                  <span className="font-black opacity-20">~</span>
                  <Input type="date" value={reportEnd} onChange={e => setReportEnd(e.target.value)} className="h-10 border-none bg-muted/20 font-bold" />
                </div>
             </CardHeader>
             <CardContent className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                   <div className="p-6 bg-muted/10 rounded-[2rem] text-center space-y-1">
                     <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">總銷售額 (Gross)</p>
                     <p className="text-3xl font-black text-slate-800">${reconciliation.gross.toLocaleString()}</p>
                   </div>
                   <div className="p-6 bg-red-50 rounded-[2rem] border border-red-100 text-center space-y-1">
                     <p className="text-[10px] font-black uppercase text-red-600 tracking-widest">平台抽佣 ({reconciliation.commRate}%)</p>
                     <p className="text-3xl font-black text-red-600">-${reconciliation.commission.toLocaleString()}</p>
                   </div>
                   <div className="p-6 bg-primary/10 border-2 border-primary/20 rounded-[2rem] text-center space-y-1 relative overflow-hidden">
                     <div className="absolute top-0 right-0 p-4 opacity-10"><Zap className="h-16 w-16 fill-current" /></div>
                     <p className="text-[10px] font-black uppercase text-primary tracking-widest">應付商家 (Net Payout)</p>
                     <p className="text-4xl font-black text-primary">${reconciliation.net.toLocaleString()}</p>
                   </div>
                </div>
                <div className="flex justify-between items-center mb-6 px-2">
                  <h4 className="text-sm font-black uppercase text-muted-foreground flex items-center gap-2"><ShoppingCart className="h-4 w-4" /> 關聯訂單明細 ({reconciliation.items.length})</h4>
                  <Button className="rounded-xl h-11 bg-slate-900 text-white font-black gap-2 px-8 shadow-lg" onClick={handlePrintPayout} disabled={reconciliation.items.length === 0}>
                    <Printer className="h-4 w-4" /> 生成商家結算單
                  </Button>
                </div>
                <ScrollArea className="h-[400px] border rounded-2xl">
                  <Table>
                    <TableHeader className="bg-muted/5">
                      <TableRow><TableHead className="pl-6 text-[10px] font-black">單號</TableHead><TableHead className="text-[10px] font-black">產品項目</TableHead><TableHead className="text-center text-[10px] font-black">數量</TableHead><TableHead className="text-right pr-6 text-[10px] font-black">成交金額</TableHead></TableRow>
                    </TableHeader>
                    <TableBody>
                      {reconciliation.items.map((it:any, idx:number) => (
                        <TableRow key={idx} className="border-dashed"><TableCell className="pl-6 py-4 font-mono text-[11px]">#{it.id}</TableCell><TableCell className="font-bold text-xs">{it.productName}</TableCell><TableCell className="text-center font-black">x{it.qty}</TableCell><TableCell className="text-right pr-6 font-bold text-primary">${it.lineTotal.toFixed(1)}</TableCell></TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
             </CardContent>
           </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
