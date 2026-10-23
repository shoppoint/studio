
"use client";

import { useState, useMemo, useEffect, Suspense, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  CheckCircle2, 
  Loader2, 
  ShieldCheck, 
  ArrowLeft,
  ShoppingBag,
  Zap,
  AlertTriangle,
  ArrowRight,
  Clock,
  Sparkles,
  User,
  ShoppingBasket,
  Check,
  CreditCard,
  Truck,
  XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useI18n } from "@/lib/i18n/i18n-context";
import { useUser, useAuth, useFirestore, useCollection, useDoc } from "@/firebase";
import { signInAnonymously } from "firebase/auth";
import { collection, query, where, doc, getDoc, getDocs, limit, updateDoc, serverTimestamp } from "firebase/firestore";
import { useCart } from "@/lib/cart-context";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

import { calculateDiscountForPromo, getPromoShortLabel } from "@/lib/shop-utils";
import { validateStockAvailability } from "@/services/checkout-service";
import { submitOrderAction } from "@/app/actions/checkout-actions";
import { 
  ContactSection, 
  BillingAddressSection, 
  ShippingAddressSection, 
  ShippingMethodSection, 
  PaymentDiscountSection, 
  OrderReviewSection,
  CheckoutSummary 
} from "@/components/checkout/CheckoutComponents";
import { Card, CardContent } from "@/components/ui/card";
import { LocationPickerDialog } from "@/components/checkout/LocationPickerDialog";
import { HARDCODED_SHIPPING_ZONES } from "@/lib/constants/shipping-data";
import { PAYMENT_METHODS } from "@/lib/constants/payment-methods";
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
import { trackBeginCheckout, trackAddPaymentInfo } from "@/lib/analytics";

// 定義結帳流程步驟
const steps = [
  { id: 1, zh: "聯絡資訊", en: "Contact" },
  { id: 2, zh: "配送方式", en: "Shipping" },
  { id: 3, zh: "付款折扣", en: "Payment" },
  { id: 4, zh: "最後核對", en: "Review" }
];

