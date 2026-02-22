
import React from 'react';
import { PageContent } from '../types';

interface Props {
  content: PageContent;
  onBack: () => void;
}

const GolfPage: React.FC<Props> = ({ content, onBack }) => {
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

      <section className="py-12 bg-gray-50 text-black border-b">
        <div className="max-w-7xl mx-auto px-4 text-center">
           <h2 className="text-3xl md:text-4xl font-black uppercase mb-4 tracking-wide text-deepgreen">{content.introTitle}</h2>
           <div className="h-1 w-16 bg-gold-500 mx-auto mb-6"></div>
           <p className="max-w-4xl mx-auto text-xl leading-relaxed text-gray-700 font-bold whitespace-pre-line">{content.introText}</p>
        </div>
      </section>

      <section className="py-12 bg-white">
         <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               {Array.from({ length: Math.max(content.sections.length, content.galleryImages.length) }).map((_, idx) => {
                  const section = content.sections[idx] || { title: '새로운 코스', content: '상세 정보는 준비 중입니다.' };
                  const image = content.galleryImages[idx] || 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?q=80&w=800';
                  return (
                    <div key={idx} className="group cursor-pointer">
                       <div className="overflow-hidden rounded-2xl shadow-lg mb-4 h-52 relative">
                          <img 
                            src={image} 
                            className="w-full h-full object-cover transform group-hover:scale-110 transition duration-1000" 
                            alt={`Golf ${idx}`} 
                          />
                          <div className="absolute top-3 left-3 bg-gold-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Course {idx + 1}</div>
                       </div>
                       <h3 className="text-2xl font-black mb-2 group-hover:text-gold-600 transition text-deepgreen">{section.title}</h3>
                       <p className="text-gray-600 text-lg font-bold leading-relaxed">{section.content}</p>
                    </div>
                  );
               })}
            </div>
         </div>
      </section>

      <section className="py-12 bg-gray-900 text-white">
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
    </div>
  );
};

export default GolfPage;
