'use client';

import Script from 'next/script';
import { useMemo } from 'react';
import { useFirestore, useDoc } from '@/firebase';
import { doc } from 'firebase/firestore';

/**
 * @fileOverview 延遲追蹤腳本組件 - 修正 Meta 數據集 ID (V3 - 官方片段對齊版)
 */
export function TrackingScripts() {
  const db = useFirestore();
  const configRef = useMemo(() => db ? doc(db, 'config', 'marketing') : null, [db]);
  const { data: config } = useDoc<any>(configRef);

  // 優先使用資料庫設定，否則使用截圖中的正確 ID 作為最終備援
  const fbPixelId = config?.fbPixelId || "520412129153804";
  const gaId = config?.gaId || "G-Y2DJLPLS3K";

  return (
    <>
      {/* 1. Google Analytics (GA4) */}
      <Script
        id="gtag-base"
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
      />
      <Script id="gtag-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaId}', {
            page_path: window.location.pathname,
          });
        `}
      </Script>

      {/* 2. Facebook Pixel / Meta Dataset - 對齊官方標準片段 */}
      <Script id="fb-pixel" strategy="afterInteractive">
        {`
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${fbPixelId}'); 
          fbq('track', 'PageView');
        `}
      </Script>
      <noscript>
        <img 
          height="1" 
          width="1" 
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${fbPixelId}&ev=PageView&noscript=1`}
        />
      </noscript>
    </>
  );
}
