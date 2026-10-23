'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCcw, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function VendorError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Vendor Portal Error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-8 text-center bg-white rounded-[2.5rem] shadow-xl border">
      <div className="h-20 w-20 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-6">
        <AlertTriangle className="h-10 w-10" />
      </div>
      <h2 className="text-2xl font-black font-headline mb-2 text-slate-900">商家後台發生錯誤</h2>
      <p className="text-slate-500 mb-8 max-w-sm mx-auto text-sm leading-relaxed">
        抱歉，商家中心暫時無法處理您的請求。請嘗試重新載入。
      </p>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Button 
          onClick={() => reset()} 
          className="h-12 rounded-xl font-bold bg-primary text-primary-foreground shadow-lg gap-2"
        >
          <RefreshCcw className="h-4 w-4" /> 重新整理
        </Button>
        <Button 
          variant="ghost"
          asChild
          className="h-12 rounded-xl font-bold text-muted-foreground"
        >
          <Link href="/vendor/dashboard">
            <Store className="h-4 w-4 mr-2" /> 回到商家儀表板
          </Link>
        </Button>
      </div>
    </div>
  );
}
