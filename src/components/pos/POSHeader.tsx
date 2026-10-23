"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  History, 
  BarChart3, 
  XCircle, 
  Zap, 
  LogOut, 
  Store 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

interface POSHeaderProps {
  registerStatus: "active" | "closed";
  locationName: string;
  onOpenHistory: () => void;
  onOpenReport: () => void;
  onOpenRegister: () => void;
  onOpenSettle: () => void;
  onLogout: () => void;
}

/**
 * POS 頂部導覽列：負責狀態顯示與系統層級操作
 */
export function POSHeader({
  registerStatus,
  locationName,
  onOpenHistory,
  onOpenReport,
  onOpenRegister,
  onOpenSettle,
  onLogout
}: POSHeaderProps) {
  return (
    <header className="h-16 bg-white border-b px-6 flex items-center justify-between shrink-0 shadow-sm z-50">
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center space-x-2">
          <Image src="/logo.png" alt="Logo" width={32} height={32} />
          <span className="text-xl font-black font-headline uppercase tracking-tighter">
            SHOP <span className="text-primary">POINT</span> <span className="text-primary ml-1">POS</span>
          </span>
        </Link>
        <Separator orientation="vertical" className="h-6" />
        <Badge className={cn(
          "h-7 px-3 border-none font-black text-[10px] uppercase shadow-sm text-white", 
          registerStatus === 'active' ? "bg-green-500" : "bg-red-500"
        )}>
          {registerStatus === 'active' ? "Register Open" : "Register Closed"}
        </Badge>
        {registerStatus === 'active' && (
          <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
            <Store className="h-3.5 w-3.5" />
            {locationName}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" className="rounded-xl font-bold h-10 gap-2" onClick={onOpenHistory}>
          <History className="h-4 w-4" /> 交易紀錄
        </Button>
        <Button variant="ghost" className="rounded-xl font-bold h-10 gap-2" onClick={onOpenReport}>
          <BarChart3 className="h-4 w-4" /> 銷售報表
        </Button>
        {registerStatus === 'active' ? (
          <Button variant="outline" className="rounded-xl border-red-200 text-red-600 font-bold h-10" onClick={onOpenSettle}>
            <XCircle className="h-4 w-4 mr-2" /> 日結關市
          </Button>
        ) : (
          <Button className="rounded-xl bg-primary text-primary-foreground font-black h-10" onClick={onOpenRegister}>
            <Zap className="h-4 w-4 mr-2" /> 開市對帳
          </Button>
        )}
        <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10 text-destructive" onClick={onLogout}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
