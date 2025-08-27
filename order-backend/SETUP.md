# 🔒 安全 Stripe 付款系統設定指南

## 📋 環境變數設定

在 `order-backend` 目錄下建立 `.env` 檔案：

```bash
# 資料庫設定
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_db_user
DB_PASS=your_db_password
DB_NAME=your_db_name

# JWT 密鑰 (請使用強密碼)
JWT_SECRET=your_jwt_secret_key_here

# Stripe 設定
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# SendGrid 設定
SENDGRID_API_KEY=your_sendgrid_api_key
FROM_EMAIL=your_verified_sender_email
FROM_NAME=Your Store Name

# 伺服器設定
PORT=4000
```

## 🔑 Stripe 金鑰取得

1. 登入 [Stripe Dashboard](https://dashboard.stripe.com/)
2. 切換到測試模式 (Test Mode)
3. 在 Developers > API keys 取得：
   - Publishable key (pk_test_...)
   - Secret key (sk_test_...)
4. 在 Developers > Webhooks 建立端點：
   - URL: `https://yourdomain.com/api/stripe/webhook`
   - 選擇事件：`payment_intent.succeeded`
   - 複製 Webhook signing secret (whsec_...)

## 🗄️ 資料庫結構

確保您的資料庫有以下表格：

```sql
-- 用戶表格
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 商品表格
CREATE TABLE products (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  stock INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 訂單表格
CREATE TABLE orders (
  id VARCHAR(50) PRIMARY KEY,
  user_id INT NOT NULL,
  buyer_name VARCHAR(255) NOT NULL,
  buyer_email VARCHAR(255) NOT NULL,
  buyer_phone VARCHAR(50) NOT NULL,
  buyer_address TEXT NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  payment_status ENUM('pending', 'paid', 'failed') DEFAULT 'pending',
  stripe_payment_intent_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 訂單項目表格
CREATE TABLE order_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  order_id VARCHAR(50) NOT NULL,
  product_id INT NOT NULL,
  quantity INT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);
```

## 🚀 啟動步驟

1. 安裝依賴：
   ```bash
   npm install
   ```

2. 設定環境變數：
   ```bash
   cp .env.example .env
   # 編輯 .env 檔案填入實際值
   ```

3. 啟動伺服器：
   ```bash
   npm run dev
   ```

## 🔒 安全特性

### 前端安全
- ✅ 信用卡資訊直接傳送給 Stripe，不經過您的伺服器
- ✅ 使用 Stripe Elements 組件，符合 PCI DSS 標準
- ✅ 所有 API 呼叫都需要 JWT 認證

### 後端安全
- ✅ 訂單金額在後端重新計算驗證
- ✅ 用戶只能訪問自己的訂單
- ✅ 庫存檢查防止超賣
- ✅ Stripe Webhook 簽名驗證
- ✅ 請求速率限制（可選）

### 資料安全
- ✅ 密碼使用 bcrypt 雜湊
- ✅ JWT Token 驗證
- ✅ 資料庫連線池管理
- ✅ 錯誤日誌記錄

## 🧪 測試

1. 使用 Stripe 測試卡號：
   - 成功：`4242 4242 4242 4242`
   - 失敗：`4000 0000 0000 0002`

2. 測試流程：
   - 註冊/登入用戶
   - 加入商品到購物車
   - 填寫收件資訊
   - 選擇信用卡付款
   - 輸入測試卡號完成付款

## 📝 注意事項

- 永遠不要在前端暴露 Stripe Secret Key
- 定期更新 JWT Secret
- 監控 Stripe Webhook 事件
- 定期檢查錯誤日誌
- 在生產環境使用 HTTPS
