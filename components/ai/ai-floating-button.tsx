'use client';

import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { AIChatWindow } from './ai-chat-window';

export function AIFloatingButton() {
  const [showChat, setShowChat] = useState(false);

  return (
    <>
      {!showChat && (
        <button
          onClick={() => setShowChat(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-amber-700 text-white rounded-full shadow-lg hover:bg-amber-800 transition-all hover:scale-110 flex items-center justify-center z-40"
          title="AI助手"
        >
          <Sparkles className="w-6 h-6" />
        </button>
      )}

      {showChat && <AIChatWindow onClose={() => setShowChat(false)} />}
    </>
  );
}
