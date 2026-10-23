"use client";

import { useState, useMemo, useEffect } from "react";
import dynamic from 'next/dynamic';
import { 
  TrendingUp, 
  Package, 
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingCart,
  DollarSign,
  ChevronRight,
  Loader2,
  Store,
  AlertTriangle,
  MessageCircle
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/i18n-context";
import { Separator } from "@/components/ui/separator";
import { useUser, useFirestore, useCollection } from "@/firebase";
import { collection, query, where, orderBy, limit } from "firebase/firestore";
import { format, subDays } from "date-fns";
import { cn } from "@/lib/utils";

// 效能優化：將圖表組件設為純客戶端載入，避免 SSR 導致的 Recharts 渲染錯誤
const VendorRevenueChart = dynamic(() => import('@/components/vendor/VendorRevenueChart'), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-muted/20 animate-pulse rounded-2xl" />
});

export default function VendorDashboard() {
  const { lang } = useI18n();
  const db = useFirestore();
  const { user } = useUser();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 1. 查找目前登入者關聯的 Vendor Profile - Guarded
  const vendorQuery = useMemo(() => (user && db) ? query(
    collection(db, 'vendors'), 
    where('linkedUserId', '==', user.uid),
    limit(1)
  ) : null, [db, user]);
  const { data: vendorList, loading: vendorLoading } = useCollection<any>(vendorQuery);
  const vendor = vendorList?.[0];
  const vendorId = vendor?.id;

  // 2. 獲取該賣家的產品 - Guarded
  const productsQuery = useMemo(() => (vendorId && db) ? query(
    collection(db, 'public_products'),
    where('vendorId', '==', vendorId)
  ) : null, [db, vendorId]);
  const { data: products, loading: productsLoading } = useCollection<any>(productsQuery);

  // 3. 獲取訂單並過濾屬於該賣家的部分 - Guarded
  const ordersQuery = useMemo(() => db ? query(
    collection(db, 'orders'),
    orderBy('createdAt', 'desc'),
    limit(100)
  ) : null, [db]);
  const { data: allOrders, loading: ordersLoading } = useCollection<any>(ordersQuery);

  const vendorOrders = useMemo(() => {
    if (!allOrders || !vendorId) return [];
    return allOrders.filter(order => 
      order.items?.some((item: any) => item.vendorId === vendorId || item.brand === vendor?.name)
    );
  }, [allOrders, vendorId, vendor?.name]);

  // 4. 計算財務指標
  const stats = useMemo(() => {
    const paidOrders = vendorOrders.filter(o => o.paymentStatus === 'paid');
    const gross = paidOrders.reduce((acc, o) => acc + (o.total || 0), 0);
    const commission = gross * 0.10;
    const net = gross - commission;

    return [
      { label: "Gross Sales", value: `$${gross.toLocaleString()}`, icon: DollarSign, trend: "+12%", trendUp: true, color: "text-blue-600" },
      { label: "Net Earnings", value: `$${net.toLocaleString(undefined, {maximumFractionDigits: 2})}`, icon: CreditCard, trend: "After 10% Fee", trendUp: true, color: "text-primary" },
      { label: "Store Products", value: (products?.length || 0).toString(), icon: Package, trend: "Active Items", trendUp: true, color: "text-orange-500" },
      { label: "Orders", value: vendorOrders.length.toString(), icon: ShoppingCart, trend: "Total Volume", trendUp: true, color: "text-purple-600" },
    ];
  }, [vendorOrders, products]);

  // 5. 趨勢圖數據生成 (最近 7 天)
  const trendData = useMemo(() => {
    const days = Array.from({ length: 7 }).map((_, i) => subDays(new Date(), 6 - i));
    return days.map(day => {
      const dayStr = format(day, "EEE");
      const dayOrders = vendorOrders.filter(o => {
        if (!o.createdAt?.seconds) return false;
        const oDate = new Date(o.createdAt.seconds * 1000);
        return format(oDate, "yyyy-MM-dd") === format(day, "yyyy-MM-dd") && o.paymentStatus === 'paid';
      });
      const gross = dayOrders.reduce((acc, o) => acc + (o.total || 0), 0);
      return { name: dayStr, gross, net: gross * 0.9 };
    });
  }, [vendorOrders]);

  const isGlobalLoading = vendorLoading || productsLoading || ordersLoading || !mounted;

  if (isGlobalLoading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">正在載入賣家數據...</p>
      </div>
    );
  }

  if (!vendor) {
    return (
      <Card className="border-none shadow-sm bg-white rounded-[2rem] p-12 text-center space-y-6">
        <Store className="h-16 w-16 text-muted-foreground/20 mx-auto" />
        <div className="space-y-2">
          <h2 className="text-2xl font-black">尚未建立商店檔案</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            您的帳號目前尚未與任何商店檔案關聯。請聯絡系統管理員為您建立對應的賣家資料。
          </p>
        </div>
        <Button asChild className="rounded-xl px-10 h-14 bg-primary text-primary-foreground font-black shadow-lg gap-2">
          <Link href="/contact">
            <MessageCircle className="h-5 w-5" /> 聯絡管理員
          </Link>
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">{vendor.name} 數據中心</h1>
          <p className="text-muted-foreground">監控實時銷售表現與產品庫存數據。</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-none shadow-sm hover:shadow-md transition-all rounded-2xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={cn("p-2 rounded-xl bg-muted/50", stat.color)}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div className={cn("flex items-center text-[10px] font-black uppercase", stat.trendUp ? 'text-green-600' : 'text-red-500')}>
                  {stat.trend}
                  {stat.trendUp ? <ArrowUpRight className="ml-1 h-3 w-3" /> : <ArrowDownRight className="ml-1 h-3 w-3" />}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                <h3 className="text-2xl font-black">{stat.value}</h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <Card className="lg:col-span-8 border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
          <CardHeader className="px-8 pt-8">
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              營收與實收趨勢 (7 Days)
            </CardTitle>
            <CardDescription>顯示過去 7 天的商店總銷售額與扣除佣金後的實際收入預計。</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px] p-8">
            <VendorRevenueChart data={trendData} />
          </CardContent>
        </Card>

        <div className="lg:col-span-4 space-y-6">
          <Card className="border-none shadow-sm bg-muted/30 rounded-3xl">
            <CardHeader><CardTitle className="text-xs font-black uppercase text-muted-foreground">結算概況</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm"><span>總成交額 (Gross)</span><span className="font-black">{stats[0].value}</span></div>
              <div className="flex justify-between text-sm text-red-500"><span>平台服務費 (10%)</span><span className="font-bold">-$--</span></div>
              <Separator className="border-dashed" />
              <div className="flex justify-between items-center"><span className="font-black text-xs uppercase">預計撥款 (Net)</span><span className="text-2xl font-black text-primary">{stats[1].value}</span></div>
              <Button variant="outline" className="w-full mt-4 text-xs font-bold rounded-xl h-11 bg-white" asChild>
                <Link href="/vendor/settings">管理結算帳戶 <ChevronRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </CardContent>
          </Card>
          
          <Card className="border-none shadow-sm bg-white rounded-3xl border-l-4 border-orange-500">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-bold flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-orange-500" />庫存提醒</CardTitle></CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground leading-relaxed">
                共有 {products?.filter(p => p.stock < 10).length || 0} 款產品庫存低於 10 件，建議及時補貨以維持銷售。
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
