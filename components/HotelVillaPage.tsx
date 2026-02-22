
import React from 'react';
import { PageContent } from '../types';

interface Props {
  content: PageContent;
  onBack: () => void;
}

const HotelVillaPage: React.FC<Props> = ({ content, onBack }) => {
  return (
    <div className="min-h-screen bg-white text-black font-sans overflow-x-hidden animate-fade-in">
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
           <h1 className="text-3xl md:text-4xl font-bold tracking-tighter text-white drop-shadow-2xl mb-1 uppercase leading-tight" style={{ fontFamily: 'serif' }}>{content.heroTitle}</h1>
           <p className="text-sm md:text-base font-light tracking-[0.2em] text-gold-400 uppercase">{content.heroSubtitle}</p>
        </div>
      </section>

      <section className="py-12 bg-white text-black">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-8 items-center mb-12">
             <div className="flex-1 space-y-4">
                <h2 className="text-3xl md:text-4xl font-black uppercase leading-tight text-deepgreen">{content.introTitle}</h2>
                <div className="h-1 w-16 bg-gold-500"></div>
                <p className="text-xl leading-relaxed text-gray-700 font-bold whitespace-pre-line">{content.introText}</p>
             </div>
             <div className="flex-1 relative">
                <img src={content.introImage} className="w-full h-[250px] object-cover rounded-3xl shadow-xl" alt="Intro" />
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
             {content.sections.map((section, idx) => (
                <div key={idx} className="p-6 bg-gray-50 rounded-2xl border border-gray-100 shadow-sm flex flex-col h-full hover:shadow-md transition">
                   <h3 className="text-2xl font-black text-deepgreen mb-3">{section.title}</h3>
                   <p className="text-gray-600 font-bold leading-relaxed text-lg flex-1">{section.content}</p>
                </div>
             ))}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
             {content.galleryImages.map((img, idx) => (
                <div key={idx} className="group overflow-hidden rounded-xl shadow-md h-48 relative">
                   <img src={img} className="w-full h-full object-cover transform group-hover:scale-110 transition duration-700" alt={`Villa ${idx}`} />
                   <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors duration-500"></div>
                   <div className="absolute bottom-3 left-3 text-white">
                      <p className="text-[9px] uppercase font-bold text-gold-400">Accommodation</p>
                      <h4 className="text-[11px] font-bold">Stay Gallery {idx + 1}</h4>
                   </div>
                </div>
             ))}
          </div>
        </div>
      </section>
      
      <section className="py-12 bg-[#f8f9fa] text-center">
         <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-xl font-bold mb-4 text-deepgreen">완벽한 휴식을 위한 큐레이션</h2>
            <div className="flex flex-wrap justify-center gap-2">
               <span className="bg-white px-4 py-1.5 rounded-full border border-gray-200 text-[10px] font-bold shadow-sm">#5성급호텔</span>
               <span className="bg-white px-4 py-1.5 rounded-full border border-gray-200 text-[10px] font-bold shadow-sm">#독채풀빌라</span>
               <span className="bg-white px-4 py-1.5 rounded-full border border-gray-200 text-[10px] font-bold shadow-sm">#오션뷰리조트</span>
               <span className="bg-white px-4 py-1.5 rounded-full border border-gray-200 text-[10px] font-bold shadow-sm">#시내중심</span>
            </div>
         </div>
      </section>
    </div>
  );
};

export default HotelVillaPage;
