const fetch = require('node-fetch');

async function testStripeAPI() {
  try {
    console.log('测试 Stripe API 端点...');
    
    const response = await fetch('http://localhost:4000/api/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: 1000, // 10.00 TWD
        currency: 'twd',
      }),
    });

    console.log('响应状态:', response.status);
    console.log('响应头:', response.headers.raw());
    
    const text = await response.text();
    console.log('响应内容:', text);
    
    if (response.ok) {
      const data = JSON.parse(text);
      console.log('解析后的数据:', data);
      console.log('✅ API 测试成功!');
    } else {
      console.log('❌ API 测试失败!');
    }
  } catch (error) {
    console.error('测试出错:', error);
  }
}

testStripeAPI();
