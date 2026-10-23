
import { addDays, format } from "date-fns";

/**
 * @fileOverview 商店工具庫 (搜尋優化與統一引擎版 - V3 權重排序)
 */

/**
 * 根據所選的分類 ID，遞迴找出所有子分類的 ID 與中英文名稱。
 */
export function getExpandedCriteria(selectedIds: string[], allCategories: any[]) {
  if (!allCategories || !Array.isArray(allCategories) || selectedIds.length === 0) {
    return { ids: selectedIds, names: [] as string[] };
  }

  const resultIds = [...selectedIds];
  const resultNames: string[] = [];
  const queue = [...selectedIds];

  selectedIds.forEach(id => {
    const cat = allCategories.find(c => String(c.id) === String(id));
    if (cat) {
      if (cat.name_zh) resultNames.push(String(cat.name_zh));
      if (cat.name_en) resultNames.push(String(cat.name_en));
    }
  });

  while (queue.length > 0) {
    const currentId = queue.shift();
    const children = allCategories.filter(c => 
      String(c.parentId) === String(currentId) || 
      (currentId === "none" && (!c.parentId || c.parentId === "" || c.parentId === "none"))
    );

    children.forEach(child => {
      const cid = String(child.id);
      if (!resultIds.includes(cid)) {
        resultIds.push(cid);
        if (child.name_zh) resultNames.push(String(child.name_zh));
        if (child.name_en) resultNames.push(String(child.name_en));
        queue.push(cid);
      }
    });
  }

  return { 
    ids: Array.from(new Set(resultIds.map(id => String(id)))), 
    names: Array.from(new Set(resultNames.map(n => String(n)))) 
  };
}

/**
 * 產生產品全域搜尋索引字串 (核心精準化版)
 */
export function generateProductSearchIndex(product: any, allCategories: any[]): string {
  if (!product) return "";
  const parts: string[] = [];
  
  const safeStr = (val: any): string => {
    if (val === null || val === undefined) return "";
    return String(val).trim();
  };

  if (product.productName_zh) parts.push(safeStr(product.productName_zh));
  if (product.productName_en) parts.push(safeStr(product.productName_en));
  if (product.sku) parts.push(safeStr(product.sku));
  if (product.barcode) parts.push(safeStr(product.barcode));
  if (product.primaryBrand) parts.push(safeStr(product.primaryBrand));
  if (product.brands) parts.push(safeStr(product.brands));
  
  const pCats = Array.isArray(product.categories) ? product.categories : [product.categories];
  if (Array.isArray(allCategories)) {
    pCats.forEach((catId: any) => {
      let currentId: string | null = safeStr(catId);
      let safetyGuard = 0;
      while (currentId && safetyGuard < 5) {
        const targetId: string = currentId; 
        const cat = allCategories.find(c => String(c.id) === String(targetId));
        if (cat) {
          if (cat.name_zh) parts.push(safeStr(cat.name_zh));
          if (cat.name_en) parts.push(safeStr(cat.name_en));
          currentId = (cat.parentId && cat.parentId !== "none" && cat.parentId !== "") ? safeStr(cat.parentId) : null;
        } else {
          currentId = null;
        }
        safetyGuard++;
      }
    });
  }

  if (product.searchKeywordsRaw) parts.push(safeStr(product.searchKeywordsRaw).replace(/,/g, ' '));
  if (product.searchKeywordsRaw_en) parts.push(safeStr(product.searchKeywordsRaw_en).replace(/,/g, ' '));
  if (product.spec?.origin) parts.push(safeStr(product.spec.origin));

  const uniqueParts = Array.from(new Set(parts.map(p => safeStr(p).toLowerCase()).filter(p => p.length > 0)));
  return uniqueParts.join(" ");
}

/**
 * 計算搜尋得分 (權重邏輯)
 */
export function calculateSearchScore(product: any, tokens: string[]): number {
  if (tokens.length === 0) return 0;
  let score = 0;
  const nameZh = String(product.productName_zh || "").toLowerCase();
  const nameEn = String(product.productName_en || "").toLowerCase();
  const sku = String(product.sku || "").toLowerCase();
  const barcode = String(product.barcode || "").toLowerCase();
  const index = String(product.searchIndex || "").toLowerCase();
  
  tokens.forEach(token => {
    // 極高權重：精確匹配 SKU 或 條碼
    if (sku === token || barcode === token) score += 500;
    // 高權重：名稱完全匹配
    else if (nameZh === token || nameEn === token) score += 200;
    // 中權重：包含關鍵字
    if (sku.includes(token)) score += 80;
    if (nameZh.includes(token) || nameEn.includes(token)) score += 70;
    if (index.includes(token)) score += 30;
  });
  return score;
}

