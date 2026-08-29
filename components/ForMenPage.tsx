import React from 'react';
import { PageContent } from '../types';
import PageSectionList from './PageSectionList';
import BackButton from './BackButton';

interface Props {
  content: PageContent;
  onBack: () => void;
}

const ForMenPage: React.FC<Props> = ({ content, onBack }) => {
  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans overflow-x-hidden animate-fade-in pb-safe md:pb-0">
      {/* Compact Hero */}
      <section className="relative h-[160px] xs:h-[180px] sm:h-[220px] md:h-[260px] flex items-center justify-center overflow-hidden bg-black">
        <div className="absolute inset-0 z-0">
          <img src={content.heroImage} alt="Hero" className="w-full h-full object-cover opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-[#050505]"></div>
        </div>
        
        <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-50">
          <BackButton onClick={onBack} variant="hero" label="메인으로" />
        </div>

        <div className="relative z-10 text-center animate-fade-in-up px-4">
           <div className="mb-1.5 xs:mb-2 inline-block border-b border-gold-500">
             <p className="text-[10px] xs:text-xs font-bold tracking-[0.3em] uppercase text-gold-400">Exclusive Nightlife</p>
           </div>
           <h1 className="text-3xl xs:text-4xl md:text-5xl font-black tracking-tight text-white drop-shadow-2xl mb-1 uppercase leading-tight">{content.heroTitle}</h1>
           <p className="text-[10px] xs:text-xs font-medium text-gray-400 uppercase tracking-widest">{content.heroSubtitle}</p>
        </div>
      </section>

      <section className="py-6 xs:py-8 bg-[#0a0a0a] border-y border-white/5">
        <div className="max-w-7xl mx-auto px-3 xs:px-4">
           <div className="flex flex-col lg:flex-row gap-6 xs:gap-8 items-center mb-6 xs:mb-8">
              <div className="flex-1 space-y-3">
                 <h2 className="text-xl xs:text-2xl md:text-3xl font-black uppercase mb-2 text-gold-400 tracking-tight">{content.introTitle}</h2>
                 <div className="h-1 w-12 bg-gold-500 rounded-full"></div>
                 <p className="text-sm xs:text-base md:text-lg leading-relaxed text-gray-300 font-medium whitespace-pre-line">{content.introText}</p>
                 <div className="pt-2">
                    <button 
                      onClick={() => window.open('https://open.kakao.com/o/gSfNsh3h', '_blank')}
                      className="w-full xs:w-auto bg-gold-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-gold-500 active:scale-95 transition shadow-lg text-xs xs:text-sm uppercase tracking-wider"
                    >
                      VIP 프라이빗 상담 신청
                    </button>
                 </div>
              </div>
              <div className="flex-1 w-full">
                 <img src={content.introImage} className="w-full h-[200px] xs:h-[240px] md:h-[280px] object-cover rounded-2xl xs:rounded-3xl shadow-[0_0_20px_rgba(197,160,40,0.1)] border border-white/10" alt="Nightlife" />
              </div>
           </div>

           <div className="mb-6 xs:mb-8">
             <PageSectionList sections={content.sections} />
           </div>

           <div className="text-center mb-6">
              <h3 className="text-base xs:text-lg font-bold text-white uppercase tracking-wider border-b border-gold-500 inline-block pb-1">HCMC Night Collection</h3>
           </div>
           <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 xs:gap-3.5">
              {content.galleryImages.map((img, idx) => (
                 <div key={idx} className="group relative overflow-hidden rounded-xl shadow-sm h-32 xs:h-36 sm:h-40 bg-zinc-900 border border-white/5">
                    <img src={img} className="w-full h-full object-cover transform group-hover:scale-105 transition duration-500" alt={`Men ${idx}`} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-100 transition-opacity p-2.5 flex items-end">
                       <p className="text-gold-400 font-bold text-[10px] uppercase">Private Club {idx + 1}</p>
                    </div>
                 </div>
              ))}
           </div>
        </div>
      </section>
    </div>
  );
};

export default ForMenPage;
