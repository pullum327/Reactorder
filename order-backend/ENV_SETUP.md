# 🔒 環境變數設定指南

## 📋 重要提醒

**⚠️ 永遠不要將 `.env` 檔案提交到 Git！**

此檔案包含敏感資訊如資料庫密碼、API 金鑰等，如果被提交到版本控制，可能會造成安全風險。

## 🗂️ 需要建立的檔案

在 `order-backend` 目錄下建立 `.env` 檔案：

```bash
# 複製此內容到 .env 檔案
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_database_user
DB_PASS=your_database_password
DB_NAME=your_database_name

JWT_SECRET=your_jwt_secret_key_here_change_me_in_production

STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_signing_secret

SENDGRID_API_KEY=your_sendgrid_api_key
FROM_EMAIL=your_verified_sender_email@yourdomain.com
FROM_NAME=Your Store Name

PORT=4000
```

## 🔑 如何取得各項設定值

### 1. 資料庫設定
```bash
# MySQL 範例
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASS=your_password
DB_NAME=stripe_orders
```

### 2. JWT 密鑰
```bash
# 生成強密碼 (至少 32 字元)
JWT_SECRET=my_super_secret_jwt_key_that_is_very_long_and_secure_12345
```

### 3. Stripe 金鑰
1. 登入 [Stripe Dashboard](https://dashboard.stripe.com/)
2. 切換到測試模式 (Test Mode)
3. 前往 **Developers > API keys**
4. 複製 **Publishable key** 和 **Secret key**

### 4. Webhook 密鑰
1. 在 Stripe Dashboard 前往 **Developers > Webhooks**
2. 點擊 **Add endpoint**
3. URL: `https://yourdomain.com/api/stripe/webhook`
4. 選擇事件：`payment_intent.succeeded`
5. 複製 **Signing secret**

### 5. SendGrid 設定
1. 註冊 [SendGrid](https://sendgrid.com/) 帳號
2. 建立 API Key
3. 驗證發件人 Email

## 🚀 快速設定腳本

建立 `setup-env.bat` (Windows) 或 `setup-env.sh` (Linux/Mac)：

### Windows (setup-env.bat)
```batch
@echo off
echo 🔒 建立環境變數檔案...
echo.

if exist .env (
    echo .env 檔案已存在，備份為 .env.backup
    copy .env .env.backup
)

echo 請輸入以下資訊：
echo.

set /p DB_HOST=資料庫主機 (預設: localhost): 
set /p DB_PORT=資料庫埠號 (預設: 3306): 
set /p DB_USER=資料庫用戶名: 
set /p DB_PASS=資料庫密碼: 
set /p DB_NAME=資料庫名稱: 
set /p JWT_SECRET=JWT 密鑰: 
set /p STRIPE_SECRET_KEY=Stripe 密鑰: 
set /p STRIPE_PUBLISHABLE_KEY=Stripe 公開金鑰: 
set /p STRIPE_WEBHOOK_SECRET=Webhook 密鑰: 

echo 建立 .env 檔案...
(
echo # 資料庫設定
echo DB_HOST=%DB_HOST%
echo DB_PORT=%DB_PORT%
echo DB_USER=%DB_USER%
echo DB_PASS=%DB_PASS%
echo DB_NAME=%DB_NAME%
echo.
echo # JWT 設定
echo JWT_SECRET=%JWT_SECRET%
echo.
echo # Stripe 設定
echo STRIPE_SECRET_KEY=%STRIPE_SECRET_KEY%
echo STRIPE_PUBLISHABLE_KEY=%STRIPE_PUBLISHABLE_KEY%
echo STRIPE_WEBHOOK_SECRET=%STRIPE_WEBHOOK_SECRET%
echo.
echo # 伺服器設定
echo PORT=4000
) > .env

echo ✅ .env 檔案建立完成！
echo.
pause
```

### Linux/Mac (setup-env.sh)
```bash
#!/bin/bash
echo "🔒 建立環境變數檔案..."
echo

if [ -f .env ]; then
    echo ".env 檔案已存在，備份為 .env.backup"
    cp .env .env.backup
fi

echo "請輸入以下資訊："
echo

read -p "資料庫主機 (預設: localhost): " DB_HOST
read -p "資料庫埠號 (預設: 3306): " DB_PORT
read -p "資料庫用戶名: " DB_USER
read -p "資料庫密碼: " DB_PASS
read -p "資料庫名稱: " DB_NAME
read -p "JWT 密鑰: " JWT_SECRET
read -p "Stripe 密鑰: " STRIPE_SECRET_KEY
read -p "Stripe 公開金鑰: " STRIPE_PUBLISHABLE_KEY
read -p "Webhook 密鑰: " STRIPE_WEBHOOK_SECRET

echo "建立 .env 檔案..."
cat > .env << EOF
# 資料庫設定
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-3306}
DB_USER=$DB_USER
DB_PASS=$DB_PASS
DB_NAME=$DB_NAME

# JWT 設定
JWT_SECRET=$JWT_SECRET

# Stripe 設定
STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY
STRIPE_PUBLISHABLE_KEY=$STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET=$STRIPE_WEBHOOK_SECRET

# 伺服器設定
PORT=4000
EOF

echo "✅ .env 檔案建立完成！"
echo
```

## 🔍 驗證設定

建立 `.env` 檔案後，可以執行以下指令驗證：

```bash
# 檢查環境變數是否載入
node -e "require('dotenv').config(); console.log('DB_HOST:', process.env.DB_HOST); console.log('STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? '已設定' : '未設定');"

# 啟動伺服器測試
npm run dev
```

## 🚨 安全注意事項

1. **永遠不要提交 `.env` 檔案到 Git**
2. **定期更換 JWT 密鑰**
3. **使用強密碼**
4. **生產環境使用 HTTPS**
5. **定期檢查 API 金鑰權限**

## 📝 故障排除

### 常見問題
1. **環境變數未載入**
   - 確認 `.env` 檔案在正確目錄
   - 檢查檔案格式是否正確

2. **資料庫連線失敗**
   - 檢查資料庫服務是否運行
   - 確認用戶權限

3. **Stripe 金鑰無效**
   - 確認使用正確的測試/生產金鑰
   - 檢查金鑰是否完整複製

4. **Webhook 簽名驗證失敗**
   - 確認 Webhook 密鑰正確
   - 檢查 Stripe Dashboard 設定
