"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useFirestore, useDoc } from "@/firebase";
import { doc } from "firebase/firestore";
import { BrandFormContainer } from "@/components/admin/brands/BrandFormContainer";

export default function EditBrandPage() {
  const params = useParams();
  const db = useFirestore();
  const brandId = params.brandId as string;

  const brandRef = useMemo(() => {
    if (!db || !brandId) return null;
    return doc(db, 'brands', brandId);
  }, [db, brandId]);

  const { data: brandData, loading } = useDoc<any>(brandRef);

  if (loading) {
    return <div className="h-96 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return <BrandFormContainer mode="edit" brandId={brandId} initialData={brandData} />;
}
