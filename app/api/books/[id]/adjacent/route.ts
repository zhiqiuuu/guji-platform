import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// GET: 获取相邻的书籍(上一篇/下一篇)
// 根据URL参数中的筛选条件动态调整上下篇的范围
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const searchParams = request.nextUrl.searchParams;

    // 从URL获取当前的筛选条件
    const libraryType = searchParams.get('library_type');
    const academy = searchParams.get('academy');
    const year = searchParams.get('year');
    const season = searchParams.get('season');
    const category = searchParams.get('category');
    const subject = searchParams.get('subject');

    // 1. 获取当前书籍信息(包括created_at用于排序)
    const { data: currentBook, error: currentError } = await supabase
      .from('books')
      .select('*')
      .eq('id', id)
      .single();

    if (currentError || !currentBook) {
      return NextResponse.json({ error: '书籍不存在' }, { status: 404 });
    }

    // 2. 构建查询条件 - 根据传入的筛选参数动态构建
    const buildQuery = () => {
      let query = supabase
        .from('books')
        .select('id, title, author, category, year, season, academy, subject, created_at');

      // 根据URL参数应用筛选条件
      if (libraryType) {
        query = query.eq('library_type', libraryType);
      }
      if (academy) {
        query = query.eq('academy', academy);
      }
      if (year) {
        query = query.eq('year', year);
      }
      if (season) {
        query = query.eq('season', season);
      }
      if (category) {
        query = query.eq('category', category);
      }
      if (subject) {
        query = query.eq('subject', subject);
      }

      return query;
    };

    // 3. 获取上一篇(created_at大于当前书籍的第一本)
    // 注意:因为列表是created_at降序,所以"上一篇"是created_at更大(更新)的书
    const { data: prevBooks } = await buildQuery()
      .gt('created_at', currentBook.created_at)
      .order('created_at', { ascending: true }) // 取最接近的一本
      .limit(1);

    // 4. 获取下一篇(created_at小于当前书籍的第一本)
    const { data: nextBooks } = await buildQuery()
      .lt('created_at', currentBook.created_at)
      .order('created_at', { ascending: false }) // 取最接近的一本
      .limit(1);

    return NextResponse.json({
      prev: prevBooks?.[0] || null,
      next: nextBooks?.[0] || null,
      current: {
        id: currentBook.id,
        title: currentBook.title,
        created_at: currentBook.created_at,
      },
    });
  } catch (error) {
    console.error('Failed to fetch adjacent books:', error);
    return NextResponse.json(
      { error: '获取相邻书籍失败' },
      { status: 500 }
    );
  }
}
