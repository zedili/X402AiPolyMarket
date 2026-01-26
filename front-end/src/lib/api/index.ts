// API 统一导出
export * from './types';
export * from './config';
export * from './client';
export * from './auth';

// API服务
export { authApi } from './services/auth';
export { userApi } from './services/user';
export { marketApi } from './services/market';
export { tradeApi } from './services/trade';
export { healthApi } from './services/health';

// 默认导出所有API服务
export const api = {
  auth: () => import('./services/auth').then((m) => m.authApi),
  user: () => import('./services/user').then((m) => m.userApi),
  market: () => import('./services/market').then((m) => m.marketApi),
  trade: () => import('./services/trade').then((m) => m.tradeApi),
  health: () => import('./services/health').then((m) => m.healthApi),
};

