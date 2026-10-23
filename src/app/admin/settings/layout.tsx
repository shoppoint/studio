
"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { 
  Info, 
  Truck, 
  CreditCard, 
  Crown, 
  LineChart, 
  Bell, 
  Server,
  ChevronRight
} from "lucide-react";
import { useI18n } from "@/lib/i18n/i18n-context";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  const pathname = usePathname();
  const setT = t.admin.settings;

  const navItems = [
    { href: "/admin/settings", label: setT.general, icon: Info },
    { href: "/admin/settings/logistics", label: setT.logistics, icon: Truck },
    { href: "/admin/settings/payment", label: setT.payment_methods, icon: CreditCard },
    { href: "/admin/settings/notifications", label: setT.notifications, icon: Bell },
    { href: "/admin/settings/membership", label: setT.membership, icon: Crown },
    { href: "/admin/settings/marketing", label: setT.marketing, icon: LineChart },
    { href: "/admin/settings/infra", label: setT.data_infra, icon: Server },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">{setT.title}</h1>
          <p className="text-muted-foreground">{setT.subtitle}</p>
        </div>
      </div>

      {/* Navigation Menu - Updated to allow wrapping (two rows) if space is limited */}
      <div className="sticky top-[64px] z-20 bg-background/95 backdrop-blur py-4 border-b">
        <div className="flex flex-wrap items-center gap-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-full transition-all font-bold text-xs uppercase tracking-wider border mb-1",
                  isActive 
                    ? "bg-primary text-primary-foreground border-primary shadow-md scale-105" 
                    : "bg-white text-muted-foreground hover:text-foreground hover:border-primary/50 border-muted"
                )}
              >
                <item.icon className={cn("h-3.5 w-3.5", isActive ? "animate-pulse" : "")} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>

      <div className="w-full animate-in fade-in duration-500">
        {children}
      </div>
    </div>
  );
}
