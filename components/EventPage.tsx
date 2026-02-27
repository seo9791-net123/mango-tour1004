
import React from 'react';
import { PageContent } from '../types';
import PageSectionList from './PageSectionList';

interface Props {
  content: PageContent;
  onBack: () => void;
  isLoggedIn?: boolean;
  onReqLogin?: () => void;
}

const EventPage: React.FC<Props> = ({ content, onBack }) => {
  return (
    <div className="min-h-screen bg-[#f8f9fa] text-black font-sans overflow-x-hidden animate-fade-in pb-20 md:pb-0">
      {/* Compact Hero - 180px */}
      <section className="relative h-[180px] flex items-center justify-center overflow-hidden bg-black">
        <div className="absolute inset-0 z-0">
          <img src={content.heroImage} alt="Hero" className="w-full h-full object-cover opacity-60" />
          <div className="absolute inset-0 bg-black/50"></div>
        </div>
        
        <div className="absolute top-4 left-4 z-50">
          <button onClick={onBack} className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/30 transition text-white shadow-lg">←</button>
        </div>

        <div className="relative z-10 text-center animate-fade-in-up px-4">
           <h1 className="text-3xl md:text-5xl font-bold text-white mb-1 uppercase drop-shadow-2xl">{content.heroTitle}</h1>
           <p className="text-sm md:text-base text-gold-400 font-bold tracking-widest">{content.heroSubtitle}</p>
           <div className="mt-2 px-3 py-1 bg-red-600/80 text-white rounded-full text-[8px] font-bold animate-pulse shadow-lg tracking-widest uppercase">LIMITED OFFERS</div>
        </div>
      </section>

      <section className="py-8 max-w-7xl mx-auto px-4">
        <div className="text-left mb-8">
           <h2 className="text-2xl md:text-3xl font-black text-deepgreen uppercase mb-2 tracking-tight">{content.introTitle}</h2>
           <div className="h-1 w-16 bg-gold-500 mb-4"></div>
           <p className="text-sm leading-relaxed text-gray-700 font-bold whitespace-pre-line mb-8">{content.introText}</p>
           
           <PageSectionList sections={content.sections} />
        </div>

        <div className="mt-8">
           <div className="text-left mb-6">
              <h3 className="text-gold-600 font-bold tracking-widest text-[10px] mb-1 uppercase">EVENT GALLERY</h3>
              <h2 className="text-2xl font-bold uppercase text-deepgreen">이벤트 현장 갤러리</h2>
           </div>
           <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {content.galleryImages.map((img, idx) => (
                 <div key={idx} className="group relative overflow-hidden rounded-xl shadow-md h-40">
                    <img src={img} className="w-full h-full object-cover transform group-hover:scale-110 transition duration-700" alt={`Event Gallery ${idx}`} />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center">
                       <span className="text-white text-[10px] font-bold border border-white/40 px-3 py-1 rounded-full backdrop-blur-sm">VIEW</span>
                    </div>
                 </div>
              ))}
           </div>
        </div>
      </section>
      
      <section className="py-8 bg-white">
         <div className="max-w-3xl mx-auto px-4 text-center">
            <h2 className="text-xl font-bold mb-3 text-gray-800">이벤트 소식을 가장 먼저 받아보세요</h2>
            <p className="text-gray-500 mb-6 text-xs">MANGO TOUR 플러스 친구 추가 시 매월 업데이트되는 대회 정보와 할인 쿠폰을 발송해 드립니다.</p>
            <button 
              onClick={() => window.open('https://open.kakao.com/o/gSfNsh3h', '_blank')}
              className="bg-yellow-400 text-black px-8 py-3 rounded-full font-bold hover:bg-yellow-500 transition shadow-lg flex items-center gap-2 mx-auto transform active:scale-95 text-[10px]"
            >
               <span className="bg-black text-white px-1.5 py-0.5 rounded font-black text-[9px]">Talk</span> 
               <span>카카오톡 오픈채팅 문의하기</span>
            </button>
         </div>
      </section>
    </div>
  );
};

export default EventPage;
