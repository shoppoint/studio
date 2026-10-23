"use client";

import { useState, useMemo, useCallback } from "react";
import { 
  ShoppingCart, 
  Minus, 
  Plus, 
  CheckCircle2, 
  Loader2, 
  Bell, 
  AlertTriangle,
  Globe,
  Warehouse,
  Store,
  HeartHandshake,
  Sparkles,
  Share2,
  Facebook,
  Tag,
  Copy,
  Instagram,
  Mail,
  UserPlus,
  ArrowRight,
  XCircle,
  Flame,
  Clock,
  Ticket,
  Truck,
  CalendarDays,
  Zap,
  Send,
  MessageSquare,
  Smartphone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n/i18n-context";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { LoginDialog } from "@/components/auth/LoginDialog";
import { getPromoShortLabel, getPromoPriceLabel } from "@/lib/shop-utils";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";

// Custom Branded SVGs
const XIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
  </svg>
);

const ThreadsIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10c2.11 0 4.076-.656 5.71-1.776l-1.173-1.635C15.222 19.516 13.684 20 12 20c-4.418 0-8-3.582-8-8s3.582-8 8-8 8 3.582 8 8v.5c0 1.105-.895 2-2 2s-2-.895-2-2v-3c0-1.105-.895-2-2-2s-2 .895-2 2v3.312c-.588-.813-1.534-1.312-2.583-1.312-1.933 0-3.5 1.567-3.5 3.5s1.567 3.5 3.5 3.5c1.049 0 1.995-.499 2.583-1.312.23.43.674.812 1.254.812 2.209 0 4-1.791 4-4v-.5c0-2.112-.832-4.161-2.344-5.719C16.161 6.84 14.112 6 12 6s-1.09 0-1.09 0zM12 16c-1.105 0-2-.895-2-2s.895-2 2-2 2 .895 2 2-.895 2-2 2z" />
  </svg>
);

const LinktreeIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4">
    <path d="M21.32 9.5h-5.83V2.41L12 0 8.51 2.41V9.5H2.68v4.99h5.83v7.1h2.98V14.49h1.02v7.1h2.98V14.49h5.83V9.5z" />
  </svg>
);

function WhatsappIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.03 0C5.449 0 .081 5.377.077 11.967c0 2.105.547 4.16 1.587 6.006L0 24l6.149-1.613a11.83 11.83 0 005.874 1.552h.005c6.581 0 11.95-5.377 11.953-11.967a11.82 11.82 0 00-3.502-8.472" />
    </svg>
  );
}

interface ProductPurchaseActionsProps {
  product: any;
  productName: string;
  lang: string;
  t: any;
  currentPrice: number;
  subPrice: number;
  hasDiscount: boolean;
  isOutOfStock: boolean;
  locations: any[];
  addItem: () => void;
  user: any;
  onNotifyMe: (email: string, qty: number) => Promise<void>;
  isNotifyLoading: boolean;
  applicablePromos?: any[];
  quantity: number;
  setQuantity: (v: number | ((prev: number) => number)) => void;
  demandCount?: number;
  earliestExpiry?: string | null;
  sellableStock: number;
}

