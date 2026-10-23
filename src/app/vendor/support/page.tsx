
"use client";

import { useState } from "react";
import { 
  Bot, 
  HelpCircle, 
  Smartphone, 
  Mail, 
  Send, 
  Loader2, 
  Sparkles, 
  Warehouse, 
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useI18n } from "@/lib/i18n/i18n-context";
import { useToast } from "@/hooks/use-toast";
import { askVendorAssistant } from "@/ai/flows/vendor-support-flow";

export default function VendorSupportPage() {
  const { t, lang } = useI18n();
  const { toast } = useToast();
  
  // AI Assistant State
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'ai', content: string }[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Inquiry Form State
  const [isSubmitting, setIsSubmitting] = useState(false);

  const vendorFaqs = [
    {
      q: lang === 'en' ? "How do I ship my items?" : "我該如何發貨？",
      a: lang === 'en' 
        ? "Pack your items safely, mark the Order ID clearly on the box, and deliver them to our Kwai Chung Logistics Hub. We handle the final mile delivery to customers."
        : "請將貨品妥善包裝，並在包裹外箱清楚標註「訂單編號」，送往我們位於葵涌的物流中心。我們將負責最終的派送。"
    },
    {
      q: lang === 'en' ? "What is the platform commission?" : "平台佣金是多少？",
      a: lang === 'en'
        ? "The standard commission is 10% of the actual sales price (after any discounts)."
        : "目前的標準佣金比例為實際成交價（扣除折扣後）的 10%。"
    },
    {
      q: lang === 'en' ? "When will I receive payouts?" : "款項何時結算？",
      a: lang === 'en'
        ? "Earnings are settled and transferred to your registered bank account by the 10th of every month."
        : "銷售款項將於每月 10 號前結算並轉帳至您登記的銀行帳戶。"
    }
  ];

  const handleAiAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    
    const userMessage = chatInput.trim();
    setChatHistory(prev => [...prev, { role: 'user', content: userMessage }]);
    setChatInput("");
    setIsAiLoading(true);

    try {
      const result = await askVendorAssistant({
        query: userMessage,
        language: lang
      });
      setChatHistory(prev => [...prev, { role: 'ai', content: result.answer }]);
    } catch (error) {
      toast({ title: "AI Error", description: "Could not get response. Please try again.", variant: "destructive" });
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      toast({ title: t.common.success, description: "我們已收到您的查詢。" });
      (e.target as HTMLFormElement).reset();
    }, 1500);
  };

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">商家支援中心</h1>
          <p className="text-muted-foreground">解決您的營運疑問，獲取合作夥伴協助。</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-full border-green-200 text-green-600 hover:bg-green-50 h-10 px-6 gap-2" asChild>
            <a href="https://wa.me/85223456789" target="_blank" rel="noopener noreferrer">
              <Smartphone className="h-4 w-4" /> WhatsApp
            </a>
          </Button>
          <Button variant="outline" className="rounded-full border-blue-200 text-blue-600 hover:bg-blue-50 h-10 px-6 gap-2" asChild>
            <a href="mailto:vendor@shoppoint.hk">
              <Mail className="h-4 w-4" /> Email
            </a>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: AI Assistant & Form */}
        <div className="lg:col-span-7 space-y-8">
          <Card className="border-none shadow-xl bg-white rounded-3xl overflow-hidden">
            <CardHeader className="bg-primary p-6 text-primary-foreground">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <Bot className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-lg">商家 AI 夥伴</CardTitle>
                  <p className="text-[10px] uppercase font-bold opacity-80">24/7 夥伴支援</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex flex-col h-[450px]">
              <ScrollArea className="flex-1 p-6">
                <div className="space-y-6">
                  {chatHistory.length === 0 && (
                    <div className="text-center py-10 space-y-4">
                      <div className="h-16 w-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
                        <Sparkles className="h-8 w-8" />
                      </div>
                      <p className="text-sm text-muted-foreground px-10">
                        您好！我是您的商家 AI 夥伴。您可以詢問有關「集運地址」、「佣金比例」或「結算時間」的問題。
                      </p>
                    </div>
                  )}
                  {chatHistory.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-4 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-tr-none' : 'bg-muted rounded-tl-none'}`}>
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {isAiLoading && (
                    <div className="flex justify-start">
                      <div className="bg-muted p-4 rounded-2xl rounded-tl-none flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                        <span className="text-xs font-medium animate-pulse">正在為您查詢...</span>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
              <div className="p-4 border-t bg-muted/10">
                <form onSubmit={handleAiAsk} className="flex gap-2">
                  <Input 
                    placeholder="詢問有關商店運營的問題..." 
                    className="bg-white border-none rounded-xl h-11 shadow-inner" 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    disabled={isAiLoading}
                  />
                  <Button type="submit" size="icon" className="h-11 w-11 rounded-xl bg-primary shadow-lg" disabled={isAiLoading || !chatInput.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-3xl">
            <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> 聯繫管理員</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleInquirySubmit} className="space-y-4">
                <div className="grid gap-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">主旨 (Subject)</Label>
                  <Input placeholder="例如：結算金額差異、倉庫入庫問題" required />
                </div>
                <div className="grid gap-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">內容 (Details)</Label>
                  <Textarea className="min-h-[120px]" placeholder="請詳細描述您的問題，以便我們更快速地為您解決。" required />
                </div>
                <Button className="w-full bg-foreground text-background font-bold h-12 rounded-xl" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  發送查詢
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: FAQs & Quick Contacts */}
        <div className="lg:col-span-5 space-y-8">
          <Card className="border-none shadow-sm rounded-3xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-primary" />
                常見問題
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {vendorFaqs.map((faq, i) => (
                  <AccordionItem key={i} value={`item-${i}`} className="border-none mb-2">
                    <AccordionTrigger className="text-left font-bold py-4 px-4 bg-muted/30 rounded-xl hover:no-underline">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="p-4 text-muted-foreground bg-muted/10 rounded-b-xl border-x border-b">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-primary/5 rounded-3xl">
            <CardHeader><CardTitle className="text-sm font-bold uppercase tracking-widest text-primary">聯絡資訊</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-white rounded-2xl flex items-center justify-between border shadow-sm group hover:border-primary transition-all cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                    <Smartphone className="h-5 w-5" />
                  </div>
                  <div><p className="font-bold text-sm">WhatsApp Business</p><p className="text-xs text-muted-foreground">+852 2345 6789</p></div>
                </div>
              </div>
              <div className="p-4 bg-white rounded-2xl flex items-center justify-between border shadow-sm group hover:border-primary transition-all cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div><p className="font-bold text-sm">Partner Support Email</p><p className="text-xs text-muted-foreground">vendor@shoppoint.hk</p></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="p-6 bg-muted/20 rounded-3xl space-y-4 border border-dashed">
            <div className="flex items-center gap-2 text-muted-foreground"><Warehouse className="h-4 w-4" /><h4 className="text-xs font-bold uppercase tracking-widest">葵涌物流中心</h4></div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              新界葵涌科技大廈 1204 室<br />
              收貨時間：週一至週五 09:00 - 18:00
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
