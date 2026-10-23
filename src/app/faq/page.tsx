"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { 
  ChevronRight, 
  HelpCircle, 
  Bot,
  ArrowRight,
  Search,
  ClipboardList,
  Clock,
  Truck,
  MapPin,
  Coins,
  CreditCard,
  Package,
  Store,
  ShieldCheck,
  CheckCircle2,
  Undo2,
  Info,
  MessageCircle,
  Hash,
  ArrowLeftRight,
  ShieldAlert,
  UserPlus,
  HeartHandshake,
  Trash2,
  LayoutGrid,
  Zap,
  Gavel,
  History,
  Home,
  AlertTriangle,
  FileText,
  Lock,
  Sparkles
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { useI18n } from "@/lib/i18n/i18n-context";
import { useFirestore, useDoc } from "@/firebase";
import { doc } from "firebase/firestore";

export default function FaqPage() {
  const { t, lang } = useI18n();
  const db = useFirestore();
  const isEn = lang === 'en';
  const [searchQuery, setSearchQuery] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: loyaltyData } = useDoc<any>(db ? doc(db, 'config', 'loyalty') : null);

  const faqs = useMemo(() => {
    const spendToPoints = loyaltyData?.spendToPoints || 10;
    const pointsToCash = loyaltyData?.pointsToCash || 100;
    const referralPoints = loyaltyData?.referralRewardPoints || 500;
    const welcomePoints = loyaltyData?.welcomePoints || 100;

    const data = [
      // --- 1. 訂單與發貨 (Orders & Delivery) ---
      {
        q_zh: "如果付款失敗，或沒有跳轉到訂購成功頁面，該怎麼辦？",
        a_zh: "當您提交訂單的一刻，系統已經為您預留了庫存。請嘗試以下步驟：\n\n1. 點擊頁面頂部的「我的帳戶 > 訂單記錄」。\n2. 找到該筆顯示為「未付款」的訂單並點擊「查看詳情」。\n3. 您會看到「立即付款」按鈕，點擊即可重新嘗試支付。\n4. 若使用手動轉帳，請直接聯絡我們的 WhatsApp 並提供單號，我們會手動核實。",
        category_zh: "訂單與發貨",
        q_en: "What if my payment fails or the page doesn't redirect to success?",
        a_en: "Items are reserved the moment you submit. Steps:\n\n1. Go to 'My Account > Orders'.\n2. Find the 'Unpaid' order and click 'View Details'.\n3. Click 'Pay Now' to retry.\n4. For manual transfers, contact WhatsApp with your Order ID for manual verification.",
        category_en: "Orders & Delivery"
      },
      {
        q_zh: "下單後大概幾耐會發貨？",
        a_zh: "一般情況下，在確認付款後的 1-2 個工作天內，我們會完成配貨並寄出。如遇大型促銷活動或公眾假期，處理時間可能延長至 3 個工作天。發貨後，您將會收到包含追蹤號碼的電郵通知。",
        category_zh: "訂單與發貨",
        q_en: "How long does it take to ship my order?",
        a_en: "Normally, we process and ship orders within 1-2 business days after payment verification. During mega sales or holidays, it may take up to 3 business days. You will receive an email with tracking details once dispatched.",
        category_en: "Orders & Delivery"
      },
      {
        q_zh: "選取「門市自取」可以到店才付款嗎？",
        a_zh: "可以。在結帳頁面選擇「門市自取」作為運送方式後，您可以在付款方式選取「到店付款」。系統會為您保留貨品 3 個工作天，請於收到「貨品已備妥」的通知後親臨屯門分店，以現金、八達通或電子支付結帳。",
        category_zh: "訂單與發貨",
        q_en: "Can I pay in-store for pickup orders?",
        a_en: "Yes. Choose 'In-store Pickup' and select 'Pay in Store' at checkout. We will reserve your items for 3 business days. You can pay via Cash, Octopus, or E-payments when you visit our Tuen Mun branch after receiving the readiness notification.",
        category_en: "Orders & Delivery"
      },

      // --- 2. 支付與財務 (Payment & Finance) ---
      {
        q_zh: "你們支援哪些付款方式？",
        a_zh: "我們提供多元化的支付選擇：\n\n1. 線上即時：支援 Visa、Mastercard、AlipayHK 及 WeChat Pay。\n2. 手動轉帳：支援 轉數快 (FPS)、PayMe、八達通 (Octopus) 以及 銀行轉帳 (HSBC)。\n3. 到店付款：若選取門市自取，取貨時可現場支付（支援現金及電子支付）。",
        category_zh: "支付與財務",
        q_en: "What payment methods do you support?",
        a_en: "We offer multiple options:\n\n1. Online: Visa, Mastercard, AlipayHK, and WeChat Pay.\n2. Manual: FPS, PayMe, Octopus, and Bank Transfer (HSBC).\n3. In-store: Pay at counter (Cash/E-payment) during pickup.",
        category_en: "Payment & Finance"
      },

      // --- 3. 會員與帳戶 (Member & Account) ---
      {
        q_zh: "購買後，積分大概幾耐會存入我的帳戶？",
        a_zh: "為了防止因退貨導致的積分誤差，系統會在訂單狀態更新為「已送達 (Delivered)」或「已取貨 (Picked up)」後的 24 小時內，自動將積分存入您的會員帳戶。您可以在「個人中心 > 積分明細」中查看記錄。",
        category_zh: "會員與帳戶",
        q_en: "How long until points are credited after purchase?",
        a_en: "Points are automatically credited to your account within 24 hours after the order status changes to 'Delivered' or 'Picked up'. You can check the history in 'My Account > Points History'.",
        category_en: "Member & Account"
      },
      {
        q_zh: "關於會員積分與好友邀請獎賞？",
        a_zh: `1. 購物賺取：每消費 HK$${spendToPoints} 即可獲得 1 積分。\n2. 迎新禮遇：新會員註冊即送 ${welcomePoints} 積分。\n3. 積分抵扣：滿 ${pointsToCash} 積分可抵扣 HK$1 現金。\n4. 好友邀請：分享您的邀請碼。好友完成首單後，您可獲 ${referralPoints} 積分，好友亦有額外獎賞。`,
        category_zh: "會員與帳戶",
        q_en: "How does the loyalty and referral program work?",
        a_en: `1. Earn: 1 pt for every HK$${spendToPoints} spent.\n2. Welcome: Get ${welcomePoints} pts upon registration.\n3. Redeem: ${pointsToCash} pts = HK$1 discount.\n4. Referral: Share your code. Earn ${referralPoints} pts when a friend completes their first order.`,
        category_en: "Member & Account"
      },

      // --- 4. 產品與小知識 (Product & Insights) ---
      {
        q_zh: "在哪裡查看產品的原產地、成分及到期日？",
        a_zh: "在任何產品的詳情頁面：\n\n1. 原產地與到期日：通常顯示在價格下方的「規格參數」分頁中。\n2. 成分：請點擊產品下方的「成分與營養」分頁，即可查閱詳細的成分表及過敏原提示。",
        category_zh: "產品與小知識",
        q_en: "Where to see origin, ingredients, and expiry?",
        a_en: "On any product page:\n\n1. Origin & Expiry: Listed under the 'Specifications' tab below the price.\n2. Ingredients: Click the 'Facts & Nutrition' tab to see full ingredients and allergen warnings.",
        category_en: "Product & Insights"
      },
      {
        q_zh: "如何確認產品是否有現貨？可以預留嗎？",
        a_zh: "1. 即時庫存：產品頁會顯示「線上總庫存」以及各門市的即時存量。顯示為「有庫存」即代表現貨供應。\n2. 預留服務：如果您希望親臨門市購買但擔心缺貨，可以點擊右下角聯繫我們的 WhatsApp 客服，提供產品名稱，我們會為您手動預留 3 個工作天。",
        category_zh: "產品與小知識",
        q_en: "How to check stock? Can I reserve items?",
        a_en: "1. Live Stock: The product page shows both online and branch stock levels. 'In Stock' means available for immediate purchase.\n2. Reservation: If you wish to buy in-store, contact our WhatsApp support to reserve items for 3 business days to ensure availability.",
        category_en: "Product & Insights"
      }
    ];

    return data.filter((f) => {
      const q = searchQuery.toLowerCase().trim();
      const question = (isEn ? f.q_en : f.q_zh) || "";
      const answer = (isEn ? f.a_en : f.a_zh) || "";
      return !q || question.toLowerCase().includes(q) || answer.toLowerCase().includes(q);
    });
  }, [searchQuery, isEn, loyaltyData, t]);

  const groupedFaqs = useMemo(() => {
    const groups: Record<string, any[]> = {};
    faqs.forEach((f) => {
      const cat = isEn ? f.category_en : f.category_zh;
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(f);
    });
    return Object.entries(groups).map(([name, questions]) => ({ name, questions }));
  }, [faqs, isEn]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow">
        <section className="bg-primary/10 py-12 md:py-24 border-b text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-5"><HelpCircle className="h-64 w-64" /></div>
          <div className="container mx-auto px-4 relative z-10">
            <h1 className="text-4xl md:text-6xl font-black font-headline tracking-tighter mb-4">
              {isEn ? "Help Center" : "幫助中心"}
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto font-medium">
              這裡為您準備了最詳盡的解答，從帳戶操作、訂單處理到產品知識，助您安心購物。
            </p>
          </div>
        </section>

        <div className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-8 space-y-12">
              <div className="relative mb-10">
                <Search className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
                <Input 
                  placeholder={isEn ? "Search topics (e.g. login, shipping, receipt)..." : "搜尋問題關鍵字 (如：登入、付款、取貨、收據)..."}
                  className="pl-12 h-14 bg-white rounded-2xl shadow-sm border-muted-foreground/20 text-lg"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="space-y-16">
                {groupedFaqs.length === 0 ? (
                  <div className="py-20 text-center border-4 border-dashed rounded-[3rem] bg-white space-y-4">
                    <Search className="h-12 w-12 text-muted-foreground/20 mx-auto" />
                    <p className="text-muted-foreground font-bold italic">找不到與「{searchQuery}」相關的問題。</p>
                    <Button variant="ghost" onClick={() => setSearchQuery("")} className="text-primary font-black uppercase text-xs">顯示所有問題</Button>
                  </div>
                ) : groupedFaqs.map((group, idx) => (
                  <div key={idx} className="space-y-6">
                    <div className="flex items-center gap-3 px-2">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        {group.name.includes('訂單') || group.name.includes('Order') ? <Package className="h-4 w-4" /> : 
                         group.name.includes('支付') || group.name.includes('Payment') ? <CreditCard className="h-4 w-4" /> :
                         group.name.includes('帳戶') || group.name.includes('Member') ? <UserPlus className="h-4 w-4" /> :
                         <Info className="h-4 w-4" />}
                      </div>
                      <h3 className="font-black uppercase tracking-widest text-sm text-slate-900">{group.name}</h3>
                    </div>
                    <Accordion type="single" collapsible className="w-full space-y-3">
                      {group.questions.map((item: any, qIdx: number) => (
                        <AccordionItem key={qIdx} value={`item-${idx}-${qIdx}`} className="border-none">
                          <AccordionTrigger className="text-left font-black text-sm md:text-base p-5 bg-white rounded-2xl border shadow-sm hover:no-underline hover:bg-slate-50 transition-all">
                            {isEn ? item.q_en : item.q_zh}
                          </AccordionTrigger>
                          <AccordionContent className="p-6 text-muted-foreground bg-white rounded-b-2xl border-x border-b -mt-2 shadow-inner leading-relaxed whitespace-pre-line text-sm md:text-base">
                            {isEn ? item.a_en : item.a_zh}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-4">
              <div className="space-y-6 sticky top-28">
                <Card className="border-none shadow-2xl bg-slate-900 text-white rounded-[3rem] overflow-hidden">
                  <CardHeader className="p-10 pb-0">
                    <div className="h-16 w-16 rounded-3xl bg-primary/20 flex items-center justify-center text-primary mb-6 border border-primary/20">
                      <Bot className="h-10 w-10" />
                    </div>
                    <CardTitle className="text-3xl font-black font-headline tracking-tight">尋找專人協助？</CardTitle>
                    <CardDescription className="text-slate-400 text-lg font-medium leading-relaxed mt-2">
                      如果 FAQ 仍未能解決您的疑問，隨時聯絡我們的客服團隊。
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-10 space-y-4">
                    <Button 
                      asChild
                      className="w-full h-16 bg-green-600 text-white font-black text-xl rounded-2xl shadow-xl hover:bg-green-700 transition-all gap-3"
                    >
                      <a href="https://wa.me/85253252555" target="_blank" rel="noreferrer">
                        <MessageCircle className="h-6 w-6" /> WhatsApp 立即聯絡
                      </a>
                    </Button>
                    <Button 
                      onClick={() => window.dispatchEvent(new CustomEvent('open-smart-assistant'))} 
                      variant="ghost"
                      className="w-full h-12 text-slate-400 font-bold hover:text-white hover:bg-white/10"
                    >
                      開啟客服助手選單 <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 gap-4">
                  <Card className="border-none shadow-sm bg-blue-50 rounded-[2rem] p-6 flex items-center gap-4">
                    <ShieldCheck className="h-8 w-8 text-blue-600 shrink-0" />
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-black uppercase text-blue-900 tracking-widest">SSL 安全支付</p>
                      <p className="text-[10px] text-blue-700">業界標準加密保障交易安全</p>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
