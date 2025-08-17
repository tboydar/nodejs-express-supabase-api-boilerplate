# Project Goal

## 🎯 Overview
一個簡易電商 demo site 的後端 API，使用 **Node.js**、**Express.js**、**PostgreSQL** 和 **Jest**—採用 **pnpm** 作為套件管理器，**Docker** 用於本地開發，**Supabase** 作為託管的 Postgres 資料庫和認證服務。

此專案展示了電商應用的完整後端架構，包含商品管理、用戶認證、購物車和訂單系統。

---

## 🚀 Objectives
1. **電商 RESTful API 開發**
   - 商品管理 (CRUD、分類、搜尋)
   - 用戶認證與授權 (Supabase Auth)
   - 購物車功能
   - 訂單管理系統

2. **資料庫設計 (PostgreSQL)**
   - 電商資料表設計 (商品、用戶、購物車、訂單)
   - SQL 遷移 (via `node-pg-migrate`)
   - 索引優化與查詢性能

3. **安全性與驗證**
   - JWT 認證中間件
   - 請求資料驗證
   - 用戶權限控制

4. **測試與品質保證**
   - Jest + Supertest 單元/整合測試
   - API 端點測試
   - 資料庫測試

5. **DevOps 準備**
   - **pnpm** 工作流程
   - **Dockerfile** 和 **docker-compose**
   - Supabase 環境配置

---

## 📂 Deliverables
- 電商核心 API 端點:
  - `/api/v1/products` - 商品管理
  - `/api/v1/categories` - 分類管理
  - `/api/v1/auth` - 用戶認證
  - `/api/v1/cart` - 購物車
  - `/api/v1/orders` - 訂單管理
- 資料庫遷移檔案 `/migrations`
- 完整測試套件 `/tests`
- 文檔:
  - `README.md` (快速開始指南)
  - `docs/api_reference.md` (API 文檔)

---

## 🛍️ 電商功能特色
- **商品系統**: 商品 CRUD、分類、庫存管理、圖片上傳
- **用戶系統**: 註冊、登入、個人資料管理
- **購物車**: 加入商品、數量調整、移除商品
- **訂單流程**: 下單、訂單狀態追蹤、訂單歷史
- **支付整合**: 模擬支付流程

---

## 🔮 Future Enhancements
- 優惠券/折扣碼系統
- 商品評價與評分
- 推薦系統
- 即時庫存通知
- 管理員後台
- 第三方支付整合 (Stripe, PayPal)

---

## ✅ Success Criteria
- `pnpm install && pnpm dev` 在本地運行電商 API
- `docker-compose up` 啟動完整的開發環境
- 所有測試通過: `pnpm test`
- 支援完整的電商購物流程 (瀏覽商品 → 加入購物車 → 下單)
- 準備好部署到 **Supabase** 生產環境