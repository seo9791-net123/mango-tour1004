
import React, { useState } from 'react';
import { PageContent } from '../types';
import SliderPopup from './SliderPopup';
import PageSectionList from './PageSectionList';

interface Props {
  content: PageContent;
  onBack: () => void;
}

const GolfPage: React.FC<Props> = ({ content, onBack }) => {
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
           <div className="mb-2 inline-block border-b border-gold-500">
             <p className="text-xs md:text-sm font-bold tracking-[0.3em] uppercase text-gold-500">{content.heroSubtitle}</p>
           </div>
           <h1 className="text-3xl md:text-4xl font-bold tracking-tighter text-white drop-shadow-2xl mb-1 uppercase leading-tight" style={{ fontFamily: 'serif' }}>{content.heroTitle}</h1>
           <div className="mt-2 flex justify-center gap-1.5">
              <span className="bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full text-[9px] text-white">#명문골프장</span>
              <span className="bg-white/20 backdrop-blur-sm px-2 py-0.5 rounded-full text-[9px] text-white">#VIP의전</span>
           </div>
        </div>
      </section>

      <section className="py-8 bg-gray-50 text-black border-b">
        <div className="max-w-7xl mx-auto px-4 text-center">
           <h2 className="text-2xl md:text-3xl font-black uppercase mb-3 tracking-wide text-deepgreen">{content.introTitle}</h2>
           <div className="h-1 w-16 bg-gold-500 mx-auto mb-4"></div>
           <p className="max-w-4xl mx-auto text-lg leading-relaxed text-gray-700 font-bold whitespace-pre-line mb-8">{content.introText}</p>
           
           <PageSectionList sections={content.sections} />

           <div className="mt-8 text-center mb-6">
              <h3 className="text-gold-600 font-bold tracking-widest text-[10px] mb-1 uppercase">GALLERY</h3>
              <h2 className="text-2xl font-bold uppercase text-deepgreen">골프 코스 갤러리</h2>
           </div>
           <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {content.galleryImages.map((img, idx) => (
                 <div key={idx} className="group relative overflow-hidden rounded-xl shadow-md h-40">
                    <img src={img} className="w-full h-full object-cover transform group-hover:scale-110 transition duration-700" alt={`Golf Gallery ${idx}`} />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-3">
                       <p className="text-white font-bold text-[10px] uppercase tracking-tighter">Golf Course {idx + 1}</p>
                    </div>
                 </div>
              ))}
           </div>

           {content.slides && content.slides.length > 0 && (
              <button 
                onClick={() => setIsSliderOpen(true)}
                className="mt-8 px-8 py-3 bg-deepgreen text-white rounded-xl font-bold text-sm hover:bg-gold-600 transition shadow-lg flex items-center gap-2 mx-auto"
              >
                <span>🖼️</span> 상세 갤러리 슬라이드 보기
              </button>
           )}
        </div>
      </section>

      <section className="py-8 bg-gray-900 text-white">
         <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            <img src={content.introImage} className="w-full h-[250px] object-cover rounded-3xl shadow-2xl opacity-80" alt="Golf Service" />
            <div className="space-y-4">
               <h3 className="text-xl font-bold text-gold-400 uppercase tracking-wider">MANGO TOUR만의 특별한 골프 케어</h3>
               <ul className="space-y-3 text-xs font-light opacity-80">
                  <li className="flex items-center gap-2"><span className="text-gold-500">✓</span> 전일정 전용 차량 및 전문 매니저 동행</li>
                  <li className="flex items-center gap-2"><span className="text-gold-500">✓</span> 골프장 티업 타임 우선 배정 권한</li>
                  <li className="flex items-center gap-2"><span className="text-gold-500">✓</span> 라운딩 후 최고급 스파 및 석식 예약</li>
                  <li className="flex items-center gap-2"><span className="text-gold-500">✓</span> 단체 행사 및 대회 기획 지원</li>
               </ul>
               <button className="bg-gold-500 text-white px-6 py-2.5 rounded-full font-bold text-[10px] shadow-lg hover:bg-gold-600 transition">골프 투어 맞춤 견적 신청</button>
            </div>
         </div>
      </section>

      {isSliderOpen && content.slides && (
        <SliderPopup slides={content.slides} onClose={() => setIsSliderOpen(false)} />
      )}
    </div>
  );
};

export default GolfPage;
