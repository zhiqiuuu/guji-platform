'use client';

import { useState, useEffect } from 'react';
import { BookCard } from '@/components/books/book-card';
import { HierarchyNavigation } from '@/components/books/hierarchy-navigation';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import type { Book, LibraryType } from '@/types';

type SortOption = 'default' | 'year-asc' | 'year-desc' | 'category' | 'author' | 'season';

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
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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
    setCurrentPage(1); // 重置到第一页
  }, [searchQuery, filters]);

  // 排序逻辑
  const sortedBooks = [...books].sort((a, b) => {
    switch (sortBy) {
      case 'year-asc':
        return (a.year || '').localeCompare(b.year || '');
      case 'year-desc':
        return (b.year || '').localeCompare(a.year || '');
      case 'category':
        return (a.category || '').localeCompare(b.category || '');
      case 'author':
        return (a.author || '').localeCompare(b.author || '');
      case 'season':
        // 季节排序: 春 -> 夏 -> 秋 -> 冬
        const seasonOrder: { [key: string]: number } = { '春': 1, '夏': 2, '秋': 3, '冬': 4 };
        return (seasonOrder[a.season || ''] || 999) - (seasonOrder[b.season || ''] || 999);
      default:
        return 0; // 保持原始顺序
    }
  });

  // 计算分页数据
  const totalPages = Math.ceil(sortedBooks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBooks = sortedBooks.slice(startIndex, endIndex);

  return (
    <div className="min-h-screen bg-stone-50">
      {/* 页面标题 */}
      <div className="border-b border-stone-200 bg-white">
        <div className="container px-4 sm:px-6 py-4 sm:py-5 mx-auto max-w-[1600px]">
          <h1 className="text-lg sm:text-xl font-serif text-stone-900 tracking-wide mb-1">典藏书库</h1>
          <p className="text-xs text-stone-600 tracking-wide">浏览课题库与课艺库</p>
        </div>
      </div>

      <div className="container px-4 sm:px-6 py-4 sm:py-5 mx-auto max-w-[1600px]">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* 层级导航侧边栏 */}
          <aside className="w-full lg:w-64 flex-shrink-0">
            <div className="bg-white rounded shadow-sm border border-stone-200 overflow-hidden max-h-96 lg:h-[calc(100vh-160px)] flex flex-col lg:sticky lg:top-4">
              <div className="bg-stone-100 px-4 py-2.5 border-b border-stone-200">
                <h3 className="font-serif text-stone-800 text-sm tracking-wide">层级导航</h3>
              </div>
              <div className="flex-1 overflow-hidden">
                <HierarchyNavigation
                  selectedFilters={filters}
                  onFilterChange={setFilters}
                />
              </div>
            </div>
          </aside>

          {/* 主内容区域 */}
          <div className="flex-1 min-h-[500px]">
            {/* 搜索栏 */}
            <div className="mb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-stone-400" />
                <Input
                  type="search"
                  placeholder="搜索书名、作者、关键词..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-white border-stone-300 focus:border-stone-400 focus:ring-stone-400"
                />
              </div>
            </div>

            {/* 筛选标签和排序 */}
            <div className="mb-3 flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-2 sm:gap-3">
              {/* 筛选标签 */}
              {Object.keys(filters).length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {filters.libraryType && (
                    <span className="px-2.5 py-1 bg-stone-100 text-stone-700 border border-stone-200 rounded text-xs">
                      {filters.libraryType}
                    </span>
                  )}
                  {filters.academy && (
                    <span className="px-2.5 py-1 bg-stone-100 text-stone-700 border border-stone-200 rounded text-xs">
                      {filters.academy}
                    </span>
                  )}
                  {filters.year && (
                    <span className="px-2.5 py-1 bg-stone-100 text-stone-700 border border-stone-200 rounded text-xs">
                      {filters.year}年
                    </span>
                  )}
                  {filters.season && (
                    <span className="px-2.5 py-1 bg-stone-100 text-stone-700 border border-stone-200 rounded text-xs">
                      {filters.season}
                    </span>
                  )}
                  {filters.category && (
                    <span className="px-2.5 py-1 bg-stone-100 text-stone-700 border border-stone-200 rounded text-xs">
                      {filters.category}
                    </span>
                  )}
                  {filters.subject && (
                    <span className="px-2.5 py-1 bg-stone-100 text-stone-700 border border-stone-200 rounded text-xs">
                      {filters.subject}
                    </span>
                  )}
                </div>
              )}

              {/* 排序选择器 */}
              <div className="w-full sm:w-auto sm:ml-auto flex items-center gap-2">
                <label className="text-xs text-stone-600 whitespace-nowrap" style={{ fontFamily: '"FangSong", "STFangsong", "仿宋", serif' }}>
                  排序:
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value as SortOption);
                    setCurrentPage(1);
                  }}
                  className="flex-1 sm:flex-none px-3 py-1.5 text-xs border border-stone-300 rounded bg-white text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-700 focus:border-transparent"
                  style={{ fontFamily: '"FangSong", "STFangsong", "仿宋", serif' }}
                >
                  <option value="default">默认排序</option>
                  <option value="year-asc">年份升序 ↑</option>
                  <option value="year-desc">年份降序 ↓</option>
                  <option value="category">按类别</option>
                  <option value="author">按作者</option>
                  <option value="season">按季节</option>
                </select>
              </div>
            </div>

            {/* 书籍列表 */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
                    <div className="w-full h-48 bg-gray-200 rounded mb-4"></div>
                    <div className="h-6 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : books.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-amber-800/60 text-sm tracking-wide">暂无古籍</p>
                <p className="text-xs text-amber-700/50 mt-2 tracking-wide">
                  尝试调整筛选条件或上传新的古籍
                </p>
              </div>
            ) : (
              <>
                <p className="text-xs text-stone-600 mb-4 px-6 tracking-wide">
                  共 {sortedBooks.length} 部 · 第 {currentPage} / {totalPages} 页
                </p>
                <div className="bg-white rounded shadow-sm border border-stone-200 overflow-hidden">
                  {currentBooks.map((book) => (
                    <BookCard key={book.id} book={book} filters={filters} />
                  ))}
                </div>

                {/* 分页控件 */}
                {totalPages > 1 && (
                  <div className="mt-6 flex items-center justify-center gap-1 sm:gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="px-3 sm:px-4 py-2 border border-stone-300 rounded text-xs sm:text-sm text-stone-700 hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      style={{ fontFamily: '"FangSong", "STFangsong", "仿宋", serif' }}
                    >
                      <span className="hidden sm:inline">上一页</span>
                      <span className="sm:hidden">上页</span>
                    </button>

                    <div className="flex gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                        // 显示首页、末页、当前页及其前后各1页(移动端)或2页(桌面端)
                        const isMobile = typeof window !== 'undefined' && window.innerWidth < 640;
                        const range = isMobile ? 1 : 2;
                        if (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - range && page <= currentPage + range)
                        ) {
                          return (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`w-8 h-8 sm:w-10 sm:h-10 rounded text-xs sm:text-sm transition-colors ${
                                currentPage === page
                                  ? 'bg-amber-700 text-white'
                                  : 'border border-stone-300 text-stone-700 hover:bg-stone-50'
                              }`}
                              style={{ fontFamily: '"FangSong", "STFangsong", "仿宋", serif' }}
                            >
                              {page}
                            </button>
                          );
                        } else if (
                          page === currentPage - (range + 1) ||
                          page === currentPage + (range + 1)
                        ) {
                          return <span key={page} className="w-6 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-stone-400 text-xs sm:text-sm">...</span>;
                        }
                        return null;
                      })}
                    </div>

                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 sm:px-4 py-2 border border-stone-300 rounded text-xs sm:text-sm text-stone-700 hover:bg-stone-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      style={{ fontFamily: '"FangSong", "STFangsong", "仿宋", serif' }}
                    >
                      <span className="hidden sm:inline">下一页</span>
                      <span className="sm:hidden">下页</span>
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
