import { NextRequest, NextResponse } from 'next/server';

/**
 * X402 测试 API 端点
 * 模拟返回 HTTP 402 Payment Required 响应
 */
export async function POST(request: NextRequest) {
  // 检查是否已经支付（通过请求头中的签名验证）
  const paymentSignature = request.headers.get('X-Payment-Signature');
  const paymentAmount = request.headers.get('X-Payment-Amount');
  const paymentRecipient = request.headers.get('X-Payment-Recipient');

  // 如果已经支付，返回成功响应
  if (paymentSignature && paymentAmount && paymentRecipient) {
    // 这里应该验证 Solana 交易签名
    // 当前为模拟验证
    const isValid = paymentSignature.startsWith('mock_') || paymentSignature.length > 20;

    if (isValid) {
      return NextResponse.json({
        success: true,
        message: 'Payment verified successfully',
        data: {
          timestamp: Date.now(),
          payment: {
            signature: paymentSignature,
            amount: parseFloat(paymentAmount),
            recipient: paymentRecipient,
          },
          response: {
            prediction: 'AI prediction result here',
            confidence: 0.87,
            data: 'This is the actual API response after payment',
          },
        },
      });
    } else {
      return NextResponse.json(
        {
          error: 'Invalid payment signature',
        },
        { status: 402 }
      );
    }
  }

  // 返回 402 Payment Required 响应
  const paymentRequest = {
    amount: 0.001, // 0.001 SOL
    recipient: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU', // 示例 Solana 地址
    memo: 'X402 Test Payment',
    timestamp: Date.now(),
  };

  return NextResponse.json(
    {
      error: 'Payment Required',
      message: 'This service requires payment. Please send the specified amount to the recipient address.',
      payment: paymentRequest,
    },
    {
      status: 402,
      headers: {
        'X-Payment-Required': 'true',
        'X-Payment-Amount': paymentRequest.amount.toString(),
        'X-Payment-Recipient': paymentRequest.recipient,
        'X-Payment-Memo': paymentRequest.memo,
        'X-Payment-Timestamp': paymentRequest.timestamp.toString(),
      },
    }
  );
}

// 支持 GET 请求用于测试
export async function GET(request: NextRequest) {
  return POST(request);
}


