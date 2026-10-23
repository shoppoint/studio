import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * @fileOverview 接收外部電郵的 Webhook (Resend Inbound Webhook)
 * 此端點負責接收 Resend 轉發的客人來信，並存入 enquiries 集合。
 */

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const { db } = initializeFirebase();

    // 1. 解析 Resend Inbound 數據
    // 預期結構: { from: "sender@mail.com", subject: "...", text: "...", to: "..." }
    const fromEmail = payload.from || "";
    const subject = payload.subject || "Email Inquiry";
    const message = payload.text || payload.html || "No content";
    const name = fromEmail.split('@')[0];

    console.log(`[Inbound Email] Received from: ${fromEmail}, Subject: ${subject}`);

    // 2. 存入資料庫作為新任務
    await addDoc(collection(db, 'enquiries'), {
      name: name,
      email: fromEmail,
      phone: "",
      category: "other",
      subject: subject,
      message: message,
      source: 'Email', // 標註來源為 Email
      status: 'new',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      metadata: {
        receivedVia: 'Resend Inbound',
        to: payload.to
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Inbound Email] Parse Error:", error.message);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
