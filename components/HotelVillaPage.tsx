import React, { useState } from 'react';
import { PageContent } from '../types';
import SliderPopup from './SliderPopup';
import PageSectionList from './PageSectionList';
import BackButton from './BackButton';
import { getFreshImageUrl } from '../utils/imageUtils';

interface Props {
  content: PageContent;
  onBack: () => void;
}

const HotelVillaPage: React.FC<Props> = ({ content, onBack }) => {
  const [isSliderOpen, setIsSliderOpen] = useState(false);

  return (
    <div className="bg-[#F2F2F7] text-[#3A3A3C] font-sans overflow-x-clip animate-fade-in">
      {/* Sticky Compact Hero */}
      <div
        className="sticky z-20 w-full bg-[#F2F2F7]/90 backdrop-blur-md pb-2.5 sm:pb-3"
        style={{ top: 'var(--site-header-height, 45px)' }}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-4 pt-2.5 sm:pt-3">
          <section className="relative h-[140px] sm:h-[164px] md:h-[240px] lg:h-[260px] flex items-center justify-center overflow-hidden bg-black rounded-[20px] shadow-sm">
            <div className="absolute inset-0 z-0">
              <img src={getFreshImageUrl(content.heroImage)} alt="Hero" className="w-full h-full object-cover object-center opacity-60" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/25"></div>
            </div>
            
            <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-50">
              <BackButton onClick={onBack} variant="hero" label="뒤로가기" />
            </div>

            <div className="relative z-10 text-center px-4 pt-4 sm:pt-2 md:pt-0">
               <h1 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl font-bold text-white drop-shadow mb-0.5 sm:mb-1 uppercase tracking-tight">{content.heroTitle}</h1>
               <p className="text-[10px] xs:text-[11px] md:text-sm font-semibold tracking-[0.2em] text-emerald-300 uppercase">{content.heroSubtitle}</p>
            </div>
          </section>
        </div>
      </div>

      <section className="pt-0 pb-0">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 space-y-3 sm:space-y-4">
          <div className="bg-white rounded-[20px] shadow-sm p-5 sm:p-6 md:p-7 flex flex-col md:flex-row gap-5 sm:gap-8 items-center">
             <div className="flex-1 space-y-3">
                <h2 className="text-xl xs:text-2xl md:text-3xl font-bold uppercase leading-tight text-gray-900 tracking-tight">{content.introTitle}</h2>
                <p className="text-sm xs:text-base md:text-lg leading-relaxed text-[#3A3A3C] font-normal whitespace-pre-line">{content.introText}</p>
                {content.slides && content.slides.length > 0 && (
                  <button 
                    onClick={() => setIsSliderOpen(true)}
                    className="mt-3 w-full sm:w-auto justify-center px-6 py-3 bg-[#0A7E54] text-white rounded-2xl font-semibold text-xs xs:text-sm hover:bg-[#086945] active:scale-95 transition-all duration-200 flex items-center gap-2 whitespace-nowrap cursor-pointer"
                  >
                    <span>상세 갤러리 슬라이드 보기</span>
                  </button>
                )}
             </div>
             <div className="w-full flex-1 relative group cursor-pointer" onClick={() => content.slides && content.slides.length > 0 && setIsSliderOpen(true)}>
                <img src={getFreshImageUrl(content.introImage)} className="w-full h-[200px] xs:h-[240px] md:h-[280px] object-cover rounded-2xl group-hover:scale-[1.02] transition duration-500" alt="Intro" />
                {content.slides && content.slides.length > 0 && (
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-300">
                    <span className="text-white font-semibold text-xs xs:text-sm bg-black/50 px-4 py-2 rounded-full backdrop-blur-sm whitespace-nowrap">슬라이드 보기</span>
                  </div>
                )}
             </div>
          </div>

          <PageSectionList sections={content.sections} />

          <div className="bg-white rounded-[20px] shadow-sm p-5 sm:p-6 md:p-7">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
               {content.galleryImages.map((img, idx) => (
                  <div key={idx} className="group overflow-hidden rounded-2xl h-32 xs:h-36 sm:h-40 relative bg-[#F2F2F7]">
                     <img src={getFreshImageUrl(img)} className="w-full h-full object-cover transform group-hover:scale-105 transition duration-500" alt={`Villa ${idx}`} />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity duration-300"></div>
                     <div className="absolute bottom-2.5 left-2.5 text-white">
                        <p className="text-[9px] uppercase font-semibold text-emerald-300">Accommodation</p>
                        <h4 className="text-[11px] font-bold">Stay Gallery {idx + 1}</h4>
                     </div>
                  </div>
               ))}
            </div>
          </div>

          <div className="bg-white rounded-[20px] shadow-sm p-5 sm:p-6 text-center">
            <h2 className="text-base xs:text-lg font-bold mb-3 text-gray-900 tracking-tight">완벽한 휴식을 위한 큐레이션</h2>
            <div className="flex flex-wrap justify-center gap-2">
               <span className="bg-[#ECFDF5] px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#0A7E54] whitespace-nowrap">#고급호텔</span>
               <span className="bg-[#ECFDF5] px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#0A7E54] whitespace-nowrap">#독채풀빌라</span>
               <span className="bg-[#ECFDF5] px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#0A7E54] whitespace-nowrap">#오션뷰리조트</span>
               <span className="bg-[#ECFDF5] px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#0A7E54] whitespace-nowrap">#시내중심</span>
            </div>
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
