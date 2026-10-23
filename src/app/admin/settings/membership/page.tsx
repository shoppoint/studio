"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  Crown, 
  Save, 
  Loader2, 
  ShieldCheck, 
  Zap, 
  Award,
  Clock,
  Gift,
  Info,
  Edit3,
  Plus,
  X,
  Truck,
  Tag,
  MessageSquare,
  Coins,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/i18n-context";
import { useToast } from "@/hooks/use-toast";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { useFirestore, useDoc } from "@/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

const PREDEFINED_BENEFITS = [
  { id: "free_shipping", zh: "全單免運費", en: "Free Shipping on All Orders", icon: Truck },
  { id: "exclusive_deals", zh: "會員專享優惠", en: "Exclusive Member Deals", icon: Tag },
  { id: "priority_support", zh: "優先客服支援", en: "Priority Customer Support", icon: MessageSquare },
  { id: "birthday_gift", zh: "生日驚喜禮遇", en: "Birthday Surprise Gift", icon: Gift },
  { id: "points_multiplier", zh: "額外積分獎賞", en: "Bonus Points Points", icon: Coins },
];

const defaultTiers = {
  classic: { threshold: "0", period: "Lifetime", multiplier: "1.0", benefits_zh: ["基本會員價格"], benefits_en: ["Standard member pricing"] },
  gold: { threshold: "5000", period: "12 Months", multiplier: "1.2", benefits_zh: ["滿$100免運費", "專屬金級優惠"], benefits_en: ["Free shipping over $100", "Gold exclusive deals"] },
  platinum: { threshold: "20000", period: "12 Months", multiplier: "1.5", benefits_zh: ["全單免運費", "優先客服支援", "白金專屬禮遇"], benefits_en: ["Free shipping all orders", "Priority support", "Platinum exclusive rewards"] }
};

