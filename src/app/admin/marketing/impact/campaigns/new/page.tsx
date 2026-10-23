
"use client";

import { PromotionFormContainer } from "@/components/admin/marketing/PromotionFormContainer";

/**
 * 管理員：新增公益聯乘活動頁面
 */
export default function AdminNewImpactCampaignPage() {
  const IMPACT_SKELETON = {
    name: { en: "", zh: "" },
    shortLabel: { en: "", zh: "" },
    code: "",
    type: "donation_only",
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
    isImpactCampaign: true,
    isStackable: true,
    eligibleTiers: ["classic", "gold", "platinum"],
    donationCharity: "",
    donationType: "fixed_per_order",
    donationValue: "0",
    isDonationActive: true
  };

  return (
    <PromotionFormContainer 
      mode="new" 
      initialData={IMPACT_SKELETON}
      isVendor={false} 
      isImpact={true} 
    />
  );
}
