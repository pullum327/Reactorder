# Stripe 支付功能设置指南

## 1. 安装依赖

```bash
npm install @stripe/stripe-js @stripe/react-stripe-js
```

## 2. 获取 Stripe API Keys

1. 访问 [Stripe Dashboard](https://dashboard.stripe.com/)
2. 注册或登录账户
3. 在开发者 > API Keys 页面获取：
   - Publishable Key (pk_test_...)
   - Secret Key (sk_test_...)

## 3. 配置前端

编辑 `src/stripe.js` 文件，替换你的 Publishable Key：

```javascript
const stripePromise = loadStripe('pk_test_your_actual_publishable_key_here');
```

## 4. 配置后端

编辑 `server-example.js` 文件，替换你的 Secret Key：

```javascript
const stripe = require('stripe')('sk_test_your_actual_secret_key_here');
```

## 5. 安装后端依赖

```bash
npm install express stripe cors
```

## 6. 启动后端服务器

```bash
node server-example.js
```

## 7. 测试支付

1. 启动前端开发服务器：`npm run dev`
2. 添加商品到购物车
3. 填写收件信息
4. 点击"继续付款"
5. 选择"信用卡付款"
6. 使用测试卡号：4242 4242 4242 4242

## 测试卡号

- **成功支付**: 4242 4242 4242 4242
- **需要验证**: 4000 0025 0000 3155
- **支付失败**: 4000 0000 0000 0002

## 安全注意事项

- 永远不要在前端代码中暴露 Secret Key
- 在生产环境中使用 HTTPS
- 实现适当的身份验证和授权
- 验证支付金额和订单信息
- 处理支付失败的情况

## 功能特性

- ✅ 信用卡支付 (Stripe)
- ✅ 货到付款
- ✅ 银行转账
- ✅ 支付状态管理
- ✅ 错误处理
- ✅ 响应式设计

## 故障排除

### 常见问题

1. **"Stripe is not defined"**
   - 检查是否正确导入了 Stripe 组件
   - 确保 Elements 组件包裹了 StripePayment

2. **支付失败**
   - 检查 API Keys 是否正确
   - 确认后端服务器正在运行
   - 查看浏览器控制台错误信息

3. **样式问题**
   - 确保 CSS 文件正确导入
   - 检查是否有样式冲突

### 调试模式

在开发环境中，可以在浏览器控制台查看详细的 Stripe 日志。
