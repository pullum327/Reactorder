const express = require('express');
const stripe = require('stripe')('sk_test_51RwkXvRoYATOuKSkAvj');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

// 创建支付意图
app.post('/api/create-payment-intent', async (req, res) => {
  try {
    const { amount, currency = 'twd' } = req.body;

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.json({
      client_secret: paymentIntent.client_secret,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

// 处理订单创建
app.post('/api/orders', async (req, res) => {
  try {
    const { buyer, items, total, payment } = req.body;
    
    // 这里应该保存订单到数据库
    // 包括支付信息
    const order = {
      id: Date.now().toString(),
      buyer,
      items,
      total,
      payment,
      status: 'pending',
      createdAt: new Date(),
    };

    res.json(order);
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
