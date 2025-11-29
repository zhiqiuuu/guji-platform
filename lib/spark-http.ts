/**
 * 讯飞星火 HTTP API
 * 使用 OpenAI 兼容的 HTTP 接口,适用于 Vercel 部署
 *
 * 参考文档: https://www.xfyun.cn/doc/spark/HTTP调用文档.html
 */

interface SparkMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface SparkHTTPRequest {
  model: string;
  messages: SparkMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

interface SparkHTTPResponse {
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    index: number;
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * 使用 HTTP API 调用星火大模型
 */
export async function sendToSparkHTTP(
  apiKey: string,
  apiSecret: string,
  params: {
    messages: SparkMessage[];
    temperature?: number;
    max_tokens?: number;
  }
): Promise<string> {
  // 讯飞星火 HTTP API 使用 APIPassword 作为 Bearer token
  // APIPassword = base64(apiKey:apiSecret)
  const apiPassword = btoa(`${apiKey}:${apiSecret}`);

  const requestBody: SparkHTTPRequest = {
    model: 'lite', // 使用 Lite 模型
    messages: params.messages,
    temperature: params.temperature || 0.7,
    max_tokens: params.max_tokens || 2048,
    stream: false,
  };

  console.log('正在调用星火 HTTP API...');

  const response = await fetch('https://spark-api-open.xf-yun.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiPassword}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('星火 API 错误:', response.status, errorText);
    throw new Error(`星火 API 错误 (${response.status}): ${errorText}`);
  }

  const data: SparkHTTPResponse = await response.json();

  if (!data.choices || data.choices.length === 0) {
    throw new Error('星火 API 返回空响应');
  }

  const content = data.choices[0].message.content;
  console.log('星火 API 响应成功');

  return content;
}

/**
 * 简化的聊天接口
 */
export async function chatHTTP(
  message: string,
  history: SparkMessage[] = [],
  options: {
    temperature?: number;
    max_tokens?: number;
  } = {}
): Promise<string> {
  const apiKey = process.env.SPARK_API_KEY || '';
  const apiSecret = process.env.SPARK_API_SECRET || '';

  if (!apiKey || !apiSecret) {
    console.error('星火 API 配置缺失');
    throw new Error('星火 API 配置缺失,请检查环境变量');
  }

  const messages: SparkMessage[] = [
    ...history,
    { role: 'user', content: message },
  ];

  return sendToSparkHTTP(apiKey, apiSecret, {
    messages,
    temperature: options.temperature,
    max_tokens: options.max_tokens,
  });
}
