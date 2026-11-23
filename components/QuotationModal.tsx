import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import A4QuotationDocument, { CostItem, ItineraryDay, ReservationNoticeData } from './A4QuotationDocument';
import { getTravelDays, calculateCostItemTotal } from '../utils/costBreakdownUtils';
import { supabaseService } from '../services/supabaseService';

interface Props {
  product: Product;
  onClose: () => void;
  isAdmin?: boolean;
  showDetailedCosts?: boolean;
  onToggleAdminDetailedCosts?: (show: boolean) => void;
}

const QuotationModal: React.FC<Props> = ({
  product,
  onClose,
  isAdmin = false,
  showDetailedCosts = false,
  onToggleAdminDetailedCosts,
}) => {
  const [customerName, setCustomerName] = useState('고객');
  const [personCount, setPersonCount] = useState(2);
  const [departureDate, setDepartureDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });
  const [includeFastTrack, setIncludeFastTrack] = useState(false);
  const [includeGuide, setIncludeGuide] = useState(true);
  const [uncheckedKeys, setUncheckedKeys] = useState<Record<string, boolean>>({});

  // 1:1 Online Inquiry Modal & Web3Forms submission state
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [inquiryName, setInquiryName] = useState('');
  const [inquiryContact, setInquiryContact] = useState('');
  const [inquiryNotes, setInquiryNotes] = useState('');
  const [isSubmittingInquiry, setIsSubmittingInquiry] = useState(false);
  const [inquiryError, setInquiryError] = useState<string | null>(null);
  const [submissionNotice, setSubmissionNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (!product) return;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverscroll = document.documentElement.style.overscrollBehavior;
    const prevBodyOverscroll = document.body.style.overscrollBehavior;

    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overscrollBehavior = 'none';
    document.body.style.overscrollBehavior = 'none';

    return () => {
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overscrollBehavior = prevHtmlOverscroll;
      document.body.style.overscrollBehavior = prevBodyOverscroll;
    };
  }, [product]);

  if (!product) return null;

  const USD_TO_KRW = 1360;
  const travelDays = getTravelDays(product.duration, product.itinerary);

  // Construct detailed cost items matching user's PDF sample or admin-configured items
  let costItems: CostItem[] = [];

  if (product.costItems && product.costItems.length > 0) {
    product.costItems.forEach((item) => {
      // If item is guide and guide is deselected in quotation controls, skip
      if (item.category.includes('가이드') && !includeGuide) return;
      // If item is fasttrack and fasttrack is deselected, skip
      if ((item.category.includes('패스트트랙') || item.category.includes('의전')) && !includeFastTrack) return;

      const calc = calculateCostItemTotal(item, personCount, travelDays);

      costItems.push({
        category: item.category,
        detail: item.detail,
        quantity: calc.quantity,
        amountUSD: calc.amountUSD,
        amountKRW: calc.amountUSD * USD_TO_KRW,
      });
    });

    // If includeFastTrack is checked but not present in product.costItems, add it
    if (includeFastTrack && !costItems.some(i => i.category.includes('패스트트랙') || i.category.includes('의전'))) {
      const fastTrackUSD = 60 * personCount;
      costItems.push({
        category: 'VIP패스트트랙',
        detail: '공항 도착 시 VIP 전용 패스트트랙 라인 초고속 입국 심사 (대기 없음)',
        quantity: `${personCount}인`,
        amountUSD: fastTrackUSD,
        amountKRW: fastTrackUSD * USD_TO_KRW,
      });
    }

    // If includeGuide is checked but not in product.costItems, add it
    if (includeGuide && !costItems.some(i => i.category.includes('가이드'))) {
      const guideCount = Math.max(1, Math.ceil(personCount / 16));
      const guideTotalUSD = 120 * travelDays * guideCount;
      costItems.push({
        category: '가이드',
        detail: '한국어 전문 가이드 전 일정 단독 동행 케어 (1일 $120 기준)',
        quantity: `${guideCount}명 (${travelDays}일간)`,
        amountUSD: guideTotalUSD,
        amountKRW: guideTotalUSD * USD_TO_KRW,
      });
    }
  } else {
    // Base product fallback
    const basePriceUSD = product.price || 970;
    const vehicleCount = Math.max(1, Math.ceil(personCount / 7));
    const guideCount = Math.max(1, Math.ceil(personCount / 16));

    const golfUSD = Math.round(basePriceUSD * 0.45 * personCount);
    const hotelUSD = Math.round(basePriceUSD * 0.35 * personCount);
    const vehicleUSD = 100 * travelDays * vehicleCount;
    const guideUSD = 120 * travelDays * guideCount;

    costItems = [
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
        amountKRW: golfUSD * USD_TO_KRW,
        amountUSD: golfUSD,
      },
      {
        category: '숙박(호텔)',
        detail: `${product.location} 고급 호텔/리조트 (전 일정 1인 1실 단독 투숙, 조식 뷔페 포함)`,
        quantity: `${personCount}실 (1인실)`,
        amountKRW: hotelUSD * USD_TO_KRW,
        amountUSD: hotelUSD,
      },
      {
        category: '투어/차량',
        detail: '전 일정 단독 VIP 7인승 전용 리무진 밴 (공항 픽업/샌딩 + 골프장 + 시내 전용 기사/유류비 포함)',
        quantity: `${vehicleCount}대 (전일정 ${travelDays}일)`,
        amountKRW: vehicleUSD * USD_TO_KRW,
        amountUSD: vehicleUSD,
      },
    ];

    if (includeGuide) {
      costItems.push({
        category: '가이드',
        detail: '한국어 전문 가이드 전 일정 단독 동행 케어 (1일 $120 기준)',
        quantity: `${guideCount}명 (${travelDays}일간)`,
        amountKRW: guideUSD * USD_TO_KRW,
        amountUSD: guideUSD,
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
  }

  const selectedCostItems = costItems.filter((item, idx) => !uncheckedKeys[`${item.category}__${idx}`]);
  const excludedCostItems = costItems.filter((item, idx) => Boolean(uncheckedKeys[`${item.category}__${idx}`]));

  const groupTotalUSD = selectedCostItems.reduce(
    (acc, it) => acc + (it.amountUSD !== undefined ? it.amountUSD : Math.round(it.amountKRW / USD_TO_KRW)),
    0
  );
  const groupTotalKRW = groupTotalUSD * USD_TO_KRW;
  const perPersonUSD = Math.round(groupTotalUSD / Math.max(1, personCount));
  const perPersonKRW = perPersonUSD * USD_TO_KRW;

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

  // Build dynamic reservationNotice synced with selected recommended product & toggles
  const extractedGolfCourses = (() => {
    if (product.type !== 'golf') return [] as string[];
    const found = new Set<string>();
    const scanText = [
      product.title,
      product.description,
      ...(product.itinerary || []).flatMap(d => d.activities)
    ].join(' ');
    const matches = scanText.match(/([가-힣a-zA-Z0-9&\-\.]+\s*(?:[가-힣a-zA-Z0-9&\-\.]+\s*)?CC)/g);
    if (matches) {
      matches.forEach(m => {
        const cleaned = m.trim().replace(/^[\+\-\·\s]+/, '');
        if (cleaned.length >= 3 && cleaned.length <= 35) found.add(cleaned);
      });
    }
    if (found.size === 0) {
      const golfCost = costItems.find(i => i.category.includes('골프'));
      if (golfCost?.detail) found.add(golfCost.detail);
      else found.add(product.title);
    }
    return Array.from(found);
  })();

  const extractedTourItems = (() => {
    if (product.type === 'golf') return [] as string[];
    const tourCost = costItems.find(i => (i.category.includes('투어') && !i.category.includes('차량')) || i.category.includes('관광'));
    return [tourCost?.detail || `${product.title}${product.description ? ` (${product.description})` : ''}`];
  })();

  const hotelCostItem = costItems.find(i => i.category.includes('숙박') || i.category.includes('호텔') || i.category.includes('리조트') || i.category.includes('풀빌라'));
  const vehicleCostItem = costItems.find(i => i.category.includes('차량') || i.category.includes('리무진'));

  const reservationNotice: ReservationNoticeData = {
    sourceType: 'product',
    productTitle: product.title,
    tripType: product.type,
    region: product.location,
    duration: product.duration,
    golfCourses: extractedGolfCourses,
    tourItems: extractedTourItems,
    accommodation: hotelCostItem?.detail || `${product.location} 고급 호텔/리조트 (1인 1실 기준)`,
    vehicle: vehicleCostItem?.detail || '전 일정 단독 전용 차량',
    extraServices: [
      { name: '한국어 전문 가이드', included: includeGuide },
      { name: '공항 VIP 패스트트랙', included: includeFastTrack },
    ],
  };

  const handleOpenOnlineInquiry = () => {
    setInquiryError(null);
    if (!inquiryName && customerName && customerName !== '고객') {
      setInquiryName(customerName);
    }
    setShowInquiryModal(true);
  };

  const handleSubmitOnlineInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingInquiry) return;

    const trimmedName = (inquiryName || '').trim();
    const trimmedContact = (inquiryContact || '').trim();
    if (!trimmedName || !trimmedContact) {
      setInquiryError('예약자 성함과 연락처(또는 카카오톡 ID)를 입력해주세요.');
      return;
    }

    setIsSubmittingInquiry(true);
    setInquiryError(null);

    try {
      const submittedAt = new Date().toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });
      const golfOrTourSummary =
        product.type === 'golf'
          ? (extractedGolfCourses.length > 0 ? extractedGolfCourses.join(', ') : product.title)
          : (extractedTourItems.length > 0 ? extractedTourItems.join(', ') : product.title);

      const accommodationSummary = hotelCostItem?.detail || `${product.location} 고급 호텔/리조트 (전 일정 1인 1실 기준)`;
      const vehicleSummary = vehicleCostItem?.detail || '전 일정 단독 전용 차량';
      const guideSummary = includeGuide ? '포함 (한국어 전문 가이드)' : '미포함';
      const fastTrackSummary = includeFastTrack ? '포함 (공항 VIP 패스트트랙 / 1인 $60)' : '미포함';

      const costTableLines = selectedCostItems.map((it, idx) => {
        const itemUSD = it.amountUSD !== undefined ? it.amountUSD : Math.round(it.amountKRW / USD_TO_KRW);
        return `${idx + 1}. [${it.category}] ${it.detail} | 수량: ${it.quantity} | $${itemUSD.toLocaleString()} USD (약 ${it.amountKRW.toLocaleString()}원)`;
      });

      const itineraryLines = itineraryDays.map(d => {
        const acts = d.activities
          .map(a => (typeof a === 'string' ? a : `${a.time ? `[${a.time}] ` : ''}${a.desc}`))
          .join(' / ');
        return `• ${d.day}일차 (${d.title}): ${acts}`;
      });

      const extraOptionLines: string[] = [];
      if (includeGuide) extraOptionLines.push('  - 한국어 전문 가이드 포함');
      if (includeFastTrack) extraOptionLines.push('  - 공항 VIP 패스트트랙 포함');

      const formattedMessage = [
        '==================================================',
        '         MANGO TOUR 1:1 온라인 견적 신청서',
        '==================================================',
        '',
        '[1. 고객 신청 정보]',
        `• 예약자 성함: ${trimmedName}`,
        `• 연락처 / 카카오톡 ID: ${trimmedContact}`,
        `• 인원 수: ${personCount}명`,
        `• 출발 희망일: ${departureDate || '미정'}`,
        `• 추가 요청사항: ${inquiryNotes.trim() || '없음'}`,
        `• 접수 일시: ${submittedAt}`,
        '',
        '[2. 정식 A4 견적서 요약 내역]',
        `• 투어명: ${product.title}`,
        `• 여행 지역 / 일정: ${product.location} / ${product.duration} (총 ${travelDays}일 일정)`,
        `• ${product.type === 'golf' ? '라운딩 골프장' : '여행/투어 구성'}: ${golfOrTourSummary}`,
        `• 숙박: ${accommodationSummary}`,
        `• 차량: ${vehicleSummary}`,
        `• 가이드: ${guideSummary}`,
        `• 추가 옵션 (${extraOptionLines.length}건):`,
        extraOptionLines.length > 0 ? extraOptionLines.join('\n') : '  - 기본 상품 구성',
        `• 제외(체크 해제) 항목: ${excludedCostItems.length > 0 ? excludedCostItems.map(o => o.category).join(' / ') : '없음'}`,
        '',
        '[3. 정식 A4 견적서 — 경비 세부 내역표]',
        ...(costTableLines.length > 0 ? costTableLines : ['(선택된 세부 경비 항목 없음)']),
        '',
        '[4. 최종 예상 견적 합계]',
        `• 1인당 예상 금액: $${perPersonUSD.toLocaleString()} USD (약 ${perPersonKRW.toLocaleString()}원)`,
        `• 총 예상 견적 합계 (${personCount}인 기준): $${groupTotalUSD.toLocaleString()} USD (약 ${groupTotalKRW.toLocaleString()}원)`,
        '  ※ 환율 1 USD = 1,360 KRW 기준 / 차량·가이드는 인원수 무관 일정 총액 적용',
        '',
        ...(itineraryLines.length > 0 ? ['[5. 예정 일정표 요약]', ...itineraryLines, ''] : []),
        '==================================================',
        'MANGO TOUR | +84 37 720 4451 | Kakao: MANGO TOUR',
      ].join('\n');

      const response = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          access_key: '58044e40-51a1-4f63-9248-81b6b1bca9ef',
          subject: `[MANGO TOUR 견적신청] ${trimmedName}님의 맞춤 견적 문의`,
          from_name: 'MANGO TOUR 온라인 견적',
          name: trimmedName,
          message: formattedMessage,
        }),
      });

      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.success) {
        throw new Error(result?.message || `Web3Forms error (${response.status})`);
      }

      // Supabase 비동기 백업 저장 (실패해도 메일 발송 성공에 영향 없음)
      try {
        await supabaseService.saveInquiry({
          _subject: `[MANGO TOUR 견적신청] ${trimmedName}님의 맞춤 견적 문의`,
          유형: '추천상품 견적신청',
          예약자명: trimmedName,
          연락처_카카오톡ID: trimmedContact,
          상품명: product.title,
          지역: product.location,
          기간: product.duration,
          출발희망일: departureDate || '미정',
          여행인원: `${personCount}명`,
          가이드: guideSummary,
          패스트트랙: fastTrackSummary,
          '1인_예상금액': `$${perPersonUSD.toLocaleString()} (약 ${perPersonKRW.toLocaleString()}원)`,
          '총_예상견적': `$${groupTotalUSD.toLocaleString()} (약 ${groupTotalKRW.toLocaleString()}원)`,
          고객요청사항: inquiryNotes.trim() || '없음',
          접수일시: submittedAt,
        });
      } catch (dbErr) {
        console.warn('Supabase inquiry backup skipped:', dbErr);
      }

      setCustomerName(trimmedName);
      setShowInquiryModal(false);
      setInquiryError(null);
      setSubmissionNotice({
        type: 'success',
        message: '견적 신청이 성공적으로 접수되었습니다. 담당 매니저가 곧 연락드리겠습니다.',
      });
    } catch (err) {
      console.error('Web3Forms submission failed:', err);
      setInquiryError('전송에 실패했습니다. 잠시 후 다시 시도하거나 카카오톡으로 문의해 주세요.');
    } finally {
      setIsSubmittingInquiry(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/55 z-[10000] flex items-end md:items-center justify-center p-0 md:p-4 backdrop-blur-sm overflow-hidden overscroll-contain animate-fade-in print:p-0 print:block print:bg-white print:static print:overflow-visible pt-safe"
      onClick={onClose}
    >
      <div
        className="bg-[#F2F2F7] w-full max-w-none md:max-w-4xl max-h-[92vh] md:h-auto md:max-h-[94vh] rounded-t-3xl md:rounded-[20px] shadow-2xl relative flex flex-col overflow-hidden md:my-auto animate-ios-sheet-up print:max-h-none print:shadow-none print:bg-white print:w-full print:rounded-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mt-2.5 mb-1 md:hidden no-print shrink-0"></div>
        {/* Top Control Bar inside Modal (no-print) */}
        <div className="no-print bg-white/90 backdrop-blur-md px-3 md:px-6 py-2.5 md:py-3 border-b border-black/[0.06] flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <button
              type="button"
              onClick={onClose}
              className="flex sm:hidden items-center justify-center w-8 h-8 rounded-full bg-[#F2F2F7] hover:bg-gray-200 text-[#3A3A3C] active:scale-95 transition shrink-0 cursor-pointer"
              aria-label="뒤로가기"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M15 19l-7-7 7-7" />
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
              <span>{showDetailedCosts ? '패스트트랙 (+$60)' : '패스트트랙'}</span>
            </label>

            <label className="hidden sm:flex items-center gap-1 text-xs cursor-pointer font-bold text-gray-700 bg-indigo-50 px-2 py-1 rounded-lg border border-indigo-200">
              <input
                type="checkbox"
                checked={includeGuide}
                onChange={(e) => setIncludeGuide(e.target.checked)}
                className="rounded text-gold-500"
              />
              <span>{showDetailedCosts ? '가이드 ($120)' : '가이드'}</span>
            </label>

            <div className="flex items-center gap-1 bg-gray-50 border border-gray-200 rounded-lg px-2 sm:px-2.5 py-1 whitespace-nowrap">
              <span className="text-gray-500 font-bold text-[11px] sm:text-xs whitespace-nowrap">인원:</span>
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
              className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center font-bold text-sm transition cursor-pointer shrink-0"
              aria-label="닫기"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Mobile Quick Option Strip (scrollable horizontally) */}
        <div className="sm:hidden no-print bg-gray-50/95 border-b border-gray-200 px-2.5 py-1.5 flex items-center gap-2 overflow-x-auto scrollbar-hide text-xs shrink-0 whitespace-nowrap">
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-2 py-1 shrink-0 whitespace-nowrap">
            <span className="text-[10px] text-gray-500 font-bold">고객명:</span>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-14 text-xs font-bold outline-none"
            />
          </div>
          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-2 py-1 shrink-0 whitespace-nowrap">
            <span className="text-[10px] text-gray-500 font-bold">출발일:</span>
            <input
              type="date"
              value={departureDate}
              onChange={(e) => setDepartureDate(e.target.value)}
              className="text-xs font-bold outline-none"
            />
          </div>
          <label className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 border border-amber-200 font-bold text-[11px] text-amber-900 shrink-0 cursor-pointer whitespace-nowrap">
            <input
              type="checkbox"
              checked={includeFastTrack}
              onChange={(e) => setIncludeFastTrack(e.target.checked)}
              className="rounded text-gold-500"
            />
            <span>{showDetailedCosts ? '패스트트랙 (+$60)' : '패스트트랙'}</span>
          </label>
          <label className="flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-50 border border-indigo-200 font-bold text-[11px] text-indigo-900 shrink-0 cursor-pointer whitespace-nowrap">
            <input
              type="checkbox"
              checked={includeGuide}
              onChange={(e) => setIncludeGuide(e.target.checked)}
              className="rounded text-indigo-600"
            />
            <span>{showDetailedCosts ? '가이드 ($120)' : '가이드'}</span>
          </label>
        </div>

        {/* Admin Pricing Visibility Toggle Bar */}
        {isAdmin && onToggleAdminDetailedCosts && (
          <div className="no-print bg-amber-50/95 border-b border-amber-200/80 px-3 md:px-6 py-2 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
            <div className="flex items-center gap-1.5 text-amber-950 font-bold min-w-0">
              <span>🔐</span>
              <span>관리자 견적 금액 표시</span>
              <span className="hidden sm:inline text-[11px] font-medium text-amber-800">
                (비골프 세부 금액 보이기/숨기기)
              </span>
            </div>
            <div className="inline-flex items-center bg-white p-0.5 rounded-xl border border-amber-200 shadow-2xs shrink-0">
              <button
                type="button"
                onClick={() => onToggleAdminDetailedCosts(false)}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer whitespace-nowrap ${
                  !showDetailedCosts
                    ? 'bg-[#0A7E54] text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                합산·골프만 보기
              </button>
              <button
                type="button"
                onClick={() => onToggleAdminDetailedCosts(true)}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition cursor-pointer whitespace-nowrap ${
                  showDetailedCosts
                    ? 'bg-[#0A7E54] text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                세부금액 전체 보기
              </button>
            </div>
          </div>
        )}

        {/* Scrollable Document Area */}
        <div
          className="flex-1 overflow-y-auto overscroll-contain p-0 md:p-6 print:p-0 print:overflow-visible"
          style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}
        >
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
            notes={`선택 상품: ${product.title} | 패스트트랙: ${includeFastTrack ? (showDetailedCosts ? '포함 ($60/인)' : '포함') : '미포함 (선택 가능)'} | 가이드: ${includeGuide ? (showDetailedCosts ? '포함 (1일 $120)' : '포함') : '미포함'}`}
            reservationNotice={reservationNotice}
            onClose={onClose}
            showControls={true}
            showDetailedCosts={showDetailedCosts}
            uncheckedKeys={uncheckedKeys}
            onUncheckedKeysChange={setUncheckedKeys}
          />
        </div>

        {/* Unified Sticky Bottom Action Bar for 1:1 Online Application */}
        <div
          className="no-print bg-white/95 backdrop-blur-md border-t border-black/[0.08] px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between gap-2.5 shrink-0 z-20"
          style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 0.75rem)' }}
        >
          <div className="min-w-0">
            <span className="text-[10px] sm:text-xs text-[#8E8E93] font-semibold block">
              총 {personCount}인 예상 견적 (1인 약 ${perPersonUSD.toLocaleString()})
            </span>
            <div className="text-sm sm:text-lg font-black text-[#0A7E54] tabular-nums truncate">
              ${groupTotalUSD.toLocaleString()} USD
              <span className="text-[11px] sm:text-xs text-[#3A3A3C] font-medium ml-1">
                (약 {groupTotalKRW.toLocaleString()}원)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href="https://open.kakao.com/o/gprQnKSi"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-3 bg-[#FEE500] hover:bg-[#FDD835] text-[#191919] font-bold rounded-xl text-xs sm:text-sm transition active:scale-95"
            >
              <span>💬</span>
              <span>카톡 상담</span>
            </a>
            <button
              type="button"
              onClick={handleOpenOnlineInquiry}
              className="px-4 sm:px-6 py-3 bg-[#0A7E54] hover:bg-[#086945] text-white font-bold rounded-xl text-xs sm:text-sm md:text-base shadow-md transition-all duration-200 flex items-center gap-1.5 active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <span>📩</span>
              <span>1:1 온라인 견적 신청하기</span>
            </button>
          </div>
        </div>
      </div>

      {/* ================= 1:1 ONLINE INQUIRY MODAL (Unified with TripPlanner) ================= */}
      {showInquiryModal && (
        <div
          className="no-print fixed inset-0 bg-black/60 z-[10002] flex items-end md:items-center justify-center p-0 md:p-4 backdrop-blur-sm animate-fade-in overflow-hidden overscroll-contain select-text font-sans break-keep"
          onClick={() => setShowInquiryModal(false)}
        >
          <div
            className="bg-white rounded-t-3xl md:rounded-[20px] max-w-none md:max-w-lg w-full max-h-[90vh] relative shadow-2xl animate-ios-sheet-up flex flex-col overflow-hidden box-border"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mt-2.5 mb-1 md:hidden shrink-0" />
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4 border-b border-black/[0.06] bg-white/95 backdrop-blur-md sticky top-0 z-30 shrink-0">
              <button
                type="button"
                onClick={() => setShowInquiryModal(false)}
                className="flex items-center gap-1 px-3 py-1.5 bg-[#F2F2F7] hover:bg-gray-200 text-[#3A3A3C] text-xs font-semibold rounded-full transition active:scale-95 cursor-pointer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>닫기</span>
              </button>
              <span className="font-bold text-sm sm:text-base md:text-lg text-gray-900 tracking-tight">
                1:1 온라인 맞춤 견적 신청
              </span>
              <button
                type="button"
                onClick={() => setShowInquiryModal(false)}
                className="text-[#8E8E93] hover:text-gray-900 font-bold text-base w-8 h-8 flex items-center justify-center rounded-full bg-[#F2F2F7] hover:bg-gray-200 transition active:scale-95 cursor-pointer"
                aria-label="닫기"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitOnlineInquiry} className="flex-1 flex flex-col overflow-hidden">
              <div
                className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 md:px-6 md:py-5 space-y-3.5 text-xs md:text-sm"
                style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 bg-[#ECFDF5] text-[#0A7E54] text-[11px] md:text-xs font-semibold rounded-full shrink-0">
                    온라인 공식 접수
                  </span>
                  <span className="text-xs text-[#8E8E93] font-medium">
                    온라인 견적 신청서로 즉시 접수됩니다
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">
                  1:1 맞춤 견적서 온라인 접수
                </h3>
                <p className="text-xs md:text-sm text-[#8E8E93] break-keep">
                  선택하신 상품 구성과 정식 A4 견적 내역이 담당 매니저에게 즉시 접수됩니다.
                </p>

                {/* A4 Quotation Summary Card */}
                <div className="p-3.5 bg-[#F2F2F7] rounded-2xl space-y-2 border border-black/[0.04]">
                  <div className="flex items-center justify-between gap-2 border-b border-gray-200/80 pb-2">
                    <span className="text-xs font-bold text-gray-900">📋 전송될 정식 A4 견적 내역</span>
                    <span className="text-[11px] font-semibold text-[#0A7E54] bg-white px-2 py-0.5 rounded-full">
                      선택 {selectedCostItems.length}개 항목
                    </span>
                  </div>
                  <div className="text-[11px] md:text-xs text-[#3A3A3C] space-y-1">
                    <div>
                      <span className="text-[#8E8E93] font-semibold">상품명:</span>{' '}
                      <strong className="text-gray-900">{product.title}</strong>
                    </div>
                    <div>
                      <span className="text-[#8E8E93] font-semibold">지역/기간:</span>{' '}
                      베트남 {product.location} ({product.duration})
                    </div>
                    <div>
                      <span className="text-[#8E8E93] font-semibold">포함 옵션:</span>{' '}
                      가이드 {includeGuide ? '포함' : '미포함'} · VIP 패스트트랙 {includeFastTrack ? '포함' : '미포함'}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-[#3A3A3C] block mb-1.5 text-xs md:text-sm">
                    예약자 성함 / 대표자명 *
                  </label>
                  <input
                    type="text"
                    required
                    value={inquiryName}
                    onChange={(e) => {
                      setInquiryName(e.target.value);
                      if (e.target.value.trim()) {
                        setCustomerName(e.target.value);
                      }
                    }}
                    placeholder="홍길동"
                    className="w-full box-border p-3 md:p-3.5 bg-[#F2F2F7] rounded-xl font-medium outline-none focus:ring-2 focus:ring-[#0A7E54]/30 focus:bg-white transition text-sm md:text-base"
                  />
                </div>

                <div>
                  <label className="font-semibold text-[#3A3A3C] block mb-1.5 text-xs md:text-sm">
                    연락처 또는 카카오톡 ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={inquiryContact}
                    onChange={(e) => setInquiryContact(e.target.value)}
                    placeholder="010-1234-5678 또는 카카오톡ID"
                    className="w-full box-border p-3 md:p-3.5 bg-[#F2F2F7] rounded-xl font-medium outline-none focus:ring-2 focus:ring-[#0A7E54]/30 focus:bg-white transition text-sm md:text-base"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="min-w-0">
                    <label className="font-semibold text-[#3A3A3C] block mb-1.5 text-xs md:text-sm">
                      인원 수
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={personCount}
                      onChange={(e) => setPersonCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-full box-border p-3 md:p-3.5 bg-[#F2F2F7] rounded-xl font-medium outline-none focus:ring-2 focus:ring-[#0A7E54]/30 focus:bg-white transition text-sm md:text-base"
                    />
                  </div>
                  <div className="min-w-0">
                    <label className="font-semibold text-[#3A3A3C] block mb-1.5 text-xs md:text-sm">
                      출발 희망일
                    </label>
                    <input
                      type="date"
                      value={departureDate}
                      onChange={(e) => setDepartureDate(e.target.value)}
                      className="w-full box-border p-3 md:p-3.5 bg-[#F2F2F7] rounded-xl font-medium outline-none focus:ring-2 focus:ring-[#0A7E54]/30 focus:bg-white transition text-sm md:text-base"
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-[#3A3A3C] block mb-1.5 text-xs md:text-sm">
                    추가 요청사항 (선택)
                  </label>
                  <textarea
                    rows={2}
                    value={inquiryNotes}
                    onChange={(e) => setInquiryNotes(e.target.value)}
                    placeholder="티타임 시간대, 선호 호텔 유형, 클럽 렌탈 여부 등"
                    className="w-full box-border p-3 md:p-3.5 bg-[#F2F2F7] rounded-xl font-medium outline-none focus:ring-2 focus:ring-[#0A7E54]/30 focus:bg-white transition resize-none text-sm md:text-base"
                  />
                </div>

                <div className="p-3.5 md:p-4 bg-[#ECFDF5] rounded-2xl flex justify-between items-center">
                  <div className="min-w-0 mr-2">
                    <span className="text-[11px] md:text-xs text-[#0A7E54] block font-semibold">
                      총 {personCount}인 예상 견적 (1인 약 ${perPersonUSD.toLocaleString()})
                    </span>
                    <div className="font-extrabold text-[#0A7E54] text-base sm:text-lg md:text-xl tracking-tight tabular-nums">
                      ${groupTotalUSD.toLocaleString()} <span className="text-xs font-semibold">USD</span>
                    </div>
                    <div className="text-[11px] text-[#3A3A3C] font-medium">
                      (약 {groupTotalKRW.toLocaleString()}원)
                    </div>
                  </div>
                  <div className="text-[11px] text-[#0A7E54] font-semibold bg-white px-2.5 py-1 rounded-full shrink-0">
                    항목 {selectedCostItems.length}개
                  </div>
                </div>

                {inquiryError && (
                  <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs md:text-sm text-red-700 font-semibold space-y-2">
                    <p>⚠️ {inquiryError}</p>
                    <a
                      href="https://open.kakao.com/o/gprQnKSi"
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FEE500] text-[#191919] rounded-xl text-xs font-bold hover:bg-[#FDD835] transition"
                    >
                      <span>💬</span>
                      <span>카카오톡으로 바로 문의하기</span>
                    </a>
                  </div>
                )}
              </div>

              <div
                className="bg-white/95 backdrop-blur-md px-4 py-3 md:px-6 md:py-4 border-t border-black/[0.06] shrink-0 z-30"
                style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 0.75rem)' }}
              >
                <button
                  type="submit"
                  disabled={isSubmittingInquiry}
                  className="w-full py-3.5 md:py-4 bg-[#0A7E54] hover:bg-[#086945] text-white font-bold rounded-2xl text-sm sm:text-base active:scale-95 disabled:opacity-75 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer transition-all duration-200"
                >
                  <span className="font-bold tracking-tight">
                    {isSubmittingInquiry ? '발송 중...' : '1:1 온라인 견적 신청서 발송하기'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= SUBMISSION RESULT NOTICE MODAL ================= */}
      {submissionNotice && (
        <div
          className="no-print fixed inset-0 z-[10008] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in"
          onClick={() => setSubmissionNotice(null)}
        >
          <div
            className="bg-white rounded-[20px] max-w-sm w-full p-6 text-center shadow-2xl space-y-4 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-2xl font-bold">
              ✓
            </div>
            <h4 className="text-lg font-extrabold text-gray-900 tracking-tight">
              견적 신청 접수 완료
            </h4>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed break-keep">
              {submissionNotice.message}
            </p>
            <button
              type="button"
              onClick={() => setSubmissionNotice(null)}
              className="w-full py-3 bg-[#0A7E54] hover:bg-[#086945] text-white font-bold rounded-xl text-sm transition cursor-pointer active:scale-95"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuotationModal;
