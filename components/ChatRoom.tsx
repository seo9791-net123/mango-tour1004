import React, { useState, useEffect, useRef } from 'react';
import { User, ChatMessage } from '../types';
import { supabaseService } from '../services/supabaseService';
import { 
  playChatNotificationSound, 
  playChatSendSound, 
  isChatSoundEnabled, 
  setChatSoundEnabled, 
  getChatSoundTheme,
  CHAT_SOUND_THEMES,
  ChatSoundTheme,
  showBrowserChatNotification 
} from '../utils/chatNotificationUtils';
import ChatSoundSelectorModal from './ChatSoundSelectorModal';

interface Props {
  user: User | null;
  onReqLogin: () => void;
  isOpen: boolean;
  onClose: () => void;
  onNewIncomingMessage?: (msg: ChatMessage) => void;
  onResetUnread?: () => void;
}

const ChatRoom: React.FC<Props> = ({ 
  user, 
  onReqLogin, 
  isOpen, 
  onClose,
  onNewIncomingMessage,
  onResetUnread
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(isChatSoundEnabled);
  const [soundTheme, setSoundTheme] = useState<ChatSoundTheme>(getChatSoundTheme);
  const [showSoundModal, setShowSoundModal] = useState(false);
  const [hasNewMessageBelow, setHasNewMessageBelow] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const isInitialLoadRef = useRef(true);
  const knownIdsRef = useRef<Set<string>>(new Set());
  
  // Key for localStorage fallback
  const CHAT_STORAGE_KEY = 'mango_tour_public_chat_v1';

  // Current user's display identifier
  const currentUsername = user?.nickname || user?.username || '';

  // 1. Initial load from localStorage for instant display
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CHAT_STORAGE_KEY);
      if (saved) {
        const parsed: ChatMessage[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setMessages(parsed);
          parsed.forEach(m => {
            if (m.id) knownIdsRef.current.add(m.id);
          });
        }
      }
    } catch (e) {
      console.warn("Failed to load local chat messages:", e);
    }
  }, []);

  // 2. Global Real-time Listener (Continuously active in background for instant notifications)
  useEffect(() => {
    const unsubscribe = supabaseService.subscribeChat(
      (cloudMsgs) => {
        if (cloudMsgs && cloudMsgs.length > 0) {
          cloudMsgs.forEach(m => knownIdsRef.current.add(m.id));
          setMessages(cloudMsgs);
          try {
            localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(cloudMsgs));
          } catch {
            // Ignore storage quota
          }
        }
        isInitialLoadRef.current = false;
      },
      (newMsg) => {
        if (!knownIdsRef.current.has(newMsg.id)) {
          knownIdsRef.current.add(newMsg.id);
          setMessages(prev => {
            const next = [...prev, newMsg];
            try {
              localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(next));
            } catch {
              // ignore
            }
            return next;
          });

          const isFromMe = newMsg.sender === (user?.nickname || user?.username);
          if (!isFromMe) {
            playChatNotificationSound(isOpen ? 0.2 : 0.35);

            if (onNewIncomingMessage) {
              onNewIncomingMessage(newMsg);
            }

            if (document.hidden) {
              showBrowserChatNotification(newMsg.sender, newMsg.text, () => {
                window.focus();
              });
            }

            if (isOpen && scrollRef.current) {
              const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
              const isNearBottom = scrollHeight - scrollTop - clientHeight < 120;
              if (!isNearBottom) {
                setHasNewMessageBelow(true);
              }
            }
          }
        }
      }
    );

    // Tab-sync fallback via storage event if Firestore is offline
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === CHAT_STORAGE_KEY && e.newValue) {
        try {
          const parsed: ChatMessage[] = JSON.parse(e.newValue);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const latest = parsed[parsed.length - 1];
            if (latest && !knownIdsRef.current.has(latest.id)) {
              knownIdsRef.current.add(latest.id);
              setMessages(parsed);

              const isFromMe = latest.sender === (user?.nickname || user?.username);
              if (!isFromMe) {
                playChatNotificationSound(0.3);
                if (onNewIncomingMessage) onNewIncomingMessage(latest);
              }
            }
          }
        } catch {
          // ignore
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [user, isOpen, onNewIncomingMessage]);

  // Reset unread count & auto-scroll when chat is opened
  useEffect(() => {
    if (isOpen) {
      if (onResetUnread) onResetUnread();
      setHasNewMessageBelow(false);
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 80);
    }
  }, [isOpen, onResetUnread]);

  // Auto-scroll on messages change if already near bottom
  useEffect(() => {
    if (isOpen && scrollRef.current && !hasNewMessageBelow) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen, hasNewMessageBelow]);

  const handleSend = async () => {
    if (!input.trim() || !user || isSending) return;
    
    const textToSend = input.trim();
    setInput('');
    setIsSending(true);

    const now = Date.now();
    const senderName = user.nickname || user.username || '여행자';

    const newMessage: ChatMessage = {
      id: `local-${now}`,
      sender: senderName,
      text: textToSend,
      timestamp: now
    };

    knownIdsRef.current.add(newMessage.id);

    // Play subtle send feedback sound
    playChatSendSound();

    // Optimistic UI update
    const updated = [...messages, newMessage];
    setMessages(updated);
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }

    // Scroll to bottom
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    }, 50);

    // Save to Supabase (with automatic local fallback)
    try {
      const savedMsg = await supabaseService.sendChatMessage({
        sender: senderName,
        text: textToSend
      });
      if (savedMsg?.id) {
        knownIdsRef.current.add(savedMsg.id);
      }
    } catch (err) {
      console.warn("Failed to write chat to Supabase, message stored locally:", err);
    }

    setIsSending(false);
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    setChatSoundEnabled(next);
    if (next) {
      playChatNotificationSound(0.2);
    }
  };

  const scrollToBottom = () => {
    setHasNewMessageBelow(false);
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  };

  // If chat is closed, keep hooks active but do not render modal markup
  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Desktop: Floating Back button positioned directly beside the chat window */}
      <div className="hidden md:block fixed bottom-6 right-[420px] z-[10001] animate-fade-in no-print">
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-2 px-4 py-3 bg-white text-gray-800 hover:text-deepgreen rounded-2xl shadow-2xl border border-gray-200 font-bold text-xs transition-all duration-200 active:scale-95 hover:shadow-xl hover:-translate-x-1 group cursor-pointer"
          title="채팅창 닫고 뒤로 가기"
        >
          <div className="w-6 h-6 rounded-lg bg-gray-100 group-hover:bg-deepgreen group-hover:text-white flex items-center justify-center transition">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </div>
          <span className="font-bold">뒤로 가기</span>
        </button>
      </div>

      <div 
        className="fixed inset-0 md:inset-auto md:bottom-6 md:right-6 md:w-[400px] md:h-[620px] md:max-h-[85vh] bg-[#f2f6f6] z-[10000] flex flex-col overflow-hidden md:rounded-3xl md:shadow-2xl md:border md:border-gray-200/90 animate-fade-in no-print"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {/* Header */}
        <div className="bg-deepgreen text-white px-2.5 sm:px-4 py-2.5 sm:py-3 flex justify-between items-center shadow-md shrink-0 z-10 gap-1">
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 min-w-0">
            {/* Prominent Back Button */}
            <button 
              type="button"
              onClick={onClose} 
              className="flex items-center gap-1 px-2 py-1.5 text-white hover:bg-white/20 active:scale-95 transition rounded-xl bg-white/15 text-xs font-bold border border-white/20 shadow-xs cursor-pointer shrink-0 whitespace-nowrap"
              aria-label="뒤로 가기"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="whitespace-nowrap">뒤로</span>
            </button>
            
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-base sm:text-lg">🌏</span>
              <h3 className="font-bold text-xs sm:text-sm tracking-tight whitespace-nowrap">실시간 채팅</h3>
              <span className="flex items-center gap-1 text-[9px] sm:text-[10px] bg-emerald-400/20 text-emerald-300 px-1.5 py-0.5 rounded-full font-bold border border-emerald-400/30 shrink-0 whitespace-nowrap">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                LIVE
              </span>
            </div>
          </div>

          {/* Header Controls: Sound Selector, Mute Toggle, and Close */}
          <div className="flex items-center gap-1 shrink-0 whitespace-nowrap">
            {/* 10 Sound Themes Selector Button */}
            <button
              type="button"
              onClick={() => setShowSoundModal(true)}
              className="px-2 py-1 rounded-xl text-xs font-bold flex items-center gap-1 bg-white/20 hover:bg-white/30 text-white transition cursor-pointer shadow-2xs border border-white/20 active:scale-95 shrink-0 whitespace-nowrap"
              title="10가지 알림음 선택 및 볼륨 설정"
            >
              <span className="text-xs">🎵</span>
              <span className="text-[10px] font-bold whitespace-nowrap">알림음</span>
            </button>

            {/* Sound Mute/Unmute Toggle */}
            <button
              type="button"
              onClick={handleToggleSound}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl text-xs font-bold flex items-center justify-center transition cursor-pointer shrink-0 ${
                soundEnabled 
                  ? 'bg-white/20 text-white hover:bg-white/30' 
                  : 'bg-red-500/80 text-white hover:bg-red-500'
              }`}
              title={soundEnabled ? '알림음 켜짐 (클릭 시 무음)' : '알림음 꺼짐 (클릭 시 켜기)'}
              aria-label={soundEnabled ? '소리 켜짐' : '무음'}
            >
              <span className="text-sm">{soundEnabled ? '🔔' : '🔕'}</span>
            </button>

            {/* Desktop / Global Close Button */}
            <button 
              type="button"
              onClick={onClose} 
              className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center rounded-full hover:bg-white/15 active:scale-90 text-white/80 hover:text-white transition font-bold text-base sm:text-lg cursor-pointer shrink-0 ml-0.5"
              aria-label="채팅방 닫기"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Message Area */}
        <div 
          className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#eef4f4] relative" 
          ref={scrollRef}
          onScroll={() => {
            if (scrollRef.current) {
              const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
              const isNearBottom = scrollHeight - scrollTop - clientHeight < 80;
              if (isNearBottom && hasNewMessageBelow) {
                setHasNewMessageBelow(false);
              }
            }
          }}
        >
          {!user ? (
            <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-6 space-y-4">
               <div className="w-16 h-16 rounded-full bg-white shadow-sm flex items-center justify-center text-3xl">
                 🔒
               </div>
               <div className="space-y-1 max-w-xs">
                 <h4 className="font-bold text-gray-800 text-base">로그인이 필요한 서비스입니다</h4>
                 <p className="text-gray-500 text-xs leading-relaxed">
                   채팅방은 회원 전용 공간입니다.<br/>
                   간편 로그인 후 다른 여행자들과 대화를 나눠보세요.
                 </p>
               </div>
               <button 
                 type="button"
                 onClick={onReqLogin}
                 className="bg-gold-500 hover:bg-gold-600 text-white px-8 py-3 rounded-full text-sm font-bold shadow-lg shadow-gold-500/20 transition transform active:scale-95 cursor-pointer"
               >
                 로그인 / 회원가입
               </button>
            </div>
          ) : (
            <>
              <div className="text-center my-1">
                <div className="inline-flex items-center gap-1.5 text-[11px] text-gray-700 bg-white/95 backdrop-blur-xs px-3.5 py-1.5 rounded-full border border-gray-200 shadow-2xs">
                  <span>🔔</span>
                  <span>알림음: <strong className="text-deepgreen font-bold">{CHAT_SOUND_THEMES.find(t => t.id === soundTheme)?.name}</strong></span>
                  <button
                    type="button"
                    onClick={() => setShowSoundModal(true)}
                    className="ml-1 text-gold-600 hover:text-gold-700 font-extrabold underline cursor-pointer"
                  >
                    소리 변경(10가지)
                  </button>
                </div>
              </div>
              
              {messages.length === 0 ? (
                <div className="h-48 flex flex-col items-center justify-center text-gray-400 text-xs space-y-1">
                  <span className="text-3xl">💬</span>
                  <p className="font-bold text-gray-600">아직 등록된 메시지가 없습니다.</p>
                  <p className="text-[11px] text-gray-400">첫 번째 메시지를 남겨보세요!</p>
                </div>
              ) : (
                messages.map(msg => {
                  const isMe = msg.sender === currentUsername;
                  const isAdmin = msg.sender === '관리자' || msg.sender === 'admin';
                  
                  return (
                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-fade-in`}>
                      {!isMe && (
                        <div className="flex items-center gap-1.5 mb-1 ml-1">
                          <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-2xs ${
                            isAdmin ? 'bg-gradient-to-tr from-amber-600 to-gold-500' : 'bg-gray-500'
                          }`}>
                            {isAdmin ? '👑' : (msg.sender ? msg.sender.slice(0, 1) : 'U')}
                          </span>
                          <span className={`text-[11px] font-bold ${isAdmin ? 'text-amber-700' : 'text-gray-700'}`}>
                            {isAdmin && '[관리자] '}
                            {msg.sender}
                          </span>
                        </div>
                      )}

                      <div className={`flex items-end gap-1.5 max-w-[85%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div className={`relative px-3.5 py-2.5 rounded-2xl text-[13px] sm:text-sm shadow-xs break-words leading-relaxed ${
                          isMe 
                            ? 'bg-gold-500 text-white rounded-tr-xs font-medium' 
                            : isAdmin 
                              ? 'bg-deepgreen text-white rounded-tl-xs font-medium'
                              : 'bg-white text-gray-800 border border-gray-200/90 rounded-tl-xs'
                        }`}>
                          {msg.text}
                        </div>
                        <span className="text-[9px] text-gray-400 flex-shrink-0 select-none pb-0.5 font-mono">
                          {formatTime(msg.timestamp)}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </>
          )}

          {/* Floating Pill when new message arrived below */}
          {hasNewMessageBelow && (
            <div className="sticky bottom-2 left-0 right-0 flex justify-center z-20">
              <button
                type="button"
                onClick={scrollToBottom}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-deepgreen text-white rounded-full shadow-lg text-xs font-bold hover:bg-teal-900 transition active:scale-95 animate-bounce cursor-pointer border border-white/30"
              >
                <span>새 메시지 도착</span>
                <span className="text-sm">↓</span>
              </button>
            </div>
          )}
        </div>

        {/* Input Area */}
        {user && (
          <div 
            className="p-3 bg-white border-t border-gray-200/80 shadow-[0_-2px_10px_rgba(0,0,0,0.03)] flex-shrink-0"
            style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 0.75rem)' }}
          >
            <form 
              onSubmit={(e) => { e.preventDefault(); handleSend(); }} 
              className="flex items-center gap-2"
            >
              <input
                type="text"
                className="flex-1 bg-gray-100/90 hover:bg-gray-100 border border-gray-200/80 rounded-full px-4 py-2.5 text-sm focus:bg-white focus:ring-2 focus:ring-deepgreen focus:border-transparent outline-none transition"
                placeholder="메시지를 입력하세요..."
                value={input}
                onChange={e => setInput(e.target.value)}
                maxLength={300}
              />
              <button
                type="submit"
                disabled={!input.trim() || isSending}
                className="bg-deepgreen text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-gold-600 active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed shadow-sm flex-shrink-0 cursor-pointer"
                aria-label="전송"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transform rotate-90 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </form>
          </div>
        )}
      </div>

      {/* 10 Notification Sound Themes Selector Modal */}
      <ChatSoundSelectorModal 
        isOpen={showSoundModal} 
        onClose={() => setShowSoundModal(false)}
        onThemeChanged={(theme) => setSoundTheme(theme)}
      />
    </>
  );
};

export default ChatRoom;
