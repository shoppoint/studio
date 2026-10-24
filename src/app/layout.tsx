import type {Metadata, Viewport} from 'next';
import './globals.css';
import { Inter } from 'next/font/google';
import NextTopLoader from 'nextjs-toploader';
import { Suspense } from 'react';
import { ClientProviders } from '@/components/providers/ClientProviders';
import { TrackingScripts } from '@/components/analytics/TrackingScripts';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

/**
 * 獲取行銷配置 (含網域驗證標籤)
 * 解決 Meta "找不到網站" 問題
 */
async function getMarketingConfig() {
  try {
    const { db } = initializeFirebase();
    const snap = await getDoc(doc(db, 'config', 'marketing'));
    return snap.exists() ? snap.data() : null;
  } catch (e) {
    return null;
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const config = await getMarketingConfig();
  const metaVerification = config?.metaVerificationCode || "";
  
  // 提取 content 部分 (如果填寫的是完整標籤)
  const verificationContent = metaVerification.includes('content="') 
    ? metaVerification.split('content="')[1].split('"')[0]
    : metaVerification;

  return {
    title: { 
      default: "SHOP POINT | 優質生活精品", 
      template: "%s | SHOP POINT" 
    },
    description: "穿梭世界各地尋找優質良品，願能細心打理您的生活所需，使溫暖的購物體驗與經營初心得以延續。",
    metadataBase: new URL('https://shoppoint.hk'),
    manifest: '/manifest.json',
    icons: { 
      icon: '/favicon.ico',
      apple: '/logo.png',
    },
    verification: {
      google: config?.googleSearchConsoleId || "",
      other: verificationContent ? {
        'facebook-domain-verification': verificationContent
      } : undefined
    }
  };
}

export const viewport: Viewport = {
  themeColor: '#FFD700',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  interactiveWidget: 'overlays-content',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-HK" className={inter.variable}>
      <head />
      <body className="font-body antialiased">
        <Suspense fallback={null}>
          <NextTopLoader 
            color="#FFD700"
            height={3}
            showSpinner={false}
            shadow={false}
          />
        </Suspense>
        <ClientProviders>
          <TrackingScripts />
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}
