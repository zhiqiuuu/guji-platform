'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Palette,
  Type,
  AlignJustify,
  Languages,
  Maximize
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';

interface TextReaderProps {
  text: string;
  bookId: string;
}

type Theme = 'default' | 'sepia' | 'dark';
type TextMode = 'simplified' | 'traditional';

const THEME_COLORS = {
  default: { bg: 'bg-gray-100', text: 'text-gray-900', prose: 'prose-gray' },
  sepia: { bg: 'bg-amber-50', text: 'text-amber-950', prose: 'prose-amber' },
  dark: { bg: 'bg-gray-900', text: 'text-gray-100', prose: 'prose-invert' },
};

const FONT_SIZES = {
  small: 'text-base',
  medium: 'text-lg',
  large: 'text-xl',
  xlarge: 'text-2xl',
};

const LINE_HEIGHTS = {
  tight: 'leading-relaxed',
  normal: 'leading-loose',
  loose: 'leading-[2.5]',
};

export function TextReader({ text, bookId }: TextReaderProps) {
  const { user } = useAuth();
  const [theme, setTheme] = useState<Theme>('sepia');
  const [fontSize, setFontSize] = useState<keyof typeof FONT_SIZES>('medium');
  const [lineHeight, setLineHeight] = useState<keyof typeof LINE_HEIGHTS>('normal');
  const [textMode, setTextMode] = useState<TextMode>('simplified');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [currentMatch, setCurrentMatch] = useState(0);
  const [totalMatches, setTotalMatches] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [scrollPosition, setScrollPosition] = useState(0);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  // 生成唯一的存储key
  const storageKey = `text-reader-settings-${bookId}`;
  const scrollStorageKey = `text-scroll-${bookId}`;

  // 加载保存的设置和阅读进度
  useEffect(() => {
    const savedSettings = localStorage.getItem(storageKey);
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        setTheme(settings.theme || 'sepia');
        setFontSize(settings.fontSize || 'medium');
        setLineHeight(settings.lineHeight || 'normal');
        setTextMode(settings.textMode || 'simplified');
      } catch (e) {
        console.error('Failed to load settings:', e);
      }
    }

    // 加载滚动位置
    async function loadScrollPosition() {
      if (user && bookId) {
        try {
          const response = await fetch(`/api/reading-history/${bookId}`);
          const data = await response.json();
          if (data.history && data.history.scroll_position) {
            setScrollPosition(data.history.scroll_position);
            return;
          }
        } catch (err) {
          console.error('Error loading reading history:', err);
        }
      }

      // 如果没有登录或加载失败,从localStorage加载
      const savedScroll = localStorage.getItem(scrollStorageKey);
      if (savedScroll) {
        const scroll = parseInt(savedScroll, 10);
        if (scroll > 0) {
          setScrollPosition(scroll);
        }
      }
    }

    loadScrollPosition();
  }, [storageKey, scrollStorageKey, user, bookId]);

  // 恢复滚动位置
  useEffect(() => {
    if (scrollContainerRef.current && scrollPosition > 0) {
      scrollContainerRef.current.scrollTop = scrollPosition;
    }
  }, [scrollPosition]);

  // 保存阅读进度(防抖)
  const saveProgress = useCallback(async (scroll: number) => {
    // 保存到localStorage
    localStorage.setItem(scrollStorageKey, scroll.toString());

    // 如果用户已登录,保存到服务器
    if (user && bookId) {
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
              current_page: 0, // 文本模式不使用页码
              total_pages: 0,
              view_mode: 'text',
              scroll_position: scroll,
            }),
          });
        } catch (err) {
          console.error('Error saving reading progress:', err);
        }
      }, 3000);
    }
  }, [user, bookId, scrollStorageKey]);

  // 监听滚动事件
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scroll = container.scrollTop;
      saveProgress(scroll);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [saveProgress]);

  // 保存设置
  useEffect(() => {
    const settings = {
      theme,
      fontSize,
      lineHeight,
      textMode,
    };
    localStorage.setItem(storageKey, JSON.stringify(settings));
  }, [theme, fontSize, lineHeight, textMode, storageKey]);

  // 简繁转换 (简单实现，实际项目中应使用专业的转换库如 opencc-js)
  const displayText = useMemo(() => {
    if (textMode === 'simplified') {
      return text;
    }
    // TODO: 实现繁体转换，这里暂时返回原文
    return text;
  }, [text, textMode]);

  // 搜索高亮
  const highlightedText = useMemo(() => {
    if (!searchQuery.trim()) {
      return displayText;
    }

    const regex = new RegExp(`(${searchQuery})`, 'gi');
    const matches = displayText.match(regex);
    setTotalMatches(matches ? matches.length : 0);

    return displayText.split(regex).map((part, index) => {
      if (regex.test(part)) {
        return `<mark class="bg-yellow-300 dark:bg-yellow-600">${part}</mark>`;
      }
      return part;
    }).join('');
  }, [displayText, searchQuery]);

  function toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }

  // 监听全屏变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // 搜索导航
  function nextMatch() {
    if (totalMatches > 0) {
      setCurrentMatch((prev) => (prev + 1) % totalMatches);
    }
  }

  function previousMatch() {
    if (totalMatches > 0) {
      setCurrentMatch((prev) => (prev - 1 + totalMatches) % totalMatches);
    }
  }

  const currentTheme = THEME_COLORS[theme];

  return (
    <div className="flex flex-col items-center w-full h-full">
      {/* 工具栏 */}
      <div className="sticky top-0 z-10 w-full bg-white dark:bg-gray-800 border-b shadow-sm p-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* 搜索 */}
          <div className="flex items-center gap-2">
            {showSearch && (
              <div className="flex items-center gap-1">
                <Input
                  type="text"
                  placeholder="搜索..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-40 h-8 text-sm"
                />
                {totalMatches > 0 && (
                  <>
                    <span className="text-sm text-gray-600">
                      {currentMatch + 1} / {totalMatches}
                    </span>
                    <Button onClick={previousMatch} variant="outline" size="sm">
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button onClick={nextMatch} variant="outline" size="sm">
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            )}
            <Button
              onClick={() => setShowSearch(!showSearch)}
              variant="outline"
              size="sm"
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>

          {/* 工具栏 */}
          <div className="flex items-center gap-2">
            {/* 字体大小 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Type className="h-4 w-4 mr-1" />
                  字号
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setFontSize('small')}>
                  小
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFontSize('medium')}>
                  中
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFontSize('large')}>
                  大
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFontSize('xlarge')}>
                  特大
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* 行间距 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <AlignJustify className="h-4 w-4 mr-1" />
                  行距
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setLineHeight('tight')}>
                  紧凑
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLineHeight('normal')}>
                  正常
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setLineHeight('loose')}>
                  宽松
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* 繁简切换 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Languages className="h-4 w-4 mr-1" />
                  {textMode === 'simplified' ? '简' : '繁'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setTextMode('simplified')}>
                  简体
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTextMode('traditional')}>
                  繁体
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
          快捷键: Ctrl+F 搜索 | F 全屏
        </div>
      </div>

      {/* 文本显示区域 */}
      <div
        ref={scrollContainerRef}
        className={`flex-1 w-full overflow-auto ${currentTheme.bg} p-8 transition-colors`}
      >
        <div className="max-w-4xl mx-auto">
          <article
            className={`
              ${currentTheme.text}
              ${FONT_SIZES[fontSize]}
              ${LINE_HEIGHTS[lineHeight]}
              prose ${currentTheme.prose} prose-lg max-w-none
              font-serif
              whitespace-pre-wrap
            `}
            dangerouslySetInnerHTML={{ __html: highlightedText }}
          />
        </div>
      </div>
    </div>
  );
}
