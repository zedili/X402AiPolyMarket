// 认证相关API
import { request } from '../client';
import { AuthManager } from '../auth';
import type {
  NonceRequest,
  NonceResponse,
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
} from '../types';

export const authApi = {
  // 获取nonce
  getNonce: (data: NonceRequest): Promise<NonceResponse> => {
    return request.post<NonceResponse>('/auth/nonce', data);
  },

  // 登录
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response = await request.post<LoginResponse>('/auth/login', data);
    // 登录成功后保存token和用户信息
    AuthManager.saveLoginData(response);
    return response;
  },

  // 刷新token
  refreshToken: async (data: RefreshTokenRequest): Promise<RefreshTokenResponse> => {
    const response = await request.post<RefreshTokenResponse>('/auth/refresh', data);
    // 更新token
    if (response.access_token) {
      const refreshToken = AuthManager.getRefreshToken();
      AuthManager.setTokens(response.access_token, refreshToken || data.refresh_token);
    }
    return response;
  },

  // 登出
  logout: (): Promise<void> => {
    return request.post<void>('/auth/logout').finally(() => {
      // 无论成功失败都清除本地token
      AuthManager.logout();
    });
  },
};


