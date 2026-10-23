
"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  History, 
  Save, 
  Loader2, 
  Zap, 
  Key, 
  Mail, 
  Smartphone, 
  Bell, 
  ChevronRight, 
  Search, 
  XCircle, 
  Clock, 
  CheckCircle2, 
  Trash2, 
  Eye, 
  Server,
  Layout,
  Package,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useI18n } from "@/lib/i18n/i18n-context";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useDoc, useCollection } from "@/firebase";
import { doc, setDoc, serverTimestamp, collection, query, orderBy, limit, deleteDoc } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { format } from "date-fns";
import Link from "next/link";

const TRIGGER_EVENTS = [
  "order_placed",
  "order_placed_pickup",
  "order_reserved",
  "order_processing",
  "order_ready_pickup",
  "order_shipped",
  "order_shipped_direct",
  "order_shipped_hkpost",
  "order_shipped_sf",
  "order_shipped_sf_direct",
  "order_delivered",
  "order_picked_up",
  "order_cancelled_paid",
  "order_cancelled_unpaid",
  "order_awaiting_payment",
  "back_in_stock",
  "cart_followup",
  "member_upgrade",
  "welcome_msg",
  "password_changed"
];

export default function NotificationSettings() {
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const db = useFirestore();
  
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("templates");
  const [activeTrigger, setActiveTrigger] = useState("order_placed");
  const [logSearch, setLogSearch] = useState("");

  // 1. 獲取通訊配置
  const configRef = useMemo(() => {
    if (!db) return null;
    return doc(db, 'config', 'communication');
  }, [db]);
  const { data: configData, loading: configLoading } = useDoc<any>(configRef);

  // 2. 實時監控通訊日誌
  const logsQuery = useMemo(() => {
    if (!db) return null;
    return query(
      collection(db, 'communication_logs'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
  }, [db]);
  const { data: logs, loading: logsLoading } = useCollection<any>(logsQuery);

  const [formData, setFormData] = useState({
    resendApiKey: "",
    whatsapp: {
      accessToken: "",
      phoneNumberId: "",
      wabaId: "",
      businessVerifyCode: ""
    },
    email: {
      fromName: "SHOP POINT",
      user: "info@shoppoint.hk",
      bccEmail: "shoppoint.hk@gmail.com"
    }
  });

  useEffect(() => {
    if (configData) {
      setFormData(prev => ({
        ...prev,
        resendApiKey: configData.resendApiKey || "",
        ...configData,
        email: {
          ...prev.email,
          ...(configData.email || {}),
        }
      }));
    }
  }, [configData]);

  const handleInputChange = (section: string, field: string, value: any) => {
    if (section === "root") {
      setFormData(prev => ({ ...prev, [field]: value }));
    } else {
      setFormData(prev => ({
        ...prev, [section]: { ...(prev as any)[section], [field]: value }
      }));
    }
  };

  const handleSaveConfig = async () => {
    if (!db || !configRef) return;
    setLoading(true);
    try {
      await setDoc(configRef, {
        ...formData,
        updatedAt: serverTimestamp()
      }, { merge: true });
      toast({ title: t.common.success, description: "API 配置已儲存。" });
    } catch (e) {
      toast({ title: t.common.error, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = useMemo(() => {
    if (!logs) return [];
    const q = logSearch.toLowerCase().trim();
    if (!q) return logs;
    return logs.filter(l => 
      (l.recipient || "").toLowerCase().includes(q) || 
      (l.subject || "").toLowerCase().includes(q) ||
      (l.orderId || "").toLowerCase().includes(q)
    );
  }, [logs, logSearch]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent': 
        return <Badge className="bg-green-100 text-green-700 border-none font-black text-[9px] uppercase px-2 h-5"><CheckCircle2 className="h-2.5 w-2.5 mr-1" /> Sent</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-700 border-none font-black text-[9px] uppercase px-2 h-5"><XCircle className="h-2.5 w-2.5 mr-1" /> Failed</Badge>;
      case 'pending':
        return <Badge className="bg-amber-100 text-amber-700 border-none font-black text-[9px] uppercase px-2 h-5 animate-pulse"><Clock className="h-2.5 w-2.5 mr-1" /> Pending</Badge>;
      default:
        return <Badge variant="outline" className="text-[9px] font-black uppercase px-2 h-5">{status}</Badge>;
    }
  };

  const setT = t.admin.settings;

  if (configLoading) {
    return <div className="h-96 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-muted/50 p-1 h-12 rounded-2xl w-full sm:w-auto grid grid-cols-3 mb-8">
          <TabsTrigger value="templates" className="rounded-xl px-8 font-bold flex items-center gap-2">
            <Layout className="h-4 w-4" /> 訊息範本管理
          </TabsTrigger>
          <TabsTrigger value="api_config" className="rounded-xl px-8 font-bold flex items-center gap-2">
            <Server className="h-4 w-4" /> API 配置
          </TabsTrigger>
          <TabsTrigger value="logs" className="rounded-xl px-8 font-bold flex items-center gap-2">
            <History className="h-4 w-4" /> 通訊發送日誌
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 space-y-6">
              <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
                <CardHeader className="bg-muted/10 border-b py-4">
                  <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" /> 事件選擇
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-2">
                  {TRIGGER_EVENTS.map(ev => (
                    <button
                      key={ev}
                      onClick={() => setActiveTrigger(ev)}
                      className={cn(
                        "w-full flex items-center justify-between p-3 px-4 rounded-xl transition-all text-sm font-bold",
                        activeTrigger === ev ? "bg-primary text-primary-foreground shadow-md" : "hover:bg-muted text-muted-foreground"
                      )}
                    >
                      {setT[ev as keyof typeof setT] as string || ev}
                      <ChevronRight className={cn("h-4 w-4 opacity-50", activeTrigger === ev && "opacity-100")} />
                    </button>
                  ))}
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-8 space-y-6">
              <Card className="border-none shadow-sm rounded-3xl bg-white">
                <CardHeader className="border-b bg-muted/5 flex flex-row items-center justify-between">
                  <CardTitle className="text-lg">編輯範本：{setT[activeTrigger as keyof typeof setT] as string}</CardTitle>
                </CardHeader>
                <CardContent className="p-8 text-center space-y-6">
                  <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
                    <Sparkles className="h-10 w-10 animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-xl font-bold">已在全通路中心存檔</h4>
                    <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                      您已在視覺化構建器中儲存了此範本。如需修改內容、排版或增減動態變數，請點擊下方按鈕。
                    </p>
                  </div>
                  <div className="flex justify-center">
                    <Button asChild className="rounded-xl font-bold bg-primary shadow-lg px-8 h-12">
                      <Link href={`/admin/notifications/broadcast/new?template=${activeTrigger}`}>
                        立即進入全通路編輯器 <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="api_config" className="space-y-8 animate-in slide-in-from-bottom-4 duration-300">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden border-l-4 border-indigo-600">
              <CardHeader className="bg-indigo-50/50 border-b p-8">
                <CardTitle className="text-lg flex items-center gap-3">
                  <Key className="h-5 w-5 text-indigo-600" />
                  Resend 電郵 API 金鑰
                </CardTitle>
                <CardDescription>此金鑰用於 Cloud Function 背景發信與 Server Action 發信。</CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="grid gap-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">API Key (re_...)</Label>
                  <Input 
                    type="password"
                    value={formData.resendApiKey} 
                    onChange={(e) => handleInputChange("root", "resendApiKey", e.target.value)}
                    className="h-11 bg-muted/20 border-none rounded-xl font-mono"
                    placeholder="在此填寫 API 金鑰..."
                  />
                </div>
              </CardContent>
              <CardFooter className="bg-muted/5 p-6 border-t">
                <Button className="w-full bg-indigo-600 text-white font-black h-12 rounded-xl" onClick={handleSaveConfig} disabled={loading}>
                  {loading ? <Loader2 className="animate-spin" /> : <Save className="mr-2 h-4 w-4" />} 儲存 API 金鑰
                </Button>
              </CardFooter>
            </Card>

            <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden border-l-4 border-primary">
              <CardHeader className="bg-primary/5 border-b p-8">
                <CardTitle className="text-lg flex items-center gap-3">
                  <Mail className="h-5 w-5 text-primary" />
                  發件人基本配置
                </CardTitle>
                <CardDescription>設定電郵顯示的名稱與回復地址。</CardDescription>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="grid gap-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">顯示名稱 (From Name)</Label>
                  <Input 
                    value={formData.email.fromName} 
                    onChange={(e) => handleInputChange("email", "fromName", e.target.value)}
                    className="h-11 bg-muted/20 border-none rounded-xl font-bold"
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">發件電郵 (Verified Domain Email)</Label>
                  <Input 
                    value={formData.email.user} 
                    onChange={(e) => handleInputChange("email", "user", e.target.value)}
                    className="h-11 bg-muted/20 border-none rounded-xl font-mono"
                    placeholder="info@yourdomain.com"
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">副本抄送 (BCC Admin)</Label>
                  <Input 
                    value={formData.email.bccEmail} 
                    onChange={(e) => handleInputChange("email", "bccEmail", e.target.value)}
                    className="h-11 bg-muted/20 border-none rounded-xl font-mono"
                  />
                </div>
              </CardContent>
              <CardFooter className="bg-muted/5 p-6 border-t">
                <Button className="w-full bg-primary text-primary-foreground font-black h-12 rounded-xl" onClick={handleSaveConfig} disabled={loading}>
                  {loading ? <Loader2 className="animate-spin" /> : <Save className="mr-2 h-4 w-4" />} 儲存發件人設定
                </Button>
              </CardFooter>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="logs" className="space-y-6 animate-in slide-in-from-right-4 duration-300">
          <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
            <CardHeader className="bg-muted/5 border-b p-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="space-y-1">
                <CardTitle className="text-lg font-black flex items-center gap-2">
                  <History className="h-5 w-5 text-primary" /> 發送日誌快照
                </CardTitle>
                <CardDescription>顯示最近 50 筆跨渠道通訊記錄，包含錯誤診斷。</CardDescription>
              </div>
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="搜尋收件人或單號..." 
                  value={logSearch}
                  onChange={(e) => setLogSearch(e.target.value)}
                  className="pl-10 h-11 bg-white border-none shadow-inner rounded-xl"
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {logsLoading ? (
                <div className="py-24 text-center"><Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" /></div>
              ) : filteredLogs.length === 0 ? (
                <div className="py-24 text-center flex flex-col items-center gap-4 text-muted-foreground italic">
                  <Mail className="h-12 w-12 opacity-10" />
                  <p>目前暫無通訊日誌記錄。</p>
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-muted/5">
                    <TableRow>
                      <TableHead className="pl-8">發送時間</TableHead>
                      <TableHead>事件與主旨</TableHead>
                      <TableHead>收件人</TableHead>
                      <TableHead>狀態</TableHead>
                      <TableHead className="text-right pr-8">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => (
                      <TableRow key={log.id} className="group hover:bg-muted/30 transition-colors">
                        <TableCell className="pl-8 py-5">
                          <p className="text-[10px] font-black text-slate-500 uppercase">
                            {log.createdAt?.seconds ? format(new Date(log.createdAt.seconds * 1000), 'MM-dd HH:mm') : '--'}
                          </p>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <Badge variant="outline" className="text-[8px] font-black uppercase h-4 bg-muted/50 border-none">{log.event || 'MANUAL'}</Badge>
                            <p className="text-xs font-bold truncate max-w-[250px]">{log.subject}</p>
                            {log.orderId && (
                              <Link href={`/admin/orders/${log.orderId}`} className="text-[9px] font-black text-primary hover:underline flex items-center gap-1">
                                <Package className="h-2 w-2" /> 關聯訂單 #{log.orderId}
                              </Link>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-xs font-medium text-slate-600 truncate max-w-[180px]">{log.recipient}</p>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {getStatusBadge(log.status)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right pr-8">
                          <Button variant="ghost" size="icon" className="rounded-full" asChild title="查看詳情">
                            <Link href={`/admin/notifications/broadcast/new?id=${log.id}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="icon" className="rounded-full text-destructive" onClick={() => deleteDoc(doc(db!, 'communication_logs', log.id))}>
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
      </Tabs>
    </div>
  );
}
