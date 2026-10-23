
"use client";

import { BarChart3, Printer, CreditCard, DollarSign, Smartphone, QrCode, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface ReportDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  reportStartDate: string;
  setReportStartDate: (v: string) => void;
  reportEndDate: string;
  setReportEndDate: (v: string) => void;
  reportSalesData: any;
  locationName: string;
  onPrintReport: () => void;
}

export function ReportDialog({ 
  isOpen, onOpenChange, reportStartDate, setReportStartDate, 
  reportEndDate, setReportEndDate, reportSalesData, 
  locationName, onPrintReport 
}: ReportDialogProps) {
  const averageOrderValue = reportSalesData.count > 0 ? (reportSalesData.total / reportSalesData.count) : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px] rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="p-8 bg-indigo-600 text-white shrink-0">
          <DialogTitle className="text-2xl font-black font-headline flex items-center gap-3">
            <BarChart3 className="h-6 w-6" /> 銷售統計報表
          </DialogTitle>
          <DialogDescription className="text-indigo-100">分店：{locationName || '全部分店'}</DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[600px]">
          <div className="p-8 space-y-8">
            <div className="grid grid-cols-2 gap-4 p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-indigo-700">開始日期</Label>
                <Input type="date" value={reportStartDate} onChange={(e) => setReportStartDate(e.target.value)} className="h-9 bg-white border-indigo-200 rounded-lg text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-indigo-700">結束日期</Label>
                <Input type="date" value={reportEndDate} onChange={(e) => setReportEndDate(e.target.value)} className="h-9 bg-white border-indigo-200 rounded-lg text-xs" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-muted/20 rounded-2xl text-center space-y-1">
                <p className="text-[9px] font-black uppercase text-muted-foreground">成交單數</p>
                <p className="text-xl font-black">{reportSalesData.count}</p>
              </div>
              <div className="p-4 bg-muted/20 rounded-2xl text-center space-y-1">
                <p className="text-[9px] font-black uppercase text-muted-foreground">平均單價 (AOV)</p>
                <p className="text-xl font-black">${averageOrderValue.toFixed(1)}</p>
              </div>
              <div className="p-4 bg-primary/10 border border-primary/20 rounded-2xl text-center space-y-1">
                <p className="text-[9px] font-black uppercase text-primary">總營業額</p>
                <p className="text-xl font-black text-primary">${reportSalesData.total.toLocaleString()}</p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase text-muted-foreground tracking-widest px-1">支付途徑細分 (Payment Breakdown)</h4>
              <div className="grid grid-cols-1 gap-2">
                <div className="bg-muted/10 rounded-2xl border p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-black">KPay 網關匯總</span>
                    </div>
                    <span className="font-black text-lg text-blue-700">${reportSalesData.kpayTotal.toLocaleString()}</span>
                  </div>
                  
                  {/* 只顯示金額大於 0 的 KPay 子渠道 */}
                  <div className="pl-6 grid grid-cols-2 gap-y-2 gap-x-6 border-l-2 border-muted/50">
                    {Object.entries(reportSalesData.kpaySub || {})
                      .filter(([_, val]) => (val as number) > 0)
                      .map(([method, val]) => (
                      <div key={method} className="flex justify-between text-[11px] font-medium text-muted-foreground animate-in fade-in">
                        <span className="uppercase">{method}</span>
                        <span className="font-bold text-slate-700">$ {(val as number).toFixed(1)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="p-4 bg-muted/20 rounded-2xl text-center space-y-1">
                    <DollarSign className="h-4 w-4 mx-auto text-green-600" />
                    <p className="text-[9px] font-black uppercase text-muted-foreground">現金</p>
                    <p className="font-black text-sm">${reportSalesData.cash.toFixed(1)}</p>
                  </div>
                  <div className="p-4 bg-muted/20 rounded-2xl text-center space-y-1">
                    <Smartphone className="h-4 w-4 mx-auto text-orange-600" />
                    <p className="text-[9px] font-black uppercase text-muted-foreground">八達通</p>
                    <p className="font-black text-sm">${reportSalesData.octopus.toFixed(1)}</p>
                  </div>
                  <div className="p-4 bg-muted/20 rounded-2xl text-center space-y-1">
                    <QrCode className="h-4 w-4 mx-auto text-red-600" />
                    <p className="text-[9px] font-black uppercase text-muted-foreground">PayMe</p>
                    <p className="font-black text-sm">${reportSalesData.payme.toFixed(1)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 bg-muted/10 border-t flex justify-between gap-3">
          <Button variant="ghost" className="font-bold text-xs" onClick={() => onOpenChange(false)}>關閉視窗</Button>
          <Button className="bg-primary text-primary-foreground font-black rounded-xl h-11 px-6 gap-2 shadow-lg" onClick={onPrintReport}>
            <Printer className="h-4 w-4" /> 列印完整報表
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
