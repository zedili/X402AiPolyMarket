// API 配置
export const API_CONFIG = {
  // 基础URL - 根据环境变量配置
  // 默认使用相对路径，通过 Next.js 代理转发到后端，避免浏览器直接跨域
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || '/api/v1',
  
  // 请求超时时间（毫秒）
  TIMEOUT: 30000,
  
  // Token存储键名
  TOKEN_KEY: 'polymarket_access_token',
  REFRESH_TOKEN_KEY: 'polymarket_refresh_token',
  USER_KEY: 'polymarket_user',
} as const;

// 环境检查
export const isDevelopment = process.env.NODE_ENV === 'development';
export const isProduction = process.env.NODE_ENV === 'production';


