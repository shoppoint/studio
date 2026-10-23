
"use client";

import { Calculator, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SettleDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  locationName: string;
  todaySalesData: any;
  openingFloat: string;
  onConfirm: () => void;
}

export function SettleDialog({ isOpen, onOpenChange, locationName, todaySalesData, openingFloat, onConfirm }: SettleDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="p-8 bg-red-600 text-white shrink-0">
          <DialogTitle className="text-2xl font-black font-headline">日結結算</DialogTitle>
          <DialogDescription className="text-red-100">今日分店：{locationName}</DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[500px]">
          <div className="p-8 space-y-8">
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase text-muted-foreground tracking-widest px-1 flex items-center gap-2">
                <Calculator className="h-4 w-4" /> 今日收款核帳
              </h4>
              <div className="grid grid-cols-1 gap-2">
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-blue-900">KPay 總額 (含信用卡/掃碼)</span>
                    <span className="font-black text-blue-900">${todaySalesData.kpayTotal.toLocaleString()}</span>
                  </div>
                  <div className="pl-4 grid grid-cols-2 gap-1 border-l border-blue-200">
                    {Object.entries(todaySalesData.kpaySub || {}).filter(([_, v]) => (v as number) > 0).map(([m, v]) => (
                      <div key={m} className="flex justify-between text-[10px] text-blue-700/70">
                        <span className="uppercase">{m}</span>
                        <span>$ {(v as number).toFixed(1)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex justify-between items-center p-3 bg-orange-50 rounded-xl border border-orange-100">
                  <span className="text-xs font-bold text-orange-900">八達通 (Octopus)</span>
                  <span className="font-black text-orange-900">${todaySalesData.octopus.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-red-50 rounded-xl border border-red-100">
                  <span className="text-xs font-bold text-red-900">PayMe</span>
                  <span className="font-black text-red-900">${todaySalesData.payme.toLocaleString()}</span>
                </div>
              </div>
            </div>
            
            <Separator className="border-dashed" />
            
            <div className="grid grid-cols-2 gap-6">
              <div className="p-4 bg-muted/20 rounded-2xl space-y-1">
                <p className="text-[10px] font-black uppercase text-muted-foreground">預計現金餘額</p>
                <p className="text-2xl font-black">${(Number(openingFloat) + todaySalesData.cash).toFixed(2)}</p>
              </div>
              <div className="p-4 bg-primary/5 rounded-2xl space-y-1 border border-primary/10">
                <p className="text-[10px] font-black uppercase text-primary">實數現金總額</p>
                <Input type="number" placeholder="0" className="bg-white h-10 border-none rounded-xl font-black text-lg text-primary text-right" />
              </div>
            </div>
            
            <Button className="w-full h-16 bg-red-600 text-white font-black text-xl rounded-3xl shadow-xl hover:bg-red-700 transition-all" onClick={onConfirm}>
              確認結算並關閉
            </Button>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
