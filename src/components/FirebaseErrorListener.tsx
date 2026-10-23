'use client';

import { useState, useEffect } from "react";
import { 
  ShieldAlert, 
  Terminal, 
  Info,
  X,
  Database
} from "lucide-react";
import { 
  AlertDialog, 
  AlertDialogContent, 
  AlertDialogHeader, 
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction
} from "@/components/ui/alert-dialog";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { useUser } from "@/firebase";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

/**
 * @fileOverview Firebase 權限診斷監聽組件
 * 負責捕獲所有 FirestorePermissionError 並彈出詳細的除錯面板。
 */
export function FirebaseErrorListener() {
  const [error, setError] = useState<FirestorePermissionError | null>(null);
  const { user } = useUser();

  useEffect(() => {
    const handlePermissionError = (err: any) => {
      // 確保即使傳進來的是普通 Object，也能正確提取 context
      const diagnosticError = err instanceof FirestorePermissionError 
        ? err 
        : new FirestorePermissionError(err.context || err);
      
      setError(diagnosticError);
    };

    errorEmitter.on('permission-error', handlePermissionError);
    return () => {
      errorEmitter.removeListener('permission-error', handlePermissionError);
    };
  }, []);

  if (!error || !error.context) return null;

  const ctx = error.context;

  return (
    <AlertDialog open={!!error} onOpenChange={(v) => !v && setError(null)}>
      <AlertDialogContent className="sm:max-w-[550px] rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl z-[200]">
        <div className="p-8 bg-slate-900 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12">
            <ShieldAlert className="h-32 w-32" />
          </div>
          <div className="relative z-10 space-y-2">
            <AlertDialogTitle className="text-2xl font-black font-headline">權限診斷報告</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400 font-medium">
              系統偵測到一項被雲端安全性規則拒絕的請求。
            </AlertDialogDescription>
          </div>
          <button onClick={() => setError(null)} className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-8 bg-white space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 px-1">
              <Terminal className="h-4 w-4 text-primary" />
              <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Debug Info</span>
            </div>
            
            <div className="p-6 bg-slate-50 rounded-2xl font-mono text-[11px] space-y-3 border">
              <div className="flex justify-between border-b pb-2">
                <span className="opacity-60 uppercase">Operation:</span>
                <span className="font-black text-primary uppercase">{ctx.operation}</span>
              </div>
              <div className="space-y-1">
                <span className="opacity-60 block uppercase">Failed Path:</span>
                <span className="text-slate-900 break-all leading-relaxed font-bold">/databases/shoppoint-hk/documents/{ctx.path}</span>
              </div>
              <Separator className="border-dashed" />
              <div className="flex justify-between pt-1">
                <span className="opacity-60 uppercase">User Status:</span>
                <Badge variant="outline" className={cn("border-none h-5 text-[9px] font-black", user?.isAnonymous ? "bg-orange-500 text-white" : "bg-green-500 text-white")}>
                  {user?.isAnonymous ? 'ANONYMOUS' : 'SIGNED_IN'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="opacity-60 uppercase">Database:</span>
                <span className="text-slate-900 font-bold flex items-center gap-1">
                  <Database className="h-3 w-3" /> shoppoint-hk
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-start gap-3 shadow-sm">
            <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-xs text-blue-900 font-bold uppercase">修復建議</p>
              <p className="text-[11px] text-blue-800 leading-relaxed">
                管理員權限已設為 Token 直通模式。若仍報錯，請確保登入電郵為 <b>shoppoint.hk@gmail.com</b> 或 <b>bsconcept.hk@gmail.com</b>。
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 bg-muted/20 border-t flex justify-end">
          <AlertDialogAction 
            onClick={() => setError(null)}
            className="bg-primary text-primary-foreground rounded-xl h-11 px-8 font-black shadow-lg"
          >
            關閉報告
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}