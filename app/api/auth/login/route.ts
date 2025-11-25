import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    // 验证必填字段
    if (!email || !password) {
      return NextResponse.json(
        { error: '邮箱和密码不能为空' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 使用Supabase登录
    const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      console.error('Sign in error:', signInError);
      return NextResponse.json(
        { error: '邮箱或密码错误' },
        { status: 401 }
      );
    }

    if (!authData.user || !authData.session) {
      return NextResponse.json(
        { error: '登录失败,请稍后重试' },
        { status: 500 }
      );
    }

    // 获取用户配置信息
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Profile fetch error:', profileError);
    }

    // 如果用户配置不存在,创建默认配置
    if (!profile) {
      const { error: createProfileError } = await supabase
        .from('user_profiles')
        .insert({
          id: authData.user.id,
          username: authData.user.user_metadata?.username || null,
          display_name: authData.user.user_metadata?.display_name || null,
          role: 'user',
          default_theme: 'sepia',
          default_font_size: 'medium',
          default_line_height: 'normal',
        });

      if (createProfileError) {
        console.error('Profile creation error:', createProfileError);
      }
    }

    return NextResponse.json({
      message: '登录成功',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        username: profile?.username || authData.user.user_metadata?.username || null,
        display_name: profile?.display_name || authData.user.user_metadata?.display_name || null,
        role: profile?.role || 'user',
        avatar_url: profile?.avatar_url || null,
      },
      session: {
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
        expires_at: authData.session.expires_at,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: '服务器错误,请稍后重试' },
      { status: 500 }
    );
  }
}
