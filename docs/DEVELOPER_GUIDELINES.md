# SHOP POINT 開發者規範 (AI 核心指令)

為了確保系統在 Firebase Studio 環境下的穩定性，尤其是已完成的「全自動支付與訂單流轉」流程，所有修改必須嚴格遵守以下指令。

## 1. 執行環境與版本規範 (穩定性基準)
*   **Node.js 版本鎖定**：全站（包括 Next.js 與 Cloud Functions）必須使用 **Node.js 22**。
*   **部署對齊**：`package.json` 與 `functions/package.json` 的 `engines` 欄位必須明確指定 `"node": "22"`。嚴禁降級。
*   **具名資料庫**：所有 Firestore 實例必須明確指向 `"shoppoint-hk"`，否則將導致連線超時。

## 2. 結帳與支付的黃金路徑 (The Golden Path)
任何涉及訂單、支付或通知的修改，不得破壞以下鏈條：

### A. 下單發起階段 (`src/app/actions/checkout-actions.ts`)
1.  **訂單寫入**：系統會先將 `isConfirmed: false` 的訂單寫入 Firestore。
2.  **支付預建**：
    *   **線上支付 (Yedpay)**：在此階段發起 API 請求獲取 `checkoutUrl`。
    *   **手動支付 (FPS/PayMe/Bank)**：不發起外部 API，僅標記 `paymentStatus: 'unpaid'`。

### B. 使用者確認與跳轉階段 (`src/app/checkout/page.tsx`)
1.  **確認對話框 (AlertDialog)**：這是防止「誤觸」並確保伺服器同步的關鍵。
2.  **確認動作**：點擊後會呼叫 `updateDoc` 將訂單的 `isConfirmed` 設為 `true`。**這是觸發背景 Cloud Functions 發送第一封郵件（含 BCC 管理員）的唯一開關。**
3.  **跳轉防禦 (Redirection Guard)**：在執行 `window.location.assign` 之前，必須 `await` 資料庫更新成功，並加入 **300ms 緩衝延遲**。這能確保資料庫觸發器（Trigger）已穩固建立，並大幅降低「No Server Response」的機率。

### C. 支付回傳與自動化 (`functions/index.js`)
1.  **Yedpay Webhook**：接收端點 `yedpayWebhook` 必須在 `internalNotes` 寫入 `[Yedpay Webhook]` 開頭的日誌。
2.  **自動電郵觸發**：`handleOrderUpdate` 內的自動發信邏輯（如 `order_placed`）必須嚴格檢查 `sourceType === 'Web'`。**禁止對 Manual 或 POS 訂單自動發信。**
3.  **BCC 副本**：所有自動發信邏輯必須讀取 `config/communication` 內的 `email.bccEmail` 並加入發送清單。

## 3. 庫存與效期管理規範 (方案 A：動態過濾)
系統採用 **FEFO (First Expired, First Out)** 原則，嚴禁隨意建立補正批次。

1.  **可用庫存定義**：前台顯示的庫存必須是該分店所有「未過期」批次的總和。
2.  **扣減順序**：
    *   自動化程序必須過濾掉已過期批次。
    *   按到期日升序排列，優先扣除最接近到期的有效批次。
3.  **超賣處理**：
    *   「拒絕超賣」：未過期庫存不足時必須報錯並中止交易。
    *   「預購/允許超賣」：扣完有效庫存後，差額部分應建立「負數批次紀錄」以體現欠貨，嚴禁生成過期批次的扣減。

## 4. 效能預熱機制 (Warm-up)
為了防止冷啟動導致的 `No Server Response` 錯誤：
*   **全域 AI 預熱**：`ClientProviders.tsx` 掛載時呼叫 `getAiStatusAction()`。
*   **結帳雙重預熱**：
    1.  **Step 1**：進入結帳頁面立即發起背景 `fetch` 喚醒伺服器。
    2.  **Step 4**：進入最後核對頁面（Review）再次發起預熱，確保點擊下單時伺服器處於熱機狀態，為 Yedpay API 留出充足響應時間。

## 5. 數據寫入安全性
*   **使用者積分更新**：在 POS 或後台修改訂單時，更新使用者積分必須使用 `transaction.set(..., { merge: true })` 而非 `update`。這能確保「訪客訂單 (Guest)」即便在 `users` 集合中沒有對應文件時，也能成功建立並錄入積分，避免報錯。

## 6. AI 生成與技術規範
為了維持內容品質與穩定性，AI 調用必須遵守：
*   **模型鎖定**：所有的原生 Google AI 調用必須鎖定使用 **"gemini-flash-latest"**。
*   **JSON 防禦**：必須使用 `src/ai/genkit.ts` 中的 `safeJsonParse()` 處理回傳內容。
*   **語言規範**：`zh` 欄位必須使用 **香港繁體中文 (港式口吻)**，嚴禁簡體字。

---
**警告：違反上述任何流程的修改都可能導致庫存數據混亂、支付失敗或通知鏈條斷裂。**
