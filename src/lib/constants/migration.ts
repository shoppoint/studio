/**
 * @fileOverview 數據遷移共享常量 (優化版)
 * 已移除靜態數據 locations_hkpost 與 locations_sf
 */

export const MIGRATION_LIST = [
  'users',
  'vendors',
  'public_products',
  'categories',
  'brands',
  'orders',
  'abandoned_carts',
  'articles',
  'blog_posts',
  'communication_logs',
  'config',
  'enquiries',
  'global_notifications',
  'inventory',
  'locations',
  'notification_history',
  'notification_templates',
  'pos_sessions',
  'promotions',
  'register_sessions',
  'rewards',
  'settings',
  'shipping_zones',
  'stock_alerts',
  'subscribers'
];

export const SUB_COLLECTIONS: Record<string, string[]> = {
  'users': ['addresses', 'wishlist', 'notifications'],
  'public_products': ['reviews']
};
