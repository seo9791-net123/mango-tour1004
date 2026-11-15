
import React from 'react';
import { PageContent } from '../types';
import PageSectionList from './PageSectionList';
import BackButton from './BackButton';
import { getFreshImageUrl } from '../utils/imageUtils';

interface Props {
  content: PageContent;
  onBack: () => void;
}

const TourPage: React.FC<Props> = ({ content, onBack }) => {
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
               <h1 className="text-xl xs:text-2xl sm:text-3xl md:text-5xl font-bold text-white mb-0.5 sm:mb-1 uppercase drop-shadow tracking-tight">{content.heroTitle}</h1>
               <p className="text-[10px] xs:text-[11px] md:text-sm font-semibold text-emerald-300 tracking-[0.2em] uppercase">{content.heroSubtitle}</p>
            </div>
          </section>
        </div>
      </div>

      <section className="pt-0 pb-0 max-w-7xl mx-auto px-3 sm:px-4 space-y-3 sm:space-y-4">
        <div className="bg-white rounded-[20px] shadow-sm p-5 sm:p-6 md:p-7 text-left">
           <h2 className="text-xl xs:text-2xl md:text-3xl font-bold text-gray-900 uppercase mb-2 tracking-tight">{content.introTitle}</h2>
           <p className="text-sm xs:text-base md:text-lg leading-relaxed text-[#3A3A3C] font-normal whitespace-pre-line">{content.introText}</p>
        </div>
           
        <PageSectionList sections={content.sections} />

        <div className="bg-white rounded-[20px] shadow-sm p-5 sm:p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
             {content.galleryImages.map((img, idx) => (
                <div key={idx} className="group overflow-hidden rounded-2xl h-32 xs:h-36 sm:h-40 relative bg-[#F2F2F7]">
                   <img src={getFreshImageUrl(img)} className="w-full h-full object-cover transform group-hover:scale-105 transition duration-500" alt={`Tour ${idx}`} />
                </div>
             ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default TourPage;

