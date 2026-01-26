// WebSocket Hook
'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { getWebSocketClient } from '@/lib/api/websocket';
import type { MarketPriceUpdate } from '@/lib/api/types';

interface UseWebSocketOptions {
  channel?: string;
  marketId?: number;
  autoConnect?: boolean;
  onMessage?: (data: any) => void;
  onError?: (error: Event) => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const {
    channel,
    marketId,
    autoConnect = true,
    onMessage,
    onError,
  } = options;

  const wsClientRef = useRef(getWebSocketClient());
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Event | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // 连接WebSocket
  const connect = useCallback(async () => {
    try {
      await wsClientRef.current.connect();
      setIsConnected(true);
      setError(null);

      // 如果指定了频道，自动订阅
      if (channel) {
        wsClientRef.current.subscribe(channel, marketId);
      }
    } catch (err) {
      const wsError = err as Event;
      setError(wsError);
      setIsConnected(false);
      onError?.(wsError);
    }
  }, [channel, marketId, onError]);

  // 断开连接
  const disconnect = useCallback(() => {
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    wsClientRef.current.disconnect();
    setIsConnected(false);
  }, []);

  // 订阅频道
  const subscribe = useCallback(
    (ch: string, id?: number) => {
      wsClientRef.current.subscribe(ch, id);
    },
    []
  );

  // 取消订阅
  const unsubscribe = useCallback(
    (ch: string, id?: number) => {
      wsClientRef.current.unsubscribe(ch, id);
    },
    []
  );

  // 监听消息
  useEffect(() => {
    if (!channel || !isConnected) return;

    const unsubscribe = wsClientRef.current.on(channel, (data) => {
      onMessage?.(data);
    });

    unsubscribeRef.current = unsubscribe;

    return () => {
      unsubscribe();
    };
  }, [channel, isConnected, onMessage]);

  // 自动连接
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  // 订阅/取消订阅市场
  useEffect(() => {
    if (!channel || !isConnected) return;

    if (marketId !== undefined) {
      subscribe(channel, marketId);
    }

    return () => {
      if (marketId !== undefined) {
        unsubscribe(channel, marketId);
      }
    };
  }, [channel, marketId, isConnected, subscribe, unsubscribe]);

  return {
    isConnected,
    error,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
  };
}

// 专门用于监听市场价格更新的Hook
export function useMarketPrice(marketId: number) {
  const [priceData, setPriceData] = useState<MarketPriceUpdate['data'] | null>(null);

  const { isConnected } = useWebSocket({
    channel: 'market_price',
    marketId,
    onMessage: (data: MarketPriceUpdate) => {
      if (data.market_id === marketId && data.data) {
        setPriceData(data.data);
      }
    },
  });

  return {
    priceData,
    isConnected,
  };
}

