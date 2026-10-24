
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
  lang?: "zh" | "en";
}

const PREVIEW_LABELS: Record<string, Record<string, string>> = {
  zh: {
    order_id: "訂單編號",
    date: "日期",
    summary: "訂單摘要",
    subtotal: "小計",
    shipping: "運費",
    discount: "優惠",
    total: "總額",
    placed: "已下單",
    processing: "配貨中",
    shipped: "已發貨",
    delivered: "已完成",
    ready: "待取貨",
    shipping_addr: "收貨地址",
    billing_addr: "賬單地址",
    cust_info: "顧客資訊",
    method: "配送方式",
    tracking: "物流單號",
    pickup: "自取地點",
    coupon_title: "專屬優惠",
    items_title: "產品明細"
  },
  en: {
    order_id: "Order ID",
    date: "Date",
    summary: "Order Summary",
    subtotal: "Subtotal",
    shipping: "Shipping",
    discount: "Discount",
    total: "Total",
    placed: "Placed",
    processing: "Processing",
    shipped: "Shipped",
    delivered: "Delivered",
    ready: "Ready",
    shipping_addr: "Shipping Address",
    billing_addr: "Billing Address",
    cust_info: "Customer Info",
    method: "Method",
    tracking: "Tracking",
    pickup: "Pickup Point",
    coupon_title: "Exclusive Offer",
    items_title: "Order Items"
  }
};

