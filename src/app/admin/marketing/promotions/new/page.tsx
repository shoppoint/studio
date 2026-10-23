
"use client";

import { PromotionFormContainer } from "@/components/admin/marketing/PromotionFormContainer";

/**
 * 管理員：新增促銷活動頁面
 */
export default function AdminNewPromotionPage() {
  const PROMO_SKELETON = {
    name: { en: "", zh: "" },
    shortLabel: { en: "", zh: "" },
    code: "",
    type: "percentage",
    scope: "both",
    targetType: "all",
    targetIds: [],
    targetUrl: "/shop",
    value: "0",
    minSpend: "0",
    minQty: "1",
    status: "active",
    startsAt: "",
    endsAt: "",
    isPublic: true,
    isImpactCampaign: false,
    isStackable: true,
    eligibleTiers: ["classic", "gold", "platinum"],
    isDonationActive: false
  };

  return (
    <PromotionFormContainer 
      mode="new" 
      initialData={PROMO_SKELETON}
      isVendor={false} 
      isImpact={false} 
    />
  );
}
