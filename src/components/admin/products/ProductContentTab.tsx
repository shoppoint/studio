"use client";

import { 
  Sparkles, 
  Loader2, 
  Zap, 
  Info, 
  FileText, 
  LayoutGrid, 
  HelpCircle, 
  Plus, 
  Trash2, 
  FlaskConical, 
  Wand2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

/**
 * 產品敘事管理 (Content Workflow)
 * 修正：根據身份隱藏 AI 生成按鈕，賣家不需要 AI 功能以節省預熱資源。
 */
export function ProductContentTab({ formData, onInputChange, onAiGenerate, aiLoading, isVendor = false }: any) {
  const [langTab, setLangTab] = useState("zh");

  const handleAddFaq = (langKey: 'en' | 'zh') => {
    const field = `faqs_${langKey}`;
    const next = [...(formData[field] || []), { q: "", a: "" }];
    onInputChange(field, next);
  };

  const updateFaq = (langKey: 'en' | 'zh', idx: number, field: 'q' | 'a', val: string) => {
    const targetField = `faqs_${langKey}`;
    const next = [...(formData[targetField] || [])];
    next[idx] = { ...next[idx], [field]: val };
    onInputChange(targetField, next);
  };

  const removeFaq = (langKey: 'en' | 'zh', idx: number) => {
    const targetField = `faqs_${langKey}`;
    const next = (formData[targetField] || []).filter((_: any, i: number) => i !== idx);
    onInputChange(targetField, next);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="px-2 space-y-1">
        <h2 className="text-2xl font-black flex items-center gap-3">
          <FileText className="h-6 w-6 text-primary" />
          產品敘事管理 (Content Workflow)
        </h2>
        {!isVendor && (
          <p className="text-xs text-muted-foreground font-bold italic">
            * 點擊各區塊獨立的 AI 按鈕來生成內容。生成過程由父容器管理，您可以隨時切換分頁查看其他資料。
          </p>
        )}
      </div>

      <div className="flex items-center justify-between px-2 pt-4">
        <Tabs value={langTab} onValueChange={setLangTab} className="w-fit">
          <TabsList className="bg-muted/50 h-10 p-1 rounded-xl">
            <TabsTrigger value="en" className="px-8 rounded-lg font-bold text-[10px] uppercase tracking-widest">English</TabsTrigger>
            <TabsTrigger value="zh" className="px-8 rounded-lg font-bold text-[10px] uppercase tracking-widest">繁體中文</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Card className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden border border-muted-foreground/10">
        <CardContent className="p-8 space-y-12">
          {['en', 'zh'].map(l => (
            <div key={l} className={cn("space-y-12 animate-in fade-in duration-500", langTab === l ? "block" : "hidden")}>
              
              {/* Step 1: Raw Data */}
              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase text-amber-600 tracking-widest ml-1 flex items-center gap-2">
                  <FlaskConical className="h-3.5 w-3.5" /> 產品成分與原料 (STEP 1: RAW INGREDIENTS)
                </Label>
                <Textarea 
                  value={formData[`ingredients_${l}`] || ""} 
                  onChange={(e) => onInputChange(`ingredients_${l}`, e.target.value)}
                  className="min-h-[100px] bg-muted/20 border-none rounded-2xl p-6 text-sm leading-relaxed focus-visible:ring-primary/20"
                  placeholder={l === 'zh' ? "在此輸入產品的原始成分..." : "Enter raw ingredients here..."}
                />
              </div>

              {/* Step 2: Detailed Story */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 text-primary" /> 詳細行銷描述 (STEP 2: BRAND NARRATIVE)
                  </Label>
                  {!isVendor && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 rounded-xl font-black text-[10px] uppercase gap-1.5 border-primary/20 text-primary bg-white shadow-sm hover:bg-primary hover:text-white transition-all"
                      onClick={() => onAiGenerate('detailed')}
                      disabled={aiLoading?.detailed}
                    >
                      {aiLoading?.detailed ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />} 
                      AI 獨立生成詳細描述
                    </Button>
                  )}
                </div>
                <RichTextEditor 
                  variant="standard" 
                  value={formData[`longDescription_${l}`] || ""} 
                  onChange={(v:any) => onInputChange(`longDescription_${l}`, v)} 
                />
              </div>

              {/* Step 3: Summary */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
                    <LayoutGrid className="h-3.5 w-3.5 text-primary" /> 短評摘要 (STEP 3: SUMMARY)
                  </Label>
                  {!isVendor && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="h-8 rounded-xl font-black text-[10px] uppercase gap-1.5 border-primary/20 text-primary bg-white shadow-sm hover:bg-primary hover:text-white transition-all"
                      onClick={() => onAiGenerate('summary')}
                      disabled={aiLoading?.summary}
                    >
                      {aiLoading?.summary ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />} 
                      AI 獨立生成摘要
                    </Button>
                  )}
                </div>
                <RichTextEditor 
                  variant="minimal" 
                  value={formData[`description_${l}`] || ""} 
                  onChange={(v:any) => onInputChange(`description_${l}`, v)} 
                />
              </div>

              <Separator className="border-dashed" />

              {/* FAQs Section */}
              <div className="space-y-6">
                <div className="flex items-center justify-between px-1">
                  <div className="space-y-0.5">
                    <h4 className="text-lg font-black flex items-center gap-2">
                      <HelpCircle className="h-5 w-5 text-primary" /> 
                      常見問題解答 (FAQs)
                    </h4>
                    <p className="text-[10px] text-muted-foreground font-bold">自動基於成分、產地及規格生成常見問題。</p>
                  </div>
                  <div className="flex gap-2">
                    {!isVendor && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-9 rounded-xl font-bold border-primary text-primary shadow-sm hover:bg-primary hover:text-white transition-all" 
                        onClick={() => onAiGenerate('faq')} 
                        disabled={aiLoading?.faq}
                      >
                        {aiLoading?.faq ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />} 
                        AI 獨立生成 FAQ
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="h-9 rounded-xl font-bold gap-2" onClick={() => handleAddFaq(l as 'en' | 'zh')}>
                      <Plus className="h-4 w-4" /> 手動新增
                    </Button>
                  </div>
                </div>
                <div className="grid gap-4">
                  {(formData[`faqs_${l}`] || []).map((faq: any, idx: number) => (
                    <div key={idx} className="p-6 bg-muted/20 rounded-3xl border border-dashed border-muted-foreground/20 space-y-4 animate-in slide-in-from-top-2">
                      <div className="flex justify-between items-center">
                        <Badge variant="outline" className="bg-white border-primary/20 text-primary font-black uppercase text-[9px]">Question {idx + 1}</Badge>
                        <button onClick={() => removeFaq(l as 'en' | 'zh', idx)} className="text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="grid gap-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">問題</Label>
                          <Input value={faq.q} onChange={(e) => updateFaq(l as 'en' | 'zh', idx, 'q', e.target.value)} className="h-10 bg-white border-none rounded-xl font-bold shadow-sm" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">解答</Label>
                          <Textarea value={faq.a} onChange={(e) => updateFaq(l as 'en' | 'zh', idx, 'a', e.target.value)} className="bg-white border-none rounded-xl text-xs h-20 shadow-sm" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}