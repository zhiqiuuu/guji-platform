import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// 获取当前登录用户信息
export async function GET() {
  try {
    const supabase = await createClient();

    // 获取当前会话
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: '未登录' },
        { status: 401 }
      );
    }

    // 获取用户配置
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Profile fetch error:', profileError);
    }

    // 如果配置不存在,创建默认配置
    if (!profile) {
      const { data: newProfile, error: createError } = await supabase
        .from('user_profiles')
        .insert({
          id: user.id,
          username: user.user_metadata?.username || null,
          display_name: user.user_metadata?.display_name || null,
          role: 'user',
          default_theme: 'sepia',
          default_font_size: 'medium',
          default_line_height: 'normal',
        })
        .select()
        .single();

      if (createError) {
        console.error('Profile creation error:', createError);
      }

      return NextResponse.json({
        user: {
          id: user.id,
          email: user.email,
          username: newProfile?.username || null,
          display_name: newProfile?.display_name || null,
          role: newProfile?.role || 'user',
          avatar_url: newProfile?.avatar_url || null,
          default_theme: newProfile?.default_theme || 'sepia',
          default_font_size: newProfile?.default_font_size || 'medium',
          default_line_height: newProfile?.default_line_height || 'normal',
          books_read: newProfile?.books_read || 0,
          total_reading_time: newProfile?.total_reading_time || 0,
          created_at: newProfile?.created_at || new Date().toISOString(),
        },
      });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        username: profile.username,
        display_name: profile.display_name,
        role: profile.role,
        avatar_url: profile.avatar_url,
        bio: profile.bio,
        default_theme: profile.default_theme,
        default_font_size: profile.default_font_size,
        default_line_height: profile.default_line_height,
        books_read: profile.books_read,
        total_reading_time: profile.total_reading_time,
        created_at: profile.created_at,
        updated_at: profile.updated_at,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { error: '服务器错误,请稍后重试' },
      { status: 500 }
    );
  }
}
