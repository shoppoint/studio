'use server';

import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

/**
 * @fileOverview 資料庫維護服務 Action (Admin SDK 加固版)
 * 修正：將「市場傾向分析」與「購物路徑追蹤」納入統計摘要文件。
 */

function getAdminDb() {
  if (getApps().length === 0) {
    initializeApp();
  }
  return getFirestore("shoppoint-hk");
}

/**
 * 1. 帳戶清理：移除超過 30 天未活動的匿名訪客
 */
export async function cleanupAnonymousUsersAction() {
  try {
    const db = getAdminDb();
    const now = new Date();
    const threshold = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    const snap = await db.collection('users')
      .where('isAnonymous', '==', true)
      .where('updatedAt', '<', threshold)
      .limit(100)
      .get();
    
    if (snap.empty) return { success: true, count: 0 };

    const batch = db.batch();
    snap.docs.forEach(d => batch.delete(d.ref));
    await batch.commit();

    return { success: true, count: snap.size };
  } catch (e: any) {
    console.error("[Maintenance] User cleanup failed:", e.message);
    return { success: false, message: e.message };
  }
}

/**
 * 2. 遺棄購物車清理
 */
export async function cleanupOldAbandonedCartsAction() {
  try {
    const db = getAdminDb();
    const now = new Date();
    const threshold = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    
    const snap = await db.collection('abandoned_carts')
      .where('updatedAt', '<', threshold)
      .limit(200)
      .get();

    if (snap.empty) return { success: true, count: 0 };

    const batch = db.batch();
    let count = 0;
    snap.docs.forEach(d => {
      const data = d.data();
      if (!data.customer?.email && !data.customer?.phone) {
        batch.delete(d.ref);
        count++;
      }
    });
    
    if (count > 0) await batch.commit();
    return { success: true, count };
  } catch (e: any) {
    console.error("[Maintenance] Cart cleanup failed:", e.message);
    return { success: false, message: e.message };
  }
}

/**
 * 4. 核心優化：手動精算全站數據摘要 (Admin SDK 權限版)
 * 修正：強化市場傾向分析 (Demand) 與購物路徑追蹤。
 */
