"use client";

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useI18n } from "@/lib/i18n/i18n-context";
import { 
  ChevronRight, 
  RefreshCcw, 
  ShieldCheck, 
  HelpCircle, 
  Package, 
  Truck, 
  AlertCircle, 
  CheckCircle2, 
  XCircle,
  Coins,
  Clock,
  ArrowRight,
  UserCheck,
  MapPin,
  ArrowLeftRight,
  Info,
  AlertTriangle,
  Store
} from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function ReturnsPolicyPage() {
  const { t, lang } = useI18n();
  const isEn = lang === 'en';

  /**
   * @fileOverview 針對 Google Merchant Center 的結構化數據 (JSON-LD) - GMC 2024 高權重版本
   * 修正說明：
   * 1. 使用 FiniteReturnWindow 類別，確保「退貨期限」被正確讀取。
   * 2. 明確標註 returnFees 為 CustomerPaying，並將 restockingFee 設為 0。
   * 3. 強制關聯 returnPolicyCountry 為 HK。
   */
  const jsonLd = {
    "@context": "https://schema.org/",
    "@type": "MerchantReturnPolicy",
    "name": "SHOP POINT Standard Return Policy",
    "url": "https://shoppoint.hk/returns",
    "returnPolicyCountry": "HK",
    "applicableCountry": "HK",
    "returnPolicyCategory": "https://schema.org/MerchantReturnPolicyFiniteReturnWindow",
    "merchantReturnDays": 7,
    "returnMethod": [
      "https://schema.org/ReturnByMail",
      "https://schema.org/ReturnInStore"
    ],
    "returnFees": "https://schema.org/ReturnFeesCustomerPaying",
    "returnLabelSource": "https://schema.org/ReturnLabelCustomerResponsibility",
    "restockingFee": {
      "@type": "MonetaryAmount",
      "value": "0",
      "currency": "HKD"
    },
    "itemCondition": "https://schema.org/NewCondition"
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      {/* 結構化數據注入 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="flex-grow pb-20">
        {/* Hero Section */}
        <section className="bg-primary/10 py-12 md:py-20 border-b">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4 uppercase tracking-widest font-bold">
              <Link href="/" className="hover:text-primary transition-colors">{t.nav.home}</Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground font-medium">{t.legal.returns}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black font-headline tracking-tighter text-foreground">
              {t.legal.returns}
            </h1>
            <div className="mt-6 max-w-3xl space-y-4">
              <p className="text-muted-foreground text-lg font-medium leading-relaxed">
                {isEn 
                  ? "Transparent and fair procedures for returns and exchanges to ensure your shopping confidence. We support both Mail-in and In-store returns." 
                  : "透明、公平的退換貨流程，保障您的購物信心。我們支援「快遞寄回」或「親臨門市」辦理退換。"}
              </p>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto space-y-12">
            
            {/* Compliance Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-none shadow-sm bg-green-50 border-l-4 border-green-500 rounded-2xl">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-green-700 font-bold mb-2">
                    <Clock className="h-5 w-5" /> {isEn ? "7-Day Window" : "7 天退換期"}
                  </div>
                  <p className="text-xs text-green-800 leading-relaxed font-bold">
                    {isEn ? "Request within 7 days of delivery." : "請於貨品送達後 7 天內提出申請。"}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm bg-blue-50 border-l-4 border-blue-500 rounded-2xl">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-blue-700 font-bold mb-2">
                    <Coins className="h-5 w-5" /> {isEn ? "No Restocking Fees" : "無額外手續費"}
                  </div>
                  <p className="text-xs text-blue-800 leading-relaxed font-bold">
                    {isEn ? "No restocking fees ($0) for all returns." : "退貨不收取任何重新上架費 (HK$0)。"}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-none shadow-sm bg-orange-50 border-l-4 border-orange-500 rounded-2xl">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 text-orange-700 font-bold mb-2">
                    <Store className="h-5 w-5" /> {isEn ? "In-Store Support" : "支援門市退換"}
                  </div>
                  <p className="text-xs text-orange-800 leading-relaxed font-bold">
                    {isEn ? "Support in-person return at our branch." : "閣下可預約親臨屯門分店辦理。"}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Return Address & In-Store Option */}
            <Card className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden border-2 border-primary/20">
              <CardHeader className="bg-primary/5 p-8 border-b">
                <CardTitle className="text-lg font-black flex items-center gap-3">
                  <MapPin className="h-5 w-5 text-primary" />
                  {isEn ? "Where to Return" : "退貨及寄回地址"}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                <div className="flex flex-col md:flex-row gap-8 items-start">
                  <div className="flex-1 space-y-4">
                    <div className="flex gap-2 mb-2">
                      <Badge className="bg-primary text-primary-foreground font-black text-[9px] px-2 h-5">郵寄寄回</Badge>
                      <Badge className="bg-indigo-600 text-white border-none font-black text-[9px] px-2 h-5 uppercase">In-person Support</Badge>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Recipient 收件人 / Location</p>
                      <p className="font-bold text-lg">SHOP POINT (Returns Dept.)</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Address 地址</p>
                      <p className="font-bold leading-relaxed text-slate-800">
                        {isEn 
                          ? "B17, Basement, U-Town Shopping Arcade, 3 Tsing Ling Path, Tuen Mun, New Territories, Hong Kong"
                          : "香港新界屯門青菱徑3號時尚電腦城地庫B17號舖"}
                      </p>
                    </div>
                  </div>
                  <div className="p-5 bg-blue-50 rounded-2xl border border-blue-100 flex flex-col gap-3 w-full md:w-72 shadow-inner">
                    <div className="flex items-start gap-2">
                      <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                      <p className="text-[11px] text-blue-800 leading-relaxed font-bold">
                        {isEn 
                          ? "In-person returns require a 24-hour advance appointment via WhatsApp." 
                          : "如需親臨門市辦理，請提前 24 小時透過 WhatsApp 預約以便安排。"}
                      </p>
                    </div>
                    <Separator className="bg-blue-200" />
                    <p className="text-[11px] text-blue-700 leading-relaxed">
                      {isEn 
                        ? "For mail-in, please include your Order ID clearly on the package." 
                        : "快遞寄回請在包裹外清楚標註訂單編號。"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Terms */}
            <div className="space-y-16">
              
              {/* Section 1: Conditions */}
              <section className="space-y-6">
                <h2 className="text-2xl font-black flex items-center gap-3">
                  <span className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-sm text-primary-foreground font-black">1</span>
                  {isEn ? "Return & Exchange Conditions" : "退換貨條件"}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 ml-0 md:ml-11">
                  <div className="space-y-4">
                    <h4 className="font-bold flex items-center gap-2 text-green-600"><CheckCircle2 className="h-4 w-4" /> {isEn ? "Acceptable" : "受理情況"}</h4>
                    <ul className="text-sm text-muted-foreground space-y-3">
                      <li className="flex items-start gap-2">• {isEn ? "Defective or damaged items upon arrival." : "送達時發現損壞或瑕疵。"}</li>
                      <li className="flex items-start gap-2">• {isEn ? "Incorrect items sent (wrong size, color, or model)." : "寄錯商品（尺寸、顏色或型號不符）。"}</li>
                      <li className="flex items-start gap-2">• {isEn ? "Change of mind (within 7 days, unopened & resaleable)." : "個人原因退貨（需於 7 天內且未拆封）。"}</li>
                    </ul>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-bold flex items-center gap-2 text-red-500"><XCircle className="h-4 w-4" /> {isEn ? "Non-Returnable" : "不受理情況"}</h4>
                    <ul className="text-sm text-muted-foreground space-y-3">
                      <li className="flex items-start gap-2">• {isEn ? "Personal hygiene items (Skincare once opened)." : "個人衛生用品（已開封護膚品等）。"}</li>
                      <li className="flex items-start gap-2">• {isEn ? "Food, beverages, and perishable goods." : "食品、飲品及易腐壞貨品。"}</li>
                      <li className="flex items-start gap-2">• {isEn ? "Items marked as 'Clearance' or 'Final Sale'." : "標註為「清貨」或「不設退換」之產品。"}</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Section 2: Exchange Policy */}
              <section className="space-y-6">
                <h2 className="text-2xl font-black flex items-center gap-3">
                  <span className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-sm text-primary-foreground font-black">2</span>
                  {isEn ? "Exchange Policy" : "換貨政策"}
                </h2>
                <Card className="ml-0 md:ml-11 border-none shadow-sm bg-blue-50/50 rounded-3xl overflow-hidden border">
                  <CardContent className="p-8 space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600"><ArrowLeftRight className="h-5 w-5" /></div>
                      <h4 className="text-lg font-bold">{isEn ? "Item Replacement" : "同款商品更換"}</h4>
                    </div>
                    <p className="text-sm leading-relaxed text-slate-700">
                      {isEn 
                        ? "If you received a faulty item, we will arrange a replacement of the same model. If the item is out of stock, you may choose another product of equal value or request a full refund." 
                        : "若您收到瑕疵商品，我們將為您更換同款新品。如該商品已斷貨，您可以選擇更換同等價值的其他商品，或申請全額退款。"}
                    </p>
                  </CardContent>
                </Card>
              </section>

              {/* Section 3: Process */}
              <section className="space-y-6">
                <h2 className="text-2xl font-black flex items-center gap-3">
                  <span className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-sm text-primary-foreground font-black">3</span>
                  {isEn ? "How to Apply (Step-by-Step)" : "退換貨申請流程"}
                </h2>
                <div className="relative ml-0 md:ml-11 space-y-10 before:absolute before:inset-0 before:ml-4 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-primary before:to-muted">
                  {[
                    { 
                      title: isEn ? "Submit Request Online" : "1. 線上提交申請", 
                      desc: isEn ? "Login to 'My Account > Orders', select the relevant order and click 'Request Return'." : "登入「我的帳戶 > 訂單記錄」，選取對應訂單並點擊「申請退換貨」。"
                    },
                    { 
                      title: isEn ? "Wait for Review" : "2. 等待團隊審核", 
                      desc: isEn ? "Our after-sales team will review your application within 48 hours." : "我們的售後團隊將在 48 小時內審核您的申請。"
                    },
                    { 
                      title: isEn ? "Return Items" : "3. 寄回或交回商品", 
                      desc: isEn ? "Once approved, ship back to our center or visit our Tuen Mun branch (Appointment required)." : "獲得批准後，請將商品寄回我們位於屯門的中心，或預約親臨分店交回。"
                    },
                    { 
                      title: isEn ? "Refund" : "4. 核實與退款", 
                      desc: isEn ? "We will issue a refund within 10 business days after inspection." : "核實狀況後，我們將在 10 個工作天內安排退款。"
                    }
                  ].map((step, i) => (
                    <div key={i} className="relative flex items-start">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white border-2 border-primary z-10 shrink-0 shadow-sm">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                      </div>
                      <div className="ml-6">
                        <h4 className="font-bold text-base text-slate-900 leading-none">{step.title}</h4>
                        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            <Separator className="my-12" />

            {/* Help Callout */}
            <div className="text-center space-y-6 bg-muted/30 p-10 rounded-[3rem] border border-dashed border-primary/20">
              <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                <HelpCircle className="h-8 w-8 text-primary" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">{isEn ? "Questions about Returns?" : "對退換貨有任何疑問？"}</h3>
                <p className="text-sm text-muted-foreground">
                  我們的客服團隊隨時準備協助您處理任何特別個案。
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button asChild className="rounded-full px-8 bg-primary font-bold shadow-lg">
                  <Link href="/contact">{t.contact.title}</Link>
                </Button>
                <Button asChild variant="outline" className="rounded-full px-8 gap-2">
                  <Link href="/faq">{isEn ? "Visit FAQ" : "查看常見問題"} <ArrowRight className="h-4 w-4" /></Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
