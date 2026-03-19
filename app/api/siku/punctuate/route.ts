import { NextRequest, NextResponse } from 'next/server';
import { chatBearer } from '@/lib/spark-bearer';

export const runtime = 'nodejs';
export const maxDuration = 60;

interface PunctuateRequest {
  text: string;
  withExplanation?: boolean; // 是否需要断句说明
}

/**
 * 古文标点API
 * 为无标点古文添加现代标点符号
 */
export async function POST(request: NextRequest) {
  try {
    const body: PunctuateRequest = await request.json();
    const { text, withExplanation = false } = body;

    if (!text || text.trim() === '') {
      return NextResponse.json(
        { error: '文本不能为空' },
        { status: 400 }
      );
    }

    console.log('[标点API] 标点文本:', text.substring(0, 50));

    // 构建标点提示词
    const prompt = `你是专业的古文标点专家。请为以下无标点古文添加现代标点符号。

要求:
1. 使用现代标点符号(句号、逗号、分号、问号、感叹号等)
2. 根据语法结构和语义合理断句
3. 尊重古文特殊句式(倒装、省略、判断句等)
4. 标点应准确反映语气和停顿
${withExplanation ? '5. 对于疑难断句,请在【说明】部分解释理由' : ''}

原文(无标点):
${text}

请按以下格式输出:

【标点文本】
(添加标点后的文本)

${withExplanation ? `【断句说明】
(解释关键断句的理由,特别是容易产生歧义的地方)` : ''}`;

    // 调用大模型
    const response = await chatBearer(prompt, [], {
      temperature: 0.2, // 标点任务使用低温度,保证准确性
      max_tokens: 2000,
    });

    return NextResponse.json({
      success: true,
      originalText: text,
      punctuatedText: response,
      withExplanation,
      model: 'deepseek-chat'
    });

  } catch (error: any) {
    console.error('[标点API] 错误:', error);
    return NextResponse.json(
      { error: '标点服务暂时不可用', details: error.message },
      { status: 500 }
    );
  }
}
