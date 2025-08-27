// 配置文件示例
// 复制此文件为 config.js 并填入实际值

module.exports = {
  // Stripe API Keys
  stripe: {
    publishableKey: 'pk_test_your_publishable_key_here',
    secretKey: 'sk_test_your_secret_key_here'
  },
  
  // 服务器配置
  server: {
    port: process.env.PORT || 4000,
    environment: process.env.NODE_ENV || 'development'
  },
  
  // 数据库配置
  database: {
    url: process.env.DATABASE_URL || 'your_database_connection_string'
  },
  
  // JWT 配置
  jwt: {
    secret: process.env.JWT_SECRET || 'your_jwt_secret_here',
    expiresIn: '24h'
  },
  
  // 支付配置
  payment: {
    currency: 'twd',
    supportedMethods: ['credit', 'cod', 'bank']
  }
};
