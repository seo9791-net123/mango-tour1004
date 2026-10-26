import React, { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import { CustomTripPackage, PackageOptionItem } from '../types';
import BackButton from './BackButton';
import { db } from '../services/firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';

interface Props {
  packages: CustomTripPackage[];
  onBack: () => void;
}

export const TripPlanner: React.FC<Props> = ({ packages, onBack }) => {
  const [selectedLocation, setSelectedLocation] = useState<string>('전체');
  const [activePackage, setActivePackage] = useState<CustomTripPackage | null>(null);
  
  // Customization state for active package
  const [selectedOptionIds, setSelectedOptionIds] = useState<Set<string>>(new Set());
  const [personCount, setPersonCount] = useState<number>(4);
  const [departureDate, setDepartureDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });
  const [customerName, setCustomerName] = useState<string>('');
  const [customerContact, setCustomerContact] = useState<string>('');
  const [customerNotes, setCustomerNotes] = useState<string>('');
  
  // UI states
  const [showInquiryModal, setShowInquiryModal] = useState<boolean>(false);
  const [showKakaoModal, setShowKakaoModal] = useState<boolean>(false);
  const [showImagePreviewModal, setShowImagePreviewModal] = useState<boolean>(false);
  const [inquirySuccess, setInquirySuccess] = useState<boolean>(false);
  const [isSubmittingEmail, setIsSubmittingEmail] = useState<boolean>(false);
  const [isCapturing, setIsCapturing] = useState<boolean>(false);
  const [capturedImageUrl, setCapturedImageUrl] = useState<string | null>(null);
  const [copyToast, setCopyToast] = useState<string | null>(null);
  const [viewTab, setViewTab] = useState<'options' | 'itinerary'>('options');

  const quotationCardRef = useRef<HTMLDivElement>(null);

  // Filter packages
  const filteredPackages = packages.filter(pkg => {
    if (selectedLocation === '전체') return true;
    if (selectedLocation === '호치민') return pkg.location === '호치민';
    if (selectedLocation === '붕따우') return pkg.location === '붕따우';
    if (selectedLocation === '달랏') return pkg.location === '달랏';
    if (selectedLocation === '복합/연계') return pkg.location.includes('+');
    return pkg.location === selectedLocation;
  });

  const locations = [
    { id: '전체', label: '전체 상품', count: packages.length },
    { id: '호치민', label: '호치민', count: packages.filter(p => p.location === '호치민').length },
    { id: '붕따우', label: '붕따우', count: packages.filter(p => p.location === '붕따우').length },
    { id: '달랏', label: '달랏', count: packages.filter(p => p.location === '달랏').length },
    { id: '복합/연계', label: '호치민/달랏/붕따우 복합', count: packages.filter(p => p.location.includes('+')).length },
  ];

  // Open customizer for a package
  const handleOpenPackage = (pkg: CustomTripPackage) => {
    setActivePackage(pkg);
    // Initialize selected options with default included items
    const defaultIds = new Set<string>();
    pkg.options.forEach(opt => {
      if (opt.isDefaultIncluded) {
        defaultIds.add(opt.id);
      }
    });
    setSelectedOptionIds(defaultIds);
    setViewTab('options');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Toggle option selection
  const handleToggleOption = (option: PackageOptionItem) => {
    if (option.isRequired) return; // Cannot toggle required item
    setSelectedOptionIds(prev => {
      const next = new Set(prev);
      if (next.has(option.id)) {
        next.delete(option.id);
      } else {
        next.add(option.id);
      }
      return next;
    });
  };

  // Calculate prices
  const currentTotalPerPerson = activePackage
    ? activePackage.options.reduce((sum, opt) => {
        return selectedOptionIds.has(opt.id) ? sum + (opt.priceUSD || 0) : sum;
      }, 0)
    : 0;

  const currentTotalGroup = currentTotalPerPerson * personCount;
  const USD_TO_KRW = 1360;

  const showToast = (msg: string) => {
    setCopyToast(msg);
    setTimeout(() => setCopyToast(null), 3000);
  };

  // Generate Quotation Summary Text
  const generateQuotationText = () => {
    if (!activePackage) return '';
    const included = activePackage.options.filter(o => selectedOptionIds.has(o.id));
    const excluded = activePackage.options.filter(o => !selectedOptionIds.has(o.id));

    let text = `[MANGO TOUR - 4박 5일 맞춤 골프 여행 견적 문의]\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `📌 상품명: ${activePackage.title}\n`;
    text += `⛳ 주요 골프장: ${activePackage.golfCourses.join(', ')}\n`;
    text += `📍 여행 지역: ${activePackage.location} (4박 5일)\n`;
    text += `📅 출발 희망일: ${departureDate || '미정'}\n`;
    text += `👥 여행 인원: ${personCount}명\n`;
    if (customerName) text += `👤 예약자명: ${customerName}\n`;
    if (customerContact) text += `📞 연락처/카카오ID: ${customerContact}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `💰 [예상 견적 금액]\n`;
    text += `• 1인 예상 금액: $${currentTotalPerPerson.toLocaleString()} (약 ${(currentTotalPerPerson * USD_TO_KRW).toLocaleString()}원)\n`;
    text += `• 총 예상 견적 (${personCount}인): $${currentTotalGroup.toLocaleString()} (약 ${(currentTotalGroup * USD_TO_KRW).toLocaleString()}원)\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `✅ [선택/포함 항목 (${included.length}개)]\n`;
    included.forEach(item => {
      text += ` • [${item.category}] ${item.name} ($${item.priceUSD})\n`;
    });
    if (excluded.length > 0) {
      text += `\n❌ [제외/미선택 항목 (${excluded.length}개)]\n`;
      excluded.forEach(item => {
        text += ` • ${item.name}\n`;
      });
    }
    if (customerNotes) {
      text += `━━━━━━━━━━━━━━━━━━━━━\n`;
      text += `📝 [고객 요청사항]\n${customerNotes}\n`;
    }
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `📞 망고투어 고객센터: +84 37 720 4451\n`;
    text += `📧 이메일 접수처: seo9791@gmail.com\n`;
    text += `💬 실시간 1:1 카카오톡 상담: https://open.kakao.com/o/gprQnKSi`;
    return text;
  };

  // Image Capture via html2canvas
  const captureQuotationImage = async (): Promise<string | null> => {
    if (!quotationCardRef.current) return null;
    setIsCapturing(true);
    try {
      await new Promise(r => setTimeout(r, 120));
      const canvas = await html2canvas(quotationCardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
        allowTaint: true,
      });
      const dataUrl = canvas.toDataURL('image/png');
      setCapturedImageUrl(dataUrl);

      // Attempt to write image to system clipboard
      try {
        canvas.toBlob(async (blob) => {
          if (blob && navigator.clipboard && (window as any).ClipboardItem) {
            try {
              const item = new (window as any).ClipboardItem({ 'image/png': blob });
              await navigator.clipboard.write([item]);
            } catch (e) {
              console.log('ClipboardItem write skipped:', e);
            }
          }
        }, 'image/png');
      } catch (clipErr) {
        console.log('Blob clipboard error:', clipErr);
      }

      setIsCapturing(false);
      return dataUrl;
    } catch (err) {
      console.error('Failed to capture quote image:', err);
      setIsCapturing(false);
      return null;
    }
  };

  const handleDownloadImage = (imgUrl?: string | null) => {
    const targetUrl = imgUrl || capturedImageUrl;
    if (!targetUrl) return;
    const a = document.createElement('a');
    a.href = targetUrl;
    const sanitizedTitle = (activePackage?.title || '맞춤골프견적').replace(/[^a-zA-Z0-9가-힣]/g, '_');
    a.download = `망고투어_${sanitizedTitle}_견적서_${new Date().toISOString().split('T')[0]}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('📥 견적서 이미지가 기기에 다운로드되었습니다.');
  };

  // KakaoTalk Consultation handler with image capture & text copy
  const handleKakaoInquiry = async () => {
    const text = generateQuotationText();
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      console.warn('Text clipboard write error:', e);
    }
    
    showToast('📸 견적서 이미지 및 텍스트를 준비하고 있습니다...');
    const imgUrl = await captureQuotationImage();
    
    if (imgUrl) {
      handleDownloadImage(imgUrl);
    }

    setShowKakaoModal(true);
  };

  // Open Direct Image Preview & Download Modal
  const handleSaveQuoteImage = async () => {
    showToast('📸 견적서 이미지를 캡처 중입니다...');
    const imgUrl = await captureQuotationImage();
    if (imgUrl) {
      handleDownloadImage(imgUrl);
      setShowImagePreviewModal(true);
    } else {
      showToast('⚠️ 이미지 캡처에 실패했습니다. 다시 시도해주세요.');
    }
  };

  // Open 1:1 Online Inquiry Modal with automatic image capture
  const handleOpenOnlineInquiry = async () => {
    setShowInquiryModal(true);
    setInquirySuccess(false);
    if (!capturedImageUrl) {
      await captureQuotationImage();
    }
  };

  // Direct Mailto Action to seo9791@gmail.com
  const handleSendMailto = () => {
    if (!activePackage) return;
    const subject = encodeURIComponent(`[망고투어 1:1 맞춤 견적 신청] ${customerName || '고객'}님 (${activePackage.title})`);
    const body = encodeURIComponent(generateQuotationText());
    window.open(`mailto:seo9791@gmail.com?subject=${subject}&body=${body}`, '_blank');
  };

  // Submit Online Inquiry & Send to seo9791@gmail.com
  const handleSubmitOnlineInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerContact.trim()) {
      alert('예약자 성함과 연락처(또는 카카오톡 ID)를 입력해주세요.');
      return;
    }

    setIsSubmittingEmail(true);

    let imgUrl = capturedImageUrl;
    if (!imgUrl) {
      imgUrl = await captureQuotationImage();
    }

    const included = activePackage ? activePackage.options.filter(o => selectedOptionIds.has(o.id)) : [];
    const excluded = activePackage ? activePackage.options.filter(o => !selectedOptionIds.has(o.id)) : [];

    const inquiryPayload = {
      _subject: `[망고투어 1:1 맞춤 견적 신청] ${customerName}님 (${activePackage?.title || '골프 패키지'})`,
      _template: 'table',
      _captcha: 'false',
      담당자이메일: 'seo9791@gmail.com',
      예약자명: customerName,
      연락처_카카오톡ID: customerContact,
      상품명: activePackage?.title || '',
      지역: activePackage?.location || '',
      기간: activePackage?.duration || '4박 5일',
      포함골프장: activePackage?.golfCourses?.join(', ') || '',
      출발희망일: departureDate || '미정',
      여행인원: `${personCount}명`,
      '1인_예상금액': `$${currentTotalPerPerson.toLocaleString()} (약 ${(currentTotalPerPerson * USD_TO_KRW).toLocaleString()}원)`,
      '총_예상견적': `$${currentTotalGroup.toLocaleString()} (약 ${(currentTotalGroup * USD_TO_KRW).toLocaleString()}원)`,
      선택포함항목: included.map(i => `${i.name} ($${i.priceUSD})`).join(' / '),
      제외항목: excluded.map(i => i.name).join(' / ') || '없음',
      고객요청사항: customerNotes || '없음',
      접수일시: new Date().toLocaleString('ko-KR')
    };

    // 1. Send via FormSubmit AJAX API to seo9791@gmail.com
    try {
      await fetch('https://formsubmit.co/ajax/seo9791@gmail.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(inquiryPayload)
      });
    } catch (netErr) {
      console.warn('FormSubmit AJAX request notice:', netErr);
    }

    // 2. Backup save to Firestore Database
    try {
      if (db) {
        await addDoc(collection(db, 'custom_trip_inquiries'), {
          ...inquiryPayload,
          createdAt: new Date().toISOString()
        });
      }
    } catch (dbErr) {
      console.warn('Firestore backup save error:', dbErr);
    }

    setIsSubmittingEmail(false);
    setInquirySuccess(true);
    showToast('📧 견적 신청서가 seo9791@gmail.com으로 접수되었습니다!');
  };

  const handleCopyQuote = () => {
    const text = generateQuotationText();
    navigator.clipboard.writeText(text).then(() => {
      showToast('📋 견적서 내용이 클립보드에 복사되었습니다.');
    });
  };

  const getCategoryBadge = (category: PackageOptionItem['category']) => {
    switch (category) {
      case 'golf': return { label: '⛳ 골프', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      case 'hotel': return { label: '🏨 숙박', bg: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 'vehicle': return { label: '🚐 차량', bg: 'bg-amber-100 text-amber-800 border-amber-200' };
      case 'meal': return { label: '🦞 식사', bg: 'bg-red-100 text-red-800 border-red-200' };
      case 'activity': return { label: '💆 스파/투어', bg: 'bg-purple-100 text-purple-800 border-purple-200' };
      case 'guide': return { label: '👨‍💼 가이드', bg: 'bg-indigo-100 text-indigo-800 border-indigo-200' };
      default: return { label: '✨ 기타', bg: 'bg-gray-100 text-gray-800 border-gray-200' };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-28 select-text">
      {/* Toast Notification */}
      {copyToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-gray-900/95 text-white px-5 py-3 rounded-2xl shadow-2xl text-xs sm:text-sm font-bold flex items-center gap-2 animate-fade-in backdrop-blur-md border border-gold-500/30">
          <span>✨</span>
          <span>{copyToast}</span>
        </div>
      )}

      {/* Hero Header */}
      <div className="bg-gradient-to-br from-deepgreen via-[#00382e] to-emerald-950 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(circle_at_30%_30%,#c5a028_0%,transparent_70%)] pointer-events-none"></div>
        <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12 relative z-10">
          <div className="mb-4">
            <BackButton 
              onClick={activePackage ? () => setActivePackage(null) : onBack}
              variant="hero"
              label={activePackage ? '목록으로 돌아가기' : '메인으로 돌아가기'}
            />
          </div>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-500/20 border border-gold-400/40 text-gold-300 text-xs font-bold mb-2">
                <span>🏆</span> 베트남 명문 4박 5일 맞춤 골프 플래너
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                {activePackage ? activePackage.title : '나만의 4박 5일 맞춤 골프 여행'}
              </h1>
              <p className="text-gray-300 text-xs sm:text-sm mt-2 max-w-2xl leading-relaxed">
                {activePackage 
                  ? activePackage.subtitle 
                  : '호치민·붕따우·달랏 명문 골프장 중심의 10대 엄선 상품! 필요한 항목과 필요 없는 항목을 자유롭게 체크하여 실시간 맞춤 견적을 확인하고 즉시 상담받으세요.'}
              </p>
            </div>

            {!activePackage && (
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/15 text-xs font-bold text-gray-200">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>총 {packages.length}개 전문 4박5일 패키지 등록됨</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-6">
        
        {/* ================= VIEW 1: PACKAGE LIST ================= */}
        {!activePackage && (
          <div>
            {/* Region Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-3 no-scrollbar mb-6">
              {locations.map(loc => (
                <button
                  key={loc.id}
                  onClick={() => setSelectedLocation(loc.id)}
                  className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                    selectedLocation === loc.id
                      ? 'bg-deepgreen text-white shadow-md scale-105'
                      : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <span>{loc.label}</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                    selectedLocation === loc.id ? 'bg-gold-500 text-white' : 'bg-gray-100 text-gray-500'
                  }`}>
                    {loc.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Packages Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredPackages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group"
                >
                  {/* Image Header */}
                  <div className="relative h-52 overflow-hidden bg-gray-100">
                    <img
                      src={pkg.image}
                      alt={pkg.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                    
                    {/* Location Badge */}
                    <div className="absolute top-3 left-3 flex gap-1.5">
                      <span className="px-2.5 py-1 bg-black/60 backdrop-blur-md text-white text-[11px] font-black rounded-xl border border-white/20">
                        📍 {pkg.location}
                      </span>
                      <span className="px-2.5 py-1 bg-gold-500 text-white text-[11px] font-black rounded-xl shadow-md">
                        {pkg.duration}
                      </span>
                    </div>

                    {/* Price Tag on Image */}
                    <div className="absolute bottom-3 right-3 text-right">
                      <span className="text-[10px] text-gray-300 font-bold block">기본 1인 예상가</span>
                      <span className="text-lg sm:text-xl font-black text-white drop-shadow-md">
                        ${pkg.basePriceUSD?.toLocaleString()} <span className="text-xs font-normal text-gold-300">(약 {((pkg.basePriceUSD || 0) * USD_TO_KRW).toLocaleString()}원)</span>
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex-grow flex flex-col justify-between space-y-4">
                    <div>
                      {/* Highlight Badges */}
                      <div className="flex flex-wrap gap-1.5 mb-2.5">
                        {pkg.highlightBadges?.slice(0, 3).map((badge, bIdx) => (
                          <span key={bIdx} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md text-[10px] font-bold border border-emerald-200">
                            ✓ {badge}
                          </span>
                        ))}
                      </div>

                      <h3 className="font-black text-base sm:text-lg text-gray-900 line-clamp-1 group-hover:text-deepgreen transition">
                        {pkg.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                        {pkg.subtitle}
                      </p>

                      {/* Golf Courses */}
                      <div className="mt-3.5 bg-gray-50 rounded-2xl p-3 border border-gray-100">
                        <div className="text-[11px] font-black text-deepgreen mb-1.5 flex items-center gap-1">
                          <span>⛳ 포함 골프장 ({pkg.golfCourses.length}개소)</span>
                        </div>
                        <div className="space-y-1">
                          {pkg.golfCourses.map((course, cIdx) => (
                            <div key={cIdx} className="text-xs text-gray-700 font-medium flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-gold-500"></span>
                              <span>{course}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Options Count & CTA */}
                    <div>
                      <div className="flex justify-between items-center text-xs text-gray-500 font-bold mb-3 px-1">
                        <span>선택 가능 항목: {pkg.options?.length || 0}개</span>
                        <span className="text-deepgreen">일정: 4박 5일 풀코스</span>
                      </div>

                      <button
                        onClick={() => handleOpenPackage(pkg)}
                        className="w-full py-3.5 bg-deepgreen text-white font-bold rounded-2xl hover:bg-gold-600 transition shadow-md flex items-center justify-center gap-2 text-xs sm:text-sm active:scale-95"
                      >
                        <span>✏️ 내 맘대로 견적 만들기</span>
                        <span className="text-gold-300">→</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}


        {/* ================= VIEW 2: ACTIVE PACKAGE CUSTOMIZER ================= */}
        {activePackage && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column (7 cols): Options & Itinerary (Capturable Quotation Card) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Capturable Card Wrapper */}
              <div 
                ref={quotationCardRef} 
                className="bg-white rounded-3xl p-5 sm:p-7 border border-gray-200/90 shadow-md space-y-5 relative"
              >
                {/* Brand Watermark on Image */}
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">🥭</span>
                    <span className="font-black text-sm tracking-wider text-deepgreen">MANGO TOUR 맞춤 골프 견적서</span>
                  </div>
                  <div className="text-[11px] font-bold text-gray-400">
                    발급일시: {new Date().toLocaleDateString('ko-KR')}
                  </div>
                </div>

                {/* Package Summary Card */}
                <div>
                  <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between pb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="px-2.5 py-0.5 rounded-full bg-deepgreen text-white text-[11px] font-bold">
                          📍 {activePackage.location}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-gold-500 text-white text-[11px] font-bold shadow-sm">
                          ⏱️ {activePackage.duration}
                        </span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-black text-gray-900 leading-snug">{activePackage.title}</h2>
                      <p className="text-xs sm:text-sm text-gray-500 mt-1 leading-relaxed">{activePackage.summary || activePackage.subtitle}</p>
                    </div>
                  </div>

                  {/* Golf Course Chips */}
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="text-xs font-black text-gray-700 mb-2 flex items-center gap-1.5">
                      <span>⛳ 라운딩 코스 안내</span>
                      <span className="text-[10px] font-normal text-gray-400">({activePackage.golfCourses.length}개소)</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {activePackage.golfCourses.map((c, i) => (
                        <span key={i} className="px-3 py-1 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold border border-emerald-200">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Tabs: Options Customizer vs Itinerary */}
                <div className="flex rounded-2xl bg-gray-100 p-1">
                  <button
                    type="button"
                    onClick={() => setViewTab('options')}
                    className={`flex-1 py-2.5 text-xs sm:text-sm font-black rounded-xl transition ${
                      viewTab === 'options' ? 'bg-white text-deepgreen shadow-sm' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    ✓ 포함/제외 항목 선택 ({selectedOptionIds.size}/{activePackage.options.length}개 선택됨)
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewTab('itinerary')}
                    className={`flex-1 py-2.5 text-xs sm:text-sm font-black rounded-xl transition ${
                      viewTab === 'itinerary' ? 'bg-white text-deepgreen shadow-sm' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    📅 4박 5일 상세 일정표 ({activePackage.itinerary?.length || 5}일)
                  </button>
                </div>

                {/* TAB 1: Checkable Options List */}
                {viewTab === 'options' && (
                  <div className="space-y-4 pt-1">
                    <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                      <div>
                        <h3 className="font-black text-sm sm:text-base text-gray-900">맞춤 항목 체크리스트</h3>
                        <p className="text-[11px] text-gray-500">필요 없는 항목은 체크를 해제하시면 견적에서 즉시 차감됩니다.</p>
                      </div>
                      <div className="text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            const allIds = new Set(activePackage.options.map(o => o.id));
                            setSelectedOptionIds(allIds);
                          }}
                          className="text-[11px] text-deepgreen font-bold hover:underline mr-2"
                        >
                          전체 선택
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const reqIds = new Set(activePackage.options.filter(o => o.isRequired).map(o => o.id));
                            setSelectedOptionIds(reqIds);
                          }}
                          className="text-[11px] text-gray-400 font-bold hover:underline"
                        >
                          필수만 선택
                        </button>
                      </div>
                    </div>

                    {/* Options List */}
                    <div className="space-y-2.5">
                      {activePackage.options.map(option => {
                        const isSelected = selectedOptionIds.has(option.id);
                        const badge = getCategoryBadge(option.category);
                        
                        return (
                          <div
                            key={option.id}
                            onClick={() => handleToggleOption(option)}
                            className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                              isSelected
                                ? 'bg-emerald-50/50 border-emerald-300 shadow-sm'
                                : 'bg-gray-50/70 border-gray-200 opacity-60 hover:opacity-100'
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                disabled={option.isRequired}
                                onChange={() => {}}
                                className="mt-1 w-5 h-5 rounded-lg text-deepgreen accent-deepgreen cursor-pointer"
                              />
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${badge.bg}`}>
                                    {badge.label}
                                  </span>
                                  <span className={`text-xs sm:text-sm font-black ${isSelected ? 'text-gray-900' : 'text-gray-500 line-through'}`}>
                                    {option.name}
                                  </span>
                                  {option.isRequired && (
                                    <span className="text-[10px] text-red-500 font-bold bg-red-50 px-1.5 py-0.5 rounded">필수</span>
                                  )}
                                </div>
                                {option.description && (
                                  <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">{option.description}</p>
                                )}
                              </div>
                            </div>

                            <div className="text-right whitespace-nowrap pl-2">
                              <span className={`text-xs sm:text-sm font-black ${isSelected ? 'text-emerald-700' : 'text-gray-400'}`}>
                                ${option.priceUSD?.toLocaleString()}
                              </span>
                              <span className="block text-[10px] text-gray-400">
                                (약 {((option.priceUSD || 0) * USD_TO_KRW).toLocaleString()}원)
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* TAB 2: Itinerary Timeline */}
                {viewTab === 'itinerary' && (
                  <div className="space-y-4 pt-1">
                    <div>
                      <h3 className="font-black text-base text-gray-900">📅 4박 5일 정규 일정표</h3>
                      <p className="text-xs text-gray-500">현지 사정 및 항공 시간에 따라 유연하게 조율 가능합니다.</p>
                    </div>

                    <div className="space-y-3">
                      {activePackage.itinerary?.map(item => (
                        <div key={item.day} className="flex gap-3 items-start">
                          <div className="w-9 h-9 rounded-xl bg-deepgreen text-white font-black text-xs flex items-center justify-center flex-shrink-0 shadow-sm">
                            D{item.day}
                          </div>
                          <div className="bg-gray-50 rounded-2xl p-3.5 flex-grow border border-gray-100">
                            <h4 className="text-xs sm:text-sm font-black text-gray-900 mb-1">{item.title}</h4>
                            <ul className="space-y-1">
                              {item.activities.map((act, aIdx) => (
                                <li key={aIdx} className="text-xs text-gray-600 flex items-start gap-1.5 leading-relaxed">
                                  <span className="text-gold-500 mt-0.5">•</span>
                                  <span>{act}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Official Quotation Summary Footer (Included in Captured Screenshot) */}
                <div className="pt-4 mt-4 border-t-2 border-dashed border-gray-200 space-y-3">
                  <div className="bg-gradient-to-br from-gray-900 to-deepgreen text-white p-4 rounded-2xl shadow-inner">
                    <div className="flex flex-wrap justify-between items-center gap-2 mb-2 pb-2 border-b border-white/15 text-xs">
                      <div className="flex items-center gap-3">
                        <span className="text-gray-300">📅 출발희망일: <strong className="text-gold-300">{departureDate || '미정'}</strong></span>
                        <span className="text-gray-300">👥 여행인원: <strong className="text-gold-300">{personCount}명</strong></span>
                      </div>
                      <div className="text-[11px] text-emerald-300 font-bold">
                        선택 포함: {selectedOptionIds.size}개 | 제외: {activePackage.options.length - selectedOptionIds.size}개
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pt-1">
                      <div>
                        <span className="text-[11px] text-gray-300 block">1인 기준 예상 견적</span>
                        <span className="text-lg font-black text-white">
                          ${currentTotalPerPerson.toLocaleString()} <span className="text-xs font-normal text-gold-300">(약 {(currentTotalPerPerson * USD_TO_KRW).toLocaleString()}원)</span>
                        </span>
                      </div>
                      <div className="text-left sm:text-right">
                        <span className="text-[11px] text-gold-300 block font-bold">총 {personCount}인 예상 견적 합계</span>
                        <span className="text-xl sm:text-2xl font-black text-gold-400">
                          ${currentTotalGroup.toLocaleString()}
                        </span>
                        <span className="block text-[11px] text-gray-300 font-medium">
                          (약 {(currentTotalGroup * USD_TO_KRW).toLocaleString()}원)
                        </span>
                      </div>
                    </div>

                    {customerNotes && (
                      <div className="mt-3 pt-2 border-t border-white/10 text-[11px] text-gray-300">
                        <span className="text-gold-300 font-bold">📝 추가 요청사항: </span>
                        <span>{customerNotes}</span>
                      </div>
                    )}
                  </div>

                  {/* Official Inquiry Channels Footer */}
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-2 px-2 text-[11px] text-gray-500 font-medium">
                    <div>💬 카카오톡 1:1 상담: <strong className="text-deepgreen">open.kakao.com/o/gprQnKSi</strong></div>
                    <div>📧 이메일 문의 접수: <strong className="text-deepgreen">seo9791@gmail.com</strong></div>
                  </div>
                </div>

              </div>

            </div>


            {/* Right Column (5 cols): Real-Time Price Calculator & Inquiry Action Panel */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Sticky Calculator Box */}
              <div className="bg-white rounded-3xl p-5 sm:p-6 border-2 border-gold-400/50 shadow-xl space-y-5 sticky top-20">
                
                <div className="bg-gradient-to-r from-deepgreen to-[#004d40] text-white p-4 rounded-2xl text-center shadow-md">
                  <div className="text-[11px] text-gold-300 font-bold uppercase tracking-wider">실시간 맞춤 견적 계산기</div>
                  <div className="mt-1">
                    <span className="text-2xl sm:text-3xl font-black text-white">
                      ${currentTotalPerPerson.toLocaleString()}
                    </span>
                    <span className="text-xs text-gray-300 font-bold ml-1">/ 1인 기준</span>
                  </div>
                  <div className="text-xs text-gold-300 font-medium mt-0.5">
                    (약 {(currentTotalPerPerson * USD_TO_KRW).toLocaleString()}원)
                  </div>
                </div>

                {/* Input Fields */}
                <div className="space-y-3.5 text-xs">
                  
                  {/* Passenger Count */}
                  <div>
                    <label className="font-bold text-gray-700 block mb-1.5">👥 여행 인원 수</label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPersonCount(Math.max(1, personCount - 1))}
                        className="w-10 h-10 rounded-xl bg-gray-100 text-gray-700 font-black text-base hover:bg-gray-200 transition active:scale-95"
                      >
                        -
                      </button>
                      <div className="flex-1 text-center font-black text-base bg-gray-50 py-2 rounded-xl border border-gray-200 text-deepgreen">
                        {personCount} 명
                      </div>
                      <button
                        type="button"
                        onClick={() => setPersonCount(personCount + 1)}
                        className="w-10 h-10 rounded-xl bg-gray-100 text-gray-700 font-black text-base hover:bg-gray-200 transition active:scale-95"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Departure Date */}
                  <div>
                    <label className="font-bold text-gray-700 block mb-1.5">📅 출발 희망일자</label>
                    <input
                      type="date"
                      value={departureDate}
                      onChange={(e) => setDepartureDate(e.target.value)}
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-800 outline-none focus:border-gold-500"
                    />
                  </div>

                  {/* Customer Inquiry & Special Requests */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between items-center">
                      <label className="font-bold text-gray-800 flex items-center gap-1">
                        <span>📝</span> 문의 및 추가 요청사항
                      </label>
                      <span className="text-[10px] text-gray-400 font-medium">선택 사항</span>
                    </div>

                    <textarea
                      rows={3}
                      value={customerNotes}
                      onChange={(e) => setCustomerNotes(e.target.value)}
                      placeholder="예: 오전 8시 이전 티타임 희망, 싱글룸(1인1실) 추가 비용 문의, 골프 클럽 대여 필요 등"
                      className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 outline-none focus:bg-white focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition resize-none leading-relaxed"
                    />

                    {/* Quick Request Chips */}
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {[
                        '🌅 오전 8시 이전 티타임',
                        '🛏️ 싱글룸 문의',
                        '✈️ 항공권 포함 견적',
                        '🏌️ 클럽 렌탈 필요'
                      ].map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => {
                            setCustomerNotes(prev => prev ? `${prev}, ${tag}` : tag);
                          }}
                          className="px-2 py-1 bg-gray-100 hover:bg-gold-100 hover:text-gold-900 text-gray-600 rounded-lg text-[10px] font-bold transition border border-gray-200/80 active:scale-95"
                        >
                          +{tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Summary Breakdown */}
                  <div className="p-3.5 bg-gray-50 rounded-2xl space-y-2 border border-gray-100">
                    <div className="flex justify-between text-gray-600">
                      <span>선택된 포함 항목</span>
                      <span className="font-bold text-deepgreen">{selectedOptionIds.size}개 항목</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>제외된 항목</span>
                      <span className="font-bold text-red-500">{activePackage.options.length - selectedOptionIds.size}개 항목</span>
                    </div>
                    <div className="pt-2 border-t border-gray-200 flex justify-between items-center">
                      <span className="font-black text-gray-900">총 그룹 예상 견적 ({personCount}인)</span>
                      <div className="text-right">
                        <span className="text-lg font-black text-deepgreen">
                          ${currentTotalGroup.toLocaleString()}
                        </span>
                        <span className="block text-[10px] text-gray-500 font-medium">
                          (약 {(currentTotalGroup * USD_TO_KRW).toLocaleString()}원)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Brand & Phone Footer in Quotation Card */}
                  <div className="pt-2 text-[10px] text-gray-400 border-t border-gray-100 flex items-center justify-between">
                    <span>MANGO TOUR GOLF & TRAVEL</span>
                    <a href="tel:+84377204451" className="hover:text-deepgreen font-bold text-gray-600">
                      TEL: +84 37 720 4451
                    </a>
                  </div>
                </div>

                {/* Primary Action Buttons */}
                <div className="space-y-2.5 pt-2">
                  {/* Kakao button with automatic capture */}
                  <button
                    type="button"
                    onClick={handleKakaoInquiry}
                    disabled={isCapturing}
                    className="w-full py-4 bg-[#FEE500] text-[#191919] font-black rounded-2xl hover:bg-[#FDD835] transition shadow-lg flex items-center justify-center gap-2 text-sm active:scale-95 disabled:opacity-75"
                  >
                    <span>{isCapturing ? '⏳' : '💬'}</span>
                    <span>{isCapturing ? '견적서 캡처 생성 중...' : '카카오톡으로 즉시 견적 문의하기'}</span>
                  </button>

                  {/* 1:1 Online Inquiry (Email to seo9791@gmail.com) */}
                  <button
                    type="button"
                    onClick={handleOpenOnlineInquiry}
                    className="w-full py-3.5 bg-deepgreen text-white font-black rounded-2xl hover:bg-[#00382e] transition shadow-md flex items-center justify-center gap-2 text-xs sm:text-sm active:scale-95"
                  >
                    <span>📧</span>
                    <span>1:1 온라인 신청 (이메일 발송)</span>
                  </button>

                  {/* Secondary actions grid */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleSaveQuoteImage}
                      disabled={isCapturing}
                      className="py-3 bg-gold-50 text-gold-900 border border-gold-300 font-bold rounded-2xl hover:bg-gold-100 transition text-xs flex items-center justify-center gap-1.5 active:scale-95"
                    >
                      <span>📸</span>
                      <span>견적서 캡처 저장</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyQuote}
                      className="py-3 bg-gray-100 text-gray-700 font-bold rounded-2xl hover:bg-gray-200 transition text-xs flex items-center justify-center gap-1.5 active:scale-95"
                    >
                      <span>📋</span>
                      <span>견적서 텍스트 복사</span>
                    </button>
                  </div>
                </div>

                <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-[10px] text-amber-800 leading-relaxed">
                  💡 <strong>안내:</strong> 문의 시 현재 설정하신 맞춤 항목 견적서가 <strong>그림 이미지로 자동 캡처</strong>되어 카카오톡 또는 이메일(<strong>seo9791@gmail.com</strong>)로 전송할 수 있습니다.
                </div>

              </div>

            </div>

          </div>
        )}

      </div>

      {/* ================= MODAL 1: 1:1 ONLINE INQUIRY MODAL (EMAIL TO seo9791@gmail.com) ================= */}
      {showInquiryModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-7 relative shadow-2xl animate-scale-in my-8 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => { setShowInquiryModal(false); setInquirySuccess(false); }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-bold text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
            >
              ✕
            </button>

            {!inquirySuccess ? (
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded-md">이메일 접수</span>
                  <span className="text-xs text-gray-400">seo9791@gmail.com</span>
                </div>
                <h3 className="text-xl font-black text-deepgreen">1:1 맞춤 골프 견적 신청서</h3>
                <p className="text-xs text-gray-500 mb-4">선택하신 {selectedOptionIds.size}개 맞춤 견적서가 담당자 이메일로 즉시 전송됩니다.</p>

                {/* Captured Screenshot Preview Thumbnail */}
                {capturedImageUrl && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-2xl border border-gray-200">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[11px] font-bold text-gray-700 flex items-center gap-1">
                        <span>📸</span> 자동 캡처된 견적서 이미지 미리보기
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDownloadImage(capturedImageUrl)}
                        className="text-[10px] text-deepgreen font-bold hover:underline"
                      >
                        📥 이미지 다운로드
                      </button>
                    </div>
                    <div className="max-h-36 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-inner">
                      <img src={capturedImageUrl} alt="Quotation Preview" className="w-full object-top" />
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmitOnlineInquiry} className="space-y-3.5 text-xs">
                  <div>
                    <label className="font-bold text-gray-700 block mb-1">예약자 성함 / 대표자명 *</label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="홍길동"
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-medium outline-none focus:border-gold-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-gray-700 block mb-1">연락처 또는 카카오톡 ID *</label>
                    <input
                      type="text"
                      required
                      value={customerContact}
                      onChange={(e) => setCustomerContact(e.target.value)}
                      placeholder="010-1234-5678 또는 카카오톡ID"
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-medium outline-none focus:border-gold-500 focus:bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-gray-700 block mb-1">인원 수</label>
                      <input
                        type="number"
                        min="1"
                        value={personCount}
                        onChange={(e) => setPersonCount(parseInt(e.target.value) || 1)}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-medium outline-none focus:border-gold-500 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-gray-700 block mb-1">출발 희망일</label>
                      <input
                        type="date"
                        value={departureDate}
                        onChange={(e) => setDepartureDate(e.target.value)}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-medium outline-none focus:border-gold-500 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-gray-700 block mb-1">추가 요청사항 (선택)</label>
                    <textarea
                      rows={2}
                      value={customerNotes}
                      onChange={(e) => setCustomerNotes(e.target.value)}
                      placeholder="티타임 시간대, 선호 호텔 유형, 클럽 렌탈 여부 등"
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-medium outline-none focus:border-gold-500 focus:bg-white resize-none"
                    />
                  </div>

                  <div className="p-3.5 bg-emerald-50 rounded-xl border border-emerald-200 flex justify-between items-center">
                    <div>
                      <span className="text-[10px] text-emerald-700 block">총 {personCount}인 예상 견적</span>
                      <span className="font-black text-emerald-900 text-sm">
                        ${currentTotalGroup.toLocaleString()} (약 {(currentTotalGroup * USD_TO_KRW).toLocaleString()}원)
                      </span>
                    </div>
                    <div className="text-[10px] text-emerald-700 font-bold bg-white px-2.5 py-1 rounded-lg border border-emerald-200">
                      선택 {selectedOptionIds.size}개
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingEmail}
                    className="w-full py-4 bg-deepgreen text-white font-black rounded-2xl hover:bg-[#00382e] transition shadow-lg text-sm active:scale-95 disabled:opacity-75 flex items-center justify-center gap-2"
                  >
                    <span>{isSubmittingEmail ? '⏳' : '🚀'}</span>
                    <span>{isSubmittingEmail ? '이메일(seo9791@gmail.com) 전송 중...' : '1:1 온라인 견적 신청서 발송하기'}</span>
                  </button>
                </form>
              </div>
            ) : (
              <div className="text-center py-4 space-y-4">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl mx-auto">
                  ✓
                </div>
                <h3 className="text-2xl font-black text-deepgreen">신청서가 성공적으로 전송되었습니다!</h3>
                <p className="text-xs text-gray-600 leading-relaxed max-w-sm mx-auto">
                  <strong>{customerName}</strong>님, 접수해주신 견적서가 담당자 이메일(<strong>seo9791@gmail.com</strong>)로 정상 전달되었습니다. 담당 매니저가 확인 후 연락처(<strong>{customerContact}</strong>)로 빠른 상담을 진행해 드립니다.
                </p>

                {capturedImageUrl && (
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-left">
                    <div className="text-[11px] font-bold text-gray-700 mb-1">📸 생성된 견적서 이미지:</div>
                    <div className="max-h-28 overflow-y-auto rounded-lg border border-gray-200 bg-white">
                      <img src={capturedImageUrl} alt="Quotation" className="w-full" />
                    </div>
                  </div>
                )}

                <div className="pt-2 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={handleSendMailto}
                    className="w-full py-3 bg-blue-50 text-blue-800 border border-blue-200 font-bold rounded-2xl hover:bg-blue-100 transition text-xs flex items-center justify-center gap-1.5"
                  >
                    <span>📧</span>
                    <span>내 메일 앱(Gmail/기본메일)으로도 확인 발송</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadImage(capturedImageUrl)}
                    className="w-full py-3 bg-gray-100 text-gray-800 font-bold rounded-2xl hover:bg-gray-200 transition text-xs flex items-center justify-center gap-1.5"
                  >
                    <span>📥</span>
                    <span>견적서 이미지(PNG) 다운로드</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      window.open('https://open.kakao.com/o/gprQnKSi', '_blank');
                    }}
                    className="w-full py-3.5 bg-[#FEE500] text-[#191919] font-black rounded-2xl hover:bg-[#FDD835] transition text-xs flex items-center justify-center gap-1.5"
                  >
                    <span>💬</span>
                    <span>카카오톡 실시간 상담 바로 연결</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowInquiryModal(false); setInquirySuccess(false); }}
                    className="w-full py-3 text-gray-400 font-bold hover:text-gray-600 transition text-xs"
                  >
                    닫기
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ================= MODAL 2: KAKAOTALK CONSULTATION & SCREENSHOT SHARING MODAL ================= */}
      {showKakaoModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-5 sm:p-7 relative shadow-2xl animate-scale-in my-8 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowKakaoModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-bold text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
            >
              ✕
            </button>

            <div className="text-center space-y-4">
              <div className="w-14 h-14 bg-[#FEE500] text-[#191919] rounded-2xl flex items-center justify-center text-2xl mx-auto shadow-md">
                💬
              </div>

              <div>
                <h3 className="text-xl font-black text-gray-900">카카오톡 견적 문의 준비 완료</h3>
                <p className="text-xs text-gray-500 mt-1">
                  견적 텍스트가 복사되었으며, 견적서 이미지가 기기에 다운로드되었습니다.
                </p>
              </div>

              {/* Image Preview */}
              {capturedImageUrl && (
                <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200 text-left">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[11px] font-bold text-gray-700">📸 캡처된 견적서 이미지 미리보기</span>
                    <span className="text-[10px] text-emerald-600 font-bold">✓ 다운로드 완료</span>
                  </div>
                  <div className="max-h-48 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-inner">
                    <img src={capturedImageUrl} alt="Quotation Capture" className="w-full object-top" />
                  </div>
                </div>
              )}

              {/* Instructions Steps */}
              <div className="bg-amber-50 rounded-2xl p-3.5 border border-amber-200/80 text-left text-xs space-y-1.5 text-amber-900">
                <div className="font-bold flex items-center gap-1">
                  <span>💡</span> 카카오톡 상담창에서 보내는 방법:
                </div>
                <div className="text-[11px] text-amber-800 leading-relaxed pl-4 space-y-1 list-decimal">
                  <div>1. 아래 <strong>[카카오톡 오픈채팅방 열기]</strong>를 누릅니다.</div>
                  <div>2. 상담창에 <strong>붙여넣기 (Ctrl+V 또는 길게 눌러 붙여넣기)</strong>를 하시면 견적 텍스트가 전송됩니다.</div>
                  <div>3. 다운로드된 <strong>견적서 이미지(PNG)</strong>를 첨부해 주시면 더욱 빠르고 정확한 맞춤 상담이 가능합니다!</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    window.open('https://open.kakao.com/o/gprQnKSi', '_blank');
                  }}
                  className="w-full py-4 bg-[#FEE500] text-[#191919] font-black rounded-2xl hover:bg-[#FDD835] transition shadow-lg text-sm flex items-center justify-center gap-2 active:scale-95"
                >
                  <span>💬</span>
                  <span>카카오톡 오픈채팅방 바로가기</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleDownloadImage(capturedImageUrl)}
                    className="py-3 bg-gray-100 text-gray-800 font-bold rounded-2xl hover:bg-gray-200 transition text-xs flex items-center justify-center gap-1 active:scale-95"
                  >
                    <span>📥</span>
                    <span>이미지 다시 다운로드</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const text = generateQuotationText();
                      navigator.clipboard.writeText(text).then(() => {
                        showToast('📋 견적 텍스트가 다시 복사되었습니다.');
                      });
                    }}
                    className="py-3 bg-gray-100 text-gray-800 font-bold rounded-2xl hover:bg-gray-200 transition text-xs flex items-center justify-center gap-1 active:scale-95"
                  >
                    <span>📋</span>
                    <span>텍스트 다시 복사</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowKakaoModal(false)}
                  className="w-full py-2.5 text-gray-400 font-bold hover:text-gray-600 transition text-xs"
                >
                  닫기
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: IMAGE PREVIEW & DIRECT SAVE MODAL ================= */}
      {showImagePreviewModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-5 sm:p-7 relative shadow-2xl animate-scale-in my-8 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowImagePreviewModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-bold text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
            >
              ✕
            </button>

            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-black text-gray-900 flex items-center gap-2">
                  <span>📸</span> 견적서 이미지 캡처 완료
                </h3>
                <p className="text-xs text-gray-500 mt-1">고해상도 견적서 이미지가 생성되었습니다. 파일로 저장하거나 공유할 수 있습니다.</p>
              </div>

              {capturedImageUrl && (
                <div className="max-h-96 overflow-y-auto rounded-2xl border-2 border-gray-200 bg-white p-2 shadow-inner">
                  <img src={capturedImageUrl} alt="Quotation Capture Full" className="w-full rounded-xl" />
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleDownloadImage(capturedImageUrl)}
                  className="flex-1 py-3.5 bg-deepgreen text-white font-black rounded-2xl hover:bg-[#00382e] transition shadow-md text-xs flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <span>📥</span>
                  <span>이미지 다운로드 (PNG)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowImagePreviewModal(false);
                    setShowKakaoModal(true);
                  }}
                  className="flex-1 py-3.5 bg-[#FEE500] text-[#191919] font-black rounded-2xl hover:bg-[#FDD835] transition shadow-md text-xs flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <span>💬</span>
                  <span>카카오톡으로 문의하기</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default TripPlanner;
