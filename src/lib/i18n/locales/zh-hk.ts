import { main } from './zh-hk/main';
import { admin } from './zh-hk/admin';
import { pos } from './zh-hk/pos';
import { common } from './zh-hk/common';

/**
 * Aggregated Traditional Chinese (Hong Kong) translations
 */
export const zhHK = {
  ...main,
  pos,
  admin,
  common
};
