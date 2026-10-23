
"use client";

import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useI18n } from "@/lib/i18n/i18n-context";
import { 
  ChevronRight, 
  Scale, 
  AlertCircle, 
  Trash2, 
  ShieldAlert, 
  ShieldCheck, 
  Gavel, 
  Info,
  BookOpen,
  UserCheck,
  Package,
  GanttChartSquare,
  Smartphone,
  CheckCircle2,
  Truck,
  Lock,
  CreditCard,
  History,
  AlertTriangle,
  Tag,
  RefreshCcw
} from "lucide-react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TermsPage() {
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
              <span className="text-foreground font-medium">{t.legal.terms}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black font-headline tracking-tighter text-foreground">
              {t.legal.terms}
            </h1>
            <p className="text-muted-foreground mt-4 max-w-2xl font-medium">
              {lang === 'en' 
                ? "Last Updated: March 20, 2024. Please read these terms carefully before using the SHOP POINT platform." 
                : "最後更新日期：2024年3月20日。在使用 SHOP POINT 平台之前，請仔細閱讀這些條款。"}
            </p>
          </div>
        </section>

        <section className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            {/* Essential Legal Statement */}
            <div className="flex items-start gap-4 p-6 bg-primary/5 rounded-2xl mb-12 border border-primary/10 shadow-sm">
              <Scale className="h-6 w-6 text-primary shrink-0 mt-1" />
              <p className="text-sm md:text-base font-bold leading-relaxed text-foreground">
                {lang === 'en' 
                  ? "By accessing our website or App, you agree to be bound by these terms and all applicable laws in Hong Kong." 
                  : "透過訪問我們的網站或應用程式，即表示您同意受這些條款及香港所有適用法律的約束。"}
              </p>
            </div>

            <Tabs defaultValue="zh" className="w-full">
              <div className="flex justify-center mb-8">
                <TabsList className="bg-muted/50 p-1 h-12 rounded-xl">
                  <TabsTrigger value="zh" className="rounded-lg px-8 font-bold">繁體中文</TabsTrigger>
                  <TabsTrigger value="en" className="rounded-lg px-8 font-bold">English</TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="zh" className="bg-white p-8 md:p-12 rounded-3xl border shadow-sm space-y-12 animate-in fade-in duration-500">
                <div className="space-y-12">
                  <header className="space-y-4">
                    <p className="text-lg leading-relaxed text-foreground font-medium">
                      歡迎光臨 <strong>SHOP POINT</strong>（ 以下簡稱為「Shop Point」、「本網站」、「本公司」或 「本平台」）旨在向會員之間（即顧客、店主、品牌擁有及公司）提供資訊平台。為了保障大眾能合法及適當地使用本網站，本公司訂立以下使用條款（以下簡稱為「條款」），所有 SHOP POINT 的使用者（Users）必須遵守。
                    </p>
                  </header>

                  {/* Section 1 */}
                  <section className="space-y-6">
                    <h2 className="text-xl font-black flex items-center gap-2"><Gavel className="h-5 w-5 text-primary" /> 1. 認知及接受條款</h2>
                    <div className="space-y-4 text-sm leading-relaxed ml-8">
                      <p><strong>1.1</strong> 使用者一旦登入、瀏覽或使用網站，即表示接受此使用條款。本公司有權隨時修改條款，修訂條文刊載於官網後即時生效。</p>
                    </div>
                  </section>

                  {/* Section 2 */}
                  <section className="space-y-6">
                    <h2 className="text-xl font-black flex items-center gap-2"><BookOpen className="h-5 w-5 text-primary" /> 2. 定義</h2>
                    <div className="space-y-4 text-sm leading-relaxed ml-8">
                      <p><strong>2.1 「內容」</strong>指資訊、數據、文字、圖表、圖像、錄像、商品、服務等。<strong>2.2 「使用者」</strong>指任何登入、瀏覽或使用網站的人士。</p>
                    </div>
                  </section>

                  {/* Section 3 */}
                  <section className="space-y-6">
                    <h2 className="text-xl font-black flex items-center gap-2"><UserCheck className="h-5 w-5 text-primary" /> 3. 會員註冊與帳戶安全</h2>
                    <p className="text-sm leading-relaxed text-muted-foreground ml-8">
                      使用者應提供真實、準確及完整的資料。您需負責妥善保管帳戶密碼，並對該帳戶下的所有活動承擔法律責任。
                    </p>
                  </section>

                  {/* Section 4 */}
                  <section className="space-y-6">
                    <h2 className="text-xl font-black flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" /> 4. 使用者義務與守則</h2>
                    <p className="text-sm leading-relaxed text-muted-foreground ml-8">
                      嚴禁利用本平台進行非法交易、散布病毒或侵犯他人權益。使用者不得冒用他人身份或干擾平台系統運作。
                    </p>
                  </section>

                  {/* Section 5 */}
                  <section className="space-y-6">
                    <h2 className="text-xl font-black flex items-center gap-2"><Tag className="h-5 w-5 text-primary" /> 5. 商品資訊與定價</h2>
                    <p className="text-sm leading-relaxed text-muted-foreground ml-8">
                      平台上的商品由各合作商店提供。我們盡力確保資訊準確，但對於商品描述或價格之錯誤，本平台保留更正及取消訂單之權利。
                    </p>
                  </section>

                  {/* Section 6 */}
                  <section className="space-y-6">
                    <h2 className="text-xl font-black flex items-center gap-2"><CreditCard className="h-5 w-5 text-primary" /> 6. 訂單、支付與稅務</h2>
                    <p className="text-sm leading-relaxed text-muted-foreground ml-8">
                      確認訂單即表示您同意支付所示金額。支付方式包括信用卡及手動轉帳。使用者需自行承擔因當地法規可能產生的稅款。
                    </p>
                  </section>

                  {/* Section 7 */}
                  <section className="space-y-6">
                    <h2 className="text-xl font-black flex items-center gap-2"><Truck className="h-5 w-5 text-primary" /> 7. 物流配送政策</h2>
                    <p className="text-sm leading-relaxed text-muted-foreground ml-8">
                      運送服務由第三方物流提供。風險於貨品交予物流商時轉移。詳細運費門檻及限制請參閱「運送安排」頁面。
                    </p>
                  </section>

                  {/* Section 8 */}
                  <section className="space-y-6">
                    <h2 className="text-xl font-black flex items-center gap-2"><RefreshCcw className="h-5 w-5 text-primary" /> 8. 退換貨政策</h2>
                    <p className="text-sm leading-relaxed text-muted-foreground ml-8">
                      我們提供 7 天退換貨保障。退回商品必須保持未拆封及包裝完整。部分特殊貨品（如食品、個人衛生用品）恕不退換。
                    </p>
                  </section>

                  {/* Section 9 */}
                  <section className="space-y-6">
                    <h2 className="text-xl font-black flex items-center gap-2"><GanttChartSquare className="h-5 w-5 text-primary" /> 9. 知識產權</h2>
                    <p className="text-sm leading-relaxed text-muted-foreground ml-8">
                      本平台所有內容（商標、設計、文案等）均屬本公司或權利人所有。未經書面許可，禁止轉載、複製或作任何商業用途。
                    </p>
                  </section>

                  {/* Section 10 */}
                  <section className="space-y-6">
                    <h2 className="text-xl font-black flex items-center gap-2"><Smartphone className="h-5 w-5 text-primary" /> 10. 第三方網站連結</h2>
                    <p className="text-sm leading-relaxed text-muted-foreground ml-8">
                      平台可能包含指向第三方網站的連結。我們不對該等網站的內容或私隱實務承擔任何責任。
                    </p>
                  </section>

                  {/* Section 11 */}
                  <section className="space-y-6">
                    <h2 className="text-xl font-black flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-primary" /> 11. 免責聲明</h2>
                    <p className="text-sm leading-relaxed text-muted-foreground ml-8">
                      服務均以「現況」形式提供。本公司不保證系統不間斷或無錯誤，亦不對第三方賣家之商品質量提供擔保。
                    </p>
                  </section>

                  {/* Section 12 */}
                  <section className="space-y-6">
                    <h2 className="text-xl font-black flex items-center gap-2"><Info className="h-5 w-5 text-primary" /> 12. 責任限制</h2>
                    <p className="text-sm leading-relaxed text-muted-foreground ml-8">
                      在法律允許範圍內，本公司對於因使用服務而產生的任何間接、附帶或衍生性損失概不承擔責任。
                    </p>
                  </section>

                  <Separator />

                  <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                    <h2 className="text-xl font-black text-blue-900 flex items-center gap-2">
                      <Trash2 className="h-6 w-6" /> 13. 帳戶刪除權利 (Account Deletion)
                    </h2>
                    <p className="text-sm text-blue-800 leading-relaxed mt-4 ml-8">
                      根據 Apple 及 Google 政策，使用者可隨時透過「個人帳戶 &gt; 設定」申請刪除帳戶。一旦確認刪除，您的個人識別資料、訂單記錄及積分將會從伺服器中永久移除且無法復原。
                    </p>
                  </div>

                  <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100">
                    <h2 className="text-xl font-black text-orange-900 flex items-center gap-2">
                      <ShieldAlert className="h-6 w-6" /> 14. 令人反感的內容政策 (Objectionable Content)
                    </h2>
                    <p className="text-sm text-orange-800 leading-relaxed mt-4 ml-8">
                      本平台對令人反感的內容採取「零容忍」政策。嚴禁發布包含淫穢、暴力、歧視或侵犯他人私隱的內容。本公司保留在無須通知的情況下，於 24 小時內刪除違規內容並終止維規用戶存取的絕對權利。
                    </p>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="en" className="bg-white p-8 md:p-12 rounded-3xl border shadow-sm space-y-12 animate-in fade-in duration-500">
                <div className="space-y-12">
                  <header className="space-y-4">
                    <p className="text-lg leading-relaxed font-medium">
                      Welcome to <strong>SHOP POINT</strong>. Our platform provides a bridge between members (customers, vendors, and brands). To ensure a safe and legal environment, we have established these Terms of Use which all users must follow.
                    </p>
                  </header>

                  <section className="space-y-6">
                    <h3 className="text-xl font-black flex items-center gap-2"><Gavel className="h-5 w-5 text-primary" /> 1. Acceptance of Terms</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground ml-8">By accessing this website or app, you agree to these Terms. We reserve the right to modify these terms at any time without notice.</p>
                  </section>

                  <section className="space-y-6">
                    <h3 className="text-xl font-black flex items-center gap-2"><BookOpen className="h-5 w-5 text-primary" /> 2. Definitions</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground ml-8">"Content" includes data, text, images, products, and services. "User" means any person accessing the platform.</p>
                  </section>

                  <section className="space-y-6">
                    <h3 className="text-xl font-black flex items-center gap-2"><UserCheck className="h-5 w-5 text-primary" /> 3. Registration & Security</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground ml-8">Users must provide accurate info and are responsible for their account security and all activities under their credentials.</p>
                  </section>

                  <section className="space-y-6">
                    <h3 className="text-xl font-black flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" /> 4. User Obligations</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground ml-8">Prohibited activities include illegal transactions, spreading viruses, or infringing on the rights of others.</p>
                  </section>

                  <section className="space-y-6">
                    <h3 className="text-xl font-black flex items-center gap-2"><Tag className="h-5 w-5 text-primary" /> 5. Product Info & Pricing</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground ml-8">Products are provided by third-party vendors. We reserve the right to correct errors in descriptions or pricing.</p>
                  </section>

                  <section className="space-y-6">
                    <h3 className="text-xl font-black flex items-center gap-2"><CreditCard className="h-5 w-5 text-primary" /> 6. Orders & Payment</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground ml-8">By confirming an order, you agree to pay the total amount. Users are responsible for any local taxes or duties.</p>
                  </section>

                  <section className="space-y-6">
                    <h3 className="text-xl font-black flex items-center gap-2"><Truck className="h-5 w-5 text-primary" /> 7. Shipping Policy</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground ml-8">Delivery is handled by third-party couriers. Risk transfers to the courier upon dispatch.</p>
                  </section>

                  <section className="space-y-6">
                    <h3 className="text-xl font-black flex items-center gap-2"><RefreshCcw className="h-5 w-5 text-primary" /> 8. Returns & Refunds</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground ml-8">We offer a 7-day return policy for eligible items in original condition. Some categories are excluded.</p>
                  </section>

                  <section className="space-y-6">
                    <h3 className="text-xl font-black flex items-center gap-2"><GanttChartSquare className="h-5 w-5 text-primary" /> 9. Intellectual Property</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground ml-8">All content is the property of SHOP POINT or its licensors. Unauthorized use is strictly prohibited.</p>
                  </section>

                  <section className="space-y-6">
                    <h3 className="text-xl font-black flex items-center gap-2"><Smartphone className="h-5 w-5 text-primary" /> 10. Third-Party Links</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground ml-8">We are not responsible for the content or privacy practices of external websites linked from our platform.</p>
                  </section>

                  <section className="space-y-6">
                    <h3 className="text-xl font-black flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-primary" /> 11. Disclaimer</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground ml-8">Services are provided "as is". We do not guarantee uninterrupted or error-free system operation.</p>
                  </section>

                  <section className="space-y-6">
                    <h3 className="text-xl font-black flex items-center gap-2"><Info className="h-5 w-5 text-primary" /> 12. Limitation of Liability</h3>
                    <p className="text-sm leading-relaxed text-muted-foreground ml-8">To the extent permitted by law, SHOP POINT is not liable for indirect or consequential damages.</p>
                  </section>

                  <Separator />

                  <section className="space-y-6">
                    <h2 className="text-2xl font-black text-blue-900">13. Account Deletion</h2>
                    <p className="text-sm ml-8 text-blue-800">In compliance with Apple/Google policies, users can delete accounts via settings. All data will be purged permanently.</p>
                  </section>

                  <section className="space-y-6">
                    <h2 className="text-2xl font-black text-orange-900">14. Objectionable Content</h2>
                    <p className="text-sm ml-8 text-orange-800">Zero tolerance for offensive content. Violating materials will be removed within 24 hours.</p>
                  </section>
                </div>
              </TabsContent>
            </Tabs>

            <footer className="mt-12 text-center text-muted-foreground text-xs">
              <p>© {new Date().getFullYear()} SHOP POINT. All Rights Reserved.</p>
              <p className="mt-2">Last Updated: July 21, 2021 (Addendums: March 20, 2024)</p>
            </footer>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
