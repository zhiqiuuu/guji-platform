'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Book } from '@/types';
import { PdfReader } from '@/components/books/pdf-reader';
import { TextReader } from '@/components/books/text-reader';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen, FileText, Image } from 'lucide-react';

type ViewMode = 'pdf' | 'text';

export default function BookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookId, setBookId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('pdf');

  useEffect(() => {
    params.then(({ id }) => setBookId(id));
  }, [params]);

  useEffect(() => {
    if (bookId) {
      fetchBook();
    }
  }, [bookId]);

  const fetchBook = async () => {
    if (!bookId) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/books/${bookId}`);

      if (!response.ok) {
        throw new Error('获取书籍详情失败');
      }

      const data = await response.json();
      setBook(data);

      // 如果有OCR文本,默认显示文本模式
      if (data.full_text && data.full_text.trim()) {
        setViewMode('text');
      }
    } catch (err) {
      console.error('Error fetching book:', err);
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">加载中...</div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || '书籍不存在'}</p>
          <Button onClick={() => router.back()}>返回</Button>
        </div>
      </div>
    );
  }

  const hasOCRText = book.full_text && book.full_text.trim();
  const canViewPdf = book.file_type === 'pdf';

  return (
    <div className="min-h-screen flex flex-col">
      {/* 页头 */}
      <div className="bg-white border-b shadow-sm p-4">
        <div className="container mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回
            </Button>
            <div className="flex items-center gap-3">
              <BookOpen className="h-6 w-6 text-amber-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">{book.title}</h1>
                <p className="text-sm text-gray-600">
                  {book.author} · {book.dynasty} · {book.category}
                </p>
              </div>
            </div>
          </div>

          {/* 视图模式切换 */}
          {(hasOCRText || canViewPdf) && (
            <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
              {canViewPdf && (
                <Button
                  variant={viewMode === 'pdf' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('pdf')}
                  className={viewMode === 'pdf' ? 'bg-white shadow-sm' : ''}
                >
                  <Image className="h-4 w-4 mr-2" />
                  影印版
                </Button>
              )}
              {hasOCRText && (
                <Button
                  variant={viewMode === 'text' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('text')}
                  className={viewMode === 'text' ? 'bg-white shadow-sm' : ''}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  文本版
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 阅读器 */}
      <div className="flex-1">
        {viewMode === 'text' && hasOCRText ? (
          <TextReader text={book.full_text} bookId={book.id} />
        ) : viewMode === 'pdf' && canViewPdf ? (
          <PdfReader fileUrl={book.file_url} />
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-8">
              {!canViewPdf && !hasOCRText ? (
                <>
                  <p className="text-gray-600 mb-4">此书籍暂不支持在线阅读</p>
                  <Button onClick={() => window.open(book.file_url, '_blank')}>
                    下载查看
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-gray-600 mb-4">
                    {viewMode === 'text' ? '此书籍还未进行OCR识别' : '无法显示PDF'}
                  </p>
                  {book.ocr_status === 'pending' && (
                    <p className="text-sm text-gray-500">OCR识别中,请稍后查看文本版本</p>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
