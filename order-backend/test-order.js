const mysql = require('mysql2/promise');

// 測試訂單建立腳本
async function createTestOrder() {
  // 資料庫連線設定
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'test_db'
  });

  try {
    console.log('🗄️ 連接到資料庫...');

    // 建立測試用戶
    const [userResult] = await connection.execute(
      'INSERT INTO users (email, password, name) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)',
      ['test@example.com', '$2b$10$test_hash', '測試用戶']
    );
    
    const userId = userResult.insertId;
    console.log(`✅ 測試用戶建立成功，ID: ${userId}`);

    // 建立測試訂單
    const orderId = 'ORD-' + Date.now().toString().slice(-8);
    const [orderResult] = await connection.execute(
      'INSERT INTO orders (id, user_id, buyer_name, buyer_email, buyer_phone, buyer_address, total, payment_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [orderId, userId, '測試買家', 'test@example.com', '12345678', '測試地址', 100.00, 'pending']
    );

    console.log(`✅ 測試訂單建立成功，ID: ${orderId}`);

    // 建立訂單項目
    await connection.execute(
      'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
      [orderId, 1, 1, 100.00]
    );

    console.log(`✅ 訂單項目建立成功`);

    // 查詢訂單確認
    const [orders] = await connection.execute(
      'SELECT * FROM orders WHERE id = ?',
      [orderId]
    );

    if (orders.length > 0) {
      console.log('\n📋 訂單詳情：');
      console.log('訂單 ID:', orders[0].id);
      console.log('買家:', orders[0].buyer_name);
      console.log('金額:', orders[0].total);
      console.log('付款狀態:', orders[0].payment_status);
      console.log('建立時間:', orders[0].created_at);
    }

    console.log('\n🧪 現在可以測試 Webhook 了！');
    console.log('使用以下資料測試：');
    console.log('- 訂單 ID:', orderId);
    console.log('- 付款意圖 ID: pi_test_123');
    console.log('- 金額: 100.00 HKD');

    return orderId;

  } catch (error) {
    console.error('❌ 建立測試訂單失敗:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

// 如果直接執行此檔案
if (require.main === module) {
  createTestOrder().catch(console.error);
}

module.exports = createTestOrder;
