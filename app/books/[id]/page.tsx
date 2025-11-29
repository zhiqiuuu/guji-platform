'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Book } from '@/types';
import { PdfViewerSimple } from '@/components/books/pdf-viewer-simple';
import { ChapterList, Chapter } from '@/components/books/chapter-list';
import { TranscriptionPanel } from '@/components/books/transcription-panel';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  BookOpen,
  Heart,
  ChevronLeft,
  ChevronRight,
  Maximize,
  Minimize,
  PanelLeftClose,
  PanelRightClose,
  PanelLeft,
  PanelRight,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { TextSelectionToolbar } from '@/components/ai/text-selection-toolbar';
import { cn } from '@/lib/utils';

type AdjacentBook = {
  id: string;
  title: string;
  author: string;
  category: string;
};

export default function BookDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { user } = useAuth();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookId, setBookId] = useState<string | null>(null);
  const [inBookshelf, setInBookshelf] = useState(false);
  const [bookshelfLoading, setBookshelfLoading] = useState(false);
  const [prevBook, setPrevBook] = useState<AdjacentBook | null>(null);
  const [nextBook, setNextBook] = useState<AdjacentBook | null>(null);

  // 三栏布局状态
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showRightPanel, setShowRightPanel] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // PDF阅读状态
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  // 模拟章节数据 (实际应从API获取)
  const [chapters, setChapters] = useState<Chapter[]>([]);

  useEffect(() => {
    params.then(({ id }) => setBookId(id));
  }, [params]);

  useEffect(() => {
    if (bookId) {
      fetchBook();
      fetchAdjacentBooks();
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

      // 获取真实章节数据
      if (data.file_type === 'pdf') {
        fetchChapters();
      }
    } catch (err) {
      console.error('Error fetching book:', err);
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchAdjacentBooks = async () => {
    if (!bookId) return;

    try {
      const urlParams = new URLSearchParams(window.location.search);
      const apiParams = new URLSearchParams();

      if (urlParams.get('library_type')) apiParams.append('library_type', urlParams.get('library_type')!);
      if (urlParams.get('academy')) apiParams.append('academy', urlParams.get('academy')!);
      if (urlParams.get('year')) apiParams.append('year', urlParams.get('year')!);
      if (urlParams.get('season')) apiParams.append('season', urlParams.get('season')!);
      if (urlParams.get('category')) apiParams.append('category', urlParams.get('category')!);
      if (urlParams.get('subject')) apiParams.append('subject', urlParams.get('subject')!);

      const queryString = apiParams.toString();
      const apiUrl = `/api/books/${bookId}/adjacent${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(apiUrl);

      if (response.ok) {
        const data = await response.json();
        setPrevBook(data.prev);
        setNextBook(data.next);
      }
    } catch (err) {
      console.error('Error fetching adjacent books:', err);
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

  const fetchChapters = async () => {
    if (!bookId) return;

    try {
      const response = await fetch(`/api/books/${bookId}/chapters`);
      if (response.ok) {
        const data = await response.json();
        setChapters(data.chapters || []);
      }
    } catch (err) {
      console.error('Error fetching chapters:', err);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

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
    <div className="h-screen flex flex-col">
      {/* 顶部工具栏 */}
      <div className="bg-white border-b shadow-sm p-3 flex-shrink-0">
        <div className="flex items-center justify-between gap-4">
          {/* 左侧: 返回 + 书籍信息 */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回
            </Button>

            <div className="flex items-center gap-2 flex-1 min-w-0">
              <BookOpen className="h-5 w-5 text-amber-600 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold text-gray-900 truncate">{book.title}</h1>
                <p className="text-xs text-gray-600 truncate">
                  {book.author} · {book.dynasty}
                </p>
              </div>
            </div>
          </div>

          {/* 右侧: 工具按钮 */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* 面板切换 */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowLeftPanel(!showLeftPanel)}
              title={showLeftPanel ? '隐藏目录' : '显示目录'}
            >
              {showLeftPanel ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRightPanel(!showRightPanel)}
              title={showRightPanel ? '隐藏释文' : '显示释文'}
            >
              {showRightPanel ? <PanelRightClose className="h-4 w-4" /> : <PanelRight className="h-4 w-4" />}
            </Button>

            {/* 全屏 */}
            <Button
              variant="outline"
              size="sm"
              onClick={toggleFullscreen}
            >
              {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
            </Button>

            {/* 收藏 */}
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
      </div>

      {/* 主内容区 - 三栏布局 */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* 左侧目录栏 */}
        {showLeftPanel && (
          <div className="w-64 border-r bg-white flex-shrink-0 overflow-hidden">
            <ChapterList
              chapters={chapters}
              currentPage={currentPage}
              onChapterClick={(page) => setCurrentPage(page)}
            />
          </div>
        )}

        {/* 中间阅读区 */}
        <div className="flex-1 relative overflow-hidden">
          {canViewPdf ? (
            <PdfViewerSimple
              fileUrl={book.file_url}
              bookId={book.id}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              onTotalPagesChange={setTotalPages}
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-50">
              <div className="max-w-2xl mx-auto p-8 text-center">
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-2">{book.title}</h2>
                  <div className="flex gap-4 text-sm text-gray-600 justify-center mb-4">
                    <span>作者: {book.author}</span>
                    <span>朝代: {book.dynasty}</span>
                  </div>
                  {book.description && (
                    <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {book.description}
                    </p>
                  )}
                  {!book.description && (
                    <p className="text-gray-500">暂无详细信息</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 上一篇/下一篇按钮 - 古籍风格 */}
          {prevBook && (
            <button
              onClick={() => {
                const currentParams = new URLSearchParams(window.location.search);
                const targetUrl = `/books/${prevBook.id}${currentParams.toString() ? `?${currentParams.toString()}` : ''}`;
                router.push(targetUrl);
              }}
              className="fixed left-0 top-1/2 -translate-y-1/2 z-40 group"
              title={prevBook.title}
            >
              <div className="bg-stone-100 hover:bg-amber-50 border-r border-t border-b border-stone-400 rounded-r-md shadow-md px-2 py-6 transition-all duration-200 group-hover:px-3">
                <div className="flex flex-col items-center gap-3">
                  <ChevronLeft className="h-5 w-5 text-stone-800 group-hover:text-amber-800" />
                  <div
                    className="writing-mode-vertical text-xs text-stone-900 group-hover:text-amber-900 font-medium whitespace-nowrap overflow-hidden max-h-40"
                    style={{ fontFamily: '"FangSong", "STFangsong", "仿宋", serif' }}
                  >
                    {prevBook.title.slice(0, 20)}{prevBook.title.length > 20 ? '...' : ''}
                  </div>
                </div>
              </div>
            </button>
          )}

          {nextBook && (
            <button
              onClick={() => {
                const currentParams = new URLSearchParams(window.location.search);
                const targetUrl = `/books/${nextBook.id}${currentParams.toString() ? `?${currentParams.toString()}` : ''}`;
                router.push(targetUrl);
              }}
              className="fixed right-0 top-1/2 -translate-y-1/2 z-40 group"
              title={nextBook.title}
            >
              <div className="bg-stone-100 hover:bg-amber-50 border-l border-t border-b border-stone-400 rounded-l-md shadow-md px-2 py-6 transition-all duration-200 group-hover:px-3">
                <div className="flex flex-col items-center gap-3">
                  <ChevronRight className="h-5 w-5 text-stone-800 group-hover:text-amber-800" />
                  <div
                    className="writing-mode-vertical text-xs text-stone-900 group-hover:text-amber-900 font-medium whitespace-nowrap overflow-hidden max-h-40"
                    style={{ fontFamily: '"FangSong", "STFangsong", "仿宋", serif' }}
                  >
                    {nextBook.title.slice(0, 20)}{nextBook.title.length > 20 ? '...' : ''}
                  </div>
                </div>
              </div>
            </button>
          )}
        </div>

        {/* 右侧释文栏 */}
        {showRightPanel && hasOCRText && (
          <div className="w-96 border-l bg-white flex-shrink-0 overflow-hidden">
            <TranscriptionPanel
              text={book.full_text}
              currentPage={currentPage}
            />
          </div>
        )}
      </div>

      {/* AI文本选择工具栏 */}
      <TextSelectionToolbar />
    </div>
  );
}
