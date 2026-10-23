
"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useFirestore, useDoc } from "@/firebase";
import { doc } from "firebase/firestore";
import { PromotionFormContainer } from "@/components/admin/marketing/PromotionFormContainer";

/**
 * 管理員：編輯促銷活動頁面
 */
export default function AdminEditPromotionPage() {
  const params = useParams();
  const db = useFirestore();
  const promoId = params.promoId as string;

  const promoRef = useMemo(() => {
    if (!db || !promoId) return null;
    return doc(db, 'promotions', promoId);
  }, [db, promoId]);

  const { data: promoData, loading } = useDoc<any>(promoRef);

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <PromotionFormContainer 
      mode="edit" 
      promoId={promoId} 
      initialData={promoData} 
      isVendor={false} 
      isImpact={false} 
    />
  );
}
