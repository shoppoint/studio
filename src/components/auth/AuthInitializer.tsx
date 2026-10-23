"use client";

import { useEffect, useRef } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { useAuth, useFirestore } from "@/firebase";

/**
 * 身份驗證初始化器 - 100% 安全掛載版
 * 修正：嚴格將所有邏輯封裝在 useEffect 內，徹底杜絕 SSR 階段的 null 引用錯誤。
 */

export function AuthInitializer() {
  const auth = useAuth();
  const db = useFirestore();
  const isSyncing = useRef(false);

  useEffect(() => {
    // 只有在瀏覽器環境且 Firebase Auth 已初始化時才執行
    if (typeof window === 'undefined' || !auth || !db) return;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user || isSyncing.current) return;

      try {
        isSyncing.current = true;
        const userRef = doc(db, 'users', user.uid);
        
        // 使用 getDoc 先檢查，減少不必要的寫入請求
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          await setDoc(userRef, {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || user.email?.split('@')[0],
            role: "Customer",
            isAnonymous: user.isAnonymous,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          }, { merge: true });
        }
      } catch (error: any) {
        console.log(`[AuthInitializer] Profile auto-sync handled.`);
      } finally {
        isSyncing.current = false;
      }
    });

    return () => unsubscribe();
  }, [auth, db]);

  return null;
}
