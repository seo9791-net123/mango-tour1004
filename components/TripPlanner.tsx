import React, { useState, useRef, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { CustomTripPackage, PackageOptionItem, MasterOptionPool, Product } from '../types';
import { INITIAL_MASTER_OPTION_POOL } from '../constants';
import BackButton from './BackButton';
import { supabaseService } from '../services/supabaseService';
import { A4QuotationDocument, CostItem, ItineraryDay } from './A4QuotationDocument';

interface Props {
  packages?: CustomTripPackage[];
  masterOptionPool?: MasterOptionPool;
  products?: Product[];
  onBack: () => void;
}

export const TripPlanner: React.FC<Props> = ({ masterOptionPool, products = [], onBack }) => {
  const pool = masterOptionPool || INITIAL_MASTER_OPTION_POOL;
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
  
  // Dynamic Customer Customization states
  // 1. Golf Courses customizable per day
  const [customGolfCourses, setCustomGolfCourses] = useState<string[]>([]);
  const [showGolfModal, setShowGolfModal] = useState<boolean>(false);
  const [golfLocationFilter, setGolfLocationFilter] = useState<string>('전체');
  const [activeRoundIndex, setActiveRoundIndex] = useState<number>(0);

  // 2. Options Customization (Accommodation, Vehicle, Guide, Meal, etc.)
  const [customOptionSelections, setCustomOptionSelections] = useState<Record<string, {
    choiceId: string;
    name: string;
    priceDelta: number;
    description?: string;
    badge?: string;
  }>>({});
  const [expandedOptionId, setExpandedOptionId] = useState<string | null>(null);
  const [customizingOption, setCustomizingOption] = useState<PackageOptionItem | null>(null);
  const [optionModalFilter, setOptionModalFilter] = useState<string>('전체');
  const [optionModalTypeFilter, setOptionModalTypeFilter] = useState<string>('전체');

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
  const [showScheduleModal, setShowScheduleModal] = useState<boolean>(false);
  const [showActivityModal, setShowActivityModal] = useState<'golf' | 'tour' | null>(null);

  const quotationCardRef = useRef<HTMLDivElement>(null);
  const a4QuotationPrintRef = useRef<HTMLDivElement>(null);

  // Handle internal step-by-step back (closing modals or returning from package customization)
  const handleTopBack = () => {
    if (showScheduleModal) {
      setShowScheduleModal(false);
      return;
    }
    if (showActivityModal) {
      setShowActivityModal(null);
      return;
    }
    if (showImagePreviewModal) {
      setShowImagePreviewModal(false);
      return;
    }
    if (showGolfModal) {
      setShowGolfModal(false);
      return;
    }
    if (customizingOption) {
      setCustomizingOption(null);
      return;
    }
    if (showKakaoModal) {
      setShowKakaoModal(false);
      return;
    }
    if (showInquiryModal) {
      setShowInquiryModal(false);
      return;
    }
    if (activePackage) {
      setActivePackage(null);
      return;
    }
    onBack();
  };

  // Listen for mobile bottom nav "뒤로가기" event
  useEffect(() => {
    const handleSubViewBack = (e: any) => {
      if (showScheduleModal) {
        setShowScheduleModal(false);
        e?.detail?.handled?.();
        return;
      }
      if (showActivityModal) {
        setShowActivityModal(null);
        e?.detail?.handled?.();
        return;
      }
      if (showImagePreviewModal) {
        setShowImagePreviewModal(false);
        e?.detail?.handled?.();
        return;
      }
      if (showGolfModal) {
        setShowGolfModal(false);
        e?.detail?.handled?.();
        return;
      }
      if (customizingOption) {
        setCustomizingOption(null);
        e?.detail?.handled?.();
        return;
      }
      if (showKakaoModal) {
        setShowKakaoModal(false);
        e?.detail?.handled?.();
        return;
      }
      if (showInquiryModal) {
        setShowInquiryModal(false);
        e?.detail?.handled?.();
        return;
      }
      if (activePackage) {
        setActivePackage(null);
        e?.detail?.handled?.();
        return;
      }
    };

    window.addEventListener('mango_subview_back', handleSubViewBack as EventListener);
    return () => {
      window.removeEventListener('mango_subview_back', handleSubViewBack as EventListener);
    };
  }, [showScheduleModal, showActivityModal, showImagePreviewModal, showGolfModal, customizingOption, showKakaoModal, showInquiryModal, activePackage]);

  // Live Pools synced from AdminDashboard (with safe fallbacks)
  const diyRegions = pool.diyRegions?.length ? pool.diyRegions : (INITIAL_MASTER_OPTION_POOL.diyRegions || []);
  const diyAccommodations = pool.accommodationTiers?.length ? pool.accommodationTiers : (INITIAL_MASTER_OPTION_POOL.accommodationTiers || []);
  const diyVehicles = pool.vehicles?.length ? pool.vehicles : INITIAL_MASTER_OPTION_POOL.vehicles;
  const diyTourPool = pool.tourOptions?.length ? pool.tourOptions : (INITIAL_MASTER_OPTION_POOL.tourOptions || []);
  const diyExtraServices = pool.extraServices?.length ? pool.extraServices : (INITIAL_MASTER_OPTION_POOL.extraServices || []);

  // DIY Trip Builder States (6-Step Flow)
  const [diyLocation, setDiyLocation] = useState<string>(diyRegions[0]?.name || '호치민');
  const [diyNights, setDiyNights] = useState<number>(3);
  const [diyRounds, setDiyRounds] = useState<number>(3);
  const [diyActivityMode, setDiyActivityMode] = useState<'golf' | 'tour'>('golf');
  const [diyGolfCourses, setDiyGolfCourses] = useState<string[]>([
    '떤선녓 CC (18홀)',
    '롱탄 CC (18홀)',
    '트윈도브스 CC (18홀)'
  ]);
  const [diySelectedTourIds, setDiySelectedTourIds] = useState<string[]>(['tour-free']);
  const [diyHotelType, setDiyHotelType] = useState<string>(diyAccommodations[0]?.id || 'hotel_5star');
  const [diyVehicleType, setDiyVehicleType] = useState<string>(
    diyVehicles.find(v => v.shortName === '9인승' || v.id === 'veh-1')?.id || diyVehicles[0]?.id || 'veh-1'
  );
  const [diySelectedExtraIds, setDiySelectedExtraIds] = useState<string[]>(() =>
    diyExtraServices.filter(e => e.defaultSelected).map(e => e.id)
  );

  // Step Modal Helpers
  const [diyChangingRoundIndex, setDiyChangingRoundIndex] = useState<number | null>(null);
  const [showAllCoursesInGolfModal, setShowAllCoursesInGolfModal] = useState<boolean>(false);

  const diyDays = diyNights + 1;

  // Resolve currently active items safely (handles Admin edits/deletions cleanly)
  const selectedRegionItem = diyRegions.find(r => r.name === diyLocation) || diyRegions[0];
  const selectedHotelTier = diyAccommodations.find(a => a.id === diyHotelType) || diyAccommodations[0];
  const selectedVehicleItem = diyVehicles.find(v => v.id === diyVehicleType) || diyVehicles[0];

  // Combine Admin Tour Pool + Regional Tour Products for the selected region
  const getDIYTourOptionsForRegion = (loc: string) => {
    const poolTours = diyTourPool.filter(t =>
      t.isFreeTravel || t.location === '전체' || t.location === loc || t.location.includes(loc) || loc.includes(t.location)
    );
    const seenNames = new Set(poolTours.map(t => t.name.trim().toLowerCase()));
    const productTours = products
      .filter(p => p.type === 'tour' && (p.location === loc || p.location.includes(loc) || loc.includes(p.location)))
      .filter(p => !seenNames.has(p.title.trim().toLowerCase()))
      .map(p => ({
        id: `prod-tour-${p.id}`,
        name: p.title,
        location: p.location,
        priceUSD: p.price || 80,
        description: p.description,
        badge: p.duration || '추천 투어',
        isFreeTravel: false
      }));
    return [...poolTours, ...productTours];
  };

  const activeRegionTourOptions = getDIYTourOptionsForRegion(diyLocation);
  const selectedTourItems = activeRegionTourOptions.filter(t => diySelectedTourIds.includes(t.id));

  // Golf courses filtered by selected region
  const getRegionalGolfCourses = (loc: string) => {
    const matched = pool.golfCourses.filter(g =>
      g.location === loc || loc.includes(g.location) || g.location.includes(loc)
    );
    return matched.length > 0 ? matched : pool.golfCourses;
  };

  // Single course price resolver prioritizing AdminDashboard pool.golfCourses.priceUSD
  const resolveSingleCourseUSD = (courseName: string, isWeekend: boolean) => {
    const clean = courseName.replace(/[\s\(\)CC|GC|G\.C|골프장]/g, '').toLowerCase();
    const poolMatch = pool.golfCourses.find(g => {
      const gClean = g.name.replace(/[\s\(\)CC|GC|G\.C|골프장]/g, '').toLowerCase();
      return gClean.includes(clean) || clean.includes(gClean);
    });
    const productMatch = products.find(p => {
      const pClean = p.title.replace(/[\s\(\)CC|GC|G\.C|골프장]/g, '').toLowerCase();
      return p.price < 450 && (pClean.includes(clean) || clean.includes(pClean));
    });

    const baseFromDelta = poolMatch ? Math.max(80, 155 + (poolMatch.priceDeltaUSD || 0)) : 155;
    const weekdayUSD = poolMatch?.priceUSD ?? (poolMatch as any)?.weekdayPriceUSD ?? productMatch?.price ?? baseFromDelta;
    const weekendUSD = (poolMatch as any)?.weekendPriceUSD ?? (productMatch as any)?.weekendPrice ?? Math.round(weekdayUSD * 1.35);
    return { weekdayUSD, weekendUSD, appliedUSD: isWeekend ? weekendUSD : weekdayUSD };
  };

  // DIY Region change handler
  const handleDIYLocationChange = (loc: string) => {
    setDiyLocation(loc);
    const regionalCourses = getRegionalGolfCourses(loc).map(g => g.name);
    const courses: string[] = [];
    for (let i = 0; i < diyRounds; i++) {
      courses.push(regionalCourses[i % regionalCourses.length]);
    }
    setDiyGolfCourses(courses);

    // Filter out tours belonging strictly to another region (preserve 'tour-free')
    const nextRegionTours = getDIYTourOptionsForRegion(loc);
    const validIds = new Set(nextRegionTours.map(t => t.id));
    const filteredTours = diySelectedTourIds.filter(id => validIds.has(id));
    setDiySelectedTourIds(filteredTours.length > 0 ? filteredTours : ['tour-free']);
  };

  // DIY Rounds change handler
  const handleDIYRoundsChange = (newRounds: number, overrideNights?: number) => {
    const nightsLimit = overrideNights ?? diyNights;
    const validRounds = Math.max(1, Math.min(nightsLimit + 1, newRounds));
    setDiyRounds(validRounds);

    const available = getRegionalGolfCourses(diyLocation);
    const poolNames = available.map(g => g.name);

    const updated = [...diyGolfCourses];
    while (updated.length < validRounds) {
      updated.push(poolNames[updated.length % poolNames.length]);
    }
    setDiyGolfCourses(updated.slice(0, validRounds));
  };

  // DIY Schedule selection handler (3박4일 ~ 6박7일)
  const handleSelectSchedule = (nights: number, recommendedRounds: number) => {
    setDiyNights(nights);
    handleDIYRoundsChange(recommendedRounds, nights);
    setShowScheduleModal(false);
  };

  // Toggle Tour Option in Tour Modal
  const handleToggleTourOption = (tourId: string, isFreeTravel?: boolean) => {
    if (isFreeTravel || tourId === 'tour-free') {
      setDiySelectedTourIds(['tour-free']);
      return;
    }
    setDiySelectedTourIds(prev => {
      const withoutFree = prev.filter(id => id !== 'tour-free');
      if (withoutFree.includes(tourId)) {
        const next = withoutFree.filter(id => id !== tourId);
        return next.length > 0 ? next : ['tour-free'];
      }
      return [...withoutFree, tourId];
    });
  };

  // Toggle Extra Service (Step 6: 가이드, 패스트 트랙, 마사지)
  const handleToggleExtraService = (serviceId: string) => {
    setDiySelectedExtraIds(prev =>
      prev.includes(serviceId) ? prev.filter(id => id !== serviceId) : [...prev, serviceId]
    );
  };

  // DIY Location representative image
  const getDIYLocationImage = (loc: string) => {
    if (loc === '호치민') return 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?q=80&w=1200';
    if (loc === '붕따우') return 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200';
    if (loc === '무이네') return 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?q=80&w=1200';
    if (loc === '나트랑') return 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=1200';
    if (loc === '달랏') return 'https://images.unsplash.com/photo-1511497584788-87676104235f?q=80&w=1200';
    return 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?q=80&w=1200';
  };

  // Real-time DIY Estimated Price Calculator (Per person USD synced to AdminDashboard pools)
  const calculateDIYEstimatedPrice = () => {
    const regionBase = selectedRegionItem?.baseFeeUSD || 0;

    let activityTotal = 0;
    if (diyActivityMode === 'golf') {
      const courses = diyGolfCourses.slice(0, diyRounds);
      courses.forEach((cName, idx) => {
        const [y, m, d] = departureDate.split('-').map(Number);
        const targetDate = new Date(y, m - 1, d + idx + 1);
        const isWeekend = targetDate.getDay() === 0 || targetDate.getDay() === 6;
        activityTotal += resolveSingleCourseUSD(cName, isWeekend).appliedUSD;
      });
    } else {
      activityTotal = selectedTourItems.reduce((sum, t) => sum + (t.priceUSD || 0), 0);
    }

    const nightRate = selectedHotelTier?.pricePerNightUSD ?? 90;
    const hotelTotal = diyNights * nightRate;

    const dayVehRate = selectedVehicleItem?.pricePerDayUSD ?? Math.max(15, 25 + (selectedVehicleItem?.priceDeltaUSD || 0));
    const vehicleTotal = diyDays * dayVehRate;

    const extraTotal = diyExtraServices.reduce((sum, svc) => {
      if (!diySelectedExtraIds.includes(svc.id)) return sum;
      return sum + (svc.pricingUnit === 'per_day' ? svc.priceUSD * diyDays : svc.priceUSD);
    }, 0);

    const insuranceTotal = 15;

    return Math.round(regionBase + activityTotal + hotelTotal + vehicleTotal + extraTotal + insuranceTotal);
  };

  // Build DIY package dynamically & open into customizer (View 2)
  const handleCreateDIYPackage = () => {
    const days = diyNights + 1;
    const totalEst = calculateDIYEstimatedPrice();
    const isGolf = diyActivityMode === 'golf';
    const courses = isGolf ? diyGolfCourses.slice(0, diyRounds) : [];
    const regionBase = selectedRegionItem?.baseFeeUSD || 0;

    const nightRate = selectedHotelTier?.pricePerNightUSD ?? 90;
    const hotelLabel = selectedHotelTier?.name || '고급 호텔';
    const hotelName = `${diyLocation} ${hotelLabel} (${diyNights}박/1인 객실 기준)`;

    const dayVehRate = selectedVehicleItem?.pricePerDayUSD ?? Math.max(15, 25 + (selectedVehicleItem?.priceDeltaUSD || 0));
    const vehicleTitle = selectedVehicleItem?.shortName
      ? `${selectedVehicleItem.shortName} (${selectedVehicleItem.name})`
      : (selectedVehicleItem?.name || '전용 차량');
    const vehicleName = `전 일정 단독 ${vehicleTitle} (${days}일간 / 1일 $${dayVehRate}/인)`;

    // Dynamic Itinerary Generation
    const itinerary = [];
    itinerary.push({
      day: 1,
      title: `${diyLocation} 도착 & 전용 픽업 미팅 & 숙소 체크인`,
      activities: [
        `${diyLocation} 도착 및 MANGO TOUR VIP 전담 기사 미팅`,
        `${vehicleTitle} 탑승 후 숙소로 편안한 이동`,
        `${hotelName} 체크인 및 객실 배정 후 휴식`,
        '현지 추천 맛집 석식 및 자유 휴식'
      ]
    });

    const hasMassage = diySelectedExtraIds.includes('massage');
    if (isGolf) {
      for (let d = 2; d <= days - 1; d++) {
        const rIdx = d - 2;
        const c = courses[rIdx] || courses[courses.length - 1] || '명문 CC';
        itinerary.push({
          day: d,
          title: `${c} ${d - 1}회차 라운딩 & 휴식/미식`,
          activities: [
            '숙소 조식 뷔페 후 골프장으로 전용 차량 이동',
            `${c} 18홀 라운딩 (골프 체크인/아웃 케어)`,
            '라운딩 후 클럽하우스 중식 및 휴식',
            hasMassage && rIdx < 2 ? '골프 피로 회복 VIP 전신 마사지 (90분)' : '숙소 휴식 또는 시내 쇼핑/자유 일정',
            '현지 대표 미식 석식 및 나이트라이프'
          ]
        });
      }
    } else {
      const tourList = selectedTourItems.length > 0 ? selectedTourItems : [{ id: 'tour-free', name: '자유 여행 (자유 일정)', description: '여유로운 휴양 및 자유 투어', priceUSD: 0, isFreeTravel: true }];
      for (let d = 2; d <= days - 1; d++) {
        const tItem = tourList[(d - 2) % tourList.length];
        itinerary.push({
          day: d,
          title: tItem.isFreeTravel ? `${diyLocation} 자유 여행 & 힐링 데이` : `${tItem.name}`,
          activities: [
            '숙소 조식 뷔페 후 전용 차량 미팅',
            tItem.isFreeTravel ? `${diyLocation} 내 맘대로 자유 일정 (카페, 쇼핑, 해변 휴양)` : `${tItem.name} 진행 (${tItem.description})`,
            hasMassage && d === 2 ? '여행 피로 회복 VIP 전신 마사지 (90분)' : '여유로운 휴식 및 시내 자유 탐방',
            '현지 대표 맛집 탐방 & 휴식'
          ]
        });
      }
    }

    itinerary.push({
      day: days,
      title: '호텔 체크아웃 & 기념품 쇼핑 & 공항 샌딩 (귀국)',
      activities: [
        '숙소 조식 뷔페 및 여유로운 체크아웃 준비',
        '현지 인기 기념품 마켓 및 커피/특산품 쇼핑',
        '마지막 일정 후 공항으로 전용 차량 이동',
        '공항 도착 및 출국 수속, 귀국'
      ]
    });

    const golfTotalUSD = isGolf
      ? courses.reduce((sum, cName, idx) => {
          const [y, m, d] = departureDate.split('-').map(Number);
          const targetDate = new Date(y, m - 1, d + idx + 1);
          const isWeekend = targetDate.getDay() === 0 || targetDate.getDay() === 6;
          return sum + resolveSingleCourseUSD(cName, isWeekend).appliedUSD;
        }, 0)
      : 0;

    const options: PackageOptionItem[] = [];

    if (regionBase > 0) {
      options.push({
        id: 'diy-opt-region',
        category: 'etc',
        name: `${diyLocation} 지역 기본 운영 수배비`,
        description: `${diyLocation} 현지 전담 수배 및 맞춤 일정 관리 비용`,
        priceUSD: regionBase,
        isDefaultIncluded: true,
        isRequired: true
      });
    }

    if (isGolf) {
      options.push({
        id: 'diy-opt-golf',
        category: 'golf',
        name: `${diyRounds}대 명문 코스 그린피 (${courses.map(c => c.split(' ')[0]).join(' + ')})`,
        description: `[고객 맞춤 선택 라운딩 코스]: ${courses.join(' · ')}`,
        priceUSD: golfTotalUSD,
        isDefaultIncluded: true,
        isRequired: true,
        allowCustomSelection: true,
        dayScheduleCourses: courses
      });
    } else {
      const tourTotal = selectedTourItems.reduce((sum, t) => sum + (t.priceUSD || 0), 0);
      const tourNames = selectedTourItems.map(t => t.name).join(' + ') || '자유 여행 (내 맘대로 자유 일정)';
      options.push({
        id: 'diy-opt-tour',
        category: 'activity',
        name: `선택 여행 일정: ${tourNames}`,
        description: selectedTourItems.map(t => t.description).join(' / ') || '자유 여행 맞춤 구성',
        priceUSD: tourTotal,
        isDefaultIncluded: true,
        isRequired: true,
        allowCustomSelection: false
      });
    }

    options.push({
      id: 'diy-opt-hotel',
      category: 'hotel',
      name: hotelName,
      description: selectedHotelTier?.description || '시내 중심가 위치, 1인 1실 단독 객실 & 조식 뷔페 포함',
      priceUSD: diyNights * nightRate,
      isDefaultIncluded: true,
      isRequired: false,
      allowCustomSelection: true
    });

    options.push({
      id: 'diy-opt-vehicle',
      category: 'vehicle',
      name: vehicleName,
      description: `${selectedVehicleItem?.description || '전 일정 전용 기사 및 유류비 포함'} (1일 $${dayVehRate}/인 × ${days}일 = $${days * dayVehRate})`,
      priceUSD: days * dayVehRate,
      isDefaultIncluded: true,
      isRequired: false,
      allowCustomSelection: true
    });

    diyExtraServices.forEach(svc => {
      const isChecked = diySelectedExtraIds.includes(svc.id);
      const svcPrice = svc.pricingUnit === 'per_day' ? svc.priceUSD * days : svc.priceUSD;
      const cat: PackageOptionItem['category'] =
        svc.id === 'guide' ? 'guide' : svc.id === 'fasttrack' ? 'etc' : 'activity';
      options.push({
        id: svc.id === 'guide' ? 'diy-opt-guide' : svc.id === 'fasttrack' ? 'diy-opt-fasttrack' : `diy-opt-extra-${svc.id}`,
        category: cat,
        name: svc.pricingUnit === 'per_day'
          ? `${svc.name} (${days}일간 / 1일 $${svc.priceUSD})`
          : `${svc.name} (1인 $${svc.priceUSD})`,
        description: svc.description,
        priceUSD: svcPrice,
        isDefaultIncluded: isChecked,
        isRequired: false,
        allowCustomSelection: svc.id === 'guide'
      });
    });

    options.push({
      id: 'diy-opt-insurance',
      category: 'etc',
      name: '해외 여행자 안심 보험 (최고 1억원 보장)',
      description: '상해 및 해외 의료비 보장 여행자 보험',
      priceUSD: 15,
      isDefaultIncluded: true,
      isRequired: false
    });

    const activitySubtitle = isGolf
      ? `${diyRounds}회 라운딩`
      : (selectedTourItems.map(t => t.name.split(' ')[0]).join('+') || '자유 여행');

    const diyPkg: CustomTripPackage = {
      id: `diy-pkg-${Date.now()}`,
      title: `[고객 맞춤 DIY] ${diyLocation} ${diyNights}박 ${days}일 ${isGolf ? '맞춤 골프 투어' : '맞춤 여행'}`,
      subtitle: `고객님이 직접 설계한 ${diyLocation} ${diyNights}박 ${days}일 (${activitySubtitle}) 맞춤 견적`,
      location: diyLocation,
      duration: `${diyNights}박 ${days}일`,
      golfCourses: courses,
      image: getDIYLocationImage(diyLocation),
      basePriceUSD: totalEst,
      summary: `${diyLocation} ${diyNights}박 ${days}일 ${activitySubtitle} 및 고객 맞춤 구성`,
      highlightBadges: [`${diyNights}박 ${days}일`, activitySubtitle, `${diyLocation}`, '고객 직접 설계'],
      itinerary,
      options
    };

    handleOpenPackage(diyPkg);
  };

  // Open customizer for a package
  const handleOpenPackage = (pkg: CustomTripPackage) => {
    setActivePackage(pkg);
    setCustomGolfCourses(pkg.golfCourses ? [...pkg.golfCourses] : []);
    setCustomOptionSelections({});
    setExpandedOptionId(null);
    setGolfLocationFilter(pkg.location.includes('+') ? '전체' : pkg.location);

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

  // Check if golf courses have been modified from default package courses
  const isGolfCoursesModified = activePackage && (
    customGolfCourses.length !== activePackage.golfCourses.length ||
    customGolfCourses.some((c, i) => c !== activePackage.golfCourses[i])
  );

  // Available Golf Courses for active package
  const getAvailableGolfCourses = () => {
    if (!activePackage) return pool.golfCourses;
    if (golfLocationFilter === '전체') return pool.golfCourses;
    return pool.golfCourses.filter(g => g.location === golfLocationFilter || g.location.includes(golfLocationFilter));
  };

  // Available Accommodations for active package
  const getAvailableAccommodations = () => {
    if (!activePackage) return pool.accommodations;
    const loc = activePackage.location;
    if (loc.includes('+')) {
      const parts = loc.split('+');
      return pool.accommodations.filter(a => parts.some(p => a.location.includes(p)));
    }
    return pool.accommodations.filter(a => a.location === loc || loc.includes(a.location));
  };

  // Helper to determine exact date, day of week, and weekend status for a round
  const getRoundDateInfo = (roundIndex: number) => {
    try {
      const [y, m, d] = departureDate.split('-').map(Number);
      // Day 1 is departure/arrival; Round 1 is on Day 2 (+1 day), Round 2 is Day 3 (+2 days), etc.
      const roundDate = new Date(y, m - 1, d + roundIndex + 1);
      const dayOfWeek = roundDate.getDay(); // 0 = Sun, 6 = Sat
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
      const dateStr = `${String(roundDate.getMonth() + 1).padStart(2, '0')}/${String(roundDate.getDate()).padStart(2, '0')}(${dayNames[dayOfWeek]})`;
      const fullDateStr = `${roundDate.getFullYear()}-${String(roundDate.getMonth() + 1).padStart(2, '0')}-${String(roundDate.getDate()).padStart(2, '0')}`;
      return { roundDate, dayOfWeek, isWeekend, dateStr, fullDateStr, dayName: dayNames[dayOfWeek] };
    } catch {
      return { 
        roundDate: new Date(), 
        dayOfWeek: 1, 
        isWeekend: false, 
        dateStr: `Day ${roundIndex + 2}`, 
        fullDateStr: departureDate, 
        dayName: '평일' 
      };
    }
  };

  // Helper to retrieve live weekday/weekend price and notes for any course name
  const getCourseMatchedRates = (courseName: string) => {
    const clean = courseName.replace(/[\s\(\)CC|GC|G\.C|골프장]/g, '').toLowerCase();

    // 1. Search in pool.golfCourses (directly reflects AdminDashboard edits)
    const poolMatch = pool.golfCourses.find(g => {
      const gClean = g.name.replace(/[\s\(\)CC|GC|G\.C|골프장]/g, '').toLowerCase();
      return gClean.includes(clean) || clean.includes(gClean);
    });

    // 2. Fallback match in products only when it's a single green-fee item (< $450)
    const productMatch = products.find(p => {
      const pClean = p.title.replace(/[\s\(\)CC|GC|G\.C|골프장]/g, '').toLowerCase();
      return p.price < 450 && (pClean.includes(clean) || clean.includes(pClean));
    });

    const baseFromDelta = poolMatch ? Math.max(80, 155 + (poolMatch.priceDeltaUSD || 0)) : 155;
    const weekdayUSD = poolMatch?.priceUSD ?? (poolMatch as any)?.weekdayPriceUSD ?? productMatch?.price ?? baseFromDelta;
    const weekendUSD = (poolMatch as any)?.weekendPriceUSD ?? (productMatch as any)?.weekendPrice ?? Math.round(weekdayUSD * 1.35);
    const weekdayVND = (productMatch as any)?.priceVND || weekdayUSD * 25000;
    const weekendVND = (productMatch as any)?.weekendPriceVND || weekendUSD * 25000;
    const notes = (productMatch as any)?.notes || poolMatch?.description || '카트비/캐디피 포함, 캐디 팁 별도';
    const deltaUSD = poolMatch?.priceDeltaUSD || 0;

    return {
      weekdayUSD,
      weekendUSD,
      weekdayVND,
      weekendVND,
      notes,
      deltaUSD,
      title: poolMatch?.name || productMatch?.title || courseName
    };
  };

  // Compute all rounds breakdown with dates & weekday/weekend rates
  const getDateMatchedGolfBreakdown = () => {
    const rounds = customGolfCourses.map((cName, idx) => {
      const dateInfo = getRoundDateInfo(idx);
      const rates = getCourseMatchedRates(cName);
      const appliedUSD = dateInfo.isWeekend ? rates.weekendUSD : rates.weekdayUSD;
      const appliedVND = dateInfo.isWeekend ? rates.weekendVND : rates.weekdayVND;
      return {
        roundIndex: idx,
        dayNumber: idx + 2,
        courseName: cName,
        ...dateInfo,
        ...rates,
        appliedUSD,
        appliedVND
      };
    });

    const totalGolfUSD = rounds.reduce((sum, r) => sum + r.appliedUSD, 0);
    const weekendCount = rounds.filter(r => r.isWeekend).length;
    const weekdayCount = rounds.length - weekendCount;

    return { rounds, totalGolfUSD, weekendCount, weekdayCount };
  };

  // Calculate price delta for selected golf courses
  const getGolfDeltaTotal = () => {
    const { totalGolfUSD } = getDateMatchedGolfBreakdown();
    const defaultRoundsCount = activePackage?.golfCourses?.length || customGolfCourses.length;
    // Standard baseline price in package for weekday rounds (~$110/round average)
    const baseIncludedRate = defaultRoundsCount * 110;
    return totalGolfUSD - baseIncludedRate;
  };

  // Retrieve choices for the active custom option modal
  const getModalChoicesForCustomizingOption = () => {
    if (!customizingOption) return [];

    if (customizingOption.category === 'hotel') {
      let list = pool.accommodations;
      if (optionModalFilter !== '전체') {
        list = list.filter(a => a.location === optionModalFilter || a.location.includes(optionModalFilter));
      }
      if (optionModalTypeFilter !== '전체') {
        list = list.filter(a => a.type === optionModalTypeFilter);
      }
      return list.map(item => ({
        id: item.id,
        name: item.name,
        location: item.location,
        type: item.type,
        priceDeltaUSD: item.priceDeltaUSD,
        description: item.description,
        badge: item.badge
      }));
    }

    if (customizingOption.category === 'vehicle') {
      return pool.vehicles.map(v => ({
        id: v.id,
        name: v.name,
        location: '호치민/붕따우/달랏',
        type: 'vehicle',
        priceDeltaUSD: v.priceDeltaUSD,
        description: v.description,
        badge: v.badge
      }));
    }

    if (customizingOption.category === 'guide') {
      return pool.guides.map(g => ({
        id: g.id,
        name: g.name,
        location: '전 지역',
        type: 'guide',
        priceDeltaUSD: g.priceDeltaUSD,
        description: g.description,
        badge: g.badge
      }));
    }

    if (customizingOption.category === 'meal') {
      return pool.meals.map(m => ({
        id: m.id,
        name: m.name,
        location: '전 일정',
        type: 'meal',
        priceDeltaUSD: m.priceDeltaUSD,
        description: m.description,
        badge: m.badge
      }));
    }

    // Custom package choices or fallbacks
    if (customizingOption.choices && customizingOption.choices.length > 0) {
      return customizingOption.choices.map((c: any) => ({
        id: c.id,
        name: c.name,
        location: '맞춤',
        type: c.type || 'custom',
        priceDeltaUSD: c.priceDeltaUSD || 0,
        description: c.description,
        badge: c.badge
      }));
    }

    return [
      { id: `${customizingOption.id}-std`, name: `${customizingOption.name} (기본 포함)`, location: '기본', type: 'standard', priceDeltaUSD: 0, description: customizingOption.description, badge: '기본' },
      { id: `${customizingOption.id}-vip`, name: `${customizingOption.name} VIP 프리미엄 업그레이드`, location: 'VIP', type: 'vip', priceDeltaUSD: 50, description: '더욱 쾌적하고 품격 있는 VIP 전용 구성으로 업그레이드', badge: 'VIP 추천' },
      { id: `${customizingOption.id}-lite`, name: `${customizingOption.name} 라이트 실속형`, location: '실속', type: 'lite', priceDeltaUSD: -20, description: '꼭 필요한 필수 구성만 쏙 담은 가성비 실속형 옵션', badge: '실속형' },
    ];
  };

  // Calculate dynamic price for each option item with date-matched golf fees
  const getOptionPrice = (opt: PackageOptionItem) => {
    if (customOptionSelections[opt.id]) {
      return Math.max(0, (opt.priceUSD || 0) + customOptionSelections[opt.id].priceDelta);
    }
    if (opt.category === 'golf' && (opt.name.includes('그린피') || opt.name.includes('코스'))) {
      const { totalGolfUSD } = getDateMatchedGolfBreakdown();
      return Math.max(0, totalGolfUSD);
    }
    return Math.max(0, opt.priceUSD || 0);
  };

  // Get dynamic display name for each option item
  const getOptionDisplayName = (opt: PackageOptionItem) => {
    if (customOptionSelections[opt.id]) {
      return customOptionSelections[opt.id].name;
    }
    if (opt.category === 'golf' && (opt.name.includes('그린피') || opt.name.includes('코스'))) {
      const { weekendCount, weekdayCount } = getDateMatchedGolfBreakdown();
      const shortNames = customGolfCourses.map(c => c.split(' ')[0]);
      const weekendLabel = weekendCount > 0 ? ` [주말 ${weekendCount}회·주중 ${weekdayCount}회]` : ' [전일정 주중]';
      return `${shortNames.length}대 명문 코스 그린피${weekendLabel} (${shortNames.join(' + ')})`;
    }
    return opt.name;
  };

  // Get dynamic display description for each option item
  const getOptionDisplayDescription = (opt: PackageOptionItem) => {
    if (customOptionSelections[opt.id]?.description) {
      return customOptionSelections[opt.id].description;
    }
    if (opt.category === 'golf' && (opt.name.includes('그린피') || opt.name.includes('코스'))) {
      const { rounds } = getDateMatchedGolfBreakdown();
      const breakdownStr = rounds.map(r => 
        `Day ${r.dayNumber} ${r.dateStr}: ${r.courseName.split(' ')[0]}[${r.isWeekend ? '주말' : '주중'} $${r.appliedUSD}]`
      ).join(' · ');
      return `[날짜별 자동 합산]: ${breakdownStr} (카트비/캐디피 포함, 운전기사 팁 별도)`;
    }
    return opt.description;
  };

  // Helper to get selected accommodation name
  const getChosenAccommodationName = () => {
    const hotelOpt = activePackage?.options.find(o => o.category === 'hotel');
    if (hotelOpt && customOptionSelections[hotelOpt.id]) {
      return customOptionSelections[hotelOpt.id].name;
    }
    return hotelOpt?.name || '호치민 1군 고급 호텔 (4박/1인 객실 기준)';
  };

  // Calculate prices matching QuotationModal standard (vehicle & guide scaled to group & travel schedule)
  const pkgTravelDays = activePackage?.itinerary?.length || (activePackage?.duration?.includes('4박') ? 5 : 5);
  const pkgVehicleCount = Math.max(1, Math.ceil(personCount / 7));
  const pkgGuideCount = Math.max(1, Math.ceil(personCount / 16));

  const currentTotalGroup = activePackage
    ? activePackage.options.reduce((sum, opt) => {
        if (!selectedOptionIds.has(opt.id)) return sum;
        const isDiyPkg = activePackage.id.startsWith('diy-pkg-');
        if (!isDiyPkg && opt.category === 'vehicle') {
          return sum + (100 * pkgTravelDays * pkgVehicleCount);
        }
        if (!isDiyPkg && opt.category === 'guide') {
          return sum + (120 * pkgTravelDays * pkgGuideCount);
        }
        return sum + (getOptionPrice(opt) * personCount);
      }, 0)
    : 0;

  const currentTotalPerPerson = personCount > 0 ? Math.round(currentTotalGroup / personCount) : 0;
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

    let text = `[MANGO TOUR - ${activePackage.duration || '맞춤 일정'} 맞춤 골프 여행 견적 문의]\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `📌 상품명: ${activePackage.title}\n`;
    text += `⛳ 선택 골프장 (${customGolfCourses.length}회 라운딩): ${customGolfCourses.join(' · ')}\n`;
    text += `🏨 선택 숙박형태: ${getChosenAccommodationName()}\n`;
    text += `📍 여행 지역: ${activePackage.location} (${activePackage.duration || '맞춤 일정'})\n`;
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
      text += ` • [${item.category}] ${getOptionDisplayName(item)} ($${getOptionPrice(item)})\n`;
    });
    if (excluded.length > 0) {
      text += `\n❌ [제외/미선택 항목 (${excluded.length}개)]\n`;
      excluded.forEach(item => {
        text += ` • ${getOptionDisplayName(item)}\n`;
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

  // Helper to construct A4 quotation cost items
  const getA4CostItems = (): CostItem[] => {
    if (!activePackage) return [];
    const items: CostItem[] = [];

    activePackage.options.forEach(opt => {
      if (!selectedOptionIds.has(opt.id)) return;
      const unitUSD = getOptionPrice(opt);
      const name = getOptionDisplayName(opt);
      const desc = getOptionDisplayDescription(opt);

      let catName = '기타 경비';
      let qty = `${personCount}인`;

      if (opt.category === 'flight') {
        catName = '항공권 (국제선 왕복)';
        qty = `${personCount}인 왕복`;
      } else if (opt.category === 'hotel') {
        catName = '숙박 (1인 객실 기준)';
        qty = `${personCount}실 (${activePackage.duration || '4박'})`;
      } else if (opt.category === 'golf') {
        catName = '골프 라운딩 (18홀)';
        qty = `${customGolfCourses.length}회 라운딩 × ${personCount}인`;
      } else if (opt.category === 'vehicle') {
        const vehicleCount = Math.max(1, Math.ceil(personCount / 7));
        const travelDays = activePackage.itinerary?.length || 5;
        catName = '전용 차량 & 기사';
        qty = `${vehicleCount}대 (전일정 ${travelDays}일)`;
      } else if (opt.category === 'guide') {
        const guideCount = Math.max(1, Math.ceil(personCount / 16));
        const travelDays = activePackage.itinerary?.length || 5;
        catName = '한국어 전담 가이드';
        qty = `${guideCount}명 (전 일정 ${travelDays}일)`;
      } else if (opt.name.includes('패스트 트랙') || opt.name.includes('패스트트랙') || opt.id.includes('fasttrack')) {
        catName = '공항 VIP 의전';
        qty = `${personCount}인 (1인 $60)`;
      } else if (opt.category === 'meal') {
        const mealNights = activePackage.itinerary?.length ? activePackage.itinerary.length - 1 : 4;
        catName = '식사 및 만찬';
        qty = `${personCount}인 (석식 ${mealNights}회 / 1일 $50)`;
      } else if (opt.category === 'activity') {
        catName = '스파 & 힐링 케어';
        qty = `${personCount}인`;
      } else if (opt.category === 'etc') {
        catName = '여행자 안심 보험';
        qty = `${personCount}인`;
      }

      const travelDays = activePackage.itinerary?.length || 5;
      const isDiyPkg = activePackage.id.startsWith('diy-pkg-');
      let totalItemUSD = unitUSD * personCount;
      if (!isDiyPkg && opt.category === 'vehicle') {
        const vehicleCount = Math.max(1, Math.ceil(personCount / 7));
        totalItemUSD = 100 * travelDays * vehicleCount;
      } else if (!isDiyPkg && opt.category === 'guide') {
        const guideCount = Math.max(1, Math.ceil(personCount / 16));
        totalItemUSD = 120 * travelDays * guideCount;
      }

      items.push({
        category: catName,
        detail: `${name}${desc && desc !== name ? ` (${desc})` : ''}`,
        quantity: qty,
        amountUSD: totalItemUSD,
        amountKRW: totalItemUSD * USD_TO_KRW,
      });
    });

    return items;
  };

  // Helper to construct A4 itinerary days
  const getA4ItineraryDays = (): ItineraryDay[] => {
    if (!activePackage || !activePackage.itinerary) return [];
    return activePackage.itinerary.map((item) => {
      let dayTitle = item.title;
      const roundIdx = item.day >= 2 ? item.day - 2 : 0;
      if (customGolfCourses[roundIdx] && (item.title.includes('CC') || item.title.includes('골프') || item.title.includes('라운딩'))) {
        dayTitle = `Day ${item.day}: ${customGolfCourses[roundIdx]} 18홀 명문 라운딩`;
      }

      const activities = item.activities.map((act, actIdx) => {
        let actText = act;
        if (customGolfCourses[roundIdx] && act.includes('CC') && (act.includes('라운딩') || act.includes('이동'))) {
          actText = act.replace(/[가-힣a-zA-Z0-9\s]+CC/g, customGolfCourses[roundIdx].split(' ')[0] + ' CC');
        }

        const times = ['08:00', '10:30', '13:00', '17:30', '19:30', '21:00'];
        const time = times[actIdx % times.length];
        return {
          time,
          desc: actText
        };
      });

      return {
        day: item.day,
        title: dayTitle,
        activities
      };
    });
  };

  // Image Capture via html2canvas (Captures the pristine A4 PDF Quotation Sheet)
  const captureQuotationImage = async (): Promise<string | null> => {
    const targetElement = a4QuotationPrintRef.current || quotationCardRef.current;
    if (!targetElement) return null;
    setIsCapturing(true);
    try {
      await new Promise(r => setTimeout(r, 120));
      const canvas = await html2canvas(targetElement, {
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

  // Direct PNG Download of A4 Quotation Sheet
  const handleDownloadImage = (imgUrl?: string | null) => {
    const targetUrl = imgUrl || capturedImageUrl;
    if (!targetUrl) return;
    const a = document.createElement('a');
    a.href = targetUrl;
    const sanitizedTitle = (activePackage?.title || '맞춤골프견적').replace(/[^a-zA-Z0-9가-힣]/g, '_');
    a.download = `망고투어_정식A4견적서_${sanitizedTitle}_${customerName || '고객'}_${new Date().toISOString().split('T')[0]}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('📥 A4 정식 견적서 이미지가 기기에 다운로드되었습니다.');
  };

  // Direct PDF Download of A4 Quotation Sheet using jsPDF
  const handleDownloadPDF = async (imgUrl?: string | null) => {
    let dataUrl = imgUrl || capturedImageUrl;
    if (!dataUrl) {
      dataUrl = await captureQuotationImage();
    }
    if (!dataUrl) {
      showToast('⚠️ PDF 생성에 실패했습니다.');
      return;
    }

    try {
      showToast('📄 A4 규격 PDF 문서를 생성 중입니다...');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm

      const img = new Image();
      img.src = dataUrl;
      await new Promise((resolve) => {
        img.onload = resolve;
      });

      const imgHeight = (img.height * imgWidth) / img.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(dataUrl, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(dataUrl, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
        heightLeft -= pageHeight;
      }

      const sanitizedTitle = (activePackage?.title || '맞춤골프견적').replace(/[^a-zA-Z0-9가-힣]/g, '_');
      const fileName = `망고투어_정식A4견적서_${sanitizedTitle}_${customerName || '고객'}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
      showToast('📥 A4 PDF 견적서 다운로드가 완료되었습니다.');
    } catch (err) {
      console.error('PDF export error:', err);
      showToast('⚠️ PDF 생성에 실패했습니다. 이미지 저장을 이용해주세요.');
    }
  };

  // KakaoTalk Consultation handler with image capture & text copy
  const handleKakaoInquiry = async () => {
    // 1. 카카오톡 견적 문의 모달을 즉시 열어 상품 목록을 딜레이 없이 표시
    setShowKakaoModal(true);

    const text = generateQuotationText();
    try {
      await navigator.clipboard.writeText(text);
      showToast('📋 견적서 내용이 클립보드에 복사되었습니다.');
    } catch (e) {
      console.warn('Text clipboard write error:', e);
    }
    
    // 2. 백그라운드에서 A4 PDF 양식 고해상도 이미지 캡처 및 자동 다운로드 진행
    captureQuotationImage().then((imgUrl) => {
      if (imgUrl) {
        handleDownloadImage(imgUrl);
      }
    });
  };

  // Open Direct Image Preview & Download Modal (A4 PDF Form - Same structure as 1:1 Online Inquiry)
  const handleSaveQuoteImage = async () => {
    setShowImagePreviewModal(true);
    showToast('📸 A4 정식 견적서(PDF 양식)를 캡처 중입니다...');
    const imgUrl = await captureQuotationImage();
    if (imgUrl) {
      handleDownloadImage(imgUrl);
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
      맞춤선택_골프장: customGolfCourses.join(' · '),
      맞춤선택_숙박: getChosenAccommodationName(),
      출발희망일: departureDate || '미정',
      여행인원: `${personCount}명`,
      '1인_예상금액': `$${currentTotalPerPerson.toLocaleString()} (약 ${(currentTotalPerPerson * USD_TO_KRW).toLocaleString()}원)`,
      '총_예상견적': `$${currentTotalGroup.toLocaleString()} (약 ${(currentTotalGroup * USD_TO_KRW).toLocaleString()}원)`,
      선택포함항목: included.map(i => `${getOptionDisplayName(i)} ($${getOptionPrice(i)})`).join(' / '),
      제외항목: excluded.map(i => getOptionDisplayName(i)).join(' / ') || '없음',
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

    // 2. Backup save to Supabase Database
    try {
      await supabaseService.saveInquiry(inquiryPayload);
    } catch (dbErr) {
      console.warn('Supabase backup save error:', dbErr);
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

  const getCategoryBadge = (category: PackageOptionItem['category'], name?: string) => {
    if (name?.includes('패스트 트랙') || name?.includes('Fast Track')) {
      return { label: '🛫 패스트트랙 ($60)', bg: 'bg-amber-100 text-amber-900 border-amber-300' };
    }
    switch (category) {
      case 'golf': return { label: '⛳ 골프', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      case 'hotel': return { label: '🏨 숙박 (1인실)', bg: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 'vehicle': return { label: '🚐 차량', bg: 'bg-amber-100 text-amber-800 border-amber-200' };
      case 'meal': return { label: '🦞 식사', bg: 'bg-red-100 text-red-800 border-red-200' };
      case 'activity': return { label: '💆 스파/투어', bg: 'bg-purple-100 text-purple-800 border-purple-200' };
      case 'guide': return { label: '👨‍💼 가이드 (1일 $120)', bg: 'bg-indigo-100 text-indigo-800 border-indigo-200' };
      default: return { label: '✨ 옵션/기타', bg: 'bg-gray-100 text-gray-800 border-gray-200' };
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-28 select-text font-sans antialiased text-gray-900 tracking-tight break-keep w-full max-w-full">
      {/* Toast Notification */}
      {copyToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-gray-900/95 text-white px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl shadow-2xl text-xs sm:text-sm font-semibold flex items-center gap-2 animate-fade-in backdrop-blur-md border border-gold-500/30">
          <span>✨</span>
          <span>{copyToast}</span>
        </div>
      )}

      {/* Hero Header */}
      <div className="bg-gradient-to-br from-deepgreen via-[#00382e] to-emerald-950 text-white relative overflow-hidden w-full max-w-full">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(circle_at_30%_30%,#c5a028_0%,transparent_70%)] pointer-events-none"></div>
        <div className="max-w-6xl mx-auto px-3.5 sm:px-6 py-6 sm:py-10 relative z-10 w-full max-w-full">
          <div className="mb-3 sm:mb-4">
            <BackButton 
              onClick={handleTopBack}
              variant="hero"
              label={activePackage ? '목록으로 돌아가기' : '뒤로가기'}
            />
          </div>
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 sm:gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gold-500/20 border border-gold-400/30 text-gold-300 text-[11px] sm:text-xs md:text-sm font-semibold mb-1.5">
                <span>🏆</span> 베트남 골프 · 여행 맞춤 플래너
              </div>
              <h1 className="text-xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
                {activePackage ? activePackage.title : '골프 / 투어 내 맘대로 여행 만들기'}
              </h1>
              <p className="text-gray-300 text-xs sm:text-sm md:text-base mt-1.5 max-w-2xl leading-relaxed font-normal">
                {activePackage 
                  ? activePackage.subtitle 
                  : '원하시는 지역 선택, 여행기간, 숙박, 차량 등 선택하고 맞춤 견적서가 실시간으로 자동 완성됩니다'}
              </p>
            </div>

            {!activePackage && (
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-2 rounded-xl border border-white/15 text-xs md:text-sm font-medium text-gray-200 self-start md:self-auto">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>1:1 DIY 맞춤 자유 설계 지원</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Container - Edge-to-edge on mobile, containerized on desktop */}
      <div className="max-w-6xl mx-auto px-0 sm:px-4 py-2 sm:py-6 w-full max-w-full">
        
        {/* ================= VIEW 1: 6-STEP DIY CUSTOM TRIP BUILDER ================= */}
        {!activePackage && (
          <div className="px-0 sm:px-0">
            <div className="space-y-4 sm:space-y-6">
              {/* Main DIY Banner */}
              <div className="bg-gradient-to-br from-emerald-900 via-deepgreen to-teal-950 text-white rounded-none sm:rounded-3xl p-4 sm:p-7 md:p-8 border-y sm:border border-emerald-600/30 shadow-md relative overflow-hidden">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gold-500/20 text-gold-300 border border-gold-400/30 text-[10px] sm:text-xs md:text-sm font-bold mb-1.5">
                      <span>✨</span> MANGO TOUR 실시간 맞춤 견적
                    </div>
                    <h2 className="text-lg sm:text-2xl md:text-3xl font-black text-white tracking-tight">
                      골프 / 투어 내 맘대로 여행 만들기
                    </h2>
                    <p className="text-xs sm:text-sm md:text-base text-gray-200 mt-1 leading-relaxed max-w-2xl font-normal">
                      원하시는 지역 선택, 여행기간, 숙박, 차량 등 선택하고 맞춤 견적서가 실시간으로 자동 완성됩니다
                    </p>
                  </div>
                </div>
              </div>

              {/* 1. 여행 지역 선택 (5 Regions - Concise Buttons) */}
              <div className="bg-white rounded-none sm:rounded-3xl p-4 sm:p-6 md:p-7 border-y sm:border border-gray-200/90 shadow-xs space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-gray-100 gap-2">
                  <h3 className="font-black text-sm sm:text-base md:text-lg text-gray-900 flex items-center gap-2 whitespace-nowrap">
                    <span className="w-6 h-6 rounded-full bg-deepgreen text-white text-xs md:text-sm flex items-center justify-center font-bold shrink-0">1</span>
                    <span>여행 지역 선택</span>
                  </h3>
                  <span className="text-xs md:text-sm font-extrabold text-deepgreen bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200 whitespace-nowrap shrink-0">
                    선택: {diyLocation}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-2.5">
                  {diyRegions.map((reg) => {
                    const isSelected = diyLocation === reg.name;
                    return (
                      <button
                        key={reg.id}
                        type="button"
                        onClick={() => handleDIYLocationChange(reg.name)}
                        className={`p-3 md:p-4 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-400 shadow-md scale-[1.02]'
                            : 'bg-gray-50/70 hover:bg-gray-100 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="text-lg md:text-xl">{reg.icon}</span>
                          <span className="font-black text-sm md:text-base text-gray-900">{reg.name}</span>
                        </div>
                        <span className="text-[10px] md:text-xs text-gray-500 line-clamp-1">{reg.subtitle}</span>
                        <span className={`text-[10px] font-bold mt-0.5 ${isSelected ? 'text-emerald-700' : 'text-gray-400'}`}>
                          {isSelected ? '✓ 선택됨' : '선택'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. 여행 일정 (Single Select Box -> Opens 3박4일 ~ 6박7일 Modal) */}
              <div className="bg-white rounded-none sm:rounded-3xl p-4 sm:p-6 md:p-7 border-y sm:border border-gray-200/90 shadow-xs space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                  <h3 className="font-black text-sm sm:text-base md:text-lg text-gray-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-deepgreen text-white text-xs md:text-sm flex items-center justify-center font-bold">2</span>
                    <span>여행 일정</span>
                  </h3>
                  <span className="text-[11px] sm:text-xs text-gray-400 font-medium">3박 4일 ~ 6박 7일 선택</span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowScheduleModal(true)}
                  className="w-full sm:max-w-md p-3.5 md:p-4 rounded-2xl border-2 border-emerald-500/80 bg-emerald-50/40 hover:bg-emerald-50 transition flex items-center justify-between gap-3 cursor-pointer shadow-xs"
                >
                  <div className="flex items-center gap-3 text-left">
                    <span className="w-10 h-10 rounded-xl bg-deepgreen text-white flex items-center justify-center text-lg shadow-xs shrink-0">
                      📅
                    </span>
                    <div>
                      <span className="text-[10px] md:text-xs font-bold text-emerald-700 block">선택된 여행 기간</span>
                      <span className="text-base md:text-lg font-black text-gray-900">
                        {diyNights}박 {diyDays}일
                      </span>
                    </div>
                  </div>
                  <span className="px-3 py-1.5 rounded-xl bg-white border border-emerald-300 text-xs md:text-sm font-extrabold text-deepgreen shadow-2xs flex items-center gap-1 shrink-0 whitespace-nowrap">
                    <span>기간 선택</span>
                    <span>▾</span>
                  </span>
                </button>
              </div>

              {/* 3. 골프, 여행 선택 (Conditional Popup Buttons) */}
              <div className="bg-white rounded-none sm:rounded-3xl p-4 sm:p-6 md:p-7 border-y sm:border border-gray-200/90 shadow-xs space-y-3.5">
                <div className="flex justify-between items-center pb-2 border-b border-gray-100 gap-2">
                  <div className="min-w-0">
                    <h3 className="font-black text-sm sm:text-base md:text-lg text-gray-900 flex items-center gap-2 whitespace-nowrap">
                      <span className="w-6 h-6 rounded-full bg-deepgreen text-white text-xs md:text-sm flex items-center justify-center font-bold shrink-0">3</span>
                      <span>골프, 여행 선택</span>
                    </h3>
                    <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">
                      버튼을 클릭하면 {diyLocation} ({diyNights}박 {diyDays}일) 기준 맞춤 팝업이 열립니다.
                    </p>
                  </div>
                  <span className="text-xs md:text-sm font-extrabold text-deepgreen bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200 whitespace-nowrap shrink-0">
                    {diyActivityMode === 'golf' ? '⛳ 골프 선택됨' : '🧳 여행 선택됨'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* 골프 버튼 */}
                  <button
                    type="button"
                    onClick={() => {
                      setDiyActivityMode('golf');
                      setShowAllCoursesInGolfModal(false);
                      setShowActivityModal('golf');
                    }}
                    className={`p-4 md:p-5 rounded-2xl border-2 text-left transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 cursor-pointer ${
                      diyActivityMode === 'golf'
                        ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-400 shadow-md'
                        : 'bg-gray-50/70 hover:bg-gray-100 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 md:gap-3">
                      <span className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-deepgreen text-white text-xl md:text-2xl flex items-center justify-center shadow-sm shrink-0">
                        ⛳
                      </span>
                      <div>
                        <div className="font-black text-base md:text-lg text-gray-900">골프</div>
                        <div className="text-[11px] md:text-xs text-gray-500">
                          {diyLocation} 골프장 선택 ({diyRounds}회)
                        </div>
                      </div>
                    </div>
                    <span className={`self-end sm:self-center px-2.5 py-1 rounded-xl text-[11px] md:text-xs font-extrabold border whitespace-nowrap shrink-0 ${
                      diyActivityMode === 'golf'
                        ? 'bg-white text-deepgreen border-emerald-300'
                        : 'bg-white text-gray-500 border-gray-200'
                    }`}>
                      골프장 선택 ▾
                    </span>
                  </button>

                  {/* 여행 버튼 */}
                  <button
                    type="button"
                    onClick={() => {
                      setDiyActivityMode('tour');
                      setShowActivityModal('tour');
                    }}
                    className={`p-3.5 sm:p-4 md:p-5 rounded-2xl border-2 text-left transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 cursor-pointer ${
                      diyActivityMode === 'tour'
                        ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-400 shadow-md'
                        : 'bg-gray-50/70 hover:bg-gray-100 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 md:gap-3">
                      <span className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-amber-500 text-white text-xl md:text-2xl flex items-center justify-center shadow-sm shrink-0">
                        🧳
                      </span>
                      <div>
                        <div className="font-black text-base md:text-lg text-gray-900">여행</div>
                        <div className="text-[11px] md:text-xs text-gray-500">
                          자유 여행 또는 {diyLocation} 관광 상품
                        </div>
                      </div>
                    </div>
                    <span className={`self-end sm:self-center px-2.5 py-1 rounded-xl text-[11px] md:text-xs font-extrabold border whitespace-nowrap shrink-0 ${
                      diyActivityMode === 'tour'
                        ? 'bg-white text-deepgreen border-emerald-300'
                        : 'bg-white text-gray-500 border-gray-200'
                    }`}>
                      상품 선택 ▾
                    </span>
                  </button>
                </div>

                {/* Current Active Golf / Tour Summary Strip */}
                <div className="p-3 md:p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  {diyActivityMode === 'golf' ? (
                    <>
                      <div className="flex flex-wrap items-center gap-1.5 text-xs md:text-sm">
                        <span className="font-extrabold text-deepgreen mr-1 whitespace-nowrap">⛳ 배정 골프장 ({diyRounds}회):</span>
                        {diyGolfCourses.slice(0, diyRounds).map((c, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-white rounded-lg border border-emerald-200 text-[11px] md:text-xs font-bold text-gray-800 whitespace-nowrap">
                            {idx + 1}R {c.split(' ')[0]}
                          </span>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowActivityModal('golf')}
                        className="self-start sm:self-auto px-3 py-1 bg-white hover:bg-emerald-100 text-deepgreen border border-emerald-300 rounded-xl text-xs font-extrabold cursor-pointer shrink-0 whitespace-nowrap"
                      >
                        코스/회차 변경 ✏️
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="flex flex-wrap items-center gap-1.5 text-xs md:text-sm">
                        <span className="font-extrabold text-deepgreen mr-1 whitespace-nowrap">🧳 선택 여행 구성:</span>
                        {selectedTourItems.map((t) => (
                          <span key={t.id} className="px-2 py-0.5 bg-white rounded-lg border border-emerald-200 text-[11px] md:text-xs font-bold text-gray-800 whitespace-nowrap">
                            {t.name} {t.priceUSD > 0 ? `($${t.priceUSD})` : '(자유일정)'}
                          </span>
                        ))}
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowActivityModal('tour')}
                        className="self-start sm:self-auto px-3 py-1 bg-white hover:bg-emerald-100 text-deepgreen border border-emerald-300 rounded-xl text-xs font-extrabold cursor-pointer shrink-0 whitespace-nowrap"
                      >
                        여행 상품 변경 ✏️
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* 4. 숙박 (4 Uniform Cards synced from pool.accommodationTiers) */}
              <div className="bg-white rounded-none sm:rounded-3xl p-4 sm:p-6 md:p-7 border-y sm:border border-gray-200/90 shadow-xs space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                  <h3 className="font-black text-sm sm:text-base md:text-lg text-gray-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-deepgreen text-white text-xs md:text-sm flex items-center justify-center font-bold">4</span>
                    <span>숙박</span>
                  </h3>
                  <span className="text-xs md:text-sm font-bold text-deepgreen">
                    {diyNights}박 기준 · 1인 1실
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
                  {diyAccommodations.map((item) => {
                    const isSelected = selectedHotelTier?.id === item.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => setDiyHotelType(item.id)}
                        className={`p-3 md:p-4 rounded-2xl border text-left cursor-pointer transition flex flex-col justify-between ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-400 shadow-sm'
                            : 'bg-gray-50 hover:bg-gray-100 border-gray-200'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-lg md:text-xl">{item.icon}</span>
                            <span className="text-[10px] md:text-xs font-extrabold text-emerald-700 bg-white px-1.5 py-0.5 rounded-md border border-emerald-200">
                              1박 ${item.pricePerNightUSD}
                            </span>
                          </div>
                          <div className="font-extrabold text-xs md:text-sm text-gray-900">{item.name}</div>
                          <div className="text-[10px] md:text-xs text-gray-500 mt-0.5 line-clamp-2">{item.description}</div>
                        </div>
                        <div className="mt-2 text-right">
                          <span className={`text-[10px] font-bold ${isSelected ? 'text-emerald-700' : 'text-gray-400'}`}>
                            {isSelected ? '✓ 선택됨' : '선택'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 5. 차량 (4 Uniform Cards matching Step 4 style: 7인승, 9인승, 16인승, 26인승) */}
              <div className="bg-white rounded-none sm:rounded-3xl p-4 sm:p-6 md:p-7 border-y sm:border border-gray-200/90 shadow-xs space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                  <h3 className="font-black text-sm sm:text-base md:text-lg text-gray-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-deepgreen text-white text-xs md:text-sm flex items-center justify-center font-bold">5</span>
                    <span>차량</span>
                  </h3>
                  <span className="text-xs md:text-sm font-bold text-deepgreen">
                    전 일정 ({diyDays}일) 단독 전용
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5">
                  {diyVehicles.map((item) => {
                    const isSelected = selectedVehicleItem?.id === item.id;
                    const dayRate = item.pricePerDayUSD ?? Math.max(15, 25 + (item.priceDeltaUSD || 0));
                    return (
                      <div
                        key={item.id}
                        onClick={() => setDiyVehicleType(item.id)}
                        className={`p-3 md:p-4 rounded-2xl border text-left cursor-pointer transition flex flex-col justify-between ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-400 shadow-sm'
                            : 'bg-gray-50 hover:bg-gray-100 border-gray-200'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <span className="text-lg md:text-xl">{item.icon || '🚐'}</span>
                            <span className="text-[10px] md:text-xs font-extrabold text-emerald-700 bg-white px-1.5 py-0.5 rounded-md border border-emerald-200">
                              1일 ${dayRate}/인
                            </span>
                          </div>
                          <div className="font-extrabold text-xs md:text-sm text-gray-900">
                            {item.shortName || item.name}
                          </div>
                          <div className="text-[10px] md:text-xs text-gray-500 mt-0.5 line-clamp-2">{item.description}</div>
                        </div>
                        <div className="mt-2 text-right">
                          <span className={`text-[10px] font-bold ${isSelected ? 'text-emerald-700' : 'text-gray-400'}`}>
                            {isSelected ? '✓ 선택됨' : '선택'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 6. 기타 (Multi-select Toggle Cards: 가이드, 패스트 트랙, 마사지) */}
              <div className="bg-white rounded-none sm:rounded-3xl p-4 sm:p-6 md:p-7 border-y sm:border border-gray-200/90 shadow-xs space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                  <h3 className="font-black text-sm sm:text-base md:text-lg text-gray-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-deepgreen text-white text-xs md:text-sm flex items-center justify-center font-bold">6</span>
                    <span>기타</span>
                  </h3>
                  <span className="text-[11px] sm:text-xs text-gray-500 font-medium">복수 선택 가능 (가이드 · 패스트 트랙 · 마사지)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {diyExtraServices.map((svc) => {
                    const isChecked = diySelectedExtraIds.includes(svc.id);
                    const unitText = svc.pricingUnit === 'per_day' ? `1일 $${svc.priceUSD}` : `1인 $${svc.priceUSD}`;
                    const appliedCost = svc.pricingUnit === 'per_day' ? svc.priceUSD * diyDays : svc.priceUSD;
                    return (
                      <div
                        key={svc.id}
                        onClick={() => handleToggleExtraService(svc.id)}
                        className={`p-3.5 md:p-4 rounded-2xl border cursor-pointer transition flex items-center justify-between gap-2 ${
                          isChecked
                            ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-400/70 shadow-xs'
                            : 'bg-gray-50 border-gray-200 opacity-75 hover:opacity-100'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="w-4 h-4 md:w-5 md:h-5 rounded text-deepgreen accent-deepgreen cursor-pointer shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="font-extrabold text-xs md:text-sm text-gray-900 flex items-center gap-1.5 flex-wrap">
                              <span>{svc.icon} {svc.name}</span>
                              <span className="text-[10px] md:text-xs text-emerald-800 bg-white px-1.5 py-0.5 rounded border border-emerald-200 font-bold">
                                {unitText}
                              </span>
                            </div>
                            <div className="text-[10px] md:text-xs text-gray-500 mt-0.5 line-clamp-1">{svc.description}</div>
                          </div>
                        </div>
                        <span className={`text-xs md:text-sm font-extrabold shrink-0 whitespace-nowrap ${isChecked ? 'text-deepgreen' : 'text-gray-400'}`}>
                          {isChecked ? `포함 ($${appliedCost})` : '미포함'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Bottom Real-Time Price Preview & Package Generation Action Box */}
              <div className="bg-gradient-to-br from-gray-900 via-deepgreen to-emerald-950 text-white rounded-none sm:rounded-3xl p-4 sm:p-7 md:p-8 border-y sm:border border-gold-500/40 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-white/15">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="px-2 py-0.5 rounded-full bg-gold-500 text-white text-[10px] md:text-xs font-black">
                        {diyLocation}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-white/20 text-emerald-300 text-[10px] md:text-xs font-bold">
                        {diyNights}박 {diyDays}일 · {diyActivityMode === 'golf' ? `${diyRounds}회 (${diyRounds * 18}홀)` : '여행 맞춤'}
                      </span>
                    </div>
                    <h3 className="text-base sm:text-xl md:text-2xl font-black text-white">
                      [고객 맞춤 DIY] {diyLocation} {diyNights}박 {diyDays}일 {diyActivityMode === 'golf' ? '명문 골프 투어' : '맞춤 여행'}
                    </h3>
                    <p className="text-xs md:text-sm text-gray-300 mt-0.5">
                      {diyActivityMode === 'golf'
                        ? `${diyGolfCourses.slice(0, diyRounds).join(' · ')} 라운딩 & 맞춤 구성`
                        : `${selectedTourItems.map(t => t.name).join(' · ') || '자유 여행'} & ${selectedHotelTier?.name || '숙박'} · ${selectedVehicleItem?.shortName || selectedVehicleItem?.name || '전용 차량'}`}
                    </p>
                  </div>

                  <div className="text-left sm:text-right shrink-0">
                    <span className="text-[10px] md:text-xs text-gold-300 block font-bold">1인 기준 실시간 예상 견적</span>
                    <span className="text-xl sm:text-3xl md:text-4xl font-black text-gold-400">
                      ${calculateDIYEstimatedPrice().toLocaleString()}
                    </span>
                    <span className="text-xs md:text-sm text-gray-300 block">
                      (약 {(calculateDIYEstimatedPrice() * USD_TO_KRW).toLocaleString()}원 / 1인)
                    </span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-1">
                  <div className="text-xs md:text-sm text-gray-300 leading-snug w-full sm:w-auto">
                    💡 아래 버튼을 누르시면 <strong>상세 견적서 화면</strong>으로 이동하여 항목별 세부 조율, 일정표 확인, 카카오톡 상담 및 고해상도 견적서 이미지 캡처가 가능합니다.
                  </div>

                  <button
                    type="button"
                    onClick={handleCreateDIYPackage}
                    className="w-full sm:w-auto px-6 py-4 md:px-8 md:py-4.5 bg-gradient-to-r from-gold-500 to-amber-600 hover:from-gold-600 hover:to-amber-700 text-white rounded-2xl font-black text-sm sm:text-base md:text-lg shadow-xl transition transform active:scale-95 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                  >
                    <span>✨ 나만의 맞춤 견적서 생성 & 세부 조율하기</span>
                    <span>→</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}


        {/* ================= VIEW 2: ACTIVE PACKAGE CUSTOMIZER ================= */}
        {activePackage && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-6 w-full max-w-full min-w-0">
            
            {/* Left Column (7 cols): Options & Itinerary (Capturable Quotation Card) */}
            <div className="lg:col-span-7 space-y-3 sm:space-y-6 w-full max-w-full min-w-0">
              
              {/* Capturable Card Wrapper - Edge-to-edge on mobile with zero side margins */}
              <div 
                ref={quotationCardRef} 
                className="bg-white rounded-none sm:rounded-3xl px-0 py-3.5 sm:p-7 border-y sm:border border-gray-200/90 shadow-sm sm:shadow-md space-y-3.5 sm:space-y-5 relative w-full max-w-full"
              >
                {/* Brand Watermark on Image */}
                <div className="flex items-center justify-between pb-2.5 sm:pb-3 border-b border-gray-100 px-3.5 sm:px-0">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="text-lg sm:text-xl md:text-2xl">🥭</span>
                    <span className="font-extrabold text-xs sm:text-sm md:text-base tracking-wider text-deepgreen">MANGO TOUR 맞춤 골프 견적서</span>
                  </div>
                  <div className="text-[10px] sm:text-[11px] md:text-xs font-semibold text-gray-400">
                    발급일시: {new Date().toLocaleDateString('ko-KR')}
                  </div>
                </div>

                {/* Package Summary Card */}
                <div className="px-3.5 sm:px-0">
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center justify-between pb-2.5 sm:pb-3">
                    <div>
                      <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded-full bg-deepgreen text-white text-[10px] sm:text-[11px] md:text-xs font-semibold whitespace-nowrap">
                          📍 {activePackage.location}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-gold-500 text-white text-[10px] sm:text-[11px] md:text-xs font-semibold shadow-sm whitespace-nowrap">
                          ⏱️ {activePackage.duration}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 text-[10px] sm:text-[11px] md:text-xs font-bold border border-blue-200 whitespace-nowrap">
                          🏨 1인 객실 기준 (1인 1실)
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 text-[10px] sm:text-[11px] md:text-xs font-bold border border-amber-300 whitespace-nowrap">
                          🛫 VIP 패스트트랙 ($60) 선택
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-900 text-[10px] sm:text-[11px] md:text-xs font-bold border border-indigo-200 whitespace-nowrap">
                          👨‍💼 가이드 (1일 $120)
                        </span>
                      </div>
                      <h2 className="text-lg sm:text-2xl md:text-3xl font-extrabold text-gray-900 leading-snug tracking-tight">{activePackage.title}</h2>
                      <p className="text-xs sm:text-sm md:text-base text-gray-500 mt-1 leading-relaxed font-normal">{activePackage.summary || activePackage.subtitle}</p>
                    </div>
                  </div>

                  {/* Golf Course or Tour Summary Chips */}
                  {customGolfCourses.length > 0 ? (
                    <div className="mt-2.5 pt-2.5 border-t border-gray-100">
                      <div className="text-xs md:text-sm font-bold text-gray-700 mb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="whitespace-nowrap">⛳ 라운딩 코스 안내</span>
                          <span className="text-[10px] md:text-xs font-normal text-gray-400 whitespace-nowrap">({customGolfCourses.length}개소)</span>
                          {isGolfCoursesModified && (
                            <span className="px-2 py-0.5 bg-gold-100 text-gold-800 rounded-full text-[10px] md:text-xs font-semibold border border-gold-300 whitespace-nowrap">
                              ✨ 맞춤 코스 설정됨
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowGolfModal(true)}
                          className="self-start sm:self-auto px-2.5 sm:px-3 md:px-3.5 py-1.5 bg-gradient-to-r from-deepgreen to-emerald-700 hover:from-emerald-700 hover:to-deepgreen text-white text-[11px] sm:text-xs md:text-sm font-bold rounded-xl shadow transition flex items-center gap-1.5 active:scale-95 cursor-pointer whitespace-nowrap"
                        >
                          <span>⚙️</span>
                          <span>일정별 골프장 직접 변경/선택</span>
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {customGolfCourses.map((c, i) => (
                          <span 
                            key={i} 
                            onClick={() => setShowGolfModal(true)}
                            className="px-2.5 py-1 sm:py-1.5 md:px-3 md:py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-[11px] sm:text-xs md:text-sm font-semibold border border-emerald-200 flex items-center gap-1.5 cursor-pointer transition shadow-xs"
                            title="클릭하여 골프장 변경"
                          >
                            <span className="w-3.5 h-3.5 md:w-4 md:h-4 rounded-full bg-emerald-600 text-white text-[9px] md:text-[10px] flex items-center justify-center font-bold">
                              {i + 1}
                            </span>
                            <span>{c}</span>
                            <span className="text-emerald-500 text-[10px] md:text-xs">✏️</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2.5 pt-2.5 border-t border-gray-100">
                      <div className="text-xs md:text-sm font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                        <span>🧳 선택 여행 구성</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="px-3 py-1.5 bg-emerald-50 text-emerald-800 rounded-xl text-xs md:text-sm font-semibold border border-emerald-200">
                          {activePackage.subtitle}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Tabs: Options Customizer vs Itinerary */}
                <div className="px-3.5 sm:px-0">
                  <div className="bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setViewTab('options')}
                      className={`py-3 px-2 sm:px-4 rounded-xl text-xs sm:text-sm md:text-base transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer ${
                        viewTab === 'options'
                          ? 'bg-deepgreen text-white shadow-md border border-deepgreen font-black scale-[1.01]'
                          : 'bg-white text-gray-700 hover:text-deepgreen hover:bg-emerald-50/60 border border-gray-200/90 shadow-xs font-bold hover:border-emerald-300'
                      }`}
                    >
                      <span className="text-sm sm:text-base">✓</span>
                      <span className="truncate">맞춤 항목 선택</span>
                      <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs shrink-0 ${
                        viewTab === 'options'
                          ? 'bg-white/20 text-white font-black'
                          : 'bg-emerald-100 text-deepgreen border border-emerald-200 font-bold'
                      }`}>
                        {selectedOptionIds.size}/{activePackage.options.length}개
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewTab('itinerary')}
                      className={`py-3 px-2 sm:px-4 rounded-xl text-xs sm:text-sm md:text-base transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer ${
                        viewTab === 'itinerary'
                          ? 'bg-deepgreen text-white shadow-md border border-deepgreen font-black scale-[1.01]'
                          : 'bg-white text-gray-700 hover:text-deepgreen hover:bg-emerald-50/60 border border-gray-200/90 shadow-xs font-bold hover:border-emerald-300'
                      }`}
                    >
                      <span className="text-sm sm:text-base">📅</span>
                      <span className="truncate">{activePackage.duration || '4박 5일'} 정규 일정표</span>
                      <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs shrink-0 ${
                        viewTab === 'itinerary'
                          ? 'bg-white/20 text-white font-black'
                          : 'bg-emerald-100 text-deepgreen border border-emerald-200 font-bold'
                      }`}>
                        상세일정
                      </span>
                    </button>
                  </div>
                </div>

                {/* TAB 1: Checkable Options List */}
                {viewTab === 'options' && (
                  <div className="space-y-2.5 sm:space-y-4 pt-1">
                    <div className="flex justify-between items-center pb-2 border-b border-gray-100 px-3.5 sm:px-0">
                      <div>
                        <h3 className="font-bold text-xs sm:text-base md:text-lg text-gray-900 tracking-tight">맞춤 항목 체크리스트 & 직접 변경</h3>
                        <p className="text-[10px] sm:text-xs md:text-sm text-gray-500 font-normal mt-0.5 leading-relaxed">필요 없는 항목은 체크를 해제하고, 세부 내용(골프장·호텔·풀빌라·차량 등)을 직접 변경해보세요.</p>
                      </div>
                      <div className="text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => {
                            const allIds = new Set(activePackage.options.map(o => o.id));
                            setSelectedOptionIds(allIds);
                          }}
                          className="text-[11px] md:text-xs text-deepgreen font-bold hover:underline mr-2 cursor-pointer"
                        >
                          전체 선택
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const reqIds = new Set(activePackage.options.filter(o => o.isRequired).map(o => o.id));
                            setSelectedOptionIds(reqIds);
                          }}
                          className="text-[11px] md:text-xs text-gray-400 font-bold hover:underline cursor-pointer"
                        >
                          필수만 선택
                        </button>
                      </div>
                    </div>

                    {/* Options List */}
                    <div className="space-y-2 sm:space-y-3">
                      {activePackage.options.map(option => {
                        const isSelected = selectedOptionIds.has(option.id);
                        const displayName = getOptionDisplayName(option);
                        const badge = getCategoryBadge(option.category, displayName);
                        const effectivePrice = getOptionPrice(option);
                        const isCustomized = !!customOptionSelections[option.id] || (option.category === 'golf' && isGolfCoursesModified);
                        const isExpanded = expandedOptionId === option.id;

                        // Customizable choices list for this category
                        const choices = option.category === 'hotel' 
                          ? getAvailableAccommodations()
                          : option.category === 'vehicle' 
                          ? pool.vehicles 
                          : option.category === 'guide' 
                          ? pool.guides 
                          : option.category === 'meal' 
                          ? pool.meals 
                          : [];

                        const isFastTrack = option.name.includes('패스트 트랙') || option.id.includes('fasttrack');

                        return (
                          <div
                            key={option.id}
                            className={`rounded-none sm:rounded-2xl border-x-0 border-y sm:border transition-all ${
                              isSelected
                                ? isFastTrack 
                                  ? 'bg-amber-50/70 border-amber-400 shadow-xs'
                                  : 'bg-emerald-50/40 border-emerald-300 shadow-xs'
                                : isFastTrack
                                ? 'bg-amber-50/20 border-amber-200/60 opacity-80 hover:opacity-100'
                                : 'bg-gray-50/60 border-gray-200/80 opacity-60 hover:opacity-100'
                            }`}
                          >
                            <div 
                              onClick={() => handleToggleOption(option)}
                              className="px-3.5 py-3 sm:p-4 md:p-5 cursor-pointer flex items-start justify-between gap-2.5 sm:gap-3 w-full min-w-0"
                            >
                              <div className="flex items-start gap-2.5 sm:gap-3 md:gap-3.5 min-w-0 flex-1">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  disabled={option.isRequired}
                                  onChange={() => {}}
                                  className="mt-0.5 sm:mt-1 w-4 h-4 sm:w-5 sm:h-5 md:w-5.5 md:h-5.5 rounded-md text-deepgreen accent-deepgreen cursor-pointer shrink-0"
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                    <span className={`px-1.5 sm:px-2 py-0.5 rounded-md text-[10px] md:text-xs font-semibold border ${badge.bg}`}>
                                      {badge.label}
                                    </span>
                                    <span className={`text-xs sm:text-sm md:text-base font-bold tracking-tight ${isSelected ? 'text-gray-900' : 'text-gray-400 line-through'}`}>
                                      {displayName}
                                    </span>
                                    {option.isRequired && (
                                      <span className="text-[10px] md:text-xs text-red-500 font-bold bg-red-50 px-1.5 py-0.5 rounded">필수</span>
                                    )}
                                    {isFastTrack && (
                                      <span className="text-[10px] md:text-xs text-amber-900 font-extrabold bg-amber-200/80 border border-amber-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                                        <span>⚡</span> 1인당 $60 선택 추가
                                      </span>
                                    )}
                                    {option.category === 'vehicle' && (
                                      <span className="text-[10px] md:text-xs text-blue-900 font-bold bg-blue-100/80 border border-blue-300 px-1.5 py-0.5 rounded">
                                        7인승 1대 1일 $100 기준
                                      </span>
                                    )}
                                    {option.category === 'hotel' && (
                                      <span className="text-[10px] md:text-xs text-blue-900 font-bold bg-blue-100/80 border border-blue-300 px-1.5 py-0.5 rounded">
                                        1인 1실 단독 투숙
                                      </span>
                                    )}
                                    {option.category === 'guide' && (
                                      <span className="text-[10px] md:text-xs text-indigo-900 font-bold bg-indigo-100/80 border border-indigo-300 px-1.5 py-0.5 rounded">
                                        1일 기준 $120
                                      </span>
                                    )}
                                    {(option.category === 'activity' && option.name.includes('마사지')) && (
                                      <span className="text-[10px] md:text-xs text-emerald-950 font-bold bg-emerald-100/80 border border-emerald-300 px-1.5 py-0.5 rounded">
                                        기본 선택 포함 ($50)
                                      </span>
                                    )}
                                    {option.category === 'meal' && (
                                      <span className="text-[10px] md:text-xs text-orange-950 font-bold bg-orange-100/80 border border-orange-300 px-1.5 py-0.5 rounded">
                                        1인 1일 $50 기준 (4일 $200 선택 가능)
                                      </span>
                                    )}
                                    {isCustomized && (
                                      <span className="text-[10px] md:text-xs text-gold-800 font-semibold bg-gold-100 border border-gold-300 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                        <span>✨</span> 맞춤 선택됨
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="text-right whitespace-nowrap pl-2 shrink-0">
                                <span className={`text-xs sm:text-sm md:text-base font-extrabold ${isSelected ? 'text-emerald-700' : 'text-gray-400'}`}>
                                  ${effectivePrice.toLocaleString()}
                                </span>
                                <span className="block text-[9px] sm:text-[10px] md:text-xs text-gray-400 font-normal">
                                  (약 {(effectivePrice * USD_TO_KRW).toLocaleString()}원)
                                </span>
                              </div>
                            </div>

                            {/* Customization Action Buttons & Quick Selector */}
                            <div className="px-3.5 sm:px-4 md:px-5 pb-2.5 sm:pb-3 md:pb-3.5 pt-0 flex flex-wrap items-center justify-between gap-1.5 sm:gap-2 border-t border-gray-100/60 mt-1 min-w-0 w-full">
                              {/* Left: Button to change content directly */}
                              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 min-w-0">
                                {option.category === 'golf' ? (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setShowGolfModal(true);
                                    }}
                                    className="px-2.5 sm:px-3 md:px-3.5 py-1 sm:py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-lg sm:rounded-xl text-[10px] sm:text-[11px] md:text-xs font-semibold transition flex items-center gap-1 shadow-xs active:scale-95 cursor-pointer"
                                  >
                                    <span>⛳</span>
                                    <span>라운딩 골프장 직접 변경/선택</span>
                                    <span className="text-[9px] md:text-[10px] bg-deepgreen text-white px-1.5 py-0.2 rounded font-bold">팝업창</span>
                                  </button>
                                ) : ['hotel', 'vehicle', 'guide', 'meal', 'activity'].includes(option.category) || option.allowCustomSelection ? (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setCustomizingOption(option);
                                      setOptionModalFilter('전체');
                                      setOptionModalTypeFilter('전체');
                                    }}
                                    className="px-2.5 sm:px-3 md:px-3.5 py-1 sm:py-1.5 bg-gold-50 hover:bg-gold-100 text-gold-950 border border-gold-300 rounded-lg sm:rounded-xl text-[10px] sm:text-[11px] md:text-xs font-semibold transition flex items-center gap-1 shadow-xs active:scale-95 cursor-pointer"
                                  >
                                    <span>⚙️</span>
                                    <span>
                                      {option.category === 'hotel' 
                                        ? '숙박 형태 직접 변경 (호텔/풀빌라)' 
                                        : option.category === 'vehicle' 
                                        ? '차량 옵션 직접 변경' 
                                        : option.category === 'guide' 
                                        ? '가이드 옵션 직접 변경' 
                                        : option.category === 'meal'
                                        ? '식사 구성 직접 변경'
                                        : `${option.name.slice(0, 10)} 직접 변경`}
                                    </span>
                                    <span className="text-[9px] md:text-[10px] bg-deepgreen text-white px-1.5 py-0.2 rounded font-bold">팝업창</span>
                                  </button>
                                ) : null}

                                {customOptionSelections[option.id] && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setCustomOptionSelections(prev => {
                                        const next = { ...prev };
                                        delete next[option.id];
                                        return next;
                                      });
                                    }}
                                    className="text-[10px] md:text-xs text-gray-400 hover:text-red-500 underline cursor-pointer"
                                  >
                                    기본값 복원
                                  </button>
                                )}
                              </div>

                              {/* Right: Quick indicator */}
                              <div className="text-[10px] md:text-xs text-gray-400 font-medium truncate max-w-full">
                                {option.category === 'golf' && `현재: ${customGolfCourses.map(c => c.split(' ')[0]).join(' · ')}`}
                                {option.category === 'hotel' && `현재: ${customOptionSelections[option.id]?.name || '기본 고급 호텔'}`}
                              </div>
                            </div>

                            {/* INLINE EXPANDED DRAWER FOR DIRECT CUSTOMIZATION */}
                            {isExpanded && ['hotel', 'vehicle', 'guide', 'meal'].includes(option.category) && (
                              <div className="p-4 md:p-5 bg-white/95 rounded-b-2xl border-t border-emerald-200/80 space-y-2.5 animate-fade-in">
                                <div className="flex justify-between items-center pb-1 border-b border-gray-100">
                                  <span className="text-xs md:text-sm font-black text-deepgreen">
                                    {option.category === 'hotel' ? '🏨 고객 선호 숙박 형태 선택' : '선택 가능한 옵션 목록'}
                                  </span>
                                  <span className="text-[10px] md:text-xs text-gray-400">클릭 즉시 견적과 일정에 적용됩니다</span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                  {choices.map((choice: any) => {
                                    const isChoiceActive = customOptionSelections[option.id]?.choiceId === choice.id || 
                                      (!customOptionSelections[option.id] && choice.priceDeltaUSD === 0);

                                    return (
                                      <div
                                        key={choice.id}
                                        onClick={() => {
                                          setCustomOptionSelections(prev => ({
                                            ...prev,
                                            [option.id]: {
                                              choiceId: choice.id,
                                              name: choice.name,
                                              priceDelta: choice.priceDeltaUSD,
                                              description: choice.description,
                                              badge: choice.badge
                                            }
                                          }));
                                          // Ensure option is selected in checklist
                                          if (!selectedOptionIds.has(option.id)) {
                                            setSelectedOptionIds(prev => new Set(prev).add(option.id));
                                          }
                                        }}
                                        className={`p-3 md:p-3.5 rounded-xl border text-xs md:text-sm cursor-pointer transition flex flex-col justify-between ${
                                          isChoiceActive
                                            ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-300 shadow-sm'
                                            : 'bg-gray-50 hover:bg-gray-100 border-gray-200'
                                        }`}
                                      >
                                        <div>
                                          <div className="flex items-center justify-between gap-1 mb-1">
                                            <span className="font-bold text-gray-900 line-clamp-1">{choice.name}</span>
                                            {choice.badge && (
                                              <span className="px-1.5 py-0.5 bg-gold-100 text-gold-800 rounded text-[9px] md:text-[10px] font-bold shrink-0">
                                                {choice.badge}
                                              </span>
                                            )}
                                          </div>
                                          {choice.description && (
                                            <p className="text-[10px] md:text-xs text-gray-500 leading-snug line-clamp-2">{choice.description}</p>
                                          )}
                                        </div>

                                        <div className="flex items-center justify-between pt-2 mt-2 border-t border-gray-200/60">
                                          <span className="text-[10px] md:text-xs font-bold text-gray-400">
                                            {choice.type === 'pool_villa' ? '🏊 독채 풀빌라' : choice.type === 'hotel_5star' ? '⭐ 고급 호텔' : '기본 옵션'}
                                          </span>
                                          <span className={`text-[11px] md:text-xs font-black ${
                                            choice.priceDeltaUSD === 0 ? 'text-gray-600' : choice.priceDeltaUSD > 0 ? 'text-emerald-700' : 'text-blue-600'
                                          }`}>
                                            {choice.priceDeltaUSD === 0 
                                              ? '기본가 ($0)' 
                                              : choice.priceDeltaUSD > 0 
                                              ? `+1인 $${choice.priceDeltaUSD}` 
                                              : `-1인 $${Math.abs(choice.priceDeltaUSD)}`}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* TAB 2: Itinerary Timeline */}
                {viewTab === 'itinerary' && (
                  <div className="space-y-4 pt-1 px-3.5 sm:px-0">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-black text-base md:text-xl text-gray-900">📅 4박 5일 정규 일정표</h3>
                        <p className="text-xs md:text-sm text-gray-500 mt-0.5">선택하신 라운딩 골프장과 숙박 형태가 반영된 세부 일정입니다.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowGolfModal(true)}
                        className="px-3 py-1.5 md:px-4 md:py-2 bg-deepgreen text-white text-xs md:text-sm font-bold rounded-xl shadow hover:bg-gold-600 transition cursor-pointer"
                      >
                        ⛳ 일정별 골프장 변경
                      </button>
                    </div>

                    <div className="space-y-3">
                      {activePackage.itinerary?.map((item) => {
                        // Dynamically update course title or activity based on customGolfCourses
                        let dayTitle = item.title;
                        const roundIdx = item.day >= 2 ? item.day - 2 : 0;
                        if (customGolfCourses[roundIdx] && (item.title.includes('CC') || item.title.includes('골프') || item.title.includes('라운딩'))) {
                          dayTitle = `Day ${item.day}: ${customGolfCourses[roundIdx]} 18홀 라운딩`;
                        }

                        return (
                          <div key={item.day} className="flex gap-3 md:gap-4 items-start">
                            <div className="w-9 h-9 md:w-11 md:h-11 rounded-xl bg-deepgreen text-white font-black text-xs md:text-sm flex items-center justify-center flex-shrink-0 shadow-sm">
                              D{item.day}
                            </div>
                            <div className="bg-gray-50 rounded-2xl p-3.5 md:p-4.5 flex-grow border border-gray-100">
                              <h4 className="text-xs sm:text-sm md:text-base font-black text-gray-900 mb-1 flex items-center justify-between">
                                <span>{dayTitle}</span>
                                {item.day >= 2 && customGolfCourses[roundIdx] && (
                                  <span className="text-[10px] md:text-xs bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold">
                                    {customGolfCourses[roundIdx]}
                                  </span>
                                )}
                              </h4>
                              <ul className="space-y-1 md:space-y-1.5">
                                {item.activities.map((act, aIdx) => {
                                  let actText = act;
                                  if (customGolfCourses[roundIdx] && act.includes('CC') && (act.includes('라운딩') || act.includes('이동'))) {
                                    actText = act.replace(/[가-힣a-zA-Z0-9\s]+CC/g, customGolfCourses[roundIdx].split(' ')[0] + ' CC');
                                  }
                                  return (
                                    <li key={aIdx} className="text-xs md:text-sm text-gray-600 flex items-start gap-1.5 leading-relaxed">
                                      <span className="text-gold-500 mt-0.5">•</span>
                                      <span>{actText}</span>
                                    </li>
                                  );
                                })}
                              </ul>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Official Quotation Summary Footer (Included in Captured Screenshot) */}
                <div className="pt-3 sm:pt-4 md:pt-5 mt-3 sm:mt-4 md:mt-5 border-t-2 border-dashed border-gray-200 space-y-3 px-3.5 sm:px-0">
                  <div className="bg-gradient-to-br from-gray-900 to-deepgreen text-white p-3.5 sm:p-5 md:p-6 rounded-xl sm:rounded-2xl shadow-inner">
                    <div className="flex flex-wrap justify-between items-center gap-1.5 sm:gap-2 mb-2 pb-2 border-b border-white/15 text-[11px] sm:text-xs md:text-sm">
                      <div className="flex items-center gap-2.5 sm:gap-3">
                        <span className="text-gray-300">📅 출발일: <strong className="text-gold-300">{departureDate || '미정'}</strong></span>
                        <span className="text-gray-300">👥 인원: <strong className="text-gold-300">{personCount}명</strong></span>
                      </div>
                      <div className="text-[10px] sm:text-[11px] md:text-xs text-emerald-300 font-semibold">
                        선택 포함: {selectedOptionIds.size}개 | 제외: {activePackage.options.length - selectedOptionIds.size}개
                      </div>
                    </div>

                    {/* Customer Custom Selection Summary Badges in Captured Card */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 my-2 py-2 border-y border-white/10 text-[10px] sm:text-[11px] md:text-xs">
                      <div className="bg-white/10 p-2 sm:p-2.5 md:p-3 rounded-lg sm:rounded-xl">
                        {customGolfCourses.length > 0 ? (
                          <>
                            <span className="text-gold-300 font-semibold block mb-0.5">⛳ 선택 골프장 ({customGolfCourses.length}회 라운딩):</span>
                            <span className="text-white font-medium line-clamp-1">{customGolfCourses.join(' · ')}</span>
                          </>
                        ) : (
                          <>
                            <span className="text-gold-300 font-semibold block mb-0.5">🧳 선택 여행 일정:</span>
                            <span className="text-white font-medium line-clamp-1">{activePackage.location} {activePackage.duration} 맞춤 여행</span>
                          </>
                        )}
                      </div>
                      <div className="bg-white/10 p-2 sm:p-2.5 md:p-3 rounded-lg sm:rounded-xl">
                        <span className="text-gold-300 font-semibold block mb-0.5">🏨 선택 숙박 형태:</span>
                        <span className="text-white font-medium line-clamp-1">{getChosenAccommodationName()}</span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pt-1">
                      <div>
                        <span className="text-[10px] sm:text-[11px] md:text-xs text-gray-300 block">1인 기준 예상 견적</span>
                        <div className="text-base sm:text-lg md:text-xl font-bold text-white tracking-tight">
                          ${currentTotalPerPerson.toLocaleString()} <span className="text-xs md:text-sm font-semibold">USD</span>
                        </div>
                        <div className="text-[10px] sm:text-[11px] md:text-xs text-gold-300 font-normal">
                          (약 {(currentTotalPerPerson * USD_TO_KRW).toLocaleString()}원)
                        </div>
                      </div>
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] sm:text-[11px] md:text-xs text-gold-300 block font-semibold">총 {personCount}인 예상 견적 합계</span>
                        <div className="text-lg sm:text-2xl md:text-3xl font-extrabold text-gold-400 tracking-tight">
                          ${currentTotalGroup.toLocaleString()} <span className="text-xs md:text-sm font-bold">USD</span>
                        </div>
                        <div className="text-[10px] sm:text-[11px] md:text-xs text-gray-300 font-normal">
                          (약 {(currentTotalGroup * USD_TO_KRW).toLocaleString()}원)
                        </div>
                      </div>
                    </div>

                    {customerNotes && (
                      <div className="mt-2.5 pt-2 border-t border-white/10 text-[10px] sm:text-[11px] md:text-xs text-gray-300 break-keep">
                        <span className="text-gold-300 font-semibold">📝 추가 요청사항: </span>
                        <span>{customerNotes}</span>
                      </div>
                    )}
                  </div>

                  {/* Official Inquiry Channels Footer */}
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-1.5 px-1 sm:px-2 text-[10px] sm:text-[11px] md:text-xs text-gray-500 font-normal w-full overflow-hidden">
                    <div className="truncate max-w-full">💬 카카오톡 1:1 상담: <strong className="text-deepgreen font-semibold break-all">open.kakao.com/o/gprQnKSi</strong></div>
                    <div className="truncate max-w-full">📧 이메일 문의 접수: <strong className="text-deepgreen font-semibold break-all">seo9791@gmail.com</strong></div>
                  </div>
                </div>

              </div>

            </div>


            {/* Right Column (5 cols): Real-Time Price Calculator & Inquiry Action Panel */}
            <div className="lg:col-span-5 space-y-4 sm:space-y-6 w-full max-w-full min-w-0">
              
              {/* Sticky Calculator Box - Edge-to-edge on mobile */}
              <div className="bg-white rounded-none sm:rounded-3xl p-3.5 sm:p-6 md:p-7 border-y sm:border-2 border-gold-400/50 shadow-sm sm:shadow-xl space-y-4 sm:space-y-5 sm:sticky sm:top-20 w-full max-w-full">
                
                <div className="bg-gradient-to-r from-deepgreen to-[#004d40] text-white p-3.5 sm:p-4 md:p-5 rounded-xl sm:rounded-2xl text-center shadow-xs">
                  <div className="text-[10px] sm:text-[11px] md:text-xs text-gold-300 font-bold uppercase tracking-wider">실시간 맞춤 견적 계산기</div>
                  <div className="mt-1">
                    <span className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                      ${currentTotalPerPerson.toLocaleString()}
                    </span>
                    <span className="text-xs md:text-sm text-gray-300 font-normal ml-1">/ 1인 기준</span>
                  </div>
                  <div className="text-[11px] sm:text-xs md:text-sm text-gold-300 font-normal mt-0.5">
                    (약 {(currentTotalPerPerson * USD_TO_KRW).toLocaleString()}원)
                  </div>
                </div>

                {/* Input Fields */}
                <div className="space-y-3 sm:space-y-3.5 text-xs md:text-sm">
                  
                  {/* Passenger Count */}
                  <div>
                    <label className="font-bold text-gray-700 block mb-1.5 md:text-sm">👥 여행 인원 수</label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPersonCount(Math.max(1, personCount - 1))}
                        className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-gray-100 text-gray-700 font-black text-base hover:bg-gray-200 transition active:scale-95 cursor-pointer"
                      >
                        -
                      </button>
                      <div className="flex-1 text-center font-black text-base md:text-lg bg-gray-50 py-2 md:py-2.5 rounded-xl border border-gray-200 text-deepgreen">
                        {personCount} 명
                      </div>
                      <button
                        type="button"
                        onClick={() => setPersonCount(personCount + 1)}
                        className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-gray-100 text-gray-700 font-black text-base hover:bg-gray-200 transition active:scale-95 cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Departure Date */}
                  <div>
                    <label className="font-bold text-gray-700 block mb-1.5 md:text-sm">📅 출발 희망일자</label>
                    <input
                      type="date"
                      value={departureDate}
                      onChange={(e) => setDepartureDate(e.target.value)}
                      className="w-full p-2.5 md:p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-gray-800 outline-none focus:border-gold-500 text-xs md:text-sm"
                    />
                  </div>

                  {/* Customer Inquiry & Special Requests */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between items-center">
                      <label className="font-bold text-gray-800 flex items-center gap-1 md:text-sm">
                        <span>📝</span> 문의 및 추가 요청사항
                      </label>
                      <span className="text-[10px] md:text-xs text-gray-400 font-medium">선택 사항</span>
                    </div>

                    <textarea
                      rows={3}
                      value={customerNotes}
                      onChange={(e) => setCustomerNotes(e.target.value)}
                      placeholder="예: 오전 8시 이전 티타임 희망, 싱글룸(1인1실) 추가 비용 문의, 골프 클럽 대여 필요 등"
                      className="w-full p-2.5 md:p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs md:text-sm text-gray-800 outline-none focus:bg-white focus:border-gold-500 focus:ring-1 focus:ring-gold-500 transition resize-none leading-relaxed"
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
                          className="px-2 py-1 md:px-2.5 md:py-1 bg-gray-100 hover:bg-gold-100 hover:text-gold-900 text-gray-600 rounded-lg text-[10px] md:text-xs font-bold transition border border-gray-200/80 active:scale-95 cursor-pointer"
                        >
                          +{tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tailored Trip Summary in Sticky Card */}
                  <div className="p-3.5 md:p-4 bg-emerald-50/80 rounded-2xl border border-emerald-200/90 space-y-2">
                    <div className="flex items-center justify-between text-xs md:text-sm font-black text-deepgreen">
                      <span className="flex items-center gap-1">
                        <span>✨</span> 나만의 맞춤 구성 요약
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setShowGolfModal(true)}
                          className="text-[10px] md:text-xs text-gold-700 hover:text-gold-900 underline font-bold cursor-pointer"
                        >
                          골프장 ⛳
                        </button>
                        <span className="text-gray-300">•</span>
                        <button
                          type="button"
                          onClick={() => {
                            const hotelOpt = activePackage?.options.find(o => o.category === 'hotel');
                            if (hotelOpt) {
                              setCustomizingOption(hotelOpt);
                              setOptionModalFilter('전체');
                              setOptionModalTypeFilter('전체');
                            }
                          }}
                          className="text-[10px] md:text-xs text-deepgreen hover:underline font-bold cursor-pointer"
                        >
                          숙소 🏨
                        </button>
                      </div>
                    </div>
                    <div className="text-[11px] md:text-xs text-gray-700 space-y-2">
                      <div className="flex items-start gap-1.5">
                        <span className="font-bold text-gray-900 shrink-0 md:text-xs mt-0.5">⛳ 골프:</span>
                        <div className="flex-1 flex flex-wrap gap-1.5">
                          {(() => {
                            const { rounds } = getDateMatchedGolfBreakdown();
                            return rounds.map((r, i) => (
                              <span
                                key={i}
                                className={`text-[10px] md:text-xs px-2 py-0.5 rounded-lg border font-bold flex items-center gap-1 shadow-2xs ${
                                  r.isWeekend 
                                    ? 'bg-amber-50 text-amber-950 border-amber-300' 
                                    : 'bg-emerald-50 text-emerald-950 border-emerald-300'
                                }`}
                              >
                                <span>{r.dateStr}</span>
                                <span className="font-extrabold">{r.courseName.split(' ')[0]}</span>
                                <span className={`text-[9px] px-1 py-0.2 rounded font-black ${
                                  r.isWeekend ? 'bg-amber-200 text-amber-900' : 'bg-emerald-200 text-emerald-900'
                                }`}>
                                  ${r.appliedUSD}
                                </span>
                              </span>
                            ));
                          })()}
                        </div>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <span className="font-bold text-gray-900 shrink-0 md:text-xs">🏨 숙소:</span>
                        <span className="text-gray-700 font-bold bg-white px-1.5 py-0.5 rounded border border-emerald-200 text-[10px] md:text-xs">
                          {getChosenAccommodationName()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Summary Breakdown */}
                  <div className="p-3.5 md:p-4 bg-gray-50 rounded-2xl space-y-2 border border-gray-100 text-xs md:text-sm">
                    <div className="flex justify-between text-gray-600">
                      <span>선택된 포함 항목</span>
                      <span className="font-bold text-deepgreen">{selectedOptionIds.size}개 항목</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>제외된 항목</span>
                      <span className="font-bold text-red-500">{activePackage.options.length - selectedOptionIds.size}개 항목</span>
                    </div>
                    <div className="pt-2 border-t border-gray-200 flex justify-between items-center">
                      <span className="font-black text-gray-900 md:text-base">총 그룹 예상 견적 ({personCount}인)</span>
                      <div className="text-right">
                        <div className="text-lg md:text-2xl font-black text-deepgreen tracking-tight">
                          ${currentTotalGroup.toLocaleString()} <span className="text-xs md:text-sm font-bold">USD</span>
                        </div>
                        <div className="text-[10px] md:text-xs text-gray-500 font-medium">
                          (약 {(currentTotalGroup * USD_TO_KRW).toLocaleString()}원)
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Brand & Phone Footer in Quotation Card */}
                  <div className="pt-2 text-[10px] md:text-xs text-gray-400 border-t border-gray-100 flex items-center justify-between">
                    <span>MANGO TOUR GOLF & TRAVEL</span>
                    <span className="font-bold text-gray-600">
                      TEL: +84 37 720 4451
                    </span>
                  </div>
                </div>

                {/* Primary Action Buttons */}
                <div className="space-y-2 sm:space-y-2.5 pt-1 sm:pt-2">
                  {/* Kakao button with automatic capture */}
                  <button
                    type="button"
                    onClick={handleKakaoInquiry}
                    disabled={isCapturing}
                    className="w-full py-3.5 sm:py-4 md:py-4.5 bg-[#FEE500] text-[#191919] font-bold rounded-xl sm:rounded-2xl hover:bg-[#FDD835] transition shadow-md flex items-center justify-center gap-2 text-xs sm:text-sm md:text-base tracking-tight active:scale-95 disabled:opacity-75 cursor-pointer"
                  >
                    <span>{isCapturing ? '⏳' : '💬'}</span>
                    <span>{isCapturing ? '견적서 캡처 생성 중...' : '카카오톡으로 즉시 견적 문의하기'}</span>
                  </button>

                  {/* 1:1 Online Inquiry (Email to seo9791@gmail.com) */}
                  <button
                    type="button"
                    onClick={handleOpenOnlineInquiry}
                    className="w-full py-3 sm:py-3.5 md:py-4 bg-deepgreen text-white font-bold rounded-xl sm:rounded-2xl hover:bg-[#00382e] transition shadow-md flex items-center justify-center gap-2 text-xs sm:text-sm md:text-base tracking-tight active:scale-95 cursor-pointer"
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
                      className="py-2.5 sm:py-3 md:py-3.5 bg-gold-50 text-gold-950 border border-gold-300 font-semibold rounded-lg sm:rounded-xl hover:bg-gold-100 transition text-[11px] sm:text-xs md:text-sm flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                    >
                      <span>📸</span>
                      <span>견적서 캡처 저장</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyQuote}
                      className="py-2.5 sm:py-3 md:py-3.5 bg-gray-100 text-gray-700 font-semibold rounded-lg sm:rounded-xl hover:bg-gray-200 transition text-[11px] sm:text-xs md:text-sm flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                    >
                      <span>📋</span>
                      <span>견적서 텍스트 복사</span>
                    </button>
                  </div>
                </div>

                <div className="p-2.5 md:p-3 bg-amber-50 rounded-xl border border-amber-200 text-[10px] md:text-xs text-amber-800 leading-relaxed font-normal">
                  💡 <strong>안내:</strong> 견적서 캡처 저장 또는 1:1 온라인 신청 시 현재 맞춤 구성이 <strong>정식 A4 견적서(PDF 양식)</strong>로 자동 생성되어 다운로드 및 이메일(<strong>seo9791@gmail.com</strong>)로 전송됩니다.
                </div>

              </div>

            </div>

          </div>
        )}

      </div>

      {/* ================= MODAL 1: 1:1 ONLINE INQUIRY MODAL (EMAIL TO seo9791@gmail.com) ================= */}
      {showInquiryModal && (
        <div 
          className="fixed inset-0 bg-black/75 z-[10002] flex items-center justify-center p-0 sm:p-4 backdrop-blur-sm animate-fade-in overflow-hidden select-text font-sans break-keep"
          style={{ touchAction: 'pan-y', overscrollBehaviorX: 'none' }}
        >
          <div 
            className="bg-white rounded-none sm:rounded-3xl max-w-none sm:max-w-lg w-full max-w-full h-full sm:h-auto max-h-none sm:max-h-[92vh] relative shadow-2xl animate-scale-in flex flex-col overflow-hidden box-border"
            style={{ touchAction: 'pan-y', overscrollBehaviorX: 'none' }}
          >
            {/* Modal Header with Back Button (Edge-to-edge pinned on top) */}
            <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-3.5 border-b border-gray-100 bg-white sticky top-0 z-30 shrink-0">
              <button
                type="button"
                onClick={() => { setShowInquiryModal(false); setInquirySuccess(false); }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition active:scale-95 cursor-pointer"
                aria-label="뒤로 가기"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
                <span>뒤로 가기</span>
              </button>
              
              <div className="text-center">
                <span className="font-extrabold text-sm sm:text-base md:text-lg text-deepgreen">1:1 온라인 맞춤 견적 신청</span>
              </div>

              <button
                type="button"
                onClick={() => { setShowInquiryModal(false); setInquirySuccess(false); }}
                className="text-gray-400 hover:text-gray-600 font-bold text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition cursor-pointer"
                aria-label="닫기"
              >
                ✕
              </button>
            </div>

            {!inquirySuccess ? (
              <form onSubmit={handleSubmitOnlineInquiry} className="flex-1 flex flex-col overflow-hidden">
                {/* Scrollable Form Body */}
                <div 
                  className="flex-1 overflow-y-auto px-4 py-3 sm:px-6 sm:py-4 md:px-7 md:py-5 space-y-3.5 text-xs md:text-sm w-full max-w-full box-border"
                  style={{ WebkitOverflowScrolling: 'touch' }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] md:text-xs font-black rounded-md shrink-0">이메일 공식 접수</span>
                    <span className="text-xs md:text-sm text-gray-400 break-all font-semibold">seo9791@gmail.com</span>
                  </div>
                  <h3 className="text-lg sm:text-xl md:text-2xl font-black text-deepgreen">골프 투어 견적서 이메일 발송</h3>
                  <p className="text-xs md:text-sm text-gray-500 break-keep">작성하신 예약 정보와 맞춤 견적서가 담당 매니저 이메일로 즉시 발송됩니다.</p>

                  {/* Captured Screenshot Preview Thumbnail (A4 PDF Form) */}
                  {capturedImageUrl && (
                    <div className="p-3 md:p-4 bg-gray-50 rounded-2xl border border-gray-200 w-full max-w-full overflow-hidden box-border">
                      <div className="flex justify-between items-center mb-1.5 flex-wrap gap-1">
                        <span className="text-[11px] md:text-xs font-bold text-gray-800 flex items-center gap-1">
                          <span>📄</span> 첨부되는 정식 A4 견적서 (PDF 양식) 미리보기
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleDownloadPDF(capturedImageUrl)}
                            className="text-[10px] md:text-xs text-gold-700 font-bold hover:underline cursor-pointer"
                          >
                            📄 PDF 다운로드
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDownloadImage(capturedImageUrl)}
                            className="text-[10px] md:text-xs text-deepgreen font-bold hover:underline cursor-pointer"
                          >
                            📥 이미지 저장
                          </button>
                        </div>
                      </div>
                      <div className="max-h-48 md:max-h-60 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-inner p-1">
                        <img src={capturedImageUrl} alt="A4 Quotation Preview" className="w-full object-top" />
                      </div>
                    </div>
                  )}

                  <div className="w-full max-w-full">
                    <label className="font-bold text-gray-700 block mb-1 md:text-sm">예약자 성함 / 대표자명 *</label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="홍길동"
                      className="w-full max-w-full box-border p-3 md:p-3.5 bg-gray-50 border border-gray-200 rounded-xl font-medium outline-none focus:border-gold-500 focus:bg-white text-sm md:text-base"
                    />
                  </div>

                  <div className="w-full max-w-full">
                    <label className="font-bold text-gray-700 block mb-1 md:text-sm">연락처 또는 카카오톡 ID *</label>
                    <input
                      type="text"
                      required
                      value={customerContact}
                      onChange={(e) => setCustomerContact(e.target.value)}
                      placeholder="010-1234-5678 또는 카카오톡ID"
                      className="w-full max-w-full box-border p-3 md:p-3.5 bg-gray-50 border border-gray-200 rounded-xl font-medium outline-none focus:border-gold-500 focus:bg-white text-sm md:text-base"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 w-full max-w-full box-border">
                    <div className="min-w-0">
                      <label className="font-bold text-gray-700 block mb-1 md:text-sm">인원 수</label>
                      <input
                        type="number"
                        min="1"
                        value={personCount}
                        onChange={(e) => setPersonCount(parseInt(e.target.value) || 1)}
                        className="w-full max-w-full box-border p-3 md:p-3.5 bg-gray-50 border border-gray-200 rounded-xl font-medium outline-none focus:border-gold-500 focus:bg-white text-sm md:text-base"
                      />
                    </div>
                    <div className="min-w-0">
                      <label className="font-bold text-gray-700 block mb-1 md:text-sm">출발 희망일</label>
                      <input
                        type="date"
                        value={departureDate}
                        onChange={(e) => setDepartureDate(e.target.value)}
                        className="w-full max-w-full box-border p-3 md:p-3.5 bg-gray-50 border border-gray-200 rounded-xl font-medium outline-none focus:border-gold-500 focus:bg-white text-sm md:text-base"
                      />
                    </div>
                  </div>

                  <div className="w-full max-w-full">
                    <label className="font-bold text-gray-700 block mb-1 md:text-sm">추가 요청사항 (선택)</label>
                    <textarea
                      rows={2}
                      value={customerNotes}
                      onChange={(e) => setCustomerNotes(e.target.value)}
                      placeholder="티타임 시간대, 선호 호텔 유형, 클럽 렌탈 여부 등"
                      className="w-full max-w-full box-border p-3 md:p-3.5 bg-gray-50 border border-gray-200 rounded-xl font-medium outline-none focus:border-gold-500 focus:bg-white resize-none text-sm md:text-base"
                    />
                  </div>

                  <div className="p-3.5 md:p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex justify-between items-center w-full max-w-full box-border">
                    <div className="min-w-0 mr-2">
                      <span className="text-[10px] md:text-xs text-emerald-700 block font-semibold">총 {personCount}인 예상 견적</span>
                      <div className="font-black text-emerald-900 text-base sm:text-lg md:text-xl tracking-tight">
                        ${currentTotalGroup.toLocaleString()} <span className="text-xs md:text-sm font-semibold">USD</span>
                      </div>
                      <div className="text-[11px] md:text-xs text-emerald-700 font-medium">
                        (약 {(currentTotalGroup * USD_TO_KRW).toLocaleString()}원)
                      </div>
                    </div>
                    <div className="text-[10px] md:text-xs text-emerald-700 font-bold bg-white px-2.5 py-1 rounded-lg border border-emerald-200 shrink-0">
                      선택 {selectedOptionIds.size}개
                    </div>
                  </div>
                </div>

                {/* Sticky Pinned Bottom Action Bar - Email Submit Button ALWAYS VISIBLE */}
                <div 
                  className="bg-white/95 backdrop-blur-md px-4 py-3 sm:px-6 sm:py-3.5 md:px-7 md:py-4 border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] shrink-0 z-30"
                  style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 0.75rem)' }}
                >
                  <button
                    type="submit"
                    disabled={isSubmittingEmail}
                    className="w-full py-4 md:py-4.5 bg-deepgreen hover:bg-[#00382e] text-white font-black rounded-2xl shadow-xl text-sm sm:text-base md:text-lg active:scale-95 disabled:opacity-75 flex items-center justify-center gap-2 cursor-pointer transition"
                  >
                    <span>{isSubmittingEmail ? '⏳' : '🚀'}</span>
                    <span className="font-extrabold tracking-tight">
                      {isSubmittingEmail ? '이메일(seo9791@gmail.com) 전송 중...' : '1:1 온라인 견적 신청서 발송하기 (이메일 전송)'}
                    </span>
                  </button>
                  <p className="text-[10px] md:text-xs text-gray-400 text-center mt-1.5">
                    버튼을 누르시면 담당 매니저(seo9791@gmail.com)에게 실시간으로 견적서가 발송됩니다.
                  </p>
                </div>
              </form>
            ) : (
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 text-center space-y-4 w-full max-w-full">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl md:text-4xl mx-auto">
                  ✓
                </div>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-deepgreen">신청서가 성공적으로 전송되었습니다!</h3>
                <p className="text-xs md:text-sm text-gray-600 leading-relaxed max-w-sm md:max-w-md mx-auto break-words break-all">
                  <strong>{customerName}</strong>님, 접수해주신 견적서가 담당자 이메일(<strong>seo9791@gmail.com</strong>)로 정상 전달되었습니다. 담당 매니저가 확인 후 연락처(<strong>{customerContact}</strong>)로 빠른 상담을 진행해 드립니다.
                </p>

                {capturedImageUrl && (
                  <div className="p-3 md:p-4 bg-gray-50 rounded-xl border border-gray-200 text-left w-full max-w-full overflow-hidden box-border">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[11px] md:text-xs font-bold text-gray-700">📄 전송된 정식 A4 견적서 (PDF 양식):</span>
                      <span className="text-[10px] md:text-xs text-emerald-600 font-bold">✓ 접수 완료</span>
                    </div>
                    <div className="max-h-36 md:max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-white p-1">
                      <img src={capturedImageUrl} alt="Quotation" className="w-full" />
                    </div>
                  </div>
                )}

                <div className="pt-2 flex flex-col gap-2 w-full max-w-full">
                  <button
                    type="button"
                    onClick={() => handleDownloadPDF(capturedImageUrl)}
                    className="w-full py-3.5 md:py-4 bg-gradient-to-r from-gold-500 to-amber-600 hover:from-gold-600 hover:to-amber-700 text-white font-extrabold rounded-2xl transition text-xs md:text-sm flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
                  >
                    <span>📄</span>
                    <span>정식 A4 견적서 (PDF) 파일 다운로드</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDownloadImage(capturedImageUrl)}
                    className="w-full py-3 md:py-3.5 bg-gray-100 text-gray-800 font-bold rounded-2xl hover:bg-gray-200 transition text-xs md:text-sm flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>📥</span>
                    <span>견적서 고해상도 이미지(PNG) 다운로드</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSendMailto}
                    className="w-full py-3 md:py-3.5 bg-blue-50 text-blue-800 border border-blue-200 font-bold rounded-2xl hover:bg-blue-100 transition text-xs md:text-sm flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>📧</span>
                    <span>내 메일 앱(Gmail/기본메일)으로도 확인 발송</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      window.open('https://open.kakao.com/o/gprQnKSi', '_blank');
                    }}
                    className="w-full py-3.5 md:py-4 bg-[#FEE500] text-[#191919] font-black rounded-2xl hover:bg-[#FDD835] transition text-xs md:text-sm flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>💬</span>
                    <span>카카오톡 실시간 상담 바로 연결</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowInquiryModal(false); setInquirySuccess(false); }}
                    className="w-full py-3 text-gray-400 font-bold hover:text-gray-600 transition text-xs md:text-sm cursor-pointer"
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
        <div 
          className="fixed inset-0 bg-black/75 z-[10002] flex items-center justify-center p-0 sm:p-4 backdrop-blur-sm animate-fade-in overflow-x-hidden overflow-y-auto overscroll-x-none font-sans break-keep"
          style={{ touchAction: 'pan-y', overscrollBehaviorX: 'none', WebkitOverflowScrolling: 'touch' }}
        >
          <div 
            className="bg-white rounded-none sm:rounded-3xl max-w-none sm:max-w-xl w-full max-w-full h-full sm:h-auto max-h-none sm:max-h-[92vh] p-3.5 sm:p-7 relative shadow-2xl animate-scale-in m-0 sm:my-8 overflow-x-hidden overflow-y-auto box-border"
            style={{ touchAction: 'pan-y', overscrollBehaviorX: 'none', WebkitOverflowScrolling: 'touch' }}
          >
            {/* Modal Header with Back Button */}
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-gray-100">
              <button
                type="button"
                onClick={() => setShowKakaoModal(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition active:scale-95 cursor-pointer"
                aria-label="뒤로 가기"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
                <span>뒤로 가기</span>
              </button>
              <button
                type="button"
                onClick={() => setShowKakaoModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition cursor-pointer"
                aria-label="닫기"
              >
                ✕
              </button>
            </div>

            <div className="text-center space-y-3.5 w-full max-w-full overflow-x-hidden">
              <div className="w-12 h-12 bg-[#FEE500] text-[#191919] rounded-2xl flex items-center justify-center text-2xl mx-auto shadow-md">
                💬
              </div>

              <div>
                <h3 className="text-lg sm:text-xl md:text-2xl font-black text-gray-900">카카오톡 맞춤 견적 문의</h3>
                <p className="text-xs md:text-sm text-gray-500 mt-1">
                  견적 내용이 자동으로 복사되었습니다. 카카오톡 상담창에 붙여넣기만 하시면 됩니다.
                </p>
              </div>

              {/* ================= NEW: FULL PRODUCT & QUOTE ITEMS LIST (상품 목록 및 견적 상세 구성) ================= */}
              <div className="bg-gradient-to-br from-emerald-50/80 to-teal-50/50 rounded-2xl p-3.5 sm:p-4 md:p-5 border border-emerald-200/90 text-left space-y-3 shadow-xs w-full max-w-full box-border">
                <div className="flex items-start justify-between gap-2 border-b border-emerald-200/70 pb-2.5">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      <span className="px-2 py-0.5 bg-deepgreen text-white text-[10px] md:text-xs font-black rounded-md">
                        {activePackage?.location || diyLocation}
                      </span>
                      <span className="text-[11px] md:text-xs text-emerald-800 font-bold">
                        {activePackage?.duration || `${diyNights}박 ${diyDays}일`}
                      </span>
                    </div>
                    <h4 className="font-black text-sm sm:text-base md:text-lg text-gray-900 leading-tight">
                      {activePackage?.title || `[고객 맞춤 DIY] ${diyLocation} 명문 골프 투어`}
                    </h4>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] md:text-xs text-gray-500 block">인원 / 출발일</span>
                    <span className="text-xs md:text-sm font-black text-deepgreen">
                      {personCount}인 · {departureDate || '미정'}
                    </span>
                  </div>
                </div>

                {/* 1. Golf Courses List */}
                <div className="text-xs md:text-sm space-y-1">
                  <span className="font-bold text-gray-800 flex items-center gap-1 text-[11px] md:text-xs">
                    <span>⛳</span> 선택 라운딩 골프장 목록:
                  </span>
                  <div className="flex flex-wrap gap-1.5 pl-0.5">
                    {(customGolfCourses.length > 0 ? customGolfCourses : diyGolfCourses.slice(0, diyRounds)).map((course, idx) => (
                      <span key={idx} className="bg-white px-2 py-1 md:px-2.5 md:py-1 rounded-lg border border-emerald-200 text-[10px] sm:text-[11px] md:text-xs font-bold text-emerald-900 shadow-2xs">
                        {idx + 1}R: {course}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 2. Accommodation & Vehicle */}
                <div className="text-xs md:text-sm space-y-1">
                  <span className="font-bold text-gray-800 flex items-center gap-1 text-[11px] md:text-xs">
                    <span>🏨</span> 선택 숙소:
                  </span>
                  <div className="pl-0.5 text-gray-700 text-xs md:text-sm font-semibold">
                    {getChosenAccommodationName()}
                  </div>
                </div>

                {/* 3. Included Options List */}
                <div className="pt-2 border-t border-emerald-200/70">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="font-bold text-gray-800 text-xs md:text-sm flex items-center gap-1">
                      <span>📋</span> 포함 상품 및 세부 옵션 목록:
                    </span>
                    <span className="text-[10px] md:text-xs text-emerald-700 font-bold bg-white px-2 py-0.5 rounded border border-emerald-200">
                      총 {activePackage ? activePackage.options.filter(o => selectedOptionIds.has(o.id)).length : 5}개 포함
                    </span>
                  </div>

                  <div className="max-h-40 md:max-h-52 overflow-y-auto space-y-1 pr-1 bg-white/90 p-2.5 md:p-3 rounded-xl border border-emerald-100 shadow-inner">
                    {activePackage ? (
                      activePackage.options.filter(o => selectedOptionIds.has(o.id)).map((opt) => (
                        <div key={opt.id} className="flex justify-between items-center text-xs md:text-sm py-1 border-b border-gray-100 last:border-none">
                          <div className="flex items-center gap-1.5 text-gray-800 font-medium truncate mr-2 min-w-0">
                            <span className="text-[9px] md:text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 shrink-0 font-bold">
                              {opt.name.includes('패스트 트랙') ? '패스트트랙' : opt.category === 'hotel' ? '숙박(1인실)' : opt.category === 'vehicle' ? '차량' : opt.category === 'guide' ? '가이드' : opt.category === 'meal' ? '식사' : opt.category === 'golf' ? '골프' : '옵션'}
                            </span>
                            <span className="truncate">{getOptionDisplayName(opt)}</span>
                          </div>
                          <span className="font-bold text-deepgreen text-xs md:text-sm shrink-0">
                            ${getOptionPrice(opt)}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs md:text-sm text-gray-600 space-y-1">
                        <div>• 전 일정 단독 차량: {selectedVehicleItem?.shortName || selectedVehicleItem?.name}</div>
                        <div>• {diyActivityMode === 'golf' ? `${diyRounds}회 18홀 명문 골프장 그린피 포함` : `여행 구성: ${selectedTourItems.map(t => t.name).join(', ') || '자유 여행'}`}</div>
                        <div>• {selectedHotelTier?.name || '고급 호텔'} (1인 1실) 숙박 포함</div>
                        {diyExtraServices.map(svc => {
                          const isChecked = diySelectedExtraIds.includes(svc.id);
                          return (
                            <div key={svc.id}>
                              • {svc.name}: {isChecked ? '포함' : '미포함'}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* 4. Total Price Breakdown */}
                <div className="pt-2 border-t border-emerald-200/70 flex justify-between items-center">
                  <div>
                    <span className="text-[10px] md:text-xs text-gray-500 block">총 견적 금액 ({personCount}인 기준)</span>
                    <span className="text-base sm:text-lg md:text-xl font-black text-deepgreen">
                      ${currentTotalGroup.toLocaleString()} USD
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] md:text-xs text-gray-500 block">1인 예상가</span>
                    <span className="text-xs sm:text-sm md:text-base font-black text-gold-600">
                      ${currentTotalPerPerson.toLocaleString()} (약 {(currentTotalPerPerson * USD_TO_KRW).toLocaleString()}원)
                    </span>
                  </div>
                </div>
              </div>

              {/* Image Preview (if captured) */}
              {capturedImageUrl && (
                <div className="p-3 md:p-4 bg-gray-50 rounded-2xl border border-gray-200 text-left w-full max-w-full overflow-hidden box-border">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[11px] md:text-xs font-bold text-gray-700">📸 캡처된 견적서 이미지 미리보기</span>
                    <span className="text-[10px] md:text-xs text-emerald-600 font-bold">✓ 다운로드 완료</span>
                  </div>
                  <div className="max-h-36 md:max-h-48 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-inner">
                    <img src={capturedImageUrl} alt="Quotation Capture" className="w-full object-top" />
                  </div>
                </div>
              )}

              {/* Instructions Steps */}
              <div className="bg-amber-50 rounded-2xl p-3 md:p-4 border border-amber-200/80 text-left text-xs md:text-sm space-y-1.5 text-amber-900 w-full max-w-full box-border">
                <div className="font-bold flex items-center gap-1 md:text-sm">
                  <span>💡</span> 카카오톡 상담창에서 보내는 방법:
                </div>
                <div className="text-[11px] md:text-xs text-amber-800 leading-relaxed pl-3.5 space-y-1 list-decimal">
                  <div>1. 아래 <strong>[카카오톡 오픈채팅방 바로가기]</strong>를 누릅니다.</div>
                  <div>2. 상담창에 <strong>붙여넣기 (길게 눌러 붙여넣기 또는 Ctrl+V)</strong>를 하시면 복사된 견적 텍스트가 전송됩니다.</div>
                  <div>3. 갤러리에 저장된 <strong>견적서 이미지(PNG)</strong>를 함께 전송해 주시면 더욱 빠른 상담이 가능합니다!</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1 w-full max-w-full box-border">
                <button
                  type="button"
                  onClick={() => {
                    window.open('https://open.kakao.com/o/gprQnKSi', '_blank');
                  }}
                  className="w-full py-4 md:py-4.5 bg-[#FEE500] text-[#191919] font-black rounded-2xl hover:bg-[#FDD835] transition shadow-lg text-xs sm:text-sm md:text-base flex items-center justify-center gap-2 active:scale-95 cursor-pointer box-border"
                >
                  <span>💬</span>
                  <span>카카오톡 오픈채팅방 바로가기</span>
                </button>

                <div className="grid grid-cols-2 gap-2 w-full max-w-full box-border">
                  <button
                    type="button"
                    onClick={() => handleDownloadImage(capturedImageUrl)}
                    className="py-3 md:py-3.5 bg-gray-100 text-gray-800 font-bold rounded-2xl hover:bg-gray-200 transition text-xs md:text-sm flex items-center justify-center gap-1 active:scale-95 cursor-pointer"
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
                    className="py-3 md:py-3.5 bg-gray-100 text-gray-800 font-bold rounded-2xl hover:bg-gray-200 transition text-xs md:text-sm flex items-center justify-center gap-1 active:scale-95 cursor-pointer"
                  >
                    <span>📋</span>
                    <span>텍스트 다시 복사</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowKakaoModal(false)}
                  className="w-full py-2.5 text-gray-400 font-bold hover:text-gray-600 transition text-xs md:text-sm cursor-pointer"
                >
                  닫기
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: QUOTATION CAPTURE & SAVE MODAL (SAME FORM AS 1:1 ONLINE INQUIRY) ================= */}
      {showImagePreviewModal && (
        <div 
          className="fixed inset-0 bg-black/75 z-[10002] flex items-center justify-center p-0 sm:p-4 backdrop-blur-sm animate-fade-in overflow-hidden select-text font-sans break-keep"
          style={{ touchAction: 'pan-y', overscrollBehaviorX: 'none' }}
        >
          <div 
            className="bg-white rounded-none sm:rounded-3xl max-w-none sm:max-w-lg w-full max-w-full h-full sm:h-auto max-h-none sm:max-h-[92vh] relative shadow-2xl animate-scale-in flex flex-col overflow-hidden box-border"
            style={{ touchAction: 'pan-y', overscrollBehaviorX: 'none' }}
          >
            {/* Modal Header with Back Button (Edge-to-edge pinned on top) */}
            <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-3.5 border-b border-gray-100 bg-white sticky top-0 z-30 shrink-0">
              <button
                type="button"
                onClick={() => setShowImagePreviewModal(false)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition active:scale-95 cursor-pointer"
                aria-label="뒤로 가기"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
                <span>뒤로 가기</span>
              </button>
              
              <div className="text-center">
                <span className="font-extrabold text-sm sm:text-base md:text-lg text-deepgreen">정식 견적서 캡처 및 저장</span>
              </div>

              <button
                type="button"
                onClick={() => setShowImagePreviewModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition cursor-pointer"
                aria-label="닫기"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div 
              className="flex-1 overflow-y-auto px-4 py-3 sm:px-6 sm:py-4 md:px-7 md:py-5 space-y-3.5 text-xs md:text-sm w-full max-w-full box-border"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 bg-gold-100 text-gold-900 text-[10px] md:text-xs font-black rounded-md shrink-0">공식 견적서 발행</span>
                <span className="text-xs md:text-sm text-gray-400 font-semibold">망고투어 정식 A4 규격 (PDF 양식)</span>
              </div>
              <h3 className="text-lg sm:text-xl md:text-2xl font-black text-deepgreen">골프 투어 정식 견적서 저장</h3>
              <p className="text-xs md:text-sm text-gray-500 break-keep">설정하신 예약 정보와 맞춤 일정이 반영된 정식 규격 견적서입니다.</p>

              {/* Captured Screenshot Preview Thumbnail (A4 PDF Form) */}
              {capturedImageUrl && (
                <div className="p-3 md:p-4 bg-gray-50 rounded-2xl border border-gray-200 w-full max-w-full overflow-hidden box-border">
                  <div className="flex justify-between items-center mb-1.5 flex-wrap gap-1">
                    <span className="text-[11px] md:text-xs font-bold text-gray-800 flex items-center gap-1">
                      <span>📄</span> 캡처된 정식 A4 견적서 (PDF 양식) 미리보기
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleDownloadPDF(capturedImageUrl)}
                        className="text-[10px] md:text-xs text-gold-700 font-bold hover:underline cursor-pointer"
                      >
                        📄 PDF 다운로드
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadImage(capturedImageUrl)}
                        className="text-[10px] md:text-xs text-deepgreen font-bold hover:underline cursor-pointer"
                      >
                        📥 이미지 저장
                      </button>
                    </div>
                  </div>
                  <div className="max-h-48 md:max-h-60 overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-inner p-1">
                    <img src={capturedImageUrl} alt="A4 Quotation Preview" className="w-full object-top" />
                  </div>
                </div>
              )}

              <div className="w-full max-w-full">
                <label className="font-bold text-gray-700 block mb-1 md:text-sm">예약자 성함 / 대표자명</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="홍길동"
                  className="w-full max-w-full box-border p-3 md:p-3.5 bg-gray-50 border border-gray-200 rounded-xl font-medium outline-none focus:border-gold-500 focus:bg-white text-sm md:text-base"
                />
              </div>

              <div className="w-full max-w-full">
                <label className="font-bold text-gray-700 block mb-1 md:text-sm">연락처 또는 카카오톡 ID</label>
                <input
                  type="text"
                  value={customerContact}
                  onChange={(e) => setCustomerContact(e.target.value)}
                  placeholder="010-1234-5678 또는 카카오톡ID"
                  className="w-full max-w-full box-border p-3 md:p-3.5 bg-gray-50 border border-gray-200 rounded-xl font-medium outline-none focus:border-gold-500 focus:bg-white text-sm md:text-base"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 w-full max-w-full box-border">
                <div className="min-w-0">
                  <label className="font-bold text-gray-700 block mb-1 md:text-sm">인원 수</label>
                  <input
                    type="number"
                    min="1"
                    value={personCount}
                    onChange={(e) => setPersonCount(parseInt(e.target.value) || 1)}
                    className="w-full max-w-full box-border p-3 md:p-3.5 bg-gray-50 border border-gray-200 rounded-xl font-medium outline-none focus:border-gold-500 focus:bg-white text-sm md:text-base"
                  />
                </div>
                <div className="min-w-0">
                  <label className="font-bold text-gray-700 block mb-1 md:text-sm">출발 희망일</label>
                  <input
                    type="date"
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)}
                    className="w-full max-w-full box-border p-3 md:p-3.5 bg-gray-50 border border-gray-200 rounded-xl font-medium outline-none focus:border-gold-500 focus:bg-white text-sm md:text-base"
                  />
                </div>
              </div>

              <div className="w-full max-w-full">
                <label className="font-bold text-gray-700 block mb-1 md:text-sm">추가 요청사항 (선택)</label>
                <textarea
                  rows={2}
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  placeholder="티타임 시간대, 선호 호텔 유형, 클럽 렌탈 여부 등"
                  className="w-full max-w-full box-border p-3 md:p-3.5 bg-gray-50 border border-gray-200 rounded-xl font-medium outline-none focus:border-gold-500 focus:bg-white resize-none text-sm md:text-base"
                />
              </div>

              <div className="p-3.5 md:p-4 bg-emerald-50 rounded-xl border border-emerald-200 flex justify-between items-center w-full max-w-full box-border">
                <div className="min-w-0 mr-2">
                  <span className="text-[10px] md:text-xs text-emerald-700 block font-semibold">총 {personCount}인 예상 견적</span>
                  <div className="font-black text-emerald-900 text-base sm:text-lg md:text-xl tracking-tight">
                    ${currentTotalGroup.toLocaleString()} <span className="text-xs md:text-sm font-semibold">USD</span>
                  </div>
                  <div className="text-[11px] md:text-xs text-emerald-700 font-medium">
                    (약 {(currentTotalGroup * USD_TO_KRW).toLocaleString()}원)
                  </div>
                </div>
                <div className="text-[10px] md:text-xs text-emerald-700 font-bold bg-white px-2.5 py-1 rounded-lg border border-emerald-200 shrink-0">
                  선택 {selectedOptionIds.size}개
                </div>
              </div>
            </div>

            {/* Sticky Pinned Bottom Action Bar */}
            <div 
              className="bg-white/95 backdrop-blur-md px-4 py-3 sm:px-6 sm:py-3.5 md:px-7 md:py-4 border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] shrink-0 z-30 space-y-2"
              style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 0.75rem)' }}
            >
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleDownloadPDF(capturedImageUrl)}
                  className="w-full py-3.5 md:py-4 bg-gradient-to-r from-gold-500 to-amber-600 hover:from-gold-600 hover:to-amber-700 text-white font-extrabold rounded-2xl shadow-md text-xs sm:text-sm md:text-base active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer transition"
                >
                  <span>📄</span>
                  <span>A4 PDF 다운로드</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadImage(capturedImageUrl)}
                  className="w-full py-3.5 md:py-4 bg-deepgreen hover:bg-[#00382e] text-white font-black rounded-2xl shadow-md text-xs sm:text-sm md:text-base active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer transition"
                >
                  <span>📥</span>
                  <span>이미지(PNG) 저장</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowImagePreviewModal(false);
                    setShowKakaoModal(true);
                  }}
                  className="w-full py-3 md:py-3.5 bg-[#FEE500] hover:bg-[#FDD835] text-[#191919] font-black rounded-xl text-xs sm:text-sm active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer transition shadow-xs"
                >
                  <span>💬</span>
                  <span>카카오톡 문의</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowImagePreviewModal(false);
                    setShowInquiryModal(true);
                  }}
                  className="w-full py-3 md:py-3.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 font-bold rounded-xl text-xs sm:text-sm active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer transition"
                >
                  <span>📧</span>
                  <span>1:1 이메일 신청</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 4: INTERACTIVE DAY-BY-DAY GOLF COURSE PICKER MODAL ================= */}
      {showGolfModal && (
        <div className="fixed inset-0 bg-black/75 z-[10002] flex items-center justify-center p-0 sm:p-4 backdrop-blur-sm animate-fade-in overflow-hidden font-sans break-keep">
          <div className="bg-white rounded-none sm:rounded-3xl max-w-none sm:max-w-3xl w-full h-full sm:h-auto max-h-none sm:max-h-[92vh] p-0 sm:p-7 relative shadow-2xl animate-scale-in m-0 sm:my-6 flex flex-col overflow-hidden">
            
            {/* Modal Header - Edge-to-edge pinned on mobile */}
            <div className="flex items-start justify-between px-3.5 py-3 sm:px-0 sm:py-0 sm:pb-4 border-b border-gray-100 bg-white sticky top-0 z-10">
              <div>
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] md:text-xs font-bold rounded-md">나만의 일정 설계</span>
                  <span className="text-[11px] sm:text-xs md:text-sm text-gray-400">선택 즉시 견적 및 4박5일 일정표 동시 반영</span>
                </div>
                <h3 className="text-base sm:text-xl md:text-2xl font-extrabold text-deepgreen flex items-center gap-1.5 sm:gap-2">
                  <span>⛳</span> 일정별 골프장 직접 변경 & 선택
                </h3>
                <p className="text-[11px] sm:text-xs md:text-sm text-gray-500 mt-0.5 leading-snug">
                  각 라운딩 일자별로 원하시는 골프장을 직접 지정하세요. 호치민, 붕따우, 달랏 등 명문 골프장 풀에서 자유롭게 변경 가능합니다.
                </p>
              </div>
              <button
                onClick={() => setShowGolfModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition shrink-0 ml-2 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Content Body - Edge-to-edge padding on mobile */}
            <div className="overflow-y-auto flex-1 px-3 sm:px-0 space-y-4 py-3 sm:py-4 md:py-5">

              {/* Step 1: Select Round / Day to Modify */}
              <div>
                <label className="text-xs md:text-sm font-black text-gray-800 block mb-2 flex items-center justify-between">
                  <span>1️⃣ 변경할 라운딩 회차 선택 (클릭하여 해당 날짜의 코스 변경)</span>
                  <span className="text-[10px] md:text-xs text-emerald-700 font-bold">
                    현재 수정 대상: {activeRoundIndex + 1}회차 ({activeRoundIndex + 2}일차)
                  </span>
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {customGolfCourses.map((courseName, rIdx) => {
                    const isCurrentActive = activeRoundIndex === rIdx;
                    return (
                      <button
                        key={rIdx}
                        type="button"
                        onClick={() => setActiveRoundIndex(rIdx)}
                        className={`p-3 md:p-3.5 rounded-2xl border text-left transition relative flex flex-col justify-between cursor-pointer ${
                          isCurrentActive
                            ? 'bg-deepgreen text-white border-deepgreen shadow-md ring-2 ring-emerald-400/40'
                            : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-800'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-[10px] md:text-xs font-black px-1.5 py-0.5 rounded ${
                              isCurrentActive ? 'bg-white/20 text-gold-300' : 'bg-gray-200 text-gray-700'
                            }`}>
                              Day {rIdx + 2} • {rIdx + 1}회차
                            </span>
                            {isCurrentActive && (
                              <span className="text-[10px] md:text-xs text-gold-300 font-bold">선택 중 ✏️</span>
                            )}
                          </div>
                          <div className={`font-bold text-xs md:text-sm line-clamp-1 ${isCurrentActive ? 'text-white' : 'text-gray-900'}`}>
                            {courseName}
                          </div>
                        </div>
                        <div className={`text-[10px] md:text-xs mt-2 pt-1 border-t ${
                          isCurrentActive ? 'border-white/20 text-emerald-200' : 'border-gray-200 text-gray-400'
                        }`}>
                          클릭하여 코스 변경
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Location Filter Tabs */}
              <div>
                <label className="text-xs md:text-sm font-black text-gray-800 block mb-2">
                  2️⃣ 지역 필터 선택 ({golfLocationFilter})
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {['전체', '호치민', '붕따우', '달랏'].map((loc) => {
                    const count = loc === '전체' 
                      ? pool.golfCourses.length 
                      : pool.golfCourses.filter(g => g.location === loc || g.location.includes(loc)).length;
                    const isActive = golfLocationFilter === loc;
                    return (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => setGolfLocationFilter(loc)}
                        className={`px-3 py-1.5 md:px-4 md:py-2 rounded-xl text-xs md:text-sm font-bold transition flex items-center gap-1.5 cursor-pointer ${
                          isActive
                            ? 'bg-deepgreen text-white shadow-sm'
                            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }`}
                      >
                        <span>{loc}</span>
                        <span className={`text-[10px] md:text-xs px-1.5 py-0.2 rounded-full ${
                          isActive ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
                        }`}>
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 3: Golf Course Selection Cards */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs md:text-sm font-black text-gray-800">
                    3️⃣ {activeRoundIndex + 1}회차 라운딩에 배정할 골프장 선택 (클릭 즉시 적용)
                  </label>
                  <span className="text-[10px] md:text-xs text-gray-400">
                    {getAvailableGolfCourses().length}개 골프장 이용 가능
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {getAvailableGolfCourses().map((course) => {
                    const isAssignedToActiveRound = customGolfCourses[activeRoundIndex] === course.name;
                    const assignedRounds = customGolfCourses
                      .map((c, i) => c === course.name ? i + 1 : null)
                      .filter((n): n is number => n !== null);

                    return (
                      <div
                        key={course.id}
                        onClick={() => {
                          const updated = [...customGolfCourses];
                          updated[activeRoundIndex] = course.name;
                          setCustomGolfCourses(updated);
                          showToast(`⛳ ${activeRoundIndex + 1}회차 코스가 '${course.name.split(' ')[0]}'으로 변경되었습니다.`);
                        }}
                        className={`p-3.5 md:p-4 rounded-2xl border text-xs md:text-sm cursor-pointer transition flex flex-col justify-between ${
                          isAssignedToActiveRound
                            ? 'bg-emerald-50/90 border-emerald-500 ring-2 ring-emerald-400 shadow-md'
                            : 'bg-white hover:bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <div className="flex items-center gap-1.5">
                              <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 text-[10px] md:text-xs font-bold rounded">
                                {course.location}
                              </span>
                              <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] md:text-xs font-bold rounded">
                                {course.holes}
                              </span>
                            </div>
                            {course.badge && (
                              <span className="px-1.5 py-0.5 bg-gold-100 text-gold-800 text-[10px] md:text-xs font-bold rounded">
                                {course.badge}
                              </span>
                            )}
                          </div>

                          <h4 className="font-black text-sm md:text-base text-gray-900 mt-1">
                            {course.name}
                          </h4>
                          {course.description && (
                            <p className="text-[11px] md:text-xs text-gray-500 leading-snug mt-1 line-clamp-2">
                              {course.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-gray-100">
                          <div>
                            <span className="text-[10px] md:text-xs text-gray-400 block font-medium">1인 기준 차액</span>
                            <span className={`text-xs md:text-sm font-black ${
                              course.priceDeltaUSD === 0 
                                ? 'text-gray-600' 
                                : course.priceDeltaUSD > 0 
                                ? 'text-emerald-700' 
                                : 'text-blue-600'
                            }`}>
                              {course.priceDeltaUSD === 0 
                                ? '기본 코스 ($0)' 
                                : course.priceDeltaUSD > 0 
                                ? `+$${course.priceDeltaUSD}/인` 
                                : `-$${Math.abs(course.priceDeltaUSD)}/인`}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {assignedRounds.length > 0 && (
                              <span className="text-[10px] md:text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded-lg font-bold">
                                {assignedRounds.join(', ')}회차 배정됨
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const updated = [...customGolfCourses];
                                updated[activeRoundIndex] = course.name;
                                setCustomGolfCourses(updated);
                                showToast(`⛳ ${activeRoundIndex + 1}회차 코스가 '${course.name.split(' ')[0]}'으로 변경되었습니다.`);
                              }}
                              className={`px-3 py-1.5 md:px-3.5 md:py-2 rounded-xl font-bold text-xs md:text-sm transition cursor-pointer ${
                                isAssignedToActiveRound
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-gray-100 hover:bg-deepgreen hover:text-white text-gray-700'
                              }`}
                            >
                              {isAssignedToActiveRound ? '✓ 선택됨' : '이 코스로 배정'}
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Modal Footer - Edge-to-edge pinned on mobile */}
            <div className="px-3.5 py-3 sm:px-0 sm:py-0 sm:pt-4 border-t border-gray-100 bg-white sticky bottom-0 z-10 flex flex-col sm:flex-row justify-between items-center gap-3 shadow-md sm:shadow-none">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div>
                  <span className="text-[10px] md:text-xs text-gray-400 block">골프장 총 변경 차액 (1인 기준)</span>
                  <span className={`text-sm md:text-base font-black ${
                    getGolfDeltaTotal() === 0 ? 'text-gray-700' : getGolfDeltaTotal() > 0 ? 'text-emerald-700' : 'text-blue-600'
                  }`}>
                    {getGolfDeltaTotal() === 0 
                      ? '기본 패키지 코스 동일 ($0)' 
                      : getGolfDeltaTotal() > 0 
                      ? `+$${getGolfDeltaTotal()} / 1인` 
                      : `-$${Math.abs(getGolfDeltaTotal())} / 1인`}
                  </span>
                </div>

                {isGolfCoursesModified && (
                  <button
                    type="button"
                    onClick={() => {
                      if (activePackage) {
                        setCustomGolfCourses([...activePackage.golfCourses]);
                        showToast('🔄 기본 추천 골프장 코스로 초기화되었습니다.');
                      }
                    }}
                    className="px-2.5 py-1.5 md:px-3 md:py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs md:text-sm font-bold rounded-xl transition cursor-pointer"
                  >
                    기본 코스로 복원
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setShowGolfModal(false)}
                  className="flex-1 sm:flex-initial px-5 py-3 md:px-6 md:py-3.5 bg-deepgreen text-white font-black text-xs sm:text-sm md:text-base rounded-2xl hover:bg-[#00382e] transition shadow-md active:scale-95 cursor-pointer"
                >
                  선택 완료 및 견적 적용 ✓
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ================= MODAL 5: DEDICATED CUSTOM OPTION POPUP MODAL (HOTEL, VEHICLE, GUIDE, MEAL, ETC.) ================= */}
      {customizingOption && (
        <div className="fixed inset-0 bg-black/75 z-[10002] flex items-center justify-center p-0 sm:p-4 backdrop-blur-sm animate-fade-in overflow-hidden font-sans break-keep">
          <div className="bg-white rounded-none sm:rounded-3xl max-w-none sm:max-w-3xl w-full h-full sm:h-auto max-h-none sm:max-h-[92vh] p-0 sm:p-7 relative shadow-2xl animate-scale-in m-0 sm:my-6 flex flex-col overflow-hidden">
            
            {/* Modal Header - Edge-to-edge pinned on mobile */}
            <div className="flex items-start justify-between px-3.5 py-3 sm:px-0 sm:py-0 sm:pb-4 border-b border-gray-100 bg-white sticky top-0 z-10">
              <div>
                <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] md:text-xs font-bold rounded-md">나만의 일정 설계</span>
                  <span className="text-[11px] sm:text-xs md:text-sm text-gray-400">선택 즉시 견적 및 4박5일 일정표 동시 반영</span>
                </div>
                <h3 className="text-base sm:text-xl md:text-2xl font-extrabold text-deepgreen flex items-center gap-1.5 sm:gap-2">
                  <span>
                    {customizingOption.category === 'hotel' ? '🏨' :
                     customizingOption.category === 'vehicle' ? '🚐' :
                     customizingOption.category === 'guide' ? '🧑‍💼' :
                     customizingOption.category === 'meal' ? '🍽️' : '✨'}
                  </span>
                  <span>
                    {customizingOption.category === 'hotel' ? '숙박 형태 직접 변경 & 선택 (호텔 / 풀빌라 / 싱글룸)' :
                     customizingOption.category === 'vehicle' ? '전용 차량 옵션 직접 변경 & 선택 (VIP 리무진 / 전용 밴)' :
                     customizingOption.category === 'guide' ? '전담 가이드 옵션 직접 변경 & 선택 (한국어 가이드 / VIP 의전)' :
                     customizingOption.category === 'meal' ? '식사 구성 직접 변경 & 선택 (씨푸드 만찬 / 로컬 미식 / 자유식)' :
                     `${customizingOption.name} 직접 변경 & 선택`}
                  </span>
                </h3>
                <p className="text-[11px] sm:text-xs md:text-sm text-gray-500 mt-0.5 leading-snug">
                  {customizingOption.category === 'hotel' ? '고객님의 여행 스타일과 일정에 맞춰 고급 호텔, 단독 프라이빗 풀빌라, 싱글룸(1인 1실) 등을 자유롭게 선택하세요.' :
                   customizingOption.category === 'vehicle' ? '여행 인원수와 탑승 스타일에 최적화된 VIP 리무진 밴, 16인승 밴, 대형 버스 등 최적의 전용 차량을 선택할 수 있습니다.' :
                   customizingOption.category === 'guide' ? '한국어 전문 가이드의 밀착 의전 케어 또는 일정 간섭 없는 드라이버 온리 자유 일정을 선택할 수 있습니다.' :
                   customizingOption.category === 'meal' ? '전 일정 최고급 씨푸드 바베큐 만찬, 로컬 숨은 미식 탐방, 또는 자유 식사 중 원하는 플랜을 선택하세요.' :
                   '원하시는 상세 옵션을 선택하시면 견적과 일정이 즉시 실시간으로 반영됩니다.'}
                </p>
              </div>
              <button
                onClick={() => setCustomizingOption(null)}
                className="text-gray-400 hover:text-gray-600 font-bold text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition shrink-0 ml-2"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Content Body - Edge-to-edge padding on mobile */}
            <div className="overflow-y-auto flex-1 px-3 sm:px-0 space-y-4 py-3 sm:py-4">

              {/* Step 1: Current Selection Status Card */}
              <div>
                <label className="text-xs md:text-sm font-black text-gray-800 block mb-2 flex items-center justify-between">
                  <span>1️⃣ 현재 적용 중인 옵션 상태 확인</span>
                  <span className="text-[10px] md:text-xs text-emerald-700 font-bold">
                    카테고리: {customizingOption.category === 'hotel' ? '숙박' : customizingOption.category === 'vehicle' ? '차량' : customizingOption.category === 'guide' ? '가이드' : customizingOption.category === 'meal' ? '식사' : '맞춤 옵션'}
                  </span>
                </label>

                <div className="p-3.5 bg-deepgreen text-white rounded-2xl shadow-sm border border-emerald-500/30 flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] md:text-xs font-black px-2 py-0.5 rounded bg-white/20 text-gold-300">
                        현재 선택됨
                      </span>
                      {customOptionSelections[customizingOption.id]?.badge && (
                        <span className="text-[10px] md:text-xs font-bold text-emerald-200">
                          {customOptionSelections[customizingOption.id].badge}
                        </span>
                      )}
                    </div>
                    <div className="font-bold text-sm md:text-base text-white">
                      {customOptionSelections[customizingOption.id]?.name || customizingOption.name}
                    </div>
                    {customOptionSelections[customizingOption.id]?.description && (
                      <p className="text-[11px] md:text-xs text-gray-300 mt-0.5 line-clamp-1">
                        {customOptionSelections[customizingOption.id].description}
                      </p>
                    )}
                  </div>
                  <div className="text-right shrink-0 pl-3">
                    <span className="text-[10px] md:text-xs text-gold-300 block font-bold">1인 기준 차액</span>
                    <span className="text-base md:text-lg font-black text-white">
                      {customOptionSelections[customizingOption.id]
                        ? (customOptionSelections[customizingOption.id].priceDelta === 0 
                            ? '기본 포함 ($0)' 
                            : customOptionSelections[customizingOption.id].priceDelta > 0 
                            ? `+$${customOptionSelections[customizingOption.id].priceDelta}` 
                            : `-$${Math.abs(customOptionSelections[customizingOption.id].priceDelta)}`)
                        : '기본 포함 ($0)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Step 2: Filters (Region / Type for Hotel or Subcategories) */}
              {customizingOption.category === 'hotel' && (
                <div className="space-y-2">
                  <div>
                    <label className="text-xs md:text-sm font-black text-gray-800 block mb-1.5">
                      2️⃣ 지역 필터 선택 ({optionModalFilter})
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {['전체', '호치민', '붕따우', '달랏'].map((loc) => {
                        const count = loc === '전체' 
                          ? pool.accommodations.length 
                          : pool.accommodations.filter(a => a.location === loc || a.location.includes(loc)).length;
                        const isActive = optionModalFilter === loc;
                        return (
                          <button
                            key={loc}
                            type="button"
                            onClick={() => setOptionModalFilter(loc)}
                            className={`px-3 py-1.5 rounded-xl text-xs md:text-sm font-bold transition flex items-center gap-1.5 ${
                              isActive
                                ? 'bg-deepgreen text-white shadow-sm'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                            }`}
                          >
                            <span>{loc}</span>
                            <span className={`text-[10px] md:text-xs px-1.5 py-0.2 rounded-full ${
                              isActive ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-600'
                            }`}>
                              {count}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Accommodation Type Subfilter */}
                  <div className="pt-1">
                    <label className="text-xs md:text-sm font-black text-gray-800 block mb-1.5">
                      숙박 형태 필터
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { id: '전체', label: '전체 형태' },
                        { id: 'hotel_5star', label: '⭐ 고급 호텔' },
                        { id: 'pool_villa', label: '🏊 프라이빗 독채 풀빌라' },
                        { id: 'hotel_4star', label: '🏬 4성급 부티크 호텔' },
                        { id: 'resort', label: '🏖️ 특급 리조트' },
                      ].map((t) => {
                        const isActive = optionModalTypeFilter === t.id;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setOptionModalTypeFilter(t.id)}
                            className={`px-2.5 py-1 rounded-lg text-xs md:text-sm font-bold transition ${
                              isActive 
                                ? 'bg-gold-500 text-white shadow-xs' 
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                            }`}
                          >
                            {t.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Choice Selection Cards Grid */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs md:text-sm font-black text-gray-800">
                    3️⃣ 배정할 옵션 선택 (클릭 즉시 적용)
                  </label>
                  <span className="text-[10px] md:text-xs text-gray-400">
                    {getModalChoicesForCustomizingOption().length}개 옵션 이용 가능
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {getModalChoicesForCustomizingOption().map((choice) => {
                    const currentSelection = customOptionSelections[customizingOption.id];
                    const isSelected = currentSelection 
                      ? currentSelection.choiceId === choice.id 
                      : (choice.priceDeltaUSD === 0 && choice.badge?.includes('기본'));

                    return (
                      <div
                        key={choice.id}
                        onClick={() => {
                          setCustomOptionSelections(prev => ({
                            ...prev,
                            [customizingOption.id]: {
                              choiceId: choice.id,
                              name: choice.name,
                              priceDelta: choice.priceDeltaUSD,
                              description: choice.description,
                              badge: choice.badge
                            }
                          }));
                          // Automatically ensure checklist item is checked
                          if (!selectedOptionIds.has(customizingOption.id)) {
                            setSelectedOptionIds(prev => new Set(prev).add(customizingOption.id));
                          }
                          showToast(`✨ ${choice.name.split(' ')[0]} 옵션이 선택되었습니다.`);
                        }}
                        className={`p-3.5 rounded-2xl border text-xs cursor-pointer transition flex flex-col justify-between ${
                          isSelected
                            ? 'bg-emerald-50/90 border-emerald-500 ring-2 ring-emerald-400 shadow-md'
                            : 'bg-white hover:bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <div className="flex items-center gap-1.5">
                              {choice.location && (
                                <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 text-[10px] md:text-xs font-bold rounded">
                                  {choice.location}
                                </span>
                              )}
                              <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] md:text-xs font-bold rounded">
                                {choice.type === 'pool_villa' ? '🏊 독채 풀빌라' :
                                 choice.type === 'hotel_5star' ? '⭐ 고급 호텔' :
                                 choice.type === 'hotel_4star' ? '🏬 4성급' :
                                 choice.type === 'resort' ? '🏖️ 리조트' :
                                 choice.type === 'vehicle' ? '🚐 전용 차량' :
                                 choice.type === 'guide' ? '🧑‍💼 가이드' :
                                 choice.type === 'meal' ? '🍽️ 식사' : '맞춤 선택'}
                              </span>
                            </div>
                            {choice.badge && (
                              <span className="px-1.5 py-0.5 bg-gold-100 text-gold-800 text-[10px] md:text-xs font-bold rounded">
                                {choice.badge}
                              </span>
                            )}
                          </div>

                          <h4 className="font-black text-sm md:text-base text-gray-900 mt-1">
                            {choice.name}
                          </h4>
                          {choice.description && (
                            <p className="text-[11px] md:text-xs text-gray-500 leading-snug mt-1 line-clamp-2">
                              {choice.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-gray-100">
                          <div>
                            <span className="text-[10px] md:text-xs text-gray-400 block font-medium">1인 기준 차액</span>
                            <span className={`text-xs md:text-sm font-black ${
                              choice.priceDeltaUSD === 0 
                                ? 'text-gray-600' 
                                : choice.priceDeltaUSD > 0 
                                ? 'text-emerald-700' 
                                : 'text-blue-600'
                            }`}>
                              {choice.priceDeltaUSD === 0 
                                ? '기본 포함 ($0)' 
                                : choice.priceDeltaUSD > 0 
                                ? `+$${choice.priceDeltaUSD}/인` 
                                : `-$${Math.abs(choice.priceDeltaUSD)}/인`}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCustomOptionSelections(prev => ({
                                ...prev,
                                [customizingOption.id]: {
                                  choiceId: choice.id,
                                  name: choice.name,
                                  priceDelta: choice.priceDeltaUSD,
                                  description: choice.description,
                                  badge: choice.badge
                                }
                              }));
                              if (!selectedOptionIds.has(customizingOption.id)) {
                                setSelectedOptionIds(prev => new Set(prev).add(customizingOption.id));
                              }
                              showToast(`✨ ${choice.name.split(' ')[0]} 옵션이 선택되었습니다.`);
                            }}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs md:text-sm transition ${
                              isSelected
                                ? 'bg-emerald-600 text-white'
                                : 'bg-gray-100 hover:bg-deepgreen hover:text-white text-gray-700'
                            }`}
                          >
                            {isSelected ? '✓ 선택됨' : '이 옵션으로 선택'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Modal Footer - Edge-to-edge pinned on mobile */}
            <div className="px-3.5 py-3 sm:px-0 sm:py-0 sm:pt-4 border-t border-gray-100 bg-white sticky bottom-0 z-10 flex flex-col sm:flex-row justify-between items-center gap-3 shadow-md sm:shadow-none">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div>
                  <span className="text-[10px] md:text-xs text-gray-400 block">선택 옵션 변경 차액 (1인 기준)</span>
                  <span className={`text-sm md:text-base font-black ${
                    !customOptionSelections[customizingOption.id] || customOptionSelections[customizingOption.id].priceDelta === 0
                      ? 'text-gray-700'
                      : customOptionSelections[customizingOption.id].priceDelta > 0
                      ? 'text-emerald-700'
                      : 'text-blue-600'
                  }`}>
                    {customOptionSelections[customizingOption.id]
                      ? (customOptionSelections[customizingOption.id].priceDelta === 0 
                          ? '기본 패키지 포함 동일 ($0)' 
                          : customOptionSelections[customizingOption.id].priceDelta > 0 
                          ? `+$${customOptionSelections[customizingOption.id].priceDelta} / 1인` 
                          : `-$${Math.abs(customOptionSelections[customizingOption.id].priceDelta)} / 1인`)
                      : '기본 패키지 포함 동일 ($0)'}
                  </span>
                </div>

                {customOptionSelections[customizingOption.id] && (
                  <button
                    type="button"
                    onClick={() => {
                      setCustomOptionSelections(prev => {
                        const next = { ...prev };
                        delete next[customizingOption.id];
                        return next;
                      });
                      showToast('🔄 기본 추천 옵션으로 복원되었습니다.');
                    }}
                    className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs md:text-sm font-bold rounded-xl transition"
                  >
                    기본값으로 복원
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setCustomizingOption(null)}
                  className="flex-1 sm:flex-initial px-5 py-3 bg-deepgreen text-white font-black text-xs sm:text-sm md:text-base rounded-2xl hover:bg-[#00382e] transition shadow-md active:scale-95"
                >
                  선택 완료 및 견적 적용 ✓
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ================= MODAL 6: DIY COURSE SELECTOR MODAL ================= */}
      {diyChangingRoundIndex !== null && (
        <div className="fixed inset-0 bg-black/75 z-[10002] flex items-center justify-center p-0 sm:p-4 backdrop-blur-sm animate-fade-in overflow-hidden font-sans break-keep">
          <div className="bg-white rounded-none sm:rounded-3xl max-w-none sm:max-w-2xl w-full h-full sm:h-auto max-h-none sm:max-h-[92vh] p-0 sm:p-6 relative shadow-2xl animate-scale-in m-0 sm:my-6 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-3.5 py-3 sm:px-0 sm:py-0 sm:pb-3 border-b border-gray-100 bg-white sticky top-0 z-10">
              <div>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] md:text-xs font-bold rounded-md">
                  {diyChangingRoundIndex + 1}회차 ({diyChangingRoundIndex + 2}일차) 코스 지정
                </span>
                <h3 className="text-base sm:text-lg md:text-xl font-black text-deepgreen mt-1">
                  ⛳ 라운딩할 골프장을 선택하세요
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDiyChangingRoundIndex(null)}
                className="text-gray-400 hover:text-gray-600 font-bold text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-3 sm:px-0 py-3 space-y-2 max-h-[65vh]">
              {pool.golfCourses.map((course) => {
                const isSelected = diyGolfCourses[diyChangingRoundIndex] === course.name;
                return (
                  <div
                    key={course.id}
                    onClick={() => {
                      const updated = [...diyGolfCourses];
                      updated[diyChangingRoundIndex] = course.name;
                      setDiyGolfCourses(updated);
                      setDiyChangingRoundIndex(null);
                      showToast(`⛳ ${course.name.split(' ')[0]} 코스로 변경되었습니다.`);
                    }}
                    className={`p-3 rounded-2xl border cursor-pointer transition flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-400 shadow-xs'
                        : 'bg-white hover:bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-[10px] md:text-xs font-bold rounded">
                          📍 {course.location}
                        </span>
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] md:text-xs font-bold rounded">
                          {course.holes}홀
                        </span>
                        {course.badge && (
                          <span className="px-2 py-0.5 bg-gold-100 text-gold-800 text-[10px] md:text-xs font-bold rounded">
                            {course.badge}
                          </span>
                        )}
                      </div>
                      <h4 className="font-extrabold text-sm md:text-base text-gray-900">{course.name}</h4>
                      <p className="text-[11px] md:text-xs text-gray-500 mt-0.5 line-clamp-1">{course.description}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <button
                        type="button"
                        className={`px-3 py-1.5 rounded-xl text-xs md:text-sm font-bold transition cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-deepgreen hover:text-white'
                        }`}
                      >
                        {isSelected ? '✓ 선택됨' : '이 코스로 선택'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="px-3.5 py-3 sm:px-0 sm:py-0 sm:pt-3 border-t border-gray-100 bg-white sticky bottom-0 z-10 text-right">
              <button
                type="button"
                onClick={() => setDiyChangingRoundIndex(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs md:text-sm font-bold transition cursor-pointer"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 7: DIY STEP 2 SCHEDULE PICKER MODAL (3박4일 ~ 6박7일) ================= */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black/75 z-[10002] flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm animate-fade-in font-sans break-keep">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-6 shadow-2xl animate-scale-in space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md">STEP 2 · 일정 선택</span>
                <h3 className="text-lg font-black text-deepgreen mt-1">📅 여행 일정을 선택해 주세요</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowScheduleModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-1 gap-2.5">
              {[
                { label: '3박 4일', desc: '단기 집중 실속 일정 (추천 라운딩 3회)', nights: 3, rounds: 3 },
                { label: '4박 5일', desc: '가장 인기 있는 표준 일정 (추천 라운딩 3~4회)', nights: 4, rounds: 4 },
                { label: '5박 6일', desc: '여유로운 휴양 & 라운딩 일정 (추천 라운딩 4회)', nights: 5, rounds: 4 },
                { label: '6박 7일', desc: '장기 황제 풀코스 일정 (추천 라운딩 5회)', nights: 6, rounds: 5 },
              ].map((opt) => {
                const isSelected = diyNights === opt.nights;
                return (
                  <button
                    key={opt.nights}
                    type="button"
                    onClick={() => handleSelectSchedule(opt.nights, opt.rounds)}
                    className={`p-4 rounded-2xl border-2 text-left transition flex items-center justify-between gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-400/50 shadow-sm'
                        : 'bg-gray-50 hover:bg-emerald-50/40 border-gray-200'
                    }`}
                  >
                    <div>
                      <div className="font-black text-base text-gray-900">{opt.label}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{opt.desc}</div>
                    </div>
                    <span className={`px-3 py-1 rounded-xl text-xs font-extrabold ${
                      isSelected ? 'bg-deepgreen text-white' : 'bg-white text-gray-600 border border-gray-200'
                    }`}>
                      {isSelected ? '✓ 선택됨' : '선택'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 8: DIY STEP 3 CONDITIONAL POPUP (골프 / 여행) ================= */}
      {showActivityModal === 'golf' && (
        <div className="fixed inset-0 bg-black/75 z-[10002] flex items-center justify-center p-0 sm:p-4 backdrop-blur-sm animate-fade-in overflow-hidden font-sans break-keep">
          <div className="bg-white rounded-none sm:rounded-3xl max-w-none sm:max-w-2xl w-full h-full sm:h-auto max-h-none sm:max-h-[92vh] p-0 sm:p-6 relative shadow-2xl animate-scale-in flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 sm:px-0 sm:pt-0 sm:pb-3 border-b border-gray-100 bg-white sticky top-0 z-10">
              <div>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] md:text-xs font-bold rounded-md">
                  {diyLocation} · {diyNights}박 {diyDays}일 맞춤 골프장 선택
                </span>
                <h3 className="text-base sm:text-lg md:text-xl font-black text-deepgreen mt-1">
                  ⛳ 라운딩 횟수 및 골프장을 선택하세요
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowActivityModal(null)}
                className="text-gray-400 hover:text-gray-600 font-bold text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-4 sm:px-0 py-4 space-y-4">
              {/* Round count selector */}
              <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="text-xs md:text-sm font-black text-gray-900 block">총 라운딩 횟수 ({diyNights}박 {diyDays}일 기준)</span>
                  <span className="text-[11px] text-gray-500">최대 {diyDays}회까지 선택 가능 · {diyRounds * 18}홀</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDIYRoundsChange(diyRounds - 1)}
                    disabled={diyRounds <= 1}
                    className="w-9 h-9 rounded-xl bg-white border border-gray-300 font-black text-gray-800 disabled:opacity-40 cursor-pointer"
                  >
                    -
                  </button>
                  <span className="w-14 text-center font-black text-base text-deepgreen">{diyRounds}회</span>
                  <button
                    type="button"
                    onClick={() => handleDIYRoundsChange(diyRounds + 1)}
                    disabled={diyRounds >= diyDays}
                    className="w-9 h-9 rounded-xl bg-white border border-gray-300 font-black text-gray-800 disabled:opacity-40 cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Round selector tabs */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-gray-700">1) 변경할 회차를 먼저 클릭하세요</span>
                  <button
                    type="button"
                    onClick={() => setShowAllCoursesInGolfModal(prev => !prev)}
                    className="text-[11px] font-bold text-deepgreen underline cursor-pointer"
                  >
                    {showAllCoursesInGolfModal ? `${diyLocation} 골프장만 보기` : '타 지역 골프장도 함께 보기'}
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {diyGolfCourses.slice(0, diyRounds).map((cName, idx) => {
                    const isFocused = activeRoundIndex === idx;
                    const rate = resolveSingleCourseUSD(cName, false);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveRoundIndex(idx)}
                        className={`p-3 rounded-xl border text-left transition flex items-center justify-between gap-2 cursor-pointer ${
                          isFocused
                            ? 'bg-deepgreen text-white border-deepgreen shadow-md'
                            : 'bg-gray-50 hover:bg-gray-100 text-gray-800 border-gray-200'
                        }`}
                      >
                        <div className="min-w-0">
                          <span className={`text-[10px] font-bold block ${isFocused ? 'text-gold-300' : 'text-emerald-700'}`}>
                            {idx + 1}회차 ({idx + 2}일차)
                          </span>
                          <span className="font-extrabold text-xs md:text-sm truncate block">{cName}</span>
                        </div>
                        <span className={`text-xs font-black shrink-0 ${isFocused ? 'text-gold-300' : 'text-deepgreen'}`}>
                          ${rate.weekdayUSD}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Regional Course Pool */}
              <div className="space-y-2">
                <span className="text-xs font-extrabold text-gray-700 block">
                  2) {activeRoundIndex + 1}회차에 배정할 골프장 선택
                </span>
                <div className="space-y-2">
                  {(showAllCoursesInGolfModal ? pool.golfCourses : getRegionalGolfCourses(diyLocation)).map((course) => {
                    const isSelected = diyGolfCourses[activeRoundIndex] === course.name;
                    const price = resolveSingleCourseUSD(course.name, false).weekdayUSD;
                    return (
                      <div
                        key={course.id}
                        onClick={() => {
                          const updated = [...diyGolfCourses];
                          updated[activeRoundIndex] = course.name;
                          setDiyGolfCourses(updated);
                          showToast(`⛳ ${activeRoundIndex + 1}회차: ${course.name.split(' ')[0]} 선택`);
                        }}
                        className={`p-3 rounded-2xl border cursor-pointer transition flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-400 shadow-xs'
                            : 'bg-white hover:bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-[10px] font-bold rounded">
                              📍 {course.location}
                            </span>
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
                              {course.holes}홀
                            </span>
                            {course.badge && (
                              <span className="px-2 py-0.5 bg-gold-100 text-gold-800 text-[10px] font-bold rounded">
                                {course.badge}
                              </span>
                            )}
                          </div>
                          <h4 className="font-extrabold text-sm text-gray-900">{course.name}</h4>
                          <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{course.description}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-xs font-black text-deepgreen mb-1">${price}</div>
                          <span className={`inline-block px-2.5 py-1 rounded-xl text-[11px] font-bold ${
                            isSelected ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {isSelected ? '✓ 선택됨' : '선택'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="px-4 py-3 sm:px-0 sm:pb-0 sm:pt-3 border-t border-gray-100 bg-white sticky bottom-0 z-10 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowActivityModal(null)}
                className="w-full sm:w-auto px-6 py-3 bg-deepgreen hover:bg-[#00382e] text-white rounded-2xl text-sm font-black shadow-md cursor-pointer"
              >
                선택 완료 & 적용 ✓
              </button>
            </div>
          </div>
        </div>
      )}

      {showActivityModal === 'tour' && (
        <div className="fixed inset-0 bg-black/75 z-[10002] flex items-center justify-center p-0 sm:p-4 backdrop-blur-sm animate-fade-in overflow-hidden font-sans break-keep">
          <div className="bg-white rounded-none sm:rounded-3xl max-w-none sm:max-w-2xl w-full h-full sm:h-auto max-h-none sm:max-h-[92vh] p-0 sm:p-6 relative shadow-2xl animate-scale-in flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 sm:px-0 sm:pt-0 sm:pb-3 border-b border-gray-100 bg-white sticky top-0 z-10">
              <div>
                <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] md:text-xs font-bold rounded-md">
                  {diyLocation} · {diyNights}박 {diyDays}일 여행 상품 선택
                </span>
                <h3 className="text-base sm:text-lg md:text-xl font-black text-deepgreen mt-1">
                  🧳 자유 여행 또는 추천 관광 상품을 선택하세요
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowActivityModal(null)}
                className="text-gray-400 hover:text-gray-600 font-bold text-xl w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-4 sm:px-0 py-4 space-y-2.5">
              {activeRegionTourOptions.map((item) => {
                const isSelected = diySelectedTourIds.includes(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => handleToggleTourOption(item.id, item.isFreeTravel)}
                    className={`p-3.5 rounded-2xl border-2 cursor-pointer transition flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-400/50 shadow-xs'
                        : 'bg-white hover:bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                          item.isFreeTravel ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {item.isFreeTravel ? '✨ 자유 일정' : `📍 ${item.location}`}
                        </span>
                        {item.badge && (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <h4 className="font-extrabold text-sm md:text-base text-gray-900">{item.name}</h4>
                      <p className="text-[11px] md:text-xs text-gray-500 mt-0.5">{item.description}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-sm font-black text-deepgreen mb-1">
                        {item.priceUSD > 0 ? `$${item.priceUSD}/인` : '자유 ($0)'}
                      </div>
                      <span className={`inline-block px-3 py-1 rounded-xl text-xs font-bold ${
                        isSelected ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {isSelected ? '✓ 선택됨' : '선택'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="px-4 py-3 sm:px-0 sm:pb-0 sm:pt-3 border-t border-gray-100 bg-white sticky bottom-0 z-10 flex items-center justify-between gap-3">
              <div className="text-xs text-gray-500 font-medium">
                자유 여행 또는 {diyLocation} 지역 상품을 복수 선택할 수 있습니다.
              </div>
              <button
                type="button"
                onClick={() => setShowActivityModal(null)}
                className="px-6 py-3 bg-deepgreen hover:bg-[#00382e] text-white rounded-2xl text-sm font-black shadow-md cursor-pointer shrink-0"
              >
                선택 완료 & 적용 ✓
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= HIDDEN A4 PDF FORM CANVAS (For High-Res html2canvas Capture) ================= */}
      {activePackage && (
        <div
          ref={a4QuotationPrintRef}
          aria-hidden="true"
          style={{
            position: 'fixed',
            left: '-9999px',
            top: 0,
            width: '794px',
            backgroundColor: '#ffffff',
            zIndex: -9999,
            pointerEvents: 'none',
          }}
        >
          <A4QuotationDocument
            customerName={customerName || '고객'}
            personCount={personCount}
            managerName="망고투어 전문 상담팀"
            managerContact="+84 37 720 4451 (카카오: vnseen1)"
            location={activePackage.location}
            duration={activePackage.duration}
            departureDate={departureDate}
            totalPriceUSD={currentTotalGroup}
            totalPriceKRW={currentTotalGroup * USD_TO_KRW}
            costItems={getA4CostItems()}
            itinerary={getA4ItineraryDays()}
            notes={customerNotes}
            showControls={false}
          />
        </div>
      )}

    </div>
  );
};

export default TripPlanner;
