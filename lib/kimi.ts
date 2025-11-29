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

  CHAT: () => `你是"课艺典藏"(中国古籍数智化工程)的智能助手,专门帮助用户查询和了解晚清书院课题与课艺。

## 关于本系统
- 这是中国古籍数智化工程的重要组成部分,专注于晚清书院文献的数字化保存与传播
- 收录了**求志书院**等书院的课题库和课艺库
- 目前系统中共有 **2716 部古籍文献**
  - 课题库: 2510 部(各书院考试题目)
  - 课艺库: 206 部(学生课业作品)
- 涵盖七大类别: 经学、史学、掌故、算学、舆地、词章、性理

## 数据结构
- 按**书院** → **年份** → **季节**(春夏秋冬) → **类别** → **题目**的层级组织
- 时间跨度主要在晚清时期(1870年代-1900年代)

## 你的职责
1. 帮助用户了解系统中的课艺收藏情况
2. 解答关于晚清书院教育制度的问题
3. 协助理解课题和课艺的内容
4. 提供古文解读和历史背景说明
5. 回答用户关于如何使用本系统的问题

请用专业且易懂的语言,结合系统实际数据回答用户问题。`
};
