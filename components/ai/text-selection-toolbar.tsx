'use client';

import { useState, useEffect, useRef } from 'react';
import { Sparkles, Languages, Loader2 } from 'lucide-react';
import { AIResultDialog } from './ai-result-dialog';

export function TextSelectionToolbar() {
  const [selectedText, setSelectedText] = useState('');
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState<{ title: string; content: string } | null>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseUp = () => {
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
  }, []);

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
        setAiResult({
          title: 'AI解读',
          content: data.content
        });
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

  if (!position || !selectedText) return null;

  return (
    <>
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
          <div className="px-3 py-1.5 flex items-center gap-2 text-stone-600">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-xs" style={{ fontFamily: '"FangSong", "STFangsong", "仿宋", serif' }}>
              处理中...
            </span>
          </div>
        ) : (
          <>
            <button
              onClick={handleInterpret}
              className="px-3 py-1.5 hover:bg-amber-50 rounded transition-colors flex items-center gap-1.5 text-stone-700"
              title="AI解读"
            >
              <Sparkles className="w-4 h-4" />
              <span className="text-xs" style={{ fontFamily: '"FangSong", "STFangsong", "仿宋", serif' }}>
                AI解读
              </span>
            </button>
            <div className="w-px h-4 bg-stone-200"></div>
            <button
              onClick={handleTranslate}
              className="px-3 py-1.5 hover:bg-amber-50 rounded transition-colors flex items-center gap-1.5 text-stone-700"
              title="AI翻译"
            >
              <Languages className="w-4 h-4" />
              <span className="text-xs" style={{ fontFamily: '"FangSong", "STFangsong", "仿宋", serif' }}>
                AI翻译
              </span>
            </button>
          </>
        )}
      </div>

      {aiResult && (
        <AIResultDialog
          title={aiResult.title}
          content={aiResult.content}
          onClose={() => setAiResult(null)}
        />
      )}
    </>
  );
}
