
"use client";

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useI18n } from "@/lib/i18n/i18n-context";
import { 
  ChevronRight, 
  CreditCard, 
  Landmark, 
  Smartphone, 
  Wallet, 
  ShieldCheck, 
  CheckCircle2,
  Info,
  Clock,
  ArrowRight,
  Monitor,
  Store,
  ExternalLink,
  QrCode,
  Zap,
  MapPin
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export default function PaymentMethodsPage() {
  const { t, lang } = useI18n();
  const isEn = lang === 'en';

  const paymeLink = "https://qr.payme.hsbc.com.hk/2/Q2mSXNpZxZR4o7Nrrv4ExK";
  const yedpayLink = "https://api.yedpay.com/online-payment/precreate/2NMJVPOM96Q9Z70RL8";
  const octopusLink = "https://app.octopus.com.hk/qrpayment?token=OEM03052469104013120334449046C5B";

  const paymentData = [
    {
      id: "online",
      title: isEn ? "Online Instant Payment" : "線上即時支付",
      desc: isEn ? "Fast, secure, and automatic order confirmation." : "安全、快速，支付後系統將自動確認訂單並安排發貨。",
      methods: [
        { name: isEn ? "Credit Card (Visa / Master)" : "信用卡 (Visa / Master)", icon: CreditCard, tags: ["Instant"] },
        { name: isEn ? "AlipayHK / WeChat Pay" : "支付寶（香港）／微訊支付", icon: Wallet, tags: ["Instant"] },
        { name: "Apple Pay / Google Pay", icon: Smartphone, tags: ["Mobile"] },
      ]
    },
    {
      id: "manual",
      title: isEn ? "Bank Transfer / FPS" : "銀行轉帳 ／ 轉數快 (FPS)",
      desc: isEn ? "Requires verification by our staff (1-2 business days)." : "需由人手核實款項，通常於 1-2 個工作天內完成核對。",
      methods: [
        { name: "FPS (轉數快)", icon: Smartphone, tags: ["ID: 161931316"] },
        { name: isEn ? "Bank Transfer (HSBC)" : "銀行轉帳（匯豐銀行）", icon: Landmark, tags: ["747-157782-838"] },
      ]
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow pb-20">
        {/* Hero Section */}
        <section className="bg-primary/10 py-12 md:py-20 border-b">
          <div className="container mx-auto px-4 text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-4 uppercase tracking-widest font-bold">
              <Link href="/" className="hover:text-primary transition-colors">{t.nav.home}</Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground font-medium">{isEn ? 'Payment Methods' : '付款方式'}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black font-headline tracking-tighter">
              {isEn ? 'Supported Payment Methods' : '支援的付款方式'}
            </h1>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto font-medium">
              {isEn 
                ? "We offer a wide range of secure payment options to make your shopping experience seamless." 
                : "我們提供多種安全可靠的支付方式，讓您的購物流程更順暢、更安心。"}
            </p>
          </div>
        </section>

        <section className="container mx-auto px-4 py-16">
          <div className="max-w-5xl mx-auto space-y-12">
            
            {/* Safety Banner */}
            <div className="p-6 bg-blue-50 rounded-[2rem] border-2 border-blue-100 flex flex-col md:flex-row items-center gap-6 shadow-sm">
              <div className="h-14 w-14 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h4 className="font-black text-blue-900 uppercase tracking-wider text-sm mb-1">{isEn ? 'Secure Checkout' : '安全結帳保障'}</h4>
                <p className="text-sm text-blue-800 leading-relaxed">
                  {isEn 
                    ? "All online transactions are encrypted via SSL technology. We do not store your full credit card details." 
                    : "所有線上交易均透過 SSL 技術加密處理。我們不會儲存您的完整信用卡資料。"}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {paymentData.map((group) => (
                <Card key={group.id} className="border-none shadow-xl bg-white rounded-[2.5rem] overflow-hidden group hover:shadow-2xl transition-all duration-500 border border-muted">
                  <CardHeader className={cn(
                    "p-8 border-b",
                    group.id === 'online' ? "bg-primary/5" : "bg-muted/30"
                  )}>
                    <CardTitle className="text-2xl font-black font-headline tracking-tight">{group.title}</CardTitle>
                    <CardDescription className="text-sm leading-relaxed mt-2">{group.desc}</CardDescription>
                  </CardHeader>
                  <CardContent className="p-8 space-y-6">
                    <div className="space-y-6">
                      {group.methods.map((m, i) => (
                        <div key={i} className="space-y-2">
                          <div className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl border border-transparent hover:border-primary/20 hover:bg-white transition-all">
                            <div className="flex items-center gap-4">
                              <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-primary shadow-sm"><m.icon className="h-5 w-5" /></div>
                              <span className="font-bold text-sm">{m.name}</span>
                            </div>
                            <div className="flex gap-1">
                              {m.tags.map(t => (
                                <Badge 
                                  key={t} 
                                  variant="outline" 
                                  className={cn(
                                    "text-[10px] font-black uppercase bg-white", 
                                    (t.includes('ID') || t.includes('-')) ? "text-[#5D4037] text-base px-3 h-8 flex items-center" : ""
                                  )}
                                >
                                  {t}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    {group.id === 'manual' && (
                      <div className="p-4 bg-primary/5 rounded-xl border border-dashed border-primary/20 mt-4">
                        <p className="text-xs text-muted-foreground leading-relaxed italic">
                          {isEn 
                            ? "Transfer via Online Banking or ATM. Please save the receipt and send it along with your Order ID to us for confirmation."
                            : "於網上銀行轉入 FPS ID / 銀行號碼 或自動櫃員機進行轉帳。完成轉帳後，請記得儲存付款記錄，並將資料傳送（轉帳記錄及訂單號碼）給我們確認。"}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quick Scan Payments Section */}
            <section className="space-y-8 pt-8">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg">
                  <QrCode className="h-5 w-5" />
                </div>
                <h2 className="text-2xl font-black font-headline uppercase tracking-tight">{isEn ? "Direct Scan / Link Payments" : "掃碼與連結即時支付"}</h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* PayMe */}
                <Card className="border-none shadow-lg rounded-3xl bg-white overflow-hidden border flex flex-col">
                  <div className="bg-[#ff0000] p-4 text-white text-center font-black text-xs uppercase tracking-widest">PayMe by HSBC</div>
                  <CardContent className="p-6 text-center space-y-4 flex-1">
                    <div className="relative aspect-square w-32 mx-auto border-2 border-dashed rounded-2xl p-2 bg-muted/10">
                      <Image src="/payme-qr.png" alt="PayMe QR" fill className="object-contain p-1" />
                    </div>
                    <div className="text-[10px] text-left text-muted-foreground bg-muted/20 p-3 rounded-lg space-y-1">
                      <p className="font-bold text-foreground">付款步驟：</p>
                      <p>1. 打開 PayMe 手機應用程式</p>
                      <p>2. 按「向商店付款」內的一掃即付</p>
                      <p>3. 掃描此 QR PayMe 二維碼</p>
                      <p>4. 輸入銀碼後按確定</p>
                    </div>
                    <Separator />
                    <Button asChild size="sm" className="w-full bg-[#ff0000] hover:bg-[#e60000] text-white font-bold rounded-xl h-11">
                      <a href={paymeLink} target="_blank" rel="noreferrer">點擊進入 PayMe 付款</a>
                    </Button>
                    <p className="text-[9px] text-muted-foreground italic">手機按「點擊進入 PayMe 付款」便會直接打開 PayMe App 並輸入銀碼及確認便可完成付款。</p>
                  </CardContent>
                </Card>

                {/* Yedpay */}
                <Card className="border-none shadow-lg rounded-3xl bg-white overflow-hidden border flex flex-col">
                  <div className="bg-primary p-4 text-primary-foreground text-center font-black text-xs uppercase tracking-widest">信用卡／支付寶（香港）／微訊支付</div>
                  <CardContent className="p-6 text-center space-y-4 flex-1">
                    <div className="relative aspect-square w-32 mx-auto border-2 border-dashed rounded-2xl p-2 bg-muted/10">
                      <Image src="/yedpay-qr.png" alt="Yedpay QR" fill className="object-contain p-1" />
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {isEn 
                        ? "We support Visa, Mastercard, AlipayHK and WeChat Pay. Scan the QR Code or click the button below to pay."
                        : "支援 Visa, Mastercard, 支付寶 (香港) 及微訊支付。掃描以下 QR Code 或 按「點擊進入付款」進行付款。"}
                    </p>
                    <Separator />
                    <Button asChild size="sm" className="w-full bg-primary text-primary-foreground font-bold rounded-xl h-11">
                      <a href={yedpayLink} target="_blank" rel="noreferrer">點擊進入付款</a>
                    </Button>
                  </CardContent>
                </Card>

                {/* Octopus */}
                <Card className="border-none shadow-lg rounded-3xl bg-white overflow-hidden border flex flex-col">
                  <div className="bg-[#f07c00] p-4 text-white text-center font-black text-xs uppercase tracking-widest">Octopus 八達通</div>
                  <CardContent className="p-6 text-center space-y-4 flex-1">
                    <div className="relative aspect-square w-32 mx-auto border-2 border-dashed rounded-2xl p-2 bg-muted/10">
                      <Image src="/octopus-qr.png" alt="Octopus QR" fill className="object-contain p-1" />
                    </div>
                    <div className="text-[10px] text-left text-muted-foreground bg-muted/20 p-3 rounded-lg space-y-1">
                      <p className="font-bold text-foreground">付款步驟：</p>
                      <p>1. 打開 八達通 手機應用程式</p>
                      <p>2. 按右上角的「掃描二維碼」</p>
                      <p>3. 掃描此 QR 二維碼並輸入銀碼</p>
                      <p>4. 拍八達通在手機 NPC 天線位置（需於手機打開 NPC 功能）或 選擇八達通錢包內扣款 即可完成</p>
                    </div>
                    <Separator />
                    <Button asChild size="sm" className="w-full bg-[#f07c00] hover:bg-[#d47600] text-white font-bold rounded-xl h-11">
                      <a href={octopusLink} target="_blank" rel="noreferrer">點擊進入八達通付款</a>
                    </Button>
                    <p className="text-[9px] text-muted-foreground italic">手機按「點擊進入八達通付款」便會直接打開八達通 App 並輸入銀碼及確認便可完成付款。</p>
                  </CardContent>
                </Card>
              </div>
            </section>

            <Separator className="my-16" />

            {/* In-Store Section */}
            <div className="bg-muted/30 p-10 rounded-[3rem] border-2 border-dashed border-muted-foreground/20 text-center space-y-8">
              <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-md">
                <Store className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-4">
                <h3 className="text-2xl font-black font-headline">{isEn ? 'Pay In-Store (Self Pickup)' : '到店付款 (只限門市自取)'}</h3>
                <div className="max-w-md mx-auto bg-white p-6 rounded-2xl shadow-sm space-y-4 text-left">
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-xs font-black text-muted-foreground uppercase">店舖地址 Address</p>
                      <p className="text-sm font-bold">香港新界屯門青菱徑 3 號時尚電腦城地庫 B17</p>
                      <p className="text-xs text-muted-foreground mt-1">B17, Basement, U-Town Shopping Arcade, 3 Tsing Ling Path, Tuen Mun, NT</p>
                    </div>
                  </div>
                  <Separator className="border-dashed" />
                  <div className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-xs font-black text-muted-foreground uppercase">營業時間 Hours</p>
                      <p className="text-sm font-bold">週一至週六 12:00 - 19:00</p>
                      <p className="text-xs text-muted-foreground">公眾假期及週日休息 (Except Public Holidays & Sundays)</p>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground max-w-2xl mx-auto leading-relaxed pt-4">
                  {isEn 
                    ? "If you select In-Store Pickup, you can choose to pay at our physical branches via Octopus, Cash, or Credit Card. Items will be reserved for 3 business days." 
                    : "若您選擇「門市自取」，您可以在分店現場透過八達通、現金或信用卡付款。我們將為您保留貨品 3 個工作天。"}
                </p>
              </div>
            </div>

          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
