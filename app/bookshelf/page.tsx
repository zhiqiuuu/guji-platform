'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Heart, Trash2, ArrowLeft } from 'lucide-react';
import type { BookshelfItemWithBook, BookshelfCategory } from '@/types';

export default function BookshelfPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [books, setBooks] = useState<BookshelfItemWithBook[]>([]);
  const [booksLoading, setBooksLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<BookshelfCategory | 'all'>('all');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchBooks();
    }
  }, [user, selectedCategory]);

  const fetchBooks = async () => {
    try {
      setBooksLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') {
        params.set('category', selectedCategory);
      }

      const response = await fetch(`/api/bookshelf?${params}`);
      const data = await response.json();
      setBooks(data.items || []);
    } catch (err) {
      console.error('Error fetching bookshelf:', err);
    } finally {
      setBooksLoading(false);
    }
  };

  const removeBook = async (itemId: string) => {
    if (!confirm('确定要从书架移除这本书吗?')) return;

    try {
      const response = await fetch(`/api/bookshelf/${itemId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('移除失败');
      }

      // 重新加载列表
      fetchBooks();
    } catch (err) {
      console.error('Error removing book:', err);
      alert('移除失败，请重试');
    }
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      all: '全部',
      default: '默认',
      favorites: '我的收藏',
      reading: '正在阅读',
      completed: '已读完成',
      wishlist: '想读',
    };
    return labels[category] || category;
  };

  if (loading || booksLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">加载中...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* 页面头部 */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">我的书架</h1>
              <p className="text-gray-600 mt-1">
                共 {books.length} 本书
              </p>
            </div>
          </div>
        </div>

        {/* 分类标签 */}
        <Tabs value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as BookshelfCategory | 'all')} className="mb-6">
          <TabsList>
            <TabsTrigger value="all">全部</TabsTrigger>
            <TabsTrigger value="reading">正在阅读</TabsTrigger>
            <TabsTrigger value="completed">已读完成</TabsTrigger>
            <TabsTrigger value="favorites">我的收藏</TabsTrigger>
            <TabsTrigger value="wishlist">想读</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* 书籍列表 */}
        {books.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {books.map((item) => (
              <Card
                key={item.id}
                className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div onClick={() => router.push(`/books/${item.book.id}`)}>
                  <div className="aspect-[3/4] bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center">
                    <BookOpen className="h-16 w-16 text-amber-600 opacity-50" />
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-bold text-lg mb-1 line-clamp-2">
                      {item.book.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {item.book.author}
                    </p>
                    <p className="text-xs text-gray-500 mb-3">
                      {item.book.dynasty} · {item.book.category}
                    </p>

                    {item.notes && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2 italic">
                        "{item.notes}"
                      </p>
                    )}

                    {item.rating && (
                      <div className="flex items-center gap-1 mb-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span
                            key={i}
                            className={`text-sm ${
                              i < item.rating! ? 'text-yellow-500' : 'text-gray-300'
                            }`}
                          >
                            ★
                          </span>
                        ))}
                      </div>
                    )}

                    {item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {item.tags.slice(0, 3).map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="text-xs text-gray-400">
                      加入于 {new Date(item.added_at).toLocaleDateString('zh-CN')}
                    </div>
                  </CardContent>
                </div>

                <div className="px-4 pb-4 pt-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeBook(item.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    移除
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-16 text-center">
              <BookOpen className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-medium text-gray-700 mb-2">
                {selectedCategory === 'all' ? '书架还是空的' : `${getCategoryLabel(selectedCategory)}分类还没有书籍`}
              </h3>
              <p className="text-gray-500 mb-6">
                去发现喜欢的古籍，添加到书架吧
              </p>
              <Button onClick={() => router.push('/')}>
                <BookOpen className="h-4 w-4 mr-2" />
                浏览古籍
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
