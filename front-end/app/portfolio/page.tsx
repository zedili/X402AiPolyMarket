'use client';

import { useState, useEffect, useRef } from 'react';
import { useApi } from '@/hooks/useApi';
import { tradeApi } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { OrderList } from '@/components/OrderList';
import { PositionList } from '@/components/PositionList';
import { TradeHistory } from '@/components/TradeHistory';
import { TradingStats } from '@/components/TradingStats';
import { Wallet, Package, History, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import FadeIn from '@/components/FadeIn';

export default function PortfolioPage() {
  const [activeTab, setActiveTab] = useState('positions');
  const [sliderPosition, setSliderPosition] = useState({ left: 0, width: 0 });
  const tabsListRef = useRef<HTMLDivElement>(null);

  // 更新滑块位置
  useEffect(() => {
    const updateSlider = () => {
      const tabsList = tabsListRef.current;
      if (!tabsList) return;

      // 通过 data-state 属性查找激活的 trigger
      const activeTrigger = tabsList.querySelector(`[data-state="active"]`) as HTMLElement;
      
      if (activeTrigger) {
        const tabsListRect = tabsList.getBoundingClientRect();
        const triggerRect = activeTrigger.getBoundingClientRect();
        
        setSliderPosition({
          left: triggerRect.left - tabsListRect.left,
          width: triggerRect.width,
        });
      }
    };

    // 延迟执行以确保 DOM 已更新
    const timer = setTimeout(updateSlider, 0);
    
    // 监听窗口大小变化
    window.addEventListener('resize', updateSlider);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateSlider);
    };
  }, [activeTab]);

  return (
    <div className="container py-8 space-y-6">
      <FadeIn direction="down" delay={0.1}>
        <div>
          <h1 className="text-3xl font-bold">我的投资组合</h1>
          <p className="text-muted-foreground mt-2">管理您的订单、持仓和交易历史</p>
        </div>
      </FadeIn>

      <FadeIn delay={0.2}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="relative">
            <TabsList ref={tabsListRef} className="grid w-full grid-cols-4 relative bg-muted/50">
              {/* 滑动指示器 */}
              <motion.div
                className="absolute bottom-0 h-[2px] bg-primary rounded-full shadow-[0_0_8px_rgba(var(--color-primary),0.5)]"
                animate={{
                  x: sliderPosition.left,
                  width: sliderPosition.width,
                }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 35,
                  mass: 0.8,
                }}
                style={{
                  left: 0,
                }}
              />
            
            <TabsTrigger 
              value="positions" 
              className="flex items-center gap-2 relative z-10"
            >
              <Package className="h-4 w-4" />
              持仓
            </TabsTrigger>
            <TabsTrigger 
              value="orders" 
              className="flex items-center gap-2 relative z-10"
            >
              <Wallet className="h-4 w-4" />
              订单
            </TabsTrigger>
            <TabsTrigger 
              value="history" 
              className="flex items-center gap-2 relative z-10"
            >
              <History className="h-4 w-4" />
              交易历史
            </TabsTrigger>
            <TabsTrigger 
              value="stats" 
              className="flex items-center gap-2 relative z-10"
            >
              <BarChart3 className="h-4 w-4" />
              统计
            </TabsTrigger>
          </TabsList>
        </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 'positions' && (
                <TabsContent value="positions">
                  <PositionList />
                </TabsContent>
              )}
              {activeTab === 'orders' && (
                <TabsContent value="orders">
                  <OrderList />
                </TabsContent>
              )}
              {activeTab === 'history' && (
                <TabsContent value="history">
                  <TradeHistory />
                </TabsContent>
              )}
              {activeTab === 'stats' && (
                <TabsContent value="stats">
                  <TradingStats />
                </TabsContent>
              )}
            </motion.div>
          </AnimatePresence>
        </Tabs>
      </FadeIn>
    </div>
  );
}
