'use client';

import { X, Copy, Check, ChevronRight, ChevronLeft } from 'lucide-react';
import { useState, useEffect } from 'react';

interface AIResultDialogProps {
  title: string;
  content: string;
  onClose: () => void;
}

export function AIResultDialog({ title, content, onClose }: AIResultDialogProps) {
  const [copied, setCopied] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    // 延迟显示以触发动画
    setTimeout(() => setIsVisible(true), 10);
  }, []);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClose = () => {
    setIsVisible(false);
    // 等待动画完成后关闭
    setTimeout(onClose, 300);
  };

  return (
    <>
      {/* 背景遮罩 - 只在未最小化时显示 */}
      {!isMinimized && (
        <div
          className={`fixed inset-0 bg-black/30 transition-opacity duration-300 ${
            isVisible ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ zIndex: 9998 }}
          onClick={handleClose}
        />
      )}

      {/* 最小化状态下的小按钮 */}
      {isMinimized && (
        <button
          onClick={() => setIsMinimized(false)}
          className="fixed right-4 top-1/2 -translate-y-1/2 bg-amber-700 hover:bg-amber-800 text-white rounded-lg shadow-lg px-3 py-2 transition-all duration-300 flex items-center gap-2 group"
          style={{ zIndex: 9999 }}
          title={`展开${title}`}
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="text-sm font-semibold" style={{ fontFamily: '"FangSong", "STFangsong", "仿宋", serif' }}>
            {title}
          </span>
        </button>
      )}

      {/* 右侧滑出面板 */}
      {!isMinimized && (
        <div
          className={`fixed top-0 right-0 h-full w-full sm:w-[600px] bg-white shadow-2xl flex flex-col transition-all duration-300 ${
            isVisible ? 'translate-x-0' : 'translate-x-full'
          }`}
          style={{ zIndex: 9999 }}
        >
          {/* 标题栏 */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-stone-300 bg-amber-50">
              <h2
                className="text-lg sm:text-xl font-bold text-stone-900"
                style={{ fontFamily: '"FangSong", "STFangsong", "仿宋", serif' }}
              >
                {title}
              </h2>
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  onClick={copyToClipboard}
                  className="p-1.5 sm:p-2 hover:bg-amber-100 rounded transition-colors"
                  title="复制"
                >
                  {copied ? (
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                  ) : (
                    <Copy className="w-4 h-4 sm:w-5 sm:h-5 text-stone-600" />
                  )}
                </button>
                <button
                  onClick={() => setIsMinimized(true)}
                  className="p-1.5 sm:p-2 hover:bg-amber-100 rounded transition-colors hidden sm:block"
                  title="最小化"
                >
                  <ChevronRight className="w-5 h-5 text-stone-600" />
                </button>
                <button
                  onClick={handleClose}
                  className="p-1.5 sm:p-2 hover:bg-amber-100 rounded transition-colors"
                  title="关闭"
                >
                  <X className="w-4 h-4 sm:w-5 sm:h-5 text-stone-600" />
                </button>
              </div>
            </div>

          {/* 内容区域 */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-stone-50">
            <div
              className="prose prose-stone max-w-none whitespace-pre-wrap bg-white p-4 sm:p-6 rounded-lg shadow-sm text-stone-900"
              style={{
                fontFamily: '"FangSong", "STFangsong", "仿宋", serif',
                fontSize: '15px',
                lineHeight: '2.0',
                fontWeight: '500',
                color: '#1c1917'
              }}
            >
              {content}
            </div>
          </div>

          {/* 底部 */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-stone-200 bg-white flex justify-end">
            <button
              onClick={handleClose}
              className="px-5 sm:px-6 py-2 sm:py-2.5 bg-amber-700 text-white rounded-lg hover:bg-amber-800 transition-colors text-sm sm:text-base"
              style={{ fontFamily: '"FangSong", "STFangsong", "仿宋", serif' }}
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </>
  );
}
