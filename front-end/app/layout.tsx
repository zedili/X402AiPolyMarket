import type { Metadata } from "next";
import React from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import ErrorBoundary from "@/components/ErrorBoundary";
import Layout from "@/components/Layout";
import { WalletProvider } from "@/providers/wallet-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Signal402 — Pay-per-request market intelligence",
  description: "Live prediction-market snapshots and x402-gated AI reports on Arbitrum.",
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
          <WalletProvider>
            <ThemeProvider defaultTheme="light" switchable={true}>
              <TooltipProvider>
                <Toaster />
                <Layout>{children}</Layout>
              </TooltipProvider>
            </ThemeProvider>
          </WalletProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}

