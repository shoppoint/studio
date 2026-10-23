
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  User, 
  Mail, 
  Phone, 
  MessageSquare,
  ClipboardList,
  CheckCircle2,
  AlertCircle,
  Tag
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
import { useI18n } from "@/lib/i18n/i18n-context";
import { useToast } from "@/hooks/use-toast";
import { useFirestore } from "@/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function NewManualTaskPage() {
  const router = useRouter();
  const { t } = useI18n();
  const { toast } = useToast();
  const db = useFirestore();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    category: "other",
    subject: "",
    message: "",
    status: "new" as const,
    source: "Manual" as const
  });

  const categories = [
    { value: "product", label: "產品問題" },
    { value: "order", label: "訂單相關" },
    { value: "system", label: "系統問題回報及建議" },
    { value: "service", label: "服務投訴及建議" },
    { value: "shipping", label: "送貨查詢" },
    { value: "return", label: "換貨／退貨" },
    { value: "other", label: "其他查詢" },
  ];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.message) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'enquiries'), {
        ...formData,
        createdAt: serverTimestamp(),
      });
      toast({ title: "任務已錄入", description: "手動查詢記錄成功儲存至系統。" });
      router.push("/admin/notifications");
    } catch (error: any) {
      toast({ title: "儲存失敗", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-black font-headline tracking-tight">錄入顧客查詢任務</h1>
            <p className="text-muted-foreground">手動記錄來自 WhatsApp、電話或現場客人的需求。</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-8">
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
            <CardHeader className="bg-muted/10 border-b">
              <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                顧客聯絡資料
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid gap-2">
                <Label htmlFor="name" className="font-bold">顧客姓名</Label>
                <Input 
                  id="name" 
                  required 
                  placeholder="例如：陳先生 / Alex" 
                  className="h-11 bg-muted/20 border-none rounded-xl font-bold"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="phone" className="font-bold">聯絡電話 (WhatsApp)</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="phone" 
                      placeholder="+852" 
                      className="pl-10 h-11 bg-muted/20 border-none rounded-xl font-bold"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email" className="font-bold">電子郵件</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="customer@example.com" 
                      className="pl-10 h-11 bg-muted/20 border-none rounded-xl font-bold"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
            <CardHeader className="bg-muted/10 border-b">
              <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                查詢細節
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="grid gap-2">
                  <Label className="text-xs font-black uppercase tracking-widest flex items-center gap-2"><Tag className="h-3 w-3" /> 查詢類別</Label>
                  <Select value={formData.category} onValueChange={(v) => handleInputChange("category", v)}>
                    <SelectTrigger className="h-11 bg-muted/20 border-none rounded-xl font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-2xl">
                      {categories.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="subject" className="font-bold">查詢主旨 / 主題</Label>
                  <Input 
                    id="subject" 
                    required 
                    placeholder="例如：Dyson 風筒幾時返貨？" 
                    className="h-11 bg-muted/20 border-none rounded-xl font-bold"
                    value={formData.subject}
                    onChange={(e) => handleInputChange("subject", e.target.value)}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="message" className="font-bold">詳細內容</Label>
                <Textarea 
                  id="message" 
                  required 
                  placeholder="記錄顧客具體要求或對話摘要..." 
                  className="min-h-[150px] bg-muted/20 border-none rounded-2xl p-4 text-sm"
                  value={formData.message}
                  onChange={(e) => handleInputChange("message", e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="grid gap-2">
                  <Label className="font-bold">初始處理狀態</Label>
                  <Select value={formData.status} onValueChange={(v: any) => handleInputChange("status", v)}>
                    <SelectTrigger className="h-11 bg-muted/20 border-none rounded-xl font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-2xl">
                      <SelectItem value="new">🆕 新任務 (New)</SelectItem>
                      <SelectItem value="processing">⏳ 處理中 (Processing)</SelectItem>
                      <SelectItem value="resolved">✅ 已解決 (Resolved)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
            <CardFooter className="p-8 bg-muted/10 border-t flex justify-end">
              <Button 
                type="submit" 
                className="bg-primary text-primary-foreground font-black px-10 h-14 rounded-2xl shadow-xl hover:scale-105 transition-transform gap-2"
                disabled={loading || !formData.name || !formData.message}
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                儲存查詢紀錄
              </Button>
            </CardFooter>
          </Card>
        </div>
      </form>
    </div>
  );
}
