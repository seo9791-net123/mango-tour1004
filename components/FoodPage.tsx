
import React, { useState } from 'react';
import { PageContent } from '../types';
import SliderPopup from './SliderPopup';

interface Props {
  content: PageContent;
  onBack: () => void;
}

const FoodPage: React.FC<Props> = ({ content, onBack }) => {
  const [isSliderOpen, setIsSliderOpen] = useState(false);

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
           <h1 className="text-3xl md:text-4xl font-bold text-white mb-1 uppercase drop-shadow-xl">{content.heroTitle}</h1>
           <p className="text-xs md:text-sm text-gold-400 font-bold tracking-widest">{content.heroSubtitle}</p>
        </div>
      </section>

      <section className="py-12 max-w-7xl mx-auto px-4">
        <div className="text-center mb-10">
           <h2 className="text-2xl md:text-3xl font-bold uppercase mb-3 text-deepgreen">{content.introTitle}</h2>
           <div className="h-1 w-16 bg-gold-500 mx-auto mb-6"></div>
           <p className="max-w-4xl mx-auto text-xl leading-relaxed text-gray-700 font-bold">{content.introText}</p>
           {content.slides && content.slides.length > 0 && (
              <button 
                onClick={() => setIsSliderOpen(true)}
                className="mt-6 px-8 py-3 bg-deepgreen text-white rounded-xl font-bold text-sm hover:bg-gold-600 transition shadow-lg flex items-center gap-2 mx-auto"
              >
                <span>🖼️</span> 상세 갤러리 슬라이드 보기
              </button>
           )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
           <div 
             className="md:col-span-2 lg:col-span-2 relative h-[300px] overflow-hidden rounded-2xl shadow-xl group cursor-pointer"
             onClick={() => content.slides && content.slides.length > 0 && setIsSliderOpen(true)}
           >
              <img src={content.introImage} className="w-full h-full object-cover group-hover:scale-[1.02] transition duration-500" alt="Main Food" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-6">
                 <div className="text-white">
                    <h3 className="text-2xl font-black mb-1">Signature Vietnamese Dish</h3>
                    <p className="text-sm font-bold opacity-90">베트남의 영혼을 담은 최고의 요리를 만나보세요.</p>
                 </div>
              </div>
              {content.slides && content.slides.length > 0 && (
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-500">
                  <span className="text-white font-bold text-sm bg-black/40 px-4 py-2 rounded-full backdrop-blur-sm">슬라이드 보기</span>
                </div>
              )}
           </div>
           {content.sections.map((section, idx) => (
               <div key={idx} className="bg-gray-50 border border-gray-100 p-6 rounded-2xl shadow-sm flex flex-col justify-center hover:bg-white hover:shadow-md transition">
                  <h4 className="text-2xl font-black mb-3 text-gold-600">{section.title}</h4>
                  <p className="text-gray-700 text-lg font-bold leading-relaxed">{section.content}</p>
               </div>
           ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            {content.galleryImages.map((img, idx) => (
                <div key={idx} className="group overflow-hidden rounded-xl shadow-md h-32 relative">
                   <img src={img} className="w-full h-full object-cover transform group-hover:scale-110 transition duration-700" alt={`Food Gallery ${idx}`} />
                </div>
            ))}
        </div>
      </section>
      
      <section className="py-10 bg-gray-50 border-t">
         <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div className="space-y-2">
               <div className="text-2xl">🍜</div>
               <h4 className="text-sm font-bold text-deepgreen">오리지널 쌀국수</h4>
               <p className="text-gray-400 text-[9px]">깊고 진한 육수의 베트남 전통 맛집만을 엄선하여 안내합니다.</p>
            </div>
            <div className="space-y-2">
               <div className="text-2xl">🦞</div>
               <h4 className="text-sm font-bold text-deepgreen">붕따우 해산물</h4>
               <p className="text-gray-400 text-[9px]">항구 도시 붕따우의 신선한 해산물을 즐기세요.</p>
            </div>
            <div className="space-y-2">
               <div className="text-2xl">🍹</div>
               <h4 className="text-sm font-bold text-deepgreen">루프탑 디너</h4>
               <p className="text-gray-400 text-[9px]">호치민 시내의 화려한 야경과 함께하는 로맨틱한 정찬입니다.</p>
            </div>
         </div>
      </section>

      {isSliderOpen && content.slides && (
        <SliderPopup slides={content.slides} onClose={() => setIsSliderOpen(false)} />
      )}
    </div>
  );
};

export default FoodPage;
