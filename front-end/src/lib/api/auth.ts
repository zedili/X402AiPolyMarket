// 认证管理模块
import { API_CONFIG } from './config';
import type { UserInfo, LoginResponse } from './types';

/**
 * Token管理
 */
export class AuthManager {
  // 获取访问令牌
  static getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(API_CONFIG.TOKEN_KEY);
  }

  // 获取刷新令牌
  static getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(API_CONFIG.REFRESH_TOKEN_KEY);
  }

  // 设置令牌
  static setTokens(accessToken: string, refreshToken: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(API_CONFIG.TOKEN_KEY, accessToken);
    localStorage.setItem(API_CONFIG.REFRESH_TOKEN_KEY, refreshToken);
  }

  // 清除令牌
  static clearTokens(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(API_CONFIG.TOKEN_KEY);
    localStorage.removeItem(API_CONFIG.REFRESH_TOKEN_KEY);
    localStorage.removeItem(API_CONFIG.USER_KEY);
  }

  // 检查是否已登录
  static isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  // 保存用户信息
  static setUser(user: UserInfo): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(API_CONFIG.USER_KEY, JSON.stringify(user));
  }

  // 获取用户信息
  static getUser(): UserInfo | null {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem(API_CONFIG.USER_KEY);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr) as UserInfo;
    } catch {
      return null;
    }
  }

  // 清除用户信息
  static clearUser(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(API_CONFIG.USER_KEY);
  }

  // 登录后保存信息
  static saveLoginData(data: LoginResponse): void {
    this.setTokens(data.access_token, data.refresh_token);
    this.setUser(data.user);
  }

  // 登出
  static logout(): void {
    this.clearTokens();
    this.clearUser();
  }
}

