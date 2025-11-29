import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

/**
 * 获取热门书籍 - 优化版本
 * 直接在数据库层面排序和限制,避免获取全部数据
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '6');

    const { data, error } = await supabase
      .from('books')
      .select('*')
      .order('view_count', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('获取热门书籍失败:', error);
      return NextResponse.json({ error: '获取热门书籍失败' }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Failed to fetch popular books:', error);
    return NextResponse.json({ error: '获取热门书籍失败' }, { status: 500 });
  }
}
