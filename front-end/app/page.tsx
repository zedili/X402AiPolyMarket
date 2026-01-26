"use client";

import { useState } from "react";
import MarketCard from "@/components/MarketCard";
import { MOCK_MARKETS } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Zap, Activity, Users, BrainCircuit } from "lucide-react";
import { cn } from "@/lib/utils";
import TypeItText from "@/components/TypeItText";
import ParticlesBackground from "@/components/ParticlesBackground";
import AnimatedStatCard from "@/components/AnimatedStatCard";
import AnimatedMarketCard from "@/components/AnimatedMarketCard";
import { useFadeInUp, useSlideIn } from "@/hooks/useScrollAnimation";
import { useCallback } from "react";

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
    { label: "TOTAL VOLUME", value: 12.8, suffix: "M", prefix: "$", icon: Activity, color: "text-blue-400" },
    { label: "ACTIVE MARKETS", value: 247, icon: Zap, color: "text-yellow-400" },
    { label: "AI ACCURACY", value: 87.3, suffix: "%", icon: BrainCircuit, color: "text-purple-400" },
    { label: "TOTAL TRADERS", value: 15.2, suffix: "K", icon: Users, color: "text-green-400" },
  ];

  // Scroll animation refs
  const heroBadgeRef = useFadeInUp({ delay: 0.2 });
  const heroTitleRef = useFadeInUp({ delay: 0.4 });
  const heroSubtitleRef = useFadeInUp({ delay: 0.6 });
  const heroButtonsRef = useFadeInUp({ delay: 0.8 });
  const statsSectionRef = useSlideIn({ direction: "up", delay: 0.2 });
  const filtersRef = useFadeInUp({ delay: 0.1 });

  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  return (
    <>
      {/* 英雄区块 */}
      <section className="relative py-20 md:py-32 overflow-hidden min-h-[600px] flex items-center">
        {/* 粒子背景 */}
        <ParticlesBackground className="absolute inset-0" />
        
        <div className="container relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div 
              ref={heroBadgeRef as React.RefObject<HTMLDivElement>}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-mono tracking-wider uppercase"
            >
              <BrainCircuit className="h-3 w-3" />
              AI-Powered Predictions
            </div>
            
            <h1 
              ref={heroTitleRef as React.RefObject<HTMLHeadingElement>}
              className="font-display font-bold text-4xl md:text-6xl lg:text-7xl leading-tight tracking-tight flex flex-col items-center justify-center gap-3 text-balance text-center"
            >
              <span>Predict the Future with</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 animate-gradient-x w-full block">
                <TypeItText
                  strings={[
                    "Artificial Intelligence",
                    "Machine Learning",
                    "Deep Learning",
                    "Neural Networks",
                    "AI Predictions"
                  ]}
                  speed={60}
                  loop={true}
                  options={{ breakLines: false }}
                  className="block w-full text-center"
                />
              </span>
            </h1>
            
            <p 
              ref={heroSubtitleRef as React.RefObject<HTMLParagraphElement>}
              className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
            >
              Leverage cutting-edge AI models to analyze market trends and make informed predictions on crypto, tech, and global events.
            </p>
            
            <div 
              ref={heroButtonsRef as React.RefObject<HTMLDivElement>}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
            >
              <Button 
                size="lg" 
                className="w-full sm:w-auto text-lg h-12 px-8 bg-primary hover:bg-primary/90 shadow-[0_0_20px_-5px_var(--color-primary)] transition-all hover:scale-105"
                onClick={() => scrollTo("markets")}
              >
                <Zap className="mr-2 h-5 w-5" />
                EXPLORE MARKETS
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="w-full sm:w-auto text-lg h-12 px-8 border-primary/50 text-primary hover:bg-primary/10 hover:text-primary hover:border-primary transition-all hover:scale-105"
                onClick={() => scrollTo("insights")}
              >
                <Activity className="mr-2 h-5 w-5" />
                VIEW AI INSIGHTS
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 数据指标区 */}
      <section
        id="insights"
        className="relative py-16 border-y border-border/30 overflow-hidden"
      >
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1600&q=80')] bg-cover bg-center bg-fixed opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/90 to-background" />
        <div className="container">
          <div 
            ref={statsSectionRef as React.RefObject<HTMLDivElement>}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            {stats.map((stat, index) => (
              <AnimatedStatCard
                key={index}
                label={stat.label}
                value={stat.value}
                prefix={stat.prefix}
                suffix={stat.suffix}
                decimals={stat.suffix ? 1 : undefined}
                icon={stat.icon}
                color={stat.color}
                delay={index * 0.1}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 市场列表区 */}
      <section id="markets" className="py-20 bg-gradient-to-b from-background to-background/95">
        <div className="container space-y-10">
          {/* 筛选器 */}
          <div 
            ref={filtersRef as React.RefObject<HTMLDivElement>}
            className="flex flex-col md:flex-row gap-6 justify-between items-center sticky top-20 z-30 py-4 bg-background/80 backdrop-blur-xl border-b border-border/30 -mx-4 px-4 md:mx-0 md:px-0 md:rounded-xl md:border"
          >
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

          {/* 市场卡片网格 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMarkets.map((market, index) => (
              <AnimatedMarketCard
                key={market.id}
                market={market}
                index={index}
              />
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

      {/* 用户反馈 */}
      <section className="py-20 bg-background">
        <div className="container space-y-10">
          <div className="text-center space-y-3">
            <h2 className="text-3xl md:text-4xl font-display font-bold">用户反馈</h2>
            <p className="text-muted-foreground">真实用户对 AI 预测市场的体验分享</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: "Alice • 量化研究员", quote: "界面简洁、数据更新快，AI 预测给了我很好的参考。", accent: "from-cyan-400/20 via-blue-500/20 to-purple-500/20" },
              { name: "Bob • 风险经理", quote: "行情波动时能及时推送，移动端体验也很顺畅。", accent: "from-emerald-400/20 via-teal-500/20 to-blue-500/20" },
              { name: "Carol • 投资者", quote: "组合视图和胜率数据很直观，连接钱包交易也很方便。", accent: "from-amber-400/20 via-orange-500/20 to-pink-500/20" },
            ].map((item, idx) => (
              <div
                key={idx}
                className={`p-6 rounded-2xl border border-border/50 bg-gradient-to-br ${item.accent} backdrop-blur-sm shadow-[0_10px_30px_-15px_rgba(0,0,0,0.5)]`}
              >
                <div className="text-lg font-semibold text-foreground mb-2">{item.name}</div>
                <p className="text-muted-foreground leading-relaxed">{item.quote}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 常见问题 */}
      <section className="py-18 md:py-20 bg-gradient-to-b from-background to-background/95 border-t border-border/30">
        <div className="container space-y-8">
          <div className="text-center space-y-3">
            <h2 className="text-3xl md:text-4xl font-display font-bold">常见问题</h2>
            <p className="text-muted-foreground">快速了解平台的核心问题</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                q: "如何连接钱包进行交易？",
                a: "点击右上角 Connect Wallet，选择常用钱包，授权后即可下单买入/卖出。",
              },
              {
                q: "AI 预测的依据是什么？",
                a: "我们基于多模态行情与新闻数据，结合时间序列模型与合成指标生成预测倾向。",
              },
              {
                q: "资金和资产托管在哪里？",
                a: "资产留在你的钱包中，交易通过智能合约完成，我们不托管你的资金。",
              },
              {
                q: "手续费与结算方式？",
                a: "交易有少量协议费与 gas，结算按事件结果自动执行，收益直接回到你的钱包。",
              },
            ].map((item, idx) => (
              <div key={idx} className="p-5 rounded-2xl border border-border/50 bg-background/60 backdrop-blur">
                <div className="text-lg font-semibold mb-2">{item.q}</div>
                <p className="text-muted-foreground leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 联系我们 */}
      <section className="py-20 bg-background border-t border-border/30">
        <div className="container max-w-4xl mx-auto space-y-10">
          <div className="text-center space-y-3">
            <h2 className="text-3xl md:text-4xl font-display font-bold">联系我们</h2>
            <p className="text-muted-foreground">留下你的想法，我们会尽快回复</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4 p-6 rounded-2xl border border-border/50 bg-gradient-to-br from-primary/5 via-background to-background shadow-[0_10px_30px_-15px_rgba(0,0,0,0.5)]">
              <div className="text-lg font-semibold">联系表单</div>
              <form className="space-y-4">
                {[
                  { label: "姓名", type: "text", placeholder: "Your name" },
                  { label: "邮箱", type: "email", placeholder: "you@example.com" },
                ].map((field, idx) => (
                  <div key={idx} className="space-y-1">
                    <label className="text-sm text-muted-foreground">{field.label}</label>
                    <div className="relative group">
                      <input
                        type={field.type}
                        placeholder={field.placeholder}
                        className="w-full bg-transparent border border-border/50 rounded-lg px-3 py-2 focus:outline-none focus:border-transparent"
                      />
                      <span className="pointer-events-none absolute left-3 right-3 bottom-[6px] h-[2px] bg-gradient-to-r from-primary/30 via-primary to-primary/30 scale-x-0 origin-left transition-transform duration-300 group-focus-within:scale-x-100" />
                    </div>
                  </div>
                ))}
                <div className="space-y-1">
                  <label className="text-sm text-muted-foreground">留言</label>
                  <div className="relative group">
                    <textarea
                      rows={4}
                      placeholder="Tell us how we can help..."
                      className="w-full bg-transparent border border-border/50 rounded-lg px-3 py-2 focus:outline-none focus:border-transparent"
                    />
                    <span className="pointer-events-none absolute left-3 right-3 bottom-[6px] h-[2px] bg-gradient-to-r from-primary/30 via-primary to-primary/30 scale-x-0 origin-left transition-transform duration-300 group-focus-within:scale-x-100" />
                  </div>
                </div>
                <Button type="button" className="w-full">提交</Button>
              </form>
            </div>
            <div className="p-6 rounded-2xl border border-border/50 bg-background/60 backdrop-blur space-y-4">
              <div className="text-lg font-semibold">更多方式</div>
              <div className="space-y-2 text-muted-foreground">
                <p>• 邮箱：support@aipredict.market</p>
                <p>• Discord：加入社区获取最新市场洞见</p>
                <p>• Twitter/X：关注实时更新和公告</p>
              </div>
              <div className="text-sm text-muted-foreground/80">
                我们在工作日 24 小时内回复，一般 1 个工作日内给到解决方案。
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

