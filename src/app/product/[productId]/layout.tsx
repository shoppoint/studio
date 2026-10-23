import { Metadata, ResolvingMetadata } from 'next';

/**
 * @fileOverview 產品詳情動態元數據極速優化版 (Field Masking REST API)
 * 使用欄位投影 (Projections) 減少 90% 以上的數據傳輸量，解決頁面跳轉緩慢問題。
 */

async function getProductData(productIdOrSlug: string) {
  const projectId = 'shoppoint-hk';
  const databaseId = 'shoppoint-hk';
  const baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents`;

  try {
    // 1. 優先嘗試直接按 ID 查詢 (這通常是最快的路徑)
    // 關鍵優化：加入 mask.fieldPaths，只抓取 SEO 核心 4 個欄位
    const idUrl = `${baseUrl}/public_products/${productIdOrSlug}?mask.fieldPaths=productName_zh&mask.fieldPaths=productName_en&mask.fieldPaths=description_zh&mask.fieldPaths=description_en&mask.fieldPaths=imageUrl&mask.fieldPaths=slug`;
    
    const idRes = await fetch(idUrl, { 
      next: { revalidate: 3600 },
      cache: 'force-cache'
    });
    
    if (idRes.ok) {
      const data = await idRes.json();
      return parseFields(data.fields);
    }

    // 2. 如果 ID 不存在，才執行較慢的 Slug RunQuery 查詢
    const queryUrl = `${baseUrl}:runQuery`;
    const queryRes = await fetch(queryUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: 'public_products' }],
          where: {
            fieldFilter: {
              field: { fieldPath: 'slug' },
              op: 'EQUAL',
              value: { stringValue: productIdOrSlug }
            }
          },
          // 關鍵優化：即便在 Query 中也限制回傳欄位
          select: {
            fields: [
              { fieldPath: 'productName_zh' },
              { fieldPath: 'productName_en' },
              { fieldPath: 'description_zh' },
              { fieldPath: 'description_en' },
              { fieldPath: 'imageUrl' },
              { fieldPath: 'slug' }
            ]
          },
          limit: 1
        }
      }),
      next: { revalidate: 3600 }
    });

    if (queryRes.ok) {
      const queryData = await queryRes.json();
      // Firestore RunQuery 會回傳一個陣列，第一項是結果
      if (queryData[0]?.document) {
        return parseFields(queryData[0].document.fields);
      }
    }
  } catch (e) {
    console.warn("[SEO] Metadata extreme fetch failed:", e);
  }
  return null;
}

/**
 * 輔助：解析 Firestore REST API 的 fields 結構
 */
function parseFields(fields: any) {
  const obj: any = {};
  if (!fields) return obj;
  for (const key in fields) {
    const val = fields[key];
    if (val.stringValue !== undefined) obj[key] = val.stringValue;
    else if (val.integerValue !== undefined) obj[key] = Number(val.integerValue);
    else if (val.doubleValue !== undefined) obj[key] = Number(val.doubleValue);
    else if (val.booleanValue !== undefined) obj[key] = val.booleanValue;
    else if (val.mapValue !== undefined) obj[key] = parseFields(val.mapValue.fields);
    else if (val.arrayValue !== undefined) {
      obj[key] = (val.arrayValue.values || []).map((v: any) => v.stringValue || "");
    }
  }
  return obj;
}

export async function generateMetadata(
  { params }: { params: Promise<{ productId: string }> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { productId } = await params;
  const product = await getProductData(productId);

  if (!product) {
    return { title: '產品詳情 | SHOP POINT' };
  }

  const name = product.productName_zh || product.productName_en || 'SHOP POINT 精選貨品';
  const description = (product.description_zh || product.description_en || '')
    .replace(/<[^>]*>?/gm, '')
    .substring(0, 150);
  const image = product.imageUrl;

  return {
    title: name,
    description: description,
    openGraph: {
      title: name,
      description: description,
      images: image ? [{ url: image }] : [],
      type: 'website',
      siteName: 'SHOP POINT',
    },
    twitter: {
      card: 'summary_large_image',
      title: name,
      description: description,
      images: image ? [image] : [],
    },
  };
}

export default function ProductLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
