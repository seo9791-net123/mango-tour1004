import React from 'react';
import { PageContent } from '../types';
import PageSectionList from './PageSectionList';
import BackButton from './BackButton';
import { getFreshImageUrl } from '../utils/imageUtils';

interface Props {
  content: PageContent;
  onBack: () => void;
}

const CulturePage: React.FC<Props> = ({ content, onBack }) => {
  return (
    <div className="min-h-screen bg-[#fcfcf7] text-black font-sans overflow-x-clip animate-fade-in pb-safe md:pb-0">
      {/* Sticky Compact Hero */}
      <div
        className="sticky z-20 w-full bg-[#fcfcf7] pb-2 sm:pb-3"
        style={{ top: 'var(--site-header-height, 45px)' }}
      >
        <div className="max-w-7xl mx-auto px-0 sm:px-4 pt-0 sm:pt-3">
          <section className="relative h-[140px] sm:h-[156px] md:h-[240px] lg:h-[260px] flex items-center justify-center overflow-hidden bg-black rounded-none sm:rounded-2xl md:rounded-3xl shadow-md">
            <div className="absolute inset-0 z-0">
              <img src={getFreshImageUrl(content.heroImage)} alt="Hero" className="w-full h-full object-cover object-center opacity-60" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/30"></div>
            </div>
            
            <div className="absolute top-2.5 left-2.5 sm:top-3.5 sm:left-3.5 md:top-4 md:left-4 z-50">
              <BackButton onClick={onBack} variant="hero" label="뒤로가기" />
            </div>

            <div className="relative z-10 text-center animate-fade-in-up px-4 pt-4 sm:pt-2 md:pt-0">
               <h1 className="text-xl xs:text-2xl sm:text-3xl md:text-5xl font-black text-white mb-0.5 sm:mb-1 uppercase drop-shadow-2xl">{content.heroTitle}</h1>
               <p className="text-[10px] xs:text-[11px] md:text-sm font-bold tracking-[0.2em] sm:tracking-[0.25em] text-gold-400 uppercase">{content.heroSubtitle}</p>
            </div>
          </section>
        </div>
      </div>

      <section className="pt-3 pb-5 sm:pt-5 sm:pb-8 max-w-7xl mx-auto px-0 sm:px-4">
         <div className="flex flex-col lg:flex-row gap-4 sm:gap-8 items-center mb-5 sm:mb-8">
            <div className="w-full flex-1 order-2 lg:order-1 relative group">
               <img src={getFreshImageUrl(content.introImage)} className="w-full h-[200px] xs:h-[240px] md:h-[280px] object-cover rounded-none sm:rounded-2xl shadow-lg group-hover:scale-[1.02] transition duration-500" alt="Intro" />
            </div>
            <div className="flex-1 order-1 lg:order-2 space-y-2.5 xs:space-y-3 px-2.5 sm:px-0">
               <h2 className="text-xl xs:text-2xl md:text-3xl font-black text-deepgreen uppercase leading-tight tracking-tight">{content.introTitle}</h2>
               <div className="h-1 w-12 xs:w-16 bg-gold-500 rounded-full"></div>
               <p className="text-sm xs:text-base md:text-lg leading-relaxed text-gray-700 font-medium whitespace-pre-line">{content.introText}</p>
            </div>
         </div>

         <div className="mb-5 sm:mb-8">
           <PageSectionList sections={content.sections} />
         </div>

         <div className="text-center mb-5 sm:mb-8 px-2.5 sm:px-0">
            <h3 className="text-lg xs:text-xl font-bold uppercase tracking-wide text-deepgreen">Culture & Beauty Collection</h3>
            <div className="w-10 h-0.5 bg-gold-500 mx-auto mt-1 rounded-full"></div>
         </div>
         <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5 sm:gap-3.5">
            {content.galleryImages.map((img, idx) => (
                <div key={idx} className="group relative h-32 xs:h-36 sm:h-40 overflow-hidden rounded-none sm:rounded-xl shadow-sm bg-gray-100">
                   <img src={getFreshImageUrl(img)} className="w-full h-full object-cover transform group-hover:scale-105 transition duration-500" alt={`Culture ${idx}`} />
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
