"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

interface SubCategoryPillsProps {
  subCategories: any[];
  lang: string;
  query: string;
}

export function SubCategoryPills({ subCategories, lang, query }: SubCategoryPillsProps) {
  const getCatName = (cat: any) => lang === 'en' ? (cat.name_en || cat.name_zh) : (cat.name_zh || cat.name_en);

  if (subCategories.length === 0) return null;

  return (
    <div className="animate-in fade-in slide-in-from-top-2 duration-500">
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-2 pb-4">
          {subCategories.map((sub) => (
            <Button 
              key={sub.id} 
              variant="outline" 
              size="sm"
              className="rounded-full h-9 px-5 font-bold border-muted-foreground/20 hover:border-primary hover:text-primary transition-all shadow-sm bg-white" 
              asChild
            >
              <Link href={`/shop?category=${sub.id}${query ? `&q=${query}` : ''}`}>
                {getCatName(sub)}
              </Link>
            </Button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" className="hidden" />
      </ScrollArea>
    </div>
  );
}
