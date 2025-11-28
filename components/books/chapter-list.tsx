'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Chapter {
  id: string;
  title: string;
  page_start: number;
  page_end: number;
  children?: Chapter[];
}

interface ChapterListProps {
  chapters: Chapter[];
  currentPage: number;
  onChapterClick: (pageNumber: number) => void;
  className?: string;
}

export function ChapterList({
  chapters,
  currentPage,
  onChapterClick,
  className
}: ChapterListProps) {
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());

  const toggleChapter = (chapterId: string) => {
    const newExpanded = new Set(expandedChapters);
    if (newExpanded.has(chapterId)) {
      newExpanded.delete(chapterId);
    } else {
      newExpanded.add(chapterId);
    }
    setExpandedChapters(newExpanded);
  };

  const isChapterActive = (chapter: Chapter) => {
    return currentPage >= chapter.page_start && currentPage <= chapter.page_end;
  };

  const renderChapter = (chapter: Chapter, level: number = 0) => {
    const isExpanded = expandedChapters.has(chapter.id);
    const isActive = isChapterActive(chapter);
    const hasChildren = chapter.children && chapter.children.length > 0;

    return (
      <div key={chapter.id} className="select-none">
        <div
          className={cn(
            "flex items-center gap-2 py-2 px-3 cursor-pointer rounded-md transition-colors hover:bg-amber-50",
            isActive && "bg-amber-100 font-medium text-amber-900",
            !isActive && "text-gray-700 hover:text-gray-900"
          )}
          style={{ paddingLeft: `${level * 16 + 12}px` }}
          onClick={() => {
            if (hasChildren) {
              toggleChapter(chapter.id);
            }
            onChapterClick(chapter.page_start);
          }}
        >
          {hasChildren && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleChapter(chapter.id);
              }}
              className="flex-shrink-0 hover:bg-amber-200 rounded p-0.5"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          )}
          {!hasChildren && (
            <div className="w-5 flex-shrink-0" />
          )}
          <span className="flex-1 text-sm truncate" title={chapter.title}>
            {chapter.title}
          </span>
          <span className="text-xs text-gray-500 flex-shrink-0">
            p.{chapter.page_start}
          </span>
        </div>

        {hasChildren && isExpanded && (
          <div className="mt-1">
            {chapter.children.map(child => renderChapter(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* 标题 */}
      <div className="flex items-center gap-2 p-4 border-b bg-gradient-to-r from-amber-50 to-amber-100">
        <BookOpen className="h-5 w-5 text-amber-700" />
        <h2 className="font-semibold text-gray-900">目录</h2>
      </div>

      {/* 章节列表 */}
      <div className="flex-1 overflow-y-auto p-2">
        {chapters.length > 0 ? (
          chapters.map(chapter => renderChapter(chapter))
        ) : (
          <div className="text-center text-gray-500 text-sm py-8">
            暂无目录信息
          </div>
        )}
      </div>
    </div>
  );
}
