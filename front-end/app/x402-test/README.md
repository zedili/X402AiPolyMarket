# X402 支付协议测试模块

这是一个独立的测试模块，用于测试和验证 X402 支付协议的集成效果。

## 功能特性

- ✅ HTTP 402 Payment Required 响应处理
- ✅ 支付请求解析和显示
- ✅ 模拟 Solana 钱包连接
- ✅ 支付流程可视化
- ✅ 请求状态跟踪
- ✅ 完整的错误处理

## 使用方法

### 1. 访问测试页面

启动开发服务器后，访问：
```
http://localhost:3000/x402-test
```

### 2. 测试流程

1. **连接钱包**：点击"连接钱包（模拟）"按钮
   - 当前使用模拟钱包，不会产生真实交易
   - 实际集成时需要连接真实的 Solana 钱包（如 Phantom、Solflare）

2. **发送请求**：点击"发送请求"按钮
   - 会向 `/api/x402-test` 端点发送 POST 请求
   - 如果收到 402 响应，会显示支付请求信息

3. **确认支付**：如果收到支付请求
   - 查看支付金额、收款地址等信息
   - 点击"确认支付"按钮完成支付
   - 支付后请求会自动重试

4. **查看结果**：查看最终的响应结果
   - 成功时会显示响应数据和交易签名
   - 错误时会显示错误信息

## 文件结构

```
front-end/
├── app/
│   ├── x402-test/
│   │   ├── page.tsx          # 测试页面组件
│   │   └── README.md         # 本说明文档
│   └── api/
│       └── x402-test/
│           └── route.ts      # 测试 API 端点
└── src/
    └── lib/
        └── x402-client.ts     # X402 客户端工具类
```

## API 端点说明

### POST /api/x402-test

**未支付时（返回 402）：**
```json
{
  "error": "Payment Required",
  "message": "This service requires payment...",
  "payment": {
    "amount": 0.001,
    "recipient": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    "memo": "X402 Test Payment",
    "timestamp": 1234567890
  }
}
```

**已支付时（返回 200）：**
```json
{
  "success": true,
  "message": "Payment verified successfully",
  "data": {
    "timestamp": 1234567890,
    "payment": {
      "signature": "mock_signature_...",
      "amount": 0.001,
      "recipient": "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"
    },
    "response": {
      "prediction": "AI prediction result here",
      "confidence": 0.87,
      "data": "This is the actual API response after payment"
    }
  }
}
```

## 请求头说明

### 支付请求头（发送支付后）

- `X-Payment-Signature`: Solana 交易签名
- `X-Payment-Amount`: 支付金额（SOL）
- `X-Payment-Recipient`: 收款地址

### 402 响应头

- `X-Payment-Required`: "true"
- `X-Payment-Amount`: 所需支付金额
- `X-Payment-Recipient`: 收款地址
- `X-Payment-Memo`: 支付备注（可选）
- `X-Payment-Timestamp`: 时间戳

## 实际集成步骤

### 1. 安装 Solana Web3.js

```bash
npm install @solana/web3.js @solana/wallet-adapter-base @solana/wallet-adapter-react @solana/wallet-adapter-react-ui
```

### 2. 更新 X402Client

替换 `simulatePayment` 方法为真实的 Solana 交易创建：

```typescript
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';

async createPaymentTransaction(
  fromPublicKey: PublicKey,
  paymentRequest: X402PaymentRequest
): Promise<Transaction> {
  const recipientPublicKey = new PublicKey(paymentRequest.recipient);
  const lamports = paymentRequest.amount * LAMPORTS_PER_SOL;

  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: fromPublicKey,
      toPubkey: recipientPublicKey,
      lamports,
    })
  );

  return transaction;
}
```

### 3. 连接真实钱包

使用 Solana Wallet Adapter：

```typescript
import { useWallet } from '@solana/wallet-adapter-react';

const { publicKey, sendTransaction } = useWallet();
```

## 测试场景

### 场景 1：首次请求（未支付）
1. 发送请求 → 收到 402 响应
2. 显示支付请求信息
3. 用户确认支付
4. 自动重试请求 → 收到成功响应

### 场景 2：已支付请求
1. 请求头包含支付签名
2. 直接返回成功响应

### 场景 3：无效支付签名
1. 发送无效签名
2. 返回 402 错误

## 注意事项

1. **当前为模拟实现**：不会产生真实的 Solana 交易
2. **开发环境**：使用 Solana Devnet 进行测试
3. **生产环境**：需要实现真实的交易验证逻辑
4. **安全性**：确保验证支付签名的逻辑安全可靠

## 下一步

- [ ] 集成真实的 Solana 钱包
- [ ] 实现真实的交易创建和发送
- [ ] 添加交易验证逻辑
- [ ] 连接后端 API 进行端到端测试
- [ ] 添加支付历史记录
- [ ] 实现支付重试机制


