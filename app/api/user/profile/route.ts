import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - 获取用户配置
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 获取当前用户
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: '未授权' },
        { status: 401 }
      );
    }

    // 获取用户配置
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return NextResponse.json(
        { error: '获取用户配置失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}

// PATCH - 更新用户配置
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();

    // 获取当前用户
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: '未授权' },
        { status: 401 }
      );
    }

    // 获取请求体
    const body = await request.json();

    // 验证可更新的字段
    const allowedFields = [
      'username',
      'display_name',
      'avatar_url',
      'bio',
      'default_theme',
      'default_font_size',
      'default_line_height',
      'email_notifications',
      'reading_reminders',
      'weekly_report',
    ];

    // 过滤掉不允许的字段
    const updates: Record<string, any> = {};
    for (const field of allowedFields) {
      if (field in body) {
        updates[field] = body[field];
      }
    }

    // 如果没有要更新的字段
    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: '没有要更新的字段' },
        { status: 400 }
      );
    }

    // 用户名验证
    if ('username' in updates && updates.username) {
      const username = updates.username.trim();

      // 验证用户名格式(只允许字母、数字和下划线)
      if (!/^[a-zA-Z0-9_]{3,50}$/.test(username)) {
        return NextResponse.json(
          { error: '用户名格式不正确，只能包含字母、数字和下划线，长度3-50个字符' },
          { status: 400 }
        );
      }

      // 检查用户名是否已被占用
      const { data: existingUser, error: checkError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('username', username)
        .neq('id', user.id)
        .single();

      if (existingUser) {
        return NextResponse.json(
          { error: '用户名已被占用' },
          { status: 400 }
        );
      }
    }

    // 更新用户配置
    const { data: updatedProfile, error: updateError } = await supabase
      .from('user_profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json(
        { error: '更新失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: '更新成功',
      profile: updatedProfile
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    );
  }
}
