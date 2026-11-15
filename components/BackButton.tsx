import React from 'react';

interface BackButtonProps {
  onClick: () => void;
  label?: string;
  variant?: 'hero' | 'light' | 'dark';
  className?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({
  onClick,
  label = '뒤로가기',
  variant = 'hero',
  className = ''
}) => {
  const ChevronIcon = (
    <svg
      className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-0.5 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
  );

  let variantStyles = '';
  if (variant === 'hero') {
    variantStyles = 'bg-black/30 hover:bg-black/45 active:bg-black/60 backdrop-blur-md text-white shadow-sm';
  } else if (variant === 'light') {
    variantStyles = 'bg-white hover:bg-gray-50 active:bg-gray-100 text-[#0A7E54] shadow-sm';
  } else if (variant === 'dark') {
    variantStyles = 'bg-white/15 hover:bg-white/25 active:bg-white/30 backdrop-blur-md text-white shadow-sm';
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group inline-flex items-center gap-1 px-3 py-1.5 sm:px-3.5 sm:py-1.5 rounded-full text-xs font-semibold transition-all duration-200 active:scale-95 cursor-pointer select-none whitespace-nowrap ${variantStyles} ${className}`}
      title={label}
    >
      {ChevronIcon}
      <span className="tracking-tight">{label}</span>
    </button>
  );
};

export default BackButton;
