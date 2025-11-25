import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// 获取用户书架
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    // 验证用户登录
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      );
    }

    // 构建查询
    let query = supabase
      .from('bookshelf')
      .select(`
        *,
        book:books(*)
      `)
      .eq('user_id', user.id)
      .order('added_at', { ascending: false });

    // 按分类筛选
    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching bookshelf:', error);
      return NextResponse.json(
        { error: '获取书架失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({ items: data || [] });
  } catch (error) {
    console.error('Bookshelf error:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}

// 添加书籍到书架
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { book_id, category = 'default', tags, notes, rating } = body;

    // 验证必填字段
    if (!book_id) {
      return NextResponse.json(
        { error: '书籍ID不能为空' },
        { status: 400 }
      );
    }

    // 验证用户登录
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      );
    }

    // 检查书籍是否存在
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select('id')
      .eq('id', book_id)
      .single();

    if (bookError || !book) {
      return NextResponse.json(
        { error: '书籍不存在' },
        { status: 404 }
      );
    }

    // 添加到书架
    const { data, error } = await supabase
      .from('bookshelf')
      .insert({
        user_id: user.id,
        book_id,
        category,
        tags: tags || null,
        notes: notes || null,
        rating: rating || null,
      })
      .select()
      .single();

    if (error) {
      // 检查是否已存在
      if (error.code === '23505') {
        return NextResponse.json(
          { error: '该书籍已在书架中' },
          { status: 409 }
        );
      }
      console.error('Error adding to bookshelf:', error);
      return NextResponse.json(
        { error: '添加失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: '添加成功',
      item: data,
    });
  } catch (error) {
    console.error('Add to bookshelf error:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
