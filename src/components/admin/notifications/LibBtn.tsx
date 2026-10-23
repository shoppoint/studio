"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface LibBtnProps {
  icon: any;
  label: string;
  onClick: () => void;
}

/**
 * 通訊編輯器左側工具列按鈕組件
 */
export function LibBtn({ icon: Icon, label, onClick }: LibBtnProps) {
  return (
    <button 
      onClick={onClick} 
      className="flex items-center gap-3 p-2.5 px-4 rounded-xl hover:bg-primary/10 text-[11px] font-bold text-muted-foreground group transition-all"
    >
      <Icon className="h-4 w-4 group-hover:scale-110 transition-transform" /> 
      {label}
    </button>
  );
}
