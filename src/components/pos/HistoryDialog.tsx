"use client";

import { useState } from "react";
import { History, Eye, Printer, ChevronRight, Zap, XCircle, Clock, Loader2, AlertTriangle, Globe, Monitor, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface HistoryDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  orderHistory: any[] | null;
  currentLocationId: string;
  onPrintReceipt: (order: any) => void;
  onLoadReservation: (order: any) => void;
  onCancelOrder: (order: any) => Promise<void>;
  isProcessing?: boolean;
}

export function HistoryDialog({ 
  isOpen, 
  onOpenChange, 
  orderHistory, 
  currentLocationId, 
  onPrintReceipt,
  onLoadReservation,
  onCancelOrder,
  isProcessing = false
}: HistoryDialogProps) {
  
  const [confirmCancelOrder, setConfirmCancelOrder] = useState<any | null>(null);

  const handleConfirmAction = async () => {
    if (!confirmCancelOrder) return;
    await onCancelOrder(confirmCancelOrder);
    setConfirmCancelOrder(null);
  };

  const getSourceBadge = (order: any) => {
    const s = String(order.sourceType || 'Web');
    if (s === 'Web') {
      const isPickup = !!order.isPickup;
      return (
        <Badge className={cn(
          "text-white border-none text-[8px] h-4 px-1.5 font-black uppercase flex items-center gap-1",
          isPickup ? "bg-blue-600" : "bg-cyan-600"
        )}>
          <Globe className="h-2 w-2" /> {isPickup ? "Web Pickup" : "Web Delivery"}
        </Badge>
      );
    }
    if (s === 'Manual') {
      return (
        <Badge className="bg-amber-100 text-amber-800 border-none text-[8px] h-4 px-1.5 font-black uppercase flex items-center gap-1">
          <User className="h-2 w-2" /> Manual
        </Badge>
      );
    }
    return (
      <Badge className="bg-indigo-100 text-indigo-700 border-none text-[8px] h-4 px-1.5 font-black uppercase flex items-center gap-1">
        <Monitor className="h-2 w-2" /> POS Store
      </Badge>
    );
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[950px] rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-8 bg-muted/10 border-b">
            <DialogTitle className="text-2xl font-black font-headline flex items-center gap-3">
              <History className="h-6 w-6 text-primary" /> 本店交易與預留記錄
            </DialogTitle>
            <DialogDescription className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              僅顯示指定至本分店的訂單 (包含 POS、手動錄入及網店取貨)
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[600px]">
            <Table>
              <TableHeader className="bg-muted/5">
                <TableRow>
                  <TableHead className="pl-8">單號 / 來源</TableHead>
                  <TableHead>時間</TableHead>
                  <TableHead>顧客資訊</TableHead>
                  <TableHead>總額</TableHead>
                  <TableHead>狀態</TableHead>
                  <TableHead className="text-right pr-8">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!orderHistory || orderHistory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-40 text-center text-muted-foreground italic">本店暫無相關交易紀錄。</TableCell>
                  </TableRow>
                ) : (
                  orderHistory
                    .map((order) => {
                      const s = String(order.status || "").toLowerCase();
                      const isCompleted = s === 'delivered' || s === 'picked_up';
                      const isCancelled = s === 'cancelled';
                      const isPendingAction = !isCompleted && !isCancelled;

                      return (
                        <TableRow key={order.id} className={cn(
                          "group transition-colors", 
                          order.status === 'reserved' || (order.sourceType === 'Web' && order.paymentStatus === 'unpaid') ? "bg-orange-50/30 hover:bg-orange-50/50" : 
                          isCancelled ? "opacity-50 grayscale bg-slate-50" : "hover:bg-muted/30"
                        )}>
                          <TableCell className="pl-8 py-5">
                            <div className="space-y-1">
                              <span className="font-black text-xs block">#{order.orderId || order.id.slice(-8)}</span>
                              <div className="flex items-center gap-1.5">
                                {getSourceBadge(order)}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground font-medium">
                            {order.createdAt?.seconds ? format(new Date(order.createdAt.seconds * 1000), 'yyyy-MM-dd HH:mm') : '--'}
                          </TableCell>
                          <TableCell>
                            <div className="space-y-0.5">
                              <p className="font-bold text-xs">{order.customerInfo?.name || "Guest"}</p>
                              <p className="text-[9px] text-muted-foreground font-mono">{order.customerInfo?.phone || "--"}</p>
                            </div>
                          </TableCell>
                          <TableCell className="font-black text-primary">${(order.total || 0).toFixed(1)}</TableCell>
                          <TableCell>
                             <div className="space-y-1">
                               <Badge 
                                  variant="outline" 
                                  className={cn(
                                    "text-[8px] font-black uppercase border-none px-2 h-5",
                                    order.status === 'reserved' ? "bg-orange-500 text-white" :
                                    isCancelled ? "bg-red-500 text-white" :
                                    isCompleted ? "bg-green-600 text-white" :
                                    "bg-blue-100 text-blue-700"
                                  )}
                                >
                                  {(order.status || "PENDING").toUpperCase()}
                                </Badge>
                                <p className={cn(
                                  "text-[8px] font-bold uppercase ml-1",
                                  order.paymentStatus === 'paid' ? "text-green-600" : "text-red-500"
                                )}>
                                  {order.paymentStatus === 'paid' ? "Paid (已付)" : "Unpaid (未付)"}
                                </p>
                             </div>
                          </TableCell>
                          <TableCell className="text-right pr-8">
                            <div className="flex items-center justify-end gap-2">
                              {isPendingAction && (
                                <>
                                  <Button 
                                    variant="default" 
                                    size="sm" 
                                    className="h-9 bg-primary text-primary-foreground rounded-xl font-black gap-2 shadow-md hover:scale-105 transition-all"
                                    onClick={(e) => { e.stopPropagation(); onLoadReservation(order); }}
                                    disabled={isProcessing}
                                  >
                                    <Zap className="h-3.5 w-3.5 fill-current" /> 
                                    {order.paymentStatus === 'paid' ? "處理取貨" : "收款並取貨"}
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-9 w-9 rounded-full text-destructive hover:bg-red-50"
                                    onClick={(e) => { e.stopPropagation(); setConfirmCancelOrder(order); }}
                                    disabled={isProcessing}
                                    title="取消訂單"
                                  >
                                    {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                                  </Button>
                                </>
                              )}
                              
                              {isCompleted && (
                                <Button variant="outline" size="sm" className="h-8 rounded-lg font-bold gap-1.5" onClick={(e) => { e.stopPropagation(); onPrintReceipt(order); }}>
                                  <Printer className="h-3.5 w-3.5" /> 補印收據
                                </Button>
                              )}
                              
                              <Button variant="ghost" size="icon" asChild className="h-8 w-8 rounded-full">
                                <Link href={`/admin/orders/${order.id}`} target="_blank">
                                  <ChevronRight className="h-4 w-4" />
                                </Link>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmCancelOrder} onOpenChange={(v) => !v && setConfirmCancelOrder(null)}>
        <DialogContent className="sm:max-w-[400px] rounded-[2rem] p-8 border-none shadow-2xl text-center">
          <DialogHeader>
            <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center text-red-600 mx-auto mb-4">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <DialogTitle className="text-xl font-black">確認取消訂單？</DialogTitle>
            <DialogDescription className="pt-2">
              此操作將取消訂單並釋放庫存回系統。<br/>
              單號：#{confirmCancelOrder?.orderId || confirmCancelOrder?.id?.slice(-8)}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex gap-3">
            <Button variant="ghost" className="flex-1 rounded-xl h-12 font-bold" onClick={() => setConfirmCancelOrder(null)} disabled={isProcessing}>
              取消
            </Button>
            <Button variant="destructive" className="flex-1 rounded-xl h-12 font-black shadow-lg" onClick={handleConfirmAction} disabled={isProcessing}>
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              確認執行
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
