"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  RefreshCcw, 
  Camera, 
  CheckCircle2, 
  AlertCircle, 
  Info,
  Package,
  ChevronRight,
  Loader2,
  Trash2,
  Check,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/lib/i18n/i18n-context";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useFirestore, useDoc, useUser } from "@/firebase";
import { doc } from "firebase/firestore";

export default function ReturnRequestPage() {
  const params = useParams();
  const router = useRouter();
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const db = useFirestore();
  const { user } = useUser();
  const orderId = params.orderId as string;

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // Form State
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [reason, setReason] = useState("");
  const [comment, setComment] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  // 獲取真實訂單數據
  const orderRef = useMemo(() => orderId ? doc(db, 'orders', orderId) : null, [db, orderId]);
  const { data: order, loading: orderLoading } = useDoc<any>(orderRef);

  const retT = t.return_form;

  const handleToggleItem = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (!order?.items) return;
    if (selectedItems.length === order.items.length) setSelectedItems([]);
    else setSelectedItems(order.items.map((i: any) => i.id || i.productId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedItems.length === 0) {
      toast({ title: "Selection Required", description: "Please select at least one item.", variant: "destructive" });
      return;
    }
    if (!reason) {
      toast({ title: "Reason Required", description: "Please select a reason for return.", variant: "destructive" });
      return;
    }

    setLoading(true);
    // 這裡通常會調用 API 建立一個 Return Request 文檔
    setTimeout(() => {
      setLoading(false);
      setStep(3);
      toast({ title: t.common.success, description: retT.success_title });
    }, 1500);
  };

  if (!mounted || orderLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-muted/10">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  const isAuthorized = user && order && (order.customerId === user.uid || order.customerInfo?.email === user.email);

  if (!order || !isAuthorized) {
    return (
      <div className="min-h-screen flex flex-col bg-muted/10">
        <Navbar />
        <div className="flex-grow flex flex-col items-center justify-center p-20 space-y-6">
          <X className="h-16 w-16 text-muted-foreground/20" />
          <h2 className="text-2xl font-black font-headline">找不到訂單資訊</h2>
          <Button variant="outline" asChild className="rounded-xl"><Link href="/profile?tab=orders">返回訂單記錄</Link></Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-muted/10">
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 py-12 max-w-3xl">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link href="/profile" className="hover:text-primary transition-colors">{t.nav.home}</Link>
          <ChevronRight className="h-4 w-4" />
          <Link href="/profile?tab=orders" className="hover:text-primary transition-colors">{t.profile.orders}</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground font-bold">{retT.title}</span>
        </div>

        {/* Progress Tracker */}
        <div className="flex items-center justify-center gap-4 mb-10 overflow-x-auto py-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2 shrink-0">
              <div className={cn(
                "h-8 w-8 rounded-full border-2 flex items-center justify-center font-bold text-xs transition-all",
                step >= s ? "bg-primary border-primary text-primary-foreground shadow-md" : "bg-white border-muted text-muted-foreground"
              )}>
                {step > s ? <CheckCircle2 className="h-4 w-4" /> : s}
              </div>
              <span className={cn(
                "text-xs font-bold uppercase tracking-wider",
                step >= s ? "text-foreground" : "text-muted-foreground"
              )}>
                {s === 1 ? retT.step_items : s === 2 ? retT.step_reason : retT.step_success}
              </span>
              {s < 3 && <Separator className="w-8 bg-muted" />}
            </div>
          ))}
        </div>

        {step < 3 ? (
          <form onSubmit={handleSubmit}>
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Card className="border-none shadow-xl bg-white rounded-3xl overflow-hidden">
                <CardHeader className="bg-primary/5 p-8 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl font-black font-headline">{retT.title}</CardTitle>
                      <CardDescription className="mt-1">{retT.subtitle}</CardDescription>
                    </div>
                    <Badge variant="outline" className="bg-white h-8 border-primary/20 text-primary font-mono">{orderId}</Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-8 space-y-8">
                  {/* Step 1: Items Selection */}
                  {step === 1 && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-lg flex items-center gap-2"><Package className="h-5 w-5 text-primary" /> {retT.step_items}</h3>
                        <button type="button" onClick={handleSelectAll} className="text-primary font-bold text-sm hover:underline">{retT.select_all}</button>
                      </div>
                      <div className="space-y-4">
                        {order.items?.map((item: any) => {
                          const itemId = item.id || item.productId;
                          return (
                            <div 
                              key={itemId} 
                              className={cn(
                                "flex items-center gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer",
                                selectedItems.includes(itemId) ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-muted hover:border-primary/20"
                              )}
                              onClick={() => handleToggleItem(itemId)}
                            >
                              <div className={cn(
                                "h-5 w-5 rounded border-2 flex items-center justify-center transition-colors shrink-0",
                                selectedItems.includes(itemId) ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/30"
                              )}>
                                {selectedItems.includes(itemId) && <Check className="h-3.5 w-3.5" strokeWidth={4} />}
                              </div>
                              <div className="h-16 w-16 rounded-xl bg-muted overflow-hidden shrink-0 border relative">
                                {item.image ? <img src={item.image} className="object-cover w-full h-full" alt={item.name} /> : <div className="h-full w-full bg-slate-100" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-sm truncate">{item.name}</p>
                                <p className="text-xs text-muted-foreground">Qty: {item.qty} • Total: ${Number(item.price * item.qty).toFixed(2)}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Step 2: Reason & Info */}
                  {step === 2 && (
                    <div className="space-y-8 animate-in fade-in duration-300">
                      <div className="space-y-4">
                        <Label className="text-sm font-bold flex items-center gap-2"><RefreshCcw className="h-4 w-4 text-primary" /> {retT.reason_label}</Label>
                        <Select value={reason} onValueChange={setReason}>
                          <SelectTrigger className="h-12 rounded-xl bg-muted/30 border-none">
                            <SelectValue placeholder="Select a reason" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-none shadow-2xl">
                            <SelectItem value="defective">{retT.reasons.defective}</SelectItem>
                            <SelectItem value="wrong_item">{retT.reasons.wrong_item}</SelectItem>
                            <SelectItem value="not_as_described">{retT.reasons.not_as_described}</SelectItem>
                            <SelectItem value="change_of_mind">{retT.reasons.change_of_mind}</SelectItem>
                            <SelectItem value="other">{retT.reasons.other}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-4">
                        <Label className="text-sm font-bold">{retT.comment_label}</Label>
                        <Textarea 
                          className="min-h-[150px] rounded-2xl bg-muted/30 border-none p-4"
                          placeholder={retT.comment_placeholder}
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                        />
                      </div>

                      <div className="space-y-4">
                        <Label className="text-sm font-bold flex items-center gap-2"><Camera className="h-4 w-4 text-primary" /> {retT.photo_label}</Label>
                        <div className="grid grid-cols-4 gap-4">
                          <button type="button" className="aspect-square rounded-2xl border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center text-muted-foreground hover:bg-muted/50 hover:border-primary transition-all">
                            <Camera className="h-6 w-6 mb-1" />
                            <span className="text-[10px] font-bold">Add</span>
                          </button>
                        </div>
                        <p className="text-[10px] text-muted-foreground italic">{retT.photo_hint}</p>
                      </div>

                      <Separator />

                      <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100 flex items-start gap-3">
                        <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                        <p className="text-xs text-blue-800 leading-relaxed">
                          {retT.refund_notice}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>

                <CardFooter className="p-8 bg-muted/10 border-t flex gap-4">
                  {step === 1 ? (
                    <>
                      <Button variant="ghost" asChild className="flex-1 rounded-xl h-12 font-bold"><Link href="/profile">Cancel</Link></Button>
                      <Button 
                        type="button" 
                        className="flex-[2] rounded-xl h-12 bg-primary text-primary-foreground font-bold shadow-lg"
                        disabled={selectedItems.length === 0}
                        onClick={() => setStep(2)}
                      >
                        Next Step <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="ghost" onClick={() => setStep(1)} className="flex-1 rounded-xl h-12 font-bold">Back</Button>
                      <Button 
                        type="submit" 
                        className="flex-[2] rounded-xl h-12 bg-primary text-primary-foreground font-bold shadow-lg"
                        disabled={loading || !reason}
                      >
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
                        {retT.submit_btn}
                      </Button>
                    </>
                  )}
                </CardFooter>
              </Card>
            </div>
          </form>
        ) : (
          <Card className="border-none shadow-2xl bg-white rounded-3xl overflow-hidden animate-in zoom-in-95 duration-500">
            <CardContent className="p-16 text-center space-y-8">
              <div className="h-24 w-24 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600 shadow-inner">
                <CheckCircle2 className="h-14 w-14" />
              </div>
              <div className="space-y-4">
                <h1 className="text-4xl font-black font-headline tracking-tighter">{retT.success_title}</h1>
                <p className="text-lg text-muted-foreground leading-relaxed max-w-md mx-auto">
                  {retT.success_msg}
                </p>
              </div>
              <Separator className="max-w-xs mx-auto" />
              <Button asChild className="h-12 px-8 bg-primary text-primary-foreground font-bold rounded-xl shadow-lg">
                <Link href="/profile?tab=orders">{retT.back_to_orders}</Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </main>

      <Footer />
    </div>
  );
}
