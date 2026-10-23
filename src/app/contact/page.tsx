
"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { 
  Mail, 
  Phone, 
  MapPin, 
  MessageSquare, 
  Facebook, 
  Instagram, 
  Youtube, 
  Send,
  Loader2,
  ChevronRight, 
  Globe,
  Smartphone,
  Tag,
  Bot,
  Zap,
  ArrowRight,
  Sparkles,
  Star,
  ExternalLink,
  ShieldCheck,
  Clock,
  Info,
  ShieldAlert
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useI18n } from "@/lib/i18n/i18n-context";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { useFirestore, useDoc } from "@/firebase";
import { collection, addDoc, serverTimestamp, doc } from "firebase/firestore";
import { notifyStaff } from "@/services/notification-service";
import { verifyCaptchaAction } from "@/app/actions/captcha-actions";
import { reCaptchaSiteKey } from "@/firebase/config";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

// Custom Branded SVGs
const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
  </svg>
);

const ThreadsIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
    <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10c2.11 0 4.076-.656 5.71-1.776l-1.173-1.635C15.222 19.516 13.684 20 12 20c-4.418 0-8-3.582-8-8s3.582-8 8-8 8 3.582 8 8v.5c0 1.105-.895 2-2 2s-2-.895-2-2v-3c0-1.105-.895-2-2-2s-2 .895-2 2v3.312c-.588-.813-1.534-1.312-2.583-1.312-1.933 0-3.5 1.567-3.5 3.5s1.567 3.5 3.5 3.5c1.049 0 1.995-.499 2.583-1.312.23.43.674.812 1.254.812 2.209 0 4-1.791 4-4v-.5c0-2.112-.832-4.161-2.344-5.719C16.161 6.84 14.112 6 12 6s-1.09 0-1.09 0zM12 16c-1.105 0-2-.895-2-2s.895-2 2-2 2 .895 2 2-.895 2-2 2z" />
  </svg>
);

const LinktreeIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
    <path d="M21.32 9.5h-5.83V2.41L12 0 8.51 2.41V9.5H2.68v4.99h5.83v7.1h2.98V14.49h1.02v7.1h2.98V14.49h5.83V9.5z" />
  </svg>
);

const WhatsappIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.03 0C5.449 0 .081 5.377.077 11.967c0 2.105.547 4.16 1.587 6.006L0 24l6.149-1.613a11.83 11.83 0 005.874 1.552h.005c6.581 0 11.95-5.377 11.953-11.967a11.82 11.82 0 00-3.502-8.472" />
  </svg>
);

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6">
    <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.92 3.12-1.92 4.12-1.2 1.2-3.08 2.48-5.92 2.48-4.72 0-8.52-3.84-8.52-8.56s3.8-8.56 8.52-8.56c2.56 0 4.44.92 5.84 2.32l2.32-2.32C18.6 1.64 15.84.48 12.48.48 6.12.48 1 5.6 1 11.96s5.12 11.48 11.48 11.48c3.44 0 6.12-1.12 8.16-3.2 2.12-2.08 2.8-5 2.8-7.28 0-.72-.04-1.4-.16-2.04H12.48z" />
  </svg>
);

