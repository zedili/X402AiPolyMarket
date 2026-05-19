'use client';

import { useEffect, useRef } from 'react';
import { useAccount, useSignMessage } from 'wagmi';
import { useAuth } from './useAuth';
import { authApi } from '@/lib/api';

/**
 * Hook to automatically handle backend login/logout based on wallet connection status
 */
export function useWalletAuth() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { user, isAuthenticated, login, logout } = useAuth();
  const isProcessingRef = useRef(false);
  const lastAddressRef = useRef<string | undefined>(undefined);
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
    // 如果钱包未连接，检查是否需要登出
    if (!isConnected || !address) {
      // 如果之前有连接的钱包，现在断开了，执行登出
      if (lastAddressRef.current && isAuthenticated) {
        console.log('Wallet disconnected, logging out...');
        logout();
      }
      lastAddressRef.current = undefined;
      return;
    }

    // 如果用户之前拒绝了这个地址的签名，不再自动尝试
    if (rejectedAddressesRef.current.has(address.toLowerCase())) {
      return;
    }

    // 如果地址发生变化，先登出旧账户
    if (lastAddressRef.current && lastAddressRef.current !== address && isAuthenticated) {
      console.log('Wallet address changed, logging out old account...');
      logout();
      // 清除旧地址的拒绝记录
      rejectedAddressesRef.current.delete(lastAddressRef.current.toLowerCase());
    }

    // 如果钱包已连接但未登录，或者地址不匹配，执行登录
    const shouldLogin = 
      !isAuthenticated || 
      !user || 
      user.wallet_address.toLowerCase() !== address.toLowerCase();

    if (shouldLogin && !isProcessingRef.current) {
      isProcessingRef.current = true;
      lastAddressRef.current = address;

      const handleAutoLogin = async () => {
        try {
          console.log('Wallet connected, starting auto login...');
          
          // 1. 向后端请求 nonce
          const nonceResp = await authApi.getNonce({ wallet_address: address });

          // 2. 使用钱包对 nonce 进行签名
          const signature = await signMessageAsync({
            message: nonceResp.nonce,
          });

          // 3. 调用后端登录接口
          await login({
            wallet_address: address,
            nonce: nonceResp.nonce,
            signature,
          });

          console.log('Auto login successful');
          // 登录成功，清除拒绝记录
          rejectedAddressesRef.current.delete(address.toLowerCase());
        } catch (error: any) {
          console.error('Auto login failed:', error);
          // 如果用户拒绝签名，记录这个地址，不再自动尝试
          if (
            error?.message?.includes('User rejected') || 
            error?.message?.includes('user rejected') ||
            error?.code === 4001 ||
            error?.code === 'ACTION_REJECTED'
          ) {
            console.log('User rejected signature, will not auto-retry');
            rejectedAddressesRef.current.add(address.toLowerCase());
            lastAddressRef.current = undefined;
          }
        } finally {
          isProcessingRef.current = false;
        }
      };

      handleAutoLogin();
    } else if (isAuthenticated && user && user.wallet_address.toLowerCase() === address.toLowerCase()) {
      // 已经登录且地址匹配，更新引用
      lastAddressRef.current = address;
      // 清除拒绝记录（用户可能手动登录了）
      rejectedAddressesRef.current.delete(address.toLowerCase());
    }
  }, 
  [isConnected, address, isAuthenticated, user, login, logout, signMessageAsync] // 依赖项数组
);
}

