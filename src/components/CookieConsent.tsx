
"use client";

import { useState, useEffect } from "react";
import { useI18n } from "@/lib/i18n/i18n-context";
import { Button } from "@/components/ui/button";
import { ShieldCheck, X } from "lucide-react";

export function CookieConsent() {
  const { t } = useI18n();
  const [show, setShow] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const consent = localStorage.getItem("tracking-consent");
    if (!consent) {
      setShow(true);
    }
  }, []);

  const handleConsent = (status: "granted" | "denied") => {
    localStorage.setItem("tracking-consent", status);
    setShow(false);
    // Reload to initialize tracking if granted
    if (status === "granted") {
      window.location.reload();
    }
  };

  if (!mounted || !show) return null;

  return (
    <div className="fixed bottom-20 md:bottom-8 left-4 right-4 md:left-auto md:right-8 md:max-w-sm z-[100] animate-in slide-in-from-bottom-10 duration-500">
      <div className="bg-white border border-primary/20 shadow-2xl rounded-2xl p-4 sm:p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
        
        <div className="flex items-start gap-3 sm:gap-4">
          <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
            <ShieldCheck className="h-4 w-4 sm:h-6 sm:w-6" />
          </div>
          <div className="space-y-2 sm:space-y-3">
            <h4 className="font-bold text-sm sm:text-lg leading-tight">{t.privacy_consent.title}</h4>
            <p className="text-[11px] sm:text-sm text-muted-foreground leading-relaxed line-clamp-3 sm:line-clamp-none">
              {t.privacy_consent.description}
            </p>
            <div className="flex gap-2 pt-1 sm:pt-2">
              <Button 
                size="sm" 
                className="h-8 sm:h-9 bg-primary text-primary-foreground font-bold text-[10px] sm:text-sm px-3 sm:px-4"
                onClick={() => handleConsent("granted")}
              >
                {t.privacy_consent.accept}
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="h-8 sm:h-9 text-[10px] sm:text-xs px-3 sm:px-4"
                onClick={() => handleConsent("denied")}
              >
                {t.privacy_consent.decline}
              </Button>
            </div>
          </div>
          <button 
            onClick={() => setShow(false)}
            className="absolute top-3 right-3 text-muted-foreground hover:text-foreground p-1"
          >
            <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
