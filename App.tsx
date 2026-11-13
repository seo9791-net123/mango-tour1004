
import React, { useState, useEffect, useRef } from 'react';
import HeroSlider from './components/HeroSlider';
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
import { INITIAL_PRODUCTS, INITIAL_VIDEOS, INITIAL_POSTS, HERO_IMAGES, SUB_MENU_ITEMS, INITIAL_PAGE_CONTENTS, INITIAL_POPUP, INITIAL_CUSTOM_PACKAGES, INITIAL_MASTER_OPTION_POOL } from './constants';
import { User, Product, VideoItem, CommunityPost, PageContent, MenuItem, PopupNotification, CustomTripPackage, MasterOptionPool, ChatMessage } from './types';
import { supabaseService } from './services/supabaseService';
import { updateSupabaseCredentials } from './services/supabaseClient';
import { setCloudinaryConfig } from './services/uploadService';
import { debounce } from './utils/debounce';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  
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
          return updated;
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
    return {
      ...pool,
      accommodations: (pool.accommodations || []).map(acc => ({
        ...acc,
        name: acc.name.replace(/5성급\s*호텔/g, '고급 호텔').replace(/5성급/g, '고급').replace(/2인\s*1실/g, '1인 객실 기준').replace(/2인1실/g, '1인 객실 기준'),
        description: acc.description.replace(/5성급\s*호텔/g, '고급 호텔').replace(/5성급/g, '고급').replace(/2인\s*1실/g, '1인 1실').replace(/2인1실/g, '1인 1실'),
        badge: acc.badge ? acc.badge.replace(/5성급\s*호텔/g, '고급 호텔').replace(/5성급\s*1인실/g, '고급 호텔 1인실').replace(/5성급/g, '고급') : acc.badge
      })),
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
  const [showPopup, setShowPopup] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [incomingChatToast, setIncomingChatToast] = useState<ChatMessage | null>(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isLocalMode, setIsLocalMode] = useState(false);

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
      localStorage.setItem('mango_user', JSON.stringify(user));
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

  // Debounced Sync Functions
  const isSyncing = useRef<Record<string, boolean>>({});

  const debouncedSyncProducts = useRef(debounce(async (newProducts: Product[]) => {
    if (isSyncing.current['products']) return;
    isSyncing.current['products'] = true;
    try {
      await supabaseService.syncCollection('products', newProducts);
    } finally {
      isSyncing.current['products'] = false;
    }
  }, 2000)).current;

  const debouncedSyncVideos = useRef(debounce(async (newVideos: VideoItem[]) => {
    if (isSyncing.current['videos']) return;
    isSyncing.current['videos'] = true;
    try {
      await supabaseService.syncCollection('videos', newVideos);
    } finally {
      isSyncing.current['videos'] = false;
    }
  }, 2000)).current;

  const debouncedSyncPosts = useRef(debounce(async (newPosts: CommunityPost[]) => {
    if (isSyncing.current['posts']) return;
    isSyncing.current['posts'] = true;
    try {
      await supabaseService.syncCollection('posts', newPosts);
    } finally {
      isSyncing.current['posts'] = false;
    }
  }, 2000)).current;

  const debouncedSyncPages = useRef(debounce(async (newContents: Record<string, PageContent>) => {
    if (isSyncing.current['pages']) return;
    isSyncing.current['pages'] = true;
    try {
      const promises = Object.entries(newContents).map(([pageId, content]) => 
        supabaseService.savePageContent(pageId, content)
      );
      await Promise.all(promises);
    } finally {
      isSyncing.current['pages'] = false;
    }
  }, 3000)).current;

  const debouncedSyncSettings = useRef(debounce(async (key: 'heroImages' | 'menuItems', data: any) => {
    if (isSyncing.current[`settings_${key}`]) return;
    isSyncing.current[`settings_${key}`] = true;
    try {
      await supabaseService.saveSettings(key, data);
    } finally {
      isSyncing.current[`settings_${key}`] = false;
    }
  }, 1000)).current;

  const debouncedSyncPopup = useRef(debounce(async (newPopup: PopupNotification) => {
    if (isLocalMode || isSyncing.current['popup']) return;
    isSyncing.current['popup'] = true;
    try {
      await supabaseService.savePopup(newPopup);
    } finally {
      isSyncing.current['popup'] = false;
    }
  }, 3000)).current;

  const debouncedSyncCustomPackages = useRef(debounce(async (newPkgs: CustomTripPackage[]) => {
    if (isLocalMode || isSyncing.current['custom_packages']) return;
    isSyncing.current['custom_packages'] = true;
    try {
      await supabaseService.syncCollection('custom_packages', newPkgs);
    } finally {
      isSyncing.current['custom_packages'] = false;
    }
  }, 3000)).current;

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

        setHeroImages(data.heroImages);
        setMenuItems(data.menuItems);
        if (Array.isArray(data.videos) && data.videos.length > 0) {
          const validVideos = data.videos.filter((v: VideoItem) => v?.url && !v.url.startsWith('blob:'));
          if (validVideos.length > 0) {
            setVideos(validVideos);
          }
        }
        setPageContents(data.pageContents);
        setPopup(data.popup);
        if (data.customPackages && data.customPackages.length > 0) {
          setCustomPackages(cleanCustomPackages(data.customPackages));
        }
        
        // Check if popup should be shown (e.g., once per session or if active)
        const popupClosed = sessionStorage.getItem('mango_popup_closed');
        if (data.popup.isActive && !popupClosed) {
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

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === 'rlathdud1~') {
      const adminUser = users.find(u => u.username === 'admin')!;
      setUser(adminUser);
      setShowAuthModal(false);
      resetAuthFields();
    } else {
       if (authMode === 'signup') {
         if (!username.trim() || !password.trim()) { alert('아이디와 비밀번호를 입력해주세요.'); return; }
         if (!nickname.trim()) { alert('닉네임을 입력해주세요.'); return; }
         const newUser: User = { id: Date.now().toString(), username, role: 'user', nickname };
         setUsers([...users, newUser]);
         setUser(newUser);
         setShowAuthModal(false);
         resetAuthFields();
         supabaseService.saveUser(newUser, password).catch(() => {});
         alert('회원가입이 완료되었습니다!');
       } else {
         const existingUser = users.find(u => u.username === username);
         if (existingUser) {
           setUser(existingUser);
           setShowAuthModal(false);
           resetAuthFields();
         } else {
           alert('사용자 정보가 일치하지 않습니다.');
         }
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
    navigateTo('home', null); 
  };
  const handleProductClick = (id: string) => {
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

  // 개인정보처리방침 전용 뷰 (https://mangotour.co.kr 접속 또는 /privacy 라우트 시 메인 화면 대신 표시)
  if (currentPage === 'privacy') {
    return <Privacy onGoHome={() => navigateTo('home', null)} />;
  }

  // 서비스 이용약관 전용 뷰 (/terms 라우트 시 표시)
  if (currentPage === 'terms') {
    return <Terms onGoHome={() => navigateTo('home', null)} />;
  }

  if (!isDataLoaded) {
    return (
      <div className="min-h-screen bg-deepgreen flex flex-col items-center justify-center text-white p-8 text-center relative overflow-hidden">
        {/* Atmospheric Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,#c5a028_0%,transparent_70%)] opacity-20 blur-3xl"></div>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_10%_80%,#004d40_0%,transparent_50%)] opacity-40 blur-3xl"></div>
        </div>
        
        <div className="relative z-10">
          <div className="w-20 h-20 border-4 border-gold-400 border-t-transparent rounded-full animate-spin mb-8 mx-auto shadow-[0_0_30px_rgba(197,160,40,0.3)]"></div>
          <h2 className="text-3xl font-black mb-3 tracking-tight animate-pulse">설레는 여행 준비 중!</h2>
          <p className="text-sm opacity-70 font-medium tracking-widest uppercase">MANGO TOUR IS PREPARING YOUR TRIP</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans pb-safe md:pb-0 select-text w-full max-w-full">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md shadow-sm border-b border-gray-100 no-print" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-2.5 flex justify-between items-center gap-2">
          {/* Logo */}
          <button onClick={() => navigateTo('home', null)} className="flex items-center gap-2 active:scale-95 transition-transform shrink-0">
             <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gold-500 rounded-full flex items-center justify-center text-white font-black text-xs sm:text-sm shadow-sm">M</div>
             <h1 className="text-base sm:text-lg font-black text-deepgreen tracking-tight uppercase whitespace-nowrap">MANGO TOUR</h1>
          </button>
          
          {/* Right Navigation & Status */}
          <nav className="flex items-center gap-1.5 sm:gap-2">
            {isAdmin && (
              <button 
                onClick={() => navigateTo(currentPage === 'home' ? 'admin' : 'home', null)}
                className={`px-2.5 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1 shrink-0 shadow-sm ${
                  currentPage === 'admin' ? 'bg-deepgreen text-white' : 'bg-gray-100 text-deepgreen hover:bg-gray-200'
                }`}
              >
                <span>{currentPage === 'home' ? '⚙️' : '🏠'}</span>
                <span className="whitespace-nowrap">{currentPage === 'home' ? '관리자' : '메인'}</span>
              </button>
            )}

            {isAdmin && (
              <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                isLocalMode 
                  ? 'bg-orange-50 text-orange-600 border-orange-200' 
                  : 'bg-green-50 text-green-600 border-green-200'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isLocalMode ? 'bg-orange-500 animate-pulse' : 'bg-green-500'}`}></span>
                {isLocalMode ? 'LOCAL' : 'SYNC'}
              </div>
            )}

            {user ? (
              <div className="flex items-center gap-1.5 sm:gap-2.5 bg-gray-50/80 px-2 py-1 rounded-xl border border-gray-200/60">
                <span className="text-xs text-gray-800 font-bold whitespace-nowrap max-w-[85px] sm:max-w-[140px] truncate">
                  {user.nickname}
                </span>
                <span className="text-gray-300 text-[10px]">|</span>
                <button 
                  onClick={handleLogout} 
                  className="text-xs text-gray-500 hover:text-red-500 transition font-medium whitespace-nowrap active:scale-95"
                >
                  로그아웃
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1 sm:gap-1.5">
                <button 
                  onClick={() => { setShowAuthModal(true); setAuthMode('login'); }} 
                  className="px-3 py-1.5 bg-gold-500 text-white rounded-xl text-xs font-bold hover:bg-gold-600 transition active:scale-95 shadow-sm whitespace-nowrap"
                >
                  로그인
                </button>
                <button 
                  onClick={() => { setShowAuthModal(true); setAuthMode('signup'); }} 
                  className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-200 transition active:scale-95 whitespace-nowrap"
                >
                  회원가입
                </button>
              </div>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-grow w-full max-w-full min-w-0">
        {currentPage === 'admin' && isAdmin ? (
          <AdminDashboard 
            users={users}
            onUpdateUsers={setUsers}
            heroImages={heroImages} setHeroImages={handleUpdateHeroImages}
            menuItems={menuItems} setMenuItems={handleUpdateMenuItems} 
            products={products} setProducts={handleUpdateProducts}
            customPackages={customPackages} setCustomPackages={handleUpdateCustomPackages}
            masterOptionPool={masterOptionPool} setMasterOptionPool={handleUpdateMasterOptionPool}
            pageContents={pageContents} setPageContents={handleUpdatePageContents}
            videos={videos} setVideos={handleUpdateVideos}
            posts={posts} setPosts={handleUpdatePosts}
            popup={popup} setPopup={handleUpdatePopup}
            setCurrentPage={setCurrentPage}
          />
        ) : (
          <>
            {currentPage === 'home' && (
              <>
                <HeroSlider 
                  images={heroImages} 
                  onActionClick={() => handleMenuClick('여행 만들기')} 
                />
                <IconMenu items={menuItems} onItemClick={handleMenuClick} />
              </>
            )}

            {currentPage === 'category' && selectedCategory ? (
              selectedCategory === '동영상' ? (
                <VideoGallery videos={videos} user={user} onUpdateVideos={handleUpdateVideos} onReqLogin={() => { setShowAuthModal(true); setAuthMode('login'); }} onBack={handleBackOneStep} />
              ) : selectedCategory === '커뮤니티' ? (
                <CommunityBoard posts={posts} user={user} onUpdatePosts={handleUpdatePosts} onReqLogin={() => { setShowAuthModal(true); setAuthMode('login'); }} onBack={handleBackOneStep} />
              ) : selectedCategory === '비지니스' ? (
                <BusinessPage content={pageContents['business']} onBack={handleBackOneStep} />
              ) : selectedCategory === '여행 만들기' ? (
                <TripPlanner packages={customPackages} masterOptionPool={masterOptionPool} products={products} onBack={handleBackOneStep} />
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
                <CategoryPage category={selectedCategory} products={getFilteredProducts()} onProductClick={handleProductClick} onBack={handleBackOneStep} isLoggedIn={!!user} onReqLogin={() => { setShowAuthModal(true); setAuthMode('login'); }} />
              )
            ) : null}
          </>
        )}
      </main>

      <footer className="bg-gray-800 text-gray-400 py-6 text-center text-xs no-print">
         <p>MANGO TOUR TRAVEL AGENCY | <span className="ml-1 font-semibold text-gray-300">+84 37 720 4451</span> | 
           <a href="https://open.kakao.com/o/gprQnKSi" target="_blank" rel="noreferrer" className="ml-1 hover:text-gold-400 transition">
             Kakao: <span className="font-bold">MANGO TOUR</span>
           </a>
         </p>
         <div className="mt-2.5 flex items-center justify-center gap-3 text-[11px] text-gray-400">
           <button 
             type="button"
             onClick={() => navigateTo('privacy')} 
             className="text-gray-300 hover:text-gold-400 font-bold underline transition cursor-pointer"
           >
             개인정보처리방침
           </button>
           <span className="text-gray-600">|</span>
           <button 
             type="button"
             onClick={() => navigateTo('terms')} 
             className="text-gray-300 hover:text-gold-400 font-bold underline transition cursor-pointer"
           >
             이용약관
           </button>
           <span className="text-gray-600">|</span>
           <span>대표자: 김일선</span>
         </div>
         <p className="mt-2 text-[10px] text-gray-500">© MANGO TOUR. All rights reserved.</p>
      </footer>

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

      {/* Desktop Floating Chat Trigger & Back Button */}
      <div className="hidden md:flex fixed bottom-6 right-6 z-[9990] items-center gap-2 no-print">
        {isChatOpen && (
          <button
            type="button"
            onClick={() => setIsChatOpen(false)}
            className="flex items-center gap-1.5 px-4 py-3 bg-white text-gray-700 hover:text-deepgreen rounded-full shadow-2xl border border-gray-200 font-bold text-xs transition-all duration-200 active:scale-95 hover:shadow-lg cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
            <span>뒤로 가기</span>
          </button>
        )}
        {!isChatOpen && (
          <button
            type="button"
            onClick={() => {
              setIsChatOpen(true);
              setUnreadChatCount(0);
              setIncomingChatToast(null);
            }}
            className="relative flex items-center gap-2 px-5 py-3.5 bg-gradient-to-r from-deepgreen to-teal-800 hover:from-teal-900 hover:to-deepgreen text-white rounded-full shadow-2xl font-bold text-xs sm:text-sm transition-all duration-200 active:scale-95 hover:scale-105 group cursor-pointer"
          >
            <span className="text-base group-hover:scale-110 transition-transform">💬</span>
            <span>실시간 채팅</span>
            {unreadChatCount > 0 ? (
              <span className="flex items-center gap-1 bg-red-500 text-white text-[11px] font-black px-2 py-0.5 rounded-full shadow-md animate-bounce ring-2 ring-white">
                {unreadChatCount > 9 ? '9+' : unreadChatCount}
              </span>
            ) : (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            )}
          </button>
        )}
      </div>

      <BottomNav 
        currentPage={currentPage} 
        selectedCategory={selectedCategory}
        onNavigate={(page, cat) => navigateTo(page as any, cat || null)}
        isChatOpen={isChatOpen} 
        setIsChatOpen={(open) => {
          setIsChatOpen(open);
          if (open) {
            setUnreadChatCount(0);
            setIncomingChatToast(null);
          }
        }} 
        onBack={handleBackOneStep}
        unreadChatCount={unreadChatCount}
      />

      {/* Popup Notification */}
      {showPopup && popup.isActive && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-2xl max-w-sm w-full animate-scale-in border border-white/20">
            {popup.image && (
              <div className={`relative overflow-hidden bg-gray-950 flex items-center justify-center ${
                popup.imageHeight === 'compact' ? 'h-48' :
                popup.imageHeight === 'large' ? 'h-80' :
                popup.imageHeight === 'auto' ? 'min-h-[200px] max-h-[380px] h-auto' :
                popup.imageHeight === 'medium' ? 'h-64' :
                'aspect-video w-full'
              }`}>
                {/* Ambient Blurred Backdrop */}
                <img
                  src={popup.image}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-cover filter blur-2xl opacity-45 scale-125 pointer-events-none"
                />
                {/* Foreground Notice Image */}
                <img
                  src={popup.image}
                  className={`relative z-10 max-h-full max-w-full duration-300 ${
                    popup.imageFit === 'cover' ? 'w-full h-full object-cover' : 'object-contain'
                  }`}
                  alt={popup.title || 'Notification'}
                />
              </div>
            )}
            <div className="p-8 space-y-4">
              {!popup.image && <h3 className="text-deepgreen font-bold text-xl">{popup.title}</h3>}
              <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{popup.content}</p>
              
              <div className="pt-4 flex flex-col gap-2">
                {popup.link && (
                  <button 
                    onClick={() => { window.open(popup.link, '_blank'); setShowPopup(false); sessionStorage.setItem('mango_popup_closed', 'true'); }}
                    className="w-full py-4 bg-deepgreen text-white rounded-2xl font-bold shadow-lg hover:bg-gold-600 transition transform active:scale-95"
                  >
                    자세히 보기
                  </button>
                )}
                <button 
                  onClick={() => { setShowPopup(false); sessionStorage.setItem('mango_popup_closed', 'true'); }}
                  className="w-full py-4 bg-gray-100 text-gray-500 rounded-2xl font-bold hover:bg-gray-200 transition"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedProduct && (
        <QuotationModal product={selectedProduct} onClose={() => { setSelectedProduct(undefined); }} />
      )}

      {showAuthModal && (
        <div className="fixed inset-0 bg-black/60 flex items-start md:items-center justify-center z-[10000] px-4 backdrop-blur-sm animate-fade-in pt-20 md:pt-0">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-2xl relative transform transition-all animate-fade-in-up">
            <button onClick={() => { setShowAuthModal(false); resetAuthFields(); }} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-bold text-xl">✕</button>
            <h2 className="text-2xl font-bold text-center mb-6 text-deepgreen">{authMode === 'login' ? '로그인' : '회원가입'}</h2>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">ID</label>
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full border p-3 rounded-xl outline-none focus:ring-2 focus:ring-gold-500" placeholder="아이디를 입력하세요" required />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full border p-3 rounded-xl outline-none focus:ring-2 focus:ring-gold-500" placeholder="비밀번호를 입력하세요" required />
              </div>
              {authMode === 'signup' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Nickname</label>
                  <input type="text" value={nickname} onChange={(e) => setNickname(e.target.value)} className="w-full border p-3 rounded-xl outline-none focus:ring-2 focus:ring-gold-500" placeholder="사용하실 닉네임을 입력하세요" required />
                </div>
              )}
              <button type="submit" className="w-full bg-gold-500 text-white font-bold py-3.5 rounded-xl shadow-lg transition transform active:scale-95 hover:bg-gold-600 mt-2 cursor-pointer">
                {authMode === 'login' ? '로그인' : '가입 완료하기'}
              </button>
              {authMode === 'signup' && (
                <p className="text-[11px] text-gray-500 text-center pt-1">
                  가입 시 망고투어{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setShowAuthModal(false);
                      navigateTo('terms');
                    }}
                    className="text-gold-600 underline font-bold cursor-pointer"
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
                    className="text-gold-600 underline font-bold cursor-pointer"
                  >
                    개인정보처리방침
                  </button>
                  에 동의하게 됩니다.
                </p>
              )}
            </form>
            <div className="mt-8 text-center border-t pt-6">
              {authMode === 'login' ? (
                <p className="text-sm text-gray-500">
                  아직 회원이 아니신가요?{' '}
                  <button onClick={() => setAuthMode('signup')} className="text-gold-600 font-bold hover:underline">회원가입 하기</button>
                </p>
              ) : (
                <p className="text-sm text-gray-500">
                  이미 계정이 있으신가요?{' '}
                  <button onClick={() => setAuthMode('login')} className="text-gold-600 font-bold hover:underline">로그인 하기</button>
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
