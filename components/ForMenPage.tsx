import React from 'react';
import { PageContent } from '../types';
import PageSectionList from './PageSectionList';
import BackButton from './BackButton';
import { getFreshImageUrl } from '../utils/imageUtils';

interface Props {
  content: PageContent;
  onBack: () => void;
}

const ForMenPage: React.FC<Props> = ({ content, onBack }) => {
  return (
    <div className="bg-[#F2F2F7] text-white font-sans overflow-x-clip animate-fade-in">
      {/* Sticky Compact Hero */}
      <div
        className="sticky z-20 w-full bg-[#F2F2F7]/90 backdrop-blur-md pb-2 md:pb-3"
        style={{ top: 'var(--site-header-height, 45px)' }}
      >
        <div className="max-w-7xl mx-auto px-0 md:px-4 pt-0 md:pt-3">
          <section className="relative h-[144px] sm:h-[164px] md:h-[240px] lg:h-[260px] flex items-center justify-center overflow-hidden bg-black rounded-none md:rounded-[20px] shadow-none md:shadow-sm">
            <div className="absolute inset-0 z-0">
              <img src={getFreshImageUrl(content.heroImage)} alt="Hero" className="w-full h-full object-cover object-center opacity-50" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-[#050505]"></div>
            </div>
            
            <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-50">
              <BackButton onClick={onBack} variant="hero" label="뒤로가기" />
            </div>

            <div className="relative z-10 text-center animate-fade-in-up px-4 pt-5 sm:pt-3 md:pt-0">
               <p className="text-[10px] sm:text-xs font-semibold tracking-[0.25em] uppercase text-emerald-300 mb-1">Exclusive Nightlife</p>
               <h1 className="text-2xl xs:text-3xl md:text-5xl font-bold tracking-tight text-white drop-shadow mb-0.5 sm:mb-1 uppercase leading-tight">{content.heroTitle}</h1>
               <p className="text-[10px] sm:text-xs font-medium text-gray-300 uppercase tracking-widest">{content.heroSubtitle}</p>
            </div>
          </section>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-0 md:px-4 pt-0 pb-0">
        <section className="p-5 sm:p-6 md:p-8 bg-gray-900 rounded-none md:rounded-[20px] shadow-none md:shadow-sm overflow-hidden space-y-6">
           <div className="flex flex-col lg:flex-row gap-5 sm:gap-8 items-center">
              <div className="flex-1 space-y-3">
                 <h2 className="text-xl xs:text-2xl md:text-3xl font-bold uppercase text-white tracking-tight">{content.introTitle}</h2>
                 <p className="text-sm xs:text-base md:text-lg leading-relaxed text-gray-300 font-normal whitespace-pre-line">{content.introText}</p>
                 <div className="pt-2">
                    <button 
                      onClick={() => window.open('https://open.kakao.com/o/gprQnKSi', '_blank')}
                      className="w-full sm:w-auto bg-[#0A7E54] hover:bg-[#086945] text-white px-6 py-3 rounded-2xl font-semibold active:scale-95 transition-all duration-200 text-xs xs:text-sm uppercase tracking-wider whitespace-nowrap cursor-pointer"
                    >
                      VIP 프라이빗 상담 신청
                    </button>
                 </div>
              </div>
              <div className="flex-1 w-full">
                 <img src={getFreshImageUrl(content.introImage)} className="w-full h-[200px] xs:h-[240px] md:h-[280px] object-cover rounded-2xl" alt="Nightlife" />
              </div>
           </div>

           <PageSectionList sections={content.sections} />

           <div className="text-left">
              <h3 className="text-base xs:text-lg font-bold text-white uppercase tracking-wider mb-3">HCMC Night Collection</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
                 {content.galleryImages.map((img, idx) => (
                    <div key={idx} className="group relative overflow-hidden rounded-2xl h-32 xs:h-36 sm:h-40 bg-zinc-900">
                       <img src={getFreshImageUrl(img)} className="w-full h-full object-cover transform group-hover:scale-105 transition duration-500" alt={`Men ${idx}`} />
                       <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-100 transition-opacity p-2.5 flex items-end">
                          <p className="text-emerald-300 font-semibold text-[10px] uppercase">Private Club {idx + 1}</p>
                       </div>
                    </div>
                 ))}
              </div>
           </div>
        </section>
      </div>
    </div>
  );
};

export default ForMenPage;
