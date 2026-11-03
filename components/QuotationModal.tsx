import React, { useState } from 'react';
import { Product } from '../types';
import A4QuotationDocument, { CostItem, ItineraryDay } from './A4QuotationDocument';

interface Props {
  product: Product;
  onClose: () => void;
}

const QuotationModal: React.FC<Props> = ({ product, onClose }) => {
  const [customerName, setCustomerName] = useState('고객');
  const [personCount, setPersonCount] = useState(2);
  const [departureDate, setDepartureDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });
  const [includeFastTrack, setIncludeFastTrack] = useState(false);
  const [includeGuide, setIncludeGuide] = useState(true);

  if (!product) return null;

  const USD_TO_KRW = 1360;

  // Base product cost
  const basePriceUSD = product.price || 970;
  let singleTotalUSD = basePriceUSD;
  if (includeFastTrack) singleTotalUSD += 60;
  if (!includeGuide) singleTotalUSD = Math.max(0, singleTotalUSD - 120);

  const groupTotalUSD = singleTotalUSD * personCount;
  const groupTotalKRW = groupTotalUSD * USD_TO_KRW;

  // Construct detailed cost items matching user's PDF sample
  const costItems: CostItem[] = [
    {
      category: '항공권',
      detail: '국제선 왕복 항공권 (개별 발권 또는 망고투어 실시간 발권 대행)',
      quantity: `${personCount}인`,
      amountKRW: 0,
      amountUSD: 0,
    },
    {
      category: product.type === 'golf' ? '골프(그린피)' : '투어/관광',
      detail: product.type === 'golf'
        ? `${product.title} - 정규 18홀 라운딩 그린피 일체`
        : `${product.title} - 전 일정 주요 명소 단독 투어 및 입장료`,
      quantity: `${personCount}인`,
      amountKRW: Math.round(singleTotalUSD * 0.45 * personCount * USD_TO_KRW),
      amountUSD: Math.round(singleTotalUSD * 0.45 * personCount),
    },
    {
      category: '숙박(호텔)',
      detail: `${product.location} 5성급 럭셔리 호텔/리조트 (전 일정 1인 1실 단독 투숙, 조식 뷔페 포함)`,
      quantity: `${personCount}실 (1인실)`,
      amountKRW: Math.round(singleTotalUSD * 0.35 * personCount * USD_TO_KRW),
      amountUSD: Math.round(singleTotalUSD * 0.35 * personCount),
    },
    {
      category: '투어/차량',
      detail: '전 일정 단독 VIP 전용 리무진 밴 (공항 픽업/샌딩 + 골프장 + 시내 전용 기사/유류비 포함)',
      quantity: '1대 (전일정)',
      amountKRW: Math.round(singleTotalUSD * 0.10 * personCount * USD_TO_KRW),
      amountUSD: Math.round(singleTotalUSD * 0.10 * personCount),
    },
  ];

  if (includeGuide) {
    costItems.push({
      category: '가이드',
      detail: '한국어 전문 가이드 전 일정 단독 동행 케어 (1일 $120 기준)',
      quantity: '1식',
      amountKRW: 120 * personCount * USD_TO_KRW,
      amountUSD: 120 * personCount,
    });
  }

  if (includeFastTrack) {
    costItems.push({
      category: 'VIP패스트트랙',
      detail: '공항 도착 시 VIP 전용 패스트트랙 라인 초고속 입국 심사 (대기 없음)',
      quantity: `${personCount}인`,
      amountKRW: 60 * personCount * USD_TO_KRW,
      amountUSD: 60 * personCount,
    });
  }

  // Format Itinerary
  const itineraryDays: ItineraryDay[] = (product.itinerary || []).map((item) => ({
    day: item.day,
    title: item.activities[0] ? item.activities[0].replace(/.*?(도착|체크인|라운딩|투어|휴식|귀국).*/, '$1 및 자유 일정') : `${product.location} 일정`,
    activities: item.activities.map((act, i) => {
      let time = '09:00 - 12:00';
      if (item.day === 1) {
        time = i === 0 ? '10:00 - 13:30' : i === 1 ? '15:00 ~' : '18:00 ~';
      } else if (item.day === (product.itinerary?.length || 4)) {
        time = i === 0 ? '09:00 - 12:00' : '14:00 - 22:00';
      } else {
        time = i === 0 ? '08:00 - 13:00' : i === 1 ? '13:30 - 17:00' : '18:00 - 20:30';
      }
      return { time, desc: act };
    }),
  }));

  return (
    <div className="fixed inset-0 bg-black/75 z-[10000] flex items-center justify-center p-0 sm:p-4 backdrop-blur-sm overflow-y-auto animate-fade-in print:p-0 print:block print:bg-white print:static pt-safe">
      <div className="bg-gray-100 w-full max-w-4xl h-full sm:h-auto sm:max-h-[96vh] sm:rounded-3xl shadow-2xl relative flex flex-col overflow-hidden my-auto print:max-h-none print:shadow-none print:bg-white print:w-full print:rounded-none">
        
        {/* Top Control Bar inside Modal (no-print) */}
        <div className="no-print bg-white px-3 sm:px-6 py-2.5 sm:py-3 border-b border-gray-200 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <button
              type="button"
              onClick={onClose}
              className="flex sm:hidden items-center justify-center w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 active:scale-95 transition shrink-0 cursor-pointer"
              aria-label="뒤로가기"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-lg sm:text-xl shrink-0">📄</span>
            <div className="min-w-0">
              <span className="font-extrabold text-xs sm:text-base text-gray-900 block truncate">
                {product.title}
              </span>
              <span className="text-[10px] text-gold-600 font-bold block sm:hidden">
                여행 견적 및 일정 안내서
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 text-xs shrink-0">
            {/* Desktop Quick Controls */}
            <div className="hidden sm:flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1">
              <span className="text-gray-500 font-bold">고객명:</span>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="고객 성함"
                className="w-16 bg-white border border-gray-300 rounded px-1.5 py-0.5 text-xs font-bold outline-none"
              />
            </div>

            <div className="hidden md:flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1">
              <span className="text-gray-500 font-bold">출발일:</span>
              <input
                type="date"
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
                className="bg-white border border-gray-300 rounded px-1.5 py-0.5 text-xs font-bold outline-none"
              />
            </div>

            <label className="hidden sm:flex items-center gap-1 text-xs cursor-pointer font-bold text-gray-700 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">
              <input
                type="checkbox"
                checked={includeFastTrack}
                onChange={(e) => setIncludeFastTrack(e.target.checked)}
                className="rounded text-gold-500"
              />
              <span>패스트트랙 (+$60)</span>
            </label>

            <label className="hidden sm:flex items-center gap-1 text-xs cursor-pointer font-bold text-gray-700 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-200">
              <input
                type="checkbox"
                checked={includeGuide}
                onChange={(e) => setIncludeGuide(e.target.checked)}
                className="rounded text-gold-500"
              />
              <span>가이드 ($120)</span>
            </label>

            <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg px-2 sm:px-2.5 py-1">
              <span className="text-gray-500 font-bold text-[11px] sm:text-xs">인원:</span>
              <select
                value={personCount}
                onChange={(e) => setPersonCount(Number(e.target.value))}
                className="bg-white border border-gray-300 rounded px-1.5 py-0.5 text-xs font-bold outline-none cursor-pointer"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 12, 16].map((n) => (
                  <option key={n} value={n}>{n}인</option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center font-bold text-sm transition cursor-pointer"
              aria-label="닫기"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Mobile Quick Option Strip (scrollable horizontally) */}
        <div className="sm:hidden no-print bg-gray-50/95 border-b border-gray-200 px-3 py-1.5 flex items-center gap-2 overflow-x-auto scrollbar-hide text-xs shrink-0">
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-2 py-1 shrink-0">
            <span className="text-[10px] text-gray-500 font-bold">고객명:</span>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-14 text-xs font-bold outline-none"
            />
          </div>
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-2 py-1 shrink-0">
            <span className="text-[10px] text-gray-500 font-bold">출발일:</span>
            <input
              type="date"
              value={departureDate}
              onChange={(e) => setDepartureDate(e.target.value)}
              className="text-xs font-bold outline-none"
            />
          </div>
          <label className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 border border-amber-200 font-bold text-[11px] text-amber-900 shrink-0 cursor-pointer">
            <input
              type="checkbox"
              checked={includeFastTrack}
              onChange={(e) => setIncludeFastTrack(e.target.checked)}
              className="rounded text-gold-500"
            />
            <span>패스트트랙 (+$60)</span>
          </label>
          <label className="flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-50 border border-indigo-200 font-bold text-[11px] text-indigo-900 shrink-0 cursor-pointer">
            <input
              type="checkbox"
              checked={includeGuide}
              onChange={(e) => setIncludeGuide(e.target.checked)}
              className="rounded text-indigo-600"
            />
            <span>가이드 ($120)</span>
          </label>
        </div>

        {/* Scrollable Document Area */}
        <div className="flex-1 overflow-y-auto p-1.5 xs:p-2 sm:p-6 print:p-0 print:overflow-visible">
          <A4QuotationDocument
            customerName={customerName}
            personCount={personCount}
            managerName="망고투어 전문 상담팀"
            managerContact="+84 37 720 4451"
            location={product.location}
            duration={product.duration}
            departureDate={departureDate}
            totalPriceKRW={groupTotalKRW}
            totalPriceUSD={groupTotalUSD}
            costItems={costItems}
            itinerary={itineraryDays}
            notes={`숙박: 1인 객실 기준 (1인 1실 단독 투숙) | 패스트트랙: ${includeFastTrack ? '포함 ($60)' : '선택 가능 ($60)'} | 가이드: ${includeGuide ? '1일 $120 포함' : '제외'}`}
            onClose={onClose}
            showControls={true}
          />
        </div>
      </div>
    </div>
  );
};

export default QuotationModal;
