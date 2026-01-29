'use client';

import { useMemo } from 'react';
import { useAccount } from 'wagmi';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

export function WalletLogin() {
  const { address, isConnected } = useAccount();
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  const isSameUser = useMemo(() => {
    if (!address || !user) return false;
    return user.wallet_address.toLowerCase() === address.toLowerCase();
  }, [address, user]);

  // 钱包未连接
  if (!isConnected) {
    return null; // 不显示任何内容，因为ConnectButton会处理连接
  }

  // 正在登录中（自动登录流程）
  if (isLoading || (isConnected && !isAuthenticated)) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="hidden md:inline-flex text-xs"
        disabled
      >
        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
        Signing...
      </Button>
    );
  }

  // 已登录且地址匹配
  if (isAuthenticated && isSameUser) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="hidden md:inline-flex text-xs"
        onClick={logout}
      >
        Logout ({address.slice(0, 6)}...{address.slice(-4)})
      </Button>
    );
  }

  // 钱包已连接但地址不匹配（理论上不应该出现，因为会自动登录）
  return null;
}



