"use client";

import React, { useState } from "react";
import { CreditCard, DollarSign, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { PAYMENT_METHODS } from "@/lib/constants/payment-methods";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export function NewOrderPayment({ payments, totalNeeded, totalPaid, onAdd, onRemove }: any) {
  const [method, setMethod] = useState("cash");
  const [amount, setAmount] = useState("");

  const handleAdd = () => {
    const val = parseFloat(amount);
    if (isNaN(val) || val <= 0) return;
    onAdd({ method, amount: val, date: format(new Date(), "yyyy-MM-dd HH:mm") });
    setAmount("");
  };

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="space-y-6">
          <h4 className="text-xs font-black uppercase text-primary tracking-widest flex items-center gap-2"><CreditCard className="h-4 w-4" /> 錄入支付記錄</h4>
          <div className="p-6 bg-primary/5 rounded-[2.5rem] border-2 border-primary/20 space-y-4 shadow-inner">
            <div className="grid gap-2">
              <Label className="text-[10px] font-bold">支付工具</Label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger className="bg-white rounded-xl font-bold"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-xl border-none shadow-2xl max-h-80">
                  <SelectGroup>
                    <SelectLabel className="text-[9px] font-black uppercase opacity-50 px-2 pt-2">手動與現金</SelectLabel>
                    {PAYMENT_METHODS.filter(m => m.type === 'manual').map(m => (
                      <SelectItem key={m.id} value={m.id} className="font-bold">{m.label}</SelectItem>
                    ))}
                  </SelectGroup>
                  <SelectGroup>
                    <SelectLabel className="text-[9px] font-black uppercase opacity-50 px-2 pt-2">卡機與網上 (KPay/Yedpay)</SelectLabel>
                    {PAYMENT_METHODS.filter(m => m.type !== 'manual').map(m => (
                      <SelectItem key={m.id} value={m.id} className="font-bold">{m.label}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label className="text-[10px] font-bold">金額 ($)</Label>
              <div className="flex gap-2">
                <Input type="number" value={amount} onChange={e => setAmount(e.target.value)} className="h-11 bg-white rounded-xl font-black text-primary text-lg" placeholder="0.0" />
                <Button onClick={handleAdd} className="h-11 px-6 rounded-xl font-black shadow-md">錄入</Button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <h4 className="text-xs font-black uppercase text-muted-foreground tracking-widest">已收帳款明細</h4>
          <div className="space-y-2">
            {payments.length === 0 ? (
              <div className="py-12 text-center border-2 border-dashed rounded-3xl text-xs text-muted-foreground italic">尚無支付記錄 (待付款)</div>
            ) : (
              payments.map((p: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-4 bg-white border rounded-2xl shadow-sm">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-[8px] font-black uppercase">{p.method}</Badge>
                    <span className="text-[10px] text-muted-foreground font-mono">{p.date}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-black text-sm">${p.amount.toFixed(1)}</span>
                    <button type="button" onClick={() => onRemove(i)} className="text-muted-foreground hover:text-destructive"><X className="h-4 w-4" /></button>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="p-6 bg-muted/20 rounded-[2rem] border border-dashed space-y-3">
             <div className="flex justify-between text-xs font-bold"><span>應收總額</span><span>${totalNeeded.toFixed(1)}</span></div>
             <div className="flex justify-between text-xs font-black text-green-600"><span>累計已收</span><span>${totalPaid.toFixed(1)}</span></div>
             <Separator className="opacity-50" />
             <div className="flex justify-between text-lg font-black">
               <span>尚欠餘額</span>
               <span className={cn(totalPaid >= totalNeeded ? "text-green-600" : "text-orange-600")}>
                 ${Math.max(0, totalNeeded - totalPaid).toFixed(1)}
               </span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
