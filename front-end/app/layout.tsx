import type { Metadata } from "next";
import React from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import Layout from "@/components/Layout";
import WalletAuthHandler from "@/components/WalletAuthHandler";
import "./globals.css";
import '@solana/wallet-adapter-react-ui/styles.css';

// Metamask 连接使用的 provider
import { WalletProvider } from "@/providers/wallet-provider";
// Solana 钱包连接使用的 provider
import SolanaProviders from '@/providers/solana-provider';

export const metadata: Metadata = {
  title: "AI Predict Market",
  description: "Leverage cutting-edge AI models to analyze market trends and make informed predictions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
      <link rel="icon" href="/favicon.svg" />
      </head>
      <body>
        <ErrorBoundary>
          {/* <WalletProvider> */}
          <SolanaProviders>
            <ThemeProvider defaultTheme="light" switchable={true}>
              <TooltipProvider>
                <Toaster />
                <WalletAuthHandler />
                <Layout>{children}</Layout>
              </TooltipProvider>
            </ThemeProvider>
          </SolanaProviders>

          {/* </WalletProvider> */}
        </ErrorBoundary>
      </body>
    </html>
  );
}

