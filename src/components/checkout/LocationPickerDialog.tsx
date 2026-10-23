"use client";

import { useState, useMemo, useRef } from "react";
import { Search, MapPin, Loader2, X, Clock } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface LocationPickerDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  data: any[];
  onSelect: (point: any) => void;
  search: string;
  onSearchChange: (val: string) => void;
  isEn: boolean;
  isLoading?: boolean;
}

/**
 * 通用物流網點選取器：支援順豐站、智郵站及門市取貨。
 */
export function LocationPickerDialog({
  isOpen,
  onOpenChange,
  title,
  data,
  onSelect,
  search,
  onSearchChange,
  isEn,
  isLoading = false
}: LocationPickerDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  
  const filteredData = useMemo(() => {
    if (!data) return [];
    const q = search.toLowerCase().trim();
    if (!q) return data;
    
    return data.filter(p => 
      (p.name_zh || "").toLowerCase().includes(q) ||
      (p.name_en || "").toLowerCase().includes(q) ||
      (p.address_zh || "").toLowerCase().includes(q) ||
      (p.address_en || "").toLowerCase().includes(q) ||
      (p.code || "").toLowerCase().includes(q) ||
      (p.gmcStoreCode || "").toLowerCase().includes(q)
    );
  }, [data, search]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputRef.current) {
      inputRef.current.blur();
    }
  };

  const handleScroll = () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  };

  /**
   * 格式化到貨天數顯示邏輯 (改用 ~ 符號，並允許 0 顯示)
   */
  const renderLeadTime = (loc: any) => {
    const min = loc.pickupLeadTimeMin;
    const max = loc.pickupLeadTimeMax;
    
    // 如果沒有數值，則使用舊的文字欄位作為備援
    if (min === undefined || min === null) return loc.pickupLeadTime || null;

    const minNum = Number(min);
    const maxNum = Number(max);

    if (minNum === maxNum) {
      return `${minNum} ${isEn ? 'days' : '天'}`;
    }
    
    return `${minNum}~${maxNum} ${isEn ? 'days' : '天'}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="w-[92vw] sm:max-w-[600px] rounded-[2rem] sm:rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="p-6 sm:p-8 bg-primary text-primary-foreground relative overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <MapPin className="h-24 w-24 sm:h-32 sm:w-32 rotate-12" />
          </div>
          <DialogTitle className="text-xl sm:text-2xl font-black font-headline relative z-10">{title}</DialogTitle>
        </DialogHeader>

        <div className="p-5 sm:p-8 space-y-4 sm:space-y-6 bg-white">
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground" />
            <Input 
              ref={inputRef}
              type="search"
              placeholder={isEn ? "Search location or code..." : "搜尋地點、分區或編號..."}
              className="pl-11 h-11 sm:h-12 bg-muted/20 border-none rounded-2xl font-bold text-base sm:text-lg shadow-inner"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              enterKeyHint="search"
            />
          </form>
          
          <ScrollArea className="h-[400px] sm:h-[450px] pr-4 -mr-4" onScrollCapture={handleScroll}>
            {isLoading ? (
              <div className="h-64 flex flex-col items-center justify-center gap-4 text-muted-foreground">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-xs font-black uppercase tracking-widest">Loading Database...</p>
              </div>
            ) : filteredData.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-muted-foreground/30 py-20 bg-muted/10 rounded-[2rem] border-2 border-dashed">
                <MapPin className="h-12 w-12 mb-2 opacity-10" />
                <p className="text-sm font-bold">找不到相符的地點</p>
              </div>
            ) : (
              <div className="grid gap-2 sm:gap-3">
                {filteredData.map((item, idx) => {
                  const leadTimeLabel = renderLeadTime(item);
                  return (
                    <button
                      key={item.id || idx}
                      onClick={() => onSelect(item)}
                      className="w-full text-left p-4 sm:p-5 rounded-2xl sm:rounded-3xl border-2 border-transparent hover:border-primary/30 hover:bg-primary/5 transition-all group bg-white shadow-sm hover:shadow-md"
                    >
                      <div className="flex justify-between items-start gap-4">
                        <div className="min-w-0 space-y-0.5 sm:space-y-1">
                          <p className="font-black text-sm text-slate-950 leading-tight group-hover:text-primary transition-colors">
                            {isEn ? (item.name_en || item.name_zh) : (item.name_zh || item.name_en)}
                          </p>
                          <p className="text-[10px] sm:text-[11px] text-muted-foreground font-medium leading-relaxed">
                            {isEn ? (item.address_en || item.address_zh) : (item.address_zh || item.address_en)}
                          </p>
                          {leadTimeLabel && (
                            <div className="flex items-center gap-1 mt-1 text-indigo-600 font-bold text-[9px] sm:text-[10px]">
                              <Clock className="h-2.5 w-2.5" />
                              {isEn ? 'Est.' : '預計'} {leadTimeLabel} {isEn ? '' : '送達'}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <span className="text-[11px] font-black uppercase text-muted-foreground opacity-40 group-hover:opacity-100 transition-opacity">
                            {isEn ? 'Select' : '選取'}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
