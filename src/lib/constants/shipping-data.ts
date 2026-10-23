/**
 * @fileOverview 全通路統一運送分區與方式數據 (Hardcoded Stability Mode)
 * 此檔案作為物流資料的單一事實來源，避開 Firestore 連線與權限問題。
 */

export interface ShippingMethod {
  name_zh: string;
  name_en: string;
  enabled: boolean;
  fee: number;
  threshold: number;
  collect: boolean;
  isPickup?: boolean;
  notes_zh: string;
  notes_en: string;
  locationIds?: string[];
}

export interface ShippingZone {
  id: string;
  name: string;
  countries: string[];
  type: string;
  methods: Record<string, ShippingMethod>;
}

export const HARDCODED_SHIPPING_ZONES: ShippingZone[] = [
  {
    id: '0R2XpskxRmepgZfAQ24z',
    name: 'Hong Kong (香港本地)',
    countries: ['Hong Kong'],
    type: 'zone',
    methods: {
      'sf_locker': { 
        name_zh: '順豐站／智能櫃', 
        name_en: 'SF Station / Locker', 
        enabled: true, 
        fee: 0, 
        threshold: 120, 
        collect: true, 
        notes_zh: '低於 $120 運費到付。滿 $120 即享免運費。',
        notes_en: 'Free over $120, otherwise Freight Collect.'
      },
      'hk_post': { 
        name_zh: '香港郵政智易取', 
        name_en: 'HK Post iPostal', 
        enabled: true, 
        fee: 13, 
        threshold: 100, 
        collect: false, 
        notes_zh: '送達指定智郵站或郵政局。滿 $100 即享免運費。',
        notes_en: 'Free over $100. Delivered to iPostal or Post Office.'
      },
      'sf_direct': { 
        name_zh: '順豐速遞 (直送)', 
        name_en: 'SF Express (Direct)', 
        enabled: true, 
        fee: 0, 
        threshold: 500, 
        collect: true, 
        notes_zh: '直送工商或住宅地址。滿 $500 即享免運費。',
        notes_en: 'Free over $500. Direct to your door.'
      },
      'home_delivery': { 
        name_zh: '宅配直送', 
        name_en: 'Home Delivery', 
        enabled: true, 
        fee: 30, 
        threshold: 300, 
        collect: false, 
        notes_zh: '由 SHOP POINT 安排運輸派送。滿 $300 免運費。',
        notes_en: 'Delivery arranged by SHOP POINT. Free shipping over $300.'
      },
      'pickup': { 
        name_zh: '門市自取', 
        name_en: 'In-store Pickup', 
        enabled: true, 
        fee: 0, 
        threshold: 0, 
        collect: false, 
        isPickup: true, 
        notes_zh: '請於收到通知後 3 個工作天內到屯門分店取貨。',
        notes_en: 'Pickup at Tuen Mun branch within 3 business days after notification.'
      }
    }
  },
  {
    id: 'XzePcRVqOOIYUfBopbfs',
    name: 'Macau (澳門地區)',
    countries: ['Macau'],
    type: 'zone',
    methods: {
      'sf_macau': { 
        name_zh: '順豐速遞 (澳門)', 
        name_en: 'SF Express (Macau)', 
        enabled: true, 
        fee: 0, 
        threshold: 0, 
        collect: true, 
        notes_zh: '全單運費到付。請確保填寫正確的澳門收貨資訊。',
        notes_en: 'Full order Freight Collect. Please ensure accurate delivery info.'
      }
    }
  },
  {
    id: 'oxhN1kwQ7KZgLroMMhGU',
    name: 'Taiwan (台灣地區)',
    countries: ['Taiwan'],
    type: 'zone',
    methods: {
      'sf_taiwan': { 
        name_zh: '順豐速遞 (台灣)', 
        name_en: 'SF Express (Taiwan)', 
        enabled: true, 
        fee: 0, 
        threshold: 0, 
        collect: true, 
        notes_zh: '收件人需於「EZ WAY 易利委」完成實名認證，運費到付。',
        notes_en: 'Requires EZ WAY real-name authentication. Freight Collect.'
      }
    }
  },
  {
    id: 'qkALiL8dDJQlk4dOxlhl',
    name: 'Overseas (海外地區)',
    countries: ['United Kingdom', 'USA', 'Canada', 'Australia', 'Japan', 'Singapore', 'Vietnam', 'Germany', 'France', 'Thailand'],
    type: 'zone',
    methods: {
      'intl_express': { 
        name_zh: '國際快遞 (手動報價)', 
        name_en: 'International Express (Quote Required)', 
        enabled: true, 
        fee: 0, 
        threshold: 0, 
        collect: false, 
        notes_zh: '下單後客服將根據重量聯絡您確認最終運費。',
        notes_en: 'Support will contact you for final quote after weighing.'
      }
    }
  },
  {
    id: 'wuQyWCx43S11Lq5xMb8N',
    name: 'Mainland China (中國內地)',
    countries: ['China'],
    type: 'zone',
    methods: {
      'sf_china': { 
        name_zh: '順豐速遞 (內地)', 
        name_en: 'SF Express (Mainland)', 
        enabled: true, 
        fee: 0, 
        threshold: 0, 
        collect: true, 
        notes_zh: '運費到付。寄往內地可能需要收件人提供身份證副本。',
        notes_en: 'Freight Collect. ID copy may be required for customs clearance.'
      }
    }
  }
];
