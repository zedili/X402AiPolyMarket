/**
 * 扩展API使用示例
 * 展示新接入模块的使用方法
 */

'use client';

import { useState, useEffect } from 'react';
import { useApi } from '@/hooks/useApi';
import { useMarketPrice } from '@/hooks/useWebSocket';
import { aiApi, walletApi, leaderboardApi, notificationApi } from '@/lib/api';
import type { PaymentAIServiceRequest } from '@/lib/api/types';

// ==================== 示例1: AI预测 ====================

export function AIPredictionExample({ marketId }: { marketId: number }) {
  const { data, loading, error, execute } = useApi(() => aiApi.getPrediction(marketId));

  useEffect(() => {
    execute();
  }, [execute, marketId]);

  if (loading) return <div>加载AI预测中...</div>;
  if (error) return <div>错误: {error.message}</div>;
  if (!data) return null;

  return (
    <div>
      <h3>AI预测</h3>
      <p>预测值: {data.prediction_value}%</p>
      <p>置信度: {data.confidence}%</p>
      <p>建议: {data.suggests}</p>
      <p>历史准确率: {data.historical_accuracy}%</p>
      <div>
        <h4>关键因素:</h4>
        <ul>
          {data.analysis.key_factors.map((factor, index) => (
            <li key={index}>{factor}</li>
          ))}
        </ul>
      </div>
      <div>
        <h4>风险因素:</h4>
        <ul>
          {data.analysis.risk_factors.map((factor, index) => (
            <li key={index}>{factor}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ==================== 示例2: AI准确率统计 ====================

export function AIAccuracyExample() {
  const { data, loading, error, execute } = useApi(aiApi.getAccuracy);

  useEffect(() => {
    execute();
  }, [execute]);

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error.message}</div>;
  if (!data) return null;

  return (
    <div>
      <h3>AI准确率统计</h3>
      <p>总体准确率: {data.overall_accuracy}%</p>
      <p>总预测数: {data.total_predictions}</p>
      <p>正确预测数: {data.correct_predictions}</p>
      <div>
        <h4>按分类:</h4>
        {data.by_category.map((item) => (
          <div key={item.category}>
            {item.category}: {item.accuracy}% ({item.total}个)
          </div>
        ))}
      </div>
    </div>
  );
}

// ==================== 示例3: 钱包余额 ====================

export function WalletBalanceExample() {
  const { data, loading, error, execute } = useApi(walletApi.getBalance);

  useEffect(() => {
    execute();
  }, [execute]);

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error.message}</div>;
  if (!data) return null;

  return (
    <div>
      <h3>钱包余额</h3>
      <p>USDC余额: {data.usdc_balance}</p>
      <p>代币余额: {data.token_balance}</p>
      <p>冻结余额: {data.frozen_balance}</p>
      <p>可用余额: {data.available_balance}</p>
      <p>总价值(USD): {data.total_value_usd}</p>
    </div>
  );
}

// ==================== 示例4: 交易流水 ====================

export function WalletTransactionsExample() {
  const { data, loading, error, execute } = useApi(walletApi.getTransactions);
  const [filters, setFilters] = useState({
    page: 1,
    page_size: 20,
    tx_type: undefined as number | undefined,
  });

  useEffect(() => {
    execute(filters);
  }, [execute, filters]);

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error.message}</div>;
  if (!data) return null;

  return (
    <div>
      <h3>交易流水 (共 {data.total} 条)</h3>
      <div>
        <label>
          类型筛选:
          <select
            value={filters.tx_type || ''}
            onChange={(e) =>
              setFilters({ ...filters, tx_type: e.target.value ? Number(e.target.value) : undefined })
            }
          >
            <option value="">全部</option>
            <option value="0">充值</option>
            <option value="1">提现</option>
            <option value="2">交易</option>
            <option value="3">奖励</option>
            <option value="4">手续费</option>
          </select>
        </label>
      </div>
      {data.transactions.map((tx) => (
        <div key={tx.id}>
          <p>
            {tx.tx_type_name} | 金额: {tx.amount} {tx.currency} | 余额: {tx.balance_after}
          </p>
          <p>备注: {tx.remark || '无'}</p>
          <p>时间: {tx.created_at}</p>
        </div>
      ))}
    </div>
  );
}

// ==================== 示例5: 支付AI服务费 ====================

export function PayAIServiceExample({ marketId }: { marketId: number }) {
  const { loading, error, execute } = useApi(walletApi.payAIService, {
    onSuccess: (data) => {
      alert(`支付成功！支付ID: ${data.payment_id}`);
    },
  });

  const handlePay = async () => {
    try {
      await execute({
        service_type: 'advanced_analysis',
        market_id: marketId,
        use_token: true,
        max_token_amount: 100,
      } as PaymentAIServiceRequest);
    } catch (err) {
      console.error('支付失败:', err);
    }
  };

  return (
    <div>
      <button onClick={handlePay} disabled={loading}>
        {loading ? '支付中...' : '支付AI服务费'}
      </button>
      {error && <div style={{ color: 'red' }}>{error.message}</div>}
    </div>
  );
}

// ==================== 示例6: 排行榜 ====================

export function LeaderboardExample() {
  const { data, loading, error, execute } = useApi(leaderboardApi.getProfitLeaderboard);
  const [period, setPeriod] = useState<string>('all');

  useEffect(() => {
    execute({ period, limit: 100 });
  }, [execute, period]);

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error.message}</div>;
  if (!data) return null;

  return (
    <div>
      <h3>收益排行榜</h3>
      <div>
        <label>
          时间段:
          <select value={period} onChange={(e) => setPeriod(e.target.value)}>
            <option value="all">全部</option>
            <option value="month">本月</option>
            <option value="week">本周</option>
          </select>
        </label>
      </div>
      <div>
        {data.leaderboard.map((item) => (
          <div key={item.address}>
            <span>#{item.rank}</span>
            <span>{item.username || item.address}</span>
            <span>收益: {item.total_profit}</span>
            <span>胜率: {item.win_rate}%</span>
            {item.badge && <span>{item.badge}</span>}
          </div>
        ))}
      </div>
      {data.my_rank && (
        <div>
          <p>我的排名: #{data.my_rank.rank}</p>
          <p>我的收益: {data.my_rank.total_profit}</p>
        </div>
      )}
    </div>
  );
}

// ==================== 示例7: 平台统计 ====================

export function PlatformStatsExample() {
  const { data, loading, error, execute } = useApi(leaderboardApi.getPlatformStats);

  useEffect(() => {
    execute();
  }, [execute]);

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error.message}</div>;
  if (!data) return null;

  return (
    <div>
      <h3>平台统计</h3>
      <p>总成交量: {data.total_volume}</p>
      <p>总市场数: {data.total_markets}</p>
      <p>活跃市场数: {data.active_markets}</p>
      <p>总用户数: {data.total_users}</p>
      <p>24小时活跃用户: {data.active_users_24h}</p>
      <p>总交易数: {data.total_trades}</p>
      <p>AI准确率: {data.ai_accuracy}%</p>
      <p>总流动性: {data.total_liquidity}</p>
    </div>
  );
}

