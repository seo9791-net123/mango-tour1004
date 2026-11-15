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

            <div className="relative z-10 text-center animate-fade-in-up px-4 pt-4 sm:pt-2 md:pt-0">
               <h1 className="text-xl xs:text-2xl sm:text-3xl md:text-5xl font-bold text-white mb-0.5 sm:mb-1 uppercase drop-shadow tracking-tight">{content.heroTitle}</h1>
               <p className="text-[10px] xs:text-[11px] md:text-sm font-semibold tracking-[0.2em] text-emerald-300 uppercase">{content.heroSubtitle}</p>
            </div>
          </section>
        </div>
      </div>

      <section className="pt-0 pb-0 max-w-7xl mx-auto px-3 sm:px-4 space-y-3 sm:space-y-4">
         <div className="bg-white rounded-[20px] shadow-sm p-5 sm:p-6 md:p-7 flex flex-col lg:flex-row gap-5 sm:gap-8 items-center">
            <div className="w-full flex-1 order-2 lg:order-1 relative group">
               <img src={getFreshImageUrl(content.introImage)} className="w-full h-[200px] xs:h-[240px] md:h-[280px] object-cover rounded-2xl group-hover:scale-[1.02] transition duration-500" alt="Intro" />
            </div>
            <div className="flex-1 order-1 lg:order-2 space-y-3">
               <h2 className="text-xl xs:text-2xl md:text-3xl font-bold text-gray-900 uppercase leading-tight tracking-tight">{content.introTitle}</h2>
               <p className="text-sm xs:text-base md:text-lg leading-relaxed text-[#3A3A3C] font-normal whitespace-pre-line">{content.introText}</p>
            </div>
         </div>

         <PageSectionList sections={content.sections} />

         <div className="bg-white rounded-[20px] shadow-sm p-5 sm:p-6 md:p-7">
           <div className="text-left mb-4">
              <h3 className="text-lg xs:text-xl font-bold tracking-tight text-gray-900">Culture & Beauty Collection</h3>
           </div>
           <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
              {content.galleryImages.map((img, idx) => (
                  <div key={idx} className="group relative h-32 xs:h-36 sm:h-40 overflow-hidden rounded-2xl bg-[#F2F2F7]">
                     <img src={getFreshImageUrl(img)} className="w-full h-full object-cover transform group-hover:scale-105 transition duration-500" alt={`Culture ${idx}`} />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-2.5 flex items-end">
                        <p className="text-white font-semibold text-[10px]">Vietnam Heritage {idx + 1}</p>
                     </div>
                  </div>
              ))}
           </div>
         </div>
      </section>
    </div>
  );
};

export default CulturePage;
