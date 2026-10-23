
"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  CreditCard, 
  Save, 
  Loader2, 
  Zap, 
  Bug,
  Smartphone,
  Wallet,
  QrCode,
  Building2,
  Landmark,
  CheckCircle2,
  AlertTriangle,
  Info,
  ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n/i18n-context";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useDoc } from "@/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { initiatePaymentAction } from "@/app/actions/payment-actions";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

export default function PaymentSettings() {
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const db = useFirestore();
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const configRef = useMemo(() => {
    if (!db) return null;
    return doc(db, 'config', 'payment');
  }, [db]);
  const { data: configData, loading: configLoading } = useDoc<any>(configRef);

  const [formData, setFormData] = useState({
    yedpayApiKey: "",
    yedpaySignKey: "",
    yedpayStoreId: "",
    yedpayDomainId: "",
    yedpayEnvironment: "production",
    yedpayAuthType: "api_key",
    fpsId: "161931316",
    bankName: "匯豐銀行 HSBC (004)",
    bankAccountNo: "747-157782-838",
    bankAccountName: "BS Concept Limited",
    paymeQrUrl: "/payme-qr.png",
    octopusQrUrl: "/octopus-qr.png",
    paymeBusinessId: ""
  });

  useEffect(() => {
    if (configData) {
      setFormData(prev => ({ 
        ...prev, 
        ...configData,
        yedpayAuthType: configData.yedpayAuthType || "api_key",
        yedpayEnvironment: configData.yedpayEnvironment || "production"
      }));
    }
  }, [configData]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!db || !configRef) return;
    setLoading(true);
    setDoc(configRef, {
      ...formData,
      updatedAt: serverTimestamp()
    }, { merge: true })
      .then(() => {
        toast({ title: t.common.success, description: "支付設定已儲存。" });
      })
      .catch((error) => {
        toast({ title: "儲存失敗", description: error.message, variant: "destructive" });
      })
      .finally(() => setLoading(false));
  };

  /**
   * 整合測試：使用目前的輸入值進行即時驗證
   */
  const runIntegrationTest = async () => {
    setTestLoading(true);
    setTestResult(null);
    try {
      const resultData = await initiatePaymentAction({
        orderId: `TEST-${Date.now()}`,
        amount: 1.0,
        paymentData: { method: 'visa' },
        testConfig: {
          apiKey: formData.yedpayApiKey,
          storeId: formData.yedpayStoreId,
          environment: formData.yedpayEnvironment
        }
      });
      
      setTestResult(resultData);
      
      if (resultData.success) {
        toast({ 
          title: "連線成功", 
          description: "Yedpay 網關回應正常，金鑰有效。" 
        });
      } else {
        toast({ 
          title: "連線失敗", 
          description: resultData.message || "請檢查 API 金鑰及 Store ID 設定。", 
          variant: "destructive" 
        });
      }
    } catch (error: any) {
      setTestResult({ success: false, message: error.message });
      toast({ title: "測試異常", description: error.message, variant: "destructive" });
    } finally {
      setTestLoading(false);
    }
  };

  if (configLoading) {
    return <div className="h-96 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-20">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 px-2">
        <h2 className="text-xl font-black font-headline uppercase flex items-center gap-3">
          <Zap className="h-6 w-6 text-primary" />
          收款與網關管理
        </h2>
        <div className="flex gap-3 w-full sm:w-auto">
          <Button 
            variant="outline" 
            className="flex-1 sm:flex-none rounded-xl h-11 px-6 font-bold gap-2 border-primary text-primary bg-white shadow-sm"
            onClick={runIntegrationTest}
            disabled={testLoading || !formData.yedpayApiKey || !formData.yedpayStoreId}
          >
            {testLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bug className="h-4 w-4" />}
            測試即時連線
          </Button>
          <Button className="flex-1 sm:flex-none bg-primary text-primary-foreground font-black rounded-xl h-11 px-8 shadow-lg" onClick={handleSave} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} 
            儲存所有配置
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden border-l-4 border-primary">
          <CardHeader className="bg-primary/5 border-b p-8">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-3">
                <CreditCard className="h-5 w-5 text-primary" />
                Yedpay 線上支付 (自動化)
              </CardTitle>
              <Badge className={cn(
                "font-black text-[10px] border-none shadow-sm",
                testResult?.success ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"
              )}>
                {testResult?.success ? "CONNECTED" : "NOT TESTED"}
              </Badge>
            </div>
            <CardDescription>用於處理 Visa, Master, 支付寶, 微信之線上即時付款。</CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="grid gap-2">
              <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">API Key / Token</Label>
              <Input 
                value={formData.yedpayApiKey} 
                onChange={(e) => handleInputChange("yedpayApiKey", e.target.value)} 
                type="password" 
                className="h-11 bg-muted/20 border-none rounded-xl font-mono text-sm focus-visible:ring-primary/30" 
                placeholder="在此填寫 API 金鑰..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Store ID</Label>
                <Input value={formData.yedpayStoreId} onChange={(e) => handleInputChange("yedpayStoreId", e.target.value)} className="h-11 bg-muted/20 border-none rounded-xl font-black text-primary" placeholder="例如: 100xxx" />
              </div>
              <div className="grid gap-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">環境 (Environment)</Label>
                <Select value={formData.yedpayEnvironment} onValueChange={(v) => handleInputChange("yedpayEnvironment", v)}>
                  <SelectTrigger className="h-11 bg-muted/20 border-none rounded-xl font-bold"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl border-none shadow-2xl">
                    <SelectItem value="production">正式 (Production)</SelectItem>
                    <SelectItem value="sandbox">測試 (Sandbox)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {testResult && (
              <div className={cn(
                "p-4 rounded-2xl border flex items-start gap-3 animate-in slide-in-from-top-2",
                testResult.success ? "bg-green-50 border-green-100 text-green-800" : "bg-red-50 border-red-100 text-red-800"
              )}>
                {testResult.success ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <AlertTriangle className="h-5 w-5 shrink-0" />}
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest">{testResult.success ? "Connection Verified" : "Verification Failed"}</p>
                  <p className="text-xs leading-relaxed font-medium">{testResult.message || "與 Yedpay 網關連線正常。"}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden border-l-4 border-blue-600">
          <CardHeader className="bg-blue-50 border-b p-8">
            <CardTitle className="text-lg flex items-center gap-3">
              <Smartphone className="h-5 w-5 text-blue-600" />
              手動支付配置 (線上 & POS 共用)
            </CardTitle>
            <CardDescription>配置 FPS, 銀行轉帳, PayMe 及八達通之收款資訊。</CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="grid gap-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">轉數快 (FPS ID)</Label>
                <Input value={formData.fpsId} onChange={(e) => handleInputChange("fpsId", e.target.value)} className="h-11 bg-muted/20 border-none rounded-xl font-bold" />
              </div>
              <div className="grid gap-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">銀行名稱</Label>
                <Input value={formData.bankName} onChange={(e) => handleInputChange("bankName", e.target.value)} className="h-11 bg-muted/20 border-none rounded-xl" />
              </div>
              <div className="grid gap-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">帳戶號碼</Label>
                <Input value={formData.bankAccountNo} onChange={(e) => handleInputChange("bankAccountNo", e.target.value)} className="h-11 bg-muted/20 border-none rounded-xl font-mono" />
              </div>
              <div className="grid gap-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">開戶人姓名</Label>
                <Input value={formData.bankAccountName} onChange={(e) => handleInputChange("bankAccountName", e.target.value)} className="h-11 bg-muted/20 border-none rounded-xl font-bold" />
              </div>
            </div>
            <Separator className="border-dashed" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="grid gap-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">PayMe Business QR 網址</Label>
                <Input value={formData.paymeQrUrl} onChange={(e) => handleInputChange("paymeQrUrl", e.target.value)} className="h-11 bg-muted/20 border-none rounded-xl text-[10px]" />
              </div>
              <div className="grid gap-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">八達通 QR 網址</Label>
                <Input value={formData.octopusQrUrl} onChange={(e) => handleInputChange("octopusQrUrl", e.target.value)} className="h-11 bg-muted/20 border-none rounded-xl text-[10px]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="p-6 bg-blue-50 rounded-[2rem] border border-blue-100 flex items-start gap-4 shadow-sm">
        <Info className="h-6 w-6 text-blue-600 shrink-0 mt-1" />
        <div className="space-y-1">
          <p className="font-black text-sm text-blue-900 uppercase">設定說明</p>
          <p className="text-xs text-blue-800 leading-relaxed font-medium">
            您的支付資訊將透過第三方專業的加密技術處理。我們不會儲存您的完整信用卡資料，以最大程度確保交易安全。
          </p>
        </div>
      </div>
    </div>
  );
}
