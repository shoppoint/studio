"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  BarChart3, 
  TrendingUp, 
  ShoppingCart, 
  DollarSign, 
  Loader2, 
  Calendar,
  Zap,
  ArrowUpRight,
  RefreshCcw,
  ShoppingBag,
  History,
  Info,
  CheckCircle2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getProductSalesStatsAction } from "@/app/actions/order-actions";
import { cn } from "@/lib/utils";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import { Separator } from "@/components/ui/separator";

/**
 * 產品詳情 - 銷售統計分析分頁 (加固反饋版)
 */
export function ProductSalesTab({ productId }: { productId: string }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);

  const fetchStats = useCallback(async () => {
    if (!productId || productId === 'new') {
      setLoading(false);
      return;
    }
    
    // 強制重置數據與顯示 Loading，讓用戶感覺到「刷新」動作
    setLoading(true);
    setStats(null);
    
    try {
      const res = await getProductSalesStatsAction(productId);
      if (res.success) {
        setStats(res.stats);
      }
    } catch (e) {
      console.error("[Sales Tab] Fetch error:", e);
    } finally {
      // 即使請求極快，也給予 300ms 緩衝以防介面閃爍太快
      setTimeout(() => setLoading(false), 300);
    }
  }, [productId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (productId === 'new') {
    return (
      <div className="py-20 text-center space-y-4 animate-in fade-in">
        <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto">
          <BarChart3 className="h-8 w-8 text-muted-foreground/30" />
        </div>
        <p className="text-muted-foreground font-bold italic">新產品尚未有銷售數據。儲存後即可開始追蹤。</p>
      </div>
    );
  }

  if (loading && !stats) {
    return (
      <div className="h-64 flex flex-col items-center justify-center gap-4 animate-in fade-in">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">正在掃描資料庫中...</p>
      </div>
    );
  }

  const cards = [
    { label: "總銷售量 (Total)", value: stats?.totalQty || 0, icon: ShoppingBag, color: "text-primary", bg: "bg-primary/5" },
    { label: "本月銷量 (30D)", value: stats?.monthQty || 0, icon: Calendar, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "本週銷量 (7D)", value: stats?.weekQty || 0, icon: Zap, color: "text-orange-600", bg: "bg-orange-50" },
    { label: "累計貢獻營收", value: `$${(stats?.totalRevenue || 0).toLocaleString()}`, icon: DollarSign, color: "text-green-600", bg: "bg-green-50" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between px-2">
        <div className="space-y-1">
          <h3 className="text-xl font-black flex items-center gap-3">
            <TrendingUp className="h-6 w-6 text-primary" />
            產品銷量動態分析
          </h3>
          <p className="text-xs text-muted-foreground">基於最近 1,000 筆訂單的實時彙總數據。</p>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          className="rounded-xl font-bold h-9 bg-white shadow-sm hover:bg-slate-50 transition-all gap-2" 
          onClick={fetchStats}
          disabled={loading}
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCcw className="h-3.5 w-3.5" />}
          刷新統計
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {cards.map((card, i) => (
          <Card key={i} className="border-none shadow-sm rounded-2xl bg-white overflow-hidden">
            <CardContent className="p-6">
              <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center mb-4 shadow-inner", card.bg, card.color)}>
                <card.icon className="h-5 w-5" />
              </div>
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-1">{card.label}</p>
              <h3 className="text-2xl font-black text-slate-800">{card.value}</h3>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <Card className="lg:col-span-8 border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden border-t-8 border-primary">
          <CardHeader className="p-8 border-b">
            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              近 30 天銷量趨勢圖
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[350px] p-8">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats?.trendData || []}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                  interval={4}
                />
                <YAxis fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#FACC15" 
                  strokeWidth={4} 
                  dot={{ r: 4, fill: "#FACC15", strokeWidth: 2, stroke: "#fff" }} 
                  activeDot={{ r: 6, strokeWidth: 0 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="lg:col-span-4 space-y-6">
          <Card className="border-none shadow-sm rounded-3xl bg-slate-900 text-white overflow-hidden">
            <CardHeader className="bg-white/5 border-b py-5 px-6">
               <CardTitle className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                 <Info className="h-4 w-4" /> 營運洞察
               </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
               <div className="space-y-4">
                 <div className="flex items-start gap-3">
                   <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                     <TrendingUp className="h-3.5 w-3.5 text-primary" />
                   </div>
                   <p className="text-xs leading-relaxed text-slate-300">
                     本產品在過去 7 天內共售出 <b>{stats?.weekQty || 0}</b> 件。若此趨勢持續，建議維持至少 <b>{Math.ceil((stats?.weekQty || 0) * 2)}</b> 件的安全庫存量。
                   </p>
                 </div>
                 
                 <Separator className="bg-white/10" />
                 
                 <div className="flex items-start gap-3">
                   <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                     <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                   </div>
                   <p className="text-xs leading-relaxed text-slate-300">
                     該項目的平均客單貢獻為 <b>${(stats?.totalQty > 0 ? stats.totalRevenue / stats.totalQty : 0).toFixed(1)}</b>，屬於穩定成交型產品。
                   </p>
                 </div>
               </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
