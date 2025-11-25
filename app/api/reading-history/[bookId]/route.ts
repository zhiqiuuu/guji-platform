import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// 获取特定书籍的阅读历史
export async function GET(
  request: Request,
  { params }: { params: Promise<{ bookId: string }> }
) {
  try {
    const supabase = await createClient();
    const { bookId } = await params;

    // 验证用户登录
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({
        history: null,
      });
    }

    // 查询阅读历史
    const { data, error } = await supabase
      .from('reading_history')
      .select('*')
      .eq('user_id', user.id)
      .eq('book_id', bookId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching reading history:', error);
      return NextResponse.json(
        { error: '查询失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      history: data || null,
    });
  } catch (error) {
    console.error('Get reading history error:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}

// 删除阅读历史
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ bookId: string }> }
) {
  try {
    const supabase = await createClient();
    const { bookId } = await params;

    // 验证用户登录
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      );
    }

    // 删除阅读历史
    const { error } = await supabase
      .from('reading_history')
      .delete()
      .eq('user_id', user.id)
      .eq('book_id', bookId);

    if (error) {
      console.error('Error deleting reading history:', error);
      return NextResponse.json(
        { error: '删除失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: '删除成功',
    });
  } catch (error) {
    console.error('Delete reading history error:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
