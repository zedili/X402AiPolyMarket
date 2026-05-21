'use client';
// 使用 useRef ，在组件多次渲染之间保持对某个值的引用，而不会触发组件重新渲染。
// *** 适用于需要存储可变值但不需要在 UI 中反映这些变化的场景。
import { useEffect, useRef } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useAuth } from './useAuth';
import { authApi } from '@/lib/api';
import { x402Client } from '@/lib/x402-client';


/**
 * Hook to automatically handle backend login/logout based on wallet connection status
 */
export function useWalletAuthSolana() {
  const { publicKey, connected, signMessage, sendTransaction } = useWallet();
  const { user, isAuthenticated, login, logout } = useAuth();
  const isProcessingRef = useRef(false);
  // const lastAddressRef = useRef<string | undefined>(undefined);
  const rejectedAddressesRef = useRef<Set<string>>(new Set());

  // 
  /**
   * useEffect 执行时机：
   * 1、组件首次挂载到页面后会执行一次。
   * 2、依赖项数组发生变化时：react 会比较依赖项数组中的值，只要有一个不同，就会重新执行 useEffect 中的函数。
   * 3、组件卸载钱会执行清理函数（如果回调函数返回一个清理函数）。
   * 
   */
  useEffect(() => {
    // 1、断开连接时，登出
    if (!connected || !publicKey) {
      // 如果之前有连接的钱包，现在断开了，执行登出
      if (isAuthenticated) {
        console.log('Wallet disconnected, logging out...');
        logout();
      }

      // 断开连接，清空钱包信息
      x402Client.setWalletAuthInfo(null);

      return;
    }

    // 获取当前地址
    const address = publicKey?.toBase58();

    // 2、如果已经连接，并且地址没有发生变化，且已经认证了，不需要重复登录
    if (isAuthenticated && user && user.wallet_address.toLowerCase() === address.toLowerCase()){
      // 更新钱包信息（可能 signMessage 和 sendTransaction 发生了变化） 
      x402Client.setWalletAuthInfo({
        publicKey,
        connected,
        sendTransaction,
        signMessage,
       });

        return;
    }

    // 3、执行自动登录
    if (!isProcessingRef.current) {
      isProcessingRef.current = true;
    
      const handleAutoLogin = async () => {
        try {
          console.log('Wallet connected, starting auto login...');
          
          // 1. 向后端请求 nonce
          const nonceResp = await authApi.getNonce({ wallet_address: address, chain_type: 'SOLANA' });
                    // 2. 签名（Phantom 弹窗）
          const encodeMessage = new TextEncoder().encode(nonceResp.nonce);
          // 当钱包未连接或者钱包支持签名的时候，signMessage = undefined，此时调用 signMessage 会抛出错误，所以这里需要判断一下
          if (!signMessage) {
            console.log('Wallet does not support signing, skipping auto login...');
            return;
          }
          //3、使用钱包对 nonce 进行签名
          const signeData = await signMessage( encodeMessage);
          // 转换签名为 Base64 字符串
          const signatureBase64 = Buffer.from(signeData).toString('base64');
          // 4. 调用后端登录接口
          await login({
            wallet_address: address,
            nonce: nonceResp.nonce,
            signature: signatureBase64,
            chain_type: 'SOLANA',
          });
          console.log('Auto login successful');

          // 登录成功后，设置 AI API 的钱包认证信息
          x402Client.setWalletAuthInfo({
            publicKey,
            connected,
            sendTransaction,
            signMessage,
          });

        }catch (error: any) { 
          console.error('Auto login failed:', error);
        }finally {
          isProcessingRef.current = false;
        }
      }

      handleAutoLogin();

      

    }

  }, 
  [connected, publicKey, isAuthenticated, user, login, logout, signMessage] // 依赖项数组
);
}


