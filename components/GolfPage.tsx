
import React, { useState } from 'react';
import { PageContent } from '../types';
import SliderPopup from './SliderPopup';
import PageSectionList from './PageSectionList';
import BackButton from './BackButton';

interface Props {
  content: PageContent;
  onBack: () => void;
}

const GolfPage: React.FC<Props> = ({ content, onBack }) => {
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
           <div className="mb-1.5 xs:mb-2 inline-block border-b border-gold-500">
             <p className="text-[11px] xs:text-xs md:text-sm font-bold tracking-[0.25em] uppercase text-gold-400">{content.heroSubtitle}</p>
           </div>
           <h1 className="text-2xl xs:text-3xl md:text-4xl font-black tracking-tight text-white drop-shadow-2xl mb-1 uppercase leading-tight">{content.heroTitle}</h1>
           <div className="mt-1.5 flex justify-center gap-1.5">
              <span className="bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full text-[9px] xs:text-[10px] text-white font-medium">#명문골프장</span>
              <span className="bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full text-[9px] xs:text-[10px] text-white font-medium">#VIP의전</span>
           </div>
        </div>
      </section>

      <section className="py-6 xs:py-8 bg-gray-50 text-black border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-3 xs:px-4 text-left">
           <h2 className="text-xl xs:text-2xl md:text-3xl font-black uppercase mb-2 tracking-tight text-deepgreen">{content.introTitle}</h2>
           <div className="h-1 w-12 xs:w-16 bg-gold-500 mb-3 xs:mb-4 rounded-full"></div>
           <p className="text-sm xs:text-base md:text-lg leading-relaxed text-gray-700 font-medium whitespace-pre-line mb-6 xs:mb-8">{content.introText}</p>
           
           <PageSectionList sections={content.sections} />

           <div className="mt-8 text-left mb-4">
              <h3 className="text-gold-600 font-extrabold tracking-widest text-[10px] xs:text-xs mb-0.5 uppercase">GALLERY</h3>
              <h2 className="text-xl xs:text-2xl font-black uppercase text-deepgreen">골프 코스 갤러리</h2>
           </div>
           <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 xs:gap-3.5">
              {content.galleryImages.map((img, idx) => (
                 <div key={idx} className="group relative overflow-hidden rounded-xl shadow-sm h-32 xs:h-36 sm:h-40 bg-gray-100">
                    <img src={img} className="w-full h-full object-cover transform group-hover:scale-105 transition duration-500" alt={`Golf Gallery ${idx}`} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-2.5">
                       <p className="text-white font-bold text-[10px] uppercase tracking-wider">Golf Course {idx + 1}</p>
                    </div>
                 </div>
              ))}
           </div>

           {content.slides && content.slides.length > 0 && (
              <button 
                onClick={() => setIsSliderOpen(true)}
                className="mt-6 xs:mt-8 px-6 xs:px-8 py-2.5 xs:py-3 bg-deepgreen text-white rounded-xl font-bold text-xs xs:text-sm hover:bg-gold-600 active:scale-95 transition shadow-md flex items-center justify-center gap-2 mx-auto"
              >
                <span>🖼️</span> 상세 갤러리 슬라이드 보기
              </button>
           )}
        </div>
      </section>

      <section className="py-6 xs:py-8 bg-gray-900 text-white">
         <div className="max-w-7xl mx-auto px-3 xs:px-4 grid grid-cols-1 lg:grid-cols-2 gap-6 xs:gap-8 items-center">
            <img src={content.introImage} className="w-full h-[200px] xs:h-[240px] md:h-[280px] object-cover rounded-2xl xs:rounded-3xl shadow-xl opacity-90" alt="Golf Service" />
            <div className="space-y-3 xs:space-y-4">
               <h3 className="text-lg xs:text-xl font-black text-gold-400 uppercase tracking-tight">MANGO TOUR만의 특별한 골프 케어</h3>
               <ul className="space-y-2.5 text-xs xs:text-sm font-normal text-gray-300">
                  <li className="flex items-center gap-2"><span className="text-gold-400 font-bold">✓</span> 전일정 전용 차량 및 전문 매니저 동행</li>
                  <li className="flex items-center gap-2"><span className="text-gold-400 font-bold">✓</span> 골프장 티업 타임 우선 배정 권한</li>
                  <li className="flex items-center gap-2"><span className="text-gold-400 font-bold">✓</span> 라운딩 후 최고급 스파 및 석식 예약</li>
                  <li className="flex items-center gap-2"><span className="text-gold-400 font-bold">✓</span> 단체 행사 및 대회 기획 지원</li>
               </ul>
               <button 
                 onClick={() => window.open('https://open.kakao.com/o/gSfNsh3h', '_blank')}
                 className="w-full xs:w-auto bg-gold-500 text-white px-6 py-3 rounded-xl font-bold text-xs xs:text-sm shadow-md hover:bg-gold-600 active:scale-95 transition"
               >
                 골프 투어 맞춤 견적 신청
               </button>
            </div>
         </div>
      </section>

      {isSliderOpen && content.slides && (
        <SliderPopup slides={content.slides} onClose={() => setIsSliderOpen(false)} />
      )}
    </div>
  );
};

export default GolfPage;
