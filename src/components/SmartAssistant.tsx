"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { 
  MessageSquare, 
  ChevronRight, 
  ArrowLeft,
  X,
  Smartphone,
  Truck,
  MapPin,
  RotateCcw,
  UserPlus,
  PackageSearch,
  CheckCircle2,
  Info,
  Clock,
  ArrowRight,
  Bot,
  Zap,
  Sparkles,
  RefreshCcw,
  ShieldCheck,
  Search,
  ShoppingCart,
  Coins,
  History,
  Tag
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetDescription,
  SheetTrigger
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useI18n } from "@/lib/i18n/i18n-context";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

/**
 * 樹狀結構客服小助手 (Deterministic FAQ Bot)
 * 特點：
 * 1. 移除 Gemini 依賴，100% 穩定，零 API 費用。
 * 2. 採用樹狀多層級導航結構。
 * 3. 隱藏 WhatsApp 按鈕於深層，先引導閱讀答案。
 * 4. 無文字輸入框，完全由按鈕驅動。
 */

interface FaqNode {
  id: string;
  label: string;
  icon?: any;
  color?: string;
  content?: string; // 最終答案內容
  children?: FaqNode[]; // 子選單
  action?: { label: string, url: string }; // 相關跳轉
  showWhatsApp?: boolean; // 是否在該頁顯示聯絡專人按鈕
}

