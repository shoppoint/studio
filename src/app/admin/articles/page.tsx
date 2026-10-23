
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { 
  Plus, 
  Edit2, 
  Trash2, 
  FileText, 
  Search,
  Eye,
  Calendar,
  BadgeCheck,
  Loader2,
  Package,
  TrendingUp,
  Heart,
  Bookmark,
  Share2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n/i18n-context";
import { useFirestore, useCollection } from "@/firebase";
import { collection, query, orderBy, deleteDoc, doc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function AdminArticles() {
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const db = useFirestore();
  const artT = t.admin.articles;
  const [searchQuery, setSearchQuery] = useState("");

  // 實時從 Firestore 獲取文章資料
  const articlesQuery = useMemo(() => {
    if (!db) return null;
    return query(
      collection(db, 'articles'),
      orderBy('createdAt', 'desc')
    );
  }, [db]);

  const { data: articles, loading } = useCollection<any>(articlesQuery);

  const filteredArticles = useMemo(() => {
    if (!articles) return [];
    return articles.filter(a => {
      const title = ((a.title?.en || "") + (a.title?.zh || "")).toLowerCase();
      return title.includes(searchQuery.toLowerCase());
    });
  }, [articles, searchQuery]);

  const handleDelete = async (id: string) => {
    if (!confirm(lang === 'en' ? "Delete this article?" : "確定要刪除這篇文章？")) return;
    try {
      await deleteDoc(doc(db, 'articles', id));
      toast({ title: "Article removed" });
    } catch (e) {
      toast({ title: "Delete failed", variant: "destructive" });
    }
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'news': return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">{t.news.categories.news}</Badge>;
      case 'tips': return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">{t.news.categories.tips}</Badge>;
      case 'recipe': return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">{t.news.categories.recipe}</Badge>;
      case 'promo': return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">{t.news.categories.promo}</Badge>;
      case 'recommended': return <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">{t.news.categories.recommended}</Badge>;
      case 'lifestyle': return <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">{t.news.categories.lifestyle}</Badge>;
      case 'health': return <Badge variant="outline" className="bg-teal-50 text-teal-700 border-teal-200">{t.news.categories.health}</Badge>;
      default: return <Badge variant="outline">{cat}</Badge>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">{artT.title}</h1>
          <p className="text-muted-foreground">{artT.subtitle}</p>
        </div>
        <Button className="bg-primary text-primary-foreground font-black shadow-lg rounded-xl h-11 px-6" asChild>
          <Link href="/admin/articles/new">
            <Plus className="mr-2 h-4 w-4" /> {artT.add_article}
          </Link>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search articles..." 
            className="pl-10 h-11 bg-muted/20 border-none rounded-xl" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
        <CardContent className="p-0">
          {loading ? (
            <div className="py-20 text-center flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Syncing with Firestore...</p>
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="py-24 text-center border-dashed border-2 m-6 rounded-2xl">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
              <p className="text-muted-foreground font-medium">No articles found.</p>
              <Button variant="link" asChild className="text-primary mt-2">
                <Link href="/admin/articles/new">Create your first post</Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/5">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-8">{artT.table.title}</TableHead>
                  <TableHead>分類 (Categories)</TableHead>
                  <TableHead>{artT.table.performance}</TableHead>
                  <TableHead>{artT.table.status}</TableHead>
                  <TableHead>{artT.table.date}</TableHead>
                  <TableHead className="text-right pr-8">{artT.table.actions}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredArticles.map((art) => (
                  <TableRow key={art.id} className="group hover:bg-muted/30 transition-colors">
                    <TableCell className="pl-8 py-4">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center overflow-hidden shrink-0 border">
                          {art.coverImage ? (
                            <img src={art.coverImage} className="object-cover w-full h-full" alt="" />
                          ) : (
                            <FileText className="h-5 w-5 text-muted-foreground/30" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="font-bold text-sm block truncate">
                            {lang === 'en' ? (art.title?.en || art.title?.zh) : (art.title?.zh || art.title?.en)}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-tighter">By {art.author || "Admin"}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {Array.isArray(art.categories) ? (
                          art.categories.map((c: string) => <div key={c}>{getCategoryBadge(c)}</div>)
                        ) : (
                          getCategoryBadge(art.category)
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <div className="flex items-center gap-3">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-1 cursor-help">
                                <TrendingUp className="h-3 w-3 text-blue-500" />
                                <span className="text-[10px] font-black">{art.viewsCount || 0}</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="rounded-xl font-bold text-xs">{artT.metrics.views}</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-1 cursor-help">
                                <Heart className="h-3 w-3 text-red-500 fill-red-500" />
                                <span className="text-[10px] font-black">{art.likesCount || 0}</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="rounded-xl font-bold text-xs">{artT.metrics.likes}</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-1 cursor-help">
                                <Bookmark className="h-3 w-3 text-primary fill-primary" />
                                <span className="text-[10px] font-black">{art.bookmarksCount || 0}</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="rounded-xl font-bold text-xs">{artT.metrics.bookmarks}</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-1 cursor-help">
                                <Share2 className="h-3 w-3 text-indigo-500" />
                                <span className="text-[10px] font-black">{art.sharesCount || 0}</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent className="rounded-xl font-bold text-xs">{artT.metrics.shares}</TooltipContent>
                          </Tooltip>
                        </div>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell>
                      <Badge variant={art.status === 'published' ? "default" : "secondary"} className="h-6 px-3 rounded-lg border-none text-[10px] font-bold uppercase">
                        {art.status === 'published' ? <BadgeCheck className="mr-1 h-3 w-3" /> : null}
                        {art.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[10px] text-muted-foreground font-bold uppercase">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3" />
                        {art.createdAt?.seconds ? format(new Date(art.createdAt.seconds * 1000), 'yyyy-MM-dd') : '--'}
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-8 space-x-1">
                      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" asChild title="View on Site">
                        <Link href={`/news/${art.id}`}>
                          <Eye className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full" asChild>
                        <Link href={`/admin/articles/${art.id}`}>
                          <Edit2 className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-destructive hover:bg-red-50" onClick={() => handleDelete(art.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
