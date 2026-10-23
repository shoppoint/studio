import { initializeFirebase } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { format, addYears } from 'date-fns';

export const dynamic = 'force-dynamic';

/**
 * @fileOverview Meta (Facebook) 促銷活動摘要 (Promotion Feed - 官方標準版 V4)
 * 
 * 修正說明：
 * 1. 加入 amount_off / percent_off 欄位：讓 Facebook 廣告能自動產生折扣標籤。
 * 2. 校對有效日期格式：確保 T 與時區偏移量 (+08:00) 之間無空格。
 * 3. 增加最低消費限制欄位：對齊 GMC/Meta 規格。
 */

export async function GET() {
  try {
    const { db } = initializeFirebase();
    const todayStr = format(new Date(), "yyyy-MM-dd");

    const snapshot = await getDocs(query(
      collection(db, 'promotions'),
      where('status', '==', 'active'),
      where('isPublic', '==', true)
    ));

    let promotions = snapshot.docs
      .map(docSnap => {
        const p = docSnap.data();
        if (p.startsAt && p.startsAt > todayStr) return null;
        if (p.endsAt && p.endsAt < todayStr) return null;

        const title = `${p.name?.zh || p.name?.en || 'Special Offer'} | SHOP POINT`;
        
        // 格式：YYYY-MM-DDThh:mm:ss+hh:mm/YYYY-MM-DDThh:mm:ss+hh:mm
        const start = p.startsAt ? `${p.startsAt}T00:00:00+08:00` : format(new Date(), "yyyy-MM-dd'T'HH:mm:ss+08:00");
        const end = p.endsAt ? `${p.endsAt}T23:59:59+08:00` : format(addYears(new Date(), 1), "yyyy-MM-dd'T'HH:mm:ss+08:00");
        const effectiveDates = `${start}/${end}`;

        let offerType = p.code ? "GENERIC_CODE" : "NO_CODE";
        let applicability = p.targetType === 'all' ? "ALL_PRODUCTS" : "SPECIFIC_PRODUCTS";

        const val = Number(p.value) || 0;

        return {
          promotion_id: docSnap.id,
          product_applicability: applicability,
          offer_type: offerType,
          long_title: title,
          promotion_effective_dates: effectiveDates,
          redemption_channel: "online",
          promotion_destination: "Shopping_ads",
          generic_redemption_code: p.code || "",
          // 擴充折扣明細
          amount_off: p.type === 'fixed' ? `${val.toFixed(2)} HKD` : "",
          percent_off: (p.type === 'percentage' || p.type === 'qty_discount') ? val : "",
          minimum_purchase_amount: p.minSpend > 0 ? `${Number(p.minSpend).toFixed(2)} HKD` : ""
        };
      })
      .filter(p => p !== null);

    // 防止空檔案報錯
    if (promotions.length === 0) {
      promotions.push({
        promotion_id: "initial_setup_placeholder",
        product_applicability: "ALL_PRODUCTS",
        offer_type: "NO_CODE",
        long_title: "Welcome Offer | SHOP POINT",
        promotion_effective_dates: `${format(new Date(), "yyyy-MM-dd'T'00:00:00+08:00")}/${format(addYears(new Date(), 1), "yyyy-MM-dd'T'23:59:59+08:00")}`,
        redemption_channel: "online",
        promotion_destination: "Shopping_ads",
        generic_redemption_code: "",
        amount_off: "",
        percent_off: "",
        minimum_purchase_amount: ""
      });
    }

    const headers = [
      "promotion_id", "product_applicability", "offer_type", "long_title", 
      "promotion_effective_dates", "redemption_channel", "promotion_destination", 
      "generic_redemption_code", "amount_off", "percent_off", "minimum_purchase_amount"
    ];

    const csvSafe = (text: any) => {
      if (text === null || text === undefined) return "";
      const str = String(text).replace(/"/g, '""').replace(/\r?\n|\r/g, ' ').trim();
      return `"${str}"`;
    };

    const rows = promotions.map((p: any) => [
      csvSafe(p.promotion_id),
      csvSafe(p.product_applicability),
      csvSafe(p.offer_type),
      csvSafe(p.long_title),
      csvSafe(p.promotion_effective_dates),
      csvSafe(p.redemption_channel),
      csvSafe(p.promotion_destination),
      csvSafe(p.generic_redemption_code),
      csvSafe(p.amount_off),
      p.percent_off,
      csvSafe(p.minimum_purchase_amount)
    ].join(','));

    const csvContent = '\ufeff' + [headers.join(','), ...rows].join('\n');

    return new Response(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename=meta_promotions.csv',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store, max-age=0',
      },
    });
  } catch (error: any) {
    return new Response(`ERROR: ${error.message}`, { status: 500 });
  }
}
