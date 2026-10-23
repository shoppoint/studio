"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Bot, 
  Activity, 
  Loader2, 
  RefreshCcw, 
  ShieldCheck, 
  AlertTriangle,
  Info,
  Cpu,
  Zap
} from "lucide-react";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getAiStatusAction } from "@/app/actions/ai-actions";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";

/**
 * @fileOverview AI 服務預熱與診斷小工具
 * 負責在 Header 顯示 AI 連線狀態，並執行預熱請求以消除冷啟動超時。
 */
export function AiStatusIndicator() {
  const { toast } = useToast();
  const [status, setStatus] = useState<'idle' | 'warming' | 'ready' | 'error'>('idle');
  const [diagData, setDiagData] = useState<any>(null);

  const runWarmup = useCallback(async (isManual = false) => {
    setStatus('warming');
    try {
      const res = await getAiStatusAction();
      if (res.success && res.data?.status === 'Healthy') {
        setDiagData(res.data);
        setStatus('ready');
        if (isManual) {
          toast({ title: "AI 服務已預熱", description: "伺服器容器已就緒，現在執行生成速度最快。" });
        }
      } else {
        setDiagData(res.data || null);
        setStatus('error');
        if (isManual) {
          toast({ title: "預熱失敗", description: res.data?.error || "無法建立連線", variant: "destructive" });
        }
      }
    } catch (e) {
      setStatus('error');
    }
  }, [toast]);

  useEffect(() => {
    // 進入頁面時自動預熱一次
    const timer = setTimeout(() => {
      runWarmup();
    }, 1500);
    return () => clearTimeout(timer);
  }, [runWarmup]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button 
          className={cn(
            "flex items-center gap-2.5 px-3 py-1.5 rounded-full border transition-all hover:bg-muted/50",
            status === 'ready' ? "border-green-100 bg-green-50/30" : 
            status === 'warming' ? "border-amber-100 bg-amber-50/30" : 
            status === 'error' ? "border-red-100 bg-red-50/30" : "border-muted"
          )}
        >
          <div className="relative">
            <Bot className={cn(
              "h-4 w-4",
              status === 'ready' ? "text-green-600" : 
              status === 'warming' ? "text-amber-500 animate-pulse" : 
              status === 'error' ? "text-red-500" : "text-muted-foreground"
            )} />
            <span className={cn(
              "absolute -top-1 -right-1 h-2 w-2 rounded-full border border-white",
              status === 'ready' ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" : 
              status === 'warming' ? "bg-amber-400 animate-ping" : 
              status === 'error' ? "bg-red-500" : "bg-slate-300"
            )} />
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">
            {status === 'ready' ? 'AI Ready' : status === 'warming' ? 'Warming...' : status === 'error' ? 'AI Error' : 'AI Offline'}
          </span>
        </button>
      </PopoverTrigger>
      
      <PopoverContent align="end" className="w-80 p-0 rounded-[1.5rem] border-none shadow-2xl overflow-hidden">
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
           <div className="flex items-center gap-2">
             <Activity className="h-4 w-4 text-primary" />
             <span className="text-xs font-black uppercase tracking-widest">AI 基礎設施診斷</span>
           </div>
           <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 rounded-lg text-white/40 hover:text-white hover:bg-white/10" 
            onClick={() => runWarmup(true)}
            disabled={status === 'warming'}
           >
             <RefreshCcw className={cn("h-3.5 w-3.5", status === 'warming' && "animate-spin")} />
           </Button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
             <div className="p-3 bg-muted/20 rounded-xl space-y-1">
               <p className="text-[9px] font-black text-muted-foreground uppercase">容器狀態</p>
               <p className={cn("text-xs font-bold", status === 'ready' ? "text-green-600" : "text-amber-600")}>
                 {status === 'ready' ? "Warm (已熱機)" : status === 'warming' ? "Cold Starting..." : "Inactive"}
               </p>
             </div>
             <div className="p-3 bg-muted/20 rounded-xl space-y-1">
               <p className="text-[9px] font-black text-muted-foreground uppercase">響應測試</p>
               <p className="text-xs font-bold font-mono">{diagData?.ping || "--"}</p>
             </div>
          </div>

          {diagData && (
            <div className="space-y-3 pt-1">
               <div className="flex justify-between text-[10px] font-bold">
                 <span className="text-muted-foreground uppercase">Uptime 運行時間</span>
                 <span className="text-slate-800">{diagData.uptime}s</span>
               </div>
               <div className="flex justify-between text-[10px] font-bold">
                 <span className="text-muted-foreground uppercase">Mem 記憶體</span>
                 <span className="text-slate-800">{diagData.memory?.rss}MB</span>
               </div>
               <div className="flex justify-between text-[10px] font-bold">
                 <span className="text-muted-foreground uppercase">Revision 修訂</span>
                 <span className="text-primary font-mono truncate max-w-[120px]">{diagData.revision}</span>
               </div>
            </div>
          )}

          <Separator className="border-dashed" />

          <div className={cn(
            "p-3 rounded-xl flex items-start gap-3",
            status === 'ready' ? "bg-green-50 border border-green-100" : "bg-blue-50 border border-blue-100"
          )}>
            {status === 'ready' ? <ShieldCheck className="h-4 w-4 text-green-600 shrink-0 mt-0.5" /> : <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />}
            <p className={cn("text-[10px] leading-relaxed font-medium", status === 'ready' ? "text-green-800" : "text-blue-800")}>
              {status === 'ready' 
                ? "伺服器已熱機。現在進行品牌故事或 SEO 生成將具備最高成功率且不觸發超時。"
                : "系統正在背景喚醒 AI 容器。請稍候指示燈變綠再執行重型內容生成。"}
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
