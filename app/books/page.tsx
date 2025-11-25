'use client';

import { useState, useEffect } from 'react';
import { BookCard } from '@/components/books/book-card';
import { BookFilters } from '@/components/books/book-filters';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import type { Book, Category, Dynasty } from '@/types';

export default function BooksPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category>();
  const [selectedDynasty, setSelectedDynasty] = useState<Dynasty>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBooks() {
      try {
        const params = new URLSearchParams();
        if (searchQuery) params.append('search', searchQuery);
        if (selectedCategory) params.append('category', selectedCategory);
        if (selectedDynasty) params.append('dynasty', selectedDynasty);

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
  }, [searchQuery, selectedCategory, selectedDynasty]);

  return (
    <div className="container px-4 py-8 mx-auto max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">书库</h1>
        <p className="text-gray-600">浏览和搜索古籍典藏</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar */}
        <aside className="lg:w-64 flex-shrink-0">
          <div className="sticky top-20">
            <BookFilters
              selectedCategory={selectedCategory}
              selectedDynasty={selectedDynasty}
              onCategoryChange={setSelectedCategory}
              onDynastyChange={setSelectedDynasty}
            />
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1">
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
