import { NextRequest, NextResponse } from 'next/server';
import { searchParagraphs } from '@/lib/paragraph-db';

/**
 * 段落搜索 API
 * GET /api/search/paragraphs?query=关键词&limit=50
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('query');
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 50;

    if (!query || query.trim() === '') {
      return NextResponse.json(
        { error: '搜索关键词不能为空' },
        { status: 400 }
      );
    }

    // 搜索段落
    const results = await searchParagraphs(query, limit);

    return NextResponse.json({
      success: true,
      data: results,
      count: results.length,
    });
  } catch (error) {
    console.error('段落搜索失败:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : '搜索失败',
      },
      { status: 500 }
    );
  }
}
