
import React, { useState, useEffect } from 'react';
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
import { INITIAL_PRODUCTS, INITIAL_VIDEOS, INITIAL_POSTS, HERO_IMAGES, SUB_MENU_ITEMS, INITIAL_PAGE_CONTENTS } from './constants';
import { User, Product, VideoItem, CommunityPost, TripPlanResult, PageContent, MenuItem } from './types';
import { storageService } from './services/storageService';

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

  // Lifted Content State
  const [heroImages, setHeroImages] = useState<string[]>(HERO_IMAGES);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(SUB_MENU_ITEMS);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [videos, setVideos] = useState<VideoItem[]>(INITIAL_VIDEOS);
  const [posts, setPosts] = useState<CommunityPost[]>(INITIAL_POSTS);
  const [pageContents, setPageContents] = useState<Record<string, PageContent>>(INITIAL_PAGE_CONTENTS);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Changed keys to force data refresh to MANGO TOUR text
  const STORAGE_KEYS = [
    'mango_tour_hero_images_v1',
    'mango_tour_menu_items_v1',
    'mango_tour_products_v1',
    'mango_tour_videos_v1',
    'mango_tour_posts_v1',
    'mango_tour_pages_v1'
  ];

  useEffect(() => {
    const initStorage = async () => {
      await storageService.migrateFromLocalStorage(STORAGE_KEYS);
      const h = await storageService.getItem<string[]>(STORAGE_KEYS[0]);
      const m = await storageService.getItem<MenuItem[]>(STORAGE_KEYS[1]);
      const pr = await storageService.getItem<Product[]>(STORAGE_KEYS[2]);
      const v = await storageService.getItem<VideoItem[]>(STORAGE_KEYS[3]);
      const po = await storageService.getItem<CommunityPost[]>(STORAGE_KEYS[4]);
      const pa = await storageService.getItem<Record<string, PageContent>>(STORAGE_KEYS[5]);

      if (h) setHeroImages(h);
      if (m) setMenuItems(m);
      if (pr) setProducts(pr);
      if (v) setVideos(v);
      if (po) setPosts(po);
      if (pa) setPageContents(pa);

      setIsDataLoaded(true);
    };
    initStorage();
  }, []);

  useEffect(() => { if (isDataLoaded) storageService.setItem(STORAGE_KEYS[0], heroImages); }, [heroImages, isDataLoaded]);
  useEffect(() => { if (isDataLoaded) storageService.setItem(STORAGE_KEYS[1], menuItems); }, [menuItems, isDataLoaded]);
  useEffect(() => { if (isDataLoaded) storageService.setItem(STORAGE_KEYS[2], products); }, [products, isDataLoaded]);
  useEffect(() => { if (isDataLoaded) storageService.setItem(STORAGE_KEYS[3], videos); }, [videos, isDataLoaded]);
  useEffect(() => { if (isDataLoaded) storageService.setItem(STORAGE_KEYS[4], posts); }, [posts, isDataLoaded]);
  useEffect(() => { if (isDataLoaded) storageService.setItem(STORAGE_KEYS[5], pageContents); }, [pageContents, isDataLoaded]);

  const [users, setUsers] = useState<User[]>([
    { id: 'admin', username: 'admin', role: 'admin', nickname: '관리자' },
    { id: 'u1', username: 'user1', role: 'user', nickname: '골프왕' },
    { id: 'u2', username: 'user2', role: 'user', nickname: '여행좋아' }
  ]);

  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>(undefined);
  const [generatedPlan, setGeneratedPlan] = useState<TripPlanResult | undefined>(undefined);

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
  const handleLogout = () => { setUser(null); setCurrentPage('home'); };
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
      <div className="min-h-screen bg-deepgreen flex flex-col items-center justify-center text-white p-8">
        <div className="w-16 h-16 border-4 border-gold-400 border-t-transparent rounded-full animate-spin mb-6"></div>
        <h2 className="text-xl font-bold mb-2">데이터를 안전하게 불러오는 중입니다</h2>
        <p className="text-sm opacity-60">잠시만 기다려 주세요...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <header className="sticky top-0 z-40 bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-2 flex justify-between items-center">
          <button onClick={() => setCurrentPage('home')} className="flex items-center gap-2">
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
            heroImages={heroImages} setHeroImages={setHeroImages}
            menuItems={menuItems} setMenuItems={setMenuItems} 
            products={products} setProducts={setProducts}
            pageContents={pageContents} setPageContents={setPageContents}
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
                <VideoGallery videos={videos} user={user} onUpdateVideos={setVideos} onReqLogin={() => { setShowAuthModal(true); setAuthMode('login'); }} onBack={() => setCurrentPage('home')} />
              ) : selectedCategory === '커뮤니티' ? (
                <CommunityBoard posts={posts} user={user} onUpdatePosts={setPosts} onReqLogin={() => { setShowAuthModal(true); setAuthMode('login'); }} onBack={() => setCurrentPage('home')} />
              ) : selectedCategory === '여행 만들기' ? (
                <AITripPlanner onPlanGenerated={(plan) => setGeneratedPlan(plan)} onBack={() => setCurrentPage('home')} />
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
                <EventPage content={pageContents['event']} onBack={() => setCurrentPage('home')} isLoggedIn={!!user} onReqLogin={() => { setShowAuthModal(true); setAuthMode('login'); }} onEventClick={(t, c, i) => setSelectedProduct({ id: 'ev', title: t, description: c, image: i, price: 0, location: '이벤트', duration: '문의', type: 'tour' })} />
              ) : (
                <CategoryPage category={selectedCategory} products={getFilteredProducts()} onProductClick={handleProductClick} onBack={() => setCurrentPage('home')} />
              )
            ) : null}
          </>
        )}
      </main>

      <footer className="bg-gray-800 text-gray-400 py-6 text-center text-xs">
         <p>MANGO TOUR TRAVEL AGENCY | +84 77 803 8743 | Kakao: vnseen1</p>
         <p className="mt-1">© MANGO TOUR. All rights reserved.</p>
      </footer>

      <ChatRoom user={user} onReqLogin={() => { setShowAuthModal(true); setAuthMode('login'); }} />

      {(selectedProduct || generatedPlan) && (
        <QuotationModal product={selectedProduct} plan={generatedPlan} onClose={() => { setSelectedProduct(undefined); setGeneratedPlan(undefined); }} />
      )}

      {showAuthModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4 backdrop-blur-sm animate-fade-in">
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
