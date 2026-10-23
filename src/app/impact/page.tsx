"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  HeartHandshake, 
  Activity, 
  FileCheck, 
  ExternalLink, 
  Calendar, 
  Gift, 
  TrendingUp, 
  Zap, 
  ChevronRight,
  Loader2,
  Heart,
  Info,
  Award,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  ArrowRight,
  Tag
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/i18n-context";
import { useFirestore, useDoc, useCollection } from "@/firebase";
import { doc, collection, query, where, orderBy } from "firebase/firestore";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export default function ImpactLedgerPage() {
  const { t, lang } = useI18n();
  const db = useFirestore();

  // 1. 獲取核心統計數據
  const impactConfigRef = useMemo(() => doc(db, 'config', 'impact'), [db]);
  const { data: impactData, loading: impactLoading } = useDoc<any>(impactConfigRef);

  // 2. 獲取正在進行中的公益促銷活動
  const activeDonationPromosQuery = useMemo(() => query(
    collection(db, 'promotions'),
    where('status', '==', 'active'),
    where('isDonationActive', '==', true),
    orderBy('updatedAt', 'desc')
  ), [db]);
  const { data: activeDonationPromos, loading: promosLoading } = useCollection<any>(activeDonationPromosQuery);

  /**
   * 自動計算當前季度的捐贈總額
   */
  const quarterlyData = useMemo(() => {
    if (!impactData?.records) return { total: 0, name: "" };
    
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-11
    
    let start: Date, end: Date, qName: string;

    if (month <= 2) {
      start = new Date(year, 0, 1);
      end = new Date(year, 2, 31, 23, 59, 59);
      qName = lang === 'en' ? "Q1 (Jan - Mar)" : "第一季度 (1月-3月)";
    } else if (month <= 5) {
      start = new Date(year, 3, 1);
      end = new Date(year, 5, 30, 23, 59, 59);
      qName = lang === 'en' ? "Q2 (Apr - Jun)" : "第二季度 (4月-6月)";
    } else if (month <= 8) {
      start = new Date(year, 6, 1);
      end = new Date(year, 8, 30, 23, 59, 59);
      qName = lang === 'en' ? "Q3 (Jul - Sep)" : "第三季度 (7月-9月)";
    } else {
      start = new Date(year, 9, 1);
      end = new Date(year, 11, 31, 23, 59, 59);
      qName = lang === 'en' ? "Q4 (Oct - Dec)" : "第四季度 (10月-12月)";
    }

    const total = impactData.records.reduce((acc: number, rec: any) => {
      const recDate = new Date(rec.date);
      if (recDate >= start && recDate <= end) {
        return acc + (Number(rec.amount) || 0);
      }
      return acc;
    }, 0);

    return { total, name: qName };
  }, [impactData, lang]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <Navbar />
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="bg-slate-900 text-white py-16 md:py-24 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-12 opacity-10"><HeartHandshake className="h-64 w-64 rotate-12" /></div>
          <div className="container mx-auto px-4 relative z-10 text-center space-y-6">
            <div className="flex items-center justify-center gap-2 text-sm text-slate-400 mb-4 uppercase tracking-widest font-bold">
              <Link href="/" className="hover:text-primary transition-colors">{t.nav.home}</Link>
              <ChevronRight className="h-4 w-4" />
              <Link href="/about" className="hover:text-primary transition-colors">{lang === 'en' ? 'About' : '關於我們'}</Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-white">Impact Ledger</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black font-headline tracking-tighter">
              社會責任日誌 (Impact Ledger)
            </h1>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed">
              我們深信透明度是信任的基石。每一筆善款的去向與收據均在此公示，感謝您與我們共同創造改變。
            </p>
          </div>
        </section>

        {/* Stats Section */}
        <section className="container mx-auto px-4 -mt-12 relative z-20">
          {impactLoading ? (
            <div className="bg-white p-12 rounded-[3rem] shadow-xl flex justify-center">
              <Loader2 className="animate-spin h-10 w-10 text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
              <Card className="border-none shadow-xl bg-white rounded-[2.5rem] overflow-hidden">
                <CardContent className="p-8 text-center space-y-3">
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mx-auto">
                    <Activity className="h-6 w-6" />
                  </div>
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">累積捐款總額</p>
                  <h3 className="text-3xl font-black text-slate-900">$ {(impactData?.totalDonated || 0).toLocaleString()}</h3>
                </CardContent>
              </Card>

              <Card className="border-none shadow-xl bg-primary text-primary-foreground rounded-[2.5rem] overflow-hidden">
                <CardContent className="p-8 text-center space-y-3">
                  <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center text-white mx-auto">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <p className="text-[10px] font-black uppercase opacity-80 tracking-widest">本季累積 ({quarterlyData.name})</p>
                  <h3 className="text-3xl font-black">$ {quarterlyData.total.toLocaleString()}</h3>
                </CardContent>
              </Card>

              <Card className="border-none shadow-xl bg-white rounded-[2.5rem] overflow-hidden">
                <CardContent className="p-8 text-center space-y-3">
                  <div className="h-12 w-12 rounded-2xl bg-green-50 flex items-center justify-center text-green-600 mx-auto">
                    <FileCheck className="h-6 w-6" />
                  </div>
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">合作受惠機構</p>
                  <h3 className="text-3xl font-black text-slate-900">{impactData?.charityCount || 0} 門</h3>
                </CardContent>
              </Card>
            </div>
          )}
        </section>

        {/* Ongoing Donation Campaigns Section */}
        <section className="container mx-auto px-4 py-16 max-w-6xl">
          <div className="flex items-center gap-4 mb-10">
            <h2 className="text-2xl font-black font-headline uppercase tracking-tight flex items-center gap-3">
              <Zap className="h-6 w-6 text-orange-500 fill-current animate-pulse" />
              正在進行的公益活動
            </h2>
            <div className="flex-1 border-t border-dashed border-muted-foreground/20" />
          </div>

          {promosLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>
          ) : !activeDonationPromos || activeDonationPromos.length === 0 ? (
            <div className="p-10 text-center bg-white rounded-[2rem] border-2 border-dashed text-muted-foreground italic text-sm">
              目前暫無進行中的公益促銷活動。
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {activeDonationPromos.map((promo: any) => {
                const title = lang === 'en' ? (promo.name?.en || promo.name?.zh) : (promo.name?.zh || promo.name?.en);
                return (
                  <Card key={promo.id} className="border-none shadow-lg rounded-[2.5rem] bg-white overflow-hidden group hover:-translate-y-1 transition-all duration-300">
                    <div className="relative aspect-[16/9] overflow-hidden bg-muted">
                      {promo.imageUrl ? (
                        <Image src={promo.imageUrl} alt={title} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center bg-indigo-50">
                          <Heart className="h-10 w-10 text-indigo-200" />
                        </div>
                      )}
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-indigo-600 text-white border-none font-black text-[9px] px-3 h-6">ONGOING</Badge>
                      </div>
                    </div>
                    <CardContent className="p-6 space-y-4">
                      <div className="space-y-1">
                        <h4 className="font-black text-lg line-clamp-1 group-hover:text-primary transition-colors">{title}</h4>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5 font-bold uppercase">
                          <HeartHandshake className="h-3.5 w-3.5 text-red-500" /> {promo.donationCharity}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 italic">
                        {lang === 'en' ? (promo.publicSummary?.en || "Purchase items under this campaign to trigger automatic donation.") : (promo.publicSummary?.zh || "選購此活動下的產品，我們將代您捐出部分收益。")}
                      </p>
                      <Button asChild className="w-full h-11 bg-primary text-primary-foreground font-black rounded-xl gap-2">
                        <Link href={promo.targetUrl || "/shop"}>立即支持公益 <ArrowRight className="h-4 w-4" /></Link>
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* Detailed History List - Updated Title and Thumbnail layout */}
        <section className="container mx-auto px-4 py-12 max-w-5xl">
          <div className="space-y-12">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-black font-headline uppercase tracking-tight flex items-center gap-3">
                <Activity className="h-6 w-6 text-primary" />
                捐款及社區活動詳情
              </h2>
              <div className="flex-1 border-t border-dashed border-muted-foreground/20" />
            </div>

            {impactLoading ? (
              <div className="py-20 text-center">
                <Loader2 className="animate-spin h-10 w-10 text-primary mx-auto" />
              </div>
            ) : !impactData?.records || impactData.records.length === 0 ? (
              <div className="py-20 text-center border-4 border-dashed rounded-[3rem] bg-white space-y-4">
                <Info className="h-12 w-12 text-muted-foreground/20 mx-auto" />
                <p className="text-muted-foreground font-bold italic">目前尚無公開的歷史紀錄。</p>
              </div>
            ) : (
              <div className="space-y-6">
                {impactData.records.map((rec: any) => (
                  <Card key={rec.id} className="border-none shadow-sm bg-white rounded-[2rem] overflow-hidden group hover:shadow-md transition-all duration-300">
                    <CardContent className="p-0">
                      <div className="flex items-center justify-between p-6 md:p-8">
                        {/* 左側資訊 */}
                        <div className="flex-1 pr-6 space-y-4">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-3">
                              <h3 className="text-xl font-black text-slate-900">{rec.charityName}</h3>
                              <Badge className={cn(
                                "text-[9px] font-black uppercase px-2 h-5 border-none",
                                rec.type === 'donation' ? "bg-green-500 text-white" : "bg-blue-600 text-white"
                              )}>
                                {rec.type === 'donation' ? '現金捐款' : '合作活動'}
                              </Badge>
                            </div>
                            <div className="flex flex-wrap items-center gap-4 text-[10px] text-muted-foreground font-bold">
                              <span className="flex items-center gap-1.5"><Calendar className="h-3 w-3 text-primary" /> {rec.date}</span>
                              <span className="flex items-center gap-1.5 text-indigo-600 font-black"><Zap className="h-3 w-3 fill-current" /> 影響力價值: ${Number(rec.amount).toLocaleString()}</span>
                            </div>
                          </div>
                          
                          <p className="text-xs text-slate-600 leading-relaxed italic line-clamp-2">
                            "{rec.purpose}"
                          </p>
                        </div>

                        {/* 右側收據小圖示 */}
                        {rec.receiptUrl && (
                          <div className="shrink-0 relative h-16 w-16 md:h-20 md:w-20 rounded-2xl overflow-hidden border-2 border-dashed bg-muted group-hover:border-primary/30 transition-colors">
                            <Image 
                              src={rec.receiptUrl} 
                              alt="Receipt Thumbnail" 
                              fill 
                              className="object-cover" 
                            />
                            {/* Optional: Simple check overlay to reinforce authenticity */}
                            <div className="absolute bottom-1 right-1 bg-white rounded-full p-0.5 shadow-sm">
                              <FileCheck className="h-2.5 w-2.5 text-green-600" />
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Transparency Commitment Footer */}
          <div className="mt-20 p-10 bg-primary/5 rounded-[3rem] border border-primary/10 text-center space-y-6">
            <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
              <ShieldCheck className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black font-headline">誠信與透明度承諾</h3>
              <p className="text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed font-medium">
                誠信是 SHOP POINT 的靈魂。我們承諾每一筆公示的明細都具備真實的法律效力收據。如果您對任何捐贈有疑問，或有推薦的受惠機構，歡迎隨時聯絡我們的管理團隊。
              </p>
            </div>
            <Button asChild variant="outline" className="rounded-xl border-primary text-primary font-bold px-10 h-12 hover:bg-primary hover:text-white transition-all">
              <Link href="/contact">與管理團隊聯絡</Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
