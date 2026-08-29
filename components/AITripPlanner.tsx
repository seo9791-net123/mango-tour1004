
import React, { useState } from 'react';
import { LOCATIONS, THEMES, ACCOMMODATIONS, DURATIONS, VEHICLE_OPTIONS } from '../constants';
import { TripPlanRequest, TripPlanResult } from '../types';

interface Props {
  onPlanGenerated: (plan: TripPlanResult) => void;
  onBack?: () => void;
}

const AITripPlanner: React.FC<Props> = ({ onPlanGenerated, onBack }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<TripPlanRequest>({
    destination: LOCATIONS[0],
    theme: THEMES[0],
    accommodation: ACCOMMODATIONS[0],
    duration: DURATIONS[0],
    pax: 4,
    guide: '예',
    vehicle: VEHICLE_OPTIONS[0],
    remarks: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);
    // Simulate a brief processing time for a better UX
    setTimeout(() => {
      const result: TripPlanResult = {
        itinerary: [
          { day: 1, activities: ["고객 맞춤 일정 상담 후 확정", "현지 가이드 미팅", "자유 일정 또는 추천 명소 방문"] }
        ],
        costBreakdown: [
          { item: `숙박 (${formData.accommodation})`, cost: "상담 후 견적 산출" },
          { item: `차량 (${formData.vehicle})`, cost: "상담 후 견적 산출" },
          { item: `가이드 (${formData.guide})`, cost: "상담 후 견적 산출" },
          { item: "기타 요청사항", cost: formData.remarks || "없음" }
        ],
        totalCost: "상담 후 확정",
        summary: `${formData.destination} ${formData.duration} ${formData.theme} 여행 맞춤 견적 요청`,
        remarks: formData.remarks,
        options: {
          guide: formData.guide,
          vehicle: formData.vehicle
        }
      };
      
      setIsModalOpen(false);
      onPlanGenerated(result);
      setLoading(false);
    }, 800);
  };

  return (
    <div className={(onBack ? "min-h-screen bg-white" : "") + " pb-20 md:pb-0"}>
      {/* Header if onBack exists (Page Mode) */}
      {onBack && (
         <div className="max-w-7xl mx-auto px-4 pt-4 pb-2">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
                <div className="flex items-center gap-3">
                    <button
                    onClick={onBack}
                    className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-100 transition shadow-sm text-gray-600"
                    >
                    ←
                    </button>
                    <h2 className="text-xl font-bold text-deepgreen">
                        나만의 여행 만들기
                    </h2>
                </div>
            </div>
            <p className="text-gray-600 mb-2 pl-0 md:pl-11 text-xs">
                고객님의 취향에 맞는 최적의 일정과 견적을 전문가가 직접 제안해 드립니다.
            </p>
         </div>
      )}

      {/* Hero CTA Section */}
      <section className={`py-6 bg-gradient-to-br from-gray-900 to-deepgreen relative overflow-hidden text-white ${onBack ? 'rounded-2xl mx-4 mb-3 shadow-xl' : ''}`}>
        <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/travel_planning/1920/800')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
        <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
          <span className="inline-block py-0.5 px-2 rounded-full bg-gold-500/20 border border-gold-500 text-gold-400 text-xs font-bold mb-4 animate-pulse">
             ✨ CUSTOM TRAVEL DESIGN
          </span>
          <h2 className="text-2xl md:text-3xl font-bold mb-4 leading-tight">
            꿈꾸던 여행, <span className="text-gold-400">망고투어</span>가 현실로 만들어 드립니다
          </h2>
          <p className="text-sm text-gray-300 mb-6 max-w-2xl mx-auto">
            원하는 여행지, 테마, 인원만 선택하세요. <br className="hidden md:block"/>
            전문 상담원이 상세한 일정표와 투명한 견적서를 직접 안내해 드립니다.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-200 bg-gold-500 text-lg rounded-full hover:bg-gold-600 hover:shadow-lg hover:-translate-y-1 focus:outline-none ring-offset-2 focus:ring-2 ring-gold-400"
          >
            <span className="mr-2 text-2xl">✈️</span>
            나만의 여행상품 만들기
            <div className="absolute inset-0 rounded-full ring-2 ring-white/20 group-hover:ring-white/40 animate-ping opacity-0 group-hover:opacity-100 duration-1000"></div>
          </button>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="bg-gray-50 py-6">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-4">
            <h2 className="text-2xl font-black text-deepgreen mb-2">여행이 만들어지는 과정</h2>
            <p className="text-gray-500 text-sm">단 3단계면 충분합니다. 나머지는 망고투어가 책임집니다.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', title: '취향 선택', desc: '여행지, 테마, 인원 등 고객님의 취향을 알려주세요.', icon: '🎯' },
              { step: '02', title: '전문가 맞춤 설계', desc: '망고투어 전문가가 최적의 동선과 합리적인 견적을 산출합니다.', icon: '⚡' },
              { step: '03', title: '상담 및 확정', desc: '제안된 견적서를 바탕으로 최종 상담 후 여행을 시작하세요.', icon: '🤝' }
            ].map((item, i) => (
              <div key={i} className="relative group">
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                  <div className="text-4xl mb-4">{item.icon}</div>
                  <div className="text-gold-500 font-black text-4xl opacity-10 absolute top-6 right-8 group-hover:opacity-20 transition-opacity">{item.step}</div>
                  <h3 className="text-lg font-bold text-deepgreen mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{item.desc}</p>
                </div>
                {i < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                    <span className="text-gray-300 text-2xl">→</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Manual Inquiry Section */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
           <div className="space-y-6">
              <div>
                 <h3 className="text-gold-600 font-bold tracking-widest text-[10px] md:text-xs mb-2 uppercase">DIRECT CUSTOM INQUIRY</h3>
                 <h2 className="text-2xl md:text-3xl font-black text-deepgreen leading-tight">
                    더 정교한<br/>
                    <span className="text-gold-500">1:1 맞춤 상담</span>이 필요하신가요?
                 </h2>
              </div>
              <p className="text-gray-600 leading-relaxed font-medium text-sm md:text-base">
                 망고투어의 전문 상담원이 고객님의 모든 요구사항을 반영하여<br className="hidden md:block"/>
                 세상에 단 하나뿐인 특별한 여행 상품을 직접 설계해 드립니다.
              </p>
              <ul className="space-y-3">
                 {[
                   '대규모 단체 행사 및 기업 연수 전문',
                   'VVIP를 위한 초호화 럭셔리 빌라 및 전용기 서비스',
                   '특수 목적 여행 (웨딩, 촬영, 비즈니스 미팅 등)',
                   '실시간 항공권 및 호텔 최저가 조합'
                 ].map((item, i) => (
                   <li key={i} className="flex items-center gap-3 text-sm font-bold text-gray-700">
                      <span className="w-5 h-5 rounded-full bg-gold-100 text-gold-600 flex items-center justify-center text-[10px]">✓</span>
                      {item}
                   </li>
                 ))}
              </ul>
              <div className="pt-4">
                 <button 
                   onClick={() => window.open('https://open.kakao.com/o/gSfNsh3h', '_blank')}
                   className="px-8 py-4 bg-deepgreen text-white rounded-2xl font-bold shadow-xl hover:bg-opacity-90 transition flex items-center gap-3"
                 >
                    <span className="text-2xl">💬</span>
                    전문가에게 직접 문의하기
                 </button>
              </div>
           </div>
           
           <div className="relative">
              <div className="absolute -inset-4 bg-gold-500/10 rounded-[2.5rem] rotate-3"></div>
              <div className="relative bg-white border border-gray-100 p-8 rounded-[2rem] shadow-2xl">
                 <div className="flex items-center gap-4 mb-8">
                    <div className="w-12 h-12 rounded-full bg-gold-500 flex items-center justify-center text-white text-xl font-bold shadow-lg">M</div>
                    <div>
                       <p className="text-xs font-bold text-gray-400 uppercase">Customer Service</p>
                       <p className="text-lg font-black text-deepgreen">MANGO TOUR 실시간 상담</p>
                    </div>
                 </div>
                 
                 <div className="space-y-4 mb-8">
                    <div className="flex gap-3">
                       <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0">👤</div>
                       <div className="bg-gray-100 p-3 rounded-2xl rounded-tl-none text-xs text-gray-700 font-medium">
                          안녕하세요! 어떤 여행을 계획 중이신가요?
                       </div>
                    </div>
                    <div className="flex gap-3 flex-row-reverse">
                       <div className="w-8 h-8 rounded-full bg-gold-500 flex items-center justify-center shrink-0 text-white text-[10px] font-bold">YOU</div>
                       <div className="bg-gold-500 p-3 rounded-2xl rounded-tr-none text-xs text-white font-bold shadow-md">
                          다낭 3박 4일 골프 투어 견적 부탁드려요.
                       </div>
                    </div>
                 </div>
                 
                 <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-center">
                    <p className="text-[10px] text-gray-400 mb-2 font-bold">상담 가능 시간: 09:00 - 22:00 (연중무휴)</p>
                    <div className="flex justify-center gap-4">
                       <div className="text-center">
                          <p className="text-lg font-black text-deepgreen">98%</p>
                          <p className="text-[8px] text-gray-500 font-bold uppercase">Response Rate</p>
                       </div>
                       <div className="w-px bg-gray-200 h-8 self-center"></div>
                       <div className="text-center">
                          <p className="text-lg font-black text-deepgreen">5min</p>
                          <p className="text-[8px] text-gray-500 font-bold uppercase">Avg. Response</p>
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 pt-safe">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl transform transition-all animate-fade-in-up max-h-[90vh] flex flex-col pb-safe">
            <div className="bg-deepgreen px-4 sm:px-5 py-3.5 flex justify-between items-center shrink-0">
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>📝</span> 여행 취향 설정
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm font-bold active:scale-95 transition"
              >
                ✕
              </button>
            </div>

            <div className="p-4 sm:p-6 bg-gray-50 overflow-y-auto flex-1">
              <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">여행지</label>
                    <select
                      className="w-full p-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-gold-500 outline-none transition text-sm"
                      value={formData.destination}
                      onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                    >
                      {LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                    </select>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">여행 테마</label>
                    <select
                      className="w-full p-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-gold-500 outline-none transition text-sm"
                      value={formData.theme}
                      onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                    >
                      {THEMES.map(theme => <option key={theme} value={theme}>{theme}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">숙소 등급</label>
                    <select
                      className="w-full p-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-gold-500 outline-none transition text-sm"
                      value={formData.accommodation}
                      onChange={(e) => setFormData({ ...formData, accommodation: e.target.value })}
                    >
                      {ACCOMMODATIONS.map(acc => <option key={acc} value={acc}>{acc}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">여행 일정 (기간)</label>
                    <select
                      className="w-full p-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-gold-500 outline-none transition text-sm"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    >
                      {DURATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">인원 수 (명)</label>
                    <input
                      type="number"
                      min="1"
                      className="w-full p-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-gold-500 outline-none transition text-sm"
                      value={formData.pax}
                      onChange={(e) => setFormData({ ...formData, pax: parseInt(e.target.value) || 1 })}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700">렌트카 (기사 포함)</label>
                    <select
                      className="w-full p-2.5 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-gold-500 outline-none transition text-sm"
                      value={formData.vehicle}
                      onChange={(e) => setFormData({ ...formData, vehicle: e.target.value })}
                    >
                      {VEHICLE_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                  </div>

                  <div className="col-span-1 sm:col-span-2 space-y-1">
                    <label className="text-xs font-bold text-gray-700 block mb-1">가이드 이용 여부</label>
                    <div className="flex gap-2.5">
                      {['예', '아니오'].map(option => (
                        <label key={option} className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 border rounded-xl hover:bg-gray-50 flex-1 justify-center text-xs sm:text-sm">
                          <input
                            type="radio"
                            name="guide"
                            value={option}
                            checked={formData.guide === option}
                            onChange={(e) => setFormData({ ...formData, guide: e.target.value as '예' | '아니오' })}
                            className="w-3.5 h-3.5 text-gold-500 focus:ring-gold-500"
                          />
                          <span className={formData.guide === option ? 'font-bold text-gold-600' : 'text-gray-700'}>{option}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="col-span-1 sm:col-span-2 space-y-1">
                    <label className="text-xs font-bold text-gray-700 block mb-1">비고 (추가 요청사항)</label>
                    <textarea
                      className="w-full p-3 bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-gold-500 outline-none transition text-sm h-20 resize-none"
                      placeholder="원하시는 골프장, 호텔, 식사 등 자유롭게 입력해주세요."
                      value={formData.remarks}
                      onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-3.5 rounded-xl font-bold text-white text-xs sm:text-sm shadow-md flex justify-center items-center gap-2 active:scale-95 transition-all ${
                      loading 
                        ? 'bg-gray-400 cursor-not-allowed' 
                        : 'bg-gold-500 hover:bg-gold-600'
                    }`}
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>견적서를 생성하는 중입니다...</span>
                      </>
                    ) : (
                      <>
                        <span>🚀</span> 여행 견적 생성하기
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AITripPlanner;
