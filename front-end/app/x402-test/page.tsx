"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { X402Client, X402PaymentRequest } from "@/lib/x402-client";
import { 
  Wallet, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  ExternalLink,
  Info,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PaymentState {
  status: 'idle' | 'requesting' | 'payment-required' | 'paying' | 'success' | 'error';
  paymentRequest: X402PaymentRequest | null;
  response: any;
  error: string | null;
  signature: string | null;
}

export default function X402TestPage() {
  const [apiUrl, setApiUrl] = useState('/api/x402-test');
  const [walletAddress, setWalletAddress] = useState('');
  const [paymentState, setPaymentState] = useState<PaymentState>({
    status: 'idle',
    paymentRequest: null,
    response: null,
    error: null,
    signature: null,
  });

  const x402Client = new X402Client('https://api.devnet.solana.com');

  // 模拟连接钱包
  const connectWallet = useCallback(() => {
    // 生成模拟钱包地址
    const mockAddress = `Solana_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    setWalletAddress(mockAddress);
  }, []);

  // 发送请求
  const handleRequest = useCallback(async () => {
    if (!walletAddress) {
      setPaymentState({
        status: 'error',
        paymentRequest: null,
        response: null,
        error: 'Please connect wallet first',
        signature: null,
      });
      return;
    }

    setPaymentState({
      status: 'requesting',
      paymentRequest: null,
      response: null,
      error: null,
      signature: null,
    });

    try {
      const wallet = {
        publicKey: { toString: () => walletAddress },
        sendTransaction: async () => {
          // 模拟发送交易
          await new Promise(resolve => setTimeout(resolve, 1500));
          return `mock_signature_${Date.now()}`;
        },
      };

      const response = await x402Client.fetchWithPayment(
        apiUrl,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            test: true,
            timestamp: Date.now(),
          }),
        },
        wallet as any
      );

      const data = await response.json();

      setPaymentState({
        status: 'success',
        paymentRequest: paymentState.paymentRequest,
        response: data,
        error: null,
        signature: response.headers.get('X-Payment-Signature') || null,
      });
    } catch (error: any) {
      // 检查是否是 402 响应
      if (error.message?.includes('402') || error.message?.includes('Payment Required')) {
        try {
          // 尝试解析 402 响应
          const mockResponse = new Response(null, {
            status: 402,
            headers: {
              'X-Payment-Required': 'true',
              'X-Payment-Amount': '0.001',
              'X-Payment-Recipient': '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
              'X-Payment-Memo': 'X402 Test Payment',
              'X-Payment-Timestamp': Date.now().toString(),
            },
          });

          const paymentRequest = x402Client.parse402Response(mockResponse);
          
          setPaymentState({
            status: 'payment-required',
            paymentRequest,
            response: null,
            error: null,
            signature: null,
          });
        } catch (parseError: any) {
          setPaymentState({
            status: 'error',
            paymentRequest: null,
            response: null,
            error: parseError.message || 'Failed to parse payment request',
            signature: null,
          });
        }
      } else {
        setPaymentState({
          status: 'error',
          paymentRequest: null,
          response: null,
          error: error.message || 'Request failed',
          signature: null,
        });
      }
    }
  }, [apiUrl, walletAddress, x402Client, paymentState.paymentRequest]);

  // 处理支付
  const handlePayment = useCallback(async () => {
    if (!paymentState.paymentRequest || !walletAddress) return;

    setPaymentState(prev => ({ ...prev, status: 'paying' }));

    try {
      const wallet = {
        publicKey: { toString: () => walletAddress },
        sendTransaction: async () => {
          await new Promise(resolve => setTimeout(resolve, 1500));
          return `mock_signature_${Date.now()}`;
        },
      };

      const signature = await (x402Client as any).simulatePayment(
        paymentState.paymentRequest,
        wallet
      );

      // 支付后重新发送请求
      const response = await x402Client.fetchWithPayment(
        apiUrl,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Payment-Signature': signature,
            'X-Payment-Amount': paymentState.paymentRequest.amount.toString(),
            'X-Payment-Recipient': paymentState.paymentRequest.recipient,
          },
          body: JSON.stringify({
            test: true,
            timestamp: Date.now(),
          }),
        },
        wallet as any
      );

      const data = await response.json();

      setPaymentState({
        status: 'success',
        paymentRequest: paymentState.paymentRequest,
        response: data,
        error: null,
        signature,
      });
    } catch (error: any) {
      setPaymentState({
        status: 'error',
        paymentRequest: paymentState.paymentRequest,
        response: null,
        error: error.message || 'Payment failed',
        signature: null,
      });
    }
  }, [paymentState.paymentRequest, walletAddress, apiUrl, x402Client]);

  return (
    <div className="container mx-auto py-10 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-display font-bold">X402 支付协议测试</h1>
        <p className="text-muted-foreground">
          测试和验证 X402 支付协议的集成效果
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 配置面板 */}
        <Card>
          <CardHeader>
            <CardTitle>配置</CardTitle>
            <CardDescription>设置 API 端点和钱包连接</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api-url">API 端点</Label>
              <Input
                id="api-url"
                value={apiUrl}
                onChange={(e) => setApiUrl(e.target.value)}
                placeholder="/api/x402-test"
              />
            </div>

            <div className="space-y-2">
              <Label>钱包状态</Label>
              {walletAddress ? (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <code className="text-xs font-mono text-green-400 flex-1 truncate">
                    {walletAddress}
                  </code>
                </div>
              ) : (
                <Button
                  onClick={connectWallet}
                  className="w-full"
                  variant="outline"
                >
                  <Wallet className="mr-2 h-4 w-4" />
                  连接钱包（模拟）
                </Button>
              )}
            </div>

            <Button
              onClick={handleRequest}
              disabled={!walletAddress || paymentState.status === 'requesting' || paymentState.status === 'paying'}
              className="w-full"
            >
              {paymentState.status === 'requesting' || paymentState.status === 'paying' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {paymentState.status === 'requesting' ? '发送请求...' : '处理支付...'}
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  发送请求
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* 状态面板 */}
        <Card>
          <CardHeader>
            <CardTitle>状态</CardTitle>
            <CardDescription>当前请求和支付状态</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 状态指示器 */}
            <div className="flex items-center gap-2">
              <StatusBadge status={paymentState.status} />
              <span className="text-sm text-muted-foreground">
                {getStatusText(paymentState.status)}
              </span>
            </div>

            {/* 支付请求信息 */}
            {paymentState.paymentRequest && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="space-y-2">
                  <div className="font-semibold">支付请求</div>
                  <div className="text-xs space-y-1 font-mono">
                    <div>金额: {paymentState.paymentRequest.amount} SOL</div>
                    <div>收款地址: {paymentState.paymentRequest.recipient}</div>
                    {paymentState.paymentRequest.memo && (
                      <div>备注: {paymentState.paymentRequest.memo}</div>
                    )}
                  </div>
                  {paymentState.status === 'payment-required' && (
                    <Button
                      onClick={handlePayment}
                      size="sm"
                      className="mt-2 w-full"
                    >
                      <Zap className="mr-2 h-4 w-4" />
                      确认支付
                    </Button>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {/* 错误信息 */}
            {paymentState.error && (
              <Alert variant="destructive">
                <XCircle className="h-4 w-4" />
                <AlertDescription>{paymentState.error}</AlertDescription>
              </Alert>
            )}

            {/* 成功响应 */}
            {paymentState.status === 'success' && paymentState.response && (
              <Alert className="border-green-500/20 bg-green-500/10">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <AlertDescription className="space-y-2">
                  <div className="font-semibold text-green-400">请求成功</div>
                  {paymentState.signature && (
                    <div className="text-xs font-mono text-green-300">
                      签名: {paymentState.signature}
                    </div>
                  )}
                  <pre className="text-xs bg-background/50 p-2 rounded overflow-auto max-h-40">
                    {JSON.stringify(paymentState.response, null, 2)}
                  </pre>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 说明文档 */}
      <Card>
        <CardHeader>
          <CardTitle>测试说明</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          <div>
            <h3 className="font-semibold text-foreground mb-2">工作流程：</h3>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>连接钱包（当前为模拟钱包）</li>
              <li>点击"发送请求"按钮</li>
              <li>如果收到 402 响应，会显示支付请求</li>
              <li>确认支付后，请求会自动重试</li>
              <li>查看最终响应结果</li>
            </ol>
          </div>
          <div>
            <h3 className="font-semibold text-foreground mb-2">注意事项：</h3>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>当前使用模拟支付，不会产生真实交易</li>
              <li>需要配置后端 API 端点来测试真实的 402 响应</li>
              <li>实际集成时需要安装 @solana/web3.js 库</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: PaymentState['status'] }) {
  const variants = {
    idle: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    requesting: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'payment-required': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    paying: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    success: 'bg-green-500/20 text-green-400 border-green-500/30',
    error: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  return (
    <Badge className={cn('border', variants[status])}>
      {status.toUpperCase()}
    </Badge>
  );
}

function getStatusText(status: PaymentState['status']): string {
  const texts = {
    idle: '等待操作',
    requesting: '正在发送请求...',
    'payment-required': '需要支付',
    paying: '正在处理支付...',
    success: '请求成功',
    error: '发生错误',
  };
  return texts[status];
}


