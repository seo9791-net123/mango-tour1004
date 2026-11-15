import React, { useState, useEffect } from 'react';
import { getFreshImageUrl } from '../utils/imageUtils';

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
    return (
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 pt-2.5 sm:pt-3 pb-0">
        <div className="w-full h-[168px] xs:h-[192px] sm:h-[240px] md:h-[288px] lg:h-[320px] bg-gray-900 rounded-[20px] flex items-center justify-center text-white shadow-sm">
          이미지가 없습니다.
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-4 pt-2.5 sm:pt-3 pb-0">
      <div className="relative w-full h-[168px] xs:h-[192px] sm:h-[240px] md:h-[288px] lg:h-[320px] overflow-hidden bg-gray-900 select-none rounded-[20px] shadow-sm">
        {images.map((img, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentIndex ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
            }`}
            style={{ transitionProperty: 'opacity, transform' }}
          >
            <img
              src={getFreshImageUrl(img)}
              alt={`Slide ${index}`}
              className="w-full h-full object-cover object-center opacity-80"
            />
          </div>
        ))}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-10 bg-gradient-to-t from-black/75 via-black/30 to-black/35 px-3 sm:px-4 py-2.5 sm:py-3 text-center">
          <span className="text-[9px] xs:text-[10px] sm:text-xs font-bold tracking-[0.2em] text-emerald-300 uppercase mb-0.5">
            VIETNAM PREMIUM TRAVEL
          </span>
          <h1 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl font-extrabold mb-1 xs:mb-1.5 text-white tracking-tight">
            MANGO TOUR
          </h1>
          <p className="text-[11px] xs:text-xs sm:text-sm md:text-base font-medium mb-2.5 xs:mb-3 text-white/90 break-keep max-w-md">
            베트남 명문 골프 & 럭셔리 맞춤 투어
          </p>
          {onActionClick && (
            <button 
              type="button"
              onClick={onActionClick}
              className="px-4 xs:px-5 py-1.5 xs:py-2 bg-[#0A7E54] hover:bg-[#086945] text-white rounded-full font-bold text-[11px] xs:text-xs sm:text-sm transition-all duration-200 shadow-lg active:scale-95 flex items-center gap-1 whitespace-nowrap cursor-pointer"
            >
              <span>나만의 여행 만들기</span>
              <span className="text-[11px] xs:text-xs">→</span>
            </button>
          )}
        </div>

        {/* Slide Indicators */}
        {images.length > 1 && (
          <div className="absolute bottom-2 xs:bottom-2.5 left-0 right-0 z-20 flex justify-center gap-1.5">
            {images.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`h-1 xs:h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  idx === currentIndex ? 'w-5 bg-white' : 'w-1.5 bg-white/45'
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
