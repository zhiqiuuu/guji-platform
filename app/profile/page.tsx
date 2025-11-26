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
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* 用户信息头部 - 增强设计 */}
        <Card className="mb-6 border-amber-200 shadow-lg bg-gradient-to-r from-white to-amber-50/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <div className="w-20 h-20 bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                    {profile.display_name?.[0] || profile.username?.[0] || 'U'}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-white"></div>
                </div>
                <div>
                  <CardTitle className="text-3xl mb-1 bg-gradient-to-r from-amber-700 to-orange-600 bg-clip-text text-transparent">
                    {profile.display_name || profile.username || '匿名用户'}
                  </CardTitle>
                  <CardDescription className="text-base">
                    {profile.username && `@${profile.username}`} • {profile.role === 'admin' ? '管理员' : profile.role === 'editor' ? '编辑' : '读者'}
                  </CardDescription>
                  {profile.bio && (
                    <p className="text-sm text-gray-600 mt-2 max-w-md">{profile.bio}</p>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => router.push('/settings')}
                className="border-amber-300 hover:bg-amber-50"
              >
                <Settings className="h-4 w-4 mr-2" />
                设置
              </Button>
            </div>
          </CardHeader>
        </Card>

        {/* 统计卡片 - 增强视觉效果 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-amber-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-amber-50 to-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                书架藏书
              </CardTitle>
              <div className="p-2 bg-amber-100 rounded-lg">
                <BookOpen className="h-5 w-5 text-amber-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-amber-700">{bookshelfStats?.total_books || 0}</div>
              <p className="text-xs text-gray-500 mt-1">
                正在阅读 {bookshelfStats?.reading_count || 0} 本
              </p>
              <div className="mt-3 bg-amber-100 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-amber-400 to-amber-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: bookshelfStats?.total_books ? '75%' : '0%' }}
                ></div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-green-50 to-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                已读完成
              </CardTitle>
              <div className="p-2 bg-green-100 rounded-lg">
                <History className="h-5 w-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-700">{bookshelfStats?.completed_count || 0}</div>
              <p className="text-xs text-gray-500 mt-1">
                累计阅读 {readingStats?.books_read || 0} 本
              </p>
              <div className="mt-3 bg-green-100 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: bookshelfStats?.completed_count ? '60%' : '0%' }}
                ></div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-red-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-red-50 to-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                我的收藏
              </CardTitle>
              <div className="p-2 bg-red-100 rounded-lg">
                <Heart className="h-5 w-5 text-red-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-700">{bookshelfStats?.favorites_count || 0}</div>
              <p className="text-xs text-gray-500 mt-1">
                特别喜欢的书籍
              </p>
              <div className="mt-3 bg-red-100 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-red-400 to-red-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: bookshelfStats?.favorites_count ? '50%' : '0%' }}
                ></div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-blue-50 to-white">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                阅读时长
              </CardTitle>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-700">
                {formatReadingTime(readingStats?.total_reading_time || 0)}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                持续学习中
              </p>
              <div className="mt-3 bg-blue-100 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: (readingStats?.total_reading_time || 0) > 0 ? '85%' : '0%' }}
                ></div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 最近阅读 - 增强设计 */}
        <Card className="shadow-lg border-amber-100">
          <CardHeader className="bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-100">
            <CardTitle className="flex items-center gap-2 text-amber-900">
              <BookOpen className="h-6 w-6 text-amber-600" />
              最近阅读
            </CardTitle>
            <CardDescription>你最近阅读的书籍</CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            {readingStats?.recent_books && readingStats.recent_books.length > 0 ? (
              <div className="space-y-3">
                {readingStats.recent_books.map((book, index) => (
                  <div
                    key={book.id}
                    className="flex items-center justify-between p-4 border border-amber-100 rounded-xl hover:bg-amber-50 hover:border-amber-300 cursor-pointer transition-all duration-300 hover:shadow-md group"
                    onClick={() => router.push(`/books/${book.id}`)}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center text-white font-bold shadow-md">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 group-hover:text-amber-700 transition-colors">{book.title}</p>
                        <p className="text-sm text-gray-500">{book.author}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-sm text-gray-500 bg-amber-50 px-3 py-1 rounded-full">
                        {formatDate(book.last_read_at)}
                      </div>
                      <div className="text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity">
                        →
                      </div>
                    </div>
                  </div>
                ))}
                <Button
                  variant="outline"
                  className="w-full border-amber-300 hover:bg-amber-50 hover:border-amber-400 text-amber-700"
                  onClick={() => router.push('/history')}
                >
                  查看全部历史
                </Button>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <div className="w-20 h-20 mx-auto mb-4 bg-amber-50 rounded-full flex items-center justify-center">
                  <BookOpen className="h-10 w-10 text-amber-400" />
                </div>
                <p className="text-lg font-medium text-gray-700 mb-2">还没有阅读记录</p>
                <p className="text-sm text-gray-500 mb-4">开始你的阅读之旅吧</p>
                <Button
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
                  onClick={() => router.push('/')}
                >
                  <BookOpen className="h-4 w-4 mr-2" />
                  开始阅读
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 快捷操作 - 增强设计 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <Card
            className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-amber-200 bg-gradient-to-br from-amber-50 to-white group"
            onClick={() => router.push('/bookshelf')}
          >
            <CardHeader>
              <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-amber-200 transition-colors">
                <BookOpen className="h-6 w-6 text-amber-600" />
              </div>
              <CardTitle className="text-amber-900 group-hover:text-amber-700 transition-colors">
                我的书架
              </CardTitle>
              <CardDescription>
                管理你收藏的所有书籍
              </CardDescription>
            </CardHeader>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-green-200 bg-gradient-to-br from-green-50 to-white group"
            onClick={() => router.push('/history')}
          >
            <CardHeader>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-green-200 transition-colors">
                <History className="h-6 w-6 text-green-600" />
              </div>
              <CardTitle className="text-green-900 group-hover:text-green-700 transition-colors">
                阅读历史
              </CardTitle>
              <CardDescription>
                查看完整的阅读记录
              </CardDescription>
            </CardHeader>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-1 border-purple-200 bg-gradient-to-br from-purple-50 to-white group"
            onClick={() => router.push('/settings')}
          >
            <CardHeader>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-3 group-hover:bg-purple-200 transition-colors">
                <Settings className="h-6 w-6 text-purple-600" />
              </div>
              <CardTitle className="text-purple-900 group-hover:text-purple-700 transition-colors">
                个人设置
              </CardTitle>
              <CardDescription>
                自定义你的阅读偏好
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    </div>
  );
}
