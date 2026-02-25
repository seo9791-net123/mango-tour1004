
import React, { useState, useEffect } from 'react';

interface Props {
  images: string[];
}

const HeroSlider: React.FC<Props> = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (images.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [images]);

  if (images.length === 0) {
    return <div className="w-full h-[200px] bg-black flex items-center justify-center text-white">이미지가 없습니다.</div>;
  }

  return (
    <div className="relative w-full h-[200px] overflow-hidden bg-black">
      {images.map((img, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === currentIndex ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <img
            src={img}
            alt={`Slide ${index}`}
            className="w-full h-full object-cover opacity-80"
          />
        </div>
      ))}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-10 bg-black/30">
        <h1 className="text-3xl md:text-4xl font-bold mb-2 drop-shadow-lg text-gold-400">MANGO TOUR</h1>
        <p className="text-lg md:text-xl font-light drop-shadow-md">베트남 프리미엄 골프 & 럭셔리 투어</p>
        <button 
          onClick={() => {
            // This is a bit tricky since HeroSlider doesn't have access to setCurrentPage
            // We'll use a custom event or just let the user click the icon menu
            // But for now, let's just make it a visual element or use a window dispatch
            window.dispatchEvent(new CustomEvent('navigate-to-planner'));
          }}
          className="mt-6 px-8 py-2.5 bg-gold-500 hover:bg-gold-600 text-white font-bold rounded-full transition shadow-lg transform hover:scale-105 active:scale-95 flex items-center gap-2 pointer-events-auto"
        >
          <span>✈️</span> 나만의 여행 만들기
        </button>
      </div>
    </div>
  );
};

export default HeroSlider;
