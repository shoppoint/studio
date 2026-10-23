'use client';

import { ReactNode, useMemo, useEffect, useState } from 'react';
import { initializeFirebase } from './index';
import { FirebaseProvider } from './provider';

/**
 * @fileOverview 客戶端 Firebase 提供者
 * 修正：移除對 initAppCheck 的呼叫，以解決 Runtime TypeError 並排除 403 封鎖問題。
 */
export function FirebaseClientProvider({ children }: { children: ReactNode }) {
  // 核心連線（DB/Auth）必須立即初始化以供組件使用
  const { app, db, auth, storage } = useMemo(() => initializeFirebase(), []);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  return (
    <FirebaseProvider app={app} db={db} auth={auth} storage={storage}>
      {children}
    </FirebaseProvider>
  );
}
