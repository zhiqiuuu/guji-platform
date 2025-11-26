'use client';

import { useState, useEffect } from 'react';
import { BookCard } from '@/components/books/book-card';
import { HierarchyNavigation } from '@/components/books/hierarchy-navigation';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import type { Book, LibraryType } from '@/types';

export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<{
    libraryType?: LibraryType;
    academy?: string;
    year?: string;
    season?: string;
    category?: string;
    subject?: string;
  }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBooks() {
      try {
        const params = new URLSearchParams();
        if (searchQuery) params.append('search', searchQuery);
        if (filters.libraryType) params.append('library_type', filters.libraryType);
        if (filters.academy) params.append('academy', filters.academy);
        if (filters.year) params.append('year', filters.year);
        if (filters.season) params.append('season', filters.season);
        if (filters.category) params.append('category', filters.category);
        if (filters.subject) params.append('subject', filters.subject);

        const response = await fetch(`/api/books?${params}`);
        const data = await response.json();

        // 验证返回的数据是否为数组
        if (Array.isArray(data)) {
          setBooks(data);
        } else {
          console.error('API 返回的数据不是数组:', data);
          setBooks([]);
        }
      } catch (error) {
        console.error('Failed to fetch books:', error);
        setBooks([]);
      } finally {
        setLoading(false);
      }
    }

    fetchBooks();
  }, [searchQuery, filters]);

  return (
    <div className="container px-4 py-8 mx-auto max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">书库</h1>
        <p className="text-gray-600">按层级浏览课题库和课艺库</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Hierarchy Navigation Sidebar */}
        <aside className="lg:w-72 flex-shrink-0">
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-4 border-2 border-amber-200 h-[calc(100vh-200px)]">
            <h3 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
              <Search className="h-5 w-5 text-amber-700" />
              层级导航
            </h3>
            <HierarchyNavigation
              selectedFilters={filters}
              onFilterChange={setFilters}
            />
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 min-h-[500px]">
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="search"
                placeholder="搜索书名、作者、关键词..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Active Filters Display */}
          {Object.keys(filters).length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {filters.libraryType && (
                <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm">
                  {filters.libraryType}
                </span>
              )}
              {filters.academy && (
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                  {filters.academy}
                </span>
              )}
              {filters.year && (
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                  {filters.year}年
                </span>
              )}
              {filters.season && (
                <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                  {filters.season}
                </span>
              )}
              {filters.category && (
                <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm">
                  {filters.category}
                </span>
              )}
              {filters.subject && (
                <span className="px-3 py-1 bg-pink-100 text-pink-800 rounded-full text-sm">
                  {filters.subject}
                </span>
              )}
            </div>
          )}

          {/* Books Grid */}
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-600">加载中...</p>
            </div>
          ) : books.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">暂无古籍</p>
              <p className="text-sm text-gray-500 mt-2">
                尝试调整筛选条件或上传新的古籍
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-600 mb-4">
                共找到 {books.length} 部古籍
              </p>
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
                {books.map((book) => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
