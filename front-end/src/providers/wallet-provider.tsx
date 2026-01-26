"use client";

import "@rainbow-me/rainbowkit/styles.css";
import { RainbowKitProvider, getDefaultConfig, lightTheme } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { mainnet, sepolia } from "wagmi/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React, { useMemo } from "react";

interface WalletProviderProps {
  children: React.ReactNode;
}

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "demo";

export function WalletProvider({ children }: WalletProviderProps) {
  const config = useMemo(
    () =>
      getDefaultConfig({
        appName: "AI Predict Market",
        projectId,
        chains: [mainnet, sepolia],
        ssr: true,
      }),
    []
  );

  const queryClient = useMemo(() => new QueryClient(), []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={lightTheme({
            borderRadius: "medium",
            accentColor: "#3b82f6",
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

