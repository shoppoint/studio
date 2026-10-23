
"use client";

export const dynamic = 'force-dynamic';

import { useMemo, useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { 
  ChevronRight, 
  Calendar, 
  User, 
  ArrowLeft,
  Share2,
  Tag,
  Clock,
  Bookmark,
  FileText,
  Sparkles,
  ArrowRight,
  Zap,
  Ticket,
  Copy,
  ShoppingBag,
  CheckCircle2,
  Bell,
  AlertTriangle,
  Heart,
  MessageCircle,
  Loader2,
  Home,
  TrendingUp,
  Send,
  Trash2,
  Star,
  LayoutGrid,
  Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n/i18n-context";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useUser, useAuth, useFirestore, useDoc, useCollection } from "@/firebase";
import { 
  doc, 
  serverTimestamp, 
  getDoc,
  getDocs, 
  collection, 
  query, 
  where, 
  limit, 
  orderBy,
  setDoc,
  deleteDoc,
  increment,
  runTransaction,
  onSnapshot,
  updateDoc,
  type Transaction 
} from "firebase/firestore";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { ProductCard } from "@/components/ProductCard";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { LoginDialog } from "@/components/auth/LoginDialog";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

export default function ArticleDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const db = useFirestore();
  const { user, userData } = useUser();
  const articleIdOrSlug = params?.articleId as string;

  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [renderStage, setRenderStage] = useState(1);
  const [newsSearch, setNewsSearch] = useState("");
  const [commentText, setCommentComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const viewLoggedRef = useRef(false);
  const isEn = lang === 'en';

  useEffect(() => {
    const t2 = setTimeout(() => setRenderStage(2), 300);
    const t3 = setTimeout(() => setRenderStage(3), 1200);
    return () => { clearTimeout(t2); clearTimeout(t3); };
  }, []);

  // 核心邏輯：支援 Slug 解析與重定向
  useEffect(() => {
    if (!db || !articleIdOrSlug) return;
    
    const fetchArticle = async () => {
      setLoading(true);
      let redirecting = false;
      
      try {
        // 1. 嘗試按 Slug 查詢
        const slugQuery = query(collection(db, 'articles'), where('slug', '==', articleIdOrSlug), limit(1));
        const slugSnap = await getDocs(slugQuery);
        
        if (!slugSnap.empty) {
          setArticle({ ...slugSnap.docs[0].data(), id: slugSnap.docs[0].id });
        } else {
          // 2. 如果 Slug 沒中，嘗試按 ID 查詢
          const idRef = doc(db, 'articles', articleIdOrSlug);
          const idSnap = await getDoc(idRef);
          
          if (idSnap.exists()) {
            const data = idSnap.data();
            if (data.slug && data.slug !== articleIdOrSlug) {
              if (!redirecting) {
                redirecting = true;
                setIsRedirecting(true);
                router.replace(`/news/${data.slug}`);
              }
              return;
            }
            setArticle({ ...data, id: idSnap.id });
          } else {
            setArticle(null);
          }
        }
      } catch (e) {
        console.error("Article fetch error", e);
      } finally {
        if (!redirecting) setLoading(false);
      }
    };

    fetchArticle();
  }, [db, articleIdOrSlug, router]);

  // 4. 自動紀錄瀏覽量 (Views Count)
  useEffect(() => {
    if (article?.id && db && !viewLoggedRef.current) {
      viewLoggedRef.current = true;
      const ref = doc(db, 'articles', article.id);
      updateDoc(ref, { viewsCount: increment(1) }).catch(() => {});
    }
  }, [article?.id, db]);

  const articleRef = useMemo(() => article ? doc(db!, 'articles', article.id) : null, [db, article]);

  // 2. 點讚與收藏狀態
  const bookmarkRef = useMemo(() => (user && db && article?.id && !user.isAnonymous) ? doc(db, 'users', user.uid, 'bookmarks', article.id) : null, [user, db, article?.id]);
  const { data: bookmarkData } = useDoc<any>(bookmarkRef);
  const isBookmarked = !!bookmarkData;

  const likeRef = useMemo(() => (user && db && article?.id && !user.isAnonymous) ? doc(db, 'users', user.uid, 'liked_articles', article.id) : null, [user, db, article?.id]);
  const { data: likeData } = useDoc<any>(likeRef);
  const isLiked = !!likeData;

  // 3. 留言監聽
  const [comments, setComments] = useState<any[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(true);

  useEffect(() => {
    if (!db || !article?.id || renderStage < 2) return;
    
    setCommentsLoading(true);
    const collectionRef = collection(db, 'articles', article.id, 'comments');
    const q = query(collectionRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        setComments(snapshot.docs.map(d => ({ ...d.data(), id: d.id })));
        setCommentsLoading(false);
      },
      async (err) => {
        if (err.message.includes('permissions')) {
          const permissionError = new FirestorePermissionError({
            path: `articles/${article.id}/comments`,
            operation: 'list',
          } satisfies SecurityRuleContext);
          errorEmitter.emit('permission-error', permissionError);
        }
        setCommentsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [db, article?.id, renderStage]);

  // 側邊欄最新消息
  const latestNewsQuery = useMemo(() => {
    if (!db || renderStage < 2) return null;
    return query(
      collection(db, 'articles'),
      where('status', '==', 'published'),
      orderBy('createdAt', 'desc'),
      limit(5)
    );
  }, [db, renderStage]);
  const { data: latestNews } = useCollection<any>(latestNewsQuery);

  // 促銷活動多選抓取
  const [promos, setPromos] = useState<any[]>([]);
  const [promosLoading, setPromosLoading] = useState(false);

  useEffect(() => {
    if (!db || !article || renderStage < 2) return;
    
    const promoIds = Array.isArray(article.promotionIds) 
      ? article.promotionIds.filter(Boolean) 
      : (article.promotionId && article.promotionId !== 'none' ? [article.promotionId] : []);
    
    if (promoIds.length === 0) {
      setPromos([]);
      return;
    }

    const fetchPromos = async () => {
      setPromosLoading(true);
      try {
        const q = query(collection(db, 'promotions'), where('__name__', 'in', promoIds.slice(0, 30)));
        const snap = await getDocs(q);
        setPromos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        console.error("Fetch promos error", e);
      } finally {
        setPromosLoading(false);
      }
    };
    fetchPromos();
  }, [db, article, renderStage]);

  // 推薦產品
  const productsQuery = useMemo(() => {
    if (!db || !article?.relatedProductIds || renderStage < 3) return null;
    const ids = (article.relatedProductIds || []).slice(0, 10).filter(Boolean);
    if (ids.length === 0) return null;
    return query(collection(db, 'public_products'), where('__name__', 'in', ids), where('status', '==', 'Active'));
  }, [db, article?.relatedProductIds, renderStage]);
  const { data: relatedProducts } = useCollection<any>(productsQuery);

  const title = useMemo(() => {
    if (!article) return "";
    return lang === 'en' ? (article.title?.en || article.title?.zh) : (article.title?.zh || article.title?.en);
  }, [article, lang]);

  const contentStr = useMemo(() => {
    if (!article) return "";
    return lang === 'en' ? (article.content?.en || article.content?.zh) : (article.content?.zh || article.content?.en);
  }, [article, lang]);

  const handleLike = async () => {
    if (!user || user.isAnonymous) {
      toast({ title: isEn ? "Login Required" : "請先登入", description: isEn ? "Sign in to interact with articles." : "登入後即可點讚並參與互動。" });
      setIsLoginOpen(true);
      return;
    }
    
    if (!db || !article?.id) return;
    
    const requestData = { likesCount: increment(isLiked ? -1 : 1) };
    
    runTransaction(db, async (t) => {
      if (isLiked) {
        t.delete(likeRef!);
        t.update(articleRef!, requestData);
      } else {
        t.set(likeRef!, { createdAt: serverTimestamp() });
        t.update(articleRef!, requestData);
      }
    }).then(() => {
      toast({ title: isLiked ? "已取消喜歡" : "已點讚文章" });
    }).catch(async (err) => {
      if (err.message.includes('permissions')) {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: `articles/${article.id}`,
          operation: 'update',
          requestResourceData: requestData
        }));
      }
    });
  };

  const handleBookmark = async () => {
    if (!user || user.isAnonymous) {
      toast({ title: isEn ? "Login Required" : "請先登入", description: isEn ? "Sign in to save articles for later." : "登入後即可收藏此文章。" });
      setIsLoginOpen(true);
      return;
    }
    
    if (!db || !article?.id) return;
    
    if (isBookmarked) {
      runTransaction(db, async (t) => {
        t.delete(bookmarkRef!);
        t.update(articleRef!, { bookmarksCount: increment(-1) });
      }).then(() => {
        toast({ title: "已從收藏移除" });
      }).catch(async (err) => {
        if (err.message.includes('permissions')) {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: `users/${user.uid}/bookmarks/${article.id}`,
            operation: 'delete'
          }));
        }
      });
    } else {
      const data = {
        articleId: article.id,
        title,
        coverImage: article.coverImage || "",
        savedAt: serverTimestamp()
      };
      runTransaction(db, async (t) => {
        t.set(bookmarkRef!, data);
        t.update(articleRef!, { bookmarksCount: increment(1) });
      }).then(() => {
        toast({ title: "已加入我的收藏" });
      }).catch(async (err) => {
        if (err.message.includes('permissions')) {
          errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: `users/${user.uid}/bookmarks/${article.id}`,
            operation: 'create',
            requestResourceData: data
          }));
        }
      });
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    if (isSubmittingComment) return;
    e.preventDefault();
    if (!user || user.isAnonymous || !commentText.trim() || !db || !article?.id) return;
    
    setIsSubmittingComment(true);
    const commentId = `comment_${Date.now()}`;
    const commentData = {
      id: commentId,
      articleId: article.id,
      articleTitle: title,
      content: commentText.trim(),
      authorName: userData?.displayName || user.email?.split('@')[0],
      authorUid: user.uid,
      createdAt: serverTimestamp()
    };

    runTransaction(db, async (t) => {
      const docRef = doc(collection(db, 'articles', article.id, 'comments'), commentId);
      t.set(docRef, commentData);
      t.set(doc(db, 'global_article_comments', commentId), commentData);
    }).then(() => {
      setCommentComment("");
      toast({ title: "留言已發布" });
    }).catch(async (err) => {
      if (err.message.includes('permissions')) {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: `articles/${article.id}/comments/${commentId}`,
          operation: 'create',
          requestResourceData: commentData
        }));
      }
    }).finally(() => {
      setIsSubmittingComment(false);
    });
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: title || 'SHOP POINT News', url: window.location.href });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({ title: lang === 'en' ? "Link Copied!" : "連結已複製" });
      }
      // 統計分享次數
      if (articleRef) {
        updateDoc(articleRef, { sharesCount: increment(1) }).catch(() => {});
      }
    } catch (err) { console.error("Share failed", err); }
  };

  const categories = useMemo(() => {
    if (!article) return [];
    return Array.isArray(article.categories) ? article.categories : [article.category];
  }, [article]);

  if (loading || isRedirecting) return <div className="min-h-screen flex flex-col bg-background"><Navbar /><div className="flex-grow flex items-center justify-center"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div><Footer /></div>;

  if (!article) return <div className="min-h-screen flex flex-col bg-background"><Navbar /><div className="flex-grow flex flex-col items-center justify-center p-12 space-y-6"><FileText className="h-16 w-16 text-muted-foreground/20" /><h2 className="text-2xl font-black font-headline">Article Not Found</h2><Button variant="outline" asChild className="rounded-xl font-bold"><Link href="/news">Back to News</Link></Button></div><Footer /></div>;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow pb-20">
        <div className="border-b bg-muted/30">
          <div className="container mx-auto px-4 py-4 flex items-center gap-2 text-sm text-muted-foreground overflow-x-auto whitespace-nowrap no-scrollbar pb-3">
            <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1.5 shrink-0"><Home className="h-3.5 w-3.5" />{lang === 'en' ? 'Home' : '首頁'}</Link>
            <ChevronRight className="h-3.5 w-3.5 opacity-30 shrink-0" />
            <Link href="/news" className="hover:text-primary transition-colors shrink-0">{t.nav.news}</Link>
            <ChevronRight className="h-3.5 w-3.5 opacity-30 shrink-0" />
            <span className="text-foreground font-bold truncate">{title}</span>
          </div>
        </div>

        <article className="container mx-auto px-4 mt-12 max-w-7xl animate-in fade-in duration-700">
          <div className="space-y-6 text-center max-w-4xl mx-auto mb-12">
            <div className="flex flex-wrap justify-center gap-2">
              {categories.map((cat: string) => (
                <Badge key={cat} className="bg-primary/10 text-primary border-primary/20 px-5 py-1.5 uppercase font-black text-[10px] tracking-widest rounded-full">
                  {t.news.categories[cat as keyof typeof t.news.categories] || cat}
                </Badge>
              ))}
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black font-headline leading-tight tracking-tighter text-slate-900">{title}</h1>
            <div className="flex flex-wrap items-center justify-center gap-8 text-xs text-muted-foreground font-black uppercase tracking-widest">
              <span className="flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" /> {article?.createdAt?.seconds ? format(new Date(article.createdAt.seconds * 1000), 'yyyy-MM-dd') : '--'}</span>
              <span className="flex items-center gap-2"><User className="h-4 w-4 text-primary" /> {article.author || "Admin"}</span>
              <span className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> {article.viewsCount || 0} Views</span>
              <span className="flex items-center gap-2"><Heart className={cn("h-4 w-4", isLiked ? "fill-red-500 text-red-500" : "text-primary")} /> {article.likesCount || 0} Likes</span>
            </div>
          </div>

          <div className="relative aspect-[21/9] rounded-[3rem] overflow-hidden shadow-2xl bg-muted border-4 border-white ring-1 ring-muted">
            {article.coverImage ? <Image src={article.coverImage} alt={title} fill className="object-cover" priority /> : <div className="absolute inset-0 flex items-center justify-center opacity-10"><FileText className="h-32 w-32" /></div>}
          </div>

          <div className="mt-16 grid grid-cols-1 lg:grid-cols-12 gap-12">
            <aside className="lg:col-span-1 flex lg:flex-col items-center justify-center lg:justify-start gap-4 sticky top-40 h-fit z-20">
              <Button 
                variant="outline" size="icon" 
                className={cn("rounded-full h-12 w-12 bg-white shadow-sm transition-all", isLiked ? "border-red-200 text-red-500 bg-red-50" : "border-muted-foreground/10 hover:text-red-500")} 
                onClick={handleLike}
              >
                <Heart className={cn("h-5 w-5", isLiked && "fill-current")} />
              </Button>
              <Button 
                variant="outline" size="icon" 
                className={cn("rounded-full h-12 w-12 bg-white shadow-sm transition-all", isBookmarked ? "border-primary text-primary bg-primary/5" : "border-muted-foreground/10 hover:text-primary")} 
                onClick={handleBookmark}
              >
                <Bookmark className={cn("h-5 w-5", isBookmarked && "fill-current")} />
              </Button>
              <Button variant="outline" size="icon" className="rounded-full h-12 w-12 bg-white shadow-sm border-muted-foreground/10 hover:text-blue-500 transition-all" onClick={handleShare}>
                <Share2 className="h-5 w-5" />
              </Button>
            </aside>

            <div className="lg:col-span-8 space-y-16">
              {renderStage >= 2 && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                  {promos.length > 0 && (
                    <div className="space-y-4 mb-12">
                      {promos.map((promo) => (
                        <Card key={promo.id} className="border-none shadow-xl bg-primary/10 rounded-[2.5rem] overflow-hidden border-2 border-dashed border-primary/30">
                          <CardContent className="p-8 flex flex-col md:flex-row items-center justify-between gap-8">
                            <div className="flex items-center gap-6">
                              <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center text-primary-foreground shadow-lg shrink-0"><Zap className="h-8 w-8 fill-current" /></div>
                              <div className="space-y-1 text-center md:text-left">
                                <h3 className="text-xl font-black font-headline text-primary uppercase tracking-tight">{lang === 'en' ? (promo.name?.en || promo.name?.zh) : (promo.name?.zh || promo.name?.en)}</h3>
                                <p className="text-sm text-muted-foreground font-medium">{lang === 'en' ? (promo.publicSummary?.en || promo.summary?.en) : (promo.publicSummary?.zh || promo.summary?.zh)}</p>
                              </div>
                            </div>
                            <Button asChild className="h-14 px-10 rounded-2xl font-black bg-primary text-primary-foreground shadow-lg hover:scale-105 transition-all"><Link href={promo.targetUrl || "/shop"}>{lang === 'en' ? "Claim Now" : "立即使用"}</Link></Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                  
                  <div className="prose prose-neutral max-w-none prose-p:text-lg prose-p:leading-relaxed prose-p:text-muted-foreground prose-headings:font-black prose-img:rounded-[2.5rem] prose-h3:text-2xl prose-h3:mt-12 prose-h3:mb-6" dangerouslySetInnerHTML={{ __html: contentStr }} />
                </div>
              )}

              {/* 文章留言區 */}
              {renderStage >= 2 && (
                <div className="space-y-10 pt-10 border-t border-dashed">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-black font-headline flex items-center gap-3"><MessageCircle className="h-6 w-6 text-primary" /> 讀者留言 ({comments?.length || 0})</h3>
                  </div>

                  {user && !user.isAnonymous ? (
                    <form onSubmit={handleCommentSubmit} className="space-y-4">
                      <Textarea 
                        placeholder="發表您的想法..." 
                        className="bg-muted/30 border-none rounded-2xl p-4 min-h-[120px] text-sm font-medium focus-visible:ring-primary/20"
                        value={commentText}
                        onChange={(e) => setCommentComment(e.target.value)}
                      />
                      <div className="flex justify-end">
                        <Button className="rounded-xl h-11 px-8 font-black gap-2" disabled={isSubmittingComment || !commentText.trim()}>
                          {isSubmittingComment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} 發布留言
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="p-8 bg-muted/20 rounded-3xl border-2 border-dashed text-center space-y-4">
                      <p className="text-sm text-muted-foreground font-bold italic">請先登入以發表留言及互動。</p>
                      <LoginDialog trigger={<Button className="rounded-xl font-bold h-10 px-8">立即登入</Button>} />
                    </div>
                  )}

                  <div className="space-y-6">
                    {commentsLoading ? <div className="py-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div> : (comments?.length === 0) ? null : (
                      comments?.map((c: any) => (
                        <div key={c.id} className="flex gap-4 group animate-in fade-in slide-in-from-top-2">
                          <div className="h-10 w-10 shrink-0 border-2 border-white shadow-sm rounded-full overflow-hidden bg-primary/10 flex items-center justify-center text-primary font-black text-xs">
                            {c.authorName?.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 space-y-2">
                            <div className="bg-muted/30 p-4 rounded-2xl rounded-tl-none">
                              <p className="font-black text-xs text-slate-900 mb-1">{c.authorName}</p>
                              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{c.content}</p>
                            </div>
                            <p className="text-[9px] text-muted-foreground font-black uppercase px-2">
                              {c.createdAt?.seconds ? format(new Date(c.createdAt.seconds * 1000), 'MM-dd HH:mm') : 'Just now'}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <aside className="lg:col-span-3 space-y-10">
              {renderStage >= 2 && (
                <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-700">
                  <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden p-6 border border-muted">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-4">搜尋消息</h4>
                    <form onSubmit={(e) => { e.preventDefault(); if(newsSearch) router.push(`/news?q=${newsSearch}`); }} className="relative">
                      <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="輸入關鍵字..." className="pl-9 h-11 bg-muted/20 border-none rounded-xl text-sm" value={newsSearch} onChange={(e) => setNewsSearch(e.target.value)} />
                    </form>
                  </Card>
                </div>
              )}
            </aside>
          </div>

          {renderStage >= 3 && relatedProducts && relatedProducts.length > 0 && (
            <section className="mt-24 space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
              <h2 className="text-2xl font-black font-headline flex items-center gap-3 text-slate-900"><ShoppingBag className="h-8 w-8 text-primary" /> 文中推介好物</h2>
              <Carousel opts={{ align: "start", loop: true }} className="w-full">
                <CarouselContent className="-ml-4">
                  {relatedProducts.map((p: any) => (
                    <CarouselItem key={p.id} className="pl-4 basis-[45%] sm:basis-1/3 lg:basis-1/4 xl:basis-1/5">
                      <div className="h-full py-2"><ProductCard product={p} compact /></div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <div className="hidden lg:block">
                  <CarouselPrevious className="-left-12 border-muted-foreground/20" />
                  <CarouselNext className="-right-12 border-muted-foreground/20" />
                </div>
              </Carousel>
            </section>
          )}
        </article>
      </main>

      <LoginDialog open={isLoginOpen} onOpenChange={setIsLoginOpen} />
      
      <Footer />
    </div>
  );
}
