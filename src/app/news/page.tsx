"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  ChevronRight, 
  Calendar, 
  User, 
  ArrowRight, 
  Filter, 
  Loader2, 
  FileText,
  Bookmark,
  Check
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n/i18n-context";
import { useUser, useFirestore, useCollection } from "@/firebase";
import { collection, query, where, orderBy, doc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { LoginDialog } from "@/components/auth/LoginDialog";

export default function NewsPage() {
  const { t, lang } = useI18n();
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [filter, setFilter] = useState("all");
  const [displayLimit, setDisplayLimit] = useState(12);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const newsT = t.news;
  const isEn = lang === 'en';

  const newsQuery = useMemo(() => {
    if (!db) return null;
    return query(
      collection(db, 'articles'),
      where('status', '==', 'published'),
      orderBy('createdAt', 'desc')
    );
  }, [db]);

  const { data: articles, loading } = useCollection<any>(newsQuery);

  // 獲取使用者收藏清單以顯示狀態
  const bookmarksQuery = useMemo(() => {
    if (!db || !user || user.isAnonymous) return null;
    return collection(db, 'users', user.uid, 'bookmarks');
  }, [db, user]);
  const { data: userBookmarks } = useCollection<any>(bookmarksQuery);

  const bookmarkedIds = useMemo(() => new Set(userBookmarks?.map(b => b.articleId) || []), [userBookmarks]);

  // 當分類變更時，重置顯示數量
  useEffect(() => {
    setDisplayLimit(12);
  }, [filter]);

  const allFilteredArticles = useMemo(() => {
    if (!articles) return [];
    if (filter === 'all') return articles;
    
    return articles.filter(a => {
      if (Array.isArray(a.categories)) {
        return a.categories.includes(filter);
      }
      return a.category === filter;
    });
  }, [articles, filter]);

  const paginatedArticles = useMemo(() => {
    return allFilteredArticles.slice(0, displayLimit);
  }, [allFilteredArticles, displayLimit]);

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'news': return newsT.categories.news;
      case 'tips': return newsT.categories.tips;
      case 'recipe': return newsT.categories.recipe;
      case 'promo': return newsT.categories.promo;
      case 'recommended': return newsT.categories.recommended;
      case 'lifestyle': return newsT.categories.lifestyle;
      case 'health': return newsT.categories.health;
      default: return cat;
    }
  };

  const handleBookmark = async (e: React.MouseEvent, art: any) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user || user.isAnonymous) {
      toast({ 
        title: isEn ? "Login Required" : "請先登入", 
        description: isEn ? "Sign in to save articles for later." : "登入後即可收藏感興趣的文章，稍後再閱讀。" 
      });
      setIsLoginOpen(true);
      return;
    }

    const isBookmarked = bookmarkedIds.has(art.id);
    const bookmarkRef = doc(db!, 'users', user.uid, 'bookmarks', art.id);

    try {
      if (isBookmarked) {
        await deleteDoc(bookmarkRef);
        toast({ title: isEn ? "Removed" : "已從收藏移除" });
      } else {
        await setDoc(bookmarkRef, {
          articleId: art.id,
          title: isEn ? (art.title?.en || art.title?.zh) : (art.title?.zh || art.title?.en),
          coverImage: art.coverImage || "",
          savedAt: serverTimestamp()
        });
        toast({ title: isEn ? "Saved" : "已加入我的收藏" });
      }
    } catch (err) {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow">
        <section className="bg-primary/10 py-16 md:py-24 border-b">
          <div className="container mx-auto px-4 text-center space-y-4">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-2 uppercase tracking-widest font-bold">
              <Link href="/" className="hover:text-primary transition-colors">{t.nav.home}</Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground">{t.nav.news}</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black font-headline tracking-tighter">{newsT.title}</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-medium">{newsT.subtitle}</p>
          </div>
        </section>

        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-wrap items-center justify-center gap-2 mb-16">
            {['all', 'news', 'tips', 'recipe', 'promo', 'recommended', 'lifestyle', 'health'].map((cat) => (
              <Button 
                key={cat} 
                variant={filter === cat ? "default" : "outline"} 
                className={cn(
                  "rounded-full h-11 px-8 font-bold transition-all", 
                  filter === cat ? 'bg-primary text-primary-foreground shadow-lg scale-105' : 'hover:border-primary/50'
                )} 
                onClick={() => setFilter(cat)}
              >
                {cat === 'all' ? newsT.categories.all : getCategoryLabel(cat)}
              </Button>
            ))}
          </div>

          {loading ? (
            <div className="py-24 text-center">
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
              <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mt-4">正在獲取最新內容...</p>
            </div>
          ) : allFilteredArticles.length === 0 ? (
            <div className="py-24 text-center border-2 border-dashed rounded-[3rem] bg-muted/10 space-y-4">
              <FileText className="h-12 w-12 text-muted-foreground/20 mx-auto" />
              <p className="font-bold text-muted-foreground">目前該分類下暫無文章。</p>
              <Button variant="link" className="text-primary font-bold" onClick={() => setFilter('all')}>查看所有消息</Button>
            </div>
          ) : (
            <div className="space-y-12">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {paginatedArticles.map((art) => {
                  const isBookmarked = bookmarkedIds.has(art.id);
                  // 核心修正：優先使用 Slug 連結文章
                  const articlePath = art.slug ? `/news/${art.slug}` : `/news/${art.id}`;
                  
                  return (
                    <Link key={art.id} href={articlePath}>
                      <Card className="group border-none shadow-sm hover:shadow-2xl transition-all duration-500 overflow-hidden cursor-pointer flex flex-col h-full bg-white rounded-[2rem]">
                        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                          {art.coverImage && (
                            <Image src={art.coverImage} alt="Cover" fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                          )}
                          <div className="absolute top-4 left-4 flex flex-wrap gap-1">
                            {(Array.isArray(art.categories) ? art.categories : [art.category]).slice(0, 2).map((c: string) => (
                              <Badge key={c} className="bg-white/90 backdrop-blur-sm text-primary border-none font-black uppercase text-[10px] px-3 h-6 shadow-sm">
                                {getCategoryLabel(c)}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <CardContent className="p-8 flex-1 flex flex-col justify-between space-y-6">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3 text-primary" /> 
                                  {art.createdAt?.seconds ? format(new Date(art.createdAt.seconds * 1000), 'yyyy-MM-dd') : '--'}
                                </span>
                                <span className="flex items-center gap-1.5"><User className="h-3 w-3 text-primary" /> {art.author || "Admin"}</span>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className={cn(
                                  "h-8 w-8 rounded-full transition-all",
                                  isBookmarked ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-primary hover:bg-primary/5"
                                )}
                                onClick={(e) => handleBookmark(e, art)}
                              >
                                <Bookmark className={cn("h-4 w-4", isBookmarked && "fill-current")} />
                              </Button>
                            </div>
                            <h3 className="text-xl font-bold font-headline group-hover:text-primary transition-colors leading-tight line-clamp-2">
                              {lang === 'en' ? (art.title?.en || art.title?.zh) : (art.title?.zh || art.title?.en)}
                            </h3>
                            <p className="text-muted-foreground text-sm line-clamp-3 leading-relaxed">
                              {lang === 'en' ? (art.excerpt?.en || art.excerpt?.zh) : (art.excerpt?.zh || art.excerpt?.en)}
                            </p>
                          </div>
                          <div className="pt-4 flex items-center text-primary font-black text-xs uppercase tracking-widest gap-2">
                            {newsT.read_more} <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  );
                })}
              </div>

              {/* Load More Button */}
              {allFilteredArticles.length > displayLimit && (
                <div className="py-12 flex justify-center border-t border-dashed">
                  <Button 
                    variant="outline" 
                    className="rounded-2xl h-14 px-12 font-black bg-white border-2 border-primary text-primary hover:bg-primary hover:text-white transition-all shadow-lg group"
                    onClick={() => setDisplayLimit(prev => prev + 12)}
                  >
                    {isEn ? "Load More Articles" : "載入更多消息"}
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Guest Redirect Popup */}
      <LoginDialog open={isLoginOpen} onOpenChange={setIsLoginOpen} />
      
      <Footer />
    </div>
  );
}