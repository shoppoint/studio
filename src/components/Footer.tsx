"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useI18n } from "@/lib/i18n/i18n-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { 
  Send, 
  Loader2, 
  Facebook, 
  Instagram, 
  Youtube, 
  MessageCircle,
  MapPin,
  Mail,
  Smartphone,
  Gift,
  HeartHandshake,
  Search,
  PackageSearch,
  Star,
  ExternalLink,
  ChevronRight
} from "lucide-react";
import { useUser, useFirestore, useDoc } from "@/firebase";
import { doc, setDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

// Custom Branded SVGs
const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
  </svg>
);

const ThreadsIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
    <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10c2.11 0 4.076-.656 5.71-1.776l-1.173-1.635C15.222 19.516 13.684 20 12 20c-4.418 0-8-3.582-8-8s3.582-8 8-8 8 3.582 8 8v.5c0 1.105-.895 2-2 2s-2-.895-2-2v-3c0-1.105-.895-2-2-2s-2 .895-2 2v3.312c-.588-.813-1.534-1.312-2.583-1.312-1.933 0-3.5 1.567-3.5 3.5s1.567 3.5 3.5 3.5c1.049 0 1.995-.499 2.583-1.312.23.43.674.812 1.254.812 2.209 0 4-1.791 4-4v-.5c0-2.112-.832-4.161-2.344-5.719C16.161 6.84 14.112 6 12 6s-1.09 0-1.09 0zM12 16c-1.105 0-2-.895-2-2s.895-2 2-2 2 .895 2 2-.895 2-2 2z" />
  </svg>
);

const LinktreeIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
    <path d="M21.32 9.5h-5.83V2.41L12 0 8.51 2.41V9.5H2.68v4.99h5.83v7.1h2.98V14.49h1.02v7.1h2.98V14.49h5.83V9.5z" />
  </svg>
);

const WhatsappIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.03 0C5.449 0 .081 5.377.077 11.967c0 2.105.547 4.16 1.587 6.006L0 24l6.149-1.613a11.83 11.83 0 005.874 1.552h.005c6.581 0 11.95-5.377 11.953-11.967a11.82 11.82 0 00-3.502-8.472" />
  </svg>
);

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
    <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.92 3.12-1.92 4.12-1.2 1.2-3.08 2.48-5.92 2.48-4.72 0-8.52-3.84-8.52-8.56s3.8-8.56 8.52-8.56c2.56 0 4.44.92 5.84 2.32l2.32-2.32C18.6 1.64 15.84.48 12.48.48 6.12.48 1 5.6 1 11.96s5.12 11.48 11.48 11.48c3.44 0 6.12-1.12 8.16-3.2 2.12-2.08 2.8-5 2.8-7.28 0-.72-.04-1.4-.16-2.04H12.48z" />
  </svg>
);

