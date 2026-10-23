"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { 
  Search, 
  TrendingUp, 
  BarChart3, 
  Plus, 
  X, 
  Loader2, 
  Calendar, 
  DollarSign, 
  ShoppingBag, 
  Package, 
  ArrowRight,
  Zap,
  Info,
  Layers,
  Sparkles,
  ChevronRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from "recharts";
import { useI18n } from "@/lib/i18n/i18n-context";
import { useFirestore } from "@/firebase";
import { collection, query, where, getDocs, orderBy, limit, Timestamp } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { format, subDays, startOfYear, startOfDay, endOfDay } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { unifiedSearchFilter } from "@/lib/shop-utils";

interface ProductPerformanceTabProps {
  products: any[];
}

const LINE_COLORS = ['#FACC15', '#6366F1', '#F97316', '#10B981', '#EC4899'];

/**
 * 全方位產品銷量分析中心 - 搜尋與佈局優化版
 */
export function ProductPerformanceTab({ products }: ProductPerformanceTabProps) {
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const db = useFirestore();
  const perfT = t.admin.dashboard.product_performance;
  
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [performanceData, setPerformanceData] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);
  
  // 日期區間 (預設 YTD)
  const [startDate, setStartDate] = useState(format(startOfYear(new Date()), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));

  // 1. 搜尋建議過濾 - 對齊產品管理的統一搜尋引擎
  const suggestions = useMemo(() => {
    if (!search.trim()) return [];
    const result = unifiedSearchFilter(products, search);
    return result.slice(0, 20); 
  }, [search, products]);

  /**
   * 核心：客戶端直連統計引擎
   */
  const fetchPerformance = useCallback(async (ids: string[]) => {
    if (ids.length === 0 || !db) {
      setPerformanceData({});
      return;
    }
    setIsLoading(true);
    try {
      const start = startOfDay(new Date(startDate));
      const end = endOfDay(new Date(endDate));
      const now = new Date();
      const thirtyDaysAgo = startOfDay(subDays(now, 30));
      const sevenDaysAgo = startOfDay(subDays(now, 7));

      const q = query(
        collection(db, 'orders'),
        where('createdAt', '>=', Timestamp.fromDate(start)),
        where('createdAt', '<=', Timestamp.fromDate(end)),
        orderBy('createdAt', 'desc'),
        limit(2000)
      );
      
      const snap = await getDocs(q);
      
      const results: Record<string, any> = {};
      ids.forEach(id => {
        results[id] = {
          totalQty: 0,
          monthQty: 0,
          weekQty: 0,
          totalRevenue: 0,
          trendDataMap: new Map()
        };
        for (let i = 29; i >= 0; i--) {
          const d = format(subDays(now, i), 'MM-dd');
          results[id].trendDataMap.set(d, 0);
        }
      });

      snap.forEach(docSnap => {
        const order = docSnap.data();
        if (order.paymentStatus !== 'paid' || order.status === 'cancelled') return;

        const orderDate = order.createdAt.toDate();
        
        (order.items || []).forEach((it: any) => {
          const itId = String(it.productId || it.id || "").trim();
          
          if (results[itId]) {
            const q = Number(it.qty) || 0;
            const price = Number(it.price) || 0;
            
            results[itId].totalQty += q;
            results[itId].totalRevenue += (q * price);

            if (orderDate >= thirtyDaysAgo) {
              results[itId].monthQty += q;
              const dateKey = format(orderDate, 'MM-dd');
              if (results[itId].trendDataMap.has(dateKey)) {
                results[itId].trendDataMap.set(dateKey, (results[itId].trendDataMap.get(dateKey) || 0) + q);
              }
            }
            if (orderDate >= sevenDaysAgo) {
              results[itId].weekQty += q;
            }
          }
        });
      });

      const finalResults: Record<string, any> = {};
      Object.keys(results).forEach(id => {
        finalResults[id] = {
          ...results[id],
          trendData: Array.from(results[id].trendDataMap.entries()).map((entry: any) => ({ 
            name: entry[0], 
            value: entry[1] 
          }))
        };
      });

      setPerformanceData(finalResults);
    } catch (e: any) {
      console.error("[Performance Tab] Fetch error:", e.message);
      toast({ title: "數據讀取失敗", description: "請檢查網路連線或稍後再試。", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [db, startDate, endDate, toast, lang]);

  useEffect(() => {
    if (selectedIds.length > 0) {
      fetchPerformance(selectedIds);
    }
  }, [selectedIds, startDate, endDate, fetchPerformance]);

  const toggleProduct = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(prev => prev.filter(i => i !== id));
    } else {
      if (selectedIds.length >= 5) {
        toast({ title: "達到對比上限", description: "最多同時對比 5 項產品。" });
        return;
      }
      setSelectedIds(prev => [...prev, id]);
      setSearch("");
    }
  };

  const combinedTrendData = useMemo(() => {
    if (Object.keys(performanceData).length === 0) return [];
    
    const firstId = Object.keys(performanceData)[0];
    const points = performanceData[firstId].trendData;
    
    return points.map((p: any, idx: number) => {
      const entry: any = { name: p.name };
      Object.entries(performanceData).forEach(([id, data]) => {
        const prod = products.find(it => it.id === id);
        const label = prod ? (lang === 'en' ? (prod.productName_en || id) : (prod.productName_zh || id)) : id;
        entry[label] = data.trendData[idx]?.value || 0;
      });
      return entry;
    });
  }, [performanceData, products, lang]);

  const selectedProducts = useMemo(() => {
    return selectedIds.map(id => products.find(p => p.id === id)).filter(Boolean);
  }, [selectedIds, products]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
            <CardHeader className="bg-muted/10 border-b p-6">
              <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <Search className="h-4 w-4 text-primary" />
                選取對比產品
              </CardTitle>
              <CardDescription>輸入 SKU 或名稱，點擊「加入對比」</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="relative">
                <Search className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder={perfT.search_placeholder}
                  className="pl-10 h-11 bg-muted/20 border-none rounded-xl"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                
                {suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] border-2 border-primary/20 z-[60] overflow-hidden animate-in zoom-in-95">
                    <ScrollArea className="h-80 w-full">
                      <div className="p-1 space-y-1">
                        {suggestions.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => toggleProduct(p.id)}
                            className="w-full flex items-center gap-3 p-3 hover:bg-primary/5 text-left transition-colors rounded-xl group"
                          >
                            <div className="h-10 w-10 rounded-lg bg-muted shrink-0 overflow-hidden border">
                              {p.imageUrl && <img src={p.imageUrl} className="object-cover h-full w-full" />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-bold text-xs truncate text-slate-900">{lang === 'en' ? (p.productName_en || p.productName_zh) : p.productName_zh}</p>
                              <p className="text-[9px] font-mono text-muted-foreground uppercase">{p.sku}</p>
                            </div>
                            <Plus className={cn(
                              "h-4 w-4 transition-all",
                              selectedIds.includes(p.id) ? "text-primary scale-110" : "text-muted-foreground opacity-20 group-hover:opacity-100"
                            )} />
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">已選取 ({selectedIds.length})</Label>
                  {selectedIds.length > 0 && (
                    <button onClick={() => setSelectedIds([])} className="text-[9px] font-bold text-red-500 hover:underline">{perfT.clear_all}</button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedProducts.length === 0 ? (
                    <p className="text-[10px] text-muted-foreground italic p-4 text-center w-full bg-muted/10 rounded-xl border border-dashed">
                      尚未選取產品
                    </p>
                  ) : selectedProducts.map((p: any) => (
                    <Badge key={p.id} variant="secondary" className="pr-1 py-1 gap-2 bg-primary/5 border border-primary/20 text-primary font-bold">
                      <span className="truncate max-w-[100px]">{lang === 'en' ? (p.productName_en || p.productName_zh) : p.productName_zh}</span>
                      <button onClick={() => toggleProduct(p.id)} className="hover:bg-primary/20 rounded-full p-0.5"><X className="h-3 w-3" /></button>
                    </Badge>
                  ))}
                </div>
              </div>

              <Separator className="border-dashed" />

              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1 flex items-center gap-2">
                  <Calendar className="h-3 w-3" /> 分析日期範圍 (Custom Range)
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold opacity-50 ml-1">START</span>
                    <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-9 text-xs bg-muted/20 border-none rounded-lg" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold opacity-50 ml-1">END</span>
                    <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="h-9 text-xs bg-muted/20 border-none rounded-lg" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-8 space-y-8">
          {isLoading ? (
            <div className="h-[600px] flex flex-col items-center justify-center gap-4 bg-white rounded-[2.5rem] border shadow-inner">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest animate-pulse">正在精算全歷史數據...</p>
            </div>
          ) : selectedIds.length === 0 ? (
            <div className="h-[600px] flex flex-col items-center justify-center text-center p-12 bg-white rounded-[2.5rem] border border-dashed border-muted-foreground/20 space-y-6">
              <div className="h-20 w-20 bg-muted/30 rounded-full flex items-center justify-center text-muted-foreground/30">
                <BarChart3 className="h-10 w-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black">{perfT.title}</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">{perfT.desc}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-8 animate-in zoom-in-95 duration-500">
              <div className="grid grid-cols-1 gap-6">
                {selectedProducts.map((p: any, idx: number) => {
                  const data = performanceData[p.id] || { totalQty: 0, monthQty: 0, weekQty: 0, totalRevenue: 0 };
                  return (
                    <Card key={p.id} className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden group">
                      <div className="p-6 flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="flex items-center gap-4 w-full md:w-1/3">
                          <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center text-white shrink-0 shadow-md", idx === 0 ? "bg-primary text-primary-foreground" : "bg-indigo-600")}>
                             <span className="font-black text-lg">{idx + 1}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="font-black text-slate-800 text-sm truncate">{lang === 'en' ? (p.productName_en || p.productName_zh) : p.productName_zh}</p>
                            <p className="text-[10px] text-muted-foreground font-mono uppercase">SKU: {p.sku}</p>
                          </div>
                        </div>
                        <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-8 w-full">
                           <div className="text-center md:text-left"><p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-1">7D Sales</p><p className="text-lg font-black text-orange-600">{data.weekQty}</p></div>
                           <div className="text-center md:text-left"><p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-1">30D Sales</p><p className="text-lg font-black text-indigo-600">{data.monthQty}</p></div>
                           <div className="text-center md:text-left"><p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-1">Total Sold</p><p className="text-lg font-black text-slate-800">{data.totalQty}</p></div>
                           <div className="text-center md:text-right pr-4"><p className="text-[9px] font-black uppercase text-muted-foreground tracking-widest mb-1">Gross Rev.</p><p className="text-lg font-black text-primary">${data.totalRevenue.toLocaleString()}</p></div>
                        </div>
                        <Button variant="ghost" size="icon" asChild className="rounded-full group-hover:bg-primary/10 transition-colors"><Link href={`/admin/products/${p.id}`}><ChevronRight className="h-5 w-5" /></Link></Button>
                      </div>
                    </Card>
                  );
                })}
              </div>

              <Card className="border-none shadow-sm rounded-[2.5rem] bg-white overflow-hidden border-t-8 border-primary">
                <CardHeader className="p-8 border-b">
                  <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    產品銷量趨勢對比 (30 Day Trend Overlay)
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[400px] p-8 pb-12">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={combinedTrendData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} interval={4} />
                      <YAxis fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                        itemStyle={{ fontWeight: 'bold', fontSize: '11px' }}
                      />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                      {selectedProducts.map((p: any, i: number) => (
                        <Line 
                          key={p.id}
                          type="monotone" 
                          dataKey={lang === 'en' ? (p.productName_en || p.id) : (p.productName_zh || p.id)} 
                          stroke={LINE_COLORS[i % LINE_COLORS.length]} 
                          strokeWidth={4} 
                          dot={false}
                          activeDot={{ r: 6, strokeWidth: 0 }} 
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
