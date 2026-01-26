"# x402 支付协议接入指南（买家）

> 参考官方 Quickstart for Buyers：<https://x402.gitbook.io/x402/getting-started/quickstart-for-buyers>

## 1. 安装依赖
按使用的 HTTP 客户端选择包：

- Fetch 方案：
  ```bash
  npm install @x402/fetch @x402/evm
  ```
- Axios 方案：
  ```bash
  npm install @x402/axios @x402/evm
  ```
- 若需 Solana 支持：
  ```bash
  npm install @x402/svm
  ```
- EVM 私钥签名工具：
  ```bash
  npm install viem
  ```

## 2. 创建 EVM 钱包签名器（viem）
```ts
import { privateKeyToAccount } from "viem/accounts";

const signer = privateKeyToAccount(process.env.EVM_PRIVATE_KEY as `0x${string}`);
```
> 将私钥放到环境变量 `EVM_PRIVATE_KEY`，避免明文泄露。

## 3. 注册 x402 客户端并包裹 HTTP
### 3.1 Fetch 方案
```ts
import { wrapFetchWithPayment } from "@x402/fetch";
import { x402Client, x402HTTPClient } from "@x402/core/client";
import { registerExactEvmScheme } from "@x402/evm/exact/client";
import { privateKeyToAccount } from "viem/accounts";

const signer = privateKeyToAccount(process.env.EVM_PRIVATE_KEY as `0x${string}`);

const client = new x402Client();
registerExactEvmScheme(client, { signer });

const fetchWithPayment = wrapFetchWithPayment(fetch, client);

// 发起付费请求
const resp = await fetchWithPayment("https://api.example.com/paid-endpoint", { method: "GET" });
const data = await resp.json();
console.log("Response:", data);

// 获取支付结算信息（响应头）
const httpClient = new x402HTTPClient(client);
const paymentInfo = httpClient.getPaymentSettleResponse(name => resp.headers.get(name));
console.log("Payment settled:", paymentInfo);
```

### 3.2 Axios 方案
```ts
import { x402Client, wrapAxiosWithPayment, x402HTTPClient } from "@x402/axios";
import { registerExactEvmScheme } from "@x402/evm/exact/client";
import { privateKeyToAccount } from "viem/accounts";
import axios from "axios";

const signer = privateKeyToAccount(process.env.EVM_PRIVATE_KEY as `0x${string}`);

const client = new x402Client();
registerExactEvmScheme(client, { signer });

const api = wrapAxiosWithPayment(
  axios.create({ baseURL: "https://api.example.com" }),
  client
);

// 发起付费请求
const resp = await api.get("/paid-endpoint");
console.log("Response:", resp.data);

// 获取支付结算信息
const httpClient = new x402HTTPClient(client);
const paymentInfo = httpClient.getPaymentSettleResponse(
  name => resp.headers[name.toLowerCase()]
);
console.log("Payment settled:", paymentInfo);
```

## 4. 多网络示例（EVM + Solana）
```ts
import { x402Client, wrapFetchWithPayment } from "@x402/fetch";
import { registerExactEvmScheme } from "@x402/evm/exact/client";
import { registerExactSvmScheme } from "@x402/svm/exact/client";
import { privateKeyToAccount } from "viem/accounts";
import { createKeyPairSignerFromBytes } from "@solana/kit";
import { base58 } from "@scure/base";

const evmSigner = privateKeyToAccount(process.env.EVM_PRIVATE_KEY as `0x${string}`);
const svmSigner = await createKeyPairSignerFromBytes(
  base58.decode(process.env.SOLANA_PRIVATE_KEY!)
);

const client = new x402Client();
registerExactEvmScheme(client, { signer: evmSigner });
registerExactSvmScheme(client, { signer: svmSigner });

const fetchWithPayment = wrapFetchWithPayment(fetch, client);
// 同一个 fetch 支持 EVM 与 Solana 付费请求
```

## 5. 常见错误处理
- “No scheme registered”：未为目标网络注册支付方案，检查 `registerExactEvmScheme` / `registerExactSvmScheme`。
- “Payment already attempted”：重试时支付已尝试，检查幂等或重试策略。
- 其他网络/签名错误：确认私钥、网络、金额与请求头。

## 6. 最佳实践
- 私钥放环境变量，不入库。
- 按需选择 Fetch 或 Axios，保持上层调用透明（自动处理 402）。
- 生产环境加超时、重试与日志；记录支付结算回执便于审计。
- 如需动态发现服务，可结合 Bazaar API（详见官方文档）。
"

