// API 统一导出
export * from './types';
export * from './config';
export * from './client';
export * from './auth';
export * from './websocket';

// API服务
export { authApi } from './services/auth';
export { userApi } from './services/user';
export { marketApi } from './services/market';
export { tradeApi } from './services/trade';
export { healthApi } from './services/health';
export { walletApi } from './services/wallet';
export { leaderboardApi } from './services/leaderboard';
export { notificationApi } from './services/notification';

// 默认导出所有API服务
export const api = {
  auth: () => import('./services/auth').then((m) => m.authApi),
  user: () => import('./services/user').then((m) => m.userApi),
  market: () => import('./services/market').then((m) => m.marketApi),
  trade: () => import('./services/trade').then((m) => m.tradeApi),
  health: () => import('./services/health').then((m) => m.healthApi),
  wallet: () => import('./services/wallet').then((m) => m.walletApi),
  leaderboard: () => import('./services/leaderboard').then((m) => m.leaderboardApi),
  notification: () => import('./services/notification').then((m) => m.notificationApi),
};