/**
 * 統一搜尋過濾引擎 (Ranked OR Logic)
 * 修正：將嚴格 AND 改為 OR + 權重排序，提升「靈敏度」。
 */
export function unifiedSearchFilter(products: any[], queryStr: string) {
  if (!queryStr.trim()) return products;
  const tokens = queryStr.toLowerCase().trim().split(/\s+/);
  
  return products
    .filter(p => {
      const index = String(p.searchIndex || "").toLowerCase();
      const name = (String(p.productName_zh || "") + " " + String(p.productName_en || "")).toLowerCase();
      const sku = String(p.sku || "").toLowerCase();
      const barcode = String(p.barcode || "").toLowerCase();
      
      // 只要匹配到任何一個 token 即可 (OR Logic)
      return tokens.some(token => 
        index.includes(token) || 
        name.includes(token) || 
        sku.includes(token) || 
        barcode.includes(token)
      );
    })
    .map(p => ({ 
      ...p, 
      _searchScore: calculateSearchScore(p, tokens) 
    }))
    // 按得分降序排列
    .sort((a, b) => (b._searchScore || 0) - (a._searchScore || 0));
}

export function getPromoShortLabel(p: any, lang: string): string {
  if (!p) return "";
  const isEn = lang.startsWith('en');
  const lKey = isEn ? 'en' : 'zh';
  if (p.shortLabel && p.shortLabel[lKey]) return p.shortLabel[lKey];
  const val = Number(p.value) || 0;
  if (p.type === 'percentage') return isEn ? `${val}% OFF` : `${10 - val / 10} 折`;
  if (p.type === 'fixed') return isEn ? `$${val} OFF` : `立減 $${val}`;
  if (p.type === 'cash_coupon') return isEn ? `$${val} CASH` : `$${val} 現金券`;
  if (p.type === 'buy_x_get_y') {
    const bX = Number(p.buyX) || 1; const gY = Number(p.getY) || 1; const dY = Number(p.discountOnY) || 100;
    if (dY === 100) return isEn ? `Buy ${bX} Get ${gY} FREE` : `買 ${bX} 送 ${gY}`;
    return isEn ? `Buy ${bX}, Get 2nd ${dY}% OFF` : `即享第 2 件 ${10 - dY/10} 折`;
  }
  if (p.type === 'qty_discount') return isEn ? `${Number(p.minQty) || 2}pcs ${val}% OFF` : `${Number(p.minQty) || 2} 件 ${10 - val / 10} 折`;
  if (p.type === 'case_discount') {
    const q = Number(p.minQty) || 1; const ct = p.caseDiscountType || 'fixed_price';
    if (ct === 'fixed_price') return isEn ? `${q}pcs for $${val}` : `${q}件 $${val}`;
    if (ct === 'amount_off') return isEn ? `$${val} OFF every ${q}pcs` : `每 ${q} 件減 $${val}`;
    return isEn ? `${val}% OFF every ${q}pcs` : `每 ${q} 件享 ${10 - val/10} 折`;
  }
  if (p.type === 'points_multiplier') return isEn ? `${p.pointsMultiplier}x Points` : `${p.pointsMultiplier} 倍積分`;
  return p.name?.[lKey] || p.name?.zh || p.name?.en || "Offer";
}

export function getPromoPriceLabel(product: any, promo: any, lang: string): string {
  if (!product || !promo) return "";
  if (promo.type === 'cash_coupon' || promo.type === 'points_multiplier') return ""; 
  const isEn = lang.startsWith('en');
  const price = product.salePrice > 0 ? product.salePrice : product.price;
  const val = Number(promo.value) || 0;
  if (promo.type === 'percentage' || promo.type === 'qty_discount') return isEn ? `Net $${(price * (1 - val / 100)).toFixed(1)}` : `折實價 $${(price * (1 - val / 100)).toFixed(1)}`;
  if (promo.type === 'fixed') return isEn ? `Net $${(price - val).toFixed(1)}` : `折實價 $${(price - val).toFixed(1)}`;
  return "";
}

/**
 * 核心折扣計算邏輯 (加強版：實現「無等級限制即全開放」邏輯)
 */
