// API 客户端封装
import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_CONFIG } from './config';
import { AuthManager } from './auth';
import type { ApiResponse, ErrorCode } from './types';

// 创建 axios 实例
const createAxiosInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // 请求拦截器
  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      // 添加认证token
      const token = AuthManager.getAccessToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // 开发环境打印请求
      if (process.env.NODE_ENV === 'development') {
        console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`, {
          params: config.params,
          data: config.data,
        });
      }

      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // 响应拦截器
  instance.interceptors.response.use(
    (response) => {
      const res = response.data as ApiResponse;

      // 开发环境打印响应
      if (process.env.NODE_ENV === 'development') {
        console.log(`[API Response] ${response.config.url}`, res);
      }

      // 检查业务错误码
      if (res.code !== 0) {
        const error = new ApiError(res.code, res.msg, res);
        return Promise.reject(error);
      }

      return response;
    },
    async (error: AxiosError<ApiResponse>) => {
      // 处理HTTP错误
      if (error.response) {
        const res = error.response.data;
        const status = error.response.status;

        // 401 未授权 - 尝试刷新token
        if (status === 401 && error.config && !error.config.url?.includes('/auth/refresh')) {
          const refreshToken = AuthManager.getRefreshToken();
          if (refreshToken) {
            try {
              // 尝试刷新token
              const refreshResponse = await axios.post<ApiResponse<{ access_token: string; refresh_token?: string }>>(
                `${API_CONFIG.BASE_URL}/auth/refresh`,
                { refresh_token: refreshToken }
              );

              if (refreshResponse.data.code === 0 && refreshResponse.data.data) {
                const refreshData = refreshResponse.data.data;
                AuthManager.setTokens(refreshData.access_token, refreshData.refresh_token || refreshToken);

                // 重试原请求
                if (error.config.headers) {
                  error.config.headers.Authorization = `Bearer ${refreshData.access_token}`;
                }
                return instance.request(error.config);
              }
            } catch (refreshError) {
              // 刷新失败，清除认证信息
              AuthManager.logout();
              // 可以在这里触发登录页面跳转
              if (typeof window !== 'undefined') {
                window.location.href = '/login';
              }
            }
          } else {
            AuthManager.logout();
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
          }
        }

        // 构造业务错误
        const apiError = new ApiError(
          res?.code || status,
          res?.msg || error.message || '请求失败',
          res
        );
        return Promise.reject(apiError);
      }

      // 网络错误或其他错误
      const apiError = new ApiError(
        ErrorCode.SERVER_ERROR,
        error.message || '网络错误，请检查网络连接',
        null
      );
      return Promise.reject(apiError);
    }
  );

  return instance;
};

// API错误类
export class ApiError extends Error {
  code: ErrorCode | number;
  data?: any;

  constructor(code: ErrorCode | number, message: string, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.data = data;
  }

  // 是否为认证错误
  isAuthError(): boolean {
    return this.code === ErrorCode.UNAUTHORIZED || this.code === ErrorCode.FORBIDDEN;
  }

  // 是否为参数错误
  isParamError(): boolean {
    return this.code === ErrorCode.PARAM_ERROR;
  }

  // 是否为服务器错误
  isServerError(): boolean {
    return this.code === ErrorCode.SERVER_ERROR;
  }
}

// 导出axios实例
export const apiClient = createAxiosInstance();

// 请求辅助函数
export const request = {
  get: <T = any>(url: string, params?: any): Promise<T> => {
    return apiClient.get<ApiResponse<T>>(url, { params }).then((res) => res.data.data as T);
  },

  post: <T = any>(url: string, data?: any): Promise<T> => {
    return apiClient.post<ApiResponse<T>>(url, data).then((res) => res.data.data as T);
  },

  put: <T = any>(url: string, data?: any): Promise<T> => {
    return apiClient.put<ApiResponse<T>>(url, data).then((res) => res.data.data as T);
  },

  delete: <T = any>(url: string, params?: any): Promise<T> => {
    return apiClient.delete<ApiResponse<T>>(url, { params }).then((res) => res.data.data as T);
  },
};

