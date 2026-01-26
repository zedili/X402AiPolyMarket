// API 配置
export const API_CONFIG = {
  // 基础URL - 根据环境变量配置
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8888/api/v1',
  
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

