
"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useFirestore, useDoc } from "@/firebase";
import { doc } from "firebase/firestore";
import { PromotionFormContainer } from "@/components/admin/marketing/PromotionFormContainer";

/**
 * 管理員：編輯公益聯乘活動頁面
 */
export default function AdminEditImpactCampaignPage() {
  const params = useParams();
  const db = useFirestore();
  const id = params.id as string;

  const promoRef = useMemo(() => {
    if (!db || !id) return null;
    return doc(db, 'promotions', id);
  }, [db, id]);

  const { data: promoData, loading } = useDoc<any>(promoRef);

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <PromotionFormContainer 
      mode="edit" 
      promoId={id} 
      initialData={promoData} 
      isVendor={false} 
      isImpact={true} 
    />
  );
}
