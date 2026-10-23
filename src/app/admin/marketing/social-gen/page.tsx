"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

/**
 * @fileOverview AI 社交媒體貼文生成頁面 (已移除)
 */
export default function RemovedSocialGenPage() {
  const router = useRouter();
  
  useEffect(() => {
    // 重新導向至儀表板，防止死連結
    router.replace("/admin/dashboard");
  }, [router]);

  return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">
        功能遷移中...
      </p>
    </div>
  );
}