
import { Metadata } from 'next';

type Props = {
  children: React.ReactNode;
};

export const dynamic = 'force-dynamic';

/**
 * 為商店列表提供標準網址標記
 * 解決 GSC 將不同參數的列表視為重複網頁的問題
 */
export async function generateMetadata(): Promise<Metadata> {
  const baseUrl = 'https://shoppoint.hk';

  return {
    title: '所有產品 | SHOP POINT',
    description: '瀏覽我們從世界各地為您搜羅的優質選物。',
    alternates: {
      canonical: `${baseUrl}/shop`,
    },
    openGraph: {
      title: '所有產品 | SHOP POINT',
      url: `${baseUrl}/shop`,
    }
  };
}

export default function ShopLayout({ children }: Props) {
  return <>{children}</>;
}
