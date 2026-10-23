

# OmniCart | shoppoint-hk

這是一個使用 NextJS, React, Tailwind CSS 和 Firebase 構建的高級多商戶電子商務平台原型。

## ⚠️ 開發規範 (重要)
為了確保系統穩定性，所有開發與 AI 修改必須遵守：
**[DEVELOPER_GUIDELINES.md](./docs/DEVELOPER_GUIDELINES.md)**

## 官方網域設定 (Preferred)
- **主要網域**: `https://shoppoint.hk`
- **備援網域**: `https://shoppoint-hk--shoppoint-hk.asia-east1.hosted.app`

## Firebase Authentication 授權網域設定 (解決 Unauthorized Domain 錯誤)

您的授權網域清單已非常完整，請確保在 [Firebase Console](https://console.firebase.google.com/) 的 **Authentication > Settings > Authorized domains** 中包含以下項目（請不要加入 https:// 前綴）：

### 1. 本地與正式網域
- `localhost`
- `shoppoint.hk`
- `shoppoint-hk.firebaseapp.com`
- `shoppoint-hk.web.app`
- `shoppoint-hk--shoppoint-hk.asia-east1.hosted.app`

### 2. Firebase Studio 預覽環境 (非常重要)
- `6000-firebase-studio-1771392906425.cluster-nzwlpk54dvagsxetkvxzbvslyi.cloudworkstations.dev`
- `9000-firebase-studio-1771392906425.cluster-nzwlpk54dvagsxetkvxzbvslyi.cloudworkstations.dev`
- `9002-firebase-studio-1771392906425.cluster-nzwlpk54dvagsxetkvxzbvslyi.cloudworkstations.dev`

---

## 常見問題排除 (Troubleshooting)

### 1. `auth/unauthorized-domain` 錯誤
- **解決方法**：確保上述所有網域都已加入 Firebase Console。如果已加入但仍報錯，請**等待 10 分鐘**讓設定生效，並**重新整理頁面**或**在無痕視窗測試**。

### 2. `auth/invalid-credential` 錯誤
- **原因 1：App ID 不正確**。請到 Firebase Console 的「專案設定」確認您的 **App ID**。
- **原因 2：帳號不存在**。如果您尚未註冊，請在登入頁面點擊「Sign Up」切換到註冊模式。

### 3. Google 登入視窗一閃而過
- **解決方法**：請檢查瀏覽器是否阻擋了彈出視窗 (Pop-up blocker)，請允許來自此網域的彈出視窗。

---

## 主要功能
- **多語言支持**：支援繁體中文（香港）與英文切換。
- **管理員面板**：監控平台銷售數據、管理供應商。
- **賣家中心**：供應商管理、AI 產品描述生成。
- **響應式商城**：完整購物流程。
# studio
