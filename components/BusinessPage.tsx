import React from 'react';
import { PageContent } from '../types';
import PageSectionList from './PageSectionList';
import BackButton from './BackButton';

interface Props {
  content: PageContent;
  onBack: () => void;
}

const BusinessPage: React.FC<Props> = ({ content, onBack }) => {
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
           <h1 className="text-2xl xs:text-3xl md:text-4xl font-black tracking-wide text-gold-400 drop-shadow-2xl mb-1 uppercase">{content.heroTitle}</h1>
           <p className="text-[10px] xs:text-xs tracking-[0.4em] text-white uppercase font-bold opacity-90">{content.heroSubtitle}</p>
        </div>
      </section>

      <section className="py-6 xs:py-8 bg-[#f8f9fa] text-black">
        <div className="max-w-7xl mx-auto px-3 xs:px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 xs:gap-8 items-center mb-6 xs:mb-8">
             <div className="space-y-3">
                <h2 className="text-xl xs:text-2xl md:text-3xl font-black text-deepgreen uppercase leading-tight tracking-tight whitespace-pre-line">{content.introTitle}</h2>
                <div className="h-1 w-12 xs:w-16 bg-gold-500 rounded-full"></div>
                <p className="text-sm xs:text-base md:text-lg leading-relaxed font-medium text-gray-700 whitespace-pre-line">{content.introText}</p>
             </div>
             <div className="relative group">
                <img src={content.introImage} className="w-full h-[200px] xs:h-[240px] md:h-[280px] object-cover rounded-2xl xs:rounded-3xl shadow-lg group-hover:scale-[1.02] transition duration-500" alt="Intro" />
             </div>
          </div>

          <PageSectionList sections={content.sections} />
        </div>
      </section>

      <section className="py-6 xs:py-8 bg-white">
         <div className="max-w-7xl mx-auto px-3 xs:px-4">
            <div className="text-center mb-6">
               <h3 className="text-gold-600 font-extrabold tracking-widest text-[10px] xs:text-xs mb-0.5 uppercase">GALLERY</h3>
               <h2 className="text-xl xs:text-2xl font-black uppercase text-deepgreen">비즈니스 VIP 갤러리</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 xs:gap-3.5">
               {content.galleryImages.map((img, idx) => (
                  <div key={idx} className="group relative overflow-hidden rounded-xl shadow-sm h-32 xs:h-36 sm:h-40 bg-gray-100">
                     <img src={img} className="w-full h-full object-cover transform group-hover:scale-105 transition duration-500" alt={`Gallery ${idx}`} />
                     <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-2.5">
                        <p className="text-white font-bold text-[10px] uppercase">VIP Service {idx + 1}</p>
                     </div>
                  </div>
               ))}
            </div>
         </div>
      </section>
    </div>
  );
};

export default BusinessPage;
