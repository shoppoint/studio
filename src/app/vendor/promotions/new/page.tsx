
"use client";

import { PromotionFormContainer } from "@/components/admin/marketing/PromotionFormContainer";

/**
 * 賣家：新增促銷活動頁面 (送審制)
 */
export default function VendorNewPromotionPage() {
  const VENDOR_PROMO_SKELETON = {
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
    status: "pending",
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
      initialData={VENDOR_PROMO_SKELETON}
      isVendor={true} 
      isImpact={false} 
    />
  );
}
