'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw, Play } from 'lucide-react';
import { OCRTaskProvider, useOCRTasks } from '@/contexts/ocr-task-context';
import { OCRTaskQueue } from '@/components/ocr/ocr-task-queue';

interface OCRStatistics {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
}

interface Book {
  id: string;
  title: string;
  file_url: string;
  file_type: 'pdf' | 'images';
  image_urls?: string[];
  ocr_status: string;
}

function OCRAdminContent() {
  const [stats, setStats] = useState<OCRStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const { addAndStartTask } = useOCRTasks();

  const fetchStatistics = async () => {
    try {
      const response = await fetch('/api/ocr/batch');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('获取统计信息失败:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
    // 每30秒自动刷新一次
    const interval = setInterval(fetchStatistics, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleBatchProcess = async () => {
    if (!confirm('确定要开始批量OCR处理吗?这将在您的浏览器中处理所有待处理的书籍。')) {
      return;
    }

    setProcessing(true);
    try {
      // 获取所有需要处理的书籍
      const response = await fetch('/api/books');
      const books: Book[] = await response.json();

      const booksToProcess = books.filter(
        (book) => book.ocr_status === 'pending' || book.ocr_status === 'failed'
      );

      if (booksToProcess.length === 0) {
        alert('没有需要处理的书籍');
        return;
      }

      // 为每本书创建并启动OCR任务
      for (const book of booksToProcess) {
        await addAndStartTask({
          bookId: book.id,
          bookTitle: book.title,
          fileUrl: book.file_url,
          fileType: book.file_type,
          imageUrls: book.image_urls,
        });
      }

      alert(`已添加 ${booksToProcess.length} 个OCR任务到队列`);
      await fetchStatistics();
    } catch (error) {
      console.error('启动批量OCR失败:', error);
      alert('启动失败，请查看控制台');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="container px-4 py-8 mx-auto max-w-6xl">
        <p className="text-center text-gray-600">加载中...</p>
      </div>
    );
  }

  return (
    <div className="container px-4 py-8 mx-auto max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">OCR管理中心</h1>
        <p className="text-gray-600">管理和监控书籍的OCR文字识别处理</p>
      </div>

      <div className="space-y-6">
        {/* 统计卡片 */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>OCR处理统计</CardTitle>
                <CardDescription>当前系统中书籍的OCR处理状态</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchStatistics}
                disabled={loading}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                刷新
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                  <p className="text-sm text-gray-600 mt-1">总书籍数</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
                  <p className="text-sm text-gray-600 mt-1">待处理</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-3xl font-bold text-blue-600">{stats.processing}</p>
                  <p className="text-sm text-gray-600 mt-1">处理中</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-3xl font-bold text-green-600">{stats.completed}</p>
                  <p className="text-sm text-gray-600 mt-1">已完成</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-3xl font-bold text-red-600">{stats.failed}</p>
                  <p className="text-sm text-gray-600 mt-1">失败</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 批量处理卡片 */}
        <Card>
          <CardHeader>
            <CardTitle>批量OCR处理</CardTitle>
            <CardDescription>
              对所有待处理或失败的书籍进行批量OCR文字识别(在浏览器中处理)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-2">新版处理说明:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• OCR处理在您的浏览器中进行,不占用服务器资源</li>
                  <li>• 每个任务都有独立的进度条显示</li>
                  <li>• 您可以随时暂停、恢复或取消任何任务</li>
                  <li>• 处理完成后自动上传结果到服务器</li>
                  <li>• 请保持页面打开直到所有任务完成</li>
                </ul>
              </div>

              <Button
                onClick={handleBatchProcess}
                disabled={processing || (stats?.pending === 0 && stats?.failed === 0)}
                className="w-full"
                size="lg"
              >
                <Play className="h-4 w-4 mr-2" />
                {processing ? '正在添加任务...' : `开始批量处理 (${(stats?.pending || 0) + (stats?.failed || 0)} 本书籍)`}
              </Button>

              {stats && stats.pending === 0 && stats.failed === 0 && (
                <p className="text-center text-sm text-gray-500">
                  当前没有需要处理的书籍
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* OCR任务队列 */}
        <OCRTaskQueue />

        {/* 使用说明卡片 */}
        <Card>
          <CardHeader>
            <CardTitle>全文搜索说明</CardTitle>
            <CardDescription>如何使用OCR全文搜索功能</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm text-gray-600">
              <div>
                <h4 className="font-medium text-gray-900 mb-1">1. 批量OCR处理</h4>
                <p>点击"开始批量处理"按钮,系统会在浏览器中处理所有待处理的书籍</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">2. 监控进度</h4>
                <p>每个任务都有独立的进度条,显示当前处理的页数和百分比</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">3. 任务控制</h4>
                <p>使用暂停按钮临时停止处理,使用取消按钮终止任务</p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-1">4. 全文搜索</h4>
                <p>在书库页面的搜索框中输入任意词语,系统会搜索书名、作者、关键词和全文内容</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function OCRAdminPage() {
  return (
    <OCRTaskProvider>
      <OCRAdminContent />
    </OCRTaskProvider>
  );
}
