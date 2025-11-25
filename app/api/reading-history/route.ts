import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// 获取阅读历史
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');

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
      .from('reading_history')
      .select(`
        *,
        book:books(*)
      `)
      .eq('user_id', user.id)
      .order('last_read_at', { ascending: false })
      .limit(limit);

    // 按状态筛选
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching reading history:', error);
      return NextResponse.json(
        { error: '获取阅读历史失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({ history: data || [] });
  } catch (error) {
    console.error('Reading history error:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}

// 更新阅读进度
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const {
      book_id,
      current_page,
      total_pages,
      view_mode = 'pdf',
      scroll_position = 0,
    } = body;

    // 验证必填字段
    if (!book_id || current_page === undefined) {
      return NextResponse.json(
        { error: '缺少必填字段' },
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

    // 调用数据库函数更新进度
    const { error } = await supabase.rpc('update_reading_progress', {
      p_user_id: user.id,
      p_book_id: book_id,
      p_current_page: current_page,
      p_total_pages: total_pages || 0,
      p_view_mode: view_mode,
      p_scroll_position: scroll_position,
    });

    if (error) {
      console.error('Error updating reading progress:', error);
      return NextResponse.json(
        { error: '更新进度失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: '进度已更新',
    });
  } catch (error) {
    console.error('Update reading progress error:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
