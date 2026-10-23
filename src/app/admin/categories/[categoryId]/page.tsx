"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useFirestore, useDoc } from "@/firebase";
import { doc } from "firebase/firestore";
import { CategoryFormContainer } from "@/components/admin/categories/CategoryFormContainer";

export default function EditCategoryPage() {
  const params = useParams();
  const db = useFirestore();
  const categoryId = params.categoryId as string;

  const categoryRef = useMemo(() => {
    if (!db || !categoryId) return null;
    return doc(db, 'categories', categoryId);
  }, [db, categoryId]);

  const { data: categoryData, loading } = useDoc<any>(categoryRef);

  if (loading) {
    return <div className="h-96 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return <CategoryFormContainer mode="edit" categoryId={categoryId} initialData={categoryData} />;
}
