'use client';

import { useAuth } from '@/hooks/useAuth';
import { useApi } from '@/hooks/useApi';
import { userApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, User, Mail, FileText, Save } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export default function ProfilePage() {
  const { isAuthenticated } = useAuth();
  const { data: profile, loading, error, execute } = useApi(userApi.getProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    bio: '',
    avatar_url: '',
  });

  const handleEdit = () => {
    if (profile) {
      setFormData({
        username: profile.username || '',
        email: profile.email || '',
        bio: profile.bio || '',
        avatar_url: profile.avatar_url || '',
      });
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    try {
      await userApi.updateProfile(formData);
      toast.success('资料更新成功');
      setIsEditing(false);
      execute();
    } catch (err: any) {
      toast.error('更新失败', {
        description: err.message,
      });
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    if (profile) {
      setFormData({
        username: profile.username || '',
        email: profile.email || '',
        bio: profile.bio || '',
        avatar_url: profile.avatar_url || '',
      });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container py-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>请先登录查看个人资料</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container py-8 space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="container py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error?.message || '加载失败'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">个人资料</h1>
        <p className="text-muted-foreground mt-2">管理您的个人信息</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>基本信息</CardTitle>
              <CardDescription>您的账户信息</CardDescription>
            </div>
            {!isEditing && (
              <Button onClick={handleEdit} variant="outline">
                编辑
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {isEditing ? (
            <>
              <div className="space-y-2">
                <Label>用户名</Label>
                <Input
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="输入用户名"
                />
              </div>
              <div className="space-y-2">
                <Label>邮箱</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="输入邮箱"
                />
              </div>
              <div className="space-y-2">
                <Label>头像URL</Label>
                <Input
                  value={formData.avatar_url}
                  onChange={(e) => setFormData({ ...formData, avatar_url: e.target.value })}
                  placeholder="输入头像URL"
                />
              </div>
              <div className="space-y-2">
                <Label>简介</Label>
                <Input
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="输入个人简介"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSave}>
                  <Save className="mr-2 h-4 w-4" />
                  保存
                </Button>
                <Button variant="outline" onClick={handleCancel}>
                  取消
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <User className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">用户名</div>
                    <div className="font-medium">{profile.username || '未设置'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">邮箱</div>
                    <div className="font-medium">{profile.email || '未设置'}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="text-sm text-muted-foreground">简介</div>
                    <div className="font-medium">{profile.bio || '未设置'}</div>
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">钱包地址</div>
                  <div className="font-mono text-sm">{profile.wallet_address}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground mb-1">注册时间</div>
                  <div className="text-sm">
                    {new Date(profile.created_at).toLocaleString()}
                  </div>
                </div>
              </div>

              {profile.stats && (
                <div className="pt-4 border-t space-y-2">
                  <h3 className="font-semibold">统计信息</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">总交易数</div>
                      <div className="font-bold">{profile.stats.total_trades}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">总成交量</div>
                      <div className="font-bold">${profile.stats.total_volume.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">总收益</div>
                      <div className="font-bold">${profile.stats.total_profit.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">胜率</div>
                      <div className="font-bold">{profile.stats.win_rate.toFixed(1)}%</div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

