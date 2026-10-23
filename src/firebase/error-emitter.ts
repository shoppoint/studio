/**
 * @fileOverview 超輕量級事件發射器 (修復編譯兼容性版)
 * 取代 Node.js 的 events 模組，減少客戶端 Bundle 體積。
 */

import { FirestorePermissionError } from './errors';

type Listener = (error: FirestorePermissionError) => void;

class FirebaseErrorEmitter {
  private listeners: Set<Listener>;

  constructor() {
    // 核心修正：改在構造函數內初始化，確保 Webpack 兼容性
    this.listeners = new Set();
  }

  emit(event: 'permission-error', error: FirestorePermissionError): boolean {
    if (event === 'permission-error') {
      this.listeners.forEach(listener => listener(error));
      return this.listeners.size > 0;
    }
    return false;
  }

  on(event: 'permission-error', listener: Listener): this {
    if (event === 'permission-error') {
      this.listeners.add(listener);
    }
    return this;
  }

  removeListener(event: 'permission-error', listener: Listener): this {
    if (event === 'permission-error') {
      this.listeners.delete(listener);
    }
    return this;
  }
}

export const errorEmitter = new FirebaseErrorEmitter();
