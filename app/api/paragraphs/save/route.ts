import { NextRequest, NextResponse } from 'next/server';
import { saveParagraphs } from '@/lib/paragraph-db';
import { PageText } from '@/lib/paragraph-splitter';

/**
 * 保存段落 API
 * POST /api/paragraphs/save
 * Body: { bookId: string, pageTexts: PageText[] }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookId, pageTexts } = body;

    if (!bookId || !pageTexts || !Array.isArray(pageTexts)) {
      return NextResponse.json(
        { error: '缺少必要参数: bookId 和 pageTexts' },
        { status: 400 }
      );
    }

    // 保存段落
    const success = await saveParagraphs(bookId, pageTexts);

    if (success) {
      return NextResponse.json({
        success: true,
        message: '段落保存成功',
      });
    } else {
      return NextResponse.json(
        { success: false, error: '段落保存失败' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('保存段落失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '保存失败',
      },
      { status: 500 }
    );
  }
}
