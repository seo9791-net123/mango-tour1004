
import React from 'react';
import { PageContent } from '../types';

interface Props {
  content: PageContent;
  onBack: () => void;
}

const TourPage: React.FC<Props> = ({ content, onBack }) => {
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
           <h1 className="text-3xl md:text-5xl font-bold text-white mb-1 uppercase drop-shadow-2xl" style={{ fontFamily: 'serif' }}>{content.heroTitle}</h1>
           <p className="text-sm md:text-base font-bold text-gold-400 tracking-[0.3em] uppercase">{content.heroSubtitle}</p>
        </div>
      </section>

      <section className="py-12 max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
           <h2 className="text-3xl md:text-4xl font-black text-deepgreen uppercase mb-3">{content.introTitle}</h2>
           <div className="h-1 w-16 bg-gold-500 mx-auto mb-6"></div>
           <p className="max-w-4xl mx-auto text-xl leading-relaxed text-gray-700 font-bold whitespace-pre-line">{content.introText}</p>
        </div>

        <div className="space-y-16 mb-12">
           {Array.from({ length: Math.max(content.sections.length, content.galleryImages.length) }).map((_, idx) => {
              const section = content.sections[idx] || { title: '새로운 투어 코스', content: '상세 일정은 준비 중입니다.' };
              const image = content.galleryImages[idx] || (idx === 0 ? content.introImage : 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800');
              return (
                 <div key={idx} className={`flex flex-col lg:flex-row gap-8 items-center ${idx % 2 !== 0 ? 'lg:flex-row-reverse' : ''}`}>
                    <div className="flex-1 space-y-4">
                       <h3 className="text-3xl font-black text-deepgreen uppercase leading-tight">{section.title}</h3>
                       <div className="h-1 w-12 bg-gold-400"></div>
                       <p className="text-gray-600 leading-relaxed text-lg font-bold">{section.content}</p>
                       <button className="text-gold-600 font-bold text-xs uppercase hover:underline">일정 보기 +</button>
                    </div>
                    <div className="flex-1 w-full">
                       <img 
                         src={image} 
                         className="w-full h-[300px] object-cover rounded-2xl shadow-xl border border-gray-100" 
                         alt={section.title} 
                       />
                    </div>
                 </div>
              );
           })}
        </div>


      </section>
    </div>
  );
};

export default TourPage;
