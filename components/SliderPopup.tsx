
import React, { useState } from 'react';
import { PageSlide } from '../types';

interface Props {
  slides: PageSlide[];
  onClose: () => void;
}

const SliderPopup: React.FC<Props> = ({ slides, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? slides.length - 1 : prev - 1));
  };

  if (slides.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative bg-white rounded-[2rem] overflow-hidden shadow-2xl max-w-4xl w-full animate-scale-in">
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-10 h-10 bg-black/20 hover:bg-black/40 text-white rounded-full flex items-center justify-center transition backdrop-blur-sm"
        >
          ✕
        </button>

        <div className="flex flex-col md:flex-row h-full min-h-[400px]">
          {/* Image Section */}
          <div className="relative w-full md:w-2/3 h-64 md:h-auto bg-gray-900 flex items-center justify-center">
            <img 
              src={slides[currentIndex].image} 
              className="w-full h-full object-contain" 
              alt={`Slide ${currentIndex + 1}`} 
            />
            
            {/* Navigation Arrows */}
            {slides.length > 1 && (
              <>
                <button 
                  onClick={prevSlide}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/40 text-white rounded-full flex items-center justify-center transition backdrop-blur-sm"
                >
                  ←
                </button>
                <button 
                  onClick={nextSlide}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 hover:bg-white/40 text-white rounded-full flex items-center justify-center transition backdrop-blur-sm"
                >
                  →
                </button>
              </>
            )}

            {/* Pagination Dots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
              {slides.map((_, idx) => (
                <div 
                  key={idx} 
                  className={`w-2 h-2 rounded-full transition-all ${idx === currentIndex ? 'bg-gold-500 w-4' : 'bg-white/50'}`}
                />
              ))}
            </div>
          </div>

          {/* Content Section */}
          <div className="w-full md:w-1/3 p-8 flex flex-col justify-center bg-white">
            <div className="mb-4">
              <span className="text-gold-600 font-bold text-xs uppercase tracking-widest">Slide {currentIndex + 1} / {slides.length}</span>
              <div className="h-1 w-12 bg-gold-500 mt-1"></div>
            </div>
            <p className="text-gray-700 text-lg font-bold leading-relaxed whitespace-pre-line">
              {slides[currentIndex].description}
            </p>
            
            <div className="mt-8 pt-8 border-t border-gray-100 flex justify-between items-center">
              <button 
                onClick={onClose}
                className="text-gray-400 font-bold text-sm hover:text-gray-600 transition"
              >
                닫기
              </button>
              <div className="flex gap-2">
                <button onClick={prevSlide} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition text-gray-400">←</button>
                <button onClick={nextSlide} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition text-gray-400">→</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SliderPopup;
