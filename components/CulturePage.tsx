
import React from 'react';
import { PageContent } from '../types';
import PageSectionList from './PageSectionList';

interface Props {
  content: PageContent;
  onBack: () => void;
}

const CulturePage: React.FC<Props> = ({ content, onBack }) => {
  return (
    <div className="min-h-screen bg-[#fcfcf7] text-black font-sans overflow-x-hidden animate-fade-in">
      {/* Compact Hero - 180px */}
      <section className="relative h-[180px] flex items-center justify-center overflow-hidden bg-black">
        <div className="absolute inset-0 z-0">
          <img src={content.heroImage} alt="Hero" className="w-full h-full object-cover opacity-60" />
          <div className="absolute inset-0 bg-black/40"></div>
        </div>
        
        <div className="absolute top-4 left-4 z-50">
          <button onClick={onBack} className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/30 transition text-white shadow-lg">←</button>
        </div>

        <div className="relative z-10 text-center animate-fade-in-up px-4">
           <h1 className="text-3xl md:text-5xl font-bold text-white mb-2 uppercase drop-shadow-2xl" style={{ fontFamily: 'serif' }}>{content.heroTitle}</h1>
           <p className="text-xs md:text-sm font-light tracking-[0.4em] text-gold-400 uppercase font-bold">{content.heroSubtitle}</p>
        </div>
      </section>

      <section className="py-12 max-w-7xl mx-auto px-4">
         <div className="flex flex-col lg:flex-row gap-8 items-center mb-12">
            <div className="flex-1 order-2 lg:order-1 relative group">
               <img src={content.introImage} className="w-full h-[300px] object-cover rounded-2xl shadow-xl group-hover:scale-[1.02] transition duration-500" alt="Intro" />
            </div>
            <div className="flex-1 order-1 lg:order-2 space-y-4">
               <h2 className="text-3xl md:text-4xl font-black text-deepgreen uppercase leading-tight">{content.introTitle}</h2>
               <div className="h-1 w-16 bg-gold-500"></div>
               <p className="text-xl leading-relaxed text-gray-700 font-bold whitespace-pre-line">{content.introText}</p>
            </div>
         </div>

         <div className="mb-12">
           <PageSectionList sections={content.sections} />
         </div>

         <div className="text-center mb-8">
            <h3 className="text-xl font-bold uppercase tracking-widest text-deepgreen">Culture & Beauty Collection</h3>
            <div className="w-10 h-0.5 bg-gold-500 mx-auto mt-1"></div>
         </div>
         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {content.galleryImages.map((img, idx) => (
                <div key={idx} className="group relative h-40 overflow-hidden rounded-xl shadow-md">
                   <img src={img} className="w-full h-full object-cover transform group-hover:scale-105 transition duration-700" alt={`Culture ${idx}`} />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex items-end">
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
