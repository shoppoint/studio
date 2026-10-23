
"use client";

import { useState, useEffect } from "react";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  linkWithCredential,
  EmailAuthProvider,
  sendPasswordResetEmail
} from "firebase/auth";
import { doc, setDoc, serverTimestamp, getDoc, collection, query, where, getDocs, limit } from "firebase/firestore";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, User, Sparkles, Mail, Lock, Ticket, ArrowLeft } from "lucide-react";
import { useAuth, useFirestore } from "@/firebase";
import { useI18n } from "@/lib/i18n/i18n-context";
import { useToast } from "@/hooks/use-toast";
import { triggerNotification } from "@/services/communication-service";
import Link from "next/link";

interface LoginDialogProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function LoginDialog({ trigger, open: controlledOpen, onOpenChange: setControlledOpen }: LoginDialogProps) {
  const { lang } = useI18n();
  const { toast } = useToast();
  const auth = useAuth();
  const db = useFirestore();
  const isEn = lang === 'en';

  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setIsOpen = setControlledOpen !== undefined ? setControlledOpen : setInternalOpen;

  const [view, setView] = useState<'login' | 'register' | 'reset'>('login');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const getFriendlyMessage = (code: string) => {
    switch (code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
        return isEn ? "Incorrect email or password." : "登入失敗：電郵或密碼錯誤。";
      case 'auth/user-not-found':
        return isEn ? "Account does not exist." : "登入失敗：找不到此帳號。";
      case 'auth/email-already-in-use':
        return isEn ? "This email is already registered." : "註冊失敗：此電郵已在系統中登記。";
      case 'auth/weak-password':
        return isEn ? "Password too weak. Min. 8 characters with symbols." : "密碼強度不足：須至少 8 位並包含大小寫字母、數字及符號。";
      case 'auth/invalid-email':
        return isEn ? "Invalid email format." : "電郵格式錯誤，請檢查後再試。";
      case 'auth/too-many-requests':
        return isEn ? "Too many attempts. Please try later." : "嘗試次數過多，請稍後再試。";
      case 'auth/network-request-failed':
        return isEn ? "Network error. Please check your connection." : "網絡連線失敗，請檢查您的網路狀態。";
      case 'auth/user-disabled':
        return isEn ? "This account has been disabled." : "此帳號已被停用，請聯絡客服。";
      default:
        return isEn ? "Authentication error. Please try again." : "認證出錯，請稍後再試。";
    }
  };

  const syncUserToFirestore = async (user: any, isNewRegistration = false, providedCode = "") => {
    if (!db) return;
    const userRef = doc(db, 'users', user.uid);
    
    try {
      const userSnap = await getDoc(userRef);
      const existingData = userSnap.exists() ? userSnap.data() : null;
      
      const superAdminEmails = ['shoppoint.hk@gmail.com', 'bsconcept.hk@gmail.com'];
      const isSuperAdmin = user.email && superAdminEmails.includes(user.email.toLowerCase());
      
      const baseData: any = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email?.split('@')[0],
        updatedAt: serverTimestamp(),
        isAnonymous: false 
      };

      const shouldInitializeProfile = !userSnap.exists() || existingData?.role === 'Guest' || isNewRegistration;

      if (shouldInitializeProfile) {
        baseData.role = isSuperAdmin ? "Superadmin" : "Customer";
        baseData.tier = existingData?.tier || 'classic';
        baseData.status = "Active";
        baseData.isWelcomePointsAwarded = false; 
        baseData.createdAt = existingData?.createdAt || serverTimestamp();
        
        if (isNewRegistration && providedCode.trim()) {
          baseData.referredByCode = providedCode.trim().toUpperCase();
        }
      } else if (isSuperAdmin) {
        baseData.role = "Superadmin";
      }

      await setDoc(userRef, baseData, { merge: true });

      if (shouldInitializeProfile) {
        triggerNotification(db, 'welcome_msg', baseData, lang).catch(err => {
          console.warn("[LoginDialog] Welcome notification trigger failed:", err.message);
        });
      }
    } catch (e) {
      console.error("[LoginDialog] Firestore sync error:", e);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || (view !== 'reset' && !password)) return;
    
    if (view === 'register' && !agreedToTerms) {
      toast({ 
        title: isEn ? "Agreement Required" : "請同意條款", 
        description: isEn ? "Please read and agree to our terms to continue." : "註冊前請先閱讀並同意服務條款及私隱政策。",
        variant: "warning" 
      });
      return;
    }
    
