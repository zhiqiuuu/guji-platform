import { supabase } from './supabase';
import { Book } from '@/types';

// 获取所有书籍
export async function getAllBooks(): Promise<Book[]> {
  try {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('获取书籍列表失败:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('getAllBooks 发生错误:', error);
    return [];
  }
}

// 筛选书籍
export async function filterBooks(params: {
  search?: string;
  category?: string;
  dynasty?: string;
  libraryType?: string;
  academy?: string;
  year?: string;
  season?: string;
  subject?: string;
}): Promise<Book[]> {
  try {
    let query = supabase
      .from('books')
      .select('*')
      .order('created_at', { ascending: false });

    // 搜索标题、作者、关键词或全文内容
    if (params.search) {
      query = query.or(`title.ilike.%${params.search}%,author.ilike.%${params.search}%,keywords.ilike.%${params.search}%,full_text.ilike.%${params.search}%`);
    }

    // 按分类筛选
    if (params.category) {
      query = query.eq('category', params.category);
    }

    // 按朝代筛选
    if (params.dynasty) {
      query = query.eq('dynasty', params.dynasty);
    }

    // 按书库类型筛选
    if (params.libraryType) {
      query = query.eq('library_type', params.libraryType);
    }

    // 按书院筛选
    if (params.academy) {
      query = query.eq('academy', params.academy);
    }

    // 按年份筛选
    if (params.year) {
      query = query.eq('year', params.year);
    }

    // 按季节筛选
    if (params.season) {
      query = query.eq('season', params.season);
    }

    // 按题目筛选
    if (params.subject) {
      query = query.eq('subject', params.subject);
    }

    const { data, error } = await query;

    if (error) {
      console.error('筛选书籍失败:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('filterBooks 发生错误:', error);
    return [];
  }
}

// 添加书籍
export async function addBook(
  book: Omit<Book, 'id' | 'view_count' | 'created_at' | 'updated_at'>
): Promise<Book> {
  try {
    console.log('开始添加书籍到Supabase, 输入数据:', book);

    const { data, error } = await supabase
      .from('books')
      .insert([
        {
          title: book.title,
          author: book.author,
          dynasty: book.dynasty,
          category: book.category,
          description: book.description,
          cover_url: book.cover_url,
          file_url: book.file_url,
          file_type: book.file_type,
          page_count: book.page_count,
        },
      ] as any)
      .select()
      .single();

    if (error) {
      console.error('添加书籍失败:', error);
      throw error;
    }

    console.log('书籍添加成功:', data);
    return data;
  } catch (error) {
    console.error('addBook 发生错误:', error);
    throw new Error(`添加书籍失败: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// 根据ID获取书籍
export async function getBookById(id: string): Promise<Book | null> {
  try {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('获取书籍失败:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('getBookById 发生错误:', error);
    return null;
  }
}

// 更新书籍
export async function updateBook(id: string, updates: Partial<Book>): Promise<Book | null> {
  try {
    const { data, error } = await (supabase
      .from('books')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      } as any) as any)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('更新书籍失败:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('updateBook 发生错误:', error);
    return null;
  }
}

// 删除书籍
export async function deleteBook(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.from('books').delete().eq('id', id);

    if (error) {
      console.error('删除书籍失败:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('deleteBook 发生错误:', error);
    return false;
  }
}

// 增加浏览次数
export async function incrementViewCount(id: string): Promise<boolean> {
  try {
    const { error } = await supabase.rpc('increment_view_count', { book_id: id } as any);

    if (error) {
      console.error('增加浏览次数失败:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('incrementViewCount 发生错误:', error);
    return false;
  }
}
