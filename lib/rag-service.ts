import { supabase } from './supabase';
import { Book } from '@/types';
import { CATEGORIES, DYNASTIES } from './constants';

/**
 * RAG (Retrieval-Augmented Generation) 服务
 * 根据用户问题智能检索数据库中的相关信息
 */

export interface RAGContext {
  books?: Book[];
  stats?: {
    total: number;
    byCategory?: Record<string, number>;
    byDynasty?: Record<string, number>;
    byLibraryType?: Record<string, number>;
    byAcademy?: Record<string, number>;
  };
  relevantInfo?: string;
}

/**
 * 分析用户问题,提取关键词和意图
 */
function analyzeQuery(query: string): {
  keywords: string[];
  category?: string;
  dynasty?: string;
  libraryType?: '课题库' | '课艺库';
  academy?: string;
  needsStats: boolean;
  needsBooks: boolean;
} {
  const lowerQuery = query.toLowerCase();

  // 检测是否需要统计信息
  const needsStats = /多少|数量|统计|总共|共有|几部|几本/.test(query);

  // 检测是否需要具体书籍
  const needsBooks = /哪些|书名|列举|推荐|查找|搜索|有什么|内容/.test(query);

  // 提取分类
  let category: string | undefined;
  for (const cat of CATEGORIES) {
    if (query.includes(cat)) {
      category = cat;
      break;
    }
  }

  // 提取朝代
  let dynasty: string | undefined;
  for (const dyn of DYNASTIES) {
    if (query.includes(dyn)) {
      dynasty = dyn;
      break;
    }
  }

  // 提取库类型
  let libraryType: '课题库' | '课艺库' | undefined;
  if (query.includes('课题')) {
    libraryType = '课题库';
  } else if (query.includes('课艺')) {
    libraryType = '课艺库';
  }

  // 提取书院
  let academy: string | undefined;
  if (query.includes('求志') || query.includes('书院')) {
    academy = '求志书院';
  }

  // 提取关键词(去除常见停用词)
  const stopWords = ['的', '了', '吗', '呢', '啊', '是', '有', '在', '请', '帮', '我', '给', '一下'];
  const keywords = query
    .split(/[,。、\s]+/)
    .filter(word => word.length > 0 && !stopWords.includes(word));

  return {
    keywords,
    category,
    dynasty,
    libraryType,
    academy,
    needsStats,
    needsBooks
  };
}

/**
 * 获取统计信息
 */
async function getStats(filters?: {
  category?: string;
  dynasty?: string;
  libraryType?: string;
  academy?: string;
}): Promise<RAGContext['stats']> {
  try {
    let query = supabase.from('books').select('category, dynasty, library_type, academy', { count: 'exact' });

    if (filters?.category) query = query.eq('category', filters.category);
    if (filters?.dynasty) query = query.eq('dynasty', filters.dynasty);
    if (filters?.libraryType) query = query.eq('library_type', filters.libraryType);
    if (filters?.academy) query = query.eq('academy', filters.academy);

    const { data, count } = await query;

    if (!data) return { total: 0 };

    // 统计各分类数量
    const byCategory: Record<string, number> = {};
    const byDynasty: Record<string, number> = {};
    const byLibraryType: Record<string, number> = {};
    const byAcademy: Record<string, number> = {};

    data.forEach(book => {
      if (book.category) byCategory[book.category] = (byCategory[book.category] || 0) + 1;
      if (book.dynasty) byDynasty[book.dynasty] = (byDynasty[book.dynasty] || 0) + 1;
      if (book.library_type) byLibraryType[book.library_type] = (byLibraryType[book.library_type] || 0) + 1;
      if (book.academy) byAcademy[book.academy] = (byAcademy[book.academy] || 0) + 1;
    });

    return {
      total: count || 0,
      byCategory,
      byDynasty,
      byLibraryType,
      byAcademy
    };
  } catch (error) {
    console.error('获取统计信息失败:', error);
    return { total: 0 };
  }
}

/**
 * 搜索相关书籍
 */
