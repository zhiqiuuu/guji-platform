'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// 动态导入 react-pdf
const Document = dynamic(
  () => import('react-pdf').then((mod) => mod.Document),
  { ssr: false }
);

const Page = dynamic(
  () => import('react-pdf').then((mod) => mod.Page),
  { ssr: false }
);

interface PdfViewerSimpleProps {
  fileUrl: string;
  bookId?: string;
  currentPage: number;
  onPageChange: (page: number) => void;
  onTotalPagesChange?: (total: number) => void;
  className?: string;
}

export function PdfViewerSimple({
  fileUrl,
  bookId,
  currentPage,
  onPageChange,
  onTotalPagesChange,
  className
}: PdfViewerSimpleProps) {
  const { user } = useAuth();
  const [numPages, setNumPages] = useState<number>(0);
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [pageInput, setPageInput] = useState<string>(currentPage.toString());
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 配置 PDF.js worker
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('react-pdf').then((pdfjs) => {
        pdfjs.pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.pdfjs.version}/build/pdf.worker.min.mjs`;
      });
    }
  }, []);

  // 同步页码输入框
  useEffect(() => {
    setPageInput(currentPage.toString());
  }, [currentPage]);

  // 保存阅读进度
  const saveProgress = useCallback(async (page: number, totalPages: number) => {
    if (user && bookId && totalPages > 0) {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

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
  }, [user, bookId]);

  useEffect(() => {
    if (numPages > 0) {
      saveProgress(currentPage, numPages);
    }
  }, [currentPage, numPages, saveProgress]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    if (onTotalPagesChange) {
      onTotalPagesChange(numPages);
    }
  }

  function changePage(offset: number) {
    const newPage = currentPage + offset;
    if (newPage >= 1 && newPage <= numPages) {
      onPageChange(newPage);
    }
  }

  function goToPage(page: number) {
    if (page >= 1 && page <= numPages) {
      onPageChange(page);
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
      setPageInput(currentPage.toString());
    }
  }

  function zoomIn() {
    setScale(prevScale => Math.min(prevScale + 0.2, 3.0));
  }

  function zoomOut() {
    setScale(prevScale => Math.max(prevScale - 0.2, 0.5));
  }

  function rotate() {
    setRotation(prev => (prev + 90) % 360);
  }

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;

      if (e.key === 'ArrowLeft') changePage(-1);
      if (e.key === 'ArrowRight') changePage(1);
      if (e.key === '+' || e.key === '=') zoomIn();
      if (e.key === '-') zoomOut();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPage, numPages]);

  return (
    <div className={cn("flex flex-col h-full bg-gray-100", className)}>
      {/* 控制栏 */}
      <div className="flex items-center justify-between p-2 bg-white border-b shadow-sm">
        {/* 页面导航 */}
        <div className="flex items-center gap-2">
          <Button
            onClick={() => changePage(-1)}
            disabled={currentPage <= 1}
            variant="outline"
            size="sm"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <form onSubmit={handlePageInputSubmit} className="flex items-center gap-1">
            <Input
              type="text"
              value={pageInput}
              onChange={handlePageInputChange}
              className="w-14 h-8 text-center text-sm"
            />
            <span className="text-sm text-gray-600">/ {numPages}</span>
          </form>

          <Button
            onClick={() => changePage(1)}
            disabled={currentPage >= numPages}
            variant="outline"
            size="sm"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* 工具栏 */}
        <div className="flex items-center gap-1">
          <Button onClick={zoomOut} disabled={scale <= 0.5} variant="ghost" size="sm">
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm text-gray-600 min-w-[50px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <Button onClick={zoomIn} disabled={scale >= 3.0} variant="ghost" size="sm">
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button onClick={rotate} variant="ghost" size="sm">
            <RotateCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* PDF 显示区域 */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto flex items-center justify-center p-4"
      >
        <Document
          file={fileUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="flex items-center justify-center py-20">
              <div className="text-gray-600">加载中...</div>
            </div>
          }
          error={
            <div className="flex items-center justify-center py-20">
              <div className="text-red-600">加载PDF失败</div>
            </div>
          }
        >
          <Page
            pageNumber={currentPage}
            scale={scale}
            rotate={rotation}
            loading={
              <div className="flex items-center justify-center py-20">
                <div className="text-gray-600">加载页面中...</div>
              </div>
            }
            renderTextLayer={false}
            renderAnnotationLayer={false}
            className="shadow-lg"
          />
        </Document>
      </div>

      {/* 快捷键提示 */}
      <div className="text-xs text-gray-500 py-1 text-center bg-white border-t">
        快捷键: ← → 翻页 | + - 缩放
      </div>
    </div>
  );
}
