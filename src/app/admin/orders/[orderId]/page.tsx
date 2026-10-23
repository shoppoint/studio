
"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  Printer, 
  ChevronDown,
  UserCheck,
  Zap,
  RefreshCcw,
  CheckCircle2,
  Coins,
  AlertTriangle,
  Mail,
  Send,
  Trash2,
  Crown,
  UserCircle,
  X,
  Package,
  Leaf,
  AlertCircle,
  BellRing,
  MousePointer2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { useI18n } from "@/lib/i18n/i18n-context";
import { useToast } from "@/hooks/use-toast";
import { useUser, useDoc, useFirestore, useCollection } from "@/firebase";
import { 
  doc, 
  updateDoc, 
  serverTimestamp, 
  collection, 
  query, 
  where, 
  Timestamp,
  deleteDoc,
  getDocs,
  getDoc,
  limit,
  runTransaction,
  increment,
  setDoc,
  DocumentSnapshot,
  DocumentData
} from "firebase/firestore";
import { generateOrderDocHtml } from "@/lib/print-templates";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { HARDCODED_SHIPPING_ZONES } from "@/lib/constants/shipping-data";
import { format, parseISO } from "date-fns";
import { triggerNotification } from "@/services/communication-service";

import { 
  OrderOverviewTab, 
  OrderItemsTab, 
  OrderLogisticsTab, 
  OrderPaymentTab, 
  OrderNotesTab 
} from "@/components/admin/orders/OrderAdminTabs";

