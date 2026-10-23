import { collection, addDoc, serverTimestamp, Firestore, updateDoc, doc, getDoc } from 'firebase/firestore';

/**
 * @fileOverview 通訊傳輸服務 (Transporter) - 模組隔離版
 * 修正：移除頂層或共享路徑下的 require('resend')，改為透過 API Route 統一處理發信，
 * 徹底解決 Webpack 在客戶端打包時因無法解析 Node 專用套件而產生的 "reading 'call'" 錯誤。
 */

interface SendEmailParams {
  db: Firestore;
  to: string;
  subject: string;
  html: string;
  config: any;
  bcc?: string;
  orderId?: string;
  event?: string;
}

function isValidEmail(email: string) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

export async function sendEmailTransport(params: SendEmailParams) {
  const { db, to, subject, html, config, bcc, orderId, event } = params;

  if (!to || !isValidEmail(to)) {
    return { success: false, error: `無效的電郵格式: "${to}"` };
  }

  let logRef: any = null;
  // 檢查是否為 Admin Firestore 實例
  const isAdmin = !('type' in db) || (db as any)._databaseId;

  try {
    const logData = {
      recipient: to,
      subject,
      orderId: orderId || null,
      event: event || 'manual',
      status: 'pending',
      type: 'email',
      source: 'Unified Transporter',
      createdAt: isAdmin ? new Date() : serverTimestamp(),
      updatedAt: isAdmin ? new Date() : serverTimestamp(),
    };
    
    if (isAdmin) logRef = await (db as any).collection('communication_logs').add(logData);
    else logRef = await addDoc(collection(db, 'communication_logs'), logData);
  } catch (e: any) { 
    console.warn("[Transporter] Log creation warning:", e.message); 
  }

  try {
    // 關鍵修正：無論在 Server 還是 Client，統一調用 API Route 進行發信。
    // 這樣可以避免在共用邏輯中引入 'resend' 套件，防止客戶端 Bundle 崩潰。
    
    // 在 Server Action 中調用時，需要絕對路徑或特定的 fetch 處理
    const baseUrl = typeof window !== 'undefined' ? '' : 'https://shoppoint.hk';
    
    const response = await fetch(`${baseUrl}/api/notifications/email`, { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' }, 
      body: JSON.stringify({ to, subject, html, bcc, config }), 
      cache: 'no-store' 
    });
    
    const responseText = await response.text();
    if (!responseText || responseText.trim() === "") {
      throw new Error(`Email API returned an empty response (Status: ${response.status})`);
    }
    
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      throw new Error("Failed to parse Email API response.");
    }
    
    if (!response.ok) throw new Error(data.message || "Internal Server Error");
    const result = { success: true, messageId: data.messageId };

    if (logRef) {
      const updateData = { status: 'sent', messageId: result.messageId, updatedAt: isAdmin ? new Date() : serverTimestamp() };
      if (isAdmin) await logRef.update(updateData);
      else await updateDoc(doc(db, 'communication_logs', logRef.id), updateData);
    }
    return result;
  } catch (error: any) {
    if (logRef) {
      const errorData = { status: 'failed', error: error.message, updatedAt: isAdmin ? new Date() : serverTimestamp() };
      if (isAdmin) await logRef.update(errorData);
      else await updateDoc(doc(db, 'communication_logs', logRef.id), errorData);
    }
    return { success: false, error: error.message };
  }
}
