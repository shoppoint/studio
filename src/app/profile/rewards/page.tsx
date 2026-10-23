
"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Coins, 
  Gift, 
  ChevronRight, 
  ChevronLeft,
  Crown,
  Award,
  Loader2,
  Package,
  Sparkles,
  ArrowLeft,
  User,
  Ticket,
  Clock,
  Zap,
  ShoppingBag,
  CheckCircle2,
  Calendar,
  Truck,
  MessageSquare,
  Tag,
  Check,
  Star,
  Heart
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useI18n } from "@/lib/i18n/i18n-context";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useUser, useFirestore, useCollection, useDoc } from "@/firebase";
import { collection, query, where, doc, addDoc, serverTimestamp, increment, updateDoc } from "firebase/firestore";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { issueCouponToUser } from "@/services/coupon-service";

/**
 * 智能圖示映射表：根據福利關鍵字自動分配 Lucide 圖示
 */
const BENEFIT_ICON_MAP: Record<string, any> = {
  "free_shipping": Truck,
  "免運費": Truck,
  "shipping": Truck,
  "deals": Tag,
  "優惠": Tag,
  "discount": Tag,
  "折扣": Tag,
  "support": MessageSquare,
  "支援": MessageSquare,
  "優先": MessageSquare,
  "gift": Gift,
  "禮遇": Gift,
  "禮物": Gift,
  "points": Coins,
  "積分": Coins,
  "獎賞": Coins,
  "rebate": Coins,
  "birthday": PartyPopper,
  "生日": PartyPopper,
  "access": Star,
  "權限": Star,
  "專屬": Star
};

function PartyPopper({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5.8 11.3 2 22l9.7-3.8L5.8 11.3Z"/><path d="M4 3h.01"/><path d="M22 8h.01"/><path d="M15 2h.01"/><path d="M22 20h.01"/><path d="m22 2-2.24.75a2.9 2.9 0 0 0-1.96 3.12l.33 2.26a2.9 2.9 0 0 1-1.39 2.8l-2 1.22a2.9 2.9 0 0 0-1.39 2.8l.33 2.26a2.9 2.9 0 0 1-1.96 3.12L10 22"/><path d="M10 10l3 3"/>
    </svg>
  );
}

