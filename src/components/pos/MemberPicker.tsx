"use client";

import { useState, useMemo, useEffect } from "react";
import { 
  Search, 
  UserCheck, 
  UserPlus, 
  ChevronRight, 
  Loader2, 
  X, 
  Smartphone, 
  Mail, 
  User, 
  AlertTriangle, 
  RefreshCcw, 
  ShieldAlert,
  Globe,
  Plus,
  ArrowLeft,
  Save,
  CheckCircle2,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useFirestore, useUser } from "@/firebase";
import { collection, query, where, getDocs, limit, orderBy, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";

interface MemberPickerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (member: any) => void;
}

export function MemberPicker({ isOpen, onOpenChange, onSelect }: MemberPickerProps) {
  const db = useFirestore();
  const { toast } = useToast();
  const { isStaff, userData } = useUser();
  
  const [view, setView] = useState<'search' | 'create'>('search');
  const [search, setSearch] = useState("");
  const [allLoadedMembers, setAllLoadedMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorInfo, setErrorInfo] = useState<string | null>(null);

  // 快速登記表單狀態
  const [newMember, setNewMember] = useState({
    lastName: "",
    firstName: "",
    phone: "",
    email: ""
  });

  // 1. 初始化：載入最近 1000 名會員作為「熱搜尋池」
  const fetchInitialPool = async () => {
    if (!db || !isStaff) return;
    setLoading(true);
    setErrorInfo(null);
    try {
      const q = query(
        collection(db, 'users'), 
        where('isAnonymous', '==', false),
        orderBy('updatedAt', 'desc'), 
        limit(1000)
      );
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setAllLoadedMembers(list);
    } catch (e: any) {
      console.error("[MemberPicker] Initial fetch failed:", e.message);
      if (e.message?.includes('permissions')) {
        setErrorInfo("權限不足：您的帳號在 shoppoint-hk 資料庫中尚未被設為 Superadmin/Staff。");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && isStaff && allLoadedMembers.length === 0) {
      fetchInitialPool();
    }
  }, [isOpen, isStaff, db]);

  // 2. 核心搜尋邏輯：本地模糊過濾
  const filteredResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allLoadedMembers.slice(0, 50);

    return allLoadedMembers.filter(m => 
      String(m.displayName || "").toLowerCase().includes(q) ||
      String(m.email || "").toLowerCase().includes(q) ||
      String(m.phone || "").includes(q)
    );
  }, [search, allLoadedMembers]);

  // 3. 深度搜尋：全域精確查詢
  const handleDeepSearch = async () => {
    const qText = search.trim().toLowerCase();
    if (!qText || !db) return;
    
    setLoading(true);
    try {
      const usersRef = collection(db, 'users');
      const [emailSnap, phoneSnap] = await Promise.all([
        getDocs(query(usersRef, where('email', '==', qText), limit(1))),
        getDocs(query(usersRef, where('phone', '==', qText), limit(1)))
      ]);

      const found: any[] = [];
      emailSnap.forEach(d => found.push({ id: d.id, ...d.data() }));
      phoneSnap.forEach(d => found.push({ id: d.id, ...d.data() }));

      if (found.length > 0) {
        setAllLoadedMembers(prev => {
          const next = [...prev];
          found.forEach(f => {
            if (!next.find(n => n.id === f.id)) next.push(f);
          });
          return next;
        });
        toast({ title: "已從全域資料庫尋獲會員" });
      } else {
        toast({ title: "全域搜尋無結果", description: "請檢查輸入是否正確。", variant: "warning" });
      }
    } catch (e: any) {
      toast({ title: "搜尋失敗", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  /**
   * 執行快速登記邏輯 (僅限 POS/後台)
   */
  const handleQuickRegister = async () => {
    if (!newMember.lastName || !newMember.phone || !db) return;
    
    setLoading(true);
    try {
      // 1. 檢查電話是否已存在
      const q = query(collection(db, 'users'), where('phone', '==', newMember.phone.trim()), limit(1));
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        toast({ 
          title: "號碼已登記", 
          description: "此電話號碼已有關聯會員，請直接使用搜尋功能。", 
          variant: "destructive" 
        });
        setLoading(false);
        return;
      }

      // 2. 建立新檔案
      const displayName = `${newMember.lastName} ${newMember.firstName}`.trim();
      const userDataToSave = {
        displayName,
        phone: newMember.phone.trim(),
        email: newMember.email.trim() || null,
        role: "Customer",
        tier: "classic",
        status: "Active",
        points: 0,
        isAnonymous: true, // 標註為由 POS/Admin 手動建立的非 Auth 帳號
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        source: 'POS_Quick_Register'
      };

      const docRef = await addDoc(collection(db, 'users'), userDataToSave);
      
      const createdMember = {
        id: docRef.id,
        uid: docRef.id,
        ...userDataToSave
      };

      // 3. 更新本地池
      setAllLoadedMembers(prev => [createdMember, ...prev]);
      
      toast({ title: "登記成功", description: `會員 ${displayName} 已建立。` });
      
      // 4. 自動選取並關閉
      onSelect(createdMember);
      onOpenChange(false);
      resetForm();
    } catch (e: any) {
      toast({ title: "登記失敗", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNewMember({ lastName: "", firstName: "", phone: "", email: "" });
    setView('search');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(v) => { onOpenChange(v); if(!v) resetForm(); }}>
      <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="p-8 bg-primary text-primary-foreground shrink-0 relative overflow-hidden text-left">
          <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12"><User className="h-32 w-32" /></div>
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-1">
              <DialogTitle className="text-2xl font-black font-headline">
                {view === 'search' ? "連結會員帳戶" : "快速會員登記"}
              </DialogTitle>
              <DialogDescription className="text-primary-foreground/80 font-medium">
                {view === 'search' ? "即時檢索全站會員資料" : "在 POS 現場為客人建立簡易檔案"}
              </DialogDescription>
            </div>
            {view === 'search' ? (
              <Button onClick={() => setView('create')} className="bg-white text-primary hover:bg-white/90 rounded-xl font-black shadow-lg gap-2">
                <Plus className="h-4 w-4" /> 快速登記
              </Button>
            ) : (
              <Button variant="ghost" onClick={() => setView('search')} className="text-white hover:bg-white/20 rounded-xl font-bold gap-2">
                <ArrowLeft className="h-4 w-4" /> 返回搜尋
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="p-8 space-y-6 bg-white">
          {!isStaff ? (
             <div className="p-6 bg-red-50 border-2 border-dashed border-red-200 rounded-[2rem] text-center space-y-4">
                <ShieldAlert className="h-10 w-10 text-red-500 mx-auto" />
                <div className="space-y-1">
                  <p className="font-black text-red-900">存取權限受阻</p>
                  <p className="text-xs text-red-700 leading-relaxed">
                    您的帳號目前尚未具備 Staff 權限，無法管理會員。
                  </p>
                </div>
                <Button variant="outline" className="w-full rounded-xl border-red-200 text-red-700 font-bold" onClick={fetchInitialPool}>
                   <RefreshCcw className="mr-2 h-4 w-4" /> 重新嘗試讀取
                </Button>
             </div>
          ) : view === 'search' ? (
            <>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
                  <Input 
                    placeholder="輸入姓名、電郵或電話..." 
                    className="pl-12 h-12 bg-muted/20 border-none rounded-2xl text-lg font-bold shadow-inner" 
                    value={search} 
                    onChange={(e) => setSearch(e.target.value)} 
                  />
                </div>
                {search.length > 3 && (
                   <Button variant="outline" className="h-12 px-4 rounded-2xl font-black border-primary text-primary gap-2" onClick={handleDeepSearch} disabled={loading}>
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Globe className="h-4 w-4" />}
                   </Button>
                )}
              </div>

              <ScrollArea className="h-80">
                <div className="space-y-2 pr-4">
                  {filteredResults.map((member) => (
                    <div 
                      key={member.id} 
                      className="p-4 rounded-2xl border-2 border-transparent bg-muted/20 flex items-center justify-between cursor-pointer hover:border-primary/20 hover:bg-white group transition-all"
                      onClick={() => onSelect(member)}
                    >
                      <div className="flex items-center gap-4">
                        <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                          <AvatarFallback className="bg-primary/20 text-primary font-black">
                            {(member.displayName || member.email || "U").charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-bold text-sm truncate">{member.displayName || "匿名會員"}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {member.phone && <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium"><Smartphone className="h-2.5 w-2.5" />{member.phone}</span>}
                            {member.email && <span className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium"><Mail className="h-2.5 w-2.5" />{member.email}</span>}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0" />
                    </div>
                  ))}
                  
                  {filteredResults.length === 0 && !loading && (
                    <div className="py-12 text-center text-muted-foreground italic flex flex-col items-center gap-3">
                       <Search className="h-10 w-10 opacity-10" />
                       <p className="text-sm">本地池無相符結果，請嘗試全域搜尋或快速登記。</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </>
          ) : (
            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">姓氏 (Last Name) *</Label>
                  <Input 
                    value={newMember.lastName} 
                    onChange={e => setNewMember({...newMember, lastName: e.target.value})} 
                    className="h-12 bg-muted/20 border-none rounded-xl font-bold"
                    placeholder="例如：陳"
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">名字 (First Name)</Label>
                  <Input 
                    value={newMember.firstName} 
                    onChange={e => setNewMember({...newMember, firstName: e.target.value})} 
                    className="h-12 bg-muted/20 border-none rounded-xl font-bold"
                    placeholder="例如：小明"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">手提電話 (Mobile) *</Label>
                <div className="relative">
                  <Smartphone className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
                  <Input 
                    value={newMember.phone} 
                    onChange={e => setNewMember({...newMember, phone: e.target.value})} 
                    className="pl-10 h-12 bg-muted/20 border-none rounded-xl font-black text-lg"
                    placeholder="91234567"
                    type="tel"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">電子郵件 (選填)</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3.5 h-5 w-5 text-muted-foreground" />
                  <Input 
                    value={newMember.email} 
                    onChange={e => setNewMember({...newMember, email: e.target.value})} 
                    className="pl-10 h-12 bg-muted/20 border-none rounded-xl font-medium"
                    placeholder="example@mail.com"
                    type="email"
                  />
                </div>
              </div>

              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex items-start gap-3">
                <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-[10px] text-blue-800 leading-relaxed font-medium">
                  快速登記僅會在資料庫建立檔案，以便 POS 累積積分。客人日後若要登入網店，需使用相同電郵自行註冊。
                </p>
              </div>

              <Button 
                onClick={handleQuickRegister}
                disabled={loading || !newMember.lastName || !newMember.phone}
                className="w-full h-14 bg-primary text-primary-foreground font-black text-lg rounded-2xl shadow-xl gap-2 active:scale-95 transition-all"
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
                確認登記並選取
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
