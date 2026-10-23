
"use client";

import { useState, useMemo, useEffect } from "react";
import { 
  Search, 
  MoreHorizontal, 
  Shield, 
  UserCheck, 
  UserMinus,
  Mail,
  Eye,
  MessageSquarePlus,
  UserCog,
  Loader2,
  Users as UsersIcon,
  Clock,
  Plus, 
  CheckSquare, 
  Square, 
  Coins, 
  ArrowRight,
  Zap,
  Ticket,
  AlertTriangle,
  Globe,
  Key
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useI18n } from "@/lib/i18n/i18n-context";
import { useFirestore, useCollection } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export default function AdminUsers() {
  const { t, lang } = useI18n();
  const db = useFirestore();
  const [searchQuery, setSearchQuery] = useState("");

  // 監聽使用者集合 - 加入 db 防禦性檢查
  const usersQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'users'), orderBy('updatedAt', 'desc'));
  }, [db]);

  const { data: rawUsers, loading } = useCollection<any>(usersQuery);

  const filteredUsers = useMemo(() => {
    if (!rawUsers) return [];
    return rawUsers.filter(u => 
      (u.displayName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [rawUsers, searchQuery]);

  const getProviderIcon = (provider: string) => {
    if (provider === 'google.com') return <Globe className="h-3 w-3 text-blue-600" />;
    if (provider === 'password') return <Key className="h-3 w-3 text-amber-600" />;
    return null;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">{t.admin.users.title}</h1>
          <p className="text-muted-foreground">{t.admin.users.subtitle}</p>
        </div>
        <Button className="bg-primary text-primary-foreground font-black shadow-lg rounded-xl h-11 px-6" asChild>
          <Link href="/admin/users/new"><Plus className="mr-2 h-4 w-4" /> {t.admin.users.add_user}</Link>
        </Button>
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-white rounded-3xl">
        <CardHeader className="bg-muted/5 p-6 border-b">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder={t.admin.users.search_placeholder} 
              className="pl-10 h-11 bg-white rounded-xl border-none shadow-inner" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-24 text-center"><Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" /></div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/5">
                <TableRow>
                  <TableHead className="pl-8">{t.admin.users.table.user}</TableHead>
                  <TableHead>登入來源</TableHead>
                  <TableHead>{t.admin.users.table.role}</TableHead>
                  <TableHead>最後活動</TableHead>
                  <TableHead className="text-right pr-8">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="pl-8 py-5">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-primary text-primary-foreground font-black">
                            {(u.displayName || u.email || "U").charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold text-sm">{u.displayName || "Shopper"}</p>
                          <p className="text-[10px] text-muted-foreground font-mono">{u.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getProviderIcon(u.signInProvider)}
                        <span className="text-[10px] font-black uppercase text-muted-foreground">{u.signInProvider?.replace('.com', '') || "---"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] font-bold uppercase">{u.role}</Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-medium">
                      {u.updatedAt?.seconds ? format(new Date(u.updatedAt.seconds * 1000), 'yyyy-MM-dd') : "--"}
                    </TableCell>
                    <TableCell className="text-right pr-8">
                       <Button variant="ghost" size="icon" asChild className="rounded-full hover:bg-primary/10 transition-colors"><Link href={`/admin/users/${u.id}`}><Eye className="h-4 w-4" /></Link></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
