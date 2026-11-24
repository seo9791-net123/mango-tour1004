import React, { useState, useRef, useEffect } from 'react';
import { CustomTripPackage, PackageOptionItem, MasterOptionPool, Product } from '../types';
import { INITIAL_MASTER_OPTION_POOL } from '../constants';
import BackButton from './BackButton';
import { A4QuotationDocument, CostItem, ItineraryDay, ReservationNoticeData } from './A4QuotationDocument';
import { getFreshImageUrl, isImageIconUrl } from '../utils/imageUtils';
import {
  generateQuotationPdf,
  triggerBlobDownload,
} from '../utils/quotationExportUtils';
import { submitQuotationWithPdf } from '../services/quotationSubmitService';
import { appAlert } from '../services/dialogService';
import { sanitizeNonGolfPriceText } from '../utils/costBreakdownUtils';
import { useQuotationMobileLock } from '../utils/useQuotationMobileLock';

interface Props {
  packages?: CustomTripPackage[];
  masterOptionPool?: MasterOptionPool;
  products?: Product[];
  onBack: () => void;
  isAdmin?: boolean;
  isLoggedIn?: boolean;
  onRequireLogin?: () => Promise<boolean>;
  showDetailedCosts?: boolean;
  onToggleAdminDetailedCosts?: (show: boolean) => void;
}

type DinnerMenuOption = NonNullable<MasterOptionPool['dinnerOptions']>[number];

const getDinnerMenusForRegion = (pool: MasterOptionPool, loc: string): DinnerMenuOption[] => {
  const allMenus = pool.dinnerOptions?.length
    ? pool.dinnerOptions
    : (INITIAL_MASTER_OPTION_POOL.dinnerOptions || []);
  const matched = allMenus.filter(
    item => item.location === loc || loc.includes(item.location) || item.location.includes(loc)
  );
  const fallback = allMenus.filter(item => item.location === '호치민');
  return (matched.length > 0 ? matched : fallback).slice(0, 6);
};

const REGION_COVER_IMAGES: Record<string, string> = {
  '호치민': '/images/products/hcm-tour-city.jpg',
  '붕따우': '/images/products/vungtau-tour-beach.jpg',
  '무이네': '/images/products/muine-tour-dunes.jpg',
  '나트랑': '/images/products/nhatrang-tour-bay.jpg',
  '달랏': '/images/products/dalat-tour-garden.jpg',
};

