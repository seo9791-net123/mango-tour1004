import React, { useState, useEffect } from 'react';
import { getFreshImageUrl } from '../utils/imageUtils';

interface Props {
  images: string[];
  onActionClick?: () => void;
}

const HeroSlider: React.FC<Props> = ({ images, onActionClick }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const safeIndex = images.length > 0 ? currentIndex % images.length : 0;

  useEffect(() => {
    if (images.length <= 1 || isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [images.length, isPaused]);

  if (images.length === 0) {
    return (
      <div className="w-full max-w-7xl mx-auto px-0 md:px-4 md:flex-1 md:min-h-[290px] md:max-h-[540px] xl:max-h-[640px] flex flex-col">
        <div className="w-full h-[180px] xs:h-[205px] sm:h-[256px] md:h-auto md:flex-1 bg-gray-900 rounded-none md:rounded-[20px] flex items-center justify-center text-white shadow-none md:shadow-sm">
          이미지가 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-0 md:px-4 md:flex-1 md:min-h-[290px] md:max-h-[540px] xl:max-h-[640px] flex flex-col">
      <div
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        className="relative w-full h-[180px] xs:h-[205px] sm:h-[256px] md:h-auto md:flex-1 overflow-hidden bg-gray-900 select-none rounded-none md:rounded-[20px] shadow-none md:shadow-sm"
      >
        {images.map((img, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-[1500ms] ease-in-out ${
              index === safeIndex ? 'opacity-100 z-[1]' : 'opacity-0 z-0 pointer-events-none'
            }`}
            style={{ transitionProperty: 'opacity' }}
          >
            <img
              src={getFreshImageUrl(img)}
              alt={`Slide ${index}`}
              className="w-full h-full object-cover object-center opacity-90 brightness-105"
            />
          </div>
        ))}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-10 bg-gradient-to-t from-black/65 via-black/20 to-black/25 px-4 py-3 sm:py-4 text-center">
          <span className="text-[10px] sm:text-xs font-bold tracking-[0.2em] text-emerald-300 uppercase mb-1">
            VIETNAM PREMIUM TRAVEL
          </span>
          <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-extrabold mb-1.5 sm:mb-2 text-white tracking-tight">
            MANGO TOUR
          </h1>
          <p className="text-xs sm:text-sm md:text-base font-medium mb-3 sm:mb-3.5 text-white/90 break-keep max-w-md">
            베트남 명문 골프 & 럭셔리 맞춤 투어
          </p>
          {onActionClick && (
            <button 
              type="button"
              onClick={onActionClick}
              className="px-5 sm:px-6 py-2 sm:py-2.5 bg-[#0A7E54] hover:bg-[#086945] text-white rounded-full font-bold text-xs sm:text-sm transition-all duration-200 shadow-lg active:scale-95 flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <span>나만의 여행 만들기</span>
              <span className="text-xs sm:text-sm">→</span>
            </button>
          )}
        </div>

        {/* Slide Indicators */}
        {images.length > 1 && (
          <div className="absolute bottom-2.5 sm:bottom-3 left-0 right-0 z-20 flex justify-center gap-1.5">
            {images.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  idx === safeIndex ? 'w-6 bg-white' : 'w-1.5 bg-white/45'
                }`}
                aria-label={`Go to slide ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HeroSlider;
