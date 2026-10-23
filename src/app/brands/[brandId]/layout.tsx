
import { Metadata, ResolvingMetadata } from 'next';

/**
 * @fileOverview 品牌專頁動態元數據加固 (REST API 版)
 */

async function getBrandData(brandIdOrSlug: string) {
  const projectId = 'shoppoint-hk';
  const databaseId = 'shoppoint-hk';
  const baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents`;

  try {
    // 1. 按 ID
    const idRes = await fetch(`${baseUrl}/brands/${brandIdOrSlug}`, { next: { revalidate: 3600 } });
    if (idRes.ok) {
      const data = await idRes.json();
      return parseFields(data.fields);
    }

    // 2. 按 Slug
    const queryUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents:runQuery`;
    const queryRes = await fetch(queryUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: 'brands' }],
          where: {
            fieldFilter: {
              field: { fieldPath: 'slug' },
              op: 'EQUAL',
              value: { stringValue: brandIdOrSlug }
            }
          },
          limit: 1
        }
      })
    });

    if (queryRes.ok) {
      const queryData = await queryRes.json();
      if (queryData[0]?.document) {
        return parseFields(queryData[0].document.fields);
      }
    }
  } catch (e) {}
  return null;
}

function parseFields(fields: any) {
  const obj: any = {};
  if (!fields) return obj;
  for (const key in fields) {
    const val = fields[key];
    if (val.stringValue !== undefined) obj[key] = val.stringValue;
    else if (val.mapValue !== undefined) obj[key] = parseFields(val.mapValue.fields);
  }
  return obj;
}

export async function generateMetadata(
  { params }: { params: Promise<{ brandId: string }> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { brandId } = await params;
  const brand = await getBrandData(brandId);

  if (!brand) return { title: '品牌專頁 | SHOP POINT' };

  const name = brand.name_zh || brand.name_en || 'SHOP POINT 合作夥伴';
  const description = (brand.description_zh || brand.description_en || '').substring(0, 150);
  const image = brand.logoUrl;

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
    }
  };
}

export default function BrandLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
