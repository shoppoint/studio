
"use client";

import { useMemo } from "react";
import { Truck, MapPin, Home, Zap, Sparkles, PackageCheck, Info, PartyPopper } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/i18n-context";

interface Milestone {
  id: string;
  threshold: number;
  label_zh: string;
  label_en: string;
  icon: any;
}

const MILESTONES: Milestone[] = [
  { id: 'hk_post', threshold: 100, label_zh: '智易取', label_en: 'iPostal', icon: MapPin },
  { id: 'sf_locker', threshold: 120, label_zh: '順豐站/櫃', label_en: 'SF Locker', icon: PackageCheck },
  { id: 'home', threshold: 300, label_zh: '宅配直送', label_en: 'Home Delivery', icon: Home },
  { id: 'sf_direct', threshold: 500, label_zh: '順豐直送', label_en: 'SF Direct', icon: Truck },
];

export function ShippingMilestoneTracker({ subtotal, variant = "full" }: { subtotal: number, variant?: "full" | "compact" }) {
  const { lang } = useI18n();
  const isEn = lang === 'en';

  const maxThreshold = 500;
  const progress = Math.min(100, (subtotal / maxThreshold) * 100);

  const nextMilestone = useMemo(() => {
    return MILESTONES.find(m => subtotal < m.threshold);
  }, [subtotal]);

  const achievedCount = useMemo(() => {
    return MILESTONES.filter(m => subtotal >= m.threshold).length;
  }, [subtotal]);

  const isAllAchieved = achievedCount === MILESTONES.length;

  return (
    <div className={cn("space-y-4 animate-in fade-in duration-500", variant === "compact" ? "py-2" : "py-6")}>
      {/* Header Message - Darker Amber for better visibility */}
      <div className="flex items-start gap-2">
        {isAllAchieved ? (
          <div className="flex items-center gap-2 text-green-700 animate-bounce">
            <Sparkles className="h-4 w-4 fill-current" />
            <span className="text-[11px] font-black uppercase tracking-tight">
              {isEn ? "All Shipping Unlocked!" : "已解鎖全站免運費！"}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-amber-700">
            <Zap className="h-4 w-4 fill-current animate-pulse" />
            <span className="text-[11px] font-black uppercase tracking-tight">
              {isEn ? `Add $${(nextMilestone!.threshold - subtotal).toFixed(0)} for Free ${nextMilestone!.label_en}` 
                    : `再買 $${(nextMilestone!.threshold - subtotal).toFixed(1)} 享 ${nextMilestone!.label_zh} 免運`}
            </span>
          </div>
        )}
      </div>

      {/* Progress Bar Container - Added significant padding bottom for the "full" variant to prevent overlap */}
      <div className={cn("relative", variant === "full" ? "pt-10 pb-24" : "pt-1")}>
        <Progress value={progress} className={cn("h-2 bg-slate-200 shadow-inner", isAllAchieved && "bg-green-100 [&>div]:bg-green-600")} />
        
        {/* Milestone Dots & Labels (Only for Full Variant) */}
        {variant === "full" && (
          <div className="absolute inset-0 flex items-center">
            <div className="w-full relative h-2">
              {MILESTONES.map((m) => {
                const isAchieved = subtotal >= m.threshold;
                const position = (m.threshold / maxThreshold) * 100;
                const Icon = m.icon;
                
                // 修正：針對距離極近的 $100 與 $120 門檻進行左右水平位移，防止圖示與文字重疊
                const horizontalOffsetClass = m.id === 'hk_post' ? "-translate-x-[90%]" : 
                                            m.id === 'sf_locker' ? "-translate-x-[10%]" : 
                                            "-translate-x-1/2";
                
                return (
                  <div 
                    key={m.id} 
                    className={cn("absolute flex flex-col items-center group transition-all duration-500", horizontalOffsetClass)}
                    style={{ left: `${position}%` }}
                  >
                    {/* The Dot - High Contrast */}
                    <div className={cn(
                      "h-4 w-4 rounded-full border-[3px] transition-all duration-700 shadow-md",
                      isAchieved ? "bg-primary border-primary scale-125" : "bg-white border-slate-300"
                    )} />
                    
                    {/* Label Area */}
                    <div className="mt-2 flex flex-col items-center">
                      <div className={cn(
                        "p-2 rounded-xl border shadow-sm transition-all mb-1",
                        isAchieved ? "bg-primary text-primary-foreground border-primary scale-110" : "bg-white text-slate-400 border-slate-200"
                      )}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className={cn(
                        "text-[10px] font-black uppercase tracking-tighter text-center whitespace-nowrap",
                        isAchieved ? "text-slate-900" : "text-slate-400"
                      )}>
                        {isEn ? m.label_en : m.label_zh}
                      </span>
                      <span className={cn(
                        "text-[9px] font-bold mt-0.5",
                        isAchieved ? "text-primary-foreground/60" : "text-slate-300"
                      )}>${m.threshold}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {variant === "full" && achievedCount > 0 && !isAllAchieved && (
        <div className="pt-2 flex items-center gap-2">
          <Info className="h-4 w-4 text-slate-400" />
          <p className="text-[10px] text-slate-500 italic font-bold leading-tight">
            {isEn ? "Lower-tier shipping already free!" : "較低門檻的配送方式目前已享免運。"}
          </p>
        </div>
      )}
    </div>
  );
}
