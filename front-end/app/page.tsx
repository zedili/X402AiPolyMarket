"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import MarketCard from "@/components/MarketCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Zap, Activity, Users, BrainCircuit, Loader2, Plus, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import TypeItText from "@/components/TypeItText";
import ParticlesBackground from "@/components/ParticlesBackground";
import AnimatedStatCard from "@/components/AnimatedStatCard";
import AnimatedMarketCard from "@/components/AnimatedMarketCard";
import { useFadeInUp, useSlideIn } from "@/hooks/useScrollAnimation";
import { marketApi, aiApi } from "@/lib/api";
import type { MarketListItem, AIPredictionResponse, MarketListResponse } from "@/lib/api/types";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import FadeIn from "@/components/FadeIn";
import StaggerChildren from "@/components/StaggerChildren";

export default function Home() {
  const { user } = useAuth();
  const ADMIN_ADDRESS = '0xf0aC9747345c23B6ba451d9103F8C2785800998D';
  const isAdmin = !!user && user.wallet_address?.toLowerCase() === ADMIN_ADDRESS.toLowerCase();

  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [sort, setSort] = useState<string>('volume');
  const [order, setOrder] = useState<string>('desc');
  const [markets, setMarkets] = useState<MarketListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [aiPredictions, setAiPredictions] = useState<Record<number, Partial<AIPredictionResponse>>>({});
  const [aiLoadingStates, setAiLoadingStates] = useState<Record<number, boolean>>({});
  const [categories, setCategories] = useState<string[]>(["ALL"]);
  const [showParticles, setShowParticles] = useState(true);
  const heroSectionRef = useRef<HTMLElement | null>(null);

  // 获取市场列表
  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await marketApi.getMarketList({
          page,
          page_size: pageSize,
          category: selectedCategory === "ALL" ? undefined : selectedCategory,
          search: searchQuery || undefined,
          sort,
          order: order as 'asc' | 'desc',
          status: 1, // 只获取已审核的市场
        });
        setMarkets(response.markets || []);
        setTotal(response.total || 0);
        
        // 提取分类列表
        const uniqueCategories = Array.from(new Set(response.markets?.map(m => m.category) || []));
        setCategories(["ALL", ...uniqueCategories]);
      } catch (err: any) {
        console.error("Failed to fetch markets:", err);
        setError(err?.message || "Failed to load markets");
      } finally {
        setLoading(false);
      }
    };

    fetchMarkets();
  }, [selectedCategory, searchQuery, page, pageSize, sort, order]);

  // 为每个市场获取AI预测
  // useEffect(() => {
  //   markets.forEach((market) => {
  //     // 如果已经有预测数据或正在加载，跳过
  //     if (aiPredictions[market.id] || aiLoadingStates[market.id]) {
  //       return;
  //     }

  //     // 如果市场已经有AI预测数据，直接使用
  //     if (market.ai_prediction !== undefined && market.confidence !== undefined) {
  //       setAiPredictions((prev) => ({
  //         ...prev,
  //         [market.id]: {
  //           market_id: market.id,
  //           prediction_value: market.ai_prediction,
  //           confidence: market.confidence,
  //           suggests: market.suggests,
  //         },
  //       }));
  //       return;
  //     }

  //     // 否则发起AI预测请求
  //     setAiLoadingStates((prev) => ({ ...prev, [market.id]: true }));
      
  //     aiApi.getPredictionStream(
  //       market.id,
  //       (partialData) => {
  //         setAiPredictions((prev) => ({
  //           ...prev,
  //           [market.id]: { ...prev[market.id], ...partialData },
  //         }));
  //         setAiLoadingStates((prev) => ({ ...prev, [market.id]: false }));
  //       },
  //       (fullData) => {
  //         setAiPredictions((prev) => ({
  //           ...prev,
  //           [market.id]: fullData,
  //         }));
  //         setAiLoadingStates((prev) => ({ ...prev, [market.id]: false }));
  //       },
  //       (err) => {
  //         console.error(`Failed to get AI prediction for market ${market.id}:`, err);
  //         setAiLoadingStates((prev) => ({ ...prev, [market.id]: false }));
  //       }
  //     );
  //   });
  // }, [markets]);

  // 注意：由于API已经处理了筛选和搜索，这里不需要再次过滤
  // 但如果需要客户端二次过滤，可以保留这个逻辑
  const filteredMarkets = useMemo(() => {
    return markets;
  }, [markets]);

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

  // 监听滚动，控制粒子效果显示
  useEffect(() => {
    const handleScroll = () => {
      if (!heroSectionRef.current) return;
      
      const heroRect = heroSectionRef.current.getBoundingClientRect();
      const heroBottom = heroRect.bottom;
      
      // 当英雄区块完全滚出视口时，隐藏粒子效果
      if (heroBottom < 0) {
        setShowParticles(false);
      } else {
        setShowParticles(true);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // 初始检查一次
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <>
      {/* 英雄区块 */}
      <section 
        ref={heroSectionRef as React.RefObject<HTMLElement>}
        className="relative py-20 md:py-32 overflow-hidden min-h-[600px] flex items-center"
        style={{ overflow: 'hidden' }}
      >
        {/* 粒子背景 - 相对于section绝对定位，溢出隐藏 */}
        <ParticlesBackground className="absolute inset-0" visible={showParticles} />
        
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
                className="relative w-full sm:w-auto text-lg h-12 px-8 bg-primary hover:bg-primary/90 shadow-[0_0_20px_-5px_var(--color-primary)] transition-all hover:scale-105"
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
          {/* 标题和操作按钮 */}
          <FadeIn direction="down" delay={0.1}>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-3xl font-display font-bold">市场列表</h2>
                <p className="text-muted-foreground mt-2">浏览所有预测市场</p>
              </div>
              <motion.div 
                className="flex gap-2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                { /*
                <Button asChild>
                  <Link href="/markets/create">
                    <Plus className="mr-2 h-4 w-4" />
                    创建市场
                  </Link>
                </Button>
                */
                }
                {isAdmin && (
                  <Button variant="outline" asChild>
                    <Link href="/admin/markets">
                      <Shield className="mr-2 h-4 w-4" />
                      审批中心
                    </Link>
                  </Button>
                )}
              </motion.div>
            </div>
          </FadeIn>

          {/* 筛选器 */}
          <div 
            ref={filtersRef as React.RefObject<HTMLDivElement>}
            className="flex flex-col gap-4 sticky top-20 z-30 py-4 bg-background/80 backdrop-blur-xl border-b border-border/30 -mx-4 px-4 md:mx-0 md:px-0 md:rounded-xl md:border"
          >
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="搜索市场..." 
                  className="pl-10 bg-background/50 border-border/50 focus:border-primary/50 focus:ring-primary/20"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setPage(1); // 搜索时重置到第一页
                  }}
                />
              </div>
              
              <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => {
                      setSelectedCategory(category);
                      setPage(1); // 切换分类时重置到第一页
                    }}
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

            {/* 排序 */}
            <div className="flex gap-2 items-center flex-wrap">
              <span className="text-sm text-muted-foreground">排序:</span>
              <Button
                variant={sort === 'volume' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSort('volume')}
              >
                成交量
              </Button>
              <Button
                variant={sort === 'created_at' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSort('created_at')}
              >
                创建时间
              </Button>
              <Button
                variant={sort === 'end_time' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSort('end_time')}
              >
                结束时间
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setOrder(order === 'desc' ? 'asc' : 'desc')}
              >
                {order === 'desc' ? '↓' : '↑'}
              </Button>
            </div>
          </div>

          {/* 市场卡片网格 */}
          {loading ? (
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              initial="hidden"
              animate="visible"
              variants={{
                visible: {
                  transition: {
                    staggerChildren: 0.1,
                  },
                },
              }}
            >
              {[...Array(6)].map((_, index) => (
                <motion.div
                  key={index}
                  variants={{
                    hidden: { opacity: 0, scale: 0.9 },
                    visible: { opacity: 1, scale: 1 },
                  }}
                  className="h-64 bg-card/50 border border-border/50 rounded-xl animate-pulse"
                />
              ))}
            </motion.div>
          ) : error ? (
            <FadeIn>
              <div className="text-center py-20 text-muted-foreground">
                <p className="text-lg text-destructive">{error}</p>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSelectedCategory("ALL");
                    setSearchQuery("");
                    setError(null);
                  }}
                  className="mt-4"
                >
                  Retry
                </Button>
              </div>
            </FadeIn>
          ) : (
            <>
              <StaggerChildren className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMarkets.map((market, index) => {
                  const aiPrediction = aiPredictions[market.id];
                  const aiLoading = aiLoadingStates[market.id] || false;
                  
                  // 合并API返回的市场数据和AI预测数据
                  const marketWithAI: MarketListItem = {
                    ...market,
                    ai_prediction: aiPrediction?.prediction_value ?? market.ai_prediction,
                    confidence: aiPrediction?.confidence ?? market.confidence,
                    suggests: aiPrediction?.suggests ?? market.suggests,
                  };

                  return (
                    <AnimatedMarketCard
                      key={market.id}
                      market={marketWithAI}
                      index={index}
                      aiLoading={aiLoading}
                    />
                  );
                })}
              </StaggerChildren>
              
              {filteredMarkets.length === 0 && (
                <div className="text-center py-20 text-muted-foreground">
                  <p className="text-lg">No markets found matching your criteria.</p>
                  <Button 
                    variant="link" 
                    onClick={() => {
                      setSelectedCategory("ALL");
                      setSearchQuery("");
                      setPage(1);
                    }}
                    className="mt-2 text-primary"
                  >
                    Clear filters
                  </Button>
                </div>
              )}

              {/* 分页 */}
              {total > pageSize && (
                <div className="flex justify-center gap-2 pt-4">
                  <Button
                    variant="outline"
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                  >
                    上一页
                  </Button>
                  <span className="flex items-center px-4 text-sm text-muted-foreground">
                    第 {page} 页，共 {Math.ceil(total / pageSize)} 页
                  </span>
                  <Button
                    variant="outline"
                    disabled={page >= Math.ceil(total / pageSize)}
                    onClick={() => setPage(page + 1)}
                  >
                    下一页
                  </Button>
                </div>
              )}
            </>
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