export function calculateDiscountForPromo(p: any, activeItems: any[], subtotalVal: number, userData?: any) {
  // 1. 身份識別：明確區分客、新會員 (classic)
  const userTier = (userData?.tier || 'guest').toLowerCase();
  const userEmail = (userData?.email || "").toLowerCase().trim();

  // 2. 指定使用者電郵授權校核
  if (p.restrictedToEmail && p.restrictedToEmail.trim()) {
    const allowedEmails = p.restrictedToEmail.toLowerCase().split(',').map((e: string) => e.trim()).filter(Boolean);
    if (!userEmail || !allowedEmails.includes(userEmail)) {
      return { discount: 0, donation: 0, isPayment: false };
    }
  }

  // 3. 等級限制校核 (修正：僅在 eligibleTiers 有內容時才過濾)
  if (p.eligibleTiers && Array.isArray(p.eligibleTiers) && p.eligibleTiers.length > 0) {
    const normalizedEligible = p.eligibleTiers.map((t: string) => t.toLowerCase());
    if (!normalizedEligible.includes(userTier)) {
      return { discount: 0, donation: 0, isPayment: false };
    }
  }

  const applicableItems = activeItems.filter(item => {
    if (p.targetType === 'all') return true;
    if (p.targetType === 'product') return p.targetIds?.includes(item.id);
    
    if (p.targetType === 'brand') {
      const itemBrand = (item.brand || "").toLowerCase().trim();
      const itemCollabs = Array.isArray(item.collabBrands) ? item.collabBrands.map((b: string) => b.toLowerCase().trim()) : [];
      
      return p.targetIds?.some((targetBrand: string) => {
        const tb = targetBrand.toLowerCase().trim();
        return tb === itemBrand || itemCollabs.includes(tb);
      });
    }

    if (p.targetType === 'category') return (Array.isArray(item.categories) ? item.categories : []).some((cat: any) => p.targetIds?.includes(String(cat)));
    return false;
  });

  if (applicableItems.length === 0 && p.type !== 'cash_coupon') return { discount: 0, donation: 0, isPayment: false };
  
  const totalQty = applicableItems.reduce((acc, it) => acc + it.qty, 0);
  const applicableSubtotal = applicableItems.reduce((acc, it) => acc + (it.price * it.qty), 0);

  if (p.type !== 'cash_coupon' && totalQty < (Number(p.minQty) || 0)) return { discount: 0, donation: 0, isPayment: false };
  if (subtotalVal < (Number(p.minSpend) || 0)) return { discount: 0, donation: 0, isPayment: false };

  let discount = 0;
  let isPayment = false;
  const val = Number(p.value) || 0;
  
  switch (p.type) {
    case 'percentage': 
    case 'qty_discount': discount = (applicableSubtotal * val) / 100; break;
    case 'fixed': discount = val; break;
    case 'cash_coupon': 
      discount = val; 
      isPayment = true; 
      break;
    case 'case_discount':
      const cQty = Number(p.minQty) || 1; const cType = p.caseDiscountType || 'fixed_price';
      const avg = applicableSubtotal / totalQty; const numCases = Math.floor(totalQty / cQty);
      if (numCases > 0) {
        if (cType === 'fixed_price') discount = (avg * cQty - val) * numCases;
        else if (cType === 'amount_off') discount = val * numCases;
        else if (cType === 'percent_off') discount = (avg * cQty * val / 100) * numCases;
      }
      break;
    case 'buy_x_get_y':
      const bX = Number(p.buyX) || 1; const gY = Number(p.getY) || 1; const sets = Math.floor(totalQty / (bX + gY));
      if (sets > 0) {
        const avgP = applicableSubtotal / totalQty; const dY = Number(p.discountOnY) || 100; const fY = Number(p.fixedPriceY) || 0;
        if (fY > 0) discount = (avgP - fY) * sets * gY; else discount = (avgP * (dY / 100)) * sets * gY;
      }
      break;
  }

  let donation = 0;
  if (p.isDonationActive) {
    const dVal = Number(p.donationValue) || 0;
    if (p.donationType === 'fixed_per_order') donation = dVal;
    else if (p.donationType === 'percent_of_total') donation = (subtotalVal * dVal) / 100;
    else if (p.donationType === 'fixed_per_item') donation = totalQty * dVal;
  }

  return { discount: Math.max(0, discount), donation, isPayment };
}

