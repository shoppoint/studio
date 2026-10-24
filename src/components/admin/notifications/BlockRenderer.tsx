"use client";

import React from "react";
import { 
  Image as ImageIcon, 
  Hash, 
  MapPin, 
  Truck, 
  Store, 
  ShoppingCart, 
  User, 
  Award, 
  Bell, 
  Ticket, 
  Info,
  Calculator,
  Share2,
  Facebook,
  Instagram,
  Youtube,
  Smartphone,
  CheckCircle2,
  Clock,
  Package
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { EmailBlock } from "@/types/notifications";
import { Separator } from "@/components/ui/separator";

interface BlockRendererProps {
  block: EmailBlock;
}

/**
 * 畫布區塊渲染器 - 100% JSX 版 (修正代碼洩漏問題)
 * 修正說明：將所有傳入 wrap 的 HTML 字串改為 JSX 組件，確保編輯器中正確顯示視覺效果。
 */
export function BlockRenderer({ block }: BlockRendererProps) {
  const { data, type } = block;
  if (!data) return null;

  const wrap = (children: React.ReactNode) => <div className="p-4">{children}</div>;

  const baseUrl = "https://shoppoint.hk";
  const ensureAbsolute = (url: any) => {
    if (!url || typeof url !== 'string') return "";
    if (url.startsWith('http')) return url;
    return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const XIcon = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
    </svg>
  );

  switch (type) {
    case 'logo':
      const align = data.align === 'center' ? 'center' : 'left';
      return (
        <div className={cn("flex py-2 px-4", align === 'center' ? 'justify-center' : 'justify-start')}>
          <img src={ensureAbsolute(data.url || "/logo.png")} alt="Logo" style={{ maxHeight: '50px' }} />
        </div>
      );
    case 'hero':
      return wrap(<img src={ensureAbsolute(data.url)} className="w-full rounded-2xl shadow-sm" alt="Hero" />);
    case 'text':
      return (
        <div className="px-6 py-4 space-y-2">
          {data.title && <h2 className="text-2xl font-black">{data.title}</h2>}
          <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{data.content || data.msg}</div>
        </div>
      );
    case 'order_status_tracker':
      return (
        <div className="py-4 px-6 bg-muted/20 rounded-2xl border border-dashed my-4 mx-4">
           <div className="flex items-center justify-between mb-4">
             <div className="flex flex-col items-center gap-1">
               <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-white"><CheckCircle2 className="h-4 w-4" /></div>
               <span className="text-[8px] font-black uppercase">Placed</span>
             </div>
             <div className="flex-1 h-0.5 bg-primary/20 mx-2" />
             <div className="flex flex-col items-center gap-1 opacity-50">
               <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-muted-foreground"><Clock className="h-4 w-4" /></div>
               <span className="text-[8px] font-black uppercase">Processing</span>
             </div>
             <div className="flex-1 h-0.5 bg-muted mx-2" />
             <div className="flex flex-col items-center gap-1 opacity-50">
               <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-muted-foreground"><Truck className="h-4 w-4" /></div>
               <span className="text-[8px] font-black uppercase">Shipped</span>
             </div>
             <div className="flex-1 h-0.5 bg-muted mx-2" />
             <div className="flex flex-col items-center gap-1 opacity-50">
               <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-muted-foreground"><Package className="h-4 w-4" /></div>
               <span className="text-[8px] font-black uppercase">Delivered</span>
             </div>
           </div>
           <p className="text-[10px] text-center font-bold text-muted-foreground uppercase tracking-widest">實時進度預覽 (Live Tracking Preview)</p>
        </div>
      );
    case 'social_links':
      return (
        <div className={cn("flex items-center gap-3 py-4 px-6", data.align === 'center' ? 'justify-center' : data.align === 'right' ? 'justify-end' : 'justify-start')}>
          <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white"><Facebook className="h-4 w-4" /></div>
          <div className="h-8 w-8 rounded-full bg-pink-600 flex items-center justify-center text-white"><Instagram className="h-4 w-4" /></div>
          <div className="h-8 w-8 rounded-full bg-black flex items-center justify-center text-white">
            <XIcon className="h-4 w-4" />
          </div>
          <div className="h-8 w-8 rounded-full bg-red-600 flex items-center justify-center text-white"><Youtube className="h-4 w-4" /></div>
          <div className="h-8 w-8 rounded-full bg-green-600 flex items-center justify-center text-white"><Smartphone className="h-4 w-4" /></div>
        </div>
      );
    case 'order_meta':
      return wrap(
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex justify-between items-center">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest m-0">Order ID</p>
            <p className="text-xl font-black m-0">{"{{orderId}}"}</p>
          </div>
          <div className="text-right space-y-1">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest m-0">Date</p>
            <p className="text-sm font-bold text-slate-600 m-0">{"{{orderDate}}"}</p>
          </div>
        </div>
      );
    case 'order_summary':
      return (
        <div className="bg-muted/10 p-6 rounded-2xl border border-dashed my-4 mx-4 space-y-4">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground tracking-widest">
            <Calculator className="h-3 w-3" /> Order Summary
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-muted-foreground"><span>Subtotal 小計</span><span>$ {"{{subtotal}}"}</span></div>
            <div className="flex justify-between text-xs font-bold text-muted-foreground"><span>Shipping 運費</span><span>$ {"{{shippingFee}}"}</span></div>
            <div className="flex justify-between text-xs font-bold text-green-600"><span>Discount 優惠</span><span>-$ {"{{discountAmount}}"}</span></div>
            <Separator className="my-2" />
            <div className="flex justify-between text-base font-black"><span>Total 總額</span><span className="text-primary">$ {"{{totalAmount}}"}</span></div>
          </div>
        </div>
      );
    case 'shipping_address':
    case 'billing_address':
      const isShipping = type === 'shipping_address';
      return wrap(
        <div className="p-6 border-2 border-dashed border-slate-200 rounded-2xl bg-white">
          <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-2">
            {isShipping ? 'Shipping Address' : 'Billing Address'}
          </p>
          <p className="text-sm font-bold text-slate-800 leading-relaxed">
            {"{{shippingAddress}}"}
          </p>
        </div>
      );
    case 'customer_details':
      return (
        <div className="mx-4 bg-indigo-50 p-6 rounded-2xl border border-indigo-100 my-4 space-y-2">
          <p className="text-[10px] font-black uppercase text-indigo-700">Customer Info</p>
          <p className="font-bold text-sm">{"{{customerName}}"}</p>
          <p className="text-xs text-indigo-900/60">{"{{customerPhone}}"} • {"{{customerEmail}}"}</p>
        </div>
      );
    case 'shipping_details':
      return (
        <div className="mx-4 bg-muted/20 p-6 rounded-2xl border my-4 flex justify-between items-center">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase text-muted-foreground">Method</p>
            <p className="font-bold text-sm">{"{{shippingMethod}}"}</p>
          </div>
          <div className="text-right space-y-1">
            <p className="text-[10px] font-black uppercase text-muted-foreground">Tracking</p>
            <p className="font-mono text-sm font-bold text-primary">{"{{trackingNo}}"}</p>
          </div>
        </div>
      );
    case 'pickup_point':
      return (
        <div className="mx-4 p-6 bg-orange-50 border border-orange-100 rounded-2xl my-4 space-y-2">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase text-orange-700">
            <Store className="h-3 w-3" /> Pickup Point
          </div>
          <p className="font-bold text-sm">{'{{pickupLocation}}'}</p>
        </div>
      );
    case 'membership_upgrade':
      return (
        <div className="mx-4 p-8 text-center bg-gradient-to-br from-amber-400 to-primary rounded-[2rem] text-white my-6 shadow-xl space-y-4">
          <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center mx-auto"><Award className="h-6 w-6" /></div>
          <div className="space-y-1">
            <h2 className="text-xl font-black">Level Up!</h2>
            <p className="font-bold text-sm">New Tier: {"{{newTier}}"}</p>
          </div>
        </div>
      );
    case 'stock_notice':
      return (
        <div className="mx-4 p-6 bg-blue-50 border border-blue-100 rounded-2xl my-4 space-y-3">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase text-blue-700"><Bell className="h-4 w-4" /> Back in Stock</div>
          <p className="font-bold text-sm">{"{{productName}}"}</p>
        </div>
      );
    case 'coupon':
      return (
        <div className="mx-4 p-6 border-4 border-dashed border-primary/40 rounded-2xl my-6 text-center space-y-3 bg-primary/5">
          <p className="text-[10px] font-black uppercase text-primary">Exclusive Offer</p>
          <h2 className="text-2xl font-black text-primary">{data.discount || "SPECIAL GIFT"}</h2>
          <div className="bg-white px-4 py-2 rounded-lg border inline-block font-mono font-bold text-lg tracking-widest">{"{{couponCode}}"}</div>
        </div>
      );
    case 'abandoned_cart':
      return (
        <div className="mx-4 p-6 bg-red-50 border border-red-100 rounded-2xl my-4 space-y-4">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase text-red-600"><ShoppingCart className="h-4 w-4" /> Shopping Cart</div>
          <div className="bg-white/50 p-4 rounded-xl border border-dashed text-[10px] italic text-center">Items Table: {"{{{itemsTable}}}"}</div>
        </div>
      );
    case 'products':
      return (
        <div className="mx-4 my-6 space-y-3">
          <p className="text-[10px] font-black uppercase text-muted-foreground ml-2">Order Items</p>
          <div className="border rounded-2xl overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/10">
                <TableRow>
                  <TableHead className="font-bold text-[10px]">Item</TableHead>
                  <TableHead className="text-center font-bold text-[10px]">Qty</TableHead>
                  <TableHead className="text-right font-bold text-[10px]">Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={3} className="text-[10px] text-center p-8 text-muted-foreground italic">
                    {"{{{itemsTable}}}"}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      );
    case 'button':
      return (
        <div className="flex justify-center p-6">
          <button className="bg-primary text-primary-foreground px-10 py-4 rounded-2xl font-black text-base shadow-xl">
            {data.label}
          </button>
        </div>
      );
    case 'footer':
      return (
        <div className="p-8 text-center bg-muted/10 border-t border-dashed mt-8">
          <p className="text-[9px] text-muted-foreground leading-relaxed">{data.content}</p>
        </div>
      );
    default:
      return null;
  }
}
