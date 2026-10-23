"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  LineChart, 
  Save, 
  Loader2, 
  Share2, 
  ShoppingCart, 
  ShoppingBag,
  Globe, 
  Zap, 
  Copy, 
  ExternalLink,
  CheckCircle2,
  ListChecks,
  ShieldCheck,
  AlertTriangle,
  Info,
  Eye,
  Table as TableIcon,
  RefreshCcw,
  Search,
  Barcode,
  Award,
  Box,
  BarChart3,
  Target,
  SearchCode,
  ShieldAlert,
  Lock,
  Tag,
  Warehouse,
  Package
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from "@/components/ui/dialog";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useI18n } from "@/lib/i18n/i18n-context";
import { useToast } from "@/hooks/use-toast";
import { useFirestore, useDoc } from "@/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { getFeedPreviewAction } from "@/app/actions/marketing-actions";

export default function MarketingSettings() {
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const db = useFirestore();
  const [loading, setLoading] = useState(false);

  // 預覽相關狀態
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [previewSearch, setPreviewSearch] = useState("");

  const productionDomain = "https://shoppoint.hk";

  const configRef = useMemo(() => {
    if (!db) return null;
    return doc(db, 'config', 'marketing');
  }, [db]);
  const { data: configData, loading: configLoading } = useDoc<any>(configRef);

  const [formData, setFormData] = useState({
    socialLinks: {
      facebook: "https://facebook.com/shoppoint.hk",
      instagram: "https://instagram.com/shoppoint.hk",
      youtube: "https://youtube.com/@shoppoint_hk",
      threads: "https://threads.net/@shoppoint.hk",
      x: "https://x.com/shoppointH",
      linktree: "https://linktr.ee/shoppoint.hk",
      googleBusiness: "https://share.google/Fyh1N4S2P6dvPYG2z",
      whatsapp: "+852 5325 2555"
    },
    gaId: "G-Y2DJLPLS3K",
    fbPixelId: "520412129153804", 
    metaVerificationCode: "", 
    fbPixelId_alt: "",
    googleMerchantId: "",
    googleSearchConsoleId: "",
    bingWebmasterId: "",
    promoModalEnabled: true,
    promoModalImageUrl: "https://picsum.photos/seed/promo-pop/1200/1600",
    promoModalLink: "/deals",
    promoModalVersion: "v1"
  });

  useEffect(() => {
    if (configData) {
      setFormData(prev => ({
        ...prev,
        ...configData,
        socialLinks: { ...prev.socialLinks, ...(configData.socialLinks || {}) }
      }));
    }
  }, [configData]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!db || !configRef) return;
    setLoading(true);
    try {
      await setDoc(configRef, {
        ...formData,
        updatedAt: serverTimestamp()
      }, { merge: true });
      toast({ title: t.common.success, description: "Marketing configuration saved." });
    } catch (e) {
      toast({ title: t.common.error, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleFetchPreview = async () => {
    setPreviewLoading(true);
    setIsPreviewOpen(true);
    try {
      const res = await getFeedPreviewAction();
      if (res.success) {
        setPreviewData(res.data || []);
      } else {
        toast({ title: "獲取預覽失敗", description: res.message, variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "連線錯誤", variant: "destructive" });
    } finally {
      setPreviewLoading(false);
    }
  };

  const filteredPreview = useMemo(() => {
    if (!previewSearch) return previewData;
    const q = previewSearch.toLowerCase().trim();
    return previewData.filter(p => 
      String(p.title || "").toLowerCase().includes(q) || 
      String(p.id || "").toLowerCase().includes(q) ||
      String(p.sku || "").toLowerCase().includes(q) ||
      String(p.brand || "").toLowerCase().includes(q) ||
      String(p.barcode || "").toLowerCase().includes(q)
    );
  }, [previewData, previewSearch]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "網址已複製", description: label });
  };

  if (configLoading) {
    return <div className="h-96 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300 pb-20">
      <div className="flex justify-end">
        <Button className="bg-primary text-primary-foreground font-black rounded-xl h-11 px-8 shadow-lg hover:scale-105 transition-transform" onClick={handleSave} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="mr-2 h-4 w-4" />} 
          儲存所有配置
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-8">
        
        {/* 1. Meta (Facebook) 整合區塊 */}
        <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden border-l-4 border-[#1877F2]">
          <CardHeader className="bg-[#1877F2]/5 border-b p-8">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-black uppercase flex items-center gap-3 text-[#1877F2]">
                <Target className="h-5 w-5" />
                Meta (Facebook) 商業整合設定
              </CardTitle>
              <Badge className="bg-[#1877F2] text-white border-none font-black text-[10px]">VERIFIED ID</Badge>
            </div>
            <CardDescription>配置 Facebook Pixel 與網域驗證，這對於 WhatsApp 商品目錄至關重要。</CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="grid gap-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Facebook 像素 / 資料集 ID (Pixel ID)</Label>
                <div className="relative">
                  <Target className="absolute left-3 top-3 h-4 w-4 text-[#1877F2]" />
                  <Input 
                    value={formData.fbPixelId} 
                    onChange={e => handleInputChange("fbPixelId", e.target.value)}
                    className="h-11 pl-10 bg-muted/20 border-none rounded-xl font-mono text-sm"
                    placeholder="例如：520412129153804"
                  />
                </div>
                <p className="text-[9px] text-[#1877F2] font-bold italic">* 請務必與 Meta 事件管理員中的「資料集編號」一致。</p>
              </div>

              <div className="grid gap-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Meta 網域驗證碼 (Meta-Tag Verification)</Label>
                <div className="relative">
                  <ShieldCheck className="absolute left-3 top-3 h-4 w-4 text-green-600" />
                  <Input 
                    value={formData.metaVerificationCode} 
                    onChange={e => handleInputChange("metaVerificationCode", e.target.value)}
                    className="h-11 pl-10 bg-muted/20 border-none rounded-xl font-mono text-[10px]"
                    placeholder='例如：facebook-domain-verification="xxxxxx"'
                  />
                </div>
                <p className="text-[9px] text-muted-foreground italic">從 Meta 企業管理設定取得之 &lt;meta&gt; 標籤內容。</p>
              </div>
            </div>

            <Alert className="bg-blue-50 border-blue-200 rounded-2xl">
              <Info className="h-5 w-5 text-blue-600" />
              <AlertTitle className="text-blue-900 font-black uppercase text-xs mb-1">WhatsApp 商品目錄顯示提示</AlertTitle>
              <AlertDescription className="text-blue-800 text-xs leading-relaxed">
                若要 WhatsApp 正常顯示產品：1. Pixel ID 必須正確。 2. 必須完成「網域驗證」。 3. 下方的 Feed CSV 網址必須在 Commerce Manager 中設定為「排程擷取」。
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* 2. Analytics & Tracking Section */}
        <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden border-l-4 border-indigo-600">
          <CardHeader className="bg-indigo-50/50 border-b p-8">
            <CardTitle className="text-sm font-black uppercase flex items-center gap-3 text-indigo-700">
              <BarChart3 className="h-5 w-5" />
              Google 數據分析與追蹤 (Analytics)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="grid gap-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Google Analytics (GA4) ID</Label>
                <div className="relative">
                  <BarChart3 className="absolute left-3 top-3 h-4 w-4 text-primary" />
                  <Input 
                    value={formData.gaId} 
                    onChange={e => handleInputChange("gaId", e.target.value)}
                    className="h-11 pl-10 bg-muted/20 border-none rounded-xl font-mono text-sm"
                    placeholder="G-Y2DJLPLS3K"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Google Search Console ID</Label>
                <div className="relative">
                  <SearchCode className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                  <Input 
                    value={formData.googleSearchConsoleId} 
                    onChange={e => handleInputChange("googleSearchConsoleId", e.target.value)}
                    className="h-11 pl-10 bg-muted/20 border-none rounded-xl font-mono text-sm"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3. Feed URLs Section */}
        <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden border-l-4 border-orange-500">
          <CardHeader className="bg-orange-50/50 border-b p-8">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-black uppercase flex items-center gap-2 text-orange-700">
                <Share2 className="h-5 w-5" />
                自動化商品資料摘要 (GMC & Facebook Feed)
              </CardTitle>
              <Button variant="outline" size="sm" onClick={handleFetchPreview} className="rounded-xl h-8 border-orange-200 text-orange-700 font-bold bg-white gap-1.5">
                <Eye className="h-3.5 w-3.5" /> 預覽 Feed 數據
              </Button>
            </div>
            <CardDescription>將下方網址提交至 Google Merchant Center 或 Meta Commerce Manager 以同步目錄。</CardDescription>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            {/* Primary Product Feed */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <Package className="h-4 w-4 text-orange-600" />
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">主商品目錄資料 (Primary Feed URL)</Label>
              </div>
              <div className="bg-muted/30 p-4 rounded-xl border border-dashed font-mono text-xs break-all flex justify-between items-center group">
                <span className="text-orange-900 font-bold">{productionDomain}/api/catalog/feed.csv</span>
                <button onClick={() => copyToClipboard(`${productionDomain}/api/catalog/feed.csv`, "主商品目錄連結")} className="text-primary hover:scale-110 transition-transform p-2 bg-white rounded-lg shadow-sm">
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Local Inventory Feed */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <Warehouse className="h-4 w-4 text-indigo-600" />
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">在地庫存摘要 (Local Inventory Feed)</Label>
              </div>
              <div className="bg-muted/30 p-4 rounded-xl border border-dashed font-mono text-xs break-all flex justify-between items-center group">
                <span className="text-indigo-900 font-bold">{productionDomain}/api/catalog/local-inventory.csv</span>
                <button onClick={() => copyToClipboard(`${productionDomain}/api/catalog/local-inventory.csv`, "在地庫存連結")} className="text-indigo-600 hover:scale-110 transition-transform p-2 bg-white rounded-lg shadow-sm">
                  <Copy className="h-4 w-4" />
                </button>
              </div>
              <p className="text-[9px] text-muted-foreground italic px-1">用於 Google 在地庫存廣告 (LIA)，顯示各分店的實時現貨狀況。</p>
            </div>

            {/* Promotions Feed */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <Tag className="h-4 w-4 text-red-600" />
                <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">促銷活動摘要 (Promotions Feed)</Label>
              </div>
              <div className="bg-muted/30 p-4 rounded-xl border border-dashed font-mono text-xs break-all flex justify-between items-center group">
                <span className="text-red-900 font-bold">{productionDomain}/api/catalog/promotions.csv</span>
                <button onClick={() => copyToClipboard(`${productionDomain}/api/catalog/promotions.csv`, "促銷摘要連結")} className="text-red-600 hover:scale-110 transition-transform p-2 bg-white rounded-lg shadow-sm">
                  <Copy className="h-4 w-4" />
                </button>
              </div>
              <p className="text-[9px] text-muted-foreground italic px-1">讓廣告自動顯示「買一送一」或「限時折扣」標籤。</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 數據預覽 Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="sm:max-w-[1200px] rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-8 bg-orange-600 text-white shrink-0 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12"><TableIcon className="h-32 w-32" /></div>
             <DialogTitle className="text-2xl font-black font-headline relative z-10">全通路 Feed 實時數據預覽</DialogTitle>
          </DialogHeader>
          
          <div className="p-8 bg-white space-y-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="搜尋標題、品牌、UID、SKU 或條碼..." 
                  value={previewSearch}
                  onChange={(e) => setPreviewSearch(e.target.value)}
                  className="pl-10 h-11 bg-muted/20 border-none rounded-xl"
                />
              </div>
              <Button variant="outline" onClick={handleFetchPreview} disabled={previewLoading} className="rounded-xl h-11 gap-2 font-bold bg-white">
                <RefreshCcw className={cn("h-4 w-4", previewLoading && "animate-spin")} /> 刷新數據
              </Button>
            </div>

            <ScrollArea className="h-[450px] border rounded-2xl">
              {previewLoading ? (
                <div className="h-full flex flex-col items-center justify-center gap-4 py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="text-xs font-black uppercase text-muted-foreground">正在讀取最新目錄...</p>
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-muted/5">
                    <TableRow>
                      <TableHead className="pl-6">GMC ID</TableHead>
                      <TableHead>品牌 / SKU</TableHead>
                      <TableHead>名稱 (Title)</TableHead>
                      <TableHead>售價</TableHead>
                      <TableHead className="text-center">FB 庫存</TableHead>
                      <TableHead className="pr-6">狀態</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPreview.map((p, idx) => (
                      <TableRow key={idx} className="group hover:bg-muted/30">
                        <TableCell className="pl-6 py-4 font-mono text-[10px] text-muted-foreground">{p.id}</TableCell>
                        <TableCell>
                           <div className="space-y-1">
                             <p className="text-[10px] font-black text-amber-600 uppercase">{p.brand}</p>
                             <Badge variant="outline" className="text-[8px] h-4">SKU: {p.sku}</Badge>
                           </div>
                        </TableCell>
                        <TableCell className="max-w-[200px] font-bold text-xs truncate">{p.title}</TableCell>
                        <TableCell className="font-black text-orange-600 text-xs">{p.sale_price || p.price}</TableCell>
                        <TableCell className="text-center font-black text-indigo-700">{p.fb_quantity}</TableCell>
                        <TableCell className="pr-6"><Badge variant="default" className="text-[9px] uppercase">{p.availability}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </ScrollArea>
          </div>
          <CardFooter className="bg-muted/5 p-6 border-t flex justify-end">
            <Button className="rounded-xl font-bold px-8 h-12" onClick={() => setIsPreviewOpen(false)}>關閉預覽</Button>
          </CardFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