function CheckoutContent() {
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const router = useRouter();
  const db = useFirestore();
  const auth = useAuth();
  const { user, userData, loading: userLoading } = useUser();
  const { items, subtotal, clearCart, appliedPromo: appliedCouponInfo, setAppliedPromo: setAppliedCouponInfo } = useCart();
  
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [couponCode, setCouponCode] = useState(appliedCouponInfo?.code || "");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

  const isEn = lang === 'en';
  const isSubmittingRef = useRef(false);

  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [pendingRedirectUrl, setPendingRedirectUrl] = useState<string | null>(null);
  const [pendingOrderId, setPendingOrderId] = useState<string | null>(null);
  const [recoveryOrderId, setRecoveryOrderId] = useState<string | null>(null);
  const [isRecovering, setIsRecovering] = useState(false);

  const [contactData, setContactData] = useState({ firstName: "", lastName: "", name: "", email: "", phone: "", companyName: "" });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [shippingAddress, setShippingAddress] = useState<any>({ country: "Hong Kong", area: "", district: "", subDistrict: "", street: "", building: "", floor: "", flat: "", block: "" });
  const [billingAddress, setBillingAddress] = useState<any>({ country: "Hong Kong", area: "", district: "", subDistrict: "", street: "", building: "", floor: "", flat: "", block: "" });
  const [sameAsBilling, setSameAsBilling] = useState(true);
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<any | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("visa");
  const [pointsToUse, setPointsToUse] = useState(0);
  const [subscribeNewsletter, setSubscribeNewsletter] = useState(true);
  const [saveAddressToAccount, setSaveAddressToAccount] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [packagingPreference, setPackagingPreference] = useState("eco");

  const [isSfPickerOpen, setIsSfPickerOpen] = useState(false);
  const [isHkPostPickerOpen, setIsHkPostPickerOpen] = useState(false);
  const [isStorePickerOpen, setIsStorePickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");
  const [allSfLocations, setAllSfLocations] = useState<any[]>([]);
  const [allHkPostLocations, setAllHkPostLocations] = useState<any[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  const selectedItems = useMemo(() => items.filter(i => i.selected !== false), [items]);

  useEffect(() => { 
    setMounted(true); 

    // Step 1 預熱：進入結帳頁面時喚醒伺服器
    if (process.env.NODE_ENV === 'production') {
      fetch('/api/checkout/verify?orderId=warmup', { method: 'GET', cache: 'no-store' }).catch(() => {});
    }

    const lastAttemptId = sessionStorage.getItem('last_attempted_order_id');
    if (lastAttemptId) setRecoveryOrderId(lastAttemptId);

    // 追蹤：進入結帳頁面 (漏斗第一步)
    if (selectedItems.length > 0) {
      trackBeginCheckout(selectedItems, subtotal);
    }
  }, []);

  /**
   * 進入第四步或下單前再次檢核 (Point 3: Checkout Step 4 Guard)
   */
  useEffect(() => {
    if (step === 4 && db && selectedItems.length > 0) {
      // Step 4 預熱：進入最後核對步驟時再次熱機，防止填表過久導致伺服器進入休眠
      if (process.env.NODE_ENV === 'production') {
        fetch('/api/checkout/verify?orderId=warmup', { method: 'GET', cache: 'no-store' }).catch(() => {});
      }

      const runFinalGuard = async () => {
        const stockIssues = await validateStockAvailability(db, selectedItems);
        if (stockIssues.length > 0) {
          toast({ 
            title: isEn ? "Availability Update" : "庫存狀況變動", 
            description: isEn 
              ? `Sorry, ${stockIssues.join(", ")} is now out of stock.` 
              : `很抱歉，${stockIssues.join(", ")} 剛剛已售罄。請調整訂單內容。`,
            variant: "warning" 
          });
          setStep(1); 
        }
      };
      runFinalGuard();
    }
    
    // 追蹤：進入支付資訊步驟 (漏斗第三步)
    if (step === 3) {
      trackAddPaymentInfo(paymentMethod, subtotal);
    }
  }, [step, paymentMethod, subtotal, db, selectedItems, isEn]);

  useEffect(() => {
    if (mounted && !userLoading && !user && auth) {
      signInAnonymously(auth).catch(err => console.error("[Checkout] Anonymous login failed:", err.message));
    }
  }, [mounted, userLoading, user, auth]);

  useEffect(() => {
    const loadLogistics = async () => {
      try {
        const sfPaths = ['/data/sf-locations-hk.json', '/data/sf-locations-kln.json', '/data/sf-locations-nt.json', '/data/sf-locations-nt-2.json', '/data/sf-locations-islands.json', '/data/sf-locations-extra.json'];
        const hkpPaths = ['/data/hkpost-locations-hk.json', '/data/hkpost-locations-kln.json', '/data/hkpost-locations-nt.json'];
        const safeFetch = async (p: string) => { try { const r = await fetch(p); return r.ok ? await r.json() : { locations: [] }; } catch { return { locations: [] }; } };
        const [sfRes, hkpRes] = await Promise.all([Promise.all(sfPaths.map(safeFetch)), Promise.all(hkpPaths.map(safeFetch))]);
        setAllSfLocations(sfRes.flatMap(r => r.locations || [])); setAllHkPostLocations(hkpRes.flatMap(r => r.locations || []));
      } finally { setIsDataLoading(false); }
    };
    loadLogistics();
  }, []);

  useEffect(() => {
    if (userData && user && !user.isAnonymous) {
      const names = (userData.displayName || "").trim().split(/\s+/);
      setContactData(prev => ({ ...prev, firstName: names.length > 1 ? names.slice(1).join(" ") : "", lastName: names[0] || "", email: user?.email || "", phone: userData.phone || "", companyName: userData.companyName || "" }));
    }
  }, [userData, user]);

  const promosQuery = useMemo(() => db ? query(collection(db, 'promotions'), where('status', '==', 'active')) : null, [db]);
  const { data: allPromos } = useCollection<any>(promosQuery);
  const locationsQuery = useMemo(() => db ? query(collection(db, 'locations'), where('status', '==', 'Active')) : null, [db]);
  const { data: locations, loading: locationsLoading } = useCollection<any>(locationsQuery);
  const { data: loyaltyConfig } = useDoc<any>(db ? doc(db, 'config', 'loyalty') : null);
  const { data: membershipConfig } = useDoc<any>(db ? doc(db, 'config', 'membership') : null);

  const defaultLocation = useMemo(() => locations?.find((loc: any) => loc.isDefaultFulfillmentSource), [locations]);

  const promoInfo = useMemo(() => {
    const activeItems = selectedItems;
    if (!allPromos || subtotal <= 0 || !activeItems.length) return { discount: 0, appliedPromos: [] as any[], cashPayment: 0 };
    const today = format(new Date(), "yyyy-MM-dd");
    const candidates = allPromos.filter(p => {
      if (p.isPublic === false && (!appliedCouponInfo || p.code !== appliedCouponInfo.code)) return false;
      if (!appliedCouponInfo && p.code) return false;
      return (!p.startsAt || p.startsAt <= today) && (!p.endsAt || p.endsAt >= today);
    }).map(p => {
      const res = calculateDiscountForPromo(p, activeItems, subtotal, userData);
      return { ...p, discount: res.discount, isPayment: res.isPayment, displayName: getPromoShortLabel(p, lang) };
    }).filter(r => r.discount > 0);
    const stackable = candidates.filter(p => p.isStackable !== false);
    const exclusive = candidates.filter(p => p.isStackable === false);
    let bestExclusive = exclusive[0];
    exclusive.forEach(p => { if (p.discount > (bestExclusive?.discount || 0)) bestExclusive = p; });
    const finalApplied = bestExclusive ? [bestExclusive] : stackable;
    const marketingDiscount = finalApplied.filter(p => !p.isPayment).reduce((sum, p) => sum + p.discount, 0);
    const cashPayment = finalApplied.filter(p => p.isPayment).reduce((sum, p) => sum + p.discount, 0);
    return { discount: marketingDiscount, appliedPromos: finalApplied, cashPayment };
  }, [selectedItems, subtotal, allPromos, appliedCouponInfo, lang, userData]);

  const availableMethods = useMemo(() => {
    const targetCountry = (sameAsBilling ? billingAddress.country : shippingAddress.country) || "Hong Kong";
    const zone = HARDCODED_SHIPPING_ZONES.find(z => z.countries.some(c => c.toLowerCase().includes(targetCountry.toLowerCase())));
    if (!zone) return [];
    return Object.entries(zone.methods).filter(([_, config]: [string, any]) => config.enabled).map(([id, config]: [string, any]) => ({ id, ...config }));
  }, [shippingAddress.country, billingAddress.country, sameAsBilling]);
  
  const selectedMethod = useMemo(() => availableMethods.find((m: any) => m.id === selectedMethodId), [availableMethods, selectedMethodId]);
  const shippingFee = useMemo(() => { 
    if (!selectedMethod || selectedMethod.collect === true) return 0; 
    const threshold = Number(selectedMethod.threshold) || 0; 
    const netTotal = subtotal - promoInfo.discount; 
    return (threshold > 0 && netTotal >= threshold) ? 0 : (Number(selectedMethod.fee) || 0); 
  }, [selectedMethod, subtotal, promoInfo.discount]);
  
  const pointsToCashRatio = Number(loyaltyConfig?.pointsToCash) || 100;
  const pointsValue = (Number(pointsToUse) || 0) / pointsToCashRatio;
  const finalTotal = Math.ceil(Math.max(0, subtotal + shippingFee - promoInfo.discount) * 10) / 10;
  const balanceDue = Math.max(0, finalTotal - pointsValue - promoInfo.cashPayment);
  const earnedPoints = useMemo(() => { const ratio = Number(loyaltyConfig?.spendToPoints) || 10; const tierMultiplier = Number(membershipConfig?.tiers?.[userData?.tier || 'classic']?.multiplier) || 1.0; return Math.floor((Math.max(0, subtotal - promoInfo.discount - pointsValue) / ratio) * tierMultiplier); }, [subtotal, promoInfo.discount, pointsValue, loyaltyConfig, userData?.tier, membershipConfig]);

  const handleApplyCoupon = async (code: string) => {
    if (!code.trim() || !db) { setAppliedCouponInfo(null); return; }
    setIsApplyingCoupon(true);
    try {
      const q = query(collection(db, 'promotions'), where('code', '==', code.trim().toUpperCase()), where('status', '==', 'active'), limit(1));
      const snap = await getDocs(q);
      if (snap.empty) { toast({ title: lang === 'en' ? "Invalid Code" : "無效優惠碼", variant: "destructive" }); setAppliedCouponInfo(null); }
      else { setAppliedCouponInfo({ id: snap.docs[0].id, ...snap.docs[0].data() }); toast({ title: lang === 'en' ? "Code Applied" : "優惠碼已套用" }); }
    } finally { setIsApplyingCoupon(false); }
  };

  const handleResumeOrder = async () => {
    if (!recoveryOrderId || !db) return;
    setIsRecovering(true);
    try {
      const snap = await getDoc(doc(db, 'orders', recoveryOrderId));
      if (snap.exists() && snap.data().paymentStatus === 'paid') router.push(`/checkout/success?orderId=${recoveryOrderId}`);
      else { sessionStorage.removeItem('last_attempted_order_id'); setRecoveryOrderId(null); toast({ title: "訂單已結清或已失效" }); }
    } catch (e) { setRecoveryOrderId(null); } finally { setIsRecovering(false); }
  };

  /**
   * 結帳步驟一過渡驗證 (Point 2: Step 1 Guard)
   */
  const handleStep1Next = async () => {
    if (!contactData.lastName || !contactData.email || !contactData.phone) { 
      setFormErrors({lastName: "Required"}); 
      toast({title: isEn ? "Please fill contact details" : "請填寫聯絡資料"}); 
      return; 
    }
    
    setIsValidating(true);
    try {
      const stockIssues = await validateStockAvailability(db!, selectedItems);
      if (stockIssues.length > 0) {
        toast({ title: isEn ? "Inventory Alert" : "庫存異動提示", description: isEn ? `Sorry, ${stockIssues.join(", ")} is out of stock.` : `很抱歉，${stockIssues.join(", ")} 已售罄。`, variant: "warning" });
        return;
      }
      setStep(2);
      window.scrollTo(0,0);
    } finally {
      setIsValidating(false);
    }
  };

  /**
   * 最終提交訂單防線 (Point 4: Submission Guard)
   */
  const handlePlaceOrder = async () => {
    if (isSubmittingRef.current || loading || !db) return;
    if (locationsLoading || !defaultLocation?.id) { toast({ title: "系統準備中", description: "正在載入配送與分店資料，請稍候再試。" }); return; }
    
    isSubmittingRef.current = true; 
    setLoading(true);

    try {
      const stockIssues = await validateStockAvailability(db, selectedItems);
      if (stockIssues.length > 0) { 
        toast({ 
          title: lang === 'en' ? "Stock Changed" : "庫存狀況變動", 
          description: lang === 'en' ? `Sorry, ${stockIssues.join(", ")} is out of stock.` : `很抱議，${stockIssues.join(", ")} 剛剛已售罄。`, 
          variant: "warning" 
        }); 
        isSubmittingRef.current = false; 
        setLoading(false); 
        setStep(1); 
        return; 
      }

      const cleanMethod = selectedMethod ? JSON.parse(JSON.stringify(selectedMethod)) : null;
      const cleanPoint = selectedPoint ? JSON.parse(JSON.stringify(selectedPoint)) : null;
      
      const result = await submitOrderAction({ 
        items: selectedItems, contactData, shippingAddress: sameAsBilling ? billingAddress : shippingAddress, billingAddress, 
        selectedMethod: cleanMethod, selectedPoint: cleanPoint, paymentMethod, subtotal, shippingFee, discountAmount: promoInfo.discount, 
        total: finalTotal, balanceDue, earnedPoints, pointsToUse, pointsValue, 
        appliedPromos: promoInfo.appliedPromos.map(p => ({ id: p.id, displayName: p.displayName, discount: p.discount })), 
        userId: user?.uid || null, lang: lang || 'zh-HK', packagingPreference, subscribeNewsletter, saveAddressToAccount, defaultLocationId: defaultLocation.id 
      });

      if (result && result.success && result.orderId) {
        setPendingOrderId(result.orderId);
        let targetUrl = `/checkout/success?orderId=${result.orderId}&method=${paymentMethod}`;
        if (result.checkoutUrl) {
          targetUrl = result.checkoutUrl;
        } else if (result.paymentError) {
          targetUrl = `/checkout/success?orderId=${result.orderId}&status=failed&error=${encodeURIComponent(result.paymentError)}`;
        }
        setPendingRedirectUrl(targetUrl); 
        setIsConfirmDialogOpen(true); 
        setLoading(false);
      } else {
        throw new Error((result as any)?.message || (isEn ? "No response from server. Please try again or contact us via WhatsApp." : "伺服器無回應，請嘗試再次提交。如問題持續，請即時透過 WhatsApp 或 DM 聯絡我們。"));
      }
    } catch (e: any) { 
      toast({ 
        title: isEn ? "Order Failed" : "提交失敗", 
        description: e.message || (isEn ? "Submission timed out. Please check your connection or contact us via WhatsApp." : "訂單提交超時，請檢查網絡連線。如無法完成下單，請即時透過 WhatsApp 或 DM 聯絡我們。"), 
        variant: "destructive" 
      }); 
      isSubmittingRef.current = false; 
      setLoading(false); 
    }
  };

  /**
   * 最終跳轉防禦邏輯 (V25 - 加固跳轉與確認)
   */
  const handleProceedToPayment = async () => {
    if (!pendingOrderId || loading || !db) return;
    
    setLoading(true);
    try {
      // 1. 同步執行確認更新，確保背景發信邏輯被正確觸發
      await updateDoc(doc(db, 'orders', pendingOrderId), { 
        isConfirmed: true, 
        updatedAt: serverTimestamp() 
      });

      clearCart();
      sessionStorage.setItem('last_attempted_order_id', pendingOrderId);

      // 2. 微延遲，給予資料庫寫入足夠緩衝時間
      await new Promise(resolve => setTimeout(resolve, 300));

      // 3. 實施跳轉
      if (pendingRedirectUrl) {
        window.location.assign(pendingRedirectUrl);
      } else {
        router.push(`/checkout/success?orderId=${pendingOrderId}`);
      }
    } catch (err) {
      console.warn("[Checkout] Payment redirect sequence failed:", err);
      // Fallback
      router.push(`/checkout/success?orderId=${pendingOrderId}`);
    }
  };

  const handleModifyOrder = async () => {
    if (!pendingOrderId || loading || !db) return;
    setLoading(true);
    try { 
      await updateDoc(doc(db, 'orders', pendingOrderId), { status: 'cancelled', updatedAt: serverTimestamp() }); 
      setIsConfirmDialogOpen(false); 
      toast({ title: "訂單已取消" }); 
      isSubmittingRef.current = false; 
      setLoading(false); 
    } catch (e) { 
      toast({ title: "取消失敗", variant: "destructive" }); 
      setLoading(false); 
    }
  };

  const handleMethodChange = (id: string) => {
    if (id !== selectedMethodId) {
      setSelectedMethodId(id);
      setSelectedPoint(null);
      setShippingAddress((prev: any) => ({ ...prev, area: "", district: "", subDistrict: "", street: "", building: "", floor: "", flat: "", block: "" }));
      setSameAsBilling(false);
    }
  };

  const handleSelectPoint = (p: any, type: string) => {
    const isEnMode = lang === 'en'; const newAddr = { ...shippingAddress };
    if (type === 'store') {
       const locAddr = p.address || {}; newAddr.area = locAddr.area; newAddr.district = locAddr.district; newAddr.subDistrict = locAddr.subDistrict;
       newAddr.street = isEnMode ? locAddr.street_en : locAddr.street_zh;
       newAddr.building = p.gmcStoreCode ? `[${p.gmcStoreCode}] ${isEnMode ? locAddr.building_en : locAddr.building_zh}` : (isEnMode ? locAddr.building_en : locAddr.building_zh);
       newAddr.floor = isEnMode ? locAddr.floor_en : locAddr.floor_zh; newAddr.flat = isEnMode ? locAddr.flat_en : locAddr.flat_zh;
    } else { newAddr.area = p.area_zh || p.area_en; newAddr.district = p.district_zh || p.district_en; newAddr.building = `[${p.code}] ${isEnMode ? p.name_en : p.name_zh}`; newAddr.street = isEnMode ? p.address_en : p.address_zh; }
    setShippingAddress(newAddr); setSameAsBilling(false); setSelectedPoint(p); setIsSfPickerOpen(false); setIsHkPostPickerOpen(false); setIsStorePickerOpen(false);
  };

  if (!mounted || userLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      {(loading || isValidating) && (<div className="fixed inset-0 z-[200] bg-white/90 backdrop-blur-md flex items-center justify-center"><div className="text-center space-y-6"><div className="relative h-20 w-20 mx-auto"><Loader2 className="h-20 w-20 animate-spin text-primary" /><ShieldCheck className="absolute inset-0 m-auto h-8 w-8 text-primary" /></div><p className="font-black text-xl tracking-tight">{isValidating ? "正在核對庫存..." : "正在安全處理您的訂單..."}</p></div></div>)}
      <main className="flex-grow container mx-auto px-4 py-12 max-w-7xl">
        <div className="flex items-center justify-center gap-4 md:gap-12 mb-12 overflow-x-auto no-scrollbar py-2">
          {steps.map(s => (<div key={s.id} className="flex flex-col items-center gap-2 min-w-[70px]"><div className={cn("h-10 w-10 md:h-12 md:w-12 rounded-full flex items-center justify-center border-2 font-black text-sm", step >= s.id ? "bg-primary border-primary text-primary-foreground shadow-md" : "bg-white border-muted text-muted-foreground opacity-50")}>{step > s.id ? <CheckCircle2 className="h-4 w-4" /> : s.id}</div><span className={cn("text-[10px] md:text-xs font-black uppercase tracking-tight", step >= s.id ? "text-slate-900" : "text-muted-foreground opacity-40")}>{isEn ? s.en : s.zh}</span></div>))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8 space-y-8">
            {step === 1 && (<div className="space-y-6 animate-in fade-in"><ContactSection contactData={contactData} onUpdate={(f,v)=>setContactData(p=>({...p,[f]:v}))} t={t} errors={formErrors} isLoggedIn={!!user && !user.isAnonymous} /><BillingAddressSection addressData={billingAddress} onUpdate={(t, data)=>setBillingAddress(data)} t={t} errors={formErrors} isLoggedIn={!!user && !user.isAnonymous} /><div className="flex justify-end pt-4"><Button className="h-14 px-12 rounded-2xl font-black text-lg" onClick={handleStep1Next}>下一步</Button></div></div>)}
            {step === 2 && (<div className="space-y-6 animate-in fade-in"><ShippingMethodSection availableMethods={availableMethods} selectedMethodId={selectedMethodId} onSelectMethod={handleMethodChange} subtotal={subtotal} selectedPoint={selectedPoint} onOpenSf={()=>setIsSfPickerOpen(true)} onOpenHkPost={()=>setIsHkPostPickerOpen(true)} onOpenStore={()=>setIsStorePickerOpen(true)} isEn={isEn} t={t} /><ShippingAddressSection addressData={shippingAddress} onUpdate={(t, data)=>{ setShippingAddress(data); setSameAsBilling(false); }} t={t} selectedPoint={selectedPoint} sameAsBilling={sameAsBilling} setSameAsBilling={setSameAsBilling} isLoggedIn={!!user && !user.isAnonymous} /><div className="flex justify-between pt-4"><Button variant="ghost" className="h-14 px-8 rounded-2xl font-bold" onClick={()=>setStep(1)}>返回</Button><Button className="h-14 px-12 rounded-2xl font-black text-lg" disabled={!selectedMethodId} onClick={()=>{ setStep(3); window.scrollTo(0,0); }}>下一步</Button></div></div>)}
            {step === 3 && (<div className="space-y-6 animate-in fade-in"><PaymentDiscountSection paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod} pointsToUse={pointsToUse} setPointsToUse={setPointsToUse} maxPoints={userData?.points || 0} loyaltyConfig={loyaltyConfig} subtotal={subtotal} shippingFee={shippingFee} autoDiscount={promoInfo.discount} cashPayment={promoInfo.cashPayment} isPickup={selectedMethod?.isPickup} t={t} couponCode={couponCode} setCouponCode={setCouponCode} onApplyCoupon={handleApplyCoupon} isApplyingCoupon={isApplyingCoupon} appliedCoupon={appliedCouponInfo} balanceDue={balanceDue} /><div className="flex justify-between pt-4"><Button variant="ghost" className="h-14 px-8 rounded-2xl font-bold" onClick={()=>setStep(2)}>返回</Button><Button className="h-14 px-12 rounded-2xl font-black text-lg" onClick={()=>{ setStep(4); window.scrollTo(0,0); }}>最後核對</Button></div></div>)}
            {step === 4 && (<div className="space-y-6 animate-in fade-in"><OrderReviewSection contactData={contactData} shippingAddress={sameAsBilling ? billingAddress : shippingAddress} billingAddress={billingAddress} selectedMethodName={selectedMethod ? (isEn ? selectedMethod.name_en : selectedMethod.name_zh) : ""} selectedPoint={selectedPoint} paymentMethod={paymentMethod} selectedItems={selectedItems} subscribeNewsletter={subscribeNewsletter} setSubscribeNewsletter={setSubscribeNewsletter} saveAddressToAccount={saveAddressToAccount} setSaveAddressToAccount={setSaveAddressToAccount} isLoggedIn={!!user && !user.isAnonymous} agreedToTerms={agreedToTerms} setAgreedToTerms={setAgreedToTerms} isEn={isEn} t={t} balanceDue={balanceDue} packagingPreference={packagingPreference} setPackagingPreference={setPackagingPreference} /><div className="flex justify-between pt-4"><Button variant="ghost" className="h-14 px-8 rounded-2xl font-bold" onClick={()=>setStep(3)} disabled={loading}>返回</Button><Button className="h-14 px-16 rounded-2xl font-black text-xl bg-orange-600 hover:bg-orange-700 text-white" disabled={!agreedToTerms || loading || locationsLoading} onClick={handlePlaceOrder}>{loading ? <Loader2 className="h-6 w-6 animate-spin" /> : "確認下單"}</Button></div></div>)}
          </div>
          <div className="lg:col-span-4"><CheckoutSummary items={selectedItems} subtotal={subtotal} shippingFee={shippingFee} total={finalTotal} balanceDue={balanceDue} isPickup={selectedMethod?.isPickup} pointsDiscount={pointsValue} autoDiscount={promoInfo.discount} cashPayment={promoInfo.cashPayment} appliedPromos={promoInfo.appliedPromos} expectedPoints={earnedPoints} methodSelected={!!selectedMethodId} isFreightCollect={!!selectedMethod?.collect} isLoggedIn={!!user && !user.isAnonymous} /></div>
        </div>
      </main>
      <Footer />
      <AlertDialog open={isConfirmDialogOpen} onOpenChange={() => {}}><AlertDialogContent className="rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden z-[300]"><div className="p-10 text-center space-y-6 relative overflow-hidden bg-primary text-primary-foreground"><div className="h-20 w-20 bg-white/20 rounded-full flex items-center justify-center mx-auto border-4 border-white/20 relative z-10"><Check className="h-10 w-10 stroke-[4]" /></div><div className="space-y-2 relative z-10"><AlertDialogTitle className="text-3xl font-black font-headline tracking-tighter">訂單已準備就緒</AlertDialogTitle><AlertDialogDescription className="text-base font-medium text-primary-foreground/90">{isEn ? `Click confirm to proceed with payment.` : `請點擊下方按鈕確認下單並進行支付。`}</AlertDialogDescription></div></div><div className="p-10 bg-white space-y-4"><Button onClick={handleProceedToPayment} disabled={loading} className="w-full h-16 bg-slate-900 text-white font-black text-xl rounded-2xl shadow-xl hover:scale-[1.02] transition-all gap-3 active:scale-95">{loading ? <Loader2 className="h-6 w-6 animate-spin" /> : (<>確認並前往 <ArrowRight className="h-6 w-6" /></>)}</Button><Button variant="ghost" onClick={handleModifyOrder} disabled={loading} className="w-full h-12 rounded-xl font-bold border-none bg-muted/50 hover:bg-muted text-muted-foreground">修改訂單</Button></div></AlertDialogContent></AlertDialog>
      <LocationPickerDialog isOpen={isSfPickerOpen} onOpenChange={setIsSfPickerOpen} title="選擇順豐網點" data={allSfLocations} onSelect={p => handleSelectPoint(p, 'sf')} search={pickerSearch} onSearchChange={setPickerSearch} isEn={isEn} isLoading={isDataLoading} />
      <LocationPickerDialog isOpen={isHkPostPickerOpen} onOpenChange={setIsHkPostPickerOpen} title="選擇智郵站" data={allHkPostLocations} onSelect={p => handleSelectPoint(p, 'hkpost')} search={pickerSearch} onSearchChange={setPickerSearch} isEn={isEn} isLoading={isDataLoading} />
      <LocationPickerDialog isOpen={isStorePickerOpen} onOpenChange={setIsStorePickerOpen} title="選擇取貨分店" data={locations?.filter((l: any) => l.isPickupEnabled).map((l: any) => ({ ...l, code: l.gmcStoreCode || l.id })) || []} onSelect={p => handleSelectPoint(p, 'store')} search={pickerSearch} onSearchChange={setPickerSearch} isEn={isEn} />
    </div>
  );
}

export default function CheckoutPage() {
  return (<Suspense fallback={null}><CheckoutContent /></Suspense>);
}
