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

const TabIcon: React.FC<{ id: string; active: boolean }> = ({ id, active }) => {
  const strokeWidth = active ? 2.1 : 1.75;
  switch (id) {
    case 'home':
      return (
        <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 10.5L12 3l9 7.5V20a1.5 1.5 0 0 1-1.5 1.5h-5V15h-5v6.5h-5A1.5 1.5 0 0 1 3 20v-9.5z" />
        </svg>
      );
    case 'event':
      return (
        <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="8" width="18" height="4" rx="1" />
          <path d="M12 8v13" />
          <path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" />
          <path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5" />
        </svg>
      );
    case 'community':
      return (
        <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="4" width="16" height="16" rx="3" />
          <path d="M8 9h8M8 13h8M8 17h5" />
        </svg>
      );
    case 'chat':
      return (
        <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
      );
    case 'back':
    default:
      return (
        <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      );
  }
};

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
    { id: 'home', label: '홈' },
    { id: 'event', label: '이벤트', category: '이벤트' },
    { id: 'community', label: '게시판', category: '커뮤니티' },
    { id: 'chat', label: '채팅방' },
    { id: 'back', label: '뒤로가기' },
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
    <div
      className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-black/[0.06] z-[100] md:hidden no-print"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex justify-around items-center h-14 max-w-lg mx-auto px-1.5">
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
              type="button"
              onClick={() => handleItemClick(item)}
              className={`relative flex flex-col items-center justify-center flex-1 h-full py-1 transition-all duration-200 active:scale-90 cursor-pointer ${
                isActive ? 'text-[#0A7E54]' : 'text-[#8E8E93] hover:text-[#3A3A3C]'
              }`}
              aria-label={item.label}
            >
              <span className="relative flex items-center justify-center">
                <TabIcon id={item.id} active={isActive} />
                {item.id === 'chat' && unreadChatCount > 0 && !isChatOpen && (
                  <span className="absolute -top-1.5 -right-2.5 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full min-w-4 text-center shadow-sm ring-2 ring-white tabular-nums">
                    {unreadChatCount > 9 ? '9+' : unreadChatCount}
                  </span>
                )}
              </span>
              <span className={`text-[10px] mt-1 tracking-tight leading-none ${isActive ? 'text-[#0A7E54] font-bold' : 'text-[#8E8E93] font-medium'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;
