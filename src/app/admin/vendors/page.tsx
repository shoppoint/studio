"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { 
  Search, 
  Store, 
  Edit2,
  Trash2,
  Loader2,
  Plus,
  Package,
  Calendar,
  ShieldCheck,
  UserCircle
} from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useI18n } from "@/lib/i18n/i18n-context";
import { useFirestore, useCollection } from "@/firebase";
import { collection, query, doc, deleteDoc, where, orderBy } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function AdminVendors() {
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const db = useFirestore();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all_stores");

  // 1. 獲取商店檔案
  const vendorsQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'vendors'), orderBy('updatedAt', 'desc'));
  }, [db]);
  const { data: stores, loading: storesLoading } = useCollection<any>(vendorsQuery);

  // 2. 獲取具有 Vendor 角色的用戶，用於顯示「待關聯」帳號
  const vendorUsersQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'users'), where('role', '==', 'Vendor'));
  }, [db]);
  const { data: vendorUsers, loading: usersLoading } = useCollection<any>(vendorUsersQuery);

  const loading = storesLoading || usersLoading;

  const pendingOnboardingUsers = useMemo(() => {
    if (!vendorUsers || !stores) return [];
    return vendorUsers.filter(user => 
      !stores.some(store => store.linkedUserId === user.uid || store.email === user.email)
    );
  }, [vendorUsers, stores]);

  const filteredStores = useMemo(() => {
    if (!stores) return [];
    return stores.filter(v => {
      const nameStr = (v.name || "").toLowerCase();
      const emailStr = (v.email || "").toLowerCase();
      const search = searchQuery.toLowerCase();
      return nameStr.includes(search) || emailStr.includes(search);
    });
  }, [stores, searchQuery]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(lang === 'en' ? `Delete store ${name}?` : `確定要刪除商店 ${name}？`)) return;
    try {
      await deleteDoc(doc(db!, 'vendors', id));
      toast({ title: t.common.success, description: "Vendor removed." });
    } catch (e) {
      toast({ title: t.common.error, variant: "destructive" });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active': 
        return <Badge className="bg-green-100 text-green-800 border-green-200 h-6 px-3 rounded-lg border-none text-[10px] font-bold">Active</Badge>;
      case 'Pending': 
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 h-6 px-3 rounded-lg text-[10px] font-bold">Pending</Badge>;
      case 'Suspended': 
        return <Badge variant="destructive" className="h-6 px-3 rounded-lg border-none text-[10px] font-bold">Suspended</Badge>;
      default: 
        return <Badge variant="secondary" className="h-6 px-3 rounded-lg border-none text-[10px] font-bold">{status || 'Active'}</Badge>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">{t.admin.vendors.title}</h1>
          <p className="text-muted-foreground">管理商店檔案及特約供應商帳號</p>
        </div>
        <Button className="bg-primary text-primary-foreground font-black shadow-lg rounded-xl h-11 px-8 gap-2" asChild>
          <Link href="/admin/vendors/new"><Plus className="h-4 w-4" /> 建立商家檔案</Link>
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-muted/50 p-1 h-12 rounded-2xl grid grid-cols-2 w-full sm:w-[400px] mb-8">
          <TabsTrigger value="all_stores" className="rounded-xl font-bold">已建立商店 ({stores?.length || 0})</TabsTrigger>
          <TabsTrigger value="pending_onboarding" className="rounded-xl font-bold">待建檔帳號 ({pendingOnboardingUsers.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all_stores" className="space-y-6">
          <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
            <CardHeader className="bg-muted/5 border-b p-6 flex flex-row items-center justify-between">
              <div className="relative flex-1 max-sm:w-full max-w-sm">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="搜尋店名或電郵..." 
                  className="pl-10 h-11 bg-white border-none shadow-inner rounded-xl"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="py-24 text-center"><Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" /></div>
              ) : filteredStores.length === 0 ? (
                <div className="py-24 text-center flex flex-col items-center gap-4 text-muted-foreground">
                  <Store className="h-12 w-12 opacity-20" />
                  <p className="italic">目前沒有商店檔案。</p>
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-muted/5">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="pl-8">商店資訊</TableHead>
                      <TableHead>狀態</TableHead>
                      <TableHead>最後更新</TableHead>
                      <TableHead className="text-right pr-8">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStores.map((vendor) => (
                      <TableRow key={vendor.id} className="group hover:bg-muted/30 transition-colors">
                        <TableCell className="pl-8 py-5">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center overflow-hidden border shrink-0">
                              {vendor.logoUrl ? <img src={vendor.logoUrl} className="object-contain w-full h-full p-2" alt="" /> : <Store className="h-6 w-6 text-muted-foreground/30" />}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-sm leading-none">{vendor.name || "Unnamed"}</p>
                              <p className="text-[10px] text-muted-foreground font-mono mt-1">{vendor.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(vendor.status || 'Active')}</TableCell>
                        <TableCell className="text-[10px] text-muted-foreground font-medium uppercase">
                          {vendor.updatedAt?.seconds ? format(new Date(vendor.updatedAt.seconds * 1000), 'yyyy-MM-dd') : "--"}
                        </TableCell>
                        <TableCell className="text-right pr-8">
                          <Button variant="ghost" size="icon" className="rounded-full" asChild>
                            <Link href={`/admin/vendors/${vendor.id}`}><Edit2 className="h-4 w-4 text-primary" /></Link>
                          </Button>
                          <Button variant="ghost" size="icon" className="rounded-full text-destructive" onClick={() => handleDelete(vendor.id, vendor.name)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pending_onboarding" className="space-y-6">
          <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden border-l-4 border-amber-500">
            <CardHeader className="bg-amber-50/50 border-b">
              <CardTitle className="text-sm font-black uppercase text-amber-800 flex items-center gap-2">
                <UserCircle className="h-4 w-4" /> 待建檔之商家帳號
              </CardTitle>
              <CardDescription>這些用戶已註冊並具備 Vendor 角色，但尚未分配商店檔案。</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {pendingOnboardingUsers.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground italic text-sm">所有商家帳號均已完成建檔。</div>
              ) : (
                <Table>
                  <TableHeader className="bg-muted/5">
                    <TableRow>
                      <TableHead className="pl-8">使用者</TableHead>
                      <TableHead>電郵</TableHead>
                      <TableHead className="text-right pr-8">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingOnboardingUsers.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="pl-8 py-4 font-bold text-sm">{u.displayName || "未命名用戶"}</TableCell>
                        <TableCell className="text-xs font-mono">{u.email}</TableCell>
                        <TableCell className="text-right pr-8">
                          <Button variant="outline" size="sm" className="rounded-xl border-primary text-primary font-bold h-9" asChild>
                            <Link href={`/admin/vendors/new?email=${encodeURIComponent(u.email)}&uid=${u.uid}&name=${encodeURIComponent(u.displayName || "")}`}>
                              協助建立檔案
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
