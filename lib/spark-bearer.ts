/**
 * DeepSeek API 服务封装
 * 兼容 OpenAI Chat Completions 格式
 *
 * 参考: https://api-docs.deepseek.com/zh-cn/
 */

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
}

interface ChatCompletionResponse {
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

const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';
const DEEPSEEK_MODEL = 'deepseek-chat';

/**
 * 调用 DeepSeek 大模型
 */
export async function sendToSparkBearer(
  apiKey: string,
  params: {
    messages: ChatMessage[];
    temperature?: number;
    max_tokens?: number;
  }
): Promise<string> {
  const requestBody: ChatCompletionRequest = {
    model: DEEPSEEK_MODEL,
    messages: params.messages,
    temperature: params.temperature ?? 0.7,
    max_tokens: params.max_tokens ?? 2048,
  };

  console.log('正在调用 DeepSeek API...');

  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('DeepSeek API 错误:', response.status, errorText);
    throw new Error(`DeepSeek API 错误 (${response.status}): ${errorText}`);
  }

  const data: ChatCompletionResponse = await response.json();

  if (!data.choices || data.choices.length === 0) {
    throw new Error('DeepSeek API 返回空响应');
  }

  const content = data.choices[0].message.content;
  console.log('DeepSeek API 响应成功');

  return content;
}

/**
 * 简化的聊天接口
 */
export async function chatBearer(
  message: string,
  history: ChatMessage[] = [],
  options: {
    temperature?: number;
    max_tokens?: number;
  } = {}
): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY || '';

  if (!apiKey) {
    console.error('DeepSeek API Key 配置缺失');
    throw new Error('DeepSeek API Key 配置缺失，请检查环境变量');
  }

  const messages: ChatMessage[] = [
    ...history,
    { role: 'user', content: message },
  ];

  return sendToSparkBearer(apiKey, {
    messages,
    temperature: options.temperature,
    max_tokens: options.max_tokens,
  });
}
