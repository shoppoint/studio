"use client";

import { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  PackageSearch, 
  Search, 
  Loader2, 
  Warehouse, 
  Store,
  ArrowRight,
  Package,
  Info,
  Calendar,
  ChevronRight,
  RefreshCcw,
  LayoutGrid,
  History,
  Settings2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useI18n } from "@/lib/i18n/i18n-context";
import { useFirestore, useDoc, useCollection } from "@/firebase";
import { collection, query, where, orderBy, doc } from "firebase/firestore";
import { cn } from "@/lib/utils";

export default function WarehouseInventoryPage() {
  const params = useParams();
  const router = useRouter();
  const { t, lang } = useI18n();
  const db = useFirestore();
  const warehouseId = params.warehouseId as string;
  const [searchQuery, setSearchQuery] = useState("");

  // 防禦：確保 db 已就緒
  const locationRef = useMemo(() => {
    if (!db || !warehouseId) return null;
    return doc(db, 'locations', warehouseId);
  }, [db, warehouseId]);
  const { data: location, loading: locLoading } = useDoc<any>(locationRef);

  const productsQuery = useMemo(() => {
    if (!db) return null;
    return query(
      collection(db, 'public_products'),
      where('status', '==', 'Active')
    );
  }, [db]);
  const { data: products, loading: productsLoading } = useCollection<any>(productsQuery);

  const inventoryData = useMemo(() => {
    if (!products || !warehouseId) return [];
    
    return products.filter(p => {
      const hasStock = (p.warehouseStock && (p.warehouseStock[warehouseId] || 0) > 0);
      const hasBatches = Array.isArray(p.batches) && p.batches.some((b: any) => b.locationId === warehouseId && b.quantity > 0);
      
      const search = searchQuery.toLowerCase().trim();
      const matchesSearch = !search || 
        (p.productName_zh || "").toLowerCase().includes(search) ||
        (p.productName_en || "").toLowerCase().includes(search) ||
        (p.sku || "").toLowerCase().includes(search);

      return (hasStock || hasBatches) && matchesSearch;
    }).map(p => {
      const localBatches = (Array.isArray(p.batches) ? p.batches : [])
        .filter((b: any) => b.locationId === warehouseId && b.quantity > 0)
        .sort((a: any, b: any) => {
          if (!a.expiryDate) return 1;
          if (!b.expiryDate) return -1;
          return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
        });

      return {
        ...p,
        localBatches,
        localTotal: (p.warehouseStock && p.warehouseStock[warehouseId]) || 
                    localBatches.reduce((acc: number, b: any) => acc + (Number(b.quantity) || 0), 0)
      };
    });
  }, [products, warehouseId, searchQuery]);

  const locationName = useMemo(() => {
    if (!location) return "";
    return lang === 'en' ? (location.name_en || location.name_zh) : (location.name_zh || location.name_en);
  }, [location, lang]);

  if (locLoading) return <div className="h-96 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full"><ArrowLeft className="h-5 w-5" /></Button>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-black uppercase text-[10px] h-5">Inventory View</Badge>
              {location?.type === 'physical' ? <Store className="h-4 w-4 text-primary" /> : <Warehouse className="h-4 w-4 text-primary" />}
            </div>
            <h1 className="text-3xl font-bold font-headline">{locationName} - 庫存盤點</h1>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.refresh()} className="rounded-xl h-11 gap-2 font-bold bg-white">
            <RefreshCcw className="h-4 w-4" /> 重新整理
          </Button>
          <Button className="bg-primary text-primary-foreground font-black shadow-lg rounded-xl h-11 px-8 gap-2" asChild>
            <Link href={`/admin/warehouses/${warehouseId}`}><Settings2 className="h-4 w-4" /> 地點設定</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden border-l-4 border-primary">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <LayoutGrid className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">持有產品種類</p>
              <h3 className="text-2xl font-black">{inventoryData.length} SKUs</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden border-l-4 border-indigo-600">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Package className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">總實體庫存量</p>
              <h3 className="text-2xl font-black">
                {inventoryData.reduce((acc, p) => acc + (p.localTotal || 0), 0)} Units
              </h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
        <CardHeader className="bg-muted/5 border-b p-6">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="搜尋此地點下的產品或 SKU..." 
              className="pl-10 h-11 bg-white border-none shadow-inner rounded-xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {productsLoading ? (
            <div className="py-20 text-center"><Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" /></div>
          ) : inventoryData.length === 0 ? (
            <div className="py-24 text-center text-muted-foreground italic flex flex-col items-center gap-4">
              <PackageSearch className="h-12 w-12 opacity-20" />
              <p>此地點目前沒有任何產品庫存。</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/5">
                <TableRow>
                  <TableHead className="pl-8">產品與 SKU</TableHead>
                  <TableHead>批次明細 (Batches)</TableHead>
                  <TableHead className="text-right pr-8">此地點總數</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inventoryData.map((p) => (
                  <TableRow key={p.id} className="group hover:bg-muted/30 transition-colors align-top">
                    <TableCell className="pl-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-muted overflow-hidden border shrink-0">
                          {p.imageUrl ? <img src={p.imageUrl} className="object-cover w-full h-full" alt="" /> : <Package className="h-6 w-6 m-3 opacity-20" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm leading-tight">{lang === 'en' ? (p.productName_en || p.productName_zh) : (p.productName_zh || p.productName_en)}</p>
                          <p className="text-[10px] text-muted-foreground font-mono mt-1">{p.sku}</p>
                          <Button variant="link" asChild className="p-0 h-auto text-[10px] font-bold gap-1 mt-1">
                            <Link href={`/product/${p.id}`}>查看全域資料 <ChevronRight className="h-2 w-2" /></Link>
                          </Button>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-6">
                      <div className="space-y-2 max-w-xs">
                        {p.localBatches?.length > 0 ? (
                          p.localBatches.map((b: any, idx: number) => (
                            <div key={idx} className="flex items-center justify-between text-xs p-2 bg-muted/20 rounded-lg border border-dashed">
                              <div className="space-y-0.5">
                                <p className="font-black text-[9px] uppercase opacity-50">ID: {b.batchId}</p>
                                <p className="flex items-center gap-1 font-bold text-muted-foreground">
                                  <Calendar className="h-3 w-3" />
                                  {b.expiryDate || "No Expiry"}
                                </p>
                              </div>
                              <span className="font-black text-slate-800">{b.quantity}</span>
                            </div>
                          ))
                        ) : (
                          <div className="flex items-center gap-2 p-2 bg-orange-50 rounded-lg text-[10px] font-bold text-orange-700">
                             <History className="h-3 w-3" />
                             由舊系統遷移或手動入帳 (無批次)
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-8 py-6">
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-2xl font-black text-primary">{p.localTotal}</span>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">Units held at this site</p>
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
  );
}
