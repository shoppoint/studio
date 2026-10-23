
"use client";

import { useState } from "react";
import { useAuth, useFirestore } from "@/firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail
} from "firebase/auth";
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Ticket, ArrowLeft, Mail, Lock } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useI18n } from "@/lib/i18n/i18n-context";
import { triggerNotification } from "@/services/communication-service";
import Link from "next/link";

export default function LoginPage() {
  const { t, lang } = useI18n();
  const [view, setView] = useState<'login' | 'register' | 'reset'>('login');
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const router = useRouter();
  const { toast } = useToast();
  const auth = useAuth();
  const db = useFirestore();
  const isEn = lang === 'en';

  const getFriendlyMessage = (code: string) => {
    switch (code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
        return isEn ? "Incorrect email or password." : "電郵或密碼錯誤。";
      case 'auth/user-not-found':
        return isEn ? "Account does not exist." : "找不到此帳號。";
      case 'auth/email-already-in-use':
        return isEn ? "This email is already registered." : "此電郵已在系統中登記。";
      case 'auth/weak-password':
        return isEn ? "Password too weak. Min. 8 characters with symbols." : "密碼強度不足：須至少 8 位並包含大小寫字母、數字及符號。";
      case 'auth/invalid-email':
        return isEn ? "Invalid email format." : "電郵格式錯誤。";
      case 'auth/too-many-requests':
        return isEn ? "Too many attempts. Please try later." : "嘗試次數過多，請稍後再試。";
      default:
        return isEn ? "Authentication error." : "認證出錯，請稍後再試。";
    }
  };

  const ensureUserDocument = async (user: any, isNewRegistration = false) => {
    if (!db) return;
    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);
    const superAdminEmails = ['shoppoint.hk@gmail.com', 'bsconcept.hk@gmail.com'];
    const isSuperAdmin = user.email && superAdminEmails.includes(user.email.toLowerCase());
    
    const shouldInitialize = !snap.exists() || snap.data()?.role === 'Guest' || isNewRegistration;

    if (shouldInitialize) {
      const baseData = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || user.email?.split('@')[0],
        role: isSuperAdmin ? "Superadmin" : "Customer", 
        tier: "classic",
        status: "Active",
        isWelcomePointsAwarded: false, 
        referredByCode: referralCode || null,
        createdAt: snap.data()?.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp(),
        isAnonymous: false,
        signInProvider: user.providerData[0]?.providerId || "password"
      };

      await setDoc(userRef, baseData, { merge: true });

      triggerNotification(db, 'welcome_msg', baseData, lang).catch(e => {
        console.warn("[LoginPage] Welcome notification failed", e.message);
      });
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || (view !== 'reset' && !password)) return;
    
    if (view === 'register' && !agreedToTerms) {
      toast({ 
        title: isEn ? "Agreement Required" : "請同意條款", 
        description: isEn ? "Please read and agree to our terms before signing up." : "註冊前請先閱讀並同意服務條款及私隱政策。",
        variant: "warning" 
      });
      return;
    }
    
    setLoading(true);
    try {
      if (view === 'reset') {
        await sendPasswordResetEmail(auth, email);
        toast({ title: isEn ? "Reset Link Sent" : "重設連結已發送", description: "請檢查您的電子郵件信箱。" });
        setView('login');
      } else if (view === 'login') {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        await ensureUserDocument(userCredential.user, false);
        toast({ title: "登入成功" });
        router.push("/");
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await ensureUserDocument(userCredential.user, true);
        toast({ title: "註冊成功" });
        router.push("/");
      }
    } catch (error: any) {
      toast({ title: "驗證失敗", description: getFriendlyMessage(error.code), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      await ensureUserDocument(result.user, false);
      toast({ title: "登入成功" });
      router.push("/");
    } catch (error: any) {
      toast({ title: "Google 登入失敗", description: getFriendlyMessage(error.code), variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-muted/20">
      <Navbar />
      <main className="flex-grow flex items-center justify-center p-4 py-12">
        <Card className="w-full max-w-md border-none shadow-xl bg-white rounded-3xl overflow-hidden">
          <CardHeader className="text-center bg-primary/5 pt-10 pb-8">
            <div className="flex items-center gap-4 px-4">
              {view !== 'login' && (
                <button onClick={() => setView('login')} className="p-1 hover:bg-black/5 rounded-full transition-colors">
                  <ArrowLeft className="h-6 w-6" />
                </button>
              )}
              <CardTitle className="text-3xl font-black font-headline">
                {view === 'login' ? "歡迎回來" : view === 'register' ? "建立帳號" : "重設密碼"}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 p-8">
            {view !== 'reset' && (
              <>
                <Button variant="outline" className="w-full h-12 rounded-xl font-bold gap-2" onClick={handleGoogleSignIn}>
                  <img src="https://www.google.com/favicon.ico" className="h-4 w-4" alt="Google" />
                  使用 Google 快速登入
                </Button>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-muted-foreground font-black tracking-widest">或使用電郵方式</span></div>
                </div>
              </>
            )}
            <form onSubmit={handleAuth} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[10px] font-black uppercase text-muted-foreground ml-1">電郵地址 Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="rounded-xl h-11 bg-muted/20 border-none font-bold" />
              </div>
              
              {view !== 'reset' && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center px-1">
                    <Label htmlFor="password" className="text-[10px] font-black uppercase text-muted-foreground">密碼 Password</Label>
                    {view === 'login' && (
                      <button type="button" onClick={() => setView('reset')} className="text-[10px] font-black text-primary hover:underline">忘記密碼？</button>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="pl-10 h-11 bg-muted/20 border-none rounded-xl font-bold" />
                  </div>
                  {view === 'register' && (
                    <p className="text-[9px] text-muted-foreground ml-1 font-bold italic">
                      {isEn ? "* Min. 8 characters with A-z, 0-9 & symbols" : "* 長度至少 8 位，須含大小寫字母、數字及符號"}
                    </p>
                  )}
                </div>
              )}
              
              {view === 'register' && (
                <>
                  <div className="space-y-2 pt-2">
                    <Label htmlFor="referralCode" className="flex items-center gap-2 text-primary font-black uppercase text-[10px] tracking-widest ml-1"><Ticket className="h-3" /> 邀請碼 (選填)</Label>
                    <Input id="referralCode" placeholder="CODE" value={referralCode} onChange={(e) => setReferralCode(e.target.value.toUpperCase())} className="rounded-xl h-11 font-mono uppercase bg-muted/20 border-none tracking-widest" />
                  </div>
                  <div className="flex items-start space-x-3 p-4 bg-primary/5 rounded-2xl border border-primary/10 transition-all">
                    <Checkbox id="terms-page" checked={agreedToTerms} onCheckedChange={(c) => setAgreedToTerms(!!c)} className="mt-1" />
                    <Label htmlFor="terms-page" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
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
                className="w-full h-14 bg-primary text-primary-foreground font-black text-lg rounded-2xl shadow-lg mt-4 active:scale-95 transition-all" 
                disabled={loading || (view === 'register' && !agreedToTerms)}
              >
                {loading ? <Loader2 className="animate-spin h-5 w-5" /> : (view === 'login' ? "立即登入" : view === 'register' ? "確認註冊新帳號" : "發送重設郵件")}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="justify-center pb-10">
            {view === 'login' ? (
              <button onClick={() => setView('register')} className="text-primary font-bold hover:underline">尚未有帳號？按此註冊</button>
            ) : (
              <button onClick={() => setView('login')} className="text-muted-foreground font-bold hover:text-primary transition-colors">返回登入介面</button>
            )}
          </CardFooter>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
