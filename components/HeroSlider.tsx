
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
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-10 bg-black/30 pointer-events-none">
        <h1 className="text-3xl md:text-4xl font-bold mb-2 drop-shadow-lg text-gold-400">MANGO TOUR</h1>
        <p className="text-lg md:text-xl font-light drop-shadow-md">베트남 프리미엄 골프 & 럭셔리 투어</p>
        <div className="mt-4 px-6 py-1.5 border-2 border-white/50 rounded-full hover:bg-white/20 transition backdrop-blur-sm text-sm">
          특별한 당신을 위한 최고의 여행
        </div>
      </div>
    </div>
  );
};

export default HeroSlider;
