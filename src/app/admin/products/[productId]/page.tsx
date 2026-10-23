
"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useFirestore, useDoc } from "@/firebase";
import { doc } from "firebase/firestore";
import { ProductFormContainer } from "@/components/admin/products/ProductFormContainer";

export default function AdminEditProductPage() {
  const params = useParams();
  const db = useFirestore();
  const productId = params.productId as string;

  const productRef = useMemo(() => {
    if (!db || !productId) return null;
    return doc(db, 'public_products', productId);
  }, [db, productId]);

  const { data: productData, loading } = useDoc<any>(productRef);

  if (loading) {
    return <div className="h-96 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <ProductFormContainer 
      mode="edit" 
      productId={productId} 
      initialData={productData} 
      isVendor={false} 
    />
  );
}
