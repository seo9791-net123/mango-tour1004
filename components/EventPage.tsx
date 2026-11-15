import React from 'react';
import { PageContent } from '../types';
import PageSectionList from './PageSectionList';
import BackButton from './BackButton';
import { getFreshImageUrl } from '../utils/imageUtils';

interface Props {
  content: PageContent;
  onBack: () => void;
  isLoggedIn?: boolean;
  onReqLogin?: () => void;
}

const EventPage: React.FC<Props> = ({ content, onBack }) => {
  return (
    <div className="min-h-screen bg-[#f8f9fa] text-black font-sans overflow-x-clip animate-fade-in pb-safe md:pb-0">
      {/* Sticky Compact Hero */}
      <div
        className="sticky z-20 w-full bg-[#f8f9fa] pb-2 sm:pb-3"
        style={{ top: 'var(--site-header-height, 45px)' }}
      >
        <div className="max-w-7xl mx-auto px-0 sm:px-4 pt-0 sm:pt-3">
          <section className="relative h-[144px] sm:h-[158px] md:h-[240px] lg:h-[260px] flex items-center justify-center overflow-hidden bg-black rounded-none sm:rounded-2xl md:rounded-3xl shadow-md">
            <div className="absolute inset-0 z-0">
              <img src={getFreshImageUrl(content.heroImage)} alt="Hero" className="w-full h-full object-cover object-center opacity-60" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/30"></div>
            </div>
            
            <div className="absolute top-2.5 left-2.5 sm:top-3.5 sm:left-3.5 md:top-4 md:left-4 z-50">
              <BackButton onClick={onBack} variant="hero" label="뒤로가기" />
            </div>

            <div className="relative z-10 text-center animate-fade-in-up px-4 pt-5 sm:pt-3 md:pt-0">
               <h1 className="text-xl xs:text-2xl sm:text-3xl md:text-5xl font-black text-white mb-0.5 sm:mb-1 uppercase drop-shadow-2xl">{content.heroTitle}</h1>
               <p className="text-[10px] xs:text-[11px] md:text-sm text-gold-400 font-bold tracking-widest">{content.heroSubtitle}</p>
               <div className="mt-1 sm:mt-2 inline-block px-2.5 sm:px-3 py-0.5 sm:py-1 bg-red-600 text-white rounded-full text-[9px] xs:text-[10px] font-bold shadow-md tracking-wider uppercase">LIMITED OFFERS</div>
            </div>
          </section>
        </div>
      </div>

      <section className="pt-3 pb-5 sm:pt-5 sm:pb-8 max-w-7xl mx-auto px-0 sm:px-4">
        <div className="text-left mb-5 sm:mb-8">
           <div className="px-2.5 sm:px-0">
              <h2 className="text-xl xs:text-2xl md:text-3xl font-black text-deepgreen uppercase mb-2 tracking-tight">{content.introTitle}</h2>
              <div className="h-1 w-12 xs:w-16 bg-gold-500 mb-3 xs:mb-4 rounded-full"></div>
              <p className="text-sm xs:text-base md:text-lg leading-relaxed text-gray-700 font-medium whitespace-pre-line mb-5 sm:mb-8">{content.introText}</p>
           </div>
           
           <PageSectionList sections={content.sections} />
        </div>

        <div className="mt-5 sm:mt-8">
           <div className="text-left mb-4 px-2.5 sm:px-0">
              <h3 className="text-gold-600 font-extrabold tracking-widest text-[10px] xs:text-xs mb-0.5 uppercase">EVENT GALLERY</h3>
              <h2 className="text-xl xs:text-2xl font-black uppercase text-deepgreen">이벤트 현장 갤러리</h2>
           </div>
           <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5 sm:gap-3.5">
              {content.galleryImages.map((img, idx) => (
                 <div key={idx} className="group relative overflow-hidden rounded-none sm:rounded-xl shadow-sm h-32 xs:h-36 sm:h-40 bg-gray-100">
                    <img src={getFreshImageUrl(img)} className="w-full h-full object-cover transform group-hover:scale-105 transition duration-500" alt={`Event Gallery ${idx}`} />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                       <span className="text-white text-[10px] font-bold border border-white/40 px-3 py-1 rounded-full backdrop-blur-sm">VIEW</span>
                    </div>
                 </div>
              ))}
           </div>
        </div>
      </section>
    </div>
  );
};

export default EventPage;
