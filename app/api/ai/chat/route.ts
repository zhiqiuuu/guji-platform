import { NextRequest, NextResponse } from 'next/server';
import { chatHTTP } from '@/lib/spark-http';

export const runtime = 'edge';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  message: string;
  history?: ChatMessage[];
  stream?: boolean;
  temperature?: number;
  max_tokens?: number;
}

/**
 * AI 聊天 API
 * 使用讯飞星火 Lite 模型
 */
export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();

    const { message, history = [], stream: isStream = false, temperature, max_tokens } = body;

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return NextResponse.json(
        { error: '消息内容不能为空' },
        { status: 400 }
      );
    }

    // 使用星火 HTTP API (Edge Runtime)
    const response = await chatHTTP(message, history, {
      temperature,
      max_tokens,
    });

    return NextResponse.json({
      success: true,
      message: response,
      model: 'spark-lite',
    });
  } catch (error: any) {
    console.error('AI 聊天错误:', error);
    return NextResponse.json(
      { error: 'AI服务暂时不可用', details: error.message },
      { status: 500 }
    );
  }
}
