import { supabase } from './supabase';
import { Book, BookParagraph } from '@/types';
import { CATEGORIES, DYNASTIES } from './constants';

/**
 * 云四库风格的增强版RAG服务
 * 参考云四库智能问答系统的功能设计
 *
 * 核心功能:
 * 1. 古文翻译(文言文→白话文/英文)
 * 2. 文献溯源(定位出处)
 * 3. 古文标点
 * 4. 诗文赏析
 * 5. 实体提取(人名、地名、职官等)
 * 6. 知识问答(文史哲问题)
 */

// ==================== 类型定义 ====================

export interface SikuRAGContext {
  // 基础检索
  books?: Book[];
  paragraphs?: BookParagraph[];

  // 统计数据
  stats?: {
    total: number;
    byCategory?: Record<string, number>;
    byDynasty?: Record<string, number>;
    byLibraryType?: Record<string, number>;
    byAcademy?: Record<string, number>;
  };

  // 增强功能上下文
  sourceInfo?: SourceInfo;      // 文献溯源信息
  entities?: EntityInfo;        // 实体信息
  relatedWorks?: RelatedWork[]; // 相关作品

  // 格式化的提示词
  relevantInfo?: string;
}

// 文献溯源信息
export interface SourceInfo {
  originalText: string;        // 原文
  sources: {
    bookTitle: string;          // 书名
    author: string;             // 作者
    dynasty: string;            // 朝代
    chapter?: string;           // 章节
    pageNumber?: number;        // 页码
    confidence: number;         // 置信度(0-1)
  }[];
}

// 实体提取信息
export interface EntityInfo {
  persons: string[];           // 人名
  places: string[];            // 地名
  officials: string[];         // 职官
  events: string[];            // 事件
  works: string[];             // 著作
  dynasties: string[];         // 朝代
  concepts: string[];          // 学术概念
}

// 相关作品
export interface RelatedWork {
  bookId: string;
  title: string;
  author: string;
  relevance: string;          // 相关性说明
}

// 问题类型
export enum QuestionType {
  TRANSLATION = 'translation',        // 翻译类
  SOURCE_TRACING = 'source_tracing', // 溯源类
  PUNCTUATION = 'punctuation',       // 标点类
  APPRECIATION = 'appreciation',     // 赏析类
  ENTITY_EXTRACTION = 'entity',      // 实体提取类
  KNOWLEDGE_QA = 'knowledge_qa',     // 知识问答类
  GENERAL = 'general'                // 通用类
}

// ==================== 问题分析 ====================

/**
 * 分析用户问题的类型和意图
 */
export function analyzeQuestionType(query: string): {
  type: QuestionType;
  subType?: string;
  needsRAG: boolean;
  extractedText?: string;
} {
  const lowerQuery = query.toLowerCase();

  // 1. 翻译类
  if (/翻译|译|白话|现代汉语|英文|英语|translate/.test(query)) {
    return {
      type: QuestionType.TRANSLATION,
      subType: /英文|英语|english|translate/.test(query) ? 'to_english' : 'to_modern',
      needsRAG: false,
      extractedText: extractQuotedText(query)
    };
  }

  // 2. 文献溯源类
  if (/出处|出自|来源|哪本书|哪部|溯源|source/.test(query)) {
    return {
      type: QuestionType.SOURCE_TRACING,
      needsRAG: true,
      extractedText: extractQuotedText(query)
    };
  }

  // 3. 标点类
  if (/标点|断句|句读/.test(query)) {
    return {
      type: QuestionType.PUNCTUATION,
      needsRAG: false,
      extractedText: extractQuotedText(query)
    };
  }

  // 4. 赏析类
  if (/赏析|鉴赏|分析|解读|评价|如何理解/.test(query)) {
    return {
      type: QuestionType.APPRECIATION,
      needsRAG: true,
      extractedText: extractQuotedText(query)
    };
  }

  // 5. 实体提取类
  if (/提取|找出|列出|人名|地名|职官|事件/.test(query)) {
    return {
      type: QuestionType.ENTITY_EXTRACTION,
      needsRAG: false,
      extractedText: extractQuotedText(query)
    };
  }

  // 6. 知识问答类(默认)
  return {
    type: QuestionType.KNOWLEDGE_QA,
    needsRAG: true
  };
}

/**
 * 提取引号或书名号中的文本
 */
