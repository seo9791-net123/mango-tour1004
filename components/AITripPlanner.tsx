
import React, { useState, useEffect, useRef } from 'react';
import { LOCATIONS, ACCOMMODATIONS } from '../constants';
import { CustomTripRequest, TripPlanResult, TripPlannerSettings } from '../types';
import { generateCustomTripPlan } from '../services/geminiService';

interface Props {
  settings: TripPlannerSettings;
  onBack?: () => void;
  isAdmin?: boolean;
}

const AITripPlanner: React.FC<Props> = ({ settings, onBack, isAdmin = false }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showPriceSettings, setShowPriceSettings] = useState(false);
  const [unitPrices, setUnitPrices] = useState(settings?.unitPrices || {
    accommodation: { '3성급': 0, '4성급': 0, '호텔 숙박(5성급)': 0, '풀빌라': 0 },
    rentCar: { '7인승': 0, '7인승 리무진': 0, '16인승': 0, '26인승': 0 },
    guide: { korean: 0 }
  });
  const [generatedPlan, setGeneratedPlan] = useState<TripPlanResult | null>(null);
  const [nameError, setNameError] = useState(false);
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);
  const quotationRef = useRef<HTMLDivElement>(null);

  // Update unit prices if settings change
  useEffect(() => {
    if (settings?.unitPrices) {
      setUnitPrices(settings.unitPrices);
    }
  }, [settings?.unitPrices]);

  const [extraItems, setExtraItems] = useState<Array<{ id: string, label: string, cost: number }>>([]);
  const [formData, setFormData] = useState<CustomTripRequest>({
    clientName: '',
    arrivalDate: new Date().toISOString().split('T')[0],
    arrivalTime: '10:00',
    departureDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    departureTime: '22:00',
    durationSummary: '4일 (3박 4일)',
    dailyPlans: [],
    extraRemarks: ''
  });

  // Calculate duration summary whenever dates change
  useEffect(() => {
    const start = new Date(formData.arrivalDate);
    const end = new Date(formData.departureDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    
    if (diffDays > 0) {
      const summary = `${diffDays}일 (${diffDays - 1}박 ${diffDays}일)`;
      setFormData(prev => ({ ...prev, durationSummary: summary }));
      
      // Update daily plans array length
      setFormData(prev => {
        const newDailyPlans = [...prev.dailyPlans];
        if (newDailyPlans.length < diffDays) {
          for (let i = newDailyPlans.length; i < diffDays; i++) {
            const currentDate = new Date(start);
            currentDate.setDate(start.getDate() + i);
            newDailyPlans.push({
              day: i + 1,
              date: currentDate.toISOString().split('T')[0].substring(5).replace('-', '.'),
              location: LOCATIONS[0],
              accommodation: ACCOMMODATIONS[1], // Default to 4-star
              personCount: 2,
              dailyRequests: '',
              transportService: {
                useRentCar: true,
                carType: '7인승',
                useGuide: false
              }
            });
          }
        } else if (newDailyPlans.length > diffDays) {
          newDailyPlans.splice(diffDays);
        }
        return { ...prev, dailyPlans: newDailyPlans };
      });
    }
  }, [formData.arrivalDate, formData.departureDate]);

  const handleStartPlanning = () => {
    if (!formData.clientName.trim()) {
      setNameError(true);
      alert('고객명을 입력해주세요.');
      return;
    }
    setNameError(false);
    setStep(2);
    window.scrollTo(0, 0);
  };

  const handleSubmit = async () => {
    setLoading(true);
    if (!formData.dailyPlans || formData.dailyPlans.length === 0) {
      alert('여행 일정이 설정되지 않았습니다. 날짜를 다시 확인해주세요.');
      setLoading(false);
      return;
    }

    try {
      const result = await generateCustomTripPlan(formData);
      
      if (!result) throw new Error('AI 일정 생성 실패');
      let accTotal = 0;
      let transportTotal = 0;
      
      formData.dailyPlans.forEach(dp => {
        // Accommodation
        const accPrice = unitPrices.accommodation[dp.accommodation as keyof typeof unitPrices.accommodation] || 0;
        accTotal += accPrice * dp.personCount;
        
        // Transport
        if (dp.transportService.useRentCar) {
          const carPrice = unitPrices.rentCar[dp.transportService.carType as keyof typeof unitPrices.rentCar] || 0;
          transportTotal += carPrice;
        }
        
        // Guide
        if (dp.transportService.useGuide) {
          transportTotal += unitPrices.guide.korean;
        }
      });

      // Calculate costs from Gemini's breakdown
      let aiTotal = 0;
      const rawAiBreakdown = Array.isArray(result.costBreakdown) ? result.costBreakdown : [];
      
      // Filter out any items that mention accommodation to avoid double counting with our calculated total
      const aiBreakdown = rawAiBreakdown.filter(item => 
        item && item.item && 
        !item.item.includes('숙박') && 
        !item.item.toLowerCase().includes('accommodation') &&
        !item.item.toLowerCase().includes('hotel')
      );

      aiBreakdown.forEach(item => {
        if (item && item.cost) {
          const costStr = String(item.cost).replace(/[^0-9]/g, '');
          if (costStr) {
            const val = parseInt(costStr);
            if (!isNaN(val)) aiTotal += val;
          }
        }
      });

      // Add manual extra items
      let manualTotal = 0;
      extraItems.forEach(item => {
        manualTotal += item.cost;
      });

      const totalVND = accTotal + transportTotal + aiTotal + manualTotal;
      
      // Fallback itinerary if Gemini returns empty
      const finalItinerary = (Array.isArray(result.itinerary) && result.itinerary.length > 0) 
        ? result.itinerary 
        : formData.dailyPlans.map(dp => ({
            day: dp.day,
            activities: [
              `09:00: ${dp.location} 주요 명소 관광 및 자유 일정`,
              `13:00: 현지 추천 맛집에서 중식 (개별 부담)`,
              `19:00: ${dp.location} 야경 감상 및 석식 후 호텔(${dp.accommodation}) 휴식`
            ]
          }));

      const finalResult: TripPlanResult = {
        ...result,
        itinerary: finalItinerary,
        totalCost: `${totalVND.toLocaleString()} VND`,
        costBreakdown: [
          ...aiBreakdown,
          ...extraItems.map(item => ({ item: item.label, cost: `${item.cost.toLocaleString()} VND` })),
          { item: "숙박비 합계", cost: `${accTotal.toLocaleString()} VND` },
          { item: "차량 및 가이드 합계", cost: `${transportTotal.toLocaleString()} VND` }
        ],
        options: {
          guide: formData.dailyPlans.some(dp => dp.transportService.useGuide) ? '한국어 가이드 포함' : '가이드 미포함',
          vehicle: formData.dailyPlans.find(dp => dp.transportService.useRentCar)?.transportService.carType || '차량 미포함'
        }
      };
      
      setGeneratedPlan(finalResult);
      // onPlanGenerated(finalResult); // Remove this to avoid double preview (AITripPlanner has its own)
      setStep(3);
      window.scrollTo(0, 0);
    } catch (error) {
      console.error(error);
      alert('견적 생성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = () => {
    localStorage.setItem('saved_trip_plan', JSON.stringify(formData));
    alert('현재 설정이 저장되었습니다.');
  };

  const handleLoad = () => {
    const saved = localStorage.getItem('saved_trip_plan');
    if (saved) {
      setFormData(JSON.parse(saved));
      alert('저장된 설정을 불러왔습니다.');
    } else {
      alert('저장된 설정이 없습니다.');
    }
  };

  const handleOpenPreview = () => {
    if (!generatedPlan || !quotationRef.current) return;
    
    const printWindow = window.open('', '_blank', 'width=900,height=1000,scrollbars=yes');
    if (!printWindow) {
      alert('팝업 차단을 해제해주세요.');
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>견적서 미리보기 - 망고 투어</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <script>
            tailwind.config = {
              theme: {
                extend: {
                  colors: {
                    gold: {
                      400: '#D4AF37',
                      500: '#C5A028',
                      600: '#B4901C',
                    },
                    deepgreen: '#004d40',
                  }
                }
              }
            }
          </script>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;700&display=swap');
            body { font-family: 'Noto Sans KR', sans-serif; background: #f3f4f6; margin: 0; padding: 20px; }
            .a4-page { width: 210mm; min-height: 297mm; padding: 20mm; margin: 0 auto; background: white; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
            @media print {
              @page { margin: 0; size: A4; }
              body { background: white; padding: 0; }
              .a4-page { box-shadow: none; margin: 0; width: 100%; padding: 10mm !important; }
              .no-print { display: none !important; }
            }
            .break-inside-avoid { break-inside: avoid; }
            .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
            @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
          </style>
        </head>
        <body>
          <div class="no-print flex justify-center mb-6">
            <button onclick="window.print()" class="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-blue-700 transition">
              🖨️ PDF 저장 / 인쇄하기
            </button>
          </div>
          <div class="a4-page animate-fade-in">
            ${quotationRef.current.innerHTML}
          </div>
        </body>
      </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
  };

  // Step 1: Basic Info View
  if (step === 1) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden p-8 md:p-12 animate-fade-in">
          <div className="mb-8">
            <h1 className="text-4xl font-black text-gray-900 mb-2">여행 견적 시작</h1>
            <p className="text-gray-500 font-medium">고객 정보와 비행기 일정을 입력해주세요.</p>
          </div>

          <div className="space-y-8">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">CLIENT NAME</label>
              <input 
                type="text"
                placeholder="예: 홍길동"
                className={`w-full p-5 bg-gray-50 border-2 rounded-2xl text-xl font-bold outline-none transition ${nameError ? 'border-red-500 bg-red-50' : 'border-transparent focus:ring-2 focus:ring-blue-500'}`}
                value={formData.clientName}
                onChange={(e) => {
                  setFormData({ ...formData, clientName: e.target.value });
                  if (e.target.value.trim()) setNameError(false);
                }}
              />
              {nameError && <p className="text-red-500 text-xs font-bold mt-2 ml-1">⚠️ 고객명을 입력하셔야 다음 단계로 진행할 수 있습니다.</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">ARRIVAL (도착)</label>
                <div className="flex gap-2">
                  <input 
                    type="date"
                    className="flex-1 p-4 bg-gray-50 border-none rounded-xl font-bold text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.arrivalDate}
                    onChange={(e) => setFormData({ ...formData, arrivalDate: e.target.value })}
                  />
                  <input 
                    type="time"
                    className="w-24 p-4 bg-gray-50 border-none rounded-xl font-bold text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.arrivalTime}
                    onChange={(e) => setFormData({ ...formData, arrivalTime: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">DEPARTURE (출발)</label>
                <div className="flex gap-2">
                  <input 
                    type="date"
                    className="flex-1 p-4 bg-gray-50 border-none rounded-xl font-bold text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.departureDate}
                    onChange={(e) => setFormData({ ...formData, departureDate: e.target.value })}
                  />
                  <input 
                    type="time"
                    className="w-24 p-4 bg-gray-50 border-none rounded-xl font-bold text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.departureTime}
                    onChange={(e) => setFormData({ ...formData, departureTime: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-6 rounded-2xl flex items-center gap-4 border border-blue-100">
              <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-2xl shadow-sm">📅</div>
              <div>
                <p className="font-black text-blue-900">선택한 일정: {formData.durationSummary}</p>
                <p className="text-xs text-blue-600 font-medium">비행기 시간을 고려하여 AI가 일정을 구성합니다.</p>
              </div>
            </div>

            <button 
              type="button"
              onClick={handleStartPlanning}
              className="w-full py-6 bg-blue-600 text-white rounded-2xl text-2xl font-black shadow-xl hover:bg-blue-700 transition transform hover:-translate-y-1 active:scale-95 flex items-center justify-center"
            >
              여정 계획 시작하기
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Detail Settings View
  if (step === 2) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        {/* Header */}
        <header className="bg-white border-b sticky top-0 z-50 px-2 md:px-4 py-2 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-1.5 md:gap-2">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-600 rounded-lg md:rounded-xl flex items-center justify-center text-white font-black text-lg md:text-xl shadow-lg">망</div>
            <div className="block">
              <h2 className="text-[10px] md:text-sm font-black text-blue-900 leading-tight">망고 투어 <span className="text-blue-500 font-bold">VIETNAM</span></h2>
              <p className="text-[6px] md:text-[8px] font-bold text-gray-400 uppercase tracking-tighter">TRAVEL CONCIERGE</p>
            </div>
          </div>
          <div className="flex items-center gap-1 md:gap-2">
            <button onClick={handleSave} className="w-8 h-8 md:w-auto md:px-4 md:py-2 bg-blue-600 text-white rounded-lg text-[9px] md:text-xs font-bold flex items-center justify-center md:gap-1 shadow-md hover:bg-blue-700 transition">
              <span className="text-xs md:text-sm">📥</span> <span className="hidden sm:inline">저장</span>
            </button>
            <button onClick={handleLoad} className="w-8 h-8 md:w-auto md:px-4 md:py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-[9px] md:text-xs font-bold flex items-center justify-center md:gap-1 hover:bg-gray-50 transition">
              <span className="text-xs md:text-sm">📤</span> <span className="hidden sm:inline">불러오기</span>
            </button>
            <button onClick={() => {
              if (onBack) onBack();
              else setStep(1);
            }} className="w-8 h-8 md:w-auto md:px-4 md:py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-[9px] md:text-xs font-bold flex items-center justify-center md:gap-1 hover:bg-gray-50 transition">
              <span className="text-xs md:text-sm">🏠</span> <span className="hidden sm:inline">처음</span>
            </button>
            {isAdmin && (
              <button onClick={() => setShowPriceSettings(true)} className="w-8 h-8 md:w-auto md:px-4 md:py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-[9px] md:text-xs font-bold flex items-center justify-center md:gap-1 hover:bg-gray-50 transition">
                <span className="text-xs md:text-sm">⚙️</span> <span className="hidden sm:inline">설정</span>
              </button>
            )}
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 py-4 md:py-10">
          <div className="flex justify-between items-center mb-4 md:mb-10">
            <h1 className="text-xl md:text-4xl font-black text-gray-900">여정 세부 설정</h1>
            <button onClick={() => setStep(1)} className="px-3 py-1.5 md:px-4 md:py-2 bg-gray-200 text-gray-700 rounded-lg text-[10px] md:text-xs font-bold hover:bg-gray-300 transition">기간 수정</button>
          </div>

          <div className="space-y-4 md:space-y-8">
            {/* Recommended Themes Selection */}
            <div className="bg-white rounded-2xl md:rounded-[2rem] p-4 md:p-8 border border-gray-100 shadow-xl animate-fade-in-up">
              <h3 className="text-sm md:text-lg font-black text-blue-900 mb-3 md:mb-6 flex items-center gap-2">
                <span>🌟</span> 추천 테마로 일괄 설정
              </h3>
              <div className="grid grid-cols-3 gap-2 md:gap-4">
                {(settings?.recommendedThemes || []).map((theme) => {
                  const isSelected = selectedThemeId === theme.id;
                  return (
                    <button
                      key={theme.id}
                      onClick={() => {
                        const updatedPlans = formData.dailyPlans.map(p => ({ ...p, dailyRequests: theme.title }));
                        setFormData({ ...formData, dailyPlans: updatedPlans });
                        setSelectedThemeId(theme.id);
                      }}
                      className={`flex flex-col items-center p-1.5 md:p-4 rounded-xl md:rounded-2xl shadow-sm transition-all duration-300 group border-2 relative ${
                        isSelected 
                          ? 'bg-blue-50 border-blue-500 shadow-lg scale-105 z-10' 
                          : 'bg-white border-gray-100 hover:shadow-md hover:border-blue-200'
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute top-0.5 right-0.5 md:top-2 md:right-2 w-3.5 h-3.5 md:w-6 md:h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-[7px] md:text-xs shadow-md animate-bounce">
                          ✓
                        </div>
                      )}
                      <div className={`w-10 h-10 md:w-16 md:h-16 rounded-full overflow-hidden mb-1.5 md:mb-3 border-2 transition-all duration-300 ${
                        isSelected ? 'border-blue-500 ring-1 md:ring-4 ring-blue-100' : 'border-gray-50 group-hover:border-blue-300'
                      }`}>
                        <img src={theme.image} className="w-full h-full object-cover" alt={theme.title} referrerPolicy="no-referrer" />
                      </div>
                      <span className={`text-[9px] md:text-sm font-black transition-colors duration-300 text-center line-clamp-1 ${isSelected ? 'text-blue-900' : 'text-gray-700'}`}>{theme.title}</span>
                      <span className={`hidden md:block text-[10px] mt-1 transition-colors duration-300 font-medium ${isSelected ? 'text-blue-500' : 'text-gray-400'}`}>{theme.description}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {formData.dailyPlans.map((plan, idx) => (
              <div key={idx} className="bg-white rounded-xl md:rounded-[2rem] p-4 md:p-8 border border-gray-100 shadow-xl relative animate-fade-in-up" style={{ animationDelay: `${idx * 0.1}s` }}>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3 md:gap-8">
                  <div className="flex flex-row md:flex-col justify-between md:justify-start items-center md:items-start border-b md:border-none pb-2 md:pb-0 mb-1 md:mb-0">
                    <span className="inline-block px-2 py-0.5 bg-gray-900 text-white text-[9px] font-black rounded-full text-center uppercase">DAY {plan.day}</span>
                    <span className="text-lg md:text-3xl font-black text-gray-900">{plan.date}</span>
                  </div>

                  <div className="space-y-1 md:space-y-2">
                    <label className="text-[7px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">LOCATION</label>
                    <select 
                      className="w-full p-2.5 md:p-4 bg-blue-50 border-2 border-blue-100 rounded-xl font-bold text-[11px] md:text-sm text-blue-900 focus:ring-2 focus:ring-blue-500 outline-none hover:bg-blue-100 transition-colors"
                      value={plan.location}
                      onChange={(e) => {
                        const newPlans = [...formData.dailyPlans];
                        newPlans[idx].location = e.target.value;
                        setFormData({ ...formData, dailyPlans: newPlans });
                      }}
                    >
                      {LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1 md:space-y-2">
                    <label className="text-[7px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">ACCOMMODATION</label>
                    <select 
                      className="w-full p-2.5 md:p-4 bg-amber-50 border-2 border-amber-100 rounded-xl font-bold text-[11px] md:text-sm text-amber-900 focus:ring-2 focus:ring-amber-500 outline-none hover:bg-amber-100 transition-colors"
                      value={plan.accommodation}
                      onChange={(e) => {
                        const newPlans = [...formData.dailyPlans];
                        newPlans[idx].accommodation = e.target.value;
                        setFormData({ ...formData, dailyPlans: newPlans });
                      }}
                    >
                      {Object.keys(unitPrices.accommodation).map(acc => <option key={acc} value={acc}>{acc}</option>)}
                    </select>
                    <div className="flex items-center gap-2 mt-1.5 bg-amber-100/50 p-2 md:p-3 rounded-xl">
                      <span className="text-amber-600 text-[11px] md:text-sm">👤</span>
                      <input 
                        type="number" 
                        min="1"
                        className="w-full bg-transparent border-none font-bold text-[10px] md:text-xs outline-none text-amber-900"
                        value={plan.personCount}
                        onChange={(e) => {
                          const newPlans = [...formData.dailyPlans];
                          newPlans[idx].personCount = parseInt(e.target.value) || 1;
                          setFormData({ ...formData, dailyPlans: newPlans });
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-1 md:space-y-2">
                    <label className="text-[7px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">DAILY REQUESTS</label>
                    <textarea 
                      className="w-full p-2.5 md:p-4 bg-indigo-50 border-2 border-indigo-100 rounded-xl font-bold text-[10px] md:text-xs text-indigo-900 focus:ring-2 focus:ring-indigo-500 outline-none h-16 md:h-24 resize-none placeholder:text-indigo-300 hover:bg-indigo-100 transition-colors"
                      placeholder="해당 일자 특별 요청 (예: 씨푸드 중식)"
                      value={plan.dailyRequests}
                      onChange={(e) => {
                        const newPlans = [...formData.dailyPlans];
                        newPlans[idx].dailyRequests = e.target.value;
                        setFormData({ ...formData, dailyPlans: newPlans });
                      }}
                    />
                  </div>

                  <div className="space-y-1 md:space-y-2">
                    <label className="text-[7px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest">TRANSPORT & SERVICE</label>
                    <div className="space-y-1.5 md:space-y-3">
                      <label className={`flex items-center gap-2 p-2 md:p-3 rounded-xl border transition cursor-pointer ${plan.transportService.useRentCar ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-gray-200 text-gray-400'}`}>
                        <input 
                          type="checkbox" 
                          className="w-3 h-3 md:w-4 md:h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                          checked={plan.transportService.useRentCar}
                          onChange={(e) => {
                            const newPlans = [...formData.dailyPlans];
                            newPlans[idx].transportService.useRentCar = e.target.checked;
                            setFormData({ ...formData, dailyPlans: newPlans });
                          }}
                        />
                        <span className="text-[10px] md:text-xs font-black">🚐 렌트카</span>
                      </label>
                      
                      {plan.transportService.useRentCar && (
                        <select 
                          className="w-full p-3 bg-white border border-gray-200 rounded-xl font-bold text-xs text-gray-800 outline-none"
                          value={plan.transportService.carType}
                          onChange={(e) => {
                            const newPlans = [...formData.dailyPlans];
                            newPlans[idx].transportService.carType = e.target.value;
                            setFormData({ ...formData, dailyPlans: newPlans });
                          }}
                        >
                          {Object.keys(unitPrices.rentCar).map(car => <option key={car} value={car}>{car}</option>)}
                        </select>
                      )}

                      <label className={`flex items-center gap-2 p-2 md:p-3 rounded-xl border transition cursor-pointer ${plan.transportService.useGuide ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-400'}`}>
                        <input 
                          type="checkbox" 
                          className="w-3 h-3 md:w-4 md:h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          checked={plan.transportService.useGuide}
                          onChange={(e) => {
                            const newPlans = [...formData.dailyPlans];
                            newPlans[idx].transportService.useGuide = e.target.checked;
                            setFormData({ ...formData, dailyPlans: newPlans });
                          }}
                        />
                        <span className="text-[10px] md:text-xs font-black">👤 가이드</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className="bg-white rounded-2xl md:rounded-[2rem] p-3 md:p-8 border border-gray-100 shadow-xl">
              <div className="flex justify-between items-center mb-3 md:mb-6">
                <h3 className="text-sm md:text-lg font-black text-blue-900 flex items-center gap-2">
                  <span>📄</span> 기타 비고 및 추가 금액 설정
                </h3>
                <button 
                  onClick={() => {
                    setExtraItems([...extraItems, { id: Date.now().toString(), label: '', cost: 0 }]);
                  }}
                  className="px-2.5 py-1.5 md:px-4 md:py-2 bg-blue-600 text-white rounded-lg text-[9px] md:text-xs font-bold flex items-center gap-1 shadow-md hover:bg-blue-700 transition"
                >
                  <span>+</span> 항목 추가
                </button>
              </div>
              
              {extraItems.length === 0 ? (
                <div className="p-8 md:p-10 border-2 border-dashed border-gray-100 rounded-2xl text-center">
                  <p className="text-gray-400 font-bold text-xs md:text-sm">추가된 비고 항목이 없습니다. 특이사항이나 별도 비용을 입력하세요.</p>
                </div>
              ) : (
                <div className="space-y-3 md:space-y-4">
                  {extraItems.map((item, idx) => (
                    <div key={item.id} className="flex flex-col md:flex-row gap-3 md:gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100 animate-fade-in-up">
                      <div className="flex-1">
                        <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1 block">항목 명칭</label>
                        <input 
                          type="text"
                          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs md:text-sm font-bold outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="예: 마사지 추가, 골프 라운딩 추가"
                          value={item.label}
                          onChange={(e) => {
                            const newItems = [...extraItems];
                            newItems[idx].label = e.target.value;
                            setExtraItems(newItems);
                          }}
                        />
                      </div>
                      <div className="w-full md:w-48">
                        <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1 block">금액 (VND)</label>
                        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5">
                          <span className="text-[10px] font-bold text-gray-300">VND</span>
                          <input 
                            type="number"
                            className="w-full bg-transparent border-none font-black text-right outline-none text-xs md:text-sm"
                            value={item.cost}
                            onChange={(e) => {
                              const newItems = [...extraItems];
                              newItems[idx].cost = parseInt(e.target.value) || 0;
                              setExtraItems(newItems);
                            }}
                          />
                        </div>
                      </div>
                      <div className="flex items-end">
                        <button 
                          onClick={() => {
                            setExtraItems(extraItems.filter(i => i.id !== item.id));
                          }}
                          className="w-full md:w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center hover:bg-red-100 transition"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-[8px] text-gray-400 mt-4">* 여기에 입력된 내용은 견적서 하단 요약표에 자동으로 합산되어 표시됩니다.</p>
            </div>
          </div>

          <div className="mt-6 md:mt-12 flex justify-center">
            <button 
              onClick={handleSubmit}
              disabled={loading}
              className={`w-full md:w-auto px-6 py-4 md:px-12 md:py-6 rounded-xl md:rounded-full text-lg md:text-2xl font-black shadow-2xl transition transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3 md:gap-4 ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-900 text-white hover:bg-black'}`}
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-5 w-5 md:h-6 md:w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>AI 일정 생성 중...</span>
                </>
              ) : (
                <>
                  <span>📋</span> AI 일정 및 견적 생성
                </>
              )}
            </button>
          </div>
        </main>

        {/* Price Settings Modal */}
        {showPriceSettings && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-3xl overflow-hidden animate-fade-in-up">
              <div className="bg-gray-900 p-8 text-white flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-black flex items-center gap-3">
                    <span className="text-green-400">🛡️</span> 관리자 단가 설정
                  </h3>
                  <p className="text-xs text-gray-400 font-bold mt-1">항목별 일일 기준 단가(VND)를 설정합니다.</p>
                </div>
                <button onClick={() => setShowPriceSettings(false)} className="text-gray-400 hover:text-white transition text-3xl">&times;</button>
              </div>
              
              <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <h4 className="text-sm font-black text-blue-900 flex items-center gap-2 border-b pb-2">
                    <span>🏢</span> 숙박 시설 (인당/박당)
                  </h4>
                  {Object.entries(unitPrices.accommodation).map(([key, val]) => (
                    <div key={key} className="flex items-center justify-between gap-4">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{key}</span>
                      <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl flex-1">
                        <span className="text-[10px] font-bold text-gray-300">VND</span>
                        <input 
                          type="number" 
                          className="w-full bg-transparent border-none font-black text-right outline-none text-sm"
                          value={val}
                          onChange={(e) => {
                            const newPrices = { ...unitPrices };
                            newPrices.accommodation[key] = parseInt(e.target.value) || 0;
                            setUnitPrices(newPrices);
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-6">
                  <h4 className="text-sm font-black text-green-700 flex items-center gap-2 border-b pb-2">
                    <span>🚐</span> 렌트카 (일당)
                  </h4>
                  {Object.entries(unitPrices.rentCar).map(([key, val]) => (
                    <div key={key} className="flex items-center justify-between gap-4">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{key}</span>
                      <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl flex-1">
                        <span className="text-[10px] font-bold text-gray-300">VND</span>
                        <input 
                          type="number" 
                          className="w-full bg-transparent border-none font-black text-right outline-none text-sm"
                          value={val}
                          onChange={(e) => {
                            const newPrices = { ...unitPrices };
                            newPrices.rentCar[key] = parseInt(e.target.value) || 0;
                            setUnitPrices(newPrices);
                          }}
                        />
                      </div>
                    </div>
                  ))}

                  <h4 className="text-sm font-black text-red-700 flex items-center gap-2 border-b pb-2 pt-4">
                    <span>👤</span> 가이드 (일당)
                  </h4>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">한국어 가이드</span>
                    <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl flex-1">
                      <span className="text-[10px] font-bold text-gray-300">VND</span>
                      <input 
                        type="number" 
                        className="w-full bg-transparent border-none font-black text-right outline-none text-sm"
                        value={unitPrices.guide.korean}
                        onChange={(e) => {
                          const newPrices = { ...unitPrices };
                          newPrices.guide.korean = parseInt(e.target.value) || 0;
                          setUnitPrices(newPrices);
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-10 pt-0">
                <button 
                  onClick={() => setShowPriceSettings(false)}
                  className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black text-lg shadow-xl hover:bg-black transition"
                >
                  설정 저장 후 닫기
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Step 3: Preview View
  if (step === 3 && generatedPlan) {
    return (
      <div className="min-h-screen bg-gray-100 pb-20">
        {/* Header */}
        <header className="bg-white border-b sticky top-0 z-50 px-4 py-3 flex items-center justify-between shadow-sm no-print">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg">망</div>
            <div>
              <h2 className="text-sm font-black text-blue-900">망고 투어 <span className="text-blue-500 font-bold">PREVIEW</span></h2>
              <p className="text-[8px] font-bold text-gray-400 uppercase tracking-tighter">TRAVEL CONCIERGE</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setStep(2)}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-md hover:bg-black transition"
            >
              <span>📄</span> 상세 일정/금액 수정
            </button>
            <button 
              onClick={handleOpenPreview}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-md hover:bg-green-700 transition"
            >
              <span>🖼️</span> 미리보기
            </button>
            <button onClick={() => {
              if (window.confirm('새로운 견적을 작성하시겠습니까?')) {
                setStep(1);
                setGeneratedPlan(null);
              }
            }} className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-gray-50 transition">
              <span>🔄</span> 새 견적
            </button>
          </div>
        </header>

        <div className="max-w-5xl mx-auto my-10 px-4 no-print">
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-center gap-3 text-blue-700 mb-6">
            <span className="text-xl">📄</span>
            <p className="text-sm font-bold">아래는 A4 용지 규격에 맞춘 인쇄 미리보기입니다. [인쇄/PDF] 버튼을 눌러 저장하세요.</p>
          </div>
        </div>

        <div className="flex justify-center bg-gray-100 py-10 overflow-x-auto print:bg-white print:p-0 print:m-0">
          <div 
            ref={quotationRef}
            className="printable-area bg-white shadow-2xl print:shadow-none animate-fade-in"
            style={{ 
              width: '210mm', 
              minHeight: '297mm', 
              padding: '20mm',
              margin: '0 auto'
            }}
          >
          <div className="flex justify-between items-start mb-12">
            <div>
              <h1 className="text-3xl font-black text-gray-900 italic tracking-tighter mb-1">망고 투어 <span className="text-blue-600">VIETNAM</span></h1>
              <p className="text-[8px] font-bold text-gray-400 uppercase tracking-[0.2em]">PREMIUM ITINERARY & OFFICIAL QUOTATION</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-black text-blue-600 underline underline-offset-8">{formData.clientName} 님 귀하</p>
              <p className="text-[10px] text-gray-400 font-bold mt-4">{new Date().toLocaleDateString()} 발행</p>
            </div>
          </div>

          <div className="space-y-12 mb-16">
            {generatedPlan.itinerary.map((day, idx) => (
              <div key={idx} className="relative pl-20 border-l border-gray-100 pb-12 last:pb-0 break-inside-avoid">
                <div className="absolute left-[-12px] top-0 w-6 h-6 rounded-full bg-white border-4 border-gray-900 z-10"></div>
                <div className="absolute left-[-60px] top-0 flex flex-col items-center">
                  <span className="bg-gray-900 text-white text-[8px] font-black px-2 py-0.5 rounded-full mb-1">DAY {day.day}</span>
                  <span className="text-xs font-black text-gray-400">{formData.dailyPlans[idx]?.date}</span>
                </div>

                <div className="space-y-6">
                  {day.activities.map((act, i) => (
                    <div key={i} className="flex items-start gap-6 group">
                      <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-xl shadow-sm group-hover:bg-blue-50 transition">
                        {i === 0 ? '🏨' : i === 1 ? '🍽️' : '📸'}
                      </div>
                      <div className="flex-1 pt-1">
                        <p className="text-sm font-bold text-gray-800 leading-relaxed">{act}</p>
                        <p className="text-[10px] text-gray-400 mt-1 font-medium">
                          {formData.dailyPlans[idx]?.location} | {formData.dailyPlans[idx]?.accommodation}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-gray-50 rounded-3xl p-10 border border-gray-100 break-inside-avoid">
            <h2 className="text-xl font-black text-gray-900 uppercase tracking-widest mb-8 border-b pb-4">QUOTATION SUMMARY</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs font-bold text-gray-400 uppercase tracking-widest border-b pb-2">
                <span>ITEM DESCRIPTION</span>
                <span>AMOUNT (VND)</span>
              </div>

              {generatedPlan.costBreakdown.map((cost, i) => (
                <div key={i} className="flex justify-between items-center py-3 border-b border-gray-100 last:border-none">
                  <div>
                    <p className="text-sm font-black text-gray-800">{cost.item}</p>
                    <p className="text-[10px] text-gray-400 font-bold">전 일정 합산 기준</p>
                  </div>
                  <p className="text-sm font-black text-blue-600 underline underline-offset-4">{cost.cost}</p>
                </div>
              ))}

              <div className="mt-10 bg-gray-900 text-white p-6 rounded-2xl flex justify-between items-center shadow-xl">
                <span className="text-lg font-black uppercase tracking-widest">Total Estimate Balance</span>
                <span className="text-3xl font-black text-green-400">{generatedPlan.totalCost} ₫</span>
              </div>
            </div>
          </div>

          <div className="mt-12 text-center">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">THANK YOU FOR CHOOSING 망고 투어 VIETNAM</p>
          </div>
        </div>
      </div>
    </div>
  );
}

  return null;
};

export default AITripPlanner;
