"use client";

import { BrandFormContainer } from "@/components/admin/brands/BrandFormContainer";

/**
 * @fileOverview 新增品牌頁面 - 加入製造商連動欄位預設值
 */

const BRAND_SKELETON = {
  name_en: "", 
  name_zh: "", 
  description_en: "", 
  description_zh: "",
  logoUrl: "", 
  slug: "", 
  websiteUrl: "", 
  categories: [], 
  status: "Active",
  // 製造商連動欄位
  mfrName_zh: "",
  mfrName_en: "",
  mfrAddress_zh: "",
  mfrAddress_en: "",
  seoTitle_en: "", 
  seoTitle_zh: "", 
  seoDescription_en: "", 
  seoDescription_zh: "",
  keywords_en: "", 
  keywords_zh: ""
};

export default function NewBrandPage() {
  return <BrandFormContainer mode="new" initialData={BRAND_SKELETON} />;
}
