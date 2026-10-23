import { MetadataRoute } from 'next';

/**
 * Next.js 15 標準 Robots API (成本與 SEO 平衡優化版)
 * 
 * 修正策略：
 * 1. 針對解決 Gemini API 費用暴增問題，加入 '/*?q=*' 封鎖規則。
 * 2. 允許爬蟲抓取實體頁面（如 /product/[slug]），維持 SEO 權重。
 * 3. 禁止爬蟲點擊帶有搜尋參數的網址，從源頭防止觸發 AI 向量生成（Embedding）。
 * 4. 確保 Sitemap 路徑對所有爬蟲開放。
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: [
        '/',
        '/shop',         
        '/product/',      
        '/categories',
        '/deals',
        '/clearance',
        '/news/',
        '/about',
        '/contact',
        '/gifts',
        '/new-arrivals',
        '/recommendations',
        '/sitemap.xml'
      ],
      disallow: [
        '/*?q=*',        
        '/*?brand=*',    
        '/admin/', 
        '/vendor/', 
        '/api/', 
        '/checkout/', 
        '/cart', 
        '/profile',
        '/wishlist',
        '/*_next/', 
      ],
    },
    sitemap: 'https://shoppoint.hk/sitemap.xml',
  };
}
