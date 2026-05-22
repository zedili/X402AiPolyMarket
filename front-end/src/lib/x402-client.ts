/**
 * X402 支付协议客户端
 * 用于处理 HTTP 402 Payment Required 响应和 Solana 支付
 */


/**
 * x402 是由 coinbase 和 solana 联合推动的一种标准，旨在解决 web3 中的微支付（MicroPayments）问题：
 * 1. 低费率需求： x402 的典型场景是 “每次api调用支付几分钱”。在以太坊主网。Gas 可能高达几美元，这使得微支付在经济上不可行。
 * 2. solana 的优势： solana的交易费用极低（通常低于 $0.001）且确认速度快（~400ms），非常适合这种高频、小额的 “按次付费”场景。
 * 
 */

/**
 @solana/web3.js：legacy,旧版，面向对象 
 @solana/kit: 新版，面向函数式、模块化、强类型支持、性能显著提升
 */
// import { airdropFactory,
//   appendTransactionMessageInstructions,
//   assertIsTransactionWithBlockhashLifetime,
//   createSolanaRpc,
//   createSolanaRpcSubscriptions,
//   createTransactionMessage,
//   generateKeyPairSigner,
//   getSignatureFromTransaction,
//   lamports,
//   pipe,
//   sendAndConfirmTransactionFactory,
//   setTransactionMessageFeePayerSigner,
//   setTransactionMessageLifetimeUsingBlockhash,
//   signTransactionMessageWithSigners, } from '@solana/kit';
  import { getTransferSolInstruction } from "@solana-program/system";
  import { getAddMemoInstruction  } from "@solana-program/memo";

  // 引入 web3.js 用于适配 wallet adapter
  import { Connection, PublicKey, Transaction, SystemProgram, } from '@solana/web3.js';

  import { createMemoInstruction  } from "@solana/spl-memo"

// 全局保存钱包适配器实例，供 DeepSeek API 调用时使用
let walletAdapter: WalletAdapter | null = null;


export interface X402PaymentRequest {
  amount: number; // SOL 数量
  recipient: string; // 收款地址
  memo?: string; // 备注信息
  timestamp?: number; // 时间戳
}

// 定义 wallet adapter 接口，简化版本
export interface WalletAdapter {
  publicKey: PublicKey | null;
  connected: boolean;
  sendTransaction: (transaction: Transaction, connection: Connection, options?: any) => Promise<string>;
  signMessage?: (message: Uint8Array) => Promise<Uint8Array>;
}

// 定义登出回调类型
type LogoutCallback = () => void;
let onLogoutRequired: LogoutCallback | null = null;

export class X402Client {
  // mainnet	https://api.mainnet.solana.com
  // devnet	https://api.devnet.solana.com
  private rpcUrl: string;
  private wsUrl: string;
  private connection: Connection;

  constructor(rpcUrl: string = 'https://api.devnet.solana.com', wsUrl: string = 'ws://api.devnet.solana.com') {
    this.rpcUrl = rpcUrl;
    this.wsUrl = wsUrl;
    this.connection = new Connection(rpcUrl);
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
      console.log('X402Client: Triggering logout due to auth error...');
      onLogoutRequired();
    } else {
      console.warn('X402Client: No logout handler registered.');
    }
    
