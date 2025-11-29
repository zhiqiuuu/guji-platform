import { NextRequest, NextResponse } from 'next/server';
import { AI_PROMPTS, KimiService } from '@/lib/kimi';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: '请提供要翻译的古文内容' },
        { status: 400 }
      );
    }

    const kimiService = new KimiService();
    const response = await kimiService.chat({
      messages: [
        { role: 'user', content: AI_PROMPTS.TRANSLATE(text) }
      ]
    });

    return NextResponse.json({
      content: response,
      success: true
    });
  } catch (error: any) {
    console.error('AI Translate Error:', error);
    return NextResponse.json(
      { error: error.message || 'AI翻译服务暂时不可用' },
      { status: 500 }
    );
  }
}
