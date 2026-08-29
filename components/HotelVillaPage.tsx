import React, { useState } from 'react';
import { PageContent } from '../types';
import SliderPopup from './SliderPopup';
import PageSectionList from './PageSectionList';
import BackButton from './BackButton';

interface Props {
  content: PageContent;
  onBack: () => void;
}

const HotelVillaPage: React.FC<Props> = ({ content, onBack }) => {
  const [isSliderOpen, setIsSliderOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white text-black font-sans overflow-x-hidden animate-fade-in pb-safe md:pb-0">
      {/* Compact Hero */}
      <section className="relative h-[160px] xs:h-[180px] sm:h-[220px] md:h-[260px] flex items-center justify-center overflow-hidden bg-black">
        <div className="absolute inset-0 z-0">
          <img src={content.heroImage} alt="Hero" className="w-full h-full object-cover opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/30"></div>
        </div>
        
        <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-50">
          <BackButton onClick={onBack} variant="hero" label="메인으로" />
        </div>

        <div className="relative z-10 text-center px-4">
           <h1 className="text-2xl xs:text-3xl md:text-4xl font-black text-white drop-shadow-2xl mb-1 uppercase tracking-tight">{content.heroTitle}</h1>
           <p className="text-[11px] xs:text-xs md:text-sm font-bold tracking-[0.25em] text-gold-400 uppercase">{content.heroSubtitle}</p>
        </div>
      </section>

      <section className="py-6 xs:py-8 bg-white text-black">
        <div className="max-w-7xl mx-auto px-3 xs:px-4">
          <div className="flex flex-col md:flex-row gap-6 xs:gap-8 items-center mb-6 xs:mb-8">
             <div className="flex-1 space-y-3">
                <h2 className="text-xl xs:text-2xl md:text-3xl font-black uppercase leading-tight text-deepgreen tracking-tight">{content.introTitle}</h2>
                <div className="h-1 w-12 xs:w-16 bg-gold-500 rounded-full"></div>
                <p className="text-sm xs:text-base md:text-lg leading-relaxed text-gray-700 font-medium whitespace-pre-line">{content.introText}</p>
                {content.slides && content.slides.length > 0 && (
                  <button 
                    onClick={() => setIsSliderOpen(true)}
                    className="mt-4 px-6 py-2.5 xs:py-3 bg-deepgreen text-white rounded-xl font-bold text-xs xs:text-sm hover:bg-gold-600 active:scale-95 transition shadow-md flex items-center gap-2"
                  >
                    <span>🖼️</span> 상세 갤러리 슬라이드 보기
                  </button>
                )}
             </div>
             <div className="w-full flex-1 relative group cursor-pointer" onClick={() => content.slides && content.slides.length > 0 && setIsSliderOpen(true)}>
                <img src={content.introImage} className="w-full h-[200px] xs:h-[240px] md:h-[280px] object-cover rounded-2xl xs:rounded-3xl shadow-lg group-hover:scale-[1.02] transition duration-500" alt="Intro" />
                {content.slides && content.slides.length > 0 && (
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 rounded-2xl xs:rounded-3xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300">
                    <span className="text-white font-bold text-xs xs:text-sm bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm">슬라이드 보기</span>
                  </div>
                )}
             </div>
          </div>

          <div className="mb-6 xs:mb-8">
            <PageSectionList sections={content.sections} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 xs:gap-3.5">
             {content.galleryImages.map((img, idx) => (
                <div key={idx} className="group overflow-hidden rounded-xl shadow-sm h-32 xs:h-36 sm:h-40 relative bg-gray-100">
                   <img src={img} className="w-full h-full object-cover transform group-hover:scale-105 transition duration-500" alt={`Villa ${idx}`} />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-300"></div>
                   <div className="absolute bottom-2.5 left-2.5 text-white">
                      <p className="text-[9px] uppercase font-bold text-gold-400">Accommodation</p>
                      <h4 className="text-[11px] font-bold">Stay Gallery {idx + 1}</h4>
                   </div>
                </div>
             ))}
          </div>
        </div>
      </section>
      
      <section className="py-6 xs:py-8 bg-[#f8f9fa] text-center border-t border-gray-100">
         <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-lg xs:text-xl font-bold mb-3 xs:mb-4 text-deepgreen">완벽한 휴식을 위한 큐레이션</h2>
            <div className="flex flex-wrap justify-center gap-1.5 xs:gap-2">
               <span className="bg-white px-3 xs:px-4 py-1 rounded-full border border-gray-200 text-[10px] xs:text-xs font-bold text-gray-700 shadow-sm">#5성급호텔</span>
               <span className="bg-white px-3 xs:px-4 py-1 rounded-full border border-gray-200 text-[10px] xs:text-xs font-bold text-gray-700 shadow-sm">#독채풀빌라</span>
               <span className="bg-white px-3 xs:px-4 py-1 rounded-full border border-gray-200 text-[10px] xs:text-xs font-bold text-gray-700 shadow-sm">#오션뷰리조트</span>
               <span className="bg-white px-3 xs:px-4 py-1 rounded-full border border-gray-200 text-[10px] xs:text-xs font-bold text-gray-700 shadow-sm">#시내중심</span>
            </div>
         </div>
      </section>

      {isSliderOpen && content.slides && (
        <SliderPopup slides={content.slides} onClose={() => setIsSliderOpen(false)} />
      )}
    </div>
  );
};

export default HotelVillaPage;
