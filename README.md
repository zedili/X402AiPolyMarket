# X402AiPolyMarket

一个结合了 **X402 支付协议** 和 **PolyMarket 预测市场** 的 AI 驱动预测平台。

## 项目简介

X402AiPolyMarket 是一个去中心化的预测市场平台，集成了：

- **X402 支付协议**：基于 HTTP 402 状态码的互联网原生微支付解决方案
- **PolyMarket 集成**：预测市场数据和分析
- **AI 预测**：利用 AI 模型进行市场趋势分析和预测
- **Solana 区块链**：基于 Solana 的支付和智能合约

## 什么是 X402？

**X402** 是由 Coinbase 开发者平台推出的开源支付协议，专门用于实现互联网原生支付。它允许：

- 网页、API 或服务直接在网络请求中收取费用
- 无需用户注册账号或使用信用卡
- 基于 Solana 等区块链平台实现微支付
- 利用 HTTP 402 Payment Required 状态码作为标准

## 快速开始

### 前端

```bash
cd front-end
pnpm install
pnpm dev
```

### 后端

```bash
cd back-end/PolyMarket
go mod download
go run polymarket.go -f etc/polymarket-api.yaml
```

## X402 接入指南

详细的 X402 协议接入说明请参考：[X402_INTEGRATION.md](./X402_INTEGRATION.md)

## 项目结构

```
X402AiPolyMarket/
├── front-end/          # Next.js 前端应用
│   ├── src/
│   │   ├── lib/
│   │   │   └── x402-client.ts  # X402 客户端工具
│   │   └── components/          # React 组件
│   └── app/                     # Next.js App Router
├── back-end/           # Go 后端服务
│   └── PolyMarket/
│       ├── internal/
│       │   └── middleware/
│       │       └── x402.go      # X402 支付中间件
│       └── etc/                 # 配置文件
├── contracts/          # Solana 智能合约
│   └── contracts/
│       └── InsightToken.sol     # 代币合约
└── X402_INTEGRATION.md # X402 接入文档
```

## 技术栈

- **前端**：Next.js, React, TypeScript, Tailwind CSS
- **后端**：Go, go-zero
- **区块链**：Solana
- **智能合约**：Solidity (Hardhat)

## 参考资源

- [X402 官方文档](https://docs.x402x.ai/)
- [Solana 文档](https://docs.solana.com/)
- [PolyMarket API](https://docs.polymarket.com/)