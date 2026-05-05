// // WebSocket客户端封装
// import type { WebSocketMessage, MarketPriceUpdate } from './types';

// export class WebSocketClient {
//   private ws: WebSocket | null = null;
//   private url: string;
//   private reconnectAttempts = 0;
//   private maxReconnectAttempts = 5;
//   private reconnectDelay = 3000;
//   private listeners: Map<string, Set<(data: any) => void>> = new Map();
//   private isConnecting = false;

//   constructor(baseUrl?: string) {
//     // 从环境变量或配置中获取WebSocket地址
//     const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
//     const wsHost = baseUrl || process.env.NEXT_PUBLIC_WS_URL || 'localhost:8888';
//     this.url = `${wsProtocol}//${wsHost}/ws`;
//   }

//   // 连接WebSocket
//   connect(): Promise<void> {
//     if (this.ws?.readyState === WebSocket.OPEN) {
//       return Promise.resolve();
//     }

//     if (this.isConnecting) {
//       return new Promise((resolve) => {
//         const checkConnection = setInterval(() => {
//           if (this.ws?.readyState === WebSocket.OPEN) {
//             clearInterval(checkConnection);
//             resolve();
//           }
//         }, 100);
//       });
//     }

//     this.isConnecting = true;

//     return new Promise((resolve, reject) => {
//       try {
//         this.ws = new WebSocket(this.url);

//         this.ws.onopen = () => {
//           console.log('[WebSocket] 连接成功');
//           this.isConnecting = false;
//           this.reconnectAttempts = 0;
//           resolve();
//         };

//         this.ws.onmessage = (event) => {
//           try {
//             const message = JSON.parse(event.data) as WebSocketMessage | MarketPriceUpdate;
//             this.handleMessage(message);
//           } catch (error) {
//             console.error('[WebSocket] 消息解析失败:', error);
//           }
//         };

//         this.ws.onerror = (error) => {
//           console.error('[WebSocket] 连接错误:', error);
//           this.isConnecting = false;
//           reject(error);
//         };

//         this.ws.onclose = () => {
//           console.log('[WebSocket] 连接关闭');
//           this.isConnecting = false;
//           this.ws = null;
//           this.attemptReconnect();
//         };
//       } catch (error) {
//         this.isConnecting = false;
//         reject(error);
//       }
//     });
//   }

//   // 断开连接
//   disconnect(): void {
//     if (this.ws) {
//       this.ws.close();
//       this.ws = null;
//     }
//     this.listeners.clear();
//   }

//   // 订阅频道
//   subscribe(channel: string, marketId?: number): void {
//     if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
//       console.warn('[WebSocket] 连接未建立，无法订阅');
//       return;
//     }

//     const message: WebSocketMessage = {
//       action: 'subscribe',
//       channel,
//       market_id: marketId,
//     };

//     this.ws.send(JSON.stringify(message));
//   }

//   // 取消订阅
//   unsubscribe(channel: string, marketId?: number): void {
//     if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
//       return;
//     }

//     const message: WebSocketMessage = {
//       action: 'unsubscribe',
//       channel,
//       market_id: marketId,
//     };

//     this.ws.send(JSON.stringify(message));
//   }

//   // 监听消息
//   on(channel: string, callback: (data: any) => void): () => void {
//     if (!this.listeners.has(channel)) {
//       this.listeners.set(channel, new Set());
//     }
//     this.listeners.get(channel)!.add(callback);

//     // 返回取消监听的函数
//     return () => {
//       const channelListeners = this.listeners.get(channel);
//       if (channelListeners) {
//         channelListeners.delete(callback);
//         if (channelListeners.size === 0) {
//           this.listeners.delete(channel);
//         }
//       }
//     };
//   }

//   // 处理消息
//   private handleMessage(message: WebSocketMessage | MarketPriceUpdate): void {
//     if ('channel' in message && message.channel) {
//       const listeners = this.listeners.get(message.channel);
//       if (listeners) {
//         listeners.forEach((callback) => {
//           try {
//             callback(message.data || message);
//           } catch (error) {
//             console.error('[WebSocket] 回调执行错误:', error);
//           }
//         });
//       }
//     }
//   }

//   // 尝试重连
//   private attemptReconnect(): void {
//     if (this.reconnectAttempts >= this.maxReconnectAttempts) {
//       console.error('[WebSocket] 达到最大重连次数，停止重连');
//       return;
//     }

//     this.reconnectAttempts++;
//     const delay = this.reconnectDelay * this.reconnectAttempts;

//     console.log(`[WebSocket] ${delay}ms后尝试重连 (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

//     setTimeout(() => {
//       this.connect().catch(() => {
//         // 重连失败，继续尝试
//       });
//     }, delay);
//   }

//   // 获取连接状态
//   getState(): number | null {
//     return this.ws?.readyState ?? null;
//   }

//   // 是否已连接
//   isConnected(): boolean {
//     return this.ws?.readyState === WebSocket.OPEN;
//   }
// }

// // 创建单例WebSocket客户端
// let wsClientInstance: WebSocketClient | null = null;

// export const getWebSocketClient = (baseUrl?: string): WebSocketClient => {
//   if (!wsClientInstance) {
//     wsClientInstance = new WebSocketClient(baseUrl);
//   }
//   return wsClientInstance;
// };


