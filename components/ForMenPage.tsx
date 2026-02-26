
import React from 'react';
import { PageContent } from '../types';
import PageSectionList from './PageSectionList';

interface Props {
  content: PageContent;
  onBack: () => void;
}

const ForMenPage: React.FC<Props> = ({ content, onBack }) => {
  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans overflow-x-hidden animate-fade-in pb-20 md:pb-0">
      {/* Compact Hero - 180px */}
      <section className="relative h-[180px] flex items-center justify-center overflow-hidden bg-black">
        <div className="absolute inset-0 z-0">
          <img src={content.heroImage} alt="Hero" className="w-full h-full object-cover opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-[#050505]"></div>
        </div>
        
        <div className="absolute top-4 left-4 z-50">
          <button onClick={onBack} className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/30 transition text-white shadow-lg">←</button>
        </div>

        <div className="relative z-10 text-center animate-fade-in-up px-4">
           <div className="mb-2 inline-block border-b border-gold-500">
             <p className="text-[10px] md:text-xs font-bold tracking-[0.4em] uppercase text-gold-500">Exclusive Nightlife</p>
           </div>
           <h1 className="text-4xl md:text-5xl font-bold tracking-tighter text-white drop-shadow-2xl mb-1 uppercase leading-tight" style={{ fontFamily: 'serif' }}>{content.heroTitle}</h1>
           <p className="text-[10px] md:text-xs font-light text-gray-400 uppercase tracking-widest">{content.heroSubtitle}</p>
        </div>
      </section>

      <section className="py-8 bg-[#0a0a0a] border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4">
           <div className="flex flex-col lg:flex-row gap-8 items-center mb-10">
              <div className="flex-1 space-y-3">
                 <h2 className="text-2xl md:text-3xl font-black uppercase mb-2 text-gold-500" style={{ fontFamily: 'serif' }}>{content.introTitle}</h2>
                 <div className="h-1 w-12 bg-white/20"></div>
                 <p className="text-lg leading-relaxed text-gray-300 font-bold whitespace-pre-line">{content.introText}</p>
                 <div className="pt-3">
                    <button 
                      onClick={() => alert('커뮤니티에 비공개 글로 작성 하시면 답변 및 연락을 드리겠습니다')}
                      className="bg-gold-600 text-white px-6 py-2.5 rounded-full font-bold hover:bg-gold-500 transition shadow-xl text-[10px] uppercase tracking-widest"
                    >
                      VIP 상담 신청
                    </button>
                 </div>
              </div>
              <div className="flex-1 w-full">
                 <img src={content.introImage} className="w-full h-[250px] object-cover rounded-3xl shadow-[0_0_20px_rgba(197,160,40,0.1)] border border-white/10" alt="Nightlife" />
              </div>
           </div>

           <div className="mb-10">
             <PageSectionList sections={content.sections} />
           </div>

           <div className="text-center mb-8">
              <h3 className="text-lg font-bold text-white uppercase tracking-widest border-b border-gold-500 inline-block">HCMC Night Collection</h3>
           </div>
           <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {content.galleryImages.map((img, idx) => (
                  <div key={idx} className="group overflow-hidden rounded-xl shadow-xl h-40 relative border border-white/5">
                     <img src={img} className="w-full h-full object-cover transform group-hover:scale-105 transition duration-1000" alt={`Men ${idx}`} />
                     <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80 group-hover:opacity-40 transition-opacity"></div>
                     <div className="absolute bottom-3 left-3 right-3 text-white">
                        <p className="text-gold-500 font-bold text-[8px] mb-0.5">Exclusive</p>
                        <h4 className="text-[10px] font-bold">Venue {idx + 1}</h4>
                     </div>
                  </div>
              ))}
           </div>
        </div>
      </section>
    </div>
  );
};

export default ForMenPage;
