'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCcw, Home, MessageCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * 運行時錯誤邊界 (Runtime Error Boundary)
 * 強化用戶導向功能，提供 WhatsApp 即時諮詢按鈕。
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
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-6 text-center bg-slate-50 font-sans rounded-[2rem] my-12 mx-4 border-2 border-dashed">
      <div className="h-20 w-20 bg-red-100 rounded-full flex items-center justify-center text-red-600 mb-6 shadow-inner">
        <AlertTriangle className="h-10 w-10" />
      </div>
      <h2 className="text-3xl font-black tracking-tight mb-4 text-slate-900">載入頁面時發生錯誤</h2>
      <p className="text-slate-500 mb-10 max-w-md mx-auto text-sm font-medium leading-relaxed">
        抱歉，目前的頁面暫時無法正確顯示。這可能是由於網路連線不穩。如果您在結帳或購買時遇到此錯誤，請立即透過 WhatsApp 聯絡我們，我們將有人手為您跟進訂單。
      </p>

      <div className="flex flex-col sm:flex-row gap-4 w-full justify-center max-w-xl">
        <Button 
          onClick={() => reset()} 
          className="h-14 px-10 rounded-2xl font-black bg-[#FACC15] text-slate-900 shadow-lg hover:brightness-105 active:scale-95 transition-all gap-2 flex-1"
        >
          <RefreshCcw className="h-5 w-5" /> 嘗試重新載入
        </Button>
        
        <Button 
          variant="outline"
          asChild
          className="h-14 px-10 rounded-2xl font-black bg-green-50 border-green-200 text-green-700 hover:bg-green-600 hover:text-white active:scale-95 transition-all gap-2 flex-1"
        >
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="h-5 w-5" /> WhatsApp 支援
          </a>
        </Button>
      </div>

      <Button 
        variant="ghost"
        onClick={() => window.location.href = '/'} 
        className="mt-8 h-10 px-8 rounded-xl font-bold text-muted-foreground hover:text-primary gap-2"
      >
        <Home className="h-4 w-4" /> 返回首頁
      </Button>

      {error.digest && (
        <p className="mt-12 text-[10px] text-slate-300 font-mono tracking-widest uppercase">Debug ID: {error.digest}</p>
      )}
    </div>
  );
}
