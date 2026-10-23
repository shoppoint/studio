"use client";

import Link from "next/link";
import Image from "next/image";
import { 
  LayoutDashboard, 
  Users, 
  Store, 
  ShieldCheck, 
  LogOut, 
  ChevronLeft, 
  Package, 
  Tags, 
  Award, 
  Warehouse, 
  ShoppingCart, 
  Home, 
  FileText, 
  Megaphone, 
  Monitor,
  Settings,
  Bell,
  Sparkles,
  Languages,
  ImageIcon,
  Activity,
  Share2,
  MessageSquare, 
  Loader2, 
  MessageCircle,
  AlertTriangle,
  SmartphoneNfc,
  Mail,
  Zap,
  Printer
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel, 
  SidebarHeader, 
  SidebarInset, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem, 
  SidebarProvider, 
  SidebarTrigger, 
  useSidebar
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUser, useAuth } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/i18n-context";
import { signOut } from "firebase/auth";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { AiStatusIndicator } from "@/components/admin/AiStatusIndicator";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, isShopManager, isAdmin, userData } = useUser();
  const { t, setLang } = useI18n();
  const auth = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 核心修正：加入管理員電郵白名單判定，防止資料庫讀取延遲導致被踢出
  const ADMIN_EMAILS = ['shoppoint.hk@gmail.com', 'bsconcept.hk@gmail.com'];
  const isAuthorizedEmail = user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase());
  
  // 只要角色是管理員，或者是白名單電郵，就視為有權限
  const hasAccess = isShopManager || isAuthorizedEmail;

  if (loading || !mounted || (user && !userData)) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
          <p className="text-xs font-black uppercase tracking-widest text-muted-foreground animate-pulse">正在驗證安全連線...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-muted/30 p-4">
        <Card className="max-w-md w-full border-none shadow-xl bg-white rounded-[2.5rem] overflow-hidden">
          <CardContent className="p-12 text-center space-y-6">
            <div className="h-20 w-20 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600">
              <AlertTriangle className="h-10 w-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-black font-headline tracking-tight">存取權限受限</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                您的帳號 (<strong>{user?.email}</strong>) 目前被分配為 <strong>{userData?.role || 'Guest'}</strong> 角色。<br/>
                請在 Firebase Console 的 <code>users</code> 集合中將角色改為 <code>Superadmin</code>。
              </p>
            </div>
            <div className="pt-4 flex flex-col gap-3">
              <Button asChild className="rounded-xl h-12 font-bold bg-primary">
                <Link href="/">返回首頁</Link>
              </Button>
              <Button variant="ghost" className="text-destructive font-bold" onClick={() => signOut(auth)}>
                切換帳號登入
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen bg-muted/10 w-full">
        <AppSidebar user={user} auth={auth} isAdmin={isAdmin || !!isAuthorizedEmail} />
        <SidebarInset className="flex flex-col">
          <header className="h-16 border-b bg-background px-6 flex items-center justify-between sticky top-0 z-40 shadow-sm">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <Separator orientation="vertical" className="h-6" />
              <Link href="/" className="text-sm font-bold text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                <ChevronLeft className="h-4 w-4" />
                {t.admin.sidebar.back_to_store}
              </Link>
            </div>
            <div className="flex items-center gap-4">
              {/* AI 預熱與診斷工具 */}
              <AiStatusIndicator />
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full h-9 w-9">
                    <Languages className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-xl shadow-xl border-none">
                  <DropdownMenuItem onClick={() => setLang("en")}>English</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setLang("zh-HK")}>繁體中文 (香港)</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Separator orientation="vertical" className="h-6 mx-1" />

              <div className="text-right hidden sm:block">
                <p className="text-sm font-black">{user?.displayName || (isAuthorizedEmail ? "Platform Admin" : "Shop Manager")}</p>
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">{(isAdmin || isAuthorizedEmail) ? "Superadmin Access" : "Store Management"}</p>
              </div>
              <div className={cn(
                "h-10 w-10 rounded-full flex items-center justify-center font-black text-primary-foreground border-2 shadow-inner",
                (isAdmin || isAuthorizedEmail) ? "bg-primary border-primary/20" : "bg-blue-600 border-blue-200"
              )}>
                {user?.email?.charAt(0).toUpperCase() || "A"}
              </div>
            </div>
          </header>
          <main className="flex-1 p-6 overflow-auto">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

