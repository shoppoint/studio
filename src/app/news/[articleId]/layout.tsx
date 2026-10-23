import { Metadata, ResolvingMetadata } from 'next';

/**
 * @fileOverview 最新消息動態元數據極速優化版 (Field Masking REST API)
 * 修正：支援透過 Slug 進行精簡查詢，解決文章點擊後等待時間過長的問題。
 */

async function getArticleData(articleIdOrSlug: string) {
  const projectId = 'shoppoint-hk';
  const databaseId = 'shoppoint-hk';
  const baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents`;

  try {
    // 1. 先按 ID 查 (最快路徑)，僅抓取 SEO 必填欄位
    const idUrl = `${baseUrl}/articles/${articleIdOrSlug}?mask.fieldPaths=title&mask.fieldPaths=excerpt&mask.fieldPaths=coverImage&mask.fieldPaths=slug`;
    const idRes = await fetch(idUrl, { 
      next: { revalidate: 3600 },
      cache: 'force-cache'
    });
    
    if (idRes.ok) {
      const data = await idRes.json();
      return parseFields(data.fields);
    }

    // 2. 如果 ID 不中，按 Slug 執行精簡查詢
    const queryUrl = `${baseUrl}:runQuery`;
    const queryRes = await fetch(queryUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: 'articles' }],
          where: {
            fieldFilter: {
              field: { fieldPath: 'slug' },
              op: 'EQUAL',
              value: { stringValue: articleIdOrSlug }
            }
          },
          select: {
            fields: [
              { fieldPath: 'title' },
              { fieldPath: 'excerpt' },
              { fieldPath: 'coverImage' },
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
      if (queryData[0]?.document) {
        return parseFields(queryData[0].document.fields);
      }
    }
  } catch (e) {
    console.warn("[SEO] News Metadata fetch failed.");
  }
  return null;
}

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
  { params }: { params: Promise<{ articleId: string }> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { articleId } = await params;
  const article = await getArticleData(articleId);

  if (!article) {
    return { title: '最新消息 | SHOP POINT' };
  }

  const title = article.title?.zh || article.title?.en || 'SHOP POINT 最新消息';
  const description = (article.excerpt?.zh || article.excerpt?.en || '').substring(0, 150);
  const image = article.coverImage;

  return {
    title: title,
    description: description,
    openGraph: {
      title: title,
      description: description,
      images: image ? [{ url: image }] : [],
      type: 'article',
      siteName: 'SHOP POINT',
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: description,
      images: image ? [image] : [],
    },
  };
}

export default function ArticleLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
