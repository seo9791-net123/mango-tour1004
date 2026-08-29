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
  // Base arrow SVG icon
  const ArrowIcon = (
    <svg 
      className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-0.5 shrink-0" 
      fill="none" 
      viewBox="0 0 24 24" 
      stroke="currentColor" 
      strokeWidth={2.5}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
    </svg>
  );

  let variantStyles = '';
  if (variant === 'hero') {
    variantStyles = 'bg-black/35 hover:bg-black/55 active:bg-black/70 backdrop-blur-md border border-white/25 text-white hover:text-gold-300 shadow-[0_4px_16px_rgba(0,0,0,0.2)] hover:border-gold-400/50';
  } else if (variant === 'light') {
    variantStyles = 'bg-white hover:bg-gray-50 active:bg-gray-100 border border-gray-200 text-gray-700 hover:text-deepgreen shadow-sm hover:border-gold-400/80 hover:shadow';
  } else if (variant === 'dark') {
    variantStyles = 'bg-gray-800/90 hover:bg-gray-700 active:bg-gray-600 border border-gray-700 text-gray-200 hover:text-gold-300 shadow-md hover:border-gold-400/40';
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`group inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-1.5 rounded-full text-xs font-bold transition-all duration-200 active:scale-95 cursor-pointer select-none whitespace-nowrap ${variantStyles} ${className}`}
      title={label}
    >
      {ArrowIcon}
      <span className="tracking-tight">{label}</span>
    </button>
  );
};

export default BackButton;
