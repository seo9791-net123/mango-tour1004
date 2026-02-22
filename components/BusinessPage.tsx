
import React, { useState } from 'react';
import { PageContent } from '../types';
import SliderPopup from './SliderPopup';

interface Props {
  content: PageContent;
  onBack: () => void;
}

const BusinessPage: React.FC<Props> = ({ content, onBack }) => {
  const [isSliderOpen, setIsSliderOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [isGallerySliderOpen, setIsGallerySliderOpen] = useState(false);

  const openGallerySlider = (index: number) => {
    setGalleryIndex(index);
    setIsGallerySliderOpen(true);
  };

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
           <h1 className="text-3xl md:text-4xl font-bold tracking-widest text-gold-400 drop-shadow-2xl mb-1 uppercase" style={{ fontFamily: 'serif' }}>{content.heroTitle}</h1>
           <p className="text-[10px] md:text-xs tracking-[0.5em] text-white uppercase font-bold opacity-90">{content.heroSubtitle}</p>
        </div>
      </section>

      <section className="py-12 bg-[#f8f9fa] text-black">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
             <div className="space-y-6">
                <h2 className="text-3xl md:text-4xl font-black text-deepgreen uppercase leading-tight whitespace-pre-line">{content.introTitle}</h2>
                <div className="h-1 w-16 bg-gold-500"></div>
                <p className="text-xl leading-relaxed font-bold text-gray-700 whitespace-pre-line">{content.introText}</p>
                {content.slides && content.slides.length > 0 && (
                  <button 
                    onClick={() => setIsSliderOpen(true)}
                    className="mt-4 px-6 py-3 bg-deepgreen text-white rounded-xl font-bold text-sm hover:bg-gold-600 transition shadow-lg flex items-center gap-2"
                  >
                    <span>🖼️</span> 상세 갤러리 슬라이드 보기
                  </button>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                   {content.sections.map((section, idx) => (
                      <div key={idx} className="p-5 bg-white rounded-2xl shadow-sm border border-gray-100">
                         <h4 className="font-black mb-2 text-deepgreen flex items-center gap-2 text-xl">
                           <span className="w-1.5 h-4 bg-gold-500 rounded-full"></span>
                           {section.title}
                         </h4>
                         <p className="text-gray-600 text-base font-bold leading-relaxed">{section.content}</p>
                      </div>
                   ))}
                </div>
             </div>
             <div className="relative group cursor-pointer" onClick={() => content.slides && content.slides.length > 0 && setIsSliderOpen(true)}>
                <img src={content.introImage} className="w-full h-[300px] object-cover rounded-3xl shadow-xl group-hover:scale-[1.02] transition duration-500" alt="Intro" />
                {content.slides && content.slides.length > 0 && (
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 rounded-3xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-500">
                    <span className="text-white font-bold text-sm bg-black/40 px-4 py-2 rounded-full backdrop-blur-sm">슬라이드 보기</span>
                  </div>
                )}
             </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-white">
         <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-8">
               <h3 className="text-gold-600 font-bold tracking-widest text-[10px] mb-1 uppercase">GALLERY</h3>
               <h2 className="text-2xl font-bold uppercase text-deepgreen">비지니스 VIP 갤러리</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
               {content.galleryImages.map((img, idx) => (
                  <div 
                    key={idx} 
                    className="group relative overflow-hidden rounded-xl shadow-md h-48 cursor-pointer"
                    onClick={() => openGallerySlider(idx)}
                  >
                     <img src={img} className="w-full h-full object-cover transform group-hover:scale-110 transition duration-700" alt={`Gallery ${idx}`} />
                     <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors duration-500 flex items-center justify-center">
                        <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-500 font-bold bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm text-[10px]">슬라이드 보기</span>
                     </div>
                     <div className="absolute bottom-3 left-3 text-white opacity-100 group-hover:opacity-0 transition-opacity">
                        <p className="text-white font-bold text-[10px] uppercase tracking-tighter">VIP Service {idx + 1}</p>
                     </div>
                  </div>
               ))}
            </div>
         </div>
      </section>

      <section className="py-12 bg-deepgreen text-white text-center">
         <div className="max-w-7xl mx-auto px-4">
            <h2 className="text-xl md:text-2xl font-bold mb-3 uppercase">성공적인 비지니스를 위한 파트너</h2>
            <p className="text-xs opacity-70 mb-6 max-w-2xl mx-auto">MANGO TOUR는 베트남 남부 전 지역에서 고객님의 품격을 높여드리는 전문 의전팀을 운영하고 있습니다.</p>
            <button className="bg-gold-500 text-white px-8 py-3 rounded-full font-bold hover:bg-gold-600 transition shadow-xl text-xs">실시간 의전 상담하기</button>
         </div>
      </section>

      {isSliderOpen && content.slides && (
        <SliderPopup slides={content.slides} onClose={() => setIsSliderOpen(false)} />
      )}

      {isGallerySliderOpen && (
        <SliderPopup 
          images={content.galleryImages} 
          initialIndex={galleryIndex} 
          onClose={() => setIsGallerySliderOpen(false)} 
        />
      )}
    </div>
  );
};

export default BusinessPage;
