'use server';

import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { MIGRATION_LIST, SUB_COLLECTIONS } from '@/lib/constants/migration';

/**
 * @fileOverview 伺服器端資料庫遷移工具 (特權模式)
 * 使用 firebase-admin 繞過安全性規則執行跨資料庫搬運。
 */

function getMigrationAdminDbs() {
  if (getApps().length === 0) {
    initializeApp();
  }
  
  // 來源資料庫 (shoppoint-hk)
  const sourceDb = getFirestore("shoppoint-hk");
  // 目標資料庫 ((default))
  const targetDb = getFirestore();

  return { sourceDb, targetDb };
}

/**
 * 伺服器端執行單一集合遷移
 */
export async function migrateSingleCollectionAction(collectionName: string) {
  try {
    const { sourceDb, targetDb } = getMigrationAdminDbs();
    console.log(`[Server Migration Action] Starting: ${collectionName}`);

    const sourceRef = sourceDb.collection(collectionName);
    const snapshot = await sourceRef.get();
    
    if (snapshot.empty) {
      return { success: true, count: 0 };
    }

    let count = 0;
    
    // 為了避免大規模批次導致的記憶體問題，我們採用循環寫入
    for (const docSnap of snapshot.docs) {
      const data = docSnap.data();
      const docId = docSnap.id;

      // 1. 寫入目標主文件
      await targetDb.collection(collectionName).doc(docId).set(data, { merge: true });

      // 2. 檢查並搬運子集合
      const subs = SUB_COLLECTIONS[collectionName];
      if (subs) {
        for (const subName of subs) {
          const subSourceRef = sourceDb.collection(collectionName).doc(docId).collection(subName);
          const subSnapshot = await subSourceRef.get();
          
          if (!subSnapshot.empty) {
            for (const subDocSnap of subSnapshot.docs) {
              await targetDb.collection(collectionName).doc(docId).collection(subName).doc(subDocSnap.id).set(subDocSnap.data(), { merge: true });
            }
          }
        }
      }

      count++;
    }

    console.log(`[Server Migration Action] ${collectionName} completed: ${count} docs`);
    return { success: true, count };
  } catch (error: any) {
    console.error(`[Server Migration Error] ${collectionName}:`, error.message);
    return { success: false, message: error.message };
  }
}
