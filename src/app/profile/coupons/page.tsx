
"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Ticket, 
  ChevronRight, 
  ArrowLeft, 
  Loader2, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  History, 
  Zap, 
  ShoppingBag,
  Info,
  XCircle,
  Tag
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useI18n } from "@/lib/i18n/i18n-context";
import { useUser, useFirestore, useCollection } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function UserCouponsPage() {
  const { t, lang } = useI18n();
  const router = useRouter();
  const db = useFirestore();
  const { user, loading: userLoading } = useUser();
  const [activeTab, setActiveTab] = useState("active");

  const couponsQuery = useMemo(() => {
    if (!user || !db) return null;
    return query(
      collection(db, 'users', user.uid, 'coupons'),
      orderBy('redeemedAt', 'desc')
    );
  }, [db, user]);

  const { data: coupons, loading: couponsLoading } = useCollection<any>(couponsQuery);

  const sortedCoupons = useMemo(() => {
    if (!coupons) return { active: [], used: [], expired: [] };
    const today = format(new Date(), "yyyy-MM-dd");

    return {
      active: coupons.filter(c => !c.isUsed && (!c.expiryDate || c.expiryDate >= today)),
      used: coupons.filter(c => c.isUsed),
      expired: coupons.filter(c => !c.isUsed && c.expiryDate && c.expiryDate < today)
    };
  }, [coupons]);

  if (userLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;

  const isEn = lang === 'en';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-12 max-w-5xl">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link href="/" className="hover:text-primary transition-colors">{t.nav.home}</Link>
          <ChevronRight className="h-4 w-4 shrink-0" />
          <Link href="/profile" className="hover:text-primary transition-colors">{t.nav.account}</Link>
          <ChevronRight className="h-4 w-4 shrink-0" />
          <span className="text-foreground font-bold">{isEn ? 'My Coupons' : '我的電子錢包'}</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full bg-white shadow-sm hover:bg-muted">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-black font-headline tracking-tighter">{isEn ? 'Coupon Wallet' : '我的電子錢包'}</h1>
              <p className="text-sm text-muted-foreground font-medium">查看並套用您的專屬換領優惠。</p>
            </div>
          </div>
          <Button asChild className="rounded-2xl h-12 px-8 bg-primary text-primary-foreground font-black shadow-lg gap-2">
            <Link href="/profile/rewards">
              <Zap className="h-4 w-4 fill-current" /> {isEn ? 'Redeem More' : '前往換領更多'}
            </Link>
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-muted/50 p-1 h-12 rounded-2xl w-full sm:w-auto grid grid-cols-3 mb-8 border">
            <TabsTrigger value="active" className="rounded-xl font-bold gap-2">
              {isEn ? 'Available' : '可使用'} ({sortedCoupons.active.length})
            </TabsTrigger>
            <TabsTrigger value="used" className="rounded-xl font-bold gap-2">
              {isEn ? 'Used' : '已使用'} ({sortedCoupons.used.length})
            </TabsTrigger>
            <TabsTrigger value="expired" className="rounded-xl font-bold gap-2 text-muted-foreground">
              {isEn ? 'Expired' : '已過期'} ({sortedCoupons.expired.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="animate-in fade-in duration-500">
            {sortedCoupons.active.length === 0 ? (
              <EmptyState icon={Ticket} title={isEn ? "No Coupons" : "錢包目前空空如也"} desc={isEn ? "Redeem your points for exclusive discounts." : "快去換領商城使用積分換取折扣券吧！"} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {sortedCoupons.active.map(coupon => <CouponCard key={coupon.id} coupon={coupon} lang={lang} />)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="used" className="animate-in fade-in duration-500">
            {sortedCoupons.used.length === 0 ? (
              <EmptyState icon={History} title={isEn ? "No History" : "暫無使用紀錄"} desc={isEn ? "Your used coupons will appear here." : "您使用過的優惠券將會顯示在此處。"} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-60">
                {sortedCoupons.used.map(coupon => <CouponCard key={coupon.id} coupon={coupon} lang={lang} status="used" />)}
              </div>
            )}
          </TabsContent>

          <TabsContent value="expired" className="animate-in fade-in duration-500">
            {sortedCoupons.expired.length === 0 ? (
              <EmptyState icon={Clock} title={isEn ? "No Expired Coupons" : "暫無過期券"} desc="" />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 grayscale">
                {sortedCoupons.expired.map(coupon => <CouponCard key={coupon.id} coupon={coupon} lang={lang} status="expired" />)}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="mt-16 p-8 bg-primary/5 rounded-[2.5rem] border border-primary/10 flex items-start gap-4 shadow-sm">
          <Info className="h-6 w-6 text-primary shrink-0 mt-1" />
          <div className="space-y-2">
            <h4 className="font-black text-sm text-slate-900 uppercase">使用說明 (How to Use)</h4>
            <ul className="text-xs text-slate-700 leading-relaxed font-medium space-y-1 list-disc ml-4">
              <li>在結帳頁面（Checkout）中，您可以直接從錢包選取並套用這些優惠券。</li>
              <li>每張優惠券僅限使用一次。</li>
              <li>如果訂單被取消，符合條件的自動化優惠券將會退回您的錢包。</li>
            </ul>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function CouponCard({ coupon, lang, status = "active" }: { coupon: any, lang: string, status?: string }) {
  const isEn = lang === 'en';
  const name = isEn ? (coupon.name?.en || coupon.name?.zh) : (coupon.name?.zh || coupon.name?.en);
  
  return (
    <Card className={cn(
      "border-none shadow-md overflow-hidden bg-white relative flex transition-all hover:shadow-lg rounded-3xl",
      status !== 'active' && "bg-slate-50"
    )}>
      {/* 票券左側裝飾邊緣 */}
      <div className="w-4 bg-primary flex flex-col justify-around py-2 shrink-0">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="w-2 h-2 rounded-full bg-slate-50/50 -ml-1" />
        ))}
      </div>
      
      <CardContent className="p-0 flex-1 flex flex-col sm:flex-row">
        <div className="p-6 flex-1 space-y-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-primary/10 text-primary border-none text-[8px] font-black uppercase h-4 px-1.5">
                {coupon.type === 'percentage' ? 'DISCOUNT' : 'CASH OFF'}
              </Badge>
              <span className="text-[10px] font-mono text-muted-foreground opacity-60">ID: {coupon.id.split('-').pop()}</span>
            </div>
            <h3 className="text-lg font-black text-slate-800 line-clamp-1">{name}</h3>
          </div>

          <div className="flex items-center gap-3 text-[10px] font-bold text-muted-foreground">
            <div className="flex items-center gap-1"><Clock className="h-3 w-3" /> {isEn ? 'Expires:' : '過期日：'} {coupon.expiryDate || "No Expiry"}</div>
            {status === 'used' && <div className="flex items-center gap-1 text-green-600"><CheckCircle2 className="h-3 w-3" /> {isEn ? 'Redeemed' : '已使用'}</div>}
            {status === 'expired' && <div className="flex items-center gap-1 text-red-500"><XCircle className="h-3 w-3" /> {isEn ? 'Expired' : '已過期'}</div>}
          </div>

          <div className="flex items-center gap-2 bg-muted/20 p-2 rounded-xl border border-dashed">
            <code className="text-xs font-mono font-black text-slate-700 select-all">{coupon.code}</code>
            <Tag className="h-3 w-3 text-muted-foreground/30 ml-auto" />
          </div>
        </div>

        <div className={cn(
          "w-full sm:w-32 flex flex-col items-center justify-center p-6 sm:border-l border-dashed border-muted-foreground/20 text-center",
          status === 'active' ? "bg-primary/5" : "bg-muted/10"
        )}>
          <p className="text-[10px] font-black uppercase text-muted-foreground mb-1">Value</p>
          <div className="flex items-baseline gap-0.5">
            <span className="text-3xl font-black text-primary">{coupon.value}</span>
            <span className="text-xs font-black text-primary">{coupon.type === 'percentage' ? '%' : '$'}</span>
          </div>
          {status === 'active' && (
            <Button asChild variant="ghost" size="sm" className="mt-3 h-7 text-[9px] font-black uppercase text-primary hover:bg-primary/10 rounded-lg">
              <Link href="/shop">{isEn ? 'Use Now' : '立即使用'}</Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ icon: Icon, title, desc }: any) {
  return (
    <div className="py-24 text-center border-4 border-dashed rounded-[3rem] bg-white/50 space-y-4">
      <div className="h-20 w-20 bg-muted/30 rounded-full flex items-center justify-center mx-auto text-muted-foreground/20">
        <Icon className="h-10 w-10" />
      </div>
      <div className="space-y-1">
        <h3 className="text-xl font-black text-slate-800">{title}</h3>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}
