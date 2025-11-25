'use client';

import React from 'react';
import Link from 'next/link';
import { ParagraphSearchResult } from '@/types';
import { highlightKeyword, getParagraphPreview } from '@/lib/paragraph-splitter';

interface ParagraphSearchResultsProps {
  results: ParagraphSearchResult[];
  searchQuery: string;
  isLoading?: boolean;
}

/**
 * 段落搜索结果组件
 */
export default function ParagraphSearchResults({
  results,
  searchQuery,
  isLoading = false,
}: ParagraphSearchResultsProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        <span className="ml-3 text-gray-600">搜索中...</span>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">未找到匹配的段落</p>
        <p className="text-gray-400 text-sm mt-2">
          试试其他关键词或检查拼写
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-sm text-gray-600 mb-4">
        找到 <span className="font-semibold text-gray-900">{results.length}</span> 个匹配结果
      </div>

      {results.map((result) => (
        <div
          key={result.id}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
        >
          {/* 书籍信息 */}
          <div className="flex items-center justify-between mb-3">
            <Link
              href={`/books/${result.book_id}`}
              className="flex items-center gap-2 group"
            >
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600">
                {result.book_title}
              </h3>
              <span className="text-sm text-gray-500">
                / {result.book_author}
              </span>
            </Link>

            <div className="flex items-center gap-3 text-sm text-gray-500">
              <span>第 {result.page_number} 页</span>
              <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                相关度: {Math.round(result.rank * 100)}%
              </span>
            </div>
          </div>

          {/* 上下文段落 */}
          <div className="space-y-2">
            {/* 前一个段落 */}
            {result.prev_paragraph && (
              <div className="text-sm text-gray-500 italic border-l-2 border-gray-200 pl-3">
                {getParagraphPreview(result.prev_paragraph, 100)}
              </div>
            )}

            {/* 匹配的段落 (高亮显示) */}
            <div
              className="text-base text-gray-900 border-l-4 border-blue-500 pl-3 py-2 bg-blue-50/50"
              dangerouslySetInnerHTML={{
                __html: highlightKeyword(result.content, searchQuery),
              }}
            />

            {/* 后一个段落 */}
            {result.next_paragraph && (
              <div className="text-sm text-gray-500 italic border-l-2 border-gray-200 pl-3">
                {getParagraphPreview(result.next_paragraph, 100)}
              </div>
            )}
          </div>

          {/* 操作按钮 */}
          <div className="mt-4 flex gap-2">
            <Link
              href={`/books/${result.book_id}?page=${result.page_number}&paragraph=${result.paragraph_index}`}
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
            >
              查看原文 →
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
