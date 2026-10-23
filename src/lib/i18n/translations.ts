/**
 * @fileOverview 核心語系導出模組
 * 為了減輕單一檔案大小及 AI 上下文壓力，內容已拆分至 locales 子目錄。
 */
import { en } from "./locales/en";
import { zhHK } from "./locales/zh-hk";

export type TranslationKey = typeof en;
export type Language = "en" | "zh-HK";

export const translations = {
  en: en,
  "zh-HK": zhHK,
};
