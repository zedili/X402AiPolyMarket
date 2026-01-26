'use client';

import { useState, useEffect } from 'react';
import { useApi } from '@/hooks/useApi';
import { notificationApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, AlertCircle } from 'lucide-react';

export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [type, setType] = useState<number | undefined>();
  const [isRead, setIsRead] = useState<boolean | undefined>();

  const { data, loading, error, execute } = useApi(notificationApi.getNotificationList);

  useEffect(() => {
    execute({ page, page_size: pageSize, type, is_read: isRead });
  }, [execute, page, pageSize, type, isRead]);

  return (
    <div className="container py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">通知</h1>
        <p className="text-muted-foreground mt-2">
          {data && (
            <span className="text-primary font-medium">
              {data.unread_count} 条未读
            </span>
          )}
        </p>
      </div>

      {/* 筛选 */}
      <div className="flex gap-2">
        <Select
          value={type?.toString() || 'all'}
          onValueChange={(v) => setType(v === 'all' ? undefined : parseInt(v))}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="类型" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部类型</SelectItem>
            <SelectItem value="0">系统</SelectItem>
            <SelectItem value="1">交易</SelectItem>
            <SelectItem value="2">结算</SelectItem>
            <SelectItem value="3">个人</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={isRead === undefined ? 'all' : String(isRead)}
          onValueChange={(v) => setIsRead(v === 'all' ? undefined : v === 'true')}
        >
          <SelectTrigger className="w-32">
            <SelectValue placeholder="状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部</SelectItem>
            <SelectItem value="false">未读</SelectItem>
            <SelectItem value="true">已读</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 通知列表 */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">加载失败</CardTitle>
            <CardDescription>{error.message}</CardDescription>
          </CardHeader>
        </Card>
      ) : data ? (
        <>
          <div className="space-y-2">
            {data.notifications.map((notification) => (
              <NotificationCard key={notification.id} notification={notification} />
            ))}
          </div>

          {/* 分页 */}
          {data.total > pageSize && (
            <div className="flex justify-center gap-2">
              <Button variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)}>
                上一页
              </Button>
              <span className="flex items-center px-4 text-sm text-muted-foreground">
                第 {page} 页，共 {Math.ceil(data.total / pageSize)} 页
              </span>
              <Button
                variant="outline"
                disabled={page >= Math.ceil(data.total / pageSize)}
                onClick={() => setPage(page + 1)}
              >
                下一页
              </Button>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}

function NotificationCard({
  notification,
}: {
  notification: {
    id: number;
    type: number;
    type_name: string;
    title: string;
    content: string;
    related_type?: string;
    related_id?: number;
    is_read: boolean;
    created_at: string;
  };
}) {
  return (
    <Card className={notification.is_read ? 'opacity-60' : 'border-primary/20'}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <Bell className={`h-4 w-4 ${notification.is_read ? 'text-muted-foreground' : 'text-primary'}`} />
              {notification.title}
            </CardTitle>
            <CardDescription className="mt-2">
              <Badge variant="outline">{notification.type_name}</Badge>
              {!notification.is_read && (
                <Badge variant="default" className="ml-2">未读</Badge>
              )}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">{notification.content}</p>
        <div className="text-xs text-muted-foreground mt-4">
          {new Date(notification.created_at).toLocaleString()}
        </div>
      </CardContent>
    </Card>
  );
}

