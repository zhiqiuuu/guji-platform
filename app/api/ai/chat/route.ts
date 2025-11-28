import { NextRequest, NextResponse } from 'next/server';
import { KimiService } from '@/lib/kimi';

export async function POST(request: NextRequest) {
  try {
    const { messages, stream = false } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: '无效的消息格式' },
        { status: 400 }
      );
    }

    const kimiService = new KimiService();

    if (stream) {
      // 流式响应
      const stream = await kimiService.chatStream({ messages });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    } else {
      // 非流式响应
      const response = await kimiService.chat({ messages });

      return NextResponse.json({
        content: response,
        success: true
      });
    }
  } catch (error: any) {
    console.error('AI Chat Error:', error);
    return NextResponse.json(
      { error: error.message || 'AI服务暂时不可用' },
      { status: 500 }
    );
  }
}