export async function rebuildStatsSummaryAction() {
  try {
    const db = getAdminDb();
    console.log("[Maintenance] Starting Full Stats Rebuild via Admin SDK...");

    // 抓取數據
    const [ordersSnap, productsSnap, catsSnap, brandsSnap, cartsSnap] = await Promise.all([
      db.collection('orders').orderBy('createdAt', 'desc').limit(1000).get(),
      db.collection('public_products').where('status', '==', 'Active').get(),
      db.collection('categories').get(),
      db.collection('brands').get(),
      db.collection('abandoned_carts').orderBy('updatedAt', 'desc').limit(200).get()
    ]);

    const channelStats: Record<string, number> = { Web: 0, POS: 0, Manual: 0 };
    const revenueMap = new Map();

    ordersSnap.docs.forEach(d => {
      const o = d.data();
      if (o.paymentStatus === 'paid' && o.status !== 'cancelled') {
        const gmv = Number(o.total) || 0;
        const source = o.sourceType || 'Web';
        channelStats[source] = (channelStats[source] || 0) + gmv;
        
        if (o.createdAt) {
          const dt = o.createdAt.toDate();
          const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
          const cur = revenueMap.get(key) || { gmv: 0, count: 0 };
          cur.gmv += gmv; cur.count += 1;
          revenueMap.set(key, cur);
        }
      }
    });

    const revenueTrend = Array.from(revenueMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6)
      .map(([name, data]) => ({ name, ...data }));
    
    const lowStockItems: any[] = [];
    const nearExpiryItems: any[] = [];
    const problematicProducts: any[] = [];
    const problematicCategories: any[] = [];
    const problematicBrands: any[] = [];
    let perfectCount = 0;
    const now = new Date();
    const expiryThreshold = new Date(now.getTime() + (90 * 24 * 60 * 60 * 1000));

    // --- 產品與質量審計 ---
    productsSnap.docs.forEach(d => {
      const p = d.data();
      const name = p.productName_zh || p.productName_en || "Unnamed";
      if (Number(p.onlineStock) < 10) lowStockItems.push({ id: d.id, name, qty: p.onlineStock });
      if (Array.isArray(p.batches)) {
        p.batches.forEach((b: any) => {
          if (b.expiryDate && new Date(b.expiryDate) < expiryThreshold && Number(b.quantity) > 0) {
            nearExpiryItems.push({ id: d.id, name, expiryDate: b.expiryDate, batchId: b.batchId });
          }
        });
      }
      const issues = [];
      if (!p.description_zh || !p.description_en) issues.push('content');
      if (!p.slug) issues.push('slug');
      if (!p.imageUrl) issues.push('media');
      if (!p.seoTitle_zh || !p.seoDescription_zh) issues.push('seo');
      if (!p.searchKeywordsRaw && !p.searchKeywordsRaw_en) issues.push('keywords');
      if (!p.googleProductCategory) issues.push('google_category');
      if (issues.length > 0) problematicProducts.push({ id: d.id, displayName: name, issues, entityType: 'product', subInfo: p.sku });
      else perfectCount++;
    });

    // --- 分類與品牌審計 ---
    catsSnap.docs.forEach(d => {
      const c = d.data();
      const issues = [];
      if (!c.slug) issues.push('slug');
      if (!c.description_zh && !c.description_en) issues.push('content');
      if (!c.imageUrl) issues.push('media');
      if (!c.seoTitle_zh || !c.seoDescription_zh) issues.push('seo');
      if (issues.length > 0) problematicCategories.push({ id: d.id, displayName: c.name_zh || d.id, issues, entityType: 'category' });
      else perfectCount++;
    });
    brandsSnap.docs.forEach(d => {
      const b = d.data();
      const issues = [];
      if (!b.slug) issues.push('slug');
      if (!b.description_zh && !b.description_en) issues.push('content');
      if (!b.logoUrl) issues.push('media');
      if (!b.seoTitle_zh || !b.seoDescription_zh) issues.push('seo');
      if (issues.length > 0) problematicBrands.push({ id: d.id, displayName: b.name_zh || d.id, issues, entityType: 'brand' });
      else perfectCount++;
    });

    // --- 市場傾向分析 (Demand) ---
    const abandonedItemsMap = new Map();
    const sourcePathMap = new Map();
    let cartTotalValue = 0;

    cartsSnap.docs.forEach(d => {
      const cart = d.data();
      cartTotalValue += (Number(cart.total) || 0);
      
      // 聚合來源路徑
      const path = cart.sourcePath || "/unknown";
      sourcePathMap.set(path, (sourcePathMap.get(path) || 0) + 1);

      // 聚合產品
      (cart.items || []).forEach((it: any) => {
        const id = it.productId || it.id;
        const cur = abandonedItemsMap.get(id) || { name: it.name, count: 0, value: 0 };
        cur.count += 1; cur.value += (Number(it.price) || 0) * (Number(it.qty) || 1);
        abandonedItemsMap.set(id, cur);
      });
    });

    const demandSummary = {
      avgAbandonedValue: cartsSnap.empty ? 0 : cartTotalValue / cartsSnap.size,
      totalSessions: cartsSnap.size,
      topItems: Array.from(abandonedItemsMap.values()).sort((a, b) => b.count - a.count).slice(0, 15),
      topSources: Array.from(sourcePathMap.entries()).map(([path, count]) => ({ path, count })).sort((a, b) => b.count - a.count).slice(0, 10)
    };

    const summary = {
      revenueTrend,
      channelDistribution: Object.entries(channelStats).map(([name, value]) => ({ name, value })),
      inventory: { lowStockCount: lowStockItems.length, nearExpiryCount: nearExpiryItems.length, lowStockItems, nearExpiryItems },
      health: { total: productsSnap.size + catsSnap.size + brandsSnap.size, perfect: perfectCount, problematicProducts, problematicCategories, problematicBrands },
      demand: demandSummary,
      lastUpdated: FieldValue.serverTimestamp()
    };

    await db.collection('config').doc('stats_summary').set(summary, { merge: true });
    return { success: true };
  } catch (e: any) {
    console.error("[Maintenance] Rebuild failed:", e.message);
    return { success: false, message: e.message };
  }
}
