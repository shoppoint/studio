'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCcw, LayoutDashboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Admin Dashboard Error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-8 text-center bg-white rounded-[2.5rem] shadow-xl border">
      <div className="h-20 w-20 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 mb-6">
        <AlertTriangle className="h-10 w-10" />
      </div>
      <h2 className="text-2xl font-black font-headline mb-2 text-slate-900">後台組件加載失敗</h2>
      <p className="text-slate-500 mb-8 max-w-sm mx-auto text-sm leading-relaxed">
        管理後台在處理請求時發生了錯誤。這可能是由於資料庫同步超時。
      </p>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Button 
          onClick={() => reset()} 
          className="h-12 rounded-xl font-bold bg-primary text-primary-foreground shadow-lg gap-2"
        >
          <RefreshCcw className="h-4 w-4" /> 重新整理組件
        </Button>
        <Button 
          variant="ghost"
          asChild
          className="h-12 rounded-xl font-bold text-muted-foreground"
        >
          <Link href="/admin/dashboard">
            <LayoutDashboard className="h-4 w-4 mr-2" /> 回到儀表板首頁
          </Link>
        </Button>
      </div>
    </div>
  );
}
