# 電商 Demo API

使用 Node.js、Express.js、PostgreSQL 和 Supabase 建構的生產就緒電商後端 API。此專案展示了完整的電商後端功能，包含商品管理、用戶認證、購物車和訂單管理。

## 🚀 功能特色

### 核心電商功能
- **商品管理**: CRUD 操作、分類、庫存追蹤
- **用戶認證**: 註冊、登入，整合 Supabase Auth
- **購物車**: 新增/移除商品、數量管理
- **訂單管理**: 下單、訂單歷史、狀態追蹤
- **模擬支付**: Demo 用途的模擬支付流程

### 技術特色
- **RESTful API 設計**: 乾淨、一致的 API 端點
- **資料庫遷移**: PostgreSQL 架構管理，使用 node-pg-migrate
- **身份驗證**: 基於 JWT 的認證，整合 Supabase
- **請求驗證**: 輸入驗證和清理
- **錯誤處理**: 集中式錯誤處理中間件
- **測試**: 使用 Jest 和 Supertest 的完整測試套件
- **模擬資料**: 內建測試資料供 demo 使用

## 🛠️ 技術棧

- **後端**: Node.js, Express.js
- **資料庫**: PostgreSQL (透過 Supabase)
- **身份驗證**: Supabase Auth
- **測試**: Jest, Supertest
- **套件管理器**: pnpm
- **容器化**: Docker & Docker Compose
- **遷移工具**: node-pg-migrate

## 📦 快速開始

### 前置需求
- Node.js (v16 或更高版本)
- pnpm
- Docker & Docker Compose (用於本地開發)

### 安裝

1. **複製專案**
   ```bash
   git clone <repository-url>
   cd nodejs-express-supabase-api-boilerplate
   ```

2. **安裝相依套件**
   ```bash
   pnpm install
   ```

3. **環境設定**
   ```bash
   cp .env.example .env
   # 編輯 .env 檔案設定您的配置
   ```

4. **使用 Docker 啟動 (推薦)**
   ```bash
   docker-compose up
   ```

   或 **本地啟動**:
   ```bash
   # 執行資料庫遷移
   pnpm migrate:up
   
   # 載入模擬資料
   pnpm db:seed
   
   # 啟動開發伺服器
   pnpm dev
   ```

API 將在 `http://localhost:3000` 運行

## 🔧 可用指令

```bash
# 開發
pnpm dev                    # 啟動開發伺服器
pnpm start                  # 啟動生產伺服器

# 資料庫
pnpm migrate:up            # 執行資料庫遷移
pnpm migrate:down          # 回滾上一個遷移
pnpm migrate:create        # 建立新的遷移
pnpm db:seed               # 載入模擬資料

# 測試
pnpm test                   # 執行所有測試
pnpm test:watch            # 監看模式執行測試
pnpm test:coverage         # 執行測試並產生覆蓋率報告

# 代碼品質
pnpm lint                  # 執行 ESLint
pnpm lint:fix              # 修復 linting 問題
pnpm format                # 使用 Prettier 格式化代碼

# Docker
docker-compose up          # 啟動 API + Postgres
docker-compose down        # 停止容器
```

## 📚 API 文檔

### 基礎 URL
```
http://localhost:3000/api/v1
```

### 身份驗證
大部分端點需要身份驗證。在 Authorization header 中包含 JWT token：
```
Authorization: Bearer <your-jwt-token>
```

### 端點概覽

#### 商品
- `GET /products` - 商品列表 (支援分頁、篩選)
- `GET /products/:id` - 取得商品詳情
- `POST /products` - 建立商品 (僅管理員)
- `PUT /products/:id` - 更新商品 (僅管理員)
- `DELETE /products/:id` - 刪除商品 (僅管理員)

#### 分類
- `GET /categories` - 列出所有分類
- `GET /categories/:id/products` - 取得分類下的商品

#### 身份驗證
- `POST /auth/register` - 用戶註冊
- `POST /auth/login` - 用戶登入
- `GET /auth/profile` - 取得用戶資料
- `PUT /auth/profile` - 更新用戶資料

#### 購物車
- `GET /cart` - 取得購物車內容
- `POST /cart` - 新增商品到購物車
- `PUT /cart/:id` - 更新購物車商品數量
- `DELETE /cart/:id` - 從購物車移除商品

#### 訂單
- `POST /orders` - 建立新訂單
- `GET /orders` - 取得用戶訂單
- `GET /orders/:id` - 取得訂單詳情

## 🗄️ 資料庫架構

### 核心資料表
- **products** - 商品資訊、價格、庫存
- **categories** - 商品分類
- **profiles** - 用戶資料 (擴展 Supabase auth.users)
- **cart_items** - 購物車項目
- **orders** - 訂單資訊
- **order_items** - 訂單明細

## 🧪 測試

執行完整測試套件：
```bash
pnpm test
```

開發時執行監看模式測試：
```bash
pnpm test:watch
```

產生測試覆蓋率報告：
```bash
pnpm test:coverage
```

## 🚀 部署

### 環境變數
```bash
# 資料庫
DATABASE_URL=postgresql://username:password@localhost:5432/database

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# JWT
JWT_SECRET=your-jwt-secret

# 應用程式
PORT=3000
NODE_ENV=production
```

### 生產環境部署
1. 設定您的 Supabase 專案
2. 配置環境變數
3. 執行資料庫遷移
4. 使用您偏好的平台部署 (Vercel, Railway 等)

## 🤝 貢獻

1. Fork 此 repository
2. 建立您的功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交您的變更 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 開啟 Pull Request

## 📝 授權

此專案採用 MIT 授權 - 詳情請參閱 [LICENSE](LICENSE) 檔案。

## 📧 支援

如需支援和問題，請在 GitHub repository 中開啟 issue。

---

**注意**: 這是一個使用模擬資料的 demo 應用程式。生產環境使用時，請實作適當的支付處理、安全措施和資料驗證。