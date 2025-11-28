import { NextRequest, NextResponse } from 'next/server';
import { KimiService, AI_PROMPTS } from '@/lib/kimi';

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: '请提供要解读的古文内容' },
        { status: 400 }
      );
    }

    const kimiService = new KimiService();

    const response = await kimiService.chat({
      messages: [
        { role: 'user', content: AI_PROMPTS.INTERPRET(text) }
      ]
    });

    return NextResponse.json({
      content: response,
      success: true
    });
  } catch (error: any) {
    console.error('AI Interpret Error:', error);
    return NextResponse.json(
      { error: error.message || 'AI解读服务暂时不可用' },
      { status: 500 }
    );
  }
}
