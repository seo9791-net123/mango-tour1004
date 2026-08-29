
import React, { useState, useEffect, useRef } from 'react';
import { User, ChatMessage } from '../types';
import { db } from '../services/firebaseConfig';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';

interface Props {
  user: User | null;
  onReqLogin: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const ChatRoom: React.FC<Props> = ({ user, onReqLogin, isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Key for localStorage fallback
  const CHAT_STORAGE_KEY = 'mango_tour_public_chat_v1';

  // 1. Initial load from localStorage for instant display
  useEffect(() => {
    try {
      const saved = localStorage.getItem(CHAT_STORAGE_KEY);
      if (saved) {
        setMessages(JSON.parse(saved));
      }
    } catch (e) {
      console.warn("Failed to load local chat messages:", e);
    }
  }, []);

  // 2. Firestore Real-time Listener (Cross-device / Cross-tab sync)
  useEffect(() => {
    if (!isOpen) return;

    if (db) {
      try {
        const q = query(
          collection(db, 'chat_messages'),
          orderBy('timestamp', 'asc'),
          limit(150)
        );

        const unsubscribe = onSnapshot(
          q, 
          (snapshot) => {
            if (!snapshot.empty) {
              const cloudMsgs: ChatMessage[] = [];
              snapshot.forEach((docSnap) => {
                const data = docSnap.data();
                cloudMsgs.push({
                  id: docSnap.id,
                  sender: data.sender || '여행자',
                  text: data.text || '',
                  timestamp: typeof data.timestamp === 'number' ? data.timestamp : Date.now()
                });
              });
              setMessages(cloudMsgs);
              try {
                localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(cloudMsgs));
              } catch (e) {
                // Ignore storage quota
              }
            }
          },
          (err) => {
            console.warn("Firestore chat listener warning (using local mode):", err);
          }
        );

        return () => unsubscribe();
      } catch (e) {
        console.warn("Firestore chat subscription failed:", e);
      }
    }

    // Tab-sync fallback via storage event if Firestore is offline
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === CHAT_STORAGE_KEY && e.newValue) {
        try {
          setMessages(JSON.parse(e.newValue));
        } catch (err) {
          // ignore
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [isOpen]);

  // Auto-scroll to bottom on new messages or open
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || !user || isSending) return;
    
    const textToSend = input.trim();
    setInput('');
    setIsSending(true);

    const now = Date.now();
    const senderName = user.nickname || user.username || '여행자';

    const newMessage: ChatMessage = {
      id: now.toString(),
      sender: senderName,
      text: textToSend,
      timestamp: now
    };

    // Optimistic UI update
    const updated = [...messages, newMessage];
    setMessages(updated);
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(updated));
    } catch (e) {
      // ignore
    }

    // Save to Firestore if available
    if (db && navigator.onLine) {
      try {
        await addDoc(collection(db, 'chat_messages'), {
          sender: senderName,
          text: textToSend,
          timestamp: now,
          createdAt: serverTimestamp()
        });
      } catch (err) {
        console.warn("Failed to write chat to Firestore, message stored locally:", err);
      }
    }

    setIsSending(false);
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 md:inset-auto md:bottom-6 md:right-6 md:w-[400px] md:h-[620px] md:max-h-[85vh] bg-[#f2f6f6] z-[10000] flex flex-col overflow-hidden md:rounded-3xl md:shadow-2xl md:border md:border-gray-200/90 animate-fade-in no-print"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {/* Header */}
      <div className="bg-deepgreen text-white px-4 py-3.5 flex justify-between items-center shadow-md flex-shrink-0 z-10">
        <div className="flex items-center gap-3">
          {/* Mobile Back Button */}
          <button 
            type="button"
            onClick={onClose} 
            className="md:hidden p-1.5 -ml-1 text-white/80 hover:text-white active:scale-95 transition rounded-full hover:bg-white/10"
            aria-label="뒤로가기"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg">🌏</span>
              <h3 className="font-bold text-base md:text-sm tracking-tight">MANGO TOUR 실시간 채팅</h3>
              <span className="flex items-center gap-1 text-[10px] bg-emerald-400/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold border border-emerald-400/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                LIVE
              </span>
            </div>
            <p className="text-[11px] text-emerald-100/70 font-light mt-0.5">베트남 여행자들과 자유롭게 소통하세요</p>
          </div>
        </div>

        {/* Desktop / Global Close Button */}
        <button 
          type="button"
          onClick={onClose} 
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 active:scale-90 text-white/80 hover:text-white transition font-bold text-xl"
          aria-label="채팅방 닫기"
        >
          ✕
        </button>
      </div>

      {/* Message Area */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#eef4f4]" 
        ref={scrollRef}
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
               className="bg-gold-500 hover:bg-gold-600 text-white px-8 py-3 rounded-full text-sm font-bold shadow-lg shadow-gold-500/20 transition transform active:scale-95"
             >
               로그인 / 회원가입
             </button>
          </div>
        ) : (
          <>
            <div className="text-center my-2">
              <div className="inline-block text-[11px] text-gray-500 bg-white/80 backdrop-blur-xs px-4 py-1.5 rounded-full border border-gray-200 shadow-xs">
                🛡️ 운영 정책에 위반되는 비매너 및 광고 메시지는 제재될 수 있습니다.
              </div>
            </div>
            
            {messages.length === 0 ? (
              <div className="h-48 flex flex-col items-center justify-center text-gray-400 text-xs space-y-1">
                <span className="text-2xl">💬</span>
                <p>아직 등록된 메시지가 없습니다.</p>
                <p className="text-[11px] text-gray-400">첫 번째 메시지를 남겨보세요!</p>
              </div>
            ) : (
              messages.map(msg => {
                const isMe = msg.sender === (user.nickname || user.username);
                const isAdmin = msg.sender === '관리자' || msg.sender === 'admin';
                
                return (
                  <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                    {!isMe && (
                      <div className="flex items-center gap-1.5 mb-1 ml-1">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white ${isAdmin ? 'bg-deepgreen' : 'bg-gray-400'}`}>
                          {isAdmin ? '👑' : (msg.sender ? msg.sender.slice(0, 1) : 'U')}
                        </span>
                        <span className={`text-[11px] font-bold ${isAdmin ? 'text-deepgreen' : 'text-gray-700'}`}>
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
                            ? 'bg-deepgreen text-white rounded-tl-xs'
                            : 'bg-white text-gray-800 border border-gray-200/90 rounded-tl-xs'
                      }`}>
                        {msg.text}
                      </div>
                      <span className="text-[9px] text-gray-400 flex-shrink-0 select-none pb-0.5">
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </>
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
              className="bg-deepgreen text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-gold-600 active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed shadow-sm flex-shrink-0"
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
  );
};

export default ChatRoom;
