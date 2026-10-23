"use client";

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useI18n } from "@/lib/i18n/i18n-context";
import { 
  ChevronRight, 
  ShieldCheck, 
  Lock, 
  Database, 
  Trash2, 
  User, 
  Mail, 
  Info, 
  Cookie, 
  FileText,
  Clock,
  AlertCircle,
  Gavel,
  Edit3,
  ExternalLink,
  Share2
} from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export default function PrivacyPolicyPage() {
  const { t, lang } = useI18n();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-grow">
        <section className="bg-muted/30 py-12 md:py-20 border-b">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <Link href="/" className="hover:text-primary transition-colors">{t.nav.home}</Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground font-medium">{t.legal.privacy}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black font-headline tracking-tighter text-foreground">
              {t.legal.privacy}
            </h1>
            <p className="text-muted-foreground mt-4 max-w-2xl font-medium">
              {lang === 'en' 
                ? "Last Updated: March 20, 2024. This policy ensures compliance with PDPO (HK) and App Store transparency requirements." 
                : "最後更新日期：2024年3月20日。本聲明旨在符合香港 PDPO 條例及 Apple/Google 商店之透明度要求。"}
            </p>
          </div>
        </section>

        <section className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            {/* Compliance Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 flex items-start gap-4 shadow-sm">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0"><ShieldCheck className="h-5 w-5" /></div>
                <div>
                  <h4 className="font-bold text-blue-900 mb-1">
                    {lang === 'en' ? "PDPO Compliant" : "符合 PDPO 規範"}
                  </h4>
                  <p className="text-xs text-blue-800 leading-relaxed">
                    {lang === 'en' 
                      ? "Strictly follows the Personal Data (Privacy) Ordinance of Hong Kong. Data is handled with industry-standard security." 
                      : "嚴格遵守香港《個人資料（私隱）條例》。所有數據均採用業界標準安全技術處理。"}
                  </p>
                </div>
              </div>
              <div className="p-6 bg-red-50 rounded-2xl border border-red-100 flex items-start gap-4 shadow-sm">
                <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 shrink-0"><Trash2 className="h-5 w-5" /></div>
                <div>
                  <h4 className="font-bold text-red-900 mb-1">
                    {lang === 'en' ? "Data Erasure Rights" : "數據刪除權利"}
                  </h4>
                  <p className="text-xs text-red-800 leading-relaxed">
                    {lang === 'en' 
                      ? "Users can permanently delete their account and associated data via the App or by contacting our support." 
                      : "用戶可透過 App 或聯絡客服，申請永久刪除帳戶及其所有關聯之個人數據。"}
                  </p>
                </div>
              </div>
            </div>

            <Tabs defaultValue={lang === 'en' ? 'en' : 'zh'} className="w-full">
              <div className="flex justify-center mb-10">
                <TabsList className="bg-muted/50 p-1 h-12 rounded-xl">
                  <TabsTrigger value="zh" className="rounded-lg px-8 font-bold">繁體中文</TabsTrigger>
                  <TabsTrigger value="en" className="rounded-lg px-8 font-bold">English</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="zh" className="bg-white p-8 md:p-12 rounded-3xl border shadow-sm space-y-12 animate-in fade-in duration-500">
                <div className="space-y-10">
                  <header className="space-y-4 text-center max-w-2xl mx-auto">
                    <h2 className="text-3xl font-black text-foreground font-headline">私隱政策聲明</h2>
                    <p className="text-muted-foreground leading-relaxed text-sm">
                      Shop Point（以下簡稱為「我們」或「本公司」) 尊重任何使用本公司網頁及移動應用程式的人士的私隱權。我們會確保所收集、傳送、儲存及使用的個人資料將遵照香港特別行政區法例第486章《個人資料(私隱)條例》的規定處理。
                    </p>
                  </header>

                  <section className="space-y-6">
                    <h3 className="text-xl font-bold flex items-center gap-2 text-foreground"><User className="h-5 w-5 text-primary" /> 1．個人資料之定義</h3>
                    <div className="space-y-4 text-sm leading-relaxed ml-7">
                      <p>指有關顧客個人的資料，包括但不限於：</p>
                      <ul className="list-disc ml-5 space-y-2 text-muted-foreground">
                        <li>個人及聯絡資料（姓名、電話、電郵、住址）；</li>
                        <li>賬戶資料（信用卡部分號碼、用戶編號）；</li>
                        <li>付款及交易詳情；</li>
                        <li>裝置 IP 地址及瀏覽紀錄。</li>
                      </ul>
                    </div>
                  </section>

                  <section className="space-y-6">
                    <h3 className="text-xl font-bold flex items-center gap-2 text-foreground"><Database className="h-5 w-5 text-primary" /> 2．個人資料之收集</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground ml-7">
                      我們需要收集您的個人資料以提供各項產品和服務。若您未能提供全面及準確的個人資料，我們可能無法向您提供服務。
                    </p>
                  </section>

                  <section className="space-y-6">
                    <h3 className="text-xl font-bold flex items-center gap-2 text-foreground"><FileText className="h-5 w-5 text-primary" /> 3．個人資料之使用</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground ml-7">
                      個人資料將用於：處理客戶登記、提供服務、獎賞計劃、訂單驗證及法律披露用途。
                    </p>
                  </section>

                  <section className="space-y-6">
                    <h3 className="text-xl font-bold flex items-center gap-2 text-foreground"><Lock className="h-5 w-5 text-primary" /> 4．個人資料之管理</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground ml-7">
                      我們盡力妥善管理收集得來的個人資料，防止外洩、遺失或錯誤。
                    </p>
                  </section>

                  <section className="space-y-6">
                    <h3 className="text-xl font-bold flex items-center gap-2 text-foreground"><Clock className="h-5 w-5 text-primary" /> 5．個人資料保存</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground ml-7">
                      保存時限將不超過實現目的所需要或法律要求的時間。
                    </p>
                  </section>

                  <section className="space-y-6">
                    <h3 className="text-xl font-bold flex items-center gap-2 text-foreground"><Edit3 className="h-5 w-5 text-primary" /> 6．查閱及更正個人資料</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground ml-7">
                      根據條例，您有權查閱本公司所保存您的個人資料，並要求更正任何不準確之處。如有需要，請電郵至 info@shoppoint.hk。
                    </p>
                  </section>

                  <section className="space-y-6">
                    <h3 className="text-xl font-bold flex items-center gap-2 text-foreground"><Share2 className="h-5 w-5 text-primary" /> 7．直接促銷</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground ml-7">
                      在獲得您的同意下，我們可能使用您的個人資料進行促銷活動。您可隨時要求停止接收。
                    </p>
                  </section>

                  <section className="space-y-6">
                    <h3 className="text-xl font-bold flex items-center gap-2 text-foreground"><Info className="h-5 w-5 text-primary" /> 8．向第三方披露</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground ml-7">
                      我們不會向第三方出售您的資料。但在必要時（如物流配送、支付核實），我們可能會將資料提供予合作商戶。
                    </p>
                  </section>

                  <section className="space-y-6">
                    <h3 className="text-xl font-bold flex items-center gap-2 text-foreground"><Cookie className="h-5 w-5 text-primary" /> 9．Cookie 之使用</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground ml-7">
                      我們使用 Cookie 來提升瀏覽體驗。您可以透過瀏覽器設定拒絕 Cookie。
                    </p>
                  </section>

                  <section className="space-y-6">
                    <h3 className="text-xl font-bold flex items-center gap-2 text-foreground"><ExternalLink className="h-5 w-5 text-primary" /> 10．連結至第三方網站</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground ml-7">
                      本網站可能包含第三方連結。建議查閱該等網站的私隱政策。
                    </p>
                  </section>

                  <section className="space-y-6">
                    <h3 className="text-xl font-bold flex items-center gap-2 text-foreground"><Clock className="h-5 w-5 text-primary" /> 11．私隱政策之修訂</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground ml-7">
                      本公司會不時修訂本私隱政策，最新版本將載於我們的網址。
                    </p>
                  </section>

                  <Separator />

                  <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100">
                    <h2 className="text-xl font-black text-orange-900 flex items-center gap-2">
                      <AlertCircle className="h-6 w-6" /> 12．數據安全性與加密
                    </h2>
                    <p className="text-sm text-orange-800 leading-relaxed mt-4 ml-8">
                      所有傳輸數據均透過 HTTPS 協議進行加密。我們採用 Google Cloud 指令基礎設施存儲數據，並實施嚴格的訪問控制。
                    </p>
                  </div>

                  <section className="space-y-6">
                    <h2 className="text-xl font-black text-foreground flex items-center gap-2">
                      <Gavel className="h-6 w-6 text-primary" /> 13．爭議處理與司法管轄權
                    </h2>
                    <p className="text-sm leading-relaxed text-muted-foreground ml-8">
                      本聲明受香港特別行政區法律規管，並按照香港特別行政區法律予以解釋。
                    </p>
                  </section>

                  <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                    <h2 className="text-xl font-black text-blue-900 flex items-center gap-2">
                      <Trash2 className="h-6 w-6" /> 14．帳戶與數據刪除政策
                    </h2>
                    <p className="text-sm text-blue-800 leading-relaxed mt-4 ml-8">
                      根據 Apple 及 Google 政策，用戶可隨時於 App 的「帳戶設定」內申請「刪除帳戶」。一旦確認刪除，您的所有關聯數據將從系統永久移除。
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="en" className="bg-white p-8 md:p-12 rounded-3xl border shadow-sm space-y-12 animate-in fade-in duration-500">
                <div className="space-y-10">
                  <header className="space-y-4 text-center max-w-2xl mx-auto">
                    <h2 className="text-3xl font-black text-foreground font-headline">Privacy Policy</h2>
                    <p className="text-muted-foreground leading-relaxed text-sm">
                      Shop Point ("we", "us", or "our") respects the privacy of anyone using our website and mobile application. We ensure that personal data collected, transmitted, stored, and used will be handled in accordance with the Personal Data (Privacy) Ordinance (Cap. 486) of Hong Kong.
                    </p>
                  </header>

                  <section className="space-y-6">
                    <h3 className="text-xl font-bold flex items-center gap-2"><User className="h-5 w-5 text-primary" /> 1. Definition of Personal Data</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground ml-7">Refers to personal information including but not limited to name, phone, email, address, transaction details, and IP address.</p>
                  </section>

                  <section className="space-y-6">
                    <h3 className="text-xl font-bold flex items-center gap-2"><Database className="h-5 w-5 text-primary" /> 2. Collection of Data</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground ml-7">We collect data to provide products and services. Failure to provide accurate data may result in our inability to provide services.</p>
                  </section>

                  <section className="space-y-6">
                    <h3 className="text-xl font-bold flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /> 3. Use of Data</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground ml-7">Data is used for registration, service delivery, loyalty programs, order verification, and legal disclosures.</p>
                  </section>

                  <section className="space-y-6">
                    <h3 className="text-xl font-bold flex items-center gap-2"><Lock className="h-5 w-5 text-primary" /> 4. Management of Data</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground ml-7">We strive to properly manage collected data to prevent leakage, loss, or unauthorized access.</p>
                  </section>

                  <section className="space-y-6">
                    <h3 className="text-xl font-bold flex items-center gap-2"><Clock className="h-5 w-5 text-primary" /> 5. Data Retention</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground ml-7">Data is retained only as long as necessary to fulfill the purpose or as required by law.</p>
                  </section>

                  <section className="space-y-6">
                    <h3 className="text-xl font-bold flex items-center gap-2"><Edit3 className="h-5 w-5 text-primary" /> 6. Access and Correction</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground ml-7">You have the right to access and correct your personal data. Please contact us at info@shoppoint.hk for requests.</p>
                  </section>

                  <section className="space-y-6">
                    <h3 className="text-xl font-bold flex items-center gap-2"><Share2 className="h-5 w-5 text-primary" /> 7. Direct Marketing</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground ml-7">With your consent, we may use your data for marketing. You may opt-out at any time.</p>
                  </section>

                  <section className="space-y-6">
                    <h3 className="text-xl font-bold flex items-center gap-2"><Info className="h-5 w-5 text-primary" /> 8. Third-party Disclosure</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground ml-7">We do not sell your data. We may share it with partners like logistics providers when necessary.</p>
                  </section>

                  <section className="space-y-6">
                    <h3 className="text-xl font-bold flex items-center gap-2"><Cookie className="h-5 w-5 text-primary" /> 9. Use of Cookies</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground ml-7">Cookies are used to enhance your experience. You can disable them in your browser settings.</p>
                  </section>

                  <section className="space-y-6">
                    <h3 className="text-xl font-bold flex items-center gap-2"><ExternalLink className="h-5 w-5 text-primary" /> 10. Third-party Links</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground ml-7">We are not responsible for the privacy practices of external websites linked from our platform.</p>
                  </section>

                  <section className="space-y-6">
                    <h3 className="text-xl font-bold flex items-center gap-2"><Clock className="h-5 w-5 text-primary" /> 11. Amendments</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground ml-7">This policy may be updated periodically. The latest version will be posted on our website.</p>
                  </section>

                  <Separator />

                  <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100">
                    <h2 className="text-xl font-black text-orange-900 flex items-center gap-2">
                      <AlertCircle className="h-6 w-6" /> 12. Security & Encryption
                    </h2>
                    <p className="text-sm text-orange-800 leading-relaxed mt-4 ml-8">
                      All data transmissions are encrypted via HTTPS. We use Google Cloud infrastructure for secure storage with strict access controls.
                    </p>
                  </div>

                  <section className="space-y-6">
                    <h2 className="text-xl font-black text-foreground flex items-center gap-2">
                      <Gavel className="h-6 w-6 text-primary" /> 13. Jurisdiction</h2>
                    <p className="text-sm leading-relaxed text-muted-foreground ml-8">
                      This policy is governed by and interpreted in accordance with the laws of the Hong Kong Special Administrative Region.
                    </p>
                  </section>

                  <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                    <h2 className="text-xl font-black text-blue-900 flex items-center gap-2">
                      <Trash2 className="h-6 w-6" /> 14. Account Deletion Policy
                    </h2>
                    <p className="text-sm text-blue-800 leading-relaxed mt-4 ml-8">
                      In compliance with Apple and Google policies, users may request account deletion via App settings. Once confirmed, all associated data will be permanently purged.
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            <footer className="mt-12 text-center text-muted-foreground text-[10px] uppercase font-bold tracking-widest">
              <p>© {new Date().getFullYear()} SHOP POINT (BS CONCEPT LIMITED). ALL RIGHTS RESERVED.</p>
            </footer>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
