export type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete' | 'write';
  requestResourceData?: any;
};

/**
 * 自定義 Firestore 權限錯誤類別
 * 修正：加入 toJSON 方法，確保 Error 對象在傳遞給監聽器時能正確序列化。
 */
export class FirestorePermissionError extends Error {
  context: SecurityRuleContext;

  constructor(context: SecurityRuleContext) {
    const message = `FirestoreError: Missing or insufficient permissions: The following request was denied by Firestore Security Rules:\n${JSON.stringify(
      context,
      null,
      2
    )}`;
    super(message);
    this.name = 'FirestorePermissionError';
    this.context = context;
  }

  /**
   * 確保 Error 對象在跨進程傳遞或 JSON.stringify 時能保留 context
   */
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      context: this.context
    };
  }
}
