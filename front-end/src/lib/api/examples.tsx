/**
 * API使用示例
 * 这些示例展示了如何在实际组件中使用API
 */

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useApi } from '@/hooks/useApi';
import { marketApi, tradeApi, userApi } from '@/lib/api';
import type { MarketListItem, CreateOrderRequest } from '@/lib/api/types';
import { ApiError, ErrorCode } from '@/lib/api';

// ==================== 示例1: 市场列表 ====================

export function MarketListExample() {
  const { data, loading, error, execute } = useApi(marketApi.getMarketList);

  useEffect(() => {
    execute({ page: 1, page_size: 20 });
  }, [execute]);

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error.message}</div>;
  if (!data) return null;

  return (
    <div>
      <h2>市场列表 (共 {data.total} 个)</h2>
      {data.markets.map((market) => (
        <div key={market.id}>
          <h3>{market.question}</h3>
          <p>YES: {market.yes_price}% | NO: {market.no_price}%</p>
          <p>成交量: {market.total_volume}</p>
        </div>
      ))}
    </div>
  );
}

// ==================== 示例2: 市场详情 ====================

export function MarketDetailExample({ marketId }: { marketId: number }) {
  const { data, loading, error } = useApi(() => marketApi.getMarketDetail(marketId));

  useEffect(() => {
    // 组件挂载时自动加载
  }, [marketId]);

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error.message}</div>;
  if (!data) return null;

  return (
    <div>
      <h2>{data.question}</h2>
      <p>{data.description}</p>
      <div>
        <p>YES价格: {data.yes_price}%</p>
        <p>NO价格: {data.no_price}%</p>
        <p>总成交量: {data.total_volume}</p>
        {data.ai_prediction && (
          <p>AI预测: {data.ai_prediction}% (置信度: {data.confidence}%)</p>
        )}
      </div>
    </div>
  );
}

// ==================== 示例3: 创建订单 ====================

export function CreateOrderExample({ marketId }: { marketId: number }) {
  const { isAuthenticated } = useAuth();
  const [amount, setAmount] = useState(100);
  const [price, setPrice] = useState(50);
  const [position, setPosition] = useState<0 | 1>(1);
  const { loading, error, execute } = useApi(tradeApi.createOrder, {
    onSuccess: (order) => {
      alert(`订单创建成功！订单ID: ${order.order_id}`);
    },
    onError: (err) => {
      if (err.code === ErrorCode.INSUFFICIENT_BALANCE) {
        alert('余额不足');
      } else {
        alert(`创建失败: ${err.message}`);
      }
    },
  });

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      alert('请先登录');
      return;
    }

    try {
      await execute({
        market_id: marketId,
        order_type: 0, // 买入
        position,
        amount,
        price,
        slippage: 1,
      } as CreateOrderRequest);
    } catch (err) {
      // 错误已在onError中处理
    }
  };

  return (
    <div>
      <h3>创建订单</h3>
      <div>
        <label>
          方向:
          <select value={position} onChange={(e) => setPosition(Number(e.target.value) as 0 | 1)}>
            <option value={1}>YES</option>
            <option value={0}>NO</option>
          </select>
        </label>
      </div>
      <div>
        <label>
          数量:
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
          />
        </label>
      </div>
      <div>
        <label>
          价格:
          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
          />
        </label>
      </div>
      <button onClick={handleSubmit} disabled={loading}>
        {loading ? '提交中...' : '创建订单'}
      </button>
      {error && <div style={{ color: 'red' }}>{error.message}</div>}
    </div>
  );
}

// ==================== 示例4: 用户资料 ====================

export function UserProfileExample() {
  const { user, isAuthenticated, refreshUser } = useAuth();
  const { data, loading, error, execute } = useApi(userApi.getProfile);

  useEffect(() => {
    if (isAuthenticated) {
      execute();
    }
  }, [isAuthenticated, execute]);

  if (!isAuthenticated) {
    return <div>请先登录</div>;
  }

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error.message}</div>;

  return (
    <div>
      <h2>用户资料</h2>
      <p>钱包地址: {data?.wallet_address}</p>
      <p>用户名: {data?.username || '未设置'}</p>
      <p>邮箱: {data?.email || '未设置'}</p>
      <p>简介: {data?.bio || '未设置'}</p>
      {data?.stats && (
        <div>
          <h3>统计信息</h3>
          <p>总交易数: {data.stats.total_trades}</p>
          <p>总成交量: {data.stats.total_volume}</p>
          <p>总收益: {data.stats.total_profit}</p>
          <p>胜率: {data.stats.win_rate}%</p>
        </div>
      )}
      <button onClick={refreshUser}>刷新</button>
    </div>
  );
}

// ==================== 示例5: 订单列表 ====================

export function OrderListExample() {
  const { data, loading, error, execute } = useApi(tradeApi.getOrderList);
  const [filters, setFilters] = useState({
    page: 1,
    page_size: 20,
    status: undefined as number | undefined,
  });

  useEffect(() => {
    execute(filters);
  }, [execute, filters]);

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error.message}</div>;
  if (!data) return null;

  return (
    <div>
      <h2>我的订单 (共 {data.total} 个)</h2>
      <div>
        <label>
          状态筛选:
          <select
            value={filters.status || ''}
            onChange={(e) =>
              setFilters({ ...filters, status: e.target.value ? Number(e.target.value) : undefined })
            }
          >
            <option value="">全部</option>
            <option value="0">待成交</option>
            <option value="1">部分成交</option>
            <option value="2">完全成交</option>
            <option value="3">已取消</option>
          </select>
        </label>
      </div>
      {data.orders.map((order) => (
        <div key={order.id}>
          <h3>{order.market_question}</h3>
          <p>
            {order.order_type_name} {order.position_name} | 数量: {order.amount} | 价格:{' '}
            {order.price}
          </p>
          <p>状态: {order.status_name}</p>
          <p>已成交: {order.filled_amount}</p>
        </div>
      ))}
    </div>
  );
}

// ==================== 示例6: 错误处理 ====================

export function ErrorHandlingExample() {
  const [error, setError] = useState<ApiError | null>(null);

  const handleApiCall = async () => {
    try {
      await marketApi.getMarketDetail(99999); // 不存在的市场ID
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err);

        // 根据错误码处理
        switch (err.code) {
          case ErrorCode.MARKET_NOT_FOUND:
            console.log('市场不存在');
            break;
          case ErrorCode.UNAUTHORIZED:
            console.log('未授权，需要登录');
            break;
          case ErrorCode.INSUFFICIENT_BALANCE:
            console.log('余额不足');
            break;
          default:
            console.log('其他错误:', err.message);
        }
      }
    }
  };

  return (
    <div>
      <button onClick={handleApiCall}>测试错误处理</button>
      {error && (
        <div>
          <p>错误码: {error.code}</p>
          <p>错误信息: {error.message}</p>
        </div>
      )}
    </div>
  );
}

// ==================== 示例7: 手动调用API ====================

export function ManualApiCallExample() {
  const [markets, setMarkets] = useState<MarketListItem[]>([]);
  const [loading, setLoading] = useState(false);

  const loadMarkets = async () => {
    setLoading(true);
    try {
      const response = await marketApi.getMarketList({
        page: 1,
        page_size: 10,
        is_hot: true,
      });
      setMarkets(response.markets);
    } catch (error) {
      console.error('加载失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={loadMarkets} disabled={loading}>
        {loading ? '加载中...' : '加载热门市场'}
      </button>
      <div>
        {markets.map((market) => (
          <div key={market.id}>{market.question}</div>
        ))}
      </div>
    </div>
  );
}

