
'use client';

import { 
  Firestore, 
  doc, 
  getDoc, 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  where, 
  getDocs, 
  updateDoc, 
  increment,
  runTransaction
} from 'firebase/firestore';
import { format, addDays, isBefore, parseISO } from "date-fns";

/**
 * @fileOverview 優惠券錢包核心服務 (Coupon Wallet Service)
 * 負責處理換領、核銷、退回及自動入帳邏輯。
 * 修正版：從 config/marketing_rewards 讀取獎勵資料以避開權限問題。
 */

export interface IssueCouponParams {
  db: Firestore;
  userId: string;
  promoId: string;
  rewardId: string;
  pointsRequired: number;
  validityDays?: number; 
}

/**
 * 核心：換領並發放優惠券至用戶錢包
 */
export async function issueCouponToUser({ db, userId, promoId, rewardId, pointsRequired, validityDays }: IssueCouponParams) {
  try {
    return await runTransaction(db, async (transaction) => {
      const userRef = doc(db, 'users', userId);
      const promoRef = doc(db, 'promotions', promoId);
      const rewardsConfigRef = doc(db, 'config', 'marketing_rewards');
      
      const [userSnap, promoSnap, configSnap] = await Promise.all([
        transaction.get(userRef),
        transaction.get(promoRef),
        transaction.get(rewardsConfigRef)
      ]);

      if (!userSnap.exists()) throw new Error("User not found");
      if (!promoSnap.exists()) throw new Error("Promotion rule not found");
      if (!configSnap.exists()) throw new Error("Rewards configuration not found");

      const userData = userSnap.data();
      const promoData = promoSnap.data();
      
      // 在配置文件的 items 數組中尋找對應獎勵
      const rewardItem = configSnap.data().items?.find((it: any) => it.id === rewardId);
      if (!rewardItem) throw new Error("Reward item not found in configuration");

      // 1. 檢查積分
      if ((userData.points || 0) < pointsRequired) {
        throw new Error("Insufficient points");
      }

      // 2. 準備優惠券數據
      const couponId = `CPN-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;
      
      let finalExpiryDate = promoData.endsAt || format(addDays(new Date(), 30), "yyyy-MM-dd");

      if (validityDays && validityDays > 0) {
        const relativeExpiry = format(addDays(new Date(), validityDays), "yyyy-MM-dd");
        if (promoData.endsAt) {
          if (isBefore(parseISO(relativeExpiry), parseISO(promoData.endsAt))) {
            finalExpiryDate = relativeExpiry;
          } else {
            finalExpiryDate = promoData.endsAt;
          }
        } else {
          finalExpiryDate = relativeExpiry;
        }
      }

      const couponData = {
        id: couponId,
        promoId: promoId,
        name: promoData.name,
        type: promoData.type,
        value: promoData.value,
        code: promoData.code || couponId,
        status: "Active",
        isUsed: false,
        expiryDate: finalExpiryDate,
        redeemedAt: new Date().toISOString(),
        rewardId: rewardId
      };

      // 3. 執行原子操作
      transaction.update(userRef, {
        points: increment(-pointsRequired),
        updatedAt: serverTimestamp()
      });

      const couponRef = doc(collection(db, 'users', userId, 'coupons'), couponId);
      transaction.set(couponRef, couponData);

      const logRef = doc(collection(db, 'communication_logs'));
      transaction.set(logRef, {
        recipient: userId,
        subject: `Coupon Redeemed: ${promoData.name?.zh || promoData.name?.en}`,
        event: 'coupon_issued',
        status: 'sent',
        createdAt: serverTimestamp()
      });

      return { success: true, couponId };
    });
  } catch (error: any) {
    console.error("[Coupon Service] Issue Error:", error.message);
    return { success: false, message: error.message };
  }
}

/**
 * 獲取用戶錢包中所有可用的優惠券
 */
export async function getActiveCoupons(db: Firestore, userId: string) {
  try {
    const today = format(new Date(), "yyyy-MM-dd");
    const q = query(
      collection(db, 'users', userId, 'coupons'),
      where('isUsed', '==', false),
      where('status', '==', 'Active')
    );
    
    const snap = await getDocs(q);
    return snap.docs
      .map(d => d.data())
      .filter((c: any) => !c.expiryDate || c.expiryDate >= today);
  } catch (e) {
    console.error(e);
    return [];
  }
}

/**
 * 當訂單取消時，自動退回優惠券至錢包
 */
export async function restoreCouponToWallet(db: Firestore, userId: string, couponId: string) {
  try {
    const couponRef = doc(db, 'users', userId, 'coupons', couponId);
    await updateDoc(couponRef, {
      isUsed: false,
      status: 'Active',
      usedOrderId: null,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}
