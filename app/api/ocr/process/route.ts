import { NextRequest, NextResponse } from 'next/server';
// import { extractTextFromBook } from '@/lib/ocr-service';
import { updateBook } from '@/lib/supabase-db';

// 设置为动态路由,避免构建时执行
export const dynamic = 'force-dynamic';

/**
 * POST: 异步处理书籍的OCR (已弃用 - OCR现在在客户端执行)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookId, fileUrl, fileType, imageUrls } = body;

    if (!bookId || !fileUrl || !fileType) {
      return NextResponse.json(
        { error: '缺少必要参数' },
        { status: 400 }
      );
    }

    // 更新状态为处理中
    await updateBook(bookId, { ocr_status: 'processing' });

    // 在后台异步执行OCR（不阻塞响应）
    processOCRInBackground(bookId, fileUrl, fileType, imageUrls);

    return NextResponse.json({
      message: 'OCR处理已开始',
      bookId,
      status: 'processing',
    });
  } catch (error) {
    console.error('启动OCR处理失败:', error);
    return NextResponse.json(
      {
        error: 'OCR处理启动失败',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * 后台异步处理OCR
 */
async function processOCRInBackground(
  bookId: string,
  fileUrl: string,
  fileType: 'pdf' | 'images',
  imageUrls?: string[]
) {
  try {
    console.log(`开始为书籍 ${bookId} 进行OCR处理...`);

    // 执行OCR提取
    const fullText = await extractTextFromBook(fileUrl, fileType, imageUrls);

    console.log(`OCR处理完成，提取文字长度: ${fullText.length}`);

    // 更新数据库
    await updateBook(bookId, {
      full_text: fullText,
      ocr_status: 'completed',
    });

    console.log(`书籍 ${bookId} OCR处理成功`);
  } catch (error) {
    console.error(`书籍 ${bookId} OCR处理失败:`, error);

    // 更新状态为失败
    await updateBook(bookId, { ocr_status: 'failed' });
  }
}

/**
 * GET: 查询OCR处理状态
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const bookId = searchParams.get('bookId');

    if (!bookId) {
      return NextResponse.json({ error: '缺少书籍ID' }, { status: 400 });
    }

    // 这里可以查询数据库获取OCR状态
    // 简单起见，暂时返回基本信息
    return NextResponse.json({
      bookId,
      message: '请查询书籍详情获取OCR状态',
    });
  } catch (error) {
    console.error('查询OCR状态失败:', error);
    return NextResponse.json(
      { error: '查询失败' },
      { status: 500 }
    );
  }
}
