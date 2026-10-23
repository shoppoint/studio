'use client';

import { initializeApp, getApps } from 'firebase/app';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  limit, 
  runTransaction, 
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { firebaseConfig } from '@/firebase/config';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';
import { issueCouponToUser } from '@/services/coupon-service';

/**
 * @fileOverview 邀請與兌換系統 Server Actions
 * 強化：支援多用戶電郵授權名單校核。
 */

function getInternalDb() {
  const apps = getApps();
  const app = apps.length === 0 ? initializeApp(firebaseConfig) : apps[0];
  return getFirestore(app, "shoppoint-hk");
}

/**
 * 領取邀請碼或兌換碼 (核心邏輯：區分 Referral 與 Promotion)
 */
export async function claimCodeAction(userId: string, rawCode: string) {
  if (!userId || !rawCode) return { success: false, message: "Missing params" };
  const code = rawCode.trim().toUpperCase();
  const db = getInternalDb();

  try {
    // 1. 執行初步檢查 (讀取當前用戶狀態)
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) throw new Error("User profile not found");
    
    const userData = userSnap.data();
    const userEmail = (userData.email || "").toLowerCase().trim();

    if (userData.referredBy) {
      // 如果已經被推薦過，則不能再套用推薦碼，但可能還可以套用活動碼 (這取決於業務邏輯)
      // 這裡暫時保持原邏輯：只要有 referredBy 就攔截
    }

    // 2. 搜尋邀請碼對象 (受 firestore.rules 限制：必須 limit 1)
    const usersRef = collection(db, 'users');
    const referralQuery = query(usersRef, where('referralCode', '==', code), limit(1));
    const referralSnap = await getDocs(referralQuery);

    if (!referralSnap.empty) {
      const referrerDoc = referralSnap.docs[0];
      const referrerData = referrerDoc.data();
      const referrerUid = referrerDoc.id;

      if (referrerUid === userId) {
        throw new Error("Cannot use your own referral code.");
      }
      
      if (userData.referredBy) {
        throw new Error("You have already used a referral code.");
      }

      // 3. 使用 Transaction 執行原子化獎勵發放
      return await runTransaction(db, async (transaction) => {
        // 再次確保狀態未變
        const uSnap = await transaction.get(userRef);
        if (uSnap.data()?.referredBy) throw new Error("Already claimed during transaction.");

        // 獲取獎勵設定
        const loyaltyRef = doc(db, 'config', 'loyalty');
        const loyaltySnap = await transaction.get(loyaltyRef);
        const rewardPoints = loyaltySnap.exists() ? (Number(loyaltySnap.data().welcomePoints) || 500) : 500;
        const welcomePromoId = loyaltySnap.exists() ? (loyaltySnap.data().welcomePromoId) : null;

        // 更新被推薦人
        transaction.update(userRef, {
          referredBy: referrerUid,
          referrerName: referrerData.displayName || "Friend",
          points: increment(rewardPoints),
          isReferralRewardClaimed: true,
          updatedAt: serverTimestamp()
        });

        // 處理迎新優惠券
        if (welcomePromoId && welcomePromoId !== 'none') {
           const promoRef = doc(db, 'promotions', welcomePromoId);
           const promoSnap = await transaction.get(promoRef);
           if (promoSnap.exists()) {
              const pData = promoSnap.data();
              const couponId = `CPN-WEL-${Date.now()}`;
              const couponRef = doc(collection(db, 'users', userId, 'coupons'), couponId);
              transaction.set(couponRef, {
                id: couponId,
                promoId: welcomePromoId,
                name: pData.name,
                type: pData.type,
                value: pData.value,
                code: pData.code || couponId,
                isUsed: false,
                status: "Active",
                redeemedAt: new Date().toISOString(),
                expiryDate: pData.endsAt || null
              });
           }
        }

        // 更新推薦人
        transaction.update(referrerDoc.ref, {
          referralCount: increment(1),
          updatedAt: serverTimestamp()
        });

        return { 
          success: true, 
          type: 'referral',
          message: `Referral successful! You received points and rewards.`,
          referrerName: referrerData.displayName
        };
      });
    }

    // 4. 如果不是邀請碼，檢查是否為促銷活動碼
    const promosRef = collection(db, 'promotions');
    const promoQuery = query(promosRef, where('code', '==', code), where('status', '==', 'active'), limit(1));
    const promoSnap = await getDocs(promoQuery);

    if (!promoSnap.empty) {
      const pData = promoSnap.docs[0].data();
      
      // 5. 強化：校核指定使用者限制 (支援多電郵列表)
      if (pData.restrictedToEmail && pData.restrictedToEmail.trim()) {
        const allowedEmails = pData.restrictedToEmail.toLowerCase().split(',').map((e: string) => e.trim()).filter(Boolean);
        if (!allowedEmails.includes(userEmail)) {
          throw new Error("This code is restricted to specific members.");
        }
      }

      return { 
        success: true, 
        type: 'promotion', 
        message: "Code verified. You can now use this code at checkout!" 
      };
    }

    throw new Error("Invalid or expired code.");
  } catch (error: any) {
    let friendlyMsg = error.message;
    if (error.message?.includes('permissions')) {
      friendlyMsg = "系統權限異常，請稍後再試。";
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: 'users/referrals',
        operation: 'list',
      }));
    }
    return { success: false, message: friendlyMsg };
  }
}
