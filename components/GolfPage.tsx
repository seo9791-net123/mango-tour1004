
import React, { useState, useEffect } from 'react';
import { PageContent } from '../types';
import SliderPopup from './SliderPopup';
import PageSectionList from './PageSectionList';
import BackButton from './BackButton';
import { getFreshImageUrl } from '../utils/imageUtils';

interface Props {
  content: PageContent;
  onBack: () => void;
}

const GolfPage: React.FC<Props> = ({ content, onBack }) => {
  const [isSliderOpen, setIsSliderOpen] = useState(false);

  useEffect(() => {
    const handleSubViewBack = (e: any) => {
      if (isSliderOpen) {
        setIsSliderOpen(false);
        e?.detail?.handled?.();
        return;
      }
    };
    window.addEventListener('mango_subview_back', handleSubViewBack as EventListener);
    return () => window.removeEventListener('mango_subview_back', handleSubViewBack as EventListener);
  }, [isSliderOpen]);

  return (
    <div className="min-h-screen bg-[#F2F2F7] text-[#3A3A3C] font-sans overflow-x-clip animate-fade-in pb-safe md:pb-0">
      {/* Sticky Compact Hero */}
      <div
        className="sticky z-20 w-full bg-[#F2F2F7]/90 backdrop-blur-md pb-2.5 sm:pb-3"
        style={{ top: 'var(--site-header-height, 45px)' }}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-4 pt-2.5 sm:pt-3">
          <section className="relative h-[144px] sm:h-[164px] md:h-[240px] lg:h-[260px] flex items-center justify-center overflow-hidden bg-black rounded-[20px] shadow-sm">
            <div className="absolute inset-0 z-0">
              <img src={getFreshImageUrl(content.heroImage)} alt="Hero" className="w-full h-full object-cover object-center opacity-60" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/35 to-black/25"></div>
            </div>
            
            <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-50">
              <BackButton onClick={isSliderOpen ? () => setIsSliderOpen(false) : onBack} variant="hero" label={isSliderOpen ? '닫기' : '뒤로가기'} />
            </div>

            <div className="relative z-10 text-center px-4 pt-5 sm:pt-3 md:pt-0">
               <p className="text-[10px] sm:text-xs font-semibold tracking-[0.2em] uppercase text-emerald-300 mb-1">{content.heroSubtitle}</p>
               <h1 className="text-xl xs:text-2xl md:text-4xl font-bold tracking-tight text-white drop-shadow mb-1.5 uppercase leading-tight">{content.heroTitle}</h1>
               <div className="flex justify-center gap-1.5">
                  <span className="bg-white/20 backdrop-blur-sm px-2.5 py-0.5 rounded-full text-[10px] text-white font-medium whitespace-nowrap">#명문골프장</span>
                  <span className="bg-white/20 backdrop-blur-sm px-2.5 py-0.5 rounded-full text-[10px] text-white font-medium whitespace-nowrap">#VIP의전</span>
               </div>
            </div>
          </section>
        </div>
      </div>

      <section className="pt-2 pb-5 sm:pt-3 sm:pb-6">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 text-left space-y-4 sm:space-y-5">
           <div className="bg-white rounded-[20px] shadow-sm p-5 sm:p-6 md:p-7">
              <h2 className="text-xl xs:text-2xl md:text-3xl font-bold uppercase mb-2 tracking-tight text-gray-900">{content.introTitle}</h2>
              <p className="text-sm xs:text-base md:text-lg leading-relaxed text-[#3A3A3C] font-normal whitespace-pre-line">{content.introText}</p>
           </div>
           
           <PageSectionList sections={content.sections} />

           <div className="bg-white rounded-[20px] shadow-sm p-5 sm:p-6 md:p-7">
             <div className="mb-4">
                <h3 className="text-[#0A7E54] font-semibold tracking-wider text-xs mb-0.5 uppercase">GALLERY</h3>
                <h2 className="text-xl xs:text-2xl font-bold text-gray-900 tracking-tight">골프 코스 갤러리</h2>
             </div>
             <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
                {content.galleryImages.map((img, idx) => (
                   <div key={idx} className="group relative overflow-hidden rounded-2xl h-32 xs:h-36 sm:h-40 bg-[#F2F2F7]">
                      <img src={getFreshImageUrl(img)} className="w-full h-full object-cover transform group-hover:scale-105 transition duration-500" alt={`Golf Gallery ${idx}`} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-2.5">
                         <p className="text-white font-semibold text-[11px] uppercase tracking-wider">Golf Course {idx + 1}</p>
                      </div>
                   </div>
                ))}
             </div>

             {content.slides && content.slides.length > 0 && (
                <div className="mt-5">
                  <button 
                    onClick={() => setIsSliderOpen(true)}
                    className="w-full sm:w-auto px-6 py-3 bg-[#0A7E54] text-white rounded-2xl font-semibold text-xs sm:text-sm hover:bg-[#086945] active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 mx-auto whitespace-nowrap cursor-pointer"
                  >
                    <span>상세 갤러리 슬라이드 보기</span>
                  </button>
                </div>
             )}
           </div>
        </div>
      </section>

      <div className="pb-6">
        <div className="max-w-7xl mx-auto px-3 sm:px-4">
          <section className="p-5 sm:p-6 md:p-8 bg-gray-900 text-white rounded-[20px] shadow-sm grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-8 items-center overflow-hidden">
             <img src={getFreshImageUrl(content.introImage)} className="w-full h-[200px] xs:h-[240px] md:h-[280px] object-cover rounded-2xl opacity-95" alt="Golf Service" />
             <div className="space-y-3.5">
                <h3 className="text-lg xs:text-xl font-bold text-white tracking-tight">MANGO TOUR만의 특별한 골프 케어</h3>
                <ul className="space-y-2.5 text-xs xs:text-sm font-normal text-gray-300">
                   <li className="flex items-center gap-2"><span className="text-emerald-400 font-bold">✓</span> 전일정 전용 차량 및 전문 매니저 동행</li>
                   <li className="flex items-center gap-2"><span className="text-emerald-400 font-bold">✓</span> 골프장 티업 타임 우선 배정 권한</li>
                   <li className="flex items-center gap-2"><span className="text-emerald-400 font-bold">✓</span> 라운딩 후 최고급 스파 및 석식 예약</li>
                   <li className="flex items-center gap-2"><span className="text-emerald-400 font-bold">✓</span> 단체 행사 및 대회 기획 지원</li>
                </ul>
                <button 
                  onClick={() => window.open('https://open.kakao.com/o/gprQnKSi', '_blank')}
                  className="w-full sm:w-auto bg-[#0A7E54] hover:bg-[#086945] text-white px-6 py-3 rounded-2xl font-semibold text-xs xs:text-sm active:scale-95 transition-all duration-200 whitespace-nowrap cursor-pointer"
                >
                  골프 투어 맞춤 견적 신청
                </button>
             </div>
          </section>
        </div>
      </div>

      {isSliderOpen && content.slides && (
        <SliderPopup slides={content.slides} onClose={() => setIsSliderOpen(false)} />
      )}
    </div>
  );
};

export default GolfPage;
