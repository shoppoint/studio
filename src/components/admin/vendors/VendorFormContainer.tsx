"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  Store, 
  User, 
  Mail, 
  Phone, 
  Save, 
  Loader2, 
  Image as ImageIcon,
  Upload,
  Landmark,
  Building2,
  Percent,
  Link as LinkIcon,
  Trash2,
  Plus,
  ArrowLeft,
  Info,
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertTriangle
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useStorage, useFirestore } from "@/firebase";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { doc, updateDoc, addDoc, serverTimestamp, collection, query, where, getDocs, limit } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { compressImage } from "@/lib/image-utils";
import { cn } from "@/lib/utils";

interface VendorFormContainerProps {
  mode: 'new' | 'edit';
  vendorId?: string;
  initialData?: any;
}

export function VendorFormContainer({ mode, vendorId, initialData }: VendorFormContainerProps) {
  const router = useRouter();
  const { toast } = useToast();
  const storage = useStorage();
  const db = useFirestore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [resolvingUser, setResolvingUser] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeLangTab, setActiveLangTab] = useState("zh");
  const [formData, setFormData] = useState<any>(null);

  // 用於顯示目前連結狀態的額外 state
  const [linkedEmail, setLinkedEmail] = useState("");

  useEffect(() => {
    if (initialData && !formData) {
      setFormData({
        ...initialData,
        description: initialData.description || { en: "", zh: "" },
        allowedLocationIds: Array.isArray(initialData.allowedLocationIds) ? initialData.allowedLocationIds : []
      });
      // 如果已經有連結 UID，嘗試反查 Email（這裡簡化處理，先以商家電郵或手動輸入為主）
      setLinkedEmail(initialData.email || "");
    } else if (mode === 'new' && !formData) {
      setFormData({
        name: "",
        owner: "",
        email: "",
        phone: "",
        status: "Active",
        logoUrl: "",
        description: { en: "", zh: "" },
        commission: "10",
        payoutCycle: "monthly",
        brNumber: "",
        bankName: "",
        bankAccountNo: "",
        bankAccountName: "",
        websiteUrl: "",
        allowedLocationIds: [],
        linkedUserId: ""
      });
    }
  }, [initialData, formData, mode]);

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleMultilingualChange = (langKey: 'en' | 'zh', value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      description: { ...prev.description, [langKey]: value }
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !storage) return;

    setLoading(true);
    try {
      const compressedBlob = await compressImage(file, 400, 0.85);
      const fileName = `vendors/logo_${Date.now()}.webp`;
      const storageRef = ref(storage, fileName);
      const uploadTask = uploadBytesResumable(storageRef, compressedBlob, { contentType: 'image/webp' });

      uploadTask.on('state_changed', 
        (snapshot) => setUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
        null,
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          handleInputChange("logoUrl", downloadURL);
          setUploadProgress(0); setLoading(false);
          toast({ title: "Logo 已上傳" });
        }
      );
    } catch (e) { setLoading(false); }
  };

  const handleSave = async () => {
    if (!formData.name || !db) {
      toast({ title: "請輸入商店名稱", variant: "destructive" });
      return;
    }
    
    setLoading(true);
    let finalLinkedUid = formData.linkedUserId;

    // 核心邏輯：如果輸入了連結電郵但沒有 UID，執行自動解析
    if (!finalLinkedUid && linkedEmail.trim()) {
      setResolvingUser(true);
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', linkedEmail.trim().toLowerCase()), limit(1));
        const snap = await getDocs(q);
        
        if (!snap.empty) {
          finalLinkedUid = snap.docs[0].id;
          toast({ title: "帳號連結成功", description: `已自動識別 UID: ${finalLinkedUid}` });
        } else {
          toast({ 
            title: "無法解析帳號", 
            description: "在系統中找不到此電郵對應的使用者，請確認對方是否已註冊。", 
            variant: "destructive" 
          });
          setLoading(false);
          setResolvingUser(false);
          return;
        }
      } catch (e) {
        console.error("User resolution error", e);
      } finally {
        setResolvingUser(false);
      }
    }

    const dataToSave = { 
      ...formData, 
      linkedUserId: finalLinkedUid,
      commission: Number(formData.commission) || 0,
      updatedAt: serverTimestamp() 
    };

    try {
      if (mode === 'new') {
        dataToSave.createdAt = serverTimestamp();
        await addDoc(collection(db, 'vendors'), dataToSave);
        toast({ title: "商店檔案已建立" });
      } else {
        await updateDoc(doc(db, 'vendors', vendorId!), dataToSave);
        toast({ title: "商店資料已更新" });
      }
      router.push("/admin/vendors");
    } catch (e: any) {
      toast({ title: "儲存失敗", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (!formData) return <div className="h-96 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      <div className="lg:col-span-8 space-y-8">
        <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
          <CardHeader className="bg-muted/10 border-b py-5 px-8">
            <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-3 text-primary">
              <Store className="h-5 w-5" /> 商家基本資料
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            <div className="grid gap-6">
              <div className="grid gap-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">商店顯示名稱 (Store Name)</Label>
                <Input value={formData.name} onChange={e => handleInputChange('name', e.target.value)} className="h-12 bg-muted/20 border-none rounded-xl text-lg font-black" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="grid gap-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">負責人</Label>
                  <Input value={formData.owner} onChange={e => handleInputChange('owner', e.target.value)} className="h-11 bg-muted/20 border-none rounded-xl" />
                </div>
                <div className="grid gap-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">聯絡電話</Label>
                  <Input value={formData.phone} onChange={e => handleInputChange('phone', e.target.value)} className="h-11 bg-muted/20 border-none rounded-xl font-bold" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">商務電郵 (Email)</Label>
                <Input value={formData.email} onChange={e => handleInputChange('email', e.target.value)} className="h-11 bg-muted/20 border-none rounded-xl font-mono" />
              </div>
            </div>

            <Separator className="border-dashed" />

            <div className="space-y-4">
              <Tabs value={activeLangTab} onValueChange={setActiveLangTab}>
                <div className="flex items-center justify-between mb-4">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">商店簡介 (多語言內容)</Label>
                  <TabsList className="bg-muted/50 h-9 p-1 rounded-xl">
                    <TabsTrigger value="en" className="rounded-lg px-6 text-xs font-bold">EN</TabsTrigger>
                    <TabsTrigger value="zh" className="rounded-lg px-6 text-xs font-bold">中文</TabsTrigger>
                  </TabsList>
                </div>
                {['en', 'zh'].map((langKey) => (
                  <TabsContent key={langKey} value={langKey} className="animate-in fade-in duration-300">
                    <Textarea 
                      className="h-32 bg-muted/20 border-none leading-relaxed rounded-2xl p-4 text-sm"
                      placeholder="向顧客介紹該品牌理念..."
                      value={formData.description[langKey as 'en' | 'zh']}
                      onChange={(e) => handleMultilingualChange(langKey as 'en' | 'zh', e.target.value)}
                    />
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white rounded-[2.5rem] overflow-hidden border-l-4 border-indigo-600">
          <CardHeader className="bg-indigo-50/50 border-b py-5 px-8">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-indigo-700 flex items-center gap-3">
              <Landmark className="h-5 w-5" /> 收款帳戶設定
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="grid gap-2"><Label className="text-[10px] font-black uppercase opacity-60">銀行名稱</Label><Input value={formData.bankName} onChange={e => handleInputChange('bankName', e.target.value)} className="h-11 bg-muted/20 border-none rounded-xl font-bold" /></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="grid gap-2"><Label className="text-[10px] font-black uppercase opacity-60">帳戶號碼</Label><Input value={formData.bankAccountNo} onChange={e => handleInputChange('bankAccountNo', e.target.value)} className="h-11 bg-muted/20 border-none rounded-xl font-mono" /></div>
              <div className="grid gap-2"><Label className="text-[10px] font-black uppercase opacity-60">開戶人姓名</Label><Input value={formData.bankAccountName} onChange={e => handleInputChange('bankAccountName', e.target.value)} className="h-11 bg-muted/20 border-none rounded-xl font-bold" /></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-4 space-y-6">
        <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
          <CardHeader className="bg-muted/10 pb-4">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">商店 Logo</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div 
              className="h-40 w-full rounded-2xl border-2 border-dashed bg-muted/20 flex items-center justify-center cursor-pointer group relative overflow-hidden transition-all hover:bg-muted/30"
              onClick={() => fileInputRef.current?.click()}
            >
              {formData.logoUrl ? <img src={formData.logoUrl} className="h-full w-full object-contain p-6" /> : <ImageIcon className="h-10 w-10 text-muted-foreground/30" />}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><Button variant="secondary" size="sm" className="font-bold rounded-xl shadow-lg">更換圖片</Button></div>
            </div>
            {uploadProgress > 0 && <Progress value={uploadProgress} className="h-1 mt-4" />}
            <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" />
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white rounded-3xl bg-slate-900 text-white overflow-hidden border-l-4 border-primary">
          <CardHeader className="bg-white/5 border-b py-5 px-6">
            <CardTitle className="text-[11px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
              <LinkIcon className="h-3.5 w-3.5" /> 連結使用者帳號
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid gap-2">
              <Label className="text-[9px] font-black uppercase text-slate-400 ml-1">連結電郵 (Recommended)</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-500" />
                <Input 
                  value={linkedEmail} 
                  onChange={e => setLinkedEmail(e.target.value)} 
                  className="h-10 bg-white/10 border-none rounded-xl text-white font-bold text-xs pl-9" 
                  placeholder="輸入商家登入電郵..."
                />
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/10" /></div>
              <div className="relative flex justify-center text-[9px] uppercase"><span className="bg-slate-900 px-2 text-slate-500">或直接輸入 UID</span></div>
            </div>

            <div className="grid gap-2">
              <Label className="text-[9px] font-black uppercase text-slate-400 ml-1">連結 UID (Manual)</Label>
              <Input 
                value={formData.linkedUserId || ""} 
                onChange={e => handleInputChange('linkedUserId', e.target.value)} 
                className="h-10 bg-white/10 border-none rounded-xl text-white font-mono text-[9px]" 
                placeholder="在此手動填入 User UID"
              />
            </div>

            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex items-start gap-3">
              <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <p className="text-[10px] text-slate-400 leading-relaxed font-medium">
                填入電郵後，系統會在儲存時自動識別其 UID。若兩者皆填寫，將以 <b>UID</b> 為準。連結後該用戶方可進入「合作商店中心」。
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden border-l-4 border-primary">
          <CardHeader className="bg-primary/5 border-b py-4 px-6"><CardTitle className="text-xs font-black uppercase tracking-widest">系統合規設定</CardTitle></CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid gap-2">
              <Label className="text-[10px] font-black uppercase opacity-60">商家狀態</Label>
              <Select value={formData.status} onValueChange={v => handleInputChange('status', v)}>
                <SelectTrigger className="h-11 bg-muted/20 border-none rounded-xl font-bold"><SelectValue /></SelectTrigger>
                <SelectContent className="rounded-xl"><SelectItem value="Active">Active (啟用中)</SelectItem><SelectItem value="Pending">Pending (審核中)</SelectItem><SelectItem value="Suspended">Suspended (停權)</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label className="text-[10px] font-black uppercase opacity-60">平台佣金比例 (%)</Label>
              <div className="relative">
                <Percent className="absolute left-3 top-3 h-4 w-4 opacity-30" />
                <Input type="number" value={formData.commission} onChange={e => handleInputChange('commission', e.target.value)} className="pl-10 h-11 bg-primary/5 border-none rounded-xl font-black text-primary text-xl" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label className="text-[10px] font-black uppercase opacity-60">商業登記 (BR) 編號</Label>
              <Input value={formData.brNumber} onChange={e => handleInputChange('brNumber', e.target.value)} className="h-11 bg-muted/20 border-none rounded-xl font-mono font-bold" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="col-span-full pt-8 border-t border-dashed flex justify-end">
        <Button className="bg-primary text-primary-foreground font-black shadow-lg rounded-2xl h-14 px-12 text-lg gap-2 hover:scale-105 transition-transform" onClick={handleSave} disabled={loading || resolvingUser}>
          {loading || resolvingUser ? <Loader2 className="animate-spin h-6 w-6" /> : <Save className="h-6 w-6" />}
          確認並儲存商店檔案
        </Button>
      </div>
    </div>
  );
}
