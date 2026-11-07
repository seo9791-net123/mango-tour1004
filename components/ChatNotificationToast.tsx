import React, { useEffect, useState } from 'react';
import { ChatMessage } from '../types';
import { getChatSoundTheme, CHAT_SOUND_THEMES } from '../utils/chatNotificationUtils';

interface Props {
  message: ChatMessage | null;
  onOpenChat: () => void;
  onDismiss: () => void;
  unreadCount?: number;
}

const ChatNotificationToast: React.FC<Props> = ({ message, onOpenChat, onDismiss, unreadCount = 1 }) => {
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (!message) return;
    setProgress(100);

    const duration = 6000; // 6 seconds
    const intervalTime = 50;
    const step = (intervalTime / duration) * 100;

    const timer = setInterval(() => {
      if (!isPaused) {
        setProgress((prev) => {
          if (prev <= 0) {
            clearInterval(timer);
            onDismiss();
            return 0;
          }
          return Math.max(0, prev - step);
        });
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, [message, isPaused, onDismiss]);

  if (!message) return null;

  const isAdmin = message.sender === '관리자' || message.sender === 'admin';
  const activeSound = CHAT_SOUND_THEMES.find(t => t.id === getChatSoundTheme()) || CHAT_SOUND_THEMES[0];

  return (
    <div 
      className="fixed top-4 left-4 right-4 md:left-auto md:right-6 md:top-6 z-[10005] max-w-sm md:w-[380px] mx-auto animate-bounce-in no-print"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div 
        onClick={onOpenChat}
        className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border-2 border-gold-400/80 p-3.5 sm:p-4 text-gray-800 transition-all duration-200 hover:shadow-gold-500/20 hover:scale-[1.02] cursor-pointer relative overflow-hidden"
      >
        {/* Glow Header */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shadow-xs ${
              isAdmin ? 'bg-gradient-to-tr from-amber-500 to-gold-400 text-white' : 'bg-gradient-to-tr from-deepgreen to-teal-600 text-white'
            }`}>
              {isAdmin ? '👑' : '💬'}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-gray-900 tracking-tight">
                  {isAdmin ? '망고투어 관리자' : message.sender}
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-red-100 text-red-600 border border-red-200 animate-pulse">
                  새 메시지
                </span>
              </div>
              <span className="text-[10px] text-gray-400 font-medium">
                실시간 채팅 알림 · <span className="text-gold-700 font-bold">{activeSound.icon} {activeSound.name}</span>
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDismiss();
            }}
            className="w-6 h-6 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 text-xs font-bold transition cursor-pointer"
            aria-label="알림 닫기"
          >
            ✕
          </button>
        </div>

        {/* Message Bubble Body */}
        <div className="bg-gray-50/90 rounded-xl p-2.5 border border-gray-100 mb-2.5">
          <p className="text-xs sm:text-[13px] text-gray-800 line-clamp-2 leading-relaxed font-medium">
            &ldquo;{message.text}&rdquo;
          </p>
        </div>

        {/* Action Bar */}
        <div className="flex items-center justify-between text-xs pt-1">
          <div className="flex items-center gap-1 text-[11px] text-gold-700 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span>탭하여 바로 답장하기</span>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenChat();
            }}
            className="px-3 py-1 bg-deepgreen hover:bg-teal-900 text-white text-xs font-bold rounded-lg shadow-xs transition active:scale-95 cursor-pointer"
          >
            채팅창 열기 {unreadCount > 1 && `(${unreadCount})`}
          </button>
        </div>

        {/* Progress Bar Timer */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100">
          <div 
            className="h-full bg-gradient-to-r from-gold-400 to-deepgreen transition-all duration-75"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default ChatNotificationToast;
