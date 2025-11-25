import { NextRequest, NextResponse } from 'next/server';
import { getBookById } from '@/lib/supabase-db';

// GET: 获取单个书籍详情
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const book = await getBookById(id);

    if (!book) {
      return NextResponse.json({ error: '书籍不存在' }, { status: 404 });
    }

    return NextResponse.json(book);
  } catch (error) {
    console.error('Failed to fetch book:', error);
    return NextResponse.json({ error: '获取书籍详情失败' }, { status: 500 });
  }
}
