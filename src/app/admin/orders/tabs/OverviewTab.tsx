"use client";

import React, { useState } from "react";
import { 
  ShieldCheck, 
  Zap, 
  Coins, 
  Store, 
  CreditCard, 
  Clock, 
  Globe, 
  RefreshCcw, 
  Loader2, 
  CheckCircle2, 
  Ticket, 
  Calendar, 
  CheckCircle, 
  UserX,
  Leaf,
  Box,
  AlertTriangle,
  MousePointer2,
  UserCheck
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent } from "@/components/ui/card";
import { PAYMENT_METHODS } from "@/lib/constants/payment-methods";
import { format } from "date-fns";
import { useFirestore } from "@/firebase";
import { doc, runTransaction, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

/**
 * 訂單詳情 - 概覽分頁 (V28 穩定版 - 嚴格封堵 Select 崩潰點)
 */
export function OverviewTab({ 
  order, locations, isEditMode, fulfillmentStatus, setFulfillmentStatus, 
  paymentStatus, setPaymentStatus, paymentMethod, setPaymentMethod, 
  fulfillmentLocationId, setFulfillmentLocationId, statusT, 
  originalEarnedPoints, setOriginalEarnedPoints, adjustedPoints, setAdjustedPoints,
  pointsUsed, setPointsUsed, pointsUsedValue, setPointsUsedValue,
  pointsAwardedManual, setPointsAwardedManual,
  orderDateInput, setOrderDateInput,
  packagingPreference, setPackagingPreference,
  memberData,
  lang
}: any) {
  const { toast } = useToast();
  const db = useFirestore();
  const [isSyncing, setIsSyncing] = useState(false);

  const isEn = lang === 'en';

  const resolvedLocationName = React.useMemo(() => {
    const locId = fulfillmentLocationId || order?.fulfillmentLocationId;
    if (!locId || !locations) return "未指定";
    const loc = locations.find((l: any) => l.id === locId);
    return loc ? (lang === 'en' ? (loc.name_en || loc.name_zh) : (loc.name_zh || loc.name_en)) : locId;
  }, [fulfillmentLocationId, order?.fulfillmentLocationId, locations, lang]);

  const dateStr = order?.createdAt?.seconds ? format(new Date(order.createdAt.seconds * 1000), 'yyyy-MM-dd HH:mm:ss') : "--";

  const handleManualSync = async () => {
    if (!order?.id || !db) return;
    const locId = fulfillmentLocationId || order?.fulfillmentLocationId;
    if (!locId || locId === 'none') {
      toast({ title: "請先設定履約分店", variant: "destructive" });
      return;
    }
    setIsSyncing(true);
    const todayStr = new Date(new Date().getTime() + 8 * 3600000).toISOString().split('T')[0];
    try {
      await runTransaction(db, async (transaction) => {
        const orderRef = doc(db, 'orders', order.id);
        const orderSnap = await transaction.get(orderRef);
        if (!orderSnap.exists()) throw new Error("Order not found");
        const orderData = orderSnap.data();
        if (orderData.inventorySyncStatus === 'success') return;
        const items = orderData.items || [];
        const productIds = Array.from(new Set(items.map((it: any) => String(it.id || it.productId)))) as string[];
        const productRefs = productIds.map(pid => doc(db, 'public_products', pid));
        const productSnaps = await Promise.all(productRefs.map(ref => transaction.get(ref)));
        const webHub = locations?.find((l: any) => l.isDefaultFulfillmentSource);
        const defaultHubId = webHub?.id;

        for (let i = 0; i < productIds.length; i++) {
          const pSnap = productSnaps[i];
          if (!pSnap.exists()) continue;
          const pData = pSnap.data();
          const pid = productIds[i];
          const qtyToDeduct = items.filter((it: any) => String(it.id || it.productId) === pid).reduce((sum: number, it: any) => sum + (Number(it.qty) || 1), 0);
          let batches = Array.isArray(pData.batches) ? [...pData.batches] : [];
          let rem = qtyToDeduct;
          const validLocalBatches = batches.filter(b => b.locationId === locId && (!b.expiryDate || b.expiryDate >= todayStr)).sort((a, b) => (a.expiryDate || "9999").localeCompare(b.expiryDate || "9999"));
          for (const b of validLocalBatches) {
            if (rem <= 0) break;
            if (b.quantity > 0) { const d = Math.min(b.quantity, rem); b.quantity = Number(b.quantity) - d; rem -= d; }
          }
          if (rem > 0) throw new Error(`庫存不足: ${pData.productName_zh || pid}`);
          const newTotalStock = batches.filter(b => !b.expiryDate || b.expiryDate >= todayStr).reduce((acc, b) => acc + (Number(b.quantity) || 0), 0);
          const currentLocStock = batches.filter(b => b.locationId === locId && (!b.expiryDate || b.expiryDate >= todayStr)).reduce((acc, b) => acc + (Number(b.quantity) || 0), 0);
          const updates: any = { batches, stock: newTotalStock, [`warehouseStock.${locId}`]: currentLocStock, updatedAt: serverTimestamp() };
          if (locId === defaultHubId) updates.onlineStock = currentLocStock;
          transaction.update(pSnap.ref, updates);
        }
        transaction.update(orderRef, { inventorySyncStatus: 'success', updatedAt: serverTimestamp() });
      });
      toast({ title: "庫存同步成功" });
    } catch (e: any) {
      toast({ title: "同步失敗", description: e.message, variant: "destructive" });
    } finally { setIsSyncing(false); }
  };

  return (
    <div className="space-y-10 animate-in fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="space-y-10">
          <div className="space-y-6">
            <h4 className="text-xs font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-primary" /> 核心狀態與支付</h4>
            <div className="grid gap-2 p-5 bg-muted/10 rounded-2xl border border-dashed">
              <Label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-2"><Calendar className="h-3 w-3" /> 訂單成立日期</Label>
              {isEditMode ? <input type="datetime-local" value={orderDateInput || ""} onChange={e => setOrderDateInput(e.target.value)} className="h-11 w-full rounded-xl bg-white border-none shadow-sm px-4 font-black text-slate-800" /> : <p className="font-bold text-sm text-slate-800 px-1">{dateStr}</p>}
            </div>
            <div className="grid gap-6">
              <div className="grid gap-2">
                <Label className="text-[10px] font-black uppercase opacity-60">支付途徑</Label>
                <Select value={paymentMethod || 'none'} onValueChange={setPaymentMethod} disabled={!isEditMode}>
                  <SelectTrigger className="h-11 bg-muted/20 border-none rounded-xl font-bold"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl border-none shadow-2xl">
                    <SelectItem value="none" className="italic opacity-50">未指定</SelectItem>
                    {PAYMENT_METHODS.map(m => <SelectItem key={m.id} value={m.id || 'none'}>{m.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label className="text-[10px] font-black uppercase opacity-60">出貨進度</Label>
                <Select value={fulfillmentStatus || 'none'} onValueChange={setFulfillmentStatus} disabled={!isEditMode}>
                  <SelectTrigger className="h-11 bg-muted/20 border-none rounded-xl font-bold"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl border-none shadow-2xl">
                    <SelectItem value="none" className="italic opacity-50">未指定</SelectItem>
                    {statusT && Object.entries(statusT).map(([key, label]: [string, any]) => <SelectItem key={key} value={key || 'none'}>{label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="text-[10px] font-black uppercase opacity-60">付款狀態</Label>
                  <Select value={paymentStatus || 'unpaid'} onValueChange={setPaymentStatus} disabled={!isEditMode}>
                    <SelectTrigger className="h-11 bg-muted/20 border-none rounded-xl font-bold"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-2xl">
                      <SelectItem value="unpaid">UNPAID (未付款)</SelectItem>
                      <SelectItem value="pending">PENDING (待核實)</SelectItem>
                      <SelectItem value="paid">PAID (已付款)</SelectItem>
                      <SelectItem value="refunded">REFUNDED (已退款)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label className="text-[10px] font-black uppercase opacity-60">客戶最終確認</Label>
                  <div className="flex items-center">
                    {order?.isConfirmed ? <Badge className="bg-green-100 text-green-700 border-none font-bold text-[10px] px-3 h-11 w-full rounded-xl shadow-sm justify-center uppercase">YES</Badge> : <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50 font-bold text-[10px] px-3 h-11 w-full rounded-xl justify-center animate-pulse uppercase">NO</Badge>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="space-y-8">
          <div className="p-8 bg-muted/20 rounded-[2.5rem] space-y-8 border border-dashed shadow-inner">
            <div className="grid gap-2">
              <Label className="text-[10px] font-black uppercase opacity-60">履約分店</Label>
              {isEditMode ? (
                <Select value={fulfillmentLocationId || 'none'} onValueChange={setFulfillmentLocationId}>
                  <SelectTrigger className="h-12 bg-white border-none rounded-xl font-bold shadow-sm"><SelectValue placeholder="選擇分店..." /></SelectTrigger>
                  <SelectContent className="rounded-xl border-none shadow-2xl">
                    <SelectItem value="none" className="italic opacity-50">未指定</SelectItem>
                    {locations?.map((loc: any) => <SelectItem key={loc.id} value={loc.id || 'none'}>{loc.name_zh || loc.name_en}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : <div className="text-lg font-black text-slate-800 flex items-center gap-3 bg-white p-4 rounded-2xl border shadow-sm"><Store className="h-6 w-6 text-primary" /> {resolvedLocationName}</div>}
            </div>
            <div className="grid gap-4">
              <Label className="text-[10px] font-black uppercase opacity-60">庫存同步狀態</Label>
              <div className="flex flex-col items-center justify-center p-6 bg-white rounded-3xl border border-muted-foreground/10 space-y-4">
                {order?.inventorySyncStatus === 'success' ? <Badge className="bg-green-500 text-white border-none font-black h-9 px-6 rounded-2xl gap-2 shadow-md"><CheckCircle2 className="h-4 w-4" /> Synchronized</Badge> : <Button onClick={handleManualSync} disabled={isSyncing || !(fulfillmentLocationId || order?.fulfillmentLocationId)} className="rounded-xl font-bold bg-orange-600 text-white shadow-lg gap-2 px-6">{isSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />} 重新嘗試同步</Button>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
