'use client';

import { useState, useEffect, useMemo } from 'react';
import { FileText, Search, Type, Palette, Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

type Theme = 'default' | 'sepia' | 'dark';
type TextMode = 'simplified' | 'traditional';

const THEME_COLORS = {
  default: { bg: 'bg-white', text: 'text-gray-900' },
  sepia: { bg: 'bg-amber-50', text: 'text-amber-950' },
  dark: { bg: 'bg-gray-900', text: 'text-gray-100' },
};

const FONT_SIZES = {
  small: 'text-sm',
  medium: 'text-base',
  large: 'text-lg',
  xlarge: 'text-xl',
};

interface TranscriptionPanelProps {
  text: string;
  currentPage?: number;
  className?: string;
}

export function TranscriptionPanel({
  text,
  currentPage,
  className
}: TranscriptionPanelProps) {
  const [theme, setTheme] = useState<Theme>('sepia');
  const [fontSize, setFontSize] = useState<keyof typeof FONT_SIZES>('medium');
  const [textMode, setTextMode] = useState<TextMode>('simplified');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  // 简繁转换 (简单实现,实际项目应使用 opencc-js)
  const displayText = useMemo(() => {
    if (textMode === 'simplified') {
      return text;
    }
    // TODO: 实现繁体转换
    return text;
  }, [text, textMode]);

  // 搜索高亮
  const highlightedText = useMemo(() => {
    if (!searchQuery.trim()) {
      return displayText;
    }

    const regex = new RegExp(`(${searchQuery})`, 'gi');
    return displayText.split(regex).map((part, index) => {
      if (regex.test(part)) {
        return `<mark class="bg-yellow-300 dark:bg-yellow-600">${part}</mark>`;
      }
      return part;
    }).join('');
  }, [displayText, searchQuery]);

  const currentTheme = THEME_COLORS[theme];

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* 标题栏 */}
      <div className="flex items-center justify-between p-3 border-b bg-gradient-to-r from-amber-50 to-amber-100">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-amber-700" />
          <h2 className="font-semibold text-gray-900">释文</h2>
          {currentPage && (
            <span className="text-xs text-gray-600">第 {currentPage} 页</span>
          )}
        </div>

        {/* 快捷工具 */}
        <div className="flex items-center gap-1">
          {/* 搜索按钮 */}
          <Button
            onClick={() => setShowSearch(!showSearch)}
            variant="ghost"
            size="sm"
            className="h-7 w-7 p-0"
          >
            <Search className="h-4 w-4" />
          </Button>

          {/* 字号 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                <Type className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
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

          {/* 繁简切换 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                <Languages className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTextMode('simplified')}>
                简体
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTextMode('traditional')}>
                繁体
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 主题 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                <Palette className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme('default')}>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-white border rounded"></div>
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
        </div>
      </div>

      {/* 搜索栏 */}
      {showSearch && (
        <div className="p-2 border-b bg-gray-50">
          <Input
            type="text"
            placeholder="搜索文本..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 text-sm"
          />
        </div>
      )}

      {/* 文本内容区 */}
      <div className={cn("flex-1 overflow-y-auto p-4 transition-colors", currentTheme.bg)}>
        {text ? (
          <div
            className={cn(
              "whitespace-pre-wrap leading-loose font-serif",
              currentTheme.text,
              FONT_SIZES[fontSize]
            )}
            dangerouslySetInnerHTML={{ __html: highlightedText }}
          />
        ) : (
          <div className="text-center text-gray-500 text-sm py-8">
            暂无释文内容
          </div>
        )}
      </div>
    </div>
  );
}
