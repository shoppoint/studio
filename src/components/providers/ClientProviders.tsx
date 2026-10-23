
'use client';

import { ReactNode, useEffect, useState } from 'react';
import Script from 'next/script';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { AuthInitializer } from '@/components/auth/AuthInitializer';
import { I18nProvider } from '@/lib/i18n/i18n-context';
import { CartProvider } from '@/lib/cart-context';
import { ShopDataProvider } from '@/lib/contexts/ShopDataContext';
import { ClientOnlyPortal } from '@/components/ClientOnlyPortal';
import { Toaster } from "@/components/ui/toaster";
import { getAiStatusAction } from "@/app/actions/ai-actions";
import { reCaptchaSiteKey } from "@/firebase/config";

/**
 * @fileOverview 客戶端 Provider 彙整組件 (全域預熱與安全腳本版)
 */
export function ClientProviders({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // 背景預熱全域 AI 容器 (用於搜尋、助理)
    if (process.env.NODE_ENV === 'production') {
      getAiStatusAction().catch(() => {});
    }
  }, []);

  return (
    <>
      {/* 注入 Google reCaptcha v3 腳本 (隱形驗證) */}
      <Script 
        src={`https://www.google.com/recaptcha/api.js?render=${reCaptchaSiteKey}`}
        strategy="afterInteractive"
      />
      
      <FirebaseClientProvider>
        <AuthInitializer />
        <I18nProvider>
          <ShopDataProvider>
            <CartProvider>
              <div className="flex flex-col min-h-screen pb-16 md:pb-0 transition-opacity duration-300">
                {!mounted ? (
                  <div className="h-screen w-full flex items-center justify-center bg-white">
                    <img src="/logo.png" className="h-12 w-12 animate-pulse" alt="Loading" />
                  </div>
                ) : (
                  <>
                    {children}
                    <ClientOnlyPortal />
                  </>
                )}
              </div>
              <Toaster />
            </CartProvider>
          </ShopDataProvider>
        </I18nProvider>
      </FirebaseClientProvider>
    </>
  );
}
