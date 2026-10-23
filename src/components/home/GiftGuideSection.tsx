"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Gift, Loader2, ArrowRight, Baby, Heart, Users, Sparkles, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/ProductCard";
import { useI18n } from "@/lib/i18n/i18n-context";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const GIFT_TARGETS = [
  { id: "all", label_zh: "全部禮物", label_en: "All Gifts", icon: Gift, tag: "" },
  { id: "kids", label_zh: "小朋友", label_en: "Kids", icon: Baby, tag: "gift:kids" },
  { id: "elders", label_zh: "長輩健康", label_en: "Elders", icon: Sparkles, tag: "gift:elders" },
  { id: "partner", label_zh: "甜蜜伴侶", label_en: "Partner", icon: Heart, tag: "gift:partner" },
  { id: "friends", label_zh: "好友驚喜", label_en: "Friends", icon: Smile, tag: "gift:friends" },
];

interface GiftGuideSectionProps {
  products: any[];
  loading?: boolean;
  allPromos?: any[] | null;
  allCategories?: any[] | null;
  allBrands?: any[] | null;
}

export function GiftGuideSection({ products, loading, allPromos, allCategories, allBrands }: GiftGuideSectionProps) {
  const { lang } = useI18n();
  const [selectedTarget, setSelectedTarget] = useState("all");
  const isEn = lang === 'en';

  const filtered = useMemo(() => {
    if (!products) return [];
    const target = GIFT_TARGETS.find(t => t.id === selectedTarget);
    if (!target || target.id === 'all') {
      // 只要有任何禮物標籤的都算
      return products.filter(p => (p.searchKeywordsRaw || "").toLowerCase().includes("gift:"));
    }
    return products.filter(p => {
      const pool = (p.searchKeywordsRaw || "").toLowerCase();
      return pool.includes(target.tag.toLowerCase());
    });
  }, [products, selectedTarget]);

  return (
    <section className="py-12 md:py-20 border-b overflow-hidden bg-muted/10">
      <div className="container px-4 mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
          <div className="space-y-1">
            <h2 className="text-xl md:text-3xl font-black font-headline flex items-center gap-3 text-slate-900">
              <Gift className="h-5 w-5 md:h-6 md:w-6 text-primary fill-current" />
              {isEn ? "Gift Guide Highlights" : "送禮靈感精選"}
            </h2>
            <p className="text-xs md:text-sm text-muted-foreground font-medium">為您生命中重要的人，挑選一份溫暖的心意。</p>
          </div>
          <div className="hidden md:block">
            <Button asChild variant="ghost" className="font-bold text-primary gap-2 rounded-xl">
              <Link href="/gifts">{isEn ? "View All Gifts" : "查看禮物專區"} <ArrowRight className="h-4 w-4" /></Link>
            </Button>
          </div>
        </div>

        <div className="mb-8">
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-2 pb-2">
              {GIFT_TARGETS.map(target => (
                <Button 
                  key={target.id}
                  variant={selectedTarget === target.id ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "rounded-full font-bold h-9 px-6 text-xs transition-all gap-2", 
                    selectedTarget === target.id ? "shadow-md scale-105" : "bg-white"
                  )}
                  onClick={() => setSelectedTarget(target.id)}
                >
                  <target.icon className="h-3.5 w-3.5" />
                  {isEn ? target.label_en : target.label_zh}
                </Button>
              ))}
            </div>
            <ScrollBar orientation="horizontal" className="hidden" />
          </ScrollArea>
        </div>

        {loading ? (
          <div className="py-24 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground italic border-2 border-dashed rounded-[2rem] bg-white/50 text-sm">
            {isEn ? "Searching for inspiration..." : "正在為您挑選合適的禮物..."}
          </div>
        ) : (
          <div className="relative group/carousel">
            <Carousel opts={{ align: "start", loop: true, containScroll: "trimSnaps" }} className="w-full">
              <CarouselContent className="-ml-3 md:-ml-4">
                {filtered.map((p) => (
                  <CarouselItem key={p.id} className="pl-3 md:pl-4 basis-[45%] sm:basis-[35%] md:basis-1/3 lg:basis-1/4 xl:basis-1/5">
                    <div className="h-full py-2">
                      <ProductCard product={p} compact allPromos={allPromos} allCategories={allCategories} allBrands={allBrands} />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <div className="hidden lg:block">
                <CarouselPrevious className="absolute -left-6 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white border-2 border-primary/20 text-primary shadow-xl hover:bg-primary hover:text-white transition-all z-20" />
                <CarouselNext className="absolute -right-6 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-white border-2 border-primary/20 text-primary shadow-xl hover:bg-primary hover:text-white transition-all z-20" />
              </div>
            </Carousel>
          </div>
        )}
      </div>
    </section>
  );
}
