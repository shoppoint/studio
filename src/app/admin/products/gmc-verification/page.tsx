"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Camera, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Globe, 
  Store,
  Barcode,
  Info,
  Download,
  Loader2,
  ExternalLink,
  ChevronRight,
  Filter,
  Image as ImageIcon,
  ShieldCheck,
  Zap,
  Package
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
import { useI18n } from "@/lib/i18n/i18n-context";
import { useFirestore, useCollection } from "@/firebase";
import { collection, query, where, orderBy, doc, updateDoc } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function GmcVerificationPage() {
  const { lang } = useI18n();
  const { toast } = useToast();
  const db = useFirestore();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "photo_required">("photo_required");

  // 1. 獲取所有活躍產品
  const productsQuery = useMemo(() => {
    if (!db) return null;
    return query(
      collection(db, 'public_products'),
      where('status', '==', 'Active'),
      orderBy('productName_zh')
    );
  }, [db]);

  const { data: products, loading } = useCollection<any>(productsQuery);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter(p => {
      const name = (p.productName_zh || "") + (p.productName_en || "") + (p.sku || "") + (p.barcode || "");
      const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = filterType === 'all' || p.isGmcPhotoRequired === true;
      return matchesSearch && matchesFilter;
    });
  }, [products, searchQuery, filterType]);

  const handleTogglePhotoRequirement = async (id: string, current: boolean) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'public_products', id), {
        isGmcPhotoRequired: !current
      });
      toast({ title: "狀態已更新", description: !current ? "標記為需拍照項目。" : "已移除標記。" });
    } catch (e) {
      toast({ title: "更新失敗", variant: "destructive" });
    }
  };

  const stats = useMemo(() => {
    if (!products) return { required: 0, completed: 0, pending: 0 };
    const required = products.filter(p => p.isGmcPhotoRequired).length;
    const completed = products.filter(p => p.isGmcPhotoRequired && p.shelfPhotoUrl).length;
    return {
      required,
      completed,
      pending: required - completed
    };
  }, [products]);

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-full">
            <Link href="/admin/products"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <h1 className="text-3xl font-black font-headline tracking-tight">GMC 在地庫存驗證助手</h1>
            <p className="text-muted-foreground">針對 Google 抽查清單進行實體貨架校對，確保價格標籤與照片合規。</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl font-bold h-11 border-orange-200 text-orange-700 bg-orange-50 hover:bg-orange-100" asChild>
            <a href="https://merchants.google.com/" target="_blank" rel="noreferrer">
              開啟 GMC 後台 <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden border-l-4 border-orange-500">
            <CardContent className="p-6">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">抽查清單總量</p>
              <h3 className="text-3xl font-black text-orange-600">{stats.required}</h3>
            </CardContent>
         </Card>
         <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden border-l-4 border-green-500">
            <CardContent className="p-6">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">已拍攝驗證照片</p>
              <h3 className="text-3xl font-black text-green-600">{stats.completed}</h3>
            </CardContent>
         </Card>
         <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden border-l-4 border-indigo-600">
            <CardContent className="p-6">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">待處理項目</p>
              <h3 className="text-3xl font-black text-indigo-600">{stats.pending}</h3>
            </CardContent>
         </Card>
      </div>

      <Card className="border-none shadow-xl bg-slate-900 text-white rounded-[2.5rem] overflow-hidden">
        <CardContent className="p-8 flex flex-col md:flex-row items-center gap-8">
          <div className="h-20 w-20 rounded-3xl bg-primary/20 flex items-center justify-center text-primary shrink-0 border border-primary/20">
            <Camera className="h-10 w-10" />
          </div>
          <div className="flex-1 space-y-4 text-center md:text-left">
            <div className="space-y-1">
              <h3 className="text-xl font-bold flex items-center justify-center md:justify-start gap-2">
                <ShieldCheck className="h-5 w-5 text-green-400" />
                實體貨架照片拍攝指南 (GMC Mandatory)
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Google 抽查時要求提供的照片必須清晰顯示：<strong>產品條碼 (Barcode)</strong> 以及 <strong>貨架標價 (Shelf Price)</strong>。
                兩者必須位於同一張照片內，且價格需與 Feed 同步。
              </p>
            </div>
            <div className="flex flex-wrap justify-center md:justify-start gap-3">
              <Badge variant="outline" className="text-white/60 border-white/20 px-3">價格精確到 $0.1</Badge>
              <Badge variant="outline" className="text-white/60 border-white/20 px-3">建議 WebP 格式</Badge>
              <Badge variant="outline" className="text-white/60 border-white/20 px-3">必須拍到 GTIN</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="搜尋清單中的產品或條碼..." 
            className="pl-10 h-11 bg-white rounded-xl border-none shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex bg-white p-1 rounded-xl shadow-sm border shrink-0">
          <Button 
            variant={filterType === 'photo_required' ? 'default' : 'ghost'} 
            size="sm" 
            className="rounded-lg font-bold px-4"
            onClick={() => setFilterType('photo_required')}
          >
            Google 抽查項目 ({stats.required})
          </Button>
          <Button 
            variant={filterType === 'all' ? 'default' : 'ghost'} 
            size="sm" 
            className="rounded-lg font-bold px-4"
            onClick={() => setFilterType('all')}
          >
            所有活躍產品
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-white rounded-3xl">
        <CardContent className="p-0">
          {loading ? (
            <div className="py-24 text-center"><Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" /></div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-24 text-center text-muted-foreground italic flex flex-col items-center gap-4">
              <Package className="h-12 w-12 opacity-10" />
              <p>沒有符合條件的項目。請在產品「關聯與 SEO」分頁中標註為抽查項目。</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/5">
                <TableRow>
                  <TableHead className="pl-8">產品名稱 (Item Title)</TableHead>
                  <TableHead>條碼 (GTIN)</TableHead>
                  <TableHead>實體標價</TableHead>
                  <TableHead className="text-center">抽查標記</TableHead>
                  <TableHead>校對照片</TableHead>
                  <TableHead className="text-right pr-8">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((p) => (
                  <TableRow key={p.id} className={cn("group transition-colors", p.isGmcPhotoRequired ? "bg-orange-50/20 hover:bg-orange-50/40" : "hover:bg-muted/30")}>
                    <TableCell className="pl-8 py-5">
                      <p className="font-bold text-sm leading-tight">{p.productName_zh || p.productName_en}</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-black mt-1">SKU: {p.sku || "--"}</p>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded w-fit">
                        <Barcode className="h-3 w-3" />
                        {p.barcode || "MISSING"}
                      </div>
                    </TableCell>
                    <TableCell className="font-black text-orange-600">${Number(p.shelfPrice || p.salePrice || p.price).toFixed(1)}</TableCell>
                    <TableCell className="text-center">
                      <button 
                        onClick={() => handleTogglePhotoRequirement(p.id, p.isGmcPhotoRequired)}
                        className={cn(
                          "px-4 py-1.5 rounded-full text-[10px] font-black uppercase transition-all",
                          p.isGmcPhotoRequired ? "bg-orange-600 text-white shadow-md" : "bg-muted text-muted-foreground"
                        )}
                      >
                        {p.isGmcPhotoRequired ? "REQUIRED" : "OPTIONAL"}
                      </button>
                    </TableCell>
                    <TableCell>
                      {p.shelfPhotoUrl ? (
                        <div className="flex items-center gap-2">
                           <div className="h-10 w-10 rounded-lg overflow-hidden border bg-muted shrink-0 relative">
                             <img src={p.shelfPhotoUrl} className="object-cover w-full h-full" alt="" />
                           </div>
                           <Badge className="bg-green-500 text-white border-none text-[8px] font-black uppercase h-5">READY</Badge>
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-[9px] font-black uppercase text-muted-foreground border-dashed h-5">Awaiting Photo</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <Button variant="ghost" size="sm" asChild className="rounded-xl font-bold h-9 hover:bg-primary hover:text-white">
                        <Link href={`/admin/products/${p.id}?tab=relations`}>
                          立即校對 <ChevronRight className="ml-1 h-4 w-4" />
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

      <div className="p-8 bg-blue-50 rounded-[2.5rem] border border-blue-100 flex items-start gap-4 shadow-sm">
        <Info className="h-6 w-6 text-blue-600 shrink-0 mt-1" />
        <div className="space-y-3">
          <p className="font-black text-sm text-blue-900 uppercase">GMC 驗證最終核對清單 (Final Checklist)</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2 text-xs text-blue-800 font-medium">
             <p className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5" /> 確保 <b>Shelf Price</b> 與實體店標籤價格一模一樣</p>
             <p className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5" /> 確保 <b>Sale Price</b> 已同步至 GMC Feed 檔案</p>
             <p className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5" /> 每張照片需低於 5MB，建議使用 WebP 或 JPEG</p>
             <p className="flex items-center gap-2"><CheckCircle2 className="h-3.5 w-3.5" /> 照片必須呈現「現場真實拍攝」的觀感</p>
          </div>
        </div>
      </div>
    </div>
  );
}
