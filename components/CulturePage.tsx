import React from 'react';
import { PageContent } from '../types';
import PageSectionList from './PageSectionList';
import BackButton from './BackButton';

interface Props {
  content: PageContent;
  onBack: () => void;
}

const CulturePage: React.FC<Props> = ({ content, onBack }) => {
  return (
    <div className="min-h-screen bg-[#fcfcf7] text-black font-sans overflow-x-hidden animate-fade-in pb-safe md:pb-0">
      {/* Compact Hero */}
      <section className="relative h-[160px] xs:h-[180px] sm:h-[220px] md:h-[260px] flex items-center justify-center overflow-hidden bg-black">
        <div className="absolute inset-0 z-0">
          <img src={content.heroImage} alt="Hero" className="w-full h-full object-cover opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/30"></div>
        </div>
        
        <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-50">
          <BackButton onClick={onBack} variant="hero" label="메인으로" />
        </div>

        <div className="relative z-10 text-center animate-fade-in-up px-4">
           <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-black text-white mb-1 uppercase drop-shadow-2xl">{content.heroTitle}</h1>
           <p className="text-[11px] xs:text-xs md:text-sm font-bold tracking-[0.25em] text-gold-400 uppercase">{content.heroSubtitle}</p>
        </div>
      </section>

      <section className="py-6 xs:py-8 max-w-7xl mx-auto px-3 xs:px-4">
         <div className="flex flex-col lg:flex-row gap-6 xs:gap-8 items-center mb-6 xs:mb-8">
            <div className="w-full flex-1 order-2 lg:order-1 relative group">
               <img src={content.introImage} className="w-full h-[200px] xs:h-[240px] md:h-[280px] object-cover rounded-2xl shadow-lg group-hover:scale-[1.02] transition duration-500" alt="Intro" />
            </div>
            <div className="flex-1 order-1 lg:order-2 space-y-2.5 xs:space-y-3">
               <h2 className="text-xl xs:text-2xl md:text-3xl font-black text-deepgreen uppercase leading-tight tracking-tight">{content.introTitle}</h2>
               <div className="h-1 w-12 xs:w-16 bg-gold-500 rounded-full"></div>
               <p className="text-sm xs:text-base md:text-lg leading-relaxed text-gray-700 font-medium whitespace-pre-line">{content.introText}</p>
            </div>
         </div>

         <div className="mb-6 xs:mb-8">
           <PageSectionList sections={content.sections} />
         </div>

         <div className="text-center mb-6 xs:mb-8">
            <h3 className="text-lg xs:text-xl font-bold uppercase tracking-wide text-deepgreen">Culture & Beauty Collection</h3>
            <div className="w-10 h-0.5 bg-gold-500 mx-auto mt-1 rounded-full"></div>
         </div>
         <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 xs:gap-3.5">
            {content.galleryImages.map((img, idx) => (
                <div key={idx} className="group relative h-32 xs:h-36 sm:h-40 overflow-hidden rounded-xl shadow-sm bg-gray-100">
                   <img src={img} className="w-full h-full object-cover transform group-hover:scale-105 transition duration-500" alt={`Culture ${idx}`} />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2.5 flex items-end">
                      <p className="text-white font-bold text-[10px]">Vietnam Heritage {idx + 1}</p>
                   </div>
                </div>
            ))}
         </div>
      </section>
    </div>
  );
};

export default CulturePage;
