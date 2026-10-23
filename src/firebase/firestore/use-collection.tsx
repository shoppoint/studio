'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Query, 
  onSnapshot, 
  QuerySnapshot, 
  DocumentData,
  queryEqual
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError, type SecurityRuleContext } from '@/firebase/errors';

/**
 * 實時監聽 Firestore 集合的 Hook (加固診斷版)
 */
export function useCollection<T = DocumentData>(query: Query<T> | null) {
  const [data, setData] = useState<T[] | null>(null);
  const [loading, setLoading] = useState(!!query);
  const [error, setError] = useState<Error | null>(null);
  
  const stableQuery = useRef<Query<T> | null>(null);

  if (query && (!stableQuery.current || !queryEqual(query, stableQuery.current))) {
    stableQuery.current = query;
  } else if (!query) {
    stableQuery.current = null;
  }

  const dataFingerprint = useRef<string>("");

  useEffect(() => {
    const activeQuery = stableQuery.current;
    
    if (!activeQuery || typeof (activeQuery as any).firestore === 'undefined') {
      setData(null);
      setLoading(false);
      dataFingerprint.current = "";
      return;
    }

    const unsubscribe = onSnapshot(
      activeQuery,
      (snapshot: QuerySnapshot<T>) => {
        const items = snapshot.docs.map((doc) => ({
          ...(doc.data() as any),
          id: doc.id,
        }));
        
        const currentFingerprint = JSON.stringify(items);
        if (currentFingerprint !== dataFingerprint.current) {
          dataFingerprint.current = currentFingerprint;
          setData(items);
        }
        setLoading(false);
      },
      async (err) => {
        // 健壯的路徑提取邏輯
        let path = "Collection Query";
        try {
          const internalQuery = (activeQuery as any)._query;
          if (internalQuery && internalQuery.path) {
            path = internalQuery.path.segments.join('/');
          }
        } catch(e) {}

        const permissionError = new FirestorePermissionError({
          path,
          operation: 'list',
        } satisfies SecurityRuleContext);

        // 僅在發生權限錯誤時發送診斷
        if (err.message.includes('permissions')) {
          errorEmitter.emit('permission-error', permissionError);
        }
        
        setError(err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [stableQuery.current]); 

  return useMemo(() => ({ data, loading, error }), [data, loading, error]);
}