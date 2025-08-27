@echo off
chcp 65001 >nul
echo 🔒 Stripe 付款系統環境變數設定
echo ========================================
echo.

REM 檢查 .env 檔案是否存在
if exist .env (
    echo ⚠️  .env 檔案已存在！
    echo.
    set /p BACKUP=是否要備份現有檔案？(y/n): 
    if /i "%BACKUP%"=="y" (
        echo 📋 備份現有 .env 檔案...
        copy .env .env.backup
        echo ✅ 備份完成：.env.backup
        echo.
    )
)

echo 📝 請輸入以下資訊：
echo.

REM 資料庫設定
set /p DB_HOST=資料庫主機 (預設: localhost): 
if "%DB_HOST%"=="" set DB_HOST=localhost

set /p DB_PORT=資料庫埠號 (預設: 3306): 
if "%DB_PORT%"=="" set DB_PORT=3306

set /p DB_USER=資料庫用戶名: 
if "%DB_USER%"=="" (
    echo ❌ 資料庫用戶名不能為空！
    pause
    exit /b 1
)

set /p DB_PASS=資料庫密碼: 
if "%DB_PASS%"=="" (
    echo ❌ 資料庫密碼不能為空！
    pause
    exit /b 1
)

set /p DB_NAME=資料庫名稱: 
if "%DB_NAME%"=="" (
    echo ❌ 資料庫名稱不能為空！
    pause
    exit /b 1
)

echo.
echo 🔑 JWT 設定
echo.

set /p JWT_SECRET=JWT 密鑰 (建議至少 32 字元): 
if "%JWT_SECRET%"=="" (
    echo ❌ JWT 密鑰不能為空！
    pause
    exit /b 1
)

echo.
echo 💳 Stripe 設定
echo.

set /p STRIPE_SECRET_KEY=Stripe 密鑰 (sk_test_...): 
if "%STRIPE_SECRET_KEY%"=="" (
    echo ❌ Stripe 密鑰不能為空！
    pause
    exit /b 1
)

set /p STRIPE_PUBLISHABLE_KEY=Stripe 公開金鑰 (pk_test_...): 
if "%STRIPE_PUBLISHABLE_KEY%"=="" (
    echo ❌ Stripe 公開金鑰不能為空！
    pause
    exit /b 1
)

set /p STRIPE_WEBHOOK_SECRET=Webhook 密鑰 (whsec_...): 
if "%STRIPE_WEBHOOK_SECRET%"=="" (
    echo ❌ Webhook 密鑰不能為空！
    pause
    exit /b 1
)

echo.
echo 📧 SendGrid 設定 (可選)
echo.

set /p SENDGRID_API_KEY=SendGrid API 金鑰 (可選): 
set /p FROM_EMAIL=發件人 Email (可選): 
set /p FROM_NAME=發件人名稱 (可選): 

echo.
echo 🚀 建立 .env 檔案...
echo.

REM 建立 .env 檔案
(
echo # ===== 資料庫設定 =====
echo DB_HOST=%DB_HOST%
echo DB_PORT=%DB_PORT%
echo DB_USER=%DB_USER%
echo DB_PASS=%DB_PASS%
echo DB_NAME=%DB_NAME%
echo.
echo # ===== JWT 設定 =====
echo JWT_SECRET=%JWT_SECRET%
echo.
echo # ===== Stripe 設定 =====
echo STRIPE_SECRET_KEY=%STRIPE_SECRET_KEY%
echo STRIPE_PUBLISHABLE_KEY=%STRIPE_PUBLISHABLE_KEY%
echo STRIPE_WEBHOOK_SECRET=%STRIPE_WEBHOOK_SECRET%
echo.
echo # ===== SendGrid 設定 =====
if not "%SENDGRID_API_KEY%"=="" echo SENDGRID_API_KEY=%SENDGRID_API_KEY%
if not "%FROM_EMAIL%"=="" echo FROM_EMAIL=%FROM_EMAIL%
if not "%FROM_NAME%"=="" echo FROM_NAME=%FROM_NAME%
echo.
echo # ===== 伺服器設定 =====
echo PORT=4000
echo.
echo # ===== 環境設定 =====
echo NODE_ENV=development
) > .env

echo ✅ .env 檔案建立完成！
echo.
echo 📋 檔案內容預覽：
echo ----------------------------------------
type .env
echo ----------------------------------------
echo.
echo 🧪 現在可以啟動後端伺服器了：
echo   npm run dev
echo.
echo 🔒 重要提醒：
echo   - 永遠不要將 .env 檔案提交到 Git
echo   - 定期更換 JWT 密鑰
echo   - 生產環境使用 HTTPS
echo.
pause
