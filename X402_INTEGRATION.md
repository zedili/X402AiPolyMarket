# X402 协议接入指南

## 什么是 X402？

**X402** 是由 Coinbase 开发者平台推出的开源支付协议，基于 **HTTP 402 Payment Required** 状态码，专门用于实现互联网原生支付。

### 核心特性

1. **微支付解决方案**：专为 AI 代理、应用程序和机器之间的微支付设计
2. **无需注册**：允许网页、API 或服务直接在网络请求中收取费用，无需用户注册账号或使用信用卡
3. **区块链原生**：基于 Solana 等区块链平台实现
4. **HTTP 标准**：利用 HTTP 402 状态码作为支付请求的标准响应

### 工作原理

当客户端请求需要付费的资源时，服务器返回 HTTP 402 状态码，并在响应头中包含支付信息（如金额、收款地址等）。客户端处理支付后，重新发送请求完成交易。

## 如何接入 X402

### 1. 前端接入（Next.js/React）

#### 安装依赖

```bash
npm install @solana/web3.js @solana/wallet-adapter-base @solana/wallet-adapter-react
```

#### 创建 X402 客户端工具

创建 `src/lib/x402-client.ts`：

```typescript
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';

export interface X402PaymentRequest {
  amount: number; // SOL 数量
  recipient: string; // 收款地址
  memo?: string; // 备注信息
}

export class X402Client {
  private connection: Connection;
  private rpcUrl: string;

  constructor(rpcUrl: string = 'https://api.mainnet-beta.solana.com') {
    this.rpcUrl = rpcUrl;
    this.connection = new Connection(rpcUrl, 'confirmed');
  }

  /**
   * 处理 HTTP 402 响应，提取支付信息
   */
  parse402Response(response: Response): X402PaymentRequest | null {
    if (response.status !== 402) {
      return null;
    }

    const paymentRequired = response.headers.get('X-Payment-Required');
    const amount = response.headers.get('X-Payment-Amount');
    const recipient = response.headers.get('X-Payment-Recipient');
    const memo = response.headers.get('X-Payment-Memo');

    if (!amount || !recipient) {
      throw new Error('Invalid 402 response: missing payment information');
    }

    return {
      amount: parseFloat(amount),
      recipient,
      memo: memo || undefined,
    };
  }

  /**
   * 创建支付交易
   */
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

    // 如果有备注，添加 memo
    if (paymentRequest.memo) {
      // 需要安装 @solana/spl-memo
      // transaction.add(createMemoInstruction(paymentRequest.memo, [fromPublicKey]));
    }

    return transaction;
  }

  /**
   * 发送带支付的请求
   */
  async fetchWithPayment(
    url: string,
    options: RequestInit = {},
    wallet: any // Solana wallet adapter
  ): Promise<Response> {
    // 第一次请求
    let response = await fetch(url, options);

    // 如果是 402，需要支付
    if (response.status === 402) {
      const paymentRequest = this.parse402Response(response);
      if (!paymentRequest) {
        throw new Error('Failed to parse payment request');
      }

      // 创建并发送支付交易
      const transaction = await this.createPaymentTransaction(
        wallet.publicKey,
        paymentRequest
      );

      // 签名并发送交易
      const signature = await wallet.sendTransaction(transaction, this.connection);
      await this.connection.confirmTransaction(signature, 'confirmed');

      // 支付完成后，重新发送原始请求
      // 通常需要在请求头中包含交易签名作为支付证明
      const headers = new Headers(options.headers);
      headers.set('X-Payment-Signature', signature);

      response = await fetch(url, {
        ...options,
        headers,
      });
    }

    return response;
  }
}
```

#### 在组件中使用

```typescript
'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { X402Client } from '@/lib/x402-client';

export function PaymentButton() {
  const { publicKey, sendTransaction } = useWallet();
  const x402Client = new X402Client();

  const handleRequest = async () => {
    if (!publicKey || !sendTransaction) {
      alert('Please connect your wallet');
      return;
    }

    try {
      const response = await x402Client.fetchWithPayment(
        'https://api.example.com/ai-prediction',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: 'Will BTC reach $100k?' }),
        },
        { publicKey, sendTransaction }
      );

      const data = await response.json();
      console.log('Response:', data);
    } catch (error) {
      console.error('Payment failed:', error);
    }
  };

  return <button onClick={handleRequest}>Request AI Prediction</button>;
}
```

### 2. 后端接入（Go）

#### 安装依赖

```bash
go get github.com/gagliardetto/solana-go
go get github.com/near/borsh-go
```

#### 创建 X402 中间件

创建 `back-end/PolyMarket/internal/middleware/x402.go`：

