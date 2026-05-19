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
import { airdropFactory,
  appendTransactionMessageInstructions,
  assertIsTransactionWithBlockhashLifetime,
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  createTransactionMessage,
  generateKeyPairSigner,
  getSignatureFromTransaction,
  lamports,
  pipe,
  sendAndConfirmTransactionFactory,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  signTransactionMessageWithSigners, } from '@solana/kit';
  import { getTransferSolInstruction } from "@solana-program/system";
  import { getAddMemoInstruction  } from "@solana-program/memo";

export interface X402PaymentRequest {
  amount: number; // SOL 数量
  recipient: string; // 收款地址
  memo?: string; // 备注信息
  timestamp?: number; // 时间戳
}

export interface WalletAdapter {
  publicKey: { toString: () => string };
  sendTransaction: (transaction: any, connection: any) => Promise<string>;
}

export class X402Client {
  // mainnet	https://api.mainnet.solana.com
  // devnet	https://api.devnet.solana.com
  private rpcUrl: string;
  private wsUrl: string;

  constructor(rpcUrl: string = 'https://api.devnet.solana.com', wsUrl: string = 'ws://api.devnet.solana.com') {
    this.rpcUrl = rpcUrl;
    this.wsUrl = wsUrl;
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
    const timestamp = response.headers.get('X-Payment-Timestamp');

    if (!amount || !recipient) {
      throw new Error('Invalid 402 response: missing payment information');
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
   * 注意：这是一个简化版本，实际需要 Solana Web3.js 库
   */
  async fetchWithPayment(
    url: string,
    options: RequestInit = {},
    wallet: WalletAdapter | null = null
  ): Promise<Response> {
    // 第一次请求
    let response = await fetch(url, options);

    // 如果是 402，需要支付
    if (response.status === 402) {
      const paymentRequest = this.parse402Response(response);
      if (!paymentRequest) {
        throw new Error('Failed to parse payment request');
      }

      console.log('Payment required:', paymentRequest);

      if (!wallet) {
        throw new Error('Wallet not connected. Please connect your Solana wallet.');
      }

      // 这里应该创建并发送 Solana 交易
      // 由于需要 @solana/web3.js，我们先用模拟的方式
      // const mockSignature = await this.simulatePayment(paymentRequest, wallet);

      // 调用 solana/kit 创建并发送交易，获取真实签名
      const signature = await this.createRealPayment(paymentRequest, wallet);

      if (!signature) {
        throw new Error('Failed to create payment transaction');
      }
      console.log('Payment with signature:', signature);

      // 支付完成后，重新发送原始请求
      // 在请求头中包含交易签名作为支付证明
      const headers = new Headers(options.headers);
      headers.set('X-Payment-Signature', signature);
      headers.set('X-Payment-Amount', paymentRequest.amount.toString());
      headers.set('X-Payment-Recipient', paymentRequest.recipient);

      response = await fetch(url, {
        ...options,
        headers,
      });
    }

    return response;
  }

  /**
   * 模拟支付（用于测试）
   * 实际实现需要使用 @solana/web3.js 创建真实交易
   
   */
  private async simulatePayment(
    paymentRequest: X402PaymentRequest,
    wallet: WalletAdapter
  ): Promise<string> {
    // 模拟支付延迟
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 生成模拟签名
    const mockSignature = `mock_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    console.log(`[X402Client] Simulated payment:`, {
      from: wallet.publicKey.toString(),
      to: paymentRequest.recipient,
      amount: paymentRequest.amount,
      signature: mockSignature,
    });

    return mockSignature;
  }

  private async createRealPayment(
    paymentRequest: X402PaymentRequest,
    wallet: WalletAdapter
  ): Promise<string> {

    if (paymentRequest.memo === undefined) {
      throw new Error('Payment request must include a memo');
    }

    // 这里使用 @solana/kit 创建并发送交易
    const rpc = createSolanaRpc(this.rpcUrl);
    const rpcSubscriptions = createSolanaRpcSubscriptions(this.wsUrl);

    const sender = await generateKeyPairSigner();
    const recipient = await generateKeyPairSigner();

    const LAMPORTS_PER_SOL = 1_000_000_000n;
    const transferAmount = lamports(LAMPORTS_PER_SOL / 100n); // 0.01 SOL

    await airdropFactory({ rpc, rpcSubscriptions })({
      recipientAddress: sender.address,
      lamports: lamports(LAMPORTS_PER_SOL), // 1 SOL
      commitment: "confirmed",
    });


    const memoInstruction = getAddMemoInstruction({
      memo: paymentRequest.memo,
    });


    const transferInstruction = getTransferSolInstruction({
      source: sender,
      destination: recipient.address,
      amount: transferAmount,
    });

    const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();
    const transactionMessage = pipe(
      createTransactionMessage({ version: 0 }),
      (tx) => setTransactionMessageFeePayerSigner(sender, tx),
      (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
      (tx) => appendTransactionMessageInstructions([transferInstruction], tx),
      (tx) => appendTransactionMessageInstructions([memoInstruction], tx),
    );

    const signedTransaction =
      await signTransactionMessageWithSigners(transactionMessage);
      // 因为 ==> 
      // signTransactionMessageWithSigners 返回的交易类型，其生命周期可能是：
      // transactionBlockhashLifetime 或 transactionDurableNonceLifetime
      //  是一个联合类型（union type）
      //  而且 ==> sendAndConfirmTransactionFactory 需要 transactionBlockhashLifetime 类型的交易
      //  
      //  因此，这里需要使用 assertIsTransactionWithBlockhashLifetime
      //  对交易的生命周期类型（lifetime）进行进行收窄（typeNarrowing）
    assertIsTransactionWithBlockhashLifetime(signedTransaction);  
    await sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions })(
      signedTransaction,
      { commitment: "confirmed" },
    );
    const transactionSignature = getSignatureFromTransaction(signedTransaction);
    console.log("Transaction Signature:", transactionSignature);
     
    throw new Error('Real payment not implemented yet');
  }

  /**
   * 验证支付状态（模拟）
   */
  async verifyPayment(signature: string): Promise<boolean> {
    // 模拟验证
    await new Promise(resolve => setTimeout(resolve, 500));
    return signature.startsWith('mock_');
  }
}