// ==================== 示例8: 通知列表 ====================

export function NotificationListExample() {
  const { data, loading, error, execute } = useApi(notificationApi.getNotificationList);
  const [filters, setFilters] = useState({
    page: 1,
    page_size: 20,
    type: undefined as number | undefined,
    is_read: undefined as boolean | undefined,
  });

  useEffect(() => {
    execute(filters);
  }, [execute, filters]);

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error.message}</div>;
  if (!data) return null;

  return (
    <div>
      <h3>通知列表</h3>
      <p>未读数量: {data.unread_count}</p>
      <div>
        <label>
          类型筛选:
          <select
            value={filters.type || ''}
            onChange={(e) =>
              setFilters({ ...filters, type: e.target.value ? Number(e.target.value) : undefined })
            }
          >
            <option value="">全部</option>
            <option value="0">系统</option>
            <option value="1">交易</option>
            <option value="2">结算</option>
            <option value="3">个人</option>
          </select>
        </label>
        <label>
          已读状态:
          <select
            value={filters.is_read === undefined ? '' : String(filters.is_read)}
            onChange={(e) =>
              setFilters({
                ...filters,
                is_read: e.target.value === '' ? undefined : e.target.value === 'true',
              })
            }
          >
            <option value="">全部</option>
            <option value="false">未读</option>
            <option value="true">已读</option>
          </select>
        </label>
      </div>
      {data.notifications.map((notification) => (
        <div key={notification.id} style={{ opacity: notification.is_read ? 0.6 : 1 }}>
          <h4>{notification.title}</h4>
          <p>{notification.content}</p>
          <p>类型: {notification.type_name}</p>
          <p>时间: {notification.created_at}</p>
          {!notification.is_read && <span>未读</span>}
        </div>
      ))}
    </div>
  );
}

// ==================== 示例9: 实时市场价格 ====================

export function RealTimeMarketPriceExample({ marketId }: { marketId: number }) {
  const { priceData, isConnected } = useMarketPrice(marketId);

  if (!isConnected) {
    return <div>连接WebSocket中...</div>;
  }

  if (!priceData) {
    return <div>等待价格数据...</div>;
  }

  return (
    <div>
      <h3>实时价格 (市场 #{marketId})</h3>
      <div>
        <p>YES价格: {priceData.yes_price}%</p>
        <p>NO价格: {priceData.no_price}%</p>
        <p>24小时成交量: {priceData.volume_24h}</p>
        <p>更新时间: {priceData.timestamp}</p>
      </div>
    </div>
  );
}

