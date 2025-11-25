'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Clock, Heart, History, Settings, User } from 'lucide-react';

interface BookshelfStats {
  total_books: number;
  reading_count: number;
  completed_count: number;
  favorites_count: number;
}

interface ReadingStats {
  books_read: number;
  total_reading_time: number;
  recent_books: Array<{
    id: string;
    title: string;
    author: string;
    last_read_at: string;
  }>;
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const [bookshelfStats, setBookshelfStats] = useState<BookshelfStats | null>(null);
  const [readingStats, setReadingStats] = useState<ReadingStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  const fetchStats = async () => {
    try {
      setStatsLoading(true);

      // 获取书架统计
      const bookshelfResponse = await fetch('/api/bookshelf/stats');
      const bookshelfData = await bookshelfResponse.json();
      setBookshelfStats(bookshelfData.stats);

      // 获取阅读统计
      const readingResponse = await fetch('/api/reading-history?limit=5');
      const readingData = await readingResponse.json();

      setReadingStats({
        books_read: profile?.books_read || 0,
        total_reading_time: profile?.total_reading_time || 0,
        recent_books: readingData.history?.map((item: any) => ({
          id: item.book.id,
          title: item.book.title,
          author: item.book.author,
          last_read_at: item.last_read_at,
        })) || [],
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  const formatReadingTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} 分钟`;
    const hours = Math.floor(minutes / 60);
    return `${hours} 小时`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return '今天';
    if (diffDays === 1) return '昨天';
    if (diffDays < 7) return `${diffDays}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  if (loading || statsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">加载中...</div>
      </div>
    );
  }

  if (!user || !profile) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* 用户信息头部 */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-amber-700 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {profile.display_name?.[0] || profile.username?.[0] || 'U'}
                </div>
                <div>
                  <CardTitle className="text-2xl">
                    {profile.display_name || profile.username || '匿名用户'}
                  </CardTitle>
                  <CardDescription>
                    {profile.username && `@${profile.username}`}
                  </CardDescription>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => router.push('/settings')}
              >
                <Settings className="h-4 w-4 mr-2" />
                设置
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                书架藏书
              </CardTitle>
              <BookOpen className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{bookshelfStats?.total_books || 0}</div>
              <p className="text-xs text-gray-500 mt-1">
                正在阅读 {bookshelfStats?.reading_count || 0} 本
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                已读完成
              </CardTitle>
              <History className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{bookshelfStats?.completed_count || 0}</div>
              <p className="text-xs text-gray-500 mt-1">
                累计阅读 {readingStats?.books_read || 0} 本
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                我的收藏
              </CardTitle>
              <Heart className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{bookshelfStats?.favorites_count || 0}</div>
              <p className="text-xs text-gray-500 mt-1">
                特别喜欢的书籍
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                阅读时长
              </CardTitle>
              <Clock className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatReadingTime(readingStats?.total_reading_time || 0)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                持续学习中
              </p>
            </CardContent>
          </Card>
        </div>

        {/* 最近阅读 */}
        <Card>
          <CardHeader>
            <CardTitle>最近阅读</CardTitle>
            <CardDescription>你最近阅读的书籍</CardDescription>
          </CardHeader>
          <CardContent>
            {readingStats?.recent_books && readingStats.recent_books.length > 0 ? (
              <div className="space-y-4">
                {readingStats.recent_books.map((book) => (
                  <div
                    key={book.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => router.push(`/books/${book.id}`)}
                  >
                    <div className="flex items-center gap-3">
                      <BookOpen className="h-5 w-5 text-amber-600" />
                      <div>
                        <p className="font-medium">{book.title}</p>
                        <p className="text-sm text-gray-500">{book.author}</p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatDate(book.last_read_at)}
                    </div>
                  </div>
                ))}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push('/history')}
                >
                  查看全部历史
                </Button>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>还没有阅读记录</p>
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => router.push('/')}
                >
                  开始阅读
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 快捷操作 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => router.push('/bookshelf')}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-amber-600" />
                我的书架
              </CardTitle>
              <CardDescription>
                管理你收藏的所有书籍
              </CardDescription>
            </CardHeader>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => router.push('/history')}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5 text-green-600" />
                阅读历史
              </CardTitle>
              <CardDescription>
                查看完整的阅读记录
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}