function extractQuotedText(query: string): string | undefined {
  // 匹配双引号
  const doubleQuote = query.match(/"([^"]+)"/);
  if (doubleQuote) return doubleQuote[1];

  // 匹配中文引号
  const chineseQuote = query.match(/「([^」]+)」|『([^』]+)』|"([^"]+)"/);
  if (chineseQuote) return chineseQuote[1] || chineseQuote[2] || chineseQuote[3];

  // 匹配书名号
  const bookName = query.match(/《([^》]+)》/);
  if (bookName) return bookName[1];

  return undefined;
}

// ==================== 增强检索功能 ====================

/**
 * 文献溯源检索
 * 在段落库中搜索匹配的原文,定位出处
 */
export async function traceSource(text: string): Promise<SourceInfo | null> {
  try {
    // 1. 精确匹配
    let { data: exactMatches } = await supabase
      .from('book_paragraphs')
      .select(`
        content,
        page_number,
        book_id,
        books (
          title,
          author,
          dynasty,
          subject
        )
      `)
      .ilike('content', `%${text}%`)
      .limit(5);

    if (!exactMatches || exactMatches.length === 0) {
      // 2. 模糊匹配(使用全文搜索)
      const { data: fuzzyMatches } = await supabase
        .rpc('search_book_paragraphs', {
          search_query: text,
          limit_count: 5
        });

      exactMatches = fuzzyMatches as any;
    }

    if (!exactMatches || exactMatches.length === 0) {
      return null;
    }

    // 构建溯源信息
    const sources = exactMatches.map((match: any) => ({
      bookTitle: match.books?.title || match.book_title || '未知',
      author: match.books?.author || match.book_author || '未知',
      dynasty: match.books?.dynasty || '未知',
      chapter: match.books?.subject || undefined,
      pageNumber: match.page_number,
      confidence: calculateConfidence(text, match.content)
    }));

    return {
      originalText: text,
      sources: sources.sort((a, b) => b.confidence - a.confidence)
    };
  } catch (error) {
    console.error('文献溯源失败:', error);
    return null;
  }
}

/**
 * 计算文本匹配置信度
 */
function calculateConfidence(query: string, content: string): number {
  if (!content) return 0;

  // 完全匹配
  if (content.includes(query)) {
    const matchRatio = query.length / content.length;
    return Math.min(0.7 + matchRatio * 0.3, 1.0);
  }

  // 部分匹配
  const queryChars = new Set(query.split(''));
  const contentChars = new Set(content.split(''));
  const intersection = [...queryChars].filter(char => contentChars.has(char));

  return intersection.length / queryChars.size * 0.5;
}

/**
 * 智能实体提取
 * 从文本中提取人名、地名、职官等实体
 */
export async function extractEntities(text: string): Promise<EntityInfo> {
  // 这里使用简单的规则匹配,实际应用可以使用NER模型
  const entities: EntityInfo = {
    persons: [],
    places: [],
    officials: [],
    events: [],
    works: [],
    dynasties: [],
    concepts: []
  };

  // 提取朝代
  DYNASTIES.forEach(dynasty => {
    if (text.includes(dynasty)) {
      entities.dynasties.push(dynasty);
    }
  });

  // 提取书名(书名号内容)
  const bookMatches = text.matchAll(/《([^》]+)》/g);
  for (const match of bookMatches) {
    entities.works.push(match[1]);
  }

  // 提取职官(常见模式)
  const officialPatterns = [
    /([^,。、\s]{2,4})[侍尚书令史郎官长丞相宰辅]/g,
    /(太守|刺史|州牧|县令|县丞|主簿|尚书|侍郎|御史|翰林|编修)/g
  ];

  officialPatterns.forEach(pattern => {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      entities.officials.push(match[1] || match[0]);
    }
  });

  // 提取地名(常见模式)
  const placePatterns = [
    /([^,。、\s]{2,5})(省|府|州|县|郡|路|道|江|河|山|湖|海)/g
  ];

  placePatterns.forEach(pattern => {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      entities.places.push(match[0]);
    }
  });

  // 提取人名(简单规则:姓+名,2-4个字)
  // 注意:这个规则很粗糙,实际应用应该使用专业的NER模型
  const commonSurnames = ['王', '李', '张', '刘', '陈', '杨', '赵', '黄', '周', '吴', '徐', '孙', '朱', '马', '胡', '郭', '林', '何', '高', '罗'];
  const personPattern = new RegExp(`(${commonSurnames.join('|')})[^,。、\s]{1,3}(?=[,。、\s]|$)`, 'g');
  const personMatches = text.matchAll(personPattern);

  for (const match of personMatches) {
    const name = match[0];
    // 过滤掉明显不是人名的(如地名、官名等)
    if (!entities.places.includes(name) && !entities.officials.includes(name)) {
      entities.persons.push(name);
    }
  }

  // 去重
  Object.keys(entities).forEach(key => {
    entities[key as keyof EntityInfo] = [...new Set(entities[key as keyof EntityInfo])];
  });

  return entities;
}

