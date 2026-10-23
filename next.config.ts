import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  productionBrowserSourceMaps: false,
  generateEtags: false,
  poweredByHeader: false,
  compress: true,
  experimental: {
    // 關閉可能導致 Chunk 遺失的並行編譯選項，提升環境穩定性
    webpackBuildWorker: false,
    parallelServerBuildTraces: false,
    // 僅保留必要的重型套件優化
    optimizePackageImports: ['recharts', 'date-fns', 'framer-motion'],
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'shoppoint-hk.firebasestorage.app',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
      },
    ],
  },
  serverExternalPackages: [
    'genkit',
    '@genkit-ai/core',
    '@genkit-ai/google-genai',
    '@genkit-ai/next',
    'gaxios',
    'google-auth-library',
    'resend',
    'firebase-admin'
  ],
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async redirects() {
    return [
      {
        source: '/order-tracking',
        destination: '/faq',
        permanent: true,
      },
      {
        source: '/wishlist',
        destination: '/',
        permanent: true,
      },
      {
        source: '/admin/pos',
        destination: '/pos',
        permanent: true,
      },
      // 將 Catalog API 跳轉集中至設定檔，提升路由效率
      {
        source: '/api/catalog/feed',
        destination: '/api/catalog/feed.csv',
        permanent: true,
      },
      {
        source: '/api/catalog/local-inventory',
        destination: '/api/catalog/local-inventory.csv',
        permanent: true,
      },
      {
        source: '/api/catalog/promotions',
        destination: '/api/catalog/promotions.csv',
        permanent: true,
      },
    ];
  },
  webpack: (config, { isServer }) => {
    // 強化快取穩定性，防止 ENOSPC 錯誤
    config.cache = {
      type: 'memory'
    };
    config.devtool = false;
    
    // 解決部分環境下模組解析路徑過長或衝突的問題
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };

    return config;
  }
};

export default nextConfig;
