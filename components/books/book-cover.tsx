'use client';

import Image from 'next/image';
import { Book as BookType } from '@/types';

interface BookCoverProps {
  book: BookType;
  width?: number;
  height?: number;
  className?: string;
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

  // 生成中国传统线装书封面
  return (
    <div
      className={`relative ${className} bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50`}
      style={{ width, height }}
    >
      {/* 古纸纹理背景 */}
      <div className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(139, 69, 19, 0.02) 2px, rgba(139, 69, 19, 0.02) 4px),
            repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(139, 69, 19, 0.02) 2px, rgba(139, 69, 19, 0.02) 4px)
          `
        }}
      />

      {/* 边框装饰 - 简约柔和,减少留白 */}
      <div className="absolute inset-0 border border-amber-900/8 m-1.5">
        <div className="absolute inset-0 border border-amber-800/6 m-1"></div>
      </div>

      {/* 左侧装订线 */}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-amber-900/6 to-transparent">
        <div className="absolute left-2 top-0 bottom-0 w-px bg-amber-800/15"></div>
        <div className="absolute left-3.5 top-0 bottom-0 w-px bg-amber-800/15"></div>
        {/* 装订孔 */}
        {[20, 35, 50, 65, 80].map((percent) => (
          <div
            key={percent}
            className="absolute left-2.5 w-1.5 h-1.5 bg-amber-900/20 rounded-full border border-amber-800/25"
            style={{ top: `${percent}%`, transform: 'translateY(-50%)' }}
          />
        ))}
      </div>

      {/* 书名 - 横排居中,仿宋加粗,考虑装订区域的偏移 */}
      <div className="absolute inset-0 flex items-center justify-center px-4" style={{ marginTop: '-12%', marginLeft: '4px' }}>
        <h3
          className="text-center text-amber-950"
          style={{
            fontFamily: '"FangSong", "STFangsong", "仿宋", serif',
            fontSize: '7px',
            lineHeight: '1.6',
            letterSpacing: '0.1em',
            fontWeight: 700
          }}
        >
          {extractSubject(book.title)}
        </h3>
      </div>

      {/* 右下角印章 - 更加柔和,调整位置 */}
      <div className="absolute bottom-2 right-2 w-5 h-5 bg-red-600/50 border border-red-800/60 flex items-center justify-center transform rotate-45">
        <div className="transform -rotate-45 text-white text-[5px] font-medium writing-mode-vertical leading-tight opacity-90">
          藏
        </div>
      </div>
    </div>
  );
}
