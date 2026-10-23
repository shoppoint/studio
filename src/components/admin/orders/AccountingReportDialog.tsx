
"use client";

import { useState, useMemo } from "react";
import { 
  FileBarChart, 
  Download, 
  Calendar, 
  Info, 
  CheckCircle2, 
  X,
  FileSpreadsheet,
  AlertTriangle,
  FileText,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { useI18n } from "@/lib/i18n/i18n-context";
import { format, startOfDay, endOfDay, isWithinInterval, parseISO } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { generateDetailedAccountingReportHtml } from "@/lib/print-templates";
import { useCollection, useFirestore } from "@/firebase";
import { collection, query } from "firebase/firestore";

interface AccountingReportDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  orders: any[];
}

/**
 * 全通路會計對帳報表生成器 (自取點佣金支援版)
 */
export function AccountingReportDialog({ isOpen, onOpenChange, orders }: AccountingReportDialogProps) {
  const { lang } = useI18n();
  const { toast } = useToast();
  const db = useFirestore();
  const isEn = lang === 'en';

  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-01"));
  const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [reportLoading, setReportLoading] = useState(false);

  const locsQuery = useMemo(() => db ? query(collection(db, 'locations')) : null, [db]);
  const { data: locations } = useCollection<any>(locsQuery);

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      if (!o.createdAt?.seconds) return false;
      const orderDate = new Date(o.createdAt.seconds * 1000);
      return isWithinInterval(orderDate, {
        start: startOfDay(parseISO(startDate)),
        end: endOfDay(parseISO(endDate))
      }) && o.status !== 'cancelled';
    });
  }, [orders, startDate, endDate]);

  const handleExportCSV = () => {
    if (filteredOrders.length === 0) {
      toast({ title: isEn ? "No Data" : "無資料", variant: "destructive" });
      return;
    }

    const headers = ["Order ID", "Date", "Source", "Location", "Customer", "Total", "Payout Due"];
    const rows = filteredOrders.map(o => {
      const loc = locations?.find(l => l.id === o.fulfillmentLocationId);
      const locName = loc ? (lang === 'en' ? loc.name_en : loc.name_zh) : (o.fulfillmentLocationId || "Main Hub");
      
      // 計算應付自取點費用
      let payoutDue = 0;
      if (loc?.isPickupEnabled) {
        if (loc.payoutType === 'percent') payoutDue = (o.total || 0) * (Number(loc.payoutValue) || 0) / 100;
        else payoutDue = Number(loc.payoutValue) || 0;
      }

      return [
        o.orderId || o.id,
        o.createdAt?.seconds ? format(new Date(o.createdAt.seconds * 1000), 'yyyy-MM-dd') : '--',
        o.sourceType || "Web",
        `"${locName}"`,
        `"${o.customerInfo?.name || "Guest"}"`,
        o.total || 0,
        payoutDue.toFixed(1)
      ].join(',');
    });

    const csvContent = "\ufeff" + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.setAttribute("href", URL.createObjectURL(blob));
    link.setAttribute("download", `accounting_full_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
    toast({ title: "CSV 檔案已下載" });
  };

  const handleGenerateDetailedReport = () => {
    if (filteredOrders.length === 0) {
      toast({ title: "無數據", variant: "destructive" });
      return;
    }

    setReportLoading(true);
    try {
      const totalGmv = filteredOrders.reduce((acc, o) => acc + (o.total || 0), 0);
      const totalDiscount = filteredOrders.reduce((acc, o) => acc + (Number(o.discountAmount || 0) + Number(o.pointsUsedValue || 0)), 0);
      const aov = totalGmv / filteredOrders.length;

      const channelSummary: Record<string, { amount: number, count: number }> = { 'Web': { amount: 0, count: 0 }, 'POS': { amount: 0, count: 0 }, 'Manual': { amount: 0, count: 0 } };
      const paymentSummary: Record<string, number> = {};
      const productSummary: Record<string, number> = {};
      const groupedOrders: { Web: any[], POS: any[], Manual: any[] } = { Web: [], POS: [], Manual: [] };

      filteredOrders.forEach(o => {
        const source = (o.sourceType || 'Web') as keyof typeof groupedOrders;
        const itemTotal = Number(o.total) || 0;
        if (channelSummary[source]) { channelSummary[source].amount += itemTotal; channelSummary[source].count += 1; }
        if (groupedOrders[source]) { groupedOrders[source].push({ id: o.id, orderId: o.orderId || o.id, date: o.createdAt?.seconds ? format(new Date(o.createdAt.seconds * 1000), 'yyyy-MM-dd HH:mm') : '--', name: o.customerInfo?.name || "Guest", method: o.paymentMethod || "Other", total: itemTotal }); }
        if (Array.isArray(o.payments)) { o.payments.forEach((p: any) => { const method = String(p.method || 'other').toLowerCase(); paymentSummary[method] = (paymentSummary[method] || 0) + (Number(p.amount) || 0); }); }
        (o.items || []).forEach((it: any) => { const name = String(it.name || "Unknown Item"); productSummary[name] = (productSummary[name] || 0) + (Number(it.qty) || 1); });
      });

      const html = generateDetailedAccountingReportHtml({ totalGmv, totalDiscount, aov, channelSummary, paymentSummary, productSummary, groupedOrders }, `${startDate} ~ ${endDate}`);
      const win = window.open('', '_blank', 'width=1200,height=900');
      if (win) { win.document.write(html); win.document.close(); }
      toast({ title: "報表已生成" });
    } catch (e: any) {
      toast({ title: "生成失敗", variant: "destructive" });
    } finally {
      setReportLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="p-8 bg-indigo-600 text-white shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12"><FileBarChart className="h-32 w-32" /></div>
          <DialogTitle className="text-2xl font-black font-headline relative z-10">對帳報表與自取點結算</DialogTitle>
          <DialogDescription className="text-indigo-100 font-medium relative z-10">
            匯總跨渠道營收，並自動計算合作店服務費。
          </DialogDescription>
        </DialogHeader>

        <div className="p-8 space-y-8 bg-white text-left">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">開始日期</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="h-11 bg-muted/20 border-none rounded-xl font-bold" />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">結束日期</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="h-11 bg-muted/20 border-none rounded-xl font-bold" />
            </div>
          </div>

          <div className="p-6 bg-indigo-50 rounded-[2rem] border border-indigo-100 space-y-3 text-[10px] text-indigo-800 leading-relaxed font-bold italic">
            <Info className="h-4 w-4 inline mr-2" />
            提示：CSV 匯出現在包含「應付自取點費用 (Payout Due)」欄位，系統會自動根據各店設定的固定金額或百分比進行計算。
          </div>

          <div className="grid grid-cols-1 gap-3">
            <Button onClick={handleGenerateDetailedReport} disabled={reportLoading} className="w-full h-16 bg-indigo-600 text-white font-black text-lg rounded-2xl shadow-xl gap-2">
              {reportLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileText className="h-5 w-5" />}
              生成視覺化總表
            </Button>
            <Button variant="outline" onClick={handleExportCSV} className="w-full h-12 rounded-xl border-dashed border-indigo-200 text-indigo-700 font-bold gap-2">
              <FileSpreadsheet className="h-4 w-4" /> 匯出 CSV (含合作店佣金計算)
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

