import { MetadataRoute } from 'next';
import { initializeFirebase } from '@/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

/**
 * @fileOverview 動態 Sitemap 生成器 (SEO 加固版)
 * 修正說明：
 * 1. 從靜態寫死改為動態從 Firestore 抓取數據。
 * 2. 包含所有 Active 狀態的產品、品牌、文章及分類。
 * 3. 確保 Google Search Console 能發現全站所有深層網頁。
 */

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://shoppoint.hk';
  const { db } = initializeFirebase();

  // 1. 基礎靜態路徑
  const staticRoutes: MetadataRoute.Sitemap = [
    '',
    '/shop',
    '/categories',
    '/deals',
    '/clearance',
    '/news',
    '/about',
    '/contact',
    '/gifts',
    '/new-arrivals',
    '/recommendations',
    '/payment-methods',
    '/shipping',
    '/returns',
    '/faq'
  ].map(route => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: route === '' ? 1.0 : 0.8,
  }));

  try {
    // 2. 動態產品路徑 (抓取最近 1000 件以防超時)
    const productsSnap = await getDocs(query(
      collection(db, 'public_products'), 
      where('status', '==', 'Active'),
      limit(1000)
    ));
    
    const productRoutes = productsSnap.docs.map(docSnap => {
      const p = docSnap.data();
      return {
        url: `${baseUrl}/product/${p.slug || docSnap.id}`,
        lastModified: p.updatedAt?.toDate ? p.updatedAt.toDate() : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      };
    });

    // 3. 動態品牌路徑
    const brandsSnap = await getDocs(query(
      collection(db, 'brands'), 
      where('status', '==', 'Active')
    ));
    
    const brandRoutes = brandsSnap.docs.map(docSnap => {
      const b = docSnap.data();
      return {
        url: `${baseUrl}/brands/${b.slug || docSnap.id}`,
        lastModified: b.updatedAt?.toDate ? b.updatedAt.toDate() : new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.6,
      };
    });

    // 4. 動態消息文章路徑
    const articlesSnap = await getDocs(query(
      collection(db, 'articles'), 
      where('status', '==', 'published')
    ));
    
    const articleRoutes = articlesSnap.docs.map(docSnap => {
      const a = docSnap.data();
      return {
        url: `${baseUrl}/news/${docSnap.id}`,
        lastModified: a.createdAt?.toDate ? a.createdAt.toDate() : new Date(),
        changeFrequency: 'monthly' as const,
        priority: 0.5,
      };
    });

    // 5. 動態分類路徑
    const categoriesSnap = await getDocs(query(
      collection(db, 'categories'), 
      where('isVisible', '==', true)
    ));
    
    const categoryRoutes = categoriesSnap.docs.map(docSnap => {
      const c = docSnap.data();
      // 使用 slug 或 ID，並排除分頁參數以保持 Canonical 潔淨
      return {
        url: `${baseUrl}/shop?category=${c.slug || docSnap.id}`,
        lastModified: c.updatedAt?.toDate ? c.updatedAt.toDate() : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.6,
      };
    });

    return [
      ...staticRoutes,
      ...productRoutes,
      ...categoryRoutes,
      ...brandRoutes,
      ...articleRoutes,
    ];

  } catch (error) {
    console.error("[Sitemap] Dynamic fetch failed, fallback to static:", error);
    return staticRoutes;
  }
}
