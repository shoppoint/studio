import { initializeFirebase } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { findBestActivePromo, getPromoShortLabel, calculateDiscountForPromo } from '@/lib/shop-utils';
import { HARDCODED_SHIPPING_ZONES } from '@/lib/constants/shipping-data';

/**
 * 數據摘要預覽 Action (對齊 GMC & Facebook 最新合規性 V17 - 已修復預購支持)
 */

export async function getFeedPreviewAction() {
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
    const homeThreshold = homeMethod?.threshold || 300;
    const homeFee = homeMethod?.fee || 30;

    const previewData = prodsSnap.docs.map(docSnap => {
      const p = docSnap.data() as any;
      if (p.inStoreOnly === true) return null;

      const feedTitle = p.productName_zh || p.seoTitle_zh || p.productName_en || 'Unnamed Product';
      const primaryBrand = p.primaryBrand || (p.brands ? String(p.brands).split(',')[0].trim() : "SHOP POINT");
      
      const bestPromo = findBestActivePromo({ ...p, id: docSnap.id }, allPromos, allCategories);
      let finalSalePriceValue = (p.salePrice > 0 && p.salePrice < p.price) ? Number(p.salePrice) : null;

      if (bestPromo) {
        const promoCalc = calculateDiscountForPromo(bestPromo, [{ ...p, id: docSnap.id, qty: 1 }], p.price, null);
        const autoPrice = p.price - promoCalc.discount;
        if (autoPrice < p.price && (!finalSalePriceValue || autoPrice < finalSalePriceValue)) {
          finalSalePriceValue = autoPrice;
        }
      }

      const itemPrice = finalSalePriceValue || p.price;
      const shippingValue = itemPrice >= homeThreshold ? 0 : homeFee;

      // 解析庫存狀態
      let availability = 'in_stock';
      if (p.inventoryPolicy === 'PreOrder') availability = 'preorder';
      else if (Number(p.onlineStock) <= 0) {
        availability = p.inventoryPolicy === 'Allow' ? 'backorder' : 'out_of_stock';
      }

      return {
        id: docSnap.id,
        sku: p.sku || "N/A",
        barcode: p.barcode || "N/A",
        brand: primaryBrand,
        title: feedTitle,
        price: `${Number(p.price).toFixed(2)} HKD`,
        sale_price: finalSalePriceValue ? `${finalSalePriceValue.toFixed(2)} HKD` : null,
        availability: availability,
        availability_date: p.preOrderExpectedDate ? `${p.preOrderExpectedDate}T09:00+08:00` : "",
        fb_quantity: Number(p.onlineStock) || 0,
        shipping: `HK:Standard:${shippingValue.toFixed(2)} HKD`,
        shipping_label: p.limitToPickup ? "PickupOnly" : (p.inventoryPolicy === 'PreOrder' ? "PreOrder" : "Standard"),
        feed_label: "HK",
        promo: getPromoShortLabel(bestPromo, 'zh-HK') || "None",
        is_adult: p.spec?.legalTags?.includes("令人醺醉的酒類") ? "YES" : "NO"
      };
    }).filter(Boolean);

    return { success: true, data: previewData };
  } catch (e: any) {
    console.error("[Feed Preview Action Error]", e.message);
    return { success: false, message: e.message || "Internal Server Error" };
  }
}
