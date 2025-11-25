import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, password, username, display_name } = await request.json();

    // 验证必填字段
    if (!email || !password) {
      return NextResponse.json(
        { error: '邮箱和密码不能为空' },
        { status: 400 }
      );
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: '邮箱格式不正确' },
        { status: 400 }
      );
    }

    // 验证密码长度
    if (password.length < 6) {
      return NextResponse.json(
        { error: '密码长度至少为6位' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // 使用Supabase注册用户
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username: username || null,
          display_name: display_name || null,
        },
      },
    });

    if (signUpError) {
      console.error('Sign up error:', signUpError);
      return NextResponse.json(
        { error: signUpError.message },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: '注册失败,请稍后重试' },
        { status: 500 }
      );
    }

    // 创建用户配置记录
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        id: authData.user.id,
        username: username || null,
        display_name: display_name || null,
        role: 'user',
        default_theme: 'sepia',
        default_font_size: 'medium',
        default_line_height: 'normal',
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // 用户已创建,但配置创建失败 - 可以在后续登录时补救
    }

    return NextResponse.json({
      message: '注册成功',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        username: username || null,
        display_name: display_name || null,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    return NextResponse.json(
      { error: '服务器错误,请稍后重试' },
      { status: 500 }
    );
  }
}
