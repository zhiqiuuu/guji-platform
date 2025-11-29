/**
 * 讯飞星火 Lite API 服务
 * 使用 WebSocket 协议进行通信
 */

import crypto from 'crypto';
import WebSocket from 'ws';

const SPARK_APP_ID = process.env.SPARK_APP_ID || '';
const SPARK_API_SECRET = process.env.SPARK_API_SECRET || '';
const SPARK_API_KEY = process.env.SPARK_API_KEY || '';

// 星火 Lite 模型 WebSocket URL
const SPARK_WS_URL = 'wss://spark-api.xf-yun.com/v1.1/chat';

interface SparkMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface SparkRequestParams {
  messages: SparkMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

/**
 * 生成 WebSocket URL 鉴权参数
 */
function generateAuthUrl(): string {
  const host = 'spark-api.xf-yun.com';
  const path = '/v1.1/chat';
  const date = new Date().toUTCString();

  // 构建签名原文
  const signatureOrigin = `host: ${host}\ndate: ${date}\nGET ${path} HTTP/1.1`;

  // 使用 HMAC-SHA256 进行加密
  const hmac = crypto.createHmac('sha256', SPARK_API_SECRET);
  const signature = hmac.update(signatureOrigin).digest('base64');

  // 构建 authorization
  const authorizationOrigin = `api_key="${SPARK_API_KEY}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`;
  const authorization = Buffer.from(authorizationOrigin).toString('base64');

  // 构建完整 URL
  const url = `${SPARK_WS_URL}?authorization=${encodeURIComponent(authorization)}&date=${encodeURIComponent(date)}&host=${encodeURIComponent(host)}`;

  return url;
}

/**
 * 构建请求体
 */
function buildRequestBody(params: SparkRequestParams) {
  return {
    header: {
      app_id: SPARK_APP_ID,
      uid: 'user-' + Date.now(),
    },
    parameter: {
      chat: {
        domain: 'lite', // 使用 lite 模型
        temperature: params.temperature || 0.7,
        max_tokens: params.max_tokens || 2048,
      },
    },
    payload: {
      message: {
        text: params.messages,
      },
    },
  };
}

/**
 * 发送消息到星火 API (非流式)
 */
export async function sendToSpark(params: SparkRequestParams): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const ws = new WebSocket(generateAuthUrl());
      let fullResponse = '';

      ws.onopen = () => {
        const requestBody = buildRequestBody(params);
        ws.send(JSON.stringify(requestBody));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // 检查错误
          if (data.header?.code !== 0) {
            ws.close();
            reject(new Error(data.header?.message || '星火 API 返回错误'));
            return;
          }

          // 获取文本内容
          const text = data.payload?.choices?.text || [];
          if (text.length > 0) {
            fullResponse += text[0].content || '';
          }

          // 检查是否结束
          if (data.header?.status === 2) {
            ws.close();
            resolve(fullResponse);
          }
        } catch (error) {
          ws.close();
          reject(error);
        }
      };

      ws.onerror = (error) => {
        reject(new Error('WebSocket 连接错误'));
      };

      ws.onclose = () => {
        if (!fullResponse) {
          reject(new Error('连接关闭但未收到响应'));
        }
      };

      // 超时处理
      setTimeout(() => {
        if (ws.readyState !== WebSocket.CLOSED) {
          ws.close();
          reject(new Error('请求超时'));
        }
      }, 30000); // 30秒超时
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * 发送消息到星火 API (流式)
 * 返回一个异步生成器,用于流式输出
 */
export async function* streamFromSpark(
  params: SparkRequestParams
): AsyncGenerator<string, void, unknown> {
  const ws = new WebSocket(generateAuthUrl());
  const chunks: string[] = [];
  let resolveChunk: ((value: string) => void) | null = null;
  let rejectChunk: ((error: Error) => void) | null = null;
  let isDone = false;
  let hasError = false;

  ws.onopen = () => {
    const requestBody = buildRequestBody(params);
    ws.send(JSON.stringify(requestBody));
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);

      // 检查错误
      if (data.header?.code !== 0) {
        hasError = true;
        ws.close();
        if (rejectChunk) {
          rejectChunk(new Error(data.header?.message || '星火 API 返回错误'));
        }
        return;
      }

      // 获取文本内容
      const text = data.payload?.choices?.text || [];
      if (text.length > 0) {
        const content = text[0].content || '';
        if (content) {
          chunks.push(content);
          if (resolveChunk) {
            resolveChunk(content);
            resolveChunk = null;
          }
        }
      }

      // 检查是否结束
      if (data.header?.status === 2) {
        isDone = true;
        ws.close();
        if (resolveChunk) {
          resolveChunk('');
          resolveChunk = null;
        }
      }
    } catch (error) {
      hasError = true;
      ws.close();
      if (rejectChunk) {
        rejectChunk(error as Error);
      }
    }
  };

  ws.onerror = () => {
    hasError = true;
    if (rejectChunk) {
      rejectChunk(new Error('WebSocket 连接错误'));
    }
  };

  // 逐个返回数据块
  try {
    while (!isDone && !hasError) {
      if (chunks.length > 0) {
        yield chunks.shift()!;
      } else {
        // 等待新数据
        await new Promise<string>((resolve, reject) => {
          resolveChunk = resolve;
          rejectChunk = reject;
          setTimeout(() => {
            if (resolveChunk === resolve) {
              resolveChunk = null;
              resolve('');
            }
          }, 100);
        });
        if (chunks.length > 0) {
          yield chunks.shift()!;
        }
      }
    }

    // 清空剩余数据
    while (chunks.length > 0) {
      yield chunks.shift()!;
    }
  } finally {
    if (ws.readyState !== WebSocket.CLOSED) {
      ws.close();
    }
  }
}

/**
 * 简化的聊天接口
 */
export async function chat(
  message: string,
  history: SparkMessage[] = [],
  options: {
    temperature?: number;
    max_tokens?: number;
    stream?: boolean;
  } = {}
): Promise<string> {
  const messages: SparkMessage[] = [
    ...history,
    { role: 'user', content: message },
  ];

  return sendToSpark({
    messages,
    temperature: options.temperature,
    max_tokens: options.max_tokens,
    stream: options.stream,
  });
}

/**
 * 流式聊天接口
 */
export async function* chatStream(
  message: string,
  history: SparkMessage[] = [],
  options: {
    temperature?: number;
    max_tokens?: number;
  } = {}
): AsyncGenerator<string, void, unknown> {
  const messages: SparkMessage[] = [
    ...history,
    { role: 'user', content: message },
  ];

  yield* streamFromSpark({
    messages,
    temperature: options.temperature,
    max_tokens: options.max_tokens,
    stream: true,
  });
}
