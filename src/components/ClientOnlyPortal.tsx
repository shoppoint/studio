'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

/**
 * @fileOverview 客戶端傳送門組件 (穩定性修復版)
 * 修正：移除複雜的計時器，確保在單一生命週期內完成掛載，解決白屏問題。
 */

const MobileNav = dynamic(() => import('@/components/MobileNav').then(m => m.MobileNav), { ssr: false });
const SmartAssistant = dynamic(() => import('@/components/SmartAssistant').then(m => m.SmartAssistant), { ssr: false });
const PromotionModal = dynamic(() => import('@/components/PromotionModal').then(m => m.PromotionModal), { ssr: false });
const CookieConsent = dynamic(() => import('@/components/CookieConsent').then(m => m.CookieConsent), { ssr: false });

export function ClientOnlyPortal() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <>
      <MobileNav />
      <SmartAssistant />
      <PromotionModal />
      <CookieConsent />
    </>
  );
}
