// 认证相关Hook
'use client';

import { useState, useEffect, useCallback } from 'react';
import { authApi, AuthManager } from '@/lib/api';
import type { UserInfo, LoginRequest } from '@/lib/api/types';

interface UseAuthReturn {
  user: UserInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 初始化时加载用户信息
  useEffect(() => {
    const loadUser = () => {
      const savedUser = AuthManager.getUser();
      setUser(savedUser);
      setIsLoading(false);
    };

    loadUser();
  }, []);

  // 登录
  const login = useCallback(async (data: LoginRequest) => {
    setIsLoading(true);
    try {
      const response = await authApi.login(data);
      setUser(response.user);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 登出
  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authApi.logout();
    } catch (error) {
      // 即使API调用失败也清除本地数据
      console.error('Logout error:', error);
    } finally {
      AuthManager.logout();
      setUser(null);
      setIsLoading(false);
    }
  }, []);

  // 刷新用户信息
  const refreshUser = useCallback(async () => {
    try {
      const { userApi } = await import('@/lib/api/services/user');
      const profile = await userApi.getProfile();
      setUser(profile);
      AuthManager.setUser(profile);
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  }, []);

  return {
    user,
    isAuthenticated: !!user && AuthManager.isAuthenticated(),
    isLoading,
    login,
    logout,
    refreshUser,
  };
}


