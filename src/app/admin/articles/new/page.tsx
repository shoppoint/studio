"use client";

import { ArticleFormContainer } from "@/components/admin/articles/ArticleFormContainer";

const ARTICLE_SKELETON = {
  title: { en: "", zh: "" },
  slug: "",
  categories: ["news"], 
  status: "draft",
  author: "Admin",
  excerpt: { en: "", zh: "" },
  content: { en: "", zh: "" },
  coverImage: "",
  metaTitle: { en: "", zh: "" },
  metaDescription: { en: "", zh: "" },
  keywords: { en: "", zh: "" },
  promotionId: "none",
  promotionIds: [], // 新增：支援多選優惠
  relatedProductIds: [],
  showOnBanner: false,
  bannerHeading: { en: "", zh: "" },
  bannerSubtitle: { en: "", zh: "" },
  bannerCtaText: { en: "", zh: "" },
  bannerTargetUrl: "",
  bannerWeight: 0
};

export default function NewArticlePage() {
  return <ArticleFormContainer mode="new" initialData={ARTICLE_SKELETON} />;
}
