
import React, { useState, useEffect } from 'react';

interface Props {
  images: string[];
  onActionClick?: () => void;
}

const HeroSlider: React.FC<Props> = ({ images, onActionClick }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (images.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [images]);

  if (images.length === 0) {
    return <div className="w-full h-[200px] xs:h-[230px] sm:h-[280px] md:h-[340px] bg-black flex items-center justify-center text-white">이미지가 없습니다.</div>;
  }

  return (
    <div className="relative w-full h-[210px] xs:h-[240px] sm:h-[290px] md:h-[350px] overflow-hidden bg-black select-none">
      {images.map((img, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === currentIndex ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
          }`}
          style={{ transitionProperty: 'opacity, transform' }}
        >
          <img
            src={img}
            alt={`Slide ${index}`}
            className="w-full h-full object-cover opacity-75"
          />
        </div>
      ))}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-10 bg-gradient-to-t from-black/70 via-black/30 to-black/40 px-4 text-center">
        <span className="text-[10px] xs:text-xs font-bold tracking-[0.25em] text-gold-400 uppercase mb-1 drop-shadow">VIETNAM PREMIUM TRAVEL</span>
        <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-black mb-1.5 xs:mb-2 drop-shadow-xl text-white tracking-tight">
          MANGO <span className="text-gold-400">TOUR</span>
        </h1>
        <p className="text-xs xs:text-sm sm:text-base md:text-lg font-medium drop-shadow-md mb-3 xs:mb-4 text-gray-200 break-keep max-w-md">
          베트남 명문 골프 & 럭셔리 맞춤 투어
        </p>
        {onActionClick && (
          <button 
            onClick={onActionClick}
            className="px-5 xs:px-6 py-2 xs:py-2.5 bg-gold-500 hover:bg-gold-600 text-white rounded-full font-bold text-xs xs:text-sm transition-all duration-200 shadow-[0_4px_20px_rgba(212,175,55,0.4)] active:scale-95 flex items-center gap-1.5"
          >
            <span>✨</span> 나만의 여행 만들기 <span className="text-xs">→</span>
          </button>
        )}
      </div>

      {/* Slide Indicators */}
      {images.length > 1 && (
        <div className="absolute bottom-3 left-0 right-0 z-20 flex justify-center gap-1.5">
          {images.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentIndex ? 'w-6 bg-gold-400' : 'w-1.5 bg-white/50'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default HeroSlider;
