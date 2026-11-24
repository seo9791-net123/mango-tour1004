
import React, { useState, useEffect, useRef, useCallback } from 'react';
import HeroSlider from './components/HeroSlider';
import NoticeBar from './components/NoticeBar';
import IconMenu from './components/IconMenu';
import VideoGallery from './components/VideoGallery';
import CommunityBoard from './components/CommunityBoard';
import ChatRoom from './components/ChatRoom';
import ChatNotificationToast from './components/ChatNotificationToast';
import QuotationModal from './components/QuotationModal';
import AdminDashboard from './components/AdminDashboard';
import CategoryPage from './components/CategoryPage';
import BusinessPage from './components/BusinessPage';
import HotelVillaPage from './components/HotelVillaPage';
import GolfPage from './components/GolfPage';
import FoodPage from './components/FoodPage';
import CulturePage from './components/CulturePage';
import ForMenPage from './components/ForMenPage';
import TourPage from './components/TourPage';
import EventPage from './components/EventPage';
import TripPlanner from './components/TripPlanner';
import BottomNav from './components/BottomNav';
import Privacy from './components/Privacy';
import Terms from './components/Terms';
import SplashScreen from './components/SplashScreen';
import VietnamWeatherBadge from './components/VietnamWeatherBadge';
import { INITIAL_PRODUCTS, INITIAL_VIDEOS, INITIAL_POSTS, HERO_IMAGES, SUB_MENU_ITEMS, INITIAL_PAGE_CONTENTS, INITIAL_POPUP, INITIAL_RECOMMENDED_DISCOUNT_POPUP, INITIAL_NOTICES, INITIAL_CUSTOM_PACKAGES, INITIAL_MASTER_OPTION_POOL } from './constants';
import { User, Product, VideoItem, CommunityPost, PageContent, MenuItem, PopupNotification, RecommendedDiscountPopup, NoticeItem, CustomTripPackage, MasterOptionPool, ChatMessage, QuotationVisibilitySettings } from './types';
import { supabaseService } from './services/supabaseService';
import { updateSupabaseCredentials, clearAdminSessionToken, isSupabaseConfigured } from './services/supabaseClient';
import { setCloudinaryConfig, getCloudinaryConfig } from './services/uploadService';
import { debounce } from './utils/debounce';
import { getFreshImageUrl } from './utils/imageUtils';
import CustomDialogHost from './components/CustomDialogHost';
import { appAlert } from './services/dialogService';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [isAuthSubmitting, setIsAuthSubmitting] = useState(false);
  
  // Routing State & Privacy / Terms Route Detection
  type PageType = 'home' | 'admin' | 'category' | 'privacy' | 'terms';

  interface HistoryEntry {
    page: PageType;
    category: string | null;
  }

  // 개인정보 주소 (/privacy, /policy 등) 접근 시 개인정보처리방침 감지
  const checkIsPrivacyRoute = (): boolean => {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname.toLowerCase();
    const search = window.location.search.toLowerCase();
    const hash = window.location.hash.toLowerCase();

    // 기본 루트 ('/' 또는 '') 접속 시에는 메인 화면 표시
    if (path === '/' || path === '') {
      if (search.includes('page=privacy') || hash === '#privacy') return true;
      return false;
    }

    return (
      path.startsWith('/privacy') ||
      path.startsWith('/policy') ||
      search.includes('page=privacy') ||
      hash === '#privacy'
    );
  };

  // 이용약관 주소 (/terms, /tos 등) 접근 시 이용약관 감지
  const checkIsTermsRoute = (): boolean => {
    if (typeof window === 'undefined') return false;
    const path = window.location.pathname.toLowerCase();
    const search = window.location.search.toLowerCase();
    const hash = window.location.hash.toLowerCase();

    // 기본 루트 ('/' 또는 '') 접속 시에는 메인 화면 표시
    if (path === '/' || path === '') {
      if (search.includes('page=terms') || hash === '#terms') return true;
      return false;
    }

    return (
      path.startsWith('/terms') ||
      path.startsWith('/tos') ||
      search.includes('page=terms') ||
      hash === '#terms'
    );
  };

  const getInitialPage = (): PageType => {
    if (checkIsPrivacyRoute()) return 'privacy';
    if (checkIsTermsRoute()) return 'terms';
    return 'home';
  };

  const [currentPage, setCurrentPage] = useState<PageType>(() => getInitialPage());
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [navHistory, setNavHistory] = useState<HistoryEntry[]>(() => [
    { page: getInitialPage(), category: null }
  ]);

  // Data State
  const [heroImages, setHeroImages] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('mango_hero_images_db');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return HERO_IMAGES;
  });
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => {
    try {
      const saved = localStorage.getItem('mango_menu_items_db');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return SUB_MENU_ITEMS;
  });
  const isNewPresetProductId = (id: string) =>
    id.startsWith('p-35-') || id.startsWith('p-46-') || id.startsWith('p-57-');

  const getDeletedPresetIds = (): Set<string> => {
    try {
      const raw = localStorage.getItem('mango_deleted_preset_ids_v1');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return new Set(parsed.map(String));
      }
    } catch {}
    return new Set();
  };

  const mergeMissingNewPresets = (existing: Product[]): Product[] => {
    const existingIds = new Set(existing.map(p => String(p.id)));
    const deletedIds = getDeletedPresetIds();
    const missingPresets = INITIAL_PRODUCTS.filter(
      p => isNewPresetProductId(String(p.id)) && !existingIds.has(String(p.id)) && !deletedIds.has(String(p.id))
    );
    if (missingPresets.length === 0) return existing;
    return [...existing, ...missingPresets];
  };

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('mango_products_db');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const updated = parsed.map((p: Product) => {
            if (p.costItems && p.costItems.length > 0) {
              const updatedItems = p.costItems.map(item => {
                if (item.category.includes('차량') && (item.amountUSD === 194 || item.amountUSD === 97 || !item.perDay)) {
                  return {
                    ...item,
                    detail: '전 일정 단독 VIP 7인승 전용 리무진 밴 (공항 픽업/샌딩 + 골프장 + 시내 전용 기사/유류비 포함)',
                    quantity: '{vehicleCount}대 (전일정 {days}일)',
                    amountUSD: 100,
                    perDay: true,
                    pricingType: 'vehicle' as const
                  };
                }
                if (item.category.includes('숙박') || item.category.includes('호텔')) {
                  return {
                    ...item,
                    detail: item.detail.replace(/5성급\s*럭셔리\s*호텔/g, '고급 호텔').replace(/5성급\s*호텔/g, '고급 호텔')
                  };
                }
                return item;
              });
              return { ...p, costItems: updatedItems };
            }
            return p;
          });
          return mergeMissingNewPresets(updated);
        }
      } catch {
        // fallback
      }
    }
    return INITIAL_PRODUCTS;
  });
  const [videos, setVideos] = useState<VideoItem[]>(() => {
    try {
      const saved = localStorage.getItem('mango_videos_db');
      if (saved) {
        const parsed = JSON.parse(saved);
        const cleaned = Array.isArray(parsed) ? parsed.filter((v: any) => v?.url && !v.url.startsWith('blob:')) : [];
        if (cleaned.length > 0) return cleaned;
      }
    } catch {
      // ignore
    }
    return INITIAL_VIDEOS;
  });
  const [posts, setPosts] = useState<CommunityPost[]>(INITIAL_POSTS);
  const [pageContents, setPageContents] = useState<Record<string, PageContent>>(() => {
    try {
      const saved = localStorage.getItem('mango_page_contents_db');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object' && Object.keys(parsed).length > 0) {
          return { ...INITIAL_PAGE_CONTENTS, ...parsed };
        }
      }
    } catch {}
    return INITIAL_PAGE_CONTENTS;
  });
  const cleanCustomPackages = (pkgs: CustomTripPackage[]): CustomTripPackage[] => {
    return pkgs.map(pkg => {
      // Find matching template in INITIAL_CUSTOM_PACKAGES if it's one of preset packages (pkg-1 ~ pkg-10)
      const template = INITIAL_CUSTOM_PACKAGES.find(t => t.id === pkg.id);
      
      let baseOptions = template && pkg.id.startsWith('pkg-')
        ? [...template.options] 
        : [...(pkg.options || [])];

      // Filter out caddy/cart if any
      baseOptions = baseOptions.filter(
        opt => !opt.name.includes('전동카트') && !opt.name.includes('캐디 피') && !opt.name.includes('캐디피')
      );

      // 1. Ensure Fast Track option exists ($60/person)
      const hasFastTrack = baseOptions.some(opt => 
        opt.name.includes('패스트 트랙') || opt.name.includes('Fast Track') || opt.id.includes('fasttrack')
      );
      if (!hasFastTrack) {
        baseOptions.push({
          id: `opt-${pkg.id}-fasttrack`,
          category: 'etc',
          name: '공항 VIP 패스트 트랙 (Fast Track / 1인당 $60)',
          description: '공항 도착 시 VIP 전용 패스트트랙 라인으로 대기 없이 초고속 입국 심사 및 수하물 수취 케어',
          priceUSD: 60,
          isDefaultIncluded: false
        });
      } else {
        baseOptions = baseOptions.map(opt => {
          if (opt.name.includes('패스트 트랙') || opt.name.includes('Fast Track') || opt.id.includes('fasttrack')) {
            return {
              ...opt,
              name: '공항 VIP 패스트 트랙 (Fast Track / 1인당 $60)',
              description: '공항 도착 시 VIP 전용 패스트트랙 라인으로 대기 없이 초고속 입국 심사 및 수하물 수취 케어',
              priceUSD: 60,
              isDefaultIncluded: false
            };
          }
          return opt;
        });
      }

      // 2. Ensure Vehicle option matches 5-day travel schedule (1대 1일 $100 기준, 5일간 $500 -> 4인 기준 1인 $125)
      baseOptions = baseOptions.map(opt => {
        if (opt.category === 'vehicle') {
          return {
            ...opt,
            name: '전 일정 단독 VIP 전용 리무진 밴 (5일간 / 1일 $100 기준)',
            description: '공항 픽업/샌딩 + 골프장 + 시내 투어 기사/유류비 포함 (7인승 1대 1일 $100 × 5일 = $500, 4인 기준 1인 $125)',
            priceUSD: 125,
            isDefaultIncluded: true
          };
        }
        return opt;
      });

      // 3. Ensure Guide option matches 5-day travel schedule (1일 $120 기준, 5일간 $600 -> 4인 기준 1인 $150)
      baseOptions = baseOptions.map(opt => {
        if (opt.category === 'guide' || opt.name.includes('가이드')) {
          return {
            ...opt,
            name: '한국어 전문 가이드 전 일정 동행 (5일간 / 1일 기준 $120)',
            description: '골프 체크인/아웃 지원, 일정 조율 및 시내 올케어 (가이드 1일 $120 × 5일 = $600, 4인 기준 1인 $150)',
            priceUSD: 150
          };
        }
        return opt;
      });

      // 4. Ensure Lodging option is 1인 객실 기준 (1인 1실) and 5성급 is updated to 고급 호텔
      baseOptions = baseOptions.map(opt => {
        if (opt.category === 'hotel') {
          let updatedName = opt.name
            .replace(/5성급\s*호텔/g, '고급 호텔')
            .replace(/5성급/g, '고급')
            .replace(/2인\s*1실/g, '1인 객실 기준')
            .replace(/2인1실/g, '1인 객실 기준');
          if (!updatedName.includes('1인')) {
            updatedName = `${updatedName} (1인 객실 기준)`;
          }
          let updatedDesc = (opt.description || '')
            .replace(/5성급\s*호텔/g, '고급 호텔')
            .replace(/5성급/g, '고급');
          if (!updatedDesc.includes('1인 1실') && !updatedDesc.includes('1인실')) {
            updatedDesc = updatedDesc ? `${updatedDesc} (전 일정 1인 1실 단독 객실)` : '전 일정 1인 1실 단독 객실 사용 & 조식 포함';
          }
          return {
            ...opt,
            name: updatedName,
            description: updatedDesc
          };
        }
        return opt;
      });

      // 5. Ensure Massage option is default included ($50)
      const hasMassage = baseOptions.some(opt => opt.name.includes('마사지') || opt.id.includes('spa'));
      if (!hasMassage) {
        baseOptions.push({
          id: `opt-${pkg.id}-spa`,
          category: 'activity',
          name: 'VIP 전신 힐링 마사지 (90분)',
          description: '골프 라운딩 후 피로를 풀어주는 프리미엄 마사지 & 스파 케어 (기본 선택 포함)',
          priceUSD: 50,
          isDefaultIncluded: true
        });
      } else {
        baseOptions = baseOptions.map(opt => {
          if (opt.name.includes('마사지') || opt.id.includes('spa')) {
            const desc = opt.description || '골프 라운딩 후 피로를 풀어주는 프리미엄 마사지 & 스파 케어';
            return {
              ...opt,
              category: 'activity',
              name: opt.name.includes('VIP') ? opt.name : 'VIP 전신 힐링 마사지 (90분)',
              description: desc.includes('기본 선택 포함') ? desc : `${desc} (기본 선택 포함)`,
              priceUSD: 50,
              isDefaultIncluded: true
            };
          }
          return opt;
        });
      }

      // 6. Ensure Meal option is selectable (isDefaultIncluded: false) with 1일 $50 × 4일 = $200 pricing
      const hasMeal = baseOptions.some(opt => opt.category === 'meal' || opt.name.includes('특식') || opt.name.includes('석식'));
      if (!hasMeal) {
        baseOptions.push({
          id: `opt-${pkg.id}-meal`,
          category: 'meal',
          name: '프리미엄 웰컴 & 굿바이 특식 만찬 (석식 4회 / 1일 $50)',
          description: '1인 1일 $50 × 4일 = 총 $200 / 최고급 정통 베트남식, 씨푸드 만찬, 숯불 바베큐',
          priceUSD: 200,
          isDefaultIncluded: false
        });
      } else {
        baseOptions = baseOptions.map(opt => {
          if (opt.category === 'meal' || opt.name.includes('특식') || opt.name.includes('석식')) {
            return {
              ...opt,
              category: 'meal',
              name: '프리미엄 웰컴 & 굿바이 특식 만찬 (석식 4회 / 1일 $50)',
              description: '1인 1일 $50 × 4일 = 총 $200 / 최고급 정통 베트남식, 씨푸드 만찬, 숯불 바베큐',
              priceUSD: 200,
              isDefaultIncluded: false
            };
          }
          return opt;
        });
      }

      // 7. Sort options order: golf (1) -> hotel (2) -> vehicle (3) -> guide (4) -> etc (5) -> activity/massage (6) -> meal (7) -> other (8)
      const catOrder: Record<string, number> = {
        golf: 1,
        hotel: 2,
        vehicle: 3,
        guide: 4,
        etc: 5,
        activity: 6,
        meal: 7
      };
      baseOptions.sort((a, b) => {
        const orderA = catOrder[a.category] ?? 8;
        const orderB = catOrder[b.category] ?? 8;
        return orderA - orderB;
      });

      // Highlight Badges & Text Update (5성급 -> 고급 호텔)
      let badges = (pkg.highlightBadges ? [...pkg.highlightBadges] : ['4박 5일']).map(b => 
        b.replace(/5성급\s*호텔/g, '고급 호텔').replace(/호치민 5성급/g, '호치민 고급 호텔').replace(/달랏 5성급 리조트/g, '달랏 고급 리조트').replace(/5성급/g, '고급')
      );
      if (!badges.includes('1인 1실 숙박')) {
        badges.splice(1, 0, '1인 1실 숙박');
      }

      const defaultTotal = baseOptions.reduce((sum, opt) => opt.isDefaultIncluded ? sum + (opt.priceUSD || 0) : sum, 0);

      return {
        ...pkg,
        subtitle: pkg.subtitle ? pkg.subtitle.replace(/5성급\s*호텔/g, '고급 호텔').replace(/5성급/g, '고급') : pkg.subtitle,
        summary: pkg.summary ? pkg.summary.replace(/5성급\s*호텔/g, '고급 호텔').replace(/5성급/g, '고급') : pkg.summary,
        basePriceUSD: defaultTotal > 0 ? defaultTotal : (template?.basePriceUSD || pkg.basePriceUSD),
        highlightBadges: badges,
        options: baseOptions
      };
    });
  };

  const cleanMasterOptionPool = (pool: MasterOptionPool): MasterOptionPool => {
    const existingGolf = pool.golfCourses || [];
    const existingGolfIds = new Set(existingGolf.map(g => g.id));
    // Ensure new Mui Ne / Nha Trang courses are available for legacy localStorage pools without overwriting user-edited ones
    const missingRegionalGolf = (!existingGolf.some(g => g.location === '무이네' || g.location === '나트랑'))
      ? INITIAL_MASTER_OPTION_POOL.golfCourses.filter(g => (g.location === '무이네' || g.location === '나트랑') && !existingGolfIds.has(g.id))
      : [];
    const mergedGolf = [...existingGolf, ...missingRegionalGolf].map(gc => ({
      ...gc,
      priceUSD: gc.priceUSD !== undefined ? gc.priceUSD : Math.max(80, 155 + (gc.priceDeltaUSD || 0))
    }));

    const vehicleDefaultsMap = new Map(INITIAL_MASTER_OPTION_POOL.vehicles.map(v => [v.id, v]));
    const rawVehicles = (pool.vehicles && pool.vehicles.length > 0) ? pool.vehicles : INITIAL_MASTER_OPTION_POOL.vehicles;
    const mergedVehicles = rawVehicles.map(v => {
      const def = vehicleDefaultsMap.get(v.id);
      const inferredShort =
        v.shortName ||
        (v.name.includes('7인승') ? '7인승' :
         v.name.includes('9인승') ? '9인승' :
         v.name.includes('16인승') ? '16인승' :
         (v.name.includes('26인승') || v.name.includes('28인승') || v.name.includes('18~28')) ? '26인승' :
         v.name.slice(0, 6));
      return {
        ...v,
        shortName: inferredShort,
        icon: v.icon || def?.icon || '🚐',
        pricePerDayUSD: v.pricePerDayUSD !== undefined ? v.pricePerDayUSD : (def?.pricePerDayUSD ?? Math.max(15, 25 + Math.round((v.priceDeltaUSD || 0) / 5)))
      };
    });

    const regionDefaults = INITIAL_MASTER_OPTION_POOL.diyRegions || [];
    const mergedRegions = (pool.diyRegions && pool.diyRegions.length > 0 ? pool.diyRegions : regionDefaults).map((reg) => {
      const def = regionDefaults.find(d => d.id === reg.id || d.name === reg.name);
      return {
        ...reg,
        icon: reg.icon || def?.icon || '🌴',
        image: reg.image || def?.image,
      };
    });

    return {
      ...pool,
      diyRegions: mergedRegions,
      golfCourses: mergedGolf,
      tourOptions: (pool.tourOptions && pool.tourOptions.length > 0) ? pool.tourOptions : INITIAL_MASTER_OPTION_POOL.tourOptions,
      accommodationTiers: (pool.accommodationTiers && pool.accommodationTiers.length > 0) ? pool.accommodationTiers : INITIAL_MASTER_OPTION_POOL.accommodationTiers,
      accommodations: (pool.accommodations || []).map(acc => ({
        ...acc,
        name: acc.name.replace(/5성급\s*호텔/g, '고급 호텔').replace(/5성급/g, '고급').replace(/2인\s*1실/g, '1인 객실 기준').replace(/2인1실/g, '1인 객실 기준'),
        description: acc.description.replace(/5성급\s*호텔/g, '고급 호텔').replace(/5성급/g, '고급').replace(/2인\s*1실/g, '1인 1실').replace(/2인1실/g, '1인 1실'),
        badge: acc.badge ? acc.badge.replace(/5성급\s*호텔/g, '고급 호텔').replace(/5성급\s*1인실/g, '고급 호텔 1인실').replace(/5성급/g, '고급') : acc.badge
      })),
      vehicles: mergedVehicles,
      extraServices: (pool.extraServices && pool.extraServices.length > 0) ? pool.extraServices : INITIAL_MASTER_OPTION_POOL.extraServices,
      dinnerOptions: (pool.dinnerOptions && pool.dinnerOptions.length > 0) ? pool.dinnerOptions : INITIAL_MASTER_OPTION_POOL.dinnerOptions,
      guides: (pool.guides || []).map(gui => {
        if (gui.id === 'gui-1' || gui.name.includes('가이드')) {
          return {
            ...gui,
            name: gui.name.includes('120') ? gui.name : `${gui.name} (1일 기준 $120)`,
            description: gui.description.includes('120') ? gui.description : `${gui.description} (1일 기준 $120)`
          };
        }
        return gui;
      })
    };
  };

  const [popup, setPopup] = useState<PopupNotification>(INITIAL_POPUP);
  const [recommendedDiscountPopup, setRecommendedDiscountPopup] = useState<RecommendedDiscountPopup>(() => {
    try {
      const saved = localStorage.getItem('mango_recommended_discount_popup_db');
      return saved ? { ...INITIAL_RECOMMENDED_DISCOUNT_POPUP, ...JSON.parse(saved) } : INITIAL_RECOMMENDED_DISCOUNT_POPUP;
    } catch {
      return INITIAL_RECOMMENDED_DISCOUNT_POPUP;
    }
  });
  const [notices, setNotices] = useState<NoticeItem[]>(() => {
    try {
      const saved = localStorage.getItem('mango_notices_db');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return INITIAL_NOTICES;
  });
  const [customPackages, setCustomPackages] = useState<CustomTripPackage[]>(() => {
    const saved = localStorage.getItem('mango_custom_packages_db');
    const raw = saved ? JSON.parse(saved) : INITIAL_CUSTOM_PACKAGES;
    return cleanCustomPackages(raw);
  });
  const [masterOptionPool, setMasterOptionPool] = useState<MasterOptionPool>(() => {
    const saved = localStorage.getItem('mango_master_options_pool_db');
    const raw = saved ? JSON.parse(saved) : INITIAL_MASTER_OPTION_POOL;
    return cleanMasterOptionPool(raw);
  });
  const [quotationSettings, setQuotationSettings] = useState<QuotationVisibilitySettings>(() => {
    try {
      const saved = localStorage.getItem('mango_quotation_settings_db');
      if (saved) return { showDetailedCostsToCustomers: false, ...JSON.parse(saved) };
    } catch {}
    return { showDetailedCostsToCustomers: false };
  });
  const [adminShowDetailedCosts, setAdminShowDetailedCosts] = useState<boolean>(() => {
    try {
      return localStorage.getItem('mango_admin_show_detailed_costs_v1') === 'true';
    } catch {
      return false;
    }
  });
  const [showPopup, setShowPopup] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [incomingChatToast, setIncomingChatToast] = useState<ChatMessage | null>(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [isSplashExiting, setIsSplashExiting] = useState(false);
  const splashMountTimeRef = useRef<number>(Date.now());
  const [isLocalMode, setIsLocalMode] = useState(false);

  useEffect(() => {
    if (!isDataLoaded) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const minDisplayMs = prefersReducedMotion ? 150 : 1650;
    const exitDurationMs = prefersReducedMotion ? 150 : 720;

    const elapsed = Date.now() - splashMountTimeRef.current;
    const delayBeforeExit = Math.max(0, minDisplayMs - elapsed);

    let unmountTimer: number | undefined;
    const exitTimer = window.setTimeout(() => {
      setIsSplashExiting(true);
      unmountTimer = window.setTimeout(() => {
        setShowSplash(false);
      }, exitDurationMs);
    }, delayBeforeExit);

    return () => {
      window.clearTimeout(exitTimer);
      if (unmountTimer !== undefined) {
        window.clearTimeout(unmountTimer);
      }
    };
  }, [isDataLoaded]);

  const handleIncomingChatMessage = (msg: ChatMessage) => {
    if (!isChatOpen) {
      setUnreadChatCount(prev => prev + 1);
      setIncomingChatToast(msg);
    }
  };

  const handleOpenChatFromToast = () => {
    setIsChatOpen(true);
    setUnreadChatCount(0);
    setIncomingChatToast(null);
  };

  // --- Session Persistence & URL Sync Handling ---
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search) {
      const params = new URLSearchParams(window.location.search);
      const syncConfig = params.get('sync_config');
      if (syncConfig) {
        try {
          const decoded = JSON.parse(decodeURIComponent(atob(syncConfig)));
          if (decoded.sbUrl && decoded.sbAnonKey) {
            updateSupabaseCredentials(decoded.sbUrl, decoded.sbAnonKey);
          }
          if (decoded.cloudName && decoded.uploadPreset) {
            setCloudinaryConfig(decoded.cloudName, decoded.uploadPreset);
          }
          console.log("✅ Sync config applied from URL parameter!");
        } catch (e) {
          console.warn("Failed to parse sync_config:", e);
        }
      }
      if (params.get('sync_config') || params.get('fb_config')) {
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      }
    }

    const savedUser = localStorage.getItem('mango_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Failed to parse saved user", e);
      }
    }
  }, []);

  useEffect(() => {
    if (user) {
      const { passwordHash: _omit, ...safeUser } = user;
      localStorage.setItem('mango_user', JSON.stringify(safeUser));
    } else {
      localStorage.removeItem('mango_user');
    }
  }, [user]);

  // Persist products, custom packages, and master option pool locally
  useEffect(() => {
    try {
      localStorage.setItem('mango_products_db', JSON.stringify(products));
    } catch (e) {
      console.warn("Failed to persist products:", e);
    }
  }, [products]);

  useEffect(() => {
    try {
      localStorage.setItem('mango_custom_packages_db', JSON.stringify(customPackages));
    } catch (e) {
      console.warn("Failed to persist custom packages:", e);
    }
  }, [customPackages]);

  useEffect(() => {
    try {
      localStorage.setItem('mango_master_options_pool_db', JSON.stringify(masterOptionPool));
    } catch (e) {
      console.warn("Failed to persist master options pool:", e);
    }
  }, [masterOptionPool]);

  useEffect(() => {
    try {
      localStorage.setItem('mango_videos_db', JSON.stringify(videos));
    } catch (e) {
      console.warn("Failed to persist videos:", e);
    }
  }, [videos]);

  // Persist hero images locally
  useEffect(() => {
    try {
      localStorage.setItem('mango_hero_images_db', JSON.stringify(heroImages));
    } catch (e) {
      console.warn("Failed to persist hero images:", e);
    }
  }, [heroImages]);

  // Persist menu items locally
  useEffect(() => {
    try {
      localStorage.setItem('mango_menu_items_db', JSON.stringify(menuItems));
    } catch (e) {
      console.warn("Failed to persist menu items:", e);
    }
  }, [menuItems]);

  // Persist page contents locally
  useEffect(() => {
    try {
      localStorage.setItem('mango_page_contents_db', JSON.stringify(pageContents));
    } catch (e) {
      console.warn("Failed to persist page contents:", e);
    }
  }, [pageContents]);

  // --- Supabase Cloud Integration Handlers ---
  const [cloudSyncStatus, setCloudSyncStatus] = useState<{
    state: 'idle' | 'saving' | 'synced' | 'error';
    lastSyncedAt?: string;
    errorMessage?: string;
  }>({ state: 'idle' });

  // Queued Sync Runner (prevents dropping edits made while an earlier sync is still in-flight)
  const isSyncing = useRef<Record<string, boolean>>({});
  const queuedSyncTasks = useRef<Record<string, (() => Promise<any>) | null>>({});

  const runQueuedSync = useCallback(async (key: string, task: () => Promise<any>) => {
    if (isSyncing.current[key]) {
      queuedSyncTasks.current[key] = task;
      return;
    }
    isSyncing.current[key] = true;
    setCloudSyncStatus(prev => ({ ...prev, state: 'saving', errorMessage: undefined }));
    try {
      let currentTask: (() => Promise<any>) | null = task;
      let anySkipped = false;
      while (currentTask) {
        queuedSyncTasks.current[key] = null;
        const res = await currentTask();
        if (res && typeof res === 'object' && res.skipped) {
          anySkipped = true;
        }
        currentTask = queuedSyncTasks.current[key];
      }
      if (!anySkipped) {
        setCloudSyncStatus({
          state: 'synced',
          lastSyncedAt: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        });
      } else {
        setCloudSyncStatus(prev => (prev.state === 'saving' ? { ...prev, state: 'idle' } : prev));
      }
    } catch (e: any) {
      setCloudSyncStatus({
        state: 'error',
        errorMessage: e?.message || 'Supabase 클라우드 저장 중 오류가 발생했습니다.',
      });
    } finally {
      isSyncing.current[key] = false;
    }
  }, []);

  const debouncedSyncProducts = useRef(debounce(async (newProducts: Product[]) => {
    await runQueuedSync('products', () => supabaseService.syncCollection('products', newProducts));
  }, 1500)).current;

  const debouncedSyncVideos = useRef(debounce(async (newVideos: VideoItem[]) => {
    await runQueuedSync('videos', () => supabaseService.syncCollection('videos', newVideos));
  }, 1500)).current;

  const debouncedSyncPosts = useRef(debounce(async (newPosts: CommunityPost[]) => {
    await runQueuedSync('posts', () => supabaseService.syncCollection('posts', newPosts));
  }, 1500)).current;

  const debouncedSyncPages = useRef(debounce(async (newContents: Record<string, PageContent>) => {
    await runQueuedSync('pages', async () => {
      const results = await Promise.all(
        Object.entries(newContents).map(([pageId, content]) =>
          supabaseService.savePageContent(pageId, content)
        )
      );
      return { skipped: results.every((r: any) => r?.skipped) };
    });
  }, 1800)).current;

  const debouncedSyncSettings = useRef(debounce(async (key: 'heroImages' | 'menuItems', data: any) => {
    await runQueuedSync(`settings_${key}`, () => supabaseService.saveSettings(key, data));
  }, 800)).current;

  const debouncedSyncPopup = useRef(debounce(async (newPopup: PopupNotification) => {
    await runQueuedSync('popup', () => supabaseService.savePopup(newPopup));
  }, 1200)).current;

  const debouncedSyncRecommendedDiscountPopup = useRef(debounce(async (newDiscountPopup: RecommendedDiscountPopup) => {
    await runQueuedSync('recommended_discount_popup', () => supabaseService.saveRecommendedDiscountPopup(newDiscountPopup));
  }, 1200)).current;

  const debouncedSyncNotices = useRef(debounce(async (newNotices: NoticeItem[]) => {
    await runQueuedSync('notices', () => supabaseService.saveNotices(newNotices));
  }, 800)).current;

  const debouncedSyncCustomPackages = useRef(debounce(async (newPkgs: CustomTripPackage[]) => {
    await runQueuedSync('custom_packages', () => supabaseService.syncCollection('custom_packages', newPkgs));
  }, 1500)).current;

  const debouncedSyncMasterOptionPool = useRef(debounce(async (newPool: MasterOptionPool) => {
    await runQueuedSync('master_option_pool', () => supabaseService.saveMasterOptionPool(newPool));
  }, 1000)).current;

  const debouncedSyncQuotationSettings = useRef(debounce(async (newSettings: QuotationVisibilitySettings) => {
    await runQueuedSync('quotation_settings', () => supabaseService.saveQuotationSettings(newSettings));
  }, 800)).current;

  const latestSyncSnapshotRef = useRef({
    heroImages,
    menuItems,
    products,
    videos,
    posts,
    customPackages,
    masterOptionPool,
    pageContents,
    popup,
    recommendedDiscountPopup,
    notices,
    quotationSettings,
  });
  latestSyncSnapshotRef.current = {
    heroImages,
    menuItems,
    products,
    videos,
    posts,
    customPackages,
    masterOptionPool,
    pageContents,
    popup,
    recommendedDiscountPopup,
    notices,
    quotationSettings,
  };

  const flushAllCloudSync = useCallback(async (): Promise<{ success: boolean; message?: string }> => {
    if (!isSupabaseConfigured) {
      return {
        success: false,
        message: 'Supabase가 아직 연결되지 않았습니다. [Supabase DB 설정]에서 URL과 Anon Key를 먼저 저장해주세요.'
      };
    }
    setCloudSyncStatus(prev => ({ ...prev, state: 'saving', errorMessage: undefined }));
    try {
      const snap = latestSyncSnapshotRef.current;
      const cloudCfg = getCloudinaryConfig();
      await supabaseService.seedAllToSupabase({
        products: snap.products,
        videos: snap.videos,
        posts: snap.posts,
        customPackages: snap.customPackages,
        heroImages: snap.heroImages,
        menuItems: snap.menuItems,
        cloudinaryConfig: cloudCfg,
        popup: snap.popup,
        recommendedDiscountPopup: snap.recommendedDiscountPopup,
        notices: snap.notices,
        quotationSettings: snap.quotationSettings,
        masterOptionPool: snap.masterOptionPool,
        pageContents: snap.pageContents,
      });
      setCloudSyncStatus({
        state: 'synced',
        lastSyncedAt: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      });
      return { success: true };
    } catch (e: any) {
      const msg = e?.message || 'Supabase 클라우드 저장 중 오류가 발생했습니다.';
      setCloudSyncStatus({ state: 'error', errorMessage: msg });
      return { success: false, message: msg };
    }
  }, []);

  // Initial Data Load
  useEffect(() => {
    const initData = async () => {
      try {
        console.log("Attempting to connect to Supabase/Cache...");
        const data = await supabaseService.loadGlobalData();
        
        if (data.isLocal) {
          setIsLocalMode(true);
        } else {
          console.log("Supabase connection successful, cloud data loaded.");
          setIsLocalMode(false);
        }

        // Load users from Supabase if available
        try {
          const cloudUsers = await supabaseService.loadUsers();
          if (cloudUsers && cloudUsers.length > 0) {
            setUsers(cloudUsers);
          }
        } catch {
          // ignore
        }

        // Supabase 클라우드 연결이 활성화된 경우에만 최신 클라우드 데이터로 상태 일괄 동기화 (PC/모바일 완전 일치)
        if (!data.isLocal) {
          if (Array.isArray(data.heroImages) && data.heroImages.length > 0) {
            setHeroImages(data.heroImages);
          }
          if (Array.isArray(data.menuItems) && data.menuItems.length > 0) {
            setMenuItems(data.menuItems);
          }
          if (Array.isArray(data.products) && data.products.length > 0) {
            const alreadyHasCloudPresets = data.products.some((p: Product) => isNewPresetProductId(String(p.id)));
            const finalProducts = alreadyHasCloudPresets
              ? data.products
              : mergeMissingNewPresets(data.products);
            setProducts(finalProducts);
            try {
              localStorage.setItem('mango_products_db', JSON.stringify(finalProducts));
            } catch {}
          }
          if (Array.isArray(data.posts) && data.posts.length > 0) {
            const legacySeedIds = new Set(['post1', 'post2', 'post3', 'post4', 'post5']);
            const isOnlyLegacySeed = data.posts.every((p: CommunityPost) => legacySeedIds.has(String(p.id)));
            if (isOnlyLegacySeed) {
              setPosts(INITIAL_POSTS);
              supabaseService.syncCollection('posts', INITIAL_POSTS).catch(() => {});
            } else {
              const filteredNewPosts = data.posts.filter((p: CommunityPost) => !legacySeedIds.has(String(p.id)));
              if (filteredNewPosts.length > 0) {
                setPosts(filteredNewPosts);
                if (filteredNewPosts.length !== data.posts.length) {
                  supabaseService.syncCollection('posts', filteredNewPosts).catch(() => {});
                }
              } else {
                setPosts(INITIAL_POSTS);
                supabaseService.syncCollection('posts', INITIAL_POSTS).catch(() => {});
              }
            }
          }
          if (Array.isArray(data.videos) && data.videos.length > 0) {
            const validVideos = data.videos.filter((v: VideoItem) => v?.url && !v.url.startsWith('blob:'));
            if (validVideos.length > 0) {
              setVideos(validVideos);
            }
          }
          if (data.pageContents && Object.keys(data.pageContents).length > 0) {
            setPageContents(data.pageContents);
          }
          if (data.popup) {
            setPopup(data.popup);
          }
          if ((data as any).recommendedDiscountPopup) {
            const loadedRecPopup = { ...INITIAL_RECOMMENDED_DISCOUNT_POPUP, ...(data as any).recommendedDiscountPopup };
            setRecommendedDiscountPopup(loadedRecPopup);
            try {
              localStorage.setItem('mango_recommended_discount_popup_db', JSON.stringify(loadedRecPopup));
            } catch {}
          }
          if (Array.isArray((data as any).notices)) {
            setNotices((data as any).notices);
            try {
              localStorage.setItem('mango_notices_db', JSON.stringify((data as any).notices));
            } catch {}
          }
          if (data.customPackages && data.customPackages.length > 0) {
            setCustomPackages(cleanCustomPackages(data.customPackages));
          }
          if ((data as any).masterOptionPool) {
            setMasterOptionPool(cleanMasterOptionPool((data as any).masterOptionPool));
          }
          if ((data as any).quotationSettings) {
            const loadedQuotationSettings = {
              showDetailedCostsToCustomers: false,
              ...(data as any).quotationSettings,
            };
            setQuotationSettings(loadedQuotationSettings);
            try {
              localStorage.setItem('mango_quotation_settings_db', JSON.stringify(loadedQuotationSettings));
            } catch {}
          }
        }
        
        // Check if popup should be shown (e.g., once per session or if active)
        const popupClosed = sessionStorage.getItem('mango_popup_closed');
        const activePopup = !data.isLocal && data.popup ? data.popup : popup;
        if (activePopup.isActive && !popupClosed) {
          setShowPopup(true);
        }
        
        setIsDataLoaded(true);
      } catch (e: any) {
        console.error("Failed to load data from Firestore. Using local fallback data.", e);
        setIsLocalMode(true);
        // 에러 메시지에 'offline'이 포함되어 있으면 사용자에게 알림
        if (e.message?.includes('offline')) {
          console.warn("Network restriction detected. Running in Local Mode.");
        }
        setIsDataLoaded(true);
      }
    };
    initData();
  }, []);

  // Update Handlers (Updates State, LocalStorage, and Supabase)
  const handleUpdateHeroImages = async (newImages: string[]) => {
    setHeroImages(newImages);
    try {
      localStorage.setItem('mango_hero_images_db', JSON.stringify(newImages));
    } catch (e) {
      console.warn("Failed to write hero images to localStorage:", e);
    }
    debouncedSyncSettings('heroImages', newImages);
  };

  const handleUpdateMenuItems = async (newItems: MenuItem[]) => {
    setMenuItems(newItems);
    try {
      localStorage.setItem('mango_menu_items_db', JSON.stringify(newItems));
    } catch (e) {
      console.warn("Failed to write menu items to localStorage:", e);
    }
    debouncedSyncSettings('menuItems', newItems);
  };

  const handleUpdateProducts = async (newProducts: Product[]) => {
    try {
      const nextIds = new Set(newProducts.map(p => String(p.id)));
      const deletedPresets = products
        .filter(p => isNewPresetProductId(String(p.id)) && !nextIds.has(String(p.id)))
        .map(p => String(p.id));
      if (deletedPresets.length > 0) {
        const currentDeleted = getDeletedPresetIds();
        deletedPresets.forEach(id => currentDeleted.add(id));
        localStorage.setItem('mango_deleted_preset_ids_v1', JSON.stringify(Array.from(currentDeleted)));
      }
    } catch {}
    setProducts(newProducts);
    try {
      localStorage.setItem('mango_products_db', JSON.stringify(newProducts));
    } catch (e) {
      console.warn("Failed to write products to localStorage:", e);
    }
    debouncedSyncProducts(newProducts);
  };

  const handleUpdateVideos = async (newVideos: VideoItem[]) => {
    setVideos(newVideos);
    try {
      // Prevent QuotaExceededError or memory exhaustion by filtering out huge data URIs from localStorage
      const safeVideos = newVideos.map(v => ({
        ...v,
        url: v.url.startsWith('data:video') ? '' : v.url
      }));
      localStorage.setItem('mango_videos_db', JSON.stringify(safeVideos));
    } catch (e) {
      console.warn("Failed to write videos to localStorage:", e);
    }
    debouncedSyncVideos(newVideos);
  };

  const handleUpdatePosts = async (newPosts: CommunityPost[]) => {
    setPosts(newPosts);
    debouncedSyncPosts(newPosts);
  };

  const handleUpdatePageContents = async (newContents: Record<string, PageContent>) => {
    setPageContents(newContents);
    try {
      localStorage.setItem('mango_page_contents_db', JSON.stringify(newContents));
    } catch (e) {
      console.warn("Failed to write page contents to localStorage:", e);
    }
    debouncedSyncPages(newContents);
  };

  const handleUpdatePopup = async (newPopup: PopupNotification) => {
    setPopup(newPopup);
    debouncedSyncPopup(newPopup);
  };

  const handleUpdateRecommendedDiscountPopup = async (newDiscountPopup: RecommendedDiscountPopup) => {
    setRecommendedDiscountPopup(newDiscountPopup);
    try {
      localStorage.setItem('mango_recommended_discount_popup_db', JSON.stringify(newDiscountPopup));
    } catch (e) {
      console.warn("Failed to write recommended discount popup to localStorage:", e);
    }
    debouncedSyncRecommendedDiscountPopup(newDiscountPopup);
  };

  const handleUpdateNotices = async (newNotices: NoticeItem[]) => {
    setNotices(newNotices);
    try {
      localStorage.setItem('mango_notices_db', JSON.stringify(newNotices));
    } catch (e) {
      console.warn("Failed to write notices to localStorage:", e);
    }
    debouncedSyncNotices(newNotices);
  };

  const handleUpdateCustomPackages = async (newPkgs: CustomTripPackage[]) => {
    setCustomPackages(newPkgs);
    try {
      localStorage.setItem('mango_custom_packages_db', JSON.stringify(newPkgs));
    } catch (e) {
      console.warn("Failed to write custom packages to localStorage:", e);
    }
    debouncedSyncCustomPackages(newPkgs);
  };

  const handleUpdateMasterOptionPool = (newPool: MasterOptionPool) => {
    setMasterOptionPool(newPool);
    try {
      localStorage.setItem('mango_master_options_pool_db', JSON.stringify(newPool));
    } catch (e) {
      console.warn("Failed to write master options pool to localStorage:", e);
    }
    debouncedSyncMasterOptionPool(newPool);
  };

  const handleUpdateQuotationSettings = (newSettings: QuotationVisibilitySettings) => {
    setQuotationSettings(newSettings);
    try {
      localStorage.setItem('mango_quotation_settings_db', JSON.stringify(newSettings));
    } catch (e) {
      console.warn("Failed to write quotation settings to localStorage:", e);
    }
    debouncedSyncQuotationSettings(newSettings);
  };

  const handleToggleAdminDetailedCosts = (show: boolean) => {
    setAdminShowDetailedCosts(show);
    try {
      localStorage.setItem('mango_admin_show_detailed_costs_v1', String(show));
    } catch (e) {
      console.warn("Failed to write admin detailed costs toggle:", e);
    }
  };

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('mango_users_db');
    return saved ? JSON.parse(saved) : [
      { id: 'admin', username: 'admin', role: 'admin', nickname: '관리자' },
      { id: 'u1', username: 'user1', role: 'user', nickname: '골프왕' },
      { id: 'u2', username: 'user2', role: 'user', nickname: '여행좋아' }
    ];
  });

  useEffect(() => {
    localStorage.setItem('mango_users_db', JSON.stringify(users));
  }, [users]);

  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>(undefined);

  const refreshUsers = useCallback(async (): Promise<User[] | null> => {
    try {
      const latestUsers = await supabaseService.loadUsers();
      if (latestUsers && latestUsers.length > 0) {
        setUsers(latestUsers);
        return latestUsers;
      }
      return null;
    } catch {
      return null;
    }
  }, []);

  // 실시간 회원 목록 변경 구독 (한국/해외 가입 즉시 관리자 대시보드 반영)
  useEffect(() => {
    if (isLocalMode) return;
    const unsubscribe = supabaseService.subscribeToUsers((freshUsers) => {
      if (freshUsers && freshUsers.length > 0) {
        setUsers(freshUsers);
      }
    });
    return () => {
      unsubscribe();
    };
  }, [isLocalMode]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAuthSubmitting) return;

    const cleanUsername = username.trim();
    const cleanNickname = nickname.trim();

    if (!cleanUsername || !password.trim()) {
      await appAlert('아이디와 비밀번호를 입력해주세요.');
      return;
    }

    if (authMode === 'signup') {
      if (!cleanNickname) {
        await appAlert('닉네임을 입력해주세요.');
        return;
      }

      // 클라이언트 단 1차 중복/예약어 검사
      if (cleanUsername.toLowerCase() === 'admin') {
        await appAlert('사용할 수 없는 아이디입니다. 다른 아이디를 입력해주세요.');
        return;
      }
      if (users.some(u => (u.username || '').trim().toLowerCase() === cleanUsername.toLowerCase())) {
        await appAlert('이미 사용 중인 아이디입니다. 다른 아이디를 입력해주세요.');
        return;
      }

      const newUser: User = {
        id: `u_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        username: cleanUsername,
        role: 'user',
        nickname: cleanNickname
      };

      setIsAuthSubmitting(true);
      try {
        const result = await supabaseService.registerUser(newUser, password);
        if (!result.success || !result.user) {
          await appAlert(result.message || '회원가입 저장 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
          if (result.code === 'DUPLICATE_USERNAME') {
            refreshUsers();
          }
          return;
        }

        const savedUser = result.user;
        setUsers(prev => {
          const filtered = prev.filter(u => u.username !== savedUser.username);
          return [savedUser, ...filtered];
        });
        setUser(savedUser);
        setShowAuthModal(false);
        resetAuthFields();
        await appAlert('회원가입이 완료되었습니다!');
      } finally {
        setIsAuthSubmitting(false);
      }
    } else {
      setIsAuthSubmitting(true);
      try {
        const result = await supabaseService.authenticateUser(cleanUsername, password, users);
        if (!result.success || !result.user) {
          await appAlert(result.message || '아이디 또는 비밀번호가 일치하지 않습니다.');
          return;
        }

        const authenticatedUser = result.user;
        setUsers(prev => {
          const exists = prev.some(u => u.id === authenticatedUser.id || u.username === authenticatedUser.username);
          return exists
            ? prev.map(u => (u.username === authenticatedUser.username ? { ...u, ...authenticatedUser } : u))
            : [authenticatedUser, ...prev];
        });
        setUser(authenticatedUser);
        setShowAuthModal(false);
        resetAuthFields();
      } finally {
        setIsAuthSubmitting(false);
      }
    }
  };

  const resetAuthFields = () => { setUsername(''); setPassword(''); setNickname(''); };

  const navigateTo = (page: PageType, category: string | null = null, pushHistory: boolean = true) => {
    if (page === currentPage && category === selectedCategory) {
      return;
    }

    if (pushHistory) {
      setNavHistory(prev => {
        const last = prev[prev.length - 1];
        if (last && last.page === page && last.category === category) {
          return prev;
        }
        return [...prev, { page, category }];
      });

      try {
        if (typeof window !== 'undefined') {
          if (page === 'privacy') {
            window.history.pushState({ page: 'privacy' }, '', '/privacy');
          } else if (page === 'terms') {
            window.history.pushState({ page: 'terms' }, '', '/terms');
          } else if (page === 'home' && (window.location.pathname.startsWith('/privacy') || window.location.pathname.startsWith('/terms'))) {
            window.history.pushState({ page: 'home' }, '', '/');
          }
        }
      } catch {
        // ignore
      }
    }

    setCurrentPage(page);
    setSelectedCategory(category);
    setIsChatOpen(false);
    setSelectedProduct(undefined);
    setShowAuthModal(false);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  };

  useEffect(() => {
    const handlePopState = () => {
      if (checkIsPrivacyRoute()) {
        setCurrentPage('privacy');
      } else if (checkIsTermsRoute()) {
        setCurrentPage('terms');
      } else {
        setCurrentPage('home');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleBackOneStep = () => {
    // 1. App-level modal & drawer overlays
    if (showAuthModal) {
      setShowAuthModal(false);
      return;
    }
    if (isChatOpen) {
      setIsChatOpen(false);
      return;
    }
    if (showPopup) {
      setShowPopup(false);
      return;
    }
    if (selectedProduct) {
      setSelectedProduct(undefined);
      return;
    }

    // 2. Dispatch custom event to active subview (e.g. package detail, post detail, modals)
    let isHandledBySubview = false;
    const backEvent = new CustomEvent('mango_subview_back', {
      detail: {
        handled: () => {
          isHandledBySubview = true;
        }
      },
      cancelable: true
    });
    window.dispatchEvent(backEvent);
    if (isHandledBySubview) {
      return;
    }

    // 3. Step back in navigation history stack
    if (navHistory.length > 1) {
      const nextHistory = [...navHistory];
      nextHistory.pop(); // remove current entry
      const prevEntry = nextHistory[nextHistory.length - 1];
      setNavHistory(nextHistory);
      setCurrentPage(prevEntry.page);
      setSelectedCategory(prevEntry.category);
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
      return;
    }

    // 4. Fallback: if not on home, return to home
    if (currentPage !== 'home') {
      setCurrentPage('home');
      setSelectedCategory(null);
      setNavHistory([{ page: 'home', category: null }]);
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
      return;
    }

    // 5. Already at home root: defer to browser history
    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
    }
  };

  const handleLogout = () => { 
    setUser(null); 
    localStorage.removeItem('mango_user');
    clearAdminSessionToken();
    navigateTo('home', null); 
  };
  const requireMemberLoginForQuotation = useCallback(async (): Promise<boolean> => {
    if (user) return true;
    await appAlert(
      '견적서 미리보기, 저장 및 신청은 로그인 회원 전용 서비스입니다. 로그인 후 이용해 주세요.',
      {
        title: '회원 전용 안내',
        tone: 'info',
        confirmText: '확인',
      }
    );
    setAuthMode('login');
    setShowAuthModal(true);
    return false;
  }, [user]);

  const handleProductClick = async (id: string) => {
    if (!(await requireMemberLoginForQuotation())) return;
    const product = products.find(p => p.id === id);
    if (product) setSelectedProduct(product);
  };
  const handleMenuClick = (label: string) => {
    navigateTo('category', label);
  };

  const getFilteredProducts = () => {
    if (!selectedCategory) return [];
    if (selectedCategory === '추천 상품') return products;
    if (selectedCategory === '골프') return products.filter(p => p.type === 'golf');
    if (selectedCategory === '호텔&빌라') return products.filter(p => p.type === 'hotel');
    if (selectedCategory === '관광') return products.filter(p => p.type === 'tour');
    return products;
  };

  const isAdmin = user?.role === 'admin';
  const effectiveShowDetailedCosts = isAdmin ? adminShowDetailedCosts : quotationSettings.showDetailedCostsToCustomers;

  // 개인정보처리방침 전용 뷰 (https://mangotour.co.kr 접속 또는 /privacy 라우트 시 메인 화면 대신 표시)
  if (currentPage === 'privacy') {
    return <Privacy onGoHome={() => navigateTo('home', null)} />;
  }

  // 서비스 이용약관 전용 뷰 (/terms 라우트 시 표시)
  if (currentPage === 'terms') {
    return <Terms onGoHome={() => navigateTo('home', null)} />;
  }

  return (
    <>
      {showSplash && <SplashScreen isExiting={isSplashExiting} />}
      {isDataLoaded && (
      <div
        className={`min-h-screen min-h-[100dvh] bg-[#F2F2F7] text-[#3A3A3C] flex flex-col font-sans pb-safe md:pb-0 select-text w-full max-w-full transition-opacity duration-700 ease-out print:min-h-0 print:pb-0 print:bg-white print:block ${
          showSplash && !isSplashExiting ? 'opacity-0' : 'opacity-100'
        }`}
      >
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-black/[0.06] no-print" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="max-w-7xl mx-auto px-2 sm:px-4 py-2 sm:py-2.5 flex justify-between items-center gap-1.5 sm:gap-2">
          {/* Left: Logo & Live Ho Chi Minh Weather */}
          <div className="flex items-center gap-1 min-[400px]:gap-1.5 sm:gap-2.5 min-w-0">
            <button type="button" onClick={() => navigateTo('home', null)} className="flex items-center gap-1 sm:gap-2 active:scale-95 transition-transform duration-200 shrink-0 cursor-pointer">
               <div className="w-6 h-6 sm:w-8 sm:h-8 bg-[#0A7E54] rounded-[8px] sm:rounded-[10px] flex items-center justify-center text-white font-black text-[11px] sm:text-sm shadow-xs">M</div>
               <h1 className="text-[13px] min-[400px]:text-sm sm:text-lg font-extrabold text-gray-900 tracking-tight uppercase whitespace-nowrap">MANGO TOUR</h1>
            </button>
            <VietnamWeatherBadge />
          </div>
          
          {/* Right Navigation & Status */}
          <nav className="flex items-center gap-1 sm:gap-2 shrink-0">
            {isAdmin && (
              <button 
                type="button"
                onClick={() => navigateTo(currentPage === 'home' ? 'admin' : 'home', null)}
                className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full font-semibold text-[10px] sm:text-xs transition-all duration-200 active:scale-95 flex items-center gap-1 shrink-0 cursor-pointer ${
                  currentPage === 'admin' ? 'bg-[#0A7E54] text-white' : 'bg-[#F2F2F7] text-[#0A7E54] hover:bg-[#ECFDF5]'
                }`}
              >
                <span className="whitespace-nowrap">{currentPage === 'home' ? '관리자' : '메인'}</span>
              </button>
            )}

            {isAdmin && (
              <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold ${
                isLocalMode 
                  ? 'bg-orange-50 text-orange-600' 
                  : 'bg-[#ECFDF5] text-[#0A7E54]'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isLocalMode ? 'bg-orange-500 animate-pulse' : 'bg-[#0A7E54]'}`}></span>
                {isLocalMode ? 'LOCAL' : 'SYNC'}
              </div>
            )}

            {user ? (
              <div className="flex items-center gap-1 sm:gap-2 bg-[#F2F2F7]/90 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full">
                <span className="text-[10px] sm:text-xs text-gray-900 font-semibold whitespace-nowrap max-w-[44px] min-[400px]:max-w-[68px] sm:max-w-[140px] truncate">
                  {user.nickname}
                </span>
                <span className="text-[#8E8E93] text-[9px] sm:text-[10px]">|</span>
                <button 
                  type="button"
                  onClick={handleLogout} 
                  className="text-[10px] sm:text-xs text-[#8E8E93] hover:text-red-500 transition-colors font-medium whitespace-nowrap active:scale-95 cursor-pointer"
                >
                  로그아웃
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1 sm:gap-1.5">
                <button 
                  type="button"
                  onClick={() => { setShowAuthModal(true); setAuthMode('login'); }} 
                  className="px-2 sm:px-3.5 py-1 sm:py-1.5 bg-[#0A7E54] text-white rounded-full text-[10.5px] sm:text-xs font-semibold hover:bg-[#086945] transition-all duration-200 active:scale-95 whitespace-nowrap cursor-pointer"
                >
                  로그인
                </button>
                <button 
                  type="button"
                  onClick={() => { setShowAuthModal(true); setAuthMode('signup'); }} 
                  className="px-2 sm:px-3.5 py-1 sm:py-1.5 bg-[#F2F2F7] text-[#3A3A3C] rounded-full text-[10.5px] sm:text-xs font-semibold hover:bg-gray-200 transition-all duration-200 active:scale-95 whitespace-nowrap cursor-pointer"
                >
                  회원가입
                </button>
              </div>
            )}
          </nav>
        </div>
      </header>

      <main className={`flex-1 flex flex-col w-full max-w-full min-w-0 ${selectedProduct ? 'print:hidden' : ''}`}>
        {currentPage === 'admin' && isAdmin ? (
          <AdminDashboard 
            users={users}
            onUpdateUsers={setUsers}
            onRefreshUsers={refreshUsers}
            heroImages={heroImages} setHeroImages={handleUpdateHeroImages}
            menuItems={menuItems} setMenuItems={handleUpdateMenuItems} 
            products={products} setProducts={handleUpdateProducts}
            customPackages={customPackages} setCustomPackages={handleUpdateCustomPackages}
            masterOptionPool={masterOptionPool} setMasterOptionPool={handleUpdateMasterOptionPool}
            pageContents={pageContents} setPageContents={handleUpdatePageContents}
            videos={videos} setVideos={handleUpdateVideos}
            posts={posts} setPosts={handleUpdatePosts}
            popup={popup} setPopup={handleUpdatePopup}
            recommendedDiscountPopup={recommendedDiscountPopup}
            setRecommendedDiscountPopup={handleUpdateRecommendedDiscountPopup}
            notices={notices}
            setNotices={handleUpdateNotices}
            quotationSettings={quotationSettings}
            setQuotationSettings={handleUpdateQuotationSettings}
            adminShowDetailedCosts={adminShowDetailedCosts}
            setAdminShowDetailedCosts={handleToggleAdminDetailedCosts}
            cloudSyncStatus={cloudSyncStatus}
            onFlushCloudSync={flushAllCloudSync}
            onRequestAdminReauth={() => {
              setShowAuthModal(true);
              setAuthMode('login');
            }}
            setCurrentPage={setCurrentPage}
          />
        ) : (
          <>
            {currentPage === 'home' && (
              <div className="flex-1 flex flex-col justify-center gap-2.5 md:gap-4 pt-0 pb-2.5 md:py-4">
                <HeroSlider 
                  images={heroImages} 
                  onActionClick={() => handleMenuClick('여행 만들기')} 
                />
                {notices.some(n => n.isActive !== false) && (
                  <NoticeBar notices={notices} />
                )}
                <IconMenu items={menuItems} onItemClick={handleMenuClick} />
              </div>
            )}

            {currentPage === 'category' && selectedCategory ? (
              selectedCategory === '동영상' ? (
                <VideoGallery videos={videos} user={user} onUpdateVideos={handleUpdateVideos} onReqLogin={() => { setShowAuthModal(true); setAuthMode('login'); }} onBack={handleBackOneStep} />
              ) : selectedCategory === '커뮤니티' ? (
                <CommunityBoard
                  posts={posts}
                  user={user}
                  onUpdatePosts={handleUpdatePosts}
                  onReqLogin={() => { setShowAuthModal(true); setAuthMode('login'); }}
                  onBack={handleBackOneStep}
                  heroImage={(pageContents['community'] || INITIAL_PAGE_CONTENTS['community'])?.heroImage}
                  heroTitle={(pageContents['community'] || INITIAL_PAGE_CONTENTS['community'])?.heroTitle}
                  heroSubtitle={(pageContents['community'] || INITIAL_PAGE_CONTENTS['community'])?.heroSubtitle}
                  onUpdateHeroImage={(url) => {
                    const base = pageContents['community'] || INITIAL_PAGE_CONTENTS['community'];
                    handleUpdatePageContents({
                      ...pageContents,
                      community: { ...base, heroImage: url }
                    });
                  }}
                />
              ) : selectedCategory === '비지니스' ? (
                <BusinessPage content={pageContents['business']} onBack={handleBackOneStep} />
              ) : selectedCategory === '여행 만들기' ? (
                <TripPlanner
                  packages={customPackages}
                  masterOptionPool={masterOptionPool}
                  products={products}
                  onBack={handleBackOneStep}
                  isAdmin={isAdmin}
                  isLoggedIn={Boolean(user)}
                  onRequireLogin={requireMemberLoginForQuotation}
                  showDetailedCosts={effectiveShowDetailedCosts}
                  onToggleAdminDetailedCosts={isAdmin ? handleToggleAdminDetailedCosts : undefined}
                />
              ) : selectedCategory === '호텔&빌라' ? (
                <HotelVillaPage content={pageContents['hotel']} onBack={handleBackOneStep} />
              ) : selectedCategory === '골프' ? (
                <GolfPage content={pageContents['golf']} onBack={handleBackOneStep} />
              ) : selectedCategory === '먹거리' ? (
                <FoodPage content={pageContents['food']} onBack={handleBackOneStep} />
              ) : selectedCategory === '베트남 문화' ? (
                <CulturePage content={pageContents['culture']} onBack={handleBackOneStep} />
              ) : selectedCategory === 'FOR MEN' ? (
                <ForMenPage content={pageContents['men']} onBack={handleBackOneStep} />
              ) : selectedCategory === '관광' ? (
                <TourPage content={pageContents['tour']} onBack={handleBackOneStep} />
              ) : selectedCategory === '이벤트' ? (
                <EventPage content={pageContents['event']} onBack={handleBackOneStep} />
              ) : (
                <CategoryPage
                  category={selectedCategory}
                  products={getFilteredProducts()}
                  onProductClick={handleProductClick}
                  onBack={handleBackOneStep}
                  isLoggedIn={!!user}
                  onReqLogin={() => { setShowAuthModal(true); setAuthMode('login'); }}
                  recommendedDiscountPopup={recommendedDiscountPopup}
                />
              )
            ) : null}
          </>
        )}
      </main>

      <div className={`mt-auto w-full max-w-7xl mx-auto px-0 md:px-4 no-print ${currentPage === 'home' ? 'pt-0' : 'pt-2 md:pt-3'}`}>
        <footer className="bg-gray-800 text-gray-400 py-4 sm:py-5 px-3 sm:px-6 text-center text-xs rounded-none shadow-none md:shadow-md">
          <p>MANGO TOUR TRAVEL AGENCY | <span className="ml-1 font-semibold text-gray-300">+84 37 720 4451</span> | 
            <a href="https://open.kakao.com/o/gprQnKSi" target="_blank" rel="noreferrer" className="ml-1 hover:text-gold-400 transition">
              Kakao: <span className="font-bold">MANGO TOUR</span>
            </a>
          </p>
          <div className="mt-2.5 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 text-[11px] text-gray-400 px-2">
            <button 
              type="button"
              onClick={() => navigateTo('privacy')} 
              className="text-gray-300 hover:text-gold-400 font-bold underline transition cursor-pointer whitespace-nowrap"
            >
              개인정보처리방침
            </button>
            <span className="text-gray-600">|</span>
            <button 
              type="button"
              onClick={() => navigateTo('terms')} 
              className="text-gray-300 hover:text-gold-400 font-bold underline transition cursor-pointer whitespace-nowrap"
            >
              이용약관
            </button>
            <span className="text-gray-600">|</span>
            <span className="whitespace-nowrap">대표자: 김일선</span>
          </div>
          <p className="mt-2 text-[10px] text-gray-500">© MANGO TOUR. All rights reserved.</p>
        </footer>
      </div>

      {/* Real-time Chat Notification Toast */}
      {incomingChatToast && !isChatOpen && (
        <ChatNotificationToast 
          message={incomingChatToast}
          unreadCount={unreadChatCount}
          onOpenChat={handleOpenChatFromToast}
          onDismiss={() => setIncomingChatToast(null)}
        />
      )}

      <ChatRoom 
        user={user} 
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        onReqLogin={() => { setShowAuthModal(true); setAuthMode('login'); }}
        onNewIncomingMessage={handleIncomingChatMessage}
        onResetUnread={() => setUnreadChatCount(0)}
      />

      {/* Desktop Floating Chat Trigger (Aligned inside max-w-7xl container right edge) */}
      {!isChatOpen && (
        <div className="hidden md:block fixed inset-x-0 bottom-6 z-[9990] pointer-events-none no-print">
          <div className="max-w-7xl mx-auto px-4 flex justify-end items-center">
            <button
              type="button"
              onClick={() => {
                setIsChatOpen(true);
                setUnreadChatCount(0);
                setIncomingChatToast(null);
              }}
              className="pointer-events-auto relative flex items-center gap-2 px-5 py-3.5 bg-[#0A7E54] hover:bg-[#086945] text-white rounded-full shadow-lg font-bold text-xs sm:text-sm transition-all duration-200 active:scale-95 hover:scale-[1.03] group cursor-pointer"
            >
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
              </svg>
              <span>실시간 채팅</span>
              {unreadChatCount > 0 && (
                <span className="flex items-center gap-1 bg-red-500 text-white text-[11px] font-bold px-2 py-0.5 rounded-full shadow-sm ring-2 ring-white tabular-nums">
                  {unreadChatCount > 9 ? '9+' : unreadChatCount}
                </span>
              )}
            </button>
          </div>
        </div>
      )}

      <BottomNav 
        currentPage={currentPage} 
        selectedCategory={selectedCategory}
        onNavigate={(page, cat) => navigateTo(page as any, cat || null)}
        onBack={handleBackOneStep}
      />

      {/* Popup Notification */}
      {showPopup && popup.isActive && (
        <div className="no-print fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/45 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-[20px] overflow-hidden shadow-2xl w-[80%] md:w-full md:max-w-sm max-h-[80vh] md:max-h-[90vh] h-auto flex flex-col animate-scale-in overflow-y-auto">
            {popup.image && (
              <div className={`relative shrink-0 overflow-hidden bg-gray-950 flex items-center justify-center ${
                popup.imageHeight === 'compact' ? 'h-36 md:h-48' :
                popup.imageHeight === 'large' ? 'h-60 md:h-80' :
                popup.imageHeight === 'auto' ? 'min-h-[160px] max-h-[300px] md:min-h-[200px] md:max-h-[380px] h-auto' :
                popup.imageHeight === 'medium' ? 'h-48 md:h-64' :
                'aspect-video w-full'
              }`}>
                <img
                  src={getFreshImageUrl(popup.image)}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-cover filter blur-2xl opacity-45 scale-125 pointer-events-none"
                />
                <img
                  src={getFreshImageUrl(popup.image)}
                  className={`relative z-10 max-h-full max-w-full duration-300 ${
                    popup.imageFit === 'cover' ? 'w-full h-full object-cover' : 'object-contain'
                  }`}
                  alt={popup.title || 'Notification'}
                />
              </div>
            )}
            <div className="p-5 md:p-6 space-y-3 md:space-y-4">
              {!popup.image && <h3 className="text-gray-900 font-bold tracking-tight text-lg md:text-xl">{popup.title}</h3>}
              <p className="text-[#3A3A3C] text-xs md:text-sm leading-relaxed whitespace-pre-line">{popup.content}</p>
              
              <div className="pt-2 flex flex-col gap-2">
                {popup.link && (
                  <button 
                    type="button"
                    onClick={() => { window.open(popup.link, '_blank'); setShowPopup(false); sessionStorage.setItem('mango_popup_closed', 'true'); }}
                    className="w-full py-3.5 bg-[#0A7E54] text-white rounded-2xl font-bold text-sm md:text-base shadow-sm hover:bg-[#086945] transition-all duration-200 active:scale-95 cursor-pointer"
                  >
                    자세히 보기
                  </button>
                )}
                <button 
                  type="button"
                  onClick={() => { setShowPopup(false); sessionStorage.setItem('mango_popup_closed', 'true'); }}
                  className="w-full py-3 bg-[#F2F2F7] text-[#3A3A3C] rounded-2xl font-semibold text-sm md:text-base hover:bg-gray-200 transition-all duration-200 active:scale-95 cursor-pointer"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedProduct && (
        <QuotationModal
          product={selectedProduct}
          onClose={() => { setSelectedProduct(undefined); }}
          isAdmin={isAdmin}
          isLoggedIn={Boolean(user)}
          onRequireLogin={requireMemberLoginForQuotation}
          showDetailedCosts={effectiveShowDetailedCosts}
          onToggleAdminDetailedCosts={isAdmin ? handleToggleAdminDetailedCosts : undefined}
        />
      )}

      {showAuthModal && (
        <div className="no-print fixed inset-0 bg-black/40 flex items-end md:items-center justify-center z-[10000] p-0 md:px-4 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-t-3xl md:rounded-[20px] px-5 pt-2 pb-7 md:p-8 w-full md:max-w-md max-h-[90vh] flex flex-col justify-center shadow-2xl relative animate-ios-sheet-up overflow-y-auto">
            <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-4 md:hidden shrink-0" />
            <button type="button" onClick={() => { setShowAuthModal(false); resetAuthFields(); }} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#F2F2F7] text-[#8E8E93] hover:text-gray-900 font-bold text-sm flex items-center justify-center cursor-pointer transition active:scale-90">✕</button>
            <h2 className="text-2xl font-extrabold tracking-tight text-center mb-6 text-gray-900">{authMode === 'login' ? '로그인' : '회원가입'}</h2>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#8E8E93] ml-1">아이디</label>
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full bg-[#F2F2F7] p-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-[#0A7E54]/40 focus:bg-white transition text-gray-900" placeholder="아이디를 입력하세요" required />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#8E8E93] ml-1">비밀번호</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-[#F2F2F7] p-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-[#0A7E54]/40 focus:bg-white transition text-gray-900" placeholder="비밀번호를 입력하세요" required />
              </div>
              {authMode === 'signup' && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#8E8E93] ml-1">닉네임</label>
                  <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} className="w-full bg-[#F2F2F7] p-3.5 rounded-2xl outline-none focus:ring-2 focus:ring-[#0A7E54]/40 focus:bg-white transition text-gray-900" placeholder="사용하실 닉네임을 입력하세요" required />
                </div>
              )}
              <button
                type="submit"
                disabled={isAuthSubmitting}
                className={`w-full font-bold py-3.5 rounded-2xl shadow-sm transition-all duration-200 mt-2 ${
                  isAuthSubmitting
                    ? 'bg-gray-400 text-white cursor-wait'
                    : 'bg-[#0A7E54] text-white active:scale-95 hover:bg-[#086945] cursor-pointer'
                }`}
              >
                {isAuthSubmitting ? '처리 중...' : (authMode === 'login' ? '로그인' : '가입 완료하기')}
              </button>
              {authMode === 'signup' && (
                <p className="text-[11px] text-[#8E8E93] text-center pt-1">
                  가입 시 망고투어{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setShowAuthModal(false);
                      navigateTo('terms');
                    }}
                    className="text-[#0A7E54] underline font-semibold cursor-pointer"
                  >
                    이용약관
                  </button>
                  {' 및 '}
                  <button
                    type="button"
                    onClick={() => {
                      setShowAuthModal(false);
                      navigateTo('privacy');
                    }}
                    className="text-[#0A7E54] underline font-semibold cursor-pointer"
                  >
                    개인정보처리방침
                  </button>
                  에 동의하게 됩니다.
                </p>
              )}
            </form>
            <div className="mt-6 text-center border-t border-black/[0.06] pt-5">
              {authMode === 'login' ? (
                <p className="text-sm text-[#8E8E93]">
                  아직 회원이 아니신가요?{' '}
                  <button type="button" onClick={() => setAuthMode('signup')} className="text-[#0A7E54] font-bold hover:underline cursor-pointer">회원가입 하기</button>
                </p>
              ) : (
                <p className="text-sm text-[#8E8E93]">
                  이미 계정이 있으신가요?{' '}
                  <button type="button" onClick={() => setAuthMode('login')} className="text-[#0A7E54] font-bold hover:underline cursor-pointer">로그인 하기</button>
                </p>
              )}
            </div>
          </div>
        </div>
      )}
      </div>
      )}
      <CustomDialogHost />
    </>
  );
};

export default App;
