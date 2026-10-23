
"use client";

import Link from "next/link";
import Image from "next/image";
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  BarChart3, 
  Settings, 
  HelpCircle,
  LogOut,
  Sparkles,
  ChevronLeft,
  Home,
  Megaphone,
  Languages
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useI18n } from "@/lib/i18n/i18n-context";
import { useRouter } from "next/navigation";
import { useUser, useAuth } from "@/firebase";
import { signOut } from "firebase/auth";

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useUser();
  const { t, setLang } = useI18n();
  const router = useRouter();

  if (loading) return null;
  if (!user) {
    router.push("/login");
    return null;
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen bg-muted/10 w-full">
        <VendorSidebar />
        <SidebarInset className="flex flex-col">
          <header className="h-16 border-b bg-background px-6 flex items-center justify-between sticky top-0 z-10">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <Separator orientation="vertical" className="h-6" />
              <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground flex items-center gap-1">
                <ChevronLeft className="h-4 w-4" />
                返回前台商店
              </Link>
            </div>
            <div className="flex items-center gap-4">
              {/* Language Switcher */}
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
                <p className="text-sm font-bold">Luxe Gadgets Store</p>
                <p className="text-xs text-muted-foreground">尊貴合作商店</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-primary flex items-center justify-center font-bold text-primary-foreground border-2 border-primary/20">
                LG
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

function VendorSidebar() {
  const { setOpenMobile, isMobile } = useSidebar();
  const { t } = useI18n();
  const auth = useAuth();
  const router = useRouter();
  
  const closeOnMobile = () => {
    if (isMobile) setOpenMobile(false);
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  return (
    <Sidebar className="border-r border-border/50">
      <SidebarHeader className="h-16 flex items-center px-6">
        <Link href="/" className="flex items-center space-x-3 group" onClick={closeOnMobile}>
          <div className="relative h-8 w-8 overflow-hidden rounded-lg">
            <Image src="/logo.png" alt="Logo" fill className="object-contain" />
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
                  <span className="font-bold">返回商店</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>管理中心</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Dashboard">
                  <Link href="/vendor/dashboard" onClick={closeOnMobile}>
                    <LayoutDashboard />
                    <span>儀表板</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="My Products">
                  <Link href="/vendor/products" onClick={closeOnMobile}>
                    <Package />
                    <span>我的產品</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Orders">
                  <Link href="/vendor/orders" onClick={closeOnMobile}>
                    <ShoppingCart />
                    <span>訂單管理</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Promotions">
                  <Link href="/vendor/promotions" onClick={closeOnMobile}>
                    <Megaphone />
                    <span>促銷管理</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>系統與配置</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Settings">
                  <Link href="/vendor/settings" onClick={closeOnMobile}>
                    <Settings />
                    <span>商店設定</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Support">
                  <Link href="/vendor/support" onClick={closeOnMobile}>
                    <HelpCircle />
                    <span>商家支援</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-4">
        <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>登出</span>
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
