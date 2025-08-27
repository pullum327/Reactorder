@echo off
echo 🧪 Stripe Webhook 測試腳本
echo ================================
echo.

REM 設定測試資料
set ORDER_ID=ORD-12345678
set PAYMENT_INTENT_ID=pi_test_success_123
set WEBHOOK_SECRET=whsec_test_secret
set TIMESTAMP=%time:~0,2%%time:~3,2%%time:~6,2%

echo 📋 測試資料：
echo 訂單 ID: %ORDER_ID%
echo 付款意圖 ID: %PAYMENT_INTENT_ID%
echo 時間戳: %TIMESTAMP%
echo.

REM 建立測試 payload
echo {"id":"evt_test_webhook","object":"event","api_version":"2020-08-27","created":%TIMESTAMP%,"data":{"object":{"id":"%PAYMENT_INTENT_ID%","object":"payment_intent","amount":10000,"currency":"hkd","metadata":{"orderId":"%ORDER_ID%"},"status":"succeeded","created":%TIMESTAMP%}},"livemode":false,"pending_webhooks":1,"request":{"id":"req_test_request","idempotency_key":null},"type":"payment_intent.succeeded"} > test-payload.json

echo 📤 發送測試 Webhook 到後端...
echo.

REM 使用 curl 發送測試請求
curl -X POST http://localhost:4000/api/stripe/webhook ^
  -H "Content-Type: application/json" ^
  -H "Stripe-Signature: t=%TIMESTAMP%,v1=test_signature" ^
  -d @test-payload.json

echo.
echo.
echo ✅ 測試完成！請檢查後端日誌。
echo.
echo 📝 注意：這是一個簡化測試，實際使用時需要正確的 Stripe 簽名。
echo.
pause
