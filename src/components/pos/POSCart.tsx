
"use client";

import { 
  ShoppingCart, 
  UserCheck, 
  UserPlus, 
  Minus, 
  Plus, 
  Trash2, 
  Package, 
  Sparkles, 
  Percent, 
  DollarSign, 
  Check, 
  X,
  ArrowRight,
  Loader2,
  Clock,
  AlertTriangle,
  History,
  Info,
  Zap,
  Coins,
  ArrowUpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableRow, TableHeader, TableHead } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useCallback, useMemo } from "react";

interface POSCartProps {
  items: any[];
  originalReservedItems?: any[];
  products: any[] | null;
  currentLocationId: string;
  subtotal: number;
  finalTotal: number;
  discountInfo: any;
  onUpdateQty: (id: string, delta: number) => void;
  onUpdateItemDiscount: (id: string, value: number) => void;
  onUpdateItemDiscountType: (id: string, type: "percent" | "amount") => void;
  onRemove: (id: string) => void;
  onClear: () => void;
  onCheckout: () => void;
  onReserve: () => void;
  linkedMember: any | null;
  onOpenMemberPicker: () => void;
  onRemoveMember: () => void;
  onApplyCoupon: (code: string) => void;
  onRemoveCoupon: () => void;
  isApplyingCoupon: boolean;
  isProcessing: boolean;
  couponCode: string;
  setCouponCode: (v: string) => void;
  discountValue: string;
  setDiscountValue: (v: string) => void;
  discountType: "percent" | "amount";
  setDiscountType: (v: "percent" | "amount") => void;
  pointsToUse: string;
  setPointsToUse: (v: string) => void;
  loyaltyConfig: any;
  disabled: boolean;
  isReservedMode?: boolean;
}

