"use client";

import { useMemo, useState } from "react";
import { 
  MapPin, 
  User, 
  Check, 
  ChevronRight, 
  Loader2, 
  BookOpen, 
  Sparkles, 
  Plus, 
  ArrowLeft, 
  Save,
  Mail,
  Smartphone,
  Building2,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogTrigger
} from "@/components/ui/dialog";
import { useUser, useFirestore, useCollection } from "@/firebase";
import { collection, query, orderBy, addDoc, serverTimestamp, doc, deleteDoc } from "firebase/firestore";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HK_ADDRESS_DATA, COUNTRIES } from "@/lib/address-data";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useI18n } from "@/lib/i18n/i18n-context";

interface SavedAddressPickerProps {
  onSelect: (address: any) => void;
  trigger?: React.ReactNode;
}

/**
 * 增強版會員地址選取器：支援查看列表、快速新增及刪除地址。
 * 修正：嚴格限制匿名用戶不觸發 Firestore 讀取，防止 /checkout 權限報錯。
 */
export function SavedAddressPicker({ onSelect, trigger }: SavedAddressPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<'list' | 'add'>('list');
  const { user, userData } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const { t, lang } = useI18n();
  const isEn = lang === 'en';

  // 核心修正：只有當用戶是正式登入會員時（非匿名），才發起地址清單查詢
  const addressListQuery = useMemo(() => {
    if (!user || user.isAnonymous || !db) return null;
    return query(
      collection(db, 'users', user.uid, 'addresses'), 
      orderBy('updatedAt', 'desc')
    );
  }, [db, user]);

  const { data: addresses, loading } = useCollection<any>(addressListQuery);

  // 新增地址表單狀態
  const [newAddr, setNewAddr] = useState<any>({
    firstName: "", lastName: "", companyName: "", email: user?.email || "", phone: "", 
    country: "Hong Kong", area: "", district: "", subDistrict: "",
    building: "", street: "", floor: "", flat: "", block: ""
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSelect = (addr: any) => {
    onSelect(addr);
    setIsOpen(false);
  };

  const handleAddNew = async () => {
    if (!user || !newAddr.lastName || !newAddr.phone) return;
    setIsSaving(true);
    try {
      const addrRef = collection(db, 'users', user.uid, 'addresses');
      const dataToSave = {
        ...newAddr,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      const docRef = await addDoc(addrRef, dataToSave);
      toast({ title: isEn ? "Address Saved" : "地址已儲存" });
      
      handleSelect({ id: docRef.id, ...dataToSave });
      setView('list');
    } catch (e) {
      toast({ title: isEn ? "Failed to Save" : "儲存失敗", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!user || !confirm(isEn ? "Are you sure you want to delete this address?" : "確定要刪除此地址嗎？")) return;
    try {
      await deleteDoc(doc(db, 'users', user.uid, 'addresses', id));
      toast({ title: isEn ? "Address Removed" : "地址已移除" });
    } catch (e) {
      console.error(e);
    }
  };

  const profileAddress = useMemo(() => {
    if (!userData || !user || user.isAnonymous) return null;
    const names = (userData.displayName || "").trim().split(/\s+/);
    return {
      id: 'profile-main',
      isProfile: true,
      firstName: names.length > 1 ? names.slice(1).join(" ") : "",
      lastName: names[0] || "",
      email: user?.email || "",
      phone: userData.phone || "",
      companyName: userData.companyName || "",
      country: "Hong Kong"
    };
  }, [userData, user]);

  const districtOptions = useMemo(() => 
    newAddr.area && HK_ADDRESS_DATA[newAddr.area] ? Object.keys(HK_ADDRESS_DATA[newAddr.area]) : []
  , [newAddr.area]);

  const subDistrictOptions = useMemo(() => 
    newAddr.area && newAddr.district && HK_ADDRESS_DATA[newAddr.area] && HK_ADDRESS_DATA[newAddr.area][newAddr.district] 
      ? HK_ADDRESS_DATA[newAddr.area][newAddr.district] 
      : []
  , [newAddr.area, newAddr.district]);

  // 核心修正：匿名用戶不顯示此功能
  if (!user || user.isAnonymous) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(v) => { setIsOpen(v); if(!v) setView('list'); }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="rounded-xl h-8 font-bold border-primary text-primary gap-1.5 hover:bg-primary/5">
            <BookOpen className="h-3.5 w-3.5" /> {isEn ? "Select from Account" : "從帳戶選取"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px] rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="p-8 bg-primary text-primary-foreground relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12"><MapPin className="h-32 w-32" /></div>
          <div className="relative z-10 flex items-center justify-between text-left">
            <div>
              <DialogTitle className="text-2xl font-black font-headline">
                {view === 'list' ? (isEn ? 'Saved Addresses' : '我的儲存地址') : (isEn ? 'Add New Address' : '新增收貨地址')}
              </DialogTitle>
              <DialogDescription className="text-primary-foreground/80 font-medium">
                {view === 'list' ? (isEn ? 'Quickly apply your contact info and destination.' : '快速套用您的聯絡資訊與配送目的地。') : (isEn ? 'New address will be saved to your account.' : '填寫新地址後將自動儲存至您的帳戶。')}
              </DialogDescription>
            </div>
            {view === 'list' ? (
              <Button 
                onClick={() => setView('add')}
                className="bg-white text-primary hover:bg-white/90 rounded-xl font-black shadow-lg gap-2"
              >
                <Plus className="h-4 w-4" /> {isEn ? 'Add' : '新增'}
              </Button>
            ) : (
              <Button 
                variant="ghost" 
                onClick={() => setView('list')}
                className="text-white hover:bg-white/20 font-bold gap-2"
              >
                <ArrowLeft className="h-4 w-4" /> {isEn ? 'Back' : '返回'}
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="p-0 bg-slate-50/50">
          <ScrollArea className="h-[480px]">
            {view === 'list' ? (
              <div className="p-8 space-y-6 pb-20">
                {profileAddress && (
                  <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">{isEn ? 'Profile Main' : '帳戶主檔案 (Profile)'}</p>
                    <div 
                      onClick={() => handleSelect(profileAddress)}
                      className="p-5 rounded-[1.5rem] border-2 border-transparent bg-white shadow-sm hover:border-primary/20 hover:shadow-md transition-all cursor-pointer group"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                            <User className="h-5 w-5" />
                          </div>
                          <div className="space-y-0.5 text-left">
                            <p className="font-bold text-sm">{profileAddress.lastName} {profileAddress.firstName}</p>
                            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                              <span className="flex items-center gap-1"><Mail className="h-2.5 w-2.5" /> {profileAddress.email}</span>
                              {profileAddress.phone && <span className="flex items-center gap-1"><Smartphone className="h-2.5 w-2.5" /> {profileAddress.phone}</span>}
                            </div>
                          </div>
                        </div>
                        <Badge className="bg-primary/20 text-primary border-none text-[8px] font-black uppercase h-5">{isEn ? 'Main' : '主檔案'}</Badge>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest ml-1">{isEn ? 'Address Book' : '已儲存地址簿 (Address Book)'}</p>
                  {loading ? (
                    <div className="py-10 text-center"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></div>
                  ) : !addresses || addresses.length === 0 ? (
                    <div className="py-12 text-center border-2 border-dashed rounded-2xl bg-white/50">
                      <p className="text-xs text-muted-foreground italic">{isEn ? 'No other addresses' : '目前無其他儲存地址'}</p>
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {addresses.map((addr: any) => (
                        <div 
                          key={addr.id}
                          onClick={() => handleSelect(addr)}
                          className="p-5 rounded-[1.5rem] border-2 border-transparent bg-white shadow-sm hover:border-primary/20 hover:shadow-md transition-all cursor-pointer group relative"
                        >
                          <div className="flex justify-between items-start gap-4 pr-8">
                            <div className="flex gap-4">
                              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                <MapPin className="h-5 w-5" />
                              </div>
                              <div className="min-w-0 text-left">
                                <p className="font-bold text-sm">{addr.lastName} {addr.firstName}</p>
                                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-[10px] text-muted-foreground font-medium">
                                  {addr.phone && <span className="flex items-center gap-1"><Smartphone className="h-2.5 w-2.5" /> {addr.phone}</span>}
                                </div>
                                <p className="text-[11px] text-muted-foreground leading-relaxed mt-2 line-clamp-2">
                                  {addr.area}, {addr.district}, {addr.subDistrict}<br/>
                                  {addr.building}, {addr.street}
                                </p>
                              </div>
                            </div>
                          </div>
                          <button 
                            onClick={(e) => handleDelete(e, addr.id)}
                            className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-8 space-y-6 pb-24 text-left">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase ml-1">{isEn ? 'Last Name' : '姓氏 (Last Name)'}</Label>
                    <Input value={newAddr.lastName} onChange={e => setNewAddr({...newAddr, lastName: e.target.value})} className="h-11 border-none bg-white rounded-xl shadow-sm font-bold" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase ml-1">{isEn ? 'First Name' : '名字 (First Name)'}</Label>
                    <Input value={newAddr.firstName} onChange={e => setNewAddr({...newAddr, firstName: e.target.value})} className="h-11 border-none bg-white rounded-xl shadow-sm font-bold" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase ml-1">{isEn ? 'Phone' : '電話 (Phone)'}</Label>
                  <Input value={newAddr.phone} onChange={e => setNewAddr({...newAddr, phone: e.target.value})} className="h-11 border-none bg-white rounded-xl shadow-sm font-bold" />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase ml-1">{isEn ? 'Country / Region' : '國家 / 地區'}</Label>
                  <Select value={newAddr.country} onValueChange={v => setNewAddr({...newAddr, country: v})}>
                    <SelectTrigger className="h-11 border-none bg-white rounded-xl font-bold"><SelectValue placeholder="Select Country" /></SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-2xl">
                      {COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {newAddr.country === 'Hong Kong' ? (
                  <div className="space-y-6 animate-in fade-in">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-[9px] font-black uppercase ml-1">區域</Label>
                        <Select value={newAddr.area} onValueChange={v => setNewAddr({...newAddr, area: v, district: "", subDistrict: ""})}>
                          <SelectTrigger className="h-10 bg-white border-none rounded-xl text-xs"><SelectValue placeholder="Area" /></SelectTrigger>
                          <SelectContent>{Object.keys(HK_ADDRESS_DATA).map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[9px] font-black uppercase ml-1">地區</Label>
                        <Select value={newAddr.district} onValueChange={v => setNewAddr({...newAddr, district: v, subDistrict: ""})} disabled={!newAddr.area}>
                          <SelectTrigger className="h-10 bg-white border-none rounded-xl text-xs"><SelectValue placeholder="Dist" /></SelectTrigger>
                          <SelectContent>{districtOptions.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[9px] font-black uppercase ml-1">分區</Label>
                        <Select value={newAddr.subDistrict} onValueChange={v => setNewAddr({...newAddr, subDistrict: v})} disabled={!newAddr.district}>
                          <SelectTrigger className="h-10 bg-white border-none rounded-xl text-xs"><SelectValue placeholder="Sub" /></SelectTrigger>
                          <SelectContent>{subDistrictOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase ml-1">大廈名稱 (Building)</Label>
                      <Input value={newAddr.building} onChange={e => setNewAddr({...newAddr, building: e.target.value})} className="h-11 border-none bg-white rounded-xl shadow-sm" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase ml-1">街道及號碼 (Street)</Label>
                      <Input value={newAddr.street} onChange={e => setNewAddr({...newAddr, street: e.target.value})} className="h-11 border-none bg-white rounded-xl shadow-sm" />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2"><Label className="text-[10px] font-black uppercase ml-1">City</Label><Input value={newAddr.city} onChange={e => setNewAddr({...newAddr, city: e.target.value})} className="h-11 border-none bg-white rounded-xl shadow-sm" /></div>
                    <div className="space-y-2"><Label className="text-[10px] font-black uppercase ml-1">Address Line</Label><Input value={newAddr.street} onChange={e => setNewAddr({...newAddr, street: e.target.value})} className="h-11 border-none bg-white rounded-xl shadow-sm" /></div>
                  </div>
                )}

                <div className="flex gap-4 pt-4 sticky bottom-0 bg-slate-50 py-4 border-t border-dashed">
                  <Button variant="ghost" onClick={() => setView('list')} className="flex-1 rounded-xl h-12 font-bold">{isEn ? 'Cancel' : '取消'}</Button>
                  <Button 
                    onClick={handleAddNew} 
                    disabled={isSaving || !newAddr.lastName || !newAddr.phone}
                    className="flex-[2] bg-primary text-primary-foreground font-black h-12 rounded-xl shadow-lg gap-2"
                  >
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {isEn ? 'Save & Use' : '儲存並使用此地址'}
                  </Button>
                </div>
              </div>
            )}
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}