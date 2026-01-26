# 前端API接入方案

## 📋 概述

本文档提供了完整的前端API接入方案，包括API客户端封装、认证管理、类型定义和使用示例。

## 🗂️ 文件结构

```
front-end/src/
├── lib/
│   └── api/
│       ├── index.ts              # 统一导出
│       ├── config.ts             # API配置
│       ├── client.ts             # Axios客户端封装
│       ├── auth.ts               # 认证管理
│       ├── types.ts              # TypeScript类型定义
│       ├── README.md             # API文档
│       ├── examples.tsx          # 使用示例
│       └── services/             # API服务模块
│           ├── auth.ts           # 认证相关API
│           ├── user.ts           # 用户相关API
│           ├── market.ts         # 市场相关API
│           ├── trade.ts          # 交易相关API
│           └── health.ts         # 健康检查API
└── hooks/
    ├── useAuth.ts                # 认证Hook
    └── useApi.ts                 # API调用Hook
```

## 🚀 快速开始

### 1. 环境配置

在项目根目录创建 `.env.local` 文件：

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
```

### 3. 认证流程

#### 钱包登录

```typescript
import { authApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

function LoginComponent() {
  const { login } = useAuth();

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
    } catch (error) {
      console.error('登录失败:', error);
    }
  };

  return <button onClick={handleLogin}>登录</button>;
}
```

## 📚 API模块说明

### 认证模块 (authApi)

| 方法 | 说明 | 需要认证 |
|------|------|---------|
| `getNonce(wallet_address)` | 获取nonce | ❌ |
| `login(data)` | 登录 | ❌ |
| `refreshToken(data)` | 刷新token | ❌ |
| `logout()` | 登出 | ✅ |

### 用户模块 (userApi)

| 方法 | 说明 | 需要认证 |
|------|------|---------|
| `getProfile()` | 获取用户资料 | ✅ |
| `updateProfile(data)` | 更新用户资料 | ✅ |
| `getPublicUser(address)` | 获取公开用户信息 | ❌ |

### 市场模块 (marketApi)

| 方法 | 说明 | 需要认证 |
|------|------|---------|
| `getMarketList(params?)` | 获取市场列表 | ❌ |
| `getMarketDetail(id)` | 获取市场详情 | ❌ |
| `createMarket(data)` | 创建市场 | ✅ |
| `getCategories()` | 获取市场分类 | ❌ |
| `getHotMarkets(params?)` | 获取热门市场 | ❌ |

### 交易模块 (tradeApi)

| 方法 | 说明 | 需要认证 |
|------|------|---------|
| `createOrder(data)` | 创建订单 | ✅ |
| `getOrderList(params?)` | 获取订单列表 | ✅ |
| `getOrderDetail(id)` | 获取订单详情 | ✅ |
| `cancelOrder(id)` | 取消订单 | ✅ |
| `getTradeHistory(params?)` | 获取交易历史 | ✅ |
| `getPositionList(params?)` | 获取持仓列表 | ✅ |
| `getPositionDetail(id)` | 获取持仓详情 | ✅ |
| `getTradingStats()` | 获取交易统计 | ✅ |

## 🎣 React Hooks

### useAuth

管理用户认证状态：

```typescript
const { user, isAuthenticated, login, logout, refreshUser } = useAuth();
```

### useApi

封装API调用，提供loading和error状态：

```typescript
const { data, loading, error, execute } = useApi(marketApi.getMarketList);

useEffect(() => {
  execute({ page: 1, page_size: 20 });
}, [execute]);
```

## 🔧 特性

### ✅ 自动Token管理
- Token自动保存到localStorage
- 请求时自动添加到请求头
- Token过期自动刷新

### ✅ 统一错误处理
- 所有API错误统一为`ApiError`类型
- 包含错误码和错误信息
- 401错误自动跳转登录页

### ✅ 完整类型支持
- 所有API都有TypeScript类型定义
- 类型安全的请求和响应

### ✅ 开发友好
- 开发环境自动打印请求和响应
- 清晰的错误信息

## 📝 使用示例

详细示例请参考：
- `src/lib/api/examples.tsx` - 完整的使用示例
- `src/lib/api/README.md` - 详细文档

## 🔍 错误处理

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

## 🛠️ 高级用法

### 自定义请求

```typescript
import { request } from '@/lib/api/client';

const customData = await request.get('/custom/endpoint', { param: 'value' });
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
```

## ⚠️ 注意事项

1. **环境变量**: 确保设置了`NEXT_PUBLIC_API_BASE_URL`
2. **SSR支持**: 服务端渲染时localStorage不可用，需要特殊处理
3. **错误处理**: 始终使用try-catch处理API错误
4. **类型安全**: 充分利用TypeScript类型定义

## 📦 依赖

- `axios`: HTTP客户端
- `typescript`: 类型支持

## 🎯 最佳实践

1. **使用Hook**: 优先使用`useAuth`和`useApi` Hook
2. **错误处理**: 始终使用try-catch处理API错误
3. **类型安全**: 充分利用TypeScript类型定义
4. **加载状态**: 使用loading状态提升用户体验
5. **缓存策略**: 考虑使用React Query或SWR进行数据缓存

