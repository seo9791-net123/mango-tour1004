
import React from 'react';
import { PageContent } from '../types';
import PageSectionList from './PageSectionList';

interface Props {
  content: PageContent;
  onBack: () => void;
}

const TourPage: React.FC<Props> = ({ content, onBack }) => {
  return (
    <div className="min-h-screen bg-white text-black font-sans overflow-x-hidden animate-fade-in pb-20 md:pb-0">
      {/* Compact Hero - 180px */}
      <section className="relative h-[180px] flex items-center justify-center overflow-hidden bg-black">
        <div className="absolute inset-0 z-0">
          <img src={content.heroImage} alt="Hero" className="w-full h-full object-cover opacity-60" />
          <div className="absolute inset-0 bg-black/40"></div>
        </div>
        
        <div className="absolute top-4 left-4 z-50">
          <button onClick={onBack} className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/30 transition text-white shadow-lg">←</button>
        </div>

        <div className="relative z-10 text-center px-4">
           <h1 className="text-3xl md:text-5xl font-bold text-white mb-1 uppercase drop-shadow-2xl" style={{ fontFamily: 'serif' }}>{content.heroTitle}</h1>
           <p className="text-sm md:text-base font-bold text-gold-400 tracking-[0.3em] uppercase">{content.heroSubtitle}</p>
        </div>
      </section>

      <section className="py-8 max-w-7xl mx-auto px-4">
        <div className="text-left mb-8">
           <h2 className="text-2xl md:text-3xl font-black text-deepgreen uppercase mb-2">{content.introTitle}</h2>
           <div className="h-1 w-16 bg-gold-500 mb-4"></div>
           <p className="text-lg leading-relaxed text-gray-700 font-bold whitespace-pre-line mb-8">{content.introText}</p>
           
           <PageSectionList sections={content.sections} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-8">
           {content.galleryImages.map((img, idx) => (
              <div key={idx} className="group overflow-hidden rounded-xl shadow-md h-40 relative">
                 <img src={img} className="w-full h-full object-cover transform group-hover:scale-110 transition duration-700" alt={`Tour ${idx}`} />
              </div>
           ))}
        </div>
      </section>
    </div>
  );
};

export default TourPage;
