import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// 更新书架项
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const body = await request.json();
    const { category, tags, notes, rating } = body;

    // 验证用户登录
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      );
    }

    // 更新书架项
    const { data, error } = await supabase
      .from('bookshelf')
      .update({
        ...(category !== undefined && { category }),
        ...(tags !== undefined && { tags }),
        ...(notes !== undefined && { notes }),
        ...(rating !== undefined && { rating }),
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating bookshelf:', error);
      return NextResponse.json(
        { error: '更新失败' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: '书架项不存在' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: '更新成功',
      item: data,
    });
  } catch (error) {
    console.error('Update bookshelf error:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}

// 从书架移除
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // 验证用户登录
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      );
    }

    // 删除书架项
    const { error } = await supabase
      .from('bookshelf')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting from bookshelf:', error);
      return NextResponse.json(
        { error: '删除失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: '删除成功',
    });
  } catch (error) {
    console.error('Delete from bookshelf error:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
