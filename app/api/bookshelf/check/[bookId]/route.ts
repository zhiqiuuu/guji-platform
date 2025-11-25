import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// 检查书籍是否在书架中
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
        inBookshelf: false,
        item: null,
      });
    }

    // 查询书架项
    const { data, error } = await supabase
      .from('bookshelf')
      .select('*')
      .eq('user_id', user.id)
      .eq('book_id', bookId)
      .maybeSingle();

    if (error) {
      console.error('Error checking bookshelf:', error);
      return NextResponse.json(
        { error: '查询失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      inBookshelf: !!data,
      item: data || null,
    });
  } catch (error) {
    console.error('Check bookshelf error:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
