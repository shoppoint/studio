
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  ShoppingCart, 
  Search, 
  Mail, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  MoreVertical,
  Loader2,
  Send,
  User as UserIcon,
  Package,
  TrendingUp,
  Filter,
  Check,
  Zap,
  Sparkles,
  Edit3,
  X,
  History,
  FileText,
  AlertCircle,
  Hash,
  XCircle,
  Phone,
  Save,
  Globe,
  Ghost,
  Trash2,
  UserX
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useI18n } from "@/lib/i18n/i18n-context";
import { useFirestore, useCollection } from "@/firebase";
import { collection, query, orderBy, doc, updateDoc, serverTimestamp, deleteDoc } from "firebase/firestore";
import { triggerNotification } from "@/services/communication-service";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function AbandonedCartsPage() {
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const db = useFirestore();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewStatus, setViewStatus] = useState<string>("leads"); 
  const [notifyLoading, setNotifyLoading] = useState<string | null>(null);
  
  const [selectedCart, setSelectedCart] = useState<any | null>(null);
  const [isManageOpen, setIsManageOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [linkedOrderId, setLinkedOrderId] = useState("");

  const cartsQuery = useMemo(() => {
    if (!db) return null;
    return query(
      collection(db, 'abandoned_carts'),
      orderBy('updatedAt', 'desc')
    );
  }, [db]);

  const { data: carts, loading } = useCollection<any>(cartsQuery);

  /**
   * 修正後的數據統計邏輯
   * Leads: 有聯絡資訊且「尚未挽回」的人
   * Recovered: 已成功轉化的人
   * Anonymous: 沒有聯絡資訊的人
   */
  const stats = useMemo(() => {
    if (!carts) return { totalSessions: 0, leads: 0, recovered: 0, anonymous: 0, recoveryRate: 0 };
    
    const leadsList = carts.filter(c => !!(c.customer?.email || c.customer?.phone) && c.status !== 'recovered' && c.status !== 'lost');
    const recoveredList = carts.filter(c => c.status === 'recovered');
    const anonymousList = carts.filter(c => !(c.customer?.email || c.customer?.phone) && c.status !== 'recovered');
    
    // 計算轉化率時，以所有「曾留下聯絡資訊」的會話為分母
    const totalPotential = carts.filter(c => !!(c.customer?.email || c.customer?.phone)).length;

    return {
      totalSessions: carts.length,
      leads: leadsList.length,
      recovered: recoveredList.length,
      anonymous: anonymousList.length,
      recoveryRate: totalPotential > 0 ? (recoveredList.length / totalPotential) * 100 : 0
    };
  }, [carts]);

  const filteredCarts = useMemo(() => {
    if (!carts) return [];
    return carts.filter(c => {
      let matchesStatus = true;
      const hasContact = !!(c.customer?.email || c.customer?.phone);
      
      if (viewStatus === 'leads') matchesStatus = hasContact && c.status !== 'recovered' && c.status !== 'lost';
      else if (viewStatus === 'recovered') matchesStatus = c.status === 'recovered';
      else if (viewStatus === 'anonymous') matchesStatus = !hasContact && c.status !== 'recovered';
      else if (viewStatus === 'all') matchesStatus = true;
      
      const search = searchQuery.toLowerCase().trim();
      const matchesSearch = !search || 
        (c.customer?.name || "").toLowerCase().includes(search) ||
        (c.customer?.email || "").toLowerCase().includes(search) ||
        c.id.toLowerCase().includes(search);
        
      return matchesStatus && matchesSearch;
    });
  }, [carts, searchQuery, viewStatus]);

  const handleOpenManage = (cart: any) => {
    setSelectedCart({ ...cart });
    setLinkedOrderId(cart.linkedOrderId || "");
    setIsManageOpen(true);
  };

  const handleSaveManagement = async () => {
    if (!db || !selectedCart) return;
    setIsSaving(true);
    try {
      const updateData: any = {
        status: selectedCart.status,
        internalNotes: selectedCart.internalNotes || "",
        updatedAt: serverTimestamp()
      };
      if (selectedCart.status === 'recovered' && linkedOrderId) {
        updateData.linkedOrderId = linkedOrderId;
      }
      await updateDoc(doc(db, 'abandoned_carts', selectedCart.id), updateData);
      toast({ title: "跟進記錄已更新" });
      setIsManageOpen(false);
    } catch (e: any) {
      toast({ title: "儲存失敗", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendFollowup = async (cart: any) => {
    if (!db) return;
    if (!cart.customer?.email) {
      toast({ title: "無法發送", description: "該遊客尚未提供電郵地址。", variant: "destructive" });
      return;
    }
    setNotifyLoading(cart.id);
    try {
      const res = await triggerNotification(db, 'cart_followup', {
        ...cart,
        email: cart.customer.email,
        name: cart.customer.name,
        id: cart.id
      }, lang, true);

      if (res.success) {
        await updateDoc(doc(db, 'abandoned_carts', cart.id), {
          status: 'contacted',
          lastContactMethod: 'email',
          lastContactAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        toast({ title: "跟進電郵已發送" });
      } else {
        throw new Error(res.message);
      }
    } catch (e: any) {
      toast({ title: "發送失敗", description: e.message, variant: "destructive" });
    } finally {
      setNotifyLoading(null);
    }
  };

  const getStatusBadge = (cart: any) => {
    const isAnonymous = !(cart.customer?.email || cart.customer?.phone);
    if (cart.status === 'recovered') return <Badge className="bg-green-100 text-green-700 border-none font-black text-[9px] uppercase"><CheckCircle2 className="h-3 w-3 mr-1" /> Recovered</Badge>;
    if (isAnonymous) return <Badge variant="secondary" className="opacity-40 text-[9px] font-black uppercase"><Ghost className="h-3 w-3 mr-1" /> Anonymous</Badge>;
    if (cart.status === 'contacted') return <Badge className="bg-blue-100 text-blue-700 border-none font-black text-[9px] uppercase"><Send className="h-3 w-3 mr-1" /> Contacted</Badge>;
    return <Badge variant="outline" className="text-[9px] font-black uppercase text-orange-600 border-orange-200 bg-orange-50">Lead</Badge>;
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-full">
            <Link href="/admin/marketing"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <h1 className="text-3xl font-black font-headline tracking-tight">會話與遺棄購物車</h1>
            <p className="text-muted-foreground">追蹤所有加購會話，包含匿名趨勢與可跟進的潛在客戶。</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <Card className="border-none shadow-sm bg-white rounded-2xl border-t-4 border-orange-500">
          <CardContent className="p-6">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">待跟進客戶 (Leads)</p>
            <h3 className="text-2xl font-black">{loading ? "..." : stats.leads}</h3>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-indigo-600 text-white rounded-2xl">
          <CardContent className="p-6">
            <p className="text-[10px] font-black uppercase opacity-60 tracking-widest mb-1">總瀏覽會話 (Sessions)</p>
            <h3 className="text-2xl font-black">{loading ? "..." : stats.totalSessions}</h3>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-green-50 rounded-2xl border border-green-100 border-t-4 border-green-500">
          <CardContent className="p-6">
            <p className="text-[10px] font-black text-green-700 uppercase tracking-widest mb-1">成功挽回</p>
            <h3 className="text-2xl font-black text-green-600">{loading ? "..." : stats.recovered}</h3>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm bg-white rounded-2xl border-t-4 border-slate-300">
          <CardContent className="p-6">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">挽回率</p>
            <h3 className="text-2xl font-black text-slate-800">{loading ? "..." : stats.recoveryRate.toFixed(1)}%</h3>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-white rounded-3xl">
        <CardHeader className="border-b bg-muted/5 p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="搜尋顧客、電郵或 ID..." 
              className="pl-10 bg-white border-none shadow-inner h-11 rounded-xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex bg-muted/30 p-1 rounded-xl gap-1 border">
            <Button variant={viewStatus === 'leads' ? 'default' : 'ghost'} size="sm" className="rounded-lg font-bold px-4" onClick={() => setViewStatus('leads')}>待跟進 ({stats.leads})</Button>
            <Button variant={viewStatus === 'recovered' ? 'default' : 'ghost'} size="sm" className="rounded-lg font-bold px-4" onClick={() => setViewStatus('recovered')}>已挽回 ({stats.recovered})</Button>
            <Button variant={viewStatus === 'anonymous' ? 'default' : 'ghost'} size="sm" className="rounded-lg font-bold px-4" onClick={() => setViewStatus('anonymous')}>匿名訪客 ({stats.anonymous})</Button>
            <Button variant={viewStatus === 'all' ? 'default' : 'ghost'} size="sm" className="rounded-lg font-bold px-4" onClick={() => setViewStatus('all')}>全部</Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-24 text-center"><Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" /></div>
          ) : filteredCarts.length === 0 ? (
            <div className="py-24 text-center text-muted-foreground italic flex flex-col items-center gap-4">
              <Ghost className="h-12 w-12 opacity-10" />
              <div className="space-y-1">
                <p className="font-bold">此分類目前無數據</p>
                <p className="text-xs">
                  {viewStatus === 'leads' ? "所有留下聯絡資料的客人都已成功挽回或已流失。" : "暫無符合條件的會話記錄。"}
                </p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/5">
                <TableRow>
                  <TableHead className="pl-8">顧客與來源路徑</TableHead>
                  <TableHead>內容明細</TableHead>
                  <TableHead>會話價值</TableHead>
                  <TableHead>狀態</TableHead>
                  <TableHead className="text-right pr-8">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCarts.map((cart) => (
                  <TableRow key={cart.id} className={cn("group hover:bg-muted/30 transition-colors", cart.status === 'recovered' ? "bg-green-50/20" : "")}>
                    <TableCell className="pl-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-black text-[10px]">
                          {cart.customer?.name?.charAt(0) || "G"}
                        </div>
                        <div>
                          <p className="font-bold text-sm">{cart.customer?.name || "Anonymous Guest"}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {cart.sourcePath && <Badge variant="outline" className="bg-white text-[8px] font-black uppercase text-primary border-primary/20 h-4 px-1.5"><Globe className="h-2 w-2 mr-1" /> {cart.sourcePath}</Badge>}
                            <p className="text-[10px] text-muted-foreground font-mono">{cart.customer?.email || cart.customer?.phone || "No Contacts"}</p>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5 max-w-[250px]">
                        {cart.items?.slice(0, 3).map((item: any, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-[9px] h-5 bg-white whitespace-nowrap font-bold">
                            {item.qty}x {item.name}
                          </Badge>
                        ))}
                        {cart.items?.length > 3 && <span className="text-[9px] font-bold opacity-40">+{cart.items.length - 3}</span>}
                      </div>
                    </TableCell>
                    <TableCell className="font-black text-primary text-base">${Number(cart.total || 0).toFixed(1)}</TableCell>
                    <TableCell>{getStatusBadge(cart)}</TableCell>
                    <TableCell className="text-right pr-8">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full text-primary" onClick={() => handleOpenManage(cart)}><Edit3 className="h-4 w-4" /></Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-9 w-9 rounded-full"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl shadow-2xl border-none">
                            <DropdownMenuItem className="rounded-xl py-2.5 font-bold text-primary" onClick={() => handleSendFollowup(cart)} disabled={notifyLoading === cart.id || !cart.customer?.email}><Mail className="mr-2 h-4 w-4" /> 發送跟進電郵</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="rounded-xl py-2.5 text-destructive" onClick={() => deleteDoc(doc(db!, 'abandoned_carts', cart.id))}><Trash2 className="mr-2 h-4 w-4" /> 刪除紀錄</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isManageOpen} onOpenChange={setIsManageOpen}>
        <DialogContent className="rounded-[2rem] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>管理遺棄會話</DialogTitle>
            <DialogDescription>記錄跟進狀況或將其標記為已挽回。</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label>狀態 (Status)</Label>
              <Select value={selectedCart?.status} onValueChange={(v) => setSelectedCart({...selectedCart, status: v})}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="pending">待跟進 (Pending)</SelectItem>
                  <SelectItem value="contacted">已聯繫 (Contacted)</SelectItem>
                  <SelectItem value="recovered">成功挽回 (Recovered)</SelectItem>
                  <SelectItem value="lost">確認流失 (Lost)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {selectedCart?.status === 'recovered' && (
              <div className="grid gap-2 animate-in slide-in-from-top-2">
                <Label>關聯訂單編號 (Linked Order ID)</Label>
                <Input value={linkedOrderId} onChange={e => setLinkedOrderId(e.target.value)} placeholder="填入轉化後的單號..." />
              </div>
            )}
            <div className="grid gap-2">
              <Label>內部跟進備註</Label>
              <Textarea value={selectedCart?.internalNotes} onChange={e => setSelectedCart({...selectedCart, internalNotes: e.target.value})} placeholder="例如：客人表示運費太貴，已給予免運優惠..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsManageOpen(false)}>取消</Button>
            <Button onClick={handleSaveManagement} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "儲存記錄"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
