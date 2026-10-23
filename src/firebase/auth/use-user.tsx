'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { useAuth, useFirestore } from '../provider';

/**
 * 系統核心權限 Hook - 終極穩定版 (Anti-Hydration Mismatch)
 * 
 * 修正策略：
 * 1. 初始狀態強制為 null，確保 SSR 與客戶端首屏完全一致。
 * 2. 訪客等級設為 'guest'，與註冊後的 'classic' 嚴格區分，確保促銷匹配精準。
 */
export function useUser() {
  const auth = useAuth();
  const db = useFirestore();
  
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  
  const lastUid = useRef<string | null>(null);
  const ADMIN_EMAILS = ['shoppoint.hk@gmail.com', 'bsconcept.hk@gmail.com'];

  useEffect(() => {
    setIsMounted(true);
    if (!auth || !db) {
      setLoading(false);
      return;
    }

    let unsubscribeDoc: (() => void) | undefined;

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser?.uid !== lastUid.current) {
        setLoading(true);
        lastUid.current = currentUser?.uid || null;
      }
      
      setUser(currentUser);
      
      if (currentUser && db) {
        const userDocRef = doc(db, 'users', currentUser.uid);
        if (unsubscribeDoc) unsubscribeDoc();

        unsubscribeDoc = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setUserData({ ...docSnap.data(), uid: currentUser.uid });
          } else {
            const isHardcodedAdmin = currentUser.email && ADMIN_EMAILS.includes(currentUser.email.toLowerCase());
            setUserData({ 
              role: isHardcodedAdmin ? 'Superadmin' : 'Guest', 
              tier: 'guest', // 修正：訪客明確標記為 guest，而非 classic
              status: 'Active', 
              isAnonymous: currentUser.isAnonymous 
            });
          }
          setLoading(false);
        }, (error) => {
          console.warn("[useUser] Firestore sync error:", error.message);
          setLoading(false);
        });

      } else {
        if (unsubscribeDoc) {
          unsubscribeDoc();
          unsubscribeDoc = undefined;
        }
        setUserData({ role: 'Guest', tier: 'guest', status: 'Active', isAnonymous: true });
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeDoc) unsubscribeDoc();
    };
  }, [auth, db]);

  const currentRole = useMemo(() => {
    if (!user) return 'Guest';
    if (user.email && ADMIN_EMAILS.includes(user.email.toLowerCase())) {
      return 'Superadmin';
    }
    return userData?.role || 'Guest';
  }, [user, userData]);

  return useMemo(() => ({ 
    user, 
    userData: userData ? { ...userData, role: currentRole } : null,
    loading: !isMounted || loading, 
    isAdmin: currentRole === 'Superadmin',
    isVendor: currentRole === 'Vendor',
    isShopManager: currentRole === 'Superadmin' || currentRole === 'ShopManager',
    isGuest: currentRole === 'Guest',
    isStaff: ['Superadmin', 'ShopManager'].includes(currentRole)
  }), [user, userData, loading, currentRole, isMounted]);
}
