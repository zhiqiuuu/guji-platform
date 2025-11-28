import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// DELETE: 清空所有书籍数据
export async function DELETE(request: NextRequest) {
  try {
    console.log('开始清空所有书籍数据...');

    // 1. 获取所有书籍ID
    const { data: allBooks } = await supabase.from('books').select('id');
    const bookIds = allBooks?.map((book) => book.id) || [];

    if (bookIds.length === 0) {
      console.log('✓ 数据库中没有书籍');
      return NextResponse.json({
        success: true,
        message: '数据库中没有书籍,无需删除',
        result: { books: 0, paragraphs: 0, bookshelf: 0 },
      });
    }

    console.log(`找到 ${bookIds.length} 本书籍,开始删除...`);

    const batchSize = 100;

    // 辅助函数: 分批删除
    async function deleteBatch(tableName: string, bookIds: string[]) {
      for (let i = 0; i < bookIds.length; i += batchSize) {
        const batch = bookIds.slice(i, i + batchSize);
        const { error } = await supabase.from(tableName).delete().in('book_id', batch);
        if (error && !error.message.includes('does not exist')) {
          throw error;
        }
      }
    }

    // 2. 删除阅读笔记 (如果表存在)
    try {
      await deleteBatch('reading_notes', bookIds);
      console.log('✓ 已删除相关阅读笔记');
    } catch (e: any) {
      console.log('跳过阅读笔记:', e.message);
    }

    // 3. 删除阅读历史
    await deleteBatch('reading_history', bookIds);
    console.log('✓ 已删除相关阅读历史');

    // 4. 删除书架数据
    await deleteBatch('bookshelf', bookIds);
    console.log('✓ 已删除相关书架数据');

    // 5. 删除搜索历史 (如果表存在)
    try {
      await deleteBatch('search_history', bookIds);
      console.log('✓ 已删除相关搜索历史');
    } catch (e: any) {
      console.log('跳过搜索历史:', e.message);
    }

    // 6. 删除段落数据
    await deleteBatch('book_paragraphs', bookIds);
    console.log('✓ 已删除相关段落数据');

    // 7. 分批删除图书数据 (每次100本)
    for (let i = 0; i < bookIds.length; i += batchSize) {
      const batch = bookIds.slice(i, i + batchSize);
      const { error: booksError } = await supabase.from('books').delete().in('id', batch);
      if (booksError) {
        console.error('删除图书数据失败:', booksError);
        throw booksError;
      }
      console.log(`✓ 已删除第 ${i + 1}-${Math.min(i + batchSize, bookIds.length)} 本书籍`);
    }
    console.log('✓ 已删除所有图书数据');

    // 7. 验证删除结果
    const { count: booksCount } = await supabase.from('books').select('*', { count: 'exact', head: true });
    const { count: paragraphsCount } = await supabase.from('book_paragraphs').select('*', { count: 'exact', head: true });
    const { count: bookshelfCount } = await supabase.from('bookshelf').select('*', { count: 'exact', head: true });

    console.log('删除完成,剩余记录:', {
      books: booksCount,
      paragraphs: paragraphsCount,
      bookshelf: bookshelfCount,
    });

    return NextResponse.json({
      success: true,
      message: '所有书籍数据已清空',
      result: {
        books: booksCount || 0,
        paragraphs: paragraphsCount || 0,
        bookshelf: bookshelfCount || 0,
      },
    });
  } catch (error: any) {
    console.error('清空书籍数据失败:', error);
    return NextResponse.json(
      {
        error: '清空失败',
        details: error.message || '未知错误',
      },
      { status: 500 }
    );
  }
}