export function ProductPurchaseActions({ 
  product, productName, lang, t, currentPrice, hasDiscount, isOutOfStock, 
  locations, addItem, user, onNotifyMe, isNotifyLoading, applicablePromos = [],
  quantity, setQuantity, demandCount = 0, earliestExpiry = null, sellableStock
}: ProductPurchaseActionsProps) {
  const { toast } = useToast();
  const isEn = lang === 'en';
  const isRealUser = user && !user.isAnonymous;

  const getStockForLocation = useCallback((locId: string) => {
    if (!product) return 0;
    const todayStr = format(new Date(), "yyyy-MM-dd");
    if (Array.isArray(product.batches) && product.batches.length > 0) {
      return product.batches
        .filter((b: any) => b.locationId === locId && (!b.expiryDate || b.expiryDate >= todayStr))
        .reduce((sum: number, b: any) => sum + (Number(b.quantity) || 0), 0);
    }
    // 注意：如果產品沒有 batches 但有 warehouseStock，這裡可能無法判斷效期
    // 建議在後台精算時即剔除過期庫存
    return (product.warehouseStock && product.warehouseStock[locId]) || 0;
  }, [product]);

  const donationLabel = useMemo(() => {
    const p = applicablePromos?.find(p => p.isDonationActive);
    if (!p) return null;
    const charity = p.donationCharity;
    
    switch (p.donationType) {
      case 'fixed_per_order':
        return isEn ? `Donate $${p.donationValue} per order to ${charity}` : `每筆訂單，我們即代捐 $${p.donationValue}予「${charity}」`;
      case 'percent_of_total':
        return isEn ? `Donate ${p.donationValue}% of order to ${charity}` : `我們將捐出訂單金額的 ${p.donationValue}% 予「${charity}」`;
      case 'fixed_per_item':
        return isEn ? `Donate $${p.donationValue} per unit to ${charity}` : `每買一件，我們即代捐 $${p.donationValue}予「${charity}」`;
      default:
        return isEn ? `Your purchase supports ${charity}` : `您的此筆消費將支持「${charity}」的慈善工作`;
    }
  }, [applicablePromos, isEn]);

  const handleNotifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isRealUser) return; 
    onNotifyMe(user.email, quantity);
  };

  const isPreOrder = product.inventoryPolicy === 'PreOrder';
  const isDeniedOutOfStock = isOutOfStock && product.inventoryPolicy === 'Deny';

  // 分享連結生成邏輯
  const handleCopyLink = () => {
    const baseUrl = typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}` : "";
    const productUrl = `${baseUrl}/product/${product.slug || product.id}`;
    navigator.clipboard.writeText(productUrl);
    toast({ title: isEn ? "Link Copied!" : "連結已複製" });
  };

  const getShareOptions = () => {
    const baseUrl = typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}` : "";
    const productUrl = `${baseUrl}/product/${product.slug || product.id}`;
    const text = isEn ? `Check out this product: ${productName}` : `我在 SHOP POINT 發現了這款好物：${productName}`;
    const encodedUrl = encodeURIComponent(productUrl);
    const encodedText = encodeURIComponent(text);

    return [
      { id: 'whatsapp', label: 'WhatsApp', icon: WhatsappIcon, color: 'bg-[#25D366]', link: `https://wa.me/?text=${encodedText}%20${encodedUrl}` },
      { id: 'facebook', label: 'Facebook', icon: Facebook, color: 'bg-[#1877F2]', link: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}` },
      { id: 'threads', label: 'Threads', icon: ThreadsIcon, color: 'bg-black', link: `https://www.threads.net/intent/post?text=${encodedText}%20${encodedUrl}` },
      { id: 'x', label: 'X', icon: XIcon, color: 'bg-black', link: `https://x.com/intent/tweet?text=${encodedText}&url=${encodedUrl}` },
      { id: 'telegram', label: 'Telegram', icon: Send, color: 'bg-[#0088cc]', link: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}` },
      { id: 'instagram', label: 'Instagram', icon: Instagram, color: 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600', onClick: handleCopyLink },
      { id: 'linktree', label: 'Linktree', icon: LinktreeIcon, color: 'bg-[#25D366]', onClick: handleCopyLink },
      { id: 'copy', label: isEn ? 'Copy' : '複製', icon: Copy, color: 'bg-slate-700', onClick: handleCopyLink },
    ];
  };

  if (!product) return <div className="h-48 bg-muted animate-pulse rounded-3xl" />;

  return (
    <div className="space-y-6">
      {donationLabel && (
        <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 flex items-start gap-3 animate-in slide-in-from-left-2">
          <div className="h-8 w-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm shrink-0">
            <HeartHandshake className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase text-indigo-600 tracking-widest">公益聯乘活動</p>
            <p className="font-bold text-sm text-indigo-900 leading-tight mt-0.5">{donationLabel}</p>
          </div>
        </div>
      )}

      {isPreOrder && (
        <div className="p-6 bg-indigo-50 rounded-[2rem] border-2 border-indigo-100 space-y-4 animate-in zoom-in duration-500 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-indigo-700">
              <CalendarDays className="h-5 w-5 fill-current" />
              <span className="text-xs font-black uppercase tracking-tight">{isEn ? 'PRE-ORDER SCHEDULE' : '限定預購時程'}</span>
            </div>
            <Badge className="bg-indigo-600 text-white border-none font-black text-[9px] px-3 h-6 uppercase animate-pulse">PRE-ORDER</Badge>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {product.preOrderDeadline && (
              <div className="space-y-1.5 p-3 bg-white rounded-xl border border-indigo-100 shadow-sm">
                <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">{isEn ? 'Order Deadline' : '銷售截止期限'}</p>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-indigo-600" />
                  <span className="text-sm font-black text-indigo-900">{product.preOrderDeadline}</span>
                </div>
              </div>
            )}
            {product.preOrderExpectedDate && (
              <div className="space-y-1.5 p-3 bg-white rounded-xl border border-indigo-100 shadow-sm">
                <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">{isEn ? 'Expected Arrival' : '預計到貨日期'}</p>
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-indigo-600" />
                  <span className="text-sm font-black text-indigo-900">{product.preOrderExpectedDate}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {!isDeniedOutOfStock ? (
        <Card className="border-2 border-primary/10 rounded-3xl overflow-hidden bg-white shadow-sm">
          <CardContent className="p-8">
            <div className="flex justify-between items-start">
              <div className="space-y-1 flex-1">
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{isEn ? 'PRICE' : '售價'}</p>
                <div className="flex items-baseline gap-3">
                  <span className="font-black text-4xl text-orange-600 tracking-tighter">${currentPrice.toFixed(1)}</span>
                  {hasDiscount && <span className="text-lg font-bold text-muted-foreground line-through opacity-60">${Number(product.price).toFixed(1)}</span>}
                </div>
                
                {applicablePromos.length > 0 && (
                  <div className="pt-4 space-y-3 animate-in slide-in-from-left-4 duration-500">
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest opacity-60">適用優惠活動 (Active Promotions):</p>
                    <div className="grid gap-2">
                      {applicablePromos.map((promo, idx) => (
                        <div key={idx} className="flex flex-col gap-1.5 p-3 bg-muted/20 rounded-2xl border border-dashed border-primary/10 group">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-orange-600 text-white border-none font-black text-[10px] uppercase h-6 px-3 gap-1.5 shadow-sm">
                              <Sparkles className="h-3 w-3 fill-current" />
                              {getPromoShortLabel(promo, lang)}
                            </Badge>
                            {getPromoPriceLabel(product, promo, lang) && (
                              <span className="text-xs font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-100">
                                {getPromoPriceLabel(product, promo, lang)}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              {hasDiscount && (
                <Badge className="bg-red-600 text-white border-none font-black h-8 px-4 rounded-xl text-base shadow-lg animate-in zoom-in">
                  -{Math.round((1 - currentPrice / product.price) * 100)}%
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-2 border-orange-500/20 rounded-3xl overflow-hidden bg-orange-50/30 shadow-sm">
          <CardContent className="p-8 space-y-6">
            <div className="text-center space-y-4">
              <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto text-orange-600">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-black text-orange-900">{t.product.out_of_stock}</h3>
                <p className="text-sm text-orange-800">
                  {isRealUser 
                    ? t.product.notify_me_desc 
                    : (isEn ? "Sign in to receive a back-in-stock notification via Email." : "登入會員即可在補貨完成後接收電郵通知。")}
                </p>
              </div>
              {demandCount > 0 && (
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-600/10 text-orange-700 font-black text-[10px] uppercase animate-in zoom-in">
                  <Flame className="h-3 w-3 fill-current animate-pulse" />
                  {t.product.demand_count.replace('{count}', demandCount.toString())}
                </div>
              )}
            </div>
            
            {isRealUser ? (
              <form onSubmit={handleNotifySubmit} className="space-y-4 p-6 bg-white rounded-2xl shadow-inner border">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold uppercase tracking-widest">{lang === 'en' ? 'Quantity Needed' : '預計購買數量'}</Label>
                  <div className="flex items-center border rounded-xl overflow-hidden h-9 bg-muted/30">
                    <button type="button" className="px-3 hover:bg-muted" onClick={() => setQuantity(q => Math.max(1, q - 1))}><Minus className="h-4 w-4" /></button>
                    <span className="w-8 text-center font-bold text-sm">{quantity}</span>
                    <button type="button" className="px-3 hover:bg-muted" onClick={() => setQuantity(q => q + 1)}><Plus className="h-3 w-3" /></button>
                  </div>
                </div>
                <Button 
                  type="submit"
                  className="w-full h-12 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-xl shadow-lg gap-2"
                  disabled={isNotifyLoading}
                >
                  {isNotifyLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Bell className="h-5 w-5" />}
                  {t.product.notify_me}
                </Button>
              </form>
            ) : (
              <div className="p-2">
                <LoginDialog trigger={<Button className="w-full h-14 bg-primary text-primary-foreground font-black rounded-2xl shadow-lg gap-2"><UserPlus className="h-5 w-5" />{isEn ? "Sign In to Notify Me" : "登入以訂閱到貨通知"}</Button>} />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {earliestExpiry && (
        <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50/50 rounded-xl border border-indigo-100/50 animate-in fade-in duration-700">
          <Clock className="h-4 w-4 text-indigo-500" />
          <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider">
            {isEn ? "Best Before / Expiry Date" : "此日期前最佳 / 有效日期"}
          </span>
          <span className="h-3 w-px bg-indigo-200" />
          <span className="text-sm font-black text-indigo-900">{earliestExpiry}</span>
        </div>
      )}

      <Card className="border-none shadow-sm bg-muted/20 rounded-2xl overflow-hidden">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-muted-foreground font-bold"><Globe className="h-4 w-4 text-primary" /> {t.product.online_stock}</span>
            {isPreOrder ? (
               <Badge className="bg-indigo-600 text-white border-none font-black text-[9px] uppercase px-3 h-6">
                 <Zap className="h-2.5 w-2.5 mr-1 fill-current animate-pulse" /> {isEn ? 'PRE-ORDER' : '預購'}
               </Badge>
            ) : sellableStock > 10 ? (
              <span className="text-green-600 font-black flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> {t.product.in_stock}</span>
            ) : sellableStock > 0 ? (
              <span className="text-orange-600 font-black">{t.product.low_stock_alert.replace('{count}', String(sellableStock))}</span>
            ) : (
              <span className="text-destructive font-black flex items-center gap-1"><XCircle className="h-4 w-4" /> {t.product.out_of_stock}</span>
            )}
          </div>
          <div className="space-y-3 border-t border-dashed pt-3 border-muted-foreground/20">
            {locations?.filter((loc: any) => loc.status === 'Active' && loc.isVisible !== false).map((loc: any) => {
              const stockQty = getStockForLocation(loc.id);
              const locName = lang === 'en' ? (loc.name_en || loc.name_zh) : (loc.name_zh || loc.name_en);
              return (
                <div key={loc.id} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-muted-foreground font-medium">
                    {loc.type === 'physical' ? <Store className="h-3.5 w-3.5 text-primary" /> : <Warehouse className="h-3.5 w-3.5 text-primary" />}
                    {locName}
                  </span>
                  {stockQty > 0 ? (
                    <span className="text-green-600 font-bold flex items-center gap-1 text-[11px]"><CheckCircle2 className="h-3 w-3" /> {t.product.in_stock}</span>
                  ) : (
                    <span className="text-muted-foreground/40 font-bold flex items-center gap-1 text-[11px]">
                      {isPreOrder ? <Zap className="h-3 w-3 text-indigo-500" /> : <XCircle className="h-3 w-3" />} 
                      {isPreOrder ? (isEn ? 'Pre-Order' : '預購') : t.product.out_of_stock}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      
      <div className="flex items-center gap-4">
        {!isDeniedOutOfStock && (
          <div className="flex items-center border rounded-xl overflow-hidden h-11 bg-muted/30">
            <button className="px-4 hover:bg-muted transition-colors" onClick={() => setQuantity(q => Math.max(1, q - 1))} disabled={quantity <= 1}><Minus className="h-4 w-4" /></button>
            <span className="w-8 text-center font-bold text-lg">{quantity}</span>
            <button className="px-4 hover:bg-muted transition-colors" onClick={() => setQuantity(q => q + 1)}><Plus className="h-4 w-4" /></button>
          </div>
        )}
        
        {!isDeniedOutOfStock ? (
          <Button className="flex-1 h-12 bg-primary text-primary-foreground font-black rounded-xl shadow-lg hover:scale-[1.02] active:scale-95 transition-all gap-2" onClick={addItem}>
            <ShoppingCart className="h-5 w-5" />
            {isPreOrder ? (isEn ? "Pre-order" : "預購") : t.product.add_to_cart}
          </Button>
        ) : null}

        {/* 分享按鈕移至此處 */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="h-12 w-12 rounded-xl border-2 group transition-all shrink-0 hover:bg-primary/5 hover:border-primary p-0">
              <Share2 className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-72 p-0 border-none shadow-2xl rounded-3xl overflow-hidden z-[150]">
            <div className="bg-primary/10 px-6 py-3 border-b">
              <h3 className="font-black text-[10px] uppercase tracking-widest text-primary flex items-center gap-2">
                <Share2 className="h-3.5 w-3.5" /> Share Product
              </h3>
            </div>
            <div className="p-3 grid grid-cols-4 gap-3 bg-white">
              {getShareOptions().map((opt) => (
                <div key={opt.id} className="flex flex-col items-center gap-1">
                  {opt.link ? (
                    <a href={opt.link} target="_blank" rel="noreferrer" className={cn("h-10 w-10 rounded-xl flex items-center justify-center text-white shadow-sm transition-all hover:scale-110", opt.color)}>
                      <opt.icon className="h-4 w-4" />
                    </a>
                  ) : (
                    <button onClick={opt.onClick} className={cn("h-10 w-10 rounded-xl flex items-center justify-center text-white shadow-sm transition-all hover:scale-110", opt.color)}>
                      <opt.icon className="h-4 w-4" />
                    </button>
                  )}
                  <span className="text-[8px] font-black uppercase text-muted-foreground truncate w-full text-center">{opt.label}</span>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
