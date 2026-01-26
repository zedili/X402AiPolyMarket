'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useApi } from '@/hooks/useApi';
import { tradeApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { toast } from 'sonner';

interface CreateOrderFormProps {
  marketId: number;
}

export function CreateOrderForm({ marketId }: CreateOrderFormProps) {
  const { isAuthenticated } = useAuth();
  const [orderType, setOrderType] = useState<'0' | '1'>('0'); // 0-买入 1-卖出
  const [position, setPosition] = useState<'0' | '1'>('1'); // 0-NO 1-YES
  const [amount, setAmount] = useState('');
  const [price, setPrice] = useState('');
  const [slippage, setSlippage] = useState('1');

  const { loading, error, execute } = useApi(tradeApi.createOrder, {
    onSuccess: (order) => {
      toast.success('订单创建成功！', {
        description: `订单ID: ${order.order_id}`,
      });
      // 重置表单
      setAmount('');
      setPrice('');
    },
    onError: (err) => {
      toast.error('创建订单失败', {
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

    if (!amount || !price) {
      toast.error('请填写完整信息');
      return;
    }

    try {
      await execute({
        market_id: marketId,
        order_type: parseInt(orderType),
        position: parseInt(position),
        amount: parseFloat(amount),
        price: parseFloat(price),
        slippage: parseFloat(slippage) || 1,
      });
    } catch (err) {
      // 错误已在onError中处理
    }
  };

  if (!isAuthenticated) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>请先连接钱包登录后再进行交易</AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>创建订单</CardTitle>
        <CardDescription>买入或卖出市场份额</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 订单类型 */}
          <div className="space-y-2">
            <Label>订单类型</Label>
            <Select value={orderType} onValueChange={(v) => setOrderType(v as '0' | '1')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    买入
                  </div>
                </SelectItem>
                <SelectItem value="1">
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-red-500" />
                    卖出
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 方向 */}
          <div className="space-y-2">
            <Label>方向</Label>
            <Select value={position} onValueChange={(v) => setPosition(v as '0' | '1')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">YES</SelectItem>
                <SelectItem value="0">NO</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 数量 */}
          <div className="space-y-2">
            <Label>数量</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="输入数量"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          {/* 价格 */}
          <div className="space-y-2">
            <Label>价格 (cents)</Label>
            <Input
              type="number"
              step="0.01"
              placeholder="输入价格"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
            />
          </div>

          {/* 滑点 */}
          <div className="space-y-2">
            <Label>滑点容忍度 (%)</Label>
            <Input
              type="number"
              step="0.1"
              placeholder="1"
              value={slippage}
              onChange={(e) => setSlippage(e.target.value)}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? '提交中...' : '创建订单'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

