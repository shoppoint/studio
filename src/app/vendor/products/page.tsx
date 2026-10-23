"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Package as PackageIcon,
  Filter,
  MoreVertical,
  Loader2,
  Package,
  ArrowUpDown,
  Tag
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useUser, useFirestore, useCollection } from "@/firebase";
import { collection, query, where, orderBy, deleteDoc, doc, limit } from "firebase/firestore";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { cn } from "@/lib/utils";

export default function VendorProducts() {
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const db = useFirestore();
  const { user } = useUser();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [productIdToDelete, setProductIdToDelete] = useState<string | null>(null);

  // 1. 查找關聯的 Vendor ID - Guarded
  const vendorQuery = useMemo(() => (user && db) ? query(
    collection(db, 'vendors'), 
    where('linkedUserId', '==', user.uid),
    limit(1)
  ) : null, [db, user]);
  const { data: vendorList } = useCollection<any>(vendorQuery);
  const vendorId = vendorList?.[0]?.id;

  // 2. 獲獲該賣家的產品 - Guarded
  const productsQuery = useMemo(() => (vendorId && db) ? query(
    collection(db, 'public_products'),
    where('vendorId', '==', vendorId),
    orderBy('updatedAt', 'desc')
  ) : null, [db, vendorId]);
  const { data: products, loading } = useCollection<any>(productsQuery);

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter(p => {
      const name = (p.productName_zh || "").toLowerCase() + (p.productName_en || "").toLowerCase();
      const sku = (p.sku || "").toLowerCase();
      const matchesSearch = name.includes(searchQuery.toLowerCase()) || sku.includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === "All" || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [products, searchQuery, statusFilter]);

  const confirmDelete = async () => {
    if (!productIdToDelete || !db) return;
    const id = productIdToDelete;
    setProductIdToDelete(null);
    try {
      await deleteDoc(doc(db, 'public_products', id));
      toast({ title: t.common.success, description: "產品已下架並刪除。" });
    } catch (e) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `public_products/${id}`, operation: 'delete' }));
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black font-headline">我的產品清單</h1>
          <p className="text-muted-foreground">管理商店目錄、庫存分配及定價設定。</p>
        </div>
        <Button className="bg-primary text-primary-foreground font-black shadow-lg rounded-xl h-11 px-8 gap-2" asChild>
          <Link href="/vendor/products/new">
            <Plus className="h-4 w-4" />
            新增產品項目
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">上架中產品</p>
            <h3 className="text-3xl font-black">{loading ? "..." : products?.filter(p => p.status === 'Active').length || 0}</h3>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-orange-50 rounded-2xl overflow-hidden border-l-4 border-orange-500">
          <CardContent className="p-6">
            <p className="text-[10px] font-black text-orange-800 uppercase tracking-widest mb-1">庫存預警</p>
            <h3 className="text-3xl font-black text-orange-600">{loading ? "..." : products?.filter(p => (Number(p.stock) || 0) < 10).length || 0}</h3>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-white rounded-3xl">
        <CardHeader className="bg-muted/5 border-b p-6 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="搜尋產品名稱或 SKU..." 
                className="pl-10 h-11 bg-white border-none shadow-inner rounded-xl"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-11 w-40 bg-white border-none shadow-sm rounded-xl font-bold"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-xl border-none shadow-2xl">
                  <SelectItem value="All">所有狀態</SelectItem>
                  <SelectItem value="Active">Active (上架中)</SelectItem>
                  <SelectItem value="Inactive">Inactive (已下架)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-24 text-center"><Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" /></div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-24 text-center border-2 border-dashed m-6 rounded-[2rem] bg-muted/5 space-y-4">
              <Package className="h-12 w-12 text-muted-foreground/20 mx-auto" />
              <p className="text-muted-foreground font-medium italic">目前沒有符合條件的產品。</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/5">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-8">產品詳情</TableHead>
                  <TableHead>類別</TableHead>
                  <TableHead>實體庫存</TableHead>
                  <TableHead>售價</TableHead>
                  <TableHead>狀態</TableHead>
                  <TableHead className="text-right pr-8">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((p) => (
                  <TableRow key={p.id} className="group hover:bg-muted/30 transition-colors">
                    <TableCell className="pl-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-muted overflow-hidden shrink-0 border">
                          {p.imageUrl ? <img src={p.imageUrl} className="object-cover w-full h-full" /> : <PackageIcon className="h-full w-full p-3 text-muted-foreground/30" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm truncate">{lang === 'en' ? (p.productName_en || p.productName_zh) : (p.productName_zh || p.productName_en)}</p>
                          <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{p.sku || 'NO-SKU'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="outline" className="text-[9px] font-black uppercase h-5">{Array.isArray(p.categories) ? p.categories[0] : p.categories}</Badge></TableCell>
                    <TableCell className="font-black text-sm">{p.stock || 0} units</TableCell>
                    <TableCell className="font-black text-primary">${p.salePrice > 0 ? p.salePrice : p.price}</TableCell>
                    <TableCell>
                      <Badge variant={p.status === "Active" ? "default" : "secondary"} className="h-6 px-3 rounded-lg border-none text-[10px] font-bold">
                        {p.status === "Active" ? "ON SALE" : "HIDDEN"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-9 w-9 rounded-full"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 p-2 rounded-2xl shadow-2xl border-none">
                          <DropdownMenuItem asChild className="rounded-xl py-2.5 cursor-pointer"><Link href={`/vendor/products/${p.id}`} className="flex items-center gap-2 font-bold"><Edit3 className="h-4 w-4 text-primary" /> 編輯資料</Link></DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive rounded-xl py-2.5 cursor-pointer flex items-center gap-2 font-bold" onClick={() => setProductIdToDelete(p.id)}><Trash2 className="h-4 w-4" /> 刪除產品</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!productIdToDelete} onOpenChange={(v) => !v && setProductIdToDelete(null)}>
        <AlertDialogContent className="rounded-[2rem] border-none shadow-2xl">
          <AlertDialogHeader><AlertDialogTitle className="text-2xl font-black">確認刪除產品？</AlertDialogTitle><AlertDialogDescription>此操作將永久移除產品資料。無法復原。</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter className="gap-2"><AlertDialogCancel className="rounded-xl font-bold h-11">取消</AlertDialogCancel><AlertDialogAction className="bg-destructive text-white rounded-xl h-11 px-8 font-black" onClick={confirmDelete}>確認刪除</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
