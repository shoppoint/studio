
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { 
  DocumentReference, 
  onSnapshot, 
  DocumentSnapshot, 
  DocumentData,
  refEqual
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

/**
 * 實時監聽 Firestore 單一文件的 Hook (加固診斷版)
 * 優化策略：
 * 1. 穩定引用比較，防止無限循環。
 * 2. 只有在確定發生權限錯誤時才發出診斷，忽略載入初期的瞬時缺失。
 * 3. loading 狀態初始化為 true 除非明確知道 ref 為空。
 */
export function useDoc<T = DocumentData>(ref: DocumentReference<T> | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const stableRef = useRef<DocumentReference<T> | null>(null);

  // 檢查引用是否真的改變
  if (ref && (!stableRef.current || !refEqual(ref, stableRef.current))) {
    stableRef.current = ref;
  } else if (!ref) {
    stableRef.current = null;
  }

  const dataFingerprint = useRef<string>("");

  useEffect(() => {
    const activeRef = stableRef.current;
    
    if (!activeRef) {
      setData(null);
      // 如果根本沒傳進來 ref，就不應該一直卡在 loading，除非我們在等待 Auth
      // 這裡由呼叫端判斷
      setLoading(false);
      return;
    }

    setLoading(true);

    const unsubscribe = onSnapshot(
      activeRef,
      (snapshot: DocumentSnapshot<T>) => {
        const docData = snapshot.exists() ? ({ ...snapshot.data(), id: snapshot.id } as T) : null;
        
        const currentFingerprint = JSON.stringify(docData);
        if (currentFingerprint !== dataFingerprint.current) {
          dataFingerprint.current = currentFingerprint;
          setData(docData);
        }
        setLoading(false);
        setError(null);
      },
      async (err) => {
        // 只有當確定是用戶權限問題時才報警
        if (err.message.includes('permissions')) {
          const permissionError = new FirestorePermissionError({
            path: activeRef.path,
            operation: 'get',
          } satisfies SecurityRuleContext);
          errorEmitter.emit('permission-error', permissionError);
        }
        
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [stableRef.current]);

  return useMemo(() => ({ data, loading, error }), [data, loading, error]);
}