export default function UserRewardsPage() {
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const router = useRouter();
  const db = useFirestore();
  const { user, userData, loading: userLoading } = useUser();
  const profT = t.profile;

  const [mounted, setMounted] = useState(false);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isRealUser = useMemo(() => user && !user.isAnonymous, [user]);
  
  useEffect(() => {
    if (mounted && !userLoading && !isRealUser) {
      router.replace("/");
    }
  }, [isRealUser, userLoading, mounted, router]);

  const rewardsConfigRef = useMemo(() => (mounted && isRealUser && db) ? doc(db, 'config', 'marketing_rewards') : null, [db, mounted, isRealUser]);
  const { data: rewardsConfig, loading: rewardsLoading } = useDoc<any>(rewardsConfigRef);

  const membershipConfigRef = useMemo(() => (mounted && isRealUser && db) ? doc(db, 'config', 'membership') : null, [db, mounted, isRealUser]);
  const { data: membershipConfig } = useDoc<any>(membershipConfigRef);

  const balance = userData?.points || 0;
  const currentTier = (userData?.tier || 'classic').toLowerCase();

  const redemptionItems = useMemo(() => {
    if (!rewardsConfig?.items) return [];
    const today = format(new Date(), "yyyy-MM-dd");

    return rewardsConfig.items.filter((item: any) => {
      if (item.status === 'hidden') return false;
      if (item.eligibleTiers && Array.isArray(item.eligibleTiers) && item.eligibleTiers.length > 0) {
        // 統一轉為小寫核對
        const normalizedEligible = item.eligibleTiers.map((t: string) => t.toLowerCase());
        if (!normalizedEligible.includes(currentTier)) return false;
      }
      if (item.startsAt && item.startsAt > today) return false;
      if (item.endsAt && item.endsAt < today) return false;
      return true;
    });
  }, [rewardsConfig, currentTier]);

  const nextTierInfo = useMemo(() => {
    if (!membershipConfig?.tiers) return { name: "--", remaining: 0, percent: 100 };
    if (currentTier === 'classic') {
      const goldThreshold = Number(membershipConfig.tiers.gold?.threshold) || 5000;
      return { name: profT.tiers.gold, remaining: Math.max(0, goldThreshold - (userData?.totalSpend || 0)), percent: Math.min(100, ((userData?.totalSpend || 0) / goldThreshold) * 100) };
    }
    if (currentTier === 'gold') {
      const platThreshold = Number(membershipConfig.tiers.platinum?.threshold) || 20000;
      return { name: profT.tiers.platinum, remaining: Math.max(0, platThreshold - (userData?.totalSpend || 0)), percent: Math.min(100, ((userData?.totalSpend || 0) / platThreshold) * 100) };
    }
    return { name: "MAX", remaining: 0, percent: 100 };
  }, [currentTier, membershipConfig, userData, profT]);

  /**
   * 強化版福利數據解析：支持大小寫模糊匹配與空字串過濾
   */
  const currentTierData = useMemo(() => {
    if (!membershipConfig?.tiers || !currentTier) return null;
    
    // 解決大小寫不一致問題：將 config 的 Key 全部轉為小寫進行查找
    const tiersEntries = Object.entries(membershipConfig.tiers);
    const match = tiersEntries.find(([key]) => key.toLowerCase() === currentTier);
    
    if (!match) return null;
    const [originalKey, rawData]: [string, any] = match;

    const isEn = lang === 'en';
    const benefitsList = isEn ? (rawData.benefits_en || []) : (rawData.benefits_zh || []);
    
    // 1. 確保是陣列且過濾掉空字串
    const finalBenefits = Array.isArray(benefitsList) 
      ? benefitsList.filter((s: string) => s && s.trim() !== "") 
      : (rawData.benefits ? [rawData.benefits] : []);

    // 2. 映射圖示
    const resolvedBenefits = finalBenefits.map((text: string) => {
      const lowerText = text.toLowerCase();
      const entry = Object.entries(BENEFIT_ICON_MAP).find(([key]) => lowerText.includes(key.toLowerCase()));
      return {
        text,
        icon: entry ? entry[1] : Check
      };
    });

    return {
      id: currentTier,
      tier: profT.tiers[originalKey as keyof typeof profT.tiers] || originalKey,
      earn: `${rawData.multiplier || '1.0'}x`,
      benefits: resolvedBenefits,
      color: currentTier === 'platinum' ? "bg-slate-900 text-white" : currentTier === 'gold' ? "bg-amber-100 text-amber-700 border-amber-200" : "bg-slate-100 text-slate-700",
      accent: currentTier === 'platinum' ? "text-primary" : currentTier === 'gold' ? "text-amber-600" : "text-slate-600"
    };
  }, [currentTier, membershipConfig, profT, lang]);

  const handleRedeem = async (item: any) => {
    if (!user || !db) return;
    if (balance < item.pointsRequired) {
      toast({ title: lang === 'en' ? "Insufficient Points" : "積分不足", variant: "destructive" });
      return;
    }

    setIsProcessing(item.id);
    try {
      if (item.redeemMode === 'coupon' && item.linkedPromoId) {
        const result: any = await issueCouponToUser({
          db,
          userId: user.uid,
          promoId: item.linkedPromoId,
          rewardId: item.id,
          pointsRequired: Number(item.pointsRequired),
          validityDays: item.validityDays ? Number(item.validityDays) : undefined 
        });

        if (result.success) {
          toast({ 
            title: lang === 'en' ? "Success!" : "換領成功", 
            description: lang === 'en' ? "Coupon added to your wallet." : "優惠券已存入您的帳戶錢包，結帳時可直接選取使用！" 
          });
          router.push("/profile/coupons");
        } else { throw new Error(result.message); }

      } else {
        await addDoc(collection(db, 'enquiries'), {
          userId: user.uid,
          name: userData?.displayName || user.email,
          email: user.email,
          category: 'other',
          subject: `積分換領申請: ${lang === 'en' ? item.title.en : item.title.zh}`,
          message: `用戶申請換領 [${item.id}] ${lang === 'en' ? item.title.en : item.title.zh}。扣除積分: ${item.pointsRequired}。`,
          source: 'Redemption_System',
          status: 'new',
          createdAt: serverTimestamp()
        });
        await updateDoc(doc(db, 'users', user.uid), { points: increment(-item.pointsRequired), updatedAt: serverTimestamp() });
        toast({ title: lang === 'en' ? "Request Sent" : "換領申請已送出", description: lang === 'en' ? "Our team will contact you shortly." : "我們將儘快處理您的換領請求。" });
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    } finally {
      setIsProcessing(null);
    }
  };

  if (userLoading || !mounted || !isRealUser) return <div className="h-screen flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-12">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link href="/" className="hover:text-primary transition-colors">{t.nav.home}</Link>
          <ChevronRight className="h-4 w-4 shrink-0" /><Link href="/profile" className="hover:text-primary transition-colors">{t.nav.account}</Link>
          <ChevronRight className="h-4 w-4 shrink-0" /><span className="text-foreground font-bold">{profT.my_rewards}</span>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div className="flex items-center gap-4"><Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full bg-muted/50 hover:bg-muted"><ArrowLeft className="h-5 w-5" /></Button><h1 className="text-3xl font-black font-headline tracking-tighter">{profT.my_rewards}</h1></div>
          <div className="flex gap-2">
            <Button variant="outline" asChild className="rounded-xl border-primary text-primary font-bold gap-2 h-11 px-6">
              <Link href="/profile/coupons">
                <Ticket className="h-4 w-4" /> {profT.my_coupons_btn}
              </Link>
            </Button>
            <Button variant="outline" asChild className="rounded-xl border-muted-foreground/20 text-muted-foreground font-bold h-11 px-6">
              <Link href="/profile">{profT.back_to_account_btn}</Link>
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4 space-y-6">
            <Card className={cn("border-none shadow-xl overflow-hidden relative text-white transition-all duration-700 rounded-[2.5rem]", currentTier === 'platinum' ? "bg-slate-900" : currentTier === 'gold' ? "bg-gradient-to-br from-amber-400 to-amber-600" : "bg-primary")}>
              <div className="absolute top-0 right-0 p-4 opacity-10"><Crown className="h-32 w-32 rotate-12" /></div>
              <CardContent className="p-8 space-y-6 relative z-10"><div className="flex items-center justify-between"><div className="h-12 w-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center"><Crown className="h-6 w-6 text-white" /></div><Badge className="bg-white/20 border-none text-white font-black px-3 py-1 uppercase tracking-tighter">{profT.tiers[currentTier as keyof typeof profT.tiers] || currentTier} Member</Badge></div><div className="space-y-1"><p className="text-xs font-bold opacity-80 uppercase tracking-widest">{profT.points_balance}</p><h2 className="text-5xl font-black">{balance} <span className="text-xl font-bold">{profT.points_short}</span></h2></div>{currentTier !== 'platinum' && (<div className="space-y-3 pt-2"><div className="flex justify-between text-[10px] font-black uppercase tracking-tight"><span>{profT.tiers.next_tier}: {nextTierInfo.name}</span><span>{nextTierInfo.remaining > 0 ? `$${nextTierInfo.remaining.toLocaleString()} to go` : "Ready to Upgrade"}</span></div><Progress value={nextTierInfo.percent} className="h-1.5 bg-white/20" /></div>)}</CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden border border-muted-foreground/10">
              <CardHeader className="bg-muted/5 border-b"><CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2"><Award className="h-5 w-5 text-primary" />{profT.tiers.benefits}</CardTitle></CardHeader>
              <CardContent className="space-y-6 pt-6">
                {currentTierData ? (
                  <div className="space-y-6">
                    <div className={cn("p-6 rounded-2xl border transition-all animate-in zoom-in duration-300", currentTierData.color)}>
                      <div className="flex justify-between items-center mb-4">
                        <h4 className="font-black text-lg uppercase tracking-tight">{currentTierData.tier}</h4>
                        <Badge className="bg-primary text-primary-foreground text-[8px] font-black border-none px-2 shadow-sm">YOUR LEVEL</Badge>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-bold opacity-80">{profT.tiers.earn_rate}</span>
                        <span className="font-black text-xl">{currentTierData.earn}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      {currentTierData.benefits.length === 0 ? (
                        <div className="py-8 text-center bg-muted/10 rounded-2xl border border-dashed">
                          <p className="text-xs text-muted-foreground italic px-4">No specific benefits listed for this tier yet.</p>
                        </div>
                      ) : (
                        currentTierData.benefits.map((benefit: any, idx: number) => {
                          const IconComp = benefit.icon;
                          return (
                            <div key={idx} className="flex items-center gap-4 p-4 bg-muted/20 rounded-2xl border border-transparent hover:border-primary/20 transition-all group">
                              <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110", currentTierData.color)}>
                                <IconComp className="h-5 w-5" />
                              </div>
                              <span className="text-xs font-bold text-slate-700 leading-tight flex-1">{benefit.text}</span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center space-y-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">載入等級福利中...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-8 space-y-8">
            <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-primary" />
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                  <h3 className="text-2xl font-black font-headline flex items-center gap-3 tracking-tight text-slate-900">
                    <Gift className="h-6 w-6 text-primary" />{profT.redeem_store}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1 font-medium">
                    {profT.redeem_store_desc}
                  </p>
                </div>
              </div>

              {rewardsLoading ? <div className="py-20 text-center"><Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" /></div> : redemptionItems.length === 0 ? <div className="py-16 text-center border-2 border-dashed rounded-3xl bg-muted/5 space-y-3"><Package className="h-10 w-10 text-muted-foreground/30 mx-auto" /><p className="text-sm text-muted-foreground font-medium">目前暫無換領項目。</p></div> : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {redemptionItems.map((item: any) => {
                    const title = lang === 'en' ? (item.title?.en || item.title?.zh) : (item.title?.zh || item.title?.en);
                    const canRedeem = balance >= (item.pointsRequired || 0);
                    const isProcessingThis = isProcessing === item.id;
                    const isCoupon = item.redeemMode === 'coupon';

                    return (
                      <Card key={item.id} className="border-none shadow-none bg-muted/20 overflow-hidden group hover:bg-white hover:shadow-md transition-all duration-300 rounded-2xl flex flex-col h-full">
                        <div className="relative aspect-square overflow-hidden bg-muted">
                          {item.imageUrl ? <img src={item.imageUrl} alt={title} className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500" /> : <div className="h-full w-full flex items-center justify-center opacity-20"><Package className="h-10 w-10" /></div>}
                          <div className="absolute top-2 right-2"><Badge className="bg-primary text-primary-foreground border-none font-black shadow-sm text-[10px]">{item.pointsRequired} {profT.points_short}</Badge></div>
                          {isCoupon && (
                            <div className="absolute bottom-2 left-2">
                              <Badge className="bg-indigo-600 text-white border-none font-black text-[8px] h-5 px-2 uppercase shadow-lg">
                                <Ticket className="h-2.5 w-2.5 mr-1" /> {profT.auto_issued}
                              </Badge>
                            </div>
                          )}
                        </div>
                        <CardContent className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                          <div className="space-y-1">
                             <h4 className="font-bold text-xs line-clamp-2 group-hover:text-primary transition-colors text-slate-800">{title}</h4>
                             {item.validityDays && (
                               <p className="text-[9px] font-black text-indigo-600 uppercase flex items-center gap-1">
                                 <Clock className="h-2 w-2" /> {profT.valid_after_redemption.replace('{days}', item.validityDays.toString())}
                               </p>
                             )}
                             {item.endsAt && <p className="text-[8px] font-bold text-orange-600 uppercase mt-1 flex items-center gap-1"><Calendar className="h-2 w-2" /> Expires: {item.endsAt}</p>}
                          </div>
                          <Button size="sm" disabled={!canRedeem || isProcessingThis} className={cn("w-full font-black text-[10px] uppercase rounded-xl transition-all h-9", canRedeem ? "bg-primary text-primary-foreground shadow-sm" : "bg-muted text-muted-foreground cursor-not-allowed")} onClick={() => handleRedeem(item)}>{isProcessingThis ? <Loader2 className="h-3 w-3 animate-spin" /> : canRedeem ? profT.redeem_btn : "積分不足"}</Button>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="bg-primary/5 border border-primary/10 p-8 rounded-[2.5rem] flex items-start gap-4 shadow-sm">
              <Sparkles className="h-6 w-6 text-primary shrink-0 mt-1" />
              <div className="space-y-2">
                <h4 className="font-black text-sm text-slate-900 uppercase">{profT.redemption_notes}</h4>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {profT.redemption_footer_text}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
