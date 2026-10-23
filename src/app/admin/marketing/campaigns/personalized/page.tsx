"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Sparkles, 
  Loader2, 
  Mail, 
  Users, 
  Eye, 
  Send, 
  CheckCircle2, 
  Heart, 
  Smartphone,
  Zap,
  Info,
  ChevronRight,
  Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n/i18n-context";
import { useToast } from "@/hooks/use-toast";
import { generatePersonalizedEdm, type GenerateEdmOutput } from "@/ai/flows/generate-personalized-edm-flow";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export default function PersonalizedEdmPage() {
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState("Easter Quality Living (復活節高品質生活)");
  const [selectedInterest, setSelectedInterest] = useState("Electronics");
  const [generatedContent, setGeneratedContent] = useState<GenerateEdmOutput | null>(null);

  const interestSegments = [
    { label: "Electronics (電子愛好者)", value: "Electronics", count: 4200 },
    { label: "Beauty & Skincare (美妝控)", value: "Beauty", count: 3500 },
    { label: "Food & Organic (吃貨專區)", value: "Food", count: 2800 },
    { label: "Home & Living (居家生活)", value: "Home", count: 1905 },
  ];

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const result = await generatePersonalizedEdm({
        userInterests: [selectedInterest],
        userTier: "Gold Member",
        weeklyTheme: theme,
        featuredProducts: [
          { name: "Wireless Earbuds Pro", category: "Electronics", price: 129 },
          { name: "Premium Face Serum", category: "Beauty", price: 320 },
          { name: "Modern Desk Lamp", category: "Home", price: 85 }
        ],
        language: lang
      });
      setGeneratedContent(result);
      toast({ title: "AI 生成成功", description: "已根據受眾偏好生成專屬文案。" });
    } catch (e) {
      toast({ title: "生成失敗", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleBroadcast = () => {
    toast({ 
      title: "群發指令已發送", 
      description: `正在向 ${interestSegments.find(s => s.value === selectedInterest)?.count} 名受眾發送個人化郵件。` 
    });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="rounded-full">
            <Link href="/admin/marketing/campaigns"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold font-headline">AI 動態個人化 EDM</h1>
            <p className="text-muted-foreground">利用 AI 為不同興趣的顧客生成專屬的每週精選郵件。</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Configuration */}
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground">1. 設定本週主題</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>行銷主題</Label>
                <Input value={theme} onChange={(e) => setTheme(e.target.value)} className="bg-muted/20 border-none font-bold" />
              </div>
              <p className="text-[10px] text-muted-foreground leading-relaxed italic">
                AI 會根據此主題與產品庫，針對不同受眾撰寫特定切入點的郵件。
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground">2. 選擇測試受眾</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {interestSegments.map((seg) => (
                  <div 
                    key={seg.value} 
                    className={cn(
                      "p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between",
                      selectedInterest === seg.value ? "border-primary bg-primary/5 ring-1 ring-primary" : "border-muted hover:border-primary/20"
                    )}
                    onClick={() => setSelectedInterest(seg.value)}
                  >
                    <div>
                      <p className="font-bold text-sm">{seg.label}</p>
                      <p className="text-[10px] text-muted-foreground">{seg.count} 位受眾匹配</p>
                    </div>
                    {selectedInterest === seg.value && <CheckCircle2 className="h-4 w-4 text-primary" />}
                  </div>
                ))}
              </div>
              <Button 
                className="w-full h-12 bg-primary text-primary-foreground font-black shadow-lg gap-2 mt-4" 
                onClick={handleGenerate}
                disabled={loading}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                生成預覽內容
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right: Preview */}
        <div className="lg:col-span-8">
          {generatedContent ? (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
              <Card className="border-none shadow-xl bg-white rounded-[2rem] overflow-hidden">
                <div className="bg-muted/30 p-4 text-center text-[10px] font-black uppercase text-muted-foreground tracking-widest border-b">
                  AI 個人化郵件預覽 - 受眾：{selectedInterest}
                </div>
                <CardContent className="p-8 space-y-6">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black text-muted-foreground uppercase">Email Subject:</p>
                    <h2 className="text-xl font-black text-primary">{generatedContent.subject}</h2>
                  </div>
                  <Separator />
                  <div className="prose prose-neutral max-w-none">
                    <div 
                      className="p-6 bg-white border border-dashed rounded-2xl min-h-[300px] text-sm whitespace-pre-line leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: generatedContent.htmlBody }}
                    />
                  </div>
                  <div className="p-4 bg-primary/5 rounded-xl border border-primary/10 flex items-start gap-3">
                    <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-primary uppercase">AI 策略說明 (Logic Used)</p>
                      <p className="text-xs text-muted-foreground">{generatedContent.logicUsed}</p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="p-8 bg-muted/10 border-t flex justify-between items-center">
                  <p className="text-xs text-muted-foreground">確認無誤後，可向全體 <strong>{selectedInterest}</strong> 受眾發布。</p>
                  <Button className="bg-primary text-primary-foreground font-black px-8 h-12 rounded-xl shadow-lg gap-2" onClick={handleBroadcast}>
                    <Send className="h-4 w-4" /> 啟動群發
                  </Button>
                </CardFooter>
              </Card>
            </div>
          ) : (
            <div className="h-full min-h-[500px] border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center text-center p-12 space-y-4">
              <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center text-muted-foreground/30">
                <Mail className="h-10 w-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-muted-foreground">尚未生成內容</h3>
                <p className="text-sm text-muted-foreground max-w-xs">請從左側選擇行銷主題與受眾群組，讓 AI 為您打造專屬的 EDM 文案。</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
