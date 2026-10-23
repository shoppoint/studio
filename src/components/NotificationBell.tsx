
'use client';

import { useState, useMemo } from "react";
import { 
  Bell, 
  Package, 
  Tag, 
  Info, 
  CheckCheck, 
  ShoppingBag, 
  Loader2, 
  ChevronRight 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n/i18n-context";
import { useUser, useFirestore, useCollection } from "@/firebase";
import { format } from "date-fns";
import Link from "next/link";
import { collection, query, orderBy, limit, doc, updateDoc, writeBatch } from "firebase/firestore";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

/**
 * 頂部通知鈴鐺 (防斷言錯誤優化版)
 * 修正：加入匿名用戶判定，防止在結帳頁面產生權限錯誤。
 */
export function NotificationBell() {
  const { t } = useI18n();
  const { user } = useUser();
  const db = useFirestore();
  const [isOpen, setIsOpen] = useState(false);

  // 實時監聽當前用戶的通知集合
  const notificationsQuery = useMemo(() => {
    // 核心修正：如果用戶未登入或為匿名用戶 (Anonymous)
    if (!user || user.isAnonymous || !db) return null;
    
    return query(
      collection(db, 'users', user.uid, 'notifications'),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
  }, [db, user]);

  const { data: notifications, loading } = useCollection<any>(notificationsQuery);

  const unreadCount = useMemo(() => 
    notifications?.filter(n => !n.isRead).length || 0, 
  [notifications]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'order': return <Package className="h-4 w-4 text-blue-500" />;
      case 'promo': return <Tag className="h-4 w-4 text-orange-500" />;
      default: return <Info className="h-4 w-4 text-amber-700" />;
    }
  };

  const markAsRead = async (id: string) => {
    if (!user || !db) return;
    const ref = doc(db, 'users', user.uid, 'notifications', id);
    await updateDoc(ref, { isRead: true });
  };

  const markAllAsRead = async () => {
    if (!user || !notifications || !db) return;
    const unread = notifications.filter(n => !n.isRead);
    if (unread.length === 0) return;

    const batch = writeBatch(db);
    unread.forEach(n => {
      const ref = doc(db, 'users', user.uid, 'notifications', n.id);
      batch.update(ref, { isRead: true });
    });
    await batch.commit();
  };

  // 核心修正：如果是匿名用戶，完全不渲染組件
  if (!user || user.isAnonymous) return null;

  return (
    <div className="relative">
      <Button 
        variant="ghost" 
        size="icon" 
        className="rounded-full relative hover:bg-primary/10 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge className="absolute -right-1 -top-1 h-4 min-w-4 flex items-center justify-center p-0.5 text-[10px] bg-destructive text-destructive-foreground border-2 border-background animate-pulse font-black">
            {unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white border rounded-2xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200 overflow-hidden border-primary/10">
            <div className="flex items-center justify-between p-4 border-b bg-primary/5">
              <h3 className="font-black text-sm uppercase tracking-tight flex items-center gap-2 text-amber-800">
                <Bell className="h-4 w-4 text-amber-700" />
                {t.notifications.title}
              </h3>
              {unreadCount > 0 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-7 text-[10px] font-black uppercase text-amber-700 hover:bg-primary/10"
                  onClick={markAllAsRead}
                >
                  <CheckCheck className="h-3 w-3 mr-1 text-amber-700" />
                  {t.notifications.mark_all_read}
                </Button>
              )}
            </div>
            
            <ScrollArea className="max-h-[450px]">
              {loading ? (
                <div className="p-12 text-center flex flex-col items-center gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">載入中...</p>
                </div>
              ) : !notifications || notifications.length === 0 ? (
                <div className="p-12 text-center space-y-4">
                  <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mx-auto">
                    <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground font-medium">{t.notifications.empty}</p>
                </div>
              ) : (
                <div className="flex flex-col">
                  {notifications.map((n) => (
                    <div 
                      key={n.id} 
                      className={cn(
                        "p-4 border-b last:border-0 hover:bg-muted/30 transition-colors cursor-pointer relative",
                        !n.isRead ? "bg-primary/5" : ""
                      )}
                      onClick={() => markAsRead(n.id)}
                    >
                      {!n.isRead && <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-700" />}
                      <div className="flex gap-3">
                        <div className="mt-1 bg-white p-2 rounded-lg shadow-sm border">{getIcon(n.type)}</div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-black leading-tight pr-4">{n.title}</p>
                            <span className="text-[9px] font-bold text-muted-foreground whitespace-nowrap bg-muted px-1.5 rounded">
                              {n.createdAt?.seconds ? format(new Date(n.createdAt.seconds * 1000), 'HH:mm') : 'Just now'}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                            {n.content}
                          </p>
                          {n.actionUrl && (
                            <Link 
                              href={n.actionUrl} 
                              className="text-[10px] font-bold text-amber-700 flex items-center gap-1 mt-2 hover:underline decoration-amber-700/30"
                              onClick={() => setIsOpen(false)}
                            >
                              立即查看 <ChevronRight className="h-2 w-2 text-amber-700" />
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
            
            <div className="p-3 border-t text-center bg-muted/5">
              <Button variant="link" size="sm" className="text-[10px] font-black uppercase text-amber-700 hover:text-amber-800" asChild onClick={() => setIsOpen(false)}>
                <Link href="/profile?tab=notifications">{t.notifications.view_all}</Link>
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
