import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

export interface CostItem {
  category: string;
  detail: string;
  quantity: string;
  amountKRW: number;
  amountUSD?: number;
}

export interface ItineraryDay {
  day: number;
  dateStr?: string;
  title: string;
  activities: Array<{ time?: string; desc: string }> | string[];
}

export interface ReservationNoticeData {
  sourceType?: 'product' | 'diy';
  productTitle?: string;
  tripType?: 'golf' | 'tour' | 'hotel';
  region?: string;
  duration?: string;
  golfCourses?: string[];
  tourItems?: string[];
  accommodation?: string;
  vehicle?: string;
  extraServices?: Array<{ name: string; included: boolean }>;
  excludedItems?: string[];
}

export interface A4QuotationProps {
  customerName?: string;
  personCount?: number;
  managerName?: string;
  managerContact?: string;
  location?: string;
  duration?: string;
  departureDate?: string;
  returnDate?: string;
  totalPriceKRW?: number;
  totalPriceUSD?: number;
  costItems?: CostItem[];
  itinerary?: ItineraryDay[];
  notes?: string;
  reservationNotice?: ReservationNoticeData;
  onClose?: () => void;
  showControls?: boolean;
}

export const A4QuotationDocument: React.FC<A4QuotationProps> = ({
  customerName = '고객',
  personCount = 2,
  managerName = '망고투어 전문 상담팀',
  managerContact = '+84 37 720 4451 (카카오: vnseen1)',
  location = '베트남 호치민 / 붕따우',
  duration = '4박 5일',
  departureDate,
  returnDate,
  totalPriceKRW,
  totalPriceUSD,
  costItems = [],
  itinerary = [],
  notes,
  reservationNotice,
  onClose,
  showControls = true,
}) => {
  const documentRef = useRef<HTMLDivElement>(null);
  const exactA4Ref = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [uncheckedKeys, setUncheckedKeys] = useState<Record<string, boolean>>({});

  const getCostItemKey = (item: CostItem, idx: number) => `${item.category}__${idx}`;

  const isCostItemSelected = (item: CostItem, idx: number) =>
    !uncheckedKeys[getCostItemKey(item, idx)];

  const toggleCostItem = (item: CostItem, idx: number) => {
    const key = getCostItemKey(item, idx);
    setUncheckedKeys((prev) => {
      const next = { ...prev };
      if (next[key]) {
        delete next[key];
      } else {
        next[key] = true;
      }
      return next;
    });
  };

  const selectAllCostItems = () => {
    setUncheckedKeys({});
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Calculate default dates if not provided
  const getComputedDateRange = () => {
    if (departureDate && returnDate) {
      return `${departureDate.replace(/-/g, '.')} ~ ${returnDate.replace(/-/g, '.')}`;
    }
    const d = departureDate ? new Date(departureDate) : new Date(Date.now() + 14 * 86400000);
    const startStr = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
    const nights = parseInt(duration.match(/(\d+)\s*박/)?.[1] || '4', 10);
    const end = new Date(d.getTime() + nights * 86400000);
    const endStr = `${end.getFullYear()}.${String(end.getMonth() + 1).padStart(2, '0')}.${String(end.getDate()).padStart(2, '0')}`;
    return `${startStr} ~ ${endStr}`;
  };

  const formattedDateRange = getComputedDateRange();

  // Compute Day Date for Itinerary items
  const getDayDateStr = (dayIdx: number) => {
    try {
      const parts = formattedDateRange.split('~')[0].trim().split('.');
      if (parts.length === 3) {
        const base = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        const dayDate = new Date(base.getTime() + (dayIdx - 1) * 86400000);
        return `${String(dayDate.getMonth() + 1).padStart(2, '0')}/${String(dayDate.getDate()).padStart(2, '0')}`;
      }
    } catch {
      // fallback
    }
    return `Day ${dayIdx}`;
  };

  // Print A4 Document
  const handlePrint = () => {
    window.print();
  };

  // Export PDF using jsPDF + html2canvas (Targets the exact A4 layout matching user PDF sample)
  const handleExportPDF = async () => {
    const targetElement = exactA4Ref.current || documentRef.current;
    if (!targetElement || isExporting) return;
    setIsExporting(true);
    showToast('📄 정식 A4 규격 PDF를 생성 중입니다...');
    try {
      await new Promise((r) => setTimeout(r, 150));
      const canvas = await html2canvas(targetElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: 794,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pageHeight;
      }

      const fileName = `망고투어_정식견적서_${customerName}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      showToast('📥 정식 A4 PDF 다운로드가 완료되었습니다.');
    } catch (err) {
      console.error('PDF export error:', err);
      showToast('⚠️ PDF 생성 중 오류가 발생했습니다. A4 인쇄 기능을 이용해주세요.');
    } finally {
      setIsExporting(false);
    }
  };

  // Download high-resolution PNG (Targets exact A4 layout)
  const handleDownloadPNG = async () => {
    const targetElement = exactA4Ref.current || documentRef.current;
    if (!targetElement || isExporting) return;
    setIsExporting(true);
    showToast('📸 정식 견적서 고해상도 이미지를 생성 중입니다...');
    try {
      await new Promise((r) => setTimeout(r, 150));
      const canvas = await html2canvas(targetElement, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        windowWidth: 794,
      });
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `망고투어_정식견적서_${customerName}_${new Date().toISOString().split('T')[0]}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast('📥 정식 견적서 이미지가 저장되었습니다.');
    } catch (err) {
      console.error('PNG download error:', err);
      showToast('⚠️ 이미지 생성에 실패했습니다.');
    } finally {
      setIsExporting(false);
    }
  };

  // Selected items & dynamic totals (recalculated immediately on checkbox toggle)
  const selectedCostItems = costItems.filter((item, idx) => isCostItemSelected(item, idx));
  const hasCostItems = costItems.length > 0;
  const computedSelectedUSD = selectedCostItems.reduce((sum, item) => {
    const itemUSD = item.amountUSD !== undefined ? item.amountUSD : Math.round(item.amountKRW / 1360);
    return sum + itemUSD;
  }, 0);
  const computedSelectedKRW = selectedCostItems.reduce((sum, item) => sum + (item.amountKRW || 0), 0);

  const finalTotalKRW = hasCostItems ? computedSelectedKRW : (totalPriceKRW || 0);
  const finalTotalUSD = hasCostItems ? computedSelectedUSD : (totalPriceUSD || 0);

  // Dynamically compute [망고투어 예약 안내 사항] from reservationNotice + live selectedCostItems
  const computedNotice = (() => {
    const uncheckedCostItems = costItems.filter((item, idx) => !isCostItemSelected(item, idx));
    const isFastTrackItem = (i: CostItem) =>
      i.category.includes('패스트') ||
      i.detail.includes('패스트트랙') ||
      i.detail.includes('패스트 트랙') ||
      i.category === 'VIP패스트트랙' ||
      i.category === '공항 VIP 의전';
    const isGuideItem = (i: CostItem) => i.category.includes('가이드');
    const isGolfItem = (i: CostItem) => i.category.includes('골프');
    const isTourItem = (i: CostItem) =>
      (i.category.includes('투어') && !i.category.includes('차량')) ||
      i.category.includes('관광') ||
      i.category.includes('자유');
    const isHotelItem = (i: CostItem) =>
      i.category.includes('숙박') || i.category.includes('호텔') || i.category.includes('리조트') || i.category.includes('풀빌라');
    const isVehicleItem = (i: CostItem) => i.category.includes('차량') || i.category.includes('리무진');
    const isFlightItem = (i: CostItem) => i.category.includes('항공');
    const isMassageItem = (i: CostItem) =>
      i.category.includes('마사지') || i.category.includes('스파') || i.detail.includes('마사지');
    const isMealItem = (i: CostItem) => i.category.includes('식사') || i.category.includes('만찬');
    const isInsuranceItem = (i: CostItem) => i.category.includes('보험');

    const golfCost = selectedCostItems.find(isGolfItem);
    const tourCost = selectedCostItems.find(isTourItem);
    const hotelCost = selectedCostItems.find(isHotelItem);
    const vehicleCost = selectedCostItems.find(isVehicleItem);
    const guideCost = selectedCostItems.find(isGuideItem);
    const fastTrackCost = selectedCostItems.find(isFastTrackItem);
    const massageCost = selectedCostItems.find(isMassageItem);
    const mealCost = selectedCostItems.find(isMealItem);
    const insuranceCost = selectedCostItems.find(isInsuranceItem);
    const flightCost = selectedCostItems.find(isFlightItem);
    const isFlightPaid = !!flightCost && ((flightCost.amountUSD ?? 0) > 0 || (flightCost.amountKRW ?? 0) > 0);

    const golfCoursesList = reservationNotice?.golfCourses?.filter(Boolean) || [];
    const tourItemsList = reservationNotice?.tourItems?.filter(Boolean) || [];
    const isGolfTrip =
      reservationNotice?.tripType === 'golf' ||
      golfCoursesList.length > 0 ||
      !!golfCost ||
      costItems.some(isGolfItem);

    const regionText = reservationNotice?.region || location;
    const durationText = reservationNotice?.duration || duration;
    const titleText = reservationNotice?.productTitle || `${regionText} ${durationText} 맞춤 여행`;

    const extraServices = reservationNotice?.extraServices || [];
    const hasExtraIncluded = (keyword: string) =>
      extraServices.some((s) => s.name.includes(keyword) && s.included);

    const guideIncluded = hasCostItems ? !!guideCost : hasExtraIncluded('가이드');
    const fastTrackIncluded = hasCostItems ? !!fastTrackCost : hasExtraIncluded('패스트');
    const massageIncluded = hasCostItems ? !!massageCost : (hasExtraIncluded('마사지') || hasExtraIncluded('스파'));
    const hotelIncluded = hasCostItems ? !!hotelCost : !!reservationNotice?.accommodation;
    const vehicleIncluded = hasCostItems ? !!vehicleCost : !!reservationNotice?.vehicle;

    const activitySummary = isGolfTrip
      ? golfCoursesList.length > 0
        ? `골프 ${golfCoursesList.length}회 라운딩 (${golfCoursesList.join(' · ')})`
        : golfCost
          ? golfCost.detail
          : '골프 일정 (미선택)'
      : tourItemsList.length > 0
        ? `투어/일정 (${tourItemsList.join(' · ')})`
        : tourCost
          ? tourCost.detail
          : `${regionText} 자유·맞춤 일정`;

    const accommodationSummary = hotelIncluded
      ? reservationNotice?.accommodation || hotelCost?.detail || '1인 1실 단독 숙박'
      : '숙박 미포함 (개별 예약)';

    const vehicleSummary = vehicleIncluded
      ? reservationNotice?.vehicle || vehicleCost?.detail || '전 일정 전용 차량'
      : '전용 차량 미포함';

    const includedList: string[] = [];
    if (isFlightPaid && flightCost) {
      includedList.push(`국제선 왕복 항공권 (${flightCost.detail})`);
    }
    if (golfCost || (!hasCostItems && isGolfTrip && golfCoursesList.length > 0)) {
      includedList.push(
        golfCoursesList.length > 0
          ? `선택 골프장 그린피 (${golfCoursesList.join(', ')})`
          : `골프 그린피 (${golfCost?.detail || '정규 라운딩'})`
      );
    }
    if (tourCost || (!hasCostItems && !isGolfTrip && tourItemsList.length > 0)) {
      includedList.push(
        tourItemsList.length > 0
          ? `선택 투어/관광 (${tourItemsList.join(', ')})`
          : `투어/관광 (${tourCost?.detail})`
      );
    }
    if (hotelIncluded) {
      includedList.push(`숙박 (${accommodationSummary})`);
    }
    if (vehicleIncluded) {
      includedList.push(`전용 차량 (${vehicleSummary})`);
    }
    if (guideIncluded) {
      includedList.push(guideCost?.detail ? `가이드 (${guideCost.detail})` : '전 일정 한국어 전문 가이드 포함');
    }
    if (fastTrackIncluded) {
      includedList.push('공항 VIP 패스트트랙 포함');
    }
    if (massageIncluded) {
      includedList.push('스파 & 전신 마사지 케어 포함');
    }
    if (mealCost) {
      includedList.push(`포함 식사 (${mealCost.detail})`);
    }
    if (insuranceCost) {
      includedList.push('해외 여행자 안심 보험');
    }
    // Include any additional checked items (e.g., 지역 운영 수배비 등)
    selectedCostItems.forEach((item) => {
      if (
        isFlightItem(item) ||
        isGolfItem(item) ||
        isTourItem(item) ||
        isHotelItem(item) ||
        isVehicleItem(item) ||
        isGuideItem(item) ||
        isFastTrackItem(item) ||
        isMassageItem(item) ||
        isMealItem(item) ||
        isInsuranceItem(item)
      ) {
        return;
      }
      includedList.push(`${item.category} (${item.detail})`);
    });

    const excludedList: string[] = [];
    if (!isFlightPaid) {
      excludedList.push('왕복 항공권 (별도 발권 또는 요청 시 대행)');
    }
    if (!hotelIncluded) {
      excludedList.push('숙박 (미선택/개별 예약)');
    }
    if (!vehicleIncluded) {
      excludedList.push('전용 차량 (미선택)');
    }
    if (!guideIncluded) {
      excludedList.push('한국어 전문 가이드 (미포함)');
    }
    if (!fastTrackIncluded) {
      excludedList.push('공항 VIP 패스트트랙 (미포함 · 선택 추가 가능)');
    }
    if (hasCostItems && !insuranceCost) {
      excludedList.push('여행자 보험 (미포함)');
    } else if (!hasCostItems) {
      excludedList.push('여행자 보험');
    }

    // Add any items explicitly unchecked in the cost table
    uncheckedCostItems.forEach((item) => {
      if (isFlightItem(item) || isHotelItem(item) || isVehicleItem(item) || isGuideItem(item) || isFastTrackItem(item) || isInsuranceItem(item)) {
        return;
      }
      excludedList.push(`${item.category} (미선택)`);
    });

    // Add any extra excludedItems passed from DIY/product controls if not already noted
    (reservationNotice?.excludedItems || []).forEach((exName) => {
      const normalized = exName.trim();
      if (!normalized) return;
      const alreadyCovered = excludedList.some((entry) => entry.includes(normalized.split(' (')[0]));
      if (!alreadyCovered) {
        excludedList.push(`${normalized} (미포함)`);
      }
    });

    if (isGolfTrip) {
      excludedList.push('골프 캐디팁 및 운전기사 팁, 개인 매너팁, 포함 외 식사·음료 비용');
    } else {
      excludedList.push('운전기사 팁, 개인 매너팁, 포함 외 식사·음료 및 개인 경비');
    }

    return {
      isGolfTrip,
      titleText,
      regionText,
      durationText,
      activitySummary,
      accommodationSummary,
      vehicleSummary,
      includedText: includedList.length > 0 ? includedList.join(', ') : '선택된 포함 항목이 없습니다. (경비 내역에서 항목을 선택해주세요)',
      excludedText: excludedList.join(', '),
      openingLine: isGolfTrip
        ? '본 견적은 실시간 골프장 및 호텔 현황에 기반하여 작성되었으며, 예약 시점에 따라 금액 변동이 있을 수 있습니다.'
        : '본 견적은 실시간 현지 투어·차량 및 호텔 현황에 기반하여 작성되었으며, 예약 시점에 따라 금액 변동이 있을 수 있습니다.',
    };
  })();

  // Copy Quotation Summary Text
  const handleCopyText = async () => {
    let text = `[MANGO TOUR 여행 견적 및 일정 안내서]\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `👤 고객명: ${customerName} 고객님 (외 ${Math.max(0, personCount - 1)}인)\n`;
    text += `📌 선택 상품: ${computedNotice.titleText}\n`;
    text += `📍 여행지: 베트남 ${computedNotice.regionText}\n`;
    text += `📅 여행기간: ${formattedDateRange} (${computedNotice.durationText})\n`;
    text += `💰 총 견적 금액: $${finalTotalUSD.toLocaleString()} USD (${personCount}인 기준)\n`;
    text += `   (약 ₩ ${finalTotalKRW.toLocaleString()}원)\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `■ 주요 경비 내역 (선택 항목)\n`;
    selectedCostItems.forEach((item) => {
      const itemUSD = item.amountUSD !== undefined ? item.amountUSD : Math.round(item.amountKRW / 1360);
      text += `• [${item.category}] ${item.detail} (${item.quantity}): $${itemUSD.toLocaleString()} USD (약 ₩ ${item.amountKRW.toLocaleString()}원)\n`;
    });
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `■ 선택 구성 요약: ${computedNotice.activitySummary} | 숙박: ${computedNotice.accommodationSummary} | 차량: ${computedNotice.vehicleSummary}\n`;
    text += `■ 포함 사항: ${computedNotice.includedText}\n`;
    text += `■ 불포함 사항: ${computedNotice.excludedText}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `■ 담당자 연락처: ${managerContact}\n`;
    text += `💬 카카오톡 1:1 상담: https://open.kakao.com/o/gprQnKSi\n`;

    try {
      await navigator.clipboard.writeText(text);
      showToast('📋 견적서 텍스트가 클립보드에 복사되었습니다.');
    } catch {
      showToast('⚠️ 텍스트 복사에 실패했습니다.');
    }
  };

  // Helper to normalize activities into { time, desc }
  const normalizeActivities = (acts: Array<{ time?: string; desc: string }> | string[]) => {
    return acts.map((act) => {
      if (typeof act === 'string') {
        const timeMatch = act.match(/^(\d{1,2}:\d{2}\s*(?:~\s*\d{1,2}:\d{2}|-\s*\d{1,2}:\d{2}|~)?)\s*(.*)$/);
        if (timeMatch) {
          return { time: timeMatch[1].trim(), desc: timeMatch[2].trim() };
        }
        return { time: '일정', desc: act };
      }
      return act;
    });
  };

  return (
    <div className="w-full flex flex-col items-center select-text font-sans antialiased">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[10010] bg-gray-900/95 text-white px-5 py-3 rounded-2xl shadow-2xl text-xs sm:text-sm font-semibold flex items-center gap-2 animate-fade-in backdrop-blur-md border border-gold-500/30">
          <span>✨</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Action Toolbar (no-print) */}
      {showControls && (
        <div className="no-print w-full max-w-[794px] mb-2 sm:mb-3 px-2.5 sm:px-0 pt-2 sm:pt-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
          <div className="flex items-center justify-between text-xs text-gray-500 font-semibold px-0.5 sm:px-0">
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
              <span>A4 표준 정식 견적서 폼</span>
            </div>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="sm:hidden w-7 h-7 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center font-bold text-xs cursor-pointer shrink-0"
                aria-label="닫기"
              >
                ✕
              </button>
            )}
          </div>

          <div className="grid grid-cols-4 sm:flex sm:flex-wrap items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="py-1.5 px-2 sm:px-4 sm:py-2 bg-deepgreen text-white text-[11px] sm:text-sm font-bold rounded-xl shadow hover:bg-emerald-800 transition flex items-center justify-center gap-1 active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <span>🖨️</span>
              <span>인쇄</span>
            </button>

            <button
              type="button"
              onClick={handleExportPDF}
              disabled={isExporting}
              className="py-1.5 px-2 sm:px-4 sm:py-2 bg-gold-500 text-white text-[11px] sm:text-sm font-bold rounded-xl shadow hover:bg-gold-600 transition flex items-center justify-center gap-1 active:scale-95 cursor-pointer disabled:opacity-50 whitespace-nowrap"
            >
              <span>📄</span>
              <span>PDF</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPNG}
              disabled={isExporting}
              className="py-1.5 px-2 sm:px-3.5 sm:py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-[11px] sm:text-sm font-bold rounded-xl transition flex items-center justify-center gap-1 active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <span>📥</span>
              <span>이미지</span>
            </button>

            <button
              type="button"
              onClick={handleCopyText}
              className="py-1.5 px-2 sm:px-3.5 sm:py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-[11px] sm:text-sm font-bold rounded-xl transition flex items-center justify-center gap-1 active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <span>📋</span>
              <span>복사</span>
            </button>

            <button
              type="button"
              onClick={() => window.open('https://open.kakao.com/o/gprQnKSi', '_blank')}
              className="col-span-4 sm:col-span-1 py-2 sm:py-2 px-3 sm:px-4 bg-[#FEE500] text-[#191919] text-xs sm:text-sm font-black rounded-xl hover:bg-[#FDD835] transition shadow-xs flex items-center justify-center gap-1 active:scale-95 cursor-pointer whitespace-nowrap"
            >
              <span>💬</span>
              <span>카카오톡 즉시 상담</span>
            </button>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="hidden sm:flex w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 items-center justify-center font-bold text-sm ml-1 transition cursor-pointer"
                aria-label="닫기"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}

      {/* ================= ON-SCREEN INTERACTIVE VIEW (Maintains responsive card/table layout) ================= */}
      <div
        ref={documentRef}
        id="a4-screen-view"
        className="a4-print-container bg-white w-full max-w-[794px] min-h-0 sm:min-h-[1050px] print:hidden p-3 xs:p-4 sm:p-10 md:p-12 border-y sm:border border-gray-200 shadow-xl rounded-none sm:rounded-2xl text-gray-900 text-xs sm:text-sm leading-normal box-border relative mx-auto"
        style={{
          boxSizing: 'border-box',
        }}
      >
        {/* Top Header: Brand + Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2.5 sm:pb-4 mb-3.5 sm:mb-5 border-b-2 border-gray-900 gap-1 sm:gap-2">
          <div className="flex items-center gap-1 tracking-tight">
            <span className="text-xl sm:text-3xl font-black text-[#F5A623]">Mango</span>
            <span className="text-xl sm:text-3xl font-black text-gray-900">Tour</span>
          </div>
          <h1 className="text-base sm:text-2xl md:text-3xl font-black text-gray-900 tracking-tight text-left sm:text-right">
            여행 견적 및 일정 안내서
          </h1>
        </div>

        {/* 2x2 Meta Information Table (Desktop & Print) */}
        <div className="hidden sm:block print:block mb-4 sm:mb-5 overflow-hidden rounded-md border border-gray-300">
          <table className="w-full border-collapse text-xs sm:text-[13px]">
            <tbody>
              <tr className="border-b border-gray-200">
                <th className="bg-gray-50/80 font-bold text-gray-700 py-2 sm:py-2.5 px-3 w-20 sm:w-24 border-r border-gray-200 text-left">
                  고객명
                </th>
                <td className="py-2 sm:py-2.5 px-3 font-semibold text-gray-900 border-r border-gray-200">
                  {customerName} 고객님 {personCount > 1 ? `(외 ${personCount - 1}인)` : ''}
                </td>
                <th className="bg-gray-50/80 font-bold text-gray-700 py-2 sm:py-2.5 px-3 w-20 sm:w-24 border-r border-gray-200 text-left">
                  담당자
                </th>
                <td className="py-2 sm:py-2.5 px-3 font-medium text-gray-800">
                  {managerName} ({managerContact})
                </td>
              </tr>
              <tr>
                <th className="bg-gray-50/80 font-bold text-gray-700 py-2 sm:py-2.5 px-3 border-r border-gray-200 text-left">
                  여행지
                </th>
                <td className="py-2 sm:py-2.5 px-3 font-semibold text-gray-900 border-r border-gray-200">
                  베트남 {location}
                </td>
                <th className="bg-gray-50/80 font-bold text-gray-700 py-2 sm:py-2.5 px-3 border-r border-gray-200 text-left">
                  여행기간
                </th>
                <td className="py-2 sm:py-2.5 px-3 font-medium text-gray-800">
                  {formattedDateRange} ({duration})
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Mobile Responsive Meta Info Block (sm:hidden print:hidden) */}
        <div className="sm:hidden print:hidden mb-3.5 overflow-hidden rounded-lg border border-gray-300 text-xs bg-white">
          <div className="grid grid-cols-2 divide-x divide-gray-200 border-b border-gray-200">
            <div className="p-2.5 bg-gray-50/50">
              <span className="text-[10px] font-bold text-gray-500 block mb-0.5">👤 고객명</span>
              <span className="font-bold text-gray-900 text-xs block">{customerName} 고객님 {personCount > 1 ? `(외 ${personCount - 1}인)` : ''}</span>
            </div>
            <div className="p-2.5 bg-gray-50/50">
              <span className="text-[10px] font-bold text-gray-500 block mb-0.5">👨‍💼 담당자</span>
              <span className="font-bold text-gray-900 text-xs block">{managerName}</span>
              <span className="text-[10px] text-gray-500 block font-normal">{managerContact}</span>
            </div>
          </div>
          <div className="grid grid-cols-2 divide-x divide-gray-200">
            <div className="p-2.5 bg-gray-50/50">
              <span className="text-[10px] font-bold text-gray-500 block mb-0.5">📍 여행지</span>
              <span className="font-bold text-gray-900 text-xs block">베트남 {location}</span>
            </div>
            <div className="p-2.5 bg-gray-50/50">
              <span className="text-[10px] font-bold text-gray-500 block mb-0.5">📅 여행기간</span>
              <span className="font-bold text-gray-900 text-xs block">{formattedDateRange}</span>
              <span className="text-gold-700 font-bold text-[10px] block">({duration})</span>
            </div>
          </div>
        </div>

        {/* Golden Banner for Total Price (USD first, KRW below) */}
        <div className="bg-[#F5A623] text-white rounded-lg px-3.5 sm:px-5 py-3 sm:py-3.5 mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-1 shadow-xs">
          <span className="text-xs sm:text-sm font-bold text-white tracking-wide">
            선택 결제 금액 (Total Price)
          </span>
          <div className="text-left sm:text-right">
            <div className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight drop-shadow-xs tabular-nums">
              ${finalTotalUSD.toLocaleString()} USD <span className="text-xs sm:text-sm font-semibold">({personCount}인 기준)</span>
            </div>
            <div className="text-[11px] sm:text-xs text-amber-100 font-medium mt-0.5 tabular-nums">
              (약 ₩ {finalTotalKRW.toLocaleString()}원 / 1인 약 ${Math.round(finalTotalUSD / Math.max(1, personCount)).toLocaleString()})
            </div>
          </div>
        </div>

        {/* Section 1: ■ 여행 경비 내역 (Estimated Cost) - Interactive Selectable List */}
        <div className="mb-4 sm:mb-6 page-break-avoid">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5 sm:mb-3">
            <h2 className="text-xs sm:text-sm md:text-[15px] font-bold text-gray-900 flex items-center gap-1.5">
              <span className="text-[#F5A623] text-xs">■</span>
              <span>여행 경비 내역 (Estimated Cost)</span>
            </h2>
            {hasCostItems && (
              <div className="flex items-center gap-2 text-[11px] sm:text-xs whitespace-nowrap">
                <span className="text-gray-500 font-semibold tabular-nums whitespace-nowrap">
                  선택 항목 <strong className="text-[#064e3b]">{selectedCostItems.length}</strong> / {costItems.length}개
                </span>
                {selectedCostItems.length < costItems.length && (
                  <button
                    type="button"
                    onClick={selectAllCostItems}
                    className="px-2 py-0.5 rounded-md border border-emerald-300 bg-emerald-50 text-[#064e3b] font-bold hover:bg-emerald-100 transition cursor-pointer whitespace-nowrap"
                  >
                    전체 선택
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Desktop Interactive Selectable List */}
          <div className="hidden sm:block print:block">
            <div className="grid grid-cols-[44px_105px_1fr_92px_136px] items-center px-3 py-2 mb-2 rounded-lg bg-gray-50 border border-gray-200 text-xs font-bold text-gray-600">
              <div className="text-center">선택</div>
              <div className="text-center">구분</div>
              <div className="pl-2 text-left">세부 내역</div>
              <div className="text-center">수량</div>
              <div className="text-right">금액</div>
            </div>

            {hasCostItems ? (
              <div className="space-y-2">
                {costItems.map((item, idx) => {
                  const selected = isCostItemSelected(item, idx);
                  const itemUSD = item.amountUSD !== undefined ? item.amountUSD : Math.round(item.amountKRW / 1360);
                  return (
                    <button
                      key={getCostItemKey(item, idx)}
                      type="button"
                      role="checkbox"
                      aria-checked={selected}
                      onClick={() => toggleCostItem(item, idx)}
                      className={`w-full grid grid-cols-[44px_105px_1fr_92px_136px] items-center px-3 py-3 rounded-xl border text-left transition-all duration-150 cursor-pointer ${
                        selected
                          ? 'border-emerald-300 bg-emerald-50/25 shadow-2xs hover:bg-emerald-50/45'
                          : 'border-gray-200 bg-gray-50/60 hover:bg-gray-50'
                      }`}
                    >
                      {/* Far-left custom checkbox */}
                      <div className="flex items-center justify-center">
                        <span
                          className={`w-5 h-5 rounded-md flex items-center justify-center transition-colors ${
                            selected
                              ? 'bg-[#064e3b] border border-[#064e3b] shadow-2xs'
                              : 'bg-white border-2 border-gray-300'
                          }`}
                        >
                          {selected && (
                            <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          )}
                        </span>
                      </div>

                      {/* 구분 */}
                      <div className="text-center px-1">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-bold transition-colors ${
                            selected
                              ? 'bg-emerald-100/80 text-[#064e3b]'
                              : 'bg-gray-200/60 text-gray-400'
                          }`}
                        >
                          {item.category}
                        </span>
                      </div>

                      {/* 세부 내역 */}
                      <div
                        className={`pl-2 pr-3 text-xs sm:text-[13px] font-medium leading-snug break-keep transition-colors ${
                          selected ? 'text-gray-900' : 'text-gray-400'
                        }`}
                      >
                        {item.detail}
                      </div>

                      {/* 수량 */}
                      <div
                        className={`text-center text-xs whitespace-nowrap font-medium transition-colors ${
                          selected ? 'text-gray-600' : 'text-gray-400'
                        }`}
                      >
                        {item.quantity}
                      </div>

                      {/* 금액 */}
                      <div className="text-right whitespace-nowrap tabular-nums">
                        <span
                          className={`block text-xs sm:text-[13px] font-black transition-colors ${
                            selected ? 'text-[#064e3b]' : 'text-gray-400'
                          }`}
                        >
                          ${itemUSD.toLocaleString()} USD
                        </span>
                        <span
                          className={`block text-[10px] sm:text-[11px] font-normal transition-colors ${
                            selected ? 'text-gray-500' : 'text-gray-400'
                          }`}
                        >
                          (약 ₩ {item.amountKRW.toLocaleString()}원)
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="py-5 text-center text-gray-400 rounded-xl border border-gray-200 text-xs">
                경비 내역이 등록되지 않았습니다.
              </div>
            )}
          </div>

          {/* Mobile Responsive Interactive Cost List (sm:hidden print:hidden) */}
          <div className="sm:hidden print:hidden space-y-2">
            {hasCostItems ? (
              costItems.map((item, idx) => {
                const selected = isCostItemSelected(item, idx);
                const itemUSD = item.amountUSD !== undefined ? item.amountUSD : Math.round(item.amountKRW / 1360);
                return (
                  <button
                    key={getCostItemKey(item, idx)}
                    type="button"
                    role="checkbox"
                    aria-checked={selected}
                    onClick={() => toggleCostItem(item, idx)}
                    className={`w-full p-3 rounded-xl border text-left transition-all duration-150 flex items-start gap-2.5 cursor-pointer ${
                      selected
                        ? 'border-emerald-300 bg-emerald-50/25 shadow-2xs'
                        : 'border-gray-200 bg-gray-50/60'
                    }`}
                  >
                    {/* Far-left custom checkbox */}
                    <span
                      className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                        selected
                          ? 'bg-[#064e3b] border border-[#064e3b] shadow-2xs'
                          : 'bg-white border-2 border-gray-300'
                      }`}
                    >
                      {selected && (
                        <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </span>

                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center justify-between gap-1.5">
                        <span
                          className={`inline-block px-2 py-0.5 text-[11px] font-bold rounded-md transition-colors whitespace-nowrap shrink-0 ${
                            selected
                              ? 'bg-emerald-100/80 text-[#064e3b]'
                              : 'bg-gray-200/60 text-gray-400'
                          }`}
                        >
                          {item.category}
                        </span>
                        <span className={`text-[11px] font-semibold transition-colors whitespace-nowrap ${selected ? 'text-gray-500' : 'text-gray-400'}`}>
                          수량: {item.quantity}
                        </span>
                      </div>

                      <p className={`text-xs font-medium leading-snug break-keep transition-colors ${selected ? 'text-gray-900' : 'text-gray-400'}`}>
                        {item.detail}
                      </p>

                      <div className={`flex items-baseline justify-between pt-1.5 border-t ${selected ? 'border-emerald-100' : 'border-gray-200/70'}`}>
                        <span className={`text-[10px] font-medium ${selected ? 'text-gray-500' : 'text-gray-400'}`}>항목 금액</span>
                        <div className="text-right tabular-nums">
                          <span className={`text-xs font-black transition-colors ${selected ? 'text-[#064e3b]' : 'text-gray-400'}`}>
                            ${itemUSD.toLocaleString()} USD
                          </span>
                          <span className={`block text-[10px] font-normal transition-colors ${selected ? 'text-gray-500' : 'text-gray-400'}`}>
                            (약 ₩ {item.amountKRW.toLocaleString()}원)
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="py-4 text-center text-gray-400 rounded-xl border border-gray-200 text-xs">
                경비 내역이 등록되지 않았습니다.
              </div>
            )}
          </div>

          {/* Live Subtotal Footer inside Section */}
          {hasCostItems && (
            <div className="mt-2.5 px-3.5 py-2.5 rounded-xl bg-emerald-50/50 border border-emerald-200/80 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-bold text-[#064e3b]">
                선택 항목 실시간 합계 ({selectedCostItems.length}개 선택됨)
              </span>
              <div className="text-right tabular-nums">
                <span className="text-sm sm:text-base font-black text-[#064e3b]">
                  ${finalTotalUSD.toLocaleString()} USD
                </span>
                <span className="text-[11px] sm:text-xs text-gray-600 font-medium ml-1.5">
                  (약 ₩ {finalTotalKRW.toLocaleString()}원)
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Section 2: ■ 여행 추천 일정 (Itinerary) */}
        <div className="mb-4 sm:mb-6">
          <h2 className="text-xs sm:text-sm md:text-[15px] font-bold text-gray-900 mb-2 sm:mb-3 flex items-center gap-1.5 border-b border-gray-200 pb-1.5">
            <span className="text-[#F5A623] text-xs">■</span>
            <span>여행 추천 일정 (Itinerary)</span>
          </h2>

          <div className="space-y-3 sm:space-y-4">
            {itinerary && itinerary.length > 0 ? (
              itinerary.map((day) => {
                const dayDate = day.dateStr || getDayDateStr(day.day);
                const activities = normalizeActivities(day.activities);

                return (
                  <div key={day.day} className="page-break-avoid border-b border-gray-100 last:border-b-0 pb-2.5 last:pb-0">
                    {/* Day Title with Golden Vertical Bar */}
                    <div className="flex items-center gap-2 border-l-4 border-[#F5A623] pl-2 sm:pl-2.5 py-0.5 mb-1.5 sm:mb-2">
                      <span className="font-extrabold text-xs sm:text-sm md:text-[14px] text-gray-900 tracking-tight">
                        {day.day}일차 ({dayDate}) - {day.title}
                      </span>
                    </div>

                    {/* Day Activity Rows */}
                    <div className="pl-1 sm:pl-3.5 space-y-1.5">
                      {activities.map((act, actIdx) => (
                        <div key={actIdx} className="flex flex-col sm:flex-row items-start text-xs sm:text-[13px] text-gray-700 gap-0.5 sm:gap-2.5 leading-relaxed">
                          <span className="font-bold text-gold-700 sm:text-gray-500 shrink-0 sm:w-28 text-left text-[11px] sm:text-[13px]">
                            {act.time && act.time !== '일정' ? act.time : '•'}
                          </span>
                          <span className="flex-1 text-gray-800 font-normal break-keep">
                            {act.desc}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-400 text-xs">
                상세 일정이 준비 중입니다. 상담 매니저에게 문의해주세요.
              </div>
            )}
          </div>
        </div>

        {/* Section 3: [망고투어 예약 안내 사항] */}
        <div className="page-break-avoid border border-amber-300/90 bg-amber-50/20 rounded-lg p-3 sm:p-4 text-[10px] xs:text-[11px] sm:text-xs text-gray-700 leading-relaxed space-y-1 break-keep">
          <div className="font-bold text-gray-900 mb-1 text-xs sm:text-[13px]">
            [망고투어 예약 안내 사항]
          </div>
          <p>• {computedNotice.openingLine}</p>
          <p>• <strong>선택 상품 및 일정:</strong> {computedNotice.titleText} (베트남 {computedNotice.regionText} · {computedNotice.durationText})</p>
          <p>• <strong>세부 구성:</strong> {computedNotice.activitySummary} / 숙박: {computedNotice.accommodationSummary} / 차량: {computedNotice.vehicleSummary}</p>
          <p>• <strong>포함 사항:</strong> {computedNotice.includedText}</p>
          <p>• <strong>불포함 사항:</strong> {computedNotice.excludedText}</p>
          {notes && (
            <p className="pt-1 text-deepgreen font-medium">
              • <strong>고객 요청사항:</strong> {notes}
            </p>
          )}
          <div className="pt-2 border-t border-amber-200/60 mt-2 flex flex-col sm:flex-row justify-between items-start sm:items-center text-[9px] xs:text-[10px] sm:text-[11px] text-gray-500 gap-1">
            <span className="break-all">MANGO TOUR : 59 LE VAN THIEM PMH Q7, HOCHIMINH, VIETNAM</span>
            <span className="break-all">고객센터: +84 37 720 4451 | 카카오톡: open.kakao.com/o/gprQnKSi</span>
          </div>
        </div>
      </div>

      {/* ================= EXACT A4 SHEET FOR PRINT & PDF EXPORT (Identical to User Sample PDF) ================= */}
      <div
        ref={exactA4Ref}
        id="a4-exact-print-sheet"
        className="fixed top-0 -left-[9999px] w-[794px] bg-white text-gray-900 pointer-events-none z-[-100] print:static print:left-0 print:w-full print:block print:z-auto print:pointer-events-auto print:shadow-none print:border-none"
        style={{
          width: '794px',
          boxSizing: 'border-box',
          padding: '36px 44px',
          backgroundColor: '#ffffff',
          color: '#111827',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Top Header: Brand + Title */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ fontSize: '32px', fontWeight: 900, color: '#F5A623', letterSpacing: '-0.5px' }}>MangoTour</span>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: 900, color: '#111827', margin: 0, letterSpacing: '-0.5px' }}>
            여행 견적 및 일정 안내서
          </h1>
        </div>
        {/* Solid Orange Accent Line under Header */}
        <div style={{ height: '3px', backgroundColor: '#F5A623', marginBottom: '18px' }} />

        {/* 2x2 Meta Information Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #d1d5db', marginBottom: '18px', fontSize: '13px' }}>
          <tbody>
            <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ backgroundColor: '#f9fafb', width: '90px', padding: '9px 14px', borderRight: '1px solid #e5e7eb', textAlign: 'left', fontWeight: 700, color: '#374151' }}>
                고객명
              </th>
              <td style={{ padding: '9px 14px', borderRight: '1px solid #e5e7eb', fontWeight: 600, color: '#111827' }}>
                {customerName} 고객님 {personCount > 1 ? `(외 ${personCount - 1}인)` : ''}
              </td>
              <th style={{ backgroundColor: '#f9fafb', width: '90px', padding: '9px 14px', borderRight: '1px solid #e5e7eb', textAlign: 'left', fontWeight: 700, color: '#374151' }}>
                담당자
              </th>
              <td style={{ padding: '9px 14px', color: '#374151', fontWeight: 500 }}>
                {managerName} ({managerContact})
              </td>
            </tr>
            <tr>
              <th style={{ backgroundColor: '#f9fafb', padding: '9px 14px', borderRight: '1px solid #e5e7eb', textAlign: 'left', fontWeight: 700, color: '#374151' }}>
                여행지
              </th>
              <td style={{ padding: '9px 14px', borderRight: '1px solid #e5e7eb', fontWeight: 600, color: '#111827' }}>
                베트남 {location}
              </td>
              <th style={{ backgroundColor: '#f9fafb', padding: '9px 14px', borderRight: '1px solid #e5e7eb', textAlign: 'left', fontWeight: 700, color: '#374151' }}>
                여행기간
              </th>
              <td style={{ padding: '9px 14px', color: '#374151', fontWeight: 500 }}>
                {formattedDateRange} ({duration})
              </td>
            </tr>
          </tbody>
        </table>

        {/* Golden Banner for Total Price */}
        <div style={{ backgroundColor: '#F5A623', borderRadius: '6px', padding: '12px 20px', color: '#ffffff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <span style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '0.2px' }}>
            선택 결제 금액 (Total Price)
          </span>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '22px', fontWeight: 900, letterSpacing: '-0.5px' }}>
              ${finalTotalUSD.toLocaleString()} USD ({personCount}인 기준)
            </div>
            <div style={{ fontSize: '12px', color: '#fef3c7', marginTop: '2px', fontWeight: 500 }}>
              (약 ₩ {finalTotalKRW.toLocaleString()}원 / 1인 약 ${Math.round(finalTotalUSD / Math.max(1, personCount)).toLocaleString()})
            </div>
          </div>
        </div>

        {/* Section 1: ■ 여행 경비 내역 (Estimated Cost) */}
        <div style={{ marginBottom: '22px' }}>
          <div style={{ fontSize: '14px', fontWeight: 800, color: '#F5A623', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: '#F5A623', fontSize: '12px' }}>■</span>
            <span style={{ color: '#F5A623' }}>여행 경비 내역 (Estimated Cost)</span>
          </div>
          <div style={{ height: '2px', backgroundColor: '#F5A623', marginBottom: '12px' }} />

          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e5e7eb', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #d1d5db', color: '#374151', fontWeight: 700 }}>
                <th style={{ padding: '9px 12px', textAlign: 'center', width: '110px', borderRight: '1px solid #e5e7eb' }}>구분</th>
                <th style={{ padding: '9px 12px', textAlign: 'left', borderRight: '1px solid #e5e7eb' }}>세부 내역</th>
                <th style={{ padding: '9px 12px', textAlign: 'center', width: '80px', borderRight: '1px solid #e5e7eb' }}>수량</th>
                <th style={{ padding: '9px 14px', textAlign: 'right', width: '140px' }}>금액</th>
              </tr>
            </thead>
            <tbody>
              {selectedCostItems.length > 0 ? (
                selectedCostItems.map((item, idx) => {
                  const itemUSD = item.amountUSD !== undefined ? item.amountUSD : Math.round(item.amountKRW / 1360);
                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 700, color: '#374151', borderRight: '1px solid #e5e7eb', backgroundColor: '#fafafa' }}>
                        {item.category}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 500, color: '#111827', borderRight: '1px solid #e5e7eb', lineHeight: 1.5 }}>
                        {item.detail}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'center', color: '#4b5563', borderRight: '1px solid #e5e7eb', whiteSpace: 'nowrap' }}>
                        {item.quantity}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, whiteSpace: 'nowrap' }}>
                        <div style={{ fontSize: '13px', fontWeight: 900, color: '#111827' }}>
                          ${itemUSD.toLocaleString()} USD
                        </div>
                        <div style={{ fontSize: '11px', color: '#6b7280', fontWeight: 400 }}>
                          (약 ₩ {item.amountKRW.toLocaleString()}원)
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={4} style={{ padding: '16px 12px', textAlign: 'center', color: '#9ca3af' }}>
                    선택된 경비 항목이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Section 2: ■ 여행 추천 일정 (Itinerary) */}
        <div style={{ marginBottom: '22px' }}>
          <div style={{ fontSize: '14px', fontWeight: 800, color: '#F5A623', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: '#F5A623', fontSize: '12px' }}>■</span>
            <span style={{ color: '#F5A623' }}>여행 추천 일정 (Itinerary)</span>
          </div>
          <div style={{ height: '2px', backgroundColor: '#F5A623', marginBottom: '14px' }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {itinerary && itinerary.length > 0 ? (
              itinerary.map((day) => {
                const dayDate = day.dateStr || getDayDateStr(day.day);
                const activities = normalizeActivities(day.activities);

                return (
                  <div key={day.day} style={{ pageBreakInside: 'avoid' }}>
                    {/* Day Title with Orange Bar */}
                    <div style={{ backgroundColor: '#f9fafb', borderLeft: '4px solid #F5A623', padding: '6px 14px', fontSize: '13px', fontWeight: 800, color: '#111827', marginBottom: '8px' }}>
                      {day.day}일차 ({dayDate}) - {day.title}
                    </div>

                    {/* Day Activity Rows */}
                    <div style={{ paddingLeft: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      {activities.map((act, actIdx) => (
                        <div key={actIdx} style={{ display: 'flex', fontSize: '12.5px', color: '#374151', lineHeight: 1.6 }}>
                          <span style={{ width: '130px', fontWeight: 600, color: '#6b7280', flexShrink: 0 }}>
                            {act.time && act.time !== '일정' ? act.time : '•'}
                          </span>
                          <span style={{ flex: 1, color: '#1f2937' }}>
                            {act.desc}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })
            ) : null}
          </div>
        </div>

        {/* Section 3: [망고투어 예약 안내 사항] */}
        <div style={{ border: '1px solid #F5A623', borderRadius: '8px', padding: '14px 18px', backgroundColor: '#ffffff', fontSize: '11px', color: '#4b5563', lineHeight: 1.6, pageBreakInside: 'avoid' }}>
          <div style={{ fontWeight: 800, color: '#111827', fontSize: '12px', marginBottom: '6px' }}>
            [망고투어 예약 안내 사항]
          </div>
          <div>• {computedNotice.openingLine}</div>
          <div>• <strong>선택 상품 및 일정:</strong> {computedNotice.titleText} (베트남 {computedNotice.regionText} · {computedNotice.durationText})</div>
          <div>• <strong>세부 구성:</strong> {computedNotice.activitySummary} / 숙박: {computedNotice.accommodationSummary} / 차량: {computedNotice.vehicleSummary}</div>
          <div>• <strong>포함 사항:</strong> {computedNotice.includedText}</div>
          <div>• <strong>불포함 사항:</strong> {computedNotice.excludedText}</div>
          {notes && (
            <div style={{ color: '#004d40', fontWeight: 600, marginTop: '2px' }}>
              • <strong>고객 요청사항:</strong> {notes}
            </div>
          )}
          <div style={{ borderTop: '1px solid #fde68a', marginTop: '10px', paddingTop: '8px', fontSize: '10px', color: '#6b7280', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>MANGO TOUR : 59 LE VAN THIEM PMH Q7, HOCHIMINH, VIETNAM</span>
            <span>고객센터: +84 37 720 4451 | 카카오톡: open.kakao.com/o/gprQnKSi</span>
          </div>
        </div>
      </div>

      {/* Print Stylesheet for Pure A4 Portrait output */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm 12mm 10mm 12mm;
          }
          body {
            background: #ffffff !important;
            color: #111827 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
          #a4-screen-view {
            display: none !important;
          }
          #a4-exact-print-sheet {
            display: block !important;
            position: static !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            visibility: visible !important;
          }
          .page-break-avoid {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>
    </div>
  );
};

export default A4QuotationDocument;
