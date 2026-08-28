'use client';

import type { ClientEvmSigner } from '@x402/evm';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { Address, Hex, TypedData, TypedDataDomain } from 'viem';
import { createWalletClient, custom, getAddress, toHex } from 'viem';
import { arbitrumSepolia } from 'viem/chains';

import { X402_CHAIN_ID } from '@/lib/x402/constants';

type ProviderRequest = {
  method: string;
  params?: readonly unknown[] | object;
};

type BrowserEthereumProvider = {
  request(args: ProviderRequest): Promise<unknown>;
  on?(event: string, listener: (...args: unknown[]) => void): void;
  removeListener?(event: string, listener: (...args: unknown[]) => void): void;
};

declare global {
  interface Window {
    ethereum?: BrowserEthereumProvider;
  }
}

type WalletContextValue = {
  address?: Address;
  chainId?: number;
  isConnected: boolean;
  isConnecting: boolean;
  connect: () => Promise<Address>;
  switchToArbitrumSepolia: () => Promise<void>;
  signTypedData: ClientEvmSigner['signTypedData'];
};

const WalletContext = createContext<WalletContextValue | null>(null);

function getProvider() {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error('No injected EVM wallet found. Install MetaMask or Rabby.');
  }
  return window.ethereum;
}

function parseChainId(value: unknown) {
  if (typeof value === 'string') return Number.parseInt(value, 16);
  if (typeof value === 'number') return value;
  return undefined;
}

function firstAddress(value: unknown) {
  if (!Array.isArray(value) || typeof value[0] !== 'string') return undefined;
  return getAddress(value[0]);
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<Address>();
  const [chainId, setChainId] = useState<number>();
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    if (!window.ethereum) return;
    const provider = window.ethereum;

    const handleAccountsChanged = (...args: unknown[]) => {
      setAddress(firstAddress(args[0]));
    };
    const handleChainChanged = (...args: unknown[]) => {
      setChainId(parseChainId(args[0]));
    };
    const handleDisconnect = () => setAddress(undefined);

    Promise.all([
      provider.request({ method: 'eth_accounts' }),
      provider.request({ method: 'eth_chainId' }),
    ])
      .then(([accounts, currentChain]) => {
        setAddress(firstAddress(accounts));
        setChainId(parseChainId(currentChain));
      })
      .catch(() => {
        setAddress(undefined);
        setChainId(undefined);
      });

    provider.on?.('accountsChanged', handleAccountsChanged);
    provider.on?.('chainChanged', handleChainChanged);
    provider.on?.('disconnect', handleDisconnect);
    return () => {
      provider.removeListener?.('accountsChanged', handleAccountsChanged);
      provider.removeListener?.('chainChanged', handleChainChanged);
      provider.removeListener?.('disconnect', handleDisconnect);
    };
  }, []);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    try {
      const provider = getProvider();
      const accounts = await provider.request({ method: 'eth_requestAccounts' });
      const nextAddress = firstAddress(accounts);
      if (!nextAddress) throw new Error('The wallet returned no account.');
      setAddress(nextAddress);
      const currentChain = await provider.request({ method: 'eth_chainId' });
      setChainId(parseChainId(currentChain));
      return nextAddress;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const switchToArbitrumSepolia = useCallback(async () => {
    const provider = getProvider();
    const targetChain = toHex(X402_CHAIN_ID);
    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: targetChain }],
      });
    } catch (error) {
      const code =
        typeof error === 'object' && error !== null && 'code' in error
          ? Number(error.code)
          : undefined;
      if (code !== 4902) throw error;
      await provider.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: targetChain,
            chainName: 'Arbitrum Sepolia',
            nativeCurrency: {
              name: 'Arbitrum Sepolia Ether',
              symbol: 'ETH',
              decimals: 18,
            },
            rpcUrls: ['https://sepolia-rollup.arbitrum.io/rpc'],
            blockExplorerUrls: ['https://sepolia.arbiscan.io'],
          },
        ],
      });
    }
    setChainId(X402_CHAIN_ID);
  }, []);

  const signTypedData = useCallback<ClientEvmSigner['signTypedData']>(
    async (typedData) => {
      if (!address) throw new Error('Connect a wallet before signing.');
      const provider = getProvider();
      const walletClient = createWalletClient({
        account: address,
        chain: arbitrumSepolia,
        transport: custom(provider),
      });
      return walletClient.signTypedData({
        account: address,
        domain: typedData.domain as TypedDataDomain,
        types: typedData.types as TypedData,
        primaryType: typedData.primaryType,
        message: typedData.message,
      }) as Promise<Hex>;
    },
    [address],
  );

  const value = useMemo<WalletContextValue>(
    () => ({
      address,
      chainId,
      isConnected: Boolean(address),
      isConnecting,
      connect,
      switchToArbitrumSepolia,
      signTypedData,
    }),
    [address, chainId, connect, isConnecting, signTypedData, switchToArbitrumSepolia],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const wallet = useContext(WalletContext);
  if (!wallet) throw new Error('useWallet must be used inside WalletProvider.');
  return wallet;
}

