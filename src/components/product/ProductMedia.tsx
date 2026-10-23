"use client";

import { useMemo } from "react";
import Image from "next/image";
import { Package, Play, Youtube } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/i18n-context";

interface ProductMediaProps {
  product: any;
  productName: string;
  images: string[];
  activeImage: number;
  setActiveImage: (idx: number) => void;
  shareOptions: any[];
}

/**
 * 產品媒體展示組件 (修正移動端佈局崩潰)
 * 修正：加固 iframe 與圖片容器的 CSS，防止父級塌陷導致巨大的三角形變形。
 */
export function ProductMedia({ product, productName, images, activeImage, setActiveImage }: ProductMediaProps) {
  const { lang } = useI18n();
  const customBadgeText = lang === 'en' ? product.badgeText_en : product.badgeText_zh;

  const youtubeId = useMemo(() => {
    if (!product.youtubeUrl) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = product.youtubeUrl.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  }, [product.youtubeUrl]);

  const videoIndex = images.length;
  const isShowingVideo = youtubeId && activeImage === videoIndex;

  return (
    <div className="space-y-4 w-full">
      <div className="relative aspect-square rounded-[2rem] overflow-hidden bg-muted border shadow-sm group w-full">
        {isShowingVideo ? (
          <div className="absolute inset-0 bg-black w-full h-full">
            <iframe
              src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`}
              title="Product Video"
              className="absolute top-0 left-0 w-full h-full border-none"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="relative w-full h-full">
            {images.length > 0 ? (
              <Image 
                src={images[activeImage]} 
                alt={productName} 
                fill 
                className="object-cover transition-transform duration-500 group-hover:scale-105" 
                priority 
                sizes="(max-width: 768px) 100vw, 600px"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground/30"><Package className="h-20 w-20" /></div>
            )}
          </div>
        )}
        
        {customBadgeText && !isShowingVideo && (
          <div className="absolute top-4 left-4 z-10">
            <Badge 
              style={{ backgroundColor: product.badgeBgColor || "#FFD700", color: product.badgeTextColor || "#000000" }} 
              className="border-none font-black text-[10px] sm:text-xs uppercase shadow-xl px-4 py-1.5 rounded-full flex items-center gap-2 animate-in zoom-in duration-500"
            >
              {customBadgeText}
            </Badge>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 md:gap-4">
        {images.map((img: string, idx: number) => (
          <button 
            key={idx} 
            onClick={() => setActiveImage(idx)} 
            className={cn(
              "relative aspect-square rounded-xl overflow-hidden border-2 transition-all",
              activeImage === idx && !isShowingVideo ? 'border-primary shadow-md scale-105 z-10' : 'border-transparent hover:border-primary/50'
            )}
          >
            <Image src={img} alt={`Thumb ${idx}`} fill className="object-cover" sizes="100px" />
          </button>
        ))}

        {youtubeId && (
          <button 
            onClick={() => setActiveImage(videoIndex)}
            className={cn(
              "relative aspect-square rounded-xl overflow-hidden border-2 transition-all bg-slate-900 flex flex-col items-center justify-center gap-1",
              isShowingVideo ? 'border-red-600 shadow-md scale-105 z-10' : 'border-transparent hover:border-red-500/50'
            )}
          >
            <div className="h-8 w-8 rounded-full bg-red-600 flex items-center justify-center text-white shadow-lg">
              <Play className="h-4 w-4 fill-current ml-0.5" />
            </div>
            <span className="text-[8px] font-black text-white uppercase tracking-tighter">VIDEO</span>
            <img 
              src={`https://img.youtube.com/vi/${youtubeId}/default.jpg`} 
              className="absolute inset-0 w-full h-full object-cover opacity-30 -z-10" 
              alt="Video thumbnail"
            />
          </button>
        )}
      </div>
    </div>
  );
}
