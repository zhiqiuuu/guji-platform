import { NextRequest, NextResponse } from 'next/server';
import { filterBooks, addBook, updateBook, deleteBook } from '@/lib/supabase-db';

// GET: 获取书籍列表
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search') || undefined;
    const category = searchParams.get('category') || undefined;
    const dynasty = searchParams.get('dynasty') || undefined;

    const books = await filterBooks({ search, category, dynasty });

    return NextResponse.json(books);
  } catch (error) {
    console.error('Failed to fetch books:', error);
    return NextResponse.json({ error: '获取书籍列表失败' }, { status: 500 });
  }
}

// POST: 添加新书籍
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('接收到的书籍数据:', body);

    // 验证必填字段
    const missingFields = [];
    if (!body.title) missingFields.push('title');
    if (!body.author) missingFields.push('author');
    if (!body.dynasty) missingFields.push('dynasty');
    if (!body.category) missingFields.push('category');
    if (!body.file_url) missingFields.push('file_url');
    if (!body.file_type) missingFields.push('file_type');

    if (missingFields.length > 0) {
      console.error('缺少必填字段:', missingFields);
      return NextResponse.json({
        error: `缺少必填字段: ${missingFields.join(', ')}`,
        missingFields
      }, { status: 400 });
    }

    console.log('开始添加书籍到数据库...');
    const newBook = await addBook({
      title: body.title,
      author: body.author,
      dynasty: body.dynasty,
      category: body.category,
      description: body.description || null,
      keywords: null,
      cover_url: body.cover_url || null,
      file_url: body.file_url,
      file_type: body.file_type,
      page_count: body.page_count || null,
      full_text: null,
      ocr_status: 'pending',
    });

    console.log('书籍添加成功:', newBook);
    return NextResponse.json(newBook, { status: 201 });
  } catch (error) {
    console.error('Failed to add book:', error);
    return NextResponse.json({
      error: '添加书籍失败',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// PATCH: 更新书籍
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: '缺少书籍 ID' }, { status: 400 });
    }

    const updatedBook = await updateBook(id, updates);

    if (!updatedBook) {
      return NextResponse.json({ error: '书籍不存在' }, { status: 404 });
    }

    return NextResponse.json(updatedBook);
  } catch (error) {
    console.error('Failed to update book:', error);
    return NextResponse.json({ error: '更新书籍失败' }, { status: 500 });
  }
}

// DELETE: 删除书籍
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: '缺少书籍 ID' }, { status: 400 });
    }

    const success = await deleteBook(id);

    if (!success) {
      return NextResponse.json({ error: '书籍不存在' }, { status: 404 });
    }

    return NextResponse.json({ message: '删除成功' });
  } catch (error) {
    console.error('Failed to delete book:', error);
    return NextResponse.json({ error: '删除书籍失败' }, { status: 500 });
  }
}
