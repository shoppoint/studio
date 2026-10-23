
"use client";

import { useState, useMemo, useEffect, Suspense, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  Plus, 
  Loader2, 
  X, 
  AlertTriangle, 
  ShieldAlert, 
  LogOut, 
  ChevronLeft, 
  CheckCircle2,
  Clock,
  User,
  ArrowRight,
  Smartphone,
  Info,
  RefreshCcw,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/i18n-context";
import { useToast } from "@/hooks/use-toast";
import { useUser, useAuth, useCollection, useDoc, useFirestore } from "@/firebase";
import { signOut } from "firebase/auth";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { 
  collection, 
  query, 
  orderBy, 
  where, 
  doc, 
  serverTimestamp, 
  getDocs, 
  limit,
  runTransaction,
  increment,
  deleteDoc,
  setDoc,
  getDoc,
  Timestamp
} from "firebase/firestore";
import { format, parseISO, startOfDay, endOfDay, isWithinInterval } from "date-fns";
import { calculateDiscountForPromo, getPromoShortLabel } from "@/lib/shop-utils";

// Modular POS Components
import { POSHeader } from "@/components/pos/POSHeader";
import { ProductExplorer } from "@/components/pos/ProductExplorer";
import { MemberPicker } from "@/components/pos/MemberPicker";
import { CheckoutDialog } from "@/components/pos/CheckoutDialog";
import { POSCart } from "@/components/pos/POSCart";
import { HistoryDialog } from "@/components/pos/HistoryDialog";
import { ReportDialog } from "@/components/pos/ReportDialog";
import { RegisterDialog } from "@/components/pos/RegisterDialog";
import { SettleDialog } from "@/components/pos/SettleDialog";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

// Print Templates
import { generateReceiptHtml, generateReportHtml } from "@/lib/print-templates";

interface CartItem {
  cartItemId: string;
  id: string;
  name: string;
  sku: string;
  price: number; 
  qty: number;
  discount: number;
  discountType: "percent" | "amount";
  image: string;
  isInternalGift: boolean;
  categories: string[]; 
  brand: string;
}

interface CartSession {
  id: string;
  index: number;
  items: CartItem[];
  linkedMember: any | null;
  manualCouponInfo: any | null;
  discountType: "percent" | "amount";
  discountValue: string;
  pointsToUse: string;
  couponCode: string;
  reservedOrderId?: string; 
  originalReservedItems?: CartItem[];
  createdAt?: any; 
}

function POSContent() {
  const { lang, t } = useI18n();
  const { toast } = useToast();
  const { user, loading: authLoading, isShopManager, userData } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  const ADMIN_EMAILS = ['shoppoint.hk@gmail.com', 'bsconcept.hk@gmail.com'];
  const isAuthorizedEmail = user?.email && ADMIN_EMAILS.includes(user.email.toLowerCase());
  const hasAccess = isShopManager || isAuthorizedEmail;

  const [registerStatus, setRegisterStatus] = useState<"active" | "closed" | "loading" >("closed");
  const [currentLocationId, setCurrentLocationId] = useState("");
  const [openingFloat, setOpeningFloat] = useState("1000");

  const [carts, setCarts] = useState<CartSession[]>([
    { id: 'cart-1', index: 1, items: [], linkedMember: null, manualCouponInfo: null, discountType: "percent", discountValue: "", pointsToUse: "", couponCode: "" }
  ]);
  const [activeCartId, setActiveCartId] = useState('cart-1');

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("all");
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isSettleOpen, setIsSettleOpen] = useState(false);
  const [isMemberPickerOpen, setIsMemberPickerOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [lastOrder, setLastOrder] = useState<any>(null);

  const [isReservePromptOpen, setIsReservePromptOpen] = useState(false);
  const [reserveGuestName, setReserveGuestName] = useState("");
  const [reserveGuestPhone, setReserveGuestPhone] = useState("");

  const checkoutLockRef = useRef(false);

  const [reportStartDate, setReportStartDate] = useState(format(new Date(), "yyyy-MM-01"));
  const [reportEndDate, setReportEndDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const activeCart = useMemo(() => carts.find(c => c.id === activeCartId) || carts[0], [carts, activeCartId]);

  useEffect(() => {
    const savedStatus = localStorage.getItem("pos-register-status");
    const savedLocId = localStorage.getItem("pos-location-id");
    if (savedStatus === "active" && savedLocId) {
      setRegisterStatus("active");
      setCurrentLocationId(savedLocId);
    }
  }, []);

  const productsQuery = useMemo(() => (db && hasAccess) ? query(collection(db, 'public_products'), where('status', '==', 'Active'), where('showInPos', '==', true)) : null, [db, hasAccess]);
  const { data: products, loading: productsLoading } = useCollection<any>(productsQuery);

  const categoriesQuery = useMemo(() => db ? query(collection(db, 'categories'), where('isVisible', '==', true), orderBy('displayOrder', 'asc')) : null, [db]);
  const { data: categories } = useCollection<any>(categoriesQuery);

  const locationsQuery = useMemo(() => db ? query(collection(db, 'locations'), where('status', '==', 'Active'), where('type', '==', 'physical')) : null, [db]);
  const { data: locations } = useCollection<any>(locationsQuery);

  const promosQuery = useMemo(() => db ? query(collection(db, 'promotions'), where('status', '==', 'active')) : null, [db]);
  const { data: allPromos } = useCollection<any>(promosQuery);

  const loyaltyConfigRef = useMemo(() => db ? doc(db, 'config', 'loyalty') : null, [db]);
  const { data: loyaltyConfig } = useDoc<any>(loyaltyConfigRef);

  const posHistoryQuery = useMemo(() => (db && currentLocationId) ? query(collection(db, 'orders'), where('fulfillmentLocationId', '==', currentLocationId), orderBy('createdAt', 'desc'), limit(200)) : null, [db, currentLocationId]);
  const { data: orderHistory } = useCollection<any>(posHistoryQuery);

  const getLocalStock = useCallback((p: any) => {
    const todayStr = new Date().toISOString().split('T')[0];
    if (!p || !currentLocationId) return 0;
    if (Array.isArray(p.batches) && p.batches.length > 0) {
      return p.batches
        .filter((b: any) => b.locationId === currentLocationId && (!b.expiryDate || b.expiryDate >= todayStr))
        .reduce((sum: number, b: any) => sum + (Number(b.quantity) || 0), 0);
    }
    return Number(p.warehouseStock?.[currentLocationId] || 0);
  }, [currentLocationId]);

  const updateActiveCart = useCallback((updates: Partial<CartSession> | ((prev: CartSession) => Partial<CartSession>)) => {
    setCarts(prev => prev.map(c => {
      if (c.id === activeCartId) {
        const result = typeof updates === 'function' ? updates(c) : updates;
        return { ...c, ...result };
      }
      return c;
    }));
  }, [activeCartId]);

  const handleMemberSelect = useCallback((member: any) => {
    updateActiveCart({ linkedMember: member });
    setIsMemberPickerOpen(false);
    toast({ title: "會員已連結" });
  }, [updateActiveCart, toast]);

  const handleRemoveMember = useCallback(() => {
    updateActiveCart({ linkedMember: null, pointsToUse: "" });
    toast({ title: "已取消會員連結" });
  }, [updateActiveCart, toast]);

  const onCategoryChange = useCallback((val: string) => {
    setSelectedCategoryId(val);
  }, []);

  const applyCoupon = useCallback(async (code: string) => {
    if (!code || !db) return;
    setIsApplyingCoupon(true);
    try {
      const q = query(collection(db, 'promotions'), where('code', '==', code.toUpperCase()), where('status', '==', 'active'));
      const snap = await getDocs(q);
      if (snap.empty) {
        toast({ title: "無效代碼", variant: "destructive" });
        updateActiveCart({ manualCouponInfo: null });
      } else {
        const promo = { id: snap.docs[0].id, ...snap.docs[0].data() };
        updateActiveCart({ manualCouponInfo: promo, couponCode: code.toUpperCase() });
        toast({ title: "優惠碼已套用" });
      }
    } catch (e) {
      toast({ title: "系統錯誤", variant: "destructive" });
    } finally {
      setIsApplyingCoupon(false);
    }
  }, [db, toast, updateActiveCart]);

  const handlePrintReceipt = useCallback((order: any) => {
    const html = generateReceiptHtml(order);
    const win = window.open('', '_blank', 'width=400,height=600');
    if (win) { win.document.write(html); win.document.close(); }
  }, []);

  const handleLoadReservation = useCallback((order: any) => {
    const items = (order.items || []).map((it: any) => ({
      cartItemId: `res-${it.productId || it.id}-${Math.random()}`,
      id: it.productId || it.id,
      name: it.name,
      sku: it.sku || "--",
      price: it.price,
      qty: it.qty,
      discount: it.discount || 0,
      discountType: it.discountType || "amount",
      image: it.image || "",
      isInternalGift: it.isInternalGift || false,
      categories: it.categories || [],
      brand: it.brand || ""
    }));

    const newCartId = `cart-res-${order.id}`;
    setCarts(prev => [
      ...prev,
      {
        id: newCartId,
        index: Math.max(...prev.map(c => c.index)) + 1,
        items,
        linkedMember: order.customerId ? { 
          id: order.customerId, 
          displayName: order.customerInfo?.name,
          email: order.customerInfo?.email,
          phone: order.customerInfo?.phone
        } : null,
        manualCouponInfo: null,
        discountType: "amount",
        discountValue: "0",
        pointsToUse: "",
        couponCode: order.couponCode || "",
        reservedOrderId: order.id,
        originalReservedItems: items,
        createdAt: order.createdAt
      }
    ]);
    setActiveCartId(newCartId);
    setIsHistoryOpen(false);
    toast({ title: "已載入預留訂單" });
  }, [toast]);

  const getSalesSummary = useCallback((list: any[]) => {
    let total = 0; let count = 0; let cash = 0; let octopus = 0; let payme = 0; let kpayTotal = 0;
    const kpaySub: Record<string, number> = {};
    const itemMap: Record<string, number> = {};
    const orderList: any[] = [];

    list.forEach(o => {
      total += (o.total || 0); count++;
      (o.payments || []).forEach((p: any) => {
        const amt = Number(p.amount) || 0;
        if (p.method === 'cash') cash += amt;
        else if (p.method === 'octopus') octopus += amt;
        else if (p.method === 'payme') payme += amt;
        else if (p.method.startsWith('kpay_') || p.method === 'visa' || p.method === 'alipay' || p.method === 'wechat') { 
          kpayTotal += amt; 
          kpaySub[p.method] = (kpaySub[p.method] || 0) + amt; 
        }
      });
      (o.items || []).forEach((it: any) => { itemMap[it.name] = (itemMap[it.name] || 0) + (Number(it.qty) || 1); });
      
      orderList.push({
        id: o.id,
        orderId: o.orderId || o.id,
        time: o.createdAt?.seconds ? format(new Date(o.createdAt.seconds * 1000), 'HH:mm') : '--',
        method: o.paymentMethod || 'OTHER',
        discount: Number(o.discountAmount || 0),
        total: Number(o.total || 0)
      });
    });

    return { total, count, cash, octopus, payme, kpayTotal, kpaySub, itemMap, orderList };
  }, []);

  const reportSalesData = useMemo(() => {
    if (!orderHistory) return { total: 0, count: 0, cash: 0, octopus: 0, payme: 0, kpayTotal: 0, kpaySub: {}, itemMap: {}, orderList: [] };
    const start = startOfDay(parseISO(reportStartDate));
    const end = endOfDay(parseISO(reportEndDate));
    const filtered = orderHistory.filter(o => {
      if (o.sourceType !== 'POS') return false;
      const oDate = o.createdAt?.seconds ? new Date(o.createdAt.seconds * 1000) : new Date();
      return isWithinInterval(oDate, { start, end }) && o.status !== 'cancelled';
    });
    return getSalesSummary(filtered);
  }, [orderHistory, reportStartDate, reportEndDate, getSalesSummary]);

  const todaySalesData = useMemo(() => {
    if (!orderHistory) return { total: 0, count: 0, cash: 0, octopus: 0, payme: 0, kpayTotal: 0, kpaySub: {}, itemMap: {}, orderList: [] };
    const start = startOfDay(new Date());
    const end = endOfDay(new Date());
    const filtered = orderHistory.filter(o => {
      if (o.sourceType !== 'POS') return false;
      const oDate = o.createdAt?.seconds ? new Date(o.createdAt.seconds * 1000) : new Date();
      return isWithinInterval(oDate, { start, end }) && o.status !== 'cancelled';
    });
    return getSalesSummary(filtered);
  }, [orderHistory, getSalesSummary]);

  const currentLocName = useMemo(() => {
    if (!currentLocationId || !locations) return currentLocationId;
    const loc = locations.find((l: any) => l.id === currentLocationId);
    return loc ? (lang === 'en' ? (loc.name_en || loc.name_zh) : (loc.name_zh || loc.name_en)) : currentLocationId;
  }, [currentLocationId, locations, lang]);

  const handlePrintReport = useCallback(() => {
    const html = generateReportHtml(reportSalesData, `${reportStartDate} ~ ${reportEndDate}`, currentLocName);
    const win = window.open('', '_blank', 'width=800,height=900');
    if (win) { win.document.write(html); win.document.close(); }
  }, [reportSalesData, reportStartDate, reportEndDate, currentLocName]);

  const addToCart = useCallback((product: any, isGift = false) => {
    if (registerStatus !== 'active') { setIsRegisterOpen(true); return; }

    setCarts(prev => prev.map(c => {
      if (c.id !== activeCartId) return c;
      const existingIdx = c.items.findIndex(it => it.id === product.id && it.isInternalGift === isGift);
      
      const originalReservedQty = c.originalReservedItems?.find(it => it.id === product.id)?.qty || 0;
      const currentInCartQty = existingIdx > -1 ? c.items[existingIdx].qty : 0;
      const nextQty = currentInCartQty + 1;
      
      const additionalNeeded = nextQty - originalReservedQty;

      if (product.inventoryPolicy === 'Deny' && !isGift) {
        const localStock = getLocalStock(product);
        if (additionalNeeded > localStock) { 
          toast({ variant: "destructive", title: "庫存不足" }); 
          return c; 
        }
      }

      if (existingIdx > -1) {
        return { 
          ...c, 
          items: c.items.map((it, idx) => idx === existingIdx ? { ...it, qty: nextQty } : it) 
        };
      }

      const newItem: CartItem = {
        cartItemId: `${product.id}-${isGift ? 'gift' : 'sale'}-${Date.now()}`,
        id: product.id, name: product.productName_zh || product.productName_en, sku: product.sku || "--",
        price: isGift ? 0 : (product.salePrice > 0 ? product.salePrice : product.price),
        qty: 1, discount: 0, discountType: "amount", image: product.imageUrl || "", isInternalGift: isGift,
        categories: product.categories || [], brand: product.primaryBrand || product.brands || ""
      };
      return { ...c, items: [...c.items, newItem] };
    }));
  }, [registerStatus, activeCartId, getLocalStock, toast]);

  const addNewCart = () => { 
    const nextIndex = Math.max(...carts.map(c => c.index), 0) + 1; 
    const newId = `cart-${Date.now()}`; 
    setCarts(prev => [...prev, { id: newId, index: nextIndex, items: [], linkedMember: null, manualCouponInfo: null, discountType: "percent", discountValue: "", pointsToUse: "", couponCode: "" }]); 
    setActiveCartId(newId); 
  };
  
  const removeCart = (id: string) => { 
    if (carts.length === 1) { 
      updateActiveCart({ items: [], linkedMember: null, manualCouponInfo: null, discountValue: "", pointsToUse: "", couponCode: "", reservedOrderId: undefined, originalReservedItems: undefined }); 
      return; 
    } 
    const next = carts.filter(c => c.id !== id); 
    if (activeCartId === id) {
      const targetId = next[0].id;
      setActiveCartId(targetId);
    }
    setCarts(next); 
  };

  const subtotalValue = useMemo(() => activeCart.items.reduce((acc, it) => { 
    const p = Number(it.price) || 0; 
    const d = it.discountType === 'percent' ? (p * (it.discount || 0) / 100) : (it.discount || 0); 
    return acc + ((p - d) * it.qty); 
  }, 0), [activeCart.items]);

  const promoInfo = useMemo(() => {
    if (!allPromos || !activeCart.items.length) return { discount: 0, appliedPromos: [] };
    const candidates = allPromos.filter(p => !p.code && p.isPublic !== false).map(p => {
      const res = calculateDiscountForPromo(p, activeCart.items, subtotalValue, activeCart.linkedMember);
      return { ...p, discount: res.discount, displayName: getPromoShortLabel(p, lang) };
    }).filter(r => r.discount > 0);
    const stackable = candidates.filter(p => p.isStackable !== false);
    const exclusive = candidates.filter(p => p.isStackable === false);
    let finalDiscount = stackable.reduce((s, p) => s + p.discount, 0);
    let finalApplied = stackable;
    exclusive.forEach(p => { if (p.discount > finalDiscount) { finalDiscount = p.discount; finalApplied = [p]; } });
    return { discount: finalDiscount, appliedPromos: finalApplied };
  }, [allPromos, activeCart.items, subtotalValue, activeCart.linkedMember, lang]);

  const discountInfo = useMemo(() => {
    const manualVal = Number(activeCart.discountValue) || 0;
    const manual = activeCart.discountType === 'percent' ? (subtotalValue * manualVal / 100) : manualVal;
    const promoNames = promoInfo.appliedPromos.map(p => p.displayName).join(' + ');
    const label = promoNames || (manual > 0 ? "手動折扣" : "");
    return { amount: manual + promoInfo.discount, name: label, isAuto: promoInfo.discount > 0, appliedPromos: promoInfo.appliedPromos, manualAmount: manual };
  }, [activeCart.discountValue, activeCart.discountType, subtotalValue, promoInfo]);
  
  const pointsToCashRatio = Number(loyaltyConfig?.pointsToCash) || 100;
  const pointsValue = (Number(activeCart.pointsToUse) || 0) / pointsToCashRatio;

  const finalTotal = Math.ceil(Math.max(0, subtotalValue - discountInfo.amount - pointsValue) * 10) / 10;

  /**
   * 結帳處理 (V26 修復版：使用 set { merge: true } 防止訪客帳號缺失報錯)
   */
  const handleCheckoutComplete = async (payments: any[]) => {
    if (checkoutLockRef.current) return; 
    checkoutLockRef.current = true; 
    setIsProcessing(true);
    const todayStr = new Date().toISOString().split('T')[0];
    
    const timestampPart = Date.now().toString().slice(-8);
    const randomPart = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    const newOrderId = `${timestampPart}${randomPart}`;
    
    const orderId = activeCart.reservedOrderId || newOrderId;
    const finalPayments = [...payments];
    const ptsUsed = Number(activeCart.pointsToUse) || 0;
    
    if (ptsUsed > 0) {
      finalPayments.push({
        method: 'points_redemption',
        amount: pointsValue,
        points: ptsUsed,
        date: format(new Date(), 'yyyy-MM-dd HH:mm')
      });
    }

    const primaryPayment = finalPayments.length > 0 
      ? finalPayments.reduce((max, p) => (Number(p.amount) > Number(max.amount) ? p : max), finalPayments[0]) 
      : null;
    const finalPaymentMethod = primaryPayment?.method || 'other';

    try {
      await runTransaction(db!, async (transaction) => {
        const webHub = locations?.find((l: any) => l.isDefaultFulfillmentSource);
        const webHubId = webHub?.id;

        const originalMap = new Map(); activeCart.originalReservedItems?.forEach(it => originalMap.set(it.id, (originalMap.get(it.id) || 0) + it.qty));
        const currentMap = new Map(); activeCart.items.forEach(it => currentMap.set(it.id, (currentMap.get(it.id) || 0) + it.qty));
        const pids = Array.from(new Set([...Array.from(originalMap.keys()), ...Array.from(currentMap.keys())])) as string[];
        const snaps = await Promise.all(pids.map(pid => transaction.get(doc(db!, 'public_products', pid))));
        
        const spendToPointsRatio = Number(loyaltyConfig?.spendToPoints) || 10;
        const ptsToAward = activeCart.linkedMember ? Math.floor(finalTotal / spendToPointsRatio) : 0;

        pids.forEach((pid, idx) => {
          const pSnap = snaps[idx]; if (!pSnap.exists()) return;
          const pData = pSnap.data(); const diff = (currentMap.get(pid) || 0) - (originalMap.get(pid) || 0);
          if (diff === 0) return;
          
          let batches = Array.isArray(pData.batches) ? [...pData.batches] : [];
          if (diff > 0) {
            let rem = diff;
            const validLocals = batches.filter(b => b.locationId === currentLocationId && (!b.expiryDate || b.expiryDate >= todayStr)).sort((a,b)=>(a.expiryDate||"9999").localeCompare(b.expiryDate||"9999"));
            for(const b of validLocals) { 
              if(rem <= 0) break; 
              if (b.quantity > 0) {
                const deduct = Math.min(b.quantity, rem); 
                b.quantity -= deduct; 
                rem -= deduct; 
              }
            }
            if (rem > 0 && pData.inventoryPolicy !== 'Deny') batches.push({ batchId: `POS-ADD-${orderId.slice(-4)}`, quantity: -rem, locationId: currentLocationId, expiryDate: "", note: "POS shortfall deduction" });
            else if (rem > 0) throw new Error(`庫存不足: ${pData.productName_zh}`);
          } else {
            const rev = Math.abs(diff); 
            const locals = batches.filter(b => b.locationId === currentLocationId).sort((a,b)=>(a.expiryDate||"9999").localeCompare(b.expiryDate||"9999"));
            if (locals.length > 0) {
              locals[locals.length - 1].quantity += rev;
            } else {
              batches.push({ batchId: `ADJ-REV-${orderId.slice(-4)}`, quantity: rev, locationId: currentLocationId, expiryDate: "" });
            }
          }
          
          const sellableTotalStock = batches.filter(b => !b.expiryDate || b.expiryDate >= todayStr).reduce((acc, b) => acc + (Number(b.quantity) || 0), 0);
          const sellableLocStock = batches.filter(b => b.locationId === currentLocationId && (!b.expiryDate || b.expiryDate >= todayStr)).reduce((acc, b) => acc + (Number(b.quantity) || 0), 0);
          
          const updates: any = { batches, stock: sellableTotalStock, [`warehouseStock.${currentLocationId}`]: sellableLocStock, updatedAt: serverTimestamp() };
          if (webHubId && currentLocationId === webHubId) updates.onlineStock = sellableLocStock;
          transaction.update(pSnap.ref, updates);
        });

        // 核心修正：使用 set { merge: true } 來處理積分獎勵與抵扣，防止訪客帳號缺失導致交易中斷
        if (activeCart.linkedMember?.id) {
          const totalPointsChange = ptsToAward - ptsUsed;
          if (totalPointsChange !== 0) {
            transaction.set(doc(db!, 'users', activeCart.linkedMember.id), {
              points: increment(totalPointsChange),
              updatedAt: serverTimestamp()
            }, { merge: true });
          }
        }

        const orderData = { 
          orderId, 
          subtotal: subtotalValue,
          items: activeCart.items.map(it => ({ ...it, productId: it.id })), 
          total: finalTotal, 
          payments: finalPayments, 
          paymentMethod: finalPaymentMethod,
          sourceType: 'POS', 
          fulfillmentLocationId: currentLocationId, 
          customerId: activeCart.linkedMember?.id || null, 
          customerInfo: activeCart.linkedMember ? { name: activeCart.linkedMember.displayName, email: activeCart.linkedMember.email, phone: activeCart.linkedMember.phone } : null,
          paymentStatus: 'paid', status: 'picked_up', fulfillmentStatus: 'picked_up', inventorySyncStatus: 'success', 
          discountAmount: discountInfo.amount, appliedPromos: discountInfo.appliedPromos,
          pointsUsed: ptsUsed, pointsUsedValue: pointsValue,
          pointsAwarded: ptsToAward > 0, 
          pointsAwardedAt: ptsToAward > 0 ? serverTimestamp() : null,
          pointsDeducted: ptsUsed > 0, 
          earnedPoints: ptsToAward,
          createdAt: activeCart.createdAt || serverTimestamp(), updatedAt: serverTimestamp()
        };
        transaction.set(doc(db!, 'orders', orderId), orderData, { merge: true });
        setLastOrder(orderData);
      });

      toast({ title: "交易成功" });
      removeCart(activeCartId); 
    } catch (e: any) { 
      toast({ title: "結帳失敗", description: e.message, variant: "destructive" }); 
    } finally { 
      setIsProcessing(false); 
      checkoutLockRef.current = false; 
    }
  };

  /**
   * 實現留貨功能 (Reserved Order)
   */
  const handleReserveComplete = async (guestInfo?: { name: string, phone: string }) => {
    if (checkoutLockRef.current) return;
    const todayStr = new Date().toISOString().split('T')[0];
    
    if (!activeCart.linkedMember && !guestInfo) {
      setIsReservePromptOpen(true);
      return;
    }

    checkoutLockRef.current = true;
    setIsProcessing(true);
    
    const timestampPart = Date.now().toString().slice(-8);
    const randomPart = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    const orderId = `${timestampPart}${randomPart}`;

    try {
      await runTransaction(db!, async (transaction) => {
        const webHub = locations?.find((l: any) => l.isDefaultFulfillmentSource);
        const webHubId = webHub?.id;

        const pids = activeCart.items.map(it => it.id);
        const snaps = await Promise.all(pids.map(pid => transaction.get(doc(db!, 'public_products', pid))));

        pids.forEach((pid, idx) => {
          const pSnap = snaps[idx]; if (!pSnap.exists()) return;
          const pData = pSnap.data();
          const item = activeCart.items[idx];
          
          let batches = Array.isArray(pData.batches) ? [...pData.batches] : [];
          let rem = item.qty;
          const validLocals = batches.filter(b => b.locationId === currentLocationId && (!b.expiryDate || b.expiryDate >= todayStr)).sort((a,b)=>(a.expiryDate||"9999").localeCompare(b.expiryDate||"9999"));
          
          for(const b of validLocals) { 
            if(rem <= 0) break; 
            if (b.quantity > 0) {
              const deduct = Math.min(b.quantity, rem); 
              b.quantity -= deduct; 
              rem -= deduct; 
            }
          }
          if (rem > 0 && pData.inventoryPolicy !== 'Deny') batches.push({ batchId: `POS-RES-${orderId.slice(-4)}`, quantity: -rem, locationId: currentLocationId, expiryDate: "", note: "POS reservation deduction" });
          else if (rem > 0) throw new Error(`庫存不足: ${pData.productName_zh}`);

          const sellableTotalStock = batches.filter(b => !b.expiryDate || b.expiryDate >= todayStr).reduce((acc, b) => acc + (Number(b.quantity) || 0), 0);
          const sellableLocStock = batches.filter(b => b.locationId === currentLocationId && (!b.expiryDate || b.expiryDate >= todayStr)).reduce((acc, b) => acc + (Number(b.quantity) || 0), 0);
          
          const updates: any = { batches, stock: sellableTotalStock, [`warehouseStock.${currentLocationId}`]: sellableLocStock, updatedAt: serverTimestamp() };
          if (webHubId && currentLocationId === webHubId) updates.onlineStock = sellableLocStock;
          transaction.update(pSnap.ref, updates);
        });

        const customerData = activeCart.linkedMember 
          ? { id: activeCart.linkedMember.id, name: activeCart.linkedMember.displayName, email: activeCart.linkedMember.email, phone: activeCart.linkedMember.phone }
          : { id: null, name: guestInfo!.name, email: "", phone: guestInfo!.phone };

        const orderData = { 
          orderId, 
          subtotal: subtotalValue,
          items: activeCart.items.map(it => ({ ...it, productId: it.id })), 
          total: finalTotal, 
          payments: [], 
          paymentMethod: 'pay_in_store',
          sourceType: 'POS', 
          fulfillmentLocationId: currentLocationId, 
          customerId: customerData.id, 
          customerInfo: { name: customerData.name, email: customerData.email, phone: customerData.phone },
          paymentStatus: 'unpaid', status: 'reserved', fulfillmentStatus: 'pending', inventorySyncStatus: 'success', 
          discountAmount: discountInfo.amount, appliedPromos: discountInfo.appliedPromos,
          pointsUsed: 0, pointsUsedValue: 0,
          createdAt: serverTimestamp(), updatedAt: serverTimestamp()
        };
        transaction.set(doc(db!, 'orders', orderId), orderData);
      });

      setIsReservePromptOpen(false);
      setReserveGuestName("");
      setReserveGuestPhone("");
      
      toast({ title: "留貨成功", description: `訂單 #${orderId} 已建立。` });
      removeCart(activeCartId); 
    } catch (e: any) { 
      toast({ title: "留貨失敗", description: e.message, variant: "destructive" }); 
    } finally { 
      setIsProcessing(false); 
      checkoutLockRef.current = false; 
    }
  };

  if (!mounted || !hasAccess) return null;

  return (
    <div className="h-screen flex flex-col bg-muted/5 font-sans overflow-hidden">
      <POSHeader registerStatus={registerStatus === 'active' ? 'active' : 'closed'} locationName={currentLocName} onOpenHistory={() => setIsHistoryOpen(true)} onOpenReport={() => setIsReportOpen(true)} onOpenRegister={() => setIsRegisterOpen(true)} onOpenSettle={() => setIsSettleOpen(true)} onLogout={() => signOut(auth)} />
      <div className="flex-1 flex-row overflow-hidden p-6 gap-6 flex">
        <ProductExplorer products={products} categories={categories} loading={productsLoading} searchQuery={searchQuery} onSearchChange={setSearchQuery} selectedCategoryId={selectedCategoryId} onCategoryChange={onCategoryChange} onAddToCart={addToCart} lang={lang} allPromos={allPromos} currentLocationId={currentLocationId} />
        <aside className="w-[480px] flex flex-col gap-6 shrink-0">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            {carts.map(cart => (<button key={cart.id} onClick={() => setActiveCartId(cart.id)} className={cn("px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all shrink-0", activeCartId === cart.id ? "bg-primary text-primary-foreground shadow-md" : "bg-white border text-muted-foreground")}>{cart.reservedOrderId ? "Loaded Order" : `Cart ${cart.index}`}{carts.length > 1 && (<X className="h-3 w-3 hover:text-white" onClick={(e) => { e.stopPropagation(); removeCart(cart.id); }} />)}</button>))}
            <button className="h-8 w-8 rounded-full border-2 border-dashed border-primary/40 flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all" onClick={addNewCart}><Plus className="h-4 w-4" /></button>
          </div>
          <POSCart 
            items={activeCart.items} 
            originalReservedItems={activeCart.originalReservedItems} 
            products={products} 
            currentLocationId={currentLocationId} 
            subtotal={subtotalValue} 
            finalTotal={finalTotal} 
            discountInfo={discountInfo} 
            onUpdateQty={(id, delta) => updateActiveCart(c => ({ items: c.items.map(it => it.cartItemId === id ? { ...it, qty: Math.max(1, it.qty + delta) } : it) }))} 
            onUpdateItemDiscount={(id, val) => updateActiveCart(c => ({ items: c.items.map(it => it.cartItemId === id ? { ...it, discount: val } : it) }))} 
            onUpdateItemDiscountType={(id, type) => updateActiveCart(c => ({ items: c.items.map(it => it.cartItemId === id ? { ...it, discountType: type } : it) }))} 
            onRemove={(id) => updateActiveCart(c => ({ items: c.items.filter(it => it.cartItemId !== id) }))} 
            onClear={() => updateActiveCart({ items: [], linkedMember: null, manualCouponInfo: null, discountValue: "", pointsToUse: "", couponCode: "", reservedOrderId: undefined, originalReservedItems: undefined })} 
            onCheckout={() => setIsCheckoutOpen(true)} 
            onReserve={() => handleReserveComplete()} 
            linkedMember={activeCart.linkedMember} 
            onOpenMemberPicker={() => setIsMemberPickerOpen(true)} 
            onRemoveMember={handleRemoveMember}
            onApplyCoupon={applyCoupon} 
            onRemoveCoupon={() => updateActiveCart({ manualCouponInfo: null, couponCode: "" })} 
            isApplyingCoupon={isApplyingCoupon} 
            isProcessing={isProcessing} 
            couponCode={activeCart.couponCode} 
            setCouponCode={(v) => updateActiveCart({ couponCode: v })} 
            discountValue={activeCart.discountValue} 
            setDiscountValue={(v) => updateActiveCart({ discountValue: v })} 
            discountType={activeCart.discountType} 
            setDiscountType={(v) => updateActiveCart({ discountType: v })} 
            pointsToUse={activeCart.pointsToUse}
            setPointsToUse={(v) => updateActiveCart({ pointsToUse: v })}
            loyaltyConfig={loyaltyConfig}
            disabled={registerStatus !== 'active'} 
            isReservedMode={!!activeCart.reservedOrderId} 
          />
        </aside>
      </div>
      <MemberPicker isOpen={isMemberPickerOpen} onOpenChange={setIsMemberPickerOpen} onSelect={handleMemberSelect} />
      <CheckoutDialog isOpen={isCheckoutOpen} onOpenChange={setIsCheckoutOpen} finalTotal={finalTotal} onComplete={handleCheckoutComplete} isProcessing={isProcessing} linkedMember={activeCart.linkedMember} lastOrder={lastOrder} onPrint={handlePrintReceipt} />
      <HistoryDialog isOpen={isHistoryOpen} onOpenChange={setIsHistoryOpen} orderHistory={orderHistory} currentLocationId={currentLocationId} onPrintReceipt={handlePrintReceipt} onLoadReservation={handleLoadReservation} onCancelOrder={async (o) => {}} />
      <ReportDialog isOpen={isReportOpen} onOpenChange={setIsReportOpen} reportStartDate={reportStartDate} setReportStartDate={setReportStartDate} reportEndDate={reportEndDate} setReportEndDate={setReportEndDate} reportSalesData={reportSalesData} locationName={currentLocName} onPrintReport={handlePrintReport} />
      <RegisterDialog isOpen={isRegisterOpen} onOpenChange={setIsRegisterOpen} locations={locations} currentLocationId={currentLocationId} setCurrentLocationId={setCurrentLocationId} openingFloat={openingFloat} setOpeningFloat={setOpeningFloat} onConfirm={() => { if (currentLocationId) { setRegisterStatus("active"); localStorage.setItem("pos-register-status", "active"); localStorage.setItem("pos-location-id", currentLocationId); setIsRegisterOpen(false); toast({ title: "開市成功" }); } }} />
      <SettleDialog isOpen={isSettleOpen} onOpenChange={setIsSettleOpen} locationName={currentLocName} todaySalesData={todaySalesData} openingFloat={openingFloat} onConfirm={() => { setRegisterStatus("closed"); localStorage.removeItem("pos-register-status"); localStorage.removeItem("pos-location-id"); setIsSettleOpen(false); toast({ title: "結算完成" }); }} />

      <Dialog open={isReservePromptOpen} onOpenChange={setIsReservePromptOpen}>
        <DialogContent className="sm:max-w-[450px] rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-8 bg-orange-600 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12"><Clock className="h-24 w-24" /></div>
            <DialogTitle className="text-2xl font-black font-headline">留貨客戶資訊</DialogTitle>
            <DialogDescription className="text-orange-100 font-medium">請輸入聯絡資料以便日後核對與通知。</DialogDescription>
          </DialogHeader>
          <div className="p-8 space-y-6 bg-white">
             <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">顧客姓名 (必填)</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="例如：陳小姐 / Alex" 
                      className="pl-10 h-12 bg-muted/20 border-none rounded-xl font-bold"
                      value={reserveGuestName}
                      onChange={(e) => setReserveGuestName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">聯絡電話 (必填)</Label>
                  <div className="relative">
                    <Smartphone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="例如：91234567" 
                      className="pl-10 h-12 bg-muted/20 border-none rounded-xl font-bold"
                      value={reserveGuestPhone}
                      onChange={(e) => setReserveGuestPhone(e.target.value)}
                      type="tel"
                    />
                  </div>
                </div>
             </div>
             <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 flex items-start gap-3">
               <Info className="h-4 w-4 text-orange-600 shrink-0 mt-0.5" />
               <p className="text-[10px] text-orange-800 leading-relaxed">
                 留貨成功後，系統將鎖定庫存並建立一筆預留訂單。客人日後到店時，請在「交易紀錄」中按單號或電話尋找。
               </p>
             </div>
             <Button 
               className="w-full h-14 bg-orange-600 text-white font-black text-lg rounded-2xl shadow-lg gap-2 active:scale-95 transition-all"
               disabled={isProcessing || !reserveGuestName || !reserveGuestPhone}
               onClick={() => handleReserveComplete({ name: reserveGuestName, phone: reserveGuestPhone })}
             >
               {isProcessing ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
               確認留貨
             </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function POSPage() {
  return (<Suspense fallback={<div className="h-screen w-full flex items-center justify-center bg-background"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}><POSContent /></Suspense>);
}
