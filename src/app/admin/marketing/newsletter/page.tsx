"use client";

import { useMemo } from "react";
import Link from "next/link";
import { 
  Mail, 
  Download, 
  Search, 
  Trash2, 
  Calendar,
  CheckCircle2,
  Filter,
  Send,
  Loader2,
  User
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n/i18n-context";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useCollection } from "@/firebase";
import { collection, query, orderBy, deleteDoc, doc } from "firebase/firestore";
import { useState } from "react";

export default function NewsletterAdmin() {
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const db = useFirestore();
  const mktT = t.admin.marketing;

  const [searchQuery, setSearchQuery] = useState("");

  // 1. 實時從 Firestore 獲取訂閱者名單
  // 增加防禦：若 db 未就緒則返回 null
  const subscribersQuery = useMemo(() => {
    if (!db) return null;
    return query(
      collection(db, 'subscribers'),
      orderBy('subscribedAt', 'desc')
    );
  }, [db]);

  const { data: subscribers, loading } = useCollection<any>(subscribersQuery);

  const filteredSubscribers = useMemo(() => {
    if (!subscribers) return [];
    return subscribers.filter(s => 
      s.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [subscribers, searchQuery]);

  const handleExport = () => {
    if (!subscribers || subscribers.length === 0) {
      toast({ title: "No data to export", variant: "destructive" });
      return;
    }

    const headers = ["Email", "Subscribed Date", "Source"];
    const rows = subscribers.map(s => [
      s.email, 
      s.subscribedAt?.seconds ? new Date(s.subscribedAt.seconds * 1000).toISOString() : "Unknown", 
      s.source || "Direct"
    ]);
    const csvContent = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `subscribers_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({ title: "Export Success", description: "Subscriber list downloaded." });
  };

  const removeSubscriber = async (email: string) => {
    if (!db) return;
    if (!confirm(lang === 'en' ? `Remove ${email} from list?` : `確定要將 ${email} 從名單中移除？`)) return;
    
    try {
      await deleteDoc(doc(db, 'subscribers', email.toLowerCase()));
      toast({ title: "Subscriber Removed" });
    } catch (e) {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">{mktT.newsletter}</h1>
          <p className="text-muted-foreground">管理電子報訂閱名單 (實時同步 Firestore)。此名單可用於群發活動。</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2 rounded-xl h-11 px-6 font-bold" onClick={handleExport} disabled={loading}>
            <Download className="h-4 w-4" />
            匯出名單 (CSV)
          </Button>
          <Button className="bg-primary text-primary-foreground gap-2 font-black rounded-xl h-11 px-8 shadow-lg" asChild>
            <Link href="/admin/notifications/broadcast/new">
              <Send className="h-4 w-4" />
              向此名單發信
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Total Audience</p>
            <h3 className="text-3xl font-black text-primary">{loading ? "..." : subscribers?.length || 0}</h3>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-green-50 rounded-2xl overflow-hidden">
          <CardContent className="p-6">
            <p className="text-[10px] font-black text-green-700 uppercase tracking-widest mb-1">Status</p>
            <h3 className="text-2xl font-black text-green-600 flex items-center gap-2">
              <CheckCircle2 className="h-6 w-6" /> Healthy
            </h3>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b bg-muted/5 p-6">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search email address..." 
              className="pl-10 h-11 bg-white border-none shadow-inner rounded-xl" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-24 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-4">Syncing mailing list...</p>
            </div>
          ) : filteredSubscribers.length === 0 ? (
            <div className="py-24 text-center flex flex-col items-center gap-4 text-muted-foreground/30 italic">
              <Mail className="h-12 w-12" />
              <p>沒有找到符合條件的訂閱者。</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/5">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-8">Subscriber Email</TableHead>
                  <TableHead>Join Date</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Registered User?</TableHead>
                  <TableHead className="text-right pr-8">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubscribers.map((s) => (
                  <TableRow key={s.id} className="group hover:bg-muted/30 transition-colors">
                    <TableCell className="pl-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                          <Mail className="h-4 w-4" />
                        </div>
                        <span className="font-bold text-sm">{s.email}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground font-medium">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3 w-3" /> 
                        {s.subscribedAt?.seconds ? new Date(s.subscribedAt.seconds * 1000).toLocaleString() : "Unknown"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] font-black uppercase bg-muted/50 border-none px-3 h-6">
                        {s.source || "Direct"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {s.userId ? (
                        <Badge className="bg-blue-100 text-blue-700 border-none font-bold text-[10px] h-6 px-3">
                          <User className="h-3 w-3 mr-1" /> Yes
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground opacity-40">Guest</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right pr-8">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9 text-destructive hover:bg-red-50 rounded-full" 
                        onClick={() => removeSubscriber(s.email)}
                      >
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
    </div>
  );
}
