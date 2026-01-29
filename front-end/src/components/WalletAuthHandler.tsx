'use client';

import { useWalletAuth } from '@/hooks/useWalletAuth';

/**
 * Component to handle automatic wallet authentication
 * This component uses the useWalletAuth hook to automatically
 * login when wallet connects and logout when wallet disconnects
 */
export default function WalletAuthHandler() {
  useWalletAuth();
  return null;
}

