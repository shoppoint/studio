"use client";

import Image from "next/image";
import Link from "next/link";
import { 
  ChevronRight, 
  Globe, 
  Sparkles, 
  HeartHandshake,
  Activity,
  FileCheck,
  Loader2,
  TrendingUp,
  Heart,
  Award,
  Zap,
  Quote,
  ArrowRight,
  Star,
  ExternalLink,
  MessageCircle,
  MapPin,
  Clock,
  ArrowUp
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/i18n-context";
import { useFirestore, useDoc } from "@/firebase";
import { doc } from "firebase/firestore";
import { useMemo } from "react";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

export default function AboutUsPage() {
  const { t, lang } = useI18n();
  const db = useFirestore();
  const isEn = lang === 'en';

  const impactConfigRef = useMemo(() => {
    if (!db) return null;
    return doc(db, 'config', 'impact');
  }, [db]);
  const { data: impactData, loading: impactLoading } = useDoc<any>(impactConfigRef);

  const images = {
    story: "https://picsum.photos/seed/about-story/1200/900",
    trust: PlaceHolderImages.find(i => i.id === 'about-trust')?.imageUrl || "",
    sourcing: PlaceHolderImages.find(i => i.id === 'about-sourcing')?.imageUrl || ""
  };

  const quarterlyData = useMemo(() => {
    if (!impactData?.records) return { total: 0, name: "" };
    const now = new Date(); const year = now.getFullYear(); const month = now.getMonth();
    let start: Date, end: Date, qName: string;
    if (month <= 2) { start = new Date(year, 0, 1); end = new Date(year, 2, 31, 23, 59, 59); qName = lang === 'en' ? "Q1 (Jan - Mar)" : "第一季度 (1月-3月)"; }
    else if (month <= 5) { start = new Date(year, 3, 1); end = new Date(year, 5, 30, 23, 59, 59); qName = lang === 'en' ? "Q2 (Apr - Jun)" : "第二季度 (4月-6月)"; }
    else if (month <= 8) { start = new Date(year, 6, 1); end = new Date(year, 8, 30, 23, 59, 59); qName = lang === 'en' ? "Q3 (Jul - Sep)" : "第三季度 (7月-9月)"; }
    else { start = new Date(year, 9, 1); end = new Date(year, 11, 31, 23, 59, 59); qName = lang === 'en' ? "Q4 (Oct - Dec)" : "第四季度 (10月-12月)"; }
    const total = impactData.records.reduce((acc: number, rec: any) => { const recDate = new Date(rec.date); if (recDate >= start && recDate <= end) { return acc + (Number(rec.amount) || 0); } return acc; }, 0);
    return { total, name: qName };
  }, [impactData, lang]);

  const testimonials = [
    {
      name: isEn ? "Ms. Chan" : "陳小姐",
      initial: "C",
      content: isEn 
        ? "The product quality is excellent, you can see the owner's care in sourcing. Shipping was very fast!"
        : "貨品品質非常好，看得出店主的用心搜羅，發貨也很快！",
      date: "1 week ago",
      color: "bg-blue-100 text-blue-600"
    },
    {
      name: "Alex Wong",
      initial: "A",
      content: isEn
        ? "A very warm online shop. The AI assistant replied quickly and solved my gift-giving dilemma."
        : "很有溫度的網店，購物助手回覆很快，解決了我送禮的煩惱。",
      date: "2 weeks ago",
      color: "bg-orange-100 text-orange-600"
    },
    {
      name: "S. Leung",
      initial: "S",
      content: isEn
        ? "Support local small shops! Packaging was very proper and reliable."
        : "支持本地良心小店，包裝非常妥當，值得信賴。",
      date: "1 month ago",
      color: "bg-green-100 text-green-600"
    }
  ];

  const gbpReviewLink = "https://g.page/r/CZSzFmPbXVvhEBM/review";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-primary/10 py-16 md:py-24 relative overflow-hidden border-b">
          <div className="absolute top-0 right-0 p-12 opacity-5"><Globe className="h-64 w-64 text-primary" /></div>
          <div className="container mx-auto px-4 relative z-10 text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-4 uppercase tracking-widest font-bold">
              <Link href="/" className="hover:text-primary transition-colors">{t.nav.home}</Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground">{lang === 'en' ? 'About Us' : '關於我們'}</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black font-headline tracking-tighter mb-6">{lang === 'en' ? 'About SHOP POINT' : '關於 SHOP POINT'}</h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto font-medium leading-relaxed">
              {lang === 'en' ? "Sourcing quality goods from around the world, we strive to tend to your daily needs with care, ensuring that a warm shopping experience and the original spirit of entrepreneurship endure." : "穿梭世界各地尋找優質良品，願能細心打理您的生活所需，使溫慢的購物體驗與經營初心得以延續。"}
            </p>
          </div>
        </section>

        {/* Section 1: Core Mission */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="relative aspect-[4/3] rounded-[3rem] overflow-hidden shadow-2xl">
                <Image src={images.story} alt="Our Story" fill className="object-cover" />
                <div className="absolute inset-0 bg-primary/10" />
              </div>
              <div className="space-y-8">
                <div className="space-y-4">
                  <h2 className="text-3xl md:text-4xl font-black font-headline tracking-tight">{lang === 'en' ? 'Our Mission' : '我們的使命'}</h2>
                  <div className="h-1.5 w-20 bg-primary rounded-full" />
                </div>
                <div className="prose prose-neutral max-w-none space-y-6 text-muted-foreground text-lg leading-relaxed">
                  <p className="text-foreground font-black text-xl italic">
                    {lang === 'en' ? "“Hidden behind technology, accompanying you in life.”" : "「隱身於技術之後，陪伴在生活之中。」"}
                  </p>
                  <p>
                    {lang === 'en' ? "Behind every shop, there are countless hours of hard work and dedication. We understand that every order is more than just a transaction; it carries the vendor's commitment to the customer and their hope for the future." : "經營一間店舖，背後往往藏著無數個挑燈夜戰的辛勞。我們深知，每一筆訂單的成立，不只是交易，更承載著店主對客人的承諾，以及對未來的期許。"}
                  </p>
                  <p>
                    {lang === 'en' ? "SHOP POINT was born with the hope of being like a cozy corner shop. Even in an era dominated by online shopping, we want you to feel the passion and warmth of the business owners. We strive to blend 'humanity' with 'technology,' providing a premium shopping experience while keeping complex automation quietly behind the scenes." : "Shop Point 的誕生，是希望能像巷弄角落的小店一般，即使在網購盛行的時代，仍能讓您體會到經營者的熱誠與手心的溫度。我們致力於將「人性化」與「科技」細膩揉合，在提供優質購物體驗的同時，讓繁瑣的自動化技術安靜地隱身於服務背後。"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Trust and Destiny */}
        <section className="py-24 bg-slate-50">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="order-2 lg:order-1 space-y-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-black text-xs uppercase tracking-widest">
                  <Heart className="h-4 w-4 fill-current" /> {isEn ? "The Power of Trust" : "信任的力量"}
                </div>
                <h2 className="text-3xl md:text-5xl font-black font-headline tracking-tighter leading-tight">
                  {isEn ? "More Than Just Data, It's a Connection" : "絕非冷冰冰的數據，而是沉甸甸的寄托"}
                </h2>
                <div className="prose prose-neutral max-w-none text-muted-foreground text-lg leading-relaxed">
                  <p>
                    {isEn 
                      ? "Facing rapid global changes and fierce market competition, we deeply understand that choosing and supporting a small shop in modern life requires rare trust."
                      : "面對時代的巨變與市場的繁雜競爭，我們深深明白，在現代生活中選擇並支持一家小店，需要一份難得的信任。"}
                  </p>
                  <p className="font-bold text-slate-800">
                    {isEn
                      ? "Therefore, every choice you make and every order you place is never just cold data to us; it is a heavy trust and encouragement. We treasure this connection deeply."
                      : "因此，您的每一次選擇、每一筆訂單，對我們而言都絕非冷冰冰的數據，而是一份沉甸甸的寄托與鼓勵。我們無比珍惜這樣的緣分。"}
                  </p>
                </div>
              </div>
              <div className="order-1 lg:order-2 relative aspect-[4/3] rounded-[3rem] overflow-hidden shadow-2xl group">
                <Image src={images.trust} alt="Trust and Connection" fill className="object-cover transition-transform duration-700 group-hover:scale-105" data-ai-hint="warm connection" />
                <div className="absolute inset-0 bg-slate-900/10" />
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Commitment to Quality */}
        <section className="py-24 bg-white relative overflow-hidden">
          <div className="absolute -left-20 top-1/2 -translate-y-1/2 opacity-5"><Zap className="h-96 w-96 text-primary" /></div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div className="relative aspect-[4/3] rounded-[3rem] overflow-hidden shadow-2xl group">
                <Image src={images.sourcing} alt="Global Sourcing" fill className="object-cover transition-transform duration-700 group-hover:scale-105" data-ai-hint="curated goods" />
                <div className="absolute inset-0 bg-primary/5" />
              </div>
              <div className="space-y-8">
                <h2 className="text-3xl md:text-5xl font-black font-headline tracking-tighter leading-tight">
                  {isEn ? "Meticulous Care in Every Detail" : "用心搜羅，只為不負這份信任"}
                </h2>
                <div className="prose prose-neutral max-w-none text-muted-foreground text-lg leading-relaxed space-y-6">
                  <p>
                    {isEn
                      ? "To honor this trust, we persist in traveling the world to carefully source premium goods that enhance life's quality; in every unseen detail, we do our best to provide the most meticulous and thoughtful service."
                      : "為了不負這份信任，我們堅持穿梭世界各地，用心搜羅每一件能提升生活質感的優質良品；在每一個看不見的細節裡，盡我們所能提供最細緻貼心的服務。"}
                  </p>
                  <div className="p-8 bg-primary/5 rounded-[2rem] border-l-8 border-primary shadow-sm">
                    <Quote className="h-8 w-8 text-primary/40 mb-4" />
                    <p className="text-slate-900 font-bold text-xl leading-snug">
                      {isEn
                        ? "The world may be noisy and competition fierce, but SHOP POINT wishes to always maintain this original heart. Let us help you pick, bringing a little more warmth and beauty to your daily life."
                        : "社會或許喧囂，競爭或許激烈，但 SHOP POINT 願始終保持這份初心，讓我們陪您一起挑選，為您的日常生活帶來多一點點的溫暖與美好。"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section: Visit Us */}
        <section className="py-24 bg-slate-50 border-y">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center space-y-12">
              <div className="space-y-4">
                <h2 className="text-3xl md:text-5xl font-black font-headline tracking-tighter">{isEn ? 'Visit Our Store' : '親臨門市'}</h2>
                <p className="text-muted-foreground font-medium">{isEn ? 'Experience our curated items in person at our Tuen Mun branch.' : '歡迎親臨我們的屯門分店，親身感受我們為您搜羅的優質貨品。'}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                <Card className="border-none shadow-xl bg-white rounded-[2rem] overflow-hidden">
                  <CardContent className="p-8 space-y-6">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                      <MapPin className="h-6 w-6" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-black text-sm uppercase tracking-widest text-muted-foreground">Address 地址</h4>
                      <p className="font-bold text-slate-800 leading-relaxed">
                        {isEn 
                          ? "B17, Basement, U-Town Shopping Arcade, 3 Tsing Ling Path, Tuen Mun, NT" 
                          : "香港新界屯門青菱徑 3 號時尚電腦城地庫 B17 號舖"}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-xl bg-white rounded-[2rem] overflow-hidden">
                  <CardContent className="p-8 space-y-6">
                    <div className="h-12 w-12 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600">
                      <Clock className="h-6 w-6" />
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-black text-sm uppercase tracking-widest text-muted-foreground">Operating Hours 營業時間</h4>
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-700">{isEn ? 'Mon - Sat' : '週一至週六'}</span>
                          <span className="font-black text-primary">12:00 - 19:00</span>
                        </div>
                        <div className="flex justify-between items-center opacity-60">
                          <span className="font-medium text-slate-500">{isEn ? 'Sun & Holidays' : '週日及公眾假期'}</span>
                          <span className="font-bold text-slate-500">{isEn ? 'Closed' : '休息'}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="p-6 bg-primary/5 rounded-2xl border border-dashed border-primary/20">
                <p className="text-xs text-muted-foreground italic leading-relaxed">
                  {isEn 
                    ? "* Temporary changes to hours will be updated on our social media platforms." 
                    : "* 如營業時間有臨時更改，將會在社交媒體更新，敬請留意。"}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Customer Voices / Google Reviews */}
        <section className="py-24 bg-white relative overflow-hidden">
          <div className="container mx-auto px-4 relative z-10">
            <div className="flex flex-col md:flex-row items-center justify-between mb-16 gap-8">
              <div className="space-y-4 text-center md:text-left">
                <Badge className="bg-primary text-primary-foreground font-black px-4 py-1 rounded-full uppercase tracking-widest text-[10px]">
                  TRUSTED BY CUSTOMERS
                </Badge>
                <h2 className="text-3xl md:text-5xl font-black font-headline tracking-tighter">
                  {isEn ? "Voices of Trust" : "顧客的心聲"}
                </h2>
                <p className="text-muted-foreground font-medium max-w-lg">
                  {isEn 
                    ? "Read authentic experiences from our community on Google. Your satisfaction is our greatest reward." 
                    : "查看來自 Google 的真實用戶評價。您的滿意是我們最大的動力與回報。"}
                </p>
              </div>
              <div className="bg-white p-6 rounded-[2rem] shadow-xl border border-primary/10 flex items-center gap-6 animate-in zoom-in duration-500">
                <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 shadow-inner">
                  <svg viewBox="0 0 24 24" className="h-6 w-6 fill-blue-600"><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.92 3.12-1.92 4.12-1.2 1.2-3.08 2.48-5.92 2.48-4.72 0-8.52-3.84-8.52-8.56s3.8-8.56 8.52-8.56c2.56 0 4.44.92 5.84 2.32l2.32-2.32C18.6 1.64 15.84.48 12.48.48 6.12.48 1 5.6 1 11.96s5.12 11.48 11.48 11.48c3.44 0 6.12-1.12 8.16-3.2 2.12-2.08 2.8-5 2.8-7.28 0-.72-.04-1.4-.16-2.04H12.48z" /></svg>
                </div>
                <div>
                  <div className="flex gap-0.5 mb-1">
                    {[1, 2, 3, 4, 5].map((s) => <Star key={s} className="h-4 w-4 fill-yellow-400 text-yellow-400" />)}
                  </div>
                  <p className="text-sm font-black uppercase tracking-tighter text-slate-900 leading-none">Google 5.0 Rating</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((item, idx) => (
                <Card key={idx} className="border-none shadow-md bg-white rounded-3xl overflow-hidden hover:shadow-xl transition-all duration-300 group ring-1 ring-muted">
                  <CardContent className="p-8 space-y-6">
                    <Quote className="h-8 w-8 text-primary/20 group-hover:text-primary/40 transition-colors" />
                    <p className="text-slate-700 font-medium leading-relaxed italic">
                      "{item.content}"
                    </p>
                    <div className="flex items-center gap-3 pt-4">
                      <div className={cn("h-10 w-10 rounded-full flex items-center justify-center font-black text-sm shadow-inner", item.color)}>
                        {item.initial}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-sm text-slate-900">{item.name}</p>
                        <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">{item.date}</p>
                      </div>
                      <div className="flex gap-0.5">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-16 text-center">
              <Button asChild size="lg" className="rounded-2xl h-16 px-10 bg-slate-900 text-white font-black text-lg shadow-2xl hover:scale-105 transition-all gap-3 group">
                <a href={gbpReviewLink} target="_blank" rel="noopener noreferrer">
                  {isEn ? "Share Your Experience" : "在 Google 上支持我們"}
                  <ExternalLink className="h-5 w-5 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </a>
              </Button>
            </div>
          </div>
        </section>

        {/* Impact Ledger Section */}
        <section id="impact" className="py-24 bg-slate-900 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-20 opacity-10"><HeartHandshake className="h-96 w-96 rotate-12 text-primary" /></div>
          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center space-y-4 mb-16">
              <Badge className="bg-primary text-primary-foreground font-black px-4 py-1.5 rounded-full uppercase tracking-widest text-[10px]">SOCIAL RESPONSIBILITY</Badge>
              <h2 className="text-3xl md:text-5xl font-black font-headline tracking-tighter">社會責任報告 (Impact Ledger)</h2>
            </div>
            {impactLoading ? (
              <div className="py-20 flex justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20 animate-in fade-in duration-700 max-w-6xl mx-auto">
                <div className="p-8 bg-white/5 backdrop-blur-md rounded-[2.5rem] border border-white/10 text-center space-y-4">
                  <Activity className="h-10 w-10 text-primary mx-auto" />
                  <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">已累積捐款總額</p>
                  <h3 className="text-4xl font-black text-primary">$ {(impactData?.totalDonated || 15840).toLocaleString()}</h3>
                </div>
                <div className="p-8 bg-primary/10 backdrop-blur-md rounded-[2.5rem] border border-primary/20 text-center space-y-4 relative overflow-hidden">
                  <TrendingUp className="h-10 w-10 text-orange-400 mx-auto" />
                  <p className="text-[10px] font-black uppercase text-primary tracking-widest">本季度捐款總額 ({quarterlyData.name})</p>
                  <h3 className="text-4xl font-black text-white">$ {quarterlyData.total.toLocaleString()}</h3>
                </div>
                <div className="p-8 bg-white/5 backdrop-blur-md rounded-[2.5rem] border border-white/10 text-center space-y-4">
                  <FileCheck className="h-10 w-10 text-green-400 mx-auto" />
                  <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">合作受惠機構</p>
                  <h3 className="text-4xl font-black text-white">{impactData?.charityCount || 3}</h3>
                </div>
              </div>
            )}
            <div className="text-center">
              <Button asChild variant="outline" className="rounded-full border-primary text-primary hover:bg-primary hover:text-white font-bold h-12 px-10">
                <Link href="/impact">查看完整報告明細 <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Back to top with Safe Area */}
        <button 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-[calc(5rem+env(safe-area-inset-bottom))] right-6 md:bottom-8 md:right-8 h-12 w-12 bg-white shadow-2xl rounded-full border border-muted flex items-center justify-center hover:bg-muted transition-colors z-50 group"
        >
          <ArrowUp className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
        </button>
      </main>
      <Footer />
    </div>
  );
}
