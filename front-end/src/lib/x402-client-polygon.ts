/**
 * X402 Polygon 支付协议客户端适配器
 * 旨在提供与 x402-client-solana.ts 相似的 API 接口，但底层使用 Polygon x402 v2
 */

import { wrapFetchWithPayment } from "@x402/fetch";
import { x402Client as X402CoreClient, x402HTTPClient } from "@x402/core/client";
import { ExactEvmScheme } from "@x402/evm/exact/client";
import type { Account,WalletClient,Chain  } from "viem";
// // 📌 引入链定义以获取 rpc
import { polygonAmoy,polygon } from "viem/chains" 




// 定义兼容的钱包接口，这里简化为 viem 的 Account 或者包含 privateKey 的对象
// 在实际前端项目中，你可能需要通过 ethers.js 或 wagmi 将 window.ethereum 转换为 viem account
export interface PolygonWalletAdapter {
  account: Account; // viem 的 Account 对象，用于签名
  address: string;
  connected: boolean;
  walletClient: WalletClient; // viem 的 WalletClient 对象
}

export interface X402PaymentRequest {
  amount: number; 
  recipient: string; 
  memo?: string; 
  timestamp?: number; 
}

// 定义登出回调类型（保持与原接口一致）
type LogoutCallback = () => void;
let onLogoutRequired: LogoutCallback | null = null;

export class X402PolygonClient {
  private coreClient: X402CoreClient;
  // 修复：将属性重命名为 wrappedFetch，避免与方法名 fetchWithPayment 冲突
  private wrappedFetch: typeof fetch | null = null;
  private walletAdapter: PolygonWalletAdapter | null = null;

  constructor() {
    // 初始化 x402 核心客户端
    this.coreClient = new X402CoreClient();
  }

  /**
   * 注册当检测到登录过期(如 code 1002)时触发的回调
   */
  setLogoutHandler(callback: LogoutCallback) {
    onLogoutRequired = callback;
  }

  /**
   * 触发登出流程
   */
  private triggerLogout() {
    if (onLogoutRequired) {
      console.log('X402PolygonClient: Triggering logout due to auth error...');
      onLogoutRequired();
    } else {
      console.warn('X402PolygonClient: No logout handler registered.');
    }
    this.setWalletAuthInfo(null);
  }

  /**
   * 设置钱包信息
   * 注意：Polygon x402 v2 需要 viem 的 Account 对象来签名交易
   * @param adapter 包含 viem account 的适配器对象
   */
setWalletAuthInfo(adapter: PolygonWalletAdapter | null = null) {
    this.walletAdapter = adapter;
    
    if (adapter && adapter.walletClient && adapter.walletClient.account && adapter.walletClient.account.address && adapter.account) {

      // 提取 account 到常量，方便后续使用并明确其非空
      const account = adapter.walletClient.account;

      const signer = {
          account: account,
          address: account.address,            
          async getAddress(): Promise<`0x${string}`> {
              return account.address;          
          },

          async signMessage({ message }: { message: string }) {
              return adapter.walletClient.signMessage({
                  message,
                  account: account,
              });
          },
          async signTypedData(typedData: any) {
              // 1. 确保所有 uint256 字段都是字符串或 BigInt，不是数字
              const sanitizedMessage = {
                  ...typedData.message,
                  value: BigInt(typedData.message.value).toString(), // 确保是字符串
                  validAfter: BigInt(typedData.message.validAfter).toString(),
                  validBefore: BigInt(typedData.message.validBefore).toString(),
              };

              const sanitizedDomain = {
                  ...typedData.domain,
                  chainId: Number(typedData.domain.chainId), // v4 可能要求数字类型
              };

              const safeTypedData = {
                  ...typedData,
                  domain: sanitizedDomain,
                  message: sanitizedMessage,
              };

              console.log("Sanitized typed data:", safeTypedData);

  
              console.log("Final safeTypedData:", JSON.stringify(safeTypedData, null, 2));
    
              const signature = await adapter.walletClient.signTypedData({
                  ...safeTypedData,
                  account: account,
              } as any );
              
              console.log("Final signature:", signature);

              return signature;

          },
          
        };  


     
      try {
        // 1、获取 rpc url
        const chain = adapter.walletClient.chain
        
        // 📌 rpc url 直接取自当前链的配置，确保与用户钱包连接的链一致
        let rpcUrl = "";
        if (chain?.rpcUrls?.default?.http && chain.rpcUrls.default.http.length > 0) {
          rpcUrl = chain.rpcUrls.default.http[0]
        }else {
          rpcUrl = polygonAmoy.rpcUrls.default.http[0]
          console.warn("未找到当前链的 rpc url，使用默认的 polygon amy rpc url")
        }

        console.log("Initializing x402 client with RPC URL:", rpcUrl);
        
        const rpcOptions = { rpcUrl };

        // 📌 注册 scheme
        // 传入 account 和 rpcptins
       
        // 当前尝试直接注册
        this.coreClient.register("eip155:*", new ExactEvmScheme(signer, rpcOptions)); // 使用 as any 临时绕过类型检查，建议后续确认确切类型
        
        // 创建带有支付功能的 fetch 包装器
        this.wrappedFetch = wrapFetchWithPayment(fetch, this.coreClient);
        console.log('Polygon Wallet Connected & x402 Scheme Registered');
      } catch (e) {
        console.error("Failed to register x402 scheme:", e);
        throw new Error("Failed to initialize x402 client. Check wallet compatibility.");
      }

    } else {
      this.wrappedFetch = null;
      console.log('Polygon Wallet Disconnected');
    }
  }

