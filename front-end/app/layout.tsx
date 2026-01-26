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
          <WalletProvider>
            <ThemeProvider defaultTheme="light">
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

