import { initializeFirebase } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { findBestActivePromo, getPromoShortLabel, calculateDiscountForPromo } from '@/lib/shop-utils';
import { format, addDays } from 'date-fns';
import { HARDCODED_SHIPPING_ZONES } from '@/lib/constants/shipping-data';

export const dynamic = 'force-dynamic';

/**
 * @fileOverview Meta (Facebook) & GMC 商品資料摘要 (GMC 2024 高權重優化版 V7)
 * 
 * 優化重點：
 * 1. 豐富 description：自動提取成分、產地等資訊加入描述，提升搜尋匹配。
 * 2. 精準 availability：針對預購 (PreOrder) 正確填寫日期。
 * 3. 加入 custom_label：用於廣告分組與標籤顯示。
 * 4. 嚴格 PII 保護：絕不包含任何用戶資訊。
 */

export async function GET() {
  const baseUrl = 'https://shoppoint.hk';
  const lang = 'zh-HK';

  try {
    const { db } = initializeFirebase();

    const [catsSnap, promosSnap, prodsSnap] = await Promise.all([
      getDocs(collection(db, 'categories')),
      getDocs(query(collection(db, 'promotions'), where('status', '==', 'active'))),
      getDocs(query(collection(db, 'public_products'), where('status', '==', 'Active')))
    ]);

    const allCategories = catsSnap.docs.map(d => {
      const data = d.data();
      return { 
        id: d.id, 
        name_zh: data.name_zh,
        name_en: data.name_en,
        parentId: data.parentId
      };
    });
    const allPromos = promosSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));

    const hkZone = HARDCODED_SHIPPING_ZONES.find(z => z.countries.includes("Hong Kong"));
    const homeMethod = hkZone?.methods?.home_delivery;
    const homeFee = homeMethod?.fee || 30;
    const homeThreshold = homeMethod?.threshold || 300;

    const products = prodsSnap.docs.map(docSnap => {
      const p = docSnap.data() as any;
      const pid = docSnap.id;
      
      if (p.inStoreOnly === true) return null;

      // 1. 標題與語境描述優化 (Contextual Optimization)
      const feedTitle = p.productName_zh || p.seoTitle_zh || p.productName_en || 'Unnamed Product';
      
      let rawDesc = p.description_zh || p.seoDescription_zh || p.description_en || 'Quality product from SHOP POINT';
      let extendedDesc = rawDesc.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim(); 

      // 加入額外屬性提升搜尋權重
      if (p.nutrition?.energy_kcal) extendedDesc += ` [Calories: ${p.nutrition.energy_kcal}kcal]`;
      if (p.spec?.origin) extendedDesc += ` [Origin: ${p.spec.origin}]`;
      if (p.spec?.netWeight) extendedDesc += ` [Size: ${p.spec.netWeight}${p.spec.netWeightUnit || ''}]`;

      let productType = "";
      const pCats = Array.isArray(p.categories) ? p.categories : [p.categories];
      if (pCats.length > 0) {
        const catId = pCats[0];
        const path: string[] = [];
        let currentId = catId;
        let safety = 0;
        while (currentId && currentId !== 'none' && safety < 5) {
          const cid = currentId;
          const cat = allCategories.find(c => c.id === cid);
          if (cat) {
            path.unshift(cat.name_zh || cat.name_en || "");
            currentId = cat.parentId || null;
          } else { currentId = null; }
          safety++;
        }
        productType = path.join(' > ');
      }

      const primaryBrand = p.primaryBrand || (p.brands ? String(p.brands).split(',')[0].trim() : "SHOP POINT");
      
      const bestPromo = findBestActivePromo({ ...p, id: pid }, allPromos, allCategories);
      const promoId = bestPromo?.id || "";
      const promoLabel = getPromoShortLabel(bestPromo, lang);

      let finalSalePriceValue = (p.salePrice && p.salePrice > 0 && p.salePrice < p.price) ? Number(p.salePrice) : null;
      let saleEffectiveDate = "";

      if (bestPromo) {
        const promoCalc = calculateDiscountForPromo(bestPromo, [{ ...p, id: pid, qty: 1 }], p.price, null);
        const autoSalePrice = p.price - promoCalc.discount;
        if (autoSalePrice < p.price && (!finalSalePriceValue || autoSalePrice < finalSalePriceValue)) {
          finalSalePriceValue = autoSalePrice;
          const start = bestPromo.startsAt ? `${bestPromo.startsAt}T00:00:00+08:00` : format(new Date(), "yyyy-MM-dd'T'00:00:00+08:00");
          const end = bestPromo.endsAt ? `${bestPromo.endsAt}T23:59:59+08:00` : format(addDays(new Date(), 30), "yyyy-MM-dd'T'23:59:59+08:00");
          saleEffectiveDate = `${start}/${end}`;
        }
      }

      const priceStr = `${Number(p.price || 0).toFixed(2)} HKD`;
      const salePriceStr = finalSalePriceValue ? `${finalSalePriceValue.toFixed(2)} HKD` : "";

      const currentPriceForShipping = finalSalePriceValue || p.price;
      const shippingCost = currentPriceForShipping >= homeThreshold ? 0 : homeFee;
      const shippingStr = `HK:Standard:${shippingCost.toFixed(2)} HKD`;

      // 2. 狀態與供應日期優化
      let availability = 'in_stock';
      let availabilityDate = "";
      const stock = Number(p.onlineStock) || 0;
      if (p.inventoryPolicy === 'PreOrder') {
        availability = 'preorder';
        if (p.preOrderExpectedDate) availabilityDate = `${p.preOrderExpectedDate}T09:00+08:00`;
      } else if (stock <= 0) {
        availability = p.inventoryPolicy === 'Allow' ? 'backorder' : 'out_of_stock';
      }

      const hasBarcode = !!p.barcode && p.barcode.trim() !== "";
      const hasSku = !!p.sku && p.sku.trim() !== "";
      const identifierExists = (hasBarcode || hasSku) ? "yes" : "no";
      const isAdult = p.spec?.legalTags?.includes("令人醺醉的酒類") ? "yes" : "no";

      return {
        id: pid,
        title: feedTitle,
        description: extendedDesc.substring(0, 4990),
        link: `${baseUrl}/product/${p.slug || pid}`,
        image_link: p.imageUrl || `${baseUrl}/logo.png`,
        price: priceStr,
        sale_price: salePriceStr,
        sale_price_effective_date: saleEffectiveDate,
        availability: availability,
        availability_date: availabilityDate,
        quantity_to_sell_on_facebook: stock,
        brand: primaryBrand,
        gtin: p.barcode || "", 
        mpn: p.sku || pid,
        identifier_exists: identifierExists,
        adult: isAdult,
        condition: "new",
        google_product_category: p.googleProductCategory || "",
        product_type: productType,
        shipping: shippingStr,
        shipping_label: p.limitToPickup ? "PickupOnly" : (p.inventoryPolicy === 'PreOrder' ? "PreOrder" : "Standard"),
        feed_label: "HK",
        promotion_id: promoId,
        return_policy_label: "standard_7_day", // 匹配 Returns Page 的 Schema
        transit_time_label: "hk_standard_shipping",
        custom_label_0: promoLabel || "NONE",
        custom_label_1: p.isFeatured === 'Yes' ? "Featured" : "Regular",
        custom_label_2: p.isClearance ? "Clearance" : "FullPrice"
      };
    }).filter(Boolean);

    const headers = [
      "id", "title", "description", "link", "image_link", 
      "price", "sale_price", "sale_price_effective_date", 
      "availability", "availability_date", "quantity_to_sell_on_facebook", "brand", "gtin", "mpn", 
      "identifier_exists", "adult", "condition", "google_product_category", "product_type", "shipping", 
      "shipping_label", "feed_label", "promotion_id", "return_policy_label", "transit_time_label", 
      "custom_label_0", "custom_label_1", "custom_label_2"
    ];

    const csvSafe = (text: any) => {
      if (text === null || text === undefined) return "";
      const str = String(text).replace(/"/g, '""').replace(/\r?\n|\r/g, ' ').trim();
      return `"${str}"`;
    };

    const rows = products.map((p: any) => [
      csvSafe(p.id), csvSafe(p.title), csvSafe(p.description), csvSafe(p.link), csvSafe(p.image_link),
      csvSafe(p.price), csvSafe(p.sale_price), csvSafe(p.sale_price_effective_date), csvSafe(p.availability),
      csvSafe(p.availability_date), p.quantity_to_sell_on_facebook, csvSafe(p.brand), csvSafe(p.gtin), csvSafe(p.mpn),
      csvSafe(p.identifier_exists), csvSafe(p.adult), csvSafe(p.condition), csvSafe(p.google_product_category), csvSafe(p.product_type),
      csvSafe(p.shipping), csvSafe(p.shipping_label), csvSafe(p.feed_label), csvSafe(p.promotion_id),
      csvSafe(p.return_policy_label), csvSafe(p.transit_time_label), 
      csvSafe(p.custom_label_0), csvSafe(p.custom_label_1), csvSafe(p.custom_label_2)
    ].join(','));

    const csvContent = '\ufeff' + [headers.join(','), ...rows].join('\n');

    return new Response(csvContent, {
      status: 200,
      headers: { 
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename=shoppoint_feed.csv',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      },
    });
  } catch (error: any) {
    return new Response(`ERROR: ${error.message}`, { status: 500 });
  }
}
