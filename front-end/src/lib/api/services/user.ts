// 用户相关API
import { request } from '../client';
import type {
  UserProfileResponse,
  UpdateProfileRequest,
  PublicUserResponse,
} from '../types';

export const userApi = {
  // 获取用户资料
  getProfile: (): Promise<UserProfileResponse> => {
    return request.get<UserProfileResponse>('/user/profile');
  },

  // 更新用户资料
  updateProfile: (data: UpdateProfileRequest): Promise<UserProfileResponse> => {
    return request.put<UserProfileResponse>('/user/profile', data);
  },

  // 获取公开用户信息
  getPublicUser: (address: string): Promise<PublicUserResponse> => {
    return request.get<PublicUserResponse>(`/user/${address}`);
  },
};

