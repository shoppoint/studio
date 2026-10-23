"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { 
  Plus, 
  Bell, 
  Send, 
  Search, 
  Trash2, 
  Users, 
  User, 
  MessageSquare,
  CheckCircle2, 
  Clock, 
  Megaphone, 
  Zap, 
  Mail, 
  Smartphone, 
  ChevronRight, 
  Settings2, 
  FileText, 
  Sparkles, 
  ExternalLink, 
  History,
  Eye,
  Loader2,
  Calendar,
  Edit2,
  MoreVertical,
  MoreHorizontal,
  SmartphoneNfc,
  Check,
  ClipboardList,
  AlertCircle,
  MessageSquarePlus,
  ArrowRight,
  Phone,
  Filter,
  Bot,
  PlusCircle,
  Tag,
  Undo2,
  Reply,
  Wand2,
  Save,
  X,
  Info
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
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger, 
} from "@/components/ui/dropdown-menu";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { useI18n } from "@/lib/i18n/i18n-context";
import { useFirestore, useCollection } from "@/firebase";
import { collection, query, orderBy, deleteDoc, doc, where, updateDoc, serverTimestamp } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { generateNotificationContent } from "@/ai/flows/generate-notification-content-flow";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  "cash_coupon_notice",
  "member_upgrade",
  "welcome_msg",
  "password_changed"
];

const ENQUIRY_CATEGORIES: Record<string, string> = {
  "product": "產品問題",
  "order": "訂單相關",
  "system": "系統問題回報及建議",
  "service": "服務投訴及建議",
  "shipping": "送貨查詢",
  "return": "換貨／退貨",
  "other": "其他查詢"
};

