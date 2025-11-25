'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Clock, ArrowLeft, Trash2 } from 'lucide-react';

interface ReadingHistoryItem {
  user_id: string;
  book_id: string;
  current_page: number;
  total_pages: number;
  progress_percentage: number;
  view_mode: 'pdf' | 'text';
  status: 'reading' | 'paused' | 'completed';
  scroll_position: number;
  last_read_at: string;
  book: {
    id: string;
    title: string;
    author: string;
    dynasty: string;
    category: string;
  };
}

export default function HistoryPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [history, setHistory] = useState<ReadingHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (user) {
      fetchHistory();
    }
  }, [user, selectedStatus]);

  const fetchHistory = async () => {
    try {
      setHistoryLoading(true);
      const params = new URLSearchParams();
      params.set('limit', '50');
      if (selectedStatus !== 'all') {
        params.set('status', selectedStatus);
      }

      const response = await fetch(`/api/reading-history?${params}`);
      const data = await response.json();
      setHistory(data.history || []);
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const deleteHistory = async (bookId: string) => {
    if (!confirm('确定要删除这条阅读记录吗?')) return;

    try {
      const response = await fetch(`/api/reading-history/${bookId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('删除失败');
      }

      // 重新加载列表
      fetchHistory();
    } catch (err) {
      console.error('Error deleting history:', err);
      alert('删除失败，请重试');
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      all: '全部',
      reading: '正在阅读',
      paused: '暂停阅读',
      completed: '已读完成',
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      reading: 'bg-blue-100 text-blue-700',
      paused: 'bg-yellow-100 text-yellow-700',
      completed: 'bg-green-100 text-green-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 5) return '刚刚';
    if (diffMinutes < 60) return `${diffMinutes}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays === 0) return '今天';
    if (diffDays === 1) return '昨天';
    if (diffDays < 7) return `${diffDays}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  if (loading || historyLoading) {
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
              <h1 className="text-3xl font-bold text-gray-900">阅读历史</h1>
              <p className="text-gray-600 mt-1">
                共 {history.length} 条记录
              </p>
            </div>
          </div>
        </div>

        {/* 状态筛选 */}
        <Tabs value={selectedStatus} onValueChange={setSelectedStatus} className="mb-6">
          <TabsList>
            <TabsTrigger value="all">全部</TabsTrigger>
            <TabsTrigger value="reading">正在阅读</TabsTrigger>
            <TabsTrigger value="paused">暂停阅读</TabsTrigger>
            <TabsTrigger value="completed">已读完成</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* 历史记录列表 */}
        {history.length > 0 ? (
          <div className="space-y-4">
            {history.map((item) => (
              <Card
                key={item.book_id}
                className="overflow-hidden hover:shadow-md transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    {/* 书籍信息 */}
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => router.push(`/books/${item.book.id}`)}
                    >
                      <div className="flex items-start gap-4">
                        <div className="w-16 h-20 bg-gradient-to-br from-amber-100 to-amber-200 rounded flex items-center justify-center flex-shrink-0">
                          <BookOpen className="h-8 w-8 text-amber-600 opacity-50" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg mb-1">
                            {item.book.title}
                          </h3>
                          <p className="text-sm text-gray-600 mb-2">
                            {item.book.author} · {item.book.dynasty}
                          </p>

                          {/* 阅读进度 */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-600">
                                {item.view_mode === 'pdf' ? (
                                  <>第 {item.current_page} / {item.total_pages} 页</>
                                ) : (
                                  <>文本模式 · 滚动位置 {item.scroll_position}px</>
                                )}
                              </span>
                              <span className="font-medium">
                                {Math.round(item.progress_percentage)}%
                              </span>
                            </div>
                            <Progress value={item.progress_percentage} className="h-2" />
                          </div>

                          {/* 状态和时间 */}
                          <div className="flex items-center gap-3 mt-3">
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(item.status)}`}>
                              {getStatusLabel(item.status)}
                            </span>
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {formatDate(item.last_read_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex flex-col gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/books/${item.book.id}`)}
                      >
                        继续阅读
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteHistory(item.book_id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-16 text-center">
              <Clock className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-xl font-medium text-gray-700 mb-2">
                {selectedStatus === 'all' ? '还没有阅读记录' : `没有${getStatusLabel(selectedStatus)}的书籍`}
              </h3>
              <p className="text-gray-500 mb-6">
                开始阅读古籍，记录你的阅读历程
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
