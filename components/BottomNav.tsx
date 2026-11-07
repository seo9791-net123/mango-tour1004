
import React from 'react';

interface Props {
  currentPage: string;
  selectedCategory: string | null;
  onNavigate: (page: string, category?: string) => void;
  isChatOpen: boolean;
  setIsChatOpen: (open: boolean) => void;
  onBack?: () => void;
  unreadChatCount?: number;
}

const BottomNav: React.FC<Props> = ({ 
  currentPage, 
  selectedCategory, 
  onNavigate, 
  isChatOpen, 
  setIsChatOpen, 
  onBack,
  unreadChatCount = 0
}) => {
  const navItems = [
    { id: 'home', label: '홈', icon: '🏠' },
    { id: 'event', label: '이벤트', icon: '🎁', category: '이벤트' },
    { id: 'community', label: '게시판', icon: '📋', category: '커뮤니티' },
    { id: 'chat', label: '채팅방', icon: '💬' },
    { id: 'back', label: '뒤로가기', icon: '◀️' },
  ];

  const handleItemClick = (item: typeof navItems[0]) => {
    if (item.id === 'back') {
      if (onBack) {
        onBack();
      } else if (isChatOpen) {
        setIsChatOpen(false);
      } else if (currentPage !== 'home') {
        onNavigate('home');
      } else if (typeof window !== 'undefined' && window.history.length > 1) {
        window.history.back();
      }
    } else if (item.id === 'chat') {
      setIsChatOpen(!isChatOpen);
    } else if (item.id === 'home') {
      onNavigate('home');
      setIsChatOpen(false);
    } else {
      onNavigate('category', item.category);
      setIsChatOpen(false);
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-gray-200/80 z-[100] md:hidden no-print shadow-[0_-4px_20px_rgba(0,0,0,0.06)]" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="flex justify-around items-center h-14 xs:h-16 max-w-lg mx-auto px-1 sm:px-2">
        {navItems.map((item) => {
          const isActive = item.id === 'chat' 
            ? isChatOpen 
            : (item.id === 'home' 
                ? currentPage === 'home' && !isChatOpen
                : (item.id === 'back'
                    ? false
                    : currentPage === 'category' && selectedCategory === item.category && !isChatOpen));
          
          return (
            <button
              key={item.id}
              onClick={() => handleItemClick(item)}
              className={`relative flex flex-col items-center justify-center flex-1 h-full py-1 transition-all duration-200 active:scale-90 cursor-pointer ${
                isActive ? 'text-deepgreen' : 'text-gray-400 hover:text-gray-600'
              }`}
              aria-label={item.label}
            >
              <span className={`relative text-lg xs:text-xl sm:text-2xl transition-transform duration-200 ${isActive ? 'scale-110 -translate-y-0.5' : 'opacity-75'}`}>
                {item.icon}
                {item.id === 'chat' && unreadChatCount > 0 && !isChatOpen && (
                  <span className="absolute -top-1.5 -right-2.5 bg-red-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full min-w-4 text-center shadow-md animate-bounce ring-2 ring-white">
                    {unreadChatCount > 9 ? '9+' : unreadChatCount}
                  </span>
                )}
              </span>
              <span className={`text-[10px] xs:text-[11px] font-bold mt-0.5 tracking-tight ${isActive ? 'text-deepgreen font-extrabold' : 'text-gray-500'}`}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute top-1 w-6 h-0.5 bg-gold-500 rounded-full"></div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;

