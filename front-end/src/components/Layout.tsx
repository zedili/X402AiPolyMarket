"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Brain, Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { label: "MARKETS", href: "/" },
    { label: "PORTFOLIO", href: "/portfolio" },
    { label: "LEADERBOARD", href: "/leaderboard" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground overflow-x-hidden">
      {/* Background Elements */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[url('/images/hero-bg.jpg')] bg-cover bg-center opacity-20 mix-blend-screen" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/90 to-background" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="relative flex h-8 w-8 items-center justify-center rounded bg-primary/10 group-hover:bg-primary/20 transition-colors">
                <Brain className="h-5 w-5 text-primary animate-pulse" />
                <div className="absolute inset-0 rounded ring-1 ring-inset ring-primary/50 group-hover:ring-primary transition-all" />
              </div>
              <div className="flex flex-col">
                <span className="font-display font-bold text-lg tracking-wider leading-none text-white group-hover:text-primary transition-colors">
                  AI PREDICT
                </span>
                <span className="font-mono text-[10px] text-muted-foreground tracking-[0.2em] leading-none">
                  MARKET
                </span>
              </div>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "px-4 py-2 text-sm font-medium transition-all duration-200 relative group",
                    pathname === item.href
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {item.label}
                  {pathname === item.href && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary shadow-[0_0_10px_var(--color-primary)]" />
                  )}
                  <span className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-sm" />
                </Link>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex">
              <ConnectButton
                chainStatus="icon"
                showBalance={false}
                accountStatus="address"
              />
            </div>
            <button
              className="md:hidden p-2 text-muted-foreground hover:text-foreground"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-background/95 backdrop-blur-xl pt-20 px-4 md:hidden animate-in slide-in-from-top-10 duration-200">
          <nav className="flex flex-col gap-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "p-4 text-lg font-medium border border-border/50 rounded-lg transition-colors",
                  pathname === item.href
                    ? "bg-primary/10 text-primary border-primary/50"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                )}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="w-full mt-4">
              <ConnectButton
                chainStatus="none"
                showBalance={false}
                accountStatus="address"
              />
            </div>
          </nav>
        </div>
      )}

      {/* Main Content */}
      <main className="relative z-10 pt-16 min-h-[calc(100vh-64px)] flex flex-col">
        {children}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/40 bg-background/50 backdrop-blur-sm py-8 mt-auto">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Brain className="h-4 w-4" />
            <span>© 2025 AI PREDICT MARKET. Powered by Advanced AI.</span>
          </div>
          
          <div className="flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <a href="#" className="hover:text-primary transition-colors">ABOUT</a>
            <a href="#" className="hover:text-primary transition-colors">DOCS</a>
            <a href="#" className="hover:text-primary transition-colors">SUPPORT</a>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground/50 border border-border/30 px-3 py-1 rounded-full">
            <span>Made with Manus</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
