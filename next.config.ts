import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  productionBrowserSourceMaps: false,
  generateEtags: false,
  poweredByHeader: false,
  compress: true,
  experimental: {
    webpackBuildWorker: false,
    parallelServerBuildTraces: false,
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
      // 方案 A：處理舊版 WordPress 路徑的重定向，修復 404 報錯並引導流量回商店
      {
        source: '/wp-content/:path*',
        destination: '/shop',
        permanent: true,
      },
      {
        source: '/wp-admin/:path*',
        destination: '/shop',
        permanent: true,
      },
      // 額外加固：處理舊版 Odoo 路徑的重定向 (例如 /web/static, /web/image)
      {
        source: '/web/:path*',
        destination: '/shop',
        permanent: true,
      },
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
    config.cache = {
      type: 'memory'
    };
    config.devtool = false;
    
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
