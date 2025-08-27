require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sgMail = require('@sendgrid/mail');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const app = express();
app.use(cors());
app.use(express.json());

// ===== SendGrid 初始化 =====
sgMail.setApiKey((process.env.SENDGRID_API_KEY || '').trim());

// ===== DB 連線池 =====
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 10,
});

// ===== 小工具 =====
const SECRET = process.env.JWT_SECRET || 'CHANGE_ME';

function orderHtml({ buyer, items, total, orderId }) {
  const rows = items.map(it => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #eee">${it.name}</td>
      <td style="padding:8px;border-bottom:1px solid #eee">${it.qty}</td>
      <td style="padding:8px;border-bottom:1px solid #eee">$${it.price}</td>
    </tr>`).join('');
  return `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial">
    <h2>感謝您的訂購！</h2>
    <p>訂單編號：<b>${orderId}</b></p>
    <h3>訂購人</h3>
    <p>${buyer.name}（${buyer.email} / ${buyer.phone}）<br/>${buyer.address}</p>
    <h3>品項</h3>
    <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;background:#fff">
      <thead><tr>
        <th align="left" style="padding:8px;border-bottom:2px solid #ddd">名稱</th>
        <th align="left" style="padding:8px;border-bottom:2px solid #ddd">數量</th>
        <th align="left" style="padding:8px;border-bottom:2px solid #ddd">單價</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="margin-top:12px">合計：<b>$${total}</b></p>
  </div>`;
}

// ===== JWT 驗證 =====
function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.replace(/^Bearer\s+/, '');
  if (!token) return res.status(401).json({ error: '需要登入' });
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token 無效或過期' });
  }
}

// ===== Products =====
app.get('/api/products', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT id, name, price, image_url, stock FROM products ORDER BY created_at'
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '無法取得商品資料' });
  }
});

// ===== Auth =====
app.post('/api/auth/register', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password || !name) return res.status(400).json({ error: '請提供姓名、Email、密碼' });
  try {
    const hash = await bcrypt.hash(password, 10);
    await pool.query('INSERT INTO users (email,password,name) VALUES (?,?,?)', [email, hash, name]);
    res.status(201).json({ message: '註冊成功' });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: '此 Email 已被使用' });
    console.error(e);
    res.status(500).json({ error: '註冊失敗' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: '請提供 Email、密碼' });
  try {
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
    if (!rows.length) return res.status(401).json({ error: '帳號或密碼錯誤' });
    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: '帳號或密碼錯誤' });
    const token = jwt.sign({ id: user.id, email: user.email, name: user.name }, SECRET, { expiresIn: '2h' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: '登入失敗' });
  }
});

app.get('/api/auth/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

// ===== 测试端点 =====
app.get('/api/test', (req, res) => {
  res.json({ message: 'API 正常工作', timestamp: new Date().toISOString() });
});

// ===== Stripe 支付 =====
app.post('/api/create-payment-intent', authenticate, async (req, res) => {
  console.log(`[${new Date().toISOString()}] User ${req.user.id} creating payment intent:`, req.body);
  
  try {
    const { orderId, items } = req.body;
    
    if (!orderId || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: '缺少訂單資訊或商品清單' });
    }
    
    // 驗證訂單存在且屬於當前用戶
    const [orders] = await pool.query(
      'SELECT * FROM orders WHERE id = ? AND user_id = ?',
      [orderId, req.user.id]
    );
    
    if (orders.length === 0) {
      console.log(`Order ${orderId} not found for user ${req.user.id}`);
      return res.status(404).json({ error: '訂單不存在或無權限訪問' });
    }
    
    const order = orders[0];
    
    // 從資料庫重新查詢商品價格並驗證
    const itemIds = items.map(item => item.id);
    const [products] = await pool.query(
      'SELECT id, price, stock FROM products WHERE id IN (?)',
      [itemIds]
    );
    
    if (products.length !== items.length) {
      return res.status(400).json({ error: '部分商品不存在' });
    }
    
    // 重新計算總金額並驗證庫存
    let calculatedTotal = 0;
    const validatedItems = [];
    
    for (const item of items) {
      const product = products.find(p => p.id === item.id);
      if (item.qty > product.stock) {
        return res.status(400).json({ error: `商品 ${product.name} 庫存不足` });
      }
      
      const itemTotal = product.price * item.qty;
      calculatedTotal += itemTotal;
      
      validatedItems.push({
        ...item,
        actualPrice: product.price,
        itemTotal
      });
    }
    
    // 驗證計算金額與訂單金額是否相符（允許小數點誤差）
    if (Math.abs(calculatedTotal - order.total) > 0.01) {
      console.log(`Amount mismatch: calculated=${calculatedTotal}, order=${order.total}`);
      return res.status(400).json({ 
        error: '訂單金額驗證失敗',
        calculated: calculatedTotal,
        order: order.total
      });
    }
    
    // 使用驗證後的金額建立 Stripe 付款意圖
    const amount = Math.round(calculatedTotal * 100); // Stripe 使用分為單位
    
    console.log(`Creating Stripe payment intent: amount=${calculatedTotal} HKD (${amount} cents)`);
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'hkd',
      metadata: {
        orderId: order.id,
        userId: req.user.id,
        calculatedAmount: calculatedTotal.toString()
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    console.log(`Payment intent created successfully: ${paymentIntent.id}`);
    
    res.json({
      client_secret: paymentIntent.client_secret,
      amount: calculatedTotal, // 回傳驗證後的金額
      orderId: order.id
    });
  } catch (error) {
    console.error('Stripe payment intent creation failed:', error);
    res.status(500).json({
      error: error.message || '建立付款意圖失敗',
    });
  }
});

// 新增：驗證訂單金額的端點
app.post('/api/orders/validate', authenticate, async (req, res) => {
  try {
    const { items } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: '商品清單不能為空' });
    }
    
    // 從資料庫重新查詢商品價格
    const itemIds = items.map(item => item.id);
    const [products] = await pool.query(
      'SELECT id, name, price, stock FROM products WHERE id IN (?)',
      [itemIds]
    );
    
    if (products.length !== items.length) {
      return res.status(400).json({ error: '部分商品不存在' });
    }
    
    // 重新計算總金額並驗證庫存
    let total = 0;
    const validatedItems = [];
    
    for (const item of items) {
      const product = products.find(p => p.id === item.id);
      if (item.qty > product.stock) {
        return res.status(400).json({ error: `商品 ${product.name} 庫存不足` });
      }
      
      const itemTotal = product.price * item.qty;
      total += itemTotal;
      
      validatedItems.push({
        ...item,
        actualPrice: product.price,
        itemTotal
      });
    }
    
    res.json({
      validatedItems,
      total,
      currency: 'hkd'
    });
  } catch (error) {
    console.error('Order validation failed:', error);
    res.status(500).json({ error: '訂單驗證失敗' });
  }
});

// 新增：Stripe Webhook 處理
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  let event;
  
  try {
    // 驗證 Webhook 簽名
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  
  console.log(`[${new Date().toISOString()}] Received Stripe webhook: ${event.type}`);
  
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    const orderId = paymentIntent.metadata.orderId;
    
    if (!orderId) {
      console.error('Payment intent missing orderId metadata');
      return res.status(400).json({ error: 'Missing orderId metadata' });
    }
    
    try {
      // 檢查是否已經處理過此付款（防止重複交易）
      const [existingOrders] = await pool.query(
        'SELECT id, payment_status, stripe_payment_intent_id FROM orders WHERE id = ?',
        [orderId]
      );
      
      if (existingOrders.length === 0) {
        console.error(`Order ${orderId} not found`);
        return res.status(404).json({ error: 'Order not found' });
      }
      
      const order = existingOrders[0];
      
      // 檢查是否已經付款成功
      if (order.payment_status === 'paid') {
        console.log(`Order ${orderId} already marked as paid, skipping duplicate webhook`);
        return res.json({ 
          received: true, 
          message: 'Order already processed',
          orderId: orderId,
          status: 'already_paid'
        });
      }
      
      // 檢查是否已經有 Stripe Payment Intent ID
      if (order.stripe_payment_intent_id && order.stripe_payment_intent_id !== paymentIntent.id) {
        console.log(`Order ${orderId} has different payment intent: ${order.stripe_payment_intent_id} vs ${paymentIntent.id}`);
        return res.json({ 
          received: true, 
          message: 'Different payment intent already processed',
          orderId: orderId,
          existingPaymentIntent: order.stripe_payment_intent_id
        });
      }
      
      // 更新訂單狀態為已付款
      await pool.query(
        'UPDATE orders SET payment_status = ?, stripe_payment_intent_id = ?, updated_at = NOW() WHERE id = ?',
        ['paid', paymentIntent.id, orderId]
      );
      
      console.log(`[${new Date().toISOString()}] Order ${orderId} successfully marked as paid with payment intent ${paymentIntent.id}`);
      
      // 記錄成功的 Webhook 處理
      await pool.query(
        'INSERT INTO webhook_logs (order_id, stripe_payment_intent_id, event_type, status, processed_at) VALUES (?, ?, ?, ?, NOW())',
        [orderId, paymentIntent.id, event.type, 'success']
      );
      
      res.json({ 
        received: true, 
        message: 'Order payment processed successfully',
        orderId: orderId,
        paymentIntentId: paymentIntent.id,
        status: 'processed'
      });
      
    } catch (dbError) {
      console.error(`Failed to process webhook for order ${orderId}:`, dbError);
      
      // 記錄失敗的 Webhook 處理
      try {
        await pool.query(
          'INSERT INTO webhook_logs (order_id, stripe_payment_intent_id, event_type, status, error_message, processed_at) VALUES (?, ?, ?, ?, ?, NOW())',
          [orderId, paymentIntent.id, event.type, 'failed', dbError.message]
        );
      } catch (logError) {
        console.error('Failed to log webhook error:', logError);
      }
      
      // 回傳 200 狀態，避免 Stripe 重試
      return res.status(200).json({ 
        error: 'Failed to process webhook',
        orderId: orderId,
        details: dbError.message
      });
    }
  } else {
    console.log(`Unhandled webhook event type: ${event.type}`);
    res.json({ received: true, message: 'Event type not handled' });
  }
});

// ===== Orders（改用 SendGrid 寄信）=====
app.post('/api/orders', authenticate, async (req, res) => {
  try {
    const { buyer, items, total, payment } = req.body;
    if (!buyer?.email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(buyer.email))
      return res.status(400).json({ error: '買家 Email 無效' });
    if (!buyer?.name || !buyer?.phone || !buyer?.address)
      return res.status(400).json({ error: '收件資訊不完整' });
    if (!Array.isArray(items) || items.length === 0)
      return res.status(400).json({ error: '購物車為空' });

    // 驗證商品價格和庫存
    const itemIds = items.map(item => item.id);
    const [products] = await pool.query(
      'SELECT id, name, price, stock FROM products WHERE id IN (?)',
      [itemIds]
    );
    
    if (products.length !== items.length) {
      return res.status(400).json({ error: '部分商品不存在' });
    }
    
    // 重新計算總金額並驗證庫存
    let calculatedTotal = 0;
    for (const item of items) {
      const product = products.find(p => p.id === item.id);
      if (item.qty > product.stock) {
        return res.status(400).json({ error: `商品 ${product.name} 庫存不足` });
      }
      calculatedTotal += product.price * item.qty;
    }
    
    // 驗證金額
    if (Math.abs(calculatedTotal - total) > 0.01) {
      return res.status(400).json({ 
        error: '訂單金額驗證失敗',
        calculated: calculatedTotal,
        provided: total
      });
    }

    const orderId = 'ORD-' + Date.now().toString().slice(-8);

    // 暂时注释掉邮件发送，只创建订单
    try {
      await sgMail.send({
        to: buyer.email,
        from: { email: (process.env.FROM_EMAIL || '').trim(), name: process.env.FROM_NAME || 'Reactorder' },
        subject: `您的訂單已成立：${orderId}`,
        html: orderHtml({ buyer, items, total, orderId }),
      });
      console.log('邮件发送成功');
    } catch (emailError) {
      console.log('邮件发送失败，但订单创建成功:', emailError.message);
      // 邮件失败不影响订单创建
    }

    res.status(201).json({ id: orderId });
  } catch (err) {
    // SendGrid 失敗時通常會有 response.body.errors
    console.error('send order email failed:', err?.response?.body || err);
    res.status(500).json({ error: '建立訂單或寄信失敗' });
  }
});

// ===== （可選）測試寄信路由 =====
app.post('/api/dev/send-test', async (req, res) => {
  try {
    await sgMail.send({
      to: (req.body.to || '').trim(),
      from: { email: (process.env.FROM_EMAIL || '').trim(), name: process.env.FROM_NAME || 'Reactorder' },
      subject: 'Test Mail',
      text: 'Hello from SendGrid',
    });
    res.json({ ok: true });
  } catch (err) {
    console.error('test mail failed:', err?.response?.body || err);
    res.status(500).json({ error: 'test mail failed', detail: err?.message });
  }
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`後端伺服器已啟動： http://localhost:${port}`);
});
