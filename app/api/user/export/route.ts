import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET - 导出用户数据
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

    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';

    // 获取用户配置
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // 获取书架数据
    const { data: bookshelf } = await supabase
      .from('bookshelf')
      .select(`
        *,
        book:books(*)
      `)
      .eq('user_id', user.id);

    // 获取阅读历史
    const { data: readingHistory } = await supabase
      .from('reading_history')
      .select(`
        *,
        book:books(*)
      `)
      .eq('user_id', user.id)
      .order('last_read_at', { ascending: false });

    // 获取阅读笔记
    const { data: notes } = await supabase
      .from('reading_notes')
      .select(`
        *,
        book:books(*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    // 获取搜索历史
    const { data: searchHistory } = await supabase
      .from('search_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100);

    // 构建导出数据
    const exportData = {
      export_info: {
        exported_at: new Date().toISOString(),
        user_id: user.id,
        email: user.email,
        export_format: format,
      },
      profile: profile,
      bookshelf: bookshelf || [],
      reading_history: readingHistory || [],
      notes: notes || [],
      search_history: searchHistory || [],
    };

    // 如果请求CSV格式，进行转换
    if (format === 'csv') {
      // 简化的CSV格式，只包含主要数据
      const csvData = [
        ['数据类型', '项目', '详细信息'],
        ['用户', '邮箱', user.email],
        ['用户', '用户名', profile?.username || ''],
        ['用户', '显示名称', profile?.display_name || ''],
        ['用户', '角色', profile?.role || ''],
        ['书架', '总数', bookshelf?.length || 0],
        ['阅读历史', '总数', readingHistory?.length || 0],
        ['笔记', '总数', notes?.length || 0],
        ['搜索历史', '总数', searchHistory?.length || 0],
      ];

      const csv = csvData.map(row => row.join(',')).join('\n');

      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="user-data-export-${Date.now()}.csv"`,
        },
      });
    }

    // 默认返回JSON格式
    return NextResponse.json(exportData);
  } catch (error) {
    console.error('Error exporting user data:', error);
    return NextResponse.json(
      { error: '导出失败' },
      { status: 500 }
    );
  }
}
