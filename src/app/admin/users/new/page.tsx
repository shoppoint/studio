
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { initializeApp, deleteApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut as authSignOut } from "firebase/auth";
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  User, 
  Mail, 
  Lock, 
  UserCog, 
  Crown,
  ShieldCheck,
  CheckCircle2,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useI18n } from "@/lib/i18n/i18n-context";
import { useToast } from "@/hooks/use-toast";
import { firebaseConfig } from "@/firebase/config";
import { useFirestore } from "@/firebase";
import { Separator } from "@/components/ui/separator";

export default function AddUserPage() {
  const router = useRouter();
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const db = useFirestore();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    displayName: "",
    role: "Customer",
    tier: "classic"
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  /**
   * 核心邏輯：透過臨時 Firebase App 實例建立帳號
   * 修正：手動建立帳號時同樣賦予迎新積分並標記已發放。
   */
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) return;

    setLoading(true);
    let tempApp: any = null;

    try {
      // 1. 獲取迎新積分設定
      if (!db) throw new Error("Database not ready");
      const loyaltySnap = await getDoc(doc(db, 'config', 'loyalty'));
      const welcomePoints = loyaltySnap.exists() ? (Number(loyaltySnap.data().welcomePoints) || 0) : 100;

      // 2. 建立一個具名的臨時 App 實例
      const tempAppName = `AdminTempApp-${Date.now()}`;
      tempApp = initializeApp(firebaseConfig, tempAppName);
      const tempAuth = getAuth(tempApp);

      // 3. 在臨時實例中建立帳號
      const userCredential = await createUserWithEmailAndPassword(
        tempAuth, 
        formData.email, 
        formData.password
      );
      
      const uid = userCredential.user.uid;

      // 4. 在主資料庫中建立使用者 Profile 文件，並套用迎新積分與標記
      const userRef = doc(db, 'users', uid);
      await setDoc(userRef, {
        uid: uid,
        email: formData.email,
        displayName: formData.displayName || formData.email.split('@')[0],
        role: formData.role,
        tier: formData.tier,
        status: "Active",
        points: welcomePoints, 
        isWelcomePointsAwarded: true, // 核心修正：手動建立亦標記為已發放
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isAnonymous: false,
        signInProvider: "password"
      });

      // 5. 立即登出臨時實例
      await authSignOut(tempAuth);

      toast({ 
        title: lang === 'en' ? "Account Created" : "帳號建立成功", 
        description: lang === 'en' 
          ? `User added with ${welcomePoints} welcome points.` 
          : `使用者已成功建立，並已發放 ${welcomePoints} 迎新積分。` 
      });
      router.push("/admin/users");
    } catch (error: any) {
      console.error("Error creating user:", error);
      
      let errorDescription = error.message;
      if (error.code === 'auth/email-already-in-use') {
        errorDescription = lang === 'en' 
          ? "This email is already registered." 
          : "此電子郵件地址已在系統中註冊。";
      }

      toast({ 
        title: lang === 'en' ? "Creation Failed" : "建立失敗", 
        description: errorDescription, 
        variant: "destructive" 
      });
    } finally {
      if (tempApp) {
        try {
          await deleteApp(tempApp);
        } catch (err) {
          console.error("Error deleting temp app:", err);
        }
      }
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold font-headline">{t.admin.users.add_user}</h1>
            <p className="text-muted-foreground">為系統手動建立新的登入帳號及權限檔。</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleCreateUser}>
        <div className="grid grid-cols-1 gap-8">
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
            <CardHeader className="bg-muted/10 border-b">
              <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                帳號憑證設定 (Authentication)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="grid gap-2">
                  <Label htmlFor="email" className="font-bold">電子郵件 (Login Email)</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="email" 
                      type="email" 
                      required 
                      placeholder="user@example.com" 
                      className="pl-10 h-11 bg-muted/20 border-none rounded-xl"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="password" className="font-bold">初始密碼 (Password)</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="password" 
                      type="password" 
                      required 
                      placeholder="Min. 8 chars, A-z, 0-9, !@#" 
                      className="pl-10 h-11 bg-muted/20 border-none rounded-xl"
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground flex items-start gap-2 bg-blue-50 p-3 rounded-lg border border-blue-100">
                <Info className="h-4 w-4 text-blue-600 shrink-0" />
                請確保密碼符合目前 Firebase 設定：最少 8 位，包含大小寫字母、數字及符號。系統會自動套用「迎新積分」至新帳戶。
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-3xl overflow-hidden bg-white">
            <CardHeader className="bg-muted/10 border-b">
              <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <UserCog className="h-5 w-5 text-primary" />
                系統權限與資料 (Profile)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              <div className="grid gap-2">
                <Label htmlFor="displayName" className="font-bold">顯示名稱</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="displayName" 
                    placeholder="e.g. Alex Wong" 
                    className="pl-10 h-11 bg-muted/20 border-none rounded-xl"
                    value={formData.displayName}
                    onChange={(e) => handleInputChange("displayName", e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="grid gap-2">
                  <Label className="font-bold">系統角色 (Role)</Label>
                  <Select value={formData.role} onValueChange={(v) => handleInputChange("role", v)}>
                    <SelectTrigger className="h-11 bg-muted/20 border-none rounded-xl font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-2xl">
                      <SelectItem value="Customer">Customer (普通顧客)</SelectItem>
                      <SelectItem value="Vendor">Vendor (合作商家)</SelectItem>
                      <SelectItem value="ShopManager">Shop Manager (店舖經理)</SelectItem>
                      <SelectItem value="Superadmin">Superadmin (最高管理員)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label className="font-bold flex items-center gap-2"><Crown className="h-4 w-4 text-amber-500" /> 會員等級 (Tier)</Label>
                  <Select value={formData.tier} onValueChange={(v) => handleInputChange("tier", v)}>
                    <SelectTrigger className="h-11 bg-muted/20 border-none rounded-xl font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-2xl">
                      <SelectItem value="classic">Classic (普通)</SelectItem>
                      <SelectItem value="gold">Gold (金牌)</SelectItem>
                      <SelectItem value="platinum">Platinum (白金)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
            <CardFooter className="p-8 bg-muted/10 border-t flex justify-end">
              <Button 
                type="submit" 
                className="bg-primary text-primary-foreground font-black px-10 h-14 rounded-2xl shadow-xl hover:scale-105 transition-transform gap-2"
                disabled={loading || !formData.email || !formData.password}
              >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
                確認建立帳號
              </Button>
            </CardFooter>
          </Card>
        </div>
      </form>
    </div>
  );
}
