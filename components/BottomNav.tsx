
import React from 'react';

interface Props {
  currentPage: string;
  selectedCategory: string | null;
  onNavigate: (page: string, category?: string) => void;
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
}

const BottomNav: React.FC<Props> = ({ currentPage, selectedCategory, onNavigate, isChatOpen, setIsChatOpen }) => {
  const navItems = [
    { id: 'home', label: '홈', icon: '🏠' },
    { id: 'event', label: '이벤트', icon: '🎁', category: '이벤트' },
    { id: 'community', label: '게시판', icon: '📋', category: '커뮤니티' },
    { id: 'chat', label: '채팅방', icon: '💬' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-[100] md:hidden">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const isActive = item.id === 'chat' 
            ? isChatOpen 
            : (item.id === 'home' ? currentPage === 'home' : (currentPage === 'category' && selectedCategory === item.category));
          
          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.id === 'chat') {
                  setIsChatOpen(!isChatOpen);
                } else if (item.id === 'home') {
                  onNavigate('home');
                  setIsChatOpen(false);
                } else {
                  onNavigate('category', item.category);
                  setIsChatOpen(false);
                }
              }}
              className={`flex flex-col items-center justify-center w-full h-full transition-all ${
                isActive ? 'text-gold-600' : 'text-gray-400'
              }`}
            >
              <span className={`text-xl ${isActive ? 'scale-110' : ''} transition-transform`}>
                {item.icon}
              </span>
              <span className="text-[10px] font-bold mt-1">{item.label}</span>
              {isActive && (
                <div className="absolute bottom-1 w-1 h-1 bg-gold-600 rounded-full"></div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;