    setLoading(true);
    try {
      if (view === 'reset') {
        await sendPasswordResetEmail(auth, email);
        toast({ 
          title: isEn ? "Reset Email Sent" : "重設郵件已發送", 
          description: isEn ? "Please check your inbox." : "請檢查您的電子郵件信箱。" 
        });
        setView('login');
      } else if (view === 'login') {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        await syncUserToFirestore(userCredential.user, false);
        toast({ title: isEn ? "Login Successful" : "登入成功" });
        setIsOpen(false);
      } else {
        const currentUser = auth.currentUser;
        if (currentUser && currentUser.isAnonymous) {
          const credential = EmailAuthProvider.credential(email, password);
          const userCredential = await linkWithCredential(currentUser, credential);
          await syncUserToFirestore(userCredential.user, true, referralCode);
        } else {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          await syncUserToFirestore(userCredential.user, true, referralCode);
        }
        toast({ title: isEn ? "Registration Successful" : "註冊成功" });
        setIsOpen(false);
      }
    } catch (error: any) {
      toast({ title: isEn ? "Failed" : "操作失敗", description: getFriendlyMessage(error.code), variant: "warning" });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const currentUser = auth.currentUser;
      let result;
      if (currentUser && currentUser.isAnonymous) {
        const googleResult = await signInWithPopup(auth, provider);
        const credential = GoogleAuthProvider.credentialFromResult(googleResult);
        if (credential) result = await linkWithCredential(currentUser, credential);
        else result = googleResult;
      } else {
        result = await signInWithPopup(auth, provider);
      }
      await syncUserToFirestore(result.user, false);
      toast({ title: isEn ? "Login Successful" : "登入成功" });
      setIsOpen(false);
    } catch (error: any) {
      toast({ title: "Login Error", description: getFriendlyMessage(error.code), variant: "warning" });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(v) => { setIsOpen(v); if(!v) setView('login'); }}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-md rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="p-8 bg-primary text-primary-foreground text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 rotate-12"><Sparkles className="h-32 w-32" /></div>
          <div className="relative z-10 flex items-center gap-4">
            {view !== 'login' && (
              <button onClick={() => setView('login')} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                <ArrowLeft className="h-6 w-6" />
              </button>
            )}
            <div className="text-left">
              <DialogTitle className="text-2xl font-black font-headline">
                {view === 'login' ? (isEn ? "Welcome Back" : "歡迎回來") : 
                 view === 'register' ? (isEn ? "Join Shop Point" : "建立帳號") : 
                 (isEn ? "Reset Password" : "重設密碼")}
              </DialogTitle>
              <DialogDescription className="text-primary-foreground/80 font-medium">
                {view === 'login' ? "登入以管理訂單與領取優惠" : 
                 view === 'register' ? "註冊即享迎新積分獎賞" : 
                 "我們將發送郵件協助您找回密碼"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-8 space-y-6 bg-white">
          {view !== 'reset' && (
            <>
              <Button variant="outline" className="w-full h-12 rounded-xl font-bold border-muted-foreground/20 gap-2 flex items-center justify-center bg-white" onClick={handleGoogleSignIn}>
                <img src="https://www.google.com/favicon.ico" className="h-4 w-4" alt="Google" />
                使用 Google 快速登入
              </Button>
              <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-muted" /></div>
                <div className="relative flex justify-center text-[10px] uppercase"><span className="bg-white px-2 text-muted-foreground font-black tracking-widest">或使用電郵方式</span></div>
              </div>
            </>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-[10px] font-black uppercase text-muted-foreground ml-1">電子郵件 Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input type="email" placeholder="example@mail.com" value={email} onChange={e => setEmail(e.target.value)} required className="pl-10 h-11 bg-muted/20 border-none rounded-xl font-bold" />
              </div>
            </div>

            {view !== 'reset' && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-[10px] font-black uppercase text-muted-foreground ml-1">密碼 Password</Label>
                  {view === 'login' && (
                    <button type="button" onClick={() => setView('reset')} className="text-[10px] font-black text-primary hover:underline">忘記密碼？</button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required className="pl-10 h-11 bg-muted/20 border-none rounded-xl font-bold" />
                </div>
                <p className="text-[9px] text-muted-foreground ml-1 font-bold italic">
                  {isEn ? "* Min. 8 characters with A-z, 0-9 & symbols" : "* 長度至少 8 位，須含大小寫字母、數字及符號"}
                </p>
              </div>
            )}

            {view === 'register' && (
              <>
                <div className="space-y-2 pt-2 animate-in slide-in-from-top-2">
                  <Label className="flex items-center gap-2 text-primary font-black uppercase text-[10px] tracking-widest ml-1">
                    <Ticket className="h-3" /> {isEn ? "Referral Code (Optional)" : "邀請碼 (選填)"}
                  </Label>
                  <Input placeholder="CODE" value={referralCode} onChange={e => setReferralCode(e.target.value.toUpperCase())} className="h-11 bg-muted/20 border-none rounded-xl font-mono uppercase tracking-widest" />
                </div>
                <div className="flex items-start space-x-3 p-4 bg-primary/5 rounded-2xl border border-primary/10 transition-all">
                  <Checkbox id="terms-modal" checked={agreedToTerms} onCheckedChange={(c) => setAgreedToTerms(!!c)} className="mt-1" />
                  <Label htmlFor="terms-modal" className="text-xs text-muted-foreground font-medium leading-relaxed cursor-pointer text-slate-700">
                    我已閱讀並同意 SHOP POINT 的 
                    <Link href="/terms" className="text-primary underline mx-1">服務條款</Link> 
                    與 
                    <Link href="/privacy" className="text-primary underline mx-1">私隱政策</Link>。
                  </Label>
                </div>
              </>
            )}

            <Button 
              type="submit" 
              className="w-full h-14 bg-primary text-primary-foreground font-black text-lg rounded-2xl shadow-lg mt-2 active:scale-95 transition-all" 
              disabled={loading || (view === 'register' && !agreedToTerms)}
            >
              {loading ? <Loader2 className="animate-spin h-5 w-5" /> : 
               view === 'login' ? "立即登入" : 
               view === 'register' ? "確認註冊" : "發送重設郵件"}
            </Button>
          </form>

          {view === 'login' ? (
            <button onClick={() => setView('register')} className="w-full text-center text-xs font-bold text-primary hover:underline decoration-primary/30">尚未有帳號？按此註冊新帳戶</button>
          ) : (
            <button onClick={() => setView('login')} className="w-full text-center text-xs font-bold text-muted-foreground hover:text-primary transition-colors">返回登入介面</button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
