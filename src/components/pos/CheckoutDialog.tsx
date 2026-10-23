"use client";

import { useState, useMemo } from "react";
import { 
  ShoppingCart, 
  CreditCard, 
  Wallet, 
  MessageCircle, 
  Landmark, 
  Smartphone, 
  DollarSign, 
  QrCode, 
  PlusCircle, 
  CheckCircle2, 
  Printer, 
  Loader2,
  Delete,
  X,
  UserCheck,
  Coins,
  Mail,
  Send,
  Ticket
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { triggerNotification } from "@/services/communication-service";
import { useToast } from "@/hooks/use-toast";
import { useFirestore } from "@/firebase";
import { PAYMENT_METHODS } from "@/lib/constants/payment-methods";
import { Separator } from "@/components/ui/separator";

interface PaymentRecord {
  method: string;
  amount: number;
}

interface CheckoutDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  finalTotal: number;
  onComplete: (payments: PaymentRecord[]) => Promise<void>;
  isProcessing: boolean;
  linkedMember: any | null;
  lastOrder: any | null;
  onPrint: (order: any) => void;
}

export function CheckoutDialog({ 
  isOpen, 
  onOpenChange, 
  finalTotal, 
  onComplete, 
  isProcessing,
  linkedMember,
  lastOrder,
  onPrint
}: CheckoutDialogProps) {
  const { toast } = useToast();
  const db = useFirestore();
  const [step, setStep] = useState(1);
  const [selectedMethod, setSelectedMethod] = useState("kpay_visa");
  const [amountInput, setAmountInput] = useState("");
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [isEmailing, setIsEmailing] = useState(false);

  const totalPaid = useMemo(() => payments.reduce((acc, p) => acc + p.amount, 0), [payments]);
  const remaining = Math.max(0, finalTotal - totalPaid);
  const changeDue = totalPaid > finalTotal ? Math.ceil((totalPaid - finalTotal) * 10) / 10 : 0;

  const handleKeypad = (val: string) => {
    if (val === 'back') setAmountInput(prev => prev.slice(0, -1));
    else if (val === '.') { if (!amountInput.includes('.')) setAmountInput(prev => prev + '.'); }
    else setAmountInput(prev => prev + val);
  };

  const addPayment = () => {
    const amount = Number(amountInput) || remaining;
    if (amount <= 0) return;
    setPayments(prev => [...prev, { method: selectedMethod, amount }]);
    setAmountInput("");
  };

  const handleFinish = async () => {
    await onComplete(payments);
    setStep(2);
  };

  const handleSendEmail = async () => {
    if (!lastOrder || isEmailing || !db) return;
    setIsEmailing(true);
    try {
      const res = await triggerNotification(db, 'order_placed', {
        ...lastOrder,
        id: lastOrder.orderId || lastOrder.id
      }, 'zh', true);

      if (res.success) {
        toast({ title: "確認信已發送", description: `已寄送至客戶信箱。` });
      } else {
        throw new Error(res.message);
      }
    } catch (e: any) {
      toast({ title: "發送失敗", description: e.message, variant: "destructive" });
    } finally {
      setIsEmailing(false);
    }
  };

  const reset = () => {
    setStep(1);
    setPayments([]);
    setAmountInput("");
    setIsEmailing(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[1000px] rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl">
        <div className="flex flex-col h-[750px]">
          <DialogHeader className="p-8 bg-primary text-primary-foreground shrink-0 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10"><ShoppingCart className="h-32 w-32 rotate-12" /></div>
            <div className="relative z-10 flex justify-between items-center text-left">
              <div>
                <DialogTitle className="text-2xl font-black font-headline">POS 交易結帳</DialogTitle>
                <DialogDescription className="text-primary-foreground/80 font-medium">找續與支付管理</DialogDescription>
              </div>
              {linkedMember && (
                <Badge className="bg-white/20 border-none text-white h-8 px-4 rounded-xl gap-2 font-bold">
                  <UserCheck className="h-4 w-4" /> {linkedMember.displayName}
                </Badge>
              )}
            </div>
          </DialogHeader>

          <div className="flex-1 flex overflow-hidden">
            {step === 1 ? (
              <>
                {/* Left: Summary & Action Buttons */}
                <div className="w-[380px] p-8 space-y-6 overflow-y-auto border-r bg-slate-50 flex flex-col">
                  <div className="p-6 bg-white rounded-3xl shadow-sm border border-primary/10">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-[10px] font-black uppercase text-muted-foreground">應收餘額 Balance</span>
                      <span className={cn("text-4xl font-black tracking-tighter", remaining > 0 ? "text-primary" : "text-green-600")}>
                        ${remaining.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-t border-dashed text-[9px] font-black uppercase text-muted-foreground">
                      <span>總額: ${finalTotal.toFixed(2)}</span>
                      <span>已收: ${totalPaid.toFixed(2)}</span>
                    </div>
                  </div>

                  {changeDue > 0 && (
                    <div className="p-6 bg-green-500 text-white rounded-3xl shadow-lg flex justify-between items-center animate-in slide-in-from-top-2">
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-black uppercase opacity-80">應找續 Change Due</p>
                        <p className="text-3xl font-black">${changeDue.toFixed(2)}</p>
                      </div>
                      <Coins className="h-10 w-10 opacity-30 rotate-12" />
                    </div>
                  )}

                  <div className="space-y-3 flex-1">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">已錄入付款歷史</h4>
                    <ScrollArea className="h-40 pr-2">
                      <div className="space-y-2">
                        {payments.length === 0 ? (
                          <div className="py-8 text-center border-2 border-dashed rounded-2xl text-[10px] font-bold text-muted-foreground/40 italic">等待支付錄入...</div>
                        ) : (
                          payments.map((p, idx) => (
                            <div key={idx} className="flex items-center justify-between p-3 bg-white border rounded-2xl shadow-sm">
                              <div className="flex items-center gap-3 text-left">
                                <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                                  {PAYMENT_METHODS.find(m => m.id === p.method)?.label.charAt(0) || "P"}
                                </div>
                                <span className="font-bold text-xs">{PAYMENT_METHODS.find(m => m.id === p.method)?.label || p.method}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-black text-sm text-slate-800">${p.amount.toFixed(2)}</span>
                                <button onClick={() => setPayments(prev => prev.filter((_, i) => i !== idx))} className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"><X className="h-3.5 w-3.5" /></button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  </div>

                  {/* Actions moved to left bottom */}
                  <div className="space-y-3 pt-4">
                    <Button 
                      className="w-full h-14 bg-primary text-primary-foreground font-black text-lg rounded-2xl shadow-lg gap-3" 
                      onClick={addPayment}
                      disabled={Number(amountInput) <= 0 && remaining <= 0}
                    >
                      <PlusCircle className="h-5 w-5" /> 收取款項
                    </Button>
                    <Button 
                      className={cn(
                        "w-full h-16 font-black text-xl rounded-2xl shadow-xl transition-all",
                        totalPaid >= finalTotal && finalTotal > 0 ? "bg-slate-900 text-white hover:scale-[1.02]" : "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
                      )}
                      disabled={totalPaid < finalTotal || isProcessing || finalTotal <= 0} 
                      onClick={handleFinish}
                    >
                      {isProcessing ? <Loader2 className="h-6 w-6 animate-spin" /> : "完成交易"}
                    </Button>
                  </div>
                </div>

                {/* Right: Payment Method Picker & Keypad (WIDER AREA) */}
                <div className="flex-1 flex flex-col p-8 space-y-8 bg-white">
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">選擇付款途徑 (Payment Methods)</h4>
                    <ScrollArea className="h-56 pr-2">
                      <div className="grid grid-cols-4 gap-3">
                        {PAYMENT_METHODS.map(m => (
                          <button 
                            key={m.id} 
                            onClick={() => setSelectedMethod(m.id)}
                            className={cn(
                              "flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all gap-2 h-24",
                              selectedMethod === m.id ? "border-primary bg-primary/5 ring-2 ring-primary/10 shadow-sm" : "border-muted hover:border-primary/20 bg-slate-50"
                            )}
                          >
                            <m.icon className={cn("h-6 w-6", selectedMethod === m.id ? "text-primary" : "text-muted-foreground")} />
                            <span className={cn("text-[10px] font-black uppercase text-center leading-tight", selectedMethod === m.id ? "text-primary" : "text-muted-foreground")}>{m.label}</span>
                          </button>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>

                  <Separator className="border-dashed" />

                  <div className="grid grid-cols-12 gap-8 items-start">
                    {/* Keypad */}
                    <div className="col-span-7 space-y-3">
                      <div className="grid grid-cols-3 gap-2">
                        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '.', 'back'].map((key) => (
                          <Button 
                            key={key} 
                            variant="secondary" 
                            className="h-14 rounded-2xl text-xl font-black bg-slate-50 border-none shadow-sm hover:bg-primary hover:text-white transition-all active:scale-95"
                            onClick={() => handleKeypad(key)}
                          >
                            {key === 'back' ? <Delete className="h-6 w-6" /> : key}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Input Display */}
                    <div className="col-span-5 space-y-4">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">輸入收款金額</Label>
                        <div className="relative">
                          <DollarSign className="absolute left-4 top-4 h-6 w-6 text-primary" />
                          <Input 
                            placeholder="0.00" 
                            className="h-14 pl-12 pr-4 text-3xl font-black bg-muted/20 border-none rounded-2xl text-right shadow-inner" 
                            value={amountInput} 
                            readOnly 
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 gap-2">
                        <Button 
                          variant="outline" 
                          className="h-11 rounded-xl font-black border-primary/20 text-primary bg-white shadow-sm"
                          onClick={() => setAmountInput(remaining.toFixed(2))}
                        >
                          EXACT (收取餘額)
                        </Button>
                        <Button 
                          variant="ghost" 
                          className="h-11 rounded-xl font-bold text-muted-foreground"
                          onClick={() => setAmountInput("")}
                        >
                          CLEAR (清空)
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 text-center space-y-8 py-24 animate-in zoom-in-95">
                <div className="h-28 w-24 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600 shadow-inner">
                  <CheckCircle2 className="h-14 w-14" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-3xl font-black font-headline">交易已完成</h3>
                  <p className="text-muted-foreground font-medium">訂單已成功建立並更新實體店與網店庫存。</p>
                </div>
                <div className="flex flex-col items-center gap-6 px-12 max-w-xl mx-auto">
                  <div className="flex gap-3 w-full">
                    <Button variant="outline" className="flex-1 h-16 rounded-2xl font-black border-muted-foreground/20 gap-3 bg-white shadow-sm hover:bg-slate-50" onClick={() => lastOrder && onPrint(lastOrder)}>
                      <Printer className="h-6 w-6" /> 列印收據
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1 h-16 rounded-2xl font-black border-primary/20 text-primary gap-3 bg-white shadow-sm hover:bg-primary/5"
                      onClick={handleSendEmail}
                      disabled={isEmailing || !lastOrder}
                    >
                      {isEmailing ? <Loader2 className="h-6 w-6 animate-spin" /> : <Mail className="h-6 w-6" />}
                      發送電郵確認
                    </Button>
                  </div>
                  <Button 
                    className="w-full h-16 bg-slate-900 text-white font-black text-xl rounded-2xl shadow-xl hover:scale-[1.02] transition-all" 
                    onClick={reset}
                  >
                    開始下一項交易
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
