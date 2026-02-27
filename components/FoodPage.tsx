
import React from 'react';
import { PageContent } from '../types';
import PageSectionList from './PageSectionList';

interface Props {
  content: PageContent;
  onBack: () => void;
}

const FoodPage: React.FC<Props> = ({ content, onBack }) => {
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
           <h1 className="text-3xl md:text-4xl font-bold text-white mb-1 uppercase drop-shadow-xl">{content.heroTitle}</h1>
           <p className="text-xs md:text-sm text-gold-400 font-bold tracking-widest">{content.heroSubtitle}</p>
        </div>
      </section>

      <section className="py-8 max-w-7xl mx-auto px-4">
        <div className="text-left mb-6">
           <h2 className="text-xl md:text-2xl font-bold uppercase mb-2 text-deepgreen">{content.introTitle}</h2>
           <div className="h-1 w-16 bg-gold-500 mb-4"></div>
           <p className="text-lg leading-relaxed text-gray-700 font-bold mb-8">{content.introText}</p>
           
           <PageSectionList sections={content.sections} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
           <div className="md:col-span-2 lg:col-span-2 relative h-[300px] overflow-hidden rounded-2xl shadow-xl group">
              <img src={content.introImage} className="w-full h-full object-cover group-hover:scale-[1.02] transition duration-500" alt="Main Food" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-6">
                 <div className="text-white">
                    <h3 className="text-2xl font-black mb-1">Signature Vietnamese Dish</h3>
                    <p className="text-sm font-bold opacity-90">베트남의 영혼을 담은 최고의 요리를 만나보세요.</p>
                 </div>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-4">
            {content.galleryImages.map((img, idx) => (
                <div key={idx} className="group overflow-hidden rounded-xl shadow-md h-40 relative">
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
    </div>
  );
};

export default FoodPage;
