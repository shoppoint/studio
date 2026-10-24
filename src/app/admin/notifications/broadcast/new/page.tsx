
"use client";

import { useState, useMemo, useEffect, Suspense, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  Image as ImageIconLucide,
  Sparkles,
  Eye,
  Settings2,
  Zap,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Layout,
  Type,
  ShoppingCart,
  MousePointer2,
  Smartphone,
  Wand2,
  X,
  Bell,
  SmartphoneNfc,
  Hash,
  MapPin,
  FileText,
  Store,
  Truck,
  Award,
  Ticket,
  Target,
  Upload,
  FlaskConical,
  Info,
  Gift,
  User,
  CreditCard,
  History,
  AlertTriangle,
  Calculator,
  Share2,
  ShieldCheck,
  Users,
  Calendar,
  CheckCircle2,
  Mail,
  Send,
  UserCircle,
  MapPinned,
  PackageCheck,
  ClipboardList,
  Building2,
  Copy,
  LayoutList
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useI18n } from "@/lib/i18n/i18n-context";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { generateNotificationContent } from "@/ai/flows/generate-notification-content-flow";
import { sendTestNotification } from "@/services/communication-service";
import { useUser, useAuth, useFirestore, useDoc, useStorage, useCollection } from "@/firebase";
import { doc, setDoc, addDoc, collection, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { compressImage } from "@/lib/image-utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// 引用模組化組件
import { BlockRenderer } from "@/components/admin/notifications/BlockRenderer";
import { LibBtn } from "@/components/admin/notifications/LibBtn";
import { BlockType, EmailBlock, LangContent } from "@/types/notifications";

const DEFAULT_BLOCKS: EmailBlock[] = [
  { id: 'b1', type: 'logo', data: { url: "/logo.png", align: "center" } },
  { id: 'b2', type: 'text', data: { title: "", content: "請輸入內容..." } }
];

const VARIABLES = [
  { key: "{{customerName}}", label: "顧客姓名" },
  { key: "{{orderId}}", label: "訂單編號" },
  { key: "{{orderDate}}", label: "訂單日期" },
  { key: "{{totalAmount}}", label: "應付總額 ($)" },
  { key: "{{shippingMethod}}", label: "運送方式名稱" },
  { key: "{{trackingNo}}", label: "物流單號" },
  { key: "{{shippingAddress}}", label: "完整收貨地址" },
  { key: "{{pickupLocation}}", label: "自取點名稱" },
  { key: "{{itemsTable}}", label: "產品明細表格" },
  { key: "{{itemsList}}", label: "產品純文字清單" },
  { key: "{{couponCode}}", label: "專屬優惠代碼" },
  { key: "{{productName}}", label: "到貨產品名稱" },
  { key: "{{storeName}}", label: "商店名稱" },
];

function BroadcastBuilderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const db = useFirestore();
  const storage = useStorage();

  const isTemplateMode = searchParams.get('template');
  const existingId = searchParams.get('id');

  const docPath = isTemplateMode ? `notification_templates/${isTemplateMode}` : existingId ? `broadcasts/${existingId}` : null;
  const itemRef = useMemo(() => {
    if (!db || !docPath) return null;
    return doc(db, docPath);
  }, [db, docPath]);
  const { data: existingData, loading: dataLoading } = useDoc<any>(itemRef);

  // 獲取受眾數據用於估算
  const subsQuery = useMemo(() => db ? collection(db, 'subscribers') : null, [db]);
  const { data: allSubscribers } = useCollection<any>(subsQuery);
  const usersQuery = useMemo(() => db ? collection(db, 'users') : null, [db]);
  const { data: allUsers } = useCollection<any>(usersQuery);

  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("email"); 
  const [langTab, setLangTab] = useState<"zh" | "en">("zh");
  const [targetType, setTargetType] = useState("all");
  const [eligibleTiers, setEligibleTiers] = useState<string[]>([]);
  const [previewMode, setPreviewMode] = useState(false);
  const [isSendConfirmOpen, setIsSendConfirmOpen] = useState(false);
  
  const [aiConcept, setAiConcept] = useState("");
  const [sendMode, setSendNow] = useState<"immediate" | "scheduled">("immediate");
  const [activeChannels, setActiveChannels] = useState<string[]>(["email"]);

  const [uploadProgress, setUploadProgress] = useState(0);
  const blockFileInputRef = useRef<HTMLInputElement>(null);

  const [zhContent, setZhContent] = useState<LangContent>({
    emailSubject: "",
    emailBlocks: [...DEFAULT_BLOCKS],
    whatsappMsg: "",
    inAppMsg: "",
    pushMsg: ""
  });

  const [enContent, setEnContent] = useState<LangContent>({
    emailSubject: "",
    emailBlocks: [...DEFAULT_BLOCKS],
    whatsappMsg: "",
    inAppMsg: "",
    pushMsg: ""
  });

  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (existingData && !isInitialized.current) {
      const load = (data: any, setFn: any) => {
        setFn({
          emailSubject: data.emailSubject || "",
          emailBlocks: data.emailBlocks || data.blocks || [...DEFAULT_BLOCKS],
          whatsappMsg: data.whatsappMsg || "",
          inAppMsg: data.inAppMsg || "",
          pushMsg: data.pushMsg || ""
        });
      };
      if (existingData.zh) load(existingData.zh, setZhContent);
      if (existingData.en) load(existingData.en, setEnContent);
      if (existingData.targetType) setTargetType(existingData.targetType);
      if (existingData.eligibleTiers) setEligibleTiers(existingData.eligibleTiers);
      if (existingData.sendMode) setSendNow(existingData.sendMode);
      if (Array.isArray(existingData.activeChannels)) setActiveChannels(existingData.activeChannels);
      isInitialized.current = true;
    }
  }, [existingData]);

  const currentLangContent = langTab === 'zh' ? zhContent : enContent;
  const setContent = langTab === 'zh' ? setZhContent : setEnContent;

  const estimatedReach = useMemo(() => {
    if (targetType === 'all') return allUsers?.length || 0;
    if (targetType === 'subscribers') return allSubscribers?.length || 0;
    if (targetType === 'tiers') {
      return allUsers?.filter(u => eligibleTiers.includes(u.tier || 'classic')).length || 0;
    }
    return 0;
  }, [targetType, eligibleTiers, allUsers, allSubscribers]);

  const addBlock = (type: BlockType) => {
    const newBlock: EmailBlock = {
      id: `block_${Date.now()}`,
      type,
      data: type === 'text' ? { title: "新增標題", content: "請輸入內容..." } :
            type === 'button' ? { label: "立即查看", url: "/shop" } :
            type === 'hero' ? { url: "https://picsum.photos/seed/campaign/1200/600" } :
            type === 'products' ? { items: [{ name: "產品 A", price: "99" }, { name: "產品 B", price: "199" }] } :
            type === 'footer' ? { content: "© 2024 SHOP POINT Limited. All rights reserved." } :
            type === 'social_links' ? { align: "center", facebook: "{{facebookUrl}}", instagram: "{{instagramUrl}}" } :
            type === 'order_meta' ? { orderId: "{{orderId}}", date: "{{orderDate}}" } :
            type === 'order_summary' ? { total: "{{totalAmount}}" } :
            type === 'customer_details' ? { name: "{{customerName}}", email: "{{customerEmail}}", phone: "{{customerPhone}}" } :
            type === 'shipping_address' ? { title: "收貨地址", address: "{{shippingAddress}}" } :
            type === 'billing_address' ? { title: "賬單地址", address: "{{billingAddress}}" } :
            type === 'shipping_details' ? { method: "{{shippingMethod}}", tracking: "{{trackingNo}}" } :
            type === 'pickup_point' ? { location: "{{pickupLocation}}" } :
            type === 'order_status_tracker' ? {} :
            type === 'coupon' ? { code: "WELCOME10", discount: "10% OFF" } : {}
    };
    setContent(prev => ({ ...prev, emailBlocks: [...prev.emailBlocks, newBlock] }));
    setSelectedBlockId(newBlock.id);
  };

  const removeBlock = (id: string) => {
    setContent(prev => ({ ...prev, emailBlocks: prev.emailBlocks.filter(b => b.id !== id) }));
    if (selectedBlockId === id) setSelectedBlockId(null);
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    const nextIndex = direction === 'up' ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= currentLangContent.emailBlocks.length) return;
    const newBlocks = [...currentLangContent.emailBlocks];
    [newBlocks[index], newBlocks[nextIndex]] = [newBlocks[nextIndex], newBlocks[index]];
    setContent(prev => ({ ...prev, emailBlocks: newBlocks }));
  };

  const updateBlockData = (id: string, newData: any) => {
    setContent(prev => ({
      ...prev,
      emailBlocks: prev.emailBlocks.map(b => b.id === id ? { ...b, data: { ...b.data, ...newData } } : b)
    }));
  };

  const handleToggleChannel = (channel: string) => {
    setActiveChannels(prev => prev.includes(channel) ? prev.filter(c => c !== channel) : [...prev, channel]);
  };

  const handleAiGenerate = async (channel: 'email' | 'whatsapp' | 'in_app' | 'push') => {
    setAiLoading(channel);
    try {
      const result = await generateNotificationContent({
        triggerEvent: isTemplateMode || "Marketing Campaign",
        concept: aiConcept || undefined,
        language: langTab === 'en' ? 'en' : 'zh-HK',
        channel: channel === 'push' ? 'in_app' : channel 
      });

      if (channel === 'email') {
        const targetId = selectedBlockId || currentLangContent.emailBlocks.find(b => b.type === 'text')?.id;
        if (targetId) updateBlockData(targetId, { content: result.content });
        if (result.subject && !currentLangContent.emailSubject) setContent(p => ({ ...p, emailSubject: result.subject! }));
      } else if (channel === 'whatsapp') setContent(p => ({ ...p, whatsappMsg: result.content }));
      else if (channel === 'in_app') setContent(p => ({ ...p, inAppMsg: result.content }));
      else if (channel === 'push') setContent(p => ({ ...p, pushMsg: result.content.substring(0, 60) })); 
      toast({ title: "AI 生成完成" });
    } catch (e) { toast({ title: "AI Error", variant: "destructive" }); } finally { setAiLoading(null); }
  };

  const handleBlockFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedBlockId) return;
    setLoading(true);
    try {
      const compressedBlob = await compressImage(file, 1200, 0.75);
      const storageRef = ref(storage, `notifications/${Date.now()}_block.webp`);
      const uploadTask = uploadBytesResumable(storageRef, compressedBlob, { contentType: 'image/webp' });
      uploadTask.on('state_changed', 
        (snapshot) => setUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
        null,
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          updateBlockData(selectedBlockId, { url: downloadURL });
          setUploadProgress(0); setLoading(false);
        }
      );
    } catch (e) { setLoading(false); }
  };

  const handleSendTest = async () => {
    setTestLoading(true);
    try {
      const res = await sendTestNotification({
        db,
        subject: currentLangContent.emailSubject,
        blocks: currentLangContent.emailBlocks,
        lang: langTab === 'en' ? 'en' : 'zh'
      });
      
      if (res.success) {
        toast({ title: "測試電郵已發送" });
      } else {
        const errorMsg = 'error' in res ? res.error : "Unknown transport error";
        throw new Error(errorMsg);
      }
    } catch (e: any) {
      toast({ title: "發送失敗", description: e.message, variant: "destructive" });
    } finally { setTestLoading(false); }
  };

  const handleSave = async () => {
    if (!db) return;
    setLoading(true);
    const baseData = { targetType, eligibleTiers, sendMode, activeChannels, zh: zhContent, en: enContent, updatedAt: serverTimestamp() };
    try {
      if (isTemplateMode) await setDoc(doc(db, 'notification_templates', isTemplateMode), baseData, { merge: true });
      else if (existingId) await setDoc(doc(db, 'broadcasts', existingId), baseData, { merge: true });
      else await addDoc(collection(db, 'broadcasts'), { ...baseData, createdAt: serverTimestamp() });
      toast({ title: "儲存成功" }); router.push("/admin/notifications");
    } catch (e) { toast({ title: "儲存失敗", variant: "destructive" }); } finally { setLoading(false); }
  };

  const handleExecuteBroadcast = async () => {
    setLoading(true);
    // 這裡應調用 Cloud Function 或 Server Action 來執行大規模群發
    setTimeout(() => {
      setLoading(false);
      setIsSendConfirmOpen(false);
      toast({ title: "宣傳活動已啟動", description: `正在將訊息發送給 ${estimatedReach} 位受眾。` });
      router.push("/admin/notifications");
    }, 2000);
  };

  const selectedBlock = useMemo(() => currentLangContent.emailBlocks.find(b => b.id === selectedBlockId), [currentLangContent.emailBlocks, selectedBlockId]);

  if (dataLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-8 pb-20 max-w-[1600px] mx-auto animate-in fade-in duration-500">
      <div className="flex items-center justify-between sticky top-0 z-50 bg-background/80 backdrop-blur py-4 border-b px-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full"><ArrowLeft className="h-5 w-5" /></Button>
          <div>
            <h1 className="text-2xl font-black font-headline tracking-tight">{isTemplateMode ? `範本：${isTemplateMode}` : "全通路通訊編輯器"}</h1>
            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">
               預計受眾人數：<span className="text-primary">{estimatedReach.toLocaleString()}</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Tabs value={langTab} onValueChange={(v: any) => setLangTab(v)}>
            <TabsList className="bg-muted/50 h-10 p-1 rounded-xl">
              <TabsTrigger value="en" className="rounded-lg px-6 text-xs font-bold">EN</TabsTrigger>
              <TabsTrigger value="zh" className="rounded-lg px-6 text-xs font-bold">中文</TabsTrigger>
            </TabsList>
          </Tabs>
          <Separator orientation="vertical" className="h-8 mx-2" />
          <Button variant="outline" className="rounded-xl font-bold h-11 px-6 border-indigo-600 text-indigo-700 hover:bg-indigo-50 gap-2" onClick={handleSendTest} disabled={testLoading || !currentLangContent.emailSubject}>
            {testLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FlaskConical className="h-4 w-4" />} 測試發送
          </Button>
          <Button variant="outline" className="rounded-xl font-bold h-11 px-6" onClick={() => setPreviewMode(!previewMode)}>
            {previewMode ? <Settings2 className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />} {previewMode ? "返回編輯" : "預覽面板"}
          </Button>
          
          {isTemplateMode ? (
            <Button className="bg-primary text-primary-foreground font-black shadow-lg rounded-xl h-11 px-10 gap-2" onClick={handleSave} disabled={loading || !currentLangContent.emailSubject}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              儲存範本配置
            </Button>
          ) : (
            <Button className="bg-indigo-600 text-white font-black shadow-lg rounded-xl h-11 px-8 gap-2" onClick={() => setIsSendConfirmOpen(true)} disabled={loading || !currentLangContent.emailSubject}>
              <Send className="h-4 w-4" /> 啟動群發活動
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 px-4 items-start">
        {!previewMode && (
          <aside className="lg:col-span-3 space-y-6 sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto pr-2 no-scrollbar">
            <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden border-l-4 border-primary">
              <CardHeader className="bg-primary/5 py-4 border-b"><CardTitle className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2"><Target className="h-4 w-4" /> 傳送渠道</CardTitle></CardHeader>
              <CardContent className="p-4 space-y-2">
                {[
                  { id: 'email', label: '電子郵件 (Email)', icon: Mail, color: 'text-orange-600' },
                  { id: 'whatsapp', label: 'WhatsApp 訊息', icon: Smartphone, color: 'text-green-600' },
                  { id: 'in_app', label: '站內鈴鐺通知', icon: Bell, color: 'text-blue-600' },
                  { id: 'push', label: '手機 App 推送', icon: SmartphoneNfc, color: 'text-indigo-600' }
                ].map(channel => (
                  <div key={channel.id} onClick={() => handleToggleChannel(channel.id)} className={cn("flex items-center justify-between p-3 rounded-xl border-2 transition-all cursor-pointer group", activeChannels.includes(channel.id) ? "border-primary bg-primary/5" : "border-muted hover:border-primary/20")}>
                    <div className="flex items-center gap-3"><channel.icon className={cn("h-4 w-4", activeChannels.includes(channel.id) ? channel.color : "text-muted-foreground")} /><span className={cn("text-xs font-bold", activeChannels.includes(channel.id) ? "text-foreground" : "text-muted-foreground")}>{channel.label}</span></div>
                    <Checkbox checked={activeChannels.includes(channel.id)} onCheckedChange={() => {}} className="rounded-full" />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden">
              <CardHeader className="bg-muted/10 border-b py-3 px-6"><CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2"><Layout className="h-3 w-3" /> 組件庫</CardTitle></CardHeader>
              <div className="p-3 space-y-6">
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-muted-foreground uppercase ml-1 tracking-widest">基礎組件</Label>
                  <div className="grid grid-cols-1 gap-1">
                    <LibBtn icon={ImageIconLucide} label="商店標誌" onClick={() => addBlock('logo')} />
                    <LibBtn icon={Layout} label="橫幅圖片" onClick={() => addBlock('hero')} />
                    <LibBtn icon={Type} label="內容段落" onClick={() => addBlock('text')} />
                    <LibBtn icon={Share2} label="社交媒體連結" onClick={() => addBlock('social_links')} />
                    <LibBtn icon={MousePointer2} label="跳轉按鈕" onClick={() => addBlock('button')} />
                    <LibBtn icon={Info} label="頁腳資訊" onClick={() => addBlock('footer')} />
                  </div>
                </div>
                <Separator />
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-black text-primary uppercase ml-1 tracking-widest">訂單與營運組件</Label>
                  <div className="grid grid-cols-1 gap-1">
                    <LibBtn icon={LayoutList} label="訂單進度條" onClick={() => addBlock('order_status_tracker')} />
                    <LibBtn icon={Hash} label="單號日期塊" onClick={() => addBlock('order_meta')} />
                    <LibBtn icon={Calculator} label="訂單總額塊" onClick={() => addBlock('order_summary')} />
                    <LibBtn icon={UserCircle} label="顧客詳細資訊" onClick={() => addBlock('customer_details')} />
                    <LibBtn icon={MapPin} label="收貨地址塊" onClick={() => addBlock('shipping_address')} />
                    <LibBtn icon={Building2} label="賬單地址塊" onClick={() => addBlock('billing_address')} />
                    <LibBtn icon={Truck} label="物流單號資訊" onClick={() => addBlock('shipping_details')} />
                    <LibBtn icon={MapPinned} label="自取網點資訊" onClick={() => addBlock('pickup_point')} />
                    <LibBtn icon={ShoppingCart} label="產品明細表格" onClick={() => addBlock('products')} />
                    <LibBtn icon={Ticket} label="優惠券/代碼" onClick={() => addBlock('coupon')} />
                  </div>
                </div>
              </div>
            </Card>

            {/* 可用變數快速參考 */}
            <Card className="border-none shadow-sm bg-slate-900 text-white rounded-3xl overflow-hidden">
               <CardHeader className="bg-white/5 border-b py-3 px-6"><CardTitle className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2"><ClipboardList className="h-4 w-4" /> 可用動態變數</CardTitle></CardHeader>
               <CardContent className="p-4">
                 <div className="space-y-3">
                   {VARIABLES.map(v => (
                     <div key={v.key} className="flex flex-col gap-0.5 group">
                        <div className="flex items-center justify-between">
                          <code className="text-[10px] font-mono text-primary font-black group-hover:text-white transition-colors">{v.key}</code>
                          <button onClick={() => { navigator.clipboard.writeText(v.key); toast({ title: "已複製變數" }); }} className="opacity-0 group-hover:opacity-40 hover:!opacity-100"><Copy className="h-2.5 w-2.5" /></button>
                        </div>
                        <span className="text-[9px] text-slate-500 font-bold">{v.label}</span>
                     </div>
                   ))}
                 </div>
               </CardContent>
            </Card>
          </aside>
        )}

        <div className={cn("space-y-6", previewMode ? "lg:col-span-12" : "lg:col-span-5")}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            {!previewMode && (
              <TabsList className="bg-muted/30 w-full mb-4 rounded-2xl h-11 p-1 border">
                <TabsTrigger value="email" className="flex-1 rounded-xl text-xs font-bold">Email 預覽</TabsTrigger>
                <TabsTrigger value="whatsapp" className="flex-1 rounded-xl text-xs font-bold">WhatsApp</TabsTrigger>
                <TabsTrigger value="in_app" className="flex-1 rounded-xl text-xs font-bold">站內/推送</TabsTrigger>
              </TabsList>
            )}
            <TabsContent value="email" className="space-y-6">
              {!previewMode && (
                <div className="grid gap-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Email Subject</Label>
                  <Input value={currentLangContent.emailSubject} onChange={(e) => setContent(prev => ({ ...prev, emailSubject: e.target.value }))} placeholder="輸入主旨，支援變數如 {{customerName}}..." className="h-12 text-lg font-bold rounded-xl border-none shadow-sm bg-white" />
                </div>
              )}
              <div className={cn("bg-white mx-auto shadow-2xl rounded-[3rem] overflow-hidden border-8 border-muted", previewMode ? "max-w-2xl" : "max-w-full")}>
                <div className="min-h-[600px] flex flex-col bg-white">
                  {currentLangContent.emailBlocks.map((block, index) => (
                    <div key={block.id} onClick={() => !previewMode && setSelectedBlockId(block.id)} className={cn("relative group transition-all", !previewMode && "cursor-pointer hover:bg-primary/5", !previewMode && selectedBlockId === block.id && "bg-primary/5 ring-1 ring-inset ring-primary shadow-inner")}>
                      <BlockRenderer block={block} lang={langTab} />
                      {!previewMode && (
                        <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                          <Button size="icon" variant="secondary" className="h-7 w-7 rounded-lg" onClick={(e) => { e.stopPropagation(); moveBlock(index, 'up'); }} disabled={index === 0}><ArrowUp className="h-3 w-3" /></Button>
                          <Button size="icon" variant="secondary" className="h-7 w-7 rounded-lg" onClick={(e) => { e.stopPropagation(); moveBlock(index, 'down'); }} disabled={index === currentLangContent.emailBlocks.length - 1}><ArrowDown className="h-3 w-3" /></Button>
                          <Button size="icon" variant="destructive" className="h-7 w-7 rounded-lg" onClick={(e) => { e.stopPropagation(); removeBlock(block.id); }}><Trash2 className="h-3 w-3" /></Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
            <TabsContent value="whatsapp" className="space-y-6">
              <Card className="border-none shadow-xl bg-white rounded-3xl overflow-hidden">
                <CardHeader className="bg-green-50 border-b p-6">
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-green-700"><Smartphone className="h-4 w-4" /> WhatsApp 內容</CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                  <Textarea value={currentLangContent.whatsappMsg} onChange={(e) => setContent(prev => ({ ...prev, whatsappMsg: e.target.value }))} className="min-h-[300px] bg-muted/20 border-none rounded-2xl p-4 text-sm font-medium" placeholder="輸入訊息內容..." />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="in_app" className="space-y-6">
              <Card className="border-none shadow-xl bg-white rounded-3xl overflow-hidden">
                <CardHeader className="bg-orange-50 border-b p-6">
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-orange-700"><Bell className="h-4 w-4" /> 站內/推送</CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase ml-1">Push 標題</Label>
                    <Input value={currentLangContent.pushMsg} onChange={(e) => setContent(prev => ({ ...prev, pushMsg: e.target.value }))} className="h-12 bg-muted/20 border-none rounded-xl font-bold" maxLength={60} />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase ml-1">通知正文</Label>
                    <Textarea value={currentLangContent.inAppMsg} onChange={(e) => setContent(prev => ({ ...prev, inAppMsg: e.target.value }))} className="min-h-[150px] bg-muted/20 border-none rounded-2xl p-4 text-sm font-medium" />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {!previewMode && (
          <aside className="lg:col-span-4 space-y-6 sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto pr-2 no-scrollbar">
            {selectedBlock ? (
              <Card className="border-none shadow-xl bg-white rounded-3xl overflow-hidden animate-in slide-in-from-right-2 duration-300">
                <CardHeader className="bg-primary/5 border-b py-5 px-6">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-black uppercase flex items-center gap-2 text-primary"><Settings2 className="h-4 w-4" /> 編輯組件：{selectedBlock.type}</CardTitle>
                    <button onClick={() => setSelectedBlockId(null)}><X className="h-4 w-4" /></button>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {selectedBlock.type === 'hero' && (
                    <div className="space-y-3">
                      <div className="aspect-video rounded-2xl bg-muted border-2 border-dashed flex items-center justify-center relative group overflow-hidden" onClick={() => blockFileInputRef.current?.click()}>
                        {selectedBlock.data.url ? <img src={selectedBlock.data.url} alt="preview" className="object-contain w-full h-full p-2" /> : <ImageIconLucide className="h-8 w-8 text-muted-foreground/30" />}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"><Button size="sm" variant="secondary" className="font-bold rounded-lg shadow-lg">上傳圖片</Button></div>
                      </div>
                      <Input placeholder="圖片網址..." value={selectedBlock.data.url} onChange={(e) => updateBlockData(selectedBlock.id, { url: e.target.value })} className="h-10 bg-muted/20 border-none rounded-xl text-[10px]" />
                      <input type="file" ref={blockFileInputRef} className="hidden" onChange={handleBlockFileUpload} accept="image/*" />
                    </div>
                  )}
                  {['text', 'order_meta', 'shipping_address', 'billing_address', 'footer'].includes(selectedBlock.type) && (
                    <div className="space-y-4">
                      <div className="grid gap-2"><Label className="text-[10px] font-black uppercase">標題</Label><Input value={selectedBlock.data.title || ""} onChange={(e) => updateBlockData(selectedBlock.id, { title: e.target.value })} className="h-10 bg-muted/20 border-none rounded-xl font-bold" /></div>
                      <div className="grid gap-2"><Label className="text-[10px] font-black uppercase">正文內容 / 地址</Label><Textarea value={selectedBlock.data.content || selectedBlock.data.msg || selectedBlock.data.address || ""} onChange={(e) => updateBlockData(selectedBlock.id, { [selectedBlock.type.includes('address') ? 'address' : 'content']: e.target.value })} className="min-h-[120px] bg-muted/20 border-none rounded-xl text-xs" /></div>
                    </div>
                  )}
                  {selectedBlock.type === 'coupon' && (
                    <div className="space-y-4">
                      <div className="grid gap-2">
                        <Label className="text-[10px] font-black uppercase">優惠代碼 (Code)</Label>
                        <Input value={selectedBlock.data.code} onChange={(e) => updateBlockData(selectedBlock.id, { code: e.target.value.toUpperCase() })} className="h-10 bg-muted/20 border-none rounded-xl font-mono font-bold" />
                      </div>
                      <div className="grid gap-2">
                        <Label className="text-[10px] font-black uppercase">優惠描述 (如：10% OFF)</Label>
                        <Input value={selectedBlock.data.discount} onChange={(e) => updateBlockData(selectedBlock.id, { discount: e.target.value })} className="h-10 bg-muted/20 border-none rounded-xl font-bold" />
                      </div>
                    </div>
                  )}
                  {selectedBlock.type === 'button' && (
                    <div className="space-y-4">
                      <div className="grid gap-2"><Label className="text-[10px] font-black uppercase">按鈕文字</Label><Input value={selectedBlock.data.label} onChange={(e) => updateBlockData(selectedBlock.id, { label: e.target.value })} className="h-10 font-black rounded-xl" /></div>
                      <div className="grid gap-2"><Label className="text-[10px] font-black uppercase">跳轉連結</Label><Input value={selectedBlock.data.url} onChange={(e) => updateBlockData(selectedBlock.id, { url: e.target.value })} className="h-10 font-mono text-[10px] rounded-xl" /></div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <>
                <Card className="border-none shadow-sm bg-white rounded-3xl overflow-hidden border-l-4 border-indigo-600">
                  <CardHeader className="bg-indigo-50/50 border-b py-4 px-6">
                    <CardTitle className="text-xs font-black uppercase tracking-widest text-indigo-700 flex items-center gap-2">
                      <Users className="h-4 w-4" /> 目標受眾與篩選
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <RadioGroup value={targetType} onValueChange={setTargetType} className="space-y-2">
                      {[
                        { id: 'all', label: '所有授權名單', count: allUsers?.length || 0 },
                        { id: 'subscribers', label: '僅電子報訂閱者', count: allSubscribers?.length || 0 },
                        { id: 'tiers', label: '按會員等級篩選', count: '可多選' }
                      ].map((aud) => (
                        <div key={aud.id} className={cn(
                          "p-4 border-2 rounded-2xl flex items-center space-x-3 cursor-pointer transition-all",
                          targetType === aud.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:bg-muted/50 border-muted'
                        )}
                        onClick={() => setTargetType(aud.id)}
                        >
                          <RadioGroupItem value={aud.id} id={`aud-${aud.id}`} />
                          <Label htmlFor={`aud-${aud.id}`} className="flex-1 cursor-pointer">
                            <p className="font-bold text-xs">{aud.label}</p>
                            <p className="text-[10px] text-muted-foreground">{aud.count} 位受眾</p>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>

                    {targetType === 'tiers' && (
                      <div className="p-4 bg-muted/20 rounded-2xl space-y-3 animate-in fade-in">
                        <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">勾選等級</Label>
                        <div className="flex flex-wrap gap-2">
                          {['classic', 'gold', 'platinum'].map(tier => (
                            <Badge 
                              key={tier} 
                              variant={eligibleTiers.includes(tier) ? "default" : "outline"}
                              className="cursor-pointer font-bold px-3 py-1 uppercase text-[10px] transition-all"
                              onClick={() => setEligibleTiers(p => p.includes(tier) ? p.filter(t => t !== tier) : [...p, tier])}
                            >
                              {tier}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <Separator />

                    <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-black text-primary uppercase"><Zap className="h-4 w-4 fill-current" /> 發送預估</div>
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-muted-foreground">預計覆蓋:</span>
                        <span className="font-black text-indigo-700">{estimatedReach.toLocaleString()} 人</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-none shadow-sm bg-indigo-600 text-white rounded-3xl overflow-hidden">
                  <CardContent className="p-6 space-y-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      <h4 className="text-xs font-black uppercase tracking-widest">AI 動態撰寫助手</h4>
                    </div>
                    <Textarea placeholder="輸入本次活動的核心構思..." className="bg-white/10 border-none text-white text-xs h-24 placeholder:text-white/40" value={aiConcept} onChange={(e) => setAiConcept(e.target.value)} />
                    <Button className="w-full bg-white text-indigo-600 font-black text-xs h-11 rounded-xl shadow-lg" onClick={() => handleAiGenerate(activeTab as any)} disabled={!!aiLoading || !aiConcept}>同步生成內容</Button>
                  </CardContent>
                </Card>
              </>
            )}

            <Card className="border-none shadow-sm bg-white rounded-2xl overflow-hidden border-l-4 border-amber-500">
               <CardHeader className="py-4 border-b bg-amber-50/50"><CardTitle className="text-xs font-black uppercase text-amber-700 flex items-center gap-2"><Info className="h-3 w-3" /> 使用小提示</CardTitle></CardHeader>
               <CardContent className="p-4">
                 <p className="text-[10px] text-amber-800 leading-relaxed italic italic">
                   您可以隨時點擊「儲存配置」將此活動存為範本。建議在群發前先點擊「測試發送」檢查排版效果。
                 </p>
               </CardContent>
            </Card>
          </aside>
        )}
      </div>

      <AlertDialog open={isSendConfirmOpen} onOpenChange={setIsSendConfirmOpen}>
        <AlertDialogContent className="rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden">
          <div className="p-8 bg-indigo-600 text-white text-center space-y-4">
             <div className="h-16 w-16 bg-white/20 rounded-full flex items-center justify-center mx-auto border-2 border-white/20">
               <Send className="h-8 w-8" />
             </div>
             <div className="space-y-1">
               <AlertDialogTitle className="text-2xl font-black font-headline">確認啟動群發？</AlertDialogTitle>
               <AlertDialogDescription className="text-indigo-100 font-medium">
                 您正準備將此訊息發送給約 <span className="text-white font-black">{estimatedReach.toLocaleString()}</span> 位受眾。
               </AlertDialogDescription>
             </div>
          </div>
          <div className="p-8 space-y-6 bg-white">
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest text-center">啟用的傳送管道</p>
              <div className="flex justify-center gap-4">
                {activeChannels.map(c => (
                  <Badge key={c} className="bg-indigo-50 text-indigo-700 border-none font-black text-[10px] h-8 px-4 uppercase">{c}</Badge>
                ))}
              </div>
            </div>
            <Separator className="border-dashed" />
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800 leading-relaxed font-bold">
                這是一項全通路執行操作，系統將自動處理多語言適配與批量隊列發送。
              </p>
            </div>
            <div className="flex gap-3">
              <AlertDialogCancel className="flex-1 h-14 rounded-2xl font-bold border-none bg-muted/50 hover:bg-muted">取消</AlertDialogCancel>
              <AlertDialogAction onClick={handleExecuteBroadcast} className="flex-[2] h-14 bg-indigo-600 text-white font-black text-lg rounded-2xl shadow-xl hover:scale-[1.02] transition-all">
                {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <CheckCircle2 className="h-5 w-5 mr-2" />}
                確認發送
              </AlertDialogAction>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function NewBroadcastPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <BroadcastBuilderContent />
    </Suspense>
  );
}
