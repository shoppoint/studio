/**
 * @fileOverview 通訊系統共享類型定義
 */

export type BlockType = 
  | 'logo' | 'hero' | 'text' | 'products' | 'button' | 'footer' 
  | 'order_meta' | 'order_summary' | 'shipping_address' | 'billing_address' | 'customer_details' 
  | 'shipping_details' | 'pickup_point' | 'membership_upgrade' 
  | 'stock_notice' | 'coupon' | 'abandoned_cart' | 'social_links';

export interface EmailBlock {
  id: string;
  type: BlockType;
  data: any;
}

export interface LangContent {
  emailSubject: string;
  emailBlocks: EmailBlock[];
  whatsappMsg: string;
  inAppMsg: string;
  pushMsg: string;
}
