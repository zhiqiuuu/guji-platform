/**
 * 讯飞星火 API - Edge Runtime 版本
 * 使用浏览器原生 WebSocket API,兼容 Vercel Edge Runtime
 */

interface SparkMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface SparkRequestParams {
  messages: SparkMessage[];
  temperature?: number;
  max_tokens?: number;
}

/**
 * 生成 HMAC-SHA256 签名
 */
async function generateSignature(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(data)
  );

  return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

/**
 * 生成 WebSocket URL 鉴权参数
 */
async function generateAuthUrl(
  appId: string,
  apiSecret: string,
  apiKey: string
): Promise<string> {
  const host = 'spark-api.xf-yun.com';
  const path = '/v1.1/chat';
  const date = new Date().toUTCString();

  // 构建签名原文
  const signatureOrigin = `host: ${host}\ndate: ${date}\nGET ${path} HTTP/1.1`;

  // 使用 Web Crypto API 进行加密
  const signature = await generateSignature(signatureOrigin, apiSecret);

  // 构建 authorization
  const authorizationOrigin = `api_key="${apiKey}", algorithm="hmac-sha256", headers="host date request-line", signature="${signature}"`;
  const authorization = btoa(authorizationOrigin);

  // 构建完整 URL
  const url = `wss://${host}${path}?authorization=${encodeURIComponent(authorization)}&date=${encodeURIComponent(date)}&host=${encodeURIComponent(host)}`;

  return url;
}

/**
 * 构建请求体
 */
function buildRequestBody(
  appId: string,
  params: SparkRequestParams
) {
  return {
    header: {
      app_id: appId,
      uid: 'user-' + Date.now(),
    },
    parameter: {
      chat: {
        domain: 'lite',
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
 * 使用浏览器原生 WebSocket API
 */
export async function sendToSparkEdge(
  appId: string,
  apiSecret: string,
  apiKey: string,
  params: SparkRequestParams
): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      // 检查必要的参数
      if (!appId || !apiSecret || !apiKey) {
        console.error('星火 API 配置缺失');
        reject(new Error('星火 API 配置缺失,请检查环境变量'));
        return;
      }

      const authUrl = await generateAuthUrl(appId, apiSecret, apiKey);
      console.log('正在连接星火 API...');

      const ws = new WebSocket(authUrl);
      let fullResponse = '';

      ws.onopen = () => {
        console.log('WebSocket 连接已建立');
        const requestBody = buildRequestBody(appId, params);
        ws.send(JSON.stringify(requestBody));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          // 检查错误
          if (data.header?.code !== 0) {
            console.error('星火 API 错误:', data.header);
            ws.close();
            reject(new Error(`星火 API 错误 (${data.header?.code}): ${data.header?.message || '未知错误'}`));
            return;
          }

          // 获取文本内容
          const text = data.payload?.choices?.text || [];
          if (text.length > 0) {
            fullResponse += text[0].content || '';
          }

          // 检查是否结束
          if (data.header?.status === 2) {
            console.log('星火 API 响应完成');
            ws.close();
            resolve(fullResponse);
          }
        } catch (error) {
          console.error('解析消息错误:', error);
          ws.close();
          reject(error);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket 连接错误:', error);
        reject(new Error('WebSocket 连接失败,可能是网络问题或认证失败'));
      };

      ws.onclose = (event) => {
        console.log('WebSocket 连接已关闭:', event.code, event.reason);
        if (!fullResponse) {
          reject(new Error('连接关闭但未收到响应'));
        }
      };

      // 超时处理
      setTimeout(() => {
        if (ws.readyState !== WebSocket.CLOSED) {
          console.warn('请求超时,关闭连接');
          ws.close();
          reject(new Error('请求超时,请稍后重试'));
        }
      }, 25000); // 25秒超时
    } catch (error) {
      console.error('sendToSparkEdge 异常:', error);
      reject(error);
    }
  });
}

/**
 * 简化的聊天接口
 */
export async function chatEdge(
  message: string,
  history: SparkMessage[] = [],
  options: {
    temperature?: number;
    max_tokens?: number;
  } = {}
): Promise<string> {
  const appId = process.env.SPARK_APP_ID || '';
  const apiSecret = process.env.SPARK_API_SECRET || '';
  const apiKey = process.env.SPARK_API_KEY || '';

  const messages: SparkMessage[] = [
    ...history,
    { role: 'user', content: message },
  ];

  return sendToSparkEdge(appId, apiSecret, apiKey, {
    messages,
    temperature: options.temperature,
    max_tokens: options.max_tokens,
  });
}
