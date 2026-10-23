"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FileText, Calendar, ArrowRight, Loader2, Bookmark } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { useI18n } from "@/lib/i18n/i18n-context";
import { useUser, useFirestore, useCollection } from "@/firebase";
import { doc, setDoc, deleteDoc, serverTimestamp, collection } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { LoginDialog } from "@/components/auth/LoginDialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

interface NewsSectionProps {
  articles: any[] | null;
  loading: boolean;
}

export function NewsSection({ articles, loading }: NewsSectionProps) {
  const { t, lang } = useI18n();
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const isEn = lang === 'en';

  // 獲取使用者收藏清單
  const bookmarksQuery = useMemo(() => {
    if (!db || !user || user.isAnonymous) return null;
    return collection(db, 'users', user.uid, 'bookmarks');
  }, [db, user]);
  const { data: userBookmarks } = useCollection<any>(bookmarksQuery);

  const bookmarkedIds = useMemo(() => new Set(userBookmarks?.map(b => b.articleId) || []), [userBookmarks]);

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
    <section className="py-12 md:py-20">
      <div className="container px-4 mx-auto">
        <div className="flex items-center justify-between mb-8 md:mb-10">
          <h2 className="text-xl md:text-3xl font-black font-headline flex items-center gap-3 text-slate-900">
            <FileText className="h-5 w-5 md:h-6 md:w-6 text-primary" />
            {t.news.title}
          </h2>
          <Button asChild variant="ghost" className="font-bold text-primary gap-2 rounded-xl">
            <Link href="/news">{t.sections.view_all} <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          </div>
        ) : (
          <>
            {/* Mobile Carousel */}
            <div className="md:hidden">
              <Carousel opts={{ align: "start", containScroll: "trimSnaps" }} className="w-full">
                <CarouselContent className="-ml-3">
                  {articles?.map((art) => (
                    <CarouselItem key={art.id} className="pl-3 basis-[40%]">
                      <NewsCard art={art} lang={lang} isBookmarked={bookmarkedIds.has(art.id)} onBookmark={handleBookmark} />
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
            </div>

            {/* Desktop Grid */}
            <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-8">
              {articles?.map((art) => (
                <NewsCard key={art.id} art={art} lang={lang} isBookmarked={bookmarkedIds.has(art.id)} onBookmark={handleBookmark} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Guest Redirect Popup */}
      <LoginDialog open={isLoginOpen} onOpenChange={setIsLoginOpen} />
    </section>
  );
}

function NewsCard({ art, lang, isBookmarked, onBookmark }: { art: any, lang: string, isBookmarked: boolean, onBookmark: any }) {
  return (
    <Link href={`/news/${art.id}`} className="h-full">
      <Card className="border-none shadow-sm hover:shadow-xl transition-all duration-500 rounded-[2rem] overflow-hidden bg-white group h-full flex flex-col">
        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
          {art.coverImage && (
            <Image 
              src={art.coverImage} 
              alt="News" 
              fill 
              className="object-cover group-hover:scale-105 transition-transform duration-700" 
            />
          )}
        </div>
        <CardContent className="p-5 md:p-6 flex-1 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[9px] font-black text-muted-foreground uppercase tracking-widest">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3 text-primary" /> 
                {art.createdAt?.seconds ? format(new Date(art.createdAt.seconds * 1000), 'yyyy-MM-dd') : '--'}
              </span>
              <button 
                onClick={(e) => onBookmark(e, art)}
                className={cn(
                  "p-1.5 rounded-full transition-all",
                  isBookmarked ? "bg-primary/10 text-primary" : "hover:text-primary hover:bg-primary/5"
                )}
              >
                <Bookmark className={cn("h-3.5 w-3.5", isBookmarked && "fill-current")} />
              </button>
            </div>
            <h4 className="font-bold text-sm md:text-base group-hover:text-primary transition-colors line-clamp-2 leading-tight">
              {lang === 'en' ? (art.title?.en || art.title?.zh) : (art.title?.zh || art.title?.en)}
            </h4>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
