
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { 
  Bell, 
  Search, 
  Package, 
  ArrowLeft, 
  CheckCircle2, 
  Clock, 
  User, 
  TrendingUp,
  ArrowRight,
  Filter,
  Download,
  Loader2,
  AlertCircle,
  Tag,
  Hash,
  Info,
  MapPin,
  Send,
  ShoppingBag,
  DollarSign,
  XCircle,
  Mail,
  Trash2,
  ShoppingCart
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
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
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
import { useFirestore, useCollection } from "@/firebase";
import { collection, query, orderBy, where, doc, updateDoc, serverTimestamp, deleteDoc } from "firebase/firestore";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { triggerNotification } from "@/services/communication-service";

interface AggregatedAlert {
  productId: string;
  productName: string;
  sku: string;
  totalRequested: number;
  uniqueUsers: number;
  earliestRequest: Date | null;
  potentialRevenue: number;
}

export default function StockAlertsAdmin() {
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const db = useFirestore();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<'individual' | 'aggregated'>('aggregated');
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  // 確認面板狀態
  const [alertIdToDelete, setAlertIdToDelete] = useState<string | null>(null);

  const isEn = lang === 'en';

  // 1. 實時從 Firestore 獲取所有到貨通知
  const alertsQuery = useMemo(() => {
    if (!db) return null;
    let base = collection(db, 'stock_alerts');
    if (statusFilter !== 'all') {
      return query(base, where('status', '==', statusFilter), orderBy('createdAt', 'desc'));
    }
    return query(base, orderBy('createdAt', 'desc'));
  }, [db, statusFilter]);

  const { data: alerts, loading } = useCollection<any>(alertsQuery);

  // 2. 數據聚合邏輯
  const aggregatedData = useMemo(() => {
    if (!alerts) return [];
    const map = new Map<string, AggregatedAlert>();

    alerts.forEach(alert => {
      const pid = alert.productId;
      const current = map.get(pid) || {
        productId: pid,
        productName: alert.productName || "Unknown",
        sku: alert.sku || "--",
        totalRequested: 0,
        uniqueUsers: 0,
        earliestRequest: null,
        potentialRevenue: 0
      };

      current.totalRequested += (alert.requestedQty || 1);
      current.uniqueUsers += 1;
      
      const unitPrice = Number(alert.price || 0);
      current.potentialRevenue += unitPrice * (alert.requestedQty || 1);
      
      const alertDate = alert.createdAt?.seconds ? new Date(alert.createdAt.seconds * 1000) : null;
      if (alertDate && (!current.earliestRequest || alertDate < current.earliestRequest)) {
        current.earliestRequest = alertDate;
      }

      map.set(pid, current);
    });

    return Array.from(map.values()).sort((a, b) => b.totalRequested - a.totalRequested);
  }, [alerts]);

  const filteredAggregated = useMemo(() => {
    return aggregatedData.filter(item => 
      item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [aggregatedData, searchQuery]);

  const filteredIndividual = useMemo(() => {
    if (!alerts) return [];
    return alerts.filter(a => 
      (a.productName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.sku || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [alerts, searchQuery]);

  // 3. 操作函數

  /**
   * 手動發送通知
   */
  const handleManualNotify = async (alert: any) => {
    if (!db || !alert.email) return;
    setActionLoading(alert.id);
    try {
      const res = await triggerNotification(db, 'back_in_stock', {
        ...alert,
        id: alert.productId
      }, 'zh');

      const updateData: any = {
        updatedAt: serverTimestamp()
      };

      if (res.success) {
        updateData.status = 'notified';
        updateData.notifiedAt = serverTimestamp();
        toast({ title: isEn ? "Notification Sent" : "通知已手動發送", description: `已寄送至 ${alert.email}` });
      } else {
        toast({ title: isEn ? "Warning" : "發送警告", description: res.message || "通知已排程，但請確認範本是否存在。", variant: "default" });
      }

      const alertRef = doc(db, 'stock_alerts', alert.id);
      updateDoc(alertRef, updateData).catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: alertRef.path,
          operation: 'update',
          requestResourceData: updateData,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      });

    } catch (e: any) {
      toast({ title: isEn ? "Failed" : "發送失敗", description: e.message, variant: "destructive" });
    } finally {
      setActionLoading(null);
    }
  };

  /**
   * 執行實際刪除動作
   */
  const confirmDeleteAlert = () => {
    if (!db || !alertIdToDelete) return;
    
    const targetId = alertIdToDelete;
    setAlertIdToDelete(null); // 立即關閉面板

    const alertRef = doc(db, 'stock_alerts', targetId);
    
    deleteDoc(alertRef)
      .then(() => {
        toast({ title: isEn ? "Record deleted" : "記錄已刪除" });
      })
      .catch(async (error) => {
        const permissionError = new FirestorePermissionError({
          path: alertRef.path,
          operation: 'delete',
        } satisfies SecurityRuleContext);
        
        errorEmitter.emit('permission-error', permissionError);
      });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'converted': 
        return <Badge className="bg-green-100 text-green-700 border-none font-black text-[9px] uppercase"><CheckCircle2 className="h-2.5 w-2.5 mr-1" /> Converted</Badge>;
      case 'notified': 
        return <Badge className="bg-blue-100 text-blue-700 border-none font-black text-[9px] uppercase"><Send className="h-2.5 w-2.5 mr-1" /> Notified</Badge>;
      default: 
        return <Badge variant="outline" className="text-[9px] font-black uppercase text-orange-600 border-orange-200 bg-orange-50">Pending</Badge>;
    }
  };

  const formatUpdateDate = (date: any) => {
    if (!date) return '--';
    try {
      if (date.seconds) return format(new Date(date.seconds * 1000), 'yyyy-MM-dd HH:mm');
      if (date instanceof Date) return format(date, 'yyyy-MM-dd HH:mm');
      return '--';
    } catch (e) {
      return '--';
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-full">
            <Link href="/admin/products"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <h1 className="text-3xl font-black font-headline tracking-tight">缺貨通知管理</h1>
            <p className="text-muted-foreground">追蹤客人的補貨請求、通知進度及最終購買轉化。</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-11 w-40 bg-white rounded-xl border-none shadow-sm font-bold text-xs">
              <div className="flex items-center gap-2"><Filter className="h-3.5 w-3.5" /><SelectValue placeholder="所有狀態" /></div>
            </SelectTrigger>
            <SelectContent className="rounded-xl border-none shadow-2xl">
              <SelectItem value="all">所有狀態</SelectItem>
              <SelectItem value="pending">待處理 (Pending)</SelectItem>
              <SelectItem value="notified">已通知 (Notified)</SelectItem>
              <SelectItem value="converted">已轉化 (Converted)</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2 rounded-xl h-11 border-muted-foreground/20 font-bold px-6 bg-white">
            <Download className="h-4 w-4" /> 匯出採購清單
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">待補貨請求</p>
            <h3 className="text-3xl font-black text-orange-600">{loading ? "..." : alerts?.filter(a => a.status === 'pending').length || 0}</h3>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden border-l-4 border-primary">
          <CardContent className="p-6">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">潛在回流營收</p>
            <h3 className="text-3xl font-black text-primary">
              ${loading ? "..." : aggregatedData.reduce((acc, item) => acc + item.potentialRevenue, 0).toLocaleString()}
            </h3>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-green-50 rounded-2xl overflow-hidden border-l-4 border-green-500">
          <CardContent className="p-6">
            <p className="text-[10px] font-black text-green-700 uppercase tracking-widest mb-1">已成功轉化</p>
            <div className="flex items-center justify-between">
              <h3 className="text-3xl font-black text-green-600">{loading ? "..." : alerts?.filter(a => a.status === 'converted').length || 0}</h3>
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">平均轉化率</p>
            <h3 className="text-3xl font-black text-indigo-600">
              {loading ? "..." : (alerts?.filter(a => a.status === 'notified').length ? ((alerts?.filter(a => a.status === 'converted').length / alerts?.filter(a => a.status === 'notified').length) * 100).toFixed(1) : "0")}%
            </h3>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-white rounded-3xl">
        <CardHeader className="bg-muted/5 border-b p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="搜尋產品、SKU 或 Email..." 
                className="pl-10 h-11 bg-white border-none shadow-inner rounded-xl"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex bg-muted/30 p-1 rounded-xl gap-1 border">
              <Button variant={viewMode === 'aggregated' ? "default" : "ghost"} size="sm" className="h-9 rounded-lg font-bold px-4" onClick={() => setViewMode('aggregated')}>按產品匯總</Button>
              <Button variant={viewMode === 'individual' ? "default" : "ghost"} size="sm" className="h-9 rounded-lg font-bold px-4" onClick={() => setViewMode('individual')}>明細記錄</Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="py-24 text-center"><Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" /></div>
          ) : viewMode === 'aggregated' ? (
            <Table>
              <TableHeader className="bg-muted/5">
                <TableRow>
                  <TableHead className="pl-8">產品名稱</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead className="text-center">請求人數</TableHead>
                  <TableHead className="text-center bg-primary/5">總計需求</TableHead>
                  <TableHead className="text-right pr-8">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAggregated.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="h-40 text-center text-muted-foreground italic">目前無資料。</TableCell></TableRow>
                ) : (
                  filteredAggregated.map((item) => (
                    <TableRow key={item.productId} className="group hover:bg-muted/10 transition-colors">
                      <TableCell className="pl-8 py-5">
                        <Link href={`/admin/products/${item.productId}`} className="font-bold hover:text-primary transition-colors">{item.productName}</Link>
                      </TableCell>
                      <TableCell><code className="text-[10px] font-mono bg-muted px-2 py-1 rounded">{item.sku}</code></TableCell>
                      <TableCell className="text-center font-bold">{item.uniqueUsers} 人</TableCell>
                      <TableCell className="text-center bg-primary/5">
                        <Badge className="bg-primary text-primary-foreground font-black text-sm h-8 px-4 border-none shadow-md">
                          {item.totalRequested} units
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <Button variant="ghost" size="sm" asChild className="rounded-xl font-bold h-9">
                          <Link href={`/admin/products/${item.productId}?tab=pricing`}>管理庫存 <ArrowRight className="ml-2 h-4 w-4" /></Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          ) : (
            <Table>
              <TableHeader className="bg-muted/5">
                <TableRow>
                  <TableHead className="pl-8">顧客電郵</TableHead>
                  <TableHead>產品 / SKU</TableHead>
                  <TableHead>狀態</TableHead>
                  <TableHead>最後更新</TableHead>
                  <TableHead className="text-right pr-8">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIndividual.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="h-40 text-center text-muted-foreground italic">目前無詳細記錄。</TableCell></TableRow>
                ) : (
                  filteredIndividual.map((alert) => (
                    <TableRow key={alert.id} className="group hover:bg-muted/10 transition-colors">
                      <TableCell className="pl-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary"><User className="h-4 w-4" /></div>
                          <div className="min-w-0">
                            <p className="font-bold text-xs truncate">{alert.email}</p>
                            <p className="text-[9px] text-muted-foreground font-medium uppercase tracking-tighter">Qty: {alert.requestedQty || 1}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="min-w-0 max-w-[200px]">
                          <p className="font-bold text-xs truncate">{alert.productName}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">{alert.sku}</p>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(alert.status)}</TableCell>
                      <TableCell className="text-[10px] text-muted-foreground font-bold uppercase">
                        {formatUpdateDate(alert.updatedAt)}
                      </TableCell>
                      <TableCell className="text-right pr-8">
                        <div className="flex items-center justify-end gap-1">
                          {alert.status === 'pending' && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-8 rounded-lg border-primary text-primary font-bold gap-1.5 bg-white"
                              onClick={() => handleManualNotify(alert)}
                              disabled={actionLoading === alert.id}
                            >
                              {actionLoading === alert.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                              手動發信
                            </Button>
                          )}
                          {alert.status === 'converted' && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-green-600" asChild>
                              <Link href={`/admin/orders/${alert.convertedOrderId}`} title="查看轉化訂單"><ShoppingCart className="h-4 w-4" /></Link>
                            </Button>
                          )}
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 rounded-full text-destructive hover:bg-red-50 transition-colors" 
                            onClick={() => setAlertIdToDelete(alert.id)}
                            disabled={actionLoading === alert.id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 刪除確認面板 */}
      <AlertDialog open={!!alertIdToDelete} onOpenChange={(open) => !open && setAlertIdToDelete(null)}>
        <AlertDialogContent className="rounded-[2.5rem] border-none shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-2xl font-black font-headline">
              {isEn ? "Confirm Deletion?" : "確認刪除請求紀錄？"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground leading-relaxed">
              {isEn 
                ? "This will permanently remove this stock alert request from the database. This action cannot be undone." 
                : "此操作將從資料庫中永久移除這筆到貨通知請求紀錄。此動作無法復原。"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-xl font-bold h-11">
              {isEn ? "Cancel" : "取消"}
            </AlertDialogCancel>
            <AlertDialogAction 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl font-bold h-11 px-8" 
              onClick={confirmDeleteAlert}
            >
              {isEn ? "Delete Permanently" : "確認刪除"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
