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
  Info,
  Warehouse,
  Store,
  CheckCircle2,
  Eye,
  EyeOff,
  PackageSearch
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

export default function AdminWarehouses() {
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const db = useFirestore();
  
  // States
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [locationIdToDelete, setLocationIdToDelete] = useState<string | null>(null);
  const itemsPerPage = 15;

  const whT = t.admin.warehouses;

  // 1. 實時監聽地點集合 - 加入 db 防禦性檢查
  const locationsQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'locations'), orderBy('type', 'asc'));
  }, [db]);

  const { data: locations, loading } = useCollection<any>(locationsQuery);

  const filteredLocations = useMemo(() => {
    if (!locations) return [];
    return locations.filter(loc => {
      const name = lang === 'en' 
        ? (loc.name_en || loc.name_zh || "") 
        : (loc.name_zh || loc.name_en || "");
      const address = loc.address?.building || loc.address?.street || "";
      const search = searchQuery.toLowerCase();
      return name.toLowerCase().includes(search) || address.toLowerCase().includes(search);
    });
  }, [locations, searchQuery, lang]);

  const totalPages = Math.ceil(filteredLocations.length / itemsPerPage);
  
  const paginatedLocations = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredLocations.slice(start, start + itemsPerPage);
  }, [filteredLocations, currentPage]);

  const confirmDelete = () => {
    if (!locationIdToDelete || !db) return;
    const id = locationIdToDelete;
    deleteDoc(doc(db, 'locations', id))
      .then(() => {
        toast({ title: "地點已移除" });
      })
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: `locations/${id}`,
          operation: 'delete',
        });
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => {
        setLocationIdToDelete(null);
      });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">{whT.title}</h1>
          <p className="text-muted-foreground">{whT.subtitle}</p>
        </div>
        <Button className="bg-primary text-primary-foreground font-black shadow-lg rounded-xl h-11 px-8" asChild>
          <Link href="/admin/warehouses/new"><Plus className="mr-2 h-4 w-4" /> {whT.add_warehouse}</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <Warehouse className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Active Locations</p>
              <p className="text-2xl font-black">{locations?.length || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white overflow-hidden">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-green-100 text-green-600 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Default Source</p>
              <p className="text-sm font-bold truncate max-w-[150px]">
                {locations?.find(l => l.isDefaultFulfillmentSource)?.name_zh || "Not Set"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="搜尋地點名稱或地址..." 
              className="pl-10 h-11 bg-muted/20 border-none rounded-xl"
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
        <CardHeader className="bg-muted/5 border-b py-4 px-8">
          <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">
            地點名錄 (顯示 {filteredLocations.length} 個結果)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-20 text-center"><Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" /></div>
          ) : paginatedLocations.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground italic">無地點資料。</div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/5">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-8">{whT.table.name}</TableHead>
                  <TableHead>{whT.table.type}</TableHead>
                  <TableHead>網購出貨</TableHead>
                  <TableHead>前台顯示</TableHead>
                  <TableHead className="text-right pr-8">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedLocations.map((loc) => (
                  <TableRow key={loc.id} className="group hover:bg-muted/30">
                    <TableCell className="pl-8 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-white border flex items-center justify-center shrink-0">
                          {loc.type === 'physical' ? <Store className="h-5 w-5 text-primary" /> : <Warehouse className="h-5 w-5 text-primary" />}
                        </div>
                        <div>
                          <p className="font-bold text-sm">{lang === 'en' ? (loc.name_en || loc.name_zh) : (loc.name_zh || loc.name_en)}</p>
                          <p className="text-[10px] text-muted-foreground">{loc.address?.district}, {loc.address?.area}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize text-[10px] rounded-lg">
                        {loc.type === 'physical' ? '實體店' : '倉庫'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {loc.isDefaultFulfillmentSource ? (
                        <Badge className="bg-green-100 text-green-800 border-none font-black text-[10px] h-6 px-3">DEFAULT</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground opacity-30">--</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {loc.isVisible !== false ? (
                        <Badge variant="default" className="bg-blue-50 text-blue-700 border-none h-6 px-3 text-[9px] font-black uppercase">
                          <Eye className="h-3 w-3 mr-1" /> Visible
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="opacity-50 h-6 px-3 text-[9px] font-black uppercase">
                          <EyeOff className="h-3 w-3 mr-1" /> Hidden
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right pr-8 space-x-1">
                      <Button variant="outline" size="sm" className="h-8 rounded-xl font-bold gap-1.5 border-primary/20 text-primary hover:bg-primary/5" asChild>
                        <Link href={`/admin/warehouses/${loc.id}/inventory`}>
                          <PackageSearch className="h-3.5 w-3.5" /> 庫存盤點
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" asChild>
                        <Link href={`/admin/warehouses/${loc.id}`}><Edit2 className="h-4 w-4" /></Link>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 rounded-full text-destructive hover:bg-red-50" 
                        onClick={() => setLocationIdToDelete(loc.id)}
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

      <AlertDialog open={!!locationIdToDelete} onOpenChange={(open) => { if (!open) setLocationIdToDelete(null); }}>
        <AlertDialogContent className="rounded-[2rem] border-none shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black font-headline">確認刪除地點？</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground leading-relaxed">
              此操作將永久移除該地點資訊。請確保該地點已無剩餘庫存及關聯訂單。
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
