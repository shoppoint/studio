
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';

/**
 * @fileOverview 後端 Email 發送 API (Resend 高性能模式)
 * 策略：1. 優先讀取環境變數 2. 絕對備援：從 Firestore 讀取 (解決部署變數缺失問題)
 */

export async function POST(request: Request) {
  try {
    const { to, subject, html, bcc, config: clientConfig } = await request.json();
    const { db } = initializeFirebase();

    // 1. 嘗試從環境變數讀取
    let apiKey = (process.env.RESEND_API_KEY || "").trim().replace(/['"]/g, '');
    let finalConfig = clientConfig;

    // 2. 核心保險：如果環境變數缺失，強制從 Firestore 抓取
    if (!apiKey || apiKey.length < 10) {
      const configSnap = await getDoc(doc(db, 'config', 'communication'));
      if (configSnap.exists()) {
        const data = configSnap.data();
        apiKey = (data.resendApiKey || "").trim().replace(/['"]/g, '');
        // 如果傳進來的 config 為空，也補齊它
        if (!finalConfig) finalConfig = data.email;
      }
    }

    if (!apiKey || apiKey.length < 10) {
      throw new Error("EMAIL_API_KEY_MISSING: 請在 App Hosting 環境變數或 Firestore 通訊設定中配置 Resend Key。");
    }

    const resend = new Resend(apiKey);

    // 獲取發件人配置
    const fromName = finalConfig?.fromName || "SHOP POINT";
    let fromEmail = (finalConfig?.user || "info@shoppoint.hk").trim().toLowerCase();
    
    // 安全過濾：確保發件網域已驗證
    if (fromEmail.includes("gmail.com")) fromEmail = "info@shoppoint.hk"; 

    const finalFrom = `"${fromName}" <${fromEmail}>`;
    const bccList = (bcc && typeof bcc === 'string' && bcc.trim() !== "") ? [bcc.trim()] : undefined;

    const { data, error } = await resend.emails.send({
      from: finalFrom,
      to: [to],
      subject: subject,
      html: html,
      bcc: bccList,
      replyTo: fromEmail,
    });

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, messageId: data?.id });

  } catch (error: any) {
    console.error("[API Email Error]", error.message);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