    // 同时清空本地的钱包适配器引用
    this.setWalletAuthInfo(null);
  }

  setWalletAuthInfo(adapter: WalletAdapter | null = null) {
    walletAdapter = adapter;
  }

  getWalletAuthInfo() { return walletAdapter; }

  /**
   * 处理 HTTP 402 响应，提取支付信息
   */
  parse402Response(response: Response): X402PaymentRequest | null {
    if (response.status !== 402) {
      return null;
    }

    const amount = response.headers.get('X-Payment-Amount');
    const recipient = response.headers.get('X-Payment-Recipient');
    const memo = response.headers.get('X-Payment-Memo');
    const timestamp = response.headers.get('X-Payment-Timestamp');
    const currency = response.headers.get('X-Payment-Currency');
    
    // 只支持 SOL 支付，确保响应中指定的货币类型正确
    if (currency && currency !== 'SOL') {
      throw new Error('Invalid 402 response: currency is not SOL');
    }

    // 确保响应中包含支付信息
    if (!amount || !recipient) {
      throw new Error('Invalid 402 response: missing payment information');
    }

    if (!amount || !recipient) {
      throw new Error('Invalid 402 response: missing payment information');
    }

    if (!memo) {
      throw new Error('Invalid 402 response: missing memo');
    }

    if (!timestamp) {
      throw new Error('Invalid 402 response: missing timestamp');
    }

    return {
      amount: parseFloat(amount),
      recipient,
      memo: memo || undefined,
      timestamp: timestamp ? parseInt(timestamp, 10) : undefined,
    };
  }

  /**
   * 发送带支付的请求
   */
  async fetchWithPayment(
    url: string,
    options: RequestInit = {},
  ): Promise<Response> {
    // 1、第一次尝试请求
    let response = await fetch(url, options);

    // 2、如果是 404，执行支付流程
    if (response.status === 402) {
      const paymentRequest = this.parse402Response(response);
      if (!paymentRequest) {
        throw new Error('Failed to parse payment request');
      }

      // console.log('Payment required:', paymentRequest);

      // 3、调用 solana/kit 创建并发送交易，获取真实签名
      const [signature, memo] = await this.createAndSendTransaction(paymentRequest);

      if (!signature) {
        throw new Error('Failed to create payment transaction');
      }
      console.log('Payment with signature:', signature);

      // 4、支付完成后，携带签名，重新发送原始请求
      const headers = new Headers(options.headers);
      headers.set('X-Payment-Signature', signature);
      headers.set('X-Payment-Amount', paymentRequest.amount.toString());
      headers.set('X-Payment-Recipient', paymentRequest.recipient);
      headers.set('X-Payment-Memo', memo);

      response = await fetch(url, {
        ...options,
        headers,
      });
    }

    // if (response.ok) {
    //   const responseClone = response.clone();
    //   const data = await responseClone.json();
    //   if (data.code === 1002) {   // 登录过期
    //     // 重置钱包认证信息，触发前端登录流程
    //     this.triggerLogout(); // 触发全局登出
    //     throw new Error('Session expired. Please reconnect wallet.');
    //   }
    //   throw new Error(`HTTP error! status: ${response}`);
    // }
    return response;
  }



  private async createAndSendTransaction(
    paymentRequest: X402PaymentRequest,
  ): Promise<[string, string]> {

    if (paymentRequest.memo === undefined) {
      throw new Error('Payment request must include a memo');
    }

    if (paymentRequest.timestamp === undefined) {
      throw new Error('Payment request must include a timestamp');
    }

    walletAdapter = this.getWalletAuthInfo();

    if (walletAdapter == null || walletAdapter.publicKey == null) {
      throw new Error('Wallet not connected. Please connect your Solana wallet.');
    }

    if (paymentRequest.amount <= 0) {
      throw new Error('Payment amount must be greater than zero');
    }

    const LAMPORT_PER_SOL = 1_000_000_000;
    const amountInLamports = Math.floor(paymentRequest.amount * LAMPORT_PER_SOL);

    const senderPublicKey = walletAdapter.publicKey;
    const recipientPublicKey = new PublicKey(paymentRequest.recipient);

    // 1、获取最新的 blockhash
    const { blockhash} = await this.connection.getLatestBlockhash();

    // 2、创建交易对象
    // 为了更好的兼容性，使用 @solana/web3.js 创建交易 （虽然 @solana/kit 更现代化，但在某些环境下可能存在兼容性问题）
    // wallet adapter 原生支持 @solana/web3.js
    const transaction = new Transaction();
    // 设置 blockhash 和 feePayer
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = senderPublicKey;

    // 3、添加转账指令
    // 使用 web3.js 的 SystemProgram.transfer 指令创建转账
    const transferInstruction = SystemProgram.transfer({
          fromPubkey: senderPublicKey,
          toPubkey: recipientPublicKey,
          lamports: amountInLamports,
        })
    transaction.add(transferInstruction);

    // 4、添加 memo 指令
    if (paymentRequest.memo) {
      transaction.add(
          createMemoInstruction(paymentRequest.memo)
      );
    }

    // 5、模拟交易判断是否可能成功，避免用户支付后交易失败的情况；提高链上成功率
     try {
      const simResult = await this.connection.simulateTransaction(transaction);
      
      if (simResult.value.err) {
        // 交易模拟失败，抛出错误，阻止后续的支付和交易发送
        console.error('Transaction simulation failed:', simResult.value.err);
        console.error('Simulation Logs:', simResult.value.logs);
        // 尝试解析常见的错误原因
        let errorMsg = 'Transaction simulation failed.';
        if (simResult.value.err === 'AccountNotFound') {
          errorMsg = 'Simulation failed: Account not found (Check recipient address).';
        } else if (JSON.stringify(simResult.value.err).includes('insufficient funds')) {
          errorMsg = 'Simulation failed: Insufficient funds for rent or transaction fees.';
        }
       throw new Error(`${errorMsg} Details: ${JSON.stringify(simResult.value.err)}`);
      }
    } catch (error) {
      console.error('Error simulating transaction:', error);
      throw error;
    }

    // 5、通过 wallet adapter 发送交易
    // sendTransaction 会自动处理处理签名和广播
    try {
      const signature = await walletAdapter?.sendTransaction(transaction, this.connection,
        {
          skipPreflight: true   // 让钱包跳过预检：发送交易前已经进行了模拟交易检查，避免重复检查，提高效率   **实际没有效果（开发环境下，钱包会提示：transaction reverted during simulation. Funds may be lost if submitted）
        });
       // 6、等待交易确认
      await this.connection.confirmTransaction(signature, 'confirmed');
      return [signature, paymentRequest.memo];
    } catch (error) {
      console.error('Error sending transaction:', error);
      throw error;
    }
  
   
    // 这里使用 @solana/kit 支付的示例实现
    // await this.createAndSendTransactionByKit(paymentRequest);
    // throw new Error('Real payment not implemented yet');
  }


  // 使用 @solana/kit 创建并发送交易的示例实现
  // private async createAndSendTransactionByKit(paymentRequest: X402PaymentRequest) {
  //   const rpc = createSolanaRpc(this.rpcUrl);
  //   const rpcSubscriptions = createSolanaRpcSubscriptions(this.wsUrl);

  //   const sender = await generateKeyPairSigner();
  //   const recipient = await generateKeyPairSigner();

  //   const LAMPORTS_PER_SOL = 1000000000n;
  //   const transferAmount = lamports(LAMPORTS_PER_SOL / 100n); // 0.01 SOL

  //   await airdropFactory({ rpc, rpcSubscriptions })({
  //     recipientAddress: sender.address,
  //     lamports: lamports(LAMPORTS_PER_SOL), // 1 SOL
  //     commitment: "confirmed",
  //   });


  //   const memoInstruction = getAddMemoInstruction({
  //     memo: paymentRequest.memo || "X402 Payment",
  //   });


  //   const transferInstruction = getTransferSolInstruction({
  //     source: sender,
  //     destination: recipient.address,
  //     amount: transferAmount,
  //   });

  //   const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();
  //   const transactionMessage = pipe(
  //     createTransactionMessage({ version: 0 }),
  //     (tx) => setTransactionMessageFeePayerSigner(sender, tx),
  //     (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
  //     (tx) => appendTransactionMessageInstructions([transferInstruction], tx),
  //     (tx) => appendTransactionMessageInstructions([memoInstruction], tx)
  //   );

  //   const signedTransaction = await signTransactionMessageWithSigners(transactionMessage);
  //   // 因为 ==> 
  //   // signTransactionMessageWithSigners 返回的交易类型，其生命周期可能是：
  //   // transactionBlockhashLifetime 或 transactionDurableNonceLifetime
  //   //  是一个联合类型（union type）
  //   //  而且 ==> sendAndConfirmTransactionFactory 需要 transactionBlockhashLifetime 类型的交易
  //   //  
  //   //  因此，这里需要使用 assertIsTransactionWithBlockhashLifetime
  //   //  对交易的生命周期类型（lifetime）进行进行收窄（typeNarrowing）
  //   assertIsTransactionWithBlockhashLifetime(signedTransaction);
  //   await sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions })(
  //     signedTransaction,
  //     { commitment: "confirmed" }
  //   );
  //   const transactionSignature = getSignatureFromTransaction(signedTransaction);
  //   console.log("Transaction Signature:", transactionSignature);
  // }

  /**
   * 验证支付状态（模拟）
   */
  async verifyPayment(signature: string): Promise<boolean> {
    // 模拟验证
    await new Promise(resolve => setTimeout(resolve, 500));
    return signature.startsWith('mock_');
  }
}

export const x402Client = new X402Client();


