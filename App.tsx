
import React, { useState, useEffect, useRef } from 'react';
import HeroSlider from './components/HeroSlider';
import IconMenu from './components/IconMenu';
import VideoGallery from './components/VideoGallery';
import CommunityBoard from './components/CommunityBoard';
import ChatRoom from './components/ChatRoom';
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
import { INITIAL_PRODUCTS, INITIAL_VIDEOS, INITIAL_POSTS, HERO_IMAGES, SUB_MENU_ITEMS, INITIAL_PAGE_CONTENTS, INITIAL_POPUP, INITIAL_CUSTOM_PACKAGES, INITIAL_MASTER_OPTION_POOL } from './constants';
import { User, Product, VideoItem, CommunityPost, PageContent, MenuItem, PopupNotification, CustomTripPackage, MasterOptionPool } from './types';
import { firestoreService } from './services/firestoreService';
import { debounce } from './utils/debounce';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  
  // Routing State
  interface HistoryEntry {
    page: 'home' | 'admin' | 'category';
    category: string | null;
  }
  const [currentPage, setCurrentPage] = useState<'home' | 'admin' | 'category'>('home');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [navHistory, setNavHistory] = useState<HistoryEntry[]>([
    { page: 'home', category: null }
  ]);

  // Data State
  const [heroImages, setHeroImages] = useState<string[]>(HERO_IMAGES);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(SUB_MENU_ITEMS);
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('mango_products_db');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
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
  const [pageContents, setPageContents] = useState<Record<string, PageContent>>(INITIAL_PAGE_CONTENTS);
  const cleanCustomPackages = (pkgs: CustomTripPackage[]): CustomTripPackage[] => {
    return pkgs.map(pkg => {
      // Find matching template in INITIAL_CUSTOM_PACKAGES if it's one of preset packages (pkg-1 ~ pkg-10)
      const template = INITIAL_CUSTOM_PACKAGES.find(t => t.id === pkg.id);
      
      let baseOptions = template && (!pkg.options || pkg.options.length < 5) 
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

      // 2. Ensure Guide option is 1일 기준 $120
      baseOptions = baseOptions.map(opt => {
        if (opt.category === 'guide' || opt.name.includes('가이드')) {
          let updatedName = opt.name;
          if (!updatedName.includes('120$')) {
            updatedName = updatedName.replace(/\(1일.*?기준.*?\)/g, '').replace(/\$\d+/g, '').trim() + ' (1일 기준 $120)';
          }
          let updatedDesc = opt.description || '';
          if (!updatedDesc.includes('120')) {
            updatedDesc = updatedDesc ? `${updatedDesc} (1일 $120 기준)` : '골프 체크인 및 전 일정 의전 케어 (1일 $120 기준)';
          }
          return {
            ...opt,
            name: updatedName,
            description: updatedDesc,
            priceUSD: 120
          };
        }
        return opt;
      });

      // 3. Ensure Lodging option is 1인 객실 기준 (1인 1실)
      baseOptions = baseOptions.map(opt => {
        if (opt.category === 'hotel') {
          let updatedName = opt.name
            .replace(/2인\s*1실/g, '1인 객실 기준')
            .replace(/2인1실/g, '1인 객실 기준');
          if (!updatedName.includes('1인')) {
            updatedName = `${updatedName} (1인 객실 기준)`;
          }
          let updatedDesc = opt.description || '';
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

      // Highlight Badges
      let badges = pkg.highlightBadges ? [...pkg.highlightBadges] : ['4박 5일'];
      if (!badges.includes('1인 1실 숙박')) {
        badges.splice(1, 0, '1인 1실 숙박');
      }

      const defaultTotal = baseOptions.reduce((sum, opt) => opt.isDefaultIncluded ? sum + (opt.priceUSD || 0) : sum, 0);

      return {
        ...pkg,
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
        name: acc.name.replace(/2인\s*1실/g, '1인 객실 기준').replace(/2인1실/g, '1인 객실 기준'),
        description: acc.description.replace(/2인\s*1실/g, '1인 1실').replace(/2인1실/g, '1인 1실')
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
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isLocalMode, setIsLocalMode] = useState(false);

  // --- Session Persistence & URL Sync Handling ---
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search) {
      const params = new URLSearchParams(window.location.search);
      if (params.get('sync_config') || params.get('fb_config')) {
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
        console.log("Sync config applied from URL parameter and query string cleaned.");
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

  // --- Firestore Integration Handlers ---

  // Debounced Sync Functions
  const isSyncing = useRef<Record<string, boolean>>({});

  const debouncedSyncProducts = useRef(debounce(async (newProducts: Product[]) => {
    if (isLocalMode || isSyncing.current['products']) return;
    isSyncing.current['products'] = true;
    try {
      await firestoreService.syncCollection('products', newProducts);
    } finally {
      isSyncing.current['products'] = false;
    }
  }, 3000)).current;

  const debouncedSyncVideos = useRef(debounce(async (newVideos: VideoItem[]) => {
    if (isLocalMode || isSyncing.current['videos']) return;
    isSyncing.current['videos'] = true;
    try {
      await firestoreService.syncCollection('videos', newVideos);
    } finally {
      isSyncing.current['videos'] = false;
    }
  }, 3000)).current;

  const debouncedSyncPosts = useRef(debounce(async (newPosts: CommunityPost[]) => {
    if (isLocalMode || isSyncing.current['posts']) return;
    isSyncing.current['posts'] = true;
    try {
      await firestoreService.syncCollection('posts', newPosts);
    } finally {
      isSyncing.current['posts'] = false;
    }
  }, 3000)).current;

  const debouncedSyncPages = useRef(debounce(async (newContents: Record<string, PageContent>) => {
    if (isLocalMode || isSyncing.current['pages']) return;
    isSyncing.current['pages'] = true;
    try {
      await firestoreService.syncAllPages(newContents);
    } finally {
      isSyncing.current['pages'] = false;
    }
  }, 5000)).current;

  const debouncedSyncSettings = useRef(debounce(async (key: 'heroImages' | 'menuItems', data: any) => {
    if (isLocalMode || isSyncing.current[`settings_${key}`]) return;
    isSyncing.current[`settings_${key}`] = true;
    try {
      await firestoreService.saveSettings(key, data);
    } finally {
      isSyncing.current[`settings_${key}`] = false;
    }
  }, 3000)).current;

  const debouncedSyncPopup = useRef(debounce(async (newPopup: PopupNotification) => {
    if (isLocalMode || isSyncing.current['popup']) return;
    isSyncing.current['popup'] = true;
    try {
      await firestoreService.savePopup(newPopup);
    } finally {
      isSyncing.current['popup'] = false;
    }
  }, 3000)).current;

  const debouncedSyncCustomPackages = useRef(debounce(async (newPkgs: CustomTripPackage[]) => {
    if (isLocalMode || isSyncing.current['custom_packages']) return;
    isSyncing.current['custom_packages'] = true;
    try {
      await firestoreService.syncCollection('custom_packages', newPkgs);
    } finally {
      isSyncing.current['custom_packages'] = false;
    }
  }, 3000)).current;

  // Initial Data Load
  useEffect(() => {
    const initData = async () => {
      try {
        console.log("Attempting to connect to Firestore...");
        const data = await firestoreService.loadGlobalData();
        
        // 만약 데모용 기본 설정을 사용 중이거나, 로컬 모드 플래그가 있다면
        if (data.isDefaultConfig || (data as any).isLocal) {
          setIsLocalMode(true);
        } else {
          console.log("Firestore connection successful, data loaded.");
          setIsLocalMode(false);
        }

        setHeroImages(data.heroImages);
        setMenuItems(data.menuItems);
        if (Array.isArray(data.videos)) {
          const validVideos = data.videos.filter((v: VideoItem) => v?.url && !v.url.startsWith('blob:'));
          setVideos(validVideos.length > 0 ? validVideos : INITIAL_VIDEOS);
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

  // Update Handlers (Updates State AND Firestore)
  const handleUpdateHeroImages = async (newImages: string[]) => {
    setHeroImages(newImages);
    debouncedSyncSettings('heroImages', newImages);
  };

  const handleUpdateMenuItems = async (newItems: MenuItem[]) => {
    setMenuItems(newItems);
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

  const navigateTo = (page: 'home' | 'admin' | 'category', category: string | null = null, pushHistory: boolean = true) => {
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
    }

    setCurrentPage(page);
    setSelectedCategory(category);
    setIsChatOpen(false);
    setSelectedProduct(undefined);
    setShowAuthModal(false);
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  };

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
                <TripPlanner packages={customPackages} masterOptionPool={masterOptionPool} onBack={handleBackOneStep} />
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
         <p>MANGO TOUR TRAVEL AGENCY | <a href="tel:+84377204451" className="hover:text-gold-400 transition ml-1 font-semibold">+84 37 720 4451</a> | 
           <a href="https://open.kakao.com/o/gprQnKSi" target="_blank" rel="noreferrer" className="ml-1 hover:text-gold-400 transition">
             Kakao: <span className="font-bold">MANGO TOUR</span>
           </a>
         </p>
         <p className="mt-1">© MANGO TOUR. All rights reserved.</p>
      </footer>

      <ChatRoom 
        user={user} 
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        onReqLogin={() => { setShowAuthModal(true); setAuthMode('login'); }} 
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
            onClick={() => setIsChatOpen(true)}
            className="flex items-center gap-2 px-5 py-3.5 bg-gradient-to-r from-deepgreen to-teal-800 hover:from-teal-900 hover:to-deepgreen text-white rounded-full shadow-2xl font-bold text-xs sm:text-sm transition-all duration-200 active:scale-95 hover:scale-105 group cursor-pointer"
          >
            <span className="text-base group-hover:scale-110 transition-transform">💬</span>
            <span>실시간 채팅</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </button>
        )}
      </div>

      <BottomNav 
        currentPage={currentPage} 
        selectedCategory={selectedCategory}
        onNavigate={(page, cat) => navigateTo(page as any, cat || null)}
        isChatOpen={isChatOpen} 
        setIsChatOpen={setIsChatOpen} 
        onBack={handleBackOneStep}
      />

      {/* Popup Notification */}
      {showPopup && popup.isActive && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-2xl max-w-sm w-full animate-scale-in border border-white/20">
            {popup.image && (
              <div className="h-64 relative">
                <img src={popup.image} className="w-full h-full object-cover" alt="Notification" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                <div className="absolute bottom-6 left-6 right-6">
                  <h3 className="text-white font-bold text-xl drop-shadow-lg">{popup.title}</h3>
                </div>
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
              <button type="submit" className="w-full bg-gold-500 text-white font-bold py-3.5 rounded-xl shadow-lg transition transform active:scale-95 hover:bg-gold-600 mt-2">
                {authMode === 'login' ? '로그인' : '가입 완료하기'}
              </button>
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
