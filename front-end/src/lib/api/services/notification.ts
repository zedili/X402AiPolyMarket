// 通知相关API
import { request } from '../client';
import type {
  NotificationListRequest,
  NotificationListResponse,
} from '../types';

export const notificationApi = {
  // 获取通知列表
  getNotificationList: (params?: NotificationListRequest): Promise<NotificationListResponse> => {
    return request.get<NotificationListResponse>('/notification/list', params);
  },
};


