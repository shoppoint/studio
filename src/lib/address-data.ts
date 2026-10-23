import data from './address-data.json';

/**
 * @fileOverview 全港地址數據結構 (從 JSON 載入以優化編譯效能)
 */
export const HK_ADDRESS_DATA: Record<string, Record<string, string[]>> = data.HK_ADDRESS_DATA;

/**
 * 中文大區映射
 */
export const AREA_NAME_MAP: Record<string, string> = data.AREA_NAME_MAP;

/**
 * 區份名稱中文映射
 */
export const DISTRICT_NAME_MAP: Record<string, string> = data.DISTRICT_NAME_MAP;

/**
 * 分區名稱中文映射 (Sub-districts)
 */
export const SUB_DISTRICT_NAME_MAP: Record<string, string> = data.SUB_DISTRICT_NAME_MAP;

/**
 * 全球國家/地區清單 (共享資源)
 */
export const COUNTRIES: string[] = data.COUNTRIES;

/**
 * 國家名稱中文映射
 */
export const COUNTRY_NAME_MAP: Record<string, string> = data.COUNTRY_NAME_MAP;

/**
 * 物流網點地區名稱轉換
 */
export const AREA_MAP: Record<string, string> = data.AREA_MAP;
