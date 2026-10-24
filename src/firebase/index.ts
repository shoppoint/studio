import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { firebaseConfig } from './config';

/**
 * @fileOverview Firebase 核心基礎設施 - 100% 穩定指向版 (V29 - 穩定性加固)
 */

export function initializeFirebase() {
  const isServer = typeof window === 'undefined';
  const apps = getApps();
  const app = apps.length > 0 ? getApp() : initializeApp(firebaseConfig);

  // 核心修正：強制指定具名資料庫，並在客戶端開啟長輪詢以解決 RPC 'Listen' transport errored 問題
  const db = !isServer 
    ? initializeFirestore(app, {
        experimentalForceLongPolling: true,
      }, "shoppoint-hk")
    : getFirestore(app, "shoppoint-hk");

  let auth: any = null;
  let storage: any = null;

  if (!isServer) {
    auth = getAuth(app);
    storage = getStorage(app);
  }

  return { app, db, auth, storage };
}

export * from './provider';
export * from './auth/use-user';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
