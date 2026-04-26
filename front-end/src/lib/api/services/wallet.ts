// 钱包相关API
import { request } from '../client';
import type {
  WalletBalanceResponse,
  WalletTransactionRequest,
  WalletTransactionResponse,
  PaymentAIServiceRequest,
  PaymentAIServiceResponse,
} from '../types';

export const walletApi = {
  // 查询余额
  getBalance: (): Promise<WalletBalanceResponse> => {
    return request.get<WalletBalanceResponse>('/wallet/balance');
  },

  // 获取交易流水
  getTransactions: (params?: WalletTransactionRequest): Promise<WalletTransactionResponse> => {
    return request.get<WalletTransactionResponse>('/wallet/transactions', params);
  },

  // 支付AI服务费
  payAIService: (data: PaymentAIServiceRequest): Promise<PaymentAIServiceResponse> => {
    return request.post<PaymentAIServiceResponse>('/payment/ai-service', data);
  },
};