export default function ContactPage() {
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const db = useFirestore();
  const conT = t.contact;
  const isEn = lang === 'en';

  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    category: "product",
    subject: "",
    message: ""
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

  // 獲取安全設定
  const infraRef = useMemo(() => db ? doc(db, 'config', 'infra') : null, [db]);
  const { data: infraConfig } = useDoc<any>(infraRef);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms) {
      toast({ title: "Agreement Required", description: "Please agree to our privacy policy.", variant: "destructive" });
      return;
    }
    
    setLoading(true);
    try {
      // 1. reCaptcha 隱形核對 (如果是機器人則在此攔截)
      if (infraConfig?.cap_contact === true && typeof window !== 'undefined' && (window as any).grecaptcha) {
        const token = await (window as any).grecaptcha.execute(reCaptchaSiteKey, { action: 'contact_submit' });
        const verifyRes = await verifyCaptchaAction(token);
        if (!verifyRes.success) {
          throw new Error(verifyRes.message || "Security verification failed.");
        }
      }

      // 2. 正常提交邏輯
      const categoryLabel = categories.find(c => c.value === formData.category)?.label || "其他";
      const enquiryData = {
        ...formData,
        name: `${formData.lastName} ${formData.firstName}`,
        source: 'Form',
        status: 'new',
        createdAt: serverTimestamp(),
      };
      await addDoc(collection(db!, 'enquiries'), enquiryData);

      await notifyStaff(
        db!,
        lang === 'en' ? "New Enquiry Received" : "收到新聯絡查詢",
        lang === 'en' 
          ? `From: ${formData.lastName} ${formData.firstName} [${categoryLabel}] (${formData.subject})`
          : `來自: ${formData.lastName} ${formData.firstName} [${categoryLabel}] (主旨: ${formData.subject})`,
        `/admin/notifications`
      );

      toast({ title: t.common.success, description: conT.success_msg });
      setFormData({ firstName: "", lastName: "", email: "", phone: "", category: "product", subject: "", message: "" });
      setAgreedToTerms(false);
    } catch (error: any) {
      toast({ title: "Submission Failed", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const openAiAssistant = () => {
    window.dispatchEvent(new CustomEvent('open-smart-assistant'));
  };

  const contactInfo = {
    address: lang === 'en' 
      ? "B17, Basement, U-Town Shopping Arcade, 3 Tsing Ling Path, Tuen Mun, New Territories, Hong Kong"
      : "香港新界屯門青菱徑3號時尚電腦城地庫B17",
    whatsapp: "+852 5325 2555",
    email: "info@shoppoint.hk",
    social: [
      { name: "Facebook", icon: Facebook, url: "https://facebook.com/shoppoint.hk", color: "hover:bg-blue-600" },
      { name: "Instagram", icon: Instagram, url: "https://instagram.com/shoppoint.hk", color: "hover:bg-gradient-to-tr hover:from-yellow-400 hover:via-red-500 hover:to-purple-600" },
      { name: "Youtube", icon: Youtube, url: "https://youtube.com/@shoppoint_hk", color: "hover:bg-red-600" },
      { name: "Threads", icon: ThreadsIcon, url: "https://threads.net/@shoppoint.hk", color: "hover:bg-black" },
      { name: "X", icon: XIcon, url: "https://x.com/shoppointH", color: "hover:bg-black" },
      { name: "Linktree", icon: LinktreeIcon, url: "https://linktr.ee/shoppoint.hk", color: "hover:bg-green-600" },
      { name: "Google Business", icon: GoogleIcon, url: "https://share.google/Fyh1N4S2P6dvPYG2z", color: "hover:bg-blue-500" },
      { name: "Whatsapp", icon: WhatsappIcon, url: "https://wa.me/85253252555", color: "hover:text-green-500" },
    ]
  };

  const gbpReviewLink = "https://g.page/r/CZSzFmPbXVvhEBM/review";

  return (
    <div className="min-h-screen flex flex-col bg-muted/10">
      <Navbar />
      
      <main className="flex-grow">
        <section className="bg-primary/20 py-16 md:py-24 border-b">
          <div className="container mx-auto px-4 text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-4 uppercase tracking-widest font-bold">
              <Link href="/" className="hover:text-primary transition-colors">{t.nav.home}</Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground">{conT.title}</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black font-headline tracking-tighter mb-4">
              {conT.title}
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto font-medium">
              {conT.subtitle}
            </p>
          </div>
        </section>

        <div className="container mx-auto px-4 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-7 space-y-8">
              {/* AI Help Card */}
              <Card className="border-none shadow-xl bg-slate-900 text-white rounded-[2rem] overflow-hidden">
                <CardContent className="p-8 flex flex-col md:flex-row items-center gap-6">
                  <div className="h-16 w-16 rounded-2xl bg-primary/20 flex items-center justify-center text-primary shrink-0">
                    <Bot className="h-8 w-8" />
                  </div>
                  <div className="flex-1 space-y-1 text-center md:text-left">
                    <h3 className="text-xl font-black flex items-center justify-center md:justify-start gap-2">
                      <Sparkles className="h-5 w-5 text-primary animate-pulse" />
                      先試試 AI 助手獲取即時解答？
                    </h3>
                    <p className="text-slate-400 text-sm font-medium">超過 90% 的常見問題都能透過 AI 立即獲得回覆，無需等待。</p>
                  </div>
                  <Button 
                    onClick={openAiAssistant}
                    className="bg-primary text-primary-foreground font-black px-8 h-12 rounded-xl shadow-lg hover:scale-105 transition-transform shrink-0"
                  >
                    即時對話
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-none shadow-xl bg-white rounded-3xl overflow-hidden">
                <CardHeader className="bg-primary/5 p-8 border-b">
                  <CardTitle className="text-2xl font-bold flex items-center gap-2">
                    <MessageSquare className="h-6 w-6 text-primary" />
                    {conT.form_title}
                  </CardTitle>
                  <CardDescription className="whitespace-pre-line leading-relaxed mt-2 text-muted-foreground">
                    {conT.form_description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-8">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="lastName" className="font-bold text-xs uppercase tracking-wider">{conT.last_name}</Label>
                        <Input id="lastName" required className="bg-muted/30 border-none h-12 rounded-xl" value={formData.lastName} onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="firstName" className="font-bold text-xs uppercase tracking-wider">{conT.first_name}</Label>
                        <Input id="firstName" required className="bg-muted/30 border-none h-12 rounded-xl" value={formData.firstName} onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))} />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="email" className="font-bold text-xs uppercase tracking-wider">{conT.email}</Label>
                        <Input id="email" type="email" required className="bg-muted/30 border-none h-12 rounded-xl" value={formData.email} onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="font-bold text-xs uppercase tracking-wider">{conT.phone}</Label>
                        <Input id="phone" type="tel" required className="bg-muted/30 border-none h-12 rounded-xl" value={formData.phone} onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="font-bold text-xs uppercase tracking-wider flex items-center gap-2"><Tag className="h-3 w-3" /> 查詢類別</Label>
                        <Select value={formData.category} onValueChange={(v) => setFormData(prev => ({ ...prev, category: v }))}>
                          <SelectTrigger className="bg-muted/30 border-none h-12 rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl shadow-2xl border-none">
                            {categories.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="subject" className="font-bold text-xs uppercase tracking-wider">{conT.subject}</Label>
                        <Input id="subject" required className="bg-muted/30 border-none h-12 rounded-xl" value={formData.subject} onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))} />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message" className="font-bold text-xs uppercase tracking-wider">{conT.message}</Label>
                      <Textarea id="message" required className="bg-muted/30 border-none min-h-[180px] py-4 rounded-2xl" value={formData.message} onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))} />
                    </div>
                    <div className="flex items-start space-x-2 pt-2">
                      <Checkbox id="contact-terms" checked={agreedToTerms} onCheckedChange={(checked) => setAgreedToTerms(!!checked)} />
                      <div className="grid gap-1.5 leading-none">
                        <Label htmlFor="contact-terms" className="text-xs text-muted-foreground font-medium cursor-pointer">
                          {t.legal.agree_terms}
                          <div className="flex gap-2 mt-1">
                            <Link href="/terms" className="text-primary hover:underline">{t.legal.terms}</Link>
                            <Link href="/privacy" className="text-primary hover:underline">{t.legal.privacy}</Link>
                          </div>
                        </Label>
                      </div>
                    </div>
                    <Button type="submit" className="w-full h-14 text-lg font-bold bg-primary text-primary-foreground shadow-lg gap-2 rounded-2xl" disabled={loading || !agreedToTerms}>
                      {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                      {conT.submit}
                    </Button>
                    
                    {infraConfig?.cap_contact && (
                      <div className="flex items-center justify-center gap-2 pt-2 opacity-60">
                        <ShieldAlert className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Protected by reCaptcha v3</span>
                      </div>
                    )}
                  </form>
                </CardContent>
              </Card>
            </div>
            <div className="lg:col-span-5 space-y-8">
              {/* Operating Hours Card */}
              <Card className="border-none shadow-xl bg-white rounded-3xl overflow-hidden border-l-4 border-primary">
                <CardHeader className="bg-muted/5 p-8 border-b">
                  <CardTitle className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                    <Clock className="h-4 w-4" /> {isEn ? "Opening Hours" : "營業時間"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-sm">{isEn ? "Mon - Sat" : "星期一至六"}</span>
                    <Badge className="bg-primary text-primary-foreground font-black border-none px-3 h-6">12:00 - 19:00</Badge>
                  </div>
                  <div className="flex justify-between items-center text-muted-foreground">
                    <span className="font-medium text-sm">{isEn ? "Sun & Holidays" : "星期日及公眾假期"}</span>
                    <Badge variant="outline" className="border-muted-foreground/20 text-muted-foreground h-6 px-3">{isEn ? "Closed" : "休息"}</Badge>
                  </div>
                  <Separator className="border-dashed" />
                  <div className="flex items-start gap-2 p-3 bg-muted/20 rounded-xl">
                    <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <p className="text-[10px] text-muted-foreground leading-relaxed italic">
                      {isEn 
                        ? "Temporary changes to hours will be updated on our social media platforms." 
                        : "如營業時間有臨時更改，將會在社交媒體更新，敬請留意。"}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Google Rating Trust Badge */}
              <Card className="border-none shadow-xl bg-white rounded-3xl overflow-hidden border-2 border-primary/10 group hover:border-primary/30 transition-all">
                <a href={gbpReviewLink} target="_blank" rel="noopener noreferrer" className="block">
                  <CardContent className="p-8 space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 shadow-inner">
                          <svg viewBox="0 0 24 24" className="h-6 w-6 fill-blue-600"><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.92 3.12-1.92 4.12-1.2 1.2-3.08 2.48-5.92 2.48-4.72 0-8.52-3.84-8.52-8.56s3.8-8.56 8.52-8.56c2.56 0 4.44.92 5.84 2.32l2.32-2.32C18.6 1.64 15.84.48 12.48.48 6.12.48 1 5.6 1 11.96s5.12 11.48 11.48 11.48c3.44 0 6.12-1.12 8.16-3.2 2.12-2.08 2.8-5 2.8-7.28 0-.72-.04-1.4-.16-2.04H12.48z" /></svg>
                        </div>
                        <div>
                          <div className="flex gap-0.5 mb-0.5">
                            {[1, 2, 3, 4, 5].map((s) => <Star key={s} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />)}
                          </div>
                          <p className="text-sm font-black uppercase tracking-tight text-slate-900">Google 5.0 Rating</p>
                        </div>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground opacity-30 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <Separator className="border-dashed" />
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground leading-relaxed font-medium italic">
                        "{isEn ? "Excellent quality and fast shipping! Support local small shops." : "貨品品質非常好，看得出店主的用心搜羅，發貨也很快！"}"
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-500 text-white border-none font-black text-[8px] h-4">VERIFIED</Badge>
                        <span className="text-[10px] text-muted-foreground font-bold">via Google Reviews</span>
                      </div>
                    </div>
                  </CardContent>
                </a>
              </Card>

              <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
                <CardContent className="p-8 space-y-8">
                  <div className="flex flex-col items-center sm:items-start gap-4">
                    <Link href="/" className="flex items-center space-x-2">
                      <span className="text-3xl font-black tracking-tight text-foreground font-headline">SHOP <span className="text-primary">POINT</span></span>
                    </Link>
                    <p className="text-sm text-muted-foreground text-center sm:text-left leading-relaxed">
                      {isEn 
                        ? "Sourcing quality goods from around the world, we strive to tend to your daily needs with care, ensuring that a warm shopping experience and the original spirit of entrepreneurship endure." 
                        : "穿梭世界各地尋找優質良品，願能細心打理您的生活所需，使溫慢的購物體驗與經營初心得以延續。"}
                    </p>
                  </div>
                  <Separator />
                  <div className="space-y-6">
                    <div className="flex items-start gap-4 group">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"><MapPin className="h-5 w-5" /></div>
                      <div><h4 className="font-bold text-sm uppercase tracking-wider mb-1">{conT.address}</h4><p className="text-sm text-muted-foreground">{contactInfo.address}</p></div>
                    </div>
                    <div className="flex items-start gap-4 group">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"><Smartphone className="h-5 w-5" /></div>
                      <div>
                        <h4 className="font-bold text-sm uppercase tracking-wider mb-1">{conT.whatsapp}</h4>
                        <a href={`https://wa.me/${contactInfo.whatsapp.replace(/[^\d]/g, '')}`} className="text-sm font-bold text-primary hover:underline">{contactInfo.whatsapp}</a>
                        <p className="text-[10px] text-muted-foreground italic mt-0.5">(只限 WhatsApp 訊息或語音聯絡)</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 group">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"><Mail className="h-5 w-5" /></div>
                      <div><h4 className="font-bold text-sm uppercase tracking-wider mb-1">{t.profile.email}</h4><a href={`mailto:${contactInfo.email}`} className="text-sm font-bold text-primary hover:underline">{contactInfo.email}</a></div>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-4">
                    <h4 className="font-bold text-sm uppercase tracking-wider text-center sm:text-left">{conT.follow_us}</h4>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4">
                      {contactInfo.social.map((social) => (
                        <a key={social.name} href={social.url} target="_blank" rel="noopener noreferrer" className={cn("h-12 w-12 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground transition-all transform hover:-translate-y-1 hover:text-white shadow-sm", social.color)} title={social.name}><social.icon /></a>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
