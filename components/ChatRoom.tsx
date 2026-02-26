
import React, { useState, useEffect, useRef } from 'react';
import { User, ChatMessage } from '../types';

interface Props {
  user: User | null;
  onReqLogin: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const ChatRoom: React.FC<Props> = ({ user, onReqLogin, isOpen, onClose }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Key for localStorage
  const CHAT_STORAGE_KEY = 'mango_tour_public_chat_v1';

  // Load messages from localStorage on mount and when storage updates (sync tabs)
  useEffect(() => {
    const loadMessages = () => {
      const saved = localStorage.getItem(CHAT_STORAGE_KEY);
      if (saved) {
        setMessages(JSON.parse(saved));
      }
    };

    loadMessages();

    // Listen for storage events to sync across tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === CHAT_STORAGE_KEY) {
        loadMessages();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSend = () => {
    if (!input.trim() || !user) return;
    
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: user.nickname || user.username,
      text: input,
      timestamp: Date.now()
    };

    const updatedMessages = [...messages, newMessage];
    
    // Update State
    setMessages(updatedMessages);
    
    // Save to LocalStorage (Simulate Backend)
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(updatedMessages));
    
    setInput('');
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => {}} // Controlled by BottomNav now, but we'll keep a desktop floating button if needed
        className="fixed bottom-6 right-6 bg-gold-500 text-white p-4 rounded-full shadow-lg hover:bg-gold-600 transition z-50 hidden md:flex items-center gap-2 group"
        style={{ display: 'none' }} // Hide floating button as it's moved to BottomNav
      >
        <span className="text-2xl group-hover:scale-110 transition">💬</span>
        <span className="font-bold">채팅방</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 w-[calc(100%-2rem)] md:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 z-[10000] flex flex-col overflow-hidden max-h-[60vh] md:max-h-[600px] animate-fade-in-up">
      {/* Header */}
      <div className="bg-deepgreen p-4 flex justify-between items-center text-white shadow-md">
        <div>
           <h3 className="font-bold flex items-center gap-2">
             <span>🌏</span> MANGO TOUR 채팅방
           </h3>
           <p className="text-[10px] opacity-80 font-light">여행자들과 자유롭게 소통하세요</p>
        </div>
        <button onClick={onClose} className="hover:text-gold-400 transition text-lg font-bold">✕</button>
      </div>

      {/* Message Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-[#f2f7f7] min-h-[300px]" ref={scrollRef}>
        {!user ? (
          <div className="h-full flex flex-col items-center justify-center text-center space-y-4">
             <div className="text-4xl animate-bounce">🔒</div>
             <p className="text-gray-600 text-sm">
               채팅방은 회원만 이용 가능합니다.<br/>
               로그인 후 다른 여행자들과 대화해보세요.
             </p>
             <button 
               onClick={onReqLogin}
               className="bg-gold-500 text-white px-6 py-2 rounded-full text-xs font-bold hover:bg-gold-600 shadow-md transition"
             >
               로그인 하러가기
             </button>
          </div>
        ) : (
          <>
            <div className="text-center text-gray-400 my-4 text-xs bg-white/50 py-1 rounded-full mx-10">
               운영 정책을 위반하는 메시지는<br/>삭제될 수 있습니다.
            </div>
            
            {messages.map(msg => {
              const isMe = msg.sender === (user.nickname || user.username);
              const isAdmin = msg.sender === '관리자' || msg.sender === 'admin';
              
              return (
                <div key={msg.id} className={`mb-3 flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  {!isMe && (
                    <span className={`text-[10px] mb-1 ml-1 font-bold ${isAdmin ? 'text-deepgreen' : 'text-gray-600'}`}>
                      {isAdmin && '👑'} {msg.sender}
                    </span>
                  )}
                  <div className={`max-w-[85%] relative px-3 py-2 rounded-lg text-sm shadow-sm break-words ${
                    isMe 
                      ? 'bg-gold-500 text-white rounded-tr-none' 
                      : isAdmin 
                        ? 'bg-deepgreen text-white rounded-tl-none'
                        : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none'
                  }`}>
                    {msg.text}
                  </div>
                  <span className="text-[9px] text-gray-400 mt-0.5 mx-1">
                    {formatTime(msg.timestamp)}
                  </span>
                </div>
              );
            })}
          </>
        )}
      </div>

      {/* Input Area */}
      {user && (
        <div className="p-3 bg-white border-t border-gray-200">
          <div className="flex gap-2">
            <input
              className="flex-1 bg-gray-100 border-0 rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-gold-500 outline-none"
              placeholder="메시지를 입력하세요..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyPress={e => e.key === 'Enter' && handleSend()}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              className="bg-deepgreen text-white w-10 h-10 rounded-full flex items-center justify-center hover:bg-opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatRoom;
