import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cookies } from 'next/headers';

/**
 * 临时API:将用户设置为管理员
 * 仅用于开发环境
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: '缺少userId参数' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const supabase = await createClient(cookieStore);

    // 更新用户角色为admin
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ role: 'admin' })
      .eq('id', userId)
      .select();

    if (error) {
      return NextResponse.json(
        { error: '更新失败', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '用户已设置为管理员',
      data,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: '服务器错误', details: error.message },
      { status: 500 }
    );
  }
}