export function POSCart({
  items,
  originalReservedItems,
  products,
  currentLocationId,
  subtotal,
  finalTotal,
  discountInfo,
  onUpdateQty,
  onUpdateItemDiscount,
  onUpdateItemDiscountType,
  onRemove,
  onClear,
  onCheckout,
  onReserve,
  linkedMember,
  onOpenMemberPicker,
  onRemoveMember,
  onApplyCoupon,
  onRemoveCoupon,
  isApplyingCoupon,
  isProcessing,
  couponCode,
  setCouponCode,
  discountValue,
  setDiscountValue,
  discountType,
  setDiscountType,
  pointsToUse,
  setPointsToUse,
  loyaltyConfig,
  disabled,
  isReservedMode = false
}: POSCartProps) {
  
  const getLocalStock = useCallback((p: any) => {
    if (!p || !currentLocationId) return 0;
    if (Array.isArray(p.batches) && p.batches.length > 0) {
      return p.batches
        .filter((b: any) => b.locationId === currentLocationId)
        .reduce((sum: number, b: any) => sum + (Number(b.quantity) || 0), 0);
    }
    return Number(p.warehouseStock?.[currentLocationId] || 0);
  }, [currentLocationId]);

  const pointsToCashRatio = Number(loyaltyConfig?.pointsToCash) || 100;
  const pointsVal = (Number(pointsToUse) || 0) / pointsToCashRatio;

  const handleMaxPoints = () => {
    if (!linkedMember) return;
    const balance = Number(linkedMember.points) || 0;
    const maxRedeemableValue = subtotal - discountInfo.amount;
    const pointsNeededForFull = Math.floor(maxRedeemableValue * pointsToCashRatio);
    const finalPoints = Math.min(balance, pointsNeededForFull);
    setPointsToUse(finalPoints.toString());
  };

  return (
    <Card className="border-none shadow-2xl bg-white rounded-[2.5rem] flex flex-col h-full overflow-hidden border border-primary/10">
      <CardHeader className="py-5 border-b bg-muted/5 flex flex-row items-center justify-between px-8">
        <div className="space-y-0.5">
          <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" /> POS Cart
            {isReservedMode && <Badge className="bg-orange-600 text-white border-none ml-2 text-[8px] font-black uppercase h-5 px-3">Reserved Mode</Badge>}
          </CardTitle>
          {linkedMember && (
             <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
               <Badge className="bg-amber-400 text-amber-950 border-none font-black text-[9px] gap-1 px-2 h-5">
                 <Coins className="h-2.5 w-2.5" /> Balance: {linkedMember.points || 0} Pts
               </Badge>
             </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Button 
              variant="outline" 
              size="sm" 
              className={cn("h-8 rounded-xl font-bold gap-1.5 transition-all", linkedMember ? "bg-primary text-primary-foreground border-primary" : "border-primary/20 text-primary")} 
              onClick={onOpenMemberPicker}
            >
              {linkedMember ? <UserCheck className="h-3.5 w-3.5" /> : <UserPlus className="h-3.5 w-3.5" />}
              {linkedMember ? linkedMember.displayName : "連結會員"}
            </Button>
            {linkedMember && (
              <button 
                onClick={(e) => { e.stopPropagation(); onRemoveMember(); }}
                className="h-8 w-8 flex items-center justify-center bg-red-50 text-red-600 border border-red-100 rounded-xl hover:bg-red-100 transition-all"
                title="取消連結會員"
              >
                <X className="h-4 w-4" strokeWidth={3} />
              </button>
            )}
          </div>
          <Button variant="ghost" size="sm" className="h-8 text-xs font-bold text-destructive hover:bg-red-50" onClick={onClear} disabled={items.length === 0}>清空</Button>
        </div>
      </CardHeader>

      {isReservedMode && originalReservedItems && originalReservedItems.length > 0 && (
        <div className="bg-indigo-50 border-b p-4 px-8 space-y-2">
           <div className="flex items-center justify-between">
              <p className="text-[10px] font-black text-indigo-700 uppercase tracking-widest flex items-center gap-2">
                <History className="h-3 w-3" /> 原始預留清單 (Original Reservation)
              </p>
              <Badge variant="outline" className="bg-white text-indigo-700 border-indigo-200 text-[8px] h-4">已扣除庫存</Badge>
           </div>
           <div className="flex flex-wrap gap-2">
             {originalReservedItems.map((it, i) => (
               <Badge key={i} className="bg-white border-indigo-200 text-indigo-800 text-[10px] font-bold h-6 px-2">
                 {it.name} x{it.qty}
               </Badge>
             ))}
           </div>
           <p className="text-[9px] text-indigo-500 italic">以上項目在下單時已從庫存扣除，POS 只會檢查「加購部分」的庫存。</p>
        </div>
      )}

      <ScrollArea className="flex-1">
        <Table>
          <TableHeader className="bg-muted/5">
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-8 text-[10px] font-black uppercase">產品詳情</TableHead>
              <TableHead className="text-center text-[10px] font-black uppercase">數量</TableHead>
              <TableHead className="text-center text-[10px] font-black uppercase">單品折扣</TableHead>
              <TableHead className="text-right pr-8 text-[10px] font-black uppercase">合計</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const product = products?.find(p => p.id === item.id);
              const localStock = getLocalStock(product);
              const originalReservedQty = originalReservedItems?.find(it => it.id === item.id)?.qty || 0;
              
              const additionalQty = item.qty - originalReservedQty;
              const isInsufficient = product?.inventoryPolicy === 'Deny' && !item.isInternalGift && additionalQty > localStock;

              return (
                <TableRow key={item.cartItemId} className={cn(
                  "group transition-colors border-dashed",
                  isInsufficient ? "bg-red-50" : "hover:bg-muted/10"
                )}>
                  <TableCell className="pl-8 py-4">
                    <div className="flex flex-col gap-1 min-w-0 max-w-[120px]">
                      <span className="font-bold text-sm block leading-tight truncate">{item.name}</span>
                      <div className="flex flex-wrap gap-1">
                        {item.isInternalGift && (
                          <Badge className="bg-primary text-primary-foreground text-[8px] h-4 w-fit border-none uppercase font-black px-1.5 shadow-sm">贈品 GIFT</Badge>
                        )}
                        {originalReservedQty > 0 && (
                          <Badge className="bg-indigo-100 text-indigo-700 text-[8px] h-4 border-none uppercase font-black px-1.5 flex items-center gap-1">
                            <Check className="h-2 w-2" /> 預留 {originalReservedQty}
                          </Badge>
                        )}
                        {additionalQty > 0 && (
                           <Badge className="bg-orange-100 text-orange-700 text-[8px] h-4 border-none uppercase font-black px-1.5">加購 +{additionalQty}</Badge>
                        )}
                        {isInsufficient && (
                          <Badge variant="destructive" className="text-[8px] h-4 px-1.5 font-black uppercase flex items-center gap-1">
                            <AlertTriangle className="h-2 w-2" /> 庫存不足
                          </Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-0">
                    <div className="flex items-center justify-center border rounded-lg h-8 overflow-hidden bg-white shadow-sm mx-auto">
                      <button className="px-2 hover:bg-muted" onClick={() => onUpdateQty(item.cartItemId, -1)}><Minus className="h-3 w-3" /></button>
                      <span className={cn("w-6 text-center text-xs font-bold", isInsufficient && "text-red-600")}>{item.qty}</span>
                      <button className="px-2 hover:bg-muted" onClick={() => onUpdateQty(item.cartItemId, 1)}><Plus className="h-3 w-3" /></button>
                    </div>
                  </TableCell>
                  <TableCell className="px-0">
                     <div className="flex items-center gap-1 bg-white border rounded-lg overflow-hidden p-0.5 max-w-[90px] mx-auto">
                        <button 
                          className={cn("h-6 w-6 flex items-center justify-center rounded transition-all", item.discountType === 'percent' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}
                          onClick={() => onUpdateItemDiscountType(item.cartItemId, 'percent')}
                        >
                          <Percent className="h-2.5 w-2.5" />
                        </button>
                        <button 
                          className={cn("h-6 w-6 flex items-center justify-center rounded transition-all", item.discountType === 'amount' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted")}
                          onClick={() => onUpdateItemDiscountType(item.cartItemId, 'amount')}
                        >
                          <DollarSign className="h-2.5 w-2.5" />
                        </button>
                        <Input 
                          type="number" 
                          value={item.discount || ""} 
                          onChange={(e) => onUpdateItemDiscount(item.cartItemId, parseFloat(e.target.value) || 0)} 
                          className="h-6 w-full border-none bg-transparent focus-visible:ring-0 text-right font-bold text-[10px] p-0 pr-1"
                        />
                     </div>
                  </TableCell>
                  <TableCell className="text-right pr-8">
                    <div className="flex items-center justify-end gap-2">
                      <div className="text-right">
                        <p className="font-black text-sm text-slate-900 leading-none">
                          ${((item.price - (item.discountType === 'percent' ? (item.price * item.discount / 100) : item.discount)) * item.qty).toFixed(2)}
                        </p>
                        {item.discount > 0 && <p className="text-[8px] text-green-600 font-bold mt-1 line-through opacity-60">${(item.price * item.qty).toFixed(1)}</p>}
                      </div>
                      <button 
                        onClick={() => onRemove(item.cartItemId)} 
                        className="text-muted-foreground hover:text-destructive p-2 rounded-full hover:bg-red-50 transition-all"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-20 text-center space-y-4">
                  <Package className="h-10 w-10 text-muted-foreground/20 mx-auto" />
                  <p className="text-xs text-muted-foreground italic uppercase font-bold">購物車為空</p>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </ScrollArea>

      <CardContent className="p-5 bg-muted/10 border-t space-y-4">
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest ml-1">折扣 (Disc.)</Label>
              <div className="flex items-center gap-1 bg-white border rounded-xl overflow-hidden p-0.5 shadow-sm">
                <button 
                  type="button"
                  className={cn("h-7 px-1.5 text-[10px] rounded-lg transition-all", discountType === 'percent' ? "bg-primary text-primary-foreground font-black" : "hover:bg-muted")}
                  onClick={() => setDiscountType('percent')}
                >
                  <Percent className="h-3 w-3" />
                </button>
                <button 
                  type="button"
                  className={cn("h-7 px-1.5 text-[10px] rounded-lg transition-all", discountType === 'amount' ? "bg-primary text-primary-foreground font-black" : "hover:bg-muted")}
                  onClick={() => setDiscountType('amount')}
                >
                  <DollarSign className="h-3 w-3" />
                </button>
                <Input 
                  type="number" 
                  value={discountValue} 
                  onChange={(e) => setDiscountValue(e.target.value)} 
                  className="h-7 border-none bg-transparent focus-visible:ring-0 text-right font-black p-1 text-xs" 
                  placeholder="0" 
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest ml-1">優惠碼 (Coupon)</Label>
              <div className="flex items-center bg-white border rounded-xl overflow-hidden p-0.5 shadow-sm">
                <Input 
                  value={couponCode} 
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())} 
                  className="h-7 border-none bg-transparent focus-visible:ring-0 font-mono text-[10px] uppercase px-1.5" 
                  placeholder="CODE" 
                />
                <Button 
                  variant="ghost" size="icon" className="h-7 w-7 text-primary hover:bg-primary/10 rounded-lg" 
                  onClick={() => onApplyCoupon(couponCode)} 
                  disabled={!couponCode || isApplyingCoupon}
                >
                  {isApplyingCoupon ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                </Button>
              </div>
            </div>

            <div className="space-y-1">
               <Label className="text-[9px] font-black uppercase text-amber-700 tracking-widest ml-1">積分抵扣 (Points)</Label>
               <div className="flex items-center bg-white border border-amber-200 rounded-xl overflow-hidden p-0.5 shadow-sm">
                  <Input 
                    type="number"
                    value={pointsToUse}
                    onChange={(e) => setPointsToUse(e.target.value)}
                    disabled={!linkedMember}
                    className="h-7 border-none bg-transparent focus-visible:ring-0 font-black text-amber-600 text-xs px-1.5"
                    placeholder="0"
                  />
                  <button 
                    onClick={handleMaxPoints}
                    disabled={!linkedMember}
                    className="h-7 px-2 bg-amber-100 text-amber-700 text-[9px] font-black rounded-lg hover:bg-amber-200 disabled:opacity-30 transition-all uppercase"
                  >
                    MAX
                  </button>
               </div>
            </div>
          </div>

          <div className="space-y-1">
            {discountInfo.appliedPromos?.length > 0 && (
              <div className="space-y-1 animate-in fade-in">
                {discountInfo.appliedPromos.map((p: any, i: number) => (
                  <div key={i} className="flex justify-between items-center text-[10px] font-bold text-green-600 px-1">
                    <span className="flex items-center gap-1"><Sparkles className="h-3 w-3" /> {p.displayName}</span>
                    <span>-${(p.discount || 0).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
            
            {pointsVal > 0 && (
               <div className="flex justify-between items-center text-[10px] font-black text-amber-600 px-1 animate-in slide-in-from-right-2">
                 <span className="flex items-center gap-1"><Coins className="h-3 w-3" /> 積分抵扣獎賞</span>
                 <span>-${pointsVal.toFixed(1)}</span>
               </div>
            )}

            {discountInfo.manualAmount > 0 && (
              <div className="flex justify-between items-center text-[10px] font-bold text-orange-600 px-1 animate-in slide-in-from-right-2">
                <span className="flex items-center gap-1"><Zap className="h-3 w-3" /> 手動調整折扣</span>
                <span>-${discountInfo.manualAmount.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between items-center text-xs font-medium text-muted-foreground border-t border-dashed pt-2 mt-1">
              <span>折前小計 Subtotal</span>
              <span className="font-bold text-foreground">${subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">應收總額 Total</span>
              <span className="text-4xl font-black text-orange-600 tracking-tighter">${finalTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        <div className="flex gap-3 pt-2">
          {!isReservedMode && (
            <Button 
              variant="outline"
              className="flex-1 h-14 rounded-2xl border-2 border-orange-500 text-orange-600 font-black text-xs uppercase gap-2 hover:bg-orange-50"
              disabled={items.length === 0 || disabled || isProcessing}
              onClick={onReserve}
            >
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Clock className="h-4 w-4" />}
              Reserve (留貨)
            </Button>
          )}
          <Button 
            className="flex-[2] h-14 bg-primary text-primary-foreground font-black text-lg rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all gap-3" 
            disabled={items.length === 0 || disabled || isProcessing} 
            onClick={onCheckout}
          >
            {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : (isReservedMode ? "PAY NOW (結清)" : "PAY NOW (結帳)")} 
            <ArrowRight className="h-5 w-5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