const EMAIL_TEMPLATES = [
  { id: "order_placed", label: "訂單成立確認 (送貨)" },
  { id: "order_placed_pickup", label: "訂單成立確認 (自取)" },
  { id: "order_processing", label: "訂單處理中 (Processing)" },
  { id: "order_shipped", label: "貨品已發貨通知" },
  { id: "order_ready_pickup", label: "貨品待取通知" },
  { id: "order_delivered", label: "貨品已送達/已取貨" },
  { id: "order_cancelled_paid", label: "訂單取消 (已退款)" },
  { id: "order_cancelled_unpaid", label: "訂單取消 (未付款)" },
  { id: "order_awaiting_payment", label: "等待付款提醒" },
];

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const { isAdmin: isSuperAdmin, user: currentUser } = useUser();
  const db = useFirestore();
  const orderId = String(params?.orderId || "");

  const ordT = t.admin.orders;
  const statusT = ordT.status;

  const orderRef = useMemo(() => {
    if (!db || !orderId) return null;
    return doc(db, 'orders', orderId);
  }, [db, orderId]);
  const { data: order, loading: orderLoading } = useDoc<any>(orderRef);

  const [memberData, setMemberData] = useState<any>(null);
  const [isResolvingMember, setIsResolvingMember] = useState(false);

  useEffect(() => {
    if (!order || !db) return;
    const resolveIdentity = async () => {
      setIsResolvingMember(true);
      try {
        if (order.customerId) {
          const uidSnap = await getDoc(doc(db, 'users', order.customerId));
          if (uidSnap.exists()) {
            setMemberData({ ...uidSnap.data(), id: uidSnap.id });
            return;
          }
        }
        const email = order.customerInfo?.email;
        if (email) {
          const emailQuery = query(collection(db, 'users'), where('email', '==', email.toLowerCase().trim()), limit(1));
          const emailSnap = await getDocs(emailQuery);
          if (!emailSnap.empty) {
            setMemberData({ ...emailSnap.docs[0].data(), id: emailSnap.docs[0].id });
          } else {
            setMemberData({ role: 'Guest' });
          }
        } else {
          setMemberData({ role: 'Guest' });
        }
      } catch (e) {
        setMemberData({ role: 'Guest' });
      } finally { setIsResolvingMember(false); }
    };
    resolveIdentity();
  }, [order, db]);

  const locationsQuery = useMemo(() => db ? query(collection(db, 'locations')) : null, [db]);
  const { data: locations } = useCollection<any>(locationsQuery);

  const loyaltyConfigRef = useMemo(() => db ? doc(db, 'config', 'loyalty') : null, [db]);
  const { data: loyaltyConfig } = useDoc<any>(loyaltyConfigRef);

  const [activeTab, setActiveTab] = useState("overview");
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isNotifying, setIsNotifying] = useState<string | null>(null);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
  
  const [isNotifyPromptOpen, setIsNotifyConfirmOpen] = useState(false);
  const [pendingTemplateId, setPendingTemplateId] = useState<string | null>(null);

  const [fulfillmentStatus, setFulfillmentStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [selectedMethodId, setSelectedMethodId] = useState("");
  const [selectedPoint, setSelectedPoint] = useState<any | null>(null);
  const [trackingNo, setTrackingNo] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [fulfillmentLocationId, setFulfillmentLocationId] = useState(""); 
  const [localItems, setLocalItems] = useState<any[]>([]);
  const [localPayments, setLocalPayments] = useState<any[]>([]);
  const [packagingPreference, setPackagingPreference] = useState("eco");
  const [couponCode, setCouponCode] = useState("");
  const [autoDiscountAmount, setAutoDiscountAmount] = useState(0);
  const [appliedPromos, setAppliedPromos] = useState<any[]>([]);
  
  const [contactData, setContactData] = useState({ firstName: "", lastName: "", name: "", email: "", phone: "", companyName: "" });
  const [shippingAddress, setShippingAddress] = useState<any>({ country: "Hong Kong", area: "", district: "", subDistrict: "", street: "", building: "", floor: "", flat: "", block: "" });
  const [billingAddress, setBillingAddress] = useState<any>({ country: "Hong Kong", area: "", district: "", subDistrict: "", street: "", building: "", floor: "", flat: "", block: "" });
  const [shippingFee, setShippingFee] = useState("0");
  const [orderDiscount, setOrderDiscount] = useState("0");
  const [orderDiscountType, setOrderDiscountType] = useState<"amount" | "percent">("amount");
  const [pointsUsed, setPointsUsed] = useState("0");
  const [pointsUsedValue, setPointsUsedValue] = useState("0");
  const [originalEarnedPoints, setOriginalEarnedPoints] = useState("0");
  const [adjustedPoints, setAdjustedPoints] = useState("0");
  const [pointsAwardedManual, setPointsAwardedManual] = useState(false);
  const [orderDateInput, setOrderDateInput] = useState("");

  useEffect(() => {
    if (order) {
      setFulfillmentStatus(String(order.fulfillmentStatus || "pending"));
      setPaymentStatus(String(order.paymentStatus || "unpaid"));
      setPaymentMethod(String(order.paymentMethod || "visa"));
      setSelectedMethodId(String(order.shippingMethodId || ""));
      setSelectedPoint(order.selectedPoint || null);
      setTrackingNo(String(order.trackingNo || ""));
      setInternalNotes(String(order.internalNotes || ""));
      setFulfillmentLocationId(String(order.fulfillmentLocationId || ""));
      setPackagingPreference(order.packagingPreference || "eco");
      setLocalItems((order.items || []).map((item: any) => ({ ...item, cartItemId: item.cartItemId || `item-${Math.random()}`, discount: Number(item.discount || 0), discountType: item.discountType || "amount", adjustment: Number(item.adjustment || 0) })));
      setLocalPayments(order.payments || []);
      setOriginalEarnedPoints(String(order.earnedPoints || "0"));
      setAdjustedPoints(String(order.adjustedPoints || "0"));
      setPointsUsed(String(order.pointsUsed || "0"));
      setPointsUsedValue(String(order.pointsUsedValue || "0"));
      setPointsAwardedManual(!!order.pointsAwarded);
      setOrderDiscountType(order.orderDiscountType || "amount");
      setOrderDiscount(String(order.orderDiscount || "0"));
      setCouponCode(order.couponCode || "");
      setAutoDiscountAmount(Number(order.discountAmount || 0));
      setAppliedPromos(order.appliedPromos || []);
      
      const rawName = order.customerInfo?.name || "";
      const nameParts = rawName.trim().split(/\s+/);
      setContactData({ firstName: order.customerInfo?.firstName || nameParts.slice(1).join(" "), lastName: order.customerInfo?.lastName || nameParts[0], name: rawName, email: order.customerInfo?.email || "", phone: order.customerInfo?.phone || "", companyName: order.customerInfo?.companyName || "" });
      setShippingAddress(order.shippingAddress || {});
      setBillingAddress(order.billingAddress || {});
      setShippingFee(String(order.shippingFee || "0"));
      if (order.createdAt?.seconds) setOrderDateInput(format(new Date(order.createdAt.seconds * 1000), "yyyy-MM-dd'T'HH:mm"));
    }
  }, [order]);

  const safeNum = (v: any) => { const n = Number(v); return isNaN(n) ? 0 : n; };
  
  const grossSubtotal = useMemo(() => localItems.reduce((acc, it) => acc + (safeNum(it.price) * safeNum(it.qty)), 0), [localItems]);
  
  const totalValue = useMemo(() => {
    if (!order) return 0;
    const discAmt = safeNum(autoDiscountAmount);
    const itemManualDiscounts = localItems.reduce((acc, it) => {
      const p = safeNum(it.price);
      const d = it.discountType === 'percent' ? (p * safeNum(it.discount) / 100) : safeNum(it.discount);
      return acc + (d * safeNum(it.qty)) - safeNum(it.adjustment);
    }, 0);
    const afterItemsPrice = grossSubtotal - itemManualDiscounts;
    const orderLevelDiscount = orderDiscountType === 'percent' ? (afterItemsPrice * safeNum(orderDiscount) / 100) : safeNum(orderDiscount);
    const val = afterItemsPrice - orderLevelDiscount + safeNum(shippingFee) - discAmt;
    return Math.ceil(Math.max(0, val) * 10) / 10;
  }, [grossSubtotal, localItems, shippingFee, orderDiscount, orderDiscountType, autoDiscountAmount]);

  useEffect(() => {
    if (isEditMode && loyaltyConfig && !order?.pointsAwarded) {
      const ratio = Number(loyaltyConfig.spendToPoints) || 10;
      const cashBase = Math.max(0, totalValue - safeNum(pointsUsedValue));
      const newPoints = Math.floor(cashBase / ratio);
      setOriginalEarnedPoints(String(newPoints));
    }
  }, [totalValue, isEditMode, loyaltyConfig, pointsUsedValue, order?.pointsAwarded]);

  const totalPaidValue = useMemo(() => (localPayments || []).reduce((acc, p) => acc + (Number(p.amount) || 0), 0), [localPayments]);

  const handleSave = async () => {
    if (loading || !order || !db) return; 
    
    setLoading(true);
    const todayStr = new Date().toISOString().split('T')[0];
    
    try {
      const hasStatusChanged = order.fulfillmentStatus !== fulfillmentStatus;
      let templateToSuggest = null;
      if (hasStatusChanged) {
        if (fulfillmentStatus === 'processing') templateToSuggest = 'order_processing';
        else if (fulfillmentStatus === 'shipped') templateToSuggest = 'order_shipped';
        else if (fulfillmentStatus === 'ready_pickup') templateToSuggest = 'order_ready_pickup';
        else if (['delivered', 'picked_up', 'completed'].includes(fulfillmentStatus)) templateToSuggest = 'order_delivered';
      }

      const updateData: any = {
        fulfillmentStatus, paymentStatus, paymentMethod, shippingMethodId: selectedMethodId,
        selectedPoint, trackingNo, internalNotes, fulfillmentLocationId, items: localItems, payments: localPayments,
        customerInfo: { ...contactData, name: `${contactData.lastName} ${contactData.firstName}`.trim() },
        shippingAddress, billingAddress, shippingFee: Number(shippingFee), orderDiscount: Number(orderDiscount), orderDiscountType,
        total: totalValue, pointsUsed: Number(pointsUsed), pointsUsedValue: Number(pointsUsedValue),
        earnedPoints: Number(originalEarnedPoints), adjustedPoints: Number(adjustedPoints),
        discountAmount: Number(autoDiscountAmount), appliedPromos, couponCode,
        status: fulfillmentStatus === 'cancelled' ? 'cancelled' : (['delivered', 'picked_up', 'completed'].includes(fulfillmentStatus) ? 'completed' : order.status),
        packagingPreference,
        updatedAt: serverTimestamp()
      };

      // 核心修正：轉換手動修改的訂單日期
      if (orderDateInput) {
        try {
          updateData.createdAt = Timestamp.fromDate(parseISO(orderDateInput));
        } catch (e) {
          console.warn("[Admin Order Edit] Date conversion failed");
        }
      }

      await runTransaction(db, async (transaction) => {
        const orderSnap = await transaction.get(orderRef!);
        if (!orderSnap.exists()) throw new Error("Order document not found");

        const oldItemsMap = new Map();
        (order.items || []).forEach((it: any) => oldItemsMap.set(String(it.productId || it.id), (oldItemsMap.get(String(it.productId || it.id)) || 0) + Number(it.qty)));
        
        const newItemsMap = new Map();
        localItems.forEach((it: any) => newItemsMap.set(String(it.productId || it.id), (newItemsMap.get(String(it.productId || it.id)) || 0) + Number(it.qty)));
        
        const pids = Array.from(new Set([...Array.from(oldItemsMap.keys()), ...Array.from(newItemsMap.keys())]))
          .filter(Boolean)
          .map(String);
        
        const productRefs = pids.map(pid => doc(db, 'public_products', pid));
        const productSnaps: DocumentSnapshot<DocumentData>[] = await Promise.all(productRefs.map(pref => transaction.get(pref)));

        const webHub = locations?.find((l: any) => l.isDefaultFulfillmentSource);
        const webHubId = webHub?.id;

        pids.forEach((pid, idx) => {
          const pSnap = productSnaps[idx];
          if (!pSnap.exists()) return;
          const pData = pSnap.data();
          if (!pData) return;
          const diff = (newItemsMap.get(pid) || 0) - (oldItemsMap.get(pid) || 0);
          
          if (diff === 0 && order.fulfillmentLocationId === fulfillmentLocationId) return;

          let batches = Array.isArray(pData.batches) ? [...pData.batches] : [];
          if (diff > 0) {
            let rem = diff;
            const validLocals = batches.filter(b => b.locationId === fulfillmentLocationId && (!b.expiryDate || b.expiryDate >= todayStr)).sort((a,b)=>(a.expiryDate||"9999").localeCompare(b.expiryDate||"9999"));
            for (const b of validLocals) {
              if (rem <= 0) break;
              if (b.quantity > 0) { const d = Math.min(b.quantity, rem); b.quantity = Number(b.quantity) - d; rem -= d; }
            }
            if (rem > 0) batches.push({ batchId: `ADJ-${orderId.slice(-4)}`, quantity: -rem, locationId: fulfillmentLocationId, expiryDate: "" });
          } else if (diff < 0) {
            const rev = Math.abs(diff);
            const lastIdx = batches.findLastIndex(b => b.locationId === fulfillmentLocationId);
            if (lastIdx > -1) batches[lastIdx].quantity = Number(batches[lastIdx].quantity) + rev;
            else batches.push({ batchId: `REV-${orderId.slice(-4)}`, quantity: rev, locationId: fulfillmentLocationId, expiryDate: "" });
          }

          const sellableTotalStock = batches.filter(b => !b.expiryDate || b.expiryDate >= todayStr).reduce((acc, b) => acc + (Number(b.quantity) || 0), 0);
          const sellableLocStock = batches.filter(b => b.locationId === fulfillmentLocationId && (!b.expiryDate || b.expiryDate >= todayStr)).reduce((acc, b) => acc + (Number(b.quantity) || 0), 0);
          
          const pUpdates: any = { batches, stock: sellableTotalStock, [`warehouseStock.${fulfillmentLocationId}`]: sellableLocStock, updatedAt: serverTimestamp() };
          if (webHubId && fulfillmentLocationId === webHubId) pUpdates.onlineStock = sellableLocStock;
          transaction.update(productRefs[idx], pUpdates);
        });

        if (pointsAwardedManual && !order.pointsAwarded && memberData?.id) {
           // 核心修正：使用 set { merge: true } 防止訪客帳號缺失報錯
           transaction.set(doc(db, 'users', memberData.id), {
             points: increment(Number(originalEarnedPoints)),
             updatedAt: serverTimestamp()
           }, { merge: true });
           updateData.pointsAwarded = true;
           updateData.pointsAwardedAt = serverTimestamp();
        }

        transaction.update(orderRef!, updateData);
      });

      setIsEditMode(false); 
      toast({ title: t.common.success, description: "訂單資料已儲存。" });
      if (templateToSuggest) {
        setPendingTemplateId(templateToSuggest);
        setIsNotifyConfirmOpen(true);
      }

    } catch (e: any) { 
      toast({ title: "儲存失敗", description: e.message, variant: "destructive" }); 
    } finally { 
      setLoading(false); 
    }
  };

  const handlePrintDoc = (type: 'invoice' | 'packing_slip') => {
    if (!order) return;
    const win = window.open('', '_blank', 'width=1000,height=900');
    if (win) { 
      win.document.write(generateOrderDocHtml(type, order, visibleItems, grossSubtotal, order.shippingFee || 0, totalValue)); 
      win.document.close(); 
    }
  };

  const handleSendNotification = async (templateId: string) => {
    if (!db || !order) return;
    setIsNotifying(templateId);
    try {
      const res = await triggerNotification(db, templateId, { ...order, id: orderId, orderId }, lang, true); 
      if (res.success) {
        toast({ title: "電郵已發送" }); 
        setIsNotifyConfirmOpen(false);
      } else {
        throw new Error(res.message);
      }
    } catch (e: any) { toast({ title: "發送失敗", description: e.message, variant: "destructive" }); } finally { setIsNotifying(null); }
  };

  const visibleItems = useMemo(() => {
    if (!order?.items) return [];
    return order.items.filter((item: any) => !item.isInternalGift);
  }, [order?.items]);

  if (orderLoading) return <div className="h-96 flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="h-10 w-10 rounded-full hover:bg-muted flex items-center justify-center transition-all">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline">#{order?.orderId || orderId}</Badge>
              {packagingPreference === 'eco' && <Badge className="bg-green-100 text-green-700 border-green-200 h-6 px-3 rounded-lg font-black text-[10px] uppercase">ECO</Badge>}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold font-headline">{contactData.name || "訂單詳情"}</h1>
              {(!memberData || memberData.role === 'Guest') ? (
                <Badge variant="secondary" className="h-6 px-3 rounded-lg border-none font-black text-[10px] uppercase shadow-sm bg-slate-200 text-slate-600">
                  <UserCircle className="h-3 w-3 mr-1" /> Guest 訪客
                </Badge>
              ) : (
                <>
                  <Badge className={cn(
                    "h-6 px-3 rounded-lg border-none font-black text-[10px] uppercase shadow-sm text-white",
                    memberData.role === 'Superadmin' ? "bg-red-600" : memberData.role === 'Vendor' ? "bg-indigo-600" : "bg-blue-600"
                  )}>{memberData.role}</Badge>
                  {memberData.tier && memberData.tier !== 'classic' && (
                    <Badge className={cn(
                      "h-6 px-3 rounded-lg border-none font-black text-[10px] uppercase shadow-sm gap-1",
                      memberData.tier === 'platinum' ? "bg-slate-900 text-white" : "bg-amber-400 text-amber-950"
                    )}><Crown className="h-3 w-3" />{t.profile.tiers[memberData.tier as keyof typeof t.profile.tiers] || memberData.tier}</Badge>
                  )}
                </>
              )}
              {isResolvingMember && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          {!isEditMode ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild><Button variant="outline" className="rounded-xl h-11 px-6 font-bold border-muted-foreground/20 bg-white gap-2"><Mail className="h-4 w-4" /> {isNotifying ? "正在發送..." : "發送通知信"}</Button></DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-2xl shadow-2xl p-2">
                  <DropdownMenuLabel className="text-[10px] font-black uppercase text-muted-foreground px-2 pb-2">選擇電郵範本</DropdownMenuLabel>
                  {EMAIL_TEMPLATES.map(temp => (
                    <DropdownMenuItem key={temp.id} className="rounded-xl py-2.5 font-bold cursor-pointer gap-2" onClick={() => handleSendNotification(temp.id)} disabled={!!isNotifying}><Send className="h-3.5 w-3.5 text-primary" />{temp.label}</DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="outline" className="rounded-xl h-11 bg-white gap-2 font-bold" onClick={() => handlePrintDoc('invoice')}><Printer className="h-4 w-4" /> 列印發票</Button>
              <Button variant="outline" className="rounded-xl h-11 font-bold text-primary border-primary/20" onClick={() => setIsEditMode(true)}>修改訂單</Button>
            </>
          ) : (
            <><Button variant="ghost" className="rounded-xl h-11 font-bold" onClick={() => setIsEditMode(false)}>取消</Button><Button className="bg-primary text-primary-foreground font-black rounded-xl h-11 shadow-lg px-8" onClick={handleSave} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "儲存變更"}</Button></>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="bg-muted/50 p-1 h-12 rounded-2xl w-full grid grid-cols-5 mb-6">
              <TabsTrigger value="overview" className="rounded-xl font-bold">概覽</TabsTrigger>
              <TabsTrigger value="items" className="rounded-xl font-bold">產品與折扣</TabsTrigger>
              <TabsTrigger value="logistics" className="rounded-xl font-bold">物流與地址</TabsTrigger>
              <TabsTrigger value="payment" className="rounded-xl font-bold">支付紀錄</TabsTrigger>
              <TabsTrigger value="notes" className="rounded-xl font-bold">備註</TabsTrigger>
            </TabsList>
            <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border min-h-[500px]">
              <TabsContent value="overview" className="mt-0">
                <OrderOverviewTab 
                  order={order} locations={locations} isEditMode={isEditMode} 
                  fulfillmentStatus={fulfillmentStatus} setFulfillmentStatus={setFulfillmentStatus} 
                  paymentStatus={paymentStatus} setPaymentStatus={setPaymentStatus} 
                  paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod} 
                  fulfillmentLocationId={fulfillmentLocationId} setFulfillmentLocationId={setFulfillmentLocationId} 
                  statusT={statusT} originalEarnedPoints={originalEarnedPoints} setOriginalEarnedPoints={setOriginalEarnedPoints} 
                  adjustedPoints={adjustedPoints} setAdjustedPoints={setAdjustedPoints} 
                  pointsUsed={pointsUsed} setPointsUsed={setPointsUsed}
                  pointsUsedValue={pointsUsedValue} setPointsUsedValue={setPointsUsedValue}
                  pointsAwardedManual={pointsAwardedManual} setPointsAwardedManual={setPointsAwardedManual}
                  orderDateInput={orderDateInput} setOrderDateInput={setOrderDateInput}
                  packagingPreference={packagingPreference} setPackagingPreference={setPackagingPreference}
                  lang={lang}
                />
              </TabsContent>
              <TabsContent value="items" className="mt-0">
                <OrderItemsTab 
                  order={order} localItems={localItems} setLocalItems={setLocalItems} isEditMode={isEditMode} isAdmin={isSuperAdmin} 
                  orderDiscount={orderDiscount} setOrderDiscount={setOrderDiscount} 
                  orderDiscountType={orderDiscountType} setOrderDiscountType={setOrderDiscountType}
                  pointsUsedValue={pointsUsedValue} memberData={memberData} setMemberData={setMemberData} setContactData={setContactData}
                  couponCode={couponCode} setCouponCode={setCouponCode}
                  autoDiscountAmount={autoDiscountAmount} setAutoDiscountAmount={setAutoDiscountAmount}
                  appliedPromos={appliedPromos} setAppliedPromos={setAppliedPromos}
                />
              </TabsContent>
              <TabsContent value="logistics" className="mt-0"><OrderLogisticsTab order={order} isEditMode={isEditMode} trackingNo={trackingNo} setTrackingNo={setTrackingNo} shippingAddress={shippingAddress} setShippingAddress={setShippingAddress} billingAddress={billingAddress} setBillingAddress={setBillingAddress} contactData={contactData} setContactData={setContactData} selectedMethodId={selectedMethodId} setSelectedMethodId={setSelectedMethodId} selectedPoint={selectedPoint} setSelectedPoint={setSelectedPoint} shippingFee={shippingFee} setShippingFee={setShippingFee} zones={HARDCODED_SHIPPING_ZONES} lang={lang} memberData={memberData} locations={locations} /></TabsContent>
              <TabsContent value="payment" className="mt-0"><OrderPaymentTab localPayments={localPayments} setLocalPayments={setLocalPayments} totalValue={totalValue} totalPaidValue={totalPaidValue} isEditMode={isEditMode} isAdmin={isSuperAdmin} /></TabsContent>
              <TabsContent value="notes" className="mt-0"><OrderNotesTab internalNotes={internalNotes} setInternalNotes={setInternalNotes} isEditMode={isEditMode} /></TabsContent>
            </div>
          </Tabs>
        </div>
        <div className="lg:col-span-4 space-y-6">
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-indigo-600 text-white">
            <CardHeader className="p-8 pb-4"><CardTitle className="text-sm font-black uppercase opacity-80">會計對帳摘要</CardTitle></CardHeader>
            <CardContent className="p-8 pt-0 space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center"><span className="text-sm opacity-80 font-bold">訂單總額 (Revenue)</span><span className="text-xl font-black">${totalValue.toFixed(1)}</span></div>
                <div className="flex justify-between items-center"><span className="text-sm opacity-80 font-bold">累計已收 (Collected)</span><span className="text-xl font-black text-green-300">${totalPaidValue.toFixed(1)}</span></div>
              </div>
              <Separator className="bg-white/20" />
              <div className="flex justify-between items-center"><span className="text-base font-black uppercase">未清餘額 Balance</span><span className={cn("text-4xl font-black", totalPaidValue >= totalValue && totalValue > 0 ? "text-green-400" : "text-white")}>${Math.max(0, totalValue - totalPaidValue).toFixed(1)}</span></div>
            </CardContent>
          </Card>
        </div>
      </div>

      <AlertDialog open={isCancelConfirmOpen} onOpenChange={setIsCancelConfirmOpen}>
        <AlertDialogContent className="rounded-[2.5rem] border-none shadow-2xl">
          <AlertDialogHeader>
            <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center text-red-600 mx-auto mb-4">
              <AlertTriangle className="h-8 w-8" />
            </div>
            <AlertDialogTitle className="text-2xl font-black font-headline text-center">確認取消訂單？</AlertDialogTitle>
            <AlertDialogDescription className="text-center pt-2">此操作將執行庫存歸還與狀態更新。不可撤銷。</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-3">
            <Button variant="ghost" className="flex-1 rounded-xl h-12 font-bold" onClick={() => setIsCancelConfirmOpen(false)}>返回</Button>
            <Button className="flex-[1.5] bg-destructive text-white rounded-xl h-12 font-black shadow-lg" onClick={() => { setIsCancelConfirmOpen(false); handleSave(); }} disabled={loading}>確認執行</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isNotifyPromptOpen} onOpenChange={setIsNotifyConfirmOpen}>
        <AlertDialogContent className="rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden">
          <div className="p-8 bg-primary text-primary-foreground text-center space-y-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12"><BellRing className="h-24 w-24" /></div>
            <div className="h-16 w-16 bg-white/20 rounded-full flex items-center justify-center mx-auto border-2 border-white/20 relative z-10"><Mail className="h-8 w-8" /></div>
            <div className="space-y-1 relative z-10">
              <AlertDialogTitle className="text-2xl font-black font-headline">是否發送狀態更新通知？</AlertDialogTitle>
              <AlertDialogDescription className="text-primary-foreground/80 font-medium">
                訂單狀態已更新。建議向顧客發送電郵通知。
              </AlertDialogDescription>
            </div>
          </div>
          <div className="p-8 bg-white space-y-6">
            <div className="flex items-center justify-between p-4 bg-muted/20 rounded-2xl border border-dashed">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">建議模板 Suggested Template</p>
                <p className="font-bold text-slate-900">{EMAIL_TEMPLATES.find(t => t.id === pendingTemplateId)?.label || pendingTemplateId}</p>
              </div>
              <Badge className="bg-primary text-primary-foreground border-none font-black h-6">AUTO MATCH</Badge>
            </div>
            <div className="flex gap-3">
              <AlertDialogCancel className="flex-1 h-14 rounded-2xl font-bold border-none bg-muted/50 hover:bg-muted" onClick={() => setIsNotifyConfirmOpen(false)}>僅儲存不發送</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => pendingTemplateId && handleSendNotification(pendingTemplateId)} 
                className="flex-[2] h-14 bg-primary text-primary-foreground font-black text-lg rounded-2xl shadow-xl hover:scale-[1.02] transition-all gap-2"
                disabled={!!isNotifying}
              >
                {isNotifying ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-4 w-4" />}
                確認並發送通知
              </AlertDialogAction>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