function AppSidebar({ user, auth, isAdmin }: { user: any, auth: any, isAdmin: boolean }) {
  const { t } = useI18n();
  const router = useRouter();
  const { setOpenMobile, isMobile } = useSidebar();

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  const closeOnMobile = () => {
    if (isMobile) setOpenMobile(false);
  };

  return (
    <Sidebar className="border-r border-border/50 shadow-xl">
      <SidebarHeader className="h-16 flex items-center px-6">
        <Link href="/" className="flex items-center space-x-3 group" onClick={closeOnMobile}>
          <div className="relative h-8 w-8">
            <Image src="/logo.png" alt="Logo" width={32} height={32} />
          </div>
          <span className="text-lg font-black tracking-tighter text-foreground font-headline">
            SHOP <span className="text-primary">POINT</span>
          </span>
        </Link>
      </SidebarHeader>
      <Separator />
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton asChild className="text-primary hover:text-primary hover:bg-primary/5">
                <Link href="/" onClick={closeOnMobile}>
                  <Home className="h-4 w-4" />
                  <span className="font-bold">{t.admin.sidebar.back_to_store}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{t.admin.sidebar.platform_control}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={t.admin.sidebar.system_overview}>
                  <Link href="/admin/dashboard" onClick={closeOnMobile}>
                    <LayoutDashboard />
                    <span>{t.admin.sidebar.system_overview}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="溝通中心" className="bg-primary/10 text-primary font-bold">
                  <Link href="/admin/notifications" onClick={closeOnMobile}>
                    <MessageSquare className="text-primary" />
                    <span className="font-black">全通路溝通中心</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={t.nav.pos}>
                  <Link href="/admin/pos" onClick={closeOnMobile}>
                    <Monitor />
                    <span>{t.nav.pos}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={t.admin.sidebar.order_mgmt}>
                  <Link href="/admin/orders" onClick={closeOnMobile}>
                    <ShoppingCart />
                    <span>{t.admin.sidebar.order_mgmt}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              
              {isAdmin && (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip={t.admin.sidebar.vendor_mgmt}>
                      <Link href="/admin/vendors" onClick={closeOnMobile}>
                        <Store />
                        <span>{t.admin.sidebar.vendor_mgmt}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild tooltip={t.admin.sidebar.user_mgmt}>
                      <Link href="/admin/users" onClick={closeOnMobile}>
                        <Users />
                        <span>{t.admin.sidebar.user_mgmt}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{t.admin.sidebar.marketing_crm}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={t.admin.sidebar.marketing_loyalty}>
                  <Link href="/admin/marketing" onClick={closeOnMobile}>
                    <Megaphone />
                    <span>{t.admin.sidebar.marketing_loyalty}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={t.admin.sidebar.abandoned_carts}>
                  <Link href="/admin/marketing/abandoned-carts" onClick={closeOnMobile}>
                    <ShoppingCart className="text-orange-500" />
                    <span>{t.admin.sidebar.abandoned_carts}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip={t.admin.marketing.newsletter}>
                    <Link href="/admin/marketing/newsletter" onClick={closeOnMobile}>
                      <Mail className="text-blue-500" />
                      <span>{t.admin.marketing.newsletter}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{t.admin.sidebar.content_mgmt}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={t.admin.sidebar.article_mgmt}>
                  <Link href="/admin/articles" onClick={closeOnMobile}>
                    <FileText />
                    <span>{t.admin.sidebar.article_mgmt}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="評論管理" className="text-orange-600 font-bold">
                  <Link href="/admin/reviews" onClick={closeOnMobile}>
                    <MessageCircle className="h-4 w-4" />
                    <span>評論管理</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={t.admin.sidebar.media_library}>
                  <Link href="/admin/media" onClick={closeOnMobile}>
                    <ImageIcon className="text-primary" />
                    <span>{t.admin.sidebar.media_library}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>{t.admin.sidebar.catalog_mgmt}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={t.admin.sidebar.product_mgmt}>
                  <Link href="/admin/products" onClick={closeOnMobile}>
                    <Package />
                    <span>{t.admin.sidebar.product_mgmt}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={t.admin.sidebar.stock_alerts} className="text-orange-600 font-black bg-orange-50/50">
                  <Link href="/admin/products/stock-alerts" onClick={closeOnMobile}>
                    <Bell className="h-4 w-4" />
                    <span>{t.admin.sidebar.stock_alerts}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={t.admin.sidebar.warehouse_mgmt}>
                  <Link href="/admin/warehouses" onClick={closeOnMobile}>
                    <Warehouse />
                    <span>{t.admin.sidebar.warehouse_mgmt}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={t.admin.sidebar.category_mgmt}>
                  <Link href="/admin/categories" onClick={closeOnMobile}>
                    <Tags />
                    <span>{t.admin.sidebar.category_mgmt}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={t.admin.sidebar.brand_mgmt}>
                  <Link href="/admin/brands" onClick={closeOnMobile}>
                    <Award />
                    <span>{t.admin.sidebar.brand_mgmt}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={t.admin.sidebar.label_gen} className="text-indigo-600 font-bold bg-indigo-50/50">
                  <Link href="/admin/labels" onClick={closeOnMobile}>
                    <Printer className="h-4 w-4" />
                    <span>{t.admin.sidebar.label_gen}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAdmin && (
          <SidebarGroup className="mt-auto">
            <SidebarGroupLabel>{t.admin.sidebar.configuration}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip={t.admin.sidebar.platform_settings}>
                    <Link href="/admin/settings" onClick={closeOnMobile}>
                      <Settings />
                      <span>{t.admin.sidebar.platform_settings}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip={t.admin.sidebar.data_infra} className="bg-indigo-500/10 text-indigo-600 font-bold">
                    <Link href="/admin/settings/infra" onClick={closeOnMobile}>
                      <Activity />
                      <span>{t.admin.sidebar.data_infra}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarFooter className="p-4">
        <Button 
          variant="ghost" 
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span className="font-bold">{t.nav.logout}</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
