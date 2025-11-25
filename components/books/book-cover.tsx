'use client';

import Image from 'next/image';
import { Book as BookType } from '@/types';

interface BookCoverProps {
  book: BookType;
  width?: number;
  height?: number;
  className?: string;
}

export function BookCover({ book, width = 300, height = 400, className = '' }: BookCoverProps) {
  // 如果有自定义封面,使用自定义封面
  if (book.cover_url) {
    return (
      <div className={`relative ${className}`} style={{ width, height }}>
        <Image
          src={book.cover_url}
          alt={book.title}
          fill
          className="object-cover"
          sizes={`${width}px`}
        />
      </div>
    );
  }

  // 没有封面,生成默认封面
  // 根据分类选择不同的背景色和样式
  const categoryStyles: Record<string, { gradient: string; accent: string }> = {
    '经部': {
      gradient: 'from-slate-600 via-slate-700 to-slate-800',
      accent: 'bg-slate-400'
    },
    '史部': {
      gradient: 'from-orange-500 via-orange-600 to-orange-700',
      accent: 'bg-orange-300'
    },
    '子部': {
      gradient: 'from-blue-500 via-blue-600 to-blue-700',
      accent: 'bg-blue-300'
    },
    '集部': {
      gradient: 'from-emerald-500 via-emerald-600 to-emerald-700',
      accent: 'bg-emerald-300'
    },
    '其他': {
      gradient: 'from-gray-600 via-gray-700 to-gray-800',
      accent: 'bg-gray-400'
    },
  };

  const styles = categoryStyles[book.category] || categoryStyles['其他'];

  return (
    <div
      className={`relative flex items-center justify-center bg-gradient-to-br ${styles.gradient} ${className}`}
      style={{ width, height }}
    >
      {/* 主要内容区 - 书名垂直居中占满整个区域 */}
      <div className="absolute inset-0 flex items-center justify-center p-8">
        <h3 className="text-white font-bold text-4xl leading-tight text-center w-full tracking-wide">
          {book.title}
        </h3>
      </div>

      {/* 顶部装饰线 */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2">
        <div className={`h-1 w-20 ${styles.accent}`}></div>
      </div>

      {/* 底部信息 */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between bg-black/20">
        {/* 作者 */}
        <div className="px-4 py-3 flex-1">
          <p className="text-white/90 text-sm font-medium tracking-wide truncate">
            {book.author}
          </p>
        </div>

        {/* 朝代 */}
        <div className="px-4 py-3 bg-white/10">
          <p className="text-white text-sm font-medium tracking-wide">
            {book.dynasty}
          </p>
        </div>

        {/* 分类标签 */}
        <div className="px-4 py-3 bg-white/10">
          <p className="text-white text-sm font-medium tracking-wide">
            {book.category}
          </p>
        </div>
      </div>
    </div>
  );
}
