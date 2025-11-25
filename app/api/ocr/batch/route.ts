import { NextRequest, NextResponse } from 'next/server';
import { getAllBooks } from '@/lib/supabase-db';

/**
 * POST: 批量处理所有待处理的书籍OCR
 */
export async function POST(request: NextRequest) {
  try {
    const books = await getAllBooks();

    // 筛选出需要OCR处理的书籍（状态为pending或failed）
    const booksToProcess = books.filter(
      (book) => book.ocr_status === 'pending' || book.ocr_status === 'failed'
    );

    if (booksToProcess.length === 0) {
      return NextResponse.json({
        message: '没有需要处理的书籍',
        total: books.length,
        toProcess: 0,
      });
    }

    // 触发批量OCR处理
    const processPromises = booksToProcess.map(async (book) => {
      try {
        const response = await fetch(`${request.nextUrl.origin}/api/ocr/process`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            bookId: book.id,
            fileUrl: book.file_url,
            fileType: book.file_type,
          }),
        });

        if (response.ok) {
          return { bookId: book.id, title: book.title, status: 'started' };
        } else {
          return { bookId: book.id, title: book.title, status: 'failed' };
        }
      } catch (error) {
        return { bookId: book.id, title: book.title, status: 'error' };
      }
    });

    const results = await Promise.all(processPromises);

    const successCount = results.filter((r) => r.status === 'started').length;
    const failCount = results.filter((r) => r.status !== 'started').length;

    return NextResponse.json({
      message: '批量OCR处理已启动',
      total: booksToProcess.length,
      success: successCount,
      failed: failCount,
      results,
    });
  } catch (error) {
    console.error('批量OCR处理失败:', error);
    return NextResponse.json(
      {
        error: '批量OCR处理失败',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * GET: 查看批量OCR处理状态
 */
export async function GET() {
  try {
    const books = await getAllBooks();

    const statistics = {
      total: books.length,
      pending: books.filter((b) => b.ocr_status === 'pending').length,
      processing: books.filter((b) => b.ocr_status === 'processing').length,
      completed: books.filter((b) => b.ocr_status === 'completed').length,
      failed: books.filter((b) => b.ocr_status === 'failed').length,
    };

    return NextResponse.json(statistics);
  } catch (error) {
    console.error('查询OCR统计失败:', error);
    return NextResponse.json(
      { error: '查询失败' },
      { status: 500 }
    );
  }
}