export function SmartAssistant() {
  const { lang, t } = useI18n();
  const pathname = usePathname();
  
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [navigationPath, setNavigationPath] = useState<FaqNode[]>([]);
  
  const isEn = lang === 'en';

  // 定義樹狀知識庫 (純靜態，無需 Gemini)
  const FAQ_TREE: FaqNode[] = useMemo(() => [
    {
      id: "orders",
      label: isEn ? "Orders & Payment" : "訂單與支付相關",
      icon: ShoppingCart,
      color: "text-blue-600",
      children: [
        {
          id: "pay_at_store",
          label: isEn ? "Pay in-store for Pickup?" : "自取訂單可到店付款嗎？",
          content: isEn
            ? "Yes. Select 'In-store Pickup' and 'Pay in Store' at checkout. We hold items for 3 business days."
            : "可以。結帳選取「門市自取」後，支付方式可選「到店付款」。貨品會為您保留 3 個工作天。"
        },
        {
          id: "points_credit",
          label: isEn ? "When are points added?" : "購買後積分幾時存入？",
          content: isEn
            ? "Points are added automatically within 24 hours after your order is marked as 'Delivered' or 'Picked up'."
            : "當訂單狀態變更為「已送達」或「已取貨」後的 24 小時內，積分會自動存入您的帳戶。"
        },
        {
          id: "payment_failed",
          label: isEn ? "Payment Failed?" : "付款失敗/沒跳轉成功？",
          content: isEn 
            ? "Your items are reserved. Go to 'Account > Orders', find the 'Unpaid' order and click 'Pay Now'. For manual transfers, contact us via WhatsApp."
            : "下單即為您預留貨品。請前往「帳戶 > 訂單記錄」找到「未付款」訂單，點擊「查看詳情」即可看到支付按鈕。手動轉帳請傳送收據至 WhatsApp。"
        },
        {
          id: "methods",
          label: isEn ? "Supported payment methods" : "有哪些支付方式？",
          content: isEn
            ? "We support Visa, Mastercard, AlipayHK, WeChat Pay, PayMe, FPS, and Octopus."
            : "我們支援 Visa、Mastercard、AlipayHK、WeChat Pay、PayMe、轉數快 (FPS) 及八達通支付。",
          action: { label: isEn ? "View Payment Guide" : "查看支付指引", url: "/payment-methods" }
        }
      ]
    },
    {
      id: "shipping",
      label: isEn ? "Shipping & Timing" : "配送時效與安排",
      icon: Truck,
      color: "text-green-600",
      children: [
        {
          id: "shipping_time",
          label: isEn ? "How long does shipping take?" : "大概幾耐會發貨？",
          content: isEn
            ? "Normally dispatched within 1-2 business days after payment confirmation. Local delivery takes 1-3 days."
            : "確認款項後，我們通常在 1-2 個工作天內發貨。本地配送一般需時 1-3 天。"
        },
        {
          id: "free_shipping",
          label: isEn ? "Free shipping thresholds" : "免運費門檻是多少？",
          content: isEn
            ? "iPostal: $100 | SF Locker: $120 | Home Delivery: $300 | SF Direct: $500."
            : "智易取：$100 | 順豐站/櫃：$120 | 宅配直送：$300 | 順豐直送：$500 即可免運費。",
          action: { label: isEn ? "Shipping Policy" : "查看運費表", url: "/shipping" }
        }
      ]
    },
    {
      id: "product_info",
      label: isEn ? "Product Details & Stock" : "產品資訊與現貨",
      icon: PackageSearch,
      color: "text-orange-600",
      children: [
        {
          id: "check_details",
          label: isEn ? "Check Origin & Ingredients" : "哪裡查產地與成分？",
          content: isEn
            ? "Check the 'Specifications' and 'Facts' tabs on each product page for detailed origin and ingredient info."
            : "在任何產品頁面下方，點擊「規格參數」可看產地；點擊「成分與營養」可看詳細清單。"
        },
        {
          id: "check_stock",
          label: isEn ? "Check Stock Availability" : "如何查是否有現貨？",
          content: isEn
            ? "Real-time stock for online and branches is displayed on each product page. If it says 'In Stock', it is ready."
            : "產品頁會即時顯示「網店」及「各分店」的現貨量。顯示「有庫存」即代表有現貨。"
        },
        {
          id: "reserve_whatsapp",
          label: isEn ? "Reserve via WhatsApp?" : "可否 WhatsApp 預留？",
          content: isEn
            ? "Yes! Message us with the product name and we can manually reserve items for 3 days for in-store purchase."
            : "可以！您可以透過 WhatsApp 聯絡我們，提供產品名稱，我們可為您手動預留 3 天以便到店購買。",
          showWhatsApp: true
        }
      ]
    },
    {
      id: "account",
      label: isEn ? "Account & Membership" : "會員帳戶與登入",
      icon: UserPlus,
      color: "text-indigo-600",
      children: [
        {
          id: "register",
          label: isEn ? "How to register?" : "如何登記成為會員？",
          content: isEn
            ? "Click 'Login' in the menu, then 'Register'. You get welcome points instantly upon success!"
            : "點擊頂部「登入」，選取「建立帳號」。登記成功即獲迎新積分獎賞。",
          action: { label: isEn ? "Register Now" : "立即登記", url: "/login" }
        },
        {
          id: "forgot_pw",
          label: isEn ? "Forgot my password" : "忘記了登入密碼？",
          content: isEn
            ? "Go to 'Login' page, click 'Forgot Password?'. Enter email to receive a secure reset link."
            : "前往「登入」頁面點擊「忘記密碼？」，輸入註冊電郵即可收到 Firebase 安全重設連結。",
          action: { label: isEn ? "Reset Password" : "前往登入頁", url: "/login" }
        }
      ]
    },
    {
      id: "whatsapp",
      label: isEn ? "Still need help?" : "仍未解決？聯絡專人",
      icon: MessageSquare,
      color: "text-green-500",
      showWhatsApp: true,
      content: isEn 
        ? "Our staff is available on WhatsApp during business hours to assist with special requests."
        : "若以上解答未能幫到您，歡迎在營業時間內聯絡我們的 WhatsApp 客服專員。"
    }
  ], [isEn]);

  useEffect(() => {
    setMounted(true);
    const handleOpen = () => setOpen(true);
    window.addEventListener('open-smart-assistant', handleOpen);
    return () => window.removeEventListener('open-smart-assistant', handleOpen);
  }, []);

  const currentNode = navigationPath[navigationPath.length - 1] || null;
  const currentOptions = currentNode ? (currentNode.children || []) : FAQ_TREE;

  const navigateTo = (node: FaqNode) => {
    setNavigationPath(prev => [...prev, node]);
  };

  const goBack = () => {
    setNavigationPath(prev => prev.slice(0, -1));
  };

  const resetNav = () => {
    setNavigationPath([]);
  };

  if (!mounted || pathname?.startsWith('/admin') || pathname?.startsWith('/vendor')) return null;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <div className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-6 z-[120]">
        <SheetTrigger asChild>
          <button 
            className={cn(
              "h-14 w-14 rounded-full shadow-2xl transition-all duration-500 p-0 border-4 border-white flex items-center justify-center",
              open ? "bg-slate-900 text-white" : "bg-primary text-primary-foreground hover:scale-110"
            )}
            onClick={resetNav}
          >
            {open ? <X className="h-7 w-7" /> : <MessageSquare className="h-7 w-7" />}
          </button>
        </SheetTrigger>
      </div>

      <SheetContent 
        side="right" 
        className="w-full sm:max-w-md p-0 flex flex-col border-none shadow-2xl rounded-l-[2.5rem] z-[200] h-full"
      >
        <SheetHeader className="p-8 bg-primary text-primary-foreground shrink-0 relative overflow-hidden text-left">
          <div className="absolute top-0 right-0 p-8 opacity-10"><Info className="h-32 w-32 rotate-12" /></div>
          <div className="relative z-10 flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 shadow-inner">
              <Bot className="h-7 w-7 text-white" />
            </div>
            <div>
              <SheetTitle className="text-xl font-black text-white">{isEn ? 'Support Assistant' : '客服小助手'}</SheetTitle>
              <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mt-0.5">Quick Help Navigation</p>
            </div>
          </div>
          <SheetDescription className="sr-only">Automated Support Assistant</SheetDescription>
        </SheetHeader>

        <div className="flex-1 flex flex-col bg-slate-50/50 overflow-hidden">
          <ScrollArea className="flex-1">
            <div className="p-6 space-y-6">
              {/* Breadcrumbs */}
              {navigationPath.length > 0 && (
                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
                  <button onClick={goBack} className="p-2 bg-white rounded-xl shadow-sm border hover:bg-muted transition-colors">
                    <ArrowLeft className="h-4 w-4 text-muted-foreground" />
                  </button>
                  <div className="flex items-center text-[10px] font-black uppercase text-muted-foreground tracking-widest gap-1">
                    <span className="opacity-40">Home</span>
                    {navigationPath.map((node, i) => (
                      <React.Fragment key={node.id}>
                        <ChevronRight className="h-3 w-3 opacity-20" />
                        <span className={i === navigationPath.length - 1 ? "text-primary" : "opacity-40"}>{node.label}</span>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )}

              {/* Node Selection or Final Answer */}
              {currentNode && currentNode.content ? (
                <div className="space-y-6 animate-in zoom-in-95 duration-300">
                  <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
                    <CardContent className="p-8 space-y-6">
                      <div className="space-y-4">
                         <h3 className="text-lg font-black text-slate-900 leading-tight">{currentNode.label}</h3>
                         <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line bg-muted/20 p-6 rounded-2xl border border-dashed">
                           {currentNode.content}
                         </div>
                      </div>

                      {currentNode.action && (
                        <Button asChild className="w-full h-12 rounded-xl font-black bg-slate-900 text-white shadow-lg gap-2">
                          <Link href={currentNode.action.url} onClick={() => setOpen(false)}>
                            {currentNode.action.label} <ArrowRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      )}

                      {currentNode.showWhatsApp && (
                         <Button asChild className="w-full h-14 bg-green-600 hover:bg-green-700 text-white font-black rounded-2xl gap-3 shadow-xl animate-in slide-in-from-bottom-2">
                            <a href="https://wa.me/85253252555" target="_blank" rel="noreferrer">
                              <Smartphone className="h-5 w-5" /> WhatsApp 立即對話
                            </a>
                         </Button>
                      )}
                    </CardContent>
                  </Card>

                  <button 
                    onClick={resetNav} 
                    className="w-full h-10 rounded-xl font-bold text-muted-foreground gap-2 flex items-center justify-center hover:bg-white transition-all"
                  >
                    <RefreshCcw className="h-3.5 w-3.5" /> 返回主分類
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 animate-in fade-in duration-500">
                  {currentOptions.map((node) => (
                    <button
                      key={node.id}
                      onClick={() => navigateTo(node)}
                      className="w-full group flex items-center justify-between p-5 bg-white border-2 border-transparent rounded-[1.5rem] shadow-sm hover:border-primary/30 hover:shadow-md transition-all active:scale-[0.98]"
                    >
                      <div className="flex items-center gap-4">
                        {node.icon && (
                          <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center bg-muted/40 transition-colors group-hover:bg-primary/10", node.color)}>
                            <node.icon className="h-5 w-5" />
                          </div>
                        )}
                        <span className="font-bold text-sm text-slate-800">{node.label}</span>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-30 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                    </button>
                  ))}
                  
                  {navigationPath.length === 0 && (
                    <div className="pt-8">
                       <Link href="/faq" onClick={() => setOpen(false)} className="flex items-center justify-center p-6 border-2 border-dashed rounded-[2rem] bg-muted/10 text-muted-foreground hover:bg-white hover:border-primary/20 transition-all group">
                         <div className="text-center">
                           <p className="text-xs font-black uppercase tracking-widest mb-1 group-hover:text-primary transition-colors">查看完整常見問題頁面</p>
                           <p className="text-[10px] opacity-60">Browse full Help Center page</p>
                         </div>
                       </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </ScrollArea>

          <div className="p-8 bg-white border-t mt-auto shadow-[0_-10px_40px_rgba(0,0,0,0.05)] pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
             <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0"><ShieldCheck className="h-5 w-5" /></div>
                <div className="space-y-0.5">
                  <p className="text-[10px] font-black uppercase text-slate-900">{isEn ? "Service Guarantee" : "官方服務保證"}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight">{isEn ? "Automated assistance provides 24/7 fast support." : "自動化助手提供 24/7 全天候即時問題引導。"}</p>
                </div>
             </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
