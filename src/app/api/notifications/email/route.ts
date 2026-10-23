
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { initializeFirebase } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';

/**
 * @fileOverview 後端 Email 發送 API (Resend 高性能模式)
 * 策略：1. 優先讀取環境變數 (App Hosting) 2. 備援讀取資料庫
 */

export async function POST(request: Request) {
  try {
    const { to, subject, html, bcc, config } = await request.json();
    const { db } = initializeFirebase();

    // 1. 優先讀取環境變數 (效能最快)
    let apiKey = (process.env.RESEND_API_KEY || "").trim().replace(/['"]/g, '');

    // 2. 備援：從 Firestore 讀取
    if (!apiKey || apiKey.length < 10) {
      try {
        const configSnap = await getDoc(doc(db, 'config', 'communication'));
        apiKey = (configSnap.data()?.resendApiKey || "").trim().replace(/['"]/g, '');
      } catch (e) {
        console.error("[API Email] Firestore key fetch failed:", e);
      }
    }

    if (!apiKey || apiKey.length < 10) {
      return NextResponse.json({ 
        success: false, 
        message: "Email API Key is missing. Please check App Hosting Secrets or Admin Settings." 
      }, { status: 500 });
    }

    const resend = new Resend(apiKey);

    // 獲取發件人配置
    const fromName = config?.fromName || "SHOP POINT";
    let fromEmail = (config?.user || "info@shoppoint.hk").trim().toLowerCase();
    
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
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