export function BlockRenderer({ block, lang = "zh" }: BlockRendererProps) {
  const { data, type } = block;
  if (!data) return null;

  const labels = PREVIEW_LABELS[lang] || PREVIEW_LABELS["zh"];
  const wrap = (children: React.ReactNode) => <div className="p-4">{children}</div>;

  const baseUrl = "https://shoppoint.hk";
  const ensureAbsolute = (url: any) => {
    if (!url || typeof url !== 'string') return "";
    if (url.startsWith('http')) return url;
    return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  switch (type) {
    case 'logo':
      const align = data.align === 'center' ? 'center' : 'left';
      return (
        <div className={cn("flex py-2 px-4", align === 'center' ? "justify-center" : "justify-start")}>
          <img src={ensureAbsolute(data.url || "/logo.png")} alt="Logo" style={{ maxHeight: '50px' }} />
        </div>
      );
    case 'hero':
      return wrap(<img src={ensureAbsolute(data.url)} className="w-full rounded-2xl shadow-sm" alt="Banner" />);
    case 'text':
      return (
        <div className="px-6 py-4 space-y-2 text-left">
          {data.title && <h2 className="text-2xl font-black">{data.title}</h2>}
          <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{data.content || data.msg || ""}</div>
        </div>
      );
    case 'order_status_tracker':
      return (
        <div className="py-8 px-6 bg-muted/20 rounded-2xl border border-dashed my-4 mx-4">
           <div className="flex items-center justify-between">
             <div className="flex flex-col items-center gap-1.5">
               <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center text-white"><CheckCircle2 className="h-4 w-4" /></div>
               <span className="text-[8px] font-black uppercase text-slate-900">{labels.placed}</span>
             </div>
             <div className="flex-1 h-0.5 bg-primary/20 mx-1" />
             <div className="flex flex-col items-center gap-1.5 opacity-50">
               <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-muted-foreground"><Clock className="h-4 w-4" /></div>
               <span className="text-[8px] font-black uppercase">{labels.processing}</span>
             </div>
             <div className="flex-1 h-0.5 bg-muted mx-1" />
             <div className="flex flex-col items-center gap-1.5 opacity-50">
               <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-muted-foreground"><Truck className="h-4 w-4" /></div>
               <span className="text-[8px] font-black uppercase">{labels.shipped}</span>
             </div>
             <div className="flex-1 h-0.5 bg-muted mx-1" />
             <div className="flex flex-col items-center gap-1.5 opacity-50">
               <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-muted-foreground"><Package className="h-4 w-4" /></div>
               <span className="text-[8px] font-black uppercase">{labels.delivered}</span>
             </div>
           </div>
        </div>
      );
    case 'order_meta':
      return wrap(
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex justify-between items-center text-left">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest m-0">{labels.order_id}</p>
            <p className="text-xl font-black m-0">{"{{orderId}}"}</p>
          </div>
          <div className="text-right space-y-1">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest m-0">{labels.date}</p>
            <p className="text-sm font-bold text-slate-600 m-0">{"{{orderDate}}"}</p>
          </div>
        </div>
      );
    case 'order_summary':
      return (
        <div className="bg-muted/10 p-6 rounded-2xl border border-dashed my-4 mx-4 space-y-4 text-left">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase text-muted-foreground tracking-widest">
            <Calculator className="h-3 w-3" /> {labels.summary}
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-muted-foreground"><span>{labels.subtotal}</span><span>$ {"{{subtotal}}"}</span></div>
            <div className="flex justify-between text-xs font-bold text-muted-foreground"><span>{labels.shipping}</span><span>$ {"{{shippingFee}}"}</span></div>
            <div className="flex justify-between text-xs font-bold text-green-600"><span>{labels.discount}</span><span>-$ {"{{discountAmount}}"}</span></div>
            <Separator className="my-2" />
            <div className="flex justify-between text-base font-black"><span>{labels.total}</span><span className="text-primary">$ {"{{totalAmount}}"}</span></div>
          </div>
        </div>
      );
    case 'shipping_address':
    case 'billing_address':
      const isShipping = type === 'shipping_address';
      return wrap(
        <div className="p-6 border-2 border-dashed border-slate-200 rounded-2xl bg-white text-left">
          <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-2">
            {isShipping ? labels.shipping_addr : labels.billing_addr}
          </p>
          <p className="text-sm font-bold text-slate-800 leading-relaxed">
            {"{{shippingAddress}}"}
          </p>
        </div>
      );
    case 'customer_details':
      return (
        <div className="mx-4 bg-indigo-50 p-6 rounded-2xl border border-indigo-100 my-4 space-y-2 text-left">
          <p className="text-[10px] font-black uppercase text-indigo-700">{labels.cust_info}</p>
          <p className="font-bold text-sm">{"{{customerName}}"}</p>
          <p className="text-xs text-indigo-900/60">{"{{customerPhone}}"} • {"{{customerEmail}}"}</p>
        </div>
      );
    case 'shipping_details':
      return (
        <div className="mx-4 bg-muted/20 p-6 rounded-2xl border my-4 flex justify-between items-center text-left">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase text-muted-foreground">{labels.method}</p>
            <p className="font-bold text-sm">{"{{shippingMethod}}"}</p>
          </div>
          <div className="text-right space-y-1">
            <p className="text-[10px] font-black uppercase text-muted-foreground">{labels.tracking}</p>
            <p className="font-mono text-sm font-bold text-primary">{"{{trackingNo}}"}</p>
          </div>
        </div>
      );
    case 'coupon':
      return (
        <div className="mx-4 p-6 border-4 border-dashed border-primary/40 rounded-2xl my-6 text-center space-y-3 bg-primary/5">
          <p className="text-[10px] font-black uppercase text-primary">{labels.coupon_title}</p>
          <h2 className="text-2xl font-black text-primary">{data.discount || "SPECIAL GIFT"}</h2>
          <div className="bg-white px-4 py-2 rounded-lg border inline-block font-mono font-bold text-lg tracking-widest">{"{{couponCode}}"}</div>
        </div>
      );
    case 'products':
      return (
        <div className="mx-4 my-6 space-y-3 text-left">
          <p className="text-[10px] font-black uppercase text-muted-foreground ml-2">{labels.items_title}</p>
          <div className="border rounded-2xl overflow-hidden bg-white">
            <Table>
              <TableHeader className="bg-muted/10">
                <TableRow>
                  <TableHead className="font-bold text-[10px]">{lang === 'en' ? 'Item' : '貨品'}</TableHead>
                  <TableHead className="text-center font-bold text-[10px]">{lang === 'en' ? 'Qty' : '數量'}</TableHead>
                  <TableHead className="text-right font-bold text-[10px]">{lang === 'en' ? 'Total' : '金額'}</TableHead>
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
