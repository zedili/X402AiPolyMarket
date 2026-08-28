'use client';

import { Loader2, WalletCards } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { X402_CHAIN_ID } from '@/lib/x402/constants';
import { useWallet } from '@/providers/wallet-provider';

export function WalletButton({ className }: { className?: string }) {
  const {
    address,
    chainId,
    isConnected,
    isConnecting,
    connect,
    switchToArbitrumSepolia,
  } = useWallet();
  const [error, setError] = useState<string>();

  const handleClick = async () => {
    setError(undefined);
    try {
      if (!isConnected) await connect();
      else if (chainId !== X402_CHAIN_ID) await switchToArbitrumSepolia();
    } catch (walletError) {
      setError(walletError instanceof Error ? walletError.message : 'Wallet request failed');
    }
  };

  const label = isConnecting
    ? 'Connecting…'
    : !isConnected
      ? 'Connect wallet'
      : chainId !== X402_CHAIN_ID
        ? 'Switch to Arbitrum'
        : `${address?.slice(0, 6)}…${address?.slice(-4)}`;

  return (
    <div className={className} title={error}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleClick}
        disabled={isConnecting}
        aria-label={error ? `${label}. ${error}` : label}
      >
        {isConnecting ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <WalletCards className="mr-2 h-4 w-4" />
        )}
        {label}
      </Button>
    </div>
  );
}
