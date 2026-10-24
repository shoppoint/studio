'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCcw, Home, MessageCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

/**
 * 運行時錯誤邊界 (Runtime Error Boundary) - 500 錯誤指定頁面
 * 強化用戶導向功能，提供返回首頁按鈕與 WhatsApp 即時諮詢。
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Runtime Error Boundary caught:", error);
  }, [error]);

  const whatsappUrl = "https://wa.me/85253252555";

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-6 text-center bg-slate-50 font-sans rounded-[2rem] my-12 mx-4 border-2 border-dashed">
      <div className="h-24 w-24 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-8 shadow-inner">
        <AlertTriangle className="h-12 w-12" />
      </div>
      
      <div className="space-y-4 max-w-md mx-auto mb-12">
        <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-slate-900">系統發生內部錯誤</h2>
        <p className="text-slate-500 text-sm font-medium leading-relaxed">
          抱歉，伺服器在處理您的請求時遇到了非預期狀況。這可能是暫時性的連線中斷，請嘗試重新整理頁面。
        </p>
      </div>

      <div className="flex flex-col gap-4 w-full max-w-sm">
        <Button 
          onClick={() => reset()} 
          className="h-14 rounded-2xl font-black bg-primary text-primary-foreground shadow-lg hover:brightness-105 active:scale-95 transition-all gap-2"
        >
          <RefreshCcw className="h-5 w-5" /> 立即重新整理頁面
        </Button>
        
        <Button 
          variant="outline"
          asChild
          className="h-14 rounded-2xl font-black bg-white border-2 gap-2 shadow-sm"
        >
          <Link href="/">
            <Home className="h-5 w-5" /> 返回首頁
          </Link>
        </Button>

        <Separator className="my-2" />

        <Button 
          variant="secondary"
          asChild
          className="h-12 rounded-xl font-bold bg-green-50 text-green-700 hover:bg-green-600 hover:text-white transition-all gap-2"
        >
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="h-5 w-5" /> 聯絡 WhatsApp 專人協助
          </a>
        </Button>
      </div>

      {error.digest && (
        <p className="mt-12 text-[10px] text-slate-300 font-mono tracking-widest uppercase">System Reference: {error.digest}</p>
      )}
    </div>
  );
}
