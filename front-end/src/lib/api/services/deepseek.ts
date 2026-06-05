import { AuthManager } from '../auth';
// import { x402Client } from '../../x402-client-solana';
import { x402PolygonClient } from '../../x402-client-polygon';
import { X } from 'lucide-react';

// DeepSeek API 服务
// const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';
const DEEPSEEK_API_URL = 'http://localhost:3000/api/v1/v1/chat/completions';
const DEEPSEEK_API_KEY = 'sk-3accdd7507b943b59179c45eb265e73f';

interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface DeepSeekRequest {
  model: string;
  messages: DeepSeekMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
  response_format?: {
    type: 'json_object';
  };
}

interface DeepSeekResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

interface StreamDelta {
  content?: string;
  reasoning_content?: string;
}

interface StreamChoice {
  delta: StreamDelta;
  finish_reason?: string;
}

interface StreamChunk {
  choices: StreamChoice[];
}

/**
 * 调用 DeepSeek API（非流式）
 */
export async function callDeepSeek(
  prompt: string,
  systemPrompt?: string,
): Promise<string> {
  const messages: DeepSeekMessage[] = [];
  
  if (systemPrompt) {
    messages.push({
      role: 'system',
      content: systemPrompt,
    });
  }
  
  messages.push({
    role: 'user',
    content: prompt,
  });

  const requestBody: DeepSeekRequest = {
    model: 'deepseek-chat',
    messages,
    temperature: 0.7,
    max_tokens: 2000,
  };



  // // 认证token
  const token = AuthManager.getAccessToken();
  const response = await x402PolygonClient.fetchWithPayment(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(requestBody),
  });



  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`);
  }

  const data: DeepSeekResponse = await response.json();
  
  if (!data.choices || data.choices.length === 0) {
    throw new Error('DeepSeek API returned no choices');
  }

  return data.choices[0].message.content;
}

/**
 * 流式调用 DeepSeek API
 * @param prompt 用户提示词
 * @param systemPrompt 系统提示词
 * @param onChunk 接收到数据块时的回调
 * @param onComplete 完成时的回调
 * @param onError 错误时的回调
 */
export async function callDeepSeekStream(
  prompt: string,
  systemPrompt: string,
  onChunk: (content: string, reasoning?: string) => void,
  onError?: (error: Error) => void
): Promise<void> {
  const messages: DeepSeekMessage[] = [];
  
  if (systemPrompt) {
    messages.push({
      role: 'system',
      content: systemPrompt,
    });
  }
  
  messages.push({
    role: 'user',
    content: prompt,
  });

  const requestBody: DeepSeekRequest = {
    model: 'deepseek-chat',
    messages,
    temperature: 0.7,
    max_tokens: 2000,
    stream: true,
  };

  try {
      // 添加认证token
    // // 认证token
    const token = AuthManager.getAccessToken();
    const response = await x402PolygonClient.
      fetchWithPayment(DEEPSEEK_API_URL, 
              {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify(requestBody),
            }

      );
  
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('无法获取响应流');
    }

    const decoder = new TextDecoder();
    let fullContent = '';
    let fullReasoning = '';

    // 1、创建缓冲区，用于存储未完整的JSON字符串
    let buffer = "";
    try {
        while (true) {
          const { done, value } = await reader.read();
              
          if (done) {
            // 流结束，处理剩余缓冲区内容
            if (buffer.trim().length > 0) {
              processLine(buffer);
            }
            break;
          }

          // 2、解码当前块并追加到缓冲区
          buffer += decoder.decode(value, { stream: true });

          // 3、按行分割缓冲区，处理完整的行
          let parts = buffer.split('\n\n');

          // 4、最后一行可能不完整，保留在缓冲区中
          buffer = parts.pop() || "";

          // 5、处理完整的行
          for (const part of parts) {
            if (part.trim().length > 0) {
              processLine(part);
            }
          }
        }
    }finally {
      reader.releaseLock();
    }

    //  定义处理行的函数
    function processLine(line: string) { 

      // 拆分多行（防止一个 part 包含多个 data 行）
      const lines = line.split('\n').filter(l => l.trim().length > 0);

      for (const l of lines) {
        if (l.startsWith('data: ')) {
          const data = l.slice(6);
          if (data === '[DONE]') continue;

            try {
              const parsed: StreamChunk = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta;

              if (delta) {
                // 处理推理内容
                if (delta.reasoning_content) {
                  fullReasoning += delta.reasoning_content;
                  onChunk(fullContent, fullReasoning);
                }

                // 处理回答内容
                if (delta.content) {
                  fullContent += delta.content;
                  onChunk(fullContent, fullReasoning);
                }
              }
            } catch (e) {
              // 忽略解析错误，继续处理下一行
              console.warn('解析流数据失败:', e, line);
            }
          }
        }


    }

        
        

  }catch (error) {
    const err = error instanceof Error ? error : new Error('未知错误');
    if (onError) {
      onError(err);
    } else {
      throw err;
    } 
  }   
  }