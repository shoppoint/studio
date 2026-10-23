"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Award,
  Search,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
import { Input } from "@/components/ui/input";
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
import { useFirestore, useCollection } from "@/firebase";
import { collection, query, doc, deleteDoc, orderBy } from "firebase/firestore";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export default function AdminBrands() {
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const db = useFirestore();
  
  // 取得品牌翻譯對象並加入保護，修復 TypeError
  const brandT = t.admin?.brands || { 
    title: "品牌管理", 
    subtitle: "管理全平台品牌資訊", 
    add_brand: "新增品牌",
    table: { name: "品牌名稱" }
  };
  
  // States
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [brandIdToDelete, setBrandIdToDelete] = useState<string | null>(null);
  const itemsPerPage = 15;

  // 1. Fetch all brands - 加入 db 防禦性檢查
  const brandsQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'brands'), orderBy('name_en'));
  }, [db]);

  const { data: rawBrands, loading: brandsLoading } = useCollection<any>(brandsQuery);

  // 2. Fetch all categories for name lookup
  const categoriesQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'categories'));
  }, [db]);

  const { data: allCategories, loading: catsLoading } = useCollection<any>(categoriesQuery);

  const loading = brandsLoading || catsLoading;

  // Helper to get category name by ID
  const getCategoryName = (catId: string) => {
    const cat = allCategories?.find(c => c.id === catId);
    if (cat) {
      return lang === 'en' ? (cat.name_en || cat.name_zh) : (cat.name_zh || cat.name_en);
    }
    return catId; // Fallback to ID if not found
  };

  const filteredBrands = useMemo(() => {
    if (!rawBrands) return [];
    return rawBrands.filter(b => {
      const name = ((b.name_en || "") + (b.name_zh || "") + (b.slug || "")).toLowerCase();
      return name.includes(searchQuery.toLowerCase());
    });
  }, [rawBrands, searchQuery]);

  const totalPages = Math.ceil(filteredBrands.length / itemsPerPage);
  
  const paginatedBrands = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredBrands.slice(start, start + itemsPerPage);
  }, [filteredBrands, currentPage]);

  const confirmDelete = () => {
    if (!brandIdToDelete) return;
    const id = brandIdToDelete;
    deleteDoc(doc(db, 'brands', id))
      .then(() => {
        toast({ title: "品牌已移除", description: "Successfully removed from the database." });
      })
      .catch(e => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({ 
          path: `brands/${id}`, 
          operation: 'delete' 
        }));
      })
      .finally(() => {
        setBrandIdToDelete(null);
      });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">{brandT.title}</h1>
          <p className="text-muted-foreground">{brandT.subtitle}</p>
        </div>
        <Button className="bg-primary text-primary-foreground font-black shadow-lg rounded-xl h-11 px-8" asChild>
          <Link href="/admin/brands/new"><Plus className="mr-2 h-4 w-4" /> {brandT.add_brand}</Link>
        </Button>
      </div>

      <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-2 px-1">
            <Label className="text-[10px] font-black uppercase text-muted-foreground">搜尋品牌 (支援全域搜尋)</Label>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="搜尋品牌名稱、代稱..." 
              className="pl-10 h-11 bg-muted/20 border-none rounded-xl"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
        <CardHeader className="bg-muted/5 border-b py-4 px-8">
          <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <Award className="h-4 w-4 text-primary" />
            品牌名錄 (顯示 {filteredBrands.length} 個結果)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-20 text-center"><Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" /></div>
          ) : paginatedBrands.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground italic">無品牌資料。</div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/5">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-8">{brandT.table?.name || "品牌名稱"}</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>主要類別</TableHead>
                  <TableHead>狀態</TableHead>
                  <TableHead className="text-right pr-8">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedBrands.map((brand) => (
                  <TableRow key={brand.id} className="group hover:bg-muted/30">
                    <TableCell className="pl-8 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-white border flex items-center justify-center overflow-hidden shrink-0">
                          {brand.logoUrl ? <img src={brand.logoUrl} className="object-contain w-full h-full p-1" alt="" /> : <Award className="h-5 w-5 text-muted-foreground/30" />}
                        </div>
                        <span className="font-bold text-sm">{lang === 'en' ? (brand.name_en || brand.name_zh) : (brand.name_zh || brand.name_en)}</span>
                      </div>
                    </TableCell>
                    <TableCell><code className="text-[10px] bg-muted px-2 py-1 rounded font-mono">{brand.slug || "--"}</code></TableCell>
                    <TableCell className="text-xs">
                      {Array.isArray(brand.categories) && brand.categories.length > 0 ? (
                        <div className="flex gap-1 flex-wrap">
                          <Badge variant="outline" className="text-[8px] h-4">
                            {getCategoryName(brand.categories[0])}
                          </Badge>
                          {brand.categories.length > 1 && (
                            <span className="text-[8px] text-muted-foreground font-bold">+{brand.categories.length - 1}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">未分類</span>
                      )}
                    </TableCell>
                    <TableCell><Badge variant={brand.status === "Active" ? "default" : "secondary"} className="h-6 px-3 rounded-lg border-none text-[10px] font-bold">{brand.status || "Active"}</Badge></TableCell>
                    <TableCell className="text-right pr-8 space-x-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" asChild><Link href={`/admin/brands/${brand.id}`}><Edit2 className="h-4 w-4" /></Link></Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 rounded-full text-destructive hover:bg-red-50" 
                        onClick={() => setBrandIdToDelete(brand.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
        {totalPages > 1 && (
          <div className="p-6 border-t flex items-center justify-center gap-4">
            <Button variant="outline" size="sm" className="rounded-xl h-9 w-9 p-0" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
            <span className="text-xs font-black uppercase">Page {currentPage} / {totalPages}</span>
            <Button variant="outline" size="sm" className="rounded-xl h-9 w-9 p-0" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        )}
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={!!brandIdToDelete} onOpenChange={(open) => !open && setBrandIdToDelete(null)}>
        <AlertDialogContent className="rounded-[2rem] border-none shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black font-headline">確認刪除品牌？</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground leading-relaxed">
              此操作將從系統中永久移除該品牌資訊。關聯在此品牌下的產品將失去品牌標籤。此操作不可撤銷。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl font-bold h-11">取消</AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl font-bold h-11 px-8" 
              onClick={confirmDelete}
            >
              確認刪除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
