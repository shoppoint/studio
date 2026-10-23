"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { 
  MessageCircle, 
  Search, 
  Trash2, 
  Star, 
  ExternalLink, 
  Loader2,
  Filter,
  CheckCircle2,
  AlertCircle,
  FileText,
  Package,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { useI18n } from "@/lib/i18n/i18n-context";
import { useFirestore, useCollection } from "@/firebase";
import { collection, doc, deleteDoc, query, orderBy } from "firebase/firestore";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ReviewManagementPage() {
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const db = useFirestore();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("products");

  // 1. 產品評論
  const productReviewsQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'global_reviews'), orderBy('createdAt', 'desc'));
  }, [db]);
  const { data: productReviews, loading: productsLoading } = useCollection<any>(productReviewsQuery);

  // 2. 文章留言
  const articleCommentsQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'global_article_comments'), orderBy('createdAt', 'desc'));
  }, [db]);
  const { data: articleComments, loading: articlesLoading } = useCollection<any>(articleCommentsQuery);

  const filteredProductReviews = useMemo(() => {
    if (!productReviews) return [];
    return productReviews.filter(r => 
      (r.comment || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.productName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.authorName || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [productReviews, searchQuery]);

  const filteredArticleComments = useMemo(() => {
    if (!articleComments) return [];
    return articleComments.filter(r => 
      (r.content || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.articleTitle || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.authorName || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [articleComments, searchQuery]);

  const handleDeleteProductReview = async (review: any) => {
    if (!db) return;
    if (!confirm(lang === 'en' ? "Permanently delete this review?" : "確定永久刪除此評論？")) return;
    try {
      await deleteDoc(doc(db, 'global_reviews', review.id));
      await deleteDoc(doc(db, 'public_products', review.productId, 'reviews', review.id));
      toast({ title: "產品評論已刪除" });
    } catch (e) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `global_reviews/${review.id}`, operation: 'delete' }));
    }
  };

  const handleDeleteArticleComment = async (comment: any) => {
    if (!db) return;
    if (!confirm(lang === 'en' ? "Permanently delete this comment?" : "確定永久刪除此留言？")) return;
    try {
      await deleteDoc(doc(db, 'global_article_comments', comment.id));
      await deleteDoc(doc(db, 'articles', comment.articleId, 'comments', comment.id));
      toast({ title: "文章留言已刪除" });
    } catch (e) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({ path: `global_article_comments/${comment.id}`, operation: 'delete' }));
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black font-headline tracking-tight">評論與留言管理</h1>
          <p className="text-muted-foreground">統一監控全站產品評價及文章讀者留言。</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-muted/50 p-1 h-12 rounded-2xl w-full sm:w-auto grid grid-cols-2 mb-8 border">
          <TabsTrigger value="products" className="rounded-xl px-8 font-bold gap-2"><Package className="h-4 w-4" /> 產品評論 ({productReviews?.length || 0})</TabsTrigger>
          <TabsTrigger value="articles" className="rounded-xl px-8 font-bold gap-2"><FileText className="h-4 w-4" /> 文章留言 ({articleComments?.length || 0})</TabsTrigger>
        </TabsList>

        <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden mb-6">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="搜尋關鍵字、標題或用戶..." className="pl-10 h-11 bg-muted/20 border-none rounded-xl" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <TabsContent value="products">
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
            <CardContent className="p-0">
              {productsLoading ? <div className="py-24 text-center"><Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" /></div> : filteredProductReviews.length === 0 ? <div className="py-24 text-center text-muted-foreground italic">暫無產品評論。</div> : (
                <Table>
                  <TableHeader className="bg-muted/5"><TableRow><TableHead className="pl-8">用戶</TableHead><TableHead>評分</TableHead><TableHead className="w-[300px]">內容</TableHead><TableHead>產品</TableHead><TableHead>時間</TableHead><TableHead className="text-right pr-8">操作</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {filteredProductReviews.map((rev) => (
                      <TableRow key={rev.id} className="group hover:bg-muted/30">
                        <TableCell className="pl-8 py-5"><span className="font-bold text-xs">{rev.authorName}</span></TableCell>
                        <TableCell><div className="flex gap-0.5">{Array.from({ length: 5 }).map((_, i) => (<Star key={i} className={cn("h-3 w-3", i < rev.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground/20")} />))}</div></TableCell>
                        <TableCell><p className="text-xs leading-relaxed line-clamp-2">{rev.comment}</p></TableCell>
                        <TableCell><Link href={`/product/${rev.productId}`} target="_blank" className="text-[10px] font-bold text-primary flex items-center gap-1">{rev.productName} <ExternalLink className="h-2 w-2" /></Link></TableCell>
                        <TableCell className="text-[10px] font-mono">{rev.createdAt?.seconds ? format(new Date(rev.createdAt.seconds * 1000), 'yyyy-MM-dd') : '--'}</TableCell>
                        <TableCell className="text-right pr-8"><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive rounded-full" onClick={() => handleDeleteProductReview(rev)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="articles">
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
            <CardContent className="p-0">
              {articlesLoading ? <div className="py-24 text-center"><Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" /></div> : filteredArticleComments.length === 0 ? <div className="py-24 text-center text-muted-foreground italic">暫無文章留言。</div> : (
                <Table>
                  <TableHeader className="bg-muted/5"><TableRow><TableHead className="pl-8">讀者</TableHead><TableHead className="w-[400px]">留言內容</TableHead><TableHead>對應文章</TableHead><TableHead>時間</TableHead><TableHead className="text-right pr-8">操作</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {filteredArticleComments.map((com) => (
                      <TableRow key={com.id} className="group hover:bg-muted/30">
                        <TableCell className="pl-8 py-5"><span className="font-bold text-xs">{com.authorName}</span></TableCell>
                        <TableCell><p className="text-xs leading-relaxed line-clamp-2">{com.content}</p></TableCell>
                        <TableCell><Link href={`/news/${com.articleId}`} target="_blank" className="text-[10px] font-bold text-indigo-600 flex items-center gap-1">{com.articleTitle} <ExternalLink className="h-2 w-2" /></Link></TableCell>
                        <TableCell className="text-[10px] font-mono">{com.createdAt?.seconds ? format(new Date(com.createdAt.seconds * 1000), 'yyyy-MM-dd') : '--'}</TableCell>
                        <TableCell className="text-right pr-8"><Button variant="ghost" size="icon" className="h-8 w-8 text-destructive rounded-full" onClick={() => handleDeleteArticleComment(com)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}