export default function CommunicationHub() {
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const db = useFirestore();
  const [activeTab, setActiveTab] = useState("tasks"); 
  const [searchQuery, setSearchQuery] = useState("");
  const [taskStatusFilter, setTaskStatusFilter] = useState("all");
  const [taskCategoryFilter, setTaskCategoryFilter] = useState("all");
  const setT = t.admin.settings;

  // 回覆對話框狀態
  const [replyTask, setReplyTask] = useState<any | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [isAiDrafting, setIsAiDrafting] = useState(false);

  // 任務管理對話框狀態 (New)
  const [manageTask, setManageTask] = useState<any | null>(null);
  const [isSavingTask, setIsSavingTask] = useState(false);

  // 1. 監聽自動通知範本
  const templatesQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'notification_templates'));
  }, [db]);
  const { data: dbTemplates, loading: templatesLoading } = useCollection<any>(templatesQuery);

  // 2. 監聽群發活動
  const broadcastsQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'broadcasts'), orderBy('createdAt', 'desc'));
  }, [db]);
  const { data: broadcasts, loading: broadcastsLoading } = useCollection<any>(broadcastsQuery);

  // 3. 監聽任務與查詢
  const enquiriesQuery = useMemo(() => {
    if (!db) return null;
    let q = query(collection(db, 'enquiries'), orderBy('createdAt', 'desc'));
    if (taskStatusFilter !== 'all') {
      q = query(collection(db, 'enquiries'), where('status', '==', taskStatusFilter), orderBy('createdAt', 'desc'));
    }
    return q;
  }, [db, taskStatusFilter]);

  const { data: enquiries, loading: enquiriesLoading } = useCollection<any>(enquiriesQuery);

  const filteredEnquiries = useMemo(() => {
    if (!enquiries) return [];
    return enquiries.filter(e => {
      const matchesSearch = (e.name || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (e.message || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (e.phone || "").includes(searchQuery) ||
                            (e.email || "").toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = taskCategoryFilter === 'all' || e.category === taskCategoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [enquiries, searchQuery, taskCategoryFilter]);

  const updateTaskStatus = async (id: string, newStatus: string) => {
    if (!db) return;
    try {
      await updateDoc(doc(db, 'enquiries', id), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      toast({ title: "狀態已更新" });
    } catch (e) {
      toast({ title: "更新失敗", variant: "destructive" });
    }
  };

  /**
   * 任務深度管理儲存 (New)
   */
  const handleSaveTaskUpdates = async () => {
    if (!db || !manageTask || !manageTask.id) return;
    setIsSavingTask(true);
    try {
      const taskRef = doc(db, 'enquiries', manageTask.id);
      await updateDoc(taskRef, {
        category: manageTask.category,
        subject: manageTask.subject,
        status: manageTask.status,
        internalNotes: manageTask.internalNotes || "",
        updatedAt: serverTimestamp()
      });
      toast({ title: "任務已更新" });
      setManageTask(null);
    } catch (e: any) {
      toast({ title: "儲存失敗", description: e.message, variant: "destructive" });
    } finally {
      setIsSavingTask(false);
    }
  };

  /**
   * AI 回覆草稿助手
   */
  const handleAiDraft = async () => {
    if (!replyTask) return;
    setIsAiDrafting(true);
    try {
      const categoryLabel = ENQUIRY_CATEGORIES[replyTask.category] || "Customer Inquiry";
      const result = await generateNotificationContent({
        triggerEvent: `Reply to Customer: ${categoryLabel}`,
        concept: `The customer asked: ${replyTask.message}. Please write a helpful and polite reply.`,
        language: lang,
        channel: "email"
      });
      
      setReplyContent(result.content);
      toast({ title: "AI 草稿已生成", description: "您可以根據需要進行微調。" });
    } catch (e) {
      toast({ title: "AI 生成失敗", variant: "destructive" });
    } finally {
      setIsAiDrafting(false);
    }
  };

  const handleSendEmailReply = async () => {
    if (!db || !replyTask || !replyContent.trim()) return;
    setIsSendingReply(true);

    try {
      const response = await fetch('/api/notifications/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: replyTask.email,
          subject: `Re: ${replyTask.subject || "Inquiry from SHOP POINT"}`,
          html: `
            <div style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px;">
              <div style="margin-bottom: 20px;">${replyContent}</div>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
              <div style="font-size: 12px; color: #666;">
                <p><strong>Original Message from ${replyTask.name}:</strong></p>
                <blockquote style="border-left: 4px solid #eee; padding-left: 15px; color: #888; font-style: italic;">
                  ${replyTask.message}
                </blockquote>
              </div>
            </div>
          `
        })
      });

      if (!response.ok) throw new Error("Failed to send email via API");

      const taskRef = doc(db, 'enquiries', replyTask.id);
      const logEntry = `\n\n[Email Reply - ${new Date().toLocaleString()}]\n${replyContent.replace(/<[^>]*>?/gm, '').substring(0, 100)}...`;
      await updateDoc(taskRef, {
        status: 'processing',
        internalNotes: (replyTask.internalNotes || "") + logEntry,
        updatedAt: serverTimestamp()
      });

      toast({ title: "回覆已送出", description: `已寄送至 ${replyTask.email}` });
      setReplyTask(null);
      setReplyContent("");
    } catch (e: any) {
      toast({ title: "發送失敗", description: e.message, variant: "destructive" });
    } finally {
      setIsSendingReply(false);
    }
  };

  const getTemplateStatus = (ev: string) => {
    const template = dbTemplates?.find(t => t.id === ev);
    if (!template) return null;
    return { isConfigured: (template.activeChannels || []).length > 0, channels: template.activeChannels || [] };
  };

  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'AI_Assistant_Escalation':
      case 'AI_Assistant':
        return <Badge className="bg-indigo-100 text-indigo-700 border-none font-black text-[9px] uppercase"><Bot className="h-2.5 w-2.5 mr-1" /> AI Referral</Badge>;
      case 'Manual':
        return <Badge className="bg-amber-100 text-amber-800 border-none font-black text-[9px] uppercase"><PlusCircle className="h-2.5 w-2.5 mr-1" /> Manual Record</Badge>;
      case 'Email':
        return <Badge className="bg-blue-100 text-blue-800 border-none font-black text-[9px] uppercase"><Mail className="h-2.5 w-2.5 mr-1" /> Inbound Email</Badge>;
      default:
        return <Badge variant="outline" className="text-[9px] font-black uppercase">Form Submission</Badge>;
    }
  };

  const getCategoryBadge = (cat: string) => {
    const label = ENQUIRY_CATEGORIES[cat] || "其他查詢";
    return (
      <Badge variant="outline" className="text-[8px] font-black px-1.5 h-4 border-muted-foreground/30 text-muted-foreground uppercase bg-muted/10">
        <Tag className="h-2 w-2 mr-1" />
        {label}
      </Badge>
    );
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black font-headline tracking-tight">全通路溝通與任務中心</h1>
          <p className="text-muted-foreground">統一處理顧客查詢、AI 轉介任務及系統自動通知範本。</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl h-11 px-6 font-bold border-muted-foreground/20 gap-2" asChild>
            <Link href="/admin/notifications/tasks/new">
              <PlusCircle className="h-4 w-4" /> 手動錄入查詢
            </Link>
          </Button>
          <Button className="bg-primary text-primary-foreground font-black shadow-lg rounded-xl h-11 px-6 gap-2" asChild>
            <Link href="/admin/notifications/broadcast/new">
              <Zap className="h-4 w-4" /> 建立新宣傳活動
            </Link>
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-muted/50 p-1 h-12 rounded-2xl w-full sm:w-auto grid grid-cols-3 mb-8 border">
          <TabsTrigger value="tasks" className="rounded-xl px-8 font-bold flex items-center gap-2">
            <ClipboardList className="h-4 w-4" /> 任務與查詢跟進
          </TabsTrigger>
          <TabsTrigger value="templates" className="rounded-xl px-8 font-bold flex items-center gap-2">
            <Settings2 className="h-4 w-4" /> 自動通知範本
          </TabsTrigger>
          <TabsTrigger value="broadcasts" className="rounded-xl px-8 font-bold flex items-center gap-2">
            <Mail className="h-4 w-4" /> 群發行銷歷史
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tasks" className="space-y-6">
          <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
            <CardHeader className="bg-muted/5 border-b p-6 space-y-4">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-1 w-full max-w-2xl">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="搜尋姓名、電話、電郵或內容..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 h-11 bg-white border-none shadow-inner rounded-xl"
                    />
                  </div>
                  <Select value={taskCategoryFilter} onValueChange={setTaskCategoryFilter}>
                    <SelectTrigger className="h-11 w-48 bg-white border-none shadow-inner rounded-xl font-bold text-xs">
                      <SelectValue placeholder="所有類別" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-2xl">
                      <SelectItem value="all">所有類別</SelectItem>
                      {Object.entries(ENQUIRY_CATEGORIES).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex bg-muted/30 p-1 rounded-xl gap-1 border">
                   {['all', 'new', 'processing', 'resolved'].map(s => (
                     <Button key={s} variant={taskStatusFilter === s ? "default" : "ghost"} size="sm" className="h-9 px-4 rounded-lg font-bold text-xs uppercase" onClick={() => setTaskStatusFilter(s)}>
                       {s === 'all' ? '全部' : s === 'new' ? '新任務' : s === 'processing' ? '處理中' : '已解決'}
                     </Button>
                   ))}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {enquiriesLoading ? (
                <div className="py-24 text-center"><Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" /></div>
              ) : filteredEnquiries.length === 0 ? (
                <div className="py-24 text-center text-muted-foreground italic flex flex-col items-center gap-4">
                  <ClipboardList className="h-12 w-12 opacity-20" />
                  <p>目前暫無待處理的查詢任務。</p>
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-muted/5">
                    <TableRow>
                      <TableHead className="pl-8">來源與日期</TableHead>
                      <TableHead>顧客資訊</TableHead>
                      <TableHead className="w-[35%]">類別與內容</TableHead>
                      <TableHead>狀態</TableHead>
                      <TableHead className="text-right pr-8">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredEnquiries.map((e) => (
                      <TableRow key={e.id} className={cn("group transition-colors", e.status === 'new' ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted/30")}>
                        <TableCell className="pl-8 py-5">
                          <div className="space-y-1">
                            {getSourceBadge(e.source)}
                            <p className="text-[10px] text-muted-foreground font-bold flex items-center gap-1">
                              <Calendar className="h-2.5 w-2.5" />
                              {e.createdAt?.seconds ? format(new Date(e.createdAt.seconds * 1000), 'yyyy-MM-dd HH:mm') : '--'}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-bold text-sm">{e.name || "未具名"}</p>
                            <div className="flex flex-col gap-0.5">
                              {e.phone && <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Phone className="h-2 w-2" /> {e.phone}</p>}
                              {e.email && <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Mail className="h-2 w-2" /> {e.email}</p>}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              {getCategoryBadge(e.category)}
                              <p className="font-bold text-xs text-primary line-clamp-1">{e.subject || "系統轉介查詢"}</p>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{e.message}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select value={e.status || "new"} onValueChange={(v) => updateTaskStatus(e.id, v)}>
                            <SelectTrigger className={cn(
                              "h-8 rounded-lg border-none font-black text-[10px] uppercase px-3",
                              e.status === 'new' ? "bg-red-500 text-white shadow-md" : 
                              e.status === 'processing' ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
                            )}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-none shadow-2xl">
                              <SelectItem value="new">🆕 新任務 (New)</SelectItem>
                              <SelectItem value="processing">⏳ 處理中 (Processing)</SelectItem>
                              <SelectItem value="resolved">✅ 已解決 (Resolved)</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-right pr-8">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="rounded-full h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl shadow-2xl border-none">
                              <DropdownMenuLabel className="text-[9px] font-black uppercase text-muted-foreground tracking-widest px-2 pb-2">任務管理</DropdownMenuLabel>
                              <DropdownMenuItem className="rounded-xl py-2.5 font-bold" onClick={() => setManageTask({ ...e })}>
                                <Edit2 className="mr-2 h-4 w-4 text-primary" /> 管理與更新進度
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {e.email && (
                                <DropdownMenuItem className="rounded-xl py-2.5 font-bold text-blue-600" onClick={() => { setReplyTask(e); setReplyContent(""); }}>
                                  <Reply className="mr-2 h-4 w-4" /> 平台回覆電郵
                                </DropdownMenuItem>
                              )}
                              {e.phone && (
                                <DropdownMenuItem className="rounded-xl py-2.5 font-bold text-green-600" asChild>
                                  <a href={`https://wa.me/${e.phone.replace(/[^\d]/g, '')}`} target="_blank" rel="noreferrer">
                                    <Smartphone className="mr-2 h-4 w-4" /> WhatsApp 回覆
                                  </a>
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="rounded-xl py-2.5 text-destructive" onClick={() => deleteDoc(doc(db, 'enquiries', e.id))}>
                                <Trash2 className="mr-2 h-4 w-4" /> 刪除紀錄
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
            <CardHeader className="bg-muted/10 border-b">
              <CardTitle className="text-sm font-black uppercase tracking-widest">自動通知範本列表</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-dashed">
                {TRIGGER_EVENTS.map(ev => {
                  const status = getTemplateStatus(ev);
                  return (
                    <div key={ev} className="p-6 flex items-center justify-between group hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "h-10 w-10 rounded-xl bg-muted flex items-center justify-center text-muted-foreground",
                          status?.isConfigured && "bg-primary/20 text-primary"
                        )}>
                          <Zap className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-bold text-sm">{setT[ev as keyof typeof setT] as string || ev}</p>
                          <div className="flex gap-1.5 mt-1">
                            {['email', 'whatsapp', 'in_app', 'push'].map(c => (
                              <Badge key={c} variant="outline" className={cn("text-[8px] font-black uppercase", status?.channels.includes(c) ? "border-primary text-primary" : "opacity-30")}>{c}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" asChild className="rounded-xl font-bold h-9">
                        <Link href={`/admin/notifications/broadcast/new?template=${ev}`}>
                          {status?.isConfigured ? "修改配置" : "開始配置"} <ChevronRight className="ml-1 h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="broadcasts" className="space-y-6">
          <Card className="border-none shadow-sm overflow-hidden bg-white rounded-3xl">
            <CardContent className="p-0">
              {broadcastsLoading ? (
                <div className="py-20 text-center"><Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" /></div>
              ) : (broadcasts?.length === 0) ? (
                <div className="py-20 text-center text-muted-foreground italic">暫無群發紀錄。</div>
              ) : (
                <Table>
                  <TableHeader className="bg-muted/5">
                    <TableRow>
                      <TableHead className="pl-8">活動標題</TableHead>
                      <TableHead>目標</TableHead>
                      <TableHead>發送日期</TableHead>
                      <TableHead className="text-right pr-8">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {broadcasts?.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell className="pl-8 py-4 font-bold">{b.zh?.emailSubject || b.en?.emailSubject || "無標題"}</TableCell>
                        <TableCell><Badge variant="outline" className="text-[10px] uppercase">{b.targetType}</Badge></TableCell>
                        <TableCell className="text-xs">{b.createdAt?.seconds ? format(new Date(b.createdAt.seconds * 1000), 'yyyy-MM-dd') : '--'}</TableCell>
                        <TableCell className="text-right pr-8">
                           <Button variant="ghost" size="icon" asChild className="rounded-full"><Link href={`/admin/notifications/broadcast/new?id=${b.id}`}><Edit2 className="h-4 w-4" /></Link></Button>
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

      {/* 任務管理對話框 (New) */}
      <Dialog open={!!manageTask} onOpenChange={(v) => !v && setManageTask(null)}>
        <DialogContent className="sm:max-w-[600px] rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-8 bg-slate-900 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12"><ClipboardList className="h-32 w-32" /></div>
            <DialogTitle className="text-2xl font-black font-headline flex items-center gap-3 relative z-10">
              管理任務進度
            </DialogTitle>
            <DialogDescription className="text-slate-400 font-medium relative z-10">
              更新查詢主旨、類別、處理狀態及內部跟進筆記。
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            <div className="p-8 space-y-6 bg-white">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">任務狀態 (Status)</Label>
                  <Select value={manageTask?.status} onValueChange={(v) => setManageTask({...manageTask, status: v})}>
                    <SelectTrigger className="h-11 rounded-xl bg-muted/20 border-none font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="new">🆕 新任務 (New)</SelectItem>
                      <SelectItem value="processing">⏳ 處理中 (Processing)</SelectItem>
                      <SelectItem value="resolved">✅ 已解決 (Resolved)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">任務類別</Label>
                  <Select value={manageTask?.category} onValueChange={(v) => setManageTask({...manageTask, category: v})}>
                    <SelectTrigger className="h-11 rounded-xl bg-muted/20 border-none font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {Object.entries(ENQUIRY_CATEGORIES).map(([k, l]) => (
                        <SelectItem key={k} value={k}>{l}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">查詢主旨 (Subject)</Label>
                <Input 
                  value={manageTask?.subject || ""} 
                  onChange={(e) => setManageTask({...manageTask, subject: e.target.value})}
                  className="h-11 bg-muted/20 border-none rounded-xl font-bold"
                />
              </div>

              <div className="p-4 bg-muted/10 rounded-2xl border-2 border-dashed">
                <p className="text-[10px] font-black uppercase text-muted-foreground mb-2">顧客原始訊息</p>
                <p className="text-xs text-slate-600 leading-relaxed italic">"{manageTask?.message}"</p>
              </div>

              <Separator className="border-dashed" />

              <div className="space-y-2">
                <Label className="text-xs font-black uppercase text-primary tracking-widest flex items-center gap-2">
                  <Edit2 className="h-3.5 w-3.5" /> 內部跟進備註 (Progress Log)
                </Label>
                <Textarea 
                  value={manageTask?.internalNotes || ""} 
                  onChange={(e) => setManageTask({...manageTask, internalNotes: e.target.value})}
                  placeholder="在此記錄處理進度、客人口頭要求或內部溝通摘要..."
                  className="min-h-[150px] bg-muted/20 border-none rounded-2xl p-4 text-sm focus-visible:ring-primary/20"
                />
              </div>

              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-[10px] text-blue-800 leading-relaxed font-medium">
                  內部備註僅供管理員查閱。當您回覆電郵時，相關記錄也會自動附加在該欄位的末尾以便追蹤。
                </p>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="p-8 bg-muted/10 border-t flex gap-3">
            <Button variant="ghost" className="flex-1 rounded-xl h-12 font-bold" onClick={() => setManageTask(null)}>取消</Button>
            <Button 
              className="flex-[2] bg-slate-900 text-white font-black h-12 rounded-xl shadow-lg gap-2" 
              onClick={handleSaveTaskUpdates}
              disabled={isSavingTask}
            >
              {isSavingTask ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              儲存更新內容
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 回覆電郵對話框 (整合 AI 助手) */}
      <Dialog open={!!replyTask} onOpenChange={(v) => !v && setReplyTask(null)}>
        <DialogContent className="sm:max-w-[700px] rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-8 bg-primary text-primary-foreground relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12"><Sparkles className="h-24 w-24" /></div>
            <DialogTitle className="text-2xl font-black font-headline flex items-center gap-3 relative z-10">
              <Reply className="h-6 w-6" /> 回覆顧客查詢
            </DialogTitle>
            <DialogDescription className="text-primary-foreground/80 relative z-10">
              回覆將以官方名義寄送給：{replyTask?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="p-8 space-y-6 bg-white">
            <div className="p-4 bg-muted/20 rounded-2xl border-2 border-dashed">
              <div className="flex justify-between items-center mb-2">
                <p className="text-[10px] font-black uppercase text-muted-foreground">原始訊息 (Original Message)</p>
                <Badge variant="outline" className="text-[8px] bg-white border-primary/20 text-primary font-black uppercase">
                  Category: {replyTask?.category}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground italic line-clamp-3">"{replyTask?.message}"</p>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <Label className="text-xs font-black uppercase text-muted-foreground flex items-center gap-2">
                   您的回覆內容 (Email Content)
                </Label>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 rounded-xl font-black text-[10px] uppercase gap-2 border-primary/20 text-primary bg-white shadow-sm hover:bg-primary hover:text-white transition-all"
                  onClick={handleAiDraft}
                  disabled={isAiDrafting}
                >
                  {isAiDrafting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Bot className="h-3.5 w-3.5" />}
                  AI 撰寫回覆草稿
                </Button>
              </div>
              <RichTextEditor 
                value={replyContent} 
                onChange={setReplyContent} 
                variant="standard"
                uploadPath={`enquiries/${replyTask?.id}/replies`}
              />
            </div>
          </div>
          <DialogFooter className="p-8 bg-muted/10 border-t flex gap-3">
            <Button variant="ghost" className="flex-1 rounded-xl h-12 font-bold" onClick={() => setReplyTask(null)}>取消</Button>
            <Button 
              className="flex-[2] bg-primary text-primary-foreground font-black h-12 rounded-xl shadow-lg gap-2" 
              onClick={handleSendEmailReply}
              disabled={isSendingReply || !replyContent.trim() || replyContent === '<p></p>'}
            >
              {isSendingReply ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              確認並發送電郵
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
