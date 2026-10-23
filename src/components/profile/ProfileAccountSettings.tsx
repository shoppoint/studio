
"use client";

import { useState } from "react";
import { 
  User, Mail, Phone, Lock, Loader2, Save, XCircle, Trash2, Building2, 
  Ticket, CheckCircle2, Zap, ArrowRight, ShieldCheck, AlertCircle,
  Sparkles, Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { claimCodeAction } from "@/app/actions/referral-actions";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export function ProfileAccountSettings({ 
  user, userData, displayName, setDisplayName, companyName, setCompanyName, phone, setPhone, 
  birthMonth, setBirthMonth, birthDay, setBirthDay, onSave, onResetPassword, 
  onToggleNewsletter, onDeleteAccount, loading, newsletterLoading, isPasswordUser, t, lang 
}: any) {
  const { toast } = useToast();
  const [claimInput, setClaimInput] = useState("");
  const [isClaiming, setIsClaiming] = useState(false);
  
  const profT = t.profile;
  const refT = profT.referral;
  const isEn = lang === 'en';

  const handleClaimCode = async () => {
    if (!claimInput.trim() || !user) return;
    setIsClaiming(true);
    try {
      const result = await claimCodeAction(user.uid, claimInput);
      if (result.success) {
        toast({ title: refT.success_claim, description: result.message });
        setClaimInput("");
        // 強制刷新頁面以更新 UserData 狀態
        window.location.reload();
      } else {
        toast({ title: refT.invalid_code, description: result.message, variant: "destructive" });
      }
    } catch (e) {
      toast({ title: "System Error", variant: "destructive" });
    } finally {
      setIsClaiming(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* 邀請碼領取區塊 (Scheme B) */}
      <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden border-l-4 border-primary">
        <CardHeader className="bg-primary/5 border-b py-5 px-8">
          <CardTitle className="text-lg flex items-center gap-3">
            <Zap className="h-5 w-5 text-primary fill-current" />
            {refT.claim_title}
          </CardTitle>
          <CardDescription>輸入好友邀請碼以獲取迎新積分，或輸入活動兌換碼領取優惠券。</CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          {userData?.referredBy ? (
            <div className="flex items-center justify-between p-5 bg-green-50 rounded-2xl border-2 border-dashed border-green-200">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-green-500 text-white flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase text-green-700 tracking-widest">已完成驗證</p>
                  <p className="font-bold text-slate-800">{refT.already_referred.replace('{name}', userData.referrerName || 'Friend')}</p>
                </div>
              </div>
              <Badge className="bg-green-600 text-white border-none font-black text-[10px]">LOCKED</Badge>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label className="text-[10px] font-black uppercase text-muted-foreground ml-1">{refT.claim_label}</Label>
                <div className="flex gap-2">
                  <Input 
                    placeholder={refT.claim_placeholder} 
                    className="h-12 bg-muted/20 border-none rounded-xl font-black uppercase tracking-widest text-lg px-6" 
                    value={claimInput}
                    onChange={(e) => setClaimInput(e.target.value)}
                  />
                  <Button 
                    className="h-12 px-8 rounded-xl font-black shadow-lg gap-2" 
                    disabled={isClaiming || !claimInput.trim()}
                    onClick={handleClaimCode}
                  >
                    {isClaiming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    {refT.claim_btn}
                  </Button>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground italic flex items-center gap-1.5 px-1">
                <Info className="h-3 w-3" /> {refT.locked_hint}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm rounded-3xl bg-white">
        <CardHeader className="border-b bg-muted/5">
          <CardTitle className="text-lg">{profT.personal_info}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="grid gap-2">
              <Label className="text-xs uppercase font-bold text-muted-foreground">{profT.display_name}</Label>
              <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="h-12 bg-muted/20 border-none rounded-xl font-bold" />
            </div>
            <div className="grid gap-2">
              <Label className="text-xs uppercase font-bold text-muted-foreground">{profT.email}</Label>
              <Input defaultValue={user?.email || ""} disabled className="h-12 bg-muted/50 border-none rounded-xl opacity-70 font-mono" />
            </div>
          </div>

          <div className="grid gap-2">
            <Label className="text-xs uppercase font-bold text-muted-foreground flex items-center gap-2">
              <Building2 className="h-3 w-3 text-primary" />
              公司名稱 (Company Name)
            </Label>
            <Input 
              value={companyName} 
              onChange={(e) => setCompanyName(e.target.value)} 
              className="h-12 bg-muted/20 border-none rounded-xl font-bold" 
              placeholder="例如：SHOP POINT Limited"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="grid gap-2">
              <Label className="text-xs uppercase font-bold text-muted-foreground">手機電話</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="h-12 bg-muted/20 border-none rounded-xl" placeholder="+852" />
            </div>
            <div className="grid gap-2">
              <Label className="text-xs uppercase font-bold text-muted-foreground">{profT.birthday}</Label>
              <div className="flex gap-2">
                <Select value={birthMonth} onValueChange={setBirthMonth}>
                  <SelectTrigger className="h-12 bg-muted/20 border-none rounded-xl font-bold"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl border-none shadow-2xl">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <SelectItem key={i+1} value={(i+1).toString().padStart(2, '0')}>{i+1} 月</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={birthDay} onValueChange={setBirthDay}>
                  <SelectTrigger className="h-12 bg-muted/20 border-none rounded-xl font-bold"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl border-none shadow-2xl">
                    {Array.from({ length: 31 }).map((_, i) => (
                      <SelectItem key={i+1} value={(i+1).toString().padStart(2, '0')}>{i+1} 日</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <Button onClick={onSave} className="bg-primary text-primary-foreground font-bold h-12 rounded-xl px-8 shadow-md" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} 更新個人資料
          </Button>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
        <CardHeader className="border-b bg-muted/5">
          <CardTitle className="text-lg flex items-center gap-2"><Mail className="h-5 w-5 text-primary" /> 電子通訊偏好</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between p-6 bg-muted/20 rounded-2xl border-2 border-dashed">
            <div className="space-y-1">
              <p className="font-bold text-sm">訂閱最新推廣及好物資訊</p>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-sm">我們將定期向您的電郵發送專屬優惠與生活貼士。</p>
            </div>
            <Switch checked={userData?.isNewsletterSubscribed || false} onCheckedChange={onToggleNewsletter} disabled={newsletterLoading} />
          </div>
        </CardContent>
      </Card>

      {isPasswordUser && (
        <Card className="border-none shadow-sm rounded-3xl bg-white border-l-4 border-blue-500 overflow-hidden">
          <CardHeader className="bg-blue-50/50 border-b py-5 px-8">
            <CardTitle className="text-lg flex items-center gap-3">
              <Lock className="h-5 w-5 text-blue-600" /> 
              {profT.security}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
              <div className="space-y-3 flex-1">
                <p className="font-black text-slate-900">{profT.change_password}</p>
                <div className="text-xs text-muted-foreground leading-relaxed space-y-2">
                  <p>{profT.password_hint}</p>
                  <Badge variant="outline" className="h-6 px-3 rounded-lg border-blue-200 text-blue-700 bg-white font-bold uppercase text-[9px] tracking-widest">
                    {isEn ? "Min. 8 chars, A-z, 0-9, !@#" : "最少 8 位，含大小寫、數字及符號"}
                  </Badge>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="rounded-xl border-blue-600 text-blue-600 font-black h-12 px-8 shadow-sm hover:bg-blue-50 transition-all gap-2" 
                onClick={onResetPassword}
              >
                <Mail className="h-4 w-4" />
                {profT.send_reset_email}
              </Button>
            </div>
            
            <Separator className="border-dashed" />
            
            <div className="p-4 bg-muted/20 rounded-2xl flex items-start gap-3">
               <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
               <p className="text-[10px] text-muted-foreground leading-relaxed italic">
                 {isEn 
                   ? "For security, you must click the link in the email to set a new password. The new password must be at least 8 characters long."
                   : "基於安全考慮，點擊郵件中的連結後，您將會被引導至安全頁面設置新密碼。新密碼需符合系統強制執行的安全規範。"}
               </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Google Login User Info */}
      {!isPasswordUser && (
        <Card className="border-none shadow-sm rounded-3xl bg-white border-l-4 border-blue-600 overflow-hidden">
          <CardHeader className="bg-blue-50 border-b py-5 px-8">
            <CardTitle className="text-lg flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-blue-600" />
              帳戶安全性
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
             <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <img src="https://www.google.com/favicon.ico" className="h-5 w-5" alt="Google" />
                </div>
                <div className="space-y-1">
                  <p className="font-bold text-slate-900">{profT.google_protected}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    您的帳戶已透過 Google 進行安全保護，登入與密碼管理均由 Google 伺服器負責，提供最高等級的安全保障。
                  </p>
                </div>
             </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden border-l-4 border-destructive">
        <CardHeader className="bg-red-50/50 border-b"><CardTitle className="text-lg flex items-center gap-2 text-destructive"><Trash2 className="h-5 w-5" /> {profT.danger_zone}</CardTitle></CardHeader>
        <CardContent className="p-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 bg-red-50/30 rounded-2xl border border-red-100">
            <div className="space-y-1"><h4 className="font-black text-red-900 uppercase text-xs tracking-widest">{profT.delete_account}</h4><p className="text-xs text-red-800 leading-relaxed max-w-md">{profT.delete_desc}</p></div>
            <AlertDialog>
              <AlertDialogTrigger asChild><Button variant="destructive" className="rounded-xl font-black px-8 h-12 shadow-lg gap-2"><XCircle className="h-4 w-4" /> 申請刪除帳戶</Button></AlertDialogTrigger>
              <AlertDialogContent className="rounded-[2.5rem] border-none shadow-2xl">
                <AlertDialogHeader><AlertDialogTitle className="text-2xl font-black font-headline text-destructive">確認永久刪除帳戶？</AlertDialogTitle><AlertDialogDescription className="text-slate-600 leading-relaxed pt-2">此操作將永久移除您的個人資料、地址簿及積分。此操作無法復原。</AlertDialogDescription></AlertDialogHeader>
                <AlertDialogFooter className="gap-3 mt-4"><AlertDialogCancel className="rounded-xl font-bold h-12">取消</AlertDialogCancel><AlertDialogAction onClick={onDeleteAccount} className="bg-destructive text-white rounded-xl font-black h-12 px-8 shadow-xl">確認刪除我的所有資料</AlertDialogAction></AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
