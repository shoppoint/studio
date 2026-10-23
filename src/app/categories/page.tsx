"use client";

import React, { useRef, useMemo } from "react";
import Link from "next/link";
import { 
  ChevronRight, 
  LayoutGrid, 
  ArrowUp, 
  Package, 
  Loader2, 
  FolderTree 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useI18n } from "@/lib/i18n/i18n-context";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useFirestore, useCollection } from "@/firebase";
import { collection, query, orderBy, where } from "firebase/firestore";

interface Category {
  id: string;
  slug?: string;
  name_en?: string;
  name_zh?: string;
  isVisible: boolean;
  parentId: string | null;
  displayOrder: number;
  children?: Category[];
}

export default function CategoriesPage() {
  const { t, lang } = useI18n();
  const db = useFirestore();
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const categoriesQuery = useMemo(() => {
    if (!db) return null;
    return query(
      collection(db, 'categories'),
      orderBy('displayOrder', 'asc')
    );
  }, [db]);

  const { data: rawCategories, loading } = useCollection<any>(categoriesQuery);

  const categoryTree = useMemo(() => {
    if (!rawCategories) return [];
    const buildHierarchy = (items: any[], parentId: string | null = "none"): Category[] => {
      return items
        .filter(item => {
          const itemParent = item.parentId || "none";
          return itemParent === parentId;
        })
        .map(item => ({
          ...item,
          id: item.id,
          children: buildHierarchy(items, item.id)
        }));
    };
    return buildHierarchy(rawCategories.filter(c => c.isVisible !== false));
  }, [rawCategories]);

  const scrollToSection = (id: string) => {
    sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const getCatName = (cat: any) => lang === 'en' ? (cat.name_en || cat.name_zh) : (cat.name_zh || cat.name_en);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow pb-20">
        <div className="bg-muted/30 py-10 border-b">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <Link href="/" className="hover:text-primary transition-colors">{t.nav.home}</Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground font-bold">{t.nav.categories}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black font-headline tracking-tight">{t.nav.categories}</h1>
            <p className="text-muted-foreground mt-2">{t.sections.categories_subtitle}</p>
          </div>
        </div>

        {loading ? (
          <div className="h-96 flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-bold text-muted-foreground uppercase">Syncing Departments...</p>
          </div>
        ) : categoryTree.length === 0 ? (
          <div className="py-24 text-center"><Package className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" /><p className="text-muted-foreground italic">No categories available yet.</p></div>
        ) : (
          <>
            <div className="sticky top-14 lg:top-[156px] z-40 bg-white/80 backdrop-blur-md border-b shadow-sm transition-all duration-300">
              <div className="container mx-auto px-4">
                <ScrollArea className="w-full whitespace-nowrap py-4">
                  <div className="flex gap-2">
                    {categoryTree.map((cat) => (
                      <Button 
                        key={cat.id} 
                        variant="outline" 
                        className="rounded-full h-10 px-6 font-bold hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all flex items-center gap-2" 
                        onClick={() => scrollToSection(cat.id)}
                      >
                        <LayoutGrid className="h-4 w-4" />
                        {getCatName(cat)}
                      </Button>
                    ))}
                  </div>
                  <ScrollBar orientation="horizontal" className="hidden" />
                </ScrollArea>
              </div>
            </div>

            <div className="container mx-auto px-4 py-12 space-y-20">
              {categoryTree.map((category) => (
                <section key={category.id} ref={(el) => { sectionRefs.current[category.id] = el; }} className="scroll-mt-64">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary"><FolderTree className="h-6 w-6" /></div>
                    <h2 className="text-2xl md:text-3xl font-black font-headline tracking-tighter">{getCatName(category)}</h2>
                    <div className="flex-grow border-t border-dashed" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12">
                    {category.children?.map((child) => (
                      <div key={child.id} className="space-y-4">
                        <div className="bg-muted/50 p-3 rounded-lg border-l-4 border-primary"><h3 className="font-bold text-base flex items-center justify-between">{getCatName(child)}<ChevronRight className="h-4 w-4 text-muted-foreground" /></h3></div>
                        <div className="flex flex-wrap gap-2 pl-1">
                          {child.children?.map((sub: any) => (<Button key={sub.id} variant="ghost" asChild className="h-auto py-2 px-3 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-primary/5 border border-transparent hover:border-primary/20 rounded-md"><Link href={`/shop?category=${sub.slug || sub.id}`}>{getCatName(sub)}</Link></Button>))}
                          <Button variant="link" size="sm" asChild className="h-auto p-0 text-xs font-bold text-muted-foreground/60 hover:text-primary"><Link href={`/shop?category=${child.slug || child.id}`}>Browse All {getCatName(child)}</Link></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </>
        )}
        <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="fixed bottom-20 right-6 md:bottom-8 md:right-8 h-12 w-12 bg-white shadow-2xl rounded-full border border-muted flex items-center justify-center hover:bg-muted transition-colors z-50 group"><ArrowUp className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" /></button>
      </main>
      <Footer />
    </div>
  );
}