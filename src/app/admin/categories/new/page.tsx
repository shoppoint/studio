"use client";

import { CategoryFormContainer } from "@/components/admin/categories/CategoryFormContainer";

const CATEGORY_SKELETON = {
  name_en: "", name_zh: "", description_en: "", description_zh: "",
  slug: "", imageUrl: "", isVisible: true, displayOrder: 0, parentId: "none",
  seoTitle_en: "", seoTitle_zh: "", seoDescription_en: "", seoDescription_zh: "",
  keywords_en: "", keywords_zh: ""
};

export default function NewCategoryPage() {
  return <CategoryFormContainer mode="new" initialData={CATEGORY_SKELETON} />;
}
