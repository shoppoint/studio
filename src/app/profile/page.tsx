
"use client";

import { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { 
  User, Package, MapPin, Settings, LogOut, ChevronRight, ChevronLeft, 
  Mail, Calendar, Crown, Coins, Zap, Sparkles, LayoutGrid, Loader2,
  ShieldCheck, ShoppingBag, Eye, Clock, Building2, Gift, MessageSquare, Star, ArrowRight,
  CheckCircle2, Bell, Trash2, CheckCheck, Info, Tag, Copy, Share2, Facebook,
  ShoppingCart,
  Bookmark
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useI18n } from "@/lib/i18n/i18n-context";
import { useUser, useAuth, useFirestore, useCollection } from "@/firebase";
import { signOut, deleteUser } from "firebase/auth";
import { doc, updateDoc, serverTimestamp, deleteDoc, collection, query, where, orderBy, setDoc, getDocs, writeBatch, or, limit } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { ProfileAddressBook } from "@/components/profile/ProfileAddressBook";
import { ProfilePreferences } from "@/components/profile/ProfilePreferences";
import { ProfileAccountSettings } from "@/components/profile/ProfileAccountSettings";

function WhatsappIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.03 0C5.449 0 .081 5.377.077 11.967c0 2.105.547 4.16 1.587 6.006L0 24l6.149-1.613a11.83 11.83 0 005.874 1.552h.005c6.581 0 11.95-5.377 11.953-11.967a11.82 11.82 0 00-3.502-8.472" />
    </svg>
  );
}

