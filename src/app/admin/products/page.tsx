"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Search, 
  Edit3, 
  Trash2, 
  Plus, 
  Loader2, 
  Package,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  TrendingUp,
  ShoppingCart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useI18n } from "@/lib/i18n/i18n-context";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useCollection } from "@/firebase";
import { collection, query, doc, deleteDoc, orderBy } from "firebase/firestore";
import { unifiedSearchFilter } from "@/lib/shop-utils";
import { cn } from "@/lib/utils";

export default function AdminProducts() {
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const db = useFirestore();
  const router = useRouter();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  const [productIdToDelete, setProductIdToDelete] = useState<string | null>(null);

  // 管理後台使用 updatedAt 排序，方便查看最近編輯的項目
  const productsQuery = useMemo(() => {
    if (!db) return null;
    return query(
      collection(db, "public_products"), 
      orderBy("updatedAt", "desc")
    );
  }, [db]);

  const { data: rawProducts, loading } = useCollection<any>(productsQuery);

  const categoriesQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, "categories"));
  }, [db]);
  const { data: categories } = useCollection<any>(categoriesQuery);

  /**
   * 核心：整合全域統一搜尋引擎
   */
  const filteredProducts = useMemo(() => {
    if (!rawProducts) return [];
    
    // 1. 調用統一搜尋引擎 (包含名稱、SKU、所有層級分類)
    let result = unifiedSearchFilter(rawProducts, searchQuery);

    // 2. 狀態與類別篩選 (增加大小寫不敏感校驗)
    result = result.filter(p => {
      const pStatus = String(p.status || "").toLowerCase();
      const sFilter = statusFilter.toLowerCase();
      
      const matchesStatus = statusFilter === "All" || pStatus === sFilter;
      const matchesCategory = categoryFilter === "All" || (
        Array.isArray(p.categories) 
          ? p.categories.includes(categoryFilter) 
          : String(p.categories) === String(categoryFilter)
      );
      return matchesStatus && matchesCategory;
    });

    // 3. 排序：如果有關鍵字則按權重排序，否則按更新時間
    if (searchQuery.trim()) {
      result = result.sort((a, b) => (b._searchScore || 0) - (a._searchScore || 0));
    }

    return result;
  }, [rawProducts, searchQuery, statusFilter, categoryFilter]);

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProducts, currentPage, itemsPerPage]);

  const confirmDelete = async () => {
    if (!productIdToDelete || !db) return;
    try {
      await deleteDoc(doc(db, "public_products", productIdToDelete));
      toast({ title: "產品已刪除" });
    } catch (e) {
      console.error(e);
    }
    setProductIdToDelete(null);
  };

  const prodT = t.admin.products;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">{prodT.title}</h1>
          <p className="text-muted-foreground">管理全平台產品。使用統一搜尋引擎，支援全層級分類與權重排序。</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button className="bg-primary text-primary-foreground font-black shadow-lg h-11 px-8 rounded-xl" asChild>
            <Link href="/admin/products/new">
              <Plus className="mr-2 h-4 w-4" /> {prodT.add_product}
            </Link>
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
            <div className="md:col-span-5 space-y-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">搜尋產品</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="搜尋名稱、SKU、分類名稱或關鍵字..." 
                  className="pl-10 h-11 bg-muted/20 border-none rounded-xl" 
                  value={searchQuery} 
                  onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }} 
                />
              </div>
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">狀態</Label>
              <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="h-11 bg-muted/20 border-none rounded-xl font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-none shadow-2xl">
                  <SelectItem value="All">所有狀態</SelectItem>
                  <SelectItem value="Active">Active (上架中)</SelectItem>
                  <SelectItem value="Inactive">Inactive (已下架)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-3 space-y-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">分類</Label>
              <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setCurrentPage(1); }}>
                <SelectTrigger className="h-11 bg-muted/20 border-none rounded-xl font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-none shadow-2xl max-h-80">
                  <SelectItem value="All">所有分類</SelectItem>
                  {categories?.map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>
                      {lang === "en" ? (c.name_en || c.name_zh) : (c.name_zh || c.name_en)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">每頁顯示</Label>
              <Select value={itemsPerPage.toString()} onValueChange={(v) => { setItemsPerPage(Number(v)); setCurrentPage(1); }}>
                <SelectTrigger className="h-11 bg-muted/20 border-none rounded-xl font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-none shadow-2xl">
                  <SelectItem value="10">10 條</SelectItem>
                  <SelectItem value="20">20 條</SelectItem>
                  <SelectItem value="50">50 條</SelectItem>
                  <SelectItem value="100">100 條</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-24 text-center">
              <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/5">
                <TableRow className="hover:bg-transparent h-14">
                  <TableHead className="pl-8">{prodT.table.product}</TableHead>
                  <TableHead>{prodT.table.price}</TableHead>
                  <TableHead>庫存</TableHead>
                  <TableHead className="text-center">興趣度</TableHead>
                  <TableHead>{prodT.table.created_at}</TableHead>
                  <TableHead>狀態</TableHead>
                  <TableHead className="text-right pr-8">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedProducts.map((p) => {
                  const normalizedStatus = String(p.status || "").toLowerCase() === 'active' ? "Active" : "Inactive";
                  return (
                    <TableRow key={p.id} className="group hover:bg-muted/30 transition-colors">
                      <TableCell className="pl-8 py-4">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-xl bg-muted overflow-hidden border shrink-0">
                            {p.imageUrl ? (
                              <img src={p.imageUrl} className="object-cover w-full h-full" alt="" />
                            ) : (
                              <Package className="h-6 w-6 m-3 text-muted-foreground/30" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-black truncate">
                              {lang === "en" ? (p.productName_en || p.productName_zh) : (p.productName_zh || p.productName_en)}
                            </p>
                            <p className="text-[10px] text-muted-foreground font-mono uppercase mt-0.5">
                              {String(p.sku || "NO-SKU")}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-black text-primary text-sm">${p.salePrice || p.price}</span>
                      </TableCell>
                      <TableCell className="text-xs font-bold text-muted-foreground">
                        {p.onlineStock || 0} / {p.stock || 0}
                      </TableCell>
                      <TableCell className="text-center">
                         <div className="flex flex-col items-center gap-0.5">
                            <div className="flex items-center gap-1.5 text-orange-600 font-black">
                               <ShoppingCart className="h-3 w-3" />
                               {p.addedToCartCount || 0}
                            </div>
                            <span className="text-[8px] font-black uppercase text-muted-foreground tracking-tighter">Interest Score</span>
                         </div>
                      </TableCell>
                      <TableCell className="text-[10px] font-mono text-muted-foreground">
                        {p.createdAt?.seconds ? new Date(p.createdAt.seconds * 1000).toLocaleDateString() : (
                          <span className="text-red-500 font-bold">Missing</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={normalizedStatus === "Active" ? "default" : "secondary"} 
                          className={cn(
                            "h-6 px-3 rounded-lg border-none text-[10px] font-bold uppercase",
                            normalizedStatus === "Active" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                          )}
                        >
                          {normalizedStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <div className="flex justify-end gap-1">
                          <button 
                            className="h-9 w-9 rounded-full hover:bg-primary/10 flex items-center justify-center transition-colors"
                            onClick={() => router.push(`/admin/products/${p.id}`)}
                          >
                            <Edit3 className="h-4 w-4 text-slate-600" />
                          </button>
                          <Button 
                            variant="ghost" size="icon" 
                            className="h-9 w-9 rounded-full text-destructive" 
                            onClick={() => setProductIdToDelete(p.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
        {totalPages > 1 && (
          <div className="p-6 border-t flex items-center justify-center gap-4 bg-muted/5">
            <Button 
              variant="outline" 
              size="sm" 
              className="rounded-xl h-10 px-4 gap-2 font-bold bg-white" 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" /> 上一頁
            </Button>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase text-muted-foreground tracking-widest">
                第 {currentPage} 頁 / 共 {totalPages} 頁
              </span>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="rounded-xl h-10 px-4 gap-2 font-bold bg-white" 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
              disabled={currentPage === totalPages}
            >
              下一頁 <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </Card>

      <AlertDialog open={!!productIdToDelete} onOpenChange={(open) => { if (!open) setProductIdToDelete(null); }}>
        <AlertDialogContent className="rounded-[2rem] border-none shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black">確認刪除產品？</AlertDialogTitle>
            <AlertDialogDescription>此操作將永久移除產品資料。無法復原。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl font-bold h-11">取消</AlertDialogCancel>
            <AlertDialogAction className="bg-destructive rounded-xl font-bold h-11 px-8" onClick={confirmDelete}>
              確認刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
