"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { 
  ShoppingCart, 
  Search, 
  Plus, 
  Filter, 
  Eye, 
  Globe, 
  Monitor, 
  User, 
  Loader2, 
  Calendar, 
  Clock,
  CheckCircle2,
  FileBarChart,
  ChevronLeft,
  ChevronRight,
  Package,
  X,
  RotateCcw,
  Info,
  Archive,
  CheckCheck,
  MapPin,
  ShoppingBag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useI18n } from "@/lib/i18n/i18n-context";
import { useFirestore, useCollection } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { format, startOfDay, endOfDay, parseISO } from "date-fns";
import { AccountingReportDialog } from "@/components/admin/orders/AccountingReportDialog";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function AdminOrders() {
  const { t, lang } = useI18n();
  const db = useFirestore();
  const ordT = t.admin.orders;
  
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceTab, setSourceTab] = useState("all"); 
  const [fulfillmentFilter, setFulfillmentFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  
  // 日期篩選狀態
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");

  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // 監聽訂單集合
  const ordersQuery = useMemo(() => {
    if (!db) return null;
    return query(
      collection(db, 'orders'),
      orderBy('createdAt', 'desc')
    );
  }, [db]);

  const { data: orders, loading } = useCollection<any>(ordersQuery);

  // 篩選與排序邏輯
  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    return orders.filter(o => {
      const search = searchQuery.toLowerCase().trim();
      const matchesSearch = !search || 
        String(o.orderId || o.id).toLowerCase().includes(search) || 
        String(o.customerInfo?.name || "").toLowerCase().includes(search) ||
        String(o.customerInfo?.phone || "").includes(search);
      
      let matchesSource = true;
      if (sourceTab === 'Web') matchesSource = o.sourceType === 'Web';
      else if (sourceTab === 'POS') matchesSource = o.sourceType === 'POS';
      else if (sourceTab === 'Manual') matchesSource = o.sourceType === 'Manual';

      let matchesFulfillment = fulfillmentFilter === 'all' || (o.fulfillmentStatus || 'pending') === fulfillmentFilter;
      let matchesPayment = paymentFilter === 'all' || (o.paymentStatus || 'unpaid') === paymentFilter;
      
      // 日期範圍篩選
      let matchesDate = true;
      if (o.createdAt?.seconds) {
        const oDate = new Date(o.createdAt.seconds * 1000);
        if (dateStart) {
          matchesDate = matchesDate && oDate >= startOfDay(parseISO(dateStart));
        }
        if (dateEnd) {
          matchesDate = matchesDate && oDate <= endOfDay(parseISO(dateEnd));
        }
      }
      
      return matchesSearch && matchesSource && matchesFulfillment && matchesPayment && matchesDate;
    });
  }, [orders, searchQuery, sourceTab, fulfillmentFilter, paymentFilter, dateStart, dateEnd]);

  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredOrders.slice(start, start + itemsPerPage);
  }, [filteredOrders, currentPage]);

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  const resetFilters = () => {
    setFulfillmentFilter("all");
    setPaymentFilter("all");
    setSourceTab("all");
    setSearchQuery("");
    setDateStart("");
    setDateEnd("");
    setCurrentPage(1);
  };

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'Web':
        return <span className="text-[10px] font-black text-blue-500 ml-2">Web</span>;
      case 'POS':
        return <span className="text-[10px] font-black text-purple-600 ml-2">POS</span>;
      case 'Manual':
        return <span className="text-[10px] font-black text-amber-600 ml-2">Manual</span>;
      default:
        return <span className="text-[10px] font-black text-muted-foreground ml-2">{source}</span>;
    }
  };

  const getPaymentBadge = (status: string) => {
    const s = String(status || 'unpaid').toLowerCase();
    if (s === 'paid') {
      return <Badge className="bg-green-100 text-green-700 border-none px-4 h-7 rounded-full font-bold text-xs">Paid</Badge>;
    }
    if (s === 'pending') {
      return <Badge className="bg-amber-100 text-amber-700 border-none px-4 h-7 rounded-full font-bold text-xs">Pending</Badge>;
    }
    return <Badge variant="outline" className="border-red-200 text-red-600 bg-red-50 px-4 h-7 rounded-full font-bold text-xs uppercase">{s}</Badge>;
  };

  const getFulfillmentBadge = (status: string) => {
    const s = String(status || 'pending').toLowerCase();
    switch (s) {
      case 'completed':
        return <Badge className="bg-slate-900 text-white border-none px-4 h-7 rounded-full font-bold text-xs flex items-center gap-1.5 shadow-sm"><CheckCheck className="h-3 w-3" /> 已完成</Badge>;
      case 'delivered':
        return <Badge className="bg-green-600 text-white border-none px-4 h-7 rounded-full font-bold text-xs flex items-center gap-1.5 shadow-sm"><CheckCircle2 className="h-3 w-3" /> 已送達</Badge>;
      case 'picked_up':
        return <Badge className="bg-green-600 text-white border-none px-4 h-7 rounded-full font-bold text-xs flex items-center gap-1.5 shadow-sm"><ShoppingBag className="h-3 w-3" /> 已取貨</Badge>;
      case 'shipped':
        return <Badge className="bg-purple-600 text-white border-none px-4 h-7 rounded-full font-bold text-xs flex items-center gap-1.5 shadow-sm"><Package className="h-3 w-3" /> 已發貨</Badge>;
      case 'ready_pickup':
        return <Badge className="bg-indigo-600 text-white border-none px-4 h-7 rounded-full font-bold text-xs flex items-center gap-1.5 shadow-sm"><MapPin className="h-3 w-3" /> 待取貨</Badge>;
      case 'reserved':
        return <Badge className="bg-orange-500 text-white border-none px-4 h-7 rounded-full font-bold text-xs flex items-center gap-1.5 shadow-sm"><Archive className="h-3 w-3" /> 已留貨</Badge>;
      case 'processing':
        return <Badge className="bg-amber-100 text-amber-700 border-none px-4 h-7 rounded-full font-bold text-xs flex items-center gap-1.5 shadow-sm"><Clock className="h-3 w-3" /> 處理中</Badge>;
      case 'cancelled':
        return <Badge variant="destructive" className="px-4 h-7 rounded-full font-bold text-xs flex items-center gap-1.5 uppercase">Cancelled</Badge>;
      default:
        return <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-500 px-4 h-7 rounded-full font-bold text-xs flex items-center gap-1.5"><Clock className="h-3 w-3" /> 待處理</Badge>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* 頂部標題與功能按鈕 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black font-headline tracking-tighter text-slate-900">訂單管理</h1>
          <p className="text-muted-foreground font-medium">追蹤、管理及執行平台銷售訂單。</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="rounded-xl h-12 px-6 font-bold border-indigo-100 text-indigo-700 bg-indigo-50/30 gap-2" onClick={() => setIsReportOpen(true)}>
            <FileBarChart className="h-4 w-4" /> 會計對帳
          </Button>
          
          <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="rounded-xl h-12 px-6 font-bold border-muted-foreground/10 bg-white gap-2">
                <Filter className="h-4 w-4" /> 篩選
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[85dvh] bottom-16 rounded-t-[2.5rem] border-none p-0 flex flex-col z-[90]">
              <SheetHeader className="p-8 bg-muted/5 border-b shrink-0 text-left">
                <SheetTitle className="text-2xl font-black font-headline flex items-center gap-3">
                  <Filter className="h-6 w-6 text-primary" /> 進階篩選訂單
                </SheetTitle>
                <SheetDescription>根據訂單狀態、付款情況與日期範圍縮小搜尋。下拉選單已被優化至最高層級。</SheetDescription>
              </SheetHeader>
              
              <div className="flex-1 p-8 space-y-8 overflow-y-auto no-scrollbar">
                {/* 日期篩選區塊 */}
                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">日期範圍 (Order Date)</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        type="date" 
                        value={dateStart} 
                        onChange={(e) => setDateStart(e.target.value)} 
                        className="pl-10 h-12 bg-muted/20 border-none rounded-xl font-bold" 
                      />
                    </div>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        type="date" 
                        value={dateEnd} 
                        onChange={(e) => setDateEnd(e.target.value)} 
                        className="pl-10 h-12 bg-muted/20 border-none rounded-xl font-bold" 
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">出貨進度 (Fulfillment)</Label>
                  <Select value={fulfillmentFilter} onValueChange={setFulfillmentFilter}>
                    <SelectTrigger className="h-12 rounded-xl bg-muted/20 border-none font-bold">
                      <SelectValue placeholder="所有狀態" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-2xl">
                      <SelectItem value="all">所有狀態 (All)</SelectItem>
                      {Object.entries(ordT.status).map(([key, label]: [string, any]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">付款狀態 (Payment)</Label>
                  <Select value={paymentFilter} onValueChange={setPaymentFilter}>
                    <SelectTrigger className="h-12 rounded-xl bg-muted/20 border-none font-bold">
                      <SelectValue placeholder="所有狀態" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-2xl">
                      <SelectItem value="all">所有狀態 (All)</SelectItem>
                      <SelectItem value="paid">已付款 (Paid)</SelectItem>
                      <SelectItem value="pending">待核實 (Pending)</SelectItem>
                      <SelectItem value="unpaid">未付款 (Unpaid)</SelectItem>
                      <SelectItem value="refunded">已退款 (Refunded)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <SheetFooter className="p-8 bg-muted/5 border-t mt-auto flex flex-col gap-3 pb-safe">
                <Button variant="ghost" className="w-full rounded-xl font-bold h-12 gap-2" onClick={resetFilters}>
                  <RotateCcw className="h-4 w-4" /> 重置所有篩選
                </Button>
                <Button className="w-full rounded-xl h-14 font-black bg-primary text-primary-foreground shadow-lg" onClick={() => setIsFilterSheetOpen(false)}>
                  顯示 {filteredOrders.length} 筆結果
                </Button>
              </SheetFooter>
            </SheetContent>
          </Sheet>

          <Button className="bg-[#E9D775] hover:bg-[#D9C665] text-black font-black shadow-lg h-12 px-8 rounded-xl gap-2" asChild>
            <Link href="/admin/orders/new">
              <Plus className="h-5 w-5" /> 新增手動訂單
            </Link>
          </Button>
        </div>
      </div>

      {/* 篩選分頁與搜尋欄 */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex bg-muted/40 p-1.5 rounded-2xl gap-1 border border-white shadow-sm overflow-x-auto no-scrollbar max-sm:w-full">
          {[
            { id: 'all', label: '全部', icon: null },
            { id: 'Web', label: '網店', icon: Globe },
            { id: 'POS', label: '門市', icon: Monitor },
            { id: 'Manual', label: '手動', icon: User },
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={sourceTab === tab.id ? "default" : "ghost"}
              size="sm"
              className={cn(
                "rounded-xl h-10 px-6 font-black text-xs uppercase tracking-widest gap-2 transition-all",
                sourceTab === tab.id ? "bg-white text-black shadow-md" : "text-muted-foreground hover:bg-white/50"
              )}
              onClick={() => { setSourceTab(tab.id); setCurrentPage(1); }}
            >
              {tab.icon && <tab.icon className="h-3.5 w-3.5" />}
              {tab.label}
            </Button>
          ))}
        </div>

        <div className="relative w-full md:w-[400px]">
          <Search className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="搜尋單號或顧客..." 
            className="pl-11 h-12 bg-white border-none shadow-sm rounded-2xl text-sm font-medium" 
            value={searchQuery} 
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} 
          />
        </div>
      </div>

      {/* 訂單列表 */}
      <Card className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="py-24 text-center"><Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" /></div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/5">
                <TableRow className="hover:bg-transparent h-14">
                  <TableHead className="pl-10 font-bold text-slate-500 uppercase text-[11px] tracking-widest">單號 / 來源</TableHead>
                  <TableHead className="font-bold text-slate-500 uppercase text-[11px] tracking-widest text-center">日期</TableHead>
                  <TableHead className="font-bold text-slate-500 uppercase text-[11px] tracking-widest text-center">顧客資訊</TableHead>
                  <TableHead className="font-bold text-slate-500 uppercase text-[11px] tracking-widest text-center">付款</TableHead>
                  <TableHead className="font-bold text-slate-500 uppercase text-[11px] tracking-widest text-center">物流進度</TableHead>
                  <TableHead className="font-bold text-slate-500 uppercase text-[11px] tracking-widest text-right">總額</TableHead>
                  <TableHead className="text-right pr-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-24 text-center text-muted-foreground italic">目前無符合條件的訂單。</TableCell>
                  </TableRow>
                ) : (
                  paginatedOrders.map((order) => (
                    <TableRow key={order.id} className="group hover:bg-muted/20 transition-all border-dashed">
                      <TableCell className="pl-10 py-6">
                        <div className="flex items-center">
                          <span className="font-black text-sm tracking-tight">{order.orderId || order.id}</span>
                          {getSourceBadge(order.sourceType)}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="text-[11px] text-muted-foreground font-bold">
                          {order.createdAt?.seconds ? format(new Date(order.createdAt.seconds * 1000), 'yyyy-MM-dd HH:mm') : '--'}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="inline-block text-left">
                          <p className="font-black text-sm text-slate-800">{order.customerInfo?.name || "Guest"}</p>
                          <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{order.customerInfo?.phone || "--"}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {getPaymentBadge(order.paymentStatus)}
                      </TableCell>
                      <TableCell className="text-center">
                        {getFulfillmentBadge(order.fulfillmentStatus || order.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-black text-lg text-[#E9D775] tracking-tighter">${(order.total || 0).toFixed(1)}</span>
                      </TableCell>
                      <TableCell className="text-right pr-10">
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full group-hover:bg-primary/10 transition-colors" asChild>
                          <Link href={`/admin/orders/${order.id}`}>
                            <Eye className="h-4.5 w-4.5 text-slate-600" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
        
        {totalPages > 1 && (
          <div className="p-8 border-t flex items-center justify-center gap-4 bg-muted/5">
            <Button 
              variant="outline" 
              size="sm" 
              className="rounded-xl h-10 px-4 font-bold bg-white" 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> 上一頁
            </Button>
            <div className="text-xs font-black uppercase tracking-widest text-muted-foreground">
              Page {currentPage} of {totalPages}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="rounded-xl h-10 px-4 font-bold bg-white" 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
              disabled={currentPage === totalPages}
            >
              下一頁 <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </Card>

      <AccountingReportDialog isOpen={isReportOpen} onOpenChange={setIsReportOpen} orders={orders || []} />
    </div>
  );
}
