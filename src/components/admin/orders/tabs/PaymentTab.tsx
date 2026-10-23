"use client";

import React, { useState } from "react";
import { CreditCard, Trash2, Calculator, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { PAYMENT_METHODS } from "@/lib/constants/payment-methods";
import { format } from "date-fns";
import { useFirestore } from "@/firebase";
import { cn } from "@/lib/utils";

/**
 * 訂單詳情 - 支付紀錄分頁
 * 修正：將網上收款選項細分，並加入分組顯示以提升錄入準確度。
 */
export function PaymentTab({ localPayments, setLocalPayments, totalValue, totalPaidValue, isEditMode, isAdmin }: any) {
  const db = useFirestore();
  const [newMethod, setNewMethod] = useState("cash");
  const [newAmount, setNewAmount] = useState("");

  const safeTotal = isNaN(totalValue) ? 0 : Number(totalValue);
  const safePaid = isNaN(totalPaidValue) ? 0 : Number(totalPaidValue);

  const handleAdd = () => {
    const amt = parseFloat(newAmount);
    if (isNaN(amt) || amt <= 0) return;
    setLocalPayments([...(localPayments || []), { 
      method: newMethod, 
      amount: amt, 
      date: format(new Date(), 'yyyy-MM-dd HH:mm') 
    }]);
    setNewAmount("");
  };

  if (!db) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 animate-in fade-in">
      <div className="space-y-8">
        <h4 className="text-xs font-black uppercase text-primary tracking-widest flex items-center gap-2"><CreditCard className="h-4 w-4" /> 交易款項明細</h4>
        
        {isEditMode && isAdmin && (
          <div className="p-6 bg-primary/5 rounded-[2.5rem] border-2 border-primary/20 space-y-4 shadow-inner">
            <div className="grid gap-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">錄入實收金額</Label>
              <div className="flex flex-col gap-4">
                <Select value={newMethod} onValueChange={setNewMethod}>
                  <SelectTrigger className="h-12 bg-white rounded-2xl font-black shadow-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-none shadow-2xl max-h-[400px]">
                    <SelectGroup>
                      <SelectLabel className="text-[9px] font-black uppercase opacity-40 px-2 pt-2">網上收款 (Online/Yedpay)</SelectLabel>
                      {PAYMENT_METHODS.filter(m => m.type === 'online').map(m => (
                        <SelectItem key={m.id} value={m.id} className="font-bold">{m.label}</SelectItem>
                      ))}
                    </SelectGroup>
                    <Separator className="my-1" />
                    <SelectGroup>
                      <SelectLabel className="text-[9px] font-black uppercase opacity-40 px-2 pt-2">手動與現金 (Manual)</SelectLabel>
                      {PAYMENT_METHODS.filter(m => m.type === 'manual').map(m => (
                        <SelectItem key={m.id} value={m.id} className="font-bold">{m.label}</SelectItem>
                      ))}
                    </SelectGroup>
                    <Separator className="my-1" />
                    <SelectGroup>
                      <SelectLabel className="text-[9px] font-black uppercase opacity-40 px-2 pt-2">KPay 實體卡機</SelectLabel>
                      {PAYMENT_METHODS.filter(m => m.type === 'kpay').map(m => (
                        <SelectItem key={m.id} value={m.id} className="font-bold">{m.label}</SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                   <Input 
                     type="number" 
                     placeholder="0.0" 
                     value={newAmount} 
                     onChange={e => setNewAmount(e.target.value)} 
                     className="h-12 rounded-2xl bg-white border-none font-black text-xl text-primary" 
                   />
                   <Button className="h-12 px-6 rounded-2xl font-black shadow-lg" onClick={handleAdd}>錄入紀錄</Button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {(!localPayments || localPayments.length === 0) ? (
             <div className="py-10 text-center border-2 border-dashed rounded-3xl text-xs text-muted-foreground italic">尚未有支付紀錄。</div>
          ) : localPayments.map((p: any, i: number) => (
            <div key={i} className="flex items-center justify-between p-5 bg-white border rounded-2xl shadow-sm">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground font-black text-[10px] uppercase">
                  {p.method.includes('coupon') ? 'CPN' : p.method.replace('kpay_', '').substring(0, 3)}
                </div>
                <div className="space-y-0.5">
                  <span className="font-black text-sm uppercase tracking-tight">
                    {PAYMENT_METHODS.find(m => m.id === p.method)?.label || p.method}
                  </span>
                  <p className="text-[10px] text-muted-foreground font-mono">{p.date}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="font-black text-lg text-slate-800">${Number(p.amount).toFixed(1)}</span>
                {isEditMode && <button onClick={() => setLocalPayments(localPayments.filter((_:any,idx:number)=>idx!==i))} className="text-muted-foreground hover:text-destructive transition-colors ml-2"><Trash2 className="h-4 w-4" /></button>}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-8">
        <div className="p-10 bg-indigo-50/50 rounded-[3rem] border border-indigo-100 space-y-6 shadow-inner">
           <h4 className="text-[11px] font-black uppercase text-indigo-700 flex items-center gap-2">結算核對 (Accounting)</h4>
           <div className="space-y-5">
             <div className="flex justify-between items-center text-sm font-bold text-slate-600">
               <span>訂單應收總額 (Gross)</span>
               <span>$ {safeTotal.toFixed(1)}</span>
             </div>
             <div className="flex justify-between items-center text-sm font-black text-green-600 bg-white/60 p-3 rounded-xl border border-green-100">
               <span>累計實收金額 (Collected)</span>
               <span>$ {safePaid.toFixed(1)}</span>
             </div>
             <Separator className="bg-indigo-200" />
             <div className="flex justify-between items-center pt-2">
               <span className="text-base font-black uppercase text-indigo-900">未清餘額 Balance</span>
               <span className={cn("text-4xl font-black tracking-tighter", safePaid >= safeTotal ? "text-green-600" : "text-orange-600")}>
                 $ {Math.max(0, safeTotal - safePaid).toFixed(1)}
               </span>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}

