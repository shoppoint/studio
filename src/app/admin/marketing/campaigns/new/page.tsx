
"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  Send, 
  Loader2, 
  Users, 
  Mail, 
  Image as ImageIcon,
  Sparkles,
  Search,
  Eye,
  Settings2,
  Globe,
  Info,
  CheckCircle2,
  Zap,
  Plus,
  Trash2,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Layout,
  Type,
  ShoppingCart,
  MousePointer2,
  Smartphone,
  Copy,
  Wand2,
  X
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
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { generateNotificationContent } from "@/ai/flows/generate-notification-content-flow";

// 定義電郵區塊類型
type BlockType = 'logo' | 'hero' | 'text' | 'products' | 'button' | 'footer';

interface EmailBlock {
  id: string;
  type: BlockType;
  data: any;
}

export default function NewCampaignPage() {
  const router = useRouter();
  const { t, lang } = useI18n();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [targetType, setTargetType] = useState("all");
  const [subject, setSubject] = useState("");
  const [previewMode, setPreviewMode] = useState(false);
  
  // 核心狀態：電郵區塊陣列
  const [blocks, setBlocks] = useState<EmailBlock[]>([
    { id: 'b1', type: 'logo', data: { url: "/logo.png", align: "center" } },
    { id: 'b2', type: 'text', data: { title: "歡迎來到 SHOP POINT", content: "我們為您精選了全球優質良品，即日起凡消費滿 $500 即享免運費優惠。" } }
  ]);

  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

  const addBlock = (type: BlockType) => {
    const newBlock: EmailBlock = {
      id: `block_${Date.now()}`,
      type,
      data: type === 'text' ? { title: "新增標題", content: "請輸入內容..." } :
            type === 'button' ? { label: "立即查看", url: "/shop" } :
            type === 'hero' ? { url: "https://picsum.photos/seed/campaign/1200/600" } :
            type === 'products' ? { items: [{ name: "產品 A", price: "99" }, { name: "產品 B", price: "199" }] } :
            type === 'footer' ? { content: "© 2024 SHOP POINT Limited. All rights reserved." } : {}
    };
    setBlocks(prev => [...prev, newBlock]);
    setSelectedBlockId(newBlock.id);
    toast({ title: "已加入區塊", description: `類型：${type}` });
  };

  const removeBlock = (id: string) => {
    setBlocks(prev => prev.filter(b => b.id !== id));
    if (selectedBlockId === id) setSelectedBlockId(null);
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const nextIndex = direction === 'up' ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= blocks.length) return;
    const newBlocks = [...blocks];
    [newBlocks[index], newBlocks[nextIndex]] = [newBlocks[nextIndex], newBlocks[index]];
    setBlocks(newBlocks);
  };

  const updateBlockData = (id: string, newData: any) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, data: { ...b.data, ...newData } } : b));
  };

  const handleAiRefine = async (id: string) => {
    const block = blocks.find(b => b.id === id);
    if (!block || block.type !== 'text') return;

    setAiLoading(id);
    try {
      const result = await generateNotificationContent({
        triggerEvent: "Marketing Campaign Block",
        concept: block.data.title || "Promotional message",
        language: lang,
        channel: "email"
      });
      // 假設 AI 回傳的是純文字或簡單 HTML，我們提取內容
      updateBlockData(id, { content: result.content.replace(/<[^>]*>?/gm, '').substring(0, 300) + "..." });
      toast({ title: "AI 優化完成" });
    } catch (e) {
      toast({ title: "AI Error", variant: "destructive" });
    } finally {
      setAiLoading(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || blocks.length === 0) return;

    setLoading(true);
    // 模擬發送 API 請求
    setTimeout(() => {
      setLoading(false);
      toast({ title: "宣傳活動已啟動", description: "電郵正在隊列中準備發送給受眾。" });
      router.push("/admin/marketing/campaigns");
    }, 2000);
  };

  const selectedBlock = useMemo(() => blocks.find(b => b.id === selectedBlockId), [blocks, selectedBlockId]);

  return (
    <div className="space-y-8 pb-20 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between sticky top-0 z-50 bg-background/80 backdrop-blur py-4 border-b">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full"><ArrowLeft className="h-5 w-5" /></Button>
          <div>
            <h1 className="text-2xl font-black font-headline tracking-tight">電郵視覺編輯中心</h1>
            <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Email Broadcast Customizer</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl font-bold h-11" onClick={() => setPreviewMode(!previewMode)}>
            {previewMode ? <Settings2 className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
            {previewMode ? "返回編輯" : "預覽最終效果"}
          </Button>
          <Button className="bg-primary text-primary-foreground font-black shadow-lg rounded-xl h-11 px-8 gap-2" onClick={handleSubmit} disabled={loading || !subject}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            立即發送給 {targetType === 'all' ? '12,405' : targetType === 'subscribers' ? '4,200' : '8,205'} 人
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Sidebar: Components Library */}
        {!previewMode && (
          <aside className="lg:col-span-2 space-y-6 sticky top-24">
            <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
              <CardHeader className="bg-muted/10 border-b py-4">
                <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                  <Layout className="h-3 w-3" />
                  可用組件區塊
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 grid grid-cols-1 gap-2">
                {[
                  { type: 'logo', label: '商店標誌', icon: ImageIcon },
                  { type: 'hero', label: '橫幅圖片', icon: Layout },
                  { type: 'text', label: '內容段落', icon: Type },
                  { type: 'products', label: '產品列表', icon: ShoppingCart },
                  { type: 'button', label: '按鈕 (CTA)', icon: MousePointer2 },
                  { type: 'footer', label: '頁腳資訊', icon: Info }
                ].map((btn) => (
                  <button
                    key={btn.type}
                    onClick={() => addBlock(btn.type as BlockType)}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-primary/10 hover:text-primary transition-all text-xs font-bold text-muted-foreground group"
                  >
                    <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center group-hover:bg-white transition-colors shadow-sm">
                      <btn.icon className="h-4 w-4" />
                    </div>
                    {btn.label}
                  </button>
                ))}
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-blue-50 border-l-4 border-blue-500 rounded-2xl">
              <CardContent className="p-4 space-y-3">
                <p className="text-[10px] font-black text-blue-900 uppercase">設計提示</p>
                <p className="text-[11px] text-blue-800 leading-relaxed italic">
                  建議先從 Logo 開始，中間加入 Hero 圖片提升視覺吸引力，最後以按鈕引導顧客回店。
                </p>
              </CardContent>
            </Card>
          </aside>
        )}

        {/* Center: Email Canvas */}
        <div className={cn("space-y-6", previewMode ? "lg:col-span-12" : "lg:col-span-6")}>
          {!previewMode && (
            <div className="px-4">
              <Label className="text-xs font-black uppercase text-muted-foreground tracking-widest ml-1 mb-2 block">電郵主題 (Email Subject)</Label>
              <Input 
                value={subject} 
                onChange={(e) => setSubject(e.target.value)} 
                placeholder="例如：🔥 本週精選：全球優質良品限時 8 折" 
                className="h-14 text-xl font-black rounded-2xl bg-white border-none shadow-sm mb-8"
              />
            </div>
          )}

          <div className={cn(
            "bg-white mx-auto shadow-2xl rounded-[3rem] overflow-hidden border-8 border-muted transition-all duration-500",
            previewMode ? "max-w-2xl" : "max-w-full"
          )}>
            {/* Toolbar Header for Canvas */}
            {!previewMode && (
              <div className="bg-muted/30 p-4 border-b flex items-center justify-between px-8">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Mobile Responsive View</span>
                </div>
                <Badge variant="outline" className="bg-white border-none text-[8px] font-black uppercase h-5">Canvas Ready</Badge>
              </div>
            )}

            <div className="min-h-[600px] bg-white">
              {blocks.length === 0 ? (
                <div className="h-[600px] flex flex-col items-center justify-center text-center p-12 space-y-4">
                  <div className="h-20 w-20 bg-muted/50 rounded-full flex items-center justify-center text-muted-foreground/30">
                    <Layout className="h-10 w-10" />
                  </div>
                  <p className="text-muted-foreground font-bold italic">您的畫布是空的，從左側加入一些組件吧！</p>
                </div>
              ) : (
                <div className="flex flex-col">
                  {blocks.map((block, index) => (
                    <div 
                      key={block.id}
                      onClick={() => !previewMode && setSelectedBlockId(block.id)}
                      className={cn(
                        "relative group transition-all",
                        !previewMode && "cursor-pointer hover:ring-2 hover:ring-primary/30",
                        !previewMode && selectedBlockId === block.id && "ring-2 ring-primary ring-inset bg-primary/5 shadow-inner"
                      )}
                    >
                      {/* Block Content Renderer */}
                      <div className="p-4">
                        {block.type === 'logo' && (
                          <div className={cn("flex", block.data.align === 'center' ? 'justify-center' : block.data.align === 'right' ? 'justify-end' : 'justify-start')}>
                            <img src={block.data.url} alt="Logo" style={{ maxHeight: '60px' }} />
                          </div>
                        )}
                        {block.type === 'hero' && (
                          <div className="rounded-2xl overflow-hidden shadow-sm">
                            <img src={block.data.url} alt="Hero" className="w-full object-cover" />
                          </div>
                        )}
                        {block.type === 'text' && (
                          <div className="px-6 py-4 space-y-2">
                            <h2 className="text-2xl font-black text-foreground">{block.data.title}</h2>
                            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{block.data.content}</p>
                          </div>
                        )}
                        {block.type === 'products' && (
                          <div className="grid grid-cols-2 gap-4 px-6 py-4">
                            {block.data.items?.map((item: any, i: number) => (
                              <div key={i} className="bg-muted/20 p-4 rounded-2xl border border-dashed border-muted-foreground/20 text-center space-y-2">
                                <div className="aspect-square bg-muted/50 rounded-xl flex items-center justify-center"><ImageIcon className="h-6 w-6 text-muted-foreground/20" /></div>
                                <p className="font-bold text-xs truncate">{item.name}</p>
                                <p className="text-primary font-black text-sm">${item.price}</p>
                              </div>
                            ))}
                          </div>
                        )}
                        {block.type === 'button' && (
                          <div className="flex justify-center p-6">
                            <button className="bg-primary text-primary-foreground px-10 py-4 rounded-2xl font-black text-lg shadow-xl hover:scale-105 transition-transform">
                              {block.data.label}
                            </button>
                          </div>
                        )}
                        {block.type === 'footer' && (
                          <div className="p-8 text-center bg-muted/10 border-t border-dashed mt-8">
                            <p className="text-[10px] text-muted-foreground leading-relaxed">
                              {block.data.content}
                            </p>
                            <div className="flex justify-center gap-4 mt-4 opacity-30">
                              <div className="h-4 w-4 bg-muted-foreground rounded-full" />
                              <div className="h-4 w-4 bg-muted-foreground rounded-full" />
                              <div className="h-4 w-4 bg-muted-foreground rounded-full" />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Floating Block Controls (Hidden in preview) */}
                      {!previewMode && (
                        <div className="absolute right-4 top-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                          <Button size="icon" variant="secondary" className="h-7 w-7 rounded-lg" onClick={(e) => { e.stopPropagation(); moveBlock(index, 'up'); }} disabled={index === 0}><ArrowUp className="h-3 w-3" /></Button>
                          <Button size="icon" variant="secondary" className="h-7 w-7 rounded-lg" onClick={(e) => { e.stopPropagation(); moveBlock(index, 'down'); }} disabled={index === blocks.length - 1}><ArrowDown className="h-3 w-3" /></Button>
                          <Button size="icon" variant="destructive" className="h-7 w-7 rounded-lg shadow-lg" onClick={(e) => { e.stopPropagation(); removeBlock(block.id); }}><Trash2 className="h-3 w-3" /></Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar: Block Settings & Audience */}
        {!previewMode && (
          <aside className="lg:col-span-4 space-y-6 sticky top-24">
            {selectedBlock ? (
              <Card className="border-none shadow-xl bg-white rounded-3xl overflow-hidden animate-in slide-in-from-right-2 duration-300">
                <CardHeader className="bg-primary/5 border-b py-5">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-black uppercase flex items-center gap-2">
                      <Settings2 className="h-4 w-4 text-primary" />
                      編輯區塊：{selectedBlock.type.toUpperCase()}
                    </CardTitle>
                    <button onClick={() => setSelectedBlockId(null)} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {selectedBlock.type === 'text' && (
                    <div className="space-y-4">
                      <div className="grid gap-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground">標題文字</Label>
                        <Input value={selectedBlock.data.title} onChange={(e) => updateBlockData(selectedBlock.id, { title: e.target.value })} className="h-11 bg-muted/20 border-none rounded-xl font-bold" />
                      </div>
                      <div className="grid gap-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-[10px] font-black uppercase text-muted-foreground">內文段落</Label>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 text-primary gap-1 font-black text-[9px] uppercase hover:bg-primary/5"
                            onClick={() => handleAiRefine(selectedBlock.id)}
                            disabled={!!aiLoading}
                          >
                            {aiLoading === selectedBlock.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
                            AI 智能撰寫
                          </Button>
                        </div>
                        <Textarea 
                          value={selectedBlock.data.content} 
                          onChange={(e) => updateBlockData(selectedBlock.id, { content: e.target.value })} 
                          className="min-h-[150px] bg-muted/20 border-none rounded-2xl text-sm leading-relaxed" 
                        />
                      </div>
                    </div>
                  )}

                  {selectedBlock.type === 'hero' && (
                    <div className="space-y-4">
                      <div className="grid gap-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground">圖片網址</Label>
                        <Input value={selectedBlock.data.url} onChange={(e) => updateBlockData(selectedBlock.id, { url: e.target.value })} className="h-11 bg-muted/20 border-none rounded-xl" />
                      </div>
                      <p className="text-[9px] text-muted-foreground italic">建議比例：1200x600px。圖片能大幅提升點擊率。</p>
                    </div>
                  )}

                  {selectedBlock.type === 'button' && (
                    <div className="space-y-4">
                      <div className="grid gap-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground">按鈕文字</Label>
                        <Input value={selectedBlock.data.label} onChange={(e) => updateBlockData(selectedBlock.id, { label: e.target.value })} className="h-11 bg-muted/20 border-none rounded-xl font-black text-center" />
                      </div>
                      <div className="grid gap-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground">跳轉連結</Label>
                        <Input value={selectedBlock.data.url} onChange={(e) => updateBlockData(selectedBlock.id, { url: e.target.value })} className="h-11 bg-muted/20 border-none rounded-xl font-mono text-xs" />
                      </div>
                    </div>
                  )}

                  {selectedBlock.type === 'footer' && (
                    <div className="space-y-4">
                      <div className="grid gap-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground">版權與聲明文字</Label>
                        <Textarea value={selectedBlock.data.content} onChange={(e) => updateBlockData(selectedBlock.id, { content: e.target.value })} className="h-24 bg-muted/20 border-none rounded-2xl text-[10px]" />
                      </div>
                    </div>
                  )}

                  {selectedBlock.type === 'logo' && (
                    <div className="space-y-4">
                      <div className="grid gap-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground">Logo URL</Label>
                        <Input value={selectedBlock.data.url} onChange={(e) => updateBlockData(selectedBlock.id, { url: e.target.value })} className="h-11 bg-muted/20 border-none rounded-xl" />
                      </div>
                      <div className="grid gap-2">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground">對齊方式</Label>
                        <Select value={selectedBlock.data.align} onValueChange={(v) => updateBlockData(selectedBlock.id, { align: v })}>
                          <SelectTrigger className="h-11 bg-muted/20 border-none rounded-xl font-bold"><SelectValue /></SelectTrigger>
                          <SelectContent className="rounded-xl border-none shadow-2xl">
                            <SelectItem value="left">靠左</SelectItem>
                            <SelectItem value="center">居中</SelectItem>
                            <SelectItem value="right">靠右</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="border-none shadow-sm bg-muted/20 rounded-3xl border-2 border-dashed">
                <CardContent className="p-12 text-center space-y-4">
                  <MousePointer2 className="h-10 w-10 text-muted-foreground/30 mx-auto" />
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-muted-foreground">選取畫布上的區塊</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">來進行詳細設定</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Audience Settings */}
            <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
              <CardHeader className="bg-muted/5 border-b py-4"><CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">受眾與群發設定</CardTitle></CardHeader>
              <CardContent className="p-6 space-y-6">
                <RadioGroup value={targetType} onValueChange={setTargetType} className="space-y-2">
                  {[
                    { id: 'all', label: '所有授權名單', count: '12,405' },
                    { id: 'subscribers', label: '僅電子報訂閱者', count: '4,200' },
                    { id: 'customers', label: '僅已註冊會員', count: '8,205' }
                  ].map((aud) => (
                    <div key={aud.id} className={cn(
                      "p-4 border-2 rounded-2xl flex items-center space-x-3 cursor-pointer transition-all",
                      targetType === aud.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:bg-muted/50 border-muted'
                    )}>
                      <RadioGroupItem value={aud.id} id={aud.id} />
                      <Label htmlFor={aud.id} className="flex-1 cursor-pointer">
                        <p className="font-bold text-xs">{aud.label}</p>
                        <p className="text-[10px] text-muted-foreground">{aud.count} 位受眾</p>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>

                <Separator />

                <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-black text-primary uppercase"><Zap className="h-4 w-4 fill-current" /> 發送準備概況</div>
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-muted-foreground">預計覆蓋:</span>
                    <span className="font-black">{targetType === 'all' ? '12,405' : targetType === 'subscribers' ? '4,200' : '8,205'} 人</span>
                  </div>
                  <div className="flex justify-between text-xs font-medium">
                    <span className="text-muted-foreground">伺服器節點:</span>
                    <span className="font-mono text-[10px]">asia-east1</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>
        )}
      </div>
    </div>
  );
}
