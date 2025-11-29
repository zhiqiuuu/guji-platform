import { NextRequest, NextResponse } from 'next/server';
import { KimiService, AI_PROMPTS } from '@/lib/kimi';

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
 * 使用 Kimi AI (Moonshot)
 */
export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();

    const { message, history = [], stream: isStream = false, temperature } = body;

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return NextResponse.json(
        { error: '消息内容不能为空' },
        { status: 400 }
      );
    }

    // 使用 Kimi API
    const kimiService = new KimiService();

    // 构建消息列表,包含系统提示和历史对话
    const messages = [
      { role: 'system' as const, content: AI_PROMPTS.CHAT() },
      ...history.map(msg => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content
      })),
      { role: 'user' as const, content: message }
    ];

    const response = await kimiService.chat({
      messages,
      temperature: temperature || 0.7,
    });

    return NextResponse.json({
      success: true,
      message: response,
      model: 'moonshot-v1-8k',
    });
  } catch (error: any) {
    console.error('AI 聊天错误:', error);
    return NextResponse.json(
      { error: 'AI服务暂时不可用', details: error.message },
      { status: 500 }
    );
  }
}
