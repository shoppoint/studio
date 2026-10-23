'use server';

import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { subDays, startOfDay, endOfDay, format, startOfYear } from 'date-fns';

/**
 * @fileOverview 訂單與銷售統計 Action - Admin SDK 權限加固版
 * 修正：強化伺服器端初始化，確保 Admin SDK 穩定繞過安全性規則執行統計。
 */

function getAdminDb() {
  if (getApps().length === 0) {
    initializeApp();
  }
  // 強制鎖定具名資料庫
  return getFirestore("shoppoint-hk");
}

interface UpdateOrderParams {
  orderId: string;
  updateData: any;
}

/**
 * 更新訂單基本資料
 */
export async function updateOrderAction(params: UpdateOrderParams) {
  const { orderId, updateData } = params;
  
  try {
    const db = getAdminDb();
    const orderRef = db.collection('orders').doc(orderId);
    
    await orderRef.update({
      ...updateData,
      updatedAt: Timestamp.now()
    });

    return { success: true };
  } catch (error: any) {
    console.error("[Admin Order Action Error]:", error.message);
    return { success: false, message: error.message };
  }
}

/**
 * 按需精算：多產品對比統計 (Admin 特權模式)
 */
export async function queryProductPerformanceAction(productIds: string[], startDateStr?: string, endDateStr?: string) {
  if (!productIds || productIds.length === 0) return { success: false, message: "No products specified" };

  try {
    const db = getAdminDb();
    const now = new Date();
    
    const start = startDateStr ? startOfDay(new Date(startDateStr)) : startOfYear(now);
    const end = endDateStr ? endOfDay(new Date(endDateStr)) : endOfDay(now);

    const sevenDaysAgo = startOfDay(subDays(now, 7));
    const thirtyDaysAgo = startOfDay(subDays(now, 30));

    // 使用 Admin SDK 執行大宗查詢
    const ordersRef = db.collection('orders');
    const snap = await ordersRef
      .where('createdAt', '>=', Timestamp.fromDate(start))
      .where('createdAt', '<=', Timestamp.fromDate(end))
      .orderBy('createdAt', 'desc')
      .get();
    
    const results: Record<string, any> = {};
    productIds.forEach(id => {
      results[id] = {
        totalQty: 0,
        monthQty: 0,
        weekQty: 0,
        totalRevenue: 0,
        trendData: new Map()
      };
      
      for (let i = 29; i >= 0; i--) {
        const d = format(subDays(now, i), 'MM-dd');
        results[id].trendData.set(d, 0);
      }
    });

    snap.docs.forEach(docSnap => {
      const order = docSnap.data();
      if (order.paymentStatus !== 'paid' || order.status === 'cancelled') return;

      const orderDate = order.createdAt.toDate();
      
      (order.items || []).forEach((it: any) => {
        const itId = String(it.productId || it.id || "").trim();
        
        if (results[itId]) {
          const q = Number(it.qty) || 0;
          const price = Number(it.price) || 0;
          
          results[itId].totalQty += q;
          results[itId].totalRevenue += (q * price);

          if (orderDate >= thirtyDaysAgo) {
            results[itId].monthQty += q;
            const dateKey = format(orderDate, 'MM-dd');
            if (results[itId].trendData.has(dateKey)) {
              results[itId].trendData.set(dateKey, results[itId].trendData.get(dateKey) + q);
            }
          }
          if (orderDate >= sevenDaysAgo) {
            results[itId].weekQty += q;
          }
        }
      });
    });

    const finalResults: Record<string, any> = {};
    Object.keys(results).forEach(id => {
      finalResults[id] = {
        ...results[id],
        trendData: Array.from(results[id].trendData.entries()).map((entry: any) => ({ 
          name: entry[0], 
          value: entry[1] 
        }))
      };
    });

    return { success: true, data: finalResults };
  } catch (error: any) {
    console.error("[Admin Performance Action Error]", error.message);
    return { success: false, message: error.message };
  }
}

/**
 * 獲取單一產品的詳細銷售統計 (Admin 特權模式)
 */
export async function getProductSalesStatsAction(productId: string) {
  if (!productId || productId === 'new') return { success: false, message: "Invalid Product ID" };

  try {
    const db = getAdminDb();
    const now = new Date();
    const thirtyDaysAgo = startOfDay(subDays(now, 30));
    const sevenDaysAgo = startOfDay(subDays(now, 7));

    const snap = await db.collection('orders')
      .orderBy('createdAt', 'desc')
      .limit(2000)
      .get();
    
    let totalQty = 0;
    let monthQty = 0;
    let weekQty = 0;
    let totalRevenue = 0;
    
    const dailyTrendMap = new Map();
    for (let i = 29; i >= 0; i--) {
      const d = format(subDays(now, i), 'MM-dd');
      dailyTrendMap.set(d, 0);
    }

    const targetPid = String(productId).trim();

    snap.docs.forEach(docSnap => {
      const order = docSnap.data();
      if (order.paymentStatus !== 'paid' || order.status === 'cancelled') return;

      const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date();
      
      (order.items || []).forEach((it: any) => {
        const itId = String(it.productId || it.id || "").trim();
        
        if (itId === targetPid) {
          const q = Number(it.qty) || 0;
          const price = Number(it.price) || 0;
          
          totalQty += q;
          totalRevenue += (q * price);

          if (orderDate >= thirtyDaysAgo) {
            monthQty += q;
            const dateKey = format(orderDate, 'MM-dd');
            if (dailyTrendMap.has(dateKey)) {
              dailyTrendMap.set(dateKey, (dailyTrendMap.get(dateKey) || 0) + q);
            }
          }
          if (orderDate >= sevenDaysAgo) {
            weekQty += q;
          }
        }
      });
    });

    return {
      success: true,
      stats: {
        totalQty,
        monthQty,
        weekQty,
        totalRevenue,
        trendData: Array.from(dailyTrendMap.entries()).map((entry: any) => ({ 
          name: entry[0], 
          value: entry[1] 
        }))
      }
    };
  } catch (error: any) {
    console.error("[Admin Sales Action Error]", error.message);
    return { success: false, message: error.message };
  }
}
