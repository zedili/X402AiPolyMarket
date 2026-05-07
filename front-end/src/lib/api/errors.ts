// src/lib/api/errors.ts
import { ErrorCode } from './types';

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