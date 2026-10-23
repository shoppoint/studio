"use client";

import Link from "next/link";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n/i18n-context";

export function SubscriptionBanner() {
  const { t, lang } = useI18n();

  return (
    <section className="py-24 bg-[#2D1B14] text-white relative overflow-hidden">
      <div className="absolute top-0 right-0 p-20 opacity-10"><Zap className="h-96 w-96 rotate-12 text-primary" /></div>
      <div className="container mx-auto px-4 relative z-10 text-center md:text-left">
        <div className="max-w-3xl space-y-8">
          <Badge className="bg-primary text-primary-foreground font-black px-4 py-1.5 rounded-full uppercase tracking-widest text-[10px]">
            {t.subscription?.badge || "Subscription"}
          </Badge>
          <h2 className="text-4xl md:text-6xl font-black font-headline tracking-tighter leading-tight">
            {lang === 'en' ? 'Smart Subscriptions. Effortless Living.' : '定期預約配送・省心的高品質生活'}
          </h2>
          <p className="text-lg md:text-xl text-slate-300 leading-relaxed max-w-2xl font-medium">
            {lang === 'en' 
              ? "Subscribe and get an extra discount on every delivery. Flexible, zero commitment." 
              : "預約日常消耗品定期配送，每期即享額外折扣。週期靈活、隨時可停。"}
          </p>
          <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-4">
            <Button asChild size="lg" className="bg-primary text-primary-foreground font-black rounded-2xl h-14 px-10 shadow-xl hover:scale-105 transition-transform">
              <Link href="/shop?subscription=true">
                {lang === 'en' ? "Browse Items" : "瀏覽產品"}
              </Link>
            </Button>
            <Button 
              asChild 
              variant="secondary" 
              size="lg" 
              className="bg-white text-zinc-600 hover:bg-zinc-100 rounded-2xl h-14 px-10 font-bold transition-all"
            >
              <Link href="/faq">
                {lang === 'en' ? "How it Works" : "了解更多"}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
