'use client';

import { X, Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface AIResultDialogProps {
  title: string;
  content: string;
  onClose: () => void;
}

export function AIResultDialog({ title, content, onClose }: AIResultDialogProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[80vh] flex flex-col">
        {/* 标题栏 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200">
          <h2
            className="text-lg font-medium text-stone-900"
            style={{ fontFamily: '"FangSong", "STFangsong", "仿宋", serif' }}
          >
            {title}
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={copyToClipboard}
              className="p-2 hover:bg-stone-100 rounded transition-colors"
              title="复制"
            >
              {copied ? (
                <Check className="w-4 h-4 text-green-600" />
              ) : (
                <Copy className="w-4 h-4 text-stone-600" />
              )}
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-stone-100 rounded transition-colors"
              title="关闭"
            >
              <X className="w-4 h-4 text-stone-600" />
            </button>
          </div>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-y-auto p-6">
          <div
            className="prose prose-stone max-w-none whitespace-pre-wrap"
            style={{ fontFamily: '"FangSong", "STFangsong", "仿宋", serif' }}
          >
            {content}
          </div>
        </div>

        {/* 底部 */}
        <div className="px-6 py-4 border-t border-stone-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-amber-700 text-white rounded hover:bg-amber-800 transition-colors"
            style={{ fontFamily: '"FangSong", "STFangsong", "仿宋", serif' }}
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
