'use client';

import React, { useState, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ParagraphSearchResult } from '@/types';
import ParagraphSearchResults from '@/components/ParagraphSearchResults';
import { Book, Search, FileText } from 'lucide-react';

function SearchPageContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [searchMode, setSearchMode] = useState<'paragraph' | 'book'>('paragraph');
  const [results, setResults] = useState<ParagraphSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 搜索段落
  const searchParagraphs = useCallback(async (query: string) => {
    if (!query || query.trim() === '') {
      setResults([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/search/paragraphs?query=${encodeURIComponent(query)}&limit=50`
      );

      if (!response.ok) {
        throw new Error('搜索请求失败');
      }

      const data = await response.json();

      if (data.success) {
        setResults(data.data || []);
      } else {
        throw new Error(data.error || '搜索失败');
      }
    } catch (err) {
      console.error('搜索失败:', err);
      setError(err instanceof Error ? err.message : '搜索失败');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 处理搜索
  const handleSearch = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      if (searchMode === 'paragraph') {
        searchParagraphs(searchQuery);
      } else {
        // 书籍搜索(跳转到书籍列表页)
        window.location.href = `/books?search=${encodeURIComponent(searchQuery)}`;
      }
    },
    [searchQuery, searchMode, searchParagraphs]
  );

  // 初始搜索
  React.useEffect(() => {
    if (initialQuery && searchMode === 'paragraph') {
      searchParagraphs(initialQuery);
    }
  }, [initialQuery, searchMode, searchParagraphs]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">高级搜索</h1>
          <p className="text-gray-600">
            在古籍数据库中精确搜索段落和书籍
          </p>
        </div>

        {/* 搜索栏 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <form onSubmit={handleSearch} className="space-y-4">
            {/* 搜索模式选择 */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setSearchMode('paragraph')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  searchMode === 'paragraph'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <FileText className="w-4 h-4" />
                段落搜索
              </button>

              <button
                type="button"
                onClick={() => setSearchMode('book')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  searchMode === 'book'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Book className="w-4 h-4" />
                书籍搜索
              </button>
            </div>

            {/* 搜索输入框 */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  searchMode === 'paragraph'
                    ? '输入关键词搜索段落内容...'
                    : '输入书名、作者或关键词...'
                }
                className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
            </div>

            {/* 搜索按钮 */}
            <button
              type="submit"
              disabled={isLoading || !searchQuery.trim()}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isLoading ? '搜索中...' : '搜索'}
            </button>
          </form>

          {/* 搜索提示 */}
          <div className="mt-4 text-sm text-gray-500">
            {searchMode === 'paragraph' ? (
              <p>
                💡 段落搜索会在所有书籍的段落内容中查找匹配的关键词,并显示上下文
              </p>
            ) : (
              <p>
                💡 书籍搜索会在书名、作者、关键词和全文中查找匹配的书籍
              </p>
            )}
          </div>
        </div>

        {/* 错误提示 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <p className="text-red-800">❌ {error}</p>
          </div>
        )}

        {/* 搜索结果 */}
        {searchMode === 'paragraph' && (
          <ParagraphSearchResults
            results={results}
            searchQuery={searchQuery}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  );
}


export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div></div>}>
      <SearchPageContent />
    </Suspense>
  );
}
