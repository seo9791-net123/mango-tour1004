
import React, { useState } from 'react';
import { PageContent } from '../types';
import SliderPopup from './SliderPopup';

interface Props {
  content: PageContent;
  onBack: () => void;
}

const CulturePage: React.FC<Props> = ({ content, onBack }) => {
  const [isSliderOpen, setIsSliderOpen] = useState(false);

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
            <div className="flex-1 order-2 lg:order-1 relative group cursor-pointer" onClick={() => content.slides && content.slides.length > 0 && setIsSliderOpen(true)}>
               <img src={content.introImage} className="w-full h-[300px] object-cover rounded-2xl shadow-xl group-hover:scale-[1.02] transition duration-500" alt="Intro" />
               {content.slides && content.slides.length > 0 && (
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-500">
                    <span className="text-white font-bold text-sm bg-black/40 px-4 py-2 rounded-full backdrop-blur-sm">슬라이드 보기</span>
                  </div>
                )}
            </div>
            <div className="flex-1 order-1 lg:order-2 space-y-4">
               <h2 className="text-3xl md:text-4xl font-black text-deepgreen uppercase leading-tight">{content.introTitle}</h2>
               <div className="h-1 w-16 bg-gold-500"></div>
               <p className="text-xl leading-relaxed text-gray-700 font-bold whitespace-pre-line">{content.introText}</p>
               {content.slides && content.slides.length > 0 && (
                  <button 
                    onClick={() => setIsSliderOpen(true)}
                    className="mt-4 px-6 py-3 bg-deepgreen text-white rounded-xl font-bold text-sm hover:bg-gold-600 transition shadow-lg flex items-center gap-2"
                  >
                    <span>🖼️</span> 상세 갤러리 슬라이드 보기
                  </button>
                )}
               <div className="grid grid-cols-1 gap-3">
                  {content.sections.map((section, idx) => (
                     <div key={idx} className="p-5 bg-white rounded-xl border border-gray-100 shadow-sm flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-gold-50 flex items-center justify-center shrink-0 text-gold-600 font-black text-sm">0{idx+1}</div>
                        <div>
                          <p className="font-black text-gold-700 mb-1 text-xl">{section.title}</p>
                          <p className="text-base text-gray-600 font-bold leading-relaxed">{section.content}</p>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         </div>

         <div className="text-center mb-8">
            <h3 className="text-xl font-bold uppercase tracking-widest text-deepgreen">Culture & Beauty Collection</h3>
            <div className="w-10 h-0.5 bg-gold-500 mx-auto mt-1"></div>
         </div>
         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {content.galleryImages.map((img, idx) => (
                <div key={idx} className="group relative h-60 overflow-hidden rounded-2xl shadow-md">
                   <img src={img} className="w-full h-full object-cover transform group-hover:scale-105 transition duration-700" alt={`Culture ${idx}`} />
                   <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex items-end">
                      <p className="text-white font-bold text-[10px]">Vietnam Heritage {idx + 1}</p>
                   </div>
                </div>
            ))}
         </div>
      </section>

      {isSliderOpen && content.slides && (
        <SliderPopup slides={content.slides} onClose={() => setIsSliderOpen(false)} />
      )}
    </div>
  );
};

export default CulturePage;
