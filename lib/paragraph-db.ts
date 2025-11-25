import { supabase } from './supabase';
import { BookParagraphInsert, ParagraphSearchResult } from '@/types';
import { extractParagraphs, PageText } from './paragraph-splitter';

/**
 * 批量插入段落
 * @param bookId 书籍ID
 * @param pageTexts 页面文本数组
 */
export async function saveParagraphs(
  bookId: string,
  pageTexts: PageText[]
): Promise<boolean> {
  try {
    // 提取段落
    const paragraphs = extractParagraphs(pageTexts);

    if (paragraphs.length === 0) {
      console.warn('没有提取到任何段落');
      return true;
    }

    // 构建插入数据
    const paragraphsToInsert: BookParagraphInsert[] = paragraphs.map((p) => ({
      book_id: bookId,
      page_number: p.page_number,
      paragraph_index: p.paragraph_index,
      content: p.content,
      position_start: p.position_start,
      position_end: p.position_end,
    }));

    // 批量插入 (Supabase 单次最多1000条)
    const batchSize = 1000;
    for (let i = 0; i < paragraphsToInsert.length; i += batchSize) {
      const batch = paragraphsToInsert.slice(i, i + batchSize);

      const { error } = await supabase
        .from('book_paragraphs')
        .insert(batch as any);

      if (error) {
        console.error(`批量插入段落失败 (批次 ${i / batchSize + 1}):`, error);
        throw error;
      }
    }

    console.log(`成功保存 ${paragraphs.length} 个段落`);
    return true;
  } catch (error) {
    console.error('saveParagraphs 发生错误:', error);
    return false;
  }
}

/**
 * 删除书籍的所有段落
 * @param bookId 书籍ID
 */
export async function deleteParagraphsByBookId(bookId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('book_paragraphs')
      .delete()
      .eq('book_id', bookId);

    if (error) {
      console.error('删除段落失败:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('deleteParagraphsByBookId 发生错误:', error);
    return false;
  }
}

/**
 * 搜索段落
 * @param searchQuery 搜索关键词
 * @param limitCount 返回结果数量限制
 */
export async function searchParagraphs(
  searchQuery: string,
  limitCount: number = 50
): Promise<ParagraphSearchResult[]> {
  try {
    if (!searchQuery || searchQuery.trim() === '') {
      return [];
    }

    const { data, error } = await supabase.rpc('search_book_paragraphs', {
      search_query: searchQuery,
      limit_count: limitCount,
    } as any);

    if (error) {
      console.error('搜索段落失败:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('searchParagraphs 发生错误:', error);
    return [];
  }
}

/**
 * 获取书籍的所有段落
 * @param bookId 书籍ID
 */
export async function getParagraphsByBookId(bookId: string) {
  try {
    const { data, error } = await supabase
      .from('book_paragraphs')
      .select('*')
      .eq('book_id', bookId)
      .order('page_number', { ascending: true })
      .order('paragraph_index', { ascending: true });

    if (error) {
      console.error('获取段落失败:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('getParagraphsByBookId 发生错误:', error);
    return [];
  }
}

/**
 * 获取段落总数
 * @param bookId 书籍ID (可选)
 */
export async function getParagraphCount(bookId?: string): Promise<number> {
  try {
    let query = supabase
      .from('book_paragraphs')
      .select('id', { count: 'exact', head: true });

    if (bookId) {
      query = query.eq('book_id', bookId);
    }

    const { count, error } = await query;

    if (error) {
      console.error('获取段落总数失败:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('getParagraphCount 发生错误:', error);
    return 0;
  }
}
