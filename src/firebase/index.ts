import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { firebaseConfig } from './config';

/**
 * @fileOverview Firebase 核心基礎設施 - 100% 穩定指向版
 * 
 * 修正策略：
 * 1. 嚴格鎖定具名資料庫 "shoppoint-hk"，徹底杜絕 (default) 造成的 500 錯誤與載入延遲。
 * 2. 針對 SSR 環境實施安全檢查，確保 Auth/Storage 不在 Node 階段初始化。
 */

export function initializeFirebase() {
  const isServer = typeof window === 'undefined';
  const apps = getApps();
  
  // 確保全站共用單一 App 實例
  const app = apps.length > 0 ? getApp() : initializeApp(firebaseConfig);

  // 核心：強制指定具名資料庫。如果此處漏寫，Firebase 會預設去讀取 (default)，導致 10 秒以上的連接超時。
  const db = getFirestore(app, "shoppoint-hk");

  // Auth 與 Storage 在伺服器組件中初始化會嘗試存取瀏覽器 API (如 localStorage) 導致崩潰
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