export function findBestActivePromo(product: any, allPromos: any[] | null, categories: any[] | null) {
  if (!product || !allPromos || allPromos.length === 0) return null;
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const dayOfWeek = new Date().getDay(); const dayOfMonth = new Date().getDate();
  const matches = allPromos.filter(p => {
    if (p.status !== 'active' || p.code || p.isPublic === false) return false; 
    if (p.startsAt && p.startsAt > todayStr) return false;
    if (p.endsAt && p.endsAt < todayStr) return false;
    if (p.recurrenceType === 'weekly' && Number(p.recurrenceValue) !== dayOfWeek) return false;
    if (p.recurrenceType === 'monthly' && Number(p.recurrenceValue) !== dayOfMonth) return false;
    if (p.targetType === 'all') return true;
    const pCats = Array.isArray(product.categories) ? product.categories : [product.categories];
    const pBrand = (product.primaryBrand || "").trim().toLowerCase();
    const pCollabs = Array.isArray(product.collabBrands) ? product.collabBrands.map((b: string) => b.toLowerCase().trim()) : [];

    if (p.targetType === 'category') return pCats.some((catId: any) => getExpandedCriteria(p.targetIds || [], categories || []).ids.includes(String(catId)));
    
    if (p.targetType === 'brand') {
      return p.targetIds?.some((targetBrand: string) => {
        const tb = targetBrand.toLowerCase().trim();
        return tb === pBrand || pCollabs.includes(tb);
      });
    }

    if (p.targetType === 'product') return p.targetIds?.includes(product.id);
    return false;
  });
  if (matches.length === 0) return null;
  return matches.sort((a, b) => (a.type === 'percentage' ? 100 : 50) - (b.type === 'percentage' ? 100 : 50))[0];
}

/**
 * 獲取所有適用的活動促銷 (加強版：實現「無等級限制即全開放」邏輯)
 */
export function findAllActivePromos(product: any, allPromos: any[] | null, categories: any[] | null, userData?: any) {
  if (!product || !allPromos || allPromos.length === 0) return [];
  const todayStr = format(new Date(), "yyyy-MM-dd");
  const userEmail = (userData?.email || "").toLowerCase().trim();
  const userTier = (userData?.tier || 'guest').toLowerCase();

  return allPromos.filter(p => {
    if (p.status !== 'active' || p.code) return false; 
    
    if (p.restrictedToEmail && p.restrictedToEmail.trim()) {
      const allowed = p.restrictedToEmail.toLowerCase().split(',').map((e:string)=>e.trim()).filter(Boolean);
      if (!userEmail || !allowed.includes(userEmail)) return false;
    }

    if (p.isPublic === false) return false;

    // 關鍵修正：僅在 eligibleTiers 有設定時才過濾等級。若為空，則開放給所有人 (包括 guest)。
    if (p.eligibleTiers && p.eligibleTiers.length > 0) {
      if (!p.eligibleTiers.map((t:string)=>t.toLowerCase()).includes(userTier)) return false;
    }

    if (p.startsAt && p.startsAt > todayStr) return false;
    if (p.endsAt && p.endsAt < todayStr) return false;
    
    if (p.targetType === 'all') return true;
    const pCats = Array.isArray(product.categories) ? product.categories : [product.categories];
    const pBrand = (product.primaryBrand || "").trim().toLowerCase();
    const pCollabs = Array.isArray(product.collabBrands) ? product.collabBrands.map((b: string) => b.toLowerCase().trim()) : [];

    if (p.targetType === 'category') return pCats.some((catId: any) => getExpandedCriteria(p.targetIds || [], categories || []).ids.includes(String(catId)));
    
    if (p.targetType === 'brand') {
      return p.targetIds?.some((targetBrand: string) => {
        const tb = targetBrand.toLowerCase().trim();
        return tb === pBrand || pCollabs.includes(tb);
      });
    }

    if (p.targetType === 'product') return p.targetIds?.includes(product.id);
    return false;
  }).sort((a, b) => (b.value || 0) - (a.value || 0));
}

/**
 * 修正：清貨判定邏輯加入庫存校對。
 */
export function calculateIsClearance(p: any): boolean {
  if (!p) return false;
  const threeMonthsFromNow = addDays(new Date(), 90);
  
  const hasNearExpiryBatchWithStock = Array.isArray(p.batches) && p.batches.some((b: any) => {
    if (!b || !b.expiryDate || (Number(b.quantity) || 0) <= 0) return false;
    try { 
      const expiry = new Date(String(b.expiryDate)); 
      return !isNaN(expiry.getTime()) && expiry < threeMonthsFromNow; 
    } catch (e) { return false; }
  });
  
  const originalPrice = Number(p.price) || 0; 
  const salePrice = Number(p.salePrice) || 0;
  const hasDeepDiscount = salePrice > 0 && originalPrice > 0 && ((originalPrice - salePrice) / originalPrice) > 0.25;
  
  return !!(hasNearExpiryBatchWithStock || hasDeepDiscount);
}

export function getProductEmbeddingText(p: any): string {
  const name = String(p.productName_zh || p.productName_en || "");
  const brand = String(p.brands || p.primaryBrand || "");
  const desc = String(p.description_zh || p.description_en || "").replace(/<[^>]*>?/gm, '');
  return `${name} ${brand} ${desc} ${p.searchKeywordsRaw || ""} ${p.searchKeywordsRaw_en || ""}`.trim().substring(0, 1000);
}
