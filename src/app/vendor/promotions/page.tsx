"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { 
  Plus, 
  Megaphone, 
  Zap, 
  Clock, 
  CheckCircle2, 
  Trash2, 
  Edit2,
  Calendar,
  Tag,
  Loader2,
  Ticket
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { useI18n } from "@/lib/i18n/i18n-context";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useUser, useFirestore, useCollection } from "@/firebase";
import { collection, query, where, orderBy, deleteDoc, doc, limit } from "firebase/firestore";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function VendorPromotions() {
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const db = useFirestore();
  const { user } = useUser();
  const [promoIdToDelete, setPromoIdToDelete] = useState<string | null>(null);

  // 1. 查找賣家商店 ID - Guarded
  const vendorQuery = useMemo(() => (user && db) ? query(
    collection(db, 'vendors'), 
    where('linkedUserId', '==', user.uid),
    limit(1)
  ) : null, [db, user]);
  const { data: vendorList } = useCollection<any>(vendorQuery);
  const vendorId = vendorList?.[0]?.id;

  // 2. 獲取該賣家建立的促銷 - Guarded
  const promosQuery = useMemo(() => (vendorId && db) ? query(
    collection(db, 'promotions'),
    where('vendorId', '==', vendorId),
    orderBy('updatedAt', 'desc')
  ) : null, [db, vendorId]);
  
  const { data: promos, loading } = useCollection<any>(promosQuery);

  const handleDelete = async () => {
    if (!promoIdToDelete || !db) return;
    const id = promoIdToDelete;
    setPromoIdToDelete(null);
    try {
      await deleteDoc(doc(db, 'promotions', id));
      toast({ title: "促銷已取消", description: `活動已從目錄中移除。` });
    } catch (e) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `promotions/${id}`, operation: 'delete' }));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-green-100 text-green-800 border-green-200 h-6 px-3 rounded-lg border-none text-[10px] font-bold"><CheckCircle2 className="mr-1 h-3 w-3" /> 進行中</Badge>;
      case 'scheduled': return <Badge className="bg-blue-100 text-blue-800 border-blue-200 h-6 px-3 rounded-lg border-none text-[10px] font-bold"><Clock className="mr-1 h-3 w-3" /> 已預約</Badge>;
      default: return <Badge variant="secondary" className="h-6 px-3 rounded-lg border-none text-[10px] font-bold">已過期</Badge>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black font-headline">促銷與折扣管理</h1>
          <p className="text-muted-foreground">建立專屬優惠碼或自動折扣活動，提升商品轉化率。</p>
        </div>
        <Button className="bg-primary text-primary-foreground font-black shadow-lg rounded-xl h-11 px-8 gap-2" asChild>
          <Link href="/vendor/promotions/new">
            <Plus className="h-4 w-4" />
            建立新優惠活動
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-primary/5 border border-primary/10 rounded-2xl">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/20 text-primary flex items-center justify-center shadow-sm"><Zap className="h-6 w-6" /></div>
            <div><p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">進行中優惠</p><p className="text-2xl font-black">{loading ? "..." : promos?.filter(p => p.status === 'active').length || 0}</p></div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-white rounded-3xl">
        <CardContent className="p-0">
          {loading ? (
            <div className="py-24 text-center"><Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" /></div>
          ) : !promos || promos.length === 0 ? (
            <div className="py-24 text-center flex flex-col items-center gap-4 border-2 border-dashed m-6 rounded-[2rem] bg-muted/5 space-y-4">
              <Ticket className="h-12 w-12 text-muted-foreground/20 mx-auto" />
              <p className="text-muted-foreground font-medium italic">目前沒有自定義的促銷活動。</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/5">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-8">促銷名稱</TableHead>
                  <TableHead>優惠碼 / 類型</TableHead>
                  <TableHead>價值</TableHead>
                  <TableHead>狀態</TableHead>
                  <TableHead className="text-right pr-8">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promos.map((p) => (
                  <TableRow key={p.id} className="group hover:bg-muted/30 transition-colors">
                    <TableCell className="pl-8 py-5 font-bold text-sm">
                      {lang === 'en' ? (p.name?.en || p.name?.zh) : (p.name?.zh || p.name?.en)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <code className="text-[10px] font-mono font-black text-primary">{p.code || "AUTOMATIC"}</code>
                        <span className="text-[9px] text-muted-foreground uppercase font-bold">{p.type}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-black text-primary">
                      {p.value}{p.type === 'percentage' ? '%' : '$'}
                    </TableCell>
                    <TableCell>{getStatusBadge(p.status)}</TableCell>
                    <TableCell className="text-right pr-8">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="rounded-full" asChild><Link href={`/vendor/promotions/${p.id}`}><Edit2 className="h-4 w-4" /></Link></Button>
                        <Button variant="ghost" size="icon" className="rounded-full text-destructive" onClick={() => setPromoIdToDelete(p.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!promoIdToDelete} onOpenChange={(v) => !v && setPromoIdToDelete(null)}>
        <AlertDialogContent className="rounded-[2rem]">
          <AlertDialogHeader><AlertDialogTitle className="font-black">確認移除此促銷？</AlertDialogTitle><AlertDialogDescription>此動作將立即停止該折扣套用於您的產品。</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel className="rounded-xl font-bold">取消</AlertDialogCancel><AlertDialogAction className="bg-destructive rounded-xl font-bold" onClick={handleDelete}>確認移除</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
