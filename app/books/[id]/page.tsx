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
            <div className="max-w-4xl mx-auto p-8">
              {!canViewPdf && !hasOCRText ? (
                <>
                  {/* 显示书籍信息 */}
                  <div className="bg-white rounded-lg shadow-sm border p-6">
                    <div className="space-y-4">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">{book.title}</h2>
                        <div className="flex gap-4 text-sm text-gray-600">
                          <span>作者: {book.author}</span>
                          <span>朝代: {book.dynasty}</span>
                          <span>类别: {book.category}</span>
                        </div>
                      </div>

                      {book.description && (
                        <div className="border-t pt-4">
                          <h3 className="text-lg font-semibold text-gray-800 mb-2">简介</h3>
                          <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                            {book.description}
                          </p>
                        </div>
                      )}

                      {book.custom_hierarchy && (
                        <div className="border-t pt-4">
                          <h3 className="text-lg font-semibold text-gray-800 mb-2">分类信息</h3>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            {book.custom_hierarchy.level1 && (
                              <div>
                                <span className="text-gray-500">书院:</span>
                                <span className="ml-2 text-gray-700">{book.custom_hierarchy.level1}</span>
                              </div>
                            )}
                            {book.custom_hierarchy.level2 && (
                              <div>
                                <span className="text-gray-500">年份:</span>
                                <span className="ml-2 text-gray-700">{book.custom_hierarchy.level2}</span>
                              </div>
                            )}
                            {book.custom_hierarchy.level3 && (
                              <div>
                                <span className="text-gray-500">季节:</span>
                                <span className="ml-2 text-gray-700">{book.custom_hierarchy.level3}</span>
                              </div>
                            )}
                            {book.custom_hierarchy.level4 && (
                              <div>
                                <span className="text-gray-500">类别:</span>
                                <span className="ml-2 text-gray-700">{book.custom_hierarchy.level4}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {book.file_url && (
                        <div className="border-t pt-4">
                          <Button onClick={() => window.open(book.file_url, '_blank')} className="w-full">
                            下载原文件
                          </Button>
                        </div>
                      )}

                      {!book.file_url && !book.description && (
                        <p className="text-gray-500 text-center py-4">
                          暂无更多信息
                        </p>
                      )}
                    </div>
                  </div>
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
