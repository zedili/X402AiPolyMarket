# 前端API接入方案

## 📋 目录结构

```
src/lib/api/
├── index.ts              # 统一导出
├── config.ts             # API配置
├── client.ts             # Axios客户端封装
├── auth.ts               # 认证管理
├── types.ts              # TypeScript类型定义
└── services/             # API服务模块
    ├── auth.ts           # 认证相关API
    ├── user.ts           # 用户相关API
    ├── market.ts         # 市场相关API
    ├── trade.ts          # 交易相关API
    └── health.ts          # 健康检查API
```

## 🚀 快速开始

### 1. 环境配置

在 `.env.local` 文件中配置API基础URL：

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8888/api/v1
```

### 2. 基础使用

#### 导入API服务

```typescript
import { authApi, marketApi, tradeApi, userApi } from '@/lib/api';
```

#### 调用API

```typescript
// 获取市场列表
const markets = await marketApi.getMarketList({
  page: 1,
  page_size: 20,
  category: 'CRYPTO',
});

// 获取市场详情
const market = await marketApi.getMarketDetail(1);

// 创建订单
const order = await tradeApi.createOrder({
  market_id: 1,
  order_type: 0, // 买入
  position: 1,   // YES
  amount: 100,
  price: 67,
});
```

### 3. 认证流程

#### 钱包登录示例

```typescript
import { authApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

function LoginComponent() {
  const { login, isAuthenticated } = useAuth();

  const handleLogin = async () => {
    try {
      // 1. 获取nonce
      const { nonce } = await authApi.getNonce({
        wallet_address: walletAddress,
      });

      // 2. 使用钱包签名
      const signature = await signMessage(nonce);

      // 3. 登录
      await login({
        wallet_address: walletAddress,
        signature,
        nonce,
      });

      console.log('登录成功');
    } catch (error) {
      console.error('登录失败:', error);
    }
  };

  return (
    <button onClick={handleLogin}>
      {isAuthenticated ? '已登录' : '登录'}
    </button>
  );
}
```

#### 使用认证Hook

```typescript
import { useAuth } from '@/hooks/useAuth';

function ProfileComponent() {
  const { user, isAuthenticated, logout, refreshUser } = useAuth();

  if (!isAuthenticated) {
    return <div>请先登录</div>;
  }

  return (
    <div>
      <p>钱包地址: {user?.wallet_address}</p>
      <p>用户名: {user?.username || '未设置'}</p>
      <button onClick={logout}>登出</button>
      <button onClick={refreshUser}>刷新信息</button>
    </div>
  );
}
```

### 4. 错误处理

```typescript
import { ApiError, ErrorCode } from '@/lib/api';

try {
  const market = await marketApi.getMarketDetail(999);
} catch (error) {
  if (error instanceof ApiError) {
    switch (error.code) {
      case ErrorCode.MARKET_NOT_FOUND:
        console.error('市场不存在');
        break;
      case ErrorCode.UNAUTHORIZED:
        console.error('未授权，请重新登录');
        break;
      default:
        console.error('请求失败:', error.message);
    }
  }
}
```

### 5. 使用useApi Hook

```typescript
import { useApi } from '@/hooks/useApi';
import { marketApi } from '@/lib/api';

function MarketListComponent() {
  const { data, loading, error, execute } = useApi(
    marketApi.getMarketList,
    {
      onSuccess: (data) => {
        console.log('加载成功:', data);
      },
      onError: (error) => {
        console.error('加载失败:', error);
      },
    }
  );

  useEffect(() => {
    execute({ page: 1, page_size: 20 });
  }, [execute]);

  if (loading) return <div>加载中...</div>;
  if (error) return <div>错误: {error.message}</div>;
  if (!data) return null;

  return (
    <div>
      {data.markets.map((market) => (
        <div key={market.id}>{market.question}</div>
      ))}
    </div>
  );
}
```

## 📚 API模块说明

### 认证模块 (authApi)

- `getNonce(wallet_address)` - 获取nonce
- `login(data)` - 登录
- `refreshToken(data)` - 刷新token
- `logout()` - 登出

### 用户模块 (userApi)

- `getProfile()` - 获取用户资料（需要认证）
- `updateProfile(data)` - 更新用户资料（需要认证）
- `getPublicUser(address)` - 获取公开用户信息

### 市场模块 (marketApi)

- `getMarketList(params?)` - 获取市场列表
- `getMarketDetail(id)` - 获取市场详情
- `createMarket(data)` - 创建市场（需要认证）
- `getCategories()` - 获取市场分类
- `getHotMarkets(params?)` - 获取热门市场

### 交易模块 (tradeApi)

- `createOrder(data)` - 创建订单（需要认证）
- `getOrderList(params?)` - 获取订单列表（需要认证）
- `getOrderDetail(id)` - 获取订单详情（需要认证）
- `cancelOrder(id)` - 取消订单（需要认证）
- `getTradeHistory(params?)` - 获取交易历史（需要认证）
- `getPositionList(params?)` - 获取持仓列表（需要认证）
- `getPositionDetail(id)` - 获取持仓详情（需要认证）
- `getTradingStats()` - 获取交易统计（需要认证）

## 🔧 高级用法

### 自定义请求

```typescript
import { request } from '@/lib/api/client';

// 直接使用request函数
const customData = await request.get('/custom/endpoint', { param: 'value' });
const result = await request.post('/custom/endpoint', { data: 'value' });
```

### Token管理

```typescript
import { AuthManager } from '@/lib/api';

// 检查是否已登录
if (AuthManager.isAuthenticated()) {
  // 已登录逻辑
}

// 获取当前用户
const user = AuthManager.getUser();

// 手动设置token（通常不需要，登录时会自动设置）
AuthManager.setTokens(accessToken, refreshToken);

// 清除认证信息
AuthManager.logout();
```

### 响应拦截

响应拦截器已自动处理：
- ✅ Token自动添加到请求头
- ✅ Token过期自动刷新
- ✅ 401错误自动跳转登录页
- ✅ 统一错误处理

## 🛠️ 类型支持

所有API都有完整的TypeScript类型定义：

```typescript
import type {
  MarketListItem,
  MarketDetailResponse,
  CreateOrderRequest,
  OrderInfo,
} from '@/lib/api/types';

// 类型安全
const market: MarketDetailResponse = await marketApi.getMarketDetail(1);
const order: OrderInfo = await tradeApi.createOrder({
  market_id: 1,
  order_type: 0,
  position: 1,
  amount: 100,
  price: 67,
});
```

## 📝 注意事项

1. **Token自动管理**: 登录后token会自动保存到localStorage，请求时自动添加到请求头
2. **Token自动刷新**: 当access_token过期时，会自动使用refresh_token刷新
3. **错误处理**: 所有API错误都会抛出`ApiError`，包含错误码和错误信息
4. **环境变量**: 确保设置了`NEXT_PUBLIC_API_BASE_URL`环境变量
5. **SSR支持**: 在服务端渲染时，localStorage不可用，需要特殊处理

## 🔍 调试

开发环境下，所有请求和响应都会在控制台打印，方便调试：

```
[API Request] GET /market/list { page: 1, page_size: 20 }
[API Response] /market/list { code: 0, msg: 'success', data: {...} }
```

## 📦 依赖

- `axios`: HTTP客户端
- `typescript`: 类型支持

## 🎯 最佳实践

1. **使用Hook**: 优先使用`useAuth`和`useApi` Hook
2. **错误处理**: 始终使用try-catch处理API错误
3. **类型安全**: 充分利用TypeScript类型定义
4. **加载状态**: 使用loading状态提升用户体验
5. **缓存策略**: 考虑使用React Query或SWR进行数据缓存

