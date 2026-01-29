'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useApi } from '@/hooks/useApi';
import { marketApi } from '@/lib/api';
import type { CreateMarketRequest } from '@/lib/api/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function CreateMarketPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  const [question, setQuestion] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<string>('CRYPTO');
  const [endTime, setEndTime] = useState('');
  const [initialLiquidity, setInitialLiquidity] = useState('');
  const [tags, setTags] = useState('');

  const { loading, error, execute } = useApi(marketApi.createMarket, {
    onSuccess: (res) => {
      toast.success('市场创建成功！', {
        description: `市场ID: ${res.market_id}`,
      });
      // 创建成功后统一跳转到首页市场列表
      router.push('/#markets');
    },
    onError: (err) => {
      toast.error('创建市场失败', {
        description: err.message,
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.error('请先登录');
      return;
    }

    if (!question || !category || !endTime) {
      toast.error('请填写必填项');
      return;
    }

    const payload: CreateMarketRequest = {
      question,
      category,
      end_time: new Date(endTime).toISOString(),
    };

    if (description) {
      payload.description = description;
    }
    if (initialLiquidity) {
      payload.initial_liquidity = parseFloat(initialLiquidity);
    }
    if (tags) {
      payload.tags = tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
    }

    try {
      await execute(payload);
    } catch {
      // 错误在 onError 中处理
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container py-10">
        <Card>
          <CardHeader>
            <CardTitle>创建市场</CardTitle>
            <CardDescription>请先连接钱包并登录后再创建市场。</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>未登录用户无法创建市场。</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle>创建新市场</CardTitle>
          <CardDescription>填写市场信息，提交后将进入审核流程。</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="question">市场问题 *</Label>
              <Input
                id="question"
                placeholder="例如：比特币在 2026 年底前是否会突破 80,000 美元？"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">详细描述</Label>
              <Textarea
                id="description"
                placeholder="补充市场背景、数据来源、结算标准等信息"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>分类 *</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择分类" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CRYPTO">加密货币</SelectItem>
                    <SelectItem value="TECH">科技</SelectItem>
                    <SelectItem value="STOCKS">股票</SelectItem>
                    <SelectItem value="POLITICS">政治</SelectItem>
                    <SelectItem value="SPORTS">体育</SelectItem>
                    <SelectItem value="SCIENCE">科学</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_time">结束时间 *</Label>
                <Input
                  id="end_time"
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="initial_liquidity">初始流动性（可选）</Label>
                <Input
                  id="initial_liquidity"
                  type="number"
                  step="0.01"
                  placeholder="例如：1000"
                  value={initialLiquidity}
                  onChange={(e) => setInitialLiquidity(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">标签（逗号分隔，可选）</Label>
                <Input
                  id="tags"
                  placeholder="例如：BTC,宏观经济"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error.message}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '提交中...' : '创建市场'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}


