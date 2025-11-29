import { NextRequest, NextResponse } from 'next/server';
import { chat, chatStream } from '@/lib/spark';

export const runtime = 'nodejs';

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

    // 非流式响应
    if (!isStream) {
      const response = await chat(message, history, {
        temperature,
        max_tokens,
      });

      return NextResponse.json({
        success: true,
        message: response,
        model: 'spark-lite',
      });
    }

    // 流式响应
    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of chatStream(message, history, {
            temperature,
            max_tokens,
          })) {
            const data = JSON.stringify({ chunk }) + '\n';
            controller.enqueue(encoder.encode(data));
          }
          controller.close();
        } catch (error: any) {
          const errorData = JSON.stringify({
            error: error.message || '流式响应错误',
          }) + '\n';
          controller.enqueue(encoder.encode(errorData));
          controller.close();
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('AI 聊天错误:', error);
    return NextResponse.json(
      { error: '服务器错误', details: error.message },
      { status: 500 }
    );
  }
}
