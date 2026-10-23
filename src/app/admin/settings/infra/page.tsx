"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  Database, 
  Save, 
  Loader2, 
  Key, 
  CheckCircle2, 
  Activity, 
  Zap, 
  RefreshCcw,
  Bot,
  AlertTriangle,
  UserX,
  FileX,
  DatabaseZap,
  Gauge,
  Server,
  ShieldCheck,
  Globe,
  Monitor,
  Search,
  HardDriveDownload,
  Trash2,
  Info,
  XCircle,
  Calendar,
  FlaskConical,
  Check,
  Cpu,
  History,
  ShoppingCart,
  ShieldAlert,
  Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useI18n } from "@/lib/i18n/i18n-context";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useDoc, useFirebase } from "@/firebase";
import { 
  doc, 
  setDoc, 
  serverTimestamp,
  getDoc
} from "firebase/firestore";
import { runPerformanceAuditAction } from "@/app/actions/performance-actions";
import { testGeminiKeyAction, getAiStatusAction } from "@/app/actions/ai-actions";
import { cleanupOldAbandonedCartsAction, cleanupAnonymousUsersAction } from "@/app/actions/maintenance-actions";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export default function InfraSettings() {
  const { t } = useI18n();
  const { toast } = useToast();
  const { db, auth } = useFirebase(); 
  const [loading, setLoading] = useState(false);
  const [auditLoading, setAuditLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [diagLoading, setDiagLoading] = useState(false);
  const [maintenanceLoading, setMaintenanceLoading] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [aiDiagData, setAiDiagData] = useState<any>(null);

  const setT = t.admin.settings;

  // 健康檢查狀態
  const [healthStatus, setHealthStatus] = useState({
    firestore: "checking",
    auth: "checking",
    gateway: "checking"
  });

  const configRef = useMemo(() => {
    if (!db) return null;
    return doc(db, 'config', 'infra');
  }, [db]);
  const { data: configData, loading: configLoading } = useDoc<any>(configRef);

  const perfRef = useMemo(() => {
    if (!db) return null;
    return doc(db, 'config', 'performance');
  }, [db]);
  const { data: perfData } = useDoc<any>(perfRef);

  const [formData, setFormData] = useState({
    googleApiKey: "", 
    geminiApiKey: "", 
    functionsRegion: "asia-east1",
    recaptchaSecretKey: "",
    cap_contact: true,
    cap_auth: false,
    cap_checkout: false
  });

  useEffect(() => {
    if (configData) {
      setFormData(prev => ({ 
        ...prev, 
        ...configData,
        googleApiKey: configData.googleApiKey || "",
        geminiApiKey: configData.geminiApiKey || configData.googleApiKey || "",
        functionsRegion: configData.functionsRegion || "asia-east1"
      }));
    }
  }, [configData]);

  useEffect(() => {
    const probeHealth = async () => {
      if (!db || !auth) return;
      try {
        await getDoc(doc(db, 'config', 'infra'));
        setHealthStatus(p => ({ ...p, firestore: "live" }));
      } catch (e) {
        setHealthStatus(p => ({ ...p, firestore: "error" }));
      }
      if (auth.currentUser) {
        setHealthStatus(p => ({ ...p, auth: "secure" }));
      } else {
        setHealthStatus(p => ({ ...p, auth: "warning" }));
      }
      try {
        const res = await fetch('/api/catalog/feed.csv', { method: 'HEAD' });
        setHealthStatus(p => ({ ...p, gateway: res.ok ? "active" : "error" }));
      } catch (e) {
        setHealthStatus(p => ({ ...p, gateway: "error" }));
      }
    };
    probeHealth();
    runAiDiagnosis();
  }, [db, auth]);

  const runAiDiagnosis = async () => {
    setDiagLoading(true);
    try {
      const res = await getAiStatusAction();
      if (res.success) {
        setAiDiagData(res.data);
      }
    } catch (e) {} finally {
      setDiagLoading(false);
    }
  };

  const handleCleanupCarts = async () => {
    setMaintenanceLoading(true);
    try {
      const res = await cleanupOldAbandonedCartsAction();
      if (res.success) {
        toast({ title: "清理完成", description: `已成功移除 ${res.count} 筆無效遺棄購物車紀錄。` });
      }
    } catch (e) {
      toast({ title: "清理失敗", variant: "destructive" });
    } finally {
      setMaintenanceLoading(false);
    }
  };

  const handleSave = async () => {
    if (!db || !configRef) return;
    setLoading(true);
    try {
      await setDoc(configRef, { ...formData, updatedAt: serverTimestamp() }, { merge: true });
      toast({ title: "設定已儲存" });
    } catch (e) {
      toast({ title: t.common.error, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleTestKey = async () => {
    setTestLoading(true);
    setTestResult(null);
    try {
      const res = await testGeminiKeyAction(formData.geminiApiKey);
      setTestResult(res);
      if (res.success) {
        toast({ title: "Gemini 連線成功", description: res.message });
      } else {
        toast({ title: "連線失敗", description: res.message, variant: "destructive" });
      }
    } catch (e: any) {
      setTestResult({ success: false, message: e.message });
    } finally {
      setTestLoading(false);
    }
  };

  const handleRunAudit = async () => {
    setAuditLoading(true);
    try {
      const res = await runPerformanceAuditAction("https://shoppoint.hk", formData.googleApiKey);
      if (res.success && res.data) {
        if (db) await setDoc(doc(db, 'config', 'performance'), { ...res.data, updatedAt: serverTimestamp() }, { merge: true });
        toast({ title: "Lighthouse 審計完成", description: `得分: ${res.data.score}` });
      } else {
        toast({ title: "審計未完成", description: res.message, variant: "destructive" });
      }
    } catch (e: any) {
      toast({ title: "審計失敗", description: "連線至審計服務時發生錯誤。", variant: "destructive" });
    } finally {
      setAuditLoading(false);
    }
  };

  if (configLoading) return <div className="h-96 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300 pb-24">
      <div className="flex justify-between items-center px-2">
        <h2 className="text-xl font-black font-headline uppercase flex items-center gap-3">
          <Server className="h-6 w-6 text-primary" />
          基礎設施與數據健康
        </h2>
        <div className="flex gap-2">
           <Button variant="outline" className="rounded-xl h-11 px-6 font-bold gap-2" onClick={runAiDiagnosis} disabled={diagLoading}>
              <RefreshCcw className={cn("h-4 w-4", diagLoading && "animate-spin")} /> 刷新診斷
           </Button>
           <Button className="bg-primary text-primary-foreground font-black rounded-xl h-11 px-8 shadow-lg hover:scale-105 transition-transform" onClick={handleSave} disabled={loading}>
            {loading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />} 儲存所有設定
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-8">
        
        {/* Captcha Security Panel */}
        <Card className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden border-l-4 border-indigo-600">
          <CardHeader className="bg-indigo-50/50 border-b p-8">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-3 text-indigo-700">
                <ShieldAlert className="h-5 w-5" />
                {setT.captcha.title}
              </CardTitle>
              <Badge className="bg-indigo-600 text-white border-none font-black text-[10px]">V3 INVISIBLE</Badge>
            </div>
            <CardDescription>{setT.captcha.desc}</CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            <div className="grid gap-6">
              <div className="grid gap-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">{setT.captcha.secret_key}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-indigo-600" />
                  <Input 
                    type="password"
                    value={formData.recaptchaSecretKey}
                    onChange={(e) => setFormData(p => ({ ...p, recaptchaSecretKey: e.target.value }))}
                    placeholder="6L... (Google AI Studio Secret Key)"
                    className="h-11 pl-10 bg-muted/20 border-none rounded-xl font-mono text-sm"
                  />
                </div>
              </div>

              <Separator className="border-dashed" />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center justify-between p-4 bg-muted/10 rounded-2xl border border-dashed">
                  <div className="space-y-0.5">
                    <Label className="text-[11px] font-black uppercase">{setT.captcha.contact_switch}</Label>
                  </div>
                  <Switch checked={formData.cap_contact} onCheckedChange={(v) => setFormData(p => ({...p, cap_contact: v}))} />
                </div>
                <div className="flex items-center justify-between p-4 bg-muted/10 rounded-2xl border border-dashed">
                  <div className="space-y-0.5">
                    <Label className="text-[11px] font-black uppercase">{setT.captcha.auth_switch}</Label>
                  </div>
                  <Switch checked={formData.cap_auth} onCheckedChange={(v) => setFormData(p => ({...p, cap_auth: v}))} />
                </div>
                <div className="flex items-center justify-between p-4 bg-muted/10 rounded-2xl border border-dashed">
                  <div className="space-y-0.5">
                    <Label className="text-[11px] font-black uppercase">{setT.captcha.checkout_switch}</Label>
                  </div>
                  <Switch checked={formData.cap_checkout} onCheckedChange={(v) => setFormData(p => ({...p, cap_checkout: v}))} />
                </div>
              </div>
            </div>

            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-3">
              <Info className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[10px] text-amber-800 leading-relaxed font-bold">
                這套開關決定了在使用者點擊提交按鈕前，是否需要先通過背景 AI 評分。建議平時僅開啟聯絡表單驗證，若遇攻擊再逐步啟動註冊與結帳保護。
              </p>
            </div>
          </CardContent>
        </Card>

        {/* AI 服務診斷 */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <Card className="md:col-span-8 border-none shadow-sm bg-white rounded-[2rem] overflow-hidden border-t-8 border-primary">
            <CardHeader className="bg-primary/5 border-b p-8">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-3 text-primary">
                  <Bot className="h-5 w-5" />
                  Gemini AI 服務狀態與診斷
                </CardTitle>
                {aiDiagData && (
                  <Badge className={cn(
                    "border-none font-black text-[10px] px-3 h-6 shadow-sm",
                    aiDiagData.status === 'Healthy' ? "bg-green-500 text-white" : "bg-red-500 text-white"
                  )}>
                    {aiDiagData.status.toUpperCase()}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 bg-muted/20 rounded-2xl text-center space-y-1">
                  <p className="text-[9px] font-black uppercase text-muted-foreground">Uptime</p>
                  <p className="text-lg font-black text-slate-800">{aiDiagData?.uptime || "0"}s</p>
                </div>
                <div className="p-4 bg-muted/20 rounded-2xl text-center space-y-1">
                  <p className="text-[9px] font-black uppercase text-muted-foreground">RSS Mem</p>
                  <p className="text-lg font-black text-slate-800">{aiDiagData?.memory?.rss || "0"}MB</p>
                </div>
                <div className="p-4 bg-muted/20 rounded-2xl text-center space-y-1">
                  <p className="text-[9px] font-black uppercase text-muted-foreground">Heap Used</p>
                  <p className="text-lg font-black text-slate-800">{aiDiagData?.memory?.heapUsed || "0"}MB</p>
                </div>
                <div className="p-4 bg-muted/20 rounded-2xl text-center space-y-1">
                  <p className="text-[9px] font-black uppercase text-muted-foreground">Ping</p>
                  <p className={cn("text-lg font-black", aiDiagData?.ping === 'OK' ? "text-green-600" : "text-red-500")}>{aiDiagData?.ping || "--"}</p>
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">AI API Key 設定</Label>
                <div className="flex gap-2">
                  <Input 
                    type="password"
                    placeholder="在此填寫 Gemini API Key"
                    value={formData.geminiApiKey}
                    onChange={(e) => setFormData(p => ({...p, geminiApiKey: e.target.value}))}
                    className="h-12 bg-muted/20 border-none rounded-xl font-mono text-sm"
                  />
                  <Button 
                    variant="outline" 
                    className="h-12 px-6 rounded-xl font-black border-primary/20 text-primary"
                    onClick={handleTestKey}
                    disabled={testLoading || !formData.geminiApiKey}
                  >
                    {testLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "測試連線"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-4 border-none shadow-sm bg-slate-900 text-white rounded-[2rem] overflow-hidden">
            <CardHeader className="bg-white/5 border-b py-5 px-6">
               <CardTitle className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                 <Cpu className="h-4 w-4" /> 容器環境 (Revision)
               </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
               <div className="space-y-1">
                 <p className="text-[9px] font-black text-slate-500 uppercase">GCP Revision ID</p>
                 <p className="text-xs font-mono font-bold break-all text-primary">{aiDiagData?.revision || "N/A"}</p>
               </div>
               <Separator className="bg-white/10" />
               <div className="space-y-1">
                 <p className="text-[9px] font-black text-slate-500 uppercase">Node.js Version</p>
                 <p className="text-xs font-mono font-bold">{aiDiagData?.version || "N/A"}</p>
               </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
