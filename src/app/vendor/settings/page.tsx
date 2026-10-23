
"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { 
  Save, 
  Loader2, 
  Store, 
  Mail, 
  Phone, 
  Image as ImageIcon,
  Upload,
  Landmark,
  Building2,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n/i18n-context";
import { useToast } from "@/hooks/use-toast";
import { useStorage, useUser, useFirestore, useDoc, useCollection } from "@/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { doc, updateDoc, serverTimestamp, query, collection, where, limit } from "firebase/firestore";
import { Progress } from "@/components/ui/progress";
import { compressImage } from "@/lib/image-utils";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export default function VendorSettings() {
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const storage = useStorage();
  const db = useFirestore();
  const { user } = useUser();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeTab, setActiveTab] = useState("zh");

  // 1. 查找賣家商店 ID - Guarded
  const vendorQuery = useMemo(() => (user && db) ? query(
    collection(db, 'vendors'), 
    where('linkedUserId', '==', user.uid),
    limit(1)
  ) : null, [db, user]);
  const { data: vendorList, loading: vendorLoading } = useCollection<any>(vendorQuery);
  const vendorId = vendorList?.[0]?.id;

  // 2. 獲取商店資料 - Guarded
  const vendorRef = useMemo(() => (vendorId && db) ? doc(db, 'vendors', vendorId) : null, [db, vendorId]);
  const { data: vendorData, loading: dataLoading } = useDoc<any>(vendorRef);

  const [formData, setFormData] = useState<any>(null);

  useEffect(() => {
    if (vendorData) {
      setFormData({
        ...vendorData,
        name: vendorData.name || "",
        email: vendorData.email || "",
        phone: vendorData.phone || "",
        logoUrl: vendorData.logoUrl || "",
        description: vendorData.description || { en: "", zh: "" },
        bankName: vendorData.bankName || "",
        bankAccountNo: vendorData.bankAccountNo || "",
        bankAccountName: vendorData.bankAccountName || "",
        brNumber: vendorData.brNumber || ""
      });
    }
  }, [vendorData]);

  const handleMultilingualChange = (langKey: 'en' | 'zh', value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      description: { ...prev.description, [langKey]: value }
    }));
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!vendorId || !storage) return;
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const compressedBlob = await compressImage(file, 400, 0.85);
      const fileName = `vendors/${vendorId}/logo_${Date.now()}.webp`;
      const storageRef = ref(storage, fileName);
      const uploadTask = uploadBytesResumable(storageRef, compressedBlob, { contentType: 'image/webp' });

      uploadTask.on('state_changed', 
        (snapshot) => setUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
        (error) => { toast({ title: "上傳錯誤", description: error.message, variant: "destructive" }); setLoading(false); },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          handleInputChange("logoUrl", downloadURL);
          setUploadProgress(0);
          setLoading(false);
          toast({ title: t.common.success, description: "商店 Logo 已更新。" });
        }
      );
    } catch (error: any) {
      toast({ title: "處理錯誤", description: error.message, variant: "destructive" });
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData || !vendorRef) return;
    setLoading(true);
    try {
      await updateDoc(vendorRef, {
        ...formData,
        updatedAt: serverTimestamp()
      });
      toast({ title: t.common.success, description: "商店設定已成功儲存。" });
    } catch (e) {
      toast({ title: t.common.error, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (vendorLoading || dataLoading || !formData) {
    return <div className="h-96 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black font-headline tracking-tight">商店設定</h1>
          <p className="text-muted-foreground">管理商店公開檔案、收款帳戶及商業合規資料。</p>
        </div>
        <Button className="bg-primary text-primary-foreground shadow-lg h-11 px-8 font-black rounded-xl" onClick={handleSave} disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          儲存所有變更
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
            <CardHeader className="border-b bg-muted/10 pb-4 px-8">
              <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <Store className="h-4 w-4 text-primary" />
                商店公開資料
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="grid gap-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">商店名稱 (Store Name)</Label>
                <Input 
                  value={formData.name} 
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  className="bg-muted/20 border-none h-12 text-lg font-black rounded-xl shadow-inner"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="grid gap-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">聯絡電郵</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                    <Input className="pl-10 h-11 bg-muted/20 border-none rounded-xl font-bold" value={formData.email} onChange={(e) => handleInputChange("email", e.target.value)} />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">聯絡電話</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                    <Input className="pl-10 h-11 bg-muted/20 border-none rounded-xl font-bold" value={formData.phone} onChange={(e) => handleInputChange("phone", e.target.value)} />
                  </div>
                </div>
              </div>

              <Separator className="border-dashed" />

              <div className="space-y-4">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <div className="flex items-center justify-between mb-4">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">商店簡介 (多語言內容)</Label>
                    <TabsList className="bg-muted/50 h-9 p-1 rounded-xl">
                      <TabsTrigger value="en" className="rounded-lg px-6 text-xs font-bold">EN</TabsTrigger>
                      <TabsTrigger value="zh" className="rounded-lg px-6 text-xs font-bold">中文</TabsTrigger>
                    </TabsList>
                  </div>
                  {['en', 'zh'].map((langKey) => (
                    <TabsContent key={langKey} value={langKey}>
                      <Textarea 
                        className="h-32 bg-muted/20 border-none leading-relaxed rounded-2xl p-4 text-sm"
                        placeholder="向顧客介紹您的品牌理念..."
                        value={formData.description[langKey as 'en' | 'zh']}
                        onChange={(e) => handleMultilingualChange(langKey as 'en' | 'zh', e.target.value)}
                      />
                    </TabsContent>
                  ))}
                </Tabs>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm border-l-4 border-primary rounded-3xl bg-white overflow-hidden">
            <CardHeader className="border-b bg-primary/5 pb-4 px-8">
              <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-primary">
                <Landmark className="h-4 w-4" />
                結算帳戶資料
              </CardTitle>
              <CardDescription>此資料僅供平台自動轉帳銷售款項之用。</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid gap-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">銀行名稱 (Bank Name)</Label>
                <Input value={formData.bankName} onChange={(e) => handleInputChange("bankName", e.target.value)} className="bg-muted/20 border-none h-11 rounded-xl font-bold" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="grid gap-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">帳戶號碼 (Account No.)</Label>
                  <Input value={formData.bankAccountNo} onChange={(e) => handleInputChange("bankAccountNo", e.target.value)} className="bg-muted/20 border-none h-11 rounded-xl font-mono" />
                </div>
                <div className="grid gap-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">開戶姓名 (Holder Name)</Label>
                  <Input value={formData.bankAccountName} onChange={(e) => handleInputChange("bankAccountName", e.target.value)} className="bg-muted/20 border-none h-11 rounded-xl font-bold" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-4 space-y-6">
          <Card className="border-none shadow-sm overflow-hidden rounded-[2rem] bg-white">
            <CardHeader className="bg-muted/10 pb-4"><CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">商店標誌</CardTitle></CardHeader>
            <CardContent className="p-8 space-y-4">
              <div 
                className="h-48 w-full rounded-[2rem] border-2 border-dashed bg-muted/20 flex items-center justify-center cursor-pointer group relative overflow-hidden transition-all hover:bg-muted/30"
                onClick={() => fileInputRef.current?.click()}
              >
                {formData.logoUrl ? <img src={formData.logoUrl} className="h-full w-full object-contain p-6" /> : <ImageIcon className="h-10 w-10 text-muted-foreground/30" />}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><Button variant="secondary" size="sm" className="font-bold rounded-xl shadow-lg"><Upload className="mr-2 h-4 w-4" /> 更換圖片</Button></div>
              </div>
              {uploadProgress > 0 && <Progress value={uploadProgress} className="h-1.5" />}
              <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" />
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden border-l-4 border-indigo-500">
            <CardHeader className="bg-indigo-50/50 pb-4 px-6"><CardTitle className="text-xs font-black uppercase tracking-widest text-indigo-700 flex items-center gap-2"><Building2 className="h-4 w-4" /> 商業合規資料</CardTitle></CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid gap-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">商業登記證 (BR) 編號</Label>
                <Input value={formData.brNumber} onChange={(e) => handleInputChange("brNumber", e.target.value)} className="h-11 bg-muted/20 border-none rounded-xl font-mono text-indigo-900 font-bold" />
              </div>
              <Separator className="border-dashed" />
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase text-muted-foreground">認證狀態</p>
                <Badge className={cn("h-7 px-3 rounded-lg border-none font-black text-[10px] uppercase shadow-sm", formData.status === 'Active' ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700")}>
                  <CheckCircle2 className="h-3 w-3 mr-1.5" /> 官方認證賣家
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
