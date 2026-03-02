
import React, { useState, useEffect, useRef } from 'react';
import HeroSlider from './components/HeroSlider';
import IconMenu from './components/IconMenu';
import AITripPlanner from './components/AITripPlanner';
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
import BottomNav from './components/BottomNav';
import { INITIAL_PRODUCTS, INITIAL_VIDEOS, INITIAL_POSTS, HERO_IMAGES, SUB_MENU_ITEMS, INITIAL_PAGE_CONTENTS, INITIAL_POPUP, INITIAL_TRIP_PLANNER_SETTINGS } from './constants';
import { User, Product, VideoItem, CommunityPost, TripPlanResult, PageContent, MenuItem, PopupNotification, TripPlannerSettings } from './types';
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
  const [currentPage, setCurrentPage] = useState<'home' | 'admin' | 'category'>('home');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Data State
  const [heroImages, setHeroImages] = useState<string[]>(HERO_IMAGES);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(SUB_MENU_ITEMS);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [videos, setVideos] = useState<VideoItem[]>(INITIAL_VIDEOS);
  const [posts, setPosts] = useState<CommunityPost[]>(INITIAL_POSTS);
  const [pageContents, setPageContents] = useState<Record<string, PageContent>>(INITIAL_PAGE_CONTENTS);
  const [popup, setPopup] = useState<PopupNotification>(INITIAL_POPUP);
  const [tripPlannerSettings, setTripPlannerSettings] = useState<TripPlannerSettings>(INITIAL_TRIP_PLANNER_SETTINGS);
  const [showPopup, setShowPopup] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isLocalMode, setIsLocalMode] = useState(false);

  // --- Session Persistence ---
  useEffect(() => {
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

  const debouncedSyncTripPlanner = useRef(debounce(async (newSettings: TripPlannerSettings) => {
    if (isLocalMode || isSyncing.current['trip_planner']) return;
    isSyncing.current['trip_planner'] = true;
    try {
      await firestoreService.saveTripPlannerSettings(newSettings);
    } finally {
      isSyncing.current['trip_planner'] = false;
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
        setProducts(data.products);
        setVideos(data.videos);
        setPosts(data.posts);
        setPageContents(data.pageContents);
        setPopup(data.popup);
        if (data.tripPlannerSettings) setTripPlannerSettings(data.tripPlannerSettings);
        
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
    debouncedSyncProducts(newProducts);
  };

  const handleUpdateVideos = async (newVideos: VideoItem[]) => {
    setVideos(newVideos);
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

  const handleUpdateTripPlannerSettings = async (newSettings: TripPlannerSettings) => {
    setTripPlannerSettings(newSettings);
    debouncedSyncTripPlanner(newSettings);
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
  const [generatedPlan, setGeneratedPlan] = useState<TripPlanResult | undefined>(undefined);

  useEffect(() => {
    const handleNavigate = () => {
      setSelectedCategory('여행 만들기');
      setCurrentPage('category');
      window.scrollTo(0, 0);
    };
    window.addEventListener('navigate-to-planner', handleNavigate);
    return () => window.removeEventListener('navigate-to-planner', handleNavigate);
  }, []);

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
  const handleLogout = () => { 
    setUser(null); 
    localStorage.removeItem('mango_user');
    setCurrentPage('home'); 
  };
  const handleProductClick = (id: string) => {
    const product = products.find(p => p.id === id);
    if (product) setSelectedProduct(product);
  };
  const handleMenuClick = (label: string) => {
    setSelectedCategory(label);
    setCurrentPage('category');
    window.scrollTo(0, 0);
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
          <h2 className="text-3xl font-black mb-3 tracking-tight animate-pulse" style={{ fontFamily: 'serif' }}>설레는 여행 준비 중!</h2>
          <p className="text-sm opacity-70 font-medium tracking-widest uppercase">MANGO TOUR IS PREPARING YOUR TRIP</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans pb-20 md:pb-0">
      <header className="sticky top-0 z-30 bg-white shadow-md no-print">
        <div className="max-w-7xl mx-auto px-4 py-2 flex justify-between items-center">
          <button onClick={() => window.location.href = '/'} className="flex items-center gap-2">
             <div className="w-6 h-6 bg-gold-500 rounded-full flex items-center justify-center text-white font-bold text-xs">M</div>
             <h1 className="text-lg font-bold text-deepgreen tracking-tight uppercase">MANGO TOUR</h1>
          </button>
          
          <nav className="flex gap-2 items-center">
            {isAdmin && (
              <button 
                onClick={() => setCurrentPage(currentPage === 'home' ? 'admin' : 'home')}
                className={`px-3 py-1 rounded font-bold text-xs transition ${
                  currentPage === 'admin' ? 'bg-deepgreen text-white' : 'bg-gray-100 text-deepgreen'
                }`}
              >
                {currentPage === 'home' ? '⚙️ 관리자' : '🏠 메인'}
              </button>
            )}

            {isAdmin && (
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border ${
                isLocalMode 
                  ? 'bg-orange-50 text-orange-600 border-orange-200' 
                  : 'bg-green-50 text-green-600 border-green-200'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isLocalMode ? 'bg-orange-500 animate-pulse' : 'bg-green-500'}`}></span>
                {isLocalMode ? 'LOCAL MODE' : 'CLOUD SYNC'}
              </div>
            )}

            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-600 font-bold">{user.nickname}님</span>
                <button onClick={handleLogout} className="text-xs text-gray-400 hover:text-red-500 transition">로그아웃</button>
              </div>
            ) : (
              <div className="flex gap-1.5">
                <button 
                  onClick={() => { setShowAuthModal(true); setAuthMode('login'); }} 
                  className="px-3 py-1 bg-gold-500 text-white rounded-full text-xs font-bold hover:bg-gold-600 transition"
                >
                  로그인
                </button>
                <button 
                  onClick={() => { setShowAuthModal(true); setAuthMode('signup'); }} 
                  className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-bold hover:bg-gray-200 transition"
                >
                  회원가입
                </button>
              </div>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-grow">
        {currentPage === 'admin' && isAdmin ? (
          <AdminDashboard 
            users={users} 
            heroImages={heroImages} setHeroImages={handleUpdateHeroImages}
            menuItems={menuItems} setMenuItems={handleUpdateMenuItems} 
            products={products} setProducts={handleUpdateProducts}
            pageContents={pageContents} setPageContents={handleUpdatePageContents}
            videos={videos} setVideos={handleUpdateVideos}
            posts={posts} setPosts={handleUpdatePosts}
            popup={popup} setPopup={handleUpdatePopup}
            tripPlannerSettings={tripPlannerSettings} setTripPlannerSettings={handleUpdateTripPlannerSettings}
            setCurrentPage={setCurrentPage}
          />
        ) : (
          <>
            {currentPage === 'home' && (
              <>
                <HeroSlider images={heroImages} />
                <IconMenu items={menuItems} onItemClick={handleMenuClick} />
              </>
            )}

            {currentPage === 'category' && selectedCategory ? (
              selectedCategory === '동영상' ? (
                <VideoGallery videos={videos} user={user} onUpdateVideos={handleUpdateVideos} onReqLogin={() => { setShowAuthModal(true); setAuthMode('login'); }} onBack={() => setCurrentPage('home')} />
              ) : selectedCategory === '커뮤니티' ? (
                <CommunityBoard posts={posts} user={user} onUpdatePosts={handleUpdatePosts} onReqLogin={() => { setShowAuthModal(true); setAuthMode('login'); }} onBack={() => setCurrentPage('home')} />
              ) : selectedCategory === '여행 만들기' ? (
                <AITripPlanner 
                  settings={tripPlannerSettings} 
                  onBack={() => setCurrentPage('home')} 
                  isAdmin={isAdmin}
                />
              ) : selectedCategory === '비지니스' ? (
                <BusinessPage content={pageContents['business']} onBack={() => setCurrentPage('home')} />
              ) : selectedCategory === '호텔&빌라' ? (
                <HotelVillaPage content={pageContents['hotel']} onBack={() => setCurrentPage('home')} />
              ) : selectedCategory === '골프' ? (
                <GolfPage content={pageContents['golf']} onBack={() => setCurrentPage('home')} />
              ) : selectedCategory === '먹거리' ? (
                <FoodPage content={pageContents['food']} onBack={() => setCurrentPage('home')} />
              ) : selectedCategory === '베트남 문화' ? (
                <CulturePage content={pageContents['culture']} onBack={() => setCurrentPage('home')} />
              ) : selectedCategory === 'FOR MEN' ? (
                <ForMenPage content={pageContents['men']} onBack={() => setCurrentPage('home')} />
              ) : selectedCategory === '관광' ? (
                <TourPage content={pageContents['tour']} onBack={() => setCurrentPage('home')} />
              ) : selectedCategory === '이벤트' ? (
                <EventPage content={pageContents['event']} onBack={() => setCurrentPage('home')} />
              ) : (
                <CategoryPage category={selectedCategory} products={getFilteredProducts()} onProductClick={handleProductClick} onBack={() => setCurrentPage('home')} isLoggedIn={!!user} onReqLogin={() => { setShowAuthModal(true); setAuthMode('login'); }} />
              )
            ) : null}
          </>
        )}
      </main>

      <footer className="bg-gray-800 text-gray-400 py-6 text-center text-xs no-print">
         <p>MANGO TOUR TRAVEL AGENCY | +84 77 803 8743 | 
           <a href="https://open.kakao.com/o/gSfNsh3h" target="_blank" rel="noreferrer" className="ml-1 hover:text-gold-400 transition">
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

      <BottomNav 
        currentPage={currentPage} 
        selectedCategory={selectedCategory}
        onNavigate={(page, cat) => {
          setCurrentPage(page as any);
          if (cat) setSelectedCategory(cat);
        }}
        isChatOpen={isChatOpen} 
        setIsChatOpen={setIsChatOpen} 
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

      {(selectedProduct || generatedPlan) && (
        <QuotationModal product={selectedProduct} plan={generatedPlan} onClose={() => { setSelectedProduct(undefined); setGeneratedPlan(undefined); }} />
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
