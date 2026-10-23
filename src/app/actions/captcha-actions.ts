
'use server';

import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';

/**
 * @fileOverview Google reCaptcha v3 後端驗證 Action (Gatekeeper)
 */

function getInternalDb() {
  const apps = getApps();
  const app = apps.length === 0 ? initializeApp(firebaseConfig) : apps[0];
  return getFirestore(app, "shoppoint-hk");
}

/**
 * 驗證前端傳回的 Captcha Token
 * 邏輯：由伺服器端發起請求至 Google 驗證端點，確保 Token 的有效性。
 */
export async function verifyCaptchaAction(token: string) {
  if (!token) return { success: false, message: "Missing Captcha Token" };

  try {
    const db = getInternalDb();
    const configSnap = await getDoc(doc(db, 'config', 'infra'));
    const secretKey = (configSnap.data()?.recaptchaSecretKey || "").trim();

    if (!secretKey) {
      console.warn("[Captcha Action] No Secret Key defined in Firestore.");
      return { success: true, message: "Skipping validation due to missing key" };
    }

    const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `secret=${secretKey}&response=${token}`,
    });

    const result = await response.json();

    if (result.success && result.score >= 0.5) {
      return { success: true, score: result.score };
    }

    return { 
      success: false, 
      message: "Security verification failed. Please try again.",
      error: result['error-codes'] 
    };
  } catch (error: any) {
    console.error("[Captcha Action] Internal Error:", error.message);
    return { success: false, message: "Verification system offline" };
  }
}
