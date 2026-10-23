/**
 * @fileOverview 全通路統一追蹤工具 (Google & Meta 行為優化版 V2)
 * 負責將電商事件轉換為標準格式。
 * 
 * 隱私保障：完全不傳送任何 PII（姓名、電郵、電話）。僅回傳行為與產品數值。
 */

export interface TrackingItem {
  item_id: string;
  item_name: string;
  price: number;
  quantity: number;
  item_brand?: string;
  item_category?: string;
  item_variant?: string;
}

export const trackEvent = (eventName: string, params?: Record<string, any>) => {
  const consent = typeof window !== 'undefined' ? localStorage.getItem('tracking-consent') : null;
  if (consent !== 'granted') return;

  // 1. Google Analytics (GA4)
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', eventName, params);
  }

  // 2. Facebook Pixel (自動映射標準事件)
  if (typeof window !== 'undefined' && (window as any).fbq) {
    const fbEvents: Record<string, string> = {
      'view_item': 'ViewContent',
      'add_to_cart': 'AddToCart',
      'purchase': 'Purchase',
      'begin_checkout': 'InitiateCheckout',
      'add_payment_info': 'AddPaymentInfo',
      'search': 'Search',
      'view_item_list': 'ViewContent'
    };
    const fbName = fbEvents[eventName] || eventName;
    
    const fbParams = {
      ...params,
      content_type: 'product',
      value: params?.value || params?.total,
      currency: params?.currency || 'HKD'
    };
    
    (window as any).fbq('track', fbName, fbParams);
  }
};

/**
 * 追蹤：瀏覽清單 (用於分類頁/首頁)
 */
export const trackViewItemList = (listName: string, items: any[]) => {
  trackEvent('view_item_list', {
    item_list_name: listName,
    items: items.slice(0, 10).map((it, idx) => ({
      item_id: it.id || it.productId,
      item_name: it.productName_zh || it.name,
      index: idx + 1,
      price: Number(it.salePrice || it.price)
    }))
  });
};

/**
 * 追蹤：開始結帳 (漏斗優化)
 */
export const trackBeginCheckout = (items: any[], value: number) => {
  trackEvent('begin_checkout', {
    currency: 'HKD',
    value: value,
    items: items.map(it => ({
      item_id: it.id,
      item_name: it.name,
      price: it.price,
      quantity: it.qty
    }))
  });
};

/**
 * 追蹤：提交付款資訊
 */
export const trackAddPaymentInfo = (paymentMethod: string, value: number) => {
  trackEvent('add_payment_info', {
    currency: 'HKD',
    value: value,
    payment_type: paymentMethod
  });
};

/**
 * 追蹤：購買轉換 (核心 ROAS，不傳 PII)
 */
export const trackPurchase = (order: any) => {
  if (!order) return;

  const items = (order.items || []).map((it: any) => ({
    item_id: it.productId || it.id,
    item_name: it.name,
    price: it.price,
    quantity: it.qty,
    item_brand: it.brand,
    item_category: Array.isArray(it.categories) ? it.categories[0] : it.categories
  }));

  trackEvent('purchase', {
    transaction_id: order.orderId || order.id,
    value: Number(order.total),
    currency: 'HKD',
    shipping: Number(order.shippingFee),
    tax: 0,
    items: items
  });
};

/**
 * 追蹤：產品瀏覽
 */
export const trackViewItem = (product: any) => {
  if (!product) return;
  
  trackEvent('view_item', {
    currency: 'HKD',
    value: Number(product.salePrice || product.price),
    items: [{
      item_id: product.id || product.productId,
      item_name: product.productName_zh || product.productName_en,
      price: product.salePrice || product.price,
      item_brand: product.primaryBrand || product.brands,
      item_category: Array.isArray(product.categories) ? product.categories[0] : product.categories
    }]
  });
};
