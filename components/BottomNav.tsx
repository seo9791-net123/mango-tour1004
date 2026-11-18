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
  switch (id) {
    case 'home':
      return active ? (
        <svg className="w-[25px] h-[25px]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M11.35 2.75a1 1 0 0 1 1.3 0l8.25 7.07a1 1 0 0 1 .35.76V19.5A2.5 2.5 0 0 1 18.75 22h-3.5a1 1 0 0 1-1-1v-4.75a2.25 2.25 0 0 0-4.5 0V21a1 1 0 0 1-1 1h-3.5A2.5 2.5 0 0 1 2.75 19.5v-8.92a1 1 0 0 1 .35-.76l8.25-7.07Z" />
        </svg>
      ) : (
        <svg className="w-[25px] h-[25px]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M3.5 10.6 12 3.2l8.5 7.4V19.5a2 2 0 0 1-2 2h-4v-5.25a2.5 2.5 0 0 0-5 0v5.25h-4a2 2 0 0 1-2-2v-8.9Z"
            fill="currentColor"
            fillOpacity="0.16"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    case 'recommended':
      return active ? (
        <svg className="w-[25px] h-[25px]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 2.4c.58 0 1.12.33 1.38.86l2.14 4.34 4.79.7c.58.08 1.07.49 1.25 1.05.18.56.03 1.17-.39 1.58l-3.47 3.38.82 4.77c.1.58-.14 1.17-.62 1.52-.48.35-1.11.4-1.63.12L12 18.47l-4.28 2.25c-.52.27-1.15.23-1.63-.12-.48-.35-.72-.94-.62-1.52l.82-4.77-3.47-3.38a1.54 1.54 0 0 1-.39-1.58c.18-.56.67-.97 1.25-1.05l4.79-.7 2.14-4.34A1.54 1.54 0 0 1 12 2.4Z" />
        </svg>
      ) : (
        <svg className="w-[25px] h-[25px]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="m12 3.2 2.45 4.96 5.47.8-3.96 3.86.94 5.45L12 15.7l-4.9 2.57.94-5.45-3.96-3.86 5.47-.8L12 3.2Z"
            fill="currentColor"
            fillOpacity="0.16"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      );

    case 'custom':
      return (
        <svg className="w-[26px] h-[26px] text-white" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M21.43 2.57a1.25 1.25 0 0 0-1.26-.31L3.02 7.82a1.25 1.25 0 0 0-.14 2.34l6.26 2.75 2.75 6.26a1.25 1.25 0 0 0 1.14.74h.07a1.25 1.25 0 0 0 1.13-.87l5.55-17.15a1.25 1.25 0 0 0-.35-1.32Z" />
          <circle cx="6.2" cy="17.8" r="1.4" fill="white" fillOpacity="0.85" />
          <circle cx="9.2" cy="19.5" r="0.9" fill="white" fillOpacity="0.65" />
        </svg>
      );

    case 'chat':
      return active ? (
        <svg className="w-[25px] h-[25px]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 3C6.75 3 2.5 6.72 2.5 11.3c0 2.13.92 4.07 2.43 5.53-.15 1.38-.68 2.83-1.48 3.92a.75.75 0 0 0 .74 1.18c1.92-.34 3.63-1.15 4.91-2.06.92.22 1.89.33 2.9.33 5.25 0 9.5-3.72 9.5-8.3S17.25 3 12 3Zm-3.6 9.45a1.15 1.15 0 1 1 0-2.3 1.15 1.15 0 0 1 0 2.3Zm3.6 0a1.15 1.15 0 1 1 0-2.3 1.15 1.15 0 0 1 0 2.3Zm3.6 0a1.15 1.15 0 1 1 0-2.3 1.15 1.15 0 0 1 0 2.3Z" />
        </svg>
      ) : (
        <svg className="w-[25px] h-[25px]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path
            d="M12 3.5c-4.97 0-9 3.45-9 7.7 0 2 .9 3.82 2.37 5.18-.18 1.25-.67 2.45-1.37 3.42 1.68-.28 3.22-.94 4.38-1.78 1.12.31 2.34.48 3.62.48 4.97 0 9-3.45 9-7.7S16.97 3.5 12 3.5Z"
            fill="currentColor"
            fillOpacity="0.16"
            stroke="currentColor"
            strokeWidth="2.1"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="8.5" cy="11.2" r="1.15" fill="currentColor" />
          <circle cx="12" cy="11.2" r="1.15" fill="currentColor" />
          <circle cx="15.5" cy="11.2" r="1.15" fill="currentColor" />
        </svg>
      );

    case 'back':
    default:
      return (
        <svg className="w-[25px] h-[25px]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle
            cx="12"
            cy="12"
            r="9"
            fill="currentColor"
            fillOpacity="0.14"
            stroke="currentColor"
            strokeWidth="2.05"
          />
          <path
            d="M14.75 12H9.25m0 0 2.9-2.9M9.25 12l2.9 2.9"
            stroke="currentColor"
            strokeWidth="2.15"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
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
    { id: 'recommended', label: '추천상품', category: '추천 상품' },
    { id: 'custom', label: '나만의 여행', category: '여행 만들기', isCenter: true },
    { id: 'chat', label: '채팅방' },
    { id: 'back', label: '뒤로가기' },
  ];

  const handleItemClick = (item: typeof navItems[number]) => {
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
    } else if (item.category) {
      onNavigate('category', item.category);
      setIsChatOpen(false);
    }
  };

  return (
    <nav
      aria-label="모바일 하단 메뉴"
      className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-black/[0.05] shadow-[0_-4px_20px_rgba(0,0,0,0.06)] z-[100] md:hidden no-print"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="grid grid-cols-5 items-end h-[64px] max-w-lg mx-auto px-1 pb-2">
        {navItems.map((item) => {
          const isActive = item.id === 'chat'
            ? isChatOpen
            : item.id === 'home'
              ? currentPage === 'home' && !isChatOpen
              : item.id === 'back'
                ? false
                : currentPage === 'category' && selectedCategory === item.category && !isChatOpen;

          if (item.isCenter) {
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleItemClick(item)}
                className="group relative flex flex-col items-center justify-end h-full min-h-[48px] cursor-pointer active:scale-95 transition-transform duration-200 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#065f46]/40"
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
              >
                <span
                  className={`-mt-6 w-[52px] h-[52px] rounded-full bg-[#065f46] flex items-center justify-center shadow-lg shadow-[#065f46]/35 ring-[3.5px] ring-white transition-all duration-200 group-hover:bg-[#047857] ${
                    isActive ? 'ring-emerald-100 scale-[1.03]' : ''
                  }`}
                >
                  <TabIcon id={item.id} active={isActive} />
                </span>
                <span className="text-[11px] font-bold text-[#065f46] mt-1 tracking-tight leading-none whitespace-nowrap shrink-0">
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleItemClick(item)}
              className={`group relative flex flex-col items-center justify-end h-full min-h-[44px] pt-1.5 cursor-pointer active:scale-95 transition-all duration-200 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#065f46]/40 ${
                isActive ? 'text-[#065f46]' : 'text-[#374151] hover:text-[#111827]'
              }`}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="relative flex items-center justify-center h-[28px]">
                <TabIcon id={item.id} active={isActive} />
                {item.id === 'chat' && unreadChatCount > 0 && !isChatOpen && (
                  <span className="absolute -top-1 -right-2.5 bg-red-500 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full min-w-4 text-center shadow-sm ring-2 ring-white tabular-nums">
                    {unreadChatCount > 9 ? '9+' : unreadChatCount}
                  </span>
                )}
              </span>
              <span
                className={`text-[11px] mt-1 tracking-tight leading-none whitespace-nowrap shrink-0 transition-colors duration-200 ${
                  isActive ? 'text-[#065f46] font-bold' : 'text-[#374151] font-semibold'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
