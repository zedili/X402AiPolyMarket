# Polymarket 接入文档

本文档详细介绍了如何将 Polymarket API 与 X402 支付协议集成到项目中。

## 目录

1. [概述](#概述)
2. [Polymarket API 功能](#polymarket-api-功能)
3. [X402 支付协议](#x402-支付协议)
4. [快速开始](#快速开始)
5. [API 接入指南](#api-接入指南)
6. [实时数据流 (RTDS)](#实时数据流-rtds)
7. [WebSocket 连接](#websocket-连接)
8. [X402 支付集成](#x402-支付集成)
9. [完整示例](#完整示例)
10. [最佳实践](#最佳实践)

---

## 概述

### Polymarket 简介

Polymarket 是一个去中心化预测市场平台，允许用户对各类事件进行预测和交易。Polymarket 提供了完整的开发者 API，包括：

- **REST API**：用于市场数据查询、订单管理等
- **WebSocket (WSS)**：实时市场数据和用户数据推送
- **RTDS (Real Time Data Socket)**：实时数据流，包括加密货币价格、评论等

### X402 支付协议简介

X402 是由 Coinbase 开发者平台推出的开源支付协议，基于 HTTP 402 Payment Required 状态码，用于实现互联网原生微支付。

**核心特性：**
- 无需用户注册即可收费
- 基于区块链的原生支付
- 支持 Solana 等区块链平台
- 标准化的 HTTP 402 响应

---

## Polymarket API 功能

### 1. 开发者快速入门

#### 获取市场数据

```bash
# 获取所有市场
GET https://clob.polymarket.com/markets

# 获取特定市场
GET https://clob.polymarket.com/markets/{market_id}

# 获取市场订单簿
GET https://clob.polymarket.com/book?market={market_id}
```

#### 下达订单

```bash
POST https://clob.polymarket.com/orders
Authorization: Bearer {api_key}
Content-Type: application/json

{
  "market": "0x123...",
  "side": "buy",
  "price": "0.5",
  "size": "100",
  "type": "limit"
}
```

#### API 速率限制

- **公共端点**：10 请求/秒
- **认证端点**：100 请求/秒
- **WebSocket**：无限制（但建议合理使用）

### 2. 中央限价订单簿 (CLOB)

#### 身份验证

Polymarket 使用 API Key 进行身份验证：

```go
// Go 示例
req.Header.Set("Authorization", "Bearer "+apiKey)
```

#### 地理限制

某些功能可能受地理位置限制，需要：
- VPN 配置
- 或使用代理服务器

#### REST API 端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/markets` | GET | 获取市场列表 |
| `/markets/{id}` | GET | 获取市场详情 |
| `/book` | GET | 获取订单簿 |
| `/orders` | GET | 获取订单列表 |
| `/orders` | POST | 创建订单 |
| `/orders/{id}` | DELETE | 取消订单 |
| `/trades` | GET | 获取交易历史 |

### 3. 实时数据流 (RTDS)

RTDS 提供实时数据推送，包括：

#### 加密货币价格流

```javascript
// JavaScript 示例
const ws = new WebSocket('wss://rtds.polymarket.com/crypto-prices');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Crypto price update:', data);
};
```

**订阅格式：**
```json
{
  "type": "subscribe",
  "channel": "crypto-prices",
  "symbols": ["BTC", "ETH", "SOL"]
}
```

#### 评论数据流

```javascript
const ws = new WebSocket('wss://rtds.polymarket.com/comments');

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('New comment:', data);
};
```

**订阅格式：**
```json
{
  "type": "subscribe",
  "channel": "comments",
  "market_id": "0x123..."
}
```

### 4. WebSocket 连接 (WSS)

#### 连接建立

```javascript
const ws = new WebSocket('wss://clob.polymarket.com/ws');

// 认证
ws.onopen = () => {
  ws.send(JSON.stringify({
    type: 'auth',
    apiKey: 'your-api-key'
  }));
};
```

#### 用户频道

订阅用户相关的实时数据：

```json
{
  "type": "subscribe",
  "channel": "user",
  "user_id": "0xabc..."
}
```

**推送内容：**
- 订单状态更新
- 持仓变化
- 账户余额变化

#### 市场频道

订阅市场相关的实时数据：

```json
{
  "type": "subscribe",
  "channel": "market",
  "market_id": "0x123..."
}
```

**推送内容：**
- 订单簿更新
- 最新交易
- 市场状态变化

### 5. 做市商功能

#### 做市商设置

```bash
POST https://clob.polymarket.com/market-maker/settings
Authorization: Bearer {api_key}

{
  "market_id": "0x123...",
  "spread": 0.01,
  "size": 1000
}
```

#### 流动性奖励

做市商可以通过提供流动性获得奖励：
- 返利计划
- 数据源访问
- 库存管理工具

### 6. Builder 计划

#### Builder 等级

- **Level 1**：基础 API 访问
- **Level 2**：高级功能访问
- **Level 3**：优先支持和定制功能

#### 订单归属

```bash
POST https://clob.polymarket.com/orders
Authorization: Bearer {api_key}

{
  "market": "0x123...",
  "side": "buy",
  "price": "0.5",
  "size": "100",
  "builder_id": "your-builder-id"
}
```

---

## X402 支付协议

### 工作原理

1. **客户端请求**：客户端向服务器发送请求
2. **402 响应**：服务器返回 HTTP 402，包含支付信息
3. **支付处理**：客户端处理支付（通常是区块链交易）
4. **支付验证**：客户端在请求头中包含支付证明
5. **服务提供**：服务器验证支付后提供服务

### HTTP 402 响应格式

```http
HTTP/1.1 402 Payment Required
Content-Type: application/json
X-Payment-Required: true
X-Payment-Amount: 0.001
X-Payment-Recipient: SolanaWalletAddress
X-Payment-Memo: Service Fee
X-Payment-Currency: SOL

{
  "error": "Payment Required",
  "payment": {
    "amount": 0.001,
    "recipient": "SolanaWalletAddress",
    "memo": "Service Fee",
    "currency": "SOL",
    "timestamp": 1234567890
  }
}
```

### 支付验证请求格式

```http
GET /api/resource HTTP/1.1
Authorization: Bearer {token}
X-Payment-Signature: {transaction_signature}
X-Payment-Amount: 0.001
X-Payment-Timestamp: 1234567890
```

---

## 快速开始

### 1. 环境准备

#### 后端 (Go)

```bash
cd back-end/PolyMarket
go mod tidy
```

#### 前端 (Next.js)

```bash
cd front-end
npm install
# 或
pnpm install
```

### 2. 配置 API Key

在 `back-end/PolyMarket/etc/polymarket-api.yaml` 中添加：

```yaml
Polymarket:
  ApiKey: "your-polymarket-api-key"
  ApiUrl: "https://clob.polymarket.com"
  WssUrl: "wss://clob.polymarket.com/ws"
  RtdsUrl: "wss://rtds.polymarket.com"

X402:
  Enabled: true
  PaymentRecipient: "YourSolanaWalletAddress"
  ServiceFee: 0.001
  Currency: "SOL"
  SolanaRpcUrl: "https://api.mainnet-beta.solana.com"
```

### 3. 安装依赖

#### 后端依赖

```bash
go get github.com/gorilla/websocket
go get github.com/gagliardetto/solana-go
```

#### 前端依赖

```bash
npm install @solana/web3.js @solana/wallet-adapter-base @solana/wallet-adapter-react
```

---

## API 接入指南

### 后端实现

#### 1. 创建 Polymarket 客户端

创建 `back-end/PolyMarket/internal/client/polymarket.go`：

```go
package client

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

type PolymarketClient struct {
	apiKey string
	apiUrl string
	client *http.Client
}

func NewPolymarketClient(apiKey, apiUrl string) *PolymarketClient {
	return &PolymarketClient{
		apiKey: apiKey,
		apiUrl: apiUrl,
		client: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// GetMarkets 获取市场列表
func (c *PolymarketClient) GetMarkets() ([]Market, error) {
	req, err := http.NewRequest("GET", c.apiUrl+"/markets", nil)
	if err != nil {
		return nil, err
	}
	
	req.Header.Set("Authorization", "Bearer "+c.apiKey)
	
	resp, err := c.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	
	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API error: %d", resp.StatusCode)
	}
	
	var markets []Market
	if err := json.NewDecoder(resp.Body).Decode(&markets); err != nil {
		return nil, err
	}
	
	return markets, nil
}

// GetMarket 获取市场详情
func (c *PolymarketClient) GetMarket(marketID string) (*Market, error) {
	req, err := http.NewRequest("GET", c.apiUrl+"/markets/"+marketID, nil)
	if err != nil {
		return nil, err
	}
	
	req.Header.Set("Authorization", "Bearer "+c.apiKey)
	
	resp, err := c.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	
	var market Market
	if err := json.NewDecoder(resp.Body).Decode(&market); err != nil {
		return nil, err
	}
	
	return &market, nil
}

// CreateOrder 创建订单
func (c *PolymarketClient) CreateOrder(order OrderRequest) (*Order, error) {
	body, err := json.Marshal(order)
	if err != nil {
		return nil, err
	}
	
	req, err := http.NewRequest("POST", c.apiUrl+"/orders", bytes.NewReader(body))
	if err != nil {
		return nil, err
	}
	
	req.Header.Set("Authorization", "Bearer "+c.apiKey)
	req.Header.Set("Content-Type", "application/json")
	
	resp, err := c.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	
	var orderResp Order
	if err := json.NewDecoder(resp.Body).Decode(&orderResp); err != nil {
		return nil, err
	}
	
	return &orderResp, nil
}

type Market struct {
	ID          string `json:"id"`
	Question    string `json:"question"`
	Description string `json:"description"`
	EndDate     string `json:"end_date"`
	Status      string `json:"status"`
}

type OrderRequest struct {
	Market string `json:"market"`
	Side   string `json:"side"` // "buy" or "sell"
	Price  string `json:"price"`
	Size   string `json:"size"`
	Type   string `json:"type"` // "limit" or "market"
}

type Order struct {
	ID     string `json:"id"`
	Status string `json:"status"`
	Market string `json:"market"`
	Side   string `json:"side"`
	Price  string `json:"price"`
	Size   string `json:"size"`
}
```

#### 2. 更新 ServiceContext

更新 `back-end/PolyMarket/internal/svc/servicecontext.go`：

```go
package svc

import (
	"X402AiPolyMarket/PolyMarket/internal/client"
	"X402AiPolyMarket/PolyMarket/internal/config"
)

type ServiceContext struct {
	Config          config.Config
	PolymarketClient *client.PolymarketClient
}

func NewServiceContext(c config.Config) *ServiceContext {
	return &ServiceContext{
		Config: c,
		PolymarketClient: client.NewPolymarketClient(
			c.Polymarket.ApiKey,
			c.Polymarket.ApiUrl,
		),
	}
}
```

#### 3. 更新配置结构

更新 `back-end/PolyMarket/internal/config/config.go`：

```go
package config

import "github.com/zeromicro/go-zero/core/stores/cache"

type Config struct {
	rest.RestConf
	Polymarket PolymarketConfig
	X402       X402Config
}

type PolymarketConfig struct {
	ApiKey string
	ApiUrl string
	WssUrl string
	RtdsUrl string
}

type X402Config struct {
	Enabled          bool
	PaymentRecipient string
	ServiceFee       float64
	Currency         string
	SolanaRpcUrl     string
}
```

### 前端实现

#### 1. 创建 Polymarket API 客户端

创建 `front-end/src/lib/polymarket-client.ts`：

```typescript
const POLYMARKET_API_URL = process.env.NEXT_PUBLIC_POLYMARKET_API_URL || 'https://clob.polymarket.com';

export interface Market {
  id: string;
  question: string;
  description: string;
  end_date: string;
  status: string;
}

export interface OrderRequest {
  market: string;
  side: 'buy' | 'sell';
  price: string;
  size: string;
  type: 'limit' | 'market';
}

export interface Order {
  id: string;
  status: string;
  market: string;
  side: string;
  price: string;
  size: string;
}

export class PolymarketClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(apiKey: string, baseUrl: string = POLYMARKET_API_URL) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async getMarkets(): Promise<Market[]> {
    const response = await fetch(`${this.baseUrl}/markets`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch markets: ${response.statusText}`);
    }

    return response.json();
  }

  async getMarket(marketId: string): Promise<Market> {
    const response = await fetch(`${this.baseUrl}/markets/${marketId}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch market: ${response.statusText}`);
    }

    return response.json();
  }

  async createOrder(order: OrderRequest): Promise<Order> {
    const response = await fetch(`${this.baseUrl}/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(order),
    });

    if (!response.ok) {
      throw new Error(`Failed to create order: ${response.statusText}`);
    }

    return response.json();
  }
}
```

---

## 实时数据流 (RTDS)

### 后端 WebSocket 实现

创建 `back-end/PolyMarket/internal/client/rtds.go`：

```go
package client

import (
	"encoding/json"
	"log"
	"time"

	"github.com/gorilla/websocket"
)

type RTDSClient struct {
	conn   *websocket.Conn
	url    string
	done   chan struct{}
	events chan RTDSEvent
}

type RTDSEvent struct {
	Type    string          `json:"type"`
	Channel string          `json:"channel"`
	Data    json.RawMessage `json:"data"`
}

func NewRTDSClient(url string) (*RTDSClient, error) {
	dialer := websocket.Dialer{
		HandshakeTimeout: 10 * time.Second,
	}

	conn, _, err := dialer.Dial(url, nil)
	if err != nil {
		return nil, err
	}

	client := &RTDSClient{
		conn:   conn,
		url:    url,
		done:   make(chan struct{}),
		events: make(chan RTDSEvent, 100),
	}

	go client.readPump()

	return client, nil
}

func (c *RTDSClient) Subscribe(channel string, params map[string]interface{}) error {
	msg := map[string]interface{}{
		"type":    "subscribe",
		"channel": channel,
	}
	
	for k, v := range params {
		msg[k] = v
	}

	return c.conn.WriteJSON(msg)
}

func (c *RTDSClient) readPump() {
	defer c.conn.Close()

	for {
		var event RTDSEvent
		if err := c.conn.ReadJSON(&event); err != nil {
			log.Printf("RTDS read error: %v", err)
			return
		}

		select {
		case c.events <- event:
		case <-c.done:
			return
		}
	}
}

func (c *RTDSClient) Events() <-chan RTDSEvent {
	return c.events
}

func (c *RTDSClient) Close() error {
	close(c.done)
	return c.conn.Close()
}
```

### 前端 WebSocket 实现

创建 `front-end/src/lib/rtds-client.ts`：

```typescript
export interface RTDSEvent {
  type: string;
  channel: string;
  data: any;
}

export class RTDSClient {
  private ws: WebSocket | null = null;
  private url: string;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor(url: string = 'wss://rtds.polymarket.com') {
    this.url = url;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('RTDS connected');
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        };

        this.ws.onerror = (error) => {
          console.error('RTDS error:', error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log('RTDS disconnected');
          this.handleReconnect();
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  subscribe(channel: string, params: Record<string, any> = {}): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket not connected');
    }

    const message = {
      type: 'subscribe',
      channel,
      ...params,
    };

    this.ws.send(JSON.stringify(message));
  }

  on(channel: string, callback: (data: any) => void): void {
    if (!this.listeners.has(channel)) {
      this.listeners.set(channel, new Set());
    }
    this.listeners.get(channel)!.add(callback);
  }

  off(channel: string, callback: (data: any) => void): void {
    const callbacks = this.listeners.get(channel);
    if (callbacks) {
      callbacks.delete(callback);
    }
  }

  private handleMessage(data: RTDSEvent): void {
    const callbacks = this.listeners.get(data.channel);
    if (callbacks) {
      callbacks.forEach((callback) => callback(data.data));
    }
  }

  private handleReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      
      setTimeout(() => {
        console.log(`Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.connect().catch(console.error);
      }, delay);
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.listeners.clear();
  }
}
```

---

## X402 支付集成

### 后端 X402 中间件

更新 `back-end/PolyMarket/internal/middleware/x402.go`：

```go
package middleware

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"X402AiPolyMarket/PolyMarket/internal/config"
	"github.com/zeromicro/go-zero/core/logx"
)

type X402PaymentRequest struct {
	Amount    float64 `json:"amount"`
	Recipient string  `json:"recipient"`
	Memo      string  `json:"memo,omitempty"`
	Currency  string  `json:"currency"`
	Timestamp int64   `json:"timestamp"`
}

type X402Middleware struct {
	config config.X402Config
}

func NewX402Middleware(cfg config.X402Config) *X402Middleware {
	return &X402Middleware{
		config: cfg,
	}
}

func (m *X402Middleware) Handle(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !m.config.Enabled {
			next(w, r)
			return
		}

		// 检查支付签名
		paymentSignature := r.Header.Get("X-Payment-Signature")
		
		if paymentSignature == "" {
			// 返回 402 支付请求
			m.send402Response(w)
			return
		}

		// 验证支付
		if !m.verifyPayment(paymentSignature, r) {
			http.Error(w, "Invalid payment signature", http.StatusPaymentRequired)
			return
		}

		// 支付验证通过，继续处理
		next(w, r)
	}
}

func (m *X402Middleware) send402Response(w http.ResponseWriter) {
	paymentReq := X402PaymentRequest{
		Amount:    m.config.ServiceFee,
		Recipient: m.config.PaymentRecipient,
		Memo:      "Polymarket API Service Fee",
		Currency:  m.config.Currency,
		Timestamp: time.Now().Unix(),
	}

	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("X-Payment-Required", "true")
	w.Header().Set("X-Payment-Amount", strconv.FormatFloat(paymentReq.Amount, 'f', -1, 64))
	w.Header().Set("X-Payment-Recipient", paymentReq.Recipient)
	w.Header().Set("X-Payment-Currency", paymentReq.Currency)
	w.Header().Set("X-Payment-Memo", paymentReq.Memo)
	w.WriteHeader(http.StatusPaymentRequired)

	json.NewEncoder(w).Encode(map[string]interface{}{
		"error":   "Payment Required",
		"payment": paymentReq,
	})
}

func (m *X402Middleware) verifyPayment(signature string, r *http.Request) bool {
	// TODO: 实现 Solana 交易验证
	// 1. 通过 RPC 获取交易详情
	// 2. 验证交易是否已确认
	// 3. 验证收款地址和金额是否正确
	// 4. 验证交易时间戳是否在有效期内（如 5 分钟内）
	
	amount := r.Header.Get("X-Payment-Amount")
	timestamp := r.Header.Get("X-Payment-Timestamp")
	
	logx.Infof("Verifying payment: signature=%s, amount=%s, timestamp=%s", 
		signature, amount, timestamp)
	
	// 临时实现：实际需要调用 Solana RPC 验证
	return true
}
```

### 前端 X402 客户端

更新 `front-end/src/lib/x402-client.ts`：

```typescript
import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';

export interface X402PaymentRequest {
  amount: number;
  recipient: string;
  memo?: string;
  currency: string;
  timestamp: number;
}

export class X402Client {
  private connection: Connection;
  private rpcUrl: string;

  constructor(rpcUrl: string = 'https://api.mainnet-beta.solana.com') {
    this.rpcUrl = rpcUrl;
    this.connection = new Connection(rpcUrl, 'confirmed');
  }

  parse402Response(response: Response): X402PaymentRequest | null {
    if (response.status !== 402) {
      return null;
    }

    const amount = response.headers.get('X-Payment-Amount');
    const recipient = response.headers.get('X-Payment-Recipient');
    const memo = response.headers.get('X-Payment-Memo');
    const currency = response.headers.get('X-Payment-Currency');

    if (!amount || !recipient) {
      throw new Error('Invalid 402 response: missing payment information');
    }

    return {
      amount: parseFloat(amount),
      recipient,
      memo: memo || undefined,
      currency: currency || 'SOL',
      timestamp: Date.now(),
    };
  }

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

  async fetchWithPayment(
    url: string,
    options: RequestInit = {},
    wallet: { publicKey: PublicKey; sendTransaction: (tx: Transaction, conn: Connection) => Promise<string> }
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
      const headers = new Headers(options.headers);
      headers.set('X-Payment-Signature', signature);
      headers.set('X-Payment-Amount', paymentRequest.amount.toString());
      headers.set('X-Payment-Timestamp', paymentRequest.timestamp.toString());

      response = await fetch(url, {
        ...options,
        headers,
      });
    }

    return response;
  }
}
```

---

## 完整示例

### 后端：带 X402 的市场查询接口

更新 `back-end/PolyMarket/internal/logic/polymarketlogic.go`：

```go
package logic

import (
	"context"
	"encoding/json"
	"net/http"

	"X402AiPolyMarket/PolyMarket/internal/svc"
	"X402AiPolyMarket/PolyMarket/internal/types"

	"github.com/zeromicro/go-zero/core/logx"
)

type PolyMarketLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

func NewPolyMarketLogic(ctx context.Context, svcCtx *svc.ServiceContext) *PolyMarketLogic {
	return &PolyMarketLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *PolyMarketLogic) GetMarkets() (*types.MarketsResponse, error) {
	markets, err := l.svcCtx.PolymarketClient.GetMarkets()
	if err != nil {
		return nil, err
	}

	resp := &types.MarketsResponse{
		Markets: make([]types.Market, len(markets)),
	}

	for i, m := range markets {
		resp.Markets[i] = types.Market{
			ID:          m.ID,
			Question:    m.Question,
			Description: m.Description,
			EndDate:     m.EndDate,
			Status:      m.Status,
		}
	}

	return resp, nil
}

func (l *PolyMarketLogic) CreateOrder(req *types.OrderRequest) (*types.OrderResponse, error) {
	orderReq := client.OrderRequest{
		Market: req.Market,
		Side:   req.Side,
		Price:  req.Price,
		Size:   req.Size,
		Type:   req.Type,
	}

	order, err := l.svcCtx.PolymarketClient.CreateOrder(orderReq)
	if err != nil {
		return nil, err
	}

	return &types.OrderResponse{
		ID:     order.ID,
		Status: order.Status,
		Market: order.Market,
		Side:   order.Side,
		Price:  order.Price,
		Size:   order.Size,
	}, nil
}
```

### 前端：使用 X402 支付的市场查询组件

创建 `front-end/src/components/PolymarketMarkets.tsx`：

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PolymarketClient } from '@/lib/polymarket-client';
import { X402Client } from '@/lib/x402-client';

export function PolymarketMarkets() {
  const { publicKey, sendTransaction } = useWallet();
  const [markets, setMarkets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const polymarketClient = new PolymarketClient('your-api-key');
  const x402Client = new X402Client();

  const fetchMarkets = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!publicKey || !sendTransaction) {
        throw new Error('Please connect your wallet');
      }

      // 使用 X402 客户端发送请求
      const response = await x402Client.fetchWithPayment(
        '/api/polymarket/markets',
        {
          method: 'GET',
        },
        { publicKey, sendTransaction }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch markets: ${response.statusText}`);
      }

      const data = await response.json();
      setMarkets(data.markets || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarkets();
  }, [publicKey]);

  if (loading) {
    return <div>Loading markets...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h2>Polymarket Markets</h2>
      <button onClick={fetchMarkets}>Refresh</button>
      <ul>
        {markets.map((market) => (
          <li key={market.id}>
            <h3>{market.question}</h3>
            <p>{market.description}</p>
            <p>Status: {market.status}</p>
            <p>End Date: {market.end_date}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

---

## 最佳实践

### 1. 错误处理

- **网络错误**：实现重试机制，使用指数退避
- **402 支付错误**：提供清晰的支付提示和错误信息
- **API 限制**：实现速率限制和请求队列

### 2. 安全性

- **API Key 管理**：使用环境变量，不要硬编码
- **支付验证**：严格验证 Solana 交易签名
- **防重放攻击**：使用时间戳和 nonce
- **HTTPS/WSS**：始终使用加密连接

### 3. 性能优化

- **连接池**：复用 HTTP 连接
- **WebSocket 重连**：实现自动重连机制
- **缓存**：缓存市场数据，减少 API 调用
- **批量请求**：合并多个请求

### 4. 监控和日志

- **请求日志**：记录所有 API 请求和响应
- **支付日志**：记录所有支付交易
- **错误监控**：集成错误监控服务
- **性能指标**：监控响应时间和成功率

### 5. 测试

- **单元测试**：测试各个组件功能
- **集成测试**：测试 API 集成
- **支付测试**：在测试网测试支付流程
- **负载测试**：测试系统性能

---

## 参考资源

### Polymarket 文档

- [Polymarket 开发者文档](https://docs.polymarket.com/)
- [RTDS 概览](https://docs.polymarket.com/developers/RTDS/RTDS-overview)
- [WebSocket API](https://docs.polymarket.com/developers/CLOB/websocket/wss-overview)
- [REST API 参考](https://docs.polymarket.com/quickstart/reference/endpoints)

### X402 文档

- [X402 官方文档](https://docs.cdp.coinbase.com/x402/welcome)
- [HTTP 402 规范](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/402)

### Solana 文档

- [Solana Web3.js](https://solana-labs.github.io/solana-web3.js/)
- [Solana 钱包适配器](https://github.com/solana-labs/wallet-adapter)

---

## 常见问题

### Q: 如何获取 Polymarket API Key？

A: 访问 [Polymarket 开发者页面](https://polymarket.com/developers)，注册并申请 API Key。

### Q: X402 支付支持哪些区块链？

A: 目前主要支持 Solana，未来可能支持其他区块链。

### Q: 如何处理支付失败的情况？

A: 实现重试机制，并提供清晰的错误提示。如果支付失败，可以允许用户重新尝试。

### Q: WebSocket 连接断开怎么办？

A: 实现自动重连机制，使用指数退避策略，避免频繁重连。

### Q: 如何测试 X402 支付？

A: 使用 Solana 开发网（devnet）进行测试，避免使用真实资金。

---

## 更新日志

- **2024-01-XX**: 初始版本，包含 Polymarket API 和 X402 支付集成

---

## 许可证

本文档遵循项目许可证。


