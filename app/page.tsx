'use client';

import Link from 'next/link';
import { ArrowRight, BookOpen, Search, Upload, TrendingUp, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BookCard } from '@/components/books/book-card';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Book } from '@/types';

export default function Home() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [latestBooks, setLatestBooks] = useState<Book[]>([]);
  const [popularBooks, setPopularBooks] = useState<Book[]>([]);

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      const response = await fetch('/api/books');
      const data = await response.json();

      // 最新古籍 - 按创建时间排序
      const sortedByDate = [...data].sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setLatestBooks(sortedByDate.slice(0, 6));

      // 热门古籍 - 按浏览次数排序
      const sortedByViews = [...data].sort((a, b) =>
        (b.view_count || 0) - (a.view_count || 0)
      );
      setPopularBooks(sortedByViews.slice(0, 6));
    } catch (error) {
      console.error('Failed to fetch books:', error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // 跳转到高级搜索页面，支持段落搜索
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section with Background */}
      <section className="relative bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 py-12 sm:py-16 md:py-20 px-4">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>

        <div className="container mx-auto max-w-5xl relative z-10">
          <div className="text-center space-y-4 sm:space-y-6">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight px-4">
              中国课艺数智化工程
            </h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-700 max-w-2xl mx-auto font-serif px-4">
              晚清书院文献数字化保存与传播平台
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto pt-2 sm:pt-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1 flex items-center">
                  <Search className="absolute left-4 h-5 w-5 text-gray-400 pointer-events-none z-10" />
                  <Input
                    type="text"
                    placeholder="搜索书名、作者、朝代..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-12 sm:h-14 text-base sm:text-lg border-2 border-gray-300 focus:border-amber-500 w-full"
                  />
                </div>
                <Button type="submit" size="lg" className="h-12 sm:h-14 px-6 sm:px-8 bg-amber-600 hover:bg-amber-700 w-full sm:w-auto">
                  搜索
                </Button>
              </div>
            </form>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-2 sm:pt-4">
              <Button size="lg" asChild className="bg-amber-600 hover:bg-amber-700 w-full sm:w-auto">
                <Link href="/books">
                  <BookOpen className="mr-2 h-5 w-5" />
                  浏览书库
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="border-2 border-amber-600 text-amber-700 hover:bg-amber-50 w-full sm:w-auto">
                <Link href="/upload">
                  <Upload className="mr-2 h-5 w-5" />
                  上传古籍
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="container px-4 py-8 sm:py-12 md:py-16 mx-auto max-w-7xl">
        {/* Latest Books Section */}
        <section className="mb-12 sm:mb-16">
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <div className="flex items-center gap-2 sm:gap-3">
              <Clock className="h-6 w-6 sm:h-8 sm:w-8 text-amber-600" />
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">最新古籍</h2>
            </div>
            <Button variant="ghost" asChild className="text-amber-600 hover:text-amber-700 text-sm sm:text-base">
              <Link href="/books">
                <span className="hidden sm:inline">查看全部</span>
                <span className="sm:hidden">全部</span>
                <ArrowRight className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
              </Link>
            </Button>
          </div>

          {latestBooks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {latestBooks.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              暂无古籍，请先上传
            </div>
          )}
        </section>

        {/* Popular Books Section */}
        <section className="mb-12 sm:mb-16">
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <div className="flex items-center gap-2 sm:gap-3">
              <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-amber-600" />
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">热门古籍</h2>
            </div>
            <Button variant="ghost" asChild className="text-amber-600 hover:text-amber-700 text-sm sm:text-base">
              <Link href="/books">
                <span className="hidden sm:inline">查看全部</span>
                <span className="sm:hidden">全部</span>
                <ArrowRight className="ml-1 sm:ml-2 h-3 w-3 sm:h-4 sm:w-4" />
              </Link>
            </Button>
          </div>

          {popularBooks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {popularBooks.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              暂无热门古籍
            </div>
          )}
        </section>

        {/* Features Section */}
        <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 py-12 sm:py-16 border-t border-gray-200 mt-12 sm:mt-16">
          <div className="text-center space-y-3 sm:space-y-4 p-4 sm:p-6 rounded-lg hover:bg-amber-50 transition-colors">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
              <BookOpen className="h-7 w-7 sm:h-8 sm:w-8 text-amber-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900">海量典藏</h3>
            <p className="text-sm sm:text-base text-gray-600">
              经史子集，应有尽有，轻松管理您的古籍收藏
            </p>
          </div>

          <div className="text-center space-y-3 sm:space-y-4 p-4 sm:p-6 rounded-lg hover:bg-amber-50 transition-colors">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
              <Search className="h-7 w-7 sm:h-8 sm:w-8 text-amber-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900">快速检索</h3>
            <p className="text-sm sm:text-base text-gray-600">
              按书名、作者、朝代分类，快速找到您需要的古籍
            </p>
          </div>

          <div className="text-center space-y-3 sm:space-y-4 p-4 sm:p-6 rounded-lg hover:bg-amber-50 transition-colors sm:col-span-2 md:col-span-1">
            <div className="w-14 h-14 sm:w-16 sm:h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
              <Upload className="h-7 w-7 sm:h-8 sm:w-8 text-amber-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900">简单易用</h3>
            <p className="text-sm sm:text-base text-gray-600">
              支持PDF、图片上传，在线阅读，随时随地访问
            </p>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-r from-amber-50 via-orange-50 to-yellow-50 rounded-2xl p-6 sm:p-8 md:p-12 text-center border-2 border-amber-200">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 sm:mb-4">
            开始您的古籍之旅
          </h2>
          <p className="text-gray-700 mb-6 sm:mb-8 max-w-xl mx-auto text-base sm:text-lg px-4">
            立即上传您的第一本古籍，或者浏览已有的典藏
          </p>
          <Button size="lg" asChild className="bg-amber-600 hover:bg-amber-700 w-full sm:w-auto">
            <Link href="/books">
              开始探索
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </section>
      </div>
    </div>
  );
}
