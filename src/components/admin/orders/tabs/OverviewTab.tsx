
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
 * 訂單詳情 - 概覽分頁 (V25 穩定簡化版)
 * 修正：為 Select.Item 提供防禦性 value 處理，防止編譯崩潰。
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
    if (!fulfillmentLocationId || !locations) return "未指定";
    const loc = locations.find((l: any) => l.id === fulfillmentLocationId);
    return loc ? (lang === 'en' ? (loc.name_en || loc.name_zh) : (loc.name_zh || loc.name_en)) : fulfillmentLocationId;
  }, [fulfillmentLocationId, locations, lang]);

  const dateStr = order?.createdAt?.seconds ? format(new Date(order.createdAt.seconds * 1000), 'yyyy-MM-dd HH:mm:ss') : "--";
  const awardDateStr = order?.pointsAwardedAt?.seconds ? format(new Date(order.pointsAwardedAt.seconds * 1000), 'yyyy-MM-dd HH:mm:ss') : null;

  /**
   * 手動同步庫存 (嚴格模式)
   */
  const handleManualSync = async () => {
    if (!order?.id || !db) return;
    if (!fulfillmentLocationId) {
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
          const pRef = productRefs[i];

          const qtyToDeduct = items
            .filter((it: any) => String(it.id || it.productId) === pid)
            .reduce((sum: number, it: any) => sum + (Number(it.qty) || 1), 0);

          let batches = Array.isArray(pData.batches) ? [...pData.batches] : [];
          let rem = qtyToDeduct;
          const validLocalBatches = batches.filter(b => b.locationId === fulfillmentLocationId && (!b.expiryDate || b.expiryDate >= todayStr)).sort((a, b) => (a.expiryDate || "9999").localeCompare(b.expiryDate || "9999"));

          for (const b of validLocalBatches) {
            if (rem <= 0) break;
            if (b.quantity > 0) {
              const deduct = Math.min(b.quantity, rem);
              b.quantity = Number(b.quantity) - deduct;
              rem -= deduct;
            }
          }
          
          if (rem > 0) {
             throw new Error(`未過期庫存不足: ${pData.productName_zh || pid}`);
          }

          const newTotalStock = batches.filter(b => !b.expiryDate || b.expiryDate >= todayStr).reduce((acc, b) => acc + (Number(b.quantity) || 0), 0);
          const currentLocStock = batches.filter(b => b.locationId === fulfillmentLocationId && (!b.expiryDate || b.expiryDate >= todayStr)).reduce((acc, b) => acc + (Number(b.quantity) || 0), 0);
          
          const updates: any = { batches, stock: newTotalStock, [`warehouseStock.${fulfillmentLocationId}`]: currentLocStock, updatedAt: serverTimestamp() };
          if (fulfillmentLocationId === defaultHubId) updates.onlineStock = currentLocStock;
          transaction.update(pRef, updates);
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
              <Label className="text-[10px] font-black uppercase text-muted-foreground flex items-center gap-2">
                <Calendar className="h-3 w-3" /> 訂單成立日期與時間
              </Label>
              {isEditMode ? (
                <input 
                  type="datetime-local" 
                  value={orderDateInput} 
                  onChange={e => setOrderDateInput(e.target.value)} 
                  className="h-11 w-full rounded-xl bg-white border-none shadow-sm px-4 font-black text-slate-800"
                />
              ) : (
                <p className="font-bold text-sm text-slate-800 px-1">{dateStr}</p>
              )}
            </div>

            <div className="grid gap-6">
              <div className="grid gap-2">
                <Label className="text-[10px] font-black uppercase opacity-60">主要支付途徑 (Payment Method)</Label>
                <Select value={paymentMethod || 'none'} onValueChange={paymentMethod} disabled={!isEditMode}>
                  <SelectTrigger className="h-11 bg-muted/20 border-none rounded-xl font-bold"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl border-none shadow-2xl">
                    {PAYMENT_METHODS.map(m => <SelectItem key={m.id} value={m.id || 'none'}>{m.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label className="text-[10px] font-black uppercase opacity-60">出貨進度 (Fulfillment)</Label>
                <Select value={fulfillmentStatus || 'none'} onValueChange={setFulfillmentStatus} disabled={!isEditMode}>
                  <SelectTrigger className="h-11 bg-muted/20 border-none rounded-xl font-bold"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl border-none shadow-2xl">
                    {Object.entries(statusT).map(([key, label]: [string, any]) => <SelectItem key={key} value={key || 'none'}>{label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="text-[10px] font-black uppercase opacity-60">付款狀態</Label>
                  <Select value={paymentStatus || 'none'} onValueChange={setPaymentStatus} disabled={!isEditMode}>
                    <SelectTrigger className="h-11 bg-muted/20 border-none rounded-xl font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-2xl">
                      <SelectItem value="unpaid">UNPAID (未付款)</SelectItem>
                      <SelectItem value="pending" className="text-orange-600 font-bold">PENDING (待核實)</SelectItem>
                      <SelectItem value="paid" className="text-green-600 font-bold">PAID (已付款)</SelectItem>
                      <SelectItem value="refunded" className="text-muted-foreground">REFUNDED (已退款)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label className="text-[10px] font-black uppercase opacity-60">客戶最終確認 (isConfirmed)</Label>
                  <div className="flex items-center">
                    {order?.isConfirmed ? (
                      <Badge className="bg-green-100 text-green-700 border-none font-bold text-[10px] px-3 h-11 w-full rounded-xl shadow-sm justify-center uppercase">
                        <CheckCircle2 className="h-3 w-3 mr-1.5" /> YES
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50 font-bold text-[10px] px-3 h-11 w-full rounded-xl justify-center animate-pulse uppercase">
                        <Clock className="h-3 w-3 mr-1.5" /> NO
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <h4 className="text-xs font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2"><Leaf className="h-4 w-4 text-green-600" /> 出貨包裝偏好</h4>
            <div className="p-6 bg-muted/10 rounded-[2rem] border border-dashed space-y-4">
              {isEditMode ? (
                <RadioGroup value={packagingPreference || 'eco'} onValueChange={setPackagingPreference} className="grid grid-cols-2 gap-4">
                  <div className={cn("flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer bg-white", packagingPreference === 'eco' ? "border-green-600 bg-green-50" : "border-muted")} onClick={() => setPackagingPreference('eco')}>
                    <RadioGroupItem value="eco" id="pkg-eco-admin" /><Label htmlFor="pkg-eco-admin" className="text-xs font-bold cursor-pointer">環保 (Eco)</Label>
                  </div>
                  <div className={cn("flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer bg-white", packagingPreference === 'new' ? "border-blue-600 bg-blue-50" : "border-muted")} onClick={() => setPackagingPreference('new')}>
                    <RadioGroupItem value="new" id="pkg-new-admin" /><Label htmlFor="pkg-new-admin" className="text-xs font-bold cursor-pointer">全新 (New)</Label>
                  </div>
                </RadioGroup>
              ) : (
                <div className="flex items-center gap-4">
                  {packagingPreference === 'new' ? (
                    <Badge className="bg-blue-100 text-blue-700 border-blue-200 gap-1.5 h-8 px-4 rounded-xl font-black text-xs uppercase"><Box className="h-4 w-4" /> 全新紙箱出貨 (NEW BOX)</Badge>
                  ) : (
                    <Badge className="bg-green-100 text-green-700 border-green-200 gap-1.5 h-8 px-4 rounded-xl font-black text-xs uppercase"><Leaf className="h-4 w-4" /> 優先環保包裝 (ECO)</Badge>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="p-8 bg-muted/20 rounded-[2.5rem] space-y-8 border border-dashed shadow-inner">
            <div className="grid gap-2">
              <Label className="text-[10px] font-black uppercase opacity-60">履約分店 (Fulfillment Location)</Label>
              {isEditMode ? (
                <Select value={fulfillmentLocationId || 'none'} onValueChange={setFulfillmentLocationId}>
                  <SelectTrigger className="h-12 bg-white border-none rounded-xl font-bold shadow-sm"><SelectValue placeholder="選擇出貨倉庫/門市..." /></SelectTrigger>
                  <SelectContent className="rounded-xl border-none shadow-2xl">
                    <SelectItem value="none" className="italic opacity-40">未指定 (Unassigned)</SelectItem>
                    {locations?.map((loc: any) => <SelectItem key={loc.id} value={loc.id || 'none'}>{loc.name_zh || loc.name_en}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <div className="text-lg font-black text-slate-800 flex items-center gap-3 bg-white p-4 rounded-2xl border shadow-sm">
                  <Store className="h-6 w-6 text-primary" /> {resolvedLocationName}
                </div>
              )}
            </div>
            <div className="grid gap-4">
              <Label className="text-[10px] font-black uppercase opacity-60">庫存同步與狀態</Label>
              <div className="flex flex-col items-center justify-center p-6 bg-white rounded-3xl border border-muted-foreground/10 space-y-4">
                {order?.inventorySyncStatus === 'success' ? (
                  <Badge className="bg-green-500 text-white border-none font-black h-9 px-6 rounded-2xl gap-2 shadow-md">
                    <CheckCircle2 className="h-4 w-4" /> Synchronized
                  </Badge>
                ) : (
                  <div className="flex flex-col items-center gap-4 text-center">
                    <Badge variant={order?.inventorySyncStatus === 'failed' ? "destructive" : "outline"} className="h-9 px-6 rounded-2xl font-black gap-2">
                      {order?.inventorySyncStatus === 'failed' ? <AlertTriangle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                      {order?.inventorySyncStatus === 'failed' ? "Sync Failed" : "Pending Sync"}
                    </Badge>
                    <Button onClick={handleManualSync} disabled={isSyncing || !fulfillmentLocationId} className="rounded-xl font-bold bg-orange-600 text-white hover:bg-orange-700 shadow-lg gap-2 px-6">
                      {isSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />} 重新嘗試同步 (嚴格模式)
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="p-8 bg-indigo-50/50 rounded-[2.5rem] border border-indigo-100 space-y-6">
            <div className="flex justify-between items-center">
              <h4 className="text-[11px] font-black uppercase text-indigo-700 flex items-center gap-2"><Coins className="h-5 w-5" /> 積分發放狀態</h4>
              {awardDateStr && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[9px] font-bold h-6 px-3">
                  {awardDateStr} 已發放
                </Badge>
              )}
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm font-bold">
                <div className="space-y-1">
                  <span className="block">本次交易應得積分</span>
                  {order?.pointsAwarded ? (
                    <Badge className="bg-green-600 text-white border-none text-[8px] h-4 font-black uppercase flex items-center gap-1">
                      <CheckCircle className="h-2 w-2" /> 積分已存入
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[8px] font-black uppercase h-4 border-amber-200 text-amber-600 bg-white">
                      待物流完成後發放
                    </Badge>
                  )}
                </div>
                {isEditMode ? <Input type="number" value={originalEarnedPoints} onChange={e => setOriginalEarnedPoints(e.target.value)} className="h-9 w-24 text-right bg-white" /> : <span className="font-black">+{originalEarnedPoints}</span>}
              </div>

              {isEditMode && !order?.pointsAwarded && (
                 <div className="flex flex-col gap-3 p-4 bg-white rounded-2xl border-2 border-dashed border-primary/30 animate-in slide-in-from-top-2">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label className="text-xs font-black uppercase text-primary">手動補發積分</Label>
                        <p className="text-[9px] text-muted-foreground">勾選後儲存，系統將立即為會員入帳。</p>
                      </div>
                      <Switch checked={pointsAwardedManual} onCheckedChange={setPointsAwardedManual} />
                    </div>
                 </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

