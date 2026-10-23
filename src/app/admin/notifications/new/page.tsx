"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  ArrowLeft, 
  Send, 
  Loader2, 
  Users, 
  User, 
  MessageSquare, 
  Globe, 
  Tag, 
  Info, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  Wand2,
  Bell,
  Calendar,
  Clock,
  Save,
  SmartphoneNfc,
  Smartphone
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useI18n } from "@/lib/i18n/i18n-context";
import { useToast } from "@/hooks/use-toast";
import { useFirestore } from "@/firebase";
import { broadcastNotification, sendNotification, NotificationType } from "@/services/notification-service";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { generateNotificationContent } from "@/ai/flows/generate-notification-content-flow";
import { Switch } from "@/components/ui/switch";

function NewDirectMessageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const db = useFirestore();

  const preselectedUserId = searchParams.get('userId');
  const preselectedName = searchParams.get('name');
  const existingId = searchParams.get('id');

  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [targetType, setTargetType] = useState(preselectedUserId ? "specific" : "all");
  const [userId, setUserId] = useState(preselectedUserId || "");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [type, setType] = useState<NotificationType>("system");
  const [actionUrl, setActionUrl] = useState("");
  
  const [sendInApp, setSendInApp] = useState(true);
  const [sendPush, setSendPush] = useState(false);

  const [sendMode, setSendNow] = useState<"immediate" | "scheduled">("immediate");
  const [scheduledDate, setScheduledDate] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");

  const handleAiGenerate = async () => {
    if (!title && !type) {
      toast({ title: "資訊不足", variant: "destructive" });
      return;
    }

    setAiLoading(true);
    try {
      const result = await generateNotificationContent({
        triggerEvent: `Quick Message`,
        concept: title || "Important Alert",
        language: lang,
        channel: "in_app"
      });

      setContent(result.content);
      if (result.subject && !title) setTitle(result.subject);
      toast({ title: t.common.success, description: "AI 已完成內容撰寫。" });
    } catch (error) {
      toast({ title: "AI Error", variant: "destructive" });
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) return;

    if (sendMode === 'scheduled' && (!scheduledDate || !scheduledTime)) {
      toast({ title: "請設定預約發送時間", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      if (sendMode === 'immediate') {
        if (targetType === "all") {
          const res = await broadcastNotification(db, title, content, actionUrl);
          if (res.success) toast({ title: "廣播成功", description: `訊息已發送。` });
        } else {
          if (!userId) throw new Error("Please enter a User ID");
          const res = await sendNotification({ db, userId, title, content, type, actionUrl });
          if (res.success) toast({ title: "發送成功" });
        }
      } else {
        toast({ title: "預約成功", description: `訊息將於指定時間發送。` });
      }
      router.push("/admin/notifications");
    } catch (error: any) {
      toast({ title: "發送失敗", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full"><ArrowLeft className="h-5 w-5" /></Button>
          <div>
            <h1 className="text-3xl font-black font-headline tracking-tight">{existingId ? "修改預約訊息" : "撰寫即時訊息"}</h1>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
          <CardHeader className="bg-muted/10 border-b"><CardTitle className="text-sm font-black uppercase flex items-center gap-2"><Users className="h-4 w-4" /> 發送範圍</CardTitle></CardHeader>
          <CardContent className="p-6 space-y-6">
            <RadioGroup value={targetType} onValueChange={setTargetType} className="grid grid-cols-2 gap-4">
              <div className={cn("p-4 border-2 rounded-2xl flex items-center space-x-3", targetType === 'all' ? 'border-primary bg-primary/5' : 'border-muted')}><RadioGroupItem value="all" id="all" /><Label htmlFor="all" className="font-bold flex-1 cursor-pointer">全體廣播</Label></div>
              <div className={cn("p-4 border-2 rounded-2xl flex items-center space-x-3", targetType === 'specific' ? 'border-primary bg-primary/5' : 'border-muted')}><RadioGroupItem value="specific" id="specific" /><Label htmlFor="specific" className="font-bold flex-1 cursor-pointer">指定單一用戶</Label></div>
            </RadioGroup>
            {targetType === "specific" && <Input placeholder="User ID..." value={userId} onChange={(e) => setUserId(e.target.value)} className="h-11 rounded-xl" />}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-none shadow-sm rounded-3xl bg-white"><CardHeader className="bg-muted/10 border-b"><CardTitle className="text-sm font-black uppercase"><Smartphone className="h-4 w-4 inline mr-2" /> 渠道</CardTitle></CardHeader><CardContent className="p-6 space-y-4"><div className="flex justify-between items-center"><Label>站內鈴鐺</Label><Switch checked={sendInApp} onCheckedChange={setSendInApp} /></div><div className="flex justify-between items-center"><Label>手機推送</Label><Switch checked={sendPush} onCheckedChange={setSendPush} /></div></CardContent></Card>
          <Card className="border-none shadow-sm rounded-3xl bg-white"><CardHeader className="bg-muted/10 border-b"><CardTitle className="text-sm font-black uppercase"><Calendar className="h-4 w-4 inline mr-2" /> 時機</CardTitle></CardHeader><CardContent className="p-6 space-y-4"><RadioGroup value={sendMode} onValueChange={(v: any) => setSendNow(v)} className="gap-2"><div className="flex items-center gap-2"><RadioGroupItem value="immediate" id="now" /><Label htmlFor="now">立即發送</Label></div><div className="flex items-center gap-2"><RadioGroupItem value="scheduled" id="later" /><Label htmlFor="later">預約發送</Label></div></RadioGroup>{sendMode === 'scheduled' && <div className="grid grid-cols-2 gap-2 mt-2"><Input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} /><Input type="time" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} /></div>}</CardContent></Card>
        </div>

        <Card className="border-none shadow-sm rounded-3xl bg-white">
          <CardHeader className="bg-muted/10 border-b"><CardTitle className="text-sm font-black uppercase"><Bell className="h-4 w-4 inline mr-2" /> 內容</CardTitle></CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="grid gap-2"><Label>標題</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} className="h-11 font-bold" /></div>
            <div className="grid gap-2"><div className="flex justify-between"><Label>正文</Label><Button type="button" variant="ghost" size="sm" onClick={handleAiGenerate} disabled={aiLoading}>{aiLoading ? <Loader2 className="animate-spin h-3 w-3" /> : <Sparkles className="h-3 w-3 mr-1" />} AI 撰寫</Button></div><Textarea value={content} onChange={(e) => setContent(e.target.value)} className="min-h-[150px] rounded-2xl bg-muted/20 border-none" /></div>
          </CardContent>
          <CardFooter className="p-8 bg-muted/5 border-t"><Button className="w-full h-14 bg-primary text-primary-foreground font-black text-lg rounded-2xl shadow-xl" disabled={loading || !title || !content}>{loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "確認發送"}</Button></CardFooter>
        </Card>
      </form>
    </div>
  );
}

export default function NewDirectMessagePage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <NewDirectMessageContent />
    </Suspense>
  );
}