```go
package middleware

import (
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/zeromicro/go-zero/core/logx"
)

// X402PaymentRequest 支付请求信息
type X402PaymentRequest struct {
	Amount    float64 `json:"amount"`    // SOL 数量
	Recipient string  `json:"recipient"` // 收款地址
	Memo      string  `json:"memo,omitempty"`
	Timestamp int64   `json:"timestamp"`
}

// X402Middleware X402 支付中间件
func X402Middleware(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// 检查是否已支付（通过请求头中的签名验证）
		paymentSignature := r.Header.Get("X-Payment-Signature")
		
		if paymentSignature == "" {
			// 返回 402 支付请求
			send402Response(w, X402PaymentRequest{
				Amount:    0.001, // 0.001 SOL
				Recipient: "YourSolanaWalletAddressHere",
				Memo:      "AI Prediction Service Fee",
				Timestamp: time.Now().Unix(),
			})
			return
		}

		// 验证支付签名（这里需要实现 Solana 交易验证逻辑）
		if !verifyPayment(paymentSignature) {
			http.Error(w, "Invalid payment signature", http.StatusPaymentRequired)
			return
		}

		// 支付验证通过，继续处理请求
		next(w, r)
	}
}

// send402Response 发送 HTTP 402 响应
func send402Response(w http.ResponseWriter, paymentReq X402PaymentRequest) {
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("X-Payment-Required", "true")
	w.Header().Set("X-Payment-Amount", strconv.FormatFloat(paymentReq.Amount, 'f', -1, 64))
	w.Header().Set("X-Payment-Recipient", paymentReq.Recipient)
	if paymentReq.Memo != "" {
		w.Header().Set("X-Payment-Memo", paymentReq.Memo)
	}
	w.WriteHeader(http.StatusPaymentRequired)
	
	json.NewEncoder(w).Encode(map[string]interface{}{
		"error": "Payment Required",
		"payment": paymentReq,
	})
}

// verifyPayment 验证支付签名（需要实现 Solana 交易验证）
func verifyPayment(signature string) bool {
	// TODO: 实现 Solana 交易签名验证
	// 1. 通过 RPC 获取交易详情
	// 2. 验证交易是否已确认
	// 3. 验证收款地址和金额是否正确
	// 4. 验证交易时间戳是否在有效期内
	
	logx.Infof("Verifying payment signature: %s", signature)
	return true // 临时返回 true，实际需要实现验证逻辑
}
```

#### 在路由中使用

更新 `back-end/PolyMarket/internal/handler/routes.go`：

```go
package handler

import (
	"net/http"

	"X402AiPolyMarket/PolyMarket/internal/middleware"
	"X402AiPolyMarket/PolyMarket/internal/svc"
	"github.com/zeromicro/go-zero/rest"
)

func RegisterHandlers(server *rest.Server, serverCtx *svc.ServiceContext) {
	server.AddRoutes(
		[]rest.Route{
			{
				Method:  http.MethodGet,
				Path:    "/from/:name",
				Handler: middleware.X402Middleware(PolyMarketHandler(serverCtx)),
			},
		},
	)
}
```

### 3. 配置说明

#### 环境变量

创建 `.env` 文件：

```env
# Solana RPC 端点
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
# 或使用开发网
# SOLANA_RPC_URL=https://api.devnet.solana.com

# 收款钱包地址
PAYMENT_RECIPIENT=YourSolanaWalletAddressHere

# 服务费用（SOL）
SERVICE_FEE=0.001
```

### 4. 测试流程

1. **启动后端服务**：
   ```bash
   cd back-end/PolyMarket
   go run polymarket.go -f etc/polymarket-api.yaml
   ```

2. **连接 Solana 钱包**（前端）：
   - 使用 Phantom、Solflare 等钱包
   - 确保钱包中有足够的 SOL

3. **发送请求**：
   - 第一次请求会收到 402 响应
   - 自动触发支付流程
   - 支付完成后自动重试请求

### 5. 安全注意事项

1. **交易验证**：必须验证 Solana 交易签名，确保支付真实有效
2. **防重放攻击**：使用时间戳和 nonce 防止重复使用同一笔支付
3. **金额验证**：验证实际支付金额是否匹配请求金额
4. **地址验证**：确保支付发送到正确的收款地址

### 6. 参考资源

- [X402 官方文档](https://docs.x402x.ai/)
- [Solana Web3.js 文档](https://solana-labs.github.io/solana-web3.js/)
- [HTTP 402 状态码规范](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/402)

## 项目集成建议

基于当前项目结构，建议：

1. **前端**：在 `src/lib/` 目录下创建 X402 客户端工具
2. **后端**：在 `internal/middleware/` 目录下创建 X402 中间件
3. **配置**：在 `etc/polymarket-api.yaml` 中添加 X402 相关配置
4. **智能合约**：考虑在 `InsightToken.sol` 中集成 X402 支付逻辑

