import { main } from './en/main';
import { admin } from './en/admin';
import { pos } from './en/pos';
import { common } from './en/common';

/**
 * Aggregated English translations
 */
export const en = {
  ...main,
  pos,
  admin,
  common
};
