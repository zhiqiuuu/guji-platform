'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Book } from '@/types';
import { PdfReader } from '@/components/books/pdf-reader';
import { TextReader } from '@/components/books/text-reader';
import { Button } from '@/components/ui/button';
import { ArrowLeft, BookOpen, FileText, Image, BookMarked, Heart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

type ViewMode = 'pdf' | 'text';

export default function BookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { user } = useAuth();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookId, setBookId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('pdf');
  const [inBookshelf, setInBookshelf] = useState(false);
  const [bookshelfLoading, setBookshelfLoading] = useState(false);

  useEffect(() => {
    params.then(({ id }) => setBookId(id));
  }, [params]);

  useEffect(() => {
    if (bookId) {
      fetchBook();
      if (user) {
        checkBookshelf();
      }
    }
  }, [bookId, user]);

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

  const checkBookshelf = async () => {
    if (!bookId || !user) return;

    try {
      const response = await fetch(`/api/bookshelf/check/${bookId}`);
      const data = await response.json();
      setInBookshelf(data.inBookshelf);
    } catch (err) {
      console.error('Error checking bookshelf:', err);
    }
  };

  const toggleBookshelf = async () => {
    if (!user) {
      alert('请先登录');
      return;
    }

    if (!bookId) return;

    try {
      setBookshelfLoading(true);

      if (inBookshelf) {
        // 从书架移除
        const checkResponse = await fetch(`/api/bookshelf/check/${bookId}`);
        const checkData = await checkResponse.json();

        if (checkData.item) {
          const response = await fetch(`/api/bookshelf/${checkData.item.id}`, {
            method: 'DELETE',
          });

          if (!response.ok) {
            throw new Error('移除失败');
          }

          setInBookshelf(false);
        }
      } else {
        // 添加到书架
        const response = await fetch('/api/bookshelf', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            book_id: bookId,
            category: 'default',
          }),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || '添加失败');
        }

        setInBookshelf(true);
      }
    } catch (err) {
      console.error('Error toggling bookshelf:', err);
      alert(err instanceof Error ? err.message : '操作失败');
    } finally {
      setBookshelfLoading(false);
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
          <div className="flex items-center gap-4 flex-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回
            </Button>
            <div className="flex items-center gap-3 flex-1">
              <BookOpen className="h-6 w-6 text-amber-600" />
              <div className="flex-1">
                <h1 className="text-xl font-bold text-gray-900">{book.title}</h1>
                <p className="text-sm text-gray-600">
                  {book.author} · {book.dynasty} · {book.category}
                </p>
              </div>
              {user && (
                <Button
                  variant={inBookshelf ? 'default' : 'outline'}
                  size="sm"
                  onClick={toggleBookshelf}
                  disabled={bookshelfLoading}
                  className="gap-2"
                >
                  {inBookshelf ? (
                    <>
                      <Heart className="h-4 w-4 fill-current" />
                      已收藏
                    </>
                  ) : (
                    <>
                      <Heart className="h-4 w-4" />
                      收藏
                    </>
                  )}
                </Button>
              )}
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
          <PdfReader fileUrl={book.file_url} bookId={book.id} />
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
