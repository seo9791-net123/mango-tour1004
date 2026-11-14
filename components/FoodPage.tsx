import React from 'react';
import { PageContent } from '../types';
import PageSectionList from './PageSectionList';
import BackButton from './BackButton';
import { getFreshImageUrl } from '../utils/imageUtils';

interface Props {
  content: PageContent;
  onBack: () => void;
}

const FoodPage: React.FC<Props> = ({ content, onBack }) => {
  return (
    <div className="min-h-screen bg-white text-black font-sans overflow-x-hidden animate-fade-in pb-safe md:pb-0">
      {/* Compact Hero */}
      <div className="max-w-7xl mx-auto px-0 sm:px-4 pt-0 sm:pt-4 pb-1 sm:pb-0">
        <section className="relative h-[170px] xs:h-[190px] sm:h-[230px] md:h-[270px] flex items-center justify-center overflow-hidden bg-black rounded-none sm:rounded-2xl md:rounded-3xl shadow-md">
          <div className="absolute inset-0 z-0">
            <img src={getFreshImageUrl(content.heroImage)} alt="Hero" className="w-full h-full object-cover object-center opacity-60" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/30"></div>
          </div>
          
          <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-50">
            <BackButton onClick={onBack} variant="hero" label="뒤로가기" />
          </div>

          <div className="relative z-10 text-center px-4">
             <h1 className="text-2xl xs:text-3xl md:text-4xl font-black text-white mb-1 uppercase drop-shadow-xl">{content.heroTitle}</h1>
             <p className="text-[11px] xs:text-xs md:text-sm text-gold-400 font-bold tracking-widest">{content.heroSubtitle}</p>
          </div>
        </section>
      </div>

      <section className="py-5 sm:py-8 max-w-7xl mx-auto px-0 sm:px-4">
        <div className="text-left mb-5 sm:mb-8">
           <div className="px-2.5 sm:px-0">
              <h2 className="text-xl xs:text-2xl md:text-3xl font-black uppercase mb-2 text-deepgreen tracking-tight">{content.introTitle}</h2>
              <div className="h-1 w-12 xs:w-16 bg-gold-500 mb-3 xs:mb-4 rounded-full"></div>
              <p className="text-sm xs:text-base md:text-lg leading-relaxed text-gray-700 font-medium whitespace-pre-line mb-5 sm:mb-8">{content.introText}</p>
           </div>
           
           <PageSectionList sections={content.sections} />
        </div>

        <div className="mt-5 sm:mt-8">
           <div className="w-full relative h-[220px] xs:h-[260px] md:h-[320px] overflow-hidden rounded-none sm:rounded-2xl shadow-lg group">
              <img src={getFreshImageUrl(content.introImage)} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" alt="Main Food" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex items-end p-4 xs:p-6">
                 <div className="text-white">
                    <h3 className="text-lg xs:text-2xl font-black mb-1">Signature Vietnamese Dish</h3>
                    <p className="text-xs xs:text-sm font-medium opacity-90">베트남의 영혼을 담은 최고의 요리를 만나보세요.</p>
                 </div>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-1.5 sm:gap-3.5 mt-3 sm:mt-4">
            {content.galleryImages.map((img, idx) => (
                <div key={idx} className="group overflow-hidden rounded-none sm:rounded-xl shadow-sm h-32 xs:h-36 sm:h-40 relative bg-gray-100">
                   <img src={getFreshImageUrl(img)} className="w-full h-full object-cover transform group-hover:scale-105 transition duration-500" alt={`Food Gallery ${idx}`} />
                </div>
            ))}
        </div>
      </section>
      
      <section className="py-5 sm:py-8 bg-gray-50 border-t border-gray-100">
         <div className="max-w-7xl mx-auto px-0 sm:px-4 grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-6 text-center">
            <div className="p-4 bg-white rounded-none sm:rounded-2xl border-y sm:border border-gray-100 shadow-sm space-y-1.5">
               <div className="text-2xl">🍜</div>
               <h4 className="text-sm font-bold text-deepgreen">오리지널 쌀국수</h4>
               <p className="text-gray-500 text-xs leading-relaxed">깊고 진한 육수의 베트남 전통 맛집만을 엄선하여 안내합니다.</p>
            </div>
            <div className="p-4 bg-white rounded-none sm:rounded-2xl border-y sm:border border-gray-100 shadow-sm space-y-1.5">
               <div className="text-2xl">🦞</div>
               <h4 className="text-sm font-bold text-deepgreen">붕따우 해산물</h4>
               <p className="text-gray-500 text-xs leading-relaxed">항구 도시 붕따우의 신선한 해산물을 즐기세요.</p>
            </div>
            <div className="p-4 bg-white rounded-none sm:rounded-2xl border-y sm:border border-gray-100 shadow-sm space-y-1.5">
               <div className="text-2xl">🍹</div>
               <h4 className="text-sm font-bold text-deepgreen">루프탑 디너</h4>
               <p className="text-gray-500 text-xs leading-relaxed">호치민 시내의 화려한 야경과 함께하는 로맨틱한 정찬입니다.</p>
            </div>
         </div>
      </section>
    </div>
  );
};

export default FoodPage;
