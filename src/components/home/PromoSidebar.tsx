"use client";

import Link from "next/link";
import { Tag, Copy, Loader2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useI18n } from "@/lib/i18n/i18n-context";
import { useToast } from "@/hooks/use-toast";

interface PromoSidebarProps {
  promos: any[] | null;
  loading: boolean;
}

export function PromoSidebar({ promos, loading }: PromoSidebarProps) {
  const { t, lang } = useI18n();
  const { toast } = useToast();

  const handleCopyCode = async (code: string) => {
    if (!code) return;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(code);
        toast({ 
          title: lang === 'en' ? "Code Copied!" : "代碼已複製", 
          description: code 
        });
      } else {
        throw new Error("Clipboard API not available");
      }
    } catch (err) {
      console.warn("Clipboard access denied or failed", err);
      toast({ 
        title: lang === 'en' ? "Promo Code" : "優惠代碼", 
        description: `${code} (Please copy manually)` 
      });
    }
  };

  return (
    <Card className="border-none shadow-xl bg-white rounded-[2.5rem] h-[280px] md:h-[400px] overflow-hidden flex flex-col">
      <CardHeader className="bg-primary/5 py-3 md:py-4 px-6 border-b shrink-0">
        <Link href="/deals" className="group/title">
          <CardTitle className="text-sm font-black uppercase text-primary flex items-center justify-between group-hover/title:text-amber-700 transition-colors">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4" />
              {lang === 'en' ? 'Limited Deals' : '限時特惠'}
            </div>
            <ChevronRight className="h-4 w-4 opacity-50 group-hover/title:translate-x-1 transition-all" />
          </CardTitle>
        </Link>
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          {loading ? (
            <div className="py-20 text-center flex flex-col items-center justify-center h-full">
              <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
            </div>
          ) : !promos || promos.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground italic text-xs">No active promos</div>
          ) : (
            <div className="flex flex-col">
              {promos.map((promo) => (
                <div key={promo.id} className="p-4 border-b border-dashed last:border-0 hover:bg-muted/30 transition-all group relative">
                  <Link href={promo.targetUrl || "/shop"} className="block group/item">
                    <h4 className="font-bold text-xs md:text-sm leading-tight line-clamp-2 pr-6 group-hover/item:text-primary transition-colors">
                      {lang === 'en' ? (promo.name?.en || promo.name?.zh) : (promo.name?.zh || promo.name?.en)}
                    </h4>
                    <ChevronRight className="h-3 w-3 absolute top-5 right-4 opacity-0 group-hover/item:opacity-100 group-hover/item:translate-x-1 transition-all text-primary" />
                  </Link>
                  {promo.code && (
                    <div className="mt-2 flex items-center gap-2 bg-muted/50 p-1.5 rounded-lg border border-transparent group-hover:border-primary/20 group-hover:bg-white transition-all">
                      <code className="flex-1 font-mono text-[10px] font-black text-center">{promo.code}</code>
                      <Button size="icon" variant="ghost" className="h-6 w-6 hover:bg-primary hover:text-white rounded-md" onClick={() => handleCopyCode(promo.code)}>
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
