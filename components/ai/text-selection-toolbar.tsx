'use client';

import { useState, useEffect, useRef } from 'react';
import { Sparkles, Languages, Loader2 } from 'lucide-react';
import { AIResultDialog } from './ai-result-dialog';

export function TextSelectionToolbar() {
  const [selectedText, setSelectedText] = useState('');
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState<{ title: string; content: string } | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseUp = () => {
      // 如果正在显示 AI 结果对话框,不处理文本选择
      if (isDialogOpen) return;

      const selection = window.getSelection();
      const text = selection?.toString().trim();

      if (text && text.length > 0) {
        const range = selection!.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        setSelectedText(text);
        setPosition({
          x: rect.left + rect.width / 2,
          y: rect.top - 10
        });
      } else {
        setSelectedText('');
        setPosition(null);
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      // 如果正在显示 AI 结果对话框,不处理鼠标点击
      if (isDialogOpen) return;

      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        setSelectedText('');
        setPosition(null);
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [isDialogOpen]);

  const handleInterpret = async () => {
    if (!selectedText) return;

    setLoading(true);
    try {
      const response = await fetch('/api/ai/interpret', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: selectedText })
      });

      const data = await response.json();

      if (data.success) {
        console.log('AI解读成功, 内容:', data.content);
        const result = {
          title: 'AI解读',
          content: data.content
        };
        setAiResult(result);
        setIsDialogOpen(true);
        console.log('设置 isDialogOpen 为 true, aiResult:', result);
        setPosition(null);
        setSelectedText('');
      } else {
        alert(data.error || '解读失败');
      }
    } catch (error) {
      alert('服务暂时不可用,请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  const handleTranslate = async () => {
    if (!selectedText) return;

    setLoading(true);
    try {
      const response = await fetch('/api/ai/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: selectedText })
      });

      const data = await response.json();

      if (data.success) {
        setAiResult({
          title: 'AI翻译',
          content: data.content
        });
        setIsDialogOpen(true);
        setPosition(null);
        setSelectedText('');
      } else {
        alert(data.error || '翻译失败');
      }
    } catch (error) {
      alert('服务暂时不可用,请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setAiResult(null);
    setIsDialogOpen(false);
  };

  console.log('渲染 TextSelectionToolbar, aiResult:', aiResult, 'isDialogOpen:', isDialogOpen);

  return (
    <>
      {position && selectedText && (
        <div
          ref={toolbarRef}
          className="fixed z-50 bg-white rounded-lg shadow-lg border border-stone-200 px-2 py-1.5 flex items-center gap-2"
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            transform: 'translate(-50%, -100%)'
          }}
        >
          {loading ? (
            <div className="px-3 py-1.5 flex items-center gap-2 text-stone-900">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm font-semibold" style={{ fontFamily: '"FangSong", "STFangsong", "仿宋", serif' }}>
                处理中...
              </span>
            </div>
          ) : (
            <>
              <button
                onClick={handleInterpret}
                className="px-3 py-2 hover:bg-amber-50 rounded transition-colors flex items-center gap-2 text-stone-900 hover:text-amber-900"
                title="AI解读"
              >
                <Sparkles className="w-5 h-5" />
                <span className="text-sm font-semibold" style={{ fontFamily: '"FangSong", "STFangsong", "仿宋", serif' }}>
                  AI解读
                </span>
              </button>
              <div className="w-px h-5 bg-stone-300"></div>
              <button
                onClick={handleTranslate}
                className="px-3 py-2 hover:bg-amber-50 rounded transition-colors flex items-center gap-2 text-stone-900 hover:text-amber-900"
                title="AI翻译"
              >
                <Languages className="w-5 h-5" />
                <span className="text-sm font-semibold" style={{ fontFamily: '"FangSong", "STFangsong", "仿宋", serif' }}>
                  AI翻译
                </span>
              </button>
            </>
          )}
        </div>
      )}

      {aiResult && isDialogOpen && (
        <AIResultDialog
          title={aiResult.title}
          content={aiResult.content}
          onClose={handleCloseDialog}
        />
      )}
    </>
  );
}
