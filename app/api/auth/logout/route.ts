import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const supabase = await createClient();

    // 使用Supabase登出
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Sign out error:', error);
      return NextResponse.json(
        { error: '登出失败,请稍后重试' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: '登出成功',
    });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: '服务器错误,请稍后重试' },
      { status: 500 }
    );
  }
}
