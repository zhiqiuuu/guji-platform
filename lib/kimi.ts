// Kimi AI服务封装
export interface KimiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface KimiChatParams {
  messages: KimiMessage[];
  model?: string;
  temperature?: number;
  stream?: boolean;
}

export class KimiService {
  private apiKey: string;
  private baseURL: string;

  constructor(apiKey?: string, baseURL?: string) {
    this.apiKey = apiKey || process.env.KIMI_API_KEY || '';
    this.baseURL = baseURL || process.env.KIMI_API_BASE_URL || 'https://api.moonshot.cn/v1';
  }

  async chat(params: KimiChatParams): Promise<string> {
    const { messages, model = 'moonshot-v1-8k', temperature = 0.7 } = params;

    try {
      const response = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model,
          messages,
          temperature
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Kimi API调用失败');
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('Kimi API Error:', error);
      throw error;
    }
  }

  async chatStream(params: KimiChatParams): Promise<ReadableStream> {
    const { messages, model = 'moonshot-v1-8k', temperature = 0.7 } = params;

    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        stream: true
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Kimi API调用失败');
    }

    return response.body!;
  }
}

// 预设提示词
export const AI_PROMPTS = {
  INTERPRET: (text: string) => `你是一位古籍研究专家,精通古文解读。请对以下古籍内容进行详细解读,包括:
1. 文字注释(解释生僻字、古今字义变化)
2. 句意翻译(转换为现代汉语)
3. 历史背景(相关时代背景和文化内涵)
4. 学术价值(这段内容的研究价值和意义)

古籍内容:
${text}`,

  TRANSLATE: (text: string) => `请将以下古文翻译成现代汉语,要求准确、通顺、易懂:

${text}`,

  CHAT: () => `你是一位古籍研究助手,可以帮助用户解答关于古籍的各种问题,包括古文翻译、历史背景、文献考证等。请用专业且易懂的语言回答用户的问题。`
};
