
import { initializeFirebase } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

export const dynamic = 'force-dynamic';

/**
 * @fileOverview Google Merchant Center 在地庫存摘要 (Local Inventory Feed) - 加固版
 * 
 * 修正說明：
 * 1. 取消 type='physical' 的強制過濾，改為：只要有填寫 gmcStoreCode 且為 Active 的地點均會產出。
 * 2. 確保 store_code 與 item_id 欄位符合 GMC 規範，解決 GBP 連接失敗問題。
 * 3. 優化庫存狀態代碼。
 */

export async function GET() {
  try {
    const { db } = initializeFirebase();

    // 1. 抓取所有活躍地點 (不再限制類型，增加相容性)
    const lSnap = await getDocs(query(
      collection(db, 'locations'), 
      where('status', '==', 'Active')
    ));
    
    const storeMap = new Map();
    lSnap.docs.forEach(docSnap => {
      const data = docSnap.data();
      const code = (data.gmcStoreCode || "").trim();
      // 關鍵：只有定義了 GMC Code 的地點才會出現在在地庫存清單中
      if (code) {
        storeMap.set(docSnap.id, code);
      }
    });

    // 2. 如果完全沒設定商店代碼，回傳空表頭
    if (storeMap.size === 0) {
      console.warn("[GMC Local Feed] No stores found with gmcStoreCode.");
      return new Response("store_code,item_id,quantity,availability,price,sale_price", {
        headers: { 
          'Content-Type': 'text/csv; charset=utf-8',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    // 3. 抓取所有上架產品
    const pSnap = await getDocs(query(
      collection(db, 'public_products'), 
      where('status', '==', 'Active')
    ));

    const inventoryItems: any[] = [];

    pSnap.docs.forEach(docSnap => {
      const p = docSnap.data();
      const itemId = docSnap.id;
      const warehouseStock = p.warehouseStock || {};
      
      // 使用 Shelf Price 或 Sale Price 作為在地價格
      const evalPrice = p.shelfPrice || p.salePrice || p.price || 0;
      const originalPriceStr = `${Number(p.price || 0).toFixed(2)} HKD`;
      const evalPriceStr = `${Number(evalPrice).toFixed(2)} HKD`;

      storeMap.forEach((gmcCode, internalId) => {
        // 取得該分店的特定庫存
        const qtyNum = Number(warehouseStock[internalId]) || 0;
        
        let availability = 'out_of_stock';
        
        if (p.inventoryPolicy === 'PreOrder') {
          // 預購商品在在地庫存中標註為可展示但需訂購
          availability = 'on_display_to_order';
        } else if (qtyNum > 0) {
          availability = 'in_stock';
        } else if (p.inventoryPolicy === 'Allow') {
          // 允許超賣的產品若無庫存，在地店面通常標註為可訂購
          availability = 'on_display_to_order';
        }
        
        inventoryItems.push({
          store_code: gmcCode, 
          item_id: itemId,       
          quantity: qtyNum,
          availability: availability,
          price: originalPriceStr,
          sale_price: evalPriceStr
        });
      });
    });

    const headers = ["store_code", "item_id", "quantity", "availability", "price", "sale_price"];
    
    const csvSafe = (val: any) => {
      if (val === null || val === undefined) return "";
      const str = String(val).replace(/"/g, '""').trim();
      return `"${str}"`;
    };

    const rows = inventoryItems.map(item => {
      return [
        csvSafe(item.store_code),
        csvSafe(item.item_id),
        item.quantity,
        csvSafe(item.availability),
        csvSafe(item.price),
        csvSafe(item.sale_price)
      ].join(',');
    });

    // 移除 BOM，使用純淨的 CSV 內容以提升 Google 兼容性
    const csvContent = [headers.join(','), ...rows].join('\n');

    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename=local_inventory.csv',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      },
    });
  } catch (error: any) {
    console.error("[GMC Local Feed Error]", error.message);
    return new Response(`ERROR: ${error.message}`, { status: 500 });
  }
}