/**
 * 查找相关作品
 */
export async function findRelatedWorks(
  query: string,
  category?: string,
  limit: number = 5
): Promise<RelatedWork[]> {
  try {
    let queryBuilder = supabase
      .from('books')
      .select('id, title, author, category, subject, keywords')
      .limit(limit);

    if (category) {
      queryBuilder = queryBuilder.eq('category', category);
    }

    // 关键词搜索
    const keywords = query.split(/[,。、\s]+/).filter(w => w.length > 1);
    if (keywords.length > 0) {
      const keyword = keywords[0];
      queryBuilder = queryBuilder.or(
        `title.ilike.%${keyword}%,` +
        `subject.ilike.%${keyword}%,` +
        `keywords.ilike.%${keyword}%`
      );
    }

    const { data, error } = await queryBuilder;

    if (error || !data) return [];

    return data.map(book => ({
      bookId: book.id,
      title: book.title,
      author: book.author || '未知',
      relevance: determineRelevance(query, book)
    }));
  } catch (error) {
    console.error('查找相关作品失败:', error);
    return [];
  }
}

/**
 * 判断相关性
 */
function determineRelevance(query: string, book: any): string {
  if (book.title.includes(query)) return '标题匹配';
  if (book.subject?.includes(query)) return '题目匹配';
  if (book.keywords?.includes(query)) return '关键词匹配';
  if (book.category) return `同为${book.category}类`;
  return '内容相关';
}

// ==================== 主RAG函数 ====================

/**
 * 云四库风格的增强版RAG检索
 */
export async function retrieveSikuContext(
  userQuery: string
): Promise<SikuRAGContext> {
  const analysis = analyzeQuestionType(userQuery);
  const context: SikuRAGContext = {};

  // 根据问题类型执行不同的检索策略
  switch (analysis.type) {
    case QuestionType.SOURCE_TRACING:
      // 文献溯源
      if (analysis.extractedText) {
        context.sourceInfo = await traceSource(analysis.extractedText);
      }
      break;

    case QuestionType.ENTITY_EXTRACTION:
      // 实体提取
      if (analysis.extractedText) {
        context.entities = await extractEntities(analysis.extractedText);
      }
      break;

    case QuestionType.APPRECIATION:
    case QuestionType.KNOWLEDGE_QA:
      // 需要完整的RAG检索
      // 1. 检索相关段落
      if (analysis.extractedText || userQuery) {
        const searchText = analysis.extractedText || userQuery;
        const { data: paragraphs } = await supabase
          .rpc('search_book_paragraphs', {
            search_query: searchText,
            limit_count: 5
          });

        if (paragraphs) {
          context.paragraphs = paragraphs;
        }
      }

      // 2. 检索相关书籍
      const keywords = userQuery.split(/[,。、\s]+/).filter(w => w.length > 1);
      if (keywords.length > 0) {
        context.relatedWorks = await findRelatedWorks(keywords[0], undefined, 5);
      }

      // 3. 提取实体(辅助理解)
      if (analysis.extractedText) {
        context.entities = await extractEntities(analysis.extractedText);
      }
      break;

    default:
      // 其他类型不需要RAG
      break;
  }

  // 构建格式化的上下文信息
  context.relevantInfo = formatSikuContext(context, analysis.type);

  return context;
}

// ==================== 上下文格式化 ====================

/**
 * 格式化为AI提示词
 */
