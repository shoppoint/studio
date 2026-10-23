"use client";

import { useState, useMemo, Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  Search, 
  Plus, 
  UserPlus, 
  UserCheck,
  CreditCard,
  Calendar,
  Zap,
  Sparkles,
  Coins,
  Ticket,
  Check,
  Leaf,
  Box
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n/i18n-context";
import { useToast } from "@/hooks/use-toast";
import { useUser, useCollection, useDoc, useFirestore } from "@/firebase";
import { collection, query, addDoc, serverTimestamp, where, doc, runTransaction, getDoc, getDocs, Timestamp, increment, limit, setDoc } from "firebase/firestore";
import { format, parseISO } from "date-fns";
import { Separator } from "@/components/ui/separator";
import { calculateDiscountForPromo, getPromoShortLabel } from "@/lib/shop-utils";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

// 引用模組化組件
import { AddressSection } from "@/components/admin/orders/NewOrderComponents";
import { NewOrderItemsTable } from "@/components/admin/orders/new/NewOrderItemsTable";
import { NewOrderLogistics } from "@/components/admin/orders/new/NewOrderLogistics";
import { NewOrderPayment } from "@/components/admin/orders/new/NewOrderPayment";
import { MemberPicker } from "@/components/pos/MemberPicker";
import { LocationPickerDialog } from "@/components/checkout/LocationPickerDialog";
import { HARDCODED_SHIPPING_ZONES } from "@/lib/constants/shipping-data";
import { PAYMENT_METHODS } from "@/lib/constants/payment-methods";
import { Footer } from "@/components/Footer";

function NewOrderContent() {
  const router = useRouter();
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const db = useFirestore();
  const isEn = lang === 'en';
  
  const [loading, setLoading] = useState(false);
  const [activeTab, setSortTab] = useState("items");
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [isMemberPickerOpen, setIsMemberPickerOpen] = useState(false);
  const [linkedMember, setLinkedMember] = useState<any | null>(null);

  const [isSfPickerOpen, setIsSfPickerOpen] = useState(false);
  const [isHkPostPickerOpen, setIsHkPostPickerOpen] = useState(false);
  const [isStorePickerOpen, setIsStorePickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");
  const [allSfLocations, setAllSfLocations] = useState<any[]>([]);
  const [allHkPostLocations, setAllHkPostLocations] = useState<any[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [selectedPoint, setSelectedPoint] = useState<any | null>(null);

  const zones = HARDCODED_SHIPPING_ZONES;

  const locationsQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'locations'), where('status', '==', 'Active'));
  }, [db]);
  const { data: locations } = useCollection<any>(locationsQuery);

  const allProductsQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, 'public_products'), where('status', '==', 'Active'));
  }, [db]);
  const { data: allProducts } = useCollection<any>(allProductsQuery);

  const loyaltyConfigRef = useMemo(() => db ? doc(db, 'config', 'loyalty') : null, [db]);
  const { data: loyaltyConfig } = useDoc<any>(loyaltyConfigRef);

  const membershipConfigRef = useMemo(() => db ? doc(db, 'config', 'membership') : null, [db]);
  const { data: membershipConfig } = useDoc<any>(membershipConfigRef);

  const promosQuery = useMemo(() => db ? query(collection(db, 'promotions'), where('status', '==', 'active')) : null, [db]);
  const { data: allPromos } = useCollection<any>(promosQuery);

  const [formData, setFormData] = useState({
    customerInfo: { name: "", email: "", phone: "", companyName: "" },
    fulfillmentLocationId: "",
    selectedMethodId: "",
    paymentMethod: "cash",
    orderDateInput: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    items: [] as any[],
    payments: [] as any[],
    shippingFee: "0",
    orderDiscount: "0",
    orderDiscountType: "amount" as "amount" | "percent",
    pointsToUse: 0,
    packagingPreference: "eco",
    shippingAddress: { 
      firstName: "", lastName: "", companyName: "", email: "", phone: "",
      country: "Hong Kong", area: "", district: "", subDistrict: "", street: "", building: "", floor: "", flat: "", block: ""
    },
    billingAddress: { 
      firstName: "", lastName: "", companyName: "", email: "", phone: "",
      country: "Hong Kong", area: "", district: "", subDistrict: "", street: "", building: "", floor: "", flat: "", block: ""
    }
  });

  const availableMethods = useMemo(() => {
    if (!zones || zones.length === 0) return [];
    const targetCountry = (formData.shippingAddress.country || "Hong Kong").trim().toLowerCase();
    let zone = zones.find((z: any) => 
      Array.isArray(z.countries) && z.countries.some((c: string) => {
        const dbCountry = c.trim().toLowerCase();
        return dbCountry === targetCountry || dbCountry.includes(targetCountry);
      })
    );
    if (!zone && targetCountry.includes('hong kong')) zone = zones.find((z: any) => z.name.toLowerCase().includes('hong kong'));
    if (!zone) zone = zones.find((z: any) => z.name.toLowerCase().includes('other') || z.name.toLowerCase().includes('global'));
    if (!zone || !zone.methods) return [];
    return Object.entries(zone.methods).filter(([_, config]: [string, any]) => config.enabled).map(([id, config]: [string, any]) => ({ id, ...config }));
  }, [zones, formData.shippingAddress.country]);

  useEffect(() => {
    const loadLogisticsData = async () => {
      try {
        const sfPaths = ['/data/sf-locations-hk.json', '/data/sf-locations-kln.json', '/data/sf-locations-nt.json', '/data/sf-locations-nt-2.json', '/data/sf-locations-islands.json', '/data/sf-locations-extra.json'];
        const hkpPaths = ['/data/hkpost-locations-hk.json', '/data/hkpost-locations-kln.json', '/data/hkpost-locations-nt.json'];
        const safeFetch = async (p: string) => { try { const r = await fetch(p); return r.ok ? await r.json() : { locations: [] }; } catch { return { locations: [] }; } };
        const [sfRes, hkpRes] = await Promise.all([Promise.all(sfPaths.map(safeFetch)), Promise.all(hkpPaths.map(safeFetch))]);
        setAllSfLocations(sfRes.flatMap(r => r.locations || [])); setAllHkPostLocations(hkpRes.flatMap(r => r.locations || []));
      } finally { setIsDataLoading(false); }
    };
    loadLogisticsData();
  }, []);

  const updateField = (field: string, value: any) => setFormData(prev => ({ ...prev, [field]: value }));

  const onOpenSf = () => setIsSfPickerOpen(true);
  const onOpenHkPost = () => setIsHkPostPickerOpen(true);
  const onOpenStore = () => setIsStorePickerOpen(true);

  const handleMemberSelect = (member: any) => {
    setLinkedMember(member);
    const nameParts = (member.displayName || "").trim().split(/\s+/);
    const lastName = nameParts[0] || "";
    const firstName = nameParts.slice(1).join(" ") || "";

    setFormData(prev => ({
      ...prev,
      shippingAddress: {
        ...prev.shippingAddress,
        firstName: firstName,
        lastName: lastName,
        email: member.email || prev.shippingAddress.email,
        phone: member.phone || prev.shippingAddress.phone,
        companyName: member.companyName || prev.shippingAddress.companyName
      },
      billingAddress: {
        ...prev.billingAddress,
        firstName: firstName,
        lastName: lastName,
        email: member.email || prev.billingAddress.email,
        phone: member.phone || prev.billingAddress.phone,
        companyName: member.companyName || prev.billingAddress.companyName
      }
    }));

    setIsMemberPickerOpen(false);
    toast({ title: "會員已連結且地址資料已同步" });
  };

  const handleSelectPoint = (p: any, type: string) => {
    const isEnMode = lang === 'en';
    const newAddr = { ...formData.shippingAddress };

    if (type === 'store') { 
      const locAddr = p.address || {};
      newAddr.area = locAddr.area || ""; 
      newAddr.district = locAddr.district || ""; 
      newAddr.subDistrict = locAddr.subDistrict || "";
      newAddr.street = (isEnMode ? locAddr.street_en : locAddr.street_zh) || "";
      let bld = (isEnMode ? locAddr.building_en : locAddr.building_zh) || "";
      if (p.gmcStoreCode) bld = `[${p.gmcStoreCode}] ${bld}`;
      newAddr.building = bld;
      newAddr.floor = (isEnMode ? locAddr.floor_en : locAddr.floor_zh) || "";
      newAddr.flat = (isEnMode ? locAddr.flat_en : locAddr.flat_zh) || "";
      newAddr.block = (isEnMode ? locAddr.block_en : locAddr.block_zh) || "";
    } else { 
      newAddr.area = p.area_zh || p.area_en || ""; 
      newAddr.district = p.district_zh || p.district_en || ""; 
      newAddr.building = `[${p.code}] ` + (isEnMode ? (p.name_en || "") : (p.name_zh || "")); 
      newAddr.street = isEnMode ? (p.address_en || "") : (p.address_zh || ""); 
      newAddr.subDistrict = ""; newAddr.floor = ""; newAddr.flat = ""; newAddr.block = "";
    }
    updateField('shippingAddress', newAddr);
    setSelectedPoint(p);
    setIsSfPickerOpen(false); 
    setIsHkPostPickerOpen(false); 
    setIsStorePickerOpen(false);
  };

  const subtotal = useMemo(() => 
    formData.items.reduce((acc, item) => {
      const disc = item.discountType === 'percent' ? (item.price * item.discount) / 100 : item.discount;
      return acc + ((item.price - (disc || 0)) * item.qty);
    }, 0)
  , [formData.items]);

  const promoInfo = useMemo(() => {
    if (!allPromos || !formData.items.length) return { discount: 0, appliedPromos: [] };
    const todayStr = format(new Date(), "yyyy-MM-dd");
    const candidates = allPromos.filter(p => {
      if (p.code || p.isPublic === false) return false;
      if (p.startsAt && p.startsAt > todayStr) return false;
      if (p.endsAt && p.endsAt < todayStr) return false;
      return true;
    }).map(p => {
      const result = calculateDiscountForPromo(p, formData.items, subtotal, linkedMember);
      return { ...p, discount: result.discount, displayName: getPromoShortLabel(p, lang) };
    }).filter(r => r.discount > 0);
    const stackable = candidates.filter(p => p.isStackable !== false);
    const exclusive = candidates.filter(p => p.isStackable === false);
    let finalDiscount = stackable.reduce((s, p) => s + p.discount, 0);
    let finalApplied = stackable;
    exclusive.forEach(p => { if (p.discount > finalDiscount) { finalDiscount = p.discount; finalApplied = [p]; } });
    return { discount: finalDiscount, appliedPromos: finalApplied };
  }, [allPromos, formData.items, subtotal, linkedMember, lang]);

  const pointsToCashRatio = Number(loyaltyConfig?.pointsToCash) || 100;
  const pointsValue = (Number(formData.pointsToUse) || 0) / pointsToCashRatio;

  const total = useMemo(() => {
    const rawTotal = subtotal + Number(formData.shippingFee) - promoInfo.discount - (formData.orderDiscountType === 'percent' ? (subtotal * Number(formData.orderDiscount) / 100) : Number(formData.orderDiscount));
    return Math.ceil(Math.max(0, rawTotal) * 10) / 10;
  }, [subtotal, formData.shippingFee, formData.orderDiscount, formData.orderDiscountType, promoInfo.discount]);

  const balanceDue = useMemo(() => Math.max(0, total - pointsValue), [total, pointsValue]);

  const earnedPoints = useMemo(() => {
    if (!loyaltyConfig) return 0;
    const ratio = Number(loyaltyConfig.spendToPoints) || 10;
    const tierMultiplier = Number(membershipConfig?.tiers?.[linkedMember?.tier || 'classic']?.multiplier) || 1.0;
    return Math.floor((balanceDue / ratio) * tierMultiplier);
  }, [balanceDue, loyaltyConfig, membershipConfig, linkedMember]);

  const handleSave = async () => {
    if (!db) return;
    if (formData.items.length === 0) { toast({ title: "請加入產品", variant: "destructive" }); return; }
    if (!formData.fulfillmentLocationId) { toast({ title: "請指定庫存履行地點", variant: "destructive" }); return; }
    
    setLoading(true);
    const todayStr = new Date().toISOString().split('T')[0];
    
    const timestampPart = Date.now().toString().slice(-8);
    const randomPart = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    const orderId = `${timestampPart}${randomPart}`;
    
    const locId = formData.fulfillmentLocationId;
    
    try {
      await runTransaction(db, async (transaction) => {
        const locationsSnap = await getDocs(query(collection(db, 'locations'), where('isDefaultFulfillmentSource', '==', true), limit(1)));
        const webHubId = locationsSnap.empty ? null : locationsSnap.docs[0].id;

        const aggregatedItemsMap = new Map<string, number>();
        formData.items.forEach(it => {
          const id = it.productId || it.id;
          aggregatedItemsMap.set(id, (aggregatedItemsMap.get(id) || 0) + Number(it.qty));
        });

        const productIds = Array.from(aggregatedItemsMap.keys());
        const productRefs = productIds.map(pid => doc(db, 'public_products', pid));
        const productSnaps = await Promise.all(productRefs.map(ref => transaction.get(ref)));

        productIds.forEach((pid, idx) => {
          const pSnap = productSnaps[idx];
          if (!pSnap.exists()) return;
          
          const pData = pSnap.data();
          const pRef = productRefs[idx];
          const policy = pData.inventoryPolicy || 'Deny';
          const qtyToDeduct = aggregatedItemsMap.get(pid) || 0;

          let batches = Array.isArray(pData.batches) ? [...pData.batches] : [];
          let rem = qtyToDeduct;

          // 核心修正：僅從未過期批次中扣除
          const validLocalBatches = batches.filter(b => b.locationId === locId && (!b.expiryDate || b.expiryDate >= todayStr)).sort((a, b) => (a.expiryDate || "9999").localeCompare(b.expiryDate || "9999"));

          for (const b of validLocalBatches) { 
            if (rem <= 0) break; 
            if (b.quantity > 0) {
              const deduct = Math.min(b.quantity, rem); 
              b.quantity = Number(b.quantity) - deduct; 
              rem -= deduct; 
            }
          }

          if (rem > 0 && policy !== 'Deny') {
            batches.push({ 
              batchId: `MANUAL-ORDER-${orderId.slice(-4)}`, 
              quantity: -rem, 
              locationId: locId, 
              expiryDate: "", 
              note: "Manual admin order shortfall" 
            });
          } else if (rem > 0) {
            throw new Error(`庫存不足且拒絕超賣: ${pData.productName_zh || pid}`);
          }

          // 重新計算總庫存時，排除過期批次
          const sellableTotalStock = batches.filter(b => !b.expiryDate || b.expiryDate >= todayStr).reduce((acc, b) => acc + (Number(b.quantity) || 0), 0);
          const sellableLocStock = batches.filter(b => b.locationId === locId && (!b.expiryDate || b.expiryDate >= todayStr)).reduce((acc, b) => acc + (Number(b.quantity) || 0), 0);
          
          const updates: any = { 
            batches, 
            stock: sellableTotalStock, 
            [`warehouseStock.${locId}`]: sellableLocStock, 
            updatedAt: serverTimestamp() 
          };
          
          if (webHubId && locId === webHubId) {
             updates.onlineStock = sellableLocStock;
          }
          
          transaction.update(pRef, updates);
        });

        if (linkedMember && formData.pointsToUse > 0) {
          // 核心修正：使用 set { merge: true } 防止訪客帳號缺失報錯
          transaction.set(doc(db, 'users', linkedMember.id), {
            points: increment(-formData.pointsToUse),
            updatedAt: serverTimestamp()
          }, { merge: true });
        }

        const selectedMethod = availableMethods.find(m => m.id === formData.selectedMethodId);
        const finalPayments = [...formData.payments];
        if (formData.pointsToUse > 0) {
          finalPayments.push({
            method: 'points_redemption',
            amount: pointsValue,
            points: formData.pointsToUse,
            date: format(new Date(), 'yyyy-MM-dd HH:mm')
          });
        }

        const orderData: any = {
          orderId, 
          subtotal: Number(subtotal),
          total: Number(total),
          sourceType: 'Manual',
          customerId: linkedMember?.id || null,
          customerInfo: { 
            name: `${formData.shippingAddress.lastName} ${formData.shippingAddress.firstName}`.trim() || linkedMember?.displayName || "Guest", 
            email: formData.shippingAddress.email || linkedMember?.email || "", 
            phone: formData.shippingAddress.phone || linkedMember?.phone || "",
            companyName: formData.shippingAddress.companyName || linkedMember?.companyName || ""
          },
          email: formData.shippingAddress.email || linkedMember?.email || "",
          items: formData.items.map(it => ({ ...it, productId: it.id })),
          shippingAddress: formData.shippingAddress,
          billingAddress: formData.billingAddress,
          shippingMethodId: formData.selectedMethodId,
          shippingMethodName: selectedMethod ? (lang === 'en' ? (selectedMethod.name_en || selectedMethod.name) : (selectedMethod.name_zh || selectedMethod.name)) : "Standard",
          selectedPoint: selectedPoint || null,
          isPickup: !!selectedMethod?.isPickup,
          fulfillmentLocationId: locId,
          paymentMethod: formData.paymentMethod,
          paymentStatus: finalPayments.length > 0 && balanceDue <= 0.1 ? 'paid' : (['fps', 'payme', 'octopus', 'bank', 'pay_in_store'].includes(formData.paymentMethod) ? 'pending' : 'unpaid'),
          status: 'pending',
          inventorySyncStatus: 'success',
          shippingFee: Number(formData.shippingFee),
          orderDiscount: Number(formData.orderDiscount),
          orderDiscountType: formData.orderDiscountType,
          discountAmount: Number(promoInfo.discount),
          appliedPromos: promoInfo.appliedPromos,
          payments: finalPayments,
          pointsUsed: Number(formData.pointsToUse),
          pointsUsedValue: Number(pointsValue),
          earnedPoints: Number(earnedPoints),
          packagingPreference: formData.packagingPreference,
          isConfirmed: true, 
          updatedAt: serverTimestamp()
        };

        let orderDateValue = serverTimestamp();
        if (formData.orderDateInput) {
          try { orderDateValue = Timestamp.fromDate(parseISO(formData.orderDateInput)); } catch (e) {}
        }
        orderData.createdAt = orderDateValue;
        
        transaction.set(doc(db, 'orders', orderId), orderData, { merge: true });
      });

      toast({ title: "訂單已建立，庫存與積分已扣減。" }); 
      router.push("/admin/orders");
    } catch (e: any) { 
      toast({ title: "儲存失敗", description: e.message, variant: "destructive" }); 
    } finally { setLoading(false); }
  };

  const handleMethodChange = (id: string) => {
    if (id !== formData.selectedMethodId) {
      updateField('selectedMethodId', id);
      setSelectedPoint(null);
      const isPickup = availableMethods.find(m => m.id === id)?.isPickup;
      if (isPickup) {
        updateField('shippingAddress', { ...formData.shippingAddress, area: "", district: "", subDistrict: "", building: "", street: "" });
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-24 animate-in fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4"><Button variant="ghost" size="icon" onClick={() => router.back()}><ArrowLeft className="h-5 w-5" /></Button><h1 className="text-3xl font-black font-headline">建立手動訂單</h1></div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-xl h-11" onClick={() => router.back()}>取消</Button>
          <Button className="bg-primary text-primary-foreground font-black h-11 px-8 rounded-xl shadow-lg" onClick={handleSave} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}確認建立</Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setSortTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-muted/50 p-1 h-12 rounded-2xl mb-6">
          <TabsTrigger value="items" className="rounded-xl font-bold gap-2">產品項目</TabsTrigger>
          <TabsTrigger value="address" className="rounded-xl font-bold gap-2">地址資料</TabsTrigger>
          <TabsTrigger value="logistics" className="rounded-xl font-bold gap-2">物流設定</TabsTrigger>
          <TabsTrigger value="payment" className="rounded-xl font-bold gap-2">支付錄入</TabsTrigger>
        </TabsList>

        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border min-h-[400px]">
          <TabsContent value="items" className="mt-0 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1 flex items-center gap-2"><Calendar className="h-3 w-3" /> 設定訂單日期 (Backdate)</Label>
                <input type="datetime-local" value={formData.orderDateInput} onChange={e => updateField('orderDateInput', e.target.value)} className="flex h-11 w-full rounded-xl bg-muted/20 border-none px-3 py-2 text-sm font-bold shadow-inner" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1 flex items-center gap-2"><CreditCard className="h-3 w-3" /> 主要付款方式</Label>
                <Select value={formData.paymentMethod} onValueChange={v => updateField('paymentMethod', v)}>
                  <SelectTrigger className="h-11 bg-muted/20 border-none rounded-xl font-bold"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl border-none shadow-2xl">
                    {PAYMENT_METHODS.map(m => <SelectItem key={m.id} value={m.id}>{m.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Separator className="border-dashed" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="text-lg font-black">產品選擇與優惠</h3>
                <Button variant="outline" size="sm" className="rounded-xl border-primary text-primary font-bold h-9" onClick={() => setIsMemberPickerOpen(true)}>
                  {linkedMember ? <UserCheck className="h-4 w-4 mr-1.5" /> : <UserPlus className="h-4 w-4 mr-1.5" />} {linkedMember ? linkedMember.displayName : "連結會員"}
                </Button>
              </div>
              <Button variant="outline" size="sm" className="rounded-xl border-primary text-primary font-bold h-9" onClick={() => setProductDialogOpen(true)}><Plus className="h-4 w-4 mr-1.5" /> 加入產品</Button>
            </div>
            <NewOrderItemsTable items={formData.items} onUpdateQty={(id:string, d:number) => updateField('items', formData.items.map(it => it.cartItemId === id ? {...it, qty: Math.max(1, it.qty + d)} : it))} onUpdatePrice={(id:string, p:number) => updateField('items', formData.items.map(it => it.cartItemId === id ? {...it, price: p} : it))} onUpdateDiscount={(id:string, v:number) => updateField('items', formData.items.map(it => it.cartItemId === id ? {...it, discount: v} : it))} onUpdateDiscountType={(id:string, t:string) => updateField('items', formData.items.map(it => it.cartItemId === id ? {...it, discountType: t} : it))} onRemove={(id:string) => updateField('items', formData.items.filter(it => it.cartItemId !== id))} />
            
            {linkedMember && (
              <Card className="border-none shadow-sm rounded-2xl bg-amber-50 border border-amber-100 overflow-hidden">
                <CardContent className="p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 text-amber-700">
                      <Coins className="h-5 w-5" />
                      <span className="font-black text-sm uppercase">會員積分抵扣 (Points Offset)</span>
                    </div>
                    <Badge className="bg-amber-400 text-amber-950 font-black">可用: {linkedMember.points || 0} Pts</Badge>
                  </div>
                  <div className="space-y-4">
                    <Slider 
                      value={[formData.pointsToUse]} 
                      max={Math.min(Number(linkedMember.points || 0), Math.floor(total * pointsToCashRatio))} 
                      step={pointsToCashRatio} 
                      onValueChange={v => updateField('pointsToUse', v[0])} 
                    />
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-amber-600">{formData.pointsToUse} Pts</span>
                      <span className="text-lg font-black text-amber-700">-${pointsValue.toFixed(1)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="pt-6 border-t flex flex-col items-end gap-2">
              {promoInfo.discount > 0 && <div className="flex items-center gap-2 text-green-600 text-sm font-bold"><Sparkles className="h-4 w-4" /> 系統自動促銷: -${promoInfo.discount.toFixed(1)}</div>}
              <div className="text-right"><p className="text-[10px] font-black uppercase text-muted-foreground">訂單總額 (Revenue)</p><p className="text-4xl font-black text-primary">${total.toFixed(1)}</p></div>
              <div className="text-right pt-2"><p className="text-[10px] font-black uppercase text-orange-600">待收餘額 (Balance Due)</p><p className="text-2xl font-black text-orange-600">${balanceDue.toFixed(1)}</p></div>
            </div>
          </TabsContent>
          <TabsContent value="address" className="mt-0"><AddressSection formData={formData} onChange={updateField} labels={t.checkout.address_fields} selectedPoint={selectedPoint} /></TabsContent>
          <TabsContent value="logistics" className="mt-0">
            <div className="space-y-8">
              <NewOrderLogistics formData={formData} onChange={updateField} methods={availableMethods} locations={locations} selectedPoint={selectedPoint} onMethodChange={handleMethodChange} onOpenSf={onOpenSf} onOpenHkPost={onOpenHkPost} onOpenStore={onOpenStore} isEn={isEn} />
              
              <Separator className="border-dashed" />
              
              <div className="space-y-4 max-w-md">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">出貨包裝偏好 (Admin Selection)</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div 
                    className={cn(
                      "p-4 rounded-2xl border-2 flex items-center gap-3 cursor-pointer transition-all bg-slate-50",
                      formData.packagingPreference === 'eco' ? "border-green-600 bg-green-50 shadow-sm" : "border-muted"
                    )}
                    onClick={() => updateField('packagingPreference', 'eco')}
                  >
                    <div className={cn("h-5 w-5 rounded-full border-2 flex items-center justify-center", formData.packagingPreference === 'eco' ? "bg-green-600 border-green-600" : "bg-white border-muted")}>
                      {formData.packagingPreference === 'eco' && <Check className="h-3 w-3 text-white" strokeWidth={4} />}
                    </div>
                    <span className="text-sm font-bold">環保包裝</span>
                  </div>
                  <div 
                    className={cn(
                      "p-4 rounded-2xl border-2 flex items-center gap-3 cursor-pointer transition-all bg-slate-50",
                      formData.packagingPreference === 'new' ? "border-blue-600 bg-blue-50 shadow-sm" : "border-muted"
                    )}
                    onClick={() => updateField('packagingPreference', 'new')}
                  >
                    <div className={cn("h-5 w-5 rounded-full border-2 flex items-center justify-center", formData.packagingPreference === 'new' ? "bg-blue-600 border-blue-600" : "bg-white border-muted")}>
                      {formData.packagingPreference === 'new' && <Check className="h-3 w-3 text-white" strokeWidth={4} />}
                    </div>
                    <span className="text-sm font-bold">全新紙箱</span>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="payment" className="mt-0"><NewOrderPayment payments={formData.payments} totalNeeded={total} totalPaid={formData.payments.reduce((a:number, p:any) => a + p.amount, 0) + pointsValue} onAdd={(r:any) => updateField('payments', [...formData.payments, r])} onRemove={(i:number) => updateField('payments', formData.payments.filter((_:any,idx:number)=>idx!==i))} /></TabsContent>
        </div>
      </Tabs>
      <MemberPicker isOpen={isMemberPickerOpen} onOpenChange={setIsMemberPickerOpen} onSelect={handleMemberSelect} />
      <Dialog open={productDialogOpen} onOpenChange={setProductDialogOpen}><DialogContent className="rounded-3xl p-6 sm:max-w-md"><DialogHeader><DialogTitle className="font-black">加入產品</DialogTitle></DialogHeader><div className="space-y-4"><div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input placeholder="搜尋..." value={productSearch} onChange={e => setProductSearch(e.target.value)} className="pl-9" /></div><ScrollArea className="h-64">{allProducts?.filter(p => (p.productName_zh || "").toLowerCase().includes(productSearch.toLowerCase())).map(p => (<div key={p.id} className="p-3 border rounded-xl flex items-center justify-between mb-2"><span className="text-xs font-bold">{p.productName_zh}</span><Button size="sm" onClick={() => { updateField('items', [...formData.items, { cartItemId: `m_${Date.now()}`, id: p.id, name: p.productName_zh, price: p.salePrice || p.price, qty: 1, sku: p.sku, image: p.imageUrl, discount: 0, discountType: 'amount', categories: p.categories || [], brand: p.primaryBrand || p.brands || "" }]); setProductDialogOpen(false); }}>加入</Button></div>))}</ScrollArea></div></DialogContent></Dialog>
      <LocationPickerDialog isOpen={isSfPickerOpen} onOpenChange={setIsSfPickerOpen} title="選擇順豐網點" data={allSfLocations} onSelect={p => handleSelectPoint(p, 'sf')} search={pickerSearch} onSearchChange={setPickerSearch} isEn={isEn} isLoading={isDataLoading} />
      <LocationPickerDialog isOpen={isHkPostPickerOpen} onOpenChange={setIsHkPostPickerOpen} title="選擇智郵站" data={allHkPostLocations} onSelect={p => handleSelectPoint(p, 'hkpost')} search={pickerSearch} onSearchChange={setPickerSearch} isEn={isEn} isLoading={isDataLoading} />
      <LocationPickerDialog isOpen={isStorePickerOpen} onOpenChange={setIsStorePickerOpen} title="選擇取貨分店" data={locations?.filter((l: any) => l.isPickupEnabled).map((l: any) => ({ ...l, code: l.gmcStoreCode || l.id })) || []} onSelect={p => handleSelectPoint(p, 'store')} search={pickerSearch} onSearchChange={setPickerSearch} isEn={isEn} />
      <Footer />
    </div>
  );
}

export default function NewOrderPage() {
  return (<Suspense fallback={<div className="h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}><NewOrderContent /></Suspense>);
}
