
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
      <div className="fixed top-0 left-0 w-full z-50 p-4 flex justify-between items-center bg-white/80 backdrop-blur-md shadow-sm">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-black/5 flex items-center justify-center hover:bg-black/10 transition text-black">←</button>
        <span className="font-bold text-deepgreen tracking-tight">TOUR MGM EVENTS</span>
        <div className="w-10"></div>
      </div>

      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src={content.heroImage} alt="Hero" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/50"></div>
        </div>
        <div className="relative z-10 text-center animate-fade-in-up px-4">
           <h1 className="text-5xl md:text-7xl font-bold text-white mb-4 uppercase drop-shadow-2xl">{content.heroTitle}</h1>
           <p className="text-xl text-gold-400 font-bold tracking-widest">{content.heroSubtitle}</p>
        </div>
      </section>

      <section className="py-24 max-w-7xl mx-auto px-4">
        <div className="text-center mb-20">
           <h2 className="text-4xl font-bold text-deepgreen uppercase mb-6 tracking-tight">{content.introTitle}</h2>
           <div className="h-1.5 w-24 bg-gold-500 mx-auto mb-8"></div>
           <p className="max-w-4xl mx-auto text-lg leading-relaxed text-gray-600 font-light whitespace-pre-line">{content.introText}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
           {content.sections.map((section, idx) => {
               const eventImg = content.galleryImages[idx] || 'https://images.unsplash.com/photo-1595842858599-4c274b3d3278?w=800';
               return (
                  <div key={idx} className="bg-white rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 group border border-gray-100 flex flex-col h-full">
                    <div className="h-60 overflow-hidden relative">
                      <img 
                        src={eventImg} 
                        className="w-full h-full object-cover transform group-hover:scale-110 transition duration-700" 
                        alt={section.title} 
                      />
                      <div className="absolute top-4 left-4 bg-deepgreen text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase shadow-lg">진행중 / EVENT</div>
                    </div>
                    <div className="p-8 space-y-4 flex-1 flex flex-col">
                      <h3 className="text-xl font-bold group-hover:text-gold-600 transition duration-300">{section.title}</h3>
                      <p className="text-gray-500 text-sm leading-relaxed flex-1 line-clamp-3">{section.content}</p>
                      <div className="pt-6 border-t border-gray-100 flex justify-between items-center">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Limited Time Offer</span>
                        <button 
                          onClick={() => handleDetailClick(section.title, section.content, eventImg)}
                          className="text-gold-600 font-bold text-sm hover:text-gold-700 flex items-center gap-1 transition-colors"
                        >
                          상세보기 <span className="text-lg">→</span>
                        </button>
                      </div>
                    </div>
                  </div>
               );
           })}
        </div>
      </section>
      
      <section className="py-20 bg-white">
         <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-6 text-gray-800">이벤트 소식을 가장 먼저 받아보세요</h2>
            <p className="text-gray-500 mb-10 text-lg">TOUR MGM 플러스 친구 추가 시 매월 업데이트되는 대회 정보와 할인 쿠폰을 발송해 드립니다.</p>
            <button className="bg-yellow-400 text-black px-12 py-4 rounded-full font-bold hover:bg-yellow-500 transition shadow-xl flex items-center gap-3 mx-auto transform active:scale-95">
               <span className="bg-black text-white px-2 py-0.5 rounded font-black text-sm">Talk</span> 
               <span>카카오톡 친구 추가하기</span>
            </button>
         </div>
      </section>
    </div>
  );
};

export default EventPage;
