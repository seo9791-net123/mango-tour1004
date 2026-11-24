import React from 'react';

interface Props {
  currentPage: string;
  selectedCategory: string | null;
  onNavigate: (page: string, category?: string) => void;
  onBack?: () => void;
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

    case 'community':
      return active ? (
        <svg className="w-[25px] h-[25px]" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M4.5 4.5h15A2.5 2.5 0 0 1 22 7v10a2.5 2.5 0 0 1-2.5 2.5h-15A2.5 2.5 0 0 1 2 17V7a2.5 2.5 0 0 1 2.5-2.5Zm3 5.25a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Zm11 6.75-3.95-4.35a1 1 0 0 0-1.46-.03l-2.6 2.66-1.52-1.45a1 1 0 0 0-1.37-.01L5.25 15.5v1h13.25Z" />
        </svg>
      ) : (
        <svg className="w-[25px] h-[25px]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect
            x="3"
            y="4.75"
            width="18"
            height="14.5"
            rx="2.5"
            fill="currentColor"
            fillOpacity="0.14"
            stroke="currentColor"
            strokeWidth="2.05"
          />
          <circle cx="8.25" cy="9.75" r="1.35" fill="currentColor" />
          <path
            d="m4.75 16.25 3.6-3.35a.9.9 0 0 1 1.24.02l1.85 1.78 2.95-3.05a.9.9 0 0 1 1.32.02l3.54 3.93"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
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
  onBack,
}) => {
  const navItems = [
    { id: 'home', label: '홈' },
    { id: 'recommended', label: '추천상품', category: '추천 상품' },
    { id: 'custom', label: '나만의 여행', category: '여행 만들기', isCenter: true },
    { id: 'community', label: '커뮤니티', category: '커뮤니티' },
    { id: 'back', label: '뒤로가기' },
  ];

  const handleItemClick = (item: typeof navItems[number]) => {
    if (item.id === 'back') {
      if (onBack) {
        onBack();
      } else if (currentPage !== 'home') {
        onNavigate('home');
      } else if (typeof window !== 'undefined' && window.history.length > 1) {
        window.history.back();
      }
    } else if (item.id === 'home') {
      onNavigate('home');
    } else if (item.category) {
      onNavigate('category', item.category);
    }
  };

  return (
    <nav
      aria-label="모바일 하단 메뉴"
      className="fixed bottom-0 left-0 right-0 w-full bg-white/95 backdrop-blur-md border-t border-black/[0.06] z-[100] md:hidden no-print"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="grid grid-cols-5 items-end h-[64px] w-full max-w-none px-0 pb-2">
        {navItems.map((item) => {
          const isActive = item.id === 'home'
            ? currentPage === 'home'
            : item.id === 'back'
              ? false
              : currentPage === 'category' && selectedCategory === item.category;

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
