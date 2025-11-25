import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// 获取书架统计
export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    // 验证用户登录
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      );
    }

    // 调用数据库函数获取统计
    const { data, error } = await supabase.rpc('get_bookshelf_stats', {
      p_user_id: user.id,
    });

    if (error) {
      console.error('Error fetching bookshelf stats:', error);
      return NextResponse.json(
        { error: '获取统计失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      stats: data || {
        total_books: 0,
        reading_count: 0,
        completed_count: 0,
        favorites_count: 0,
      },
    });
  } catch (error) {
    console.error('Bookshelf stats error:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
