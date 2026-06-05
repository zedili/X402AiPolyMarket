'use client';

import { useWalletAuth } from '@/hooks/useWalletAuth';
import { useWalletAuthSolana  } from '@/hooks/useWalletAuthSolana';

/**
 * Component to handle automatic wallet authentication
 * This component uses the useWalletAuth hook to automatically
 * login when wallet connects and logout when wallet disconnects
 */
export default function WalletAuthHandler() {
  useWalletAuth();  // metamask 等 EVM 钱包的认证处理
  // useWalletAuthSolana();   // solana 钱包的认证处理
  return null;
}

