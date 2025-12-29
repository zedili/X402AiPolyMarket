"use client";

import { useState } from "react";
import MarketCard from "@/components/MarketCard";
import { MOCK_MARKETS } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Zap, Activity, Users, BrainCircuit } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const categories = ["ALL", "CRYPTO", "TECH", "STOCKS", "POLITICS"];

  const filteredMarkets = MOCK_MARKETS.filter(market => {
    const matchesCategory = selectedCategory === "ALL" || market.category === selectedCategory;
    const matchesSearch = market.question.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const stats = [
    { label: "TOTAL VOLUME", value: "$12.8M", icon: Activity, color: "text-blue-400" },
    { label: "ACTIVE MARKETS", value: "247", icon: Zap, color: "text-yellow-400" },
    { label: "AI ACCURACY", value: "87.3%", icon: BrainCircuit, color: "text-purple-400" },
    { label: "TOTAL TRADERS", value: "15.2K", icon: Users, color: "text-green-400" },
  ];

  return (
    <>
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="container relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono tracking-wider uppercase animate-fade-in">
              <BrainCircuit className="h-3 w-3" />
              AI-Powered Predictions
            </div>
            
            <h1 className="font-display font-bold text-4xl md:text-6xl lg:text-7xl leading-tight tracking-tight">
              Predict the Future with <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 animate-gradient-x">
                Artificial Intelligence
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Leverage cutting-edge AI models to analyze market trends and make informed predictions on crypto, tech, and global events.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Button size="lg" className="w-full sm:w-auto text-lg h-12 px-8 bg-primary hover:bg-primary/90 shadow-[0_0_20px_-5px_var(--color-primary)] transition-all hover:scale-105">
                <Zap className="mr-2 h-5 w-5" />
                EXPLORE MARKETS
              </Button>
              <Button size="lg" variant="outline" className="w-full sm:w-auto text-lg h-12 px-8 border-primary/50 text-primary hover:bg-primary/10 hover:text-primary hover:border-primary transition-all hover:scale-105">
                <Activity className="mr-2 h-5 w-5" />
                VIEW AI INSIGHTS
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y border-border/30 bg-background/30 backdrop-blur-sm">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="flex flex-col items-center md:items-start gap-2 group">
                <div className={cn("p-3 rounded-lg bg-background/50 border border-border/50 group-hover:border-primary/50 transition-colors", stat.color)}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div className="text-xs font-mono text-muted-foreground tracking-wider uppercase">
                  {stat.label}
                </div>
                <div className="text-2xl md:text-3xl font-display font-bold tracking-tight">
                  {stat.value}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Markets Section */}
      <section className="py-20 bg-gradient-to-b from-background to-background/95">
        <div className="container space-y-10">
          {/* Filters */}
          <div className="flex flex-col md:flex-row gap-6 justify-between items-center sticky top-20 z-30 py-4 bg-background/80 backdrop-blur-xl border-b border-border/30 -mx-4 px-4 md:mx-0 md:px-0 md:rounded-xl md:border">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search markets..." 
                className="pl-10 bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap border",
                    selectedCategory === category
                      ? "bg-primary/10 text-primary border-primary/50 shadow-[0_0_15px_-5px_var(--color-primary)]"
                      : "bg-background/50 text-muted-foreground border-border/50 hover:border-primary/30 hover:text-foreground"
                  )}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Market Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMarkets.map((market) => (
              <MarketCard key={market.id} market={market} />
            ))}
          </div>
          
          {filteredMarkets.length === 0 && (
            <div className="text-center py-20 text-muted-foreground">
              <p className="text-lg">No markets found matching your criteria.</p>
              <Button 
                variant="link" 
                onClick={() => {
                  setSelectedCategory("ALL");
                  setSearchQuery("");
                }}
                className="mt-2 text-primary"
              >
                Clear filters
              </Button>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