export const TripPlanner: React.FC<Props> = ({
  masterOptionPool,
  products = [],
  onBack,
  isAdmin = false,
  isLoggedIn = true,
  onRequireLogin,
  showDetailedCosts = false,
  onToggleAdminDetailedCosts,
}) => {
  const pool = masterOptionPool || INITIAL_MASTER_OPTION_POOL;
  const ensureMemberLoginForQuotation = async (): Promise<boolean> => {
    if (isLoggedIn) return true;
    if (onRequireLogin) {
      return await onRequireLogin();
    }
    await appAlert(
      '견적서 미리보기, 저장 및 신청은 로그인 회원 전용 서비스입니다. 로그인 후 이용해 주세요.',
      {
        title: '회원 전용 안내',
        tone: 'info',
        confirmText: '확인',
      }
    );
    return false;
  };
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
  const [showQuotePreviewModal, setShowQuotePreviewModal] = useState<boolean>(false);
  const [inquirySuccess, setInquirySuccess] = useState<boolean>(false);
  const [inquiryError, setInquiryError] = useState<string | null>(null);
  const [submissionNotice, setSubmissionNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSubmittingEmail, setIsSubmittingEmail] = useState<boolean>(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);
  const [copyToast, setCopyToast] = useState<string | null>(null);
  const [viewTab, setViewTab] = useState<'options' | 'itinerary'>('options');
  const [showScheduleModal, setShowScheduleModal] = useState<boolean>(false);
  const [showActivityModal, setShowActivityModal] = useState<'golf' | 'tour' | null>(null);
  const [showHotelModal, setShowHotelModal] = useState<boolean>(false);
  const [showVehicleModal, setShowVehicleModal] = useState<boolean>(false);
  const [showDinnerModal, setShowDinnerModal] = useState<boolean>(false);

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
    if (showHotelModal) {
      setShowHotelModal(false);
      return;
    }
    if (showVehicleModal) {
      setShowVehicleModal(false);
      return;
    }
    if (showDinnerModal) {
      setShowDinnerModal(false);
      return;
    }
    if (showQuotePreviewModal) {
      setShowQuotePreviewModal(false);
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
      if (showHotelModal) {
        setShowHotelModal(false);
        e?.detail?.handled?.();
        return;
      }
      if (showVehicleModal) {
        setShowVehicleModal(false);
        e?.detail?.handled?.();
        return;
      }
      if (showDinnerModal) {
        setShowDinnerModal(false);
        e?.detail?.handled?.();
        return;
      }
      if (showQuotePreviewModal) {
        setShowQuotePreviewModal(false);
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
  }, [showScheduleModal, showActivityModal, showHotelModal, showVehicleModal, showDinnerModal, showQuotePreviewModal, showGolfModal, customizingOption, showKakaoModal, showInquiryModal, activePackage]);

  // Live Pools synced from AdminDashboard (with safe fallbacks)
  const diyRegions = pool.diyRegions?.length ? pool.diyRegions : (INITIAL_MASTER_OPTION_POOL.diyRegions || []);
  const diyAccommodations = pool.accommodationTiers?.length ? pool.accommodationTiers : (INITIAL_MASTER_OPTION_POOL.accommodationTiers || []);
  const diyVehicles = pool.vehicles?.length ? pool.vehicles : INITIAL_MASTER_OPTION_POOL.vehicles;
  const diyTourPool = pool.tourOptions?.length ? pool.tourOptions : (INITIAL_MASTER_OPTION_POOL.tourOptions || []);
  const diyExtraServices = pool.extraServices?.length ? pool.extraServices : (INITIAL_MASTER_OPTION_POOL.extraServices || []);

  // DIY Trip Builder States (6-Step Flow)
  const [diyLocation, setDiyLocation] = useState<string>(diyRegions[0]?.name || '호치민');
  const [failedRegionImageIds, setFailedRegionImageIds] = useState<Record<string, boolean>>({});
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
  const [diyIncludeHotel, setDiyIncludeHotel] = useState<boolean>(true);
  const [diyVehicleType, setDiyVehicleType] = useState<string>(
    diyVehicles.find(v => v.shortName === '9인승' || v.id === 'veh-1')?.id || diyVehicles[0]?.id || 'veh-1'
  );
  const [diyIncludeVehicle, setDiyIncludeVehicle] = useState<boolean>(true);
  const [diySelectedExtraIds, setDiySelectedExtraIds] = useState<string[]>(() =>
    diyExtraServices.filter(e => e.defaultSelected).map(e => e.id)
  );
  // Day-by-day dinner selections (day 1..diyNights -> DinnerMenuOption.id, empty = 미포함)
  const [diyDinnerSelections, setDiyDinnerSelections] = useState<Record<number, string>>({});
  const [activeDinnerDay, setActiveDinnerDay] = useState<number>(1);

  // Step Modal Helpers
  const [diyChangingRoundIndex, setDiyChangingRoundIndex] = useState<number | null>(null);
  const [showAllCoursesInGolfModal, setShowAllCoursesInGolfModal] = useState<boolean>(false);

  const isAnyModalOpen = Boolean(
    showQuotePreviewModal ||
    showInquiryModal ||
    showKakaoModal ||
    showGolfModal ||
    customizingOption ||
    diyChangingRoundIndex !== null ||
    showScheduleModal ||
    showActivityModal ||
    showHotelModal ||
    showVehicleModal ||
    showDinnerModal ||
    submissionNotice
  );

  useEffect(() => {
    if (!isAnyModalOpen) return;
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
  }, [isAnyModalOpen]);

  useQuotationMobileLock(Boolean(showQuotePreviewModal));

  const diyDays = diyNights + 1;

  // Resolve currently active items safely (handles Admin edits/deletions cleanly)
  const selectedRegionItem = diyRegions.find(r => r.name === diyLocation) || diyRegions[0];
  const selectedHotelTier = diyAccommodations.find(a => a.id === diyHotelType) || diyAccommodations[0];
  const selectedVehicleItem = diyVehicles.find(v => v.id === diyVehicleType) || diyVehicles[0];
  const activeRegionDinnerMenus = getDinnerMenusForRegion(pool, diyLocation);
  const selectedDinnerEntries = Array.from({ length: diyNights }, (_, idx) => idx + 1)
    .map(day => {
      const menuId = diyDinnerSelections[day];
      if (!menuId) return null;
      const menu = activeRegionDinnerMenus.find(m => m.id === menuId);
      return menu ? { day, menu } : null;
    })
    .filter((entry): entry is { day: number; menu: DinnerMenuOption } => entry !== null);
  const dinnerCount = selectedDinnerEntries.length;
  const dinnerPerPersonTotal = selectedDinnerEntries.reduce((sum, entry) => sum + entry.menu.priceUSD, 0);

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

    // Reset region-specific dinner selections when region changes
    setDiyDinnerSelections({});
    setActiveDinnerDay(1);
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
    setDiyDinnerSelections(prev => {
      const pruned: Record<number, string> = {};
      Object.entries(prev).forEach(([dayStr, menuId]) => {
        const dayNum = Number(dayStr);
        if (dayNum >= 1 && dayNum <= nights) {
          pruned[dayNum] = menuId;
        }
      });
      return pruned;
    });
    setActiveDinnerDay(prev => Math.min(prev, nights));
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

  // Real-time DIY Estimated Price Breakdown (Synced to AdminDashboard pools)
  // 차량 및 가이드는 팀(일정 일수) 기준 총액이며, 인원수를 절대 곱하지 않음
  const getDIYPriceBreakdown = () => {
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
    const hotelTotal = diyIncludeHotel ? diyNights * nightRate : 0;

    const dayVehRate = selectedVehicleItem?.pricePerDayUSD ?? Math.max(15, 25 + (selectedVehicleItem?.priceDeltaUSD || 0));
    const vehicleTotal = diyIncludeVehicle ? Math.round(diyDays * dayVehRate) : 0; // 일정(일수) 기준 1대 총액 (인원수 무관)

    let guideTotal = 0;
    let nonGuideExtraPerPersonTotal = 0;
    diyExtraServices.forEach((svc) => {
      if (!diySelectedExtraIds.includes(svc.id)) return;
      const isGuideSvc = svc.id === 'guide' || svc.name.includes('가이드');
      const cost = svc.pricingUnit === 'per_day' ? svc.priceUSD * diyDays : svc.priceUSD;
      if (isGuideSvc) {
        guideTotal += Math.round(cost); // 일정(일수) 기준 1명 총액 (인원수 무관)
      } else {
        nonGuideExtraPerPersonTotal += Math.round(cost);
      }
    });

    const perPersonOnlyUSD = Math.round(regionBase + activityTotal + hotelTotal + nonGuideExtraPerPersonTotal + dinnerPerPersonTotal);
    const teamFixedUSD = Math.round(vehicleTotal + guideTotal);
    const groupTotalUSD = Math.round(perPersonOnlyUSD * Math.max(1, personCount) + teamFixedUSD);
    const perPersonWithShareUSD = Math.round(groupTotalUSD / Math.max(1, personCount));

    return {
      perPersonOnlyUSD,
      vehicleTotal,
      guideTotal,
      dinnerPerPersonTotal,
      teamFixedUSD,
      groupTotalUSD,
      perPersonWithShareUSD,
    };
  };

  const calculateDIYEstimatedPrice = () => getDIYPriceBreakdown().perPersonWithShareUSD;

  // Build DIY package dynamically & open into customizer (View 2)
  const handleCreateDIYPackage = async () => {
    if (!(await ensureMemberLoginForQuotation())) return;
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
    const vehicleName = `전 일정 단독 ${vehicleTitle} (${days}일간 / 1일 $${dayVehRate} · 일정 기준 총액)`;

    const getDinnerActivityText = (dayNum: number, fallbackText: string) => {
      const picked = selectedDinnerEntries.find(e => e.day === dayNum);
      if (picked) {
        return `[선택 석식] ${picked.menu.name} (${picked.menu.description})`;
      }
      return fallbackText;
    };

    // Dynamic Itinerary Generation
    const itinerary = [];
    itinerary.push({
      day: 1,
      title: `${diyLocation} 도착 & ${diyIncludeVehicle ? '전용 픽업 미팅 & ' : ''}${diyIncludeHotel ? '숙소 체크인' : '자유 일정'}`,
      activities: [
        diyIncludeVehicle
          ? `${diyLocation} 도착 및 MANGO TOUR VIP 전담 기사 미팅`
          : `${diyLocation} 도착 후 개별 이동 (차량 미포함)`,
        diyIncludeVehicle
          ? `${vehicleTitle} 탑승 후 숙소로 편안한 이동`
          : '공항에서 개별 교통편으로 숙소 이동',
        diyIncludeHotel
          ? `${hotelName} 체크인 및 객실 배정 후 휴식`
          : '개별 예약 숙소 체크인 및 자유 휴식 (숙박 미포함)',
        getDinnerActivityText(1, '자유 석식 및 휴식 (석식 미포함)')
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
            `${diyIncludeHotel ? '숙소 조식 뷔페 후' : '조식 후'} ${diyIncludeVehicle ? '골프장으로 전용 차량 이동' : '골프장 개별 이동'}`,
            `${c} 18홀 라운딩 (골프 체크인/아웃 케어)`,
            '라운딩 후 클럽하우스 중식 및 휴식',
            hasMassage && rIdx < 2 ? '골프 피로 회복 VIP 전신 마사지 (90분)' : '휴식 또는 시내 쇼핑/자유 일정',
            getDinnerActivityText(d, '자유 석식 및 나이트라이프 (석식 미포함)')
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
            `${diyIncludeHotel ? '숙소 조식 뷔페 후' : '조식 후'} ${diyIncludeVehicle ? '전용 차량 미팅' : '자유 일정 시작'}`,
            tItem.isFreeTravel ? `${diyLocation} 내 맘대로 자유 일정 (카페, 쇼핑, 해변 휴양)` : `${tItem.name} 진행 (${tItem.description})`,
            hasMassage && d === 2 ? '여행 피로 회복 VIP 전신 마사지 (90분)' : '여유로운 휴식 및 시내 자유 탐방',
            getDinnerActivityText(d, '자유 석식 및 자유 휴식 (석식 미포함)')
          ]
        });
      }
    }

    itinerary.push({
      day: days,
      title: `${diyIncludeHotel ? '호텔 체크아웃 & ' : ''}기념품 쇼핑 & 공항 샌딩 (귀국)`,
      activities: [
        diyIncludeHotel ? '숙소 조식 뷔페 및 여유로운 체크아웃 준비' : '개별 숙소 체크아웃 및 마지막 날 일정 준비',
        '현지 인기 기념품 마켓 및 커피/특산품 쇼핑',
        diyIncludeVehicle ? '마지막 일정 후 공항으로 전용 차량 이동' : '마지막 일정 후 공항으로 개별 이동',
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
      isDefaultIncluded: diyIncludeHotel,
      isRequired: false,
      allowCustomSelection: true
    });

    options.push({
      id: 'diy-opt-vehicle',
      category: 'vehicle',
      name: vehicleName,
      description: `${selectedVehicleItem?.description || '전 일정 전용 기사 및 유류비 포함'} (1일 $${dayVehRate} × ${days}일 = 총 $${days * dayVehRate} · 인원수 무관 1대 기준)`,
      priceUSD: days * dayVehRate,
      isDefaultIncluded: diyIncludeVehicle,
      isRequired: false,
      allowCustomSelection: true
    });

    diyExtraServices.forEach(svc => {
      const isChecked = diySelectedExtraIds.includes(svc.id);
      const isGuideSvc = svc.id === 'guide' || svc.name.includes('가이드');
      const svcPrice = svc.pricingUnit === 'per_day' ? svc.priceUSD * days : svc.priceUSD;
      const cat: PackageOptionItem['category'] =
        isGuideSvc ? 'guide' : svc.id === 'fasttrack' ? 'etc' : 'activity';
      options.push({
        id: svc.id === 'guide' ? 'diy-opt-guide' : svc.id === 'fasttrack' ? 'diy-opt-fasttrack' : `diy-opt-extra-${svc.id}`,
        category: cat,
        name: isGuideSvc
          ? (svc.pricingUnit === 'per_day'
              ? `${svc.name} (${days}일간 / 1일 $${svc.priceUSD} · 일정 기준 총액)`
              : `${svc.name} (팀 총액 $${svc.priceUSD})`)
          : svc.pricingUnit === 'per_day'
            ? `${svc.name} (${days}일간 / 1일 $${svc.priceUSD})`
            : `${svc.name} (1인 $${svc.priceUSD})`,
        description: isGuideSvc
          ? `${svc.description.replace(/\/인/g, '')} (1일 $${svc.priceUSD} × ${days}일 = 총 $${svcPrice} · 인원수 무관 1명 기준)`
          : svc.description,
        priceUSD: svcPrice,
        isDefaultIncluded: isChecked,
        isRequired: false,
        allowCustomSelection: isGuideSvc
      });
    });

    if (selectedDinnerEntries.length > 0) {
      options.push({
        id: 'diy-opt-dinner',
        category: 'meal',
        name: `맞춤 저녁식사 (${selectedDinnerEntries.length}회 · ${selectedDinnerEntries.map(e => `${e.day}일차 ${e.menu.name}`).join(', ')})`,
        description: selectedDinnerEntries.map(e => `${e.day}일차: ${e.menu.name} ($${e.menu.priceUSD}/인)`).join(' · '),
        priceUSD: dinnerPerPersonTotal,
        isDefaultIncluded: true,
        isRequired: false,
        allowCustomSelection: false
      });
    }

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
      const baseTeamVeh = activePackage?.id.startsWith('diy-pkg-')
        ? (customizingOption.priceUSD || 0)
        : 100 * pkgTravelDays;
      return pool.vehicles.map(v => {
        const vehTotal = v.pricePerDayUSD !== undefined
          ? Math.round(v.pricePerDayUSD * pkgTravelDays)
          : Math.max(0, Math.round(baseTeamVeh + v.priceDeltaUSD));
        return {
          id: v.id,
          name: `${v.name} (${pkgTravelDays}일 $${vehTotal})`,
          location: '전 일정 단독 (팀 기준)',
          type: 'vehicle',
          priceDeltaUSD: vehTotal - Math.round(baseTeamVeh),
          teamTotalUSD: vehTotal,
          description: `${v.description} · 1일 $${v.pricePerDayUSD ?? Math.round(vehTotal / pkgTravelDays)} × ${pkgTravelDays}일 = 총 $${vehTotal} (인원수 무관)`,
          badge: v.badge
        };
      });
    }

    if (customizingOption.category === 'guide') {
      const baseTeamGuide = activePackage?.id.startsWith('diy-pkg-')
        ? (customizingOption.priceUSD || 120 * pkgTravelDays)
        : 120 * pkgTravelDays;
      return pool.guides.map(g => {
        const guideTotal = g.id === 'gui-3'
          ? 0
          : g.id === 'gui-2'
            ? Math.round(150 * pkgTravelDays)
            : Math.round(baseTeamGuide);
        return {
          id: g.id,
          name: g.name,
          location: '전 일정 (팀 기준)',
          type: 'guide',
          priceDeltaUSD: guideTotal - Math.round(baseTeamGuide),
          teamTotalUSD: guideTotal,
          description: `${g.description} (${pkgTravelDays}일 총 $${guideTotal} · 인원수 무관)`,
          badge: g.badge
        };
      });
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

  // Concise option title & subtitle for mobile (< sm) checklist cards
  const getMobileOptionSummary = (opt: PackageOptionItem, fullDisplayName: string): { title: string; subtitle: string } => {
    const isGolfOpt = opt.category === 'golf';
    const canShowPrice = showDetailedCosts || isGolfOpt;
    const isFastTrack = opt.name.includes('패스트 트랙') || opt.id.includes('fasttrack');
    const isMassage = opt.category === 'activity' && opt.name.includes('마사지');
    const customSel = customOptionSelections[opt.id];

    if (isGolfOpt) {
      if (customGolfCourses.length > 0 && (opt.name.includes('그린피') || opt.name.includes('코스') || opt.id.includes('golf'))) {
        return {
          title: customGolfCourses.map(c => c.split(' ')[0]).join(' + '),
          subtitle: `${customGolfCourses.length}회 18홀 라운딩`,
        };
      }
      const simplifiedGolf = fullDisplayName
        .replace(/^\d+대\s*명문\s*코스\s*그린피\s*/g, '')
        .replace(/\[[^\]]*\]\s*/g, '')
        .replace(/^\((.+)\)$/, '$1')
        .trim();
      return {
        title: simplifiedGolf || fullDisplayName,
        subtitle: '정규 18홀 그린피',
      };
    }

    if (opt.category === 'vehicle') {
      const src = customSel?.name || fullDisplayName;
      let shortTitle = '';
      if (src.includes('9인승')) shortTitle = '9인승 VIP 리무진';
      else if (src.includes('7인승')) shortTitle = '7인승 프리미엄 SUV';
      else if (src.includes('16인승')) shortTitle = '16인승 전용 밴';
      else if (src.includes('26인승')) shortTitle = '26인승 리무진 버스';
      else {
        shortTitle = src
          .replace(/전\s*일정\s*단독\s*/g, '')
          .replace(/\s*\([^)]*(일간|기준|총액|시트|\$)[^)]*\)/g, '')
          .replace(/\s+/g, ' ')
          .trim() || '전용 VIP 리무진';
      }
      return {
        title: shortTitle,
        subtitle: `${pkgTravelDays}일 단독 전용 (1대)`,
      };
    }

    if (opt.category === 'hotel') {
      const src = customSel?.name || fullDisplayName;
      const shortHotel = src
        .replace(/\s*\((\d+박)\s*\/\s*1인\s*객실\s*기준\)/g, ' ($1)')
        .replace(/\s*\([^)]*(객실\s*기준|1인\s*1실|베드룸|배정|급|독채|오션뷰|인접)[^)]*\)/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      return {
        title: shortHotel || '고급 호텔',
        subtitle: '1인 1실 단독',
      };
    }

    if (opt.category === 'guide') {
      const src = customSel?.name || fullDisplayName;
      let shortGuide = '한국어 전문 가이드';
      if (src.includes('미포함')) shortGuide = '가이드 미포함';
      else if (src.includes('VIP') || src.includes('비즈니스')) shortGuide = 'VIP 의전 가이드';
      else if (src.includes('한국어') || src.includes('베테랑')) shortGuide = '한국어 전문 가이드';
      return {
        title: shortGuide,
        subtitle: src.includes('미포함') ? '전용 기사만 배정' : `${pkgTravelDays}일 전 일정 동행`,
      };
    }

    if (isFastTrack) {
      return {
        title: '공항 VIP 패스트 트랙',
        subtitle: canShowPrice ? '입국 초고속 패스 (1인 $60)' : '입국 심사 초고속 패스',
      };
    }

    if (isMassage) {
      return {
        title: 'VIP 전신 마사지 (90분)',
        subtitle: canShowPrice ? '기본 포함 ($50)' : '피로 회복 힐링 스파',
      };
    }

    if (opt.category === 'meal') {
      const src = customSel?.name || fullDisplayName;
      if (opt.id === 'diy-opt-dinner') {
        const countMatch = src.match(/(\d+회)/);
        return {
          title: `맞춤 저녁식사${countMatch ? ` (${countMatch[1]})` : ''}`,
          subtitle: selectedDinnerEntries.map(e => `${e.day}일차 ${e.menu.name}`).join(' · '),
        };
      }
      if (src.includes('미포함') || src.includes('자유 식사')) {
        return { title: '자유 식사 (미포함)', subtitle: '개별 자유 식사' };
      }
      const shortMeal = src.replace(/\s*\([^)]*(석식|1일|\$)[^)]*\)/g, '').trim();
      return {
        title: shortMeal || '특식 포함',
        subtitle: canShowPrice ? '1인 1일 $50 기준' : '전 일정 특식',
      };
    }

    if (opt.id === 'diy-opt-region') {
      return {
        title: `${activePackage?.location || diyLocation} 기본 수배비`,
        subtitle: '현지 일정 관리',
      };
    }

    if (opt.id === 'diy-opt-tour') {
      const cleanTour = fullDisplayName
        .replace(/^선택 여행 일정:\s*/, '')
        .replace(/\s*\([^)]*\)/g, '')
        .trim();
      return {
        title: cleanTour || '맞춤 여행 일정',
        subtitle: '선택 투어 일정',
      };
    }

    return {
      title: fullDisplayName.replace(/\s*\([^)]*(기준|총액|1일\s*\$)[^)]*\)/g, '').trim() || fullDisplayName,
      subtitle: '',
    };
  };

  // Helper to get selected accommodation name
  const getChosenAccommodationName = () => {
    const hotelOpt = activePackage?.options.find(o => o.category === 'hotel');
    if (hotelOpt && !selectedOptionIds.has(hotelOpt.id)) {
      return '숙박 미포함 (개별 예약)';
    }
    if (hotelOpt && customOptionSelections[hotelOpt.id]) {
      return customOptionSelections[hotelOpt.id].name;
    }
    return hotelOpt?.name || '호치민 1군 고급 호텔 (4박/1인 객실 기준)';
  };

  // Calculate travel days and team-based option total (Vehicle & Guide are NEVER multiplied by personCount)
  const pkgTravelDays =
    activePackage?.itinerary?.length ||
    (activePackage?.duration?.match(/(\d+)\s*박/)
      ? parseInt(activePackage.duration.match(/(\d+)\s*박/)![1], 10) + 1
      : 5);

  const getOptionGroupTotalUSD = (opt: PackageOptionItem): number => {
    if (!activePackage) return 0;
    const isDiyPkg = activePackage.id.startsWith('diy-pkg-');

    // 1) 차량: 인원수 곱셈 절대 제외! 여행 일수(pkgTravelDays) 기준 차량 1대 총액
    if (opt.category === 'vehicle') {
      const customSel = customOptionSelections[opt.id];
      if (customSel) {
        const matchedPoolVeh = pool.vehicles.find(v => v.id === customSel.choiceId);
        if (matchedPoolVeh && matchedPoolVeh.pricePerDayUSD !== undefined) {
          return Math.max(0, Math.round(matchedPoolVeh.pricePerDayUSD * pkgTravelDays));
        }
        return Math.max(0, Math.round((isDiyPkg ? (opt.priceUSD || 0) : 100 * pkgTravelDays) + customSel.priceDelta));
      }
      if (isDiyPkg) {
        return Math.max(0, Math.round(opt.priceUSD || 0)); // 이미 (1일 단가 × 여행 일수)
      }
      return Math.max(0, Math.round(100 * pkgTravelDays));
    }

    // 2) 가이드: 인원수 곱셈 절대 제외! 여행 일수(pkgTravelDays) 기준 가이드 1명 총액
    if (opt.category === 'guide') {
      const customSel = customOptionSelections[opt.id];
      if (customSel) {
        if (customSel.choiceId === 'gui-3' || customSel.name.includes('미포함')) {
          return 0;
        }
        if (customSel.choiceId === 'gui-2') {
          return Math.max(0, Math.round(150 * pkgTravelDays));
        }
        if (customSel.choiceId === 'gui-1') {
          return Math.max(0, Math.round(isDiyPkg ? (opt.priceUSD || 120 * pkgTravelDays) : 120 * pkgTravelDays));
        }
        return Math.max(0, Math.round((isDiyPkg ? (opt.priceUSD || 0) : 120 * pkgTravelDays) + customSel.priceDelta));
      }
      if (isDiyPkg) {
        return Math.max(0, Math.round(opt.priceUSD || 0)); // 이미 (1일 단가 × 여행 일수)
      }
      return Math.max(0, Math.round(120 * pkgTravelDays));
    }

    // 3) 인당 과금 항목 (항공, 골프, 투어, 숙박, 식사, 패스트트랙, 마사지, 보험 등)
    return Math.max(0, Math.round(getOptionPrice(opt) * personCount));
  };

  const currentTotalGroup = activePackage
    ? activePackage.options.reduce((sum, opt) => {
        if (!selectedOptionIds.has(opt.id)) return sum;
        return sum + getOptionGroupTotalUSD(opt);
      }, 0)
    : 0;

  const currentTeamTotalUSD = activePackage
    ? activePackage.options.reduce((sum, opt) => {
        if (!selectedOptionIds.has(opt.id)) return sum;
        if (opt.category === 'vehicle' || opt.category === 'guide') {
          return sum + getOptionGroupTotalUSD(opt);
        }
        return sum;
      }, 0)
    : 0;

  const currentPerPersonOnlyTotalUSD = activePackage
    ? activePackage.options.reduce((sum, opt) => {
        if (!selectedOptionIds.has(opt.id)) return sum;
        if (opt.category !== 'vehicle' && opt.category !== 'guide') {
          return sum + getOptionPrice(opt);
        }
        return sum;
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

    const maskNonGolf = (txt?: string) => (showDetailedCosts ? (txt || '') : sanitizeNonGolfPriceText(txt));
    let text = `[MANGO TOUR - ${activePackage.duration || '맞춤 일정'} 맞춤 ${customGolfCourses.length > 0 ? '골프' : ''} 여행 견적 문의]\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `📌 상품명: ${activePackage.title}\n`;
    if (customGolfCourses.length > 0) {
      text += `⛳ 선택 골프장 (${customGolfCourses.length}회 라운딩): ${customGolfCourses.join(' · ')}\n`;
    } else {
      const tourOpt = activePackage.options.find(o => o.id === 'diy-opt-tour' || (o.category === 'activity' && !o.name.includes('마사지') && !o.name.includes('스파')));
      text += `🧳 선택 여행/투어: ${tourOpt ? maskNonGolf(getOptionDisplayName(tourOpt)) : `${activePackage.location} ${activePackage.duration} 맞춤 여행`}\n`;
    }
    text += `🏨 선택 숙박형태: ${maskNonGolf(getChosenAccommodationName())}\n`;
    text += `📍 여행 지역: ${activePackage.location} (${activePackage.duration || '맞춤 일정'})\n`;
    text += `📅 출발 희망일: ${departureDate || '미정'}\n`;
    text += `👥 여행 인원: ${personCount}명\n`;
    if (customerName) text += `👤 예약자명: ${customerName}\n`;
    if (customerContact) text += `📞 연락처/카카오ID: ${customerContact}\n`;
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `💰 [예상 견적 금액]\n`;
    text += `• 1인 예상 분담금: $${currentTotalPerPerson.toLocaleString()} (약 ${(currentTotalPerPerson * USD_TO_KRW).toLocaleString()}원)\n`;
    text += `• 총 예상 견적 (${personCount}인): $${currentTotalGroup.toLocaleString()} (약 ${(currentTotalGroup * USD_TO_KRW).toLocaleString()}원)\n`;
    if (showDetailedCosts) {
      text += `  (※ 차량·가이드는 ${pkgTravelDays}일 일정 기준 팀 총액 $${currentTeamTotalUSD.toLocaleString()} 적용 / 인원수 무관)\n`;
    } else {
      text += `  (※ 차량·가이드는 ${pkgTravelDays}일 일정 기준 팀 단위 적용 / 인원수 무관)\n`;
    }
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `✅ [선택/포함 항목 (${included.length}개)]\n`;
    included.forEach(item => {
      const isTeam = item.category === 'vehicle' || item.category === 'guide';
      const itemTotal = getOptionGroupTotalUSD(item);
      const canShowItem = showDetailedCosts || item.category === 'golf';
      const itemLabel = canShowItem ? getOptionDisplayName(item) : maskNonGolf(getOptionDisplayName(item));
      if (canShowItem) {
        text += ` • [${item.category}] ${itemLabel} ($${itemTotal.toLocaleString()} / ${isTeam ? `${pkgTravelDays}일 일정 총액` : `${personCount}인 합계`})\n`;
      } else {
        text += ` • [${item.category}] ${itemLabel} (포함)\n`;
      }
    });
    if (excluded.length > 0) {
      text += `\n❌ [제외/미선택 항목 (${excluded.length}개)]\n`;
      excluded.forEach(item => {
        const canShowItem = showDetailedCosts || item.category === 'golf';
        text += ` • ${canShowItem ? getOptionDisplayName(item) : maskNonGolf(getOptionDisplayName(item))}\n`;
      });
    }
    if (customerNotes) {
      text += `━━━━━━━━━━━━━━━━━━━━━\n`;
      text += `📝 [고객 요청사항]\n${customerNotes}\n`;
    }
    text += `━━━━━━━━━━━━━━━━━━━━━\n`;
    text += `📞 망고투어 고객센터: +84 37 720 4451\n`;
    text += `📩 온라인 견적 접수: 홈페이지 [1:1 온라인 견적 신청하기]로 즉시 접수\n`;
    text += `💬 실시간 1:1 카카오톡 상담: https://open.kakao.com/o/gprQnKSi`;
    return text;
  };

  // Concise label helper for A4 quotation cost items & reservation notice (mobile + desktop)
  const getConciseOptionLabel = (opt: PackageOptionItem): string => {
    const rawName = getOptionDisplayName(opt);
    const customName = customOptionSelections[opt.id]?.name;
    const src = customName || rawName;

    if (opt.category === 'golf') {
      if (customGolfCourses.length > 0 && (opt.name.includes('그린피') || opt.name.includes('코스') || opt.id.includes('golf'))) {
        return customGolfCourses.map(c => c.split(' ')[0]).join(' + ');
      }
      return rawName
        .replace(/^\d+대\s*명문\s*코스\s*그린피\s*/g, '')
        .replace(/\[[^\]]*\]\s*/g, '')
        .replace(/^\((.+)\)$/, '$1')
        .trim() || rawName;
    }

    if (opt.category === 'hotel') {
      return src
        .replace(/\s*\((\d+박)\s*\/\s*1인\s*객실\s*기준\)/g, ' ($1)')
        .replace(/\s*\([^)]*(객실\s*기준|1인\s*1실|베드룸|배정|급|독채|오션뷰|인접)[^)]*\)/g, '')
        .replace(/\s+/g, ' ')
        .trim() || '고급 호텔';
    }

    if (opt.category === 'vehicle') {
      if (src.includes('9인승')) return '9인승 VIP 리무진';
      if (src.includes('7인승')) return '7인승 프리미엄 SUV';
      if (src.includes('16인승')) return '16인승 전용 밴';
      if (src.includes('26인승')) return '26인승 리무진 버스';
      return src
        .replace(/전\s*일정\s*단독\s*/g, '')
        .replace(/\s*\([^)]*(일간|기준|총액|시트|\$)[^)]*\)/g, '')
        .replace(/\s+/g, ' ')
        .trim() || '전용 VIP 리무진';
    }

    if (opt.category === 'guide') {
      if (src.includes('미포함')) return '가이드 미포함';
      if (src.includes('VIP') || src.includes('비즈니스')) return 'VIP 의전 가이드';
      return '한국어 전문 가이드';
    }

    if (opt.name.includes('패스트 트랙') || opt.name.includes('패스트트랙') || opt.id.includes('fasttrack')) {
      return '공항 VIP 패스트트랙';
    }

    if (opt.name.includes('마사지') || opt.name.includes('스파')) {
      return 'VIP 전신 마사지 (90분)';
    }

    if (opt.category === 'meal') {
      if (opt.id === 'diy-opt-dinner') {
        return selectedDinnerEntries.length > 0
          ? `맞춤 저녁식사 (${selectedDinnerEntries.length}회)`
          : '맞춤 저녁식사';
      }
      if (src.includes('미포함') || src.includes('자유 식사')) return '자유 식사 (미포함)';
      return src.replace(/\s*\([^)]*(석식|1일|\$)[^)]*\)/g, '').trim() || '특식 포함';
    }

    if (opt.id === 'diy-opt-tour') {
      return rawName.replace(/^선택 여행 일정:\s*/, '').replace(/\s*\([^)]*\)/g, '').trim() || '맞춤 여행 일정';
    }

    if (opt.id === 'diy-opt-region') {
      return `${activePackage?.location || diyLocation} 기본 수배비`;
    }

    return sanitizeNonGolfPriceText(src).trim() || src;
  };

  // Helper to construct A4 quotation cost items (concise for both mobile & desktop preview)
  const getA4CostItems = (): CostItem[] => {
    if (!activePackage) return [];
    const items: CostItem[] = [];

    activePackage.options.forEach(opt => {
      if (!selectedOptionIds.has(opt.id)) return;
      const conciseLabel = getConciseOptionLabel(opt);
      const travelDays = pkgTravelDays;

      let catName = '기타 경비';
      let qty = `${personCount}인`;
      let detail = conciseLabel;

      if (opt.category === 'flight') {
        catName = '항공권 (국제선 왕복)';
        qty = `${personCount}인 왕복`;
      } else if (opt.id === 'diy-opt-region') {
        catName = '지역 운영/수배';
        qty = `${personCount}인`;
        detail = `${activePackage.location} 현지 수배 및 맞춤 일정 관리`;
      } else if (opt.id === 'diy-opt-tour') {
        catName = '투어/관광';
        qty = `${personCount}인`;
      } else if (opt.category === 'hotel') {
        catName = '숙박 (1인 객실 기준)';
        qty = `${personCount}실 (${activePackage.duration || '4박'})`;
        detail = `${conciseLabel} (1인 1실 · 조식 포함)`;
      } else if (opt.category === 'golf') {
        catName = '골프 라운딩 (18홀)';
        qty = `${customGolfCourses.length}회 × ${personCount}인`;
        detail = `${conciseLabel} (카트·캐디피 포함)`;
      } else if (opt.category === 'vehicle') {
        catName = '전용 차량 & 기사';
        qty = `1대 (전일정 ${travelDays}일)`;
        detail = `${conciseLabel} (전용 기사·유류비 포함)`;
      } else if (opt.category === 'guide') {
        catName = '한국어 전담 가이드';
        qty = `1명 (전일정 ${travelDays}일)`;
        detail = conciseLabel.includes('미포함')
          ? '가이드 미포함 (전용 기사만 배정)'
          : `${conciseLabel} (전 일정 동행)`;
      } else if (opt.name.includes('패스트 트랙') || opt.name.includes('패스트트랙') || opt.id.includes('fasttrack')) {
        catName = 'VIP패스트트랙';
        qty = `${personCount}인`;
        detail = '공항 VIP 전용 입국 심사 초고속 패스';
      } else if (opt.category === 'meal') {
        if (opt.id === 'diy-opt-dinner') {
          catName = '맞춤 저녁식사';
          qty = `${personCount}인 (${selectedDinnerEntries.length}회)`;
          detail = selectedDinnerEntries.length > 0
            ? selectedDinnerEntries.map(e => `${e.day}일차 ${e.menu.name}`).join(' · ')
            : '맞춤 저녁식사';
        } else {
          const mealNights = activePackage.itinerary?.length ? activePackage.itinerary.length - 1 : 4;
          catName = '식사 및 만찬';
          qty = `${personCount}인 (석식 ${mealNights}회)`;
        }
      } else if (opt.name.includes('마사지') || opt.name.includes('스파')) {
        catName = '스파 & 마사지';
        qty = `${personCount}인`;
        detail = 'VIP 전신 힐링 마사지 (90분)';
      } else if (opt.category === 'activity') {
        catName = '투어/액티비티';
        qty = `${personCount}인`;
      } else if (opt.category === 'etc') {
        catName = '기타 옵션';
        qty = `${personCount}인`;
      }

      const totalItemUSD = getOptionGroupTotalUSD(opt);

      items.push({
        category: catName,
        detail,
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

  // Build dynamic reservationNotice synced with active DIY / custom package selections
  const getReservationNoticeData = (): ReservationNoticeData | undefined => {
    if (!activePackage) return undefined;
    const isGolfTrip = customGolfCourses.length > 0;
    const hotelOpt = activePackage.options.find(o => o.category === 'hotel');
    const vehicleOpt = activePackage.options.find(o => o.category === 'vehicle');
    const tourOpt = activePackage.options.find(
      o => o.id === 'diy-opt-tour' || (o.category === 'activity' && !o.name.includes('마사지') && !o.name.includes('스파'))
    );

    const extraServices = activePackage.options
      .filter(
        o =>
          o.category === 'guide' ||
          o.name.includes('패스트') ||
          o.id.includes('fasttrack') ||
          o.name.includes('마사지') ||
          o.name.includes('스파') ||
          o.category === 'meal'
      )
      .map(o => ({
        name: getConciseOptionLabel(o),
        included: selectedOptionIds.has(o.id)
      }));

    const excludedItems = activePackage.options
      .filter(o => !selectedOptionIds.has(o.id))
      .map(o => getConciseOptionLabel(o));

    return {
      sourceType: activePackage.id.startsWith('diy-pkg-') ? 'diy' : 'product',
      productTitle: activePackage.title,
      tripType: isGolfTrip ? 'golf' : 'tour',
      region: activePackage.location,
      duration: activePackage.duration,
      golfCourses: isGolfTrip ? customGolfCourses.map(c => c.split(' ')[0]) : [],
      tourItems: !isGolfTrip
        ? [
            tourOpt && selectedOptionIds.has(tourOpt.id)
              ? getConciseOptionLabel(tourOpt)
              : `${activePackage.location} ${activePackage.duration} 자유·맞춤 여행`
          ]
        : [],
      accommodation: hotelOpt && selectedOptionIds.has(hotelOpt.id) ? `${getConciseOptionLabel(hotelOpt)} (1인 1실)` : undefined,
      vehicle: vehicleOpt && selectedOptionIds.has(vehicleOpt.id) ? getConciseOptionLabel(vehicleOpt) : undefined,
      extraServices,
      excludedItems
    };
  };

  // Direct PDF Download of A4 Quotation Sheet
  const handleDownloadPDF = async () => {
    if (isDownloadingPdf) return;
    if (!(await ensureMemberLoginForQuotation())) return;
    const targetElement = a4QuotationPrintRef.current || quotationCardRef.current;
    if (!targetElement) {
      showToast('⚠️ 견적서 양식을 찾을 수 없습니다. 화면을 새로고침한 후 다시 시도해주세요.');
      return;
    }
    setIsDownloadingPdf(true);
    try {
      showToast('📄 A4 규격 PDF 문서를 생성 중입니다...');
      const pdf = await generateQuotationPdf(targetElement, {
        customerName: customerName.trim() || '고객',
      });
      triggerBlobDownload(pdf.blob, pdf.fileName);
      showToast('📥 A4 PDF 견적서 다운로드가 완료되었습니다.');
    } catch (err) {
      console.error('PDF export error:', err);
      const errMsg = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      showToast('⚠️ PDF 생성에 실패했습니다.');
      await appAlert(`A4 PDF 견적서 생성 중 오류가 발생했습니다.\n\n사유: ${errMsg}`, {
        title: 'PDF 다운로드 실패',
        tone: 'error',
      });
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // KakaoTalk Consultation handler with text copy
  const handleKakaoInquiry = async () => {
    if (!(await ensureMemberLoginForQuotation())) return;
    setShowKakaoModal(true);

    const text = generateQuotationText();
    try {
      await navigator.clipboard.writeText(text);
      showToast('📋 견적서 내용이 클립보드에 복사되었습니다.');
    } catch (e) {
      console.warn('Text clipboard write error:', e);
    }
  };

  // Open Quote Preview Modal (members only)
  const handleOpenQuotePreview = async () => {
    if (!(await ensureMemberLoginForQuotation())) return;
    setShowQuotePreviewModal(true);
  };

  // Open 1:1 Online Inquiry Modal
  const handleOpenOnlineInquiry = async () => {
    if (!(await ensureMemberLoginForQuotation())) return;
    setShowInquiryModal(true);
    setInquirySuccess(false);
    setInquiryError(null);
  };

  // Submit Online Inquiry with background A4 PDF generation -> Storage -> Admin Email Attachment -> Kakao hook
  const handleSubmitOnlineInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingEmail) return;
    if (!(await ensureMemberLoginForQuotation())) return;

    const trimmedName = customerName.trim();
    const trimmedContact = customerContact.trim();
    if (!trimmedName || !trimmedContact) {
      setInquiryError('예약자 성함과 연락처(또는 카카오톡 ID)를 입력해주세요.');
      return;
    }

    setInquiryError(null);
    setIsSubmittingEmail(true);

    try {
      const a4CostItems = getA4CostItems();
      const a4ItineraryDays = getA4ItineraryDays();
      const reservationNotice = getReservationNoticeData();

      const includedOptions = activePackage
        ? activePackage.options.filter(o => selectedOptionIds.has(o.id))
        : [];
      const excludedOptions = activePackage
        ? activePackage.options.filter(o => !selectedOptionIds.has(o.id))
        : [];

      const tourName =
        activePackage?.title ||
        reservationNotice?.productTitle ||
        `[고객 맞춤 DIY] ${diyLocation} 맞춤 투어`;
      const tourLocation = activePackage?.location || reservationNotice?.region || diyLocation;
      const tourDuration =
        activePackage?.duration || reservationNotice?.duration || `${diyNights}박 ${diyDays}일`;

      const golfListText =
        customGolfCourses.length > 0
          ? customGolfCourses.map((c, idx) => `${idx + 1}R: ${c}`).join(' / ')
          : reservationNotice?.tourItems?.join(', ') || '자유·맞춤 여행 일정';

      const accommodationOpt = activePackage?.options.find(o => o.category === 'hotel');
      const accommodationText =
        accommodationOpt && selectedOptionIds.has(accommodationOpt.id)
          ? getChosenAccommodationName()
          : reservationNotice?.accommodation || '미포함 / 개별 예약';

      const vehicleOpt = activePackage?.options.find(o => o.category === 'vehicle');
      const vehicleText =
        vehicleOpt && selectedOptionIds.has(vehicleOpt.id)
          ? getOptionDisplayName(vehicleOpt)
          : reservationNotice?.vehicle || '미포함';

      const guideOpt = activePackage?.options.find(o => o.category === 'guide');
      const guideText =
        guideOpt && selectedOptionIds.has(guideOpt.id)
          ? getOptionDisplayName(guideOpt)
          : '미포함';

      const extraOptionLines = includedOptions
        .filter(
          o =>
            o.category !== 'hotel' &&
            o.category !== 'vehicle' &&
            o.category !== 'guide' &&
            o.category !== 'golf' &&
            o.id !== 'diy-opt-region'
        )
        .map(o => `- ${getOptionDisplayName(o)}: $${getOptionGroupTotalUSD(o).toLocaleString()} USD`);

      const costTableLines = a4CostItems.map((item, idx) => {
        const usd = item.amountUSD !== undefined ? item.amountUSD : Math.round(item.amountKRW / USD_TO_KRW);
        const krw = item.amountKRW || usd * USD_TO_KRW;
        return `${idx + 1}. [${item.category}] | 수량/기준: ${item.quantity} | 금액: $${usd.toLocaleString()} (약 ${krw.toLocaleString()}원)\n   └ 세부: ${item.detail}`;
      });

      const itineraryLines = a4ItineraryDays.map(day => {
        const actTexts = day.activities.map(act =>
          typeof act === 'string' ? act : `${act.time ? `[${act.time}] ` : ''}${act.desc}`
        );
        return `• ${day.title}\n   - ${actTexts.join(' / ')}`;
      });

      const submittedAt = new Date().toLocaleString('ko-KR');

      const formattedMessage = [
        '==================================================',
        '           MANGO TOUR 1:1 맞춤 견적 신청서',
        '==================================================',
        '',
        '[1. 고객 신청 정보]',
        `• 예약자 성함: ${trimmedName}`,
        `• 연락처 / 카카오톡 ID: ${trimmedContact}`,
        `• 인원 수: ${personCount}명`,
        `• 출발 희망일: ${departureDate || '미정'}`,
        `• 추가 요청사항: ${customerNotes.trim() || '없음'}`,
        `• 접수 일시: ${submittedAt}`,
        '',
        '[2. 정식 A4 견적서 요약 내역]',
        `• 투어명: ${tourName}`,
        `• 여행 지역 / 일정: ${tourLocation} / ${tourDuration} (총 ${pkgTravelDays}일 일정)`,
        `• ${customGolfCourses.length > 0 ? '라운딩 골프장' : '여행/투어 구성'}: ${golfListText}`,
        `• 숙박: ${accommodationText}`,
        `• 차량: ${vehicleText}`,
        `• 가이드: ${guideText}`,
        `• 추가/선택 옵션:`,
        extraOptionLines.length > 0 ? extraOptionLines.join('\n') : '  - 기본 포함 구성 외 추가 옵션 없음',
        `• 제외(미선택) 항목: ${excludedOptions.length > 0 ? excludedOptions.map(o => getOptionDisplayName(o)).join(' / ') : '없음'}`,
        '',
        '[3. 정식 A4 견적서 — 경비 세부 내역표]',
        ...(costTableLines.length > 0 ? costTableLines : ['(선택된 세부 경비 항목 없음)']),
        '',
        '[4. 최종 예상 견적 합계]',
        `• 1인당 예상 금액: $${currentTotalPerPerson.toLocaleString()} USD (약 ${(currentTotalPerPerson * USD_TO_KRW).toLocaleString()}원)`,
        `• 총 예상 견적 합계 (${personCount}인 기준): $${currentTotalGroup.toLocaleString()} USD (약 ${(currentTotalGroup * USD_TO_KRW).toLocaleString()}원)`,
        '  ※ 환율 1 USD = 1,360 KRW 기준 / 차량·가이드는 인원수 무관 일정 총액 적용',
        '',
        ...(itineraryLines.length > 0
          ? ['[5. 예정 일정표 요약]', ...itineraryLines, '']
          : []),
        '==================================================',
        'MANGO TOUR | +84 37 720 4451 | Kakao: MANGO TOUR',
      ].join('\n');

      // Allow DOM to settle with latest customer fields before generating A4 PDF
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
      );

      const generatedPdf = await generateQuotationPdf(
        a4QuotationPrintRef.current || quotationCardRef.current,
        { customerName: trimmedName }
      );

      await submitQuotationWithPdf({
        customerName: trimmedName,
        customerContact: trimmedContact,
        personCount,
        departureDate: departureDate || '미정',
        customerNotes: customerNotes.trim(),
        productTitle: tourName,
        region: tourLocation,
        duration: tourDuration,
        totalPriceUSD: currentTotalGroup,
        totalPriceKRW: currentTotalGroup * USD_TO_KRW,
        perPersonUSD: currentTotalPerPerson,
        summaryText: formattedMessage,
        costItems: a4CostItems.map(it => ({
          category: it.category,
          detail: it.detail,
          quantity: it.quantity,
          amountUSD: it.amountUSD !== undefined ? it.amountUSD : Math.round(it.amountKRW / USD_TO_KRW),
          amountKRW: it.amountKRW,
        })),
        pdfFileName: generatedPdf.fileName,
        pdfBase64: generatedPdf.base64,
        inquiryBackupData: {
          _subject: `[MANGO TOUR 견적신청] ${trimmedName}님의 맞춤 견적 문의`,
          예약자명: trimmedName,
          연락처_카카오톡ID: trimmedContact,
          상품명: tourName,
          지역: tourLocation,
          기간: tourDuration,
          맞춤선택_골프장: customGolfCourses.join(' · '),
          맞춤선택_숙박: accommodationText,
          출발희망일: departureDate || '미정',
          여행인원: `${personCount}명`,
          '1인_예상금액': `$${currentTotalPerPerson.toLocaleString()} (약 ${(currentTotalPerPerson * USD_TO_KRW).toLocaleString()}원)`,
          '총_예상견적': `$${currentTotalGroup.toLocaleString()} (약 ${(currentTotalGroup * USD_TO_KRW).toLocaleString()}원)`,
          고객요청사항: customerNotes.trim() || '없음',
          접수일시: submittedAt,
        },
      });

      setShowInquiryModal(false);
      setInquirySuccess(false);
      setInquiryError(null);
      setSubmissionNotice({
        type: 'success',
        message: '견적 신청이 완료되었습니다. 담당자 확인 후 연락드리겠습니다.',
      });
      showToast('견적 신청이 완료되었습니다. 담당자 확인 후 연락드리겠습니다.');
    } catch (err) {
      console.error('Quotation PDF submission failed:', err);
      const errMsg = err instanceof Error ? err.message : '';
      const failMsg = errMsg || '전송에 실패했습니다. 잠시 후 다시 시도하거나 카카오톡으로 문의해 주세요.';
      setInquiryError(failMsg);
      showToast(failMsg);
    } finally {
      setIsSubmittingEmail(false);
    }
  };

  const getCategoryBadge = (category: PackageOptionItem['category'], name?: string) => {
    if (name?.includes('패스트 트랙') || name?.includes('Fast Track')) {
      return {
        label: showDetailedCosts ? '🛫 패스트트랙 ($60)' : '🛫 패스트트랙',
        bg: 'bg-amber-100 text-amber-900 border-amber-300',
      };
    }
    switch (category) {
      case 'golf': return { label: '⛳ 골프', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      case 'hotel': return { label: '🏨 숙박 (1인실)', bg: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 'vehicle': return { label: '🚐 차량', bg: 'bg-amber-100 text-amber-800 border-amber-200' };
      case 'meal': return { label: '🦞 식사', bg: 'bg-red-100 text-red-800 border-red-200' };
      case 'activity': return { label: '💆 스파/투어', bg: 'bg-purple-100 text-purple-800 border-purple-200' };
      case 'guide':
        return {
          label: showDetailedCosts ? '👨‍💼 가이드 (1일 $120)' : '👨‍💼 가이드',
          bg: 'bg-indigo-100 text-indigo-800 border-indigo-200',
        };
      default: return { label: '✨ 옵션/기타', bg: 'bg-gray-100 text-gray-800 border-gray-200' };
    }
  };

  return (
    <div className="bg-[#F2F2F7] select-text font-sans antialiased text-[#3A3A3C] tracking-tight break-keep w-full max-w-full overflow-x-clip print:overflow-visible print:bg-white">
      {/* Toast Notification */}
      {copyToast && (
        <div className="no-print fixed top-20 left-1/2 -translate-x-1/2 z-[10007] bg-gray-900/90 text-white px-4 sm:px-5 py-2.5 sm:py-3 rounded-full shadow-lg text-xs sm:text-sm font-semibold flex items-center gap-2 animate-fade-in backdrop-blur-md">
          <span>{copyToast}</span>
        </div>
      )}

      {/* Sticky Hero Header */}
      <div
        className="no-print sticky z-20 w-full bg-[#F2F2F7]/90 backdrop-blur-md pb-2.5 sm:pb-3"
        style={{ top: 'var(--site-header-height, 45px)' }}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-4 pt-2.5 sm:pt-3 w-full">
          <div className="bg-[#0A7E54] text-white relative overflow-hidden rounded-[20px] shadow-sm">
            <div className="px-5 sm:px-6 md:px-8 py-4 sm:py-5 md:py-6 relative z-10 w-full flex flex-col justify-center">
              <div className="flex items-center justify-between gap-2 mb-2 md:mb-3">
                <BackButton 
                  onClick={handleTopBack}
                  variant="hero"
                  label={activePackage ? '목록으로 돌아가기' : '뒤로가기'}
                />
                <span className="md:hidden text-[11px] font-semibold text-emerald-100 whitespace-nowrap">
                  맞춤 플래너
                </span>
              </div>
              
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-2 md:gap-4">
                <div>
                  <span className="hidden md:inline-block text-xs font-semibold text-emerald-100 mb-1">
                    베트남 골프 · 여행 맞춤 플래너
                  </span>
                  <h1 className="text-lg xs:text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight line-clamp-1 md:line-clamp-none">
                    {activePackage ? activePackage.title : '골프 / 투어 내 맘대로 여행 만들기'}
                  </h1>
                  <p className="text-emerald-100/90 text-xs md:text-sm mt-1 max-w-2xl leading-snug font-normal line-clamp-1 md:line-clamp-none">
                    {activePackage 
                      ? activePackage.subtitle 
                      : '원하시는 지역, 기간, 숙박, 차량을 선택하면 실시간 맞춤 견적서가 완성됩니다.'}
                  </p>
                </div>

                {!activePackage && (
                  <div className="hidden md:flex items-center gap-2 bg-white/15 backdrop-blur-md px-3.5 py-2 rounded-full text-xs font-semibold text-white self-start md:self-auto shrink-0">
                    <span>1:1 DIY 맞춤 자유 설계</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className={`max-w-7xl mx-auto px-3 sm:px-4 pt-0 pb-0 w-full ${showQuotePreviewModal ? 'print:hidden' : ''}`}>
        {isAdmin && onToggleAdminDetailedCosts && (
          <div className="mb-3 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
            <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-amber-950">
              <span>🔐</span>
              <span>관리자 견적 금액 표시 설정</span>
              <span className="hidden md:inline text-xs font-medium text-amber-800">
                (일반 고객은 합산 금액과 골프비용만 표시됩니다)
              </span>
            </div>
            <div className="inline-flex items-center bg-white p-0.5 rounded-xl border border-amber-200 shadow-2xs shrink-0">
              <button
                type="button"
                onClick={() => onToggleAdminDetailedCosts(false)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
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
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer whitespace-nowrap ${
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
        
        {/* ================= VIEW 1: 6-STEP DIY CUSTOM TRIP BUILDER ================= */}
        {!activePackage && (
          <div>
            <div className="space-y-2.5 sm:space-y-3">
              {/* 1. 여행 지역 선택 */}
              <div className="bg-white rounded-[20px] p-4 sm:p-5 shadow-sm space-y-3">
                <div className="flex justify-between items-center pb-2.5 border-b border-black/[0.06] gap-2">
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 min-w-0">
                    <h3 className="font-bold text-base md:text-lg text-gray-900 tracking-tight flex items-center gap-2.5 whitespace-nowrap">
                      <span className="w-6 h-6 rounded-full bg-[#0A7E54] text-white text-xs flex items-center justify-center font-bold shrink-0">1</span>
                      <span>여행 지역 선택</span>
                    </h3>
                    <span className="text-[11px] sm:text-xs font-medium text-[#8E8E93]">
                      원하시는 여행 지역을 클릭해 주세요
                    </span>
                  </div>
                  <span className="text-xs md:text-sm font-semibold text-[#0A7E54] bg-[#ECFDF5] px-3 py-1 rounded-full whitespace-nowrap shrink-0">
                    {diyLocation}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3">
                  {diyRegions.map((reg) => {
                    const isSelected = diyLocation === reg.name;
                    const coverImageSrc = isImageIconUrl(reg.image)
                      ? getFreshImageUrl(reg.image)
                      : isImageIconUrl(reg.icon)
                        ? getFreshImageUrl(reg.icon)
                        : REGION_COVER_IMAGES[reg.name];
                    const showCoverImage = Boolean(coverImageSrc && !failedRegionImageIds[reg.id]);
                    return (
                      <button
                        key={reg.id}
                        type="button"
                        onClick={() => handleDIYLocationChange(reg.name)}
                        aria-pressed={isSelected}
                        className={`group relative w-full aspect-video rounded-xl sm:rounded-2xl overflow-hidden text-left transition-all duration-200 ease-out active:scale-[0.97] cursor-pointer border-[3px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10B981] focus-visible:ring-offset-2 ${
                          isSelected
                            ? 'z-10 scale-[1.03] border-[#10B981] shadow-[0_10px_24px_-4px_rgba(16,185,129,0.38)]'
                            : 'border-gray-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.08)] hover:scale-[1.02] hover:border-[#34D399] hover:shadow-[0_8px_18px_-4px_rgba(16,185,129,0.22)]'
                        }`}
                      >
                        {/* Fallback gradient surface */}
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-slate-800 to-slate-950" />

                        {/* Full-bleed regional landscape photo */}
                        {showCoverImage && (
                          <img
                            key={coverImageSrc}
                            src={coverImageSrc}
                            alt={`${reg.name} 풍경`}
                            referrerPolicy="no-referrer"
                            onLoad={() =>
                              setFailedRegionImageIds((prev) =>
                                prev[reg.id] ? { ...prev, [reg.id]: false } : prev
                              )
                            }
                            onError={() =>
                              setFailedRegionImageIds((prev) => ({ ...prev, [reg.id]: true }))
                            }
                            className={`absolute inset-0 w-full h-full object-cover transition-all duration-300 ease-out group-hover:scale-105 ${
                              isSelected
                                ? 'brightness-125 saturate-125'
                                : 'brightness-105 saturate-110 group-hover:brightness-115 group-hover:saturate-125'
                            }`}
                          />
                        )}

                        {/* Gradient scrim for crisp white text contrast (brighter on selected card) */}
                        <div
                          className={`absolute inset-0 pointer-events-none transition-opacity duration-200 ${
                            isSelected
                              ? 'bg-[linear-gradient(to_top,rgba(0,0,0,0.72)_0%,rgba(0,0,0,0.16)_50%,rgba(0,0,0,0.02)_100%)]'
                              : 'bg-[linear-gradient(to_top,rgba(0,0,0,0.85)_0%,rgba(0,0,0,0.3)_100%)]'
                          }`}
                        />

                        {/* Top-right selection state badge */}
                        {isSelected ? (
                          <span className="absolute top-1.5 right-1.5 sm:top-1 sm:right-1 lg:top-2 lg:right-2 z-20 inline-flex items-center px-1.5 py-0.5 lg:px-2 lg:py-0.5 rounded-full bg-[#10B981] text-white font-bold text-[9px] sm:text-[8px] md:text-[9px] lg:text-[10px] leading-none shadow-sm whitespace-nowrap">
                            ✓ 선택됨
                          </span>
                        ) : (
                          <span className="absolute top-1.5 right-1.5 sm:top-1 sm:right-1 lg:top-2 lg:right-2 z-20 inline-flex items-center gap-1 px-1.5 py-0.5 lg:px-2 lg:py-0.5 rounded-full bg-black/55 group-hover:bg-[#10B981]/90 backdrop-blur-[2px] border border-white/40 group-hover:border-white/80 text-white/95 font-semibold text-[9px] sm:text-[8px] md:text-[9px] lg:text-[10px] leading-none shadow-xs transition-colors duration-200 whitespace-nowrap">
                            <span className="w-2 h-2 lg:w-2.5 lg:h-2.5 rounded-[2px] border border-white/85 inline-block shrink-0" />
                            <span>선택</span>
                          </span>
                        )}

                        {/* Compact bottom text overlay */}
                        <div className={`relative z-10 w-full h-full flex flex-col justify-end p-2 sm:p-1.5 md:p-2 lg:p-3 text-white [text-shadow:0_1px_4px_rgba(0,0,0,0.85)] transition-opacity duration-200 ${
                          isSelected ? 'opacity-100' : 'opacity-90 group-hover:opacity-100'
                        }`}>
                          <span className="block font-extrabold text-[14px] sm:text-[11px] md:text-[12px] lg:text-[14px] xl:text-[16px] leading-tight tracking-tight text-white">
                            {reg.name}
                          </span>
                          <span className="block mt-0.5 font-medium text-[10px] sm:text-[8.5px] md:text-[9.5px] lg:text-[10.5px] xl:text-[11.5px] leading-[1.2] text-white/95 break-keep">
                            {reg.subtitle}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. 여행 일정 */}
              <div className="bg-white rounded-[20px] p-4 sm:p-5 shadow-sm space-y-3">
                <div className="flex justify-between items-center pb-2.5 border-b border-black/[0.06] gap-2">
                  <h3 className="font-bold text-base md:text-lg text-gray-900 tracking-tight flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-[#0A7E54] text-white text-xs flex items-center justify-center font-bold shrink-0">2</span>
                    <span>여행 일정</span>
                  </h3>
                  <span className="text-xs text-[#8E8E93] font-medium">3박 4일 ~ 6박 7일</span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowScheduleModal(true)}
                  className="w-full p-4 md:p-4.5 rounded-2xl bg-[#ECFDF5] hover:bg-emerald-100/70 transition-all duration-200 active:scale-[0.98] flex items-center justify-between gap-3 cursor-pointer"
                >
                  <div className="flex items-center gap-3 text-left">
                    <span className="w-10 h-10 rounded-xl bg-[#0A7E54] text-white flex items-center justify-center text-lg shrink-0">
                      📅
                    </span>
                    <div>
                      <span className="text-xs font-semibold text-[#0A7E54] block">선택된 여행 기간</span>
                      <span className="text-base md:text-lg font-extrabold text-gray-900 tracking-tight">
                        {diyNights}박 {diyDays}일
                      </span>
                    </div>
                  </div>
                  <span className="px-3.5 py-2 rounded-xl bg-white text-xs md:text-sm font-bold text-[#0A7E54] shadow-2xs flex items-center gap-1 shrink-0 whitespace-nowrap">
                    <span>기간 선택</span>
                    <span>▾</span>
                  </span>
                </button>
              </div>

              {/* 3. 골프, 여행 선택 */}
              <div className="bg-white rounded-[20px] p-4 sm:p-5 shadow-sm space-y-3">
                <div className="flex justify-between items-start sm:items-center pb-2.5 border-b border-black/[0.06] gap-2">
                  <div className="min-w-0">
                    <h3 className="font-bold text-base md:text-lg text-gray-900 tracking-tight flex items-center gap-2.5 whitespace-nowrap">
                      <span className="w-6 h-6 rounded-full bg-[#0A7E54] text-white text-xs flex items-center justify-center font-bold shrink-0">3</span>
                      <span>골프, 여행 선택</span>
                    </h3>
                    <p className="text-xs text-[#8E8E93] mt-0.5">
                      버튼을 클릭하면 {diyLocation} ({diyNights}박 {diyDays}일) 기준 맞춤 팝업이 열립니다.
                    </p>
                  </div>
                  <span className="text-xs md:text-sm font-semibold text-[#0A7E54] bg-[#ECFDF5] px-3 py-1 rounded-full whitespace-nowrap shrink-0">
                    {diyActivityMode === 'golf' ? '골프 선택됨' : '여행 선택됨'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:gap-3 items-stretch">
                  {/* 골프 버튼 */}
                  <button
                    type="button"
                    onClick={() => {
                      setDiyActivityMode('golf');
                      setShowAllCoursesInGolfModal(false);
                      setShowActivityModal('golf');
                    }}
                    className={`p-3 sm:p-4 md:p-5 rounded-2xl text-left transition-all duration-200 active:scale-[0.98] flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-3 h-full cursor-pointer ${
                      diyActivityMode === 'golf'
                        ? 'bg-[#ECFDF5] ring-2 ring-[#0A7E54]'
                        : 'bg-[#F2F2F7]/80 hover:bg-[#ECFDF5]/60'
                    }`}
                  >
                    <div className="min-w-0 flex-1 flex items-baseline gap-1.5 sm:gap-2 whitespace-nowrap overflow-hidden">
                      <span className="font-extrabold text-[15px] sm:text-xl md:text-2xl text-gray-900 tracking-tight leading-tight shrink-0">
                        골프
                      </span>
                      <span className="text-[10px] sm:text-xs md:text-sm text-[#6B7280] font-medium truncate">
                        {diyLocation} 골프장 ({diyRounds}회)
                      </span>
                    </div>
                    <span className={`w-full md:w-auto text-center px-3 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-white shadow-2xs whitespace-nowrap shrink-0 ${
                      diyActivityMode === 'golf' ? 'text-[#0A7E54]' : 'text-[#3A3A3C]'
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
                    className={`p-3 sm:p-4 md:p-5 rounded-2xl text-left transition-all duration-200 active:scale-[0.98] flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-3 h-full cursor-pointer ${
                      diyActivityMode === 'tour'
                        ? 'bg-[#ECFDF5] ring-2 ring-[#0A7E54]'
                        : 'bg-[#F2F2F7]/80 hover:bg-[#ECFDF5]/60'
                    }`}
                  >
                    <div className="min-w-0 flex-1 flex items-baseline gap-1.5 sm:gap-2 whitespace-nowrap overflow-hidden">
                      <span className="font-extrabold text-[15px] sm:text-xl md:text-2xl text-gray-900 tracking-tight leading-tight shrink-0">
                        여행
                      </span>
                      <span className="text-[10px] sm:text-xs md:text-sm text-[#6B7280] font-medium truncate">
                        자유 · {diyLocation} 관광
                      </span>
                    </div>
                    <span className={`w-full md:w-auto text-center px-3 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-white shadow-2xs whitespace-nowrap shrink-0 ${
                      diyActivityMode === 'tour' ? 'text-[#0A7E54]' : 'text-[#3A3A3C]'
                    }`}>
                      상품 선택 ▾
                    </span>
                  </button>
                </div>

                {/* Current Active Golf / Tour Summary Strip */}
                <div className="p-3.5 md:p-4 rounded-2xl bg-[#ECFDF5] space-y-2.5">
                  {diyActivityMode === 'golf' ? (
                    <>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs md:text-sm font-bold text-[#0A7E54] whitespace-nowrap">
                          배정 골프장 ({diyRounds}회)
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowActivityModal('golf')}
                          className="px-3 py-1.5 bg-white hover:bg-gray-50 text-[#0A7E54] rounded-xl text-xs font-bold cursor-pointer shrink-0 whitespace-nowrap shadow-2xs transition active:scale-95"
                        >
                          코스/회차 변경
                        </button>
                      </div>
                      <div
                        className={`grid gap-1.5 sm:flex sm:flex-wrap ${
                          diyRounds === 1
                            ? 'grid-cols-1'
                            : diyRounds === 3
                            ? 'grid-cols-3'
                            : 'grid-cols-2'
                        }`}
                      >
                        {diyGolfCourses.slice(0, diyRounds).map((c, idx) => (
                          <span
                            key={idx}
                            className="px-2 sm:px-3 py-1.5 bg-white rounded-xl text-[11px] sm:text-xs font-semibold text-[#3A3A3C] shadow-2xs text-center truncate"
                          >
                            {idx + 1}R {c.split(' ')[0]}
                          </span>
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs md:text-sm font-bold text-[#0A7E54] whitespace-nowrap">
                          선택 여행 구성
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowActivityModal('tour')}
                          className="px-3 py-1.5 bg-white hover:bg-gray-50 text-[#0A7E54] rounded-xl text-xs font-bold cursor-pointer shrink-0 whitespace-nowrap shadow-2xs transition active:scale-95"
                        >
                          여행 상품 변경
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedTourItems.map((t) => (
                          <span
                            key={t.id}
                            className="px-2.5 sm:px-3 py-1.5 bg-white rounded-xl text-[11px] sm:text-xs font-semibold text-[#3A3A3C] shadow-2xs"
                          >
                            {t.name}{showDetailedCosts ? (t.priceUSD > 0 ? ` ($${t.priceUSD})` : ' (자유일정)') : (t.isFreeTravel ? ' (자유일정)' : '')}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* 4. 숙박 */}
              {(() => {
                const hotelNightRate = selectedHotelTier?.pricePerNightUSD ?? 90;
                const hotelTotalUSD = Math.round(hotelNightRate * diyNights);
                const hotelDisplayName = selectedHotelTier?.name || '고급 호텔';
                return (
                  <div className="bg-white rounded-[20px] p-4 sm:p-5 shadow-sm space-y-3">
                    <div className="flex justify-between items-start sm:items-center pb-2.5 border-b border-black/[0.06] gap-2">
                      <div className="min-w-0">
                        <h3 className="font-bold text-base md:text-lg text-gray-900 tracking-tight flex items-center gap-2.5 whitespace-nowrap">
                          <span className="w-6 h-6 rounded-full bg-[#0A7E54] text-white text-xs flex items-center justify-center font-bold shrink-0">4</span>
                          <span>숙박</span>
                        </h3>
                        <p className="text-xs text-[#8E8E93] mt-0.5">
                          우측 [숙박 변경] 버튼을 클릭하면 선택된 여행 기간({diyNights}박 기준 · 1인 1실) 맞춤 숙박 팝업이 열립니다.
                        </p>
                      </div>
                      <span
                        className={`text-xs md:text-sm font-semibold px-3 py-1 rounded-full whitespace-nowrap shrink-0 ${
                          diyIncludeHotel
                            ? 'text-[#0A7E54] bg-[#ECFDF5]'
                            : 'text-[#8E8E93] bg-[#F2F2F7]'
                        }`}
                      >
                        {diyIncludeHotel ? hotelDisplayName : '미포함'}
                      </span>
                    </div>

                    {/* 통합 숙박 카드 (체크박스 + 옵션 정보 + [숙박 변경]) */}
                    <div
                      onClick={() => setDiyIncludeHotel(prev => !prev)}
                      className={`w-full p-4 md:p-5 rounded-2xl text-left transition-all duration-200 flex items-center justify-between gap-3 cursor-pointer ${
                        diyIncludeHotel
                          ? 'bg-[#ECFDF5] hover:bg-emerald-100/70 ring-2 ring-[#0A7E54]'
                          : 'bg-[#F2F2F7]/80 hover:bg-[#ECFDF5]/60 opacity-85'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        <input
                          type="checkbox"
                          checked={diyIncludeHotel}
                          onClick={(e) => e.stopPropagation()}
                          onChange={() => setDiyIncludeHotel(prev => !prev)}
                          aria-label="숙박 포함 여부"
                          className="w-5 h-5 rounded-md accent-[#0A7E54] cursor-pointer shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-lg sm:text-xl md:text-[22px] text-gray-900 tracking-tight leading-snug break-keep">
                              {diyIncludeHotel ? hotelDisplayName : `${hotelDisplayName} (미포함)`}
                            </span>
                            {diyIncludeHotel && showDetailedCosts && (
                              <span className="text-[11px] text-[#0A7E54] bg-white px-2 py-0.5 rounded-lg font-bold shadow-2xs tabular-nums whitespace-nowrap">
                                1박 ${hotelNightRate.toLocaleString()} · {diyNights}박 총 ${hotelTotalUSD.toLocaleString()}
                              </span>
                            )}
                          </div>
                          <div className="text-xs sm:text-sm text-[#3A3A3C] line-clamp-1 mt-1">
                            {diyIncludeHotel
                              ? `${diyNights}박 기준 · 1인 1실 · ${selectedHotelTier?.description || '엄선된 숙박 옵션'}`
                              : '숙박 미포함 상태입니다 · 좌측 체크박스로 포함하거나 숙박을 변경하세요.'}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowHotelModal(true);
                        }}
                        className="px-3.5 py-2 rounded-xl text-xs md:text-sm font-bold bg-white hover:bg-gray-50 text-[#0A7E54] shadow-2xs whitespace-nowrap shrink-0 active:scale-95 transition cursor-pointer"
                      >
                        숙박 변경
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* 5. 차량 */}
              {(() => {
                const vehDayRate = selectedVehicleItem?.pricePerDayUSD ?? Math.max(15, 25 + (selectedVehicleItem?.priceDeltaUSD || 0));
                const vehTotalUSD = Math.round(vehDayRate * diyDays);
                const vehDisplayName = selectedVehicleItem?.shortName || selectedVehicleItem?.name || '9인승';
                return (
                  <div className="bg-white rounded-[20px] p-4 sm:p-5 shadow-sm space-y-3">
                    <div className="flex justify-between items-start sm:items-center pb-2.5 border-b border-black/[0.06] gap-2">
                      <div className="min-w-0">
                        <h3 className="font-bold text-base md:text-lg text-gray-900 tracking-tight flex items-center gap-2.5 whitespace-nowrap">
                          <span className="w-6 h-6 rounded-full bg-[#0A7E54] text-white text-xs flex items-center justify-center font-bold shrink-0">5</span>
                          <span>차량</span>
                        </h3>
                        <p className="text-xs text-[#8E8E93] mt-0.5">
                          우측 [차량 변경] 버튼을 클릭하면 전 일정({diyDays}일) 단독 전용 차량 선택 팝업이 열립니다.
                        </p>
                      </div>
                      <span
                        className={`text-xs md:text-sm font-semibold px-3 py-1 rounded-full whitespace-nowrap shrink-0 ${
                          diyIncludeVehicle
                            ? 'text-[#0A7E54] bg-[#ECFDF5]'
                            : 'text-[#8E8E93] bg-[#F2F2F7]'
                        }`}
                      >
                        {diyIncludeVehicle ? vehDisplayName : '미포함'}
                      </span>
                    </div>

                    {/* 통합 차량 카드 (체크박스 + 옵션 정보 + [차량 변경]) */}
                    <div
                      onClick={() => setDiyIncludeVehicle(prev => !prev)}
                      className={`w-full p-4 md:p-5 rounded-2xl text-left transition-all duration-200 flex items-center justify-between gap-3 cursor-pointer ${
                        diyIncludeVehicle
                          ? 'bg-[#ECFDF5] hover:bg-emerald-100/70 ring-2 ring-[#0A7E54]'
                          : 'bg-[#F2F2F7]/80 hover:bg-[#ECFDF5]/60 opacity-85'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        <input
                          type="checkbox"
                          checked={diyIncludeVehicle}
                          onClick={(e) => e.stopPropagation()}
                          onChange={() => setDiyIncludeVehicle(prev => !prev)}
                          aria-label="차량 포함 여부"
                          className="w-5 h-5 rounded-md accent-[#0A7E54] cursor-pointer shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-lg sm:text-xl md:text-[22px] text-gray-900 tracking-tight leading-snug break-keep">
                              {diyIncludeVehicle ? vehDisplayName : `${vehDisplayName} (미포함)`}
                            </span>
                            {diyIncludeVehicle && showDetailedCosts && (
                              <span className="text-[11px] text-[#0A7E54] bg-white px-2 py-0.5 rounded-lg font-bold shadow-2xs tabular-nums whitespace-nowrap">
                                1일 ${vehDayRate.toLocaleString()} · {diyDays}일 총 ${vehTotalUSD.toLocaleString()}
                              </span>
                            )}
                          </div>
                          <div className="text-xs sm:text-sm text-[#3A3A3C] line-clamp-1 mt-1">
                            {diyIncludeVehicle
                              ? `전 일정(${diyDays}일) 단독 전용 · 차량 1대 (인원 무관) · ${selectedVehicleItem?.description || ''}`
                              : '차량 미포함 상태입니다 · 좌측 체크박스로 포함하거나 차량을 변경하세요.'}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowVehicleModal(true);
                        }}
                        className="px-3.5 py-2 rounded-xl text-xs md:text-sm font-bold bg-white hover:bg-gray-50 text-[#0A7E54] shadow-2xs whitespace-nowrap shrink-0 active:scale-95 transition cursor-pointer"
                      >
                        차량 변경
                      </button>
                    </div>
                  </div>
                );
              })()}

              {/* 6. 기타 (Multi-select 2x2 Grid: 가이드, 패스트 트랙, 마사지, 저녁식사) */}
              <div className="bg-white rounded-[20px] p-4 sm:p-5 shadow-sm space-y-3">
                <div className="flex justify-between items-center pb-2.5 border-b border-black/[0.06] gap-2">
                  <h3 className="font-bold text-base md:text-lg text-gray-900 tracking-tight flex items-center gap-2.5 whitespace-nowrap">
                    <span className="w-6 h-6 rounded-full bg-[#0A7E54] text-white text-xs flex items-center justify-center font-bold shrink-0">6</span>
                    <span>기타</span>
                  </h3>
                  <span className="text-xs text-[#8E8E93] font-medium text-right">복수 선택 가능</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {diyExtraServices.map((svc) => {
                    const isChecked = diySelectedExtraIds.includes(svc.id);
                    const isGuideSvc = svc.id === 'guide' || svc.name.includes('가이드');
                    const unitText = isGuideSvc
                      ? (svc.pricingUnit === 'per_day' ? `1일 $${svc.priceUSD} (팀 기준)` : `팀 총 $${svc.priceUSD}`)
                      : (svc.pricingUnit === 'per_day' ? `1일 $${svc.priceUSD}` : `1인 $${svc.priceUSD}`);
                    const appliedCost = svc.pricingUnit === 'per_day' ? svc.priceUSD * diyDays : svc.priceUSD;
                    return (
                      <div
                        key={svc.id}
                        onClick={() => handleToggleExtraService(svc.id)}
                        className={`p-4 rounded-2xl cursor-pointer transition-all duration-200 active:scale-[0.98] flex items-center justify-between gap-2.5 ${
                          isChecked
                            ? 'bg-[#ECFDF5] ring-2 ring-[#0A7E54]'
                            : 'bg-[#F2F2F7]/80 hover:bg-[#ECFDF5]/60'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="w-5 h-5 rounded-md accent-[#0A7E54] cursor-pointer shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="font-extrabold text-base sm:text-[17px] md:text-lg text-gray-900 tracking-tight leading-snug flex items-center gap-2 flex-wrap">
                              <span>{showDetailedCosts ? svc.name : sanitizeNonGolfPriceText(svc.name)}</span>
                              {showDetailedCosts && (
                                <span className="text-[11px] text-[#0A7E54] bg-white px-2 py-0.5 rounded-lg font-semibold shadow-2xs">
                                  {unitText}
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-[#6B7280] mt-1 line-clamp-1">
                              {showDetailedCosts ? svc.description : sanitizeNonGolfPriceText(svc.description)}
                            </div>
                          </div>
                        </div>
                        <span className={`text-xs md:text-sm font-bold shrink-0 whitespace-nowrap ${isChecked ? 'text-[#0A7E54]' : 'text-[#8E8E93]'}`}>
                          {isChecked ? (showDetailedCosts ? `포함 ($${appliedCost})` : '포함') : '미포함'}
                        </span>
                      </div>
                    );
                  })}

                  {/* 4th Menu Card: 저녁식사 (Day-by-day Modal Selector) */}
                  <div
                    onClick={() => {
                      setActiveDinnerDay(1);
                      setShowDinnerModal(true);
                    }}
                    className={`p-4 rounded-2xl cursor-pointer transition-all duration-200 active:scale-[0.98] flex items-center justify-between gap-2.5 ${
                      dinnerCount > 0
                        ? 'bg-[#ECFDF5] ring-2 ring-[#0A7E54]'
                        : 'bg-[#F2F2F7]/80 hover:bg-[#ECFDF5]/60'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <input
                        type="checkbox"
                        checked={dinnerCount > 0}
                        onChange={() => {}}
                        className="w-5 h-5 rounded-md accent-[#0A7E54] cursor-pointer shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="font-extrabold text-base sm:text-[17px] md:text-lg text-gray-900 tracking-tight leading-snug flex items-center gap-2 flex-wrap">
                          <span>저녁식사</span>
                          <span className="text-[11px] text-[#0A7E54] bg-white px-2 py-0.5 rounded-lg font-semibold shadow-2xs">
                            {dinnerCount > 0 ? '변경 ▾' : '식사 선택 ▾'}
                          </span>
                        </div>
                        <div className="text-xs text-[#6B7280] mt-1 line-clamp-1">
                          {dinnerCount > 0
                            ? selectedDinnerEntries.map(e => `${e.day}일차 ${e.menu.name}`).join(' · ')
                            : `${diyLocation} 지역 대표 메뉴 중 일자별 선택`}
                        </div>
                      </div>
                    </div>
                    <span className={`text-xs md:text-sm font-bold shrink-0 whitespace-nowrap ${dinnerCount > 0 ? 'text-[#0A7E54]' : 'text-[#8E8E93]'}`}>
                      {dinnerCount > 0
                        ? (showDetailedCosts
                            ? `선택 (${dinnerCount}회 · $${dinnerPerPersonTotal.toLocaleString()})`
                            : `선택 (${dinnerCount}회 · 포함)`)
                        : '미포함'}
                    </span>
                  </div>
                </div>

                {/* Selected Dinner Summary Strip */}
                {dinnerCount > 0 && (
                  <div className="p-3.5 rounded-2xl bg-[#ECFDF5] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-1.5 text-xs md:text-sm">
                      <span className="font-bold text-[#0A7E54] mr-1 whitespace-nowrap">선택 저녁식사</span>
                      {selectedDinnerEntries.map(({ day, menu }) => (
                        <span
                          key={day}
                          className="px-2.5 py-1 bg-white rounded-xl text-xs font-semibold text-[#3A3A3C] shadow-2xs whitespace-nowrap"
                        >
                          {day}일차 · {menu.name}{showDetailedCosts ? ` ($${menu.priceUSD})` : ''}
                        </span>
                      ))}
                      {showDetailedCosts && (
                        <span className="px-2.5 py-1 bg-[#0A7E54] text-white rounded-xl text-xs font-bold tabular-nums whitespace-nowrap">
                          1인 ${dinnerPerPersonTotal.toLocaleString()} ({personCount}인 ${(dinnerPerPersonTotal * personCount).toLocaleString()})
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveDinnerDay(1);
                        setShowDinnerModal(true);
                      }}
                      className="self-start sm:self-auto px-3.5 py-1.5 bg-white hover:bg-gray-50 text-[#0A7E54] rounded-xl text-xs font-bold cursor-pointer shrink-0 whitespace-nowrap shadow-2xs transition active:scale-95"
                    >
                      식사 변경
                    </button>
                  </div>
                )}
              </div>

              {/* Bottom Real-Time Price Preview & Package Generation Action Box */}
              <div className="bg-[#0A7E54] text-white rounded-[20px] p-4 sm:p-5 shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-white/15">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="px-2.5 py-0.5 rounded-full bg-white text-[#0A7E54] text-xs font-bold">
                        {diyLocation}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-white/15 text-white text-xs font-semibold">
                        {diyNights}박 {diyDays}일 · {diyActivityMode === 'golf' ? `${diyRounds}회 (${diyRounds * 18}홀)` : '여행 맞춤'}
                      </span>
                    </div>
                    <h3 className="text-lg sm:text-xl md:text-2xl font-extrabold text-white tracking-tight">
                      [고객 맞춤 DIY] {diyLocation} {diyNights}박 {diyDays}일 {diyActivityMode === 'golf' ? '명문 골프 투어' : '맞춤 여행'}
                    </h3>
                    <p className="text-xs md:text-sm text-emerald-100/90 mt-1">
                      {diyActivityMode === 'golf'
                        ? `${diyGolfCourses.slice(0, diyRounds).join(' · ')} 라운딩 & ${diyIncludeHotel ? (selectedHotelTier?.name || '숙박') : '숙박 미포함'} · ${diyIncludeVehicle ? (selectedVehicleItem?.shortName || selectedVehicleItem?.name || '전용 차량') : '차량 미포함'}`
                        : `${selectedTourItems.map(t => t.name).join(' · ') || '자유 여행'} & ${diyIncludeHotel ? (selectedHotelTier?.name || '숙박') : '숙박 미포함'} · ${diyIncludeVehicle ? (selectedVehicleItem?.shortName || selectedVehicleItem?.name || '전용 차량') : '차량 미포함'}`}
                    </p>
                  </div>

                  {(() => {
                    const bd = getDIYPriceBreakdown();
                    const teamParts: string[] = [];
                    if (diyIncludeVehicle) teamParts.push('차량');
                    if (bd.guideTotal > 0) teamParts.push('가이드');
                    const teamIncludedSuffix = teamParts.length > 0 ? ` · ${teamParts.join('·')} 포함` : ' · 차량·가이드 미포함';
                    return (
                      <div className="text-left sm:text-right shrink-0">
                        <span className="text-xs text-emerald-100 block font-medium">
                          1인당 예상 경비 ({personCount}인 기준{teamIncludedSuffix})
                        </span>
                        <span className="text-2xl sm:text-3xl md:text-4xl font-black text-white tabular-nums tracking-tight">
                          ${bd.perPersonWithShareUSD.toLocaleString()}
                        </span>
                        <span className="text-xs md:text-sm text-emerald-100 block font-semibold">
                          (1인 약 {(bd.perPersonWithShareUSD * USD_TO_KRW).toLocaleString()}원 · {personCount}인 총액 ${bd.groupTotalUSD.toLocaleString()})
                        </span>
                        {showDetailedCosts && (
                          <span className="text-[11px] text-emerald-200/80 block mt-0.5">
                            1인 기본 ${bd.perPersonOnlyUSD.toLocaleString()}
                            {bd.teamFixedUSD > 0 ? ` + ${teamParts.join('·')}(${diyDays}일) $${bd.teamFixedUSD.toLocaleString()}` : ''}
                          </span>
                        )}
                      </div>
                    );
                  })()}
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-1">
                  <div className="text-xs md:text-sm text-emerald-100/90 leading-snug w-full sm:w-auto">
                    상세 견적서 화면으로 이동해 항목별 세부 조율, 일정표 확인, 카톡 상담 및 견적서 저장이 가능합니다.
                  </div>

                  <button
                    type="button"
                    onClick={handleCreateDIYPackage}
                    className="w-full sm:w-auto px-6 py-4 bg-white hover:bg-[#ECFDF5] text-[#0A7E54] rounded-2xl font-extrabold text-sm sm:text-base shadow-sm transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                  >
                    <span>맞춤 견적서 생성 & 세부 조율</span>
                    <span>→</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}


        {/* ================= VIEW 2: ACTIVE PACKAGE CUSTOMIZER ================= */}
        {activePackage && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 w-full max-w-full min-w-0">
            
            {/* Left Column (7 cols): Options & Itinerary */}
            <div className="lg:col-span-7 space-y-4 sm:space-y-5 w-full max-w-full min-w-0">
              
              {/* Capturable Card Wrapper */}
              <div 
                ref={quotationCardRef} 
                className="bg-white rounded-[20px] p-5 sm:p-7 shadow-sm space-y-4 sm:space-y-5 relative w-full max-w-full"
              >
                {/* Brand Watermark on Image */}
                <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-[#0A7E54] text-white flex items-center justify-center font-black text-xs">M</span>
                    <span className="font-bold text-xs sm:text-sm md:text-base tracking-tight text-[#0A7E54]">MANGO TOUR 맞춤 견적서</span>
                  </div>
                  <div className="text-[11px] md:text-xs font-medium text-[#8E8E93]">
                    발급일: {new Date().toLocaleDateString('ko-KR')}
                  </div>
                </div>

                {/* Package Summary Card */}
                <div className="px-1 sm:px-0">
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center justify-between pb-2.5 sm:pb-3">
                    <div>
                      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full bg-[#0A7E54] text-white text-[11px] sm:text-xs font-semibold whitespace-nowrap">
                          📍 {activePackage.location}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-[#ECFDF5] text-[#0A7E54] text-[11px] sm:text-xs font-semibold whitespace-nowrap">
                          ⏱️ {activePackage.duration}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-[#F2F2F7] text-[#3A3A3C] text-[11px] sm:text-xs font-semibold whitespace-nowrap">
                          1인 1실 기준 · 가이드/패스트트랙 선택
                        </span>
                      </div>
                      <h2 className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-900 leading-snug tracking-tight">{activePackage.title}</h2>
                      <p className="text-xs sm:text-sm md:text-base text-[#8E8E93] mt-1 leading-relaxed font-normal">{activePackage.summary || activePackage.subtitle}</p>
                    </div>
                  </div>

                  {/* Golf Course or Tour Summary Chips */}
                  {customGolfCourses.length > 0 ? (
                    <div className="mt-2.5 pt-3 border-t border-black/[0.06]">
                      <div className="text-xs md:text-sm font-bold text-gray-900 mb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="whitespace-nowrap">⛳ 라운딩 코스 안내</span>
                          <span className="text-[11px] md:text-xs font-normal text-[#8E8E93] whitespace-nowrap">({customGolfCourses.length}개소)</span>
                          {isGolfCoursesModified && (
                            <span className="px-2 py-0.5 bg-[#ECFDF5] text-[#0A7E54] rounded-full text-[11px] md:text-xs font-semibold whitespace-nowrap">
                              맞춤 설정됨
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowGolfModal(true)}
                          className="self-start sm:self-auto px-3.5 py-1.5 bg-[#0A7E54] hover:bg-[#086945] text-white text-[11px] sm:text-xs md:text-sm font-semibold rounded-xl transition-all duration-200 flex items-center gap-1.5 active:scale-95 cursor-pointer whitespace-nowrap"
                        >
                          <span>일정별 골프장 변경</span>
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {customGolfCourses.map((c, i) => (
                          <span 
                            key={i} 
                            onClick={() => setShowGolfModal(true)}
                            className="px-3 py-1.5 bg-[#ECFDF5] hover:bg-emerald-100/80 text-[#0A7E54] rounded-xl text-[11px] sm:text-xs md:text-sm font-semibold flex items-center gap-1.5 cursor-pointer transition-all duration-200 active:scale-95"
                            title="클릭하여 골프장 변경"
                          >
                            <span className="w-4 h-4 rounded-full bg-[#0A7E54] text-white text-[10px] flex items-center justify-center font-bold">
                              {i + 1}
                            </span>
                            <span>{c}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-2.5 pt-3 border-t border-black/[0.06]">
                      <div className="text-xs md:text-sm font-bold text-gray-900 mb-1.5 flex items-center gap-1.5">
                        <span>🧳 선택 여행 구성</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="px-3 py-1.5 bg-[#ECFDF5] text-[#0A7E54] rounded-xl text-xs md:text-sm font-semibold">
                          {activePackage.subtitle}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* iOS Segmented Control Tabs */}
                <div className="px-1 sm:px-0">
                  <div className="bg-[#F2F2F7] p-1 rounded-2xl grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setViewTab('options')}
                      className={`py-2.5 px-2 sm:px-4 rounded-xl text-xs sm:text-sm md:text-base transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
                        viewTab === 'options'
                          ? 'bg-white text-[#0A7E54] shadow-sm font-bold'
                          : 'text-[#8E8E93] hover:text-gray-900 font-semibold'
                      }`}
                    >
                      <span className="truncate">맞춤 항목 선택</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs shrink-0 ${
                        viewTab === 'options'
                          ? 'bg-[#ECFDF5] text-[#0A7E54] font-bold'
                          : 'bg-gray-200/80 text-[#3A3A3C] font-semibold'
                      }`}>
                        {selectedOptionIds.size}/{activePackage.options.length}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewTab('itinerary')}
                      className={`py-2.5 px-2 sm:px-4 rounded-xl text-xs sm:text-sm md:text-base transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
                        viewTab === 'itinerary'
                          ? 'bg-white text-[#0A7E54] shadow-sm font-bold'
                          : 'text-[#8E8E93] hover:text-gray-900 font-semibold'
                      }`}
                    >
                      <span className="truncate">{activePackage.duration || '4박 5일'} 정규 일정표</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] sm:text-xs shrink-0 ${
                        viewTab === 'itinerary'
                          ? 'bg-[#ECFDF5] text-[#0A7E54] font-bold'
                          : 'bg-gray-200/80 text-[#3A3A3C] font-semibold'
                      }`}>
                        일정
                      </span>
                    </button>
                  </div>
                </div>

                {/* TAB 1: Checkable Options List */}
                {viewTab === 'options' && (
                  <div className="space-y-3 pt-1">
                    <div className="flex justify-between items-center pb-2.5 border-b border-black/[0.06] px-1 sm:px-0">
                      <div>
                        <h3 className="font-bold text-sm sm:text-base md:text-lg text-gray-900 tracking-tight">맞춤 항목 체크리스트 & 변경</h3>
                        <p className="text-[11px] sm:text-xs md:text-sm text-[#8E8E93] font-normal mt-0.5 leading-relaxed">필요 없는 항목은 해제하고 세부 구성을 변경해보세요.</p>
                      </div>
                      <div className="text-right whitespace-nowrap shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            const allIds = new Set(activePackage.options.map(o => o.id));
                            setSelectedOptionIds(allIds);
                          }}
                          className="text-xs text-[#0A7E54] font-semibold hover:underline mr-2.5 cursor-pointer"
                        >
                          전체 선택
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const reqIds = new Set(activePackage.options.filter(o => o.isRequired).map(o => o.id));
                            setSelectedOptionIds(reqIds);
                          }}
                          className="text-xs text-[#8E8E93] font-semibold hover:underline cursor-pointer"
                        >
                          필수만
                        </button>
                      </div>
                    </div>

                    {/* Options List */}
                    <div className="space-y-2.5">
                      {activePackage.options.map(option => {
                        const isSelected = selectedOptionIds.has(option.id);
                        const isGolfOpt = option.category === 'golf';
                        const canShowOptionPrice = showDetailedCosts || isGolfOpt;
                        const rawDisplayName = getOptionDisplayName(option);
                        const displayName = canShowOptionPrice ? rawDisplayName : sanitizeNonGolfPriceText(rawDisplayName);
                        const mobileSummary = getMobileOptionSummary(option, displayName);
                        const badge = getCategoryBadge(option.category, rawDisplayName);
                        const effectivePrice = getOptionPrice(option);
                        const isCustomized = !!customOptionSelections[option.id] || (option.category === 'golf' && isGolfCoursesModified);
                        const isExpanded = expandedOptionId === option.id;

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
                        const desktopSub = isFastTrack ? (canShowOptionPrice ? '1인당 $60 선택 추가' : '공항 VIP 전용 패스트트랙 선택 추가') :
                          option.category === 'vehicle' ? (canShowOptionPrice ? `${pkgTravelDays}일 일정 총액 (1대 · 인원 무관)` : `${pkgTravelDays}일 전 일정 단독 전용 (1대 · 인원 무관)`) :
                          option.category === 'hotel' ? '1인 1실 단독 투숙' :
                          option.category === 'guide' ? (canShowOptionPrice ? `${pkgTravelDays}일 일정 총액 (1명 · 인원 무관)` : `${pkgTravelDays}일 전 일정 전담 동행 (1명 · 인원 무관)`) :
                          (option.category === 'activity' && option.name.includes('마사지')) ? (canShowOptionPrice ? '기본 선택 포함 ($50)' : '기본 선택 포함') :
                          option.category === 'meal' ? (canShowOptionPrice ? '1인 1일 $50 기준 선택 가능' : '전 일정 특식 선택 가능') : '';

                        const canCustomizeOption =
                          option.category === 'golf' ||
                          ['hotel', 'vehicle', 'guide', 'meal', 'activity'].includes(option.category) ||
                          option.allowCustomSelection;

                        const changeButtonLabel =
                          option.category === 'golf'
                            ? '골프장 변경'
                            : option.category === 'hotel'
                            ? '숙박 변경'
                            : option.category === 'vehicle'
                            ? '차량 변경'
                            : option.category === 'guide'
                            ? '가이드 변경'
                            : option.category === 'meal'
                            ? '식사 변경'
                            : `${option.name.replace(/\s*\([^)]*\)/g, '').trim().slice(0, 8)} 변경`;

                        return (
                          <div
                            key={option.id}
                            onClick={() => handleToggleOption(option)}
                            className={`rounded-2xl p-3.5 sm:p-4 transition-all duration-200 cursor-pointer space-y-2 ${
                              isSelected
                                ? 'bg-[#ECFDF5] ring-1 ring-[#0A7E54]/30'
                                : 'bg-[#F2F2F7] opacity-65 hover:opacity-100'
                            }`}
                          >
                            {/* Top Row: Checkbox + Badge + Tags (Left) & Change Action (Right) */}
                            <div className="flex items-center justify-between gap-2 pb-2 border-b border-black/[0.05] min-w-0">
                              <div className="flex items-center gap-2 min-w-0 flex-wrap">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  disabled={option.isRequired}
                                  onChange={() => {}}
                                  className="w-4 h-4 sm:w-5 sm:h-5 rounded-md accent-[#0A7E54] cursor-pointer shrink-0"
                                />
                                <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold bg-white text-[#0A7E54] whitespace-nowrap shrink-0">
                                  {badge.label}
                                </span>
                                {option.isRequired && (
                                  <span className="text-[10px] text-[#0A7E54] font-bold bg-white/80 px-1.5 py-0.5 rounded-md whitespace-nowrap shrink-0">
                                    필수
                                  </span>
                                )}
                                {isCustomized && (
                                  <span className="text-[10px] text-[#0A7E54] font-semibold bg-white px-2 py-0.5 rounded-full whitespace-nowrap shrink-0">
                                    맞춤 변경
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
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
                                    className="text-[11px] text-[#8E8E93] hover:text-red-500 underline cursor-pointer px-1 whitespace-nowrap"
                                  >
                                    초기화
                                  </button>
                                )}
                                {canCustomizeOption && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (option.category === 'golf') {
                                        setShowGolfModal(true);
                                      } else {
                                        setCustomizingOption(option);
                                        setOptionModalFilter('전체');
                                        setOptionModalTypeFilter('전체');
                                      }
                                    }}
                                    className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-white hover:bg-gray-50 text-[#0A7E54] rounded-xl text-[11px] md:text-xs font-bold transition-all duration-200 flex items-center gap-1 shadow-2xs active:scale-95 cursor-pointer whitespace-nowrap"
                                  >
                                    <span>{changeButtonLabel} ▾</span>
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Main Content Row: Title & Subtitle (Left) + Price / Status (Right) */}
                            <div className="flex items-center justify-between gap-3 pl-6 sm:pl-7 min-w-0">
                              <div className="min-w-0 flex-1">
                                <div className={`text-xs sm:text-sm md:text-base font-bold tracking-tight leading-snug ${isSelected ? 'text-gray-900' : 'text-[#8E8E93] line-through'}`}>
                                  <span className="sm:hidden">{mobileSummary.title}</span>
                                  <span className="hidden sm:inline">{displayName}</span>
                                </div>
                                {(mobileSummary.subtitle || desktopSub) && (
                                  <p className="text-[11px] text-[#8E8E93] mt-0.5 font-normal leading-snug">
                                    {mobileSummary.subtitle && (
                                      <span className="sm:hidden">{mobileSummary.subtitle}</span>
                                    )}
                                    {desktopSub && (
                                      <span className="hidden sm:inline">{desktopSub}</span>
                                    )}
                                  </p>
                                )}
                              </div>

                              <div className="text-right whitespace-nowrap shrink-0">
                                {(() => {
                                  const isTeamOpt = option.category === 'vehicle' || option.category === 'guide';
                                  const shownUSD = isTeamOpt ? getOptionGroupTotalUSD(option) : effectivePrice;
                                  if (!canShowOptionPrice) {
                                    return (
                                      <>
                                        <span className={`text-xs sm:text-sm font-extrabold ${isSelected ? 'text-[#0A7E54]' : 'text-[#8E8E93]'}`}>
                                          {isSelected ? '포함' : '미포함'}
                                        </span>
                                        <span className="block text-[10px] md:text-xs text-[#8E8E93] font-normal">
                                          {isSelected ? '합산 금액 반영' : '견적 제외'}
                                        </span>
                                      </>
                                    );
                                  }
                                  return (
                                    <>
                                      <span className={`text-sm md:text-base font-extrabold tabular-nums ${isSelected ? 'text-[#0A7E54]' : 'text-[#8E8E93]'}`}>
                                        ${shownUSD.toLocaleString()}
                                      </span>
                                      <span className="block text-[10px] md:text-xs text-[#8E8E93] font-normal">
                                        {isTeamOpt
                                          ? `${pkgTravelDays}일 총액`
                                          : `1인 (약 ${(shownUSD * USD_TO_KRW).toLocaleString()}원)`}
                                      </span>
                                    </>
                                  );
                                })()}
                              </div>
                            </div>

                            {isExpanded && ['hotel', 'vehicle', 'guide', 'meal'].includes(option.category) && (
                              <div className="p-4 bg-white rounded-b-2xl border-t border-black/[0.06] space-y-2.5 animate-fade-in">
                                <div className="flex justify-between items-center pb-1 border-b border-black/[0.05]">
                                  <span className="text-xs md:text-sm font-bold text-[#0A7E54]">
                                    {option.category === 'hotel' ? '선호 숙박 형태 선택' : '선택 가능한 옵션'}
                                  </span>
                                  <span className="text-[11px] text-[#8E8E93]">즉시 적용</span>
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
                                          if (!selectedOptionIds.has(option.id)) {
                                            setSelectedOptionIds(prev => new Set(prev).add(option.id));
                                          }
                                        }}
                                        className={`p-3 rounded-2xl text-xs md:text-sm cursor-pointer transition-all duration-200 flex flex-col justify-between active:scale-[0.98] ${
                                          isChoiceActive
                                            ? 'bg-[#ECFDF5] ring-2 ring-[#0A7E54]'
                                            : 'bg-[#F2F2F7] hover:bg-gray-200/70'
                                        }`}
                                      >
                                        <div>
                                          <div className="flex items-center justify-between gap-1 mb-1">
                                            <span className="font-bold text-gray-900 line-clamp-1">
                                              {canShowOptionPrice ? choice.name : sanitizeNonGolfPriceText(choice.name)}
                                            </span>
                                            {choice.badge && (
                                              <span className="px-1.5 py-0.5 bg-white text-[#0A7E54] rounded text-[10px] font-semibold shrink-0">
                                                {choice.badge}
                                              </span>
                                            )}
                                          </div>
                                          {choice.description && (
                                            <p className="text-[11px] text-[#8E8E93] leading-snug line-clamp-2">
                                              {canShowOptionPrice ? choice.description : sanitizeNonGolfPriceText(choice.description)}
                                            </p>
                                          )}
                                        </div>

                                        <div className="flex items-center justify-between pt-2 mt-2 border-t border-black/[0.06]">
                                          <span className="text-[11px] font-semibold text-[#8E8E93]">
                                            {choice.type === 'pool_villa' ? '독채 풀빌라' : choice.type === 'hotel_5star' ? '고급 호텔' : (choice.type === 'vehicle' || choice.type === 'guide') ? `${pkgTravelDays}일 팀 기준` : '기본 옵션'}
                                          </span>
                                          <span className={`text-xs font-bold ${
                                            !canShowOptionPrice
                                              ? (isChoiceActive ? 'text-[#0A7E54]' : 'text-[#3A3A3C]')
                                              : choice.priceDeltaUSD === 0 ? 'text-[#3A3A3C]' : 'text-[#0A7E54]'
                                          }`}>
                                            {!canShowOptionPrice ? (
                                              isChoiceActive ? '선택됨 (포함)' : '선택 가능'
                                            ) : choice.type === 'vehicle' || choice.type === 'guide'
                                              ? (choice.priceDeltaUSD === 0
                                                  ? `기본 ($${choice.teamTotalUSD ?? 0})`
                                                  : choice.priceDeltaUSD > 0
                                                  ? `총 $${choice.teamTotalUSD ?? 0} (+$${choice.priceDeltaUSD})`
                                                  : `총 $${choice.teamTotalUSD ?? 0} (-$${Math.abs(choice.priceDeltaUSD)})`)
                                              : (choice.priceDeltaUSD === 0 
                                                  ? '기본가 ($0)' 
                                                  : choice.priceDeltaUSD > 0 
                                                  ? `+1인 $${choice.priceDeltaUSD}` 
                                                  : `-1인 $${Math.abs(choice.priceDeltaUSD)}`)}
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
                  <div className="space-y-4 pt-1 px-1 sm:px-0">
                    <div className="flex justify-between items-center gap-2">
                      <div>
                        <h3 className="font-bold text-base md:text-xl text-gray-900 tracking-tight">4박 5일 정규 일정표</h3>
                        <p className="text-xs md:text-sm text-[#8E8E93] mt-0.5">선택하신 골프장과 숙박 형태가 반영됩니다.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowGolfModal(true)}
                        className="px-3.5 py-2 bg-[#0A7E54] text-white text-xs md:text-sm font-semibold rounded-xl hover:bg-[#086945] transition-all duration-200 active:scale-95 cursor-pointer shrink-0"
                      >
                        골프장 변경
                      </button>
                    </div>

                    <div className="space-y-3">
                      {activePackage.itinerary?.map((item) => {
                        let dayTitle = item.title;
                        const roundIdx = item.day >= 2 ? item.day - 2 : 0;
                        if (customGolfCourses[roundIdx] && (item.title.includes('CC') || item.title.includes('골프') || item.title.includes('라운딩'))) {
                          dayTitle = `Day ${item.day}: ${customGolfCourses[roundIdx]} 18홀 라운딩`;
                        }

                        return (
                          <div key={item.day} className="flex gap-3 md:gap-4 items-start">
                            <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-[#0A7E54] text-white font-bold text-xs md:text-sm flex items-center justify-center flex-shrink-0">
                              D{item.day}
                            </div>
                            <div className="bg-[#F2F2F7] rounded-2xl p-3.5 md:p-4 flex-grow">
                              <h4 className="text-xs sm:text-sm md:text-base font-bold text-gray-900 mb-1.5 flex items-center justify-between gap-2">
                                <span>{dayTitle}</span>
                                {item.day >= 2 && customGolfCourses[roundIdx] && (
                                  <span className="text-[11px] md:text-xs bg-[#ECFDF5] text-[#0A7E54] px-2.5 py-0.5 rounded-full font-semibold shrink-0">
                                    {customGolfCourses[roundIdx]}
                                  </span>
                                )}
                              </h4>
                              <ul className="space-y-1">
                                {item.activities.map((act, aIdx) => {
                                  let actText = act;
                                  if (customGolfCourses[roundIdx] && act.includes('CC') && (act.includes('라운딩') || act.includes('이동'))) {
                                    actText = act.replace(/[가-힣a-zA-Z0-9\s]+CC/g, customGolfCourses[roundIdx].split(' ')[0] + ' CC');
                                  }
                                  return (
                                    <li key={aIdx} className="text-xs md:text-sm text-[#3A3A3C] flex items-start gap-1.5 leading-relaxed">
                                      <span className="text-[#0A7E54] mt-0.5">•</span>
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

                {/* Official Quotation Summary Footer */}
                <div className="pt-4 mt-4 border-t border-black/[0.06] space-y-3 px-1 sm:px-0">
                  <div className="bg-[#0A7E54] text-white p-4 sm:p-6 rounded-2xl">
                    <div className="flex flex-wrap justify-between items-center gap-2 mb-2.5 pb-2.5 border-b border-white/15 text-xs md:text-sm">
                      <div className="flex items-center gap-3">
                        <span className="text-emerald-100">출발일 <strong className="text-white">{departureDate || '미정'}</strong></span>
                        <span className="text-emerald-100">인원 <strong className="text-white">{personCount}명</strong></span>
                      </div>
                      <div className="text-[11px] md:text-xs text-emerald-100 font-semibold">
                        포함 {selectedOptionIds.size}개 · 제외 {activePackage.options.length - selectedOptionIds.size}개
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 my-2.5 py-2.5 border-b border-white/15 text-[11px] md:text-xs">
                      <div className="bg-white/10 p-2.5 sm:p-3 rounded-xl">
                        {customGolfCourses.length > 0 ? (
                          <>
                            <span className="text-emerald-100 font-semibold block mb-0.5">선택 골프장 ({customGolfCourses.length}회)</span>
                            <span className="text-white font-semibold line-clamp-1">{customGolfCourses.join(' · ')}</span>
                          </>
                        ) : (
                          <>
                            <span className="text-emerald-100 font-semibold block mb-0.5">선택 여행 일정</span>
                            <span className="text-white font-semibold line-clamp-1">
                              {(() => {
                                const tourOpt = activePackage.options.find(o => o.id === 'diy-opt-tour' || (o.category === 'activity' && !o.name.includes('마사지') && !o.name.includes('스파')));
                                const rawTour = tourOpt ? getOptionDisplayName(tourOpt).replace(/^선택 여행 일정:\s*/, '') : `${activePackage.location} ${activePackage.duration} 맞춤 여행`;
                                return showDetailedCosts ? rawTour : sanitizeNonGolfPriceText(rawTour);
                              })()}
                            </span>
                          </>
                        )}
                      </div>
                      <div className="bg-white/10 p-2.5 sm:p-3 rounded-xl">
                        <span className="text-emerald-100 font-semibold block mb-0.5">선택 숙박 형태</span>
                        <span className="text-white font-semibold line-clamp-1">
                          {showDetailedCosts ? getChosenAccommodationName() : sanitizeNonGolfPriceText(getChosenAccommodationName())}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pt-1">
                      <div>
                        <span className="text-[11px] md:text-xs text-emerald-100 block">1인당 예상 경비 ({personCount}인 기준)</span>
                        <div className="text-lg sm:text-xl font-bold text-white tracking-tight tabular-nums">
                          ${currentTotalPerPerson.toLocaleString()} <span className="text-xs font-semibold">USD</span>
                        </div>
                        <div className="text-[11px] md:text-xs text-emerald-100 font-normal">
                          (약 {(currentTotalPerPerson * USD_TO_KRW).toLocaleString()}원 / 1인)
                        </div>
                      </div>
                      <div className="text-left sm:text-right">
                        <span className="text-[11px] md:text-xs text-emerald-100 block font-semibold">총 {personCount}인 예상 견적 합계</span>
                        <div className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white tracking-tight tabular-nums">
                          ${currentTotalGroup.toLocaleString()} <span className="text-xs font-bold">USD</span>
                        </div>
                        <div className="text-[11px] md:text-xs text-emerald-100 font-normal">
                          (약 {(currentTotalGroup * USD_TO_KRW).toLocaleString()}원)
                        </div>
                      </div>
                    </div>

                    {customerNotes && (
                      <div className="mt-2.5 pt-2 border-t border-white/15 text-[11px] md:text-xs text-emerald-100 break-keep">
                        <span className="text-white font-semibold">요청사항: </span>
                        <span>{customerNotes}</span>
                      </div>
                    )}
                  </div>

                  {/* Official Inquiry Channels Footer */}
                  <div className="flex flex-col sm:flex-row justify-between items-center gap-1.5 px-1 text-[11px] md:text-xs text-[#8E8E93] font-normal w-full overflow-hidden">
                    <div className="truncate max-w-full">카카오톡 상담: <strong className="text-[#0A7E54] font-semibold break-all">open.kakao.com/o/gprQnKSi</strong></div>
                    <div className="truncate max-w-full">온라인 접수: <strong className="text-[#0A7E54] font-semibold">온라인 견적 신청서로 즉시 접수</strong></div>
                  </div>
                </div>

              </div>

            </div>


            {/* Right Column (5 cols): Real-Time Price Calculator & Inquiry Action Panel */}
            <div className="lg:col-span-5 space-y-4 sm:space-y-5 w-full max-w-full min-w-0">
              
              {/* Sticky Calculator Box */}
              <div className="bg-white rounded-[20px] p-5 sm:p-6 md:p-7 shadow-sm space-y-4 sm:space-y-5 sm:sticky sm:top-20 w-full max-w-full">
                
                <div className="bg-[#0A7E54] text-white p-4 sm:p-5 rounded-2xl text-center">
                  <div className="text-[11px] sm:text-xs text-emerald-100 font-semibold tracking-wide">실시간 맞춤 견적 계산기</div>
                  <div className="mt-1">
                    <span className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight tabular-nums">
                      ${currentTotalPerPerson.toLocaleString()}
                    </span>
                    <span className="text-xs md:text-sm text-emerald-100 font-normal ml-1">/ 1인 기준</span>
                  </div>
                  <div className="text-xs sm:text-sm text-emerald-100 font-medium mt-0.5">
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
                  <div className="p-3.5 md:p-4 bg-[#ECFDF5] rounded-2xl space-y-2">
                    <div className="flex items-center justify-between text-xs md:text-sm font-bold text-[#0A7E54]">
                      <span>맞춤 구성 요약</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setShowGolfModal(true)}
                          className="text-[11px] md:text-xs text-[#0A7E54] hover:underline font-semibold cursor-pointer"
                        >
                          골프장 변경
                        </button>
                        <span className="text-gray-300">·</span>
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
                          className="text-[11px] md:text-xs text-[#0A7E54] hover:underline font-semibold cursor-pointer"
                        >
                          숙소 변경
                        </button>
                      </div>
                    </div>
                    <div className="text-[11px] md:text-xs text-[#3A3A3C] space-y-2">
                      {customGolfCourses.length > 0 ? (
                        <div className="flex items-start gap-1.5">
                          <span className="font-semibold text-gray-900 shrink-0 mt-0.5">골프</span>
                          <div className="flex-1 flex flex-wrap gap-1.5">
                            {(() => {
                              const { rounds } = getDateMatchedGolfBreakdown();
                              return rounds.map((r, i) => (
                                <span
                                  key={i}
                                  className="text-[11px] px-2 py-0.5 rounded-lg bg-white text-[#3A3A3C] font-semibold flex items-center gap-1"
                                >
                                  <span>{r.dateStr}</span>
                                  <span className="font-bold text-gray-900">{r.courseName.split(' ')[0]}</span>
                                </span>
                              ));
                            })()}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-1.5">
                          <span className="font-semibold text-gray-900 shrink-0">투어</span>
                          <span className="text-[#3A3A3C] font-semibold bg-white px-2 py-0.5 rounded-lg text-[11px]">
                            {(() => {
                              const tourOpt = activePackage?.options.find(o => o.id === 'diy-opt-tour' || (o.category === 'activity' && !o.name.includes('마사지') && !o.name.includes('스파')));
                              const rawTour = tourOpt ? getOptionDisplayName(tourOpt).replace(/^선택 여행 일정:\s*/, '') : `${activePackage?.location || diyLocation} 맞춤 여행`;
                              return showDetailedCosts ? rawTour : sanitizeNonGolfPriceText(rawTour);
                            })()}
                          </span>
                        </div>
                      )}
                      <div className="flex items-start gap-1.5">
                        <span className="font-semibold text-gray-900 shrink-0">숙소</span>
                        <span className="text-[#3A3A3C] font-semibold bg-white px-2 py-0.5 rounded-lg text-[11px]">
                          {(() => {
                            const fullAcc = showDetailedCosts ? getChosenAccommodationName() : sanitizeNonGolfPriceText(getChosenAccommodationName());
                            const shortAcc = fullAcc
                              .replace(/\s*\((\d+박)\s*\/\s*1인\s*객실\s*기준\)/g, ' ($1)')
                              .replace(/\s*\([^)]*(객실\s*기준|1인\s*1실|베드룸|배정|급|독채|오션뷰|인접)[^)]*\)/g, '')
                              .replace(/\s+/g, ' ')
                              .trim();
                            return (
                              <>
                                <span className="sm:hidden">{shortAcc || fullAcc}</span>
                                <span className="hidden sm:inline">{fullAcc}</span>
                              </>
                            );
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Summary Breakdown */}
                  <div className="p-3.5 md:p-4 bg-[#F2F2F7] rounded-2xl space-y-2 text-xs md:text-sm">
                    <div className="flex justify-between text-[#3A3A3C]">
                      <span>선택된 포함 항목</span>
                      <span className="font-bold text-[#0A7E54]">{selectedOptionIds.size}개</span>
                    </div>
                    <div className="flex justify-between text-[#8E8E93]">
                      <span>제외된 항목</span>
                      <span className="font-semibold">{activePackage.options.length - selectedOptionIds.size}개</span>
                    </div>
                    {showDetailedCosts && (
                      <>
                        <div className="flex justify-between text-[#3A3A3C] pt-1.5 border-t border-black/[0.06]">
                          <span>1인 기준 항목 ({personCount}인 × ${currentPerPersonOnlyTotalUSD.toLocaleString()})</span>
                          <span className="font-bold text-gray-900 tabular-nums">${(currentPerPersonOnlyTotalUSD * personCount).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-[#3A3A3C]">
                          <span>차량·가이드 ({pkgTravelDays}일 총액 · 인원 무관)</span>
                          <span className="font-bold text-[#0A7E54] tabular-nums">${currentTeamTotalUSD.toLocaleString()}</span>
                        </div>
                      </>
                    )}
                    <div className="pt-2 border-t border-black/[0.08] flex justify-between items-center">
                      <div>
                        <span className="font-bold text-gray-900 md:text-base block">총 그룹 예상 견적 ({personCount}인)</span>
                        <span className="text-[11px] md:text-xs text-[#0A7E54] font-semibold">
                          1인 약 ${currentTotalPerPerson.toLocaleString()} (약 {(currentTotalPerPerson * USD_TO_KRW).toLocaleString()}원)
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-lg md:text-2xl font-extrabold text-[#0A7E54] tracking-tight tabular-nums">
                          ${currentTotalGroup.toLocaleString()} <span className="text-xs font-bold">USD</span>
                        </div>
                        <div className="text-[11px] md:text-xs text-[#8E8E93] font-normal">
                          (약 {(currentTotalGroup * USD_TO_KRW).toLocaleString()}원)
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Brand & Phone Footer in Quotation Card */}
                  <div className="pt-2 text-[11px] md:text-xs text-[#8E8E93] border-t border-black/[0.06] flex items-center justify-between">
                    <span>MANGO TOUR GOLF & TRAVEL</span>
                    <span className="font-semibold text-[#3A3A3C]">
                      +84 37 720 4451
                    </span>
                  </div>
                </div>

                {/* Primary Action Buttons */}
                <div className="space-y-2.5 pt-1 sm:pt-2">
                  {/* Kakao button */}
                  <button
                    type="button"
                    onClick={handleKakaoInquiry}
                    className="w-full py-3.5 sm:py-4 bg-[#FEE500] text-[#191919] font-bold rounded-2xl hover:bg-[#FDD835] transition-all duration-200 flex items-center justify-center gap-2 text-xs sm:text-sm md:text-base tracking-tight active:scale-95 cursor-pointer"
                  >
                    <span>💬</span>
                    <span>카카오톡으로 즉시 견적 문의하기</span>
                  </button>

                  {/* 1:1 Online Inquiry (Auto PDF + Email + Kakao Hook) */}
                  <button
                    type="button"
                    onClick={handleOpenOnlineInquiry}
                    className="w-full py-3.5 sm:py-4 bg-[#0A7E54] text-white font-bold rounded-2xl hover:bg-[#086945] transition-all duration-200 flex items-center justify-center gap-2 text-xs sm:text-sm md:text-base tracking-tight active:scale-95 cursor-pointer"
                  >
                    <span>📧</span>
                    <span>1:1 온라인 견적 신청하기</span>
                  </button>

                  {/* Secondary actions grid */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handleDownloadPDF}
                      disabled={isDownloadingPdf}
                      className="py-3 bg-[#ECFDF5] text-[#0A7E54] font-semibold rounded-2xl hover:bg-emerald-100/80 transition-all duration-200 text-xs sm:text-sm flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-60 cursor-pointer"
                    >
                      <span>{isDownloadingPdf ? '⏳' : '📄'}</span>
                      <span>{isDownloadingPdf ? 'PDF 생성 중...' : '견적서 PDF 저장'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleOpenQuotePreview}
                      className="py-3 bg-[#F2F2F7] text-[#3A3A3C] font-semibold rounded-2xl hover:bg-gray-200 transition-all duration-200 text-xs sm:text-sm flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                    >
                      <span>📄</span>
                      <span>견적서 미리보기</span>
                    </button>
                  </div>
                </div>

                <div className="p-2.5 md:p-3 bg-amber-50 rounded-xl border border-amber-200 text-[10px] md:text-xs text-amber-800 leading-relaxed font-normal">
                  💡 <strong>안내:</strong> 견적서 미리보기, PDF 저장 또는 1:1 온라인 신청 시 현재 맞춤 구성이 <strong>정식 A4 견적서(PDF)</strong>로 생성되며, <strong>온라인 견적 신청서로 담당 매니저에게 즉시 접수</strong>됩니다.
                </div>

              </div>

            </div>

          </div>
        )}

      </div>

      {/* ================= MODAL 1: 1:1 ONLINE INQUIRY MODAL ================= */}
      {showInquiryModal && (
        <div 
          className="fixed inset-0 bg-black/55 z-[10002] flex items-end md:items-center justify-center p-0 md:p-4 backdrop-blur-sm animate-fade-in overflow-hidden overscroll-contain select-text font-sans break-keep"
          style={{ touchAction: 'pan-y', overscrollBehavior: 'contain' }}
          onClick={() => { setShowInquiryModal(false); setInquirySuccess(false); }}
        >
          <div 
            className="bg-white rounded-t-3xl md:rounded-[20px] max-w-none md:max-w-lg w-full max-w-full max-h-[90vh] relative shadow-2xl animate-ios-sheet-up flex flex-col overflow-hidden box-border"
            style={{ touchAction: 'pan-y', overscrollBehavior: 'contain' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Drag Handle */}
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mt-2.5 mb-1 md:hidden shrink-0"></div>
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 md:px-6 md:py-4 border-b border-black/[0.06] bg-white/90 backdrop-blur-md sticky top-0 z-30 shrink-0">
              <button
                type="button"
                onClick={() => { setShowInquiryModal(false); setInquirySuccess(false); }}
                className="flex items-center gap-1 px-3 py-1.5 bg-[#F2F2F7] hover:bg-gray-200 text-[#3A3A3C] text-xs font-semibold rounded-full transition-all duration-200 active:scale-95 cursor-pointer"
                aria-label="뒤로 가기"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>닫기</span>
              </button>
              
              <div className="text-center">
                <span className="font-bold text-sm sm:text-base md:text-lg text-gray-900 tracking-tight">1:1 온라인 맞춤 견적 신청</span>
              </div>

              <button
                type="button"
                onClick={() => { setShowInquiryModal(false); setInquirySuccess(false); }}
                className="text-[#8E8E93] hover:text-gray-900 font-bold text-base w-8 h-8 flex items-center justify-center rounded-full bg-[#F2F2F7] hover:bg-gray-200 transition-all duration-200 active:scale-95 cursor-pointer"
                aria-label="닫기"
              >
                ✕
              </button>
            </div>

            {!inquirySuccess ? (
              <form onSubmit={handleSubmitOnlineInquiry} className="flex-1 flex flex-col overflow-hidden">
                {/* Scrollable Form Body */}
                <div 
                  className="flex-1 overflow-y-auto overscroll-contain px-4 py-4 md:px-6 md:py-5 space-y-3.5 text-xs md:text-sm w-full max-w-full box-border"
                  style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 bg-[#ECFDF5] text-[#0A7E54] text-[11px] md:text-xs font-semibold rounded-full shrink-0">온라인 공식 접수</span>
                    <span className="text-xs text-[#8E8E93] font-medium">온라인 견적 신청서로 즉시 접수됩니다</span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight">1:1 맞춤 견적서 온라인 접수</h3>
                  <p className="text-xs md:text-sm text-[#8E8E93] break-keep">작성하신 예약 정보와 맞춤 견적서 PDF가 담당 매니저에게 즉시 접수됩니다.</p>

                  <div className="w-full max-w-full">
                    <label className="font-semibold text-[#3A3A3C] block mb-1.5 text-xs md:text-sm">예약자 성함 / 대표자명 *</label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="홍길동"
                      className="w-full max-w-full box-border p-3 md:p-3.5 bg-[#F2F2F7] rounded-xl font-medium outline-none focus:ring-2 focus:ring-[#0A7E54]/30 focus:bg-white transition text-sm md:text-base"
                    />
                  </div>

                  <div className="w-full max-w-full">
                    <label className="font-semibold text-[#3A3A3C] block mb-1.5 text-xs md:text-sm">연락처 또는 카카오톡 ID *</label>
                    <input
                      type="text"
                      required
                      value={customerContact}
                      onChange={(e) => setCustomerContact(e.target.value)}
                      placeholder="010-1234-5678 또는 카카오톡ID"
                      className="w-full max-w-full box-border p-3 md:p-3.5 bg-[#F2F2F7] rounded-xl font-medium outline-none focus:ring-2 focus:ring-[#0A7E54]/30 focus:bg-white transition text-sm md:text-base"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 w-full max-w-full box-border">
                    <div className="min-w-0">
                      <label className="font-semibold text-[#3A3A3C] block mb-1.5 text-xs md:text-sm">인원 수</label>
                      <input
                        type="number"
                        min="1"
                        value={personCount}
                        onChange={(e) => setPersonCount(parseInt(e.target.value) || 1)}
                        className="w-full max-w-full box-border p-3 md:p-3.5 bg-[#F2F2F7] rounded-xl font-medium outline-none focus:ring-2 focus:ring-[#0A7E54]/30 focus:bg-white transition text-sm md:text-base"
                      />
                    </div>
                    <div className="min-w-0">
                      <label className="font-semibold text-[#3A3A3C] block mb-1.5 text-xs md:text-sm">출발 희망일</label>
                      <input
                        type="date"
                        value={departureDate}
                        onChange={(e) => setDepartureDate(e.target.value)}
                        className="w-full max-w-full box-border p-3 md:p-3.5 bg-[#F2F2F7] rounded-xl font-medium outline-none focus:ring-2 focus:ring-[#0A7E54]/30 focus:bg-white transition text-sm md:text-base"
                      />
                    </div>
                  </div>

                  <div className="w-full max-w-full">
                    <label className="font-semibold text-[#3A3A3C] block mb-1.5 text-xs md:text-sm">추가 요청사항 (선택)</label>
                    <textarea
                      rows={2}
                      value={customerNotes}
                      onChange={(e) => setCustomerNotes(e.target.value)}
                      placeholder="티타임 시간대, 선호 호텔 유형, 클럽 렌탈 여부 등"
                      className="w-full max-w-full box-border p-3 md:p-3.5 bg-[#F2F2F7] rounded-xl font-medium outline-none focus:ring-2 focus:ring-[#0A7E54]/30 focus:bg-white transition resize-none text-sm md:text-base"
                    />
                  </div>

                  <div className="p-3.5 md:p-4 bg-[#ECFDF5] rounded-2xl flex justify-between items-center w-full max-w-full box-border">
                    <div className="min-w-0 mr-2">
                      <span className="text-[11px] md:text-xs text-[#0A7E54] block font-semibold">총 {personCount}인 예상 견적</span>
                      <div className="font-extrabold text-[#0A7E54] text-base sm:text-lg md:text-xl tracking-tight tabular-nums">
                        ${currentTotalGroup.toLocaleString()} <span className="text-xs font-semibold">USD</span>
                      </div>
                      <div className="text-[11px] text-[#3A3A3C] font-medium">
                        (약 {(currentTotalGroup * USD_TO_KRW).toLocaleString()}원)
                      </div>
                    </div>
                    <div className="text-[11px] text-[#0A7E54] font-semibold bg-white px-2.5 py-1 rounded-full shrink-0">
                      선택 {selectedOptionIds.size}개
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

                {/* Sticky Pinned Bottom Action Bar */}
                <div 
                  className="bg-white/90 backdrop-blur-md px-4 py-3 md:px-6 md:py-4 border-t border-black/[0.06] shrink-0 z-30"
                  style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 0.75rem)' }}
                >
                  <button
                    type="submit"
                    disabled={isSubmittingEmail}
                    className="w-full py-3.5 md:py-4 bg-[#0A7E54] hover:bg-[#086945] text-white font-bold rounded-2xl text-sm sm:text-base active:scale-95 disabled:opacity-80 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer transition-all duration-200"
                  >
                    {isSubmittingEmail && (
                      <span
                        className="inline-block w-4 h-4 border-2 border-white/35 border-t-white rounded-full animate-spin shrink-0"
                        aria-hidden="true"
                      />
                    )}
                    <span className="font-bold tracking-tight">
                      {isSubmittingEmail ? '견적서 PDF를 생성하여 전송 중입니다...' : '견적 신청하기'}
                    </span>
                  </button>
                </div>
              </form>
            ) : (
              <div
                className="flex-1 overflow-y-auto overscroll-contain px-3 py-4 md:p-8 text-center space-y-4 w-full max-w-full"
                style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}
              >
                <div className="w-16 h-16 md:w-20 md:h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl md:text-4xl mx-auto">
                  ✓
                </div>
                <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-deepgreen">견적 신청 완료</h3>
                <p className="text-xs md:text-sm text-gray-600 leading-relaxed max-w-sm md:max-w-md mx-auto break-words">
                  견적 신청이 완료되었습니다. 담당자 확인 후 연락드리겠습니다.
                </p>

                <div className="pt-2 flex flex-col gap-2 w-full max-w-full">
                  <button
                    type="button"
                    onClick={() => handleDownloadPDF()}
                    disabled={isDownloadingPdf}
                    className="w-full py-3.5 md:py-4 bg-gradient-to-r from-gold-500 to-amber-600 hover:from-gold-600 hover:to-amber-700 text-white font-extrabold rounded-2xl transition text-xs md:text-sm flex items-center justify-center gap-1.5 shadow-md cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <span>{isDownloadingPdf ? '⏳' : '📄'}</span>
                    <span>{isDownloadingPdf ? '저장 중...' : '정식 A4 견적서 (PDF) 파일 다운로드'}</span>
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
          className="fixed inset-0 bg-black/55 z-[10002] flex items-end md:items-center justify-center p-0 md:p-4 backdrop-blur-sm animate-fade-in overflow-hidden overscroll-contain font-sans break-keep"
          style={{ touchAction: 'pan-y', overscrollBehavior: 'contain' }}
          onClick={() => setShowKakaoModal(false)}
        >
          <div 
            className="bg-white rounded-t-3xl md:rounded-[20px] max-w-none md:max-w-xl w-full max-w-full max-h-[90vh] px-4 py-4 md:p-6 relative shadow-2xl animate-ios-sheet-up m-0 md:my-6 overflow-x-hidden overflow-y-auto overscroll-contain box-border"
            style={{ touchAction: 'pan-y', overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Drag Handle */}
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-3 md:hidden"></div>
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-black/[0.06]">
              <button
                type="button"
                onClick={() => setShowKakaoModal(false)}
                className="flex items-center gap-1 px-3 py-1.5 bg-[#F2F2F7] hover:bg-gray-200 text-[#3A3A3C] text-xs font-semibold rounded-full transition-all duration-200 active:scale-95 cursor-pointer"
                aria-label="뒤로 가기"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>닫기</span>
              </button>
              <button
                type="button"
                onClick={() => setShowKakaoModal(false)}
                className="text-[#8E8E93] hover:text-gray-900 font-bold text-base w-8 h-8 flex items-center justify-center rounded-full bg-[#F2F2F7] hover:bg-gray-200 transition-all duration-200 active:scale-95 cursor-pointer"
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

                {/* 1. Golf Courses or Tour Items List */}
                <div className="text-xs md:text-sm space-y-1">
                  {(activePackage ? customGolfCourses.length > 0 : diyActivityMode === 'golf') ? (
                    <>
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
                    </>
                  ) : (
                    <>
                      <span className="font-bold text-gray-800 flex items-center gap-1 text-[11px] md:text-xs">
                        <span>🧳</span> 선택 여행/투어 일정:
                      </span>
                      <div className="pl-0.5 text-gray-700 text-xs md:text-sm font-semibold">
                        {(() => {
                          const tourOpt = activePackage?.options.find(o => o.id === 'diy-opt-tour' || (o.category === 'activity' && !o.name.includes('마사지') && !o.name.includes('스파')));
                          if (tourOpt) return getOptionDisplayName(tourOpt).replace(/^선택 여행 일정:\s*/, '');
                          return selectedTourItems.map(t => t.name).join(' · ') || '자유 여행';
                        })()}
                      </div>
                    </>
                  )}
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
                      activePackage.options.filter(o => selectedOptionIds.has(o.id)).map((opt) => {
                        const isTeam = opt.category === 'vehicle' || opt.category === 'guide';
                        const itemTotal = getOptionGroupTotalUSD(opt);
                        const canShowOptPrice = showDetailedCosts || opt.category === 'golf';
                        const optLabel = canShowOptPrice ? getOptionDisplayName(opt) : sanitizeNonGolfPriceText(getOptionDisplayName(opt));
                        return (
                          <div key={opt.id} className="flex justify-between items-center text-xs md:text-sm py-1 border-b border-gray-100 last:border-none">
                            <div className="flex items-center gap-1.5 text-gray-800 font-medium truncate mr-2 min-w-0">
                              <span className="text-[9px] md:text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 shrink-0 font-bold">
                                {opt.name.includes('패스트 트랙') ? '패스트트랙' : opt.category === 'hotel' ? '숙박(1인실)' : opt.category === 'vehicle' ? '차량' : opt.category === 'guide' ? '가이드' : opt.category === 'meal' ? '식사' : opt.category === 'golf' ? '골프' : '옵션'}
                              </span>
                              <span className="truncate">{optLabel}</span>
                            </div>
                            {canShowOptPrice ? (
                              <span className="font-bold text-deepgreen text-xs md:text-sm shrink-0 whitespace-nowrap">
                                ${itemTotal.toLocaleString()} <span className="text-[10px] text-gray-400 font-medium">({isTeam ? `${pkgTravelDays}일 총액` : `${personCount}인`})</span>
                              </span>
                            ) : (
                              <span className="font-bold text-[#0A7E54] text-xs md:text-sm shrink-0 whitespace-nowrap">
                                포함
                              </span>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-xs md:text-sm text-gray-600 space-y-1">
                        <div>• 전 일정 단독 차량: {diyIncludeVehicle ? (selectedVehicleItem?.shortName || selectedVehicleItem?.name) : '미포함'}</div>
                        <div>• {diyActivityMode === 'golf' ? `${diyRounds}회 18홀 명문 골프장 그린피 포함` : `여행 구성: ${selectedTourItems.map(t => t.name).join(', ') || '자유 여행'}`}</div>
                        <div>• 숙박: {diyIncludeHotel ? `${selectedHotelTier?.name || '고급 호텔'} (1인 1실) 포함` : '미포함 (개별 예약)'}</div>
                        {diyExtraServices.map(svc => {
                          const isChecked = diySelectedExtraIds.includes(svc.id);
                          return (
                            <div key={svc.id}>
                              • {showDetailedCosts ? svc.name : sanitizeNonGolfPriceText(svc.name)}: {isChecked ? '포함' : '미포함'}
                            </div>
                          );
                        })}
                        <div>
                          • 저녁식사: {dinnerCount > 0 ? (showDetailedCosts ? `포함 (${dinnerCount}회 · 1인 $${dinnerPerPersonTotal.toLocaleString()})` : `포함 (${dinnerCount}회)`) : '미포함'}
                        </div>
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

              {/* Instructions Steps */}
              <div className="bg-amber-50 rounded-2xl p-3 md:p-4 border border-amber-200/80 text-left text-xs md:text-sm space-y-1.5 text-amber-900 w-full max-w-full box-border">
                <div className="font-bold flex items-center gap-1 md:text-sm">
                  <span>💡</span> 카카오톡 상담창에서 보내는 방법:
                </div>
                <div className="text-[11px] md:text-xs text-amber-800 leading-relaxed pl-3.5 space-y-1 list-decimal">
                  <div>1. 아래 <strong>[카카오톡 오픈채팅방 바로가기]</strong>를 누릅니다.</div>
                  <div>2. 상담창에 <strong>붙여넣기 (길게 눌러 붙여넣기 또는 Ctrl+V)</strong>를 하시면 복사된 견적 텍스트가 전송됩니다.</div>
                  <div>3. 아래 <strong>[A4 PDF 다운로드]</strong>로 저장한 정식 견적서 PDF 파일을 함께 전송해 주시면 더욱 빠른 상담이 가능합니다!</div>
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
                    onClick={() => handleDownloadPDF()}
                    disabled={isDownloadingPdf}
                    className="py-3 md:py-3.5 bg-gray-100 text-gray-800 font-bold rounded-2xl hover:bg-gray-200 transition text-xs md:text-sm flex items-center justify-center gap-1 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <span>{isDownloadingPdf ? '⏳' : '📄'}</span>
                    <span>{isDownloadingPdf ? 'PDF 생성 중...' : 'A4 PDF 다운로드'}</span>
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

      {/* ================= MODAL 4: INTERACTIVE DAY-BY-DAY GOLF COURSE PICKER MODAL ================= */}
      {showGolfModal && (
        <div
          className="fixed inset-0 bg-black/55 z-[10002] flex items-end md:items-center justify-center p-0 md:p-4 backdrop-blur-sm animate-fade-in overflow-hidden font-sans break-keep"
          onClick={() => setShowGolfModal(false)}
        >
          <div
            className="bg-white rounded-t-3xl md:rounded-[20px] max-w-none md:max-w-3xl w-full max-h-[90vh] p-0 md:p-6 relative shadow-2xl animate-ios-sheet-up m-0 md:my-6 flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Drag Handle */}
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mt-2.5 mb-1 md:hidden shrink-0"></div>
            {/* Modal Header */}
            <div className="flex items-start justify-between px-4 py-3 md:px-0 md:py-0 md:pb-4 border-b border-black/[0.06] bg-white sticky top-0 z-10">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 bg-[#ECFDF5] text-[#0A7E54] text-[11px] font-semibold rounded-full">일정별 골프장</span>
                  <span className="text-[11px] sm:text-xs text-[#8E8E93]">선택 즉시 견적 반영</span>
                </div>
                <h3 className="text-base sm:text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
                  일정별 골프장 변경 및 선택
                </h3>
                <p className="text-xs md:text-sm text-[#8E8E93] mt-0.5 leading-snug">
                  라운딩 회차별로 원하시는 골프장을 선택하세요.
                </p>
              </div>
              <button
                onClick={() => setShowGolfModal(false)}
                className="text-[#8E8E93] hover:text-gray-900 font-bold text-base w-8 h-8 flex items-center justify-center rounded-full bg-[#F2F2F7] hover:bg-gray-200 transition-all duration-200 active:scale-95 shrink-0 ml-2 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Content Body */}
            <div className="overflow-y-auto overscroll-contain flex-1 px-4 md:px-0 space-y-4 py-4">

              {/* Step 1: Select Round / Day to Modify */}
              <div>
                <label className="text-xs md:text-sm font-bold text-gray-900 block mb-2 flex items-center justify-between">
                  <span>1. 변경할 라운딩 회차 선택</span>
                  <span className="text-xs text-[#0A7E54] font-semibold">
                    {activeRoundIndex + 1}회차 ({activeRoundIndex + 2}일차)
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
                        className={`p-3 rounded-2xl text-left transition-all duration-200 flex flex-col justify-between cursor-pointer active:scale-95 ${
                          isCurrentActive
                            ? 'bg-[#0A7E54] text-white shadow-sm'
                            : 'bg-[#F2F2F7] hover:bg-gray-200/70 text-gray-900'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isCurrentActive ? 'bg-white/20 text-white' : 'bg-white text-[#3A3A3C]'
                            }`}>
                              Day {rIdx + 2} · {rIdx + 1}R
                            </span>
                          </div>
                          <div className={`font-bold text-xs md:text-sm line-clamp-1 ${isCurrentActive ? 'text-white' : 'text-gray-900'}`}>
                            {courseName}
                          </div>
                        </div>
                        <div className={`text-[10px] mt-1.5 ${
                          isCurrentActive ? 'text-emerald-100' : 'text-[#8E8E93]'
                        }`}>
                          {isCurrentActive ? '변경 중' : '터치하여 선택'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Location Filter Tabs */}
              <div>
                <label className="text-xs md:text-sm font-bold text-gray-900 block mb-2">
                  2. 지역 필터 ({golfLocationFilter})
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
                        className={`px-3.5 py-1.5 rounded-full text-xs md:text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                          isActive
                            ? 'bg-[#0A7E54] text-white'
                            : 'bg-[#F2F2F7] hover:bg-gray-200 text-[#3A3A3C]'
                        }`}
                      >
                        <span>{loc}</span>
                        <span className={`text-[11px] px-1.5 rounded-full ${
                          isActive ? 'bg-white/20 text-white' : 'bg-white text-[#8E8E93]'
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
                  <label className="text-xs md:text-sm font-bold text-gray-900">
                    3. {activeRoundIndex + 1}회차 골프장 선택
                  </label>
                  <span className="text-xs text-[#8E8E93]">
                    {getAvailableGolfCourses().length}개
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
                        className={`p-3.5 md:p-4 rounded-2xl text-xs md:text-sm cursor-pointer transition-all duration-200 flex flex-col justify-between active:scale-[0.98] ${
                          isAssignedToActiveRound
                            ? 'bg-[#ECFDF5] ring-2 ring-[#0A7E54]'
                            : 'bg-[#F2F2F7] hover:bg-gray-200/70'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between gap-1 mb-1">
                            <div className="flex items-center gap-1.5">
                              <span className="px-2 py-0.5 bg-white text-[#3A3A3C] text-[10px] md:text-xs font-semibold rounded-full">
                                {course.location}
                              </span>
                              <span className="px-2 py-0.5 bg-white text-[#0A7E54] text-[10px] md:text-xs font-semibold rounded-full">
                                {course.holes}
                              </span>
                            </div>
                            {course.badge && (
                              <span className="px-2 py-0.5 bg-white text-[#0A7E54] text-[10px] font-semibold rounded-full">
                                {course.badge}
                              </span>
                            )}
                          </div>

                          <h4 className="font-bold text-sm md:text-base text-gray-900 mt-1">
                            {course.name}
                          </h4>
                          {course.description && (
                            <p className="text-[11px] md:text-xs text-[#8E8E93] leading-snug mt-1 line-clamp-2">
                              {course.description}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-black/[0.06]">
                          <div>
                            <span className="text-[10px] text-[#8E8E93] block">1인 차액</span>
                            <span className="text-xs md:text-sm font-bold text-[#0A7E54]">
                              {course.priceDeltaUSD === 0 
                                ? '기본 ($0)' 
                                : course.priceDeltaUSD > 0 
                                ? `+$${course.priceDeltaUSD}/인` 
                                : `-$${Math.abs(course.priceDeltaUSD)}/인`}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {assignedRounds.length > 0 && (
                              <span className="text-[10px] bg-white text-[#0A7E54] px-2 py-1 rounded-full font-semibold">
                                {assignedRounds.join(', ')}R
                              </span>
                            )}
                            <span className={`px-3 py-1.5 rounded-xl font-semibold text-xs transition ${
                              isAssignedToActiveRound
                                ? 'bg-[#0A7E54] text-white'
                                : 'bg-white text-[#3A3A3C]'
                            }`}>
                              {isAssignedToActiveRound ? '✓ 선택됨' : '선택'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-4 py-3 md:px-0 md:py-0 md:pt-4 border-t border-black/[0.06] bg-white/90 backdrop-blur-md sticky bottom-0 z-10 flex flex-col md:flex-row justify-between items-center gap-3 shrink-0" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 0.75rem)' }}>
              <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
                <div>
                  <span className="text-[11px] text-[#8E8E93] block">골프장 변경 차액 (1인 기준)</span>
                  <span className="text-sm md:text-base font-bold text-[#0A7E54]">
                    {getGolfDeltaTotal() === 0 
                      ? '기본 코스 ($0)' 
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
                    className="px-3 py-1.5 bg-[#F2F2F7] hover:bg-gray-200 text-[#3A3A3C] text-xs font-semibold rounded-xl transition cursor-pointer"
                  >
                    기본 복원
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowGolfModal(false)}
                className="w-full md:w-auto px-6 py-3 bg-[#0A7E54] hover:bg-[#086945] text-white font-bold text-sm md:text-base rounded-2xl transition-all duration-200 active:scale-95 cursor-pointer"
              >
                선택 완료
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ================= MODAL 5: DEDICATED CUSTOM OPTION POPUP MODAL ================= */}
      {customizingOption && (
        <div
          className="fixed inset-0 bg-black/55 z-[10002] flex items-end md:items-center justify-center p-0 md:p-4 backdrop-blur-sm animate-fade-in overflow-hidden font-sans break-keep"
          onClick={() => setCustomizingOption(null)}
        >
          <div
            className="bg-white rounded-t-3xl md:rounded-[20px] max-w-none md:max-w-3xl w-full max-h-[90vh] p-0 md:p-6 relative shadow-2xl animate-ios-sheet-up m-0 md:my-6 flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Drag Handle */}
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mt-2.5 mb-1 md:hidden shrink-0"></div>
            {/* Modal Header */}
            <div className="flex items-start justify-between px-4 py-3 md:px-0 md:py-0 md:pb-4 border-b border-black/[0.06] bg-white sticky top-0 z-10">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 bg-[#ECFDF5] text-[#0A7E54] text-[11px] font-semibold rounded-full">세부 옵션 변경</span>
                  <span className="text-[11px] sm:text-xs text-[#8E8E93]">선택 즉시 견적 반영</span>
                </div>
                <h3 className="text-base sm:text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
                  {customizingOption.category === 'hotel' ? '숙박 형태 변경 및 선택' :
                   customizingOption.category === 'vehicle' ? '전용 차량 옵션 변경' :
                   customizingOption.category === 'guide' ? '전담 가이드 옵션 변경' :
                   customizingOption.category === 'meal' ? '식사 구성 변경' :
                   `${customizingOption.name} 변경`}
                </h3>
              </div>
              <button
                onClick={() => setCustomizingOption(null)}
                className="text-[#8E8E93] hover:text-gray-900 font-bold text-base w-8 h-8 flex items-center justify-center rounded-full bg-[#F2F2F7] hover:bg-gray-200 transition-all duration-200 active:scale-95 shrink-0 ml-2 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Content Body */}
            <div className="overflow-y-auto overscroll-contain flex-1 px-4 md:px-0 space-y-4 py-4">

              {/* Step 1: Current Selection Status Card */}
              <div className="p-3.5 bg-[#0A7E54] text-white rounded-2xl flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/20 text-white">
                      현재 선택됨
                    </span>
                  </div>
                  <div className="font-bold text-sm md:text-base text-white">
                    {(() => {
                      const rawTitle = customOptionSelections[customizingOption.id]?.name || customizingOption.name;
                      return (showDetailedCosts || customizingOption.category === 'golf') ? rawTitle : sanitizeNonGolfPriceText(rawTitle);
                    })()}
                  </div>
                </div>
                <div className="text-right shrink-0 pl-3">
                  {(showDetailedCosts || customizingOption.category === 'golf') ? (
                    <>
                      <span className="text-[11px] text-emerald-100 block">
                        {customizingOption.category === 'vehicle' || customizingOption.category === 'guide'
                          ? `${pkgTravelDays}일 총액`
                          : '1인 차액'}
                      </span>
                      <span className="text-base md:text-lg font-bold text-white tabular-nums">
                        {customizingOption.category === 'vehicle' || customizingOption.category === 'guide'
                          ? `$${getOptionGroupTotalUSD(customizingOption).toLocaleString()}`
                          : customOptionSelections[customizingOption.id]
                          ? (customOptionSelections[customizingOption.id].priceDelta === 0 
                              ? '기본 ($0)' 
                              : customOptionSelections[customizingOption.id].priceDelta > 0 
                              ? `+$${customOptionSelections[customizingOption.id].priceDelta}` 
                              : `-$${Math.abs(customOptionSelections[customizingOption.id].priceDelta)}`)
                          : '기본 ($0)'}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-[11px] text-emerald-100 block">합산 자동 반영</span>
                      <span className="text-sm md:text-base font-bold text-white">옵션 선택</span>
                    </>
                  )}
                </div>
              </div>

              {/* Step 2: Filters */}
              {customizingOption.category === 'hotel' && (
                <div className="space-y-2.5">
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
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 flex items-center gap-1 cursor-pointer active:scale-95 ${
                            isActive
                              ? 'bg-[#0A7E54] text-white'
                              : 'bg-[#F2F2F7] hover:bg-gray-200 text-[#3A3A3C]'
                          }`}
                        >
                          <span>{loc}</span>
                          <span className={`text-[10px] px-1.5 rounded-full ${
                            isActive ? 'bg-white/20 text-white' : 'bg-white text-[#8E8E93]'
                          }`}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { id: '전체', label: '전체 형태' },
                      { id: 'hotel_5star', label: '고급 호텔' },
                      { id: 'pool_villa', label: '독채 풀빌라' },
                      { id: 'hotel_4star', label: '4성급 호텔' },
                      { id: 'resort', label: '특급 리조트' },
                    ].map((t) => {
                      const isActive = optionModalTypeFilter === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setOptionModalTypeFilter(t.id)}
                          className={`px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer active:scale-95 ${
                            isActive 
                              ? 'bg-[#ECFDF5] text-[#0A7E54] ring-1 ring-[#0A7E54]/40' 
                              : 'bg-[#F2F2F7] text-[#3A3A3C] hover:bg-gray-200'
                          }`}
                        >
                          {t.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 3: Choice Selection Cards Grid */}
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
                        if (!selectedOptionIds.has(customizingOption.id)) {
                          setSelectedOptionIds(prev => new Set(prev).add(customizingOption.id));
                        }
                        showToast(`✨ ${choice.name.split(' ')[0]} 옵션이 선택되었습니다.`);
                      }}
                      className={`p-3.5 rounded-2xl text-xs cursor-pointer transition-all duration-200 flex flex-col justify-between active:scale-[0.98] ${
                        isSelected
                          ? 'bg-[#ECFDF5] ring-2 ring-[#0A7E54]'
                          : 'bg-[#F2F2F7] hover:bg-gray-200/70'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <div className="flex items-center gap-1.5">
                            {choice.location && (
                              <span className="px-2 py-0.5 bg-white text-[#3A3A3C] text-[10px] font-semibold rounded-full">
                                {choice.location}
                              </span>
                            )}
                            <span className="px-2 py-0.5 bg-white text-[#0A7E54] text-[10px] font-semibold rounded-full">
                              {choice.type === 'pool_villa' ? '독채 풀빌라' :
                               choice.type === 'hotel_5star' ? '고급 호텔' :
                               choice.type === 'hotel_4star' ? '4성급' :
                               choice.type === 'resort' ? '리조트' :
                               choice.type === 'vehicle' ? '전용 차량' :
                               choice.type === 'guide' ? '가이드' :
                               choice.type === 'meal' ? '식사' : '맞춤 선택'}
                            </span>
                          </div>
                          {choice.badge && (
                            <span className="px-2 py-0.5 bg-white text-[#0A7E54] text-[10px] font-semibold rounded-full">
                              {choice.badge}
                            </span>
                          )}
                        </div>

                        <h4 className="font-bold text-sm md:text-base text-gray-900 mt-1">
                          {(showDetailedCosts || customizingOption.category === 'golf') ? choice.name : sanitizeNonGolfPriceText(choice.name)}
                        </h4>
                        {choice.description && (
                          <p className="text-[11px] md:text-xs text-[#8E8E93] leading-snug mt-1 line-clamp-2">
                            {(showDetailedCosts || customizingOption.category === 'golf') ? choice.description : sanitizeNonGolfPriceText(choice.description)}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-black/[0.06]">
                        <div>
                          <span className="text-xs md:text-sm font-bold text-[#0A7E54]">
                            {!(showDetailedCosts || customizingOption.category === 'golf')
                              ? (isSelected ? '포함 (합산 반영)' : '선택 가능')
                              : choice.type === 'vehicle' || choice.type === 'guide'
                              ? `$${(choice as any).teamTotalUSD ?? 0} (${choice.priceDeltaUSD === 0 ? '기본' : choice.priceDeltaUSD > 0 ? `+$${choice.priceDeltaUSD}` : `-$${Math.abs(choice.priceDeltaUSD)}`})`
                              : choice.priceDeltaUSD === 0 
                              ? '기본 ($0)' 
                              : choice.priceDeltaUSD > 0 
                              ? `+$${choice.priceDeltaUSD}/인` 
                              : `-$${Math.abs(choice.priceDeltaUSD)}/인`}
                          </span>
                        </div>

                        <span className={`px-3 py-1 rounded-xl font-semibold text-xs ${
                          isSelected
                            ? 'bg-[#0A7E54] text-white'
                            : 'bg-white text-[#3A3A3C]'
                        }`}>
                          {isSelected ? '✓ 선택됨' : '선택'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-4 py-3 md:px-0 md:py-0 md:pt-4 border-t border-black/[0.06] bg-white/90 backdrop-blur-md sticky bottom-0 z-10 flex flex-col md:flex-row justify-between items-center gap-3 shrink-0" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 0.75rem)' }}>
              <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
                <div>
                  {(showDetailedCosts || customizingOption.category === 'golf') ? (
                    <>
                      <span className="text-[11px] text-[#8E8E93] block">
                        {customizingOption.category === 'vehicle' || customizingOption.category === 'guide'
                          ? `${pkgTravelDays}일 총액 (팀 기준)`
                          : '변경 차액 (1인 기준)'}
                      </span>
                      <span className="text-sm md:text-base font-bold text-[#0A7E54]">
                        {customizingOption.category === 'vehicle' || customizingOption.category === 'guide'
                          ? `$${getOptionGroupTotalUSD(customizingOption).toLocaleString()} (${pkgTravelDays}일 총액)`
                          : customOptionSelections[customizingOption.id]
                          ? (customOptionSelections[customizingOption.id].priceDelta === 0 
                              ? '기본 동일 ($0)' 
                              : customOptionSelections[customizingOption.id].priceDelta > 0 
                              ? `+$${customOptionSelections[customizingOption.id].priceDelta} / 1인` 
                              : `-$${Math.abs(customOptionSelections[customizingOption.id].priceDelta)} / 1인`)
                          : '기본 동일 ($0)'}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-[11px] text-[#8E8E93] block">선택 항목 반영</span>
                      <span className="text-sm md:text-base font-bold text-[#0A7E54]">
                        선택 시 총 합산 금액에 자동 반영됩니다
                      </span>
                    </>
                  )}
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
                    className="px-3 py-1.5 bg-[#F2F2F7] hover:bg-gray-200 text-[#3A3A3C] text-xs font-semibold rounded-xl transition cursor-pointer"
                  >
                    기본값 복원
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setCustomizingOption(null)}
                className="w-full md:w-auto px-6 py-3 bg-[#0A7E54] hover:bg-[#086945] text-white font-bold text-sm md:text-base rounded-2xl transition-all duration-200 active:scale-95 cursor-pointer"
              >
                선택 완료
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ================= MODAL 6: DIY COURSE SELECTOR MODAL ================= */}
      {diyChangingRoundIndex !== null && (
        <div
          className="fixed inset-0 bg-black/55 z-[10002] flex items-end md:items-center justify-center p-0 md:p-4 backdrop-blur-sm animate-fade-in overflow-hidden font-sans break-keep"
          onClick={() => setDiyChangingRoundIndex(null)}
        >
          <div
            className="bg-white rounded-t-3xl md:rounded-[20px] max-w-none md:max-w-2xl w-full max-h-[90vh] p-0 md:p-6 relative shadow-2xl animate-ios-sheet-up m-0 md:my-6 flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Mobile Drag Handle */}
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mt-2.5 mb-1 md:hidden shrink-0"></div>
            <div className="flex items-center justify-between px-4 py-3 md:px-0 md:py-0 md:pb-3 border-b border-black/[0.06] bg-white sticky top-0 z-10">
              <div>
                <span className="px-2.5 py-0.5 bg-[#ECFDF5] text-[#0A7E54] text-[11px] font-semibold rounded-full">
                  {diyChangingRoundIndex + 1}회차 ({diyChangingRoundIndex + 2}일차)
                </span>
                <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 tracking-tight mt-1">
                  라운딩할 골프장을 선택하세요
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDiyChangingRoundIndex(null)}
                className="text-[#8E8E93] hover:text-gray-900 font-bold text-base w-8 h-8 flex items-center justify-center rounded-full bg-[#F2F2F7] hover:bg-gray-200 transition-all duration-200 active:scale-95 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto overscroll-contain flex-1 px-4 md:px-0 py-3 space-y-2.5 md:max-h-[65vh]">
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
                    className={`p-3.5 rounded-2xl cursor-pointer transition-all duration-200 flex items-center justify-between gap-3 active:scale-[0.98] ${
                      isSelected
                        ? 'bg-[#ECFDF5] ring-2 ring-[#0A7E54]'
                        : 'bg-[#F2F2F7] hover:bg-gray-200/70'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="px-2 py-0.5 bg-white text-[#3A3A3C] text-[10px] font-semibold rounded-full">
                          {course.location}
                        </span>
                        <span className="px-2 py-0.5 bg-white text-[#0A7E54] text-[10px] font-semibold rounded-full">
                          {course.holes}홀
                        </span>
                      </div>
                      <h4 className="font-bold text-sm md:text-base text-gray-900">{course.name}</h4>
                      <p className="text-[11px] md:text-xs text-[#8E8E93] mt-0.5 line-clamp-1">{course.description}</p>
                    </div>

                    <span className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 ${
                      isSelected
                        ? 'bg-[#0A7E54] text-white'
                        : 'bg-white text-[#3A3A3C]'
                    }`}>
                      {isSelected ? '✓ 선택됨' : '선택'}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="px-4 py-3 md:px-0 md:py-0 md:pt-3 border-t border-black/[0.06] bg-white sticky bottom-0 z-10 text-right shrink-0" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 0.75rem)' }}>
              <button
                type="button"
                onClick={() => setDiyChangingRoundIndex(null)}
                className="w-full sm:w-auto px-5 py-2.5 bg-[#F2F2F7] hover:bg-gray-200 text-[#3A3A3C] rounded-2xl text-xs md:text-sm font-semibold transition-all duration-200 active:scale-95 cursor-pointer"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 7: DIY STEP 2 SCHEDULE PICKER MODAL (3박4일 ~ 6박7일) ================= */}
      {showScheduleModal && (
        <div
          className="fixed inset-0 bg-black/40 z-[10002] flex items-end md:items-center justify-center p-0 md:p-4 backdrop-blur-xs animate-fade-in overflow-hidden overscroll-contain font-sans break-keep"
          onClick={() => setShowScheduleModal(false)}
        >
          <div
            className="bg-white rounded-t-3xl md:rounded-[20px] max-w-none md:max-w-md w-full max-h-[90vh] px-5 pt-2 pb-6 md:p-6 shadow-2xl animate-ios-sheet-up space-y-4 overflow-y-auto overscroll-contain"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-1 md:hidden shrink-0" />
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06]">
              <div>
                <span className="px-2.5 py-0.5 bg-[#ECFDF5] text-[#0A7E54] text-[11px] font-bold rounded-full">STEP 2 · 일정 선택</span>
                <h3 className="text-lg font-extrabold tracking-tight text-gray-900 mt-1">📅 여행 일정을 선택해 주세요</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowScheduleModal(false)}
                className="text-[#8E8E93] hover:text-gray-900 font-bold text-sm w-8 h-8 flex items-center justify-center rounded-full bg-[#F2F2F7] transition active:scale-90 cursor-pointer"
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
                    className={`p-4 rounded-2xl text-left transition-all duration-200 active:scale-[0.98] flex items-center justify-between gap-3 cursor-pointer ${
                      isSelected
                        ? 'bg-[#ECFDF5] ring-2 ring-[#0A7E54]'
                        : 'bg-[#F2F2F7]/80 hover:bg-[#ECFDF5]/60'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-base text-gray-900 tracking-tight">{opt.label}</div>
                      <div className="text-xs text-[#8E8E93] mt-0.5">{opt.desc}</div>
                    </div>
                    <span className={`px-3 py-1 rounded-xl text-xs font-bold shrink-0 ${
                      isSelected ? 'bg-[#0A7E54] text-white' : 'bg-white text-[#3A3A3C] shadow-2xs'
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
        <div
          className="fixed inset-0 bg-black/40 z-[10002] flex items-end md:items-center justify-center p-0 md:p-4 backdrop-blur-xs animate-fade-in overflow-hidden font-sans break-keep"
          onClick={() => setShowActivityModal(null)}
        >
          <div
            className="bg-white rounded-t-3xl md:rounded-[20px] max-w-none md:max-w-2xl w-full max-h-[90vh] p-0 md:p-6 relative shadow-2xl animate-ios-sheet-up flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mt-2.5 mb-1 md:hidden shrink-0" />
            <div className="flex items-center justify-between px-5 py-3 md:px-0 md:pt-0 md:pb-3 border-b border-black/[0.06] bg-white sticky top-0 z-10">
              <div>
                <span className="px-2.5 py-0.5 bg-[#ECFDF5] text-[#0A7E54] text-[11px] font-bold rounded-full">
                  {diyLocation} · {diyNights}박 {diyDays}일 맞춤 골프장 선택
                </span>
                <h3 className="text-base sm:text-lg md:text-xl font-extrabold tracking-tight text-gray-900 mt-1">
                  ⛳ 라운딩 횟수 및 골프장을 선택하세요
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowActivityModal(null)}
                className="text-[#8E8E93] hover:text-gray-900 font-bold text-sm w-8 h-8 flex items-center justify-center rounded-full bg-[#F2F2F7] transition active:scale-90 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto overscroll-contain flex-1 px-5 md:px-0 py-4 space-y-4">
              {/* Round count selector */}
              <div className="p-4 bg-[#ECFDF5] rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-xs md:text-sm font-bold text-gray-900 block">총 라운딩 횟수 ({diyNights}박 {diyDays}일 기준)</span>
                  <span className="text-[11px] text-[#8E8E93]">최대 {diyDays}회까지 선택 가능 · {diyRounds * 18}홀</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDIYRoundsChange(diyRounds - 1)}
                    disabled={diyRounds <= 1}
                    className="w-9 h-9 rounded-xl bg-white font-bold text-gray-800 shadow-2xs disabled:opacity-40 transition active:scale-90 cursor-pointer"
                  >
                    -
                  </button>
                  <span className="w-12 text-center font-extrabold text-base text-[#0A7E54] tabular-nums">{diyRounds}회</span>
                  <button
                    type="button"
                    onClick={() => handleDIYRoundsChange(diyRounds + 1)}
                    disabled={diyRounds >= diyDays}
                    className="w-9 h-9 rounded-xl bg-white font-bold text-gray-800 shadow-2xs disabled:opacity-40 transition active:scale-90 cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Round selector tabs */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#3A3A3C]">1) 변경할 회차를 먼저 클릭하세요</span>
                  <button
                    type="button"
                    onClick={() => setShowAllCoursesInGolfModal(prev => !prev)}
                    className="text-xs font-semibold text-[#0A7E54] hover:underline cursor-pointer"
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
                        className={`p-3.5 rounded-2xl text-left transition-all duration-200 active:scale-[0.98] flex items-center justify-between gap-2 cursor-pointer ${
                          isFocused
                            ? 'bg-[#0A7E54] text-white shadow-sm'
                            : 'bg-[#F2F2F7] hover:bg-[#ECFDF5] text-gray-900'
                        }`}
                      >
                        <div className="min-w-0">
                          <span className={`text-[11px] font-semibold block ${isFocused ? 'text-emerald-100' : 'text-[#0A7E54]'}`}>
                            {idx + 1}회차 ({idx + 2}일차)
                          </span>
                          <span className="font-bold text-xs md:text-sm truncate block">{cName}</span>
                        </div>
                        <span className={`text-xs font-extrabold tabular-nums shrink-0 ${isFocused ? 'text-white' : 'text-[#0A7E54]'}`}>
                          ${rate.weekdayUSD}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Regional Course Pool */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-[#3A3A3C] block">
                  2) {activeRoundIndex + 1}회차에 배정할 골프장 선택
                </span>
                <div className="space-y-2.5">
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
                        className={`p-4 rounded-2xl cursor-pointer transition-all duration-200 active:scale-[0.98] flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-[#ECFDF5] ring-2 ring-[#0A7E54]'
                            : 'bg-[#F2F2F7]/70 hover:bg-[#ECFDF5]/60'
                        }`}
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                            <span className="text-[11px] font-semibold text-[#8E8E93]">
                              {course.location} · {course.holes}홀
                            </span>
                            {course.badge && (
                              <span className="px-2 py-0.5 bg-white text-[#0A7E54] text-[10px] font-bold rounded-full shadow-2xs">
                                {course.badge}
                              </span>
                            )}
                          </div>
                          <h4 className="font-bold text-sm text-gray-900 tracking-tight">{course.name}</h4>
                          <p className="text-xs text-[#8E8E93] mt-0.5 line-clamp-1">{course.description}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-xs font-extrabold text-[#0A7E54] tabular-nums mb-1">${price}</div>
                          <span className={`inline-block px-3 py-1 rounded-xl text-[11px] font-bold ${
                            isSelected ? 'bg-[#0A7E54] text-white' : 'bg-white text-[#3A3A3C] shadow-2xs'
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

            <div
              className="px-5 py-3 md:px-0 md:pb-0 md:pt-3 border-t border-black/[0.06] bg-white sticky bottom-0 z-10 flex justify-end gap-2"
              style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 0.75rem)' }}
            >
              <button
                type="button"
                onClick={() => setShowActivityModal(null)}
                className="w-full md:w-auto px-6 py-3.5 bg-[#0A7E54] hover:bg-[#086945] text-white rounded-2xl text-sm font-bold shadow-sm transition-all duration-200 active:scale-95 cursor-pointer"
              >
                선택 완료 & 적용 ✓
              </button>
            </div>
          </div>
        </div>
      )}

      {showActivityModal === 'tour' && (
        <div
          className="fixed inset-0 bg-black/40 z-[10002] flex items-end md:items-center justify-center p-0 md:p-4 backdrop-blur-xs animate-fade-in overflow-hidden font-sans break-keep"
          onClick={() => setShowActivityModal(null)}
        >
          <div
            className="bg-white rounded-t-3xl md:rounded-[20px] max-w-none md:max-w-2xl w-full max-h-[90vh] p-0 md:p-6 relative shadow-2xl animate-ios-sheet-up flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mt-2.5 mb-1 md:hidden shrink-0" />
            <div className="flex items-center justify-between px-5 py-3 md:px-0 md:pt-0 md:pb-3 border-b border-black/[0.06] bg-white sticky top-0 z-10">
              <div>
                <span className="px-2.5 py-0.5 bg-[#ECFDF5] text-[#0A7E54] text-[11px] font-bold rounded-full">
                  {diyLocation} · {diyNights}박 {diyDays}일 여행 상품 선택
                </span>
                <h3 className="text-base sm:text-lg md:text-xl font-extrabold tracking-tight text-gray-900 mt-1">
                  🧳 자유 여행 또는 추천 관광 상품을 선택하세요
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowActivityModal(null)}
                className="text-[#8E8E93] hover:text-gray-900 font-bold text-sm w-8 h-8 flex items-center justify-center rounded-full bg-[#F2F2F7] transition active:scale-90 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto overscroll-contain flex-1 px-5 md:px-0 py-4 space-y-2.5">
              {activeRegionTourOptions.map((item) => {
                const isSelected = diySelectedTourIds.includes(item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => handleToggleTourOption(item.id, item.isFreeTravel)}
                    className={`p-4 rounded-2xl cursor-pointer transition-all duration-200 active:scale-[0.98] flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-[#ECFDF5] ring-2 ring-[#0A7E54]'
                        : 'bg-[#F2F2F7]/70 hover:bg-[#ECFDF5]/60'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        <span className="text-[11px] font-semibold text-[#8E8E93]">
                          {item.isFreeTravel ? '자유 일정' : item.location}
                        </span>
                        {item.badge && (
                          <span className="px-2 py-0.5 bg-white text-[#0A7E54] text-[10px] font-bold rounded-full shadow-2xs">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <h4 className="font-bold text-sm md:text-base text-gray-900 tracking-tight">{item.name}</h4>
                      <p className="text-xs text-[#8E8E93] mt-0.5">{item.description}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-sm font-extrabold text-[#0A7E54] tabular-nums mb-1">
                        {showDetailedCosts
                          ? (item.priceUSD > 0 ? `$${item.priceUSD}/인` : '자유 ($0)')
                          : (item.isFreeTravel ? '자유 일정' : '선택 투어')}
                      </div>
                      <span className={`inline-block px-3 py-1 rounded-xl text-xs font-bold ${
                        isSelected ? 'bg-[#0A7E54] text-white' : 'bg-white text-[#3A3A3C] shadow-2xs'
                      }`}>
                        {isSelected ? '✓ 선택됨' : '선택'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div
              className="px-5 py-3 md:px-0 md:pb-0 md:pt-3 border-t border-black/[0.06] bg-white sticky bottom-0 z-10 flex items-center justify-between gap-3"
              style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 0.75rem)' }}
            >
              <div className="text-xs text-[#8E8E93] font-medium">
                자유 여행 또는 {diyLocation} 상품을 복수 선택할 수 있습니다.
              </div>
              <button
                type="button"
                onClick={() => setShowActivityModal(null)}
                className="px-6 py-3.5 bg-[#0A7E54] hover:bg-[#086945] text-white rounded-2xl text-sm font-bold shadow-sm transition-all duration-200 active:scale-95 cursor-pointer shrink-0"
              >
                선택 완료 & 적용 ✓
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 9: DIY STEP 4 HOTEL SELECTION MODAL ================= */}
      {showHotelModal && (
        <div
          className="fixed inset-0 bg-black/40 z-[10002] flex items-end md:items-center justify-center p-0 md:p-4 backdrop-blur-xs animate-fade-in overflow-hidden font-sans break-keep"
          onClick={() => setShowHotelModal(false)}
        >
          <div
            className="bg-white rounded-t-3xl md:rounded-[20px] max-w-none md:max-w-2xl w-full max-h-[90vh] p-0 md:p-6 relative shadow-2xl animate-ios-sheet-up flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mt-2.5 mb-1 md:hidden shrink-0" />
            <div className="flex items-center justify-between px-5 py-3 md:px-0 md:pt-0 md:pb-3 border-b border-black/[0.06] bg-white sticky top-0 z-10">
              <div>
                <span className="px-2.5 py-0.5 bg-[#ECFDF5] text-[#0A7E54] text-[11px] font-bold rounded-full">
                  STEP 4 · {diyNights}박 기준 · 1인 1실
                </span>
                <h3 className="text-base sm:text-lg md:text-xl font-extrabold tracking-tight text-gray-900 mt-1">
                  🏨 숙박 형태를 선택하세요
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowHotelModal(false)}
                className="text-[#8E8E93] hover:text-gray-900 font-bold text-sm w-8 h-8 flex items-center justify-center rounded-full bg-[#F2F2F7] transition active:scale-90 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto overscroll-contain flex-1 px-5 md:px-0 py-4 space-y-2.5">
              {diyAccommodations.map((item) => {
                const isSelected = selectedHotelTier?.id === item.id;
                const nightRate = item.pricePerNightUSD ?? 90;
                const totalHotelCost = Math.round(nightRate * diyNights);
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      setDiyHotelType(item.id);
                      setDiyIncludeHotel(true);
                      setShowHotelModal(false);
                      showToast(`🏨 '${item.name}' 숙박이 선택되었습니다.`);
                    }}
                    className={`p-4 rounded-2xl cursor-pointer transition-all duration-200 active:scale-[0.98] flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-[#ECFDF5] ring-2 ring-[#0A7E54]'
                        : 'bg-[#F2F2F7]/70 hover:bg-[#ECFDF5]/60'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-11 h-11 rounded-xl bg-white flex items-center justify-center text-2xl shrink-0 shadow-2xs">
                        {isImageIconUrl(item.icon) ? (
                          <img src={getFreshImageUrl(item.icon)} alt={item.name} className="w-7 h-7 object-contain rounded" />
                        ) : (
                          item.icon
                        )}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-bold text-sm md:text-base text-gray-900 tracking-tight">{item.name}</h4>
                          {item.badge && (
                            <span className="px-2 py-0.5 bg-white text-[#0A7E54] text-[10px] font-bold rounded-full shadow-2xs">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#8E8E93] mt-0.5 leading-snug">{item.description}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 space-y-1">
                      {showDetailedCosts ? (
                        <>
                          <div className="text-xs md:text-sm font-extrabold text-[#0A7E54] tabular-nums">
                            1박 ${nightRate.toLocaleString()}
                          </div>
                          <div className="text-[11px] font-medium text-[#8E8E93] tabular-nums">
                            ({diyNights}박 ${totalHotelCost.toLocaleString()})
                          </div>
                        </>
                      ) : (
                        <div className="text-xs font-bold text-[#0A7E54]">
                          {diyNights}박 · 1인 1실
                        </div>
                      )}
                      <span className={`inline-block px-3 py-1 rounded-xl text-xs font-bold ${
                        isSelected ? 'bg-[#0A7E54] text-white' : 'bg-white text-[#3A3A3C] shadow-2xs'
                      }`}>
                        {isSelected ? '✓ 선택됨' : '선택'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div
              className="px-5 py-3 md:px-0 md:pb-0 md:pt-3 border-t border-black/[0.06] bg-white sticky bottom-0 z-10 flex items-center justify-between gap-3"
              style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 0.75rem)' }}
            >
              <div className="text-xs text-[#8E8E93] font-medium">
                1인 1실 기준 · {diyNights}박 일정 요금 자동 반영
              </div>
              <button
                type="button"
                onClick={() => setShowHotelModal(false)}
                className="px-6 py-3.5 bg-[#0A7E54] hover:bg-[#086945] text-white rounded-2xl text-sm font-bold shadow-sm transition-all duration-200 active:scale-95 cursor-pointer shrink-0"
              >
                선택 완료 & 적용 ✓
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 10: DIY STEP 5 VEHICLE SELECTION MODAL ================= */}
      {showVehicleModal && (
        <div
          className="fixed inset-0 bg-black/40 z-[10002] flex items-end md:items-center justify-center p-0 md:p-4 backdrop-blur-xs animate-fade-in overflow-hidden font-sans break-keep"
          onClick={() => setShowVehicleModal(false)}
        >
          <div
            className="bg-white rounded-t-3xl md:rounded-[20px] max-w-none md:max-w-2xl w-full max-h-[90vh] p-0 md:p-6 relative shadow-2xl animate-ios-sheet-up flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mt-2.5 mb-1 md:hidden shrink-0" />
            <div className="flex items-center justify-between px-5 py-3 md:px-0 md:pt-0 md:pb-3 border-b border-black/[0.06] bg-white sticky top-0 z-10">
              <div>
                <span className="px-2.5 py-0.5 bg-[#ECFDF5] text-[#0A7E54] text-[11px] font-bold rounded-full">
                  STEP 5 · 전 일정 ({diyDays}일) 단독 전용 · 차량 1대
                </span>
                <h3 className="text-base sm:text-lg md:text-xl font-extrabold tracking-tight text-gray-900 mt-1">
                  🚐 전용 차량을 선택하세요
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowVehicleModal(false)}
                className="text-[#8E8E93] hover:text-gray-900 font-bold text-sm w-8 h-8 flex items-center justify-center rounded-full bg-[#F2F2F7] transition active:scale-90 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto overscroll-contain flex-1 px-5 md:px-0 py-4 space-y-2.5">
              {diyVehicles.map((item) => {
                const isSelected = selectedVehicleItem?.id === item.id;
                const dayRate = item.pricePerDayUSD ?? Math.max(15, 25 + (item.priceDeltaUSD || 0));
                const scheduleVehTotal = Math.round(dayRate * diyDays);
                const displayName = item.shortName || item.name;
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      setDiyVehicleType(item.id);
                      setDiyIncludeVehicle(true);
                      setShowVehicleModal(false);
                      showToast(`🚐 '${displayName}' 차량이 선택되었습니다.`);
                    }}
                    className={`p-4 rounded-2xl cursor-pointer transition-all duration-200 active:scale-[0.98] flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-[#ECFDF5] ring-2 ring-[#0A7E54]'
                        : 'bg-[#F2F2F7]/70 hover:bg-[#ECFDF5]/60'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-11 h-11 rounded-xl bg-white flex items-center justify-center text-2xl shrink-0 shadow-2xs">
                        {isImageIconUrl(item.icon) ? (
                          <img src={getFreshImageUrl(item.icon)} alt={displayName} className="w-7 h-7 object-contain rounded" />
                        ) : (
                          item.icon || '🚐'
                        )}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h4 className="font-bold text-sm md:text-base text-gray-900 tracking-tight">{displayName}</h4>
                          {item.name !== displayName && (
                            <span className="text-[11px] font-medium text-[#8E8E93]">{item.name}</span>
                          )}
                          {item.badge && (
                            <span className="px-2 py-0.5 bg-white text-[#0A7E54] text-[10px] font-bold rounded-full shadow-2xs">
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#8E8E93] mt-0.5 leading-snug">{item.description}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 space-y-1">
                      {showDetailedCosts ? (
                        <>
                          <div className="text-xs md:text-sm font-extrabold text-[#0A7E54] tabular-nums">
                            1일 ${dayRate.toLocaleString()}
                          </div>
                          <div className="text-[11px] font-medium text-[#8E8E93] tabular-nums">
                            ({diyDays}일 ${scheduleVehTotal.toLocaleString()})
                          </div>
                        </>
                      ) : (
                        <div className="text-xs font-bold text-[#0A7E54]">
                          {diyDays}일 단독 차량
                        </div>
                      )}
                      <span className={`inline-block px-3 py-1 rounded-xl text-xs font-bold ${
                        isSelected ? 'bg-[#0A7E54] text-white' : 'bg-white text-[#3A3A3C] shadow-2xs'
                      }`}>
                        {isSelected ? '✓ 선택됨' : '선택'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div
              className="px-5 py-3 md:px-0 md:pb-0 md:pt-3 border-t border-black/[0.06] bg-white sticky bottom-0 z-10 flex items-center justify-between gap-3"
              style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 0.75rem)' }}
            >
              <div className="text-xs text-[#8E8E93] font-medium">
                전용 차량 1대 · 기사/유류비 포함 ({diyDays}일 총액)
              </div>
              <button
                type="button"
                onClick={() => setShowVehicleModal(false)}
                className="px-6 py-3.5 bg-[#0A7E54] hover:bg-[#086945] text-white rounded-2xl text-sm font-bold shadow-sm transition-all duration-200 active:scale-95 cursor-pointer shrink-0"
              >
                선택 완료 & 적용 ✓
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 11: DIY STEP 6 DINNER SELECTION MODAL ================= */}
      {showDinnerModal && (
        <div
          className="fixed inset-0 bg-black/40 z-[10002] flex items-end md:items-center justify-center p-0 md:p-4 backdrop-blur-xs animate-fade-in overflow-hidden font-sans break-keep"
          onClick={() => setShowDinnerModal(false)}
        >
          <div
            className="bg-white rounded-t-3xl md:rounded-[20px] p-0 md:p-6 max-w-2xl w-full max-h-[90vh] shadow-2xl animate-ios-sheet-up flex flex-col justify-between overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mt-2.5 mb-1 md:hidden shrink-0" />
            {/* Header */}
            <div className="px-5 py-3 md:px-0 md:pt-0 md:pb-3 border-b border-black/[0.06] bg-white sticky top-0 z-10 flex justify-between items-start gap-3">
              <div>
                <span className="text-[11px] font-bold text-[#0A7E54] bg-[#ECFDF5] px-2.5 py-0.5 rounded-full inline-block mb-1">
                  STEP 6 · {diyLocation} · {diyNights}박 {diyDays}일 저녁식사
                </span>
                <h3 className="text-lg md:text-xl font-extrabold tracking-tight text-gray-900">
                  🍽️ 일자별 저녁식사 선택
                </h3>
                <p className="text-xs text-[#8E8E93] mt-0.5">
                  선택된 여행 지역과 일정에 맞춰 일자별 저녁식사를 선택해 주세요. (미선택 시 미포함)
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDinnerModal(false)}
                className="w-8 h-8 rounded-full bg-[#F2F2F7] text-[#8E8E93] hover:text-gray-900 font-bold text-sm flex items-center justify-center shrink-0 transition active:scale-90 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto overscroll-contain flex-1 px-5 py-4 md:px-0 space-y-3.5">
              {/* Day Tabs (1일차 ~ diyNights일차) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-[#8E8E93] px-0.5">
                  <span>일정별 저녁 선택 ({diyNights}일간)</span>
                  <span className="text-[#0A7E54] font-bold">{activeDinnerDay}일차 저녁 편집 중</span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {Array.from({ length: diyNights }, (_, idx) => idx + 1).map(dayNum => {
                    const pickedId = diyDinnerSelections[dayNum];
                    const pickedMenu = activeRegionDinnerMenus.find(m => m.id === pickedId);
                    const isActive = activeDinnerDay === dayNum;
                    return (
                      <button
                        key={dayNum}
                        type="button"
                        onClick={() => setActiveDinnerDay(dayNum)}
                        className={`p-2.5 rounded-2xl text-left transition-all duration-200 active:scale-95 cursor-pointer ${
                          isActive
                            ? 'bg-[#0A7E54] text-white shadow-sm'
                            : pickedMenu
                              ? 'bg-[#ECFDF5] text-gray-900 ring-1 ring-[#0A7E54]/30'
                              : 'bg-[#F2F2F7] text-[#3A3A3C] hover:bg-[#ECFDF5]/60'
                        }`}
                      >
                        <div className={`text-[11px] font-bold ${isActive ? 'text-emerald-100' : 'text-[#8E8E93]'}`}>
                          {dayNum}일차 저녁
                        </div>
                        <div className="text-xs font-bold truncate mt-0.5">
                          {pickedMenu ? pickedMenu.name : '미포함'}
                        </div>
                        <div className={`text-[10px] font-semibold tabular-nums ${isActive ? 'text-white/90' : pickedMenu ? 'text-[#0A7E54]' : 'text-[#8E8E93]'}`}>
                          {pickedMenu ? (showDetailedCosts ? `$${pickedMenu.priceUSD}/인` : '선택됨') : '선택 안함'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Unselect Option for Current Day */}
              {(() => {
                const currentPickedId = diyDinnerSelections[activeDinnerDay];
                const isNoneSelected = !currentPickedId;
                return (
                  <div
                    onClick={() => {
                      setDiyDinnerSelections(prev => {
                        const next = { ...prev };
                        delete next[activeDinnerDay];
                        return next;
                      });
                    }}
                    className={`p-3.5 rounded-2xl cursor-pointer transition-all duration-200 active:scale-[0.98] flex items-center justify-between gap-3 ${
                      isNoneSelected
                        ? 'bg-[#F2F2F7] ring-2 ring-[#3A3A3C]/30'
                        : 'bg-[#F2F2F7]/60 hover:bg-[#F2F2F7]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-9 h-9 rounded-xl bg-white text-base flex items-center justify-center shrink-0 shadow-2xs">
                        ➖
                      </span>
                      <div>
                        <div className="font-bold text-sm text-gray-900">
                          {activeDinnerDay}일차 선택 안함 (미포함)
                        </div>
                        <div className="text-xs text-[#8E8E93]">
                          자유 석식으로 진행하며 추가 비용이 발생하지 않습니다.
                        </div>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-xl text-xs font-bold shrink-0 ${
                      isNoneSelected ? 'bg-[#3A3A3C] text-white' : 'bg-white text-[#8E8E93] shadow-2xs'
                    }`}>
                      {isNoneSelected ? '✓ 미포함' : '미포함'}
                    </span>
                  </div>
                );
              })()}

              {/* Regional Recommended 6 Menus (Toggle Select / Deselect) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {activeRegionDinnerMenus.map(menu => {
                  const isSelected = diyDinnerSelections[activeDinnerDay] === menu.id;
                  return (
                    <div
                      key={menu.id}
                      onClick={() => {
                        setDiyDinnerSelections(prev => {
                          if (prev[activeDinnerDay] === menu.id) {
                            const next = { ...prev };
                            delete next[activeDinnerDay];
                            return next;
                          }
                          return {
                            ...prev,
                            [activeDinnerDay]: menu.id
                          };
                        });
                      }}
                      className={`p-4 rounded-2xl cursor-pointer transition-all duration-200 active:scale-[0.98] flex flex-col justify-between gap-2.5 ${
                        isSelected
                          ? 'bg-[#ECFDF5] ring-2 ring-[#0A7E54]'
                          : 'bg-[#F2F2F7]/70 hover:bg-[#ECFDF5]/60'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-bold text-sm text-gray-900 tracking-tight">{menu.name}</h4>
                            {menu.badge && (
                              <span className="px-2 py-0.5 bg-white text-[#0A7E54] text-[10px] font-bold rounded-full shadow-2xs">
                                {menu.badge}
                              </span>
                            )}
                          </div>
                          {showDetailedCosts && (
                            <span className="text-xs md:text-sm font-extrabold text-[#0A7E54] tabular-nums shrink-0">
                              1인 ${menu.priceUSD}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#8E8E93] leading-snug">{menu.description}</p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-black/[0.06]">
                        <span className="text-[11px] text-[#8E8E93] font-medium">
                          {isSelected ? '클릭 시 선택 해제' : `${activeDinnerDay}일차 저녁 적용`}
                        </span>
                        <span className={`px-3 py-1 rounded-xl text-xs font-bold ${
                          isSelected ? 'bg-[#0A7E54] text-white' : 'bg-white text-[#3A3A3C] shadow-2xs'
                        }`}>
                          {isSelected ? '✓ 선택됨' : '선택'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer */}
            <div
              className="px-5 py-3 md:px-0 md:pb-0 md:pt-3 border-t border-black/[0.06] bg-white sticky bottom-0 z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
              style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 0.75rem)' }}
            >
              <div className="flex items-center justify-between sm:justify-start gap-3">
                <div className="text-xs text-[#3A3A3C] font-medium">
                  {dinnerCount > 0 ? (
                    showDetailedCosts ? (
                      <>
                        선택 <strong className="text-[#0A7E54]">{dinnerCount}회</strong> · 1인 총 <strong className="text-[#0A7E54] tabular-nums">${dinnerPerPersonTotal.toLocaleString()}</strong>{' '}
                        <span className="text-[11px] text-[#8E8E93]">({personCount}인 ${(dinnerPerPersonTotal * personCount).toLocaleString()})</span>
                      </>
                    ) : (
                      <>
                        선택 <strong className="text-[#0A7E54]">{dinnerCount}회</strong>{' '}
                        <span className="text-[11px] text-[#8E8E93]">(합산 금액 반영)</span>
                      </>
                    )
                  ) : (
                    <span className="text-[#8E8E93]">선택된 저녁식사 없음 (미포함)</span>
                  )}
                </div>
                {dinnerCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setDiyDinnerSelections({})}
                    className="text-[11px] font-semibold text-[#8E8E93] hover:text-red-500 underline cursor-pointer shrink-0"
                  >
                    전체 미포함
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowDinnerModal(false)}
                className="w-full sm:w-auto px-6 py-3.5 bg-[#0A7E54] hover:bg-[#086945] text-white rounded-2xl text-sm font-bold shadow-sm transition-all duration-200 active:scale-95 cursor-pointer shrink-0"
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
          className="no-print"
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
            customerContact={customerContact.trim() || undefined}
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
            reservationNotice={getReservationNoticeData()}
            showControls={false}
            showDetailedCosts={showDetailedCosts}
          />
        </div>
      )}

      {/* ================= SUBMISSION RESULT NOTICE MODAL ================= */}
      {submissionNotice && (
        <div
          className="fixed inset-0 bg-black/55 z-[10006] flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in font-sans break-keep"
          onClick={() => setSubmissionNotice(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl space-y-4 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`w-14 h-14 rounded-full mx-auto flex items-center justify-center text-2xl font-bold ${
              submissionNotice.type === 'success' ? 'bg-emerald-100 text-[#0A7E54]' : 'bg-red-100 text-red-600'
            }`}>
              {submissionNotice.type === 'success' ? '✓' : '⚠️'}
            </div>
            <p className="text-sm sm:text-base font-bold text-gray-900 leading-relaxed">
              {submissionNotice.message}
            </p>
            <button
              type="button"
              onClick={() => setSubmissionNotice(null)}
              className="w-full py-3 bg-[#0A7E54] hover:bg-[#086945] text-white font-bold rounded-2xl text-sm transition cursor-pointer active:scale-95"
            >
              확인
            </button>
          </div>
        </div>
      )}

      {/* ================= QUOTATION PREVIEW POPUP (Matches Recommended Product QuotationModal) ================= */}
      {showQuotePreviewModal && activePackage && (
        <div
          className="quotation-vertical-only fixed inset-0 w-full max-w-full bg-black/55 z-[10000] flex items-end md:items-center justify-center p-0 md:p-4 backdrop-blur-sm print:backdrop-blur-none overflow-hidden overscroll-contain animate-fade-in print:p-0 print:block print:bg-white print:static print:overflow-visible pt-safe"
          style={{ touchAction: 'pan-y', overscrollBehaviorX: 'none' }}
          onClick={() => setShowQuotePreviewModal(false)}
        >
          <div
            className="bg-[#F2F2F7] w-full max-w-full md:max-w-4xl max-h-[92vh] md:h-auto md:max-h-[94vh] rounded-t-3xl md:rounded-[20px] shadow-2xl relative flex flex-col overflow-hidden md:my-auto animate-ios-sheet-up print:block print:overflow-visible print:h-auto print:max-h-none print:max-w-none print:my-0 print:shadow-none print:bg-white print:w-full print:rounded-none"
            style={{ touchAction: 'pan-y', overscrollBehaviorX: 'none' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mt-2.5 mb-1 md:hidden no-print shrink-0" />
            {/* Top Control Bar inside Modal (no-print) */}
            <div className="no-print w-full max-w-full overflow-x-hidden bg-white/90 backdrop-blur-md px-3 md:px-6 py-2.5 md:py-3 border-b border-black/[0.06] flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <button
                  type="button"
                  onClick={() => setShowQuotePreviewModal(false)}
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
                    {activePackage.title}
                  </span>
                  <span className="text-[10px] text-gold-600 font-bold block sm:hidden">
                    맞춤 여행 견적 및 일정 안내서
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
                    placeholder="고객"
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
                  onClick={() => setShowQuotePreviewModal(false)}
                  className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center font-bold text-sm transition cursor-pointer shrink-0"
                  aria-label="닫기"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Mobile Quick Option Strip (wrapped cleanly within 100% width, no horizontal scroll) */}
            <div className="sm:hidden no-print w-full max-w-full bg-gray-50/95 border-b border-gray-200 px-2.5 py-1.5 flex flex-wrap items-center gap-1.5 overflow-x-hidden text-xs shrink-0">
              <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-2 py-1 shrink-0 max-w-full">
                <span className="text-[10px] text-gray-500 font-bold whitespace-nowrap">고객명:</span>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="고객"
                  className="w-14 min-w-0 text-xs font-bold outline-none"
                />
              </div>
              <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-2 py-1 shrink-0 max-w-full">
                <span className="text-[10px] text-gray-500 font-bold whitespace-nowrap">출발일:</span>
                <input
                  type="date"
                  value={departureDate}
                  onChange={(e) => setDepartureDate(e.target.value)}
                  className="text-xs font-bold outline-none max-w-[130px] min-w-0"
                />
              </div>
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
              className="flex-1 w-full max-w-full overflow-x-hidden overflow-y-auto overscroll-contain p-0 md:p-6 print:p-0 print:overflow-visible"
              style={{
                WebkitOverflowScrolling: 'touch',
                overscrollBehavior: 'contain',
                overscrollBehaviorX: 'none',
                touchAction: 'pan-y',
              }}
            >
              <A4QuotationDocument
                customerName={customerName || '고객'}
                customerContact={customerContact.trim() || undefined}
                personCount={personCount}
                managerName="망고투어 전문 상담팀"
                managerContact="+84 37 720 4451"
                location={activePackage.location}
                duration={activePackage.duration}
                departureDate={departureDate}
                totalPriceKRW={currentTotalGroup * USD_TO_KRW}
                totalPriceUSD={currentTotalGroup}
                costItems={getA4CostItems()}
                itinerary={getA4ItineraryDays()}
                notes={customerNotes}
                reservationNotice={getReservationNoticeData()}
                onClose={() => setShowQuotePreviewModal(false)}
                showControls={true}
                showDetailedCosts={showDetailedCosts}
                isLoggedIn={isLoggedIn}
                onRequireLogin={ensureMemberLoginForQuotation}
              />
            </div>

            {/* Unified Sticky Bottom Action Bar */}
            <div
              className="no-print bg-white/95 backdrop-blur-md border-t border-black/[0.08] px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between gap-2.5 shrink-0 z-20"
              style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 0.75rem)' }}
            >
              <div className="min-w-0">
                <span className="text-[10px] sm:text-xs text-[#8E8E93] font-semibold block">
                  총 {personCount}인 예상 견적 (1인 약 ${currentTotalPerPerson.toLocaleString()})
                </span>
                <div className="text-sm sm:text-lg font-black text-[#0A7E54] tabular-nums truncate">
                  ${currentTotalGroup.toLocaleString()} USD
                  <span className="text-[11px] sm:text-xs text-[#3A3A3C] font-medium ml-1">
                    (약 {(currentTotalGroup * USD_TO_KRW).toLocaleString()}원)
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
                  onClick={() => {
                    setShowQuotePreviewModal(false);
                    handleOpenOnlineInquiry();
                  }}
                  className="px-4 sm:px-6 py-3 bg-[#0A7E54] hover:bg-[#086945] text-white font-bold rounded-xl text-xs sm:text-sm md:text-base shadow-md transition-all duration-200 flex items-center gap-1.5 active:scale-95 cursor-pointer whitespace-nowrap"
                >
                  <span>📩</span>
                  <span>1:1 온라인 견적 신청하기</span>
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
