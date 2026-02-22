
import React from 'react';
import { PageContent } from '../types';

interface Props {
  content: PageContent;
  onBack: () => void;
  onEventClick?: (title: string, content: string, image: string) => void;
  isLoggedIn?: boolean;
  onReqLogin?: () => void;
}

const EventPage: React.FC<Props> = ({ content, onBack, onEventClick, isLoggedIn, onReqLogin }) => {
  const handleDetailClick = (title: string, contentText: string, image: string) => {
    if (!isLoggedIn) {
      if (confirm('상세 보기 및 상담 문의는 로그인 후 이용 가능합니다. 로그인하시겠습니까?')) {
        onReqLogin?.();
      }
      return;
    }
    onEventClick?.(title, contentText, image);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-black font-sans overflow-x-hidden animate-fade-in">
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

      <section className="py-12 max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
           <h2 className="text-2xl font-bold text-deepgreen uppercase mb-3 tracking-tight">{content.introTitle}</h2>
           <div className="h-1 w-16 bg-gold-500 mx-auto mb-6"></div>
           <p className="max-w-4xl mx-auto text-sm leading-relaxed text-gray-500 font-light whitespace-pre-line">{content.introText}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {Array.from({ length: Math.max(content.sections.length, content.galleryImages.length) }).map((_, idx) => {
               const section = content.sections[idx] || { title: '새로운 이벤트', content: '상세 내용은 문의 바랍니다.' };
               const eventImg = content.galleryImages[idx] || 'https://images.unsplash.com/photo-1595842858599-4c274b3d3278?w=800';
               return (
                  <div key={idx} className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 group border border-gray-100 flex flex-col h-full">
                    <div className="h-44 overflow-hidden relative">
                      <img 
                        src={eventImg} 
                        className="w-full h-full object-cover transform group-hover:scale-110 transition duration-700" 
                        alt={section.title} 
                      />
                      <div className="absolute top-3 left-3 bg-deepgreen text-white text-[8px] font-bold px-2 py-0.5 rounded-full uppercase shadow-md">진행중</div>
                    </div>
                    <div className="p-5 space-y-2 flex-1 flex flex-col">
                      <h3 className="text-base font-bold group-hover:text-gold-600 transition duration-300 text-deepgreen">{section.title}</h3>
                      <p className="text-gray-500 text-[10px] leading-relaxed flex-1 line-clamp-2">{section.content}</p>
                      <div className="pt-3 border-t border-gray-50 flex justify-between items-center">
                        <span className="text-[8px] text-gray-400 font-bold uppercase tracking-widest">Promotion</span>
                        <button 
                          onClick={() => handleDetailClick(section.title, section.content, eventImg)}
                          className="text-gold-600 font-bold text-[10px] hover:text-gold-700 flex items-center gap-1 transition-colors"
                        >
                          상세보기 <span className="text-sm">→</span>
                        </button>
                      </div>
                    </div>
                  </div>
               );
           })}
        </div>
      </section>
      
      <section className="py-12 bg-white">
         <div className="max-w-3xl mx-auto px-4 text-center">
            <h2 className="text-xl font-bold mb-3 text-gray-800">이벤트 소식을 가장 먼저 받아보세요</h2>
            <p className="text-gray-500 mb-6 text-xs">MANGO TOUR 플러스 친구 추가 시 매월 업데이트되는 대회 정보와 할인 쿠폰을 발송해 드립니다.</p>
            <button className="bg-yellow-400 text-black px-8 py-3 rounded-full font-bold hover:bg-yellow-500 transition shadow-lg flex items-center gap-2 mx-auto transform active:scale-95 text-[10px]">
               <span className="bg-black text-white px-1.5 py-0.5 rounded font-black text-[9px]">Talk</span> 
               <span>카카오톡 친구 추가하기</span>
            </button>
         </div>
      </section>
    </div>
  );
};

export default EventPage;
