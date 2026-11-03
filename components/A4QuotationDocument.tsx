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
  onClose,
  showControls = true,
}) => {
  const documentRef = useRef<HTMLDivElement>(null);
  const exactA4Ref = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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

  // Copy Quotation Summary Text
  const handleCopyText = async () => {
    let text = `[MANGO TOUR 여행 견적 및 일정 안내서]\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `👤 고객명: ${customerName} 고객님 (외 ${Math.max(0, personCount - 1)}인)\n`;
    text += `📍 여행지: 베트남 ${location}\n`;
    text += `📅 여행기간: ${formattedDateRange} (${duration})\n`;
    const finalUSD = totalPriceUSD || finalTotalUSD;
    if (finalUSD || totalPriceKRW) {
      text += `💰 총 견적 금액: $${finalUSD.toLocaleString()} USD (${personCount}인 기준)\n`;
      text += `   (약 ₩ ${finalTotalKRW.toLocaleString()}원)\n`;
    }
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `■ 주요 경비 내역\n`;
    costItems.forEach((item) => {
      const itemUSD = item.amountUSD !== undefined ? item.amountUSD : Math.round(item.amountKRW / 1360);
      text += `• [${item.category}] ${item.detail} (${item.quantity}): $${itemUSD.toLocaleString()} USD (약 ₩ ${item.amountKRW.toLocaleString()}원)\n`;
    });
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `■ 포함 사항: 선택 골프장 그린피, 전 일정 1인 객실 기준 숙박(1인 1실 단독 객실 & 조식 포함), 전 일정 단독 전용 리무진 밴, 선택 옵션(한국어 전문 가이드, 공항 VIP 패스트트랙 등)\n`;
    text += `■ 불포함 사항: 왕복 항공권(별도 발권 또는 요청 시 대행), 운전기사 팁, 개인 매너팁 및 포함 외 식사/음료 비용, 여행자 보험\n`;
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

  const finalTotalKRW = totalPriceKRW || costItems.reduce((sum, item) => sum + item.amountKRW, 0);
  const finalTotalUSD = totalPriceUSD || costItems.reduce((sum, item) => sum + (item.amountUSD || 0), 0);

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
        <div className="no-print w-full max-w-[794px] mb-3 px-1 sm:px-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
          <div className="flex items-center justify-between text-xs text-gray-500 font-semibold px-1 sm:px-0">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span>A4 표준 정식 견적서 폼</span>
            </div>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="sm:hidden w-7 h-7 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center font-bold text-xs cursor-pointer"
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
              className="py-1.5 px-2 sm:px-4 sm:py-2 bg-deepgreen text-white text-[11px] sm:text-sm font-bold rounded-xl shadow hover:bg-emerald-800 transition flex items-center justify-center gap-1 active:scale-95 cursor-pointer"
            >
              <span>🖨️</span>
              <span>인쇄</span>
            </button>

            <button
              type="button"
              onClick={handleExportPDF}
              disabled={isExporting}
              className="py-1.5 px-2 sm:px-4 sm:py-2 bg-gold-500 text-white text-[11px] sm:text-sm font-bold rounded-xl shadow hover:bg-gold-600 transition flex items-center justify-center gap-1 active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <span>📄</span>
              <span>PDF</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPNG}
              disabled={isExporting}
              className="py-1.5 px-2 sm:px-3.5 sm:py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-[11px] sm:text-sm font-bold rounded-xl transition flex items-center justify-center gap-1 active:scale-95 cursor-pointer"
            >
              <span>📥</span>
              <span>이미지</span>
            </button>

            <button
              type="button"
              onClick={handleCopyText}
              className="py-1.5 px-2 sm:px-3.5 sm:py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 text-[11px] sm:text-sm font-bold rounded-xl transition flex items-center justify-center gap-1 active:scale-95 cursor-pointer"
            >
              <span>📋</span>
              <span>복사</span>
            </button>

            <button
              type="button"
              onClick={() => window.open('https://open.kakao.com/o/gprQnKSi', '_blank')}
              className="col-span-4 sm:col-span-1 py-2 sm:py-2 px-3 sm:px-4 bg-[#FEE500] text-[#191919] text-xs sm:text-sm font-black rounded-xl hover:bg-[#FDD835] transition shadow-xs flex items-center justify-center gap-1 active:scale-95 cursor-pointer"
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
        className="a4-print-container bg-white w-full max-w-[794px] min-h-0 sm:min-h-[1050px] print:hidden p-3.5 xs:p-5 sm:p-10 md:p-12 border border-gray-200 shadow-xl rounded-2xl sm:rounded-2xl text-gray-900 text-xs sm:text-sm leading-normal box-border relative mx-auto"
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
            <div className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight drop-shadow-xs">
              ${(finalTotalUSD || Math.round(finalTotalKRW / 1360)).toLocaleString()} USD <span className="text-xs sm:text-sm font-semibold">({personCount}인 기준)</span>
            </div>
            <div className="text-[11px] sm:text-xs text-amber-100 font-medium mt-0.5">
              (약 ₩ {finalTotalKRW.toLocaleString()}원 / 1인 약 ${Math.round((finalTotalUSD || Math.round(finalTotalKRW / 1360)) / personCount).toLocaleString()})
            </div>
          </div>
        </div>

        {/* Section 1: ■ 여행 경비 내역 (Estimated Cost) */}
        <div className="mb-4 sm:mb-6 page-break-avoid">
          <h2 className="text-xs sm:text-sm md:text-[15px] font-bold text-gray-900 mb-2 sm:mb-2.5 flex items-center gap-1.5">
            <span className="text-[#F5A623] text-xs">■</span>
            <span>여행 경비 내역 (Estimated Cost)</span>
          </h2>

          {/* Desktop & Print Table */}
          <div className="hidden sm:block print:block overflow-hidden rounded-md border border-gray-300">
            <table className="w-full border-collapse text-xs sm:text-[13px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-300 text-gray-700">
                  <th className="py-2 px-3 text-center font-bold w-24 sm:w-28 border-r border-gray-300">
                    구분
                  </th>
                  <th className="py-2 px-3 text-left font-bold border-r border-gray-300">
                    세부 내역
                  </th>
                  <th className="py-2 px-3 text-center font-bold w-16 sm:w-20 border-r border-gray-300">
                    수량
                  </th>
                  <th className="py-2 px-3 text-right font-bold w-28 sm:w-36">
                    금액
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-gray-800">
                {costItems.length > 0 ? (
                  costItems.map((item, idx) => {
                    const itemUSD = item.amountUSD !== undefined ? item.amountUSD : Math.round(item.amountKRW / 1360);
                    return (
                      <tr key={idx} className="hover:bg-gray-50/50 transition">
                        <td className="py-2.5 px-3 text-center font-bold text-gray-700 border-r border-gray-200 bg-gray-50/40">
                          {item.category}
                        </td>
                        <td className="py-2.5 px-3 text-left font-medium text-gray-900 border-r border-gray-200 leading-snug">
                          {item.detail}
                        </td>
                        <td className="py-2.5 px-3 text-center text-gray-600 border-r border-gray-200 whitespace-nowrap">
                          {item.quantity}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-gray-900 whitespace-nowrap">
                          <span className="block text-xs sm:text-[13px] font-black text-gray-900">
                            ${itemUSD.toLocaleString()} USD
                          </span>
                          <span className="block text-[10px] sm:text-[11px] text-gray-500 font-normal">
                            (약 ₩ {item.amountKRW.toLocaleString()}원)
                          </span>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-gray-400">
                      경비 내역이 등록되지 않았습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Responsive Cost List (sm:hidden print:hidden) */}
          <div className="sm:hidden print:hidden rounded-lg border border-gray-300 overflow-hidden divide-y divide-gray-200 bg-white">
            {costItems.length > 0 ? (
              costItems.map((item, idx) => {
                const itemUSD = item.amountUSD !== undefined ? item.amountUSD : Math.round(item.amountKRW / 1360);
                return (
                  <div key={idx} className="p-2.5 xs:p-3 space-y-1.5">
                    <div className="flex items-center justify-between gap-1">
                      <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-800 text-[11px] font-bold rounded">
                        {item.category}
                      </span>
                      <span className="text-[11px] font-semibold text-gray-500">
                        수량: {item.quantity}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-gray-900 leading-snug break-keep">
                      {item.detail}
                    </p>
                    <div className="flex items-baseline justify-between pt-1 border-t border-gray-100">
                      <span className="text-[10px] text-gray-400 font-medium">항목 금액</span>
                      <div className="text-right">
                        <span className="text-xs font-black text-gray-900">
                          ${itemUSD.toLocaleString()} USD
                        </span>
                        <span className="block text-[10px] text-gray-500 font-normal">
                          (약 ₩ {item.amountKRW.toLocaleString()}원)
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-4 text-center text-gray-400 text-xs">
                경비 내역이 등록되지 않았습니다.
              </div>
            )}
          </div>
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
          <p>• 본 견적은 실시간 골프장 및 호텔 현황에 기반하여 작성되었으며, 예약 시점에 따라 금액 변동이 있을 수 있습니다.</p>
          <p>• <strong>포함 사항:</strong> 선택 골프장 그린피, 전 일정 1인 객실 기준 숙박(1인 1실 단독 객실 & 조식 포함), 전 일정 단독 전용 리무진 밴, 선택 옵션(한국어 전문 가이드, 공항 VIP 패스트트랙 등)</p>
          <p>• <strong>불포함 사항:</strong> 왕복 항공권(별도 발권 또는 요청 시 대행), 운전기사 팁, 개인 매너팁 및 포함 외 식사/음료 비용, 여행자 보험</p>
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
              ${(finalTotalUSD || Math.round(finalTotalKRW / 1360)).toLocaleString()} USD ({personCount}인 기준)
            </div>
            <div style={{ fontSize: '12px', color: '#fef3c7', marginTop: '2px', fontWeight: 500 }}>
              (약 ₩ {finalTotalKRW.toLocaleString()}원 / 1인 약 ${Math.round((finalTotalUSD || Math.round(finalTotalKRW / 1360)) / personCount).toLocaleString()})
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
              {costItems.map((item, idx) => {
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
              })}
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
          <div>• 본 견적은 실시간 골프장 및 호텔 현황에 기반하여 작성되었으며, 예약 시점에 따라 금액 변동이 있을 수 있습니다.</div>
          <div>• <strong>포함 사항:</strong> 선택 골프장 그린피, 전 일정 1인 객실 기준 숙박(1인 1실 단독 객실 & 조식 포함), 전 일정 단독 전용 리무진 밴, 선택 옵션(한국어 전문 가이드, 공항 VIP 패스트트랙 등)</div>
          <div>• <strong>불포함 사항:</strong> 왕복 항공권(별도 발권 또는 요청 시 대행), 운전기사 팁, 개인 매너팁 및 포함 외 식사/음료 비용, 여행자 보험</div>
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