function ProfileContent() {
  const { t, lang } = useI18n();
  const { user, loading: authLoading, isAdmin, userData } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isRealUser = useMemo(() => user && !user.isAnonymous, [user]);
  
  useEffect(() => {
    if (mounted && !authLoading && !isRealUser) {
      router.replace("/");
    }
  }, [isRealUser, authLoading, mounted, router]);

  const userRef = useMemo(() => user ? doc(db, 'users', user.uid) : null, [db, user]);
  
  const { data: userAddresses, loading: addressesLoading } = useCollection<any>(
    isRealUser ? query(collection(db, 'users', user!.uid, 'addresses'), orderBy('createdAt', 'desc')) : null
  );
  
  const { data: bookmarks, loading: bookmarksLoading } = useCollection<any>(
    isRealUser ? query(collection(db, 'users', user!.uid, 'bookmarks'), orderBy('savedAt', 'desc')) : null
  );

  const ordersQuery = useMemo(() => {
    if (!isRealUser || !db || !user?.email) return null;
    return query(
      collection(db, 'orders'), 
      or(
        where('customerId', '==', user.uid),
        where('email', '==', user.email.toLowerCase().trim())
      ),
      orderBy('createdAt', 'desc'),
      limit(20) // 核心修正：加入限制以符合安全性規則 limit <= 20 的要求
    );
  }, [db, isRealUser, user]);

  const { data: userOrders, loading: ordersLoading } = useCollection<any>(ordersQuery);

  const notificationsQuery = useMemo(() => {
    if (!isRealUser || !db) return null;
    return query(
      collection(db, 'users', user!.uid, 'notifications'),
      orderBy('createdAt', 'desc')
    );
  }, [db, isRealUser, user]);
  const { data: notifications, loading: notificationsLoading } = useCollection<any>(notificationsQuery);

  const userReviewsQuery = useMemo(() => isRealUser ? query(
    collection(db, 'global_reviews'),
    where('authorUid', '==', user!.uid)
  ) : null, [db, isRealUser, user]);
  const { data: userReviews } = useCollection<any>(userReviewsQuery);

  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  
  const [displayName, setDisplayName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [phone, setPhone] = useState("");
  const [birthMonth, setBirthMonth] = useState("01");
  const [birthDay, setBirthDay] = useState("01");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [skinType, setSkinType] = useState("Normal");
  const [ageRange, setAgeRange] = useState("25-34");

  useEffect(() => {
    if (userData) {
      setDisplayName(userData.displayName || "");
      setCompanyName(userData.companyName || "");
      setPhone(userData.phone || "");
      if (userData.birthday?.includes('-')) {
        const [m, d] = userData.birthday.split('-');
        setBirthMonth(m); setBirthDay(d);
      }
      setSelectedInterests(userData.interests || []);
      setSkinType(userData.skinType || "Normal");
      setAgeRange(userData.ageRange || "25-34");
    }
  }, [userData]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['overview', 'bookmarks', 'subscriptions', 'interests', 'orders', 'addresses', 'settings', 'to-review', 'notifications'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const pendingReviews = useMemo(() => {
    if (!userOrders || !userReviews) return [];
    const deliveredItems = userOrders
      .filter(o => o.status === 'delivered')
      .flatMap(o => (o.items || []).map((it: any) => ({ ...it, orderDate: o.createdAt })));
    const reviewedProductIds = new Set(userReviews.map(r => r.productId));
    const uniquePending = new Map();
    deliveredItems.forEach(item => {
      const pid = item.productId || item.id;
      if (!reviewedProductIds.has(pid) && !uniquePending.has(pid)) {
        uniquePending.set(pid, item);
      }
    });
    return Array.from(uniquePending.values());
  }, [userOrders, userReviews]);

  const handleSaveProfile = async () => {
    if (!userRef) return;
    setLoading(true);
    try {
      await updateDoc(userRef, { displayName, companyName, phone, birthday: `${birthMonth}-${birthDay}`, updatedAt: serverTimestamp() });
      toast({ title: t.common.success });
    } catch (e) { toast({ title: t.common.error, variant: "destructive" }); } finally { setLoading(false); }
  };

  const handleToggleNewsletter = async (checked: boolean) => {
    if (!user?.email) return;
    setNewsletterLoading(true);
    try {
      if (checked) {
        await setDoc(doc(db, 'subscribers', user.email.toLowerCase()), { email: user.email.toLowerCase(), subscribedAt: serverTimestamp(), source: 'User Profile', userId: user.uid });
      } else {
        await deleteDoc(doc(db, 'subscribers', user.email.toLowerCase()));
      }
      await updateDoc(doc(db, 'users', user.uid), { isNewsletterSubscribed: checked });
      toast({ title: checked ? "Subscribed" : "Unsubscribed" });
    } catch (e) { toast({ title: "Error", variant: "destructive" }); } finally { setNewsletterLoading(false); }
  };

  const handleSavePrefs = async () => {
    if (!userRef) return;
    setLoading(true);
    try {
      await updateDoc(userRef, { interests: selectedInterests, skinType, ageRange, updatedAt: serverTimestamp() });
      toast({ title: t.common.success });
    } catch (e) { toast({ title: t.common.error, variant: "destructive" }); } finally { setLoading(false); }
  };

  const handleSaveAddress = async (id: string | null, data: any) => {
    if (!user) return;
    const ref = id ? doc(db, 'users', user.uid, 'addresses', id) : doc(collection(db, 'users', user.uid, 'addresses'));
    await setDoc(ref, { ...data, updatedAt: serverTimestamp(), createdAt: id ? data.createdAt : serverTimestamp() });
  };

  const handleDeleteAccount = async () => {
    if (!user || !userRef) return;
    setLoading(true);
    try {
      await deleteDoc(userRef);
      await deleteUser(user);
      router.push("/");
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); } finally { setLoading(false); }
  };

  const markAllRead = async () => {
    if (!user || !notifications) return;
    const unread = notifications.filter(n => !n.isRead);
    if (unread.length === 0) return;
    const batch = writeBatch(db);
    unread.forEach(n => {
      const ref = doc(db, 'users', user.uid, 'notifications', n.id);
      batch.update(ref, { isRead: true });
    });
    await batch.commit();
    toast({ title: "全部標記為已讀" });
  };

  const deleteNotification = async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'notifications', id));
      toast({ title: "通知已刪除" });
    } catch (e) { toast({ title: "刪除失敗", variant: "destructive" }); }
  };

  const isEn = lang === 'en';

  const referralMessageFull = useMemo(() => {
    if (!userData?.referralCode) return "";
    return isEn 
      ? `Join SHOP POINT with my code ${userData.referralCode} and get welcome rewards! Register at: https://shoppoint.hk/login`
      : `【SHOP POINT】送您迎新獎賞！註冊時輸入我的邀請碼：${userData.referralCode}，即可獲取額外積分！立即行動：https://shoppoint.hk/login`;
  }, [userData?.referralCode, isEn]);

  const handleCopyReferral = () => {
    if (!referralMessageFull) return;
    navigator.clipboard.writeText(referralMessageFull);
    toast({ title: isEn ? "Message Copied!" : "分享訊息已複製" });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered': return <Badge className="bg-green-100 text-green-800 border-green-200 h-5 px-2 rounded text-[10px] font-black uppercase">Delivered</Badge>;
      case 'shipped': return <Badge className="bg-blue-100 text-blue-800 border-blue-200 h-5 px-2 rounded text-[10px] font-black uppercase">Shipped</Badge>;
      case 'processing': return <Badge className="bg-orange-100 text-orange-800 border-green-200 h-5 px-2 rounded text-[10px] font-black uppercase">Processing</Badge>;
      case 'pending': return <Badge variant="outline" className="h-5 px-2 rounded text-[10px] font-black uppercase border-amber-200 text-amber-700 bg-amber-50">Pending</Badge>;
      case 'cancelled': return <Badge variant="destructive" className="h-5 px-2 rounded text-[10px] font-black uppercase">Cancelled</Badge>;
      default: return <Badge variant="secondary" className="h-5 px-2 rounded text-[10px] font-black uppercase">{status}</Badge>;
    }
  };

  const getPaymentBadge = (status: string) => {
    switch (status) {
      case 'paid': return <Badge className="bg-green-100 text-green-800 border-none h-5 px-2 rounded text-[9px] font-black uppercase">PAID</Badge>;
      case 'unpaid': return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 h-5 px-2 rounded text-[9px] font-black uppercase">UNPAID</Badge>;
      default: return <Badge variant="secondary" className="h-5 px-2 rounded text-[9px] font-black uppercase">{status}</Badge>;
    }
  };

  if (authLoading || !mounted || (user && !userData) || !isRealUser) {
    return <div className="h-96 flex flex-col items-center justify-center space-y-4"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="text-sm font-bold text-muted-foreground tracking-widest uppercase">驗證帳戶權限中...</p></div>;
  }

  const profT = t.profile;
  const intT = profT.interests;

  return (
    <div className="flex flex-col md:flex-row gap-8 items-start">
      <aside className={cn("w-full md:w-80 shrink-0 space-y-6", activeTab !== 'overview' && "hidden md:block")}>
        <Card className="border-none shadow-sm overflow-hidden text-center bg-white rounded-3xl">
          <div className="h-24 bg-primary/10 relative" />
          <CardContent className="relative pt-0 px-6 pb-6 text-center md:text-left">
            <Avatar className="h-24 w-24 border-4 border-white shadow-xl -mt-12 mx-auto md:mx-0">
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-black">{user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="pt-4">
              <h2 className="text-xl font-bold">{userData?.displayName || "Shopper"}</h2>
              <p className="text-xs text-muted-foreground font-mono">{user?.email}</p>
            </div>
          </CardContent>
        </Card>

        <nav className="space-y-1">
          <Button variant={activeTab === 'overview' ? "secondary" : "ghost"} className="w-full justify-between h-12 px-4 rounded-xl" onClick={() => setActiveTab('overview')}><span className="flex items-center gap-3 font-bold"><LayoutGrid className="h-4 w-4" /> {t.profile.overview}</span><ChevronRight className="h-4 w-4 opacity-50" /></Button>
          <Button variant={activeTab === 'bookmarks' ? "secondary" : "ghost"} className="w-full justify-between h-12 px-4 rounded-xl" onClick={() => setActiveTab('bookmarks')}><span className="flex items-center gap-3 font-bold"><Bookmark className="h-4 w-4" /> 我的收藏 (Saved)</span><ChevronRight className="h-4 w-4 opacity-50" /></Button>
          <Button variant="ghost" className="w-full justify-between h-12 px-4 rounded-xl" asChild>
            <Link href="/profile/rewards">
              <span className="flex items-center gap-3 font-bold"><Gift className="h-4 w-4 text-primary" /> {t.profile.my_rewards}</span>
              <ChevronRight className="h-4 w-4 opacity-50" />
            </Link>
          </Button>
          <Button variant={activeTab === 'orders' ? "secondary" : "ghost"} className="w-full justify-between h-12 px-4 rounded-xl" onClick={() => setActiveTab('orders')}><span className="flex items-center gap-3 font-bold"><Package className="h-4 w-4" /> {t.profile.orders}</span><ChevronRight className="h-4 w-4 opacity-50" /></Button>
          <Button variant={activeTab === 'notifications' ? "secondary" : "ghost"} className="w-full justify-between h-12 px-4 rounded-xl" onClick={() => setActiveTab('notifications')}>
            <span className="flex items-center gap-3 font-bold"><Bell className="h-4 w-4" /> {t.notifications.title}</span>
            <div className="flex items-center gap-2">
              {notifications?.filter(n => !n.isRead).length! > 0 && <Badge className="bg-destructive text-white border-none h-5 min-w-5 p-1 flex items-center justify-center font-black">{notifications?.filter(n => !n.isRead).length}</Badge>}
              <ChevronRight className="h-4 w-4 opacity-50" />
            </div>
          </Button>
          <Button variant={activeTab === 'to-review' ? "secondary" : "ghost"} className="w-full justify-between h-12 px-4 rounded-xl relative" onClick={() => setActiveTab('to-review')}>
            <span className="flex items-center gap-3 font-bold"><MessageSquare className="h-4 w-4" /> {t.profile.pending_reviews}</span>
            <div className="flex items-center gap-2">
              {pendingReviews.length > 0 && <Badge className="bg-orange-600 text-white border-none h-5 min-w-5 p-1 flex items-center justify-center font-black">{pendingReviews.length}</Badge>}
              <ChevronRight className="h-4 w-4 opacity-50" />
            </div>
          </Button>
          <Button variant={activeTab === 'interests' ? "secondary" : "ghost"} className="w-full justify-between h-12 px-4 rounded-xl" onClick={() => setActiveTab('interests')}><span className="flex items-center gap-3 font-bold"><Sparkles className="h-4 w-4 text-primary" /> {t.profile.interests.title}</span><ChevronRight className="h-4 w-4 opacity-50" /></Button>
          <Button variant={activeTab === 'addresses' ? "secondary" : "ghost"} className="w-full justify-between h-12 px-4 rounded-xl" onClick={() => setActiveTab('addresses')}><span className="flex items-center gap-3 font-bold"><MapPin className="h-4 w-4" /> {t.profile.addresses}</span><ChevronRight className="h-4 w-4 opacity-50" /></Button>
          <Button variant={activeTab === 'settings' ? "secondary" : "ghost"} className="w-full justify-between h-12 px-4 rounded-xl" onClick={() => setActiveTab('settings')}><span className="flex items-center gap-3 font-bold"><Settings className="h-4 w-4" /> {t.profile.settings}</span><ChevronRight className="h-4 w-4 opacity-50" /></Button>
          <Separator className="my-2" />
          <Button variant="ghost" className="w-full justify-start text-destructive hover:bg-red-50 h-12 px-4 rounded-xl" onClick={() => signOut(auth)}><LogOut className="mr-3 h-4 w-4" /><span className="font-bold">{t.nav.logout}</span></Button>
        </nav>
      </aside>

      <div className="flex-1 w-full">
        {activeTab !== 'overview' && <Button variant="ghost" size="sm" onClick={() => setActiveTab('overview')} className="md:hidden mb-4 p-0 font-bold text-primary"><ChevronLeft className="h-5 w-5" /> Back</Button>}
        
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <h1 className="text-3xl font-black font-headline">{lang === 'en' ? 'Hello' : '你好'}, {userData?.displayName || "Shopper"}!</h1>
            <Card className="border-none shadow-2xl bg-gradient-to-br from-[#FFD700] via-[#F59E0B] to-[#EA580C] text-white rounded-[2.5rem] overflow-hidden relative group">
              <CardContent className="p-8 md:p-12 space-y-8 relative z-10">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl md:text-2xl font-black font-headline tracking-tight text-white drop-shadow-sm">{profT.referral.card_title}</h3>
                  <p className="text-3xl font-black text-white">{userData?.points || 0} <span className="text-lg opacity-80">{profT.points_short}</span></p>
                </div>
                <div className="bg-white/15 backdrop-blur-md rounded-[2rem] p-6 md:p-10 border border-white/20 flex flex-col md:flex-row items-center justify-between gap-8 shadow-inner">
                  <code className="text-4xl md:text-5xl font-black tracking-[0.2em] font-mono text-white drop-shadow-md select-all">{userData?.referralCode || "------"}</code>
                  <Button variant="secondary" className="rounded-2xl h-14 px-8 font-black gap-2 bg-white text-orange-600 hover:bg-slate-50 shadow-xl" onClick={handleCopyReferral}><Copy className="h-5 w-5" /> {profT.referral.copy_code}</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'bookmarks' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <h2 className="text-2xl font-bold font-headline flex items-center gap-3"><Bookmark className="h-6 w-6 text-primary" /> 我的收藏文章</h2>
            {bookmarksLoading ? <div className="py-20 text-center"><Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" /></div> : !bookmarks || bookmarks.length === 0 ? (
              <div className="py-20 text-center border-4 border-dashed rounded-[3rem] bg-white space-y-4">
                <Bookmark className="h-12 w-12 text-muted-foreground/20 mx-auto" />
                <p className="text-muted-foreground font-bold italic">您尚未收藏任何文章。</p>
                <Button asChild variant="outline" className="rounded-xl border-primary text-primary font-bold"><Link href="/news">前往閱讀最新消息</Link></Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {bookmarks.map((b: any) => (
                  <Link key={b.id} href={`/news/${b.articleId}`}>
                    <Card className="border-none shadow-sm hover:shadow-md transition-all rounded-3xl overflow-hidden bg-white group">
                      <div className="relative aspect-[21/9] bg-muted overflow-hidden">
                        {b.coverImage && <Image src={b.coverImage} alt="" fill className="object-cover group-hover:scale-105 transition-all" />}
                      </div>
                      <CardContent className="p-5">
                        <h4 className="font-bold text-sm line-clamp-1 group-hover:text-primary transition-colors">{b.title}</h4>
                        <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold">Saved at {format(new Date(b.savedAt?.seconds * 1000 || Date.now()), 'yyyy-MM-dd')}</p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'notifications' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold font-headline flex items-center gap-3"><Bell className="h-6 w-6 text-primary" /> {t.notifications.title}</h2>
              {notifications && notifications.filter(n => !n.isRead).length > 0 && <Button variant="outline" size="sm" className="rounded-xl font-bold gap-2" onClick={markAllRead}><CheckCheck className="h-4 w-4" /> 全部標記為已讀</Button>}
            </div>
            <div className="grid gap-4">
              {notificationsLoading ? <div className="py-20 text-center"><Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" /></div> : !notifications || notifications.length === 0 ? (
                <div className="py-20 text-center border-4 border-dashed rounded-[3rem] bg-white space-y-4"><Bell className="h-12 w-12 text-muted-foreground/20 mx-auto" /><p className="text-muted-foreground font-bold italic">{t.notifications.empty}</p></div>
              ) : notifications.map((n) => (
                <Card key={n.id} className={cn("border-none shadow-sm bg-white rounded-2xl overflow-hidden group transition-all relative", !n.isRead ? "ring-2 ring-primary/20 shadow-md" : "opacity-80")}>
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center shrink-0 border", n.type === 'order' ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-primary/10 text-primary border-primary/10")}><Package className="h-6 w-6" /></div>
                      <div className="flex-1 space-y-2">
                        <div className="flex justify-between items-start"><div><h4 className="font-black text-base leading-tight">{n.title}</h4><p className="text-[10px] font-bold text-muted-foreground mt-1">{n.createdAt?.seconds ? format(new Date(n.createdAt.seconds * 1000), 'yyyy-MM-dd HH:mm') : '--'}</p></div><button onClick={() => deleteNotification(n.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="h-4 w-4" /></button></div>
                        <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{n.content}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <h2 className="text-2xl font-bold font-headline flex items-center gap-2"><Package className="h-6 w-6 text-primary" /> {t.profile.orders}</h2>
            <Card className="border-none shadow-sm overflow-hidden bg-white rounded-3xl">
              <CardContent className="p-0">
                {ordersLoading ? <div className="py-20 text-center"><Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" /></div> : !userOrders || userOrders.length === 0 ? (
                  <div className="py-20 text-center space-y-4"><ShoppingCart className="h-12 w-12 text-muted-foreground/20 mx-auto" /><p className="text-sm text-muted-foreground font-bold">{t.profile.no_orders}</p></div>
                ) : (
                  <Table>
                    <TableHeader className="bg-muted/5"><TableRow><TableHead className="pl-6">Order ID</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead><TableHead className="text-right pr-6">Total</TableHead></TableRow></TableHeader>
                    <TableBody>{userOrders.map((o) => (<TableRow key={o.id} className="group hover:bg-muted/30"><TableCell className="pl-6 font-black text-xs">#{o.orderId || o.id.slice(-8)}</TableCell><TableCell className="text-[10px] font-bold">{o.createdAt?.seconds ? format(new Date(o.createdAt.seconds * 1000), 'yyyy-MM-dd') : '--'}</TableCell><TableCell>{getStatusBadge(o.status)}</TableCell><TableCell className="text-right pr-6 font-black text-primary">${(o.total || 0).toFixed(2)}</TableCell></TableRow>))}</TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'addresses' && (
          <ProfileAddressBook user={user} addresses={userAddresses} loading={addressesLoading} onSave={handleSaveAddress} onDelete={(id:any) => deleteDoc(doc(db, 'users', user!.uid, 'addresses', id))} t={t} lang={lang} />
        )}
        
        {activeTab === 'interests' && (
          <ProfilePreferences selectedInterests={selectedInterests} setSelectedInterests={setSelectedInterests} skinType={skinType} setSkinType={setSkinType} ageRange={ageRange} setAgeRange={setAgeRange} onSave={handleSavePrefs} loading={loading} t={t} lang={lang} />
        )}
        
        {activeTab === 'settings' && (
          <ProfileAccountSettings user={user} userData={userData} displayName={displayName} setDisplayName={setDisplayName} companyName={companyName} setCompanyName={setCompanyName} phone={phone} setPhone={setPhone} birthMonth={birthMonth} setBirthMonth={setBirthMonth} birthDay={birthDay} setBirthDay={setBirthDay} onSave={handleSaveProfile} onResetPassword={() => user?.email && signOut(auth)} onToggleNewsletter={handleToggleNewsletter} onDeleteAccount={handleDeleteAccount} loading={loading} newsletterLoading={newsletterLoading} isPasswordUser={user?.providerData.some(p => p.providerId === 'password')} t={t} lang={lang} />
        )}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-12">
        <Suspense fallback={null}><ProfileContent /></Suspense>
      </main>
      <Footer />
    </div>
  );
}
