
import React from 'react';
import { PageContent } from '../types';
import PageSectionList from './PageSectionList';
import BackButton from './BackButton';

interface Props {
  content: PageContent;
  onBack: () => void;
}

const TourPage: React.FC<Props> = ({ content, onBack }) => {
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
           <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-black text-white mb-1 uppercase drop-shadow-2xl">{content.heroTitle}</h1>
           <p className="text-[11px] xs:text-xs md:text-sm font-bold text-gold-400 tracking-[0.25em] uppercase">{content.heroSubtitle}</p>
        </div>
      </section>

      <section className="py-6 xs:py-8 max-w-7xl mx-auto px-3 xs:px-4">
        <div className="text-left mb-6 xs:mb-8">
           <h2 className="text-xl xs:text-2xl md:text-3xl font-black text-deepgreen uppercase mb-2 tracking-tight">{content.introTitle}</h2>
           <div className="h-1 w-12 xs:w-16 bg-gold-500 mb-3 xs:mb-4 rounded-full"></div>
           <p className="text-sm xs:text-base md:text-lg leading-relaxed text-gray-700 font-medium whitespace-pre-line mb-6 xs:mb-8">{content.introText}</p>
           
           <PageSectionList sections={content.sections} />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 xs:gap-3.5 mt-6 xs:mt-8">
           {content.galleryImages.map((img, idx) => (
              <div key={idx} className="group overflow-hidden rounded-xl shadow-sm h-32 xs:h-36 sm:h-40 relative bg-gray-100">
                 <img src={img} className="w-full h-full object-cover transform group-hover:scale-105 transition duration-500" alt={`Tour ${idx}`} />
              </div>
           ))}
        </div>
      </section>
    </div>
  );
};

export default TourPage;

