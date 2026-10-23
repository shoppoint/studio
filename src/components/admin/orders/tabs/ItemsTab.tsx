
"use client";

import { useMemo, useState } from "react";
import { 
  Search, 
  PlusCircle, 
  Package, 
  Minus, 
  Plus, 
  Trash2, 
  UserPlus, 
  UserCheck, 
  Ticket, 
  Tag, 
  Calculator, 
  Info, 
  Coins, 
  Hash, 
  Sparkles, 
  MinusCircle,
  Zap,
  RefreshCcw,
  Loader2,
  DollarSign,
  Percent,
  Check,
  X,
  PlusSquare,
  MinusSquare,
  ArrowUpCircle,
  CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useFirestore, useCollection } from "@/firebase";
import { collection, query, where, orderBy, doc, runTransaction, increment, serverTimestamp, getDocs } from "firebase/firestore";
import { MemberPicker } from "@/components/pos/MemberPicker";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { calculateDiscountForPromo, getPromoShortLabel } from "@/lib/shop-utils";
import { useI18n } from "@/lib/i18n/i18n-context";

/**
 * 訂單詳情 - 產品項目分頁 (支援贈品標籤與變動顯示)
 */
export function ItemsTab({ 
  order, localItems, setLocalItems, isEditMode, isAdmin, 
  orderDiscount, setOrderDiscount, 
  orderDiscountType, setOrderDiscountType,
  pointsUsedValue, 
  couponCode, setCouponCode, 
  memberData, setMemberData,
  setContactData, 
  autoDiscountAmount = 0, setAutoDiscountAmount,
  appliedPromos = []
}: any) {
  const db = useFirestore();
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const [productSearch, setProductSearch] = useState("");
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isMemberPickerOpen, setIsMemberPickerOpen] = useState(false);
  const [isRecalculating, setIsRecalculating] = useState(false);

  const isEn = lang === 'en';

  const originalItemsMap = useMemo(() => {
    const map = new Map<string, number>();
    if (order?.items) {
      order.items.forEach((it: any) => {
        const pid = it.productId || it.id;
        if (pid) map.set(pid, (map.get(pid) || 0) + Number(it.qty || 1));
      });
    }
    return map;
  }, [order?.items]);

  const promosQuery = useMemo(() => db ? query(collection(db, 'promotions'), where('status', '==', 'active')) : null, [db]);
  const { data: allPromos } = useCollection<any>(promosQuery);

  const productsQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'public_products'), where('status', '==', 'Active'));
  }, [db]);
  const { data: allProducts } = useCollection<any>(productsQuery);

  const safeNum = (v: any) => { const n = Number(v); return isNaN(n) ? 0 : n; };

  const handleMemberSelect = (member: any) => {
    setMemberData(member);
    const nameParts = (member.displayName || "").split(' ');
    setContactData((prev: any) => ({
      ...prev,
      firstName: nameParts.slice(1).join(' ') || "",
      lastName: nameParts[0] || "",
      name: member.displayName || "",
      email: member.email || prev.email,
      phone: member.phone || prev.phone
    }));
    setIsMemberPickerOpen(false);
    toast({ title: "會員已手動連結" });
  };

  const handleUnlinkMember = () => {
    setMemberData(null);
    toast({ title: "已取消會員連結" });
  };

  const handleAddProduct = (p: any, type: 'item' | 'gift') => {
    const newItem = {
      cartItemId: `m-${p.id}-${Date.now()}`,
      id: p.id, productId: p.id,
      name: p.productName_zh || p.productName_en,
      price: type === 'gift' ? 0 : (Number(p.salePrice) || Number(p.price) || 0),
      qty: 1, discount: 0, discountType: 'amount',
      image: p.imageUrl || "", sku: p.sku || "",
      isInternalGift: type === 'gift',
      categories: p.categories || [],
      brand: p.primaryBrand || p.brands || ""
    };
    setLocalItems([...localItems, newItem]);
    setIsPickerOpen(false);
    toast({ title: type === 'gift' ? "已加入贈品" : "已加入產品" });
  };

  const updateItemField = (cartItemId: string, field: string, value: any) => {
    const finalValue = (field === 'price' || field === 'qty' || field === 'discount') ? Number(value) : value;
    setLocalItems(localItems.map((it: any) => it.cartItemId === cartItemId ? { ...it, [field]: finalValue } : it));
  };

  const handleRecalculatePromos = async () => {
    if (!allPromos || localItems.length === 0) return;
    setIsRecalculating(true);
    
    try {
      const subtotalVal = localItems.reduce((acc: number, it: any) => acc + (safeNum(it.price) * safeNum(it.qty)), 0);
      
      const candidates = allPromos.filter((p: any) => {
        if (p.code && p.code !== couponCode?.trim().toUpperCase()) return false;
        return true;
      }).map((p: any) => {
        const result = calculateDiscountForPromo(p, localItems, subtotalVal, order);
        return {
          id: p.id,
          name: p.name,
          shortLabel: p.shortLabel,
          type: p.type,
          value: p.value,
          targetType: p.targetType,
          targetIds: p.targetIds,
          discount: result.discount,
          isStackable: p.isStackable,
          isPayment: result.isPayment,
          displayName: getPromoShortLabel(p, lang)
        };
      }).filter((r: any) => r.discount > 0);

      const stackable = candidates.filter((p: any) => p.isStackable !== false);
      const exclusive = candidates.filter((p: any) => p.isStackable === false);
      let finalDiscount = stackable.reduce((sum: number, p: any) => sum + p.discount, 0);
      let finalApplied = stackable;

      exclusive.forEach((p: any) => {
        if (p.discount > finalDiscount) {
          finalDiscount = p.discount;
          finalApplied = [p];
        }
      });

      setAutoDiscountAmount(finalDiscount);
      toast({ title: "已重新計算優惠", description: `符合 ${finalApplied.length} 項規則，已套用 $${finalDiscount.toFixed(1)} 扣減。` });
    } catch (e) {
      toast({ title: "重算失敗", variant: "destructive" });
    } finally {
      setIsRecalculating(false);
    }
  };

  const itemDeductionsMap = useMemo(() => {
    const map: Record<string, { manual: number, auto: number, total: number }> = {};
    
    localItems.forEach((it: any) => {
      const price = safeNum(it.price);
      const qty = safeNum(it.qty);
      const discVal = safeNum(it.discount);
      const manualDeductionPerUnit = it.discountType === 'percent' ? (price * discVal / 100) : discVal;
      const totalManual = (manualDeductionPerUnit * qty);
      map[it.cartItemId] = { manual: totalManual, auto: 0, total: totalManual };
    });

    const safeAppliedPromos = Array.isArray(appliedPromos) ? appliedPromos : [];
    const promos = safeAppliedPromos.length > 0 ? safeAppliedPromos : (autoDiscountAmount > 0 ? [{ displayName: "系統自動促銷", discount: autoDiscountAmount, isFallback: true }] : []);

    promos.forEach((promo: any) => {
      const promoVal = safeNum(promo.discount || promo.amount);
      if (promoVal <= 0) return;

      const targets = localItems.filter((it: any) => {
        if (promo.isFallback || promo.targetType === 'all') return true;
        const pid = it.productId || it.id;
        if (promo.targetIds?.includes(pid)) return true;
        return false;
      });

      const targetBaseTotal = targets.reduce((acc: number, it: any) => acc + (safeNum(it.price) * safeNum(it.qty)), 0);
      targets.forEach((it: any) => {
        const itemBase = (safeNum(it.price) * safeNum(it.qty));
        const share = targetBaseTotal > 0 ? (itemBase / targetBaseTotal) : (1 / (targets.length || 1));
        const allocated = promoVal * share;
        if (map[it.cartItemId]) {
          map[it.cartItemId].auto += allocated;
          map[it.cartItemId].total += allocated;
        }
      });
    });

    return map;
  }, [localItems, appliedPromos, autoDiscountAmount]);

  const totals = useMemo(() => {
    const sub = localItems.reduce((acc: number, it: any) => acc + (safeNum(it.price) * safeNum(it.qty)), 0);
    const itemManualDeductions = Object.values(itemDeductionsMap).reduce((acc: number, d: any) => acc + d.manual, 0);
    
    // 分離行銷折扣與支付抵扣
    const safeAppliedPromos = Array.isArray(appliedPromos) ? appliedPromos : [];
    const marketingDiscountsTotal = safeAppliedPromos.filter(p => !p.isPayment).reduce((acc, p) => acc + safeNum(p.discount || p.amount), 0);
    const cashCouponsTotal = safeAppliedPromos.filter(p => !!p.isPayment).reduce((acc, p) => acc + safeNum(p.discount || p.amount), 0);
    
    // 如果沒有 appliedPromos，則 autoDiscountAmount 被視為行銷折扣
    const finalMarketingDiscounts = safeAppliedPromos.length > 0 ? marketingDiscountsTotal : safeNum(autoDiscountAmount);

    const afterItemsPrice = sub - itemManualDeductions;
    const orderLevelManualDeduction = orderDiscountType === 'percent' 
      ? (afterItemsPrice * safeNum(orderDiscount) / 100)
      : safeNum(orderDiscount);

    const revenue = Math.max(0, sub - itemManualDeductions - finalMarketingDiscounts - orderLevelManualDeduction);
    const pValue = safeNum(pointsUsedValue);
    const balanceDue = Math.max(0, revenue - pValue - cashCouponsTotal);

    return { 
      subtotal: sub, 
      itemManualDeductions, 
      marketingDiscounts: finalMarketingDiscounts, 
      orderManualDeduction: orderLevelManualDeduction, 
      revenue,
      pointsOffset: pValue, 
      cashCouponOffset: cashCouponsTotal,
      balanceDue 
    };
  }, [localItems, orderDiscount, orderDiscountType, pointsUsedValue, itemDeductionsMap, autoDiscountAmount, appliedPromos]);

  const filteredProducts = useMemo(() => {
    if (!allProducts) return [];
    const q = productSearch.toLowerCase().trim();
    return allProducts.filter((p: any) => (p.productName_zh || "").toLowerCase().includes(q) || (p.productName_en || "").toLowerCase().includes(q) || (p.sku || "").toLowerCase().includes(q)).slice(0, 50);
  }, [allProducts, productSearch]);

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
           <h3 className="text-xl font-black">產品與折扣明細</h3>
           {isEditMode && (
             <div className="flex items-center gap-1">
               <button onClick={() => setIsMemberPickerOpen(true)} className={cn("inline-flex items-center gap-2 px-4 py-1.5 rounded-xl border-2 font-bold text-xs transition-all", memberData?.id ? "border-primary bg-primary text-primary-foreground shadow-sm" : "border-primary/20 text-primary hover:bg-primary/5")}>
                 {memberData?.id ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                 {memberData?.id ? "已識別會員" : "連結會員"}
               </button>
               {memberData?.id && (
                 <button 
                   onClick={handleUnlinkMember}
                   className="h-8 w-8 flex items-center justify-center bg-red-50 text-red-600 border border-red-100 rounded-xl hover:bg-red-100 transition-all"
                   title="取消連結"
                 >
                   <X className="h-4 w-4" strokeWidth={3} />
                 </button>
               )}
             </div>
           )}
        </div>
        <div className="flex gap-2">
          {isEditMode && (
            <Button variant="outline" className="rounded-xl border-indigo-200 text-indigo-700 bg-indigo-50/30 font-bold h-10 px-6 gap-2" onClick={handleRecalculatePromos} disabled={isRecalculating}>
              {isRecalculating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
              重新計算系統建議優惠
            </Button>
          )}
          {isEditMode && isAdmin && (
            <Dialog open={isPickerOpen} onOpenChange={setIsPickerOpen}>
              <DialogTrigger asChild><Button variant="outline" className="rounded-xl border-primary text-primary font-bold h-10 px-6 shadow-sm"><PlusCircle className="h-4 w-4 mr-2" /> 加入產品</Button></DialogTrigger>
              <DialogContent className="rounded-[2.5rem] p-0 overflow-hidden sm:max-w-md border-none shadow-2xl">
                <DialogHeader className="p-6 bg-primary text-primary-foreground"><DialogTitle className="text-xl font-black">選擇庫存產品</DialogTitle></DialogHeader>
                <div className="p-6 space-y-4">
                  <div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input placeholder="搜尋產品名稱、SKU..." value={productSearch} onChange={e => setProductSearch(e.target.value)} className="pl-9 h-11 bg-muted/20 border-none rounded-xl" /></div>
                  <ScrollArea className="h-72"><div className="space-y-2">{filteredProducts.map((p: any) => (<div key={p.id} className="p-3 border rounded-xl flex items-center justify-between hover:border-primary cursor-pointer"><div className="min-w-0"><p className="text-xs font-bold truncate">{p.productName_zh}</p><p className="text-[10px] text-muted-foreground font-mono">{p.sku}</p></div><div className="flex gap-1"><Button size="sm" variant="outline" className="text-[10px] h-7" onClick={() => handleAddProduct(p, 'gift')}>贈品</Button><Button size="sm" className="text-[10px] h-7" onClick={() => handleAddProduct(p, 'item')}>加入</Button></div></div>))}</div></ScrollArea>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="border rounded-2xl overflow-hidden bg-white shadow-sm">
        <Table>
          <TableHeader className="bg-muted/5">
            <TableRow>
              <TableHead className="pl-8">產品詳情</TableHead>
              <TableHead className="text-center">單價</TableHead>
              <TableHead className="text-center">數量</TableHead>
              <TableHead className="text-center w-48">手動扣減 (Discount)</TableHead>
              <TableHead className="text-right pr-8">小計</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {localItems.map((item: any) => {
              const deductions = itemDeductionsMap[item.cartItemId] || { manual: 0, auto: 0, total: 0 };
              const itemPrice = safeNum(item.price);
              const rowFinalTotal = (itemPrice * safeNum(item.qty)) - deductions.total;

              const pid = item.productId || item.id;
              const originalQty = originalItemsMap.get(pid) || 0;
              const currentQty = Number(item.qty);
              const diff = currentQty - originalQty;

              return (
                <TableRow key={item.cartItemId} className="border-dashed group">
                  <TableCell className="pl-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-lg bg-muted overflow-hidden shrink-0 border">
                        {item.image ? <img src={item.image} className="object-cover w-full h-full" /> : <Package className="h-4 w-4 m-3 opacity-20" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                           <p className="font-bold text-sm truncate">{item.name}</p>
                           {item.isInternalGift && (
                             <Badge className="bg-primary text-primary-foreground text-[10px] h-5 font-black border-none uppercase shadow-sm">贈品 GIFT</Badge>
                           )}
                        </div>
                        <p className="text-[10px] text-muted-foreground font-mono mt-0.5 opacity-60">{item.sku || "--"}</p>
                        
                        {isEditMode && (
                          <div className="flex items-center gap-2 mt-1.5 animate-in slide-in-from-left-2">
                            {originalQty === 0 ? (
                              <Badge className="bg-orange-100 text-orange-700 border-none font-black text-[9px] uppercase px-2 h-5">
                                <PlusSquare className="h-3 w-3 mr-1" /> 加購 (New)
                              </Badge>
                            ) : diff > 0 ? (
                              <Badge className="bg-orange-50 text-white border-none font-black text-[9px] uppercase px-2 h-5 shadow-sm">
                                <ArrowUpCircle className="h-3 w-3 mr-1" /> 加購 +{diff}
                              </Badge>
                            ) : diff < 0 ? (
                              <Badge className="bg-slate-200 text-slate-600 border-none font-black text-[9px] uppercase px-2 h-5">
                                <MinusSquare className="h-3 w-3 mr-1" /> 減少 {diff}
                              </Badge>
                            ) : null}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center font-medium">
                    {isEditMode ? <Input type="number" value={item.price} onChange={e => updateItemField(item.cartItemId, 'price', e.target.value)} className="h-8 w-24 text-right mx-auto" /> : `$${itemPrice.toFixed(1)}`}
                  </TableCell>
                  <TableCell className="text-center">
                    {isEditMode ? <div className="flex items-center justify-center border rounded-lg h-8 w-24 mx-auto bg-white"><button onClick={() => updateItemField(item.cartItemId, 'qty', Math.max(1, Number(item.qty) - 1))} className="px-2 hover:bg-muted"><Minus className="h-3 w-3" /></button><span className="w-8 text-center font-bold text-xs">{item.qty}</span><button onClick={() => updateItemField(item.cartItemId, 'qty', Number(item.qty) + 1)} className="px-2 hover:bg-muted"><Plus className="h-3 w-3" /></button></div> : `x ${item.qty}`}
                  </TableCell>
                  <TableCell className="text-center">
                    {isEditMode ? (
                      <div className="flex items-center gap-1 bg-muted/10 p-0.5 rounded-lg border max-w-[140px] mx-auto">
                        <Input 
                          type="number" 
                          value={item.discount} 
                          onChange={(e) => updateItemField(item.cartItemId, 'discount', e.target.value)}
                          className="h-7 border-none bg-white focus-visible:ring-0 text-right text-[10px] font-bold p-1"
                        />
                        <Select value={item.discountType || 'amount'} onValueChange={(v) => updateItemField(item.cartItemId, 'discountType', v)}>
                          <SelectTrigger className="h-7 w-12 text-[10px] bg-white border-none shadow-sm font-black"><SelectValue /></SelectTrigger>
                          <SelectContent className="rounded-xl border-none shadow-2xl">
                            <SelectItem value="amount">$</SelectItem>
                            <SelectItem value="percent">%</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    ) : (
                      deductions.total > 0 ? (
                        <div className="flex flex-col items-center">
                          <span className="text-red-600 font-black text-sm">-${deductions.total.toFixed(1)}</span>
                          {deductions.auto > 0 && <span className="text-[8px] text-green-600 font-black uppercase tracking-tighter">(Incl. Promo)</span>}
                        </div>
                      ) : "--"
                    )}
                  </TableCell>
                  <TableCell className="text-right pr-8 font-black text-slate-800">
                    <div className="flex items-center justify-end gap-2">
                      ${rowFinalTotal.toFixed(1)}
                      {isEditMode && <button onClick={() => setLocalItems(localItems.filter((i:any)=>i.cartItemId !== item.cartItemId))} className="text-muted-foreground hover:text-destructive transition-colors ml-2"><Trash2 className="h-4 w-4" /></button>}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Card className="border-none shadow-sm bg-muted/10 rounded-[2rem] overflow-hidden border border-muted-foreground/10 h-full">
            <CardHeader className="bg-muted/5 border-b py-4 px-6">
               <CardTitle className="text-xs font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                 <Ticket className="h-4 w-4" /> 全單促銷與額外折扣
               </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="text-[10px] font-black uppercase ml-1">全單手動折扣</Label>
                  <div className="flex items-center gap-1 bg-white border rounded-xl overflow-hidden p-1 shadow-sm">
                    <button 
                      type="button"
                      className={cn("h-8 px-3 text-xs rounded-lg transition-all", orderDiscountType === 'percent' ? "bg-primary text-primary-foreground font-black" : "hover:bg-muted")}
                      onClick={() => setOrderDiscountType('percent')}
                    >
                      <Percent className="h-3.5 w-3.5" />
                    </button>
                    <button 
                      type="button"
                      className={cn("h-8 px-3 text-xs rounded-lg transition-all", orderDiscountType === 'amount' ? "bg-primary text-primary-foreground font-black" : "hover:bg-muted")}
                      onClick={() => setOrderDiscountType('amount')}
                    >
                      <DollarSign className="h-3.5 w-3.5" />
                    </button>
                    <Input 
                      type="number" 
                      value={orderDiscount} 
                      onChange={(e) => setOrderDiscount(e.target.value)} 
                      disabled={!isEditMode}
                      className="h-8 border-none bg-transparent focus-visible:ring-0 text-right font-black" 
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label className="text-[10px] font-black uppercase ml-1">套用優惠碼</Label>
                  <div className="flex items-center bg-white border rounded-xl overflow-hidden p-0.5 shadow-sm">
                    <Input 
                      value={couponCode} 
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())} 
                      disabled={!isEditMode}
                      className="h-8 border-none bg-transparent focus-visible:ring-0 font-mono font-bold uppercase px-3 text-xs" 
                    />
                  </div>
                </div>
              </div>

              <Separator className="border-dashed" />

              <div className="space-y-3">
                {Array.isArray(appliedPromos) && appliedPromos.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase text-green-700 tracking-widest ml-1">已生效系統促銷:</p>
                    {appliedPromos.map((p: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-white rounded-xl border border-dashed border-green-200">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-3.5 w-3.5 text-green-600" />
                          <span className="text-xs font-bold text-slate-800">{p.displayName}</span>
                        </div>
                        <span className="text-sm font-black text-green-600">-${safeNum(p.discount || p.amount).toFixed(1)}</span>
                      </div>
                    ))}
                  </div>
                ) : autoDiscountAmount > 0 ? (
                  <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-dashed border-green-200">
                    <div className="flex items-center gap-2"><Sparkles className="h-3.5 w-3.5 text-green-600" /><span className="text-xs font-bold text-slate-800">系統自動促銷</span></div>
                    <span className="text-sm font-black text-green-600">-${Number(autoDiscountAmount).toFixed(1)}</span>
                  </div>
                ) : (
                  <div className="py-6 text-center flex flex-col items-center gap-2 text-muted-foreground opacity-30">
                    <Info className="h-6 w-6" />
                    <p className="italic text-[10px] font-black uppercase">無活動中促銷</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="p-10 bg-white border rounded-[2.5rem] shadow-sm space-y-6 h-fit">
          <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-2">
            <Calculator className="h-4 w-4" /> 結算核對 (Accounting)
          </h4>
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm font-bold text-slate-600">
              <span>原始小計 (Subtotal)</span>
              <span>$ {totals.subtotal.toFixed(1)}</span>
            </div>
            
            <div className="flex justify-between items-center text-sm font-black text-green-600 animate-in slide-in-from-right-2">
              <span>促銷及手動折扣總計</span>
              <span>-$ {(totals.marketingDiscounts + totals.itemManualDeductions + totals.orderManualDeduction).toFixed(1)}</span>
            </div>
            
            <Separator className="border-dashed" />
            
            <div className="flex justify-between items-center pt-2">
              <span className="text-base font-black uppercase">訂單成交總額 (Revenue)</span>
              <span className="text-4xl font-black text-primary">$ {totals.revenue.toFixed(1)}</span>
            </div>

            <div className="space-y-2 pt-2">
              <div className="flex justify-between items-center text-sm font-black text-amber-600 bg-amber-50/50 p-3 rounded-xl border border-amber-100/50">
                <span className="flex items-center gap-1"><Coins className="h-3 w-3" /> 積分抵扣獎賞</span>
                <span>-$ {totals.pointsOffset.toFixed(1)}</span>
              </div>
              
              {totals.cashCouponOffset > 0 && (
                <div className="flex justify-between items-center text-sm font-black text-indigo-600 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100/50">
                  <span className="flex items-center gap-1"><Ticket className="h-3 w-3" /> 已付現金券抵扣</span>
                  <span>-$ {totals.cashCouponOffset.toFixed(1)}</span>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-4 border-t-2 border-black">
              <span className="text-base font-black uppercase text-orange-600">待收現金餘額 (Balance Due)</span>
              <span className="text-2xl font-black text-orange-600">$ {totals.balanceDue.toFixed(1)}</span>
            </div>
          </div>
        </div>
      </div>
      
      <MemberPicker isOpen={isMemberPickerOpen} onOpenChange={setIsMemberPickerOpen} onSelect={handleMemberSelect} />
    </div>
  );
}
