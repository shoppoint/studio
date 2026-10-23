"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useFirestore, useDoc } from "@/firebase";
import { doc } from "firebase/firestore";
import { ArticleFormContainer } from "@/components/admin/articles/ArticleFormContainer";

export default function EditArticlePage() {
  const params = useParams();
  const db = useFirestore();
  const articleId = params.articleId as string;

  const articleRef = useMemo(() => {
    if (!db || !articleId) return null;
    return doc(db, 'articles', articleId);
  }, [db, articleId]);

  const { data: articleData, loading } = useDoc<any>(articleRef);

  if (loading) {
    return <div className="h-96 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return <ArticleFormContainer mode="edit" articleId={articleId} initialData={articleData} />;
}
