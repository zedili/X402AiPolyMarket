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
  metadataBase: new URL("https://signal402.vercel.app"),
  title: "Signal402 — Pay-per-request market intelligence",
  description: "Live prediction-market snapshots and x402-gated AI reports on Arbitrum.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Signal402 — Pay-per-request market intelligence",
    description: "Live prediction-market snapshots and x402-gated AI reports on Arbitrum.",
    url: "/",
    siteName: "Signal402",
    type: "website",
    images: [
      {
        url: "/images/signal402-project-cover.png",
        width: 1254,
        height: 1254,
        alt: "Signal402 — x402 market intelligence on Arbitrum",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Signal402 — Pay-per-request market intelligence",
    description: "Live prediction-market snapshots and x402-gated AI reports on Arbitrum.",
    images: ["/images/signal402-project-cover.png"],
  },
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

