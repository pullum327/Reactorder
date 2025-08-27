const crypto = require('crypto');

// Webhook 測試工具
class WebhookTester {
  constructor(webhookSecret) {
    this.webhookSecret = webhookSecret;
  }

  // 模擬 Stripe Webhook 簽名
  generateSignature(payload, timestamp) {
    const signedPayload = `${timestamp}.${payload}`;
    const signature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(signedPayload, 'utf8')
      .digest('hex');
    
    return `t=${timestamp},v1=${signature}`;
  }

  // 建立測試付款成功事件
  createPaymentSuccessEvent(orderId, paymentIntentId) {
    const timestamp = Math.floor(Date.now() / 1000);
    const payload = JSON.stringify({
      id: 'evt_test_webhook',
      object: 'event',
      api_version: '2020-08-27',
      created: timestamp,
      data: {
        object: {
          id: paymentIntentId,
          object: 'payment_intent',
          amount: 10000, // 100.00 HKD
          currency: 'hkd',
          metadata: {
            orderId: orderId
          },
          status: 'succeeded',
          created: timestamp
        }
      },
      livemode: false,
      pending_webhooks: 1,
      request: {
        id: 'req_test_request',
        idempotency_key: null
      },
      type: 'payment_intent.succeeded'
    });

    const signature = this.generateSignature(payload, timestamp);
    
    return {
      payload: payload,
      signature: signature,
      timestamp: timestamp
    };
  }

  // 建立測試付款失敗事件
  createPaymentFailedEvent(orderId, paymentIntentId) {
    const timestamp = Math.floor(Date.now() / 1000);
    const payload = JSON.stringify({
      id: 'evt_test_webhook_failed',
      object: 'event',
      api_version: '2020-08-27',
      created: timestamp,
      data: {
        object: {
          id: paymentIntentId,
          object: 'payment_intent',
          amount: 10000,
          currency: 'hkd',
          metadata: {
            orderId: orderId
          },
          status: 'payment_failed',
          created: timestamp,
          last_payment_error: {
            code: 'card_declined',
            message: 'Your card was declined.'
          }
        }
      },
      livemode: false,
      pending_webhooks: 1,
      request: {
        id: 'req_test_request_failed',
        idempotency_key: null
      },
      type: 'payment_intent.payment_failed'
    });

    const signature = this.generateSignature(payload, timestamp);
    
    return {
      payload: payload,
      signature: signature,
      timestamp: timestamp
    };
  }
}

// 測試函數
async function testWebhook() {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_test_secret';
  const tester = new WebhookTester(webhookSecret);
  
  console.log('🧪 開始測試 Stripe Webhook 功能...\n');
  
  // 測試 1: 付款成功事件
  console.log('📋 測試 1: 付款成功事件');
  const successEvent = tester.createPaymentSuccessEvent('ORD-12345678', 'pi_test_success_123');
  console.log('Payload:', successEvent.payload);
  console.log('Signature:', successEvent.signature);
  console.log('Timestamp:', successEvent.timestamp);
  console.log('');
  
  // 測試 2: 付款失敗事件
  console.log('📋 測試 2: 付款失敗事件');
  const failedEvent = tester.createPaymentFailedEvent('ORD-87654321', 'pi_test_failed_456');
  console.log('Payload:', failedEvent.payload);
  console.log('Signature:', failedEvent.signature);
  console.log('Timestamp:', failedEvent.timestamp);
  console.log('');
  
  // 測試 3: 重複事件（防止重複交易）
  console.log('📋 測試 3: 重複事件（防止重複交易）');
  const duplicateEvent = tester.createPaymentSuccessEvent('ORD-12345678', 'pi_test_success_123');
  console.log('重複的 Order ID:', duplicateEvent.payload);
  console.log('');
  
  console.log('✅ Webhook 測試資料準備完成！');
  console.log('');
  console.log('📝 使用說明：');
  console.log('1. 將上述 payload 和 signature 複製到您的測試工具中');
  console.log('2. 向 http://localhost:4000/api/stripe/webhook 發送 POST 請求');
  console.log('3. 檢查後端日誌和資料庫更新');
  console.log('');
  console.log('🔧 測試工具推薦：');
  console.log('- Postman');
  console.log('- curl 指令');
  console.log('- Stripe CLI: stripe listen --forward-to localhost:4000/api/stripe/webhook');
}

// 如果直接執行此檔案
if (require.main === module) {
  testWebhook().catch(console.error);
}

module.exports = WebhookTester;