export function formatSikuContext(
  context: SikuRAGContext,
  questionType: QuestionType
): string {
  let formatted = '';

  // 文献溯源信息
  if (context.sourceInfo) {
    formatted += `\n## 文献溯源结果\n\n`;
    formatted += `原文: ${context.sourceInfo.originalText}\n\n`;
    formatted += `找到 ${context.sourceInfo.sources.length} 处可能的出处:\n\n`;

    context.sourceInfo.sources.forEach((source, index) => {
      formatted += `${index + 1}. 《${source.bookTitle}》\n`;
      formatted += `   - 作者: ${source.author} (${source.dynasty})\n`;
      if (source.chapter) formatted += `   - 章节: ${source.chapter}\n`;
      if (source.pageNumber) formatted += `   - 页码: ${source.pageNumber}\n`;
      formatted += `   - 置信度: ${(source.confidence * 100).toFixed(1)}%\n\n`;
    });
  }

  // 实体提取信息
  if (context.entities) {
    formatted += `\n## 实体提取结果\n\n`;

    if (context.entities.persons.length > 0) {
      formatted += `- 人名: ${context.entities.persons.join('、')}\n`;
    }
    if (context.entities.places.length > 0) {
      formatted += `- 地名: ${context.entities.places.join('、')}\n`;
    }
    if (context.entities.officials.length > 0) {
      formatted += `- 职官: ${context.entities.officials.join('、')}\n`;
    }
    if (context.entities.dynasties.length > 0) {
      formatted += `- 朝代: ${context.entities.dynasties.join('、')}\n`;
    }
    if (context.entities.works.length > 0) {
      formatted += `- 著作: ${context.entities.works.join('、')}\n`;
    }
    formatted += '\n';
  }

  // 相关段落
  if (context.paragraphs && context.paragraphs.length > 0) {
    formatted += `\n## 相关段落 (共${context.paragraphs.length}段)\n\n`;
    context.paragraphs.forEach((para: any, index) => {
      formatted += `${index + 1}. 《${para.book_title || '未知'}》第${para.page_number}页:\n`;
      formatted += `   ${para.content}\n\n`;
    });
  }

  // 相关作品
  if (context.relatedWorks && context.relatedWorks.length > 0) {
    formatted += `\n## 相关作品推荐 (共${context.relatedWorks.length}部)\n\n`;
    context.relatedWorks.forEach((work, index) => {
      formatted += `${index + 1}. 《${work.title}》 - ${work.author}\n`;
      formatted += `   (${work.relevance})\n\n`;
    });
  }

  return formatted;
}

/**
 * 构建针对不同问题类型的系统提示词
 */
export function buildSystemPrompt(questionType: QuestionType): string {
  const basePrompt = `你是识典古籍智能问答系统,专注于文史领域的专业知识服务。`;

  switch (questionType) {
    case QuestionType.TRANSLATION:
      return `${basePrompt}

你的任务是进行古文翻译。请遵循以下原则:
1. 准确传达原文意思,不可臆测或添加
2. 使用现代汉语/英语,通俗易懂
3. 保留原文的风格和韵味
4. 对于专有名词,提供注释说明
5. 如果是诗词,可以提供直译和意译两个版本`;

    case QuestionType.SOURCE_TRACING:
      return `${basePrompt}

你的任务是进行文献溯源。请基于检索到的数据:
1. 明确指出原文的出处(书名、作者、朝代、章节)
2. 如果有多个可能的出处,按置信度排序
3. 简要说明该文献的背景和重要性
4. 如果检索不到,诚实说明,并给出可能的搜索建议`;

    case QuestionType.PUNCTUATION:
      return `${basePrompt}

你的任务是为古文添加标点。请遵循:
1. 使用现代标点符号(句号、逗号、分号等)
2. 根据语法结构合理断句
3. 尊重古文的特殊句式(倒装、省略等)
4. 可以简要说明断句理由`;

    case QuestionType.APPRECIATION:
      return `${basePrompt}

你的任务是进行诗文赏析。请包含:
1. 作品背景(作者、时代、创作缘由)
2. 内容解读(主题、意象、情感)
3. 艺术手法(修辞、结构、语言特色)
4. 历史地位和影响
5. 引用相关学术观点(如有)`;

    case QuestionType.ENTITY_EXTRACTION:
      return `${basePrompt}

你的任务是提取文本中的实体。请:
1. 基于检索结果,列出所有相关实体
2. 分类清晰(人名、地名、职官、事件等)
3. 对重要实体提供简要注释
4. 保证准确性,不确定的标注为"待考"`;

    case QuestionType.KNOWLEDGE_QA:
    default:
      return `${basePrompt}

你的任务是回答文史哲等人文领域问题。请:
1. 基于数据库检索到的真实资料回答
2. 回答要准确、专业、有学术深度
3. 引用具体文献作为证据
4. 如果涉及争议,呈现不同观点
5. 如果数据库中没有相关信息,可以基于通识回答,但要明确说明`;
  }
}