export default function MembershipSettings() {
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const db = useFirestore();
  const [loading, setLoading] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingTierKey, setEditingTierKey] = useState<string | null>(null);

  const setT = t.admin.settings;
  const tiersT = t.profile.tiers;

  const configRef = useMemo(() => {
    if (!db) return null;
    return doc(db, 'config', 'membership');
  }, [db]);
  const { data: configData, loading: configLoading } = useDoc<any>(configRef);

  const [formData, setFormData] = useState({
    tiers: defaultTiers
  });

  useEffect(() => {
    if (configData && configData.tiers) {
      setFormData({
        tiers: {
          ...defaultTiers,
          ...configData.tiers
        }
      });
    }
  }, [configData]);

  const handleTierChange = (tierKey: string, field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      tiers: {
        ...prev.tiers,
        [tierKey]: {
          ...(prev.tiers as any)[tierKey],
          [field]: value
        }
      }
    }));
  };

  const handleBenefitsUpdate = (tierKey: string, langKey: 'zh' | 'en', items: string[]) => {
    setFormData(prev => ({
      ...prev,
      tiers: {
        ...prev.tiers,
        [tierKey]: {
          ...(prev.tiers as any)[tierKey],
          [`benefits_${langKey}`]: items
        }
      }
    }));
  };

  const handleSave = () => {
    if (!db || !configRef) return;
    setLoading(true);
    const dataToSave = {
      tiers: formData.tiers,
      updatedAt: serverTimestamp()
    };

    setDoc(configRef, dataToSave, { merge: true })
      .then(() => {
        toast({ title: t.common.success, description: lang === 'en' ? "Membership tiers updated." : "會員等級規則已更新。" });
      })
      .catch(async (serverError) => {
        const permissionError = new FirestorePermissionError({
          path: configRef.path,
          operation: 'write',
          requestResourceData: dataToSave,
        } satisfies SecurityRuleContext);
        errorEmitter.emit('permission-error', permissionError);
      })
      .finally(() => setLoading(false));
  };

  if (configLoading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Fetching Rules...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
        <CardHeader className="bg-muted/10 border-b flex flex-row items-center justify-between pb-4 px-8">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2 text-lg font-black uppercase">
              <Crown className="h-5 w-5 text-primary" />
              {setT.membership_rules}
            </CardTitle>
            <CardDescription>Configure spending thresholds, point multipliers, and systematized benefits.</CardDescription>
          </div>
          <Button size="sm" className="bg-primary text-primary-foreground font-black rounded-xl h-11 px-8 shadow-lg" onClick={handleSave} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="mr-2 h-4 w-4" />} 
            {t.common.save}
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/5">
              <TableRow className="hover:bg-transparent">
                <TableHead className="pl-8">{t.profile.status}</TableHead>
                <TableHead>{setT.spend_threshold}</TableHead>
                <TableHead>{setT.threshold_period}</TableHead>
                <TableHead>{setT.pts_multiplier}</TableHead>
                <TableHead className="pr-8">專屬福利管理 (Benefits)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(formData.tiers).map(([key, tier]: [string, any]) => (
                <TableRow key={key} className="group hover:bg-muted/30 transition-colors border-dashed">
                  <TableCell className="pl-8 font-black uppercase py-6 text-xs tracking-widest">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-8 w-8 rounded-lg flex items-center justify-center shadow-sm",
                        key === 'platinum' ? "bg-indigo-600 text-white" : 
                        key === 'gold' ? "bg-amber-400 text-amber-950" : "bg-slate-200 text-slate-600"
                      )}>
                        {key === 'platinum' ? <Zap className="h-4 w-4 fill-current" /> : key === 'gold' ? <Award className="h-4 w-4 fill-current" /> : <ShieldCheck className="h-4 w-4" />}
                      </div>
                      {tiersT[key as keyof typeof tiersT]}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 bg-muted/20 px-3 py-2 rounded-xl border border-transparent w-28">
                      <span className="text-[10px] font-black text-muted-foreground">$</span>
                      <Input value={tier.threshold} onChange={(e) => handleTierChange(key, 'threshold', e.target.value)} className="h-7 p-0 bg-transparent border-none font-black text-sm focus-visible:ring-0 shadow-none text-right" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 bg-muted/20 px-3 py-2 rounded-xl w-32">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <Input value={tier.period} onChange={(e) => handleTierChange(key, 'period', e.target.value)} className="h-7 p-0 bg-transparent border-none font-bold text-xs focus-visible:ring-0 shadow-none" placeholder="e.g. 12 Months" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 bg-primary/5 px-3 py-2 rounded-xl border border-primary/10 w-20">
                      <Input value={tier.multiplier} onChange={(e) => handleTierChange(key, 'multiplier', e.target.value)} className="h-7 p-0 bg-transparent border-none font-black text-sm text-center focus-visible:ring-0 shadow-none text-primary" />
                      <span className="text-[10px] font-black text-primary">x</span>
                    </div>
                  </TableCell>
                  <TableCell className="pr-8">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="rounded-xl font-bold h-9 gap-2 border-primary/20 text-primary hover:bg-primary/5"
                      onClick={() => { setEditingTierKey(key); setIsEditorOpen(true); }}
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      管理福利 ({ Math.max(tier.benefits_zh?.length || 0, tier.benefits_en?.length || 0) })
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
        <DialogContent className="sm:max-w-[700px] rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-8 bg-primary text-primary-foreground">
            <DialogTitle className="text-2xl font-black font-headline flex items-center gap-3">
              <Gift className="h-6 w-6" /> 
              編輯 {editingTierKey ? tiersT[editingTierKey as keyof typeof tiersT] : ""} 福利清單
            </DialogTitle>
            <DialogDescription className="text-primary-foreground/80">系統將自動映射預設福利的圖示，自訂福利則顯示為勾選清單。</DialogDescription>
          </DialogHeader>
          
          <div className="p-8 space-y-8 bg-slate-50/50">
            <div className="space-y-4">
              <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">常用福利快速勾選</Label>
              <div className="grid grid-cols-2 gap-3">
                {PREDEFINED_BENEFITS.map(ben => {
                  const isSelected = editingTierKey && formData.tiers[editingTierKey as keyof typeof formData.tiers]?.benefits_zh?.includes(ben.zh);
                  return (
                    <div 
                      key={ben.id} 
                      onClick={() => {
                        if(!editingTierKey) return;
                        const tier = formData.tiers[editingTierKey as keyof typeof formData.tiers] as any;
                        const zhList = tier.benefits_zh || [];
                        const enList = tier.benefits_en || [];
                        if(zhList.includes(ben.zh)) {
                          handleBenefitsUpdate(editingTierKey, 'zh', zhList.filter((s:string)=>s !== ben.zh));
                          handleBenefitsUpdate(editingTierKey, 'en', enList.filter((s:string)=>s !== ben.en));
                        } else {
                          handleBenefitsUpdate(editingTierKey, 'zh', [...zhList, ben.zh]);
                          handleBenefitsUpdate(editingTierKey, 'en', [...enList, ben.en]);
                        }
                      }}
                      className={cn(
                        "p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-3",
                        isSelected ? "border-primary bg-primary/5 ring-1 ring-primary" : "bg-white border-muted hover:border-primary/20"
                      )}
                    >
                      <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                        <ben.icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold leading-tight">{ben.zh}</p>
                        <p className="text-[9px] opacity-60 font-medium">{ben.en}</p>
                      </div>
                      {isSelected && <Check className="h-4 w-4 text-primary" strokeWidth={3} />}
                    </div>
                  );
                })}
              </div>
            </div>

            <Separator className="border-dashed" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">中文福利清單 (ZH)</Label>
                  <Button variant="ghost" size="sm" className="h-6 text-[10px] font-bold" onClick={() => editingTierKey && handleBenefitsUpdate(editingTierKey, 'zh', [...(formData.tiers[editingTierKey as keyof typeof formData.tiers] as any).benefits_zh || [], ""])}><Plus className="h-3 w-3 mr-1" /> 新增</Button>
                </div>
                <div className="space-y-2">
                  {editingTierKey && (formData.tiers[editingTierKey as keyof typeof formData.tiers] as any).benefits_zh?.map((val: string, idx: number) => (
                    <div key={idx} className="flex gap-2 group">
                      <Input value={val} onChange={e => {
                        const next = [...(formData.tiers[editingTierKey as keyof typeof formData.tiers] as any).benefits_zh];
                        next[idx] = e.target.value;
                        handleBenefitsUpdate(editingTierKey, 'zh', next);
                      }} className="h-9 bg-white rounded-xl text-xs font-bold" />
                      <button onClick={() => {
                        const next = (formData.tiers[editingTierKey as keyof typeof formData.tiers] as any).benefits_zh.filter((_:any, i:number) => i !== idx);
                        handleBenefitsUpdate(editingTierKey, 'zh', next);
                      }} className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"><X className="h-4 w-4" /></button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">English Benefits (EN)</Label>
                  <Button variant="ghost" size="sm" className="h-6 text-[10px] font-bold" onClick={() => editingTierKey && handleBenefitsUpdate(editingTierKey, 'en', [...(formData.tiers[editingTierKey as keyof typeof formData.tiers] as any).benefits_en || [], ""])}><Plus className="h-3 w-3 mr-1" /> Add</Button>
                </div>
                <div className="space-y-2">
                  {editingTierKey && (formData.tiers[editingTierKey as keyof typeof formData.tiers] as any).benefits_en?.map((val: string, idx: number) => (
                    <div key={idx} className="flex gap-2 group">
                      <Input value={val} onChange={e => {
                        const next = [...(formData.tiers[editingTierKey as keyof typeof formData.tiers] as any).benefits_en];
                        next[idx] = e.target.value;
                        handleBenefitsUpdate(editingTierKey, 'en', next);
                      }} className="h-9 bg-white rounded-xl text-xs font-bold" />
                      <button onClick={() => {
                        const next = (formData.tiers[editingTierKey as keyof typeof formData.tiers] as any).benefits_en.filter((_:any, i:number) => i !== idx);
                        handleBenefitsUpdate(editingTierKey, 'en', next);
                      }} className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"><X className="h-4 w-4" /></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="p-8 bg-muted/10 border-t">
            <Button className="w-full h-12 rounded-xl font-black text-lg shadow-lg" onClick={() => setIsEditorOpen(false)}>完成編輯並保留變更</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="p-6 bg-primary/5 rounded-[2rem] border border-primary/10 flex items-start gap-4 shadow-sm">
        <Info className="h-6 w-6 text-primary shrink-0 mt-1" />
        <div className="space-y-1">
          <p className="font-black text-sm text-primary uppercase">系統自動圖示映射說明</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            前端將自動掃描福利內容。若包含<b>「免運費」</b>將顯示貨車圖示；<b>「專屬優惠」</b>顯示標籤圖示；<b>「優先」</b>顯示訊息圖示。這能讓前台福利列表看起來更美觀專業。
          </p>
        </div>
      </div>
    </div>
  );
}