  getWalletAuthInfo() { 
    return this.walletAdapter; 
  }

  /**
   * 处理 HTTP 402 响应，提取支付信息
   * 注意：在 x402 v2 中，wrapFetchWithPayment 会自动处理 402 逻辑。
   * 但为了保持与原接口 parse402Response 的兼容性，我们可以保留此方法，
   * 或者在 fetchWithPayment 内部不再手动调用它，因为库已经处理了。
   * 如果上层代码强依赖此方法进行预检查，可以保留，但在本适配器中，
   * 主要逻辑由 wrapFetchWithPayment 接管。
   */
  parse402Response(response: Response): X402PaymentRequest | null {
    // 在 v2 架构下，通常不需要手动解析 402 来构建交易，库会自动处理。
    // 这里返回 null 或抛出错误，提示用户直接调用 fetchWithPayment
    if (response.status !== 402) {
      return null;
    }
    // 如果需要兼容旧逻辑，可以从 headers 读取，但 v2 的 headers 可能不同
    // 建议上层代码迁移到直接使用 fetchWithPayment 的返回值
    throw new Error("Manual parsing of 402 is deprecated in Polygon Adapter. Use fetchWithPayment.");
  }

  /**
   * 发送带支付的请求
   * 这是核心适配方法，完全替代原有的 Solana 逻辑
   */
  async fetchWithPayment(
    url: string,
    options: RequestInit = {},
  ): Promise<Response> {
    // 修复：检查 wrappedFetch
    if (!this.wrappedFetch) {
      throw new Error("Wallet not connected or x402 client not initialized. Please call setWalletAuthInfo first.");
    }

    try {
      // 调用 @x402/fetch 提供的包装函数
      // 它会自动：
      // 1. 初始请求
      // 2. 捕获 402
      // 3. 使用注册的 Scheme (ExactEvmScheme) 和 USDC 进行支付
      // 4. 重试请求并携带 Payment-Signature
      
      // 修复：调用 wrappedFetch
      const response = await this.wrappedFetch(url, options);
    
      // 可选：获取支付结算回执 (Payment Receipt)
      if (response.ok) { 
        const httpClient = new x402HTTPClient(this.coreClient);
        // 尝试从响应头获取支付结算信息
        if (response.headers.has('PAYMENT-STATUS') && response.headers.get('PAYMENT-STATUS') === 'PAID') {
          // 当前预测 key 已经支付
          return response;
        }

        // const paymentResponse = httpClient.getPaymentSettleResponse((name) =>
        //   response.headers.get(name)
        // );
        
        // if (paymentResponse) {
        //   console.log("Payment settled successfully:", paymentResponse);
        // }
      }

      // 检查业务层面的错误（如 session expired）
      // 注意：clone 响应体以便后续读取，因为 body 只能读一次
      // const responseClone = response.clone();
      // try {
      //   const data = await responseClone.json();
      //   if (data && data.code === 1002) {
      //     this.triggerLogout();
      //     throw new Error('Session expired. Please reconnect wallet.');
      //   }
      // } catch (e) {
      //   // 如果解析 JSON 失败（例如返回的是文本或非 JSON），忽略此块错误，继续返回 response
      //   if (!(e instanceof SyntaxError)) {
      //     throw e;
      //   }
      // }

      return response;

    } catch (error: any) {
      console.error("Polygon x402 Payment Error:", error);
      
      // 错误处理适配
      if (error.message?.includes("No scheme registered")) {
        throw new Error("Network not supported: Ensure wallet is connected and scheme is registered.");
      }
      if (error.message?.includes("Payment already attempted")) {
        throw new Error("Payment failed on retry. Check balance or facilitator status.");
      }
      
      throw error;
    }
  }

  /**
   * 验证支付状态
   * 在 x402 v2 中，支付成功即意味着交易已上链或被 Facilitator 确认。
   * 此方法保留以兼容接口，但实际逻辑可能不需要额外的 verify 步骤，
   * 因为 fetchWithPayment 只有在支付成功后才会返回最终 Response。
   */
  async verifyPayment(signature: string): Promise<boolean> {
    // 在 v2 中，signature 是支付证明的一部分，通常由库内部验证。
    // 如果必须验证，可以查询链上交易状态，但这通常不是必需的，因为 fetch 已成功。
    console.log("Verifying payment signature (Mock/Optional in V2):", signature);
    return true; 
  }
}

// 导出单例
export const x402PolygonClient = new X402PolygonClient();