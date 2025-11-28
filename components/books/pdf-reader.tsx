'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize, Palette, Type } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// 动态导入 react-pdf 以避免 SSR 问题
const Document = dynamic(
  () => import('react-pdf').then((mod) => mod.Document),
  { ssr: false }
);

const Page = dynamic(
  () => import('react-pdf').then((mod) => mod.Page),
  { ssr: false }
);

interface PdfReaderProps {
  fileUrl: string;
  bookId?: string;
}

type Theme = 'default' | 'sepia' | 'dark';

const THEME_COLORS = {
  default: { bg: 'bg-gray-100', text: 'text-gray-900' },
  sepia: { bg: 'bg-amber-50', text: 'text-amber-950' },
  dark: { bg: 'bg-gray-900', text: 'text-gray-100' },
};

export function PdfReader({ fileUrl, bookId }: PdfReaderProps) {
  const { user } = useAuth();
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [theme, setTheme] = useState<Theme>('default');
  const [pageInput, setPageInput] = useState<string>('1');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 生成唯一的存储key
  const storageKey = `pdf-progress-${fileUrl}`;

  // 配置 PDF.js worker (仅在客户端)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('react-pdf').then((pdfjs) => {
        pdfjs.pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.pdfjs.version}/build/pdf.worker.min.mjs`;
      });
    }
  }, []);

  // 加载保存的阅读进度(从服务器或localStorage)
  useEffect(() => {
    async function loadProgress() {
      if (user && bookId) {
        try {
          const response = await fetch(`/api/reading-history/${bookId}`);
          const data = await response.json();
          if (data.history && data.history.current_page) {
            setPageNumber(data.history.current_page);
            setPageInput(data.history.current_page.toString());
            return;
          }
        } catch (err) {
          console.error('Error loading reading history:', err);
        }
      }

      // 如果没有登录或加载失败,从localStorage加载
      const savedPage = localStorage.getItem(storageKey);
      if (savedPage) {
        const page = parseInt(savedPage, 10);
        if (page > 0) {
          setPageNumber(page);
          setPageInput(page.toString());
        }
      }
    }

    loadProgress();
  }, [user, bookId, storageKey]);

  // 保存阅读进度(防抖)
  const saveProgress = useCallback(async (page: number, totalPages: number) => {
    // 保存到localStorage
    localStorage.setItem(storageKey, page.toString());

    // 如果用户已登录且有bookId,保存到服务器
    if (user && bookId && totalPages > 0) {
      // 清除之前的定时器
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // 设置新的定时器,3秒后保存
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          await fetch('/api/reading-history', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              book_id: bookId,
              current_page: page,
              total_pages: totalPages,
              view_mode: 'pdf',
              scroll_position: 0,
            }),
          });
        } catch (err) {
          console.error('Error saving reading progress:', err);
        }
      }, 3000);
    }
  }, [user, bookId, storageKey]);

  // 监听页码变化,自动保存进度
  useEffect(() => {
    if (numPages > 0) {
      saveProgress(pageNumber, numPages);
    }
  }, [pageNumber, numPages, saveProgress]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setPageNumber(1);
  }

  function changePage(offset: number) {
    const newPage = pageNumber + offset;
    if (newPage >= 1 && newPage <= numPages) {
      setPageNumber(newPage);
      setPageInput(newPage.toString());
    }
  }

  function previousPage() {
    changePage(-1);
  }

  function nextPage() {
    changePage(1);
  }

  function goToPage(page: number) {
    if (page >= 1 && page <= numPages) {
      setPageNumber(page);
      setPageInput(page.toString());
    }
  }

  function handlePageInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    setPageInput(e.target.value);
  }

  function handlePageInputSubmit(e: React.FormEvent) {
    e.preventDefault();
    const page = parseInt(pageInput, 10);
    if (!isNaN(page)) {
      goToPage(page);
    } else {
      setPageInput(pageNumber.toString());
    }
  }

  function zoomIn() {
    setScale(prevScale => Math.min(prevScale + 0.2, 3.0));
  }

  function zoomOut() {
    setScale(prevScale => Math.max(prevScale - 0.2, 0.5));
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') previousPage();
      if (e.key === 'ArrowRight') nextPage();
      if (e.key === '+' || e.key === '=') zoomIn();
      if (e.key === '-') zoomOut();
      if (e.key === 'f') toggleFullscreen();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pageNumber, numPages, scale]);

  // 监听全屏变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const currentTheme = THEME_COLORS[theme];

  return (
    <div className="flex flex-col items-center w-full h-full">
      {/* 增强的控制栏 */}
      <div className="sticky top-0 z-10 w-full bg-white border-b shadow-sm p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* 页面导航 */}
          <div className="flex items-center gap-2">
            <Button
              onClick={previousPage}
              disabled={pageNumber <= 1}
              variant="outline"
              size="sm"
            >
              <ChevronLeft className="h-4 w-4" />
              上一页
            </Button>

            <form onSubmit={handlePageInputSubmit} className="flex items-center gap-1">
              <span className="text-sm text-gray-600">第</span>
              <Input
                type="text"
                value={pageInput}
                onChange={handlePageInputChange}
                className="w-16 h-8 text-center text-sm"
              />
              <span className="text-sm text-gray-600">/ {numPages} 页</span>
            </form>

            <Button
              onClick={nextPage}
              disabled={pageNumber >= numPages}
              variant="outline"
              size="sm"
            >
              下一页
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* 工具栏 */}
          <div className="flex items-center gap-2">
            {/* 缩放控制 */}
            <div className="flex items-center gap-1 border rounded-md px-2">
              <Button onClick={zoomOut} disabled={scale <= 0.5} variant="ghost" size="sm">
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-sm text-gray-600 min-w-[50px] text-center">
                {Math.round(scale * 100)}%
              </span>
              <Button onClick={zoomIn} disabled={scale >= 3.0} variant="ghost" size="sm">
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>

            {/* 字体大小 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Type className="h-4 w-4 mr-1" />
                  字号
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setScale(0.8)}>
                  小 (80%)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setScale(1.0)}>
                  中 (100%)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setScale(1.2)}>
                  大 (120%)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setScale(1.5)}>
                  特大 (150%)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* 主题切换 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Palette className="h-4 w-4 mr-1" />
                  主题
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setTheme('default')}>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-100 border rounded"></div>
                    默认
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('sepia')}>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-amber-50 border rounded"></div>
                    护眼
                  </div>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('dark')}>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-900 border rounded"></div>
                    夜间
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* 全屏 */}
            <Button onClick={toggleFullscreen} variant="outline" size="sm">
              <Maximize className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* 快捷键提示 */}
        <div className="text-xs text-gray-500 mt-2 text-center">
          快捷键: ← → 翻页 | + - 缩放 | F 全屏
        </div>
      </div>

      {/* PDF 显示区域 */}
      <div className={`flex-1 w-full overflow-auto ${currentTheme.bg} p-8 flex justify-center transition-colors`}>
        <Document
          file={fileUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="flex items-center justify-center py-20">
              <div className={currentTheme.text}>加载中...</div>
            </div>
          }
          error={
            <div className="flex items-center justify-center py-20">
              <div className="text-red-600">加载PDF失败，请检查文件路径</div>
            </div>
          }
        >
          <Page
            pageNumber={pageNumber}
            scale={scale}
            loading={
              <div className="flex items-center justify-center py-20">
                <div className={currentTheme.text}>加载页面中...</div>
              </div>
            }
            renderTextLayer={false}
            renderAnnotationLayer={false}
            className="shadow-2xl"
          />
        </Document>
      </div>
    </div>
  );
}
