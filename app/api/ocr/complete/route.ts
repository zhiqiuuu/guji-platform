import { NextRequest, NextResponse } from 'next/server';
import { updateBook } from '@/lib/supabase-db';
import { saveParagraphs } from '@/lib/paragraph-db';
import { PageText } from '@/lib/paragraph-splitter';

/**
 * POST: 接收客户端OCR完成的结果并更新数据库
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookId, fullText, pageTexts } = body;

    if (!bookId || !fullText) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 1. 更新书籍的OCR结果
    await updateBook(bookId, {
      full_text: fullText,
      ocr_status: 'completed',
    });

    // 2. 保存段落(如果提供了 pageTexts)
    let paragraphsSaved = false;
    if (pageTexts && Array.isArray(pageTexts) && pageTexts.length > 0) {
      try {
        paragraphsSaved = await saveParagraphs(bookId, pageTexts);
        console.log(`段落保存${paragraphsSaved ? '成功' : '失败'}`);
      } catch (error) {
        console.error('保存段落失败:', error);
        // 段落保存失败不影响主流程
      }
    }

    return NextResponse.json({
      success: true,
      message: 'OCR结果已保存',
      bookId,
      textLength: fullText.length,
      paragraphsSaved,
    });
  } catch (error) {
    console.error('保存OCR结果失败:', error);
    return NextResponse.json(
      {
        error: '保存失败',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
