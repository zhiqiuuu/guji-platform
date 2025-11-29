'use client';

import { useState, useRef, useEffect } from 'react';
import { X, Send, Minimize2, Maximize2, Sparkles } from 'lucide-react';
import { AI_PROMPTS } from '@/lib/kimi';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIChatWindowProps {
  onClose: () => void;
}

export function AIChatWindow({ onClose }: AIChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: '您好!我是课艺典藏的智能助手。本系统收录了2716部晚清书院文献,包括课题库和课艺库。我可以帮您:\n\n• 查询课艺收藏情况\n• 了解晚清书院教育\n• 解读课题和课艺内容\n• 翻译古文\n\n请问有什么可以帮到您?'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: input,
          history: messages.map(m => ({ role: m.role, content: m.content })),
          stream: false
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.message }]);
      } else {
        throw new Error(data.error || '请求失败');
      }
    } catch (error: any) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `抱歉,发生了错误: ${error.message || '请稍后再试'}`
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (minimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setMinimized(false)}
          className="flex items-center gap-2 px-4 py-3 bg-amber-700 text-white rounded-lg shadow-lg hover:bg-amber-800 transition-colors"
          style={{ fontFamily: '"FangSong", "STFangsong", "仿宋", serif' }}
        >
          <Sparkles className="w-5 h-5" />
          <span className="text-base font-semibold">AI助手</span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 right-0 sm:bottom-4 sm:right-4 w-full sm:w-96 h-full sm:h-[600px] bg-white sm:rounded-lg shadow-2xl border-t sm:border border-stone-200 flex flex-col z-50">
      {/* 标题栏 */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 bg-amber-700 text-white sm:rounded-t-lg">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
          <h3
            className="text-base sm:text-lg font-bold"
            style={{ fontFamily: '"FangSong", "STFangsong", "仿宋", serif' }}
          >
            AI古籍助手
          </h3>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setMinimized(true)}
            className="p-1 hover:bg-amber-800 rounded transition-colors hidden sm:block"
            title="最小化"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-amber-800 rounded transition-colors"
            title="关闭"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] px-4 py-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-amber-700 text-white'
                  : 'bg-stone-100'
              }`}
              style={{ fontFamily: '"FangSong", "STFangsong", "仿宋", serif' }}
            >
              <p
                className="whitespace-pre-wrap leading-relaxed"
                style={{
                  fontSize: '16px',
                  lineHeight: '1.9',
                  fontWeight: '600',
                  color: message.role === 'user' ? '#ffffff' : '#0c0a09'
                }}
              >
                {message.content}
              </p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-stone-100 px-4 py-3 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-stone-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-stone-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-stone-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
                <span
                  style={{
                    fontFamily: '"FangSong", "STFangsong", "仿宋", serif',
                    fontSize: '15px',
                    fontWeight: '600',
                    color: '#0c0a09'
                  }}
                >
                  思考中...
                </span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入框 */}
      <div className="p-4 border-t border-stone-200">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="输入你的问题..."
            className="flex-1 px-3 py-2 border border-stone-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-amber-700 focus:border-transparent"
            style={{
              fontFamily: '"FangSong", "STFangsong", "仿宋", serif',
              fontSize: '16px',
              lineHeight: '1.7',
              fontWeight: '500',
              color: '#0c0a09'
            }}
            rows={2}
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="px-4 py-2 bg-amber-700 text-white rounded-lg hover:bg-amber-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
