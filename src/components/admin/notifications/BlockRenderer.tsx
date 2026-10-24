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
  Clock
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
 * 畫布區塊渲染器：負責在編輯器中呈現各類組件的視覺效果
 */
export function BlockRenderer({ block }: BlockRendererProps) {
  const { data, type } = block;
  if (!data) return null;

  const wrap = (children: React.ReactNode) => <div className="p-4">{children}</div>;

  switch (type) {
    case 'logo':
      return (
        <div className={cn("flex py-2", data.align === 'center' ? 'justify-center' : 'justify-start')}>
          <img src={data.url} alt="Logo" style={{ maxHeight: '50px' }} />
        </div>
      );
    case 'hero':
      return <img src={data.url} className="w-full rounded-2xl shadow-sm mb-4" alt="Hero" />;
    case 'text':
      return (
        <div className="px-4 py-2 space-y-2">
          {data.title && <h2 className="text-2xl font-black">{data.title}</h2>}
          <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{data.content || data.msg}</div>
        </div>
      );
    case 'order_status_tracker':
      return (
        <div className="py-4 px-6 bg-muted/20 rounded-2xl border border-dashed my-4">
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
        <div className={cn("flex items-center gap-3 py-4", data.align === 'center' ? 'justify-center' : data.align === 'right' ? 'justify-end' : 'justify-start')}>
          <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white"><Facebook className="h-4 w-4" /></div>
          <div className="h-8 w-8 rounded-full bg-pink-600 flex items-center justify-center text-white"><Instagram className="h-4 w-4" /></div>
          <div className="h-8 w-8 rounded-full bg-black flex items-center justify-center text-white">
            <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M14.103 20.231c-2.095 0-3.353-1.215-3.353-3.005 0-1.89 1.011-3.066 3.126-3.066 1.343 0 2.506.419 2.506 1.411 0 1.504-1.909 1.486-2.454 1.486-.658 0-1.312-.052-1.962-.159a4.773 4.773 0 0 1-3.13-1.23c-1.027-1.028-1.581-2.47-1.581-4.122 0-3.394 2.775-6.152 6.203-6.152 3.304 0 6.025 2.439 6.025 5.919 0 4.561-3.413 8.148-8.125 8.148-1.276 0-2.445-.253-3.474-.753l-.11-.051-.028.01c-1.381.505-2.739.511-4.093.33l-.023-.005.004-.023c.209-1.314.537-2.622 1.03-3.908l.006-.014.013.01c.453.318.905.613 1.396.862 1.299.656 2.667.912 4.066.912.19 0 .379-.002.567-.007.428-.011.847-.033 1.253-.065.378-.029.739-.067 1.082-.115.315-.046.611-.099.889-.16.352-.076.678-.167.974-.277.62-.23 1.15-.509 1.586-.827.43-.313.773-.68 1.027-1.093.252-.403.38-1.039.38-1.719 0-.927-.248-1.561-.737-1.884-.463-.305-1.077-.46-1.821-.46-1.001 0-1.986.397-2.775 1.119-.782.715-1.214 1.72-1.214 2.828 0 1.01.254 1.79.754 2.317.498.525 1.157.789 1.96.789.638 0 1.081-.058 1.332-.171.164-.074.252-.174.252-.285 0-.24-.18-.42-.41-.42-.06 0-.13.01-.2.03-.08.02-.19.04-.33.04-.48 0-.83-.14-1.03-.4-.17-.23-.25-.59-.25-.95 0-.64.24-1.23.67-1.62.405-.365.814-.526 1.214-.526.417 0 .741.115.966.34.232.231.344.551.344.95 0 .47-.11.81-.33 1.03-.22.22-.51.33-.86.33-.09 0-.19-.01-.31-.02-.26-.03-.51-.07-.76-.13-.42-.1-.81-.24-1.16-.41-.16-.08-.31-.16-.45-.25-.23-.15-.43-.33-.59-.53-.26-.33-.39-.74-.39-1.21 0-.83.33-1.58.93-2.1.54-.47 1.24-.72 1.97-.72.84 0 1.55.33 2.01.93.42.55.63 1.28.63 2.15 0 1.08-.25 1.97-.75 2.66-.5.69-1.24 1.21-2.12 1.54-.38.14-.8.25-1.26.33-.46.08-.95.12-1.46.12-1.27 0-2.4-.25-3.35-.75-.95-.5-1.71-1.21-2.26-2.1-.55-.89-.83-1.9-.83-3.01 0-1.64.41-3.03 1.22-4.14.81-1.11 1.96-1.67 3.42-1.67.67 0 1.25.12 1.74.35.49.23.89.55 1.2.95.31.4.52.88.63 1.43.11.55.17 1.15.17 1.8 0 .65-.06 1.25-.17 1.8-.11.55-.32 1.03-.63 1.43-.31.4-.71.72-1.2.95-.49.23-1.07.35-1.74.35-1.46 0-2.61-.56-3.42-1.67-.81-1.11-1.22-2.5-1.22-4.14 0-1.11.28-2.12.83-3.01.55-.89 1.31-1.6 2.26-2.1.95-.5 2.08-.75 3.35-.75.51 0 1 .04 1.46.12.46.08.88.19 1.26.33.88.33 1.62.85 2.12 1.54.5.69.75 1.58.75 2.66 0 .87-.21 1.6-.63 2.15-.46.6-1.17.93-2.01.93-.73 0-1.43-.25-1.97-.72-.6-.52-.93-1.27-.93-2.1 0-.47.13-.88.39-1.21.16-.2.36-.38.59-.53.14-.09.29-.17.45-.25.35-.17.74-.31 1.16-.41.25-.06.5-.1.76-.13.12-.01.22-.02.31-.02.35 0 .64.11.86.33.22.22.33.56.33 1.03 0 .36-.08.72-.25.95-.2.26-.55.4-1.03.4-.14 0-.25-.02-.33-.04-.07-.02-.14-.03-.2-.03-.23 0-.41.18-.41.42 0 .11.088.211.252.285.251.113.694.171 1.332.171.803 0 1.462-.264 1.96-.789.5-.527.754-1.307.754-2.317 0-1.108-.432-2.113-1.214-2.828-.789-.722-1.774-1.119-2.775-1.119-.744 0-1.358.155-1.821.46-.489.323-.737.957-.737 1.884 0 .68.128 1.316.38 1.719.254.413.597.78 1.027 1.093.436.318.966.597 1.586.827.278.103.604.194.974.277.278.061.574.114.889.16.343.048.704.086 1.082.115.406.032.825.054 1.253.065.188.005.377.007.567.007 1.399 0 2.767-.256 4.066-.912.491-.249.943-.544 1.396-.862l.013-.01.006.014c.493 1.286.821 2.594 1.03 3.908l.004.023-.023.005c-1.354.181-2.712.175-4.093-.33l-.028-.01-.11.051c-1.029.5-2.198.753-3.474.753-4.712 0-8.125-3.587-8.125-8.148 0-3.48 2.721-5.919 6.025-5.919 3.428 0 6.203 2.758 6.203 6.152 0 1.652-.554 3.094-1.581 4.122a4.773 4.773 0 0 1-3.13 1.23c-.65.107-1.304.159-1.962.159-.545 0-2.454.018-2.454-1.486 0-.992 1.163-1.411 2.506-1.411 2.115 0 3.126 1.176 3.126 3.066 0 1.79-1.258 3.005-3.353 3.005Z" /></svg>
          </div>
          <div className="h-8 w-8 rounded-full bg-red-600 flex items-center justify-center text-white"><Youtube className="h-4 w-4" /></div>
          <div className="h-8 w-8 rounded-full bg-green-600 flex items-center justify-center text-white"><Smartphone className="h-4 w-4" /></div>
        </div>
      );
    case 'order_meta':
      return (
        <div className="bg-muted/30 p-6 rounded-2xl border flex justify-between items-center my-4">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase text-muted-foreground">Order ID</p>
            <p className="font-bold text-lg">{data.orderId || "{{orderId}}"}</p>
          </div>
          <div className="text-right space-y-1">
            <p className="text-[10px] font-black uppercase text-muted-foreground">Date</p>
            <p className="font-bold text-sm">{data.date || "{{orderDate}}"}</p>
          </div>
        </div>
      );
    case 'order_summary':
      return (
        <div className="bg-muted/10 p-6 rounded-2xl border border-dashed my-4 space-y-4">
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
      return (
        <div className="p-6 border border-dashed rounded-2xl my-4 bg-white shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase text-primary tracking-widest">
            <MapPin className="h-3 w-3" /> {data.title || (type === 'shipping_address' ? 'Shipping Address' : 'Billing Address')}
          </div>
          <p className="text-sm font-bold whitespace-pre-line leading-relaxed">{data.address || "{{shippingAddress}}"}</p>
        </div>
      );
    case 'customer_details':
      return (
        <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100 my-4 space-y-2">
          <p className="text-[10px] font-black uppercase text-indigo-700">Customer Info</p>
          <p className="font-bold text-sm">{data.name || "{{customerName}}"}</p>
          <p className="text-xs text-indigo-900/60">{(data.phone || "{{customerPhone}}")} • {(data.email || "{{customerEmail}}")}</p>
        </div>
      );
    case 'shipping_details':
      return (
        <div className="bg-muted/20 p-6 rounded-2xl border my-4 flex justify-between items-center">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase text-muted-foreground">Method</p>
            <p className="font-bold text-sm">{data.method || "{{shippingMethod}}"}</p>
          </div>
          <div className="text-right space-y-1">
            <p className="text-[10px] font-black uppercase text-muted-foreground">Tracking</p>
            <p className="font-mono text-sm font-bold text-primary">{data.tracking || "{{trackingNo}}"}</p>
          </div>
        </div>
      );
    case 'pickup_point':
      return (
        <div className="p-6 bg-orange-50 border border-orange-100 rounded-2xl my-4 space-y-2">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase text-orange-700">
            <Store className="h-3 w-3" /> Pickup Point
          </div>
          <p className="font-bold text-sm">{data.location || '{{pickupLocation}}'}</p>
        </div>
      );
    case 'membership_upgrade':
      return (
        <div className="p-8 text-center bg-gradient-to-br from-amber-400 to-primary rounded-[2rem] text-white my-6 shadow-xl space-y-4">
          <div className="h-16 w-16 bg-white/20 rounded-full flex items-center justify-center mx-auto"><Award className="h-8 w-8" /></div>
          <div className="space-y-1">
            <h2 className="text-2xl font-black">Level Up!</h2>
            <p className="font-bold text-lg">New Tier: {data.tier || "{{newTier}}"}</p>
          </div>
          <p className="text-xs opacity-90">{data.msg}</p>
        </div>
      );
    case 'stock_notice':
      return (
        <div className="p-6 bg-blue-50 border border-blue-100 rounded-2xl my-4 space-y-3">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase text-blue-700"><Bell className="h-4 w-4" /> Back in Stock</div>
          <p className="font-bold text-base">{data.product || "{{productName}}"}</p>
          <p className="text-xs text-blue-800">{data.msg}</p>
        </div>
      );
    case 'coupon':
      return (
        <div className="p-6 border-4 border-dashed border-primary/40 rounded-2xl my-6 text-center space-y-3 bg-primary/5">
          <p className="text-[10px] font-black uppercase text-primary">Exclusive Offer</p>
          <h2 className="text-3xl font-black text-primary">{data.discount || "SPECIAL GIFT"}</h2>
          <div className="bg-white px-4 py-2 rounded-lg border inline-block font-mono font-bold text-lg tracking-widest">{data.code || "WELCOME"}</div>
        </div>
      );
    case 'abandoned_cart':
      return (
        <div className="p-6 bg-red-50 border border-red-100 rounded-2xl my-4 space-y-4">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase text-red-600"><ShoppingCart className="h-3 w-3" /> Shopping Cart Recovery</div>
          <p className="text-sm font-bold">{data.msg}</p>
          <div className="bg-white/50 p-4 rounded-xl border border-dashed text-xs italic text-center">Items: {"{{itemsTable}}"}</div>
        </div>
      );
    case 'products':
      return (
        <div className="my-6 space-y-3">
          <p className="text-[10px] font-black uppercase text-muted-foreground ml-2">Order Items</p>
          <div className="border rounded-2xl overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/10">
                <TableRow>
                  <TableHead className="font-bold text-xs">Item</TableHead>
                  <TableHead className="text-center font-bold text-xs">Qty</TableHead>
                  <TableHead className="text-right font-bold text-xs">Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.isArray(data.items) && data.items.length > 0 ? (
                  data.items.map((item: any, i: number) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs font-bold">{item.name}</TableCell>
                      <TableCell className="text-center text-xs">1</TableCell>
                      <TableCell className="text-right text-xs">${item.price}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-xs text-center p-8 text-muted-foreground italic">
                      {"{{itemsTable}}"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      );
    case 'button':
      return (
        <div className="flex justify-center p-6">
          <button className="bg-primary text-primary-foreground px-12 py-4 rounded-2xl font-black text-lg shadow-xl">
            {data.label}
          </button>
        </div>
      );
    case 'footer':
      return (
        <div className="p-8 text-center bg-muted/10 border-top border-dashed mt-8">
          <p className="text-[10px] text-muted-foreground leading-relaxed">{data.content}</p>
        </div>
      );
    default:
      return "";
  }
}
