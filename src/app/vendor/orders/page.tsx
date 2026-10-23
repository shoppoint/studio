
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { 
  Search, 
  Filter, 
  Eye, 
  Truck, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  MoreVertical,
  Download,
  Loader2,
  Package,
  Calendar,
  ShieldCheck
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useI18n } from "@/lib/i18n/i18n-context";
import { useUser, useFirestore, useCollection } from "@/firebase";
import { collection, query, where, orderBy, limit } from "firebase/firestore";
import { format } from "date-fns";

export default function VendorOrders() {
  const { t, lang } = useI18n();
  const db = useFirestore();
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState("");

  // 1. 查找賣家商店 ID
  const vendorQuery = useMemo(() => user ? query(
    collection(db, 'vendors'), 
    where('linkedUserId', '==', user.uid),
    limit(1)
  ) : null, [db, user]);
  const { data: vendorList } = useCollection<any>(vendorQuery);
  const vendorId = vendorList?.[0]?.id;
  const vendorName = vendorList?.[0]?.name;

  // 2. 獲取所有訂單 (MVP: 過濾包含該賣家產品的訂單)
  const ordersQuery = useMemo(() => query(
    collection(db, 'orders'),
    orderBy('createdAt', 'desc'),
    limit(100)
  ), [db]);
  const { data: allOrders, loading } = useCollection<any>(ordersQuery);

  const vendorOrders = useMemo(() => {
    if (!allOrders || !vendorId) return [];
    return allOrders.filter(order => 
      order.items?.some((item: any) => item.vendorId === vendorId || item.brand === vendorName)
    ).filter(order => order.id.toLowerCase().includes(searchQuery.toLowerCase()) || (order.orderId || "").includes(searchQuery));
  }, [allOrders, vendorId, vendorName, searchQuery]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered': return <Badge className="bg-green-100 text-green-800 border-green-200 h-6 px-3 rounded-lg border-none text-[10px] font-bold"><CheckCircle2 className="mr-1 h-3 w-3" /> 已送達</Badge>;
      case 'shipped': return <Badge className="bg-blue-100 text-blue-800 border-blue-200 h-6 px-3 rounded-lg border-none text-[10px] font-bold"><Truck className="mr-1 h-3 w-3" /> 已發貨</Badge>;
      case 'processing': return <Badge className="bg-orange-100 text-orange-800 border-orange-200 h-6 px-3 rounded-lg border-none text-[10px] font-bold"><Clock className="mr-1 h-3 w-3" /> 處理中</Badge>;
      default: return <Badge variant="outline" className="h-6 px-3 rounded-lg text-[10px] font-bold"><AlertCircle className="mr-1 h-3 w-3" /> 待處理</Badge>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black font-headline tracking-tight">訂單管理中心</h1>
          <p className="text-muted-foreground">追蹤銷售、準備配貨並將貨品送往集運中心。</p>
        </div>
        <Button variant="outline" className="rounded-xl h-11 px-6 font-bold gap-2">
          <Download className="h-4 w-4" /> 匯出備貨報表
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">待處理訂單</p>
            <h3 className="text-3xl font-black text-orange-600">{loading ? "..." : vendorOrders.filter(o => o.fulfillmentStatus === 'pending' || o.fulfillmentStatus === 'processing').length}</h3>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden border-l-4 border-primary">
          <CardContent className="p-6">
            <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">已成交總數</p>
            <h3 className="text-3xl font-black">{loading ? "..." : vendorOrders.filter(o => o.paymentStatus === 'paid').length}</h3>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm bg-blue-50 border-l-4 border-blue-500 rounded-3xl">
        <CardContent className="p-4 flex items-start gap-4">
          <ShieldCheck className="h-6 w-6 text-blue-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="text-sm font-bold text-blue-900">個資保護提示</p>
            <p className="text-xs text-blue-800 leading-relaxed opacity-80">
              根據平台隱私政策，賣家端僅能查閱訂單中的「產品項目」及「配送狀態」。顧客地址及電話已由平台集運中心加密處理，請將備妥的貨品寄往指定的物流收貨點。
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm overflow-hidden bg-white rounded-3xl">
        <CardHeader className="bg-muted/5 border-b p-6">
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="搜尋單號或產品..." 
              className="pl-10 h-11 bg-white border-none shadow-inner rounded-xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-24 text-center"><Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" /></div>
          ) : vendorOrders.length === 0 ? (
            <div className="py-24 text-center flex flex-col items-center gap-4 text-muted-foreground">
              <Package className="h-12 w-12 opacity-20" />
              <p className="italic">目前沒有銷售訂單紀錄。</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/5">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-8">訂單編號</TableHead>
                  <TableHead>日期</TableHead>
                  <TableHead>您的產品項</TableHead>
                  <TableHead>狀態</TableHead>
                  <TableHead className="text-right pr-8">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {vendorOrders.map((order) => (
                  <TableRow key={order.id} className="group hover:bg-muted/30 transition-colors">
                    <TableCell className="pl-8 py-5">
                      <span className="font-black text-sm">{order.orderId || order.id.split('-').pop()}</span>
                    </TableCell>
                    <TableCell className="text-[10px] text-muted-foreground font-bold uppercase">
                      <div className="flex items-center gap-1.5"><Calendar className="h-3 w-3" /> {order.createdAt?.seconds ? format(new Date(order.createdAt.seconds * 1000), 'yyyy-MM-dd HH:mm') : '--'}</div>
                    </TableCell>
                    <TableCell>
                      <div className="flex -space-x-2">
                        {order.items?.filter((it: any) => it.vendorId === vendorId || it.brand === vendorName).slice(0, 3).map((it: any, i: number) => (
                          <div key={i} className="h-8 w-8 rounded-lg border-2 border-white bg-muted overflow-hidden shadow-sm" title={it.name}>
                            {it.image ? (
                              <img src={it.image} className="object-cover w-full h-full" alt="" />
                            ) : (
                              <div className="h-full w-full bg-slate-200" />
                            )}
                          </div>
                        ))}
                        {order.items?.length > 3 && <div className="h-8 w-8 rounded-lg border-2 border-white bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary">+{order.items.length - 3}</div>}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(order.fulfillmentStatus || 'pending')}</TableCell>
                    <TableCell className="text-right pr-8">
                      <Button variant="ghost" size="icon" className="rounded-full" asChild>
                        <Link href={`/vendor/orders/${order.id}`}>
                          <Eye className="h-4 w-4 text-primary" />
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
