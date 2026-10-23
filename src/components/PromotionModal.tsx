
"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { X, ExternalLink, Zap, Loader2 } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { useFirestore, useDoc } from "@/firebase";
import { doc } from "firebase/firestore";

export function PromotionModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const db = useFirestore();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch real configuration from Firestore
  const configRef = useMemo(() => doc(db, 'config', 'marketing'), [db]);
  const { data: config, loading } = useDoc<any>(configRef);

  useEffect(() => {
    if (!mounted || loading || !config || !config.promoModalEnabled) return;

    // Version-based logic to decide if we should show it again
    const lastSeen = localStorage.getItem("last-promo-seen");
    const lastVersion = localStorage.getItem("last-promo-version");
    const now = new Date().getTime();
    const oneDay = 24 * 60 * 60 * 1000;

    // Current version from DB or fallback
    const currentVersion = config.promoModalVersion || "v1";

    const shouldShow = !lastSeen || 
                       (now - parseInt(lastSeen) > oneDay) || 
                       (lastVersion !== currentVersion);

    if (shouldShow) {
      const timer = setTimeout(() => {
        setIsOpen(true);
        localStorage.setItem("last-promo-seen", now.toString());
        localStorage.setItem("last-promo-version", currentVersion);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [config, loading, mounted]);

  if (!mounted || loading || !config || !config.promoModalEnabled || !config.promoModalImageUrl) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="p-0 border-none bg-transparent shadow-none sm:max-w-[450px] max-w-[90vw] overflow-visible">
        <DialogHeader className="sr-only">
          <DialogTitle>Seasonal Promotion</DialogTitle>
          <DialogDescription>Special announcement and seasonal offers for SHOP POINT customers.</DialogDescription>
        </DialogHeader>
        
        <div className="relative group">
          <button 
            onClick={() => setIsOpen(false)}
            className="absolute -top-12 -right-2 md:-right-12 text-white/80 hover:text-white transition-all bg-black/20 hover:bg-black/40 rounded-full p-2 z-[70]"
          >
            <X className="h-8 w-8" />
          </button>

          <Link href={config.promoModalLink || "/deals"} onClick={() => setIsOpen(false)}>
            <div className="relative aspect-[3/4] w-full rounded-[2.5rem] overflow-hidden shadow-[0_35px_60px_-15px_rgba(0,0,0,0.5)] border-4 border-white/10 ring-1 ring-white/20 animate-in zoom-in-95 duration-500">
              <Image 
                src={config.promoModalImageUrl} 
                alt="Promotion" 
                fill 
                className="object-cover"
                priority
              />
              
              <div className="absolute top-6 left-6">
                <div className="bg-primary text-primary-foreground px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest shadow-lg flex items-center gap-2">
                  <Zap className="h-3 w-3 fill-current animate-pulse" />
                  Limited Time
                </div>
              </div>

              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="bg-white/20 backdrop-blur-md rounded-full px-6 py-3 border border-white/30 text-white font-bold text-sm flex items-center gap-2 shadow-xl">
                  {config.promoModalLink?.startsWith('http') ? 'Visit Official Site' : 'View Details'}
                  <ExternalLink className="h-4 w-4" />
                </div>
              </div>
            </div>
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}
