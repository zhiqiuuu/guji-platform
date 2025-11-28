import Link from 'next/link';
import { Book as BookType, LibraryType } from '@/types';
import { BookCover } from './book-cover';

interface BookCardProps {
  book: BookType;
  filters?: {
    libraryType?: LibraryType;
    academy?: string;
    year?: string;
    season?: string;
    category?: string;
    subject?: string;
  };
}

// 提取书名中的题目部分
function extractSubject(title: string): string {
  // 格式: "书院 年份 季节 分类 - 题目"
  // 提取最后一个 " - " 后面的内容
  const lastDashIndex = title.lastIndexOf(' - ');
  if (lastDashIndex !== -1) {
    return title.substring(lastDashIndex + 3).trim();
  }
  return title;
}

// 解析书籍元数据
function parseBookMetadata(book: BookType) {
  // 尝试从title解析: "书院 年份 季节 分类 - 题目"
  const parts = book.title.split(' - ');
  if (parts.length >= 2) {
    const metaPart = parts[0].trim();
    const subject = parts[1].trim();
    const metaParts = metaPart.split(/\s+/);

    return {
      subject,
      category: book.category || '',
      dynasty: book.dynasty || '',
      author: book.author || '',
      metadata: metaPart
    };
  }

  return {
    subject: book.title,
    category: book.category || '',
    dynasty: book.dynasty || '',
    author: book.author || '',
    metadata: ''
  };
}

export function BookCard({ book, filters }: BookCardProps) {
  // 构建带筛选条件的URL
  const buildBookUrl = () => {
    const params = new URLSearchParams();
    if (filters?.libraryType) params.append('library_type', filters.libraryType);
    if (filters?.academy) params.append('academy', filters.academy);
    if (filters?.year) params.append('year', filters.year);
    if (filters?.season) params.append('season', filters.season);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.subject) params.append('subject', filters.subject);

    const queryString = params.toString();
    return `/books/${book.id}${queryString ? `?${queryString}` : ''}`;
  };

  const bookUrl = buildBookUrl();
  const { subject, category, dynasty, author, metadata } = parseBookMetadata(book);

  return (
    <Link href={bookUrl} className="group block">
      <div className="flex gap-4 py-5 px-6 bg-white border-b border-stone-200 hover:bg-amber-50/30 transition-colors">
        {/* 左侧封面缩略图 */}
        <div className="flex-shrink-0 w-16 h-20 relative overflow-hidden shadow-sm">
          <BookCover book={book} width={64} height={80} className="w-full h-full" />
        </div>

        {/* 右侧信息 */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          {/* 书名主标题 */}
          <h3
            className="text-lg text-stone-900 mb-1.5 group-hover:text-amber-800 transition-colors"
            style={{
              fontFamily: '"FangSong", "STFangsong", "仿宋", serif',
              fontWeight: 400
            }}
          >
            {subject}
            {category && (
              <span className="ml-2 text-sm text-amber-700 border border-amber-700 rounded px-1.5 py-0.5">
                {category}
              </span>
            )}
          </h3>

          {/* 作者和朝代信息 */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-stone-600">
            {metadata && (
              <span>{metadata}</span>
            )}
            {author && (
              <span>{author}</span>
            )}
            {dynasty && (
              <span>{dynasty}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