async function searchBooks(filters: {
  keywords?: string[];
  category?: string;
  dynasty?: string;
  libraryType?: string;
  academy?: string;
  limit?: number;
}): Promise<Book[]> {
  try {
    const limit = filters.limit || 10;
    let query = supabase
      .from('books')
      .select('*')
      .order('view_count', { ascending: false })
      .limit(limit);

    // 应用过滤器
    if (filters.category) query = query.eq('category', filters.category);
    if (filters.dynasty) query = query.eq('dynasty', filters.dynasty);
    if (filters.libraryType) query = query.eq('library_type', filters.libraryType);
    if (filters.academy) query = query.eq('academy', filters.academy);

    // 关键词搜索
    if (filters.keywords && filters.keywords.length > 0) {
      const keyword = filters.keywords[0];
      query = query.or(`title.ilike.%${keyword}%,author.ilike.%${keyword}%,subject.ilike.%${keyword}%,keywords.ilike.%${keyword}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('搜索书籍失败:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('searchBooks 发生错误:', error);
    return [];
  }
}

/**
 * 主RAG函数 - 根据用户问题检索相关上下文
 */
export async function retrieveContext(userQuery: string): Promise<RAGContext> {
  const analysis = analyzeQuery(userQuery);
  const context: RAGContext = {};

  // 如果问题包含统计相关的词,获取统计信息
  if (analysis.needsStats) {
    context.stats = await getStats({
      category: analysis.category,
      dynasty: analysis.dynasty,
      libraryType: analysis.libraryType,
      academy: analysis.academy
    });
  }

  // 如果问题需要具体书籍信息,搜索相关书籍
  if (analysis.needsBooks || analysis.keywords.length > 0) {
    context.books = await searchBooks({
      keywords: analysis.keywords,
      category: analysis.category,
      dynasty: analysis.dynasty,
      libraryType: analysis.libraryType,
      academy: analysis.academy,
      limit: 8
    });
  }

  // 构建相关信息文本
  let relevantInfo = '';

  if (context.stats) {
    relevantInfo += `\n## 数据库统计信息\n`;
    relevantInfo += `- 总计: ${context.stats.total} 部\n`;

    if (context.stats.byLibraryType && Object.keys(context.stats.byLibraryType).length > 0) {
      relevantInfo += `- 按类型: `;
      relevantInfo += Object.entries(context.stats.byLibraryType)
        .map(([type, count]) => `${type} ${count}部`)
        .join(', ');
      relevantInfo += '\n';
    }

    if (context.stats.byCategory && Object.keys(context.stats.byCategory).length > 0) {
      relevantInfo += `- 按分类: `;
      relevantInfo += Object.entries(context.stats.byCategory)
        .map(([cat, count]) => `${cat} ${count}部`)
        .join(', ');
      relevantInfo += '\n';
    }
  }

  if (context.books && context.books.length > 0) {
    relevantInfo += `\n## 相关书籍 (共${context.books.length}部)\n`;
    context.books.forEach((book, index) => {
      relevantInfo += `${index + 1}. 《${book.title}》\n`;
      relevantInfo += `   - 作者: ${book.author || '未知'}\n`;
      relevantInfo += `   - 分类: ${book.category}\n`;
      if (book.library_type) relevantInfo += `   - 类型: ${book.library_type}\n`;
      if (book.academy) relevantInfo += `   - 书院: ${book.academy}\n`;
      if (book.year) relevantInfo += `   - 年份: ${book.year}\n`;
      if (book.season) relevantInfo += `   - 季节: ${book.season}\n`;
      if (book.subject) relevantInfo += `   - 题目: ${book.subject}\n`;
      if (book.description) relevantInfo += `   - 简介: ${book.description.substring(0, 100)}...\n`;
      relevantInfo += '\n';
    });
  }

  context.relevantInfo = relevantInfo;

  return context;
}

/**
 * 格式化RAG上下文为AI提示词
 */
export function formatContextForAI(context: RAGContext): string {
  if (!context.relevantInfo || context.relevantInfo.trim() === '') {
    return '';
  }

  return `
# 数据库检索结果

以下是从数据库中检索到的与用户问题相关的信息,请基于这些真实数据回答用户问题:

${context.relevantInfo}

## 重要提示
- 请优先使用上述数据库中的真实信息回答问题
- 如果数据库中没有相关信息,可以基于你的知识回答,但要明确说明这不是数据库中的内容
- 回答要准确、具体,引用具体的书名、数量等信息
- 保持专业且易懂的语言风格
`;
}
