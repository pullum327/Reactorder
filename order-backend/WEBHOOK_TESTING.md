# 🧪 Stripe Webhook 測試指南

## 📋 測試準備

### 1. 環境變數設定
在 `.env` 檔案中設定：
```bash
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

### 2. 資料庫準備
執行 `database-setup.sql` 建立必要的表格：
```bash
mysql -u your_user -p your_database < database-setup.sql
```

## 🧪 測試方法

### 方法 1: 使用測試腳本
```bash
# 執行測試腳本
node test-webhook.js

# 或使用 Windows 批次檔案
test-webhook-curl.bat
```

### 方法 2: 使用 Postman
1. 建立新的 POST 請求
2. URL: `http://localhost:4000/api/stripe/webhook`
3. Headers:
   - `Content-Type: application/json`
   - `Stripe-Signature: t=1234567890,v1=test_signature`
4. Body (raw JSON):
```json
{
  "id": "evt_test_webhook",
  "object": "event",
  "api_version": "2020-08-27",
  "created": 1234567890,
  "data": {
    "object": {
      "id": "pi_test_success_123",
      "object": "payment_intent",
      "amount": 10000,
      "currency": "hkd",
      "metadata": {
        "orderId": "ORD-12345678"
      },
      "status": "succeeded",
      "created": 1234567890
    }
  },
  "livemode": false,
  "pending_webhooks": 1,
  "request": {
    "id": "req_test_request",
    "idempotency_key": null
  },
  "type": "payment_intent.succeeded"
}
```

### 方法 3: 使用 curl
```bash
curl -X POST http://localhost:4000/api/stripe/webhook \
  -H "Content-Type: application/json" \
  -H "Stripe-Signature: t=1234567890,v1=test_signature" \
  -d '{
    "id": "evt_test_webhook",
    "object": "event",
    "api_version": "2020-08-27",
    "created": 1234567890,
    "data": {
      "object": {
        "id": "pi_test_success_123",
        "object": "payment_intent",
        "amount": 10000,
        "currency": "hkd",
        "metadata": {
          "orderId": "ORD-12345678"
        },
        "status": "succeeded",
        "created": 1234567890
      }
    },
    "livemode": false,
    "pending_webhooks": 1,
    "request": {
      "id": "req_test_request",
      "idempotency_key": null
    },
    "type": "payment_intent.succeeded"
  }'
```

## 🔍 測試場景

### 場景 1: 正常付款成功
- 發送 `payment_intent.succeeded` 事件
- 檢查訂單狀態是否更新為 `paid`
- 檢查 `webhook_logs` 表格是否有記錄

### 場景 2: 重複事件處理
- 發送相同訂單 ID 的付款成功事件
- 檢查是否被識別為重複事件
- 檢查訂單狀態是否保持不變

### 場景 3: 無效訂單 ID
- 發送不存在的訂單 ID
- 檢查是否回傳 404 錯誤
- 檢查錯誤日誌

### 場景 4: 簽名驗證失敗
- 發送無效的 `Stripe-Signature`
- 檢查是否回傳 400 錯誤
- 檢查錯誤日誌

## 📊 預期結果

### 成功回應
```json
{
  "received": true,
  "message": "Order payment processed successfully",
  "orderId": "ORD-12345678",
  "paymentIntentId": "pi_test_success_123",
  "status": "processed"
}
```

### 重複事件回應
```json
{
  "received": true,
  "message": "Order already processed",
  "orderId": "ORD-12345678",
  "status": "already_paid"
}
```

### 錯誤回應
```json
{
  "error": "Order not found"
}
```

## 🔧 故障排除

### 常見問題
1. **Webhook 端點無法訪問**
   - 檢查後端伺服器是否運行
   - 檢查防火牆設定

2. **簽名驗證失敗**
   - 檢查 `STRIPE_WEBHOOK_SECRET` 設定
   - 檢查 `Stripe-Signature` 標頭格式

3. **資料庫錯誤**
   - 檢查資料庫連線
   - 檢查表格結構是否正確

### 日誌檢查
檢查後端控制台輸出：
```
[2024-01-01T12:00:00.000Z] Received Stripe webhook: payment_intent.succeeded
Order ORD-12345678 successfully marked as paid with payment intent pi_test_success_123
```

## 📝 注意事項

1. **測試環境**：確保在測試環境中進行測試
2. **資料隔離**：測試資料與生產資料分離
3. **簽名驗證**：實際使用時必須驗證 Stripe 簽名
4. **錯誤處理**：測試各種錯誤情況
5. **效能測試**：測試大量 Webhook 的處理能力

## 🚀 下一步

測試完成後，您可以：
1. 設定生產環境的 Webhook 端點
2. 監控 Webhook 處理效能
3. 實作更多事件類型的處理
4. 加入 Webhook 重試機制