export function Footer() {
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const db = useFirestore();
  const { user } = useUser();
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // 獲取動態 Logo 設定
  const generalConfigRef = useMemo(() => {
    if (!db) return null;
    return doc(db, 'config', 'general');
  }, [db]);
  const { data: generalConfig } = useDoc<any>(generalConfigRef);

  const logoUrl = useMemo(() => generalConfig?.logoUrl || "/logo.png", [generalConfig]);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (honeypot.trim()) { setEmail(""); setHoneypot(""); toast({ title: t.newsletter.success }); return; }
    if (!email || !db) return;
    setLoading(true);
    const subscriberRef = doc(db, 'subscribers', email.toLowerCase());
    const subscriberData = { email: email.toLowerCase(), subscribedAt: serverTimestamp(), source: 'Site Footer', userId: user?.uid || null };
    setDoc(subscriberRef, subscriberData)
      .then(() => {
        if (user) {
          const userRef = doc(db, 'users', user.uid);
          updateDoc(userRef, { isNewsletterSubscribed: true, updatedAt: serverTimestamp() }).catch(() => {});
        }
        toast({ title: t.newsletter.success });
        setEmail("");
      })
      .catch(() => toast({ title: t.common.error, variant: "destructive" }))
      .finally(() => setLoading(false));
  };

  const socialLinks = [
    { name: "Facebook", icon: Facebook, url: "https://facebook.com/shoppoint.hk", color: "hover:bg-blue-600" },
    { name: "Instagram", icon: Instagram, url: "https://instagram.com/shoppoint.hk", color: "hover:text-pink-600" },
    { name: "Youtube", icon: Youtube, url: "https://youtube.com/@shoppoint_hk", color: "hover:text-red-600" },
    { name: "Threads", icon: ThreadsIcon, url: "https://threads.net/@shoppoint.hk", color: "hover:bg-black" },
    { name: "X", icon: XIcon, url: "https://x.com/shoppointH", color: "hover:bg-black" },
    { name: "Linktree", icon: LinktreeIcon, url: "https://linktr.ee/shoppoint.hk", color: "hover:bg-green-600" },
    { name: "Google Business", icon: GoogleIcon, url: "https://share.google/Fyh1N4S2P6dvPYG2z", color: "hover:bg-blue-500" },
    { name: "Whatsapp", icon: WhatsappIcon, url: "https://wa.me/85253252555", color: "hover:text-green-500" },
  ];

  const gbpReviewLink = "https://g.page/r/CZSzFmPbXVvhEBM/review";

  return (
    <footer className="w-full border-t bg-muted/30 py-12 md:py-16">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 lg:grid-cols-12 gap-y-12 gap-x-8">
          <div className="col-span-2 lg:col-span-4 space-y-8 text-center lg:text-left">
            <div className="space-y-6 flex flex-col items-center lg:items-start">
              <Link href="/" className="flex items-center space-x-3 group">
                {!logoError && logoUrl && (
                  <Image 
                    src={logoUrl} 
                    alt="SHOP POINT" 
                    width={32} 
                    height={32} 
                    className="object-contain" 
                    onError={() => setLogoError(true)}
                    unoptimized
                  />
                )}
                <span className="text-2xl font-black tracking-tighter text-foreground font-headline group-hover:text-primary transition-colors">
                  SHOP <span className="text-primary">POINT</span>
                </span>
              </Link>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">{mounted ? t.footer.tagline : ""}</p>
              <a href={gbpReviewLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-3 p-3 bg-white rounded-2xl shadow-sm border border-primary/10 hover:border-primary/40 transition-all hover:scale-[1.02] group">
                <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                   <svg viewBox="0 0 24 24" className="h-4 w-4 fill-blue-600"><path d="M12.48 10.92v3.28h7.84c-.24 1.84-.92 3.12-1.92 4.12-1.2 1.2-3.08 2.48-5.92 2.48-4.72 0-8.52-3.84-8.52-8.56s3.8-8.56 8.52-8.56c2.56 0 4.44.92 5.84 2.32l2.32-2.32C18.6 1.64 15.84.48 12.48.48 6.12.48 1 5.6 1 11.96s5.12 11.48 11.48 11.48c3.44 0 6.12-1.12 8.16-3.2 2.12-2.08 2.8-5 2.8-7.28 0-.72-.04-1.4-.16-2.04H12.48z" /></svg>
                </div>
                <div>
                  <div className="flex gap-0.5 mb-0.5">{[1, 2, 3, 4, 5].map((s) => <Star key={s} className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" />)}</div>
                  <p className="text-[10px] font-black uppercase tracking-tighter text-slate-900 leading-none">Google 5.0 Rating</p>
                </div>
                <ChevronRight className="h-3 w-3 text-muted-foreground ml-2 opacity-0 group-hover:opacity-100 transition-all" />
              </a>
              <div className="space-y-3">
                <h4 className="font-bold text-[10px] uppercase tracking-widest text-muted-foreground">{lang === 'en' ? 'Follow Us' : '追蹤我們'}</h4>
                <div className="flex flex-wrap justify-center lg:justify-start gap-2.5">{socialLinks.map((social) => (<a key={social.name} href={social.url} target="_blank" rel="noopener noreferrer" className={cn("h-8 w-8 rounded-full bg-white flex items-center justify-center text-muted-foreground shadow-sm transition-all hover:scale-110", social.color)} title={social.name}><social.icon /></a>))}</div>
              </div>
            </div>
            <div className="space-y-3 bg-white/50 p-6 rounded-2xl border border-dashed mx-auto lg:mx-0 max-w-sm">
              <h4 className="font-black text-xs uppercase tracking-widest">{t.newsletter.footer_title}</h4>
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <div className="opacity-0 absolute -z-10 h-0 w-0 overflow-hidden pointer-events-none"><input type="text" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} tabIndex={-1} autoComplete="off" /></div>
                <Input type="email" placeholder={t.newsletter.placeholder} className="bg-white border-none h-10 text-xs rounded-xl shadow-sm" value={email} onChange={(e) => setEmail(e.target.value)} required />
                <Button size="icon" className="bg-primary text-primary-foreground h-10 w-10 shrink-0 rounded-xl" disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}</Button>
              </form>
              <p className="text-[9px] text-muted-foreground leading-tight italic">{t.newsletter.legal}</p>
            </div>
          </div>
          <div className="col-span-1 lg:col-span-3 space-y-5 text-center lg:text-left">
            <h4 className="font-black text-xs uppercase tracking-widest text-foreground">{t.footer.support}</h4>
            <ul className="space-y-3 text-sm text-muted-foreground font-medium">
              <li><Link href="/payment-methods" className="hover:text-primary transition-colors">{t.footer.payment_methods}</Link></li>
              <li><Link href="/shipping" className="hover:text-primary transition-colors">{t.legal.shipping}</Link></li>
              <li><Link href="/returns" className="hover:text-primary transition-colors">{t.legal.returns}</Link></li>
              <li><Link href="/profile/rewards" className="hover:text-primary transition-colors">{t.profile.redeem_store}</Link></li>
            </ul>
          </div>
          <div className="col-span-1 lg:col-span-2 space-y-5 text-center lg:text-left">
            <h4 className="font-black text-xs uppercase tracking-widest text-foreground">{lang === 'en' ? 'About' : '關於我們'}</h4>
            <ul className="space-y-3 text-sm text-muted-foreground font-medium">
              <li><Link href="/about" className="hover:text-primary transition-colors">{lang === 'en' ? 'Our Mission' : '我們的使命'}</Link></li>
              <li><Link href="/news" className="hover:text-primary transition-colors">{t.nav.news}</Link></li>
              <li><Link href="/contact" className="hover:text-primary transition-colors">{lang === 'en' ? 'Contact Us' : '聯絡我們'}</Link></li>
              <li><Link href="/impact" className="hover:text-amber-700 transition-colors font-bold text-amber-700">{lang === 'en' ? 'Impact Report' : '社會責任報告'}</Link></li>
              <li><Link href="/faq" className="hover:text-primary transition-colors">FAQs</Link></li>
              <li><Link href="/privacy" className="hover:text-primary transition-colors">{t.legal.privacy}</Link></li>
              <li><Link href="/terms" className="hover:text-primary transition-colors">{t.legal.terms}</Link></li>
            </ul>
          </div>
          <div className="col-span-2 lg:col-span-3 space-y-5 bg-white/40 p-6 rounded-3xl border border-white/50 backdrop-blur-sm shadow-sm text-center lg:text-left mx-auto lg:mx-0 max-w-sm lg:max-w-none">
            <h4 className="font-black text-xs uppercase tracking-widest text-amber-700 flex items-center justify-center lg:justify-start gap-2"><MessageCircle className="h-4 w-4" /> {lang === 'en' ? 'Contact' : '聯絡與支援'}</h4>
            <div className="space-y-4">
              <div className="flex items-start justify-center lg:justify-start gap-3"><MapPin className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" /><p className="text-[11px] text-muted-foreground leading-relaxed">{lang === 'en' ? "B17, Basement, U-Town Arcade, 3 Tsing Ling Path, Tuen Mun, NT" : "新界屯門青菱徑3號時尚電腦城地庫B17"}</p></div>
              <div className="flex items-center justify-center lg:justify-start gap-3"><Smartphone className="h-4 w-4 text-green-600 shrink-0" /><a href="https://wa.me/85253252555" target="_blank" rel="noreferrer" className="text-xs font-bold text-slate-700 hover:text-amber-700 transition-colors">+852 5325 2555 <span className="text-[9px] font-medium text-muted-foreground block">(WhatsApp Only)</span></a></div>
              <div className="flex items-center justify-center lg:justify-start gap-3"><Mail className="h-4 w-4 text-amber-700 shrink-0" /><a href="mailto:info@shoppoint.hk" className="text-xs font-bold text-slate-700 hover:text-amber-700 transition-colors">info@shoppoint.hk</a></div>
            </div>
          </div>
        </div>
        <div className="mt-16 pt-8 border-t border-muted-foreground/10 text-center"><p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">© {mounted ? new Date().getFullYear() : ''} {t.footer.rights}</p></div>
      </div>
    </footer>
  );
}
