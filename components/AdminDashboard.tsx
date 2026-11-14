
import React, { useState, useRef, useEffect } from 'react';
import { User, Product, ProductCostBreakdownItem, PageContent, MenuItem, VideoItem, CommunityPost, PopupNotification, PageSection, PageSlide, CustomTripPackage, PackageOptionItem, MasterOptionPool } from '../types';
import { 
  INITIAL_PRODUCTS, 
  INITIAL_VIDEOS, 
  INITIAL_POSTS, 
  HERO_IMAGES, 
  SUB_MENU_ITEMS, 
  INITIAL_PAGE_CONTENTS,
  INITIAL_POPUP,
  INITIAL_CUSTOM_PACKAGES,
  INITIAL_MASTER_OPTION_POOL 
} from '../constants';
import { driveService } from '../services/googleDriveService';
import { fetchGoogleSheetData } from '../services/googleSheetService';
import { uploadFile, setCloudinaryConfig } from '../services/uploadService';
import { supabaseService } from '../services/supabaseService';
import { isSupabaseConfigured, updateSupabaseCredentials } from '../services/supabaseClient';
import { compressImage, getFreshImageUrl, isImageIconUrl } from '../utils/imageUtils';
import BackButton from './BackButton';
import { getTravelDays, getItemPricingType, calculateCostItemTotal } from '../utils/costBreakdownUtils';

interface Props {
  users: User[];
  onUpdateUsers?: (users: User[]) => void;
  heroImages: string[];
  setHeroImages: (images: string[]) => void;
  menuItems: MenuItem[];
  setMenuItems: (items: MenuItem[]) => void;
  products: Product[];
  setProducts: (products: Product[]) => void;
  customPackages?: CustomTripPackage[];
  setCustomPackages?: (packages: CustomTripPackage[]) => void;
  masterOptionPool?: MasterOptionPool;
  setMasterOptionPool?: (pool: MasterOptionPool) => void;
  pageContents: Record<string, PageContent>;
  setPageContents: (contents: Record<string, PageContent>) => void;
  videos: VideoItem[];
  setVideos: (videos: VideoItem[]) => void;
  posts: CommunityPost[];
  setPosts: (posts: CommunityPost[]) => void;
  popup: PopupNotification;
  setPopup: (popup: PopupNotification) => void;
  setCurrentPage: (page: 'home' | 'admin' | 'category') => void;
}

const AdminDashboard: React.FC<Props> = ({
  users,
  onUpdateUsers,
  heroImages,
  setHeroImages,
  menuItems,
  setMenuItems,
  products,
  setProducts,
  customPackages = INITIAL_CUSTOM_PACKAGES,
  setCustomPackages,
  masterOptionPool = INITIAL_MASTER_OPTION_POOL,
  setMasterOptionPool,
  pageContents,
  setPageContents,
  videos,
  setVideos,
  posts,
  setPosts,
  popup,
  setPopup,
  setCurrentPage
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'hero' | 'products' | 'planner' | 'pages' | 'menu' | 'popup'>('users');
  const [plannerSubTab, setPlannerSubTab] = useState<'packages' | 'masterPool'>('masterPool');
  const [poolCategory, setPoolCategory] = useState<'region' | 'golf' | 'tour' | 'hotel' | 'vehicle' | 'extra' | 'guide' | 'meal'>('region');
  
  // Master Pool item creation modal states
  const [showAddPoolModal, setShowAddPoolModal] = useState(false);
  const [newPoolItem, setNewPoolItem] = useState<{
    category: 'region' | 'golf' | 'tour' | 'hotel' | 'hotelTier' | 'vehicle' | 'extra' | 'guide' | 'meal';
    name: string;
    shortName?: string;
    icon?: string;
    location: string;
    holes?: number;
    type?: 'hotel_5star' | 'hotel_4star' | 'pool_villa' | 'resort';
    priceUSD?: number;
    priceDeltaUSD: number;
    pricingUnit?: 'per_day' | 'per_person';
    isFreeTravel?: boolean;
    description: string;
    badge: string;
  }>({
    category: 'golf',
    name: '',
    shortName: '',
    icon: '✨',
    location: '호치민',
    holes: 18,
    type: 'hotel_5star',
    priceUSD: 150,
    priceDeltaUSD: 0,
    pricingUnit: 'per_person',
    isFreeTravel: false,
    description: '',
    badge: ''
  });

  // Icon Picker Modal State (for Region, HotelTier, Vehicle, Extra)
  const [iconPickerTarget, setIconPickerTarget] = useState<{
    mode: 'pool' | 'newPoolItem';
    category: 'region' | 'hotelTier' | 'vehicle' | 'extra';
    id?: string;
    label: string;
    currentIcon: string;
  } | null>(null);
  const [iconCustomInput, setIconCustomInput] = useState('');
  
  const heroFileInputRef = useRef<HTMLInputElement>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [editingPackage, setEditingPackage] = useState<CustomTripPackage | null>(null);
  const [packageToDelete, setPackageToDelete] = useState<CustomTripPackage | null>(null);
  const [showResetPackageModal, setShowResetPackageModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [packageModalTab, setPackageModalTab] = useState<'basic' | 'options' | 'itinerary'>('basic');
  const [selectedPageId, setSelectedPageId] = useState<string>('business');
  const [pageForm, setPageForm] = useState<PageContent>(pageContents['business'] || INITIAL_PAGE_CONTENTS['business']);

  // Popup Image Dynamic Manipulation States
  const [popupZoom, setPopupZoom] = useState<number>(1);
  const [popupPan, setPopupPan] = useState({ x: 0, y: 0 });
  const [isPopupDragging, setIsPopupDragging] = useState(false);
  const popupDragStartRef = useRef({ x: 0, y: 0 });
  const [showPopupFullscreen, setShowPopupFullscreen] = useState(false);
  const [showPopupLivePreview, setShowPopupLivePreview] = useState(false);
  const [showPopupUrlModal, setShowPopupUrlModal] = useState(false);
  const [popupUrlInput, setPopupUrlInput] = useState('');

  // Google Drive Config
  const [showDriveConfig, setShowDriveConfig] = useState(false);
  const [apiKey, setApiKey] = useState(localStorage.getItem('google_api_key') || '');
  const [clientId, setClientId] = useState(localStorage.getItem('google_client_id') || '');
  const [isDriveConnected, setIsDriveConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Supabase Config
  const [showSupabaseConfig, setShowSupabaseConfig] = useState(false);
  const [sbUrl, setSbUrl] = useState(localStorage.getItem('sb_url') || (import.meta as any).env?.VITE_SUPABASE_URL || '');
  const [sbAnonKey, setSbAnonKey] = useState(localStorage.getItem('sb_anon_key') || (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '');
  const [isSeedingSupabase, setIsSeedingSupabase] = useState(false);

  // User Management State
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newNickname, setNewNickname] = useState('');
  const [newRole, setNewRole] = useState<'user' | 'admin'>('user');

  // Cloudinary Config
  const [showCloudinaryConfig, setShowCloudinaryConfig] = useState(false);
  const [cloudName, setCloudName] = useState(localStorage.getItem('cloudinary_cloud_name') || 'ducor31pp');
  const [uploadPreset, setUploadPreset] = useState(localStorage.getItem('cloudinary_upload_preset') || 'mangotour');
  
  // Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);



  useEffect(() => {
    if (pageContents[selectedPageId]) {
      setPageForm({ ...pageContents[selectedPageId] });
    } else {
      setPageForm(INITIAL_PAGE_CONTENTS[selectedPageId] || INITIAL_PAGE_CONTENTS['business']);
    }
  }, [selectedPageId, pageContents]);

  // 에러 메시지 추출 헬퍼 함수
  const getErrorMessage = (e: any) => {
    if (typeof e === 'string') return e;
    if (e.result?.error?.message) return e.result.error.message;
    if (e.error?.message) return e.error.message;
    if (e.message) return e.message;
    return JSON.stringify(e);
  };

  // Handle Drive Connection
  const handleConnectDrive = async () => {
    if (!apiKey || !clientId) {
      alert('API Key와 Client ID를 입력해주세요.');
      return;
    }
    
    setIsConnecting(true);
    localStorage.setItem('google_api_key', apiKey);
    localStorage.setItem('google_client_id', clientId);

    try {
      // 1. GAPI Client Init
      await driveService.initGapiClient(apiKey);
      
      // 2. Token Client Init
      await driveService.initTokenClient(clientId, (response) => {
        if (response && response.access_token) {
            setIsDriveConnected(true);
            setIsConnecting(false);
            alert('구글 드라이브 연결 성공! 이제 저장/복원 기능을 사용할 수 있습니다.');
        } else {
            setIsConnecting(false);
        }
      });

      // 3. Request Token (Login Popup)
      // 팝업 차단 안내를 미리 띄우거나, 팝업 호출 직전에 알림
      driveService.requestAccessToken();
      
      // 팝업이 뜨지 않을 경우를 대비해 10초 후 로딩 상태 해제 (성공하지 않았다면)
      setTimeout(() => {
        setIsConnecting(prev => {
          if (prev) {
            console.log("Connection timeout - resetting state");
            return false;
          }
          return false;
        });
      }, 15000);
      
    } catch (e: any) {
      console.error("Drive Connection Error:", e);
      setIsConnecting(false);
      
      const errorMsg = getErrorMessage(e);
      
      if (errorMsg.includes('popup_closed-by-user')) {
          // 사용자가 창을 닫은 경우는 별도 알림 없이 로딩만 해제
          return;
      }

      if (errorMsg.includes('has not been used in project') || errorMsg.includes('is disabled') || errorMsg.includes('PERMISSION_DENIED')) {
          alert(`[🚨 중요: 구글 드라이브 API 미활성화]\n\n구글 클라우드 콘솔에서 'Google Drive API'가 활성화되지 않았습니다.\n\n해결 방법:\n1. Google Cloud Console 접속\n2. 'Google Drive API' 검색 후 [사용(ENABLE)] 클릭\n3. 1~2분 뒤 다시 시도해주세요.\n\n(상세 에러: ${errorMsg})`);
      } else if (errorMsg.includes('Script load failed') || errorMsg.includes('스크립트 로드 실패')) {
          alert(errorMsg);
      } else {
          alert(`연결 중 오류가 발생했습니다. 팝업 차단이 설정되어 있는지 확인해 주세요.\n\n상세 에러: ${errorMsg}`);
      }
    }
  };

  const handleSaveToDrive = async () => {
    if (!isDriveConnected) {
        alert('먼저 구글 드라이브에 연결해주세요.');
        return;
    }
    setIsSyncing(true);
    const backupData = {
        heroImages,
        menuItems,
        products,
        videos,
        posts,
        pageContents
    };
    try {
        await driveService.saveData(backupData);
        alert('구글 드라이브에 데이터가 성공적으로 저장되었습니다!');
    } catch (e) {
        console.error(e);
        alert('저장 중 오류가 발생했습니다. 콘솔을 확인해주세요.');
    } finally {
        setIsSyncing(false);
    }
  };

  const handleLoadFromDrive = async () => {
    if (!isDriveConnected) {
        alert('먼저 구글 드라이브에 연결해주세요.');
        return;
    }
    if (!confirm('현재 데이터를 덮어쓰고 구글 드라이브의 데이터를 불러오시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;

    setIsSyncing(true);
    try {
        const data = await driveService.loadData();
        if (data) {
            if (data.heroImages) setHeroImages(data.heroImages);
            if (data.menuItems) setMenuItems(data.menuItems);
            if (data.products) setProducts(data.products);
            if (data.videos) setVideos(data.videos);
            if (data.posts) setPosts(data.posts);
            if (data.pageContents) setPageContents(data.pageContents);
            alert('데이터 복원 완료!');
        } else {
            alert('저장된 데이터를 찾을 수 없습니다 (mango_tour_data.json).');
        }
    } catch (e) {
        console.error(e);
        alert('복원 중 오류가 발생했습니다.');
    } finally {
        setIsSyncing(false);
    }
  };

  // Improved File Upload Handler - Using Local Preview for simplicity if Firebase is too complex
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void | Promise<void>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) { 
        alert('파일이 너무 큽니다. 50MB 이하의 파일을 권장합니다.');
        return;
      }

      setIsUploading(true);
      setUploadProgress(0);
      try {
        const downloadUrl = await uploadFile(file, 'images', (progress) => {
          setUploadProgress(progress);
        });
        await callback(downloadUrl);
      } catch (e: any) {
        console.error("Upload failed, falling back to Base64:", e);
        
        // Fallback: 로컬 미리보기 (Base64) - 서버 연동 없이도 작동하게 함
        try {
          // Base64로 저장할 때도 압축을 적용하여 Firestore 1MB 제한을 피하도록 함
          const compressedBlob = await compressImage(file, 800, 800, 0.5); // 더 강력한 압축
          const reader = new FileReader();
          reader.onloadend = async () => {
            const base64 = reader.result as string;
            
            // Firestore 1MB limit check (approximate for Base64)
            if (base64.length > 900000) { 
              alert('⚠️ 경고: 이미지 서버 연결 실패로 압축 후 저장하려고 했으나, 여전히 용량이 너무 큽니다. (Firestore 1MB 제한)\n\n더 작은 이미지를 사용하거나 Cloudinary 설정을 확인해주세요.');
              return;
            }

            await callback(base64);
            alert('이미지 서버 연결 실패로 압축된 로컬(Base64) 데이터로 저장되었습니다.');
          };
          reader.readAsDataURL(compressedBlob);
        } catch (compressErr) {
          console.error("Compression fallback failed:", compressErr);
          // 최후의 수단: 원본 Base64 (위험함)
          const reader = new FileReader();
          reader.onloadend = async () => {
            const base64 = reader.result as string;
            await callback(base64);
          };
          reader.readAsDataURL(file);
        }
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    }
    e.target.value = '';
  };

  // --- Helper Wrappers ---
  const handleReplaceHeroImage = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileUpload(e, (url) => {
      const updated = [...heroImages];
      updated[index] = url;
      setHeroImages(updated);
    });
  };

  const handleProductFieldChange = async (id: string, field: keyof Product, value: any) => {
    const previousProducts = [...products];
    try {
      const updated = products.map(p => p.id === id ? { ...p, [field]: value } : p);
      await setProducts(updated);
    } catch (error) {
      console.error("Failed to update product:", error);
      setProducts(previousProducts);
      alert('상품 정보 저장 중 오류가 발생했습니다. 이전 상태로 복구합니다.');
    }
  };

  const handleReplaceProductImage = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileUpload(e, (url) => {
      handleProductFieldChange(id, 'image', url);
    });
  };

  // ... Itinerary Handlers ...
  const handleItineraryDayAdd = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const newItinerary = [...(product.itinerary || [])];
    newItinerary.push({ day: newItinerary.length + 1, activities: ['새로운 활동을 입력하세요'] });
    handleProductFieldChange(productId, 'itinerary', newItinerary);
  };

  const handleItineraryDayRemove = (productId: string, dayIndex: number) => {
    const product = products.find(p => p.id === productId);
    if (!product || !product.itinerary) return;
    const newItinerary = product.itinerary
      .filter((_, idx) => idx !== dayIndex)
      .map((d, i) => ({ ...d, day: i + 1 }));
    handleProductFieldChange(productId, 'itinerary', newItinerary);
  };

  const handleActivityAdd = (productId: string, dayIndex: number) => {
    const product = products.find(p => p.id === productId);
    if (!product || !product.itinerary) return;
    const newItinerary = [...product.itinerary];
    newItinerary[dayIndex] = {
      ...newItinerary[dayIndex],
      activities: [...newItinerary[dayIndex].activities, '활동 추가']
    };
    handleProductFieldChange(productId, 'itinerary', newItinerary);
  };

  const handleActivityRemove = (productId: string, dayIndex: number, activityIndex: number) => {
    const product = products.find(p => p.id === productId);
    if (!product || !product.itinerary) return;
    const newItinerary = [...product.itinerary];
    newItinerary[dayIndex] = {
      ...newItinerary[dayIndex],
      activities: newItinerary[dayIndex].activities.filter((_, idx) => idx !== activityIndex)
    };
    handleProductFieldChange(productId, 'itinerary', newItinerary);
  };

  const handleActivityChange = (productId: string, dayIndex: number, activityIndex: number, value: string) => {
    const product = products.find(p => p.id === productId);
    if (!product || !product.itinerary) return;
    const newItinerary = [...product.itinerary];
    newItinerary[dayIndex] = {
      ...newItinerary[dayIndex],
      activities: newItinerary[dayIndex].activities.map((act, idx) => idx === activityIndex ? value : act)
    };
    handleProductFieldChange(productId, 'itinerary', newItinerary);
  };

  const handleProductDetailImageAdd = (productId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileUpload(e, (url) => {
      const product = products.find(p => p.id === productId);
      if (!product) return;
      const detailImages = [...(product.detailImages || [])];
      detailImages.push(url);
      handleProductFieldChange(productId, 'detailImages', detailImages);
    });
  };

  const handleProductDetailImageRemove = (productId: string, imageIdx: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const detailImages = (product.detailImages || []).filter((_, i) => i !== imageIdx);
    handleProductFieldChange(productId, 'detailImages', detailImages);
  };

  // Product Cost Items Management Handlers
  const handleGenerateDefaultCostItems = (p: Product) => {
    const singlePrice = p.price || 970;
    const travelDays = getTravelDays(p.duration, p.itinerary);
    const defaultItems: ProductCostBreakdownItem[] = [
      {
        category: '항공권',
        detail: '국제선 왕복 항공권 (개별 발권 또는 망고투어 실시간 발권 대행)',
        quantity: '{personCount}인',
        amountUSD: 0,
        pricingType: 'person',
      },
      {
        category: p.type === 'golf' ? '골프(그린피)' : '투어/관광',
        detail: p.type === 'golf'
          ? `${p.title} - 정규 18홀 라운딩 그린피 일체`
          : `${p.title} - 전 일정 주요 명소 단독 투어 및 입장료`,
        quantity: '{personCount}인',
        amountUSD: Math.round(singlePrice * 0.45),
        pricingType: 'person',
      },
      {
        category: '숙박(호텔)',
        detail: `${p.location} 고급 호텔/리조트 (전 일정 1인 1실 단독 투숙, 조식 뷔페 포함)`,
        quantity: '{personCount}실 (1인실)',
        amountUSD: Math.round(singlePrice * 0.35),
        pricingType: 'person',
      },
      {
        category: '투어/차량',
        detail: '전 일정 단독 VIP 7인승 전용 리무진 밴 (공항 픽업/샌딩 + 골프장 + 시내 전용 기사/유류비 포함)',
        quantity: '{vehicleCount}대 (전일정 {days}일)',
        amountUSD: 100, // 7인승 리무진 밴 1일 $100 기준
        pricingType: 'vehicle',
        perDay: true,
        days: travelDays,
      },
      {
        category: '가이드',
        detail: '한국어 전문 가이드 전 일정 단독 동행 케어 (1일 $120 기준)',
        quantity: '{guideCount}명 (전일정 {days}일)',
        amountUSD: 120, // 16인까지 가이드 1명 1일 기준
        pricingType: 'guide',
        perDay: true,
        days: travelDays,
      },
    ];
    handleProductFieldChange(p.id, 'costItems', defaultItems);
  };

  const handleCostItemChange = (productId: string, itemIdx: number, field: keyof ProductCostBreakdownItem, val: any) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const items = [...(product.costItems || [])];
    if (!items[itemIdx]) return;
    items[itemIdx] = { ...items[itemIdx], [field]: val };
    handleProductFieldChange(productId, 'costItems', items);
  };

  const handleCostItemAdd = (productId: string, defaultType: 'person' | 'vehicle' | 'guide' = 'person') => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const items = [...(product.costItems || [])];
    items.push({
      category: defaultType === 'vehicle' ? '투어/차량' : defaultType === 'guide' ? '가이드' : '기타 항목',
      detail: defaultType === 'vehicle' ? '전 일정 단독 VIP 7인승 전용 리무진 밴' : defaultType === 'guide' ? '한국어 전문 가이드' : '세부 내역을 입력하세요',
      quantity: defaultType === 'vehicle' ? '{vehicleCount}대 (전일정 {days}일)' : defaultType === 'guide' ? '{guideCount}명 (전일정 {days}일)' : '{personCount}인',
      amountUSD: defaultType === 'guide' ? 120 : defaultType === 'vehicle' ? 100 : 50,
      pricingType: defaultType,
      perDay: defaultType === 'guide' || defaultType === 'vehicle',
    });
    handleProductFieldChange(productId, 'costItems', items);
  };

  const handleCostItemRemove = (productId: string, itemIdx: number) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    const items = (product.costItems || []).filter((_, idx) => idx !== itemIdx);
    handleProductFieldChange(productId, 'costItems', items);
  };

  const handleDeleteProduct = (product: Product, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const confirmed = window.confirm(`[상품 삭제 확인]\n\n'${product.title}' 상품을 삭제하시겠습니까?`);
    if (confirmed) {
      executeDeleteProduct(product);
    }
  };

  const executeDeleteProduct = async (target: Product) => {
    const prodId = target.id;
    const updated = products.filter(item => item.id !== prodId);
    setProducts(updated);
    try {
      localStorage.setItem('mango_products_db', JSON.stringify(updated));
    } catch (e) {
      console.warn("Failed to write products to localStorage:", e);
    }
    if (editingProductId === prodId) {
      setEditingProductId(null);
    }
    setProductToDelete(null);
    showToast(`🗑️ '${target.title}' 상품이 삭제되었습니다.`);
    try {
      await supabaseService.syncCollection('products', updated);
    } catch (e) {
      console.warn("Supabase sync failed for product delete:", e);
    }
  };

  const handleConfirmDeleteProduct = async () => {
    if (!productToDelete) return;
    await executeDeleteProduct(productToDelete);
  };

  // --- Custom Trip Packages (4박 5일 골프 여행 상품) Handlers ---
  const handlePackageFieldChange = (pkgId: string, field: keyof CustomTripPackage, value: any) => {
    if (!setCustomPackages) return;
    const updated = customPackages.map(pkg => pkg.id === pkgId ? { ...pkg, [field]: value } : pkg);
    setCustomPackages(updated);
    if (editingPackage && editingPackage.id === pkgId) {
      setEditingPackage({ ...editingPackage, [field]: value });
    }
  };

  const handlePackageOptionChange = (pkgId: string, optIndex: number, field: keyof PackageOptionItem, value: any) => {
    if (!setCustomPackages) return;
    const pkg = customPackages.find(p => p.id === pkgId);
    if (!pkg) return;
    const newOptions = [...pkg.options];
    newOptions[optIndex] = { ...newOptions[optIndex], [field]: value };
    
    // Auto-calculate basePriceUSD if option price changes
    const newBasePrice = newOptions.reduce((sum, opt) => opt.isDefaultIncluded ? sum + (opt.priceUSD || 0) : sum, 0);
    
    const updated = customPackages.map(p => p.id === pkgId ? { ...p, options: newOptions, basePriceUSD: newBasePrice } : p);
    setCustomPackages(updated);
    if (editingPackage && editingPackage.id === pkgId) {
      setEditingPackage({ ...editingPackage, options: newOptions, basePriceUSD: newBasePrice });
    }
  };

  const handlePackageOptionAdd = (pkgId: string) => {
    if (!setCustomPackages) return;
    const pkg = customPackages.find(p => p.id === pkgId);
    if (!pkg) return;
    const newOption: PackageOptionItem = {
      id: `opt-${Date.now()}`,
      category: 'golf',
      name: '새 맞춤 옵션 항목',
      description: '옵션에 대한 상세 설명을 입력하세요.',
      priceUSD: 100,
      isDefaultIncluded: true,
      isRequired: false
    };
    const newOptions = [...pkg.options, newOption];
    const newBasePrice = newOptions.reduce((sum, opt) => opt.isDefaultIncluded ? sum + (opt.priceUSD || 0) : sum, 0);
    const updated = customPackages.map(p => p.id === pkgId ? { ...p, options: newOptions, basePriceUSD: newBasePrice } : p);
    setCustomPackages(updated);
    if (editingPackage && editingPackage.id === pkgId) {
      setEditingPackage({ ...editingPackage, options: newOptions, basePriceUSD: newBasePrice });
    }
  };

  const handlePackageOptionRemove = (pkgId: string, optIndex: number) => {
    if (!setCustomPackages) return;
    const pkg = customPackages.find(p => p.id === pkgId);
    if (!pkg) return;
    const newOptions = pkg.options.filter((_, i) => i !== optIndex);
    const newBasePrice = newOptions.reduce((sum, opt) => opt.isDefaultIncluded ? sum + (opt.priceUSD || 0) : sum, 0);
    const updated = customPackages.map(p => p.id === pkgId ? { ...p, options: newOptions, basePriceUSD: newBasePrice } : p);
    setCustomPackages(updated);
    if (editingPackage && editingPackage.id === pkgId) {
      setEditingPackage({ ...editingPackage, options: newOptions, basePriceUSD: newBasePrice });
    }
  };

  const handlePackageItineraryDayAdd = (pkgId: string) => {
    if (!setCustomPackages) return;
    const pkg = customPackages.find(p => p.id === pkgId);
    if (!pkg) return;
    const currentItin = pkg.itinerary || [];
    const newDay = currentItin.length + 1;
    const newItinerary = [
      ...currentItin, 
      { 
        day: newDay, 
        title: `Day ${newDay} 라운딩 및 자유일정`, 
        activities: ['조식 후 골프장 이동', `Day ${newDay} 18홀 라운딩`, '석식 및 자유시간'] 
      }
    ];
    handlePackageFieldChange(pkgId, 'itinerary', newItinerary);
  };

  const handlePackageItineraryDayRemove = (pkgId: string, dayIdx: number) => {
    if (!setCustomPackages) return;
    const pkg = customPackages.find(p => p.id === pkgId);
    if (!pkg || !pkg.itinerary) return;
    if (pkg.itinerary.length <= 1) {
      alert('일정표에는 최소 1개 이상의 일차가 있어야 합니다.');
      return;
    }
    if (!confirm(`Day ${dayIdx + 1} 일차 일정을 삭제하시겠습니까?`)) return;
    const newItinerary = pkg.itinerary.filter((_, i) => i !== dayIdx).map((d, i) => ({ ...d, day: i + 1 }));
    handlePackageFieldChange(pkgId, 'itinerary', newItinerary);
  };

  const handlePackageItineraryDayMove = (pkgId: string, dayIdx: number, direction: 'up' | 'down') => {
    if (!setCustomPackages) return;
    const pkg = customPackages.find(p => p.id === pkgId);
    if (!pkg || !pkg.itinerary) return;
    const targetIdx = direction === 'up' ? dayIdx - 1 : dayIdx + 1;
    if (targetIdx < 0 || targetIdx >= pkg.itinerary.length) return;
    
    const newItinerary = [...pkg.itinerary];
    const temp = newItinerary[dayIdx];
    newItinerary[dayIdx] = newItinerary[targetIdx];
    newItinerary[targetIdx] = temp;
    
    const renumbered = newItinerary.map((d, i) => ({ ...d, day: i + 1 }));
    handlePackageFieldChange(pkgId, 'itinerary', renumbered);
  };

  const handlePackageQuickDayAdjust = (pkgId: string, targetDays: number, durName?: string) => {
    if (!setCustomPackages) return;
    const pkg = customPackages.find(p => p.id === pkgId);
    if (!pkg) return;
    const current = pkg.itinerary || [];
    let updatedItinerary = [...current];

    if (current.length < targetDays) {
      for (let i = current.length + 1; i <= targetDays; i++) {
        updatedItinerary.push({
          day: i,
          title: i === targetDays ? '체크아웃 & 공항 샌딩' : `Day ${i} 라운딩 및 투어`,
          activities: i === targetDays ? ['호텔 체크아웃 및 쇼핑', '공항 전용 샌딩'] : ['조식 후 골프장 이동', `Day ${i} 18홀 라운딩`, '석식 및 자유시간']
        });
      }
    } else if (current.length > targetDays) {
      if (!confirm(`현재 ${current.length}일차 일정을 ${targetDays}일차 일정으로 줄이시겠습니까? (초과된 ${current.length - targetDays}개 일차는 삭제됩니다)`)) {
        return;
      }
      updatedItinerary = updatedItinerary.slice(0, targetDays);
    }

    const updated = customPackages.map(p => {
      if (p.id === pkgId) {
        return {
          ...p,
          itinerary: updatedItinerary,
          duration: durName || p.duration
        };
      }
      return p;
    });

    setCustomPackages(updated);
    if (editingPackage && editingPackage.id === pkgId) {
      setEditingPackage({
        ...editingPackage,
        itinerary: updatedItinerary,
        duration: durName || editingPackage.duration
      });
    }
  };

  const handlePackageItineraryTitleChange = (pkgId: string, dayIdx: number, title: string) => {
    if (!setCustomPackages) return;
    const pkg = customPackages.find(p => p.id === pkgId);
    if (!pkg || !pkg.itinerary) return;
    const newItinerary = [...pkg.itinerary];
    newItinerary[dayIdx] = { ...newItinerary[dayIdx], title };
    handlePackageFieldChange(pkgId, 'itinerary', newItinerary);
  };

  const handlePackageItineraryActivityChange = (pkgId: string, dayIdx: number, actIdx: number, text: string) => {
    if (!setCustomPackages) return;
    const pkg = customPackages.find(p => p.id === pkgId);
    if (!pkg || !pkg.itinerary) return;
    const newItinerary = [...pkg.itinerary];
    const newActs = [...newItinerary[dayIdx].activities];
    newActs[actIdx] = text;
    newItinerary[dayIdx] = { ...newItinerary[dayIdx], activities: newActs };
    handlePackageFieldChange(pkgId, 'itinerary', newItinerary);
  };

  const handlePackageItineraryActivityAdd = (pkgId: string, dayIdx: number) => {
    if (!setCustomPackages) return;
    const pkg = customPackages.find(p => p.id === pkgId);
    if (!pkg || !pkg.itinerary) return;
    const newItinerary = [...pkg.itinerary];
    newItinerary[dayIdx] = { ...newItinerary[dayIdx], activities: [...newItinerary[dayIdx].activities, '새 세부 일정 활동 입력'] };
    handlePackageFieldChange(pkgId, 'itinerary', newItinerary);
  };

  const handlePackageItineraryActivityRemove = (pkgId: string, dayIdx: number, actIdx: number) => {
    if (!setCustomPackages) return;
    const pkg = customPackages.find(p => p.id === pkgId);
    if (!pkg || !pkg.itinerary) return;
    const newItinerary = [...pkg.itinerary];
    newItinerary[dayIdx] = { ...newItinerary[dayIdx], activities: newItinerary[dayIdx].activities.filter((_, i) => i !== actIdx) };
    handlePackageFieldChange(pkgId, 'itinerary', newItinerary);
  };

  const handleAddNewCustomPackage = () => {
    if (!setCustomPackages) return;
    const newPkg: CustomTripPackage = {
      id: `custom-pkg-${Date.now()}`,
      title: '베트남 신규 맞춤 골프 투어',
      subtitle: '명문 골프 코스와 최고급 호텔에서 즐기는 프라이빗 투어',
      location: '호치민',
      duration: '4박 5일',
      golfCourses: ['떤선녓 CC (18홀)', '롱탄 CC (18홀)', '트윈도브스 CC (18홀)'],
      basePriceUSD: 910,
      image: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?q=80&w=1200',
      summary: '원하는 골프장과 숙소, 옵션을 내 맘대로 조합하는 맞춤형 패키지',
      highlightBadges: ['54홀 라운딩', '전용 리무진 밴', '고급 호텔'],
      itinerary: [
        { day: 1, title: '공항 도착 & 호텔 체크인', activities: ['공항 전용 픽업', '호텔 체크인 및 시내 자유시간'] },
        { day: 2, title: '18홀 라운딩', activities: ['조식 후 골프장 이동', '18홀 라운딩', '석식 및 자유시간'] },
        { day: 3, title: '18홀 라운딩', activities: ['18홀 챔피언십 코스', '클럽하우스 중식', '스파 마사지'] },
        { day: 4, title: '18홀 라운딩', activities: ['18홀 라운딩', '특식 석식'] },
        { day: 5, title: '체크아웃 & 시내 관광 후 공항 샌딩', activities: ['체크아웃 및 시내 쇼핑', '공항 전용 샌딩'] },
      ],
      options: [
        { id: `opt-${Date.now()}-1`, category: 'golf', name: '3회 그린피 (54홀)', description: '전 일정 54홀 그린피', priceUSD: 450, isDefaultIncluded: true, isRequired: true },
        { id: `opt-${Date.now()}-4`, category: 'hotel', name: '고급 호텔 (4박 1인 객실 기준)', description: '시내 중심 고급 특급 호텔 (1인 1실 단독 객실)', priceUSD: 320, isDefaultIncluded: true, isRequired: false },
        { id: `opt-${Date.now()}-5`, category: 'vehicle', name: '전용 VIP 리무진 밴 (전 일정)', description: '공항/골프장 전용 기사 포함', priceUSD: 140, isDefaultIncluded: true, isRequired: false },
      ]
    };
    const updated = [newPkg, ...customPackages];
    setCustomPackages(updated);
    setEditingPackage(newPkg);
    setPackageModalTab('basic');
    showToast('✨ 새 맞춤 여행 상품이 생성되었습니다.');
  };

  // Master Pool Handlers
  const handleUpdateMasterOptionPoolItem = (
    category: 'region' | 'golf' | 'tour' | 'hotel' | 'hotelTier' | 'vehicle' | 'extra' | 'guide' | 'meal',
    id: string,
    field: string,
    value: any
  ) => {
    if (!setMasterOptionPool) return;
    const pool = { ...masterOptionPool };
    if (category === 'region') {
      const list = pool.diyRegions || INITIAL_MASTER_OPTION_POOL.diyRegions || [];
      pool.diyRegions = list.map(item => item.id === id ? { ...item, [field]: value } : item);
    } else if (category === 'golf') {
      pool.golfCourses = pool.golfCourses.map(item => item.id === id ? { ...item, [field]: value } : item);
    } else if (category === 'tour') {
      const list = pool.tourOptions || INITIAL_MASTER_OPTION_POOL.tourOptions || [];
      pool.tourOptions = list.map(item => item.id === id ? { ...item, [field]: value } : item);
    } else if (category === 'hotelTier') {
      const list = pool.accommodationTiers || INITIAL_MASTER_OPTION_POOL.accommodationTiers || [];
      pool.accommodationTiers = list.map(item => item.id === id ? { ...item, [field]: value } : item);
    } else if (category === 'hotel') {
      pool.accommodations = pool.accommodations.map(item => item.id === id ? { ...item, [field]: value } : item);
    } else if (category === 'vehicle') {
      pool.vehicles = pool.vehicles.map(item => item.id === id ? { ...item, [field]: value } : item);
    } else if (category === 'extra') {
      const list = pool.extraServices || INITIAL_MASTER_OPTION_POOL.extraServices || [];
      pool.extraServices = list.map(item => item.id === id ? { ...item, [field]: value } : item);
    } else if (category === 'guide') {
      pool.guides = pool.guides.map(item => item.id === id ? { ...item, [field]: value } : item);
    } else if (category === 'meal') {
      pool.meals = pool.meals.map(item => item.id === id ? { ...item, [field]: value } : item);
    }
    setMasterOptionPool(pool);
    try {
      localStorage.setItem('mango_master_options_pool_db', JSON.stringify(pool));
    } catch (e) {
      console.warn("Storage error", e);
    }
    showToast('💾 변경사항이 저장되었습니다.');
  };

  const ICON_PRESETS_BY_CATEGORY: Record<'region' | 'hotelTier' | 'vehicle' | 'extra', string[]> = {
    region: ['🏙️', '🌊', '🏜️', '🏝️', '🌲', '🌴', '⛳', '🏌️', '🏖️', '⛰️', '🌅', '🌄', '🌇', '🌃', '⛱️', '🌺', '🥥', '🍍', '🦩', '🛥️', '✈️', '🏰', '🎡', '🪷', '🏯'],
    hotelTier: ['⭐', '🏨', '🏡', '🏢', '🏖️', '🏰', '🛏️', '🌴', '🏊', '✨', '💎', '👑'],
    vehicle: ['🚐', '🚙', '🚗', '🚌', '🚎', '🚖', '🚘', '🏎️', '✈️', '🛥️', '🚁'],
    extra: ['👨‍💼', '⚡', '💆', '✨', '🎁', '🍽️', '🥂', '⛳', '🛡️', '🎫', '📸', '🧳', '🎧']
  };

  const openIconPicker = (
    mode: 'pool' | 'newPoolItem',
    category: 'region' | 'hotelTier' | 'vehicle' | 'extra',
    id: string | undefined,
    label: string,
    currentIcon: string
  ) => {
    setIconCustomInput(currentIcon || '');
    setIconPickerTarget({ mode, category, id, label, currentIcon });
  };

  const applyPickedIcon = (newIconValue: string) => {
    if (!iconPickerTarget) return;
    const cleaned = newIconValue.trim();
    if (!cleaned) return;
    if (iconPickerTarget.mode === 'newPoolItem') {
      setNewPoolItem(prev => ({ ...prev, icon: cleaned }));
    } else if (iconPickerTarget.id) {
      handleUpdateMasterOptionPoolItem(iconPickerTarget.category, iconPickerTarget.id, 'icon', cleaned);
    }
    setIconPickerTarget(null);
  };

  const handleDeleteMasterOptionPoolItem = (
    category: 'region' | 'golf' | 'tour' | 'hotel' | 'hotelTier' | 'vehicle' | 'extra' | 'guide' | 'meal',
    id: string,
    itemName: string
  ) => {
    if (!window.confirm(`[맞춤 풀 항목 삭제]\n\n'${itemName}' 항목을 삭제하시겠습니까?`)) return;
    if (!setMasterOptionPool) return;
    const pool = { ...masterOptionPool };
    if (category === 'region') {
      pool.diyRegions = (pool.diyRegions || INITIAL_MASTER_OPTION_POOL.diyRegions || []).filter(item => item.id !== id);
    } else if (category === 'golf') {
      pool.golfCourses = pool.golfCourses.filter(item => item.id !== id);
    } else if (category === 'tour') {
      pool.tourOptions = (pool.tourOptions || INITIAL_MASTER_OPTION_POOL.tourOptions || []).filter(item => item.id !== id);
    } else if (category === 'hotelTier') {
      pool.accommodationTiers = (pool.accommodationTiers || INITIAL_MASTER_OPTION_POOL.accommodationTiers || []).filter(item => item.id !== id);
    } else if (category === 'hotel') {
      pool.accommodations = pool.accommodations.filter(item => item.id !== id);
    } else if (category === 'vehicle') {
      pool.vehicles = pool.vehicles.filter(item => item.id !== id);
    } else if (category === 'extra') {
      pool.extraServices = (pool.extraServices || INITIAL_MASTER_OPTION_POOL.extraServices || []).filter(item => item.id !== id);
    } else if (category === 'guide') {
      pool.guides = pool.guides.filter(item => item.id !== id);
    } else if (category === 'meal') {
      pool.meals = pool.meals.filter(item => item.id !== id);
    }
    setMasterOptionPool(pool);
    try {
      localStorage.setItem('mango_master_options_pool_db', JSON.stringify(pool));
    } catch (e) {
      console.warn("Storage error", e);
    }
    showToast(`🗑️ '${itemName}' 항목이 삭제되었습니다.`);
  };

  const handleAddNewPoolItemSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPoolItem.name.trim()) {
      alert('항목 이름을 입력해주세요.');
      return;
    }
    if (!setMasterOptionPool) return;
    const pool = { ...masterOptionPool };
    const newItemId = `pool-${Date.now()}`;

    if (newPoolItem.category === 'region') {
      const current = pool.diyRegions || INITIAL_MASTER_OPTION_POOL.diyRegions || [];
      pool.diyRegions = [
        ...current,
        {
          id: `reg-${Date.now()}`,
          name: newPoolItem.name.trim(),
          subtitle: newPoolItem.description || '맞춤 골프 & 투어 지역',
          icon: newPoolItem.icon || '🌴',
          baseFeeUSD: Number(newPoolItem.priceUSD ?? newPoolItem.priceDeltaUSD) || 0,
        }
      ];
    } else if (newPoolItem.category === 'golf') {
      pool.golfCourses = [
        {
          id: newItemId,
          name: newPoolItem.name,
          location: newPoolItem.location || '호치민',
          holes: newPoolItem.holes || 18,
          priceUSD: Number(newPoolItem.priceUSD) || 150,
          priceDeltaUSD: Number(newPoolItem.priceDeltaUSD) || 0,
          description: newPoolItem.description || '',
          badge: newPoolItem.badge || ''
        },
        ...pool.golfCourses
      ];
    } else if (newPoolItem.category === 'tour') {
      const current = pool.tourOptions || INITIAL_MASTER_OPTION_POOL.tourOptions || [];
      pool.tourOptions = [
        {
          id: `tour-${Date.now()}`,
          name: newPoolItem.name,
          location: newPoolItem.location || '전체',
          priceUSD: Number(newPoolItem.priceUSD) || 0,
          description: newPoolItem.description || '',
          badge: newPoolItem.badge || '',
          isFreeTravel: !!newPoolItem.isFreeTravel,
        },
        ...current
      ];
    } else if (newPoolItem.category === 'hotelTier') {
      const current = pool.accommodationTiers || INITIAL_MASTER_OPTION_POOL.accommodationTiers || [];
      pool.accommodationTiers = [
        ...current,
        {
          id: `tier-${Date.now()}`,
          name: newPoolItem.name,
          pricePerNightUSD: Number(newPoolItem.priceUSD) || 90,
          description: newPoolItem.description || '',
          icon: newPoolItem.icon || '🏨',
          badge: newPoolItem.badge || ''
        }
      ];
    } else if (newPoolItem.category === 'hotel') {
      pool.accommodations = [
        {
          id: newItemId,
          name: newPoolItem.name,
          location: newPoolItem.location || '호치민',
          type: newPoolItem.type || 'hotel_5star',
          priceDeltaUSD: Number(newPoolItem.priceDeltaUSD) || 0,
          description: newPoolItem.description || '',
          badge: newPoolItem.badge || ''
        },
        ...pool.accommodations
      ];
    } else if (newPoolItem.category === 'vehicle') {
      pool.vehicles = [
        ...pool.vehicles,
        {
          id: newItemId,
          shortName: newPoolItem.shortName || newPoolItem.name.slice(0, 6),
          name: newPoolItem.name,
          pricePerDayUSD: Number(newPoolItem.priceUSD) || 25,
          priceDeltaUSD: Number(newPoolItem.priceDeltaUSD) || 0,
          description: newPoolItem.description || '',
          icon: newPoolItem.icon || '🚐',
          badge: newPoolItem.badge || ''
        }
      ];
    } else if (newPoolItem.category === 'extra') {
      const current = pool.extraServices || INITIAL_MASTER_OPTION_POOL.extraServices || [];
      pool.extraServices = [
        ...current,
        {
          id: `extra-${Date.now()}`,
          name: newPoolItem.name,
          priceUSD: Number(newPoolItem.priceUSD) || 50,
          pricingUnit: newPoolItem.pricingUnit || 'per_person',
          description: newPoolItem.description || '',
          icon: newPoolItem.icon || '✨',
          badge: newPoolItem.badge || '',
          defaultSelected: false
        }
      ];
    } else if (newPoolItem.category === 'guide') {
      pool.guides = [
        {
          id: newItemId,
          name: newPoolItem.name,
          priceDeltaUSD: Number(newPoolItem.priceDeltaUSD) || 0,
          description: newPoolItem.description || '',
          badge: newPoolItem.badge || ''
        },
        ...pool.guides
      ];
    } else if (newPoolItem.category === 'meal') {
      pool.meals = [
        {
          id: newItemId,
          name: newPoolItem.name,
          priceDeltaUSD: Number(newPoolItem.priceDeltaUSD) || 0,
          description: newPoolItem.description || '',
          badge: newPoolItem.badge || ''
        },
        ...pool.meals
      ];
    }
    setMasterOptionPool(pool);
    try {
      localStorage.setItem('mango_master_options_pool_db', JSON.stringify(pool));
    } catch (e) {
      console.warn("Storage error", e);
    }
    setShowAddPoolModal(false);
    setNewPoolItem({
      category: 'golf',
      name: '',
      shortName: '',
      icon: '✨',
      location: '호치민',
      holes: 18,
      type: 'hotel_5star',
      priceUSD: 150,
      priceDeltaUSD: 0,
      pricingUnit: 'per_person',
      isFreeTravel: false,
      description: '',
      badge: ''
    });
    showToast('✨ 새 맞춤 옵션 항목이 풀(Pool)에 추가되었습니다.');
  };

  const handleResetMasterOptionPool = () => {
    if (!window.confirm('DIY 맞춤 옵션 풀(지역 5곳, 골프장, 여행/자유여행, 숙박 4종, 차량 4종, 기타 3종)을 기본 표준 데이터로 복원하시겠습니까?')) return;
    if (setMasterOptionPool) {
      setMasterOptionPool(INITIAL_MASTER_OPTION_POOL);
      try {
        localStorage.setItem('mango_master_options_pool_db', JSON.stringify(INITIAL_MASTER_OPTION_POOL));
      } catch (e) {
        console.warn("Storage error", e);
      }
    }
    showToast('🔄 맞춤 옵션 풀(Pool)이 기본 표준 데이터로 복원되었습니다.');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleDeletePackage = (pkg: CustomTripPackage, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    const confirmed = window.confirm(`[맞춤 여행 상품 삭제 확인]\n\n'${pkg.title}' (${pkg.location} / ${pkg.duration}) 상품을 삭제하시겠습니까?`);
    if (confirmed) {
      executeDeletePackage(pkg);
    }
  };

  const executeDeletePackage = async (target: CustomTripPackage) => {
    if (!setCustomPackages) return;
    const pkgId = target.id;
    const updated = customPackages.filter(p => p.id !== pkgId);
    
    // 1. React State 즉시 반영
    setCustomPackages(updated);
    
    // 2. LocalStorage 즉시 영구 저장
    try {
      localStorage.setItem('mango_custom_packages_db', JSON.stringify(updated));
    } catch (e) {
      console.warn("Failed to write to localStorage:", e);
    }

    // 3. 편집 모달 열려있으면 닫기
    if (editingPackage && editingPackage.id === pkgId) {
      setEditingPackage(null);
    }
    
    // 4. 모달 닫기 및 알림
    setPackageToDelete(null);
    showToast(`🗑️ '${target.title}' 상품이 성공적으로 삭제되었습니다.`);

    // 5. Supabase 실시간 동기화
    try {
      await supabaseService.syncCollection('custom_packages', updated);
    } catch (e) {
      console.warn("Supabase package sync failed:", e);
    }
  };

  const handleRequestDeletePackage = (pkg: CustomTripPackage) => {
    setPackageToDelete(pkg);
  };

  const handleConfirmDeletePackage = async () => {
    if (!packageToDelete) return;
    await executeDeletePackage(packageToDelete);
  };

  const handleConfirmResetPackages = () => {
    if (!setCustomPackages) return;
    setCustomPackages(INITIAL_CUSTOM_PACKAGES);
    try {
      localStorage.setItem('mango_custom_packages_db', JSON.stringify(INITIAL_CUSTOM_PACKAGES));
    } catch (e) {
      console.warn("Failed to write to localStorage:", e);
    }
    setEditingPackage(null);
    setShowResetPackageModal(false);
    showToast('🔄 기본 맞춤 여행 상품 목록으로 복구되었습니다.');
  };

  // --- Page Handlers ---
  const handlePageFieldChange = async (field: keyof PageContent, value: any) => {
    const previousPageForm = { ...pageForm };
    const previousPageContents = { ...pageContents };
    
    try {
      const updated = { ...pageForm, [field]: value };
      setPageForm(updated);
      await setPageContents({ ...pageContents, [selectedPageId]: updated });
    } catch (error) {
      console.error("Failed to update page content:", error);
      // Restore previous state on error
      setPageForm(previousPageForm);
      setPageContents(previousPageContents);
      alert('데이터 저장 중 오류가 발생했습니다. 이전 상태로 복구합니다.');
    }
  };

  const handleSectionChange = (index: number, field: keyof PageSection, value: any) => {
    const newSections = [...pageForm.sections];
    newSections[index] = { ...newSections[index], [field]: value };
    handlePageFieldChange('sections', newSections);
  };

  const handleSectionDetailImageAdd = (sectionIdx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileUpload(e, (url) => {
      const newSections = [...pageForm.sections];
      const detailImages = [...(newSections[sectionIdx].detailImages || [])];
      detailImages.push(url);
      newSections[sectionIdx] = { ...newSections[sectionIdx], detailImages };
      handlePageFieldChange('sections', newSections);
    });
  };

  const handleSectionDetailImageRemove = (sectionIdx: number, imageIdx: number) => {
    const newSections = [...pageForm.sections];
    const detailImages = (newSections[sectionIdx].detailImages || []).filter((_, i) => i !== imageIdx);
    newSections[sectionIdx] = { ...newSections[sectionIdx], detailImages };
    handlePageFieldChange('sections', newSections);
  };

  const handlePageSlideAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileUpload(e, (url) => {
      const newSlides = [...(pageForm.slides || []), { image: url, description: '' }];
      handlePageFieldChange('slides', newSlides);
    });
  };

  const handlePageSlideRemove = (idx: number) => {
    const newSlides = (pageForm.slides || []).filter((_, i) => i !== idx);
    handlePageFieldChange('slides', newSlides);
  };

  const handlePageSlideChange = (idx: number, field: keyof PageSlide, value: string) => {
    const newSlides = [...(pageForm.slides || [])];
    newSlides[idx] = { ...newSlides[idx], [field]: value };
    handlePageFieldChange('slides', newSlides);
  };

  const handleAddSection = () => {
    const newSections = [...pageForm.sections, { title: '새 섹션 제목', content: '새 섹션 내용을 입력하세요.' }];
    handlePageFieldChange('sections', newSections);
  };

  const handleRemoveSection = (index: number) => {
    if (!window.confirm('이 섹션을 삭제하시겠습니까?')) return;
    const newSections = pageForm.sections.filter((_, i) => i !== index);
    handlePageFieldChange('sections', newSections);
  };

  const handleRemoveGalleryImage = (index: number) => {
    if (!confirm('이 이미지를 삭제하시겠습니까?')) return;
    const newGallery = pageForm.galleryImages.filter((_, i) => i !== index);
    handlePageFieldChange('galleryImages', newGallery);
  };

  const handlePopupChange = (field: keyof PopupNotification, value: any) => {
    setPopup({ ...popup, [field]: value });
  };

  const handlePopupZoomIn = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setPopupZoom(prev => Math.min(prev + 0.25, 3));
  };

  const handlePopupZoomOut = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setPopupZoom(prev => {
      const next = Math.max(prev - 0.25, 1);
      if (next === 1) setPopupPan({ x: 0, y: 0 });
      return next;
    });
  };

  const handlePopupResetZoom = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setPopupZoom(1);
    setPopupPan({ x: 0, y: 0 });
  };

  const handlePopupMouseDown = (e: React.MouseEvent) => {
    if (popupZoom <= 1) return;
    setIsPopupDragging(true);
    popupDragStartRef.current = { x: e.clientX - popupPan.x, y: e.clientY - popupPan.y };
  };

  const handlePopupMouseMove = (e: React.MouseEvent) => {
    if (!isPopupDragging || popupZoom <= 1) return;
    setPopupPan({
      x: e.clientX - popupDragStartRef.current.x,
      y: e.clientY - popupDragStartRef.current.y
    });
  };

  const handlePopupMouseUp = () => setIsPopupDragging(false);

  const handlePopupApplyUrl = () => {
    if (!popupUrlInput.trim()) {
      alert('이미지 URL을 입력해주세요.');
      return;
    }
    handlePopupChange('image', popupUrlInput.trim());
    setShowPopupUrlModal(false);
    setPopupUrlInput('');
    showToast('✨ 팝업 이미지가 적용되었습니다.');
  };


  const handleSaveCloudinaryConfig = async () => {
    localStorage.setItem('cloudinary_cloud_name', cloudName);
    localStorage.setItem('cloudinary_upload_preset', uploadPreset);
    setCloudinaryConfig(cloudName, uploadPreset);
    
    // Supabase 클라우드에도 저장하여 다른 컴퓨터에서 접속 시 자동으로 적용되도록 함
    try {
      await supabaseService.saveCloudinaryConfig(cloudName, uploadPreset);
      alert('✅ Cloudinary 이미지 서버 설정이 저장되었습니다!\n\n클라우드(Supabase)에도 동기화되어 이제 다른 컴퓨터 및 모바일 기기에서도 동일한 이미지 서버가 자동으로 적용됩니다.');
    } catch (e) {
      alert('Cloudinary 설정이 로컬에 저장되었습니다.');
    }
    setShowCloudinaryConfig(false);
  };

  const handleSaveSupabaseConfig = () => {
    const success = updateSupabaseCredentials(sbUrl, sbAnonKey);
    if (success) {
      alert('✅ Supabase 연결 설정이 저장되었습니다!\n\n페이지가 새로고침되며 Supabase 클라우드 데이터와 연동됩니다.');
      window.location.reload();
    } else {
      alert('⚠️ 설정이 로컬에 저장되었습니다. 올바른 URL(https://...)과 Anon Key를 입력했는지 확인해주세요.');
    }
  };

  const handleCopySupabaseSql = () => {
    const sqlText = `-- 망고투어 (MANGO TOUR) Supabase 테이블 원클릭 생성 SQL
CREATE TABLE IF NOT EXISTS public.settings (id TEXT PRIMARY KEY, hero_images JSONB, menu_items JSONB, cloudinary_config JSONB, updated_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS public.products (id TEXT PRIMARY KEY, data JSONB NOT NULL, updated_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS public.videos (id TEXT PRIMARY KEY, data JSONB NOT NULL, updated_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS public.posts (id TEXT PRIMARY KEY, data JSONB NOT NULL, updated_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS public.pages (id TEXT PRIMARY KEY, data JSONB NOT NULL, updated_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS public.popup (id TEXT PRIMARY KEY, data JSONB NOT NULL, updated_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS public.custom_packages (id TEXT PRIMARY KEY, data JSONB NOT NULL, updated_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS public.chat_messages (id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY, sender TEXT NOT NULL, text TEXT NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS public.inquiries (id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY, data JSONB NOT NULL, created_at TIMESTAMPTZ DEFAULT NOW());
CREATE TABLE IF NOT EXISTS public.users (id TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL, nickname TEXT, role TEXT DEFAULT 'user', password_hash TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW());

INSERT INTO public.users (id, username, nickname, role, password_hash)
VALUES ('admin_primary', 'admin', '관리자', 'admin', encode('rlathdud1~'::bytea, 'base64'))
ON CONFLICT (username) DO NOTHING;

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.popup ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN CREATE POLICY "Public full access to settings" ON public.settings FOR ALL USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Public full access to products" ON public.products FOR ALL USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Public full access to videos" ON public.videos FOR ALL USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Public full access to posts" ON public.posts FOR ALL USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Public full access to pages" ON public.pages FOR ALL USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Public full access to popup" ON public.popup FOR ALL USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Public full access to custom_packages" ON public.custom_packages FOR ALL USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Public full access to chat_messages" ON public.chat_messages FOR ALL USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Public full access to inquiries" ON public.inquiries FOR ALL USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE POLICY "Public full access to users" ON public.users FOR ALL USING (true) WITH CHECK (true); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(sqlText).then(() => {
        alert('📋 Supabase 원클릭 테이블 생성 SQL이 복사되었습니다!\n\nSupabase 대시보드 -> [SQL Editor] -> [New Query]에 붙여넣고 [Run]을 누르시면 모든 테이블이 3초 만에 생성됩니다.');
      });
    } else {
      prompt('아래 SQL 코드를 복사하여 Supabase SQL Editor에서 실행하세요:', sqlText);
    }
  };

  const handleSeedAllToSupabase = async () => {
    const currentUrl = (sbUrl || localStorage.getItem('sb_url') || (import.meta as any).env?.VITE_SUPABASE_URL || '').trim();
    const currentKey = (sbAnonKey || localStorage.getItem('sb_anon_key') || (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '').trim();

    if (!currentUrl || !currentKey || !currentUrl.startsWith('https://')) {
      alert('⚠️ Supabase 연결 정보(URL 및 Key)가 아직 입력되지 않았습니다.\n\n위의 [Project URL (API URL)] 칸에 https://로 시작하는 주소와\n[Anon Public Key] 칸에 anon 키를 입력하신 후 다시 클릭해 주세요.');
      return;
    }

    // 자동으로 자격 증명 갱신 및 연결
    updateSupabaseCredentials(currentUrl, currentKey);

    if (!confirm('현재 웹사이트의 모든 상품, 골프/호텔 페이지 이미지, 메인 슬라이드, 메뉴, 맞춤 여행 패키지 데이터를 Supabase 클라우드로 일괄 전송하시겠습니까?\n\n(Supabase에 데이터가 성공적으로 채워지면 전 세계 모든 고객에게 실시간 반영됩니다)')) {
      return;
    }
    
    setIsSeedingSupabase(true);
    try {
      await supabaseService.seedAllToSupabase({
        products,
        videos,
        posts,
        customPackages,
        heroImages,
        menuItems,
        cloudinaryConfig: { cloudName, uploadPreset },
        popup,
        pageContents
      });
      alert('🎉 축하합니다! 웹사이트의 모든 상품/투어/페이지/슬라이드 데이터가 Supabase 클라우드로 성공적으로 저장되었습니다.\n\n이제 www.mangotour.co.kr에 접속하는 모든 고객이 이 클라우드 데이터를 실시간으로 보게 됩니다.');
    } catch (e: any) {
      console.error("Supabase seed error:", e);
      alert('❌ 전송 실패: ' + (e?.message || e) + '\n\n테이블이 아직 생성되지 않았다면, 위의 [📋 원클릭 테이블 생성 SQL 복사] 버튼을 누른 후 Supabase 콘솔 SQL Editor에서 Run을 먼저 실행해 주세요.');
    } finally {
      setIsSeedingSupabase(false);
    }
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword.trim()) {
      alert('아이디와 비밀번호를 입력해주세요.');
      return;
    }
    const cleanUsername = newUsername.trim();
    if (users.some(u => u.username === cleanUsername)) {
      alert('이미 존재하는 아이디입니다.');
      return;
    }

    const newUser: User = {
      id: `u_${Date.now()}`,
      username: cleanUsername,
      role: newRole,
      nickname: newNickname.trim() || cleanUsername
    };

    const nextUsers = [...users, newUser];
    if (onUpdateUsers) onUpdateUsers(nextUsers);
    try {
      localStorage.setItem('mango_users_db', JSON.stringify(nextUsers));
    } catch {}

    try {
      await supabaseService.saveUser(newUser, newPassword);
      showToast(`✅ '${cleanUsername}' 회원이 등록되었습니다.`);
    } catch (err) {
      console.warn("Supabase user save notice:", err);
    }

    setShowAddUserModal(false);
    setNewUsername('');
    setNewPassword('');
    setNewNickname('');
    setNewRole('user');
  };

  const handleToggleUserRole = async (targetUser: User) => {
    if (targetUser.username === 'admin') {
      alert('기본 최고 관리자(admin)의 권한은 변경할 수 없습니다.');
      return;
    }
    const nextRole: 'admin' | 'user' = targetUser.role === 'admin' ? 'user' : 'admin';
    const nextUsers = users.map(u => u.id === targetUser.id ? { ...u, role: nextRole } : u);
    if (onUpdateUsers) onUpdateUsers(nextUsers);
    try {
      localStorage.setItem('mango_users_db', JSON.stringify(nextUsers));
    } catch {}

    try {
      await supabaseService.updateUserRole(targetUser.id, nextRole);
      showToast(`'${targetUser.username}' 회원의 권한이 [${nextRole.toUpperCase()}]로 변경되었습니다.`);
    } catch (err) {
      console.warn("Supabase user role update notice:", err);
    }
  };

  const handleDeleteUser = async (targetUser: User) => {
    if (targetUser.username === 'admin') {
      alert('기본 최고 관리자(admin) 계정은 삭제할 수 없습니다.');
      return;
    }
    if (!confirm(`'${targetUser.username}' (${targetUser.nickname || '회원'}) 계정을 정말 삭제하시겠습니까?`)) return;

    const nextUsers = users.filter(u => u.id !== targetUser.id);
    if (onUpdateUsers) onUpdateUsers(nextUsers);
    try {
      localStorage.setItem('mango_users_db', JSON.stringify(nextUsers));
    } catch {}

    try {
      await supabaseService.deleteUser(targetUser.id);
      showToast(`🗑️ '${targetUser.username}' 회원이 삭제되었습니다.`);
    } catch (err) {
      console.warn("Supabase user delete notice:", err);
    }
  };

  // 다른 컴퓨터 동기화용 원클릭 링크 복사 (Cloudinary & Supabase)
  const handleCopySyncUrl = () => {
    const configPayload = {
      cloudName,
      uploadPreset,
      sbUrl,
      sbAnonKey
    };

    const encoded = btoa(encodeURIComponent(JSON.stringify(configPayload)));
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    const syncUrl = `${origin}${pathname}?sync_config=${encoded}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(syncUrl).then(() => {
        alert('🔗 [다른 컴퓨터 원클릭 동기화 링크]가 클립보드에 복사되었습니다!\n\n다른 컴퓨터나 휴대폰의 웹 브라우저에서 이 링크를 한 번만 열면 이미지 서버 및 DB 설정이 즉시 자동으로 동기화됩니다.');
      }).catch(() => {
        prompt('아래 동기화 링크를 복사하여 다른 컴퓨터에서 접속하세요:', syncUrl);
      });
    } else {
      prompt('아래 동기화 링크를 복사하여 다른 컴퓨터에서 접속하세요:', syncUrl);
    }
  };

  const handleExportData = () => {
    const data = {
      heroImages,
      menuItems,
      products,
      customPackages,
      videos,
      posts,
      pageContents,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mango-tour-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    alert('데이터 백업 파일이 다운로드되었습니다. GitHub 저장소의 초기 데이터로 활용할 수 있습니다.');
  };

  const handleConvertVndToUsd = () => {
    if (!confirm('모든 상품의 가격을 VND에서 USD로 변환하시겠습니까? (금액을 25,000으로 나눕니다. 이미 달러인 경우 실행하지 마세요!)')) return;
    const updated = products.map(p => ({
      ...p,
      price: p.price > 10000 ? Math.round(p.price / 25000) : p.price
    }));
    setProducts(updated);
    alert('변환되었습니다. 잠시 후 서버에 자동 저장됩니다.');
  };

  const handleResetToDefaults = () => {
    if (!confirm('모든 데이터를 USD 기준의 초기 상태로 리셋하시겠습니까? 현재 저장된 모든 데이터가 삭제됩니다.')) return;
    
    setHeroImages(HERO_IMAGES);
    setMenuItems(SUB_MENU_ITEMS);
    setProducts(INITIAL_PRODUCTS);
    if (setCustomPackages) setCustomPackages(INITIAL_CUSTOM_PACKAGES);
    setPageContents(INITIAL_PAGE_CONTENTS);
    setVideos(INITIAL_VIDEOS);
    setPosts(INITIAL_POSTS);
    setPopup(INITIAL_POPUP);
    
    alert('초기 데이터로 복구되었습니다. 잠시 후 서버와 동기화됩니다.');
  };

  const handleSyncFromGoogleSheet = async () => {
    if (!confirm('구글 시트에서 데이터를 가져와 상품 목록을 업데이트하시겠습니까? (기존 상품 목록에 추가됩니다)')) return;
    
    setIsSyncing(true);
    try {
      const sheetData = await fetchGoogleSheetData();
      if (sheetData && sheetData.length > 0) {
        const newProducts: Product[] = sheetData.map((row, index) => {
          const productName = row['상품명'] || row['productName'] || row['name'] || row['col_2'] || '새 상품';
          const priceStr = String(row['기본 단가'] || row['price'] || row['col_3'] || '0').replace(/,/g, '');
          const theme = String(row['테마'] || row['theme'] || row['category'] || row['col_1'] || '').trim();
          
          let type: 'golf' | 'tour' | 'hotel' = 'tour';
          if (theme.includes('골프')) type = 'golf';
          if (theme.includes('호텔') || theme.includes('숙박')) type = 'hotel';

          return {
            id: `gs-${Date.now()}-${index}`,
            title: String(productName),
            description: String(row['설명'] || row['description'] || row['col_5'] || '구글 시트에서 가져온 상품입니다.'),
            image: String(row['이미지'] || row['image'] || row['col_6'] || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=800'),
            price: parseInt(priceStr) || 0,
            location: String(row['지역'] || row['location'] || row['col_0'] || '지역').trim(),
            duration: String(row['기간'] || row['duration'] || '3박 5일'),
            type: type,
            itinerary: []
          };
        });

        // 중복 체크 (제목 기준)
        const existingTitles = new Set(products.map(p => p.title));
        const uniqueNewProducts = newProducts.filter(p => !existingTitles.has(p.title));

        if (uniqueNewProducts.length === 0) {
          alert('새로 추가할 상품이 없습니다. (이미 모든 상품이 등록되어 있습니다)');
        } else {
          setProducts([...uniqueNewProducts, ...products]);
          alert(`${uniqueNewProducts.length}개의 새로운 상품이 구글 시트에서 성공적으로 동기화되었습니다!`);
        }
      } else {
        alert('구글 시트에서 데이터를 가져오지 못했습니다. 시트 설정을 확인해주세요.');
      }
    } catch (error) {
      console.error("Sync Error:", error);
      alert('동기화 중 오류가 발생했습니다.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-0 sm:px-4 py-2 sm:py-6 animate-fade-in-up w-full overflow-x-hidden">
      {/* Top Bar: Title & Back Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5 sm:gap-3 mb-3 px-2.5 sm:px-0">
        <div>
          <h1 className="text-lg sm:text-2xl font-black text-deepgreen flex items-center gap-2">
            <span className="text-2xl sm:text-3xl">🛠️</span> MANGO TOUR 관리 센터
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">베트남 골프/투어 통합 관리 및 실시간 클라우드 연동</p>
        </div>
        <div className="self-end sm:self-auto shrink-0">
          <BackButton onClick={() => setCurrentPage('home')} variant="light" label="메인으로 나가기" className="px-3.5 py-2 text-xs sm:text-sm shadow-xs font-bold whitespace-nowrap" />
        </div>
      </div>

      {/* Top Quick Actions Grid (좌우 여백 없이 칸에 딱 맞게 정렬) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1.5 sm:gap-2 w-full mb-3 sm:mb-4 px-2 sm:px-0">
        <button 
          type="button"
          onClick={handleResetToDefaults} 
          className="w-full py-2.5 px-2.5 sm:px-3 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition shadow-xs active:scale-98 whitespace-nowrap"
        >
          <span className="shrink-0 text-base">🔄</span>
          <span className="truncate">데이터 초기화</span>
        </button>
        <button 
          type="button"
          onClick={handleExportData} 
          className="w-full py-2.5 px-2.5 sm:px-3 bg-gray-700 hover:bg-gray-800 text-white border border-gray-700 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition shadow-xs active:scale-98 whitespace-nowrap"
        >
          <span className="shrink-0 text-base">💾</span>
          <span className="truncate">데이터 백업</span>
        </button>
        <button 
          type="button"
          onClick={() => setShowCloudinaryConfig(!showCloudinaryConfig)} 
          className={`w-full py-2.5 px-2.5 sm:px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition shadow-xs border active:scale-98 whitespace-nowrap ${
            showCloudinaryConfig 
              ? 'bg-pink-600 text-white border-pink-600' 
              : 'bg-pink-50 hover:bg-pink-100 text-pink-700 border-pink-200'
          }`}
        >
          <span className="shrink-0 text-base">🖼️</span>
          <span className="truncate">이미지 서버 설정</span>
        </button>
        <button 
          type="button"
          onClick={() => setShowSupabaseConfig(!showSupabaseConfig)} 
          className={`w-full py-2.5 px-2.5 sm:px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition shadow-xs border active:scale-98 whitespace-nowrap ${
            showSupabaseConfig 
              ? 'bg-emerald-600 text-white border-emerald-600' 
              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
          }`}
        >
          <span className="shrink-0 text-base">⚡</span>
          <span className="truncate">Supabase DB 설정</span>
        </button>
        <button 
          type="button"
          onClick={() => setShowDriveConfig(!showDriveConfig)} 
          className={`w-full py-2.5 px-2.5 sm:px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition shadow-xs border active:scale-98 col-span-2 sm:col-span-1 md:col-span-1 whitespace-nowrap ${
            showDriveConfig 
              ? 'bg-blue-600 text-white border-blue-600' 
              : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
          }`}
        >
          <span className="shrink-0 text-base">☁️</span>
          <span className="truncate">구글 드라이브 연동</span>
        </button>
      </div>

      {/* Global Upload Loading Indicator */}
      {isUploading && (
        <div className="fixed inset-0 bg-black/50 z-[999] flex items-center justify-center backdrop-blur-sm">
           <div className="bg-white p-8 rounded-3xl flex flex-col items-center gap-6 shadow-2xl max-w-sm w-full mx-4">
              <div className="relative w-20 h-20">
                <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
                <div 
                  className="absolute inset-0 border-4 border-gold-500 rounded-full border-t-transparent animate-spin"
                  style={{ animationDuration: '1s' }}
                ></div>
                <div className="absolute inset-0 flex items-center justify-center font-bold text-deepgreen text-sm">
                  {uploadProgress}%
                </div>
              </div>
              <div className="text-center">
                <p className="font-bold text-deepgreen text-lg mb-1">파일을 업로드 중입니다</p>
                <p className="text-gray-500 text-xs">잠시만 기다려 주세요. 대용량 파일은 시간이 걸릴 수 있습니다.</p>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gold-500 h-full transition-all duration-300" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
           </div>
        </div>
      )}

      {/* Cloudinary Config Panel */}
      {showCloudinaryConfig && (
        <div className="bg-pink-50 border-y sm:border border-pink-100 rounded-none sm:rounded-2xl p-3.5 sm:p-6 mb-4 sm:mb-8 animate-fade-in shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-lg font-bold text-pink-800 flex items-center gap-2">
                  🖼️ Cloudinary 이미지/비디오 서버 설정
                  <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold border border-emerald-200">
                    🌐 클라우드 자동 동기화 지원
                  </span>
                </h3>
                <p className="text-xs text-pink-600 mt-1">
                  여기서 저장한 설정은 <strong>Firestore 클라우드 DB</strong>에 저장되어, <strong>다른 컴퓨터나 휴대폰에서 접속하더라도 자동으로 동일한 이미지 서버 설정이 적용</strong>됩니다.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleCopySyncUrl}
                  className="px-3 py-1.5 bg-white border border-pink-300 text-pink-700 hover:bg-pink-100 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-xs"
                >
                  🔗 다른 PC 동기화 링크 복사
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="block text-[10px] font-bold text-pink-600 mb-1">Cloud Name</label>
                    <input type="text" value={cloudName} onChange={e => setCloudName(e.target.value)} className="w-full p-2.5 rounded-lg border border-pink-200 bg-white focus:outline-none focus:ring-2 focus:ring-pink-400 text-sm" placeholder="your_cloud_name" />
                </div>
                <div>
                    <label className="block text-[10px] font-bold text-pink-600 mb-1">Upload Preset (Unsigned)</label>
                    <input type="text" value={uploadPreset} onChange={e => setUploadPreset(e.target.value)} className="w-full p-2.5 rounded-lg border border-pink-200 bg-white focus:outline-none focus:ring-2 focus:ring-pink-400 text-sm" placeholder="your_preset_name" />
                </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="text-xs text-pink-700 font-medium">
                  {cloudName && uploadPreset ? (
                    <span className="text-emerald-700 flex items-center gap-1 font-bold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                      현재 이미지 서버 연동 활성화 상태 (Cloud: {cloudName})
                    </span>
                  ) : (
                    <span className="text-amber-700">⚠️ 이미지 서버 미설정 시 기본 저장소 또는 Base64로 처리됩니다.</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button 
                      onClick={handleSaveCloudinaryConfig} 
                      className="px-6 py-2 bg-pink-600 text-white rounded-lg font-bold text-sm hover:bg-pink-700 transition shadow-md flex items-center gap-1.5"
                  >
                      <span>💾</span> 설정 저장 및 클라우드 동기화
                  </button>
                </div>
            </div>

            <div className="mt-4 p-4 bg-white/90 rounded-xl text-xs text-pink-800 space-y-2 border border-pink-200">
                <p className="font-bold text-sm flex items-center gap-2">⚠️ Cloudinary 설정 가이드 및 다른 기기 적용</p>
                <div className="space-y-1.5 pl-1 text-[11px] leading-relaxed text-gray-700">
                  <p>1. <b>클라우드 자동 공유:</b> 여기서 [설정 저장] 버튼을 누르면 Firebase에 자동 저장되어 다른 PC에서 새로고침만 해도 동일한 이미지 서버가 바로 동작합니다.</p>
                  <p>2. <b>Cloud Name:</b> Cloudinary 메인 대시보드 상단의 이름을 입력하세요.</p>
                  <p>3. <b>Upload Preset:</b> Settings &gt; Upload &gt; Upload presets에서 생성한 <strong>Unsigned</strong> 프리셋 이름을 입력하세요.</p>
                  <p className="text-rose-700 font-bold bg-rose-50 p-1.5 rounded border border-rose-200">※ Signing Mode는 반드시 'Unsigned'여야 브라우저에서 직접 다이렉트 업로드가 가능합니다.</p>
                </div>
                <div className="pt-2 border-t border-pink-100 mt-2 flex flex-wrap gap-2">
                  <a href="https://cloudinary.com/console/settings/upload" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 bg-pink-600 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-pink-700 transition text-xs">
                    Cloudinary 콘솔 설정 페이지 바로가기 ↗
                  </a>
                </div>
            </div>
        </div>
      )}

      {/* Supabase Config Panel */}
      {showSupabaseConfig && (
        <div className="bg-emerald-50 border-y sm:border border-emerald-200 rounded-none sm:rounded-2xl p-3.5 sm:p-6 mb-4 sm:mb-8 animate-fade-in shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-lg font-bold text-emerald-950 flex items-center gap-2">
                  ⚡ Supabase 클라우드 데이터베이스 설정
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${
                    isSupabaseConfigured 
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300' 
                      : 'bg-amber-100 text-amber-800 border-amber-300'
                  }`}>
                    {isSupabaseConfigured ? '🟢 정상 연결됨' : '🟡 설정 대기 중 (안전 로컬 모드)'}
                  </span>
                </h3>
                <p className="text-xs text-emerald-700 mt-1">
                  회원 정보, 상품, 게시판 글이 <strong>Supabase 클라우드 DB</strong>에 안전하게 영구 보존됩니다.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleCopySupabaseSql}
                  className="px-3.5 py-1.5 bg-emerald-600 text-white hover:bg-emerald-700 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                  title="Supabase SQL Editor에 복사하여 붙여넣을 수 있는 원클릭 테이블 생성 스크립트입니다."
                >
                  📋 원클릭 테이블 생성 SQL 복사
                </button>
                <a
                  href="https://supabase.com/dashboard"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-100 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-xs"
                >
                  ↗ Supabase 콘솔 바로가기
                </a>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="block text-[10px] font-bold text-emerald-800 mb-1">Project URL (API URL)</label>
                    <input 
                      type="text" 
                      value={sbUrl} 
                      onChange={e => setSbUrl(e.target.value)} 
                      className="w-full p-2.5 rounded-lg border border-emerald-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm font-mono" 
                      placeholder="https://xxxxxxxxxxxx.supabase.co" 
                    />
                </div>
                <div>
                    <label className="block text-[10px] font-bold text-emerald-800 mb-1">Anon Public Key</label>
                    <input 
                      type="password" 
                      value={sbAnonKey} 
                      onChange={e => setSbAnonKey(e.target.value)} 
                      className="w-full p-2.5 rounded-lg border border-emerald-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400 text-sm font-mono" 
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..." 
                    />
                </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="text-xs text-emerald-800">
                  {sbUrl && sbAnonKey ? (
                    <span className="font-semibold text-emerald-700">✅ Supabase 연결 정보가 입력되어 있습니다. 아래 [전체 데이터 Supabase로 전송]을 눌러 데이터를 채워주세요.</span>
                  ) : (
                    <span className="text-amber-800 font-semibold">⚠️ 위의 Project URL과 Anon Key를 입력하신 후 [전체 데이터 전송]을 눌러주세요.</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button 
                      type="button"
                      onClick={handleSeedAllToSupabase}
                      disabled={isSeedingSupabase}
                      className={`px-4 py-2 rounded-lg font-bold text-xs sm:text-sm shadow-sm transition flex items-center gap-1.5 cursor-pointer ${
                        isSeedingSupabase 
                          ? 'bg-amber-400 text-white cursor-wait animate-pulse' 
                          : 'bg-amber-600 hover:bg-amber-700 text-white shadow-md active:scale-95'
                      }`}
                      title="현재 웹사이트의 모든 데이터를 Supabase 클라우드로 일괄 전송합니다."
                  >
                      <span>{isSeedingSupabase ? '⏳' : '📤'}</span>
                      <span>{isSeedingSupabase ? '데이터 전송 중...' : '전체 데이터 Supabase로 전송 (초기화)'}</span>
                  </button>
                  <button 
                      type="button"
                      onClick={handleSaveSupabaseConfig} 
                      className="px-6 py-2 bg-emerald-700 text-white rounded-lg font-bold text-sm hover:bg-emerald-800 transition shadow-md flex items-center gap-1.5 active:scale-95 cursor-pointer"
                  >
                      <span>💾</span> 설정 저장 및 연결
                  </button>
                </div>
            </div>

            <div className="mt-4 p-4 bg-white/95 rounded-xl text-xs text-emerald-950 border border-emerald-200 space-y-2.5">
                <p className="font-bold text-sm text-emerald-950 flex items-center gap-1.5">
                  💡 초보자를 위한 3분 Supabase 설정 가이드
                </p>
                <ol className="list-decimal pl-4 space-y-1.5 text-[11px] leading-relaxed text-gray-700">
                  <li><strong>테이블 생성:</strong> 상단의 <b>[📋 원클릭 테이블 생성 SQL 복사]</b> 버튼을 누른 후, Supabase 콘솔의 <b>SQL Editor</b> 메뉴에 붙여넣고 <b>Run</b>을 누르면 모든 테이블이 3초 만에 자동 생성됩니다.</li>
                  <li><strong>키 확인:</strong> Supabase 프로젝트 좌측 하단 <b>Project Settings (톱니바퀴) &gt; API</b>로 이동합니다.</li>
                  <li><strong>입력:</strong> <b>Project URL</b>과 <b>Project API keys (anon public)</b> 2개를 위 칸에 복사해 넣고 <b>[설정 저장]</b>을 누르면 끝입니다.</li>
                  <li><strong>초기 데이터 전송:</strong> 연결 후 우측의 <b>[전체 데이터 Supabase로 전송]</b> 버튼을 누르면 상품, 골프 투어, 호텔, 영상 데이터가 클라우드에 즉시 채워집니다.</li>
                </ol>
            </div>
        </div>
      )}

      {/* Google Drive Config Panel */}
      {showDriveConfig && (
        <div className="bg-blue-50 border-y sm:border border-blue-100 rounded-none sm:rounded-2xl p-3.5 sm:p-6 mb-4 sm:mb-8 animate-fade-in">
            <h3 className="text-lg font-bold text-blue-800 mb-4 flex items-center gap-2">☁️ 구글 드라이브 백업 센터</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="block text-xs font-bold text-blue-600 mb-1">Google API Key</label>
                    <input type="password" value={apiKey} onChange={e => setApiKey(e.target.value)} className="w-full p-2 rounded border focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm" placeholder="AIza..." />
                </div>
                <div>
                    <label className="block text-xs font-bold text-blue-600 mb-1">Google Client ID</label>
                    <input type="text" value={clientId} onChange={e => setClientId(e.target.value)} className="w-full p-2 rounded border focus:outline-none focus:ring-2 focus:ring-blue-300 text-sm" placeholder="...apps.googleusercontent.com" />
                </div>
            </div>
            <div className="flex flex-wrap gap-3">
                <button 
                    onClick={handleConnectDrive} 
                    disabled={isDriveConnected || isConnecting}
                    className={`px-4 py-2 rounded-lg font-bold text-sm shadow-sm transition flex items-center gap-2 ${
                        isDriveConnected 
                        ? 'bg-green-500 text-white cursor-default' 
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    } ${isConnecting ? 'opacity-75 cursor-wait' : ''}`}
                >
                    {isConnecting ? (
                        <>
                           <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                           초기화 및 로그인 중...
                        </>
                    ) : (
                        isDriveConnected ? '✅ 연결됨' : '🔑 로그인 및 권한 요청'
                    )}
                </button>
                
                {isDriveConnected && (
                    <>
                        <button 
                            onClick={handleSaveToDrive} 
                            disabled={isSyncing}
                            className="px-4 py-2 bg-white text-blue-600 border border-blue-200 rounded-lg font-bold text-sm hover:bg-blue-50 transition flex items-center gap-2"
                        >
                            {isSyncing ? '⏳ 저장 중...' : '📤 현재 데이터 저장하기 (Backup)'}
                        </button>
                        <button 
                            onClick={handleLoadFromDrive} 
                            disabled={isSyncing}
                            className="px-4 py-2 bg-white text-orange-600 border border-orange-200 rounded-lg font-bold text-sm hover:bg-orange-50 transition flex items-center gap-2"
                        >
                            {isSyncing ? '⏳ 불러오는 중...' : '📥 데이터 불러오기 (Restore)'}
                        </button>
                    </>
                )}
            </div>
            <p className="text-xs text-blue-400 mt-3">* Google Cloud Console에서 'Google Drive API' 사용 설정 및 올바른 리디렉션 URI 설정이 필요합니다.</p>
        </div>
      )}
      
      {/* Navigation Tabs (좌우 여백 없이 칸에 딱 맞게 배치된 세련된 탭 바) */}
      <div className="w-full mb-3 sm:mb-5 bg-gray-100/90 p-1.5 rounded-none sm:rounded-2xl border-y sm:border border-gray-200/80 shadow-xs">
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-1 sm:gap-1.5 w-full">
          {[
            { id: 'users', icon: '👥', label: '회원' },
            { id: 'hero', icon: '🖼️', label: '슬라이드' },
            { id: 'products', icon: '🛍️', label: '일반 상품' },
            { id: 'planner', icon: '⛳', label: '맞춤 여행' },
            { id: 'pages', icon: '📄', label: '페이지' },
            { id: 'popup', icon: '🔔', label: '팝업' },
            { id: 'menu', icon: '🔘', label: '메뉴' },
          ].map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full py-2 sm:py-2.5 px-1 sm:px-2 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1 transition-all text-center whitespace-nowrap ${
                  isActive
                    ? 'bg-deepgreen text-white shadow-md'
                    : 'text-gray-600 hover:text-deepgreen hover:bg-white/80'
                }`}
              >
                <span className="text-sm shrink-0">{tab.icon}</span>
                <span className="truncate whitespace-nowrap">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white shadow-xl border-y sm:border border-gray-100 min-h-[600px] px-0 py-3 sm:p-6 md:p-8 rounded-none sm:rounded-3xl">
        {/* Hero Slide */}
        {activeTab === 'hero' && (
           <div className="animate-fade-in-up px-2.5 sm:px-0">
            <h3 className="text-lg sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">메인 슬라이드 이미지 (총 {heroImages.length}개)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2.5 sm:gap-4">
              {heroImages.map((img, idx) => (
                <div key={idx} className="relative group rounded-2xl overflow-hidden aspect-video shadow-md border bg-gray-50">
                  <img src={getFreshImageUrl(img)} alt={`Slide ${idx}`} className="w-full h-full object-cover" />
                  {img.startsWith('data:') && (
                    <div className="absolute top-1 left-1 bg-red-500/80 text-white text-[8px] px-1.5 py-0.5 rounded-full font-bold backdrop-blur-sm whitespace-nowrap">
                      Base64 ({(img.length / 1024).toFixed(0)}KB)
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-2">
                    <label className="bg-white text-deepgreen px-3 py-1 rounded-full font-bold text-[10px] cursor-pointer hover:bg-gold-50 shadow-md whitespace-nowrap">
                      교체 <input type="file" className="hidden" accept="image/*" onChange={(e) => handleReplaceHeroImage(idx, e)} />
                    </label>
                    <button onClick={() => setHeroImages(heroImages.filter((_, i) => i !== idx))} className="bg-red-600 text-white px-3 py-1 rounded-full font-bold text-[10px] shadow-md whitespace-nowrap">삭제</button>
                  </div>
                </div>
              ))}
              <button onClick={() => heroFileInputRef.current?.click()} className="aspect-video border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center text-gray-400 hover:border-gold-500 hover:text-gold-500 transition">
                 <span className="text-2xl">+</span>
                 <input type="file" className="hidden" ref={heroFileInputRef} accept="image/*" onChange={(e) => handleFileUpload(e, (url) => setHeroImages([...heroImages, url]))} />
              </button>
            </div>
          </div>
        )}

        {/* Product Catalog Management */}
        {activeTab === 'products' && (
          <div className="animate-fade-in-up">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4 sm:mb-8 border-b pb-4 px-2.5 sm:px-0">
              <h3 className="text-lg sm:text-2xl font-bold text-gray-800">상품 카탈로그 관리</h3>
              <div className="flex flex-wrap gap-1.5 sm:gap-2 w-full sm:w-auto">
                <button 
                  onClick={handleConvertVndToUsd}
                  className="bg-blue-500 text-white px-3 sm:px-5 py-2 rounded-xl font-bold shadow-lg hover:bg-blue-600 transition text-xs sm:text-sm whitespace-nowrap"
                >
                  VND -&gt; USD 변환
                </button>
                <button 
                  onClick={handleSyncFromGoogleSheet}
                  disabled={isSyncing}
                  className={`bg-green-600 text-white px-3 sm:px-5 py-2 rounded-xl font-bold shadow-lg hover:bg-green-700 transition text-xs sm:text-sm flex items-center gap-1.5 whitespace-nowrap ${isSyncing ? 'opacity-50 cursor-wait' : ''}`}
                >
                  {isSyncing ? '🔄 동기화 중...' : '📊 구글 시트 동기화'}
                </button>
                <button 
                  onClick={() => {
                    const newProd: Product = { id: Date.now().toString(), title: '새 여행 상품', description: '상품 설명을 입력하세요.', image: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?q=80&w=800', price: 0, location: '지역', duration: '3박 5일', type: 'tour', itinerary: [] };
                    setProducts([newProd, ...products]);
                  }} 
                  className="bg-gold-500 text-white px-3 sm:px-5 py-2 rounded-xl font-bold shadow-lg text-xs sm:text-sm whitespace-nowrap"
                >
                  + 새 상품 추가
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-8 px-2 sm:px-0">
               {products.map((p) => (
                 <div key={p.id} className={`flex flex-col border rounded-2xl sm:rounded-3xl bg-white shadow-md sm:shadow-xl overflow-hidden transition-all duration-300 ${editingProductId === p.id ? 'ring-4 ring-gold-400' : 'hover:shadow-2xl'}`}>
                   <div className="h-40 bg-gray-100 relative group">
                     <img src={getFreshImageUrl(p.image)} className="w-full h-full object-cover" alt={p.title} />
                     {p.image.startsWith('data:') && (
                       <div className="absolute top-2 left-2 bg-red-500/80 text-white text-[10px] px-2 py-1 rounded-full font-bold backdrop-blur-sm">
                         Base64 ({(p.image.length / 1024).toFixed(0)}KB)
                       </div>
                     )}
                     <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center cursor-pointer text-white">
                        <span className="text-2xl mb-1">🖼️</span>
                        <span className="text-xs font-bold">사진 교체</span>
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleReplaceProductImage(p.id, e)} />
                     </label>
                   </div>
                   
                   <div className="p-4 space-y-2">
                     <div className="space-y-0.5">
                        <label className="text-[10px] font-bold text-gold-600 uppercase">상품명</label>
                        <input className="w-full font-bold text-gray-800 border-b-2 border-transparent focus:border-gold-500 outline-none transition" value={p.title} onChange={e => handleProductFieldChange(p.id, 'title', e.target.value)} />
                     </div>
                     <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-0.5">
                           <label className="text-[10px] font-bold text-gray-400 uppercase">가격 (USD)</label>
                          <input type="number" className="w-full text-red-600 font-bold border-b outline-none" value={p.price} onChange={e => handleProductFieldChange(p.id, 'price', parseInt(e.target.value) || 0)} />
                        </div>
                        <div className="space-y-0.5">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">지역</label>
                          <input className="w-full text-gray-600 text-sm border-b outline-none" value={p.location} onChange={e => handleProductFieldChange(p.id, 'location', e.target.value)} />
                        </div>
                     </div>

                     {/* 상세 편집 모드에서만 보이는 추가 필드들 */}
                     {editingProductId === p.id && (
                       <div className="pt-4 border-t space-y-4 animate-fade-in">
                         <div className="grid grid-cols-2 gap-3">
                           <div className="space-y-1">
                             <label className="text-[10px] font-bold text-gray-400 uppercase">일정 (예: 4박 6일)</label>
                             <input className="w-full text-xs border-b outline-none" value={p.duration} onChange={e => handleProductFieldChange(p.id, 'duration', e.target.value)} />
                           </div>
                           <div className="space-y-1">
                             <label className="text-[10px] font-bold text-gray-400 uppercase">타입</label>
                             <select className="w-full text-xs border-b outline-none bg-transparent" value={p.type} onChange={e => handleProductFieldChange(p.id, 'type', e.target.value)}>
                               <option value="golf">골프</option>
                               <option value="tour">관광</option>
                               <option value="hotel">호텔&빌라</option>
                             </select>
                           </div>
                         </div>
                         <div className="space-y-1">
                           <label className="text-[10px] font-bold text-gray-400 uppercase">상품 간단 설명</label>
                           <textarea className="w-full text-xs border p-2 rounded outline-none h-16 resize-none" value={p.description} onChange={e => handleProductFieldChange(p.id, 'description', e.target.value)} />
                         </div>

                         {/* Detail Popup Management for Products */}
                         <div className="pt-4 border-t border-gray-100 space-y-3">
                             <div className="flex justify-between items-center">
                                 <label className="text-[10px] font-bold text-gold-600 uppercase">미리보기 팝업 관리</label>
                             </div>
                             <textarea 
                                 className="w-full text-xs text-gray-700 bg-gold-50/30 p-2 rounded-lg outline-none resize-none h-24 border-gold-100 focus:bg-white focus:border-gold-300 border"
                                 value={p.detailContent || ''}
                                 onChange={(e) => handleProductFieldChange(p.id, 'detailContent', e.target.value)}
                                 placeholder="미리보기 팝업 상세 내용"
                             />
                             
                             <div className="space-y-2">
                                 <label className="text-[9px] font-bold text-gray-400 block">팝업 상세 이미지 (여러 장 가능)</label>
                                 <div className="flex flex-wrap gap-2">
                                     {p.detailImages?.map((img, imgIdx) => (
                                         <div key={imgIdx} className="w-12 h-12 rounded-lg overflow-hidden relative group border shadow-sm">
                                             <img src={getFreshImageUrl(img)} className="w-full h-full object-cover" alt={`Detail ${imgIdx}`} />
                                             <button 
                                                 onClick={() => handleProductDetailImageRemove(p.id, imgIdx)}
                                                 className="absolute inset-0 bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-[10px] font-bold"
                                             >
                                                 삭제
                                             </button>
                                         </div>
                                     ))}
                                     <label className="w-12 h-12 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-300 hover:border-gold-400 hover:text-gold-400 transition cursor-pointer">
                                         <span className="text-xl">+</span>
                                         <input 
                                             type="file" 
                                             className="hidden" 
                                             accept="image/*" 
                                             onChange={(e) => handleProductDetailImageAdd(p.id, e)} 
                                         />
                                     </label>
                                 </div>
                             </div>
                         </div>

                         {/* 상세 일정(Itinerary) 편집기 */}
                         <div className="space-y-2">
                           <div className="flex justify-between items-center">
                             <label className="text-[10px] font-bold text-deepgreen uppercase tracking-tighter">상세 일정 관리</label>
                             <button onClick={() => handleItineraryDayAdd(p.id)} className="bg-deepgreen text-white text-[9px] px-2 py-0.5 rounded shadow">+ 일차 추가</button>
                           </div>
                           <div className="space-y-3 max-h-60 overflow-y-auto pr-1 scrollbar-hide border-l-2 border-gold-200 pl-2">
                             {p.itinerary?.map((day, dIdx) => (
                               <div key={dIdx} className="bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-2 shadow-sm">
                                 <div className="flex justify-between items-center">
                                   <span className="text-[11px] font-black text-deepgreen italic underline">Day {day.day}</span>
                                   <button onClick={() => handleItineraryDayRemove(p.id, dIdx)} className="text-[9px] text-red-500 font-bold hover:underline">일차 삭제</button>
                                 </div>
                                 <div className="space-y-1">
                                   {day.activities.map((act, aIdx) => (
                                     <div key={aIdx} className="flex gap-1 items-center">
                                       <span className="text-[9px] font-bold w-6 text-center text-gray-400">{aIdx === 0 ? '오전' : aIdx === 1 ? '오후' : aIdx === 2 ? '저녁' : ''}</span>
                                       <input className="flex-1 text-[10px] bg-white border border-gray-100 p-1.5 rounded outline-none shadow-inner" value={act} onChange={e => handleActivityChange(p.id, dIdx, aIdx, e.target.value)} />
                                       <button onClick={() => handleActivityRemove(p.id, dIdx, aIdx)} className="text-gray-300 hover:text-red-500 transition">✕</button>
                                     </div>
                                   ))}
                                   <button onClick={() => handleActivityAdd(p.id, dIdx)} className="text-[9px] text-blue-500 hover:font-bold">+ 활동 추가</button>
                                 </div>
                               </div>
                             ))}
                             {(!p.itinerary || p.itinerary.length === 0) && <p className="text-[10px] text-gray-400 italic text-center py-4">등록된 일정이 없습니다.</p>}
                           </div>
                         </div>

                         {/* 여행 경비 내역 (Estimated Cost) 금액 및 항목 관리 */}
                         <div className="pt-3 border-t border-gray-100 space-y-2.5">
                           <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                             <div>
                               <label className="text-[11px] font-black text-amber-900 uppercase flex items-center gap-1.5">
                                 <span>💰</span> 여행 경비 내역 (Estimated Cost) 금액 설정
                               </label>
                               <p className="text-[10px] text-gray-500 leading-tight">
                                 견적서의 '여행 경비 내역' 표에 표시될 구분별 세부내역과 금액(1인 기준 USD)을 직접 수정합니다.
                               </p>
                             </div>
                             <div className="flex items-center gap-1.5 self-end sm:self-auto">
                               <button
                                 type="button"
                                 onClick={() => handleGenerateDefaultCostItems(p)}
                                 className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                                 title="현재 상품가 기준으로 기본 5개 항목 자동 생성"
                                >
                                 <span>⚡</span> 비율 자동 채우기
                               </button>
                               <button
                                 type="button"
                                 onClick={() => handleCostItemAdd(p.id)}
                                 className="px-2 py-1 bg-deepgreen text-white rounded-lg text-[10px] font-bold shadow-xs hover:bg-gold-600 transition flex items-center gap-1 cursor-pointer"
                                >
                                 <span>+</span> 항목 추가
                               </button>
                             </div>
                           </div>

                           {/* Cost Items Table / Card Editor */}
                           {p.costItems && p.costItems.length > 0 ? (
                             <div className="space-y-2 bg-amber-50/40 p-2.5 rounded-xl border border-amber-200/80">
                               {(() => {
                                 const pTravelDays = getTravelDays(p.duration, p.itinerary);
                                 const total2p = (p.costItems || []).reduce((acc, it) => acc + calculateCostItemTotal(it, 2, pTravelDays).amountUSD, 0);
                                 const total4p = (p.costItems || []).reduce((acc, it) => acc + calculateCostItemTotal(it, 4, pTravelDays).amountUSD, 0);

                                 return (
                                   <>
                                     <div className="flex items-center justify-between text-[10px] text-amber-900 font-bold bg-amber-100/60 px-2 py-1 rounded-lg">
                                       <span>📅 여행 기간: 총 {pTravelDays}일차 일정 ({p.duration || '3박 5일'})</span>
                                       <span className="text-gray-600 font-normal">차량: 7인승 1대(1일 $100) / 가이드: 16인당 1명 (일정 반영)</span>
                                     </div>

                                     <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                                       {p.costItems.map((item, cIdx) => {
                                         const pType = getItemPricingType(item.category, item.pricingType);
                                         const isVehicle = pType === 'vehicle';
                                         const isGuide = pType === 'guide';
                                         const isPerDay = item.perDay !== undefined ? item.perDay : isGuide;
                                         const group4Preview = calculateCostItemTotal(item, 4, pTravelDays).amountUSD;

                                         return (
                                           <div key={cIdx} className="bg-white p-2.5 rounded-xl border border-gray-200 shadow-xs space-y-2">
                                             <div className="flex flex-wrap items-center justify-between gap-1.5">
                                                <div className="flex items-center gap-1 flex-1 min-w-0">
                                                  <span className="text-[10px] font-black text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded shrink-0">
                                                    #{cIdx + 1}
                                                  </span>
                                                  <input
                                                    type="text"
                                                    className="text-xs font-bold text-gray-900 border-b border-gray-300 focus:border-gold-500 outline-none px-1 py-0.5 w-24 sm:w-28 shrink-0"
                                                    value={item.category}
                                                    onChange={(e) => handleCostItemChange(p.id, cIdx, 'category', e.target.value)}
                                                    placeholder="구분"
                                                  />

                                                  {/* Pricing Type Selector */}
                                                  <div className="flex items-center gap-1 shrink-0 ml-1">
                                                    <button
                                                      type="button"
                                                      onClick={() => handleCostItemChange(p.id, cIdx, 'pricingType', 'person')}
                                                      className={`px-1.5 py-0.5 text-[9px] font-bold rounded cursor-pointer transition ${
                                                        pType === 'person'
                                                          ? 'bg-blue-600 text-white shadow-2xs'
                                                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                      }`}
                                                      title="인원수 기준 (1인당 단가 × 인원수)"
                                                    >
                                                      👤 1인당
                                                    </button>
                                                    <button
                                                      type="button"
                                                      onClick={() => {
                                                        handleCostItemChange(p.id, cIdx, 'pricingType', 'vehicle');
                                                        handleCostItemChange(p.id, cIdx, 'perDay', true);
                                                        if (!item.amountUSD || item.amountUSD === 194) handleCostItemChange(p.id, cIdx, 'amountUSD', 100);
                                                      }}
                                                      className={`px-1.5 py-0.5 text-[9px] font-bold rounded cursor-pointer transition ${
                                                        isVehicle
                                                          ? 'bg-amber-600 text-white shadow-2xs'
                                                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                      }`}
                                                      title="7인승 리무진 밴 기준 7인당 1대 (1일 $100, 여행 기간 기준)"
                                                    >
                                                      🚐 차량(7인/1대)
                                                    </button>
                                                    <button
                                                      type="button"
                                                      onClick={() => {
                                                        handleCostItemChange(p.id, cIdx, 'pricingType', 'guide');
                                                        if (item.perDay === undefined) handleCostItemChange(p.id, cIdx, 'perDay', true);
                                                      }}
                                                      className={`px-1.5 py-0.5 text-[9px] font-bold rounded cursor-pointer transition ${
                                                        isGuide
                                                          ? 'bg-emerald-600 text-white shadow-2xs'
                                                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                      }`}
                                                      title="한국어 가이드 16인당 1명 (여행 기간 일수 기준)"
                                                    >
                                                      🚩 가이드(16인/1명)
                                                    </button>
                                                  </div>
                                                </div>

                                                <div className="flex items-center gap-1 shrink-0">
                                                  <span className="text-[11px] font-bold text-gray-400">$</span>
                                                  <input
                                                    type="number"
                                                    className="w-16 sm:w-20 text-xs font-black text-red-600 bg-amber-50/50 border border-amber-300 rounded px-1.5 py-0.5 text-right outline-none focus:bg-white"
                                                    value={item.amountUSD}
                                                    onChange={(e) => handleCostItemChange(p.id, cIdx, 'amountUSD', parseFloat(e.target.value) || 0)}
                                                    placeholder="USD"
                                                  />
                                                  <span className="text-[10px] font-bold text-gray-500">USD</span>

                                                  {/* Per Day Toggle for Vehicle or Guide */}
                                                  {(isVehicle || isGuide) && (
                                                    <button
                                                      type="button"
                                                      onClick={() => handleCostItemChange(p.id, cIdx, 'perDay', !isPerDay)}
                                                      className={`px-1.5 py-0.5 text-[9px] font-bold rounded cursor-pointer transition ml-0.5 ${
                                                        isPerDay
                                                          ? 'bg-purple-100 text-purple-800 border border-purple-300'
                                                          : 'bg-slate-100 text-slate-700 border border-slate-300'
                                                      }`}
                                                      title={isPerDay ? '1일 기준 요금 (여행 일수 곱함)' : '전 일정 기준 단가'}
                                                    >
                                                      {isPerDay ? `1일×${pTravelDays}일` : '전일정'}
                                                    </button>
                                                  )}

                                                  <button
                                                    type="button"
                                                    onClick={() => handleCostItemRemove(p.id, cIdx)}
                                                    className="text-gray-400 hover:text-red-600 font-bold text-xs ml-1 w-5 h-5 flex items-center justify-center rounded hover:bg-red-50 cursor-pointer"
                                                    title="항목 삭제"
                                                  >
                                                    ✕
                                                  </button>
                                                </div>
                                              </div>

                                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
                                                <div className="sm:col-span-2">
                                                  <input
                                                    type="text"
                                                    className="w-full text-[11px] text-gray-700 bg-gray-50 border border-gray-200 rounded px-2 py-1 outline-none focus:bg-white focus:border-gold-500"
                                                    value={item.detail}
                                                    onChange={(e) => handleCostItemChange(p.id, cIdx, 'detail', e.target.value)}
                                                    placeholder="세부 내역 설명"
                                                  />
                                                </div>
                                                <div>
                                                  <input
                                                    type="text"
                                                    className="w-full text-[11px] text-gray-600 bg-gray-50 border border-gray-200 rounded px-2 py-1 outline-none focus:bg-white focus:border-gold-500 text-center"
                                                    value={item.quantity || (isVehicle ? '{vehicleCount}대 (전일정 {days}일)' : isGuide ? '{guideCount}명 (전일정 {days}일)' : '{personCount}인')}
                                                    onChange={(e) => handleCostItemChange(p.id, cIdx, 'quantity', e.target.value)}
                                                    placeholder="수량 템플릿"
                                                  />
                                                </div>
                                              </div>

                                              {/* Calculation helper note */}
                                              <div className="text-[10px] text-gray-500 flex items-center justify-between px-1">
                                                {isVehicle && (
                                                  <span className="text-amber-800">
                                                    💡 7인승 리무진 밴 기준 7인까지 1대 (1일 $100, ${pTravelDays}일: ${isPerDay ? (item.amountUSD || 100) * pTravelDays : (item.amountUSD || 100)} USD), 8~14인은 2대 적용
                                                  </span>
                                                )}
                                                {isGuide && (
                                                  <span className="text-emerald-800">
                                                    💡 16인까지 1명 (${isPerDay ? (item.amountUSD || 0) * pTravelDays : (item.amountUSD || 0)} USD), 17~32인은 2명 적용
                                                  </span>
                                                )}
                                                {!isVehicle && !isGuide && (
                                                  <span className="text-blue-800">
                                                    💡 1인당 ${item.amountUSD || 0} USD (인원수 곱하기 적용)
                                                  </span>
                                                )}
                                                <span className="text-gray-400 font-mono">
                                                  4인 시: ${group4Preview.toLocaleString()} USD
                                                </span>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>

                                      {/* Sum & Simulation Bar */}
                                      <div className="pt-2 border-t border-amber-200 space-y-1.5 text-xs">
                                        <div className="flex flex-wrap items-center justify-between gap-2 bg-white/80 p-2 rounded-lg border border-amber-200/60">
                                          <div className="space-y-0.5">
                                            <div className="flex items-center gap-2">
                                              <span className="font-bold text-gray-700 text-[11px]">👥 2인 기준 견적:</span>
                                              <span className="font-black text-deepgreen text-xs sm:text-sm">${total2p.toLocaleString()} USD</span>
                                              <span className="text-[10px] text-gray-500">(1인 약 ${Math.round(total2p / 2).toLocaleString()})</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                              <span className="font-bold text-gray-700 text-[11px]">👨‍👩‍👧‍👦 4인 기준 견적:</span>
                                              <span className="font-black text-indigo-700 text-xs sm:text-sm">${total4p.toLocaleString()} USD</span>
                                              <span className="text-[10px] text-gray-500 font-medium text-emerald-600">(차량 1대·가이드 1명 공유로 1인 약 ${Math.round(total4p / 4).toLocaleString()}!)</span>
                                            </div>
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => handleProductFieldChange(p.id, 'price', Math.round(total2p / 2))}
                                            className="text-[10px] font-bold text-gold-700 bg-white hover:bg-gold-50 border border-gold-300 px-2 py-1 rounded shadow-2xs transition cursor-pointer self-end"
                                            title="2인 기준 1인당 금액을 상품의 기본 가격(price)에 동기화합니다"
                                          >
                                            2인 1인당(${Math.round(total2p / 2)})을 상품가로 적용
                                          </button>
                                        </div>
                                      </div>
                                    </>
                                  );
                                })()}
                              </div>
                           ) : (
                             <div className="bg-gray-50 p-3 rounded-xl border border-dashed border-gray-300 text-center space-y-1.5">
                               <p className="text-[11px] text-gray-600 font-medium">
                                 현재 기본 공식(골프 45%, 숙박 35%, 차량 10%, 가이드 $120)으로 견적서에 자동 계산되고 있습니다.
                               </p>
                               <button
                                 type="button"
                                 onClick={() => handleGenerateDefaultCostItems(p)}
                                 className="px-3 py-1.5 bg-gold-500 hover:bg-gold-600 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer inline-flex items-center gap-1"
                               >
                                 <span>✏️</span> 이 상품의 여행 경비 항목 및 금액 직접 편집하기
                               </button>
                             </div>
                           )}
                         </div>
                       </div>
                     )}

                     <div className="flex gap-2 pt-2">
                        <button 
                          type="button"
                          onClick={() => setEditingProductId(editingProductId === p.id ? null : p.id)} 
                          className={`flex-1 py-2 rounded-xl font-bold text-xs transition cursor-pointer whitespace-nowrap ${editingProductId === p.id ? 'bg-gold-500 text-white' : 'bg-gray-100 text-gray-600'}`}
                        >
                          {editingProductId === p.id ? '편집 완료' : '상세 편집'}
                        </button>
                        <button 
                          type="button"
                          onClick={(e) => handleDeleteProduct(p, e)} 
                          className="px-4 py-2 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-xl text-xs font-bold transition border border-red-200 cursor-pointer active:scale-95 flex items-center gap-1 whitespace-nowrap shrink-0"
                        >
                          <span>🗑️</span> 삭제
                        </button>
                     </div>
                   </div>
                 </div>
               ))}
            </div>
          </div>
        )}

        {/* 맞춤 여행 상품 관리 (Planner Tab) */}
        {activeTab === 'planner' && (
          <div className="animate-fade-in-up space-y-4 sm:space-y-6 px-2 sm:px-0">
            {/* Top Sub-Nav Tabs for Planner */}
            <div className="flex flex-col sm:flex-row bg-gray-100 p-1.5 rounded-2xl border border-gray-200 gap-1.5 sm:gap-1">
              <button
                type="button"
                onClick={() => setPlannerSubTab('masterPool')}
                className={`flex-1 py-2.5 sm:py-3 px-3 text-xs sm:text-sm font-black rounded-xl transition flex items-center justify-center gap-1.5 whitespace-nowrap ${
                  plannerSubTab === 'masterPool'
                    ? 'bg-deepgreen text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span>🌐</span> DIY 6단계 항목·단가 통합 관리
              </button>
              <button
                type="button"
                onClick={() => setPlannerSubTab('packages')}
                className={`flex-1 py-2.5 sm:py-3 px-3 text-xs sm:text-sm font-black rounded-xl transition flex items-center justify-center gap-1.5 whitespace-nowrap ${
                  plannerSubTab === 'packages'
                    ? 'bg-deepgreen text-white shadow-md'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <span>📦</span> 기존 패키지 템플릿 ({customPackages.length}개)
              </button>
            </div>

            {/* SUB-VIEW 1: PACKAGES MANAGEMENT */}
            {plannerSubTab === 'packages' && (
              <>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                      <span>⛳</span> 4박 5일 맞춤 골프 상품 관리 ({customPackages.length}개)
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">
                      호치민, 붕따우, 달랏 등 각 지역 패키지의 대표 이미지, 기본 금액, 일정표, 그리고 체크리스트 항목을 관리합니다.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setShowResetPackageModal(true)}
                      className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold text-xs transition flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer border border-red-200"
                    >
                      <span>🔄</span> 기본 상품 초기화
                    </button>
                    <button
                      type="button"
                      onClick={handleAddNewCustomPackage}
                      className="px-5 py-2.5 bg-deepgreen text-white rounded-xl font-bold text-xs hover:bg-gold-600 transition flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
                    >
                      <span>➕</span> 상품 등록
                    </button>
                  </div>
                </div>

                {/* Packages Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {customPackages.map((pkg) => (
                <div 
                  key={pkg.id} 
                  className={`bg-white rounded-3xl border transition-all overflow-hidden flex flex-col justify-between ${
                    editingPackage?.id === pkg.id 
                      ? 'ring-4 ring-gold-400 border-gold-400 shadow-xl' 
                      : 'border-gray-200 hover:shadow-lg'
                  }`}
                >
                  <div>
                    {/* Image & Badges */}
                    <div 
                      className="relative h-44 bg-gray-100 overflow-hidden cursor-pointer group"
                      onClick={() => {
                        setEditingPackage(pkg);
                        setPackageModalTab('basic');
                      }}
                    >
                      <img src={getFreshImageUrl(pkg.image)} alt={pkg.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                        <span className="px-3 py-1.5 bg-gold-500 text-white font-black text-xs rounded-xl shadow-lg">
                          ✏️ 클릭하여 편집창 열기
                        </span>
                      </div>
                      <div className="absolute top-3 left-3 flex gap-1.5">
                        <span className="px-2.5 py-1 bg-black/70 text-white rounded-lg text-[10px] font-bold">
                          📍 {pkg.location}
                        </span>
                        <span className="px-2.5 py-1 bg-gold-500 text-white rounded-lg text-[10px] font-bold shadow">
                          {pkg.duration}
                        </span>
                      </div>
                      <div className="absolute bottom-3 right-3 px-3 py-1 bg-deepgreen/90 text-white rounded-xl text-xs font-black shadow">
                        기본 ${pkg.basePriceUSD?.toLocaleString()}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-2.5">
                      <div className="flex flex-wrap gap-1">
                        {pkg.highlightBadges?.map((badge, bIdx) => (
                          <span key={bIdx} className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded">
                            {badge}
                          </span>
                        ))}
                      </div>
                      <h4 
                        className="font-bold text-base text-gray-900 line-clamp-1 cursor-pointer hover:text-gold-600 transition"
                        onClick={() => {
                          setEditingPackage(pkg);
                          setPackageModalTab('basic');
                        }}
                      >
                        {pkg.title}
                      </h4>
                      <p className="text-xs text-gray-500 line-clamp-2">{pkg.subtitle}</p>
                      
                      <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-100 text-[11px] space-y-1">
                        <div className="font-bold text-deepgreen">⛳ 골프 코스:</div>
                        <div className="text-gray-600 line-clamp-1">{pkg.golfCourses?.join(' · ')}</div>
                        <div className="font-bold text-gray-500 mt-1 flex justify-between items-center">
                          <span>✓ 체크 옵션 항목: {pkg.options?.length || 0}개</span>
                          <span>📅 일정: {pkg.itinerary?.length || 0}일차</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-4 pt-0 flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPackage(pkg);
                        setPackageModalTab('basic');
                      }}
                      className="flex-1 py-2.5 bg-gradient-to-r from-deepgreen to-gold-600 hover:from-gold-600 hover:to-deepgreen text-white rounded-xl font-bold text-xs transition shadow-md flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                    >
                      <span>⚙️</span> 상세 및 옵션 편집창 열기
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDeletePackage(pkg, e)}
                      className="px-3.5 py-2.5 bg-red-50 hover:bg-red-500 text-red-500 hover:text-white border border-red-200 rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1 active:scale-95 cursor-pointer"
                      title="상품 삭제"
                    >
                      <span>🗑️</span> 삭제
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Dedicated High-Priority Modal Window for Editing Package */}
            {editingPackage && (
              <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
                <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl border-2 border-gold-400 max-h-[92vh] flex flex-col overflow-hidden animate-scale-in my-auto">
                  
                  {/* Modal Header */}
                  <div className="bg-gradient-to-r from-deepgreen via-gray-900 to-deepgreen text-white p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gold-500/40">
                    <div className="flex items-center gap-3">
                      <span className="w-10 h-10 rounded-2xl bg-gold-500 text-white font-black flex items-center justify-center text-lg shadow shrink-0">
                        ⛳
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 bg-gold-400/20 text-gold-300 rounded-md text-[10px] font-black border border-gold-400/40">
                            4박 5일 맞춤 골프 상품 편집기
                          </span>
                          <span className="text-xs text-emerald-300 font-bold">
                            📍 {editingPackage.location} · {editingPackage.duration}
                          </span>
                        </div>
                        <h3 className="text-base sm:text-xl font-black text-white line-clamp-1 mt-0.5">
                          {editingPackage.title}
                        </h3>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={(e) => handleDeletePackage(editingPackage, e)}
                        className="px-3.5 py-2 bg-red-600/80 hover:bg-red-600 text-white text-xs font-bold rounded-xl transition border border-red-400/40 flex items-center gap-1 active:scale-95"
                      >
                        <span>🗑️</span> 상품 삭제
                      </button>
                      <button
                        onClick={() => setEditingPackage(null)}
                        className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition border border-white/20"
                      >
                        ✕ 닫기
                      </button>
                      <button
                        onClick={() => {
                          setEditingPackage(null);
                          alert('수정 내용이 안전하게 저장되었습니다.');
                        }}
                        className="px-4 py-2 bg-gold-500 hover:bg-gold-600 text-white text-xs font-black rounded-xl transition shadow-lg flex items-center gap-1 active:scale-95"
                      >
                        <span>✓</span> 편집 완료 & 저장
                      </button>
                    </div>
                  </div>

                  {/* Modal Navigation Tabs */}
                  <div className="bg-gray-50 border-b border-gray-200 px-4 sm:px-6 py-2.5 flex flex-wrap gap-2">
                    <button
                      onClick={() => setPackageModalTab('basic')}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
                        packageModalTab === 'basic'
                          ? 'bg-deepgreen text-white shadow-md'
                          : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      <span>📝</span> 기본 정보 & 이미지
                    </button>
                    <button
                      onClick={() => setPackageModalTab('options')}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
                        packageModalTab === 'options'
                          ? 'bg-deepgreen text-white shadow-md'
                          : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      <span>✓</span> 고객 선택 옵션 관리 ({editingPackage.options?.length || 0}개)
                    </button>
                    <button
                      onClick={() => setPackageModalTab('itinerary')}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 ${
                        packageModalTab === 'itinerary'
                          ? 'bg-deepgreen text-white shadow-md'
                          : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      <span>📅</span> 4박 5일 일정표 ({editingPackage.itinerary?.length || 0}일차)
                    </button>
                  </div>

                  {/* Modal Body Container */}
                  <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">

                    {/* TAB 1: BASIC INFO */}
                    {packageModalTab === 'basic' && (
                      <div className="space-y-6 animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                          <div className="md:col-span-2">
                            <label className="font-bold text-gray-700 block mb-1">상품명 (타이틀) *</label>
                            <input
                              type="text"
                              className="w-full p-3 bg-white border border-gray-300 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-gold-500"
                              value={editingPackage.title}
                              onChange={(e) => handlePackageFieldChange(editingPackage.id, 'title', e.target.value)}
                              placeholder="예: [호치민 4박5일] 명문 3대 코스 54홀 프리미엄 골프"
                            />
                          </div>
                          <div>
                            <label className="font-bold text-gray-700 block mb-1">지역 분류</label>
                            <select
                              className="w-full p-3 bg-white border border-gray-300 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-gold-500"
                              value={editingPackage.location}
                              onChange={(e) => handlePackageFieldChange(editingPackage.id, 'location', e.target.value)}
                            >
                              <option value="호치민">호치민</option>
                              <option value="붕따우">붕따우</option>
                              <option value="달랏">달랏</option>
                              <option value="호치민+달랏">호치민+달랏</option>
                              <option value="호치민+붕따우">호치민+붕따우</option>
                              <option value="달랏+붕따우">달랏+붕따우</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          <div>
                            <label className="font-bold text-gray-700 block mb-1">서브 타이틀 (한 줄 설명)</label>
                            <input
                              type="text"
                              className="w-full p-2.5 bg-white border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-gold-500 font-bold"
                              value={editingPackage.subtitle}
                              onChange={(e) => handlePackageFieldChange(editingPackage.id, 'subtitle', e.target.value)}
                              placeholder="예: 호치민 시내 중심 5성 호텔과 최고급 명문 골프장 3곳 라운딩"
                            />
                          </div>
                          <div>
                            <label className="font-bold text-gray-700 block mb-1">여행 기간</label>
                            <div className="flex flex-wrap gap-1.5 mb-1.5">
                              {['2박 3일', '3박 4일', '4박 5일', '5박 6일', '6박 7일', '7박 8일'].map((dur) => (
                                <button
                                  key={dur}
                                  type="button"
                                  onClick={() => handlePackageFieldChange(editingPackage.id, 'duration', dur)}
                                  className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition border ${
                                    editingPackage.duration === dur
                                      ? 'bg-deepgreen text-white border-deepgreen'
                                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200'
                                  }`}
                                >
                                  {dur}
                                </button>
                              ))}
                            </div>
                            <input
                              type="text"
                              className="w-full p-2.5 bg-white border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-gold-500 font-bold text-xs"
                              value={editingPackage.duration}
                              onChange={(e) => handlePackageFieldChange(editingPackage.id, 'duration', e.target.value)}
                              placeholder="예: 4박 5일 또는 직접 입력"
                            />
                          </div>
                        </div>

                        {/* Image Preview & URL/Upload */}
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-3">
                          <label className="font-bold text-gray-800 text-xs block">대표 썸네일 이미지</label>
                          <div className="flex flex-col sm:flex-row gap-4 items-start">
                            <div className="w-full sm:w-44 h-28 bg-gray-200 rounded-xl overflow-hidden border shrink-0">
                              <img src={getFreshImageUrl(editingPackage.image)} alt="Preview" className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 space-y-2 w-full">
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  className="flex-1 p-2 bg-white border border-gray-300 rounded-xl text-xs outline-none"
                                  value={editingPackage.image}
                                  onChange={(e) => handlePackageFieldChange(editingPackage.id, 'image', e.target.value)}
                                  placeholder="이미지 URL 직접 입력"
                                />
                                <label className="px-4 py-2 bg-deepgreen text-white rounded-xl text-xs font-bold cursor-pointer hover:bg-gold-600 whitespace-nowrap shadow-sm">
                                  📁 파일 업로드
                                  <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => handleFileUpload(e, (url) => handlePackageFieldChange(editingPackage.id, 'image', url))}
                                  />
                                </label>
                              </div>
                              <p className="text-[11px] text-gray-400">
                                Unsplash 이미지 주소나 컴퓨터에 있는 골프장 사진 파일을 직접 업로드하실 수 있습니다.
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                          <div>
                            <label className="font-bold text-gray-700 block mb-1">골프 코스 목록 (쉼표 , 로 구분)</label>
                            <input
                              type="text"
                              className="w-full p-2.5 bg-white border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-gold-500"
                              value={editingPackage.golfCourses?.join(', ') || ''}
                              onChange={(e) => handlePackageFieldChange(editingPackage.id, 'golfCourses', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                              placeholder="예: 떤선녓 CC (18홀), 롱탄 CC (18홀), 트윈도브스 CC (18홀)"
                            />
                            <div className="flex flex-wrap gap-1 mt-2">
                              {editingPackage.golfCourses?.map((gc, gcIdx) => (
                                <span key={gcIdx} className="px-2 py-1 bg-deepgreen/10 text-deepgreen text-[10px] font-bold rounded-lg">
                                  ⛳ {gc}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label className="font-bold text-gray-700 block mb-1">하이라이트 배지 태그 (쉼표 , 로 구분)</label>
                            <input
                              type="text"
                              className="w-full p-2.5 bg-white border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-gold-500"
                              value={editingPackage.highlightBadges?.join(', ') || ''}
                              onChange={(e) => handlePackageFieldChange(editingPackage.id, 'highlightBadges', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                              placeholder="예: 54홀 라운딩, 고급 호텔, 전용 VIP 리무진"
                            />
                            <div className="flex flex-wrap gap-1 mt-2">
                              {editingPackage.highlightBadges?.map((hb, hbIdx) => (
                                <span key={hbIdx} className="px-2 py-1 bg-gold-100 text-gold-800 text-[10px] font-bold rounded-lg">
                                  ★ {hb}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                      </div>
                    )}

                    {/* TAB 2: OPTIONS CHECKLIST MANAGER */}
                    {packageModalTab === 'options' && (
                      <div className="space-y-4 animate-fade-in">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b pb-3">
                          <div>
                            <h5 className="font-black text-base text-deepgreen flex items-center gap-1.5">
                              <span>✓</span> 고객 선택 항목 리스트 (총 {editingPackage.options?.length || 0}개 항목)
                            </h5>
                            <p className="text-xs text-gray-500">
                              고객이 견적 페이지에서 켜고 끌 수 있는 세부 항목입니다. 단가(USD)와 기본 포함 여부를 설정하세요.
                            </p>
                          </div>
                          <button
                            onClick={() => handlePackageOptionAdd(editingPackage.id)}
                            className="px-4 py-2 bg-deepgreen hover:bg-gold-600 text-white rounded-xl text-xs font-black transition shadow-sm"
                          >
                            + 새 옵션 항목 추가
                          </button>
                        </div>

                        <div className="space-y-3">
                          {editingPackage.options?.map((opt, optIdx) => (
                            <div key={opt.id || optIdx} className="bg-gray-50 hover:bg-gold-50/20 p-4 rounded-2xl border border-gray-200 transition space-y-3 text-xs">
                              
                              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                                
                                <div className="md:col-span-2">
                                  <label className="text-[10px] text-gray-400 block font-bold mb-0.5">카테고리</label>
                                  <select
                                    value={opt.category}
                                    onChange={(e) => handlePackageOptionChange(editingPackage.id, optIdx, 'category', e.target.value)}
                                    className="w-full p-2 bg-white border rounded-xl text-xs font-bold outline-none"
                                  >
                                    <option value="golf">⛳ 골프</option>
                                    <option value="hotel">🏨 숙박</option>
                                    <option value="vehicle">🚐 차량</option>
                                    <option value="meal">🦞 식사</option>
                                    <option value="activity">💆 스파/투어</option>
                                    <option value="guide">👨‍💼 가이드</option>
                                    <option value="flight">✈️ 항공</option>
                                    <option value="etc">✨ 기타</option>
                                  </select>
                                </div>

                                <div className="md:col-span-4">
                                  <label className="text-[10px] text-gray-400 block font-bold mb-0.5">항목명 *</label>
                                  <input
                                    type="text"
                                    value={opt.name}
                                    onChange={(e) => handlePackageOptionChange(editingPackage.id, optIdx, 'name', e.target.value)}
                                    className="w-full p-2 bg-white border rounded-xl font-bold text-xs outline-none focus:ring-1 focus:ring-gold-500"
                                    placeholder="예: 3회 그린피 (54홀)"
                                  />
                                </div>

                                <div className="md:col-span-2">
                                  <label className="text-[10px] text-gray-400 block font-bold mb-0.5">1인 단가 ($ USD) *</label>
                                  <input
                                    type="number"
                                    value={opt.priceUSD}
                                    onChange={(e) => handlePackageOptionChange(editingPackage.id, optIdx, 'priceUSD', parseInt(e.target.value) || 0)}
                                    className="w-full p-2 bg-white border rounded-xl font-black text-xs text-deepgreen outline-none"
                                  />
                                </div>

                                <div className="md:col-span-3 flex items-center gap-4 pt-4 md:pt-0">
                                  <label className="flex items-center gap-1.5 cursor-pointer bg-white px-2.5 py-1.5 rounded-lg border">
                                    <input
                                      type="checkbox"
                                      checked={opt.isDefaultIncluded}
                                      onChange={(e) => handlePackageOptionChange(editingPackage.id, optIdx, 'isDefaultIncluded', e.target.checked)}
                                      className="w-4 h-4 text-deepgreen accent-deepgreen rounded cursor-pointer"
                                    />
                                    <span className="text-[11px] font-bold text-gray-700">기본포함</span>
                                  </label>

                                  <label className="flex items-center gap-1.5 cursor-pointer bg-white px-2.5 py-1.5 rounded-lg border">
                                    <input
                                      type="checkbox"
                                      checked={opt.isRequired}
                                      onChange={(e) => handlePackageOptionChange(editingPackage.id, optIdx, 'isRequired', e.target.checked)}
                                      className="w-4 h-4 text-red-500 accent-red-500 rounded cursor-pointer"
                                    />
                                    <span className="text-[11px] font-bold text-red-600">필수 항목</span>
                                  </label>
                                </div>

                                <div className="md:col-span-1 text-right">
                                  <button
                                    onClick={() => handlePackageOptionRemove(editingPackage.id, optIdx)}
                                    className="px-2.5 py-1.5 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg text-xs font-bold transition"
                                    title="옵션 삭제"
                                  >
                                    삭제
                                  </button>
                                </div>

                              </div>

                              <div>
                                <input
                                  type="text"
                                  placeholder="고객 안내용 세부 설명 (예: 전 일정 18홀 라운딩 3회 그린피 포함)"
                                  value={opt.description || ''}
                                  onChange={(e) => handlePackageOptionChange(editingPackage.id, optIdx, 'description', e.target.value)}
                                  className="w-full p-2 bg-white border border-gray-200 rounded-xl text-xs text-gray-600 outline-none"
                                />
                              </div>

                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* TAB 3: ITINERARY MANAGER */}
                    {packageModalTab === 'itinerary' && (
                      <div className="space-y-4 animate-fade-in">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-3">
                          <div>
                            <h5 className="font-black text-base text-deepgreen flex items-center gap-1.5">
                              <span>📅</span> {editingPackage.duration || `${editingPackage.itinerary?.length || 0}일차`} 맞춤 일정표 관리 (총 {editingPackage.itinerary?.length || 0}일차)
                            </h5>
                            <p className="text-xs text-gray-500">
                              일차를 자유롭게 추가하거나 줄일 수 있으며, 순서 변경 및 일차별 세부 활동을 구성하세요.
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => handlePackageItineraryDayAdd(editingPackage.id)}
                            className="px-4 py-2 bg-deepgreen text-white rounded-xl text-xs font-bold hover:bg-gold-600 transition shadow-sm flex items-center gap-1 self-start sm:self-auto"
                          >
                            + 일차(Day) 추가
                          </button>
                        </div>

                        {/* Quick Day Presets */}
                        <div className="bg-emerald-50/80 p-3 rounded-2xl border border-emerald-200 flex flex-wrap items-center gap-2">
                          <span className="text-xs font-bold text-deepgreen">⚡ 빠른 일정 칸 수 조정:</span>
                          {[
                            { label: '3일 (2박 3일)', days: 3, dur: '2박 3일' },
                            { label: '4일 (3박 4일)', days: 4, dur: '3박 4일' },
                            { label: '5일 (4박 5일)', days: 5, dur: '4박 5일' },
                            { label: '6일 (5박 6일)', days: 6, dur: '5박 6일' },
                            { label: '7일 (6박 7일)', days: 7, dur: '6박 7일' },
                          ].map(preset => (
                            <button
                              key={preset.days}
                              type="button"
                              onClick={() => handlePackageQuickDayAdjust(editingPackage.id, preset.days, preset.dur)}
                              className="px-2.5 py-1 bg-white hover:bg-deepgreen hover:text-white text-gray-700 rounded-lg text-xs font-bold transition border border-emerald-300 shadow-xs active:scale-95"
                            >
                              {preset.label}
                            </button>
                          ))}
                        </div>

                        <div className="space-y-4">
                          {editingPackage.itinerary?.map((day, dIdx) => (
                            <div key={dIdx} className="bg-gray-50 p-4 sm:p-5 rounded-2xl border border-gray-200 space-y-3 text-xs">
                              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                <div className="flex items-center gap-2 flex-1 w-full sm:w-auto">
                                  <span className="px-3 py-1.5 bg-deepgreen text-white font-black rounded-xl text-xs shrink-0 shadow-xs">
                                    Day {day.day}
                                  </span>
                                  <input
                                    type="text"
                                    value={day.title}
                                    onChange={(e) => handlePackageItineraryTitleChange(editingPackage.id, dIdx, e.target.value)}
                                    placeholder="일정 제목 (예: 호치민 공항 도착 및 호텔 체크인)"
                                    className="flex-1 p-2 bg-white border border-gray-300 rounded-xl font-bold text-xs outline-none focus:ring-1 focus:ring-gold-500"
                                  />
                                </div>
                                
                                <div className="flex items-center gap-1.5 self-end sm:self-auto">
                                  <button
                                    type="button"
                                    disabled={dIdx === 0}
                                    onClick={() => handlePackageItineraryDayMove(editingPackage.id, dIdx, 'up')}
                                    className="px-2 py-1 bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-30 rounded-lg text-xs font-bold transition"
                                    title="위로 이동"
                                  >
                                    ▲
                                  </button>
                                  <button
                                    type="button"
                                    disabled={dIdx === (editingPackage.itinerary?.length || 0) - 1}
                                    onClick={() => handlePackageItineraryDayMove(editingPackage.id, dIdx, 'down')}
                                    className="px-2 py-1 bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 disabled:opacity-30 rounded-lg text-xs font-bold transition"
                                    title="아래로 이동"
                                  >
                                    ▼
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handlePackageItineraryDayRemove(editingPackage.id, dIdx)}
                                    className="text-red-500 font-bold text-xs hover:bg-red-50 px-2.5 py-1 rounded-lg transition border border-red-200"
                                  >
                                    일차 삭제
                                  </button>
                                </div>
                              </div>

                              <div className="space-y-2 pl-4 border-l-2 border-deepgreen/40">
                                <label className="text-[11px] font-bold text-gray-500 block">세부 활동 목록:</label>
                                {day.activities.map((act, aIdx) => (
                                  <div key={aIdx} className="flex gap-2 items-center">
                                    <span className="text-gray-400 text-xs font-bold">{aIdx + 1}.</span>
                                    <input
                                      type="text"
                                      value={act}
                                      onChange={(e) => handlePackageItineraryActivityChange(editingPackage.id, dIdx, aIdx, e.target.value)}
                                      className="flex-1 p-2 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-gold-400"
                                      placeholder="활동 내용 입력"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handlePackageItineraryActivityRemove(editingPackage.id, dIdx, aIdx)}
                                      className="text-gray-400 hover:text-red-500 text-xs px-2 py-1"
                                      title="활동 삭제"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ))}
                                <button
                                  type="button"
                                  onClick={() => handlePackageItineraryActivityAdd(editingPackage.id, dIdx)}
                                  className="text-deepgreen hover:underline text-xs font-black mt-1.5 inline-block"
                                >
                                  + 활동 추가
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="pt-2 text-center">
                          <button
                            type="button"
                            onClick={() => handlePackageItineraryDayAdd(editingPackage.id)}
                            className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-deepgreen font-black text-xs rounded-2xl transition border-2 border-dashed border-gray-300 flex items-center justify-center gap-1.5"
                          >
                            <span>➕</span> 새로운 일차(Day {(editingPackage.itinerary?.length || 0) + 1}) 추가하기
                          </button>
                        </div>
                      </div>
                    )}

                  </div>

                  {/* Modal Sticky Footer */}
                  <div className="bg-gray-50 border-t border-gray-200 px-4 sm:px-6 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 font-bold">기본 산출가:</span>
                        <span className="text-lg font-black text-deepgreen">${editingPackage.basePriceUSD?.toLocaleString()}</span>
                        <span className="text-xs text-gray-400 font-bold">(약 {((editingPackage.basePriceUSD || 0) * 1360).toLocaleString()}원)</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRequestDeletePackage(editingPackage)}
                        className="px-3.5 py-1.5 bg-red-50 hover:bg-red-600 hover:text-white text-red-600 rounded-xl font-bold text-xs transition border border-red-200 flex items-center gap-1 active:scale-95 cursor-pointer shadow-xs"
                      >
                        🗑️ 상품 삭제
                      </button>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button
                        onClick={() => setEditingPackage(null)}
                        className="flex-1 sm:flex-none px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold text-xs rounded-xl transition"
                      >
                        닫기
                      </button>
                      <button
                        onClick={() => {
                          setEditingPackage(null);
                          alert('수정 내용이 저장되었습니다.');
                        }}
                        className="flex-1 sm:flex-none px-6 py-2.5 bg-deepgreen hover:bg-gold-600 text-white font-black text-xs rounded-xl shadow-md transition active:scale-95"
                      >
                        ✓ 편집 완료 및 닫기
                      </button>
                    </div>
                  </div>

                </div>
              </div>
            )}
            </>
            )}

            {/* SUB-VIEW 2: MASTER OPTIONS POOL MANAGEMENT */}
            {plannerSubTab === 'masterPool' && (
              <div className="space-y-6 animate-fade-in">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                      <span>🌐</span> DIY 6단계 플래너 항목·단가 통합 관리 센터
                    </h3>
                    <p className="text-xs text-gray-500 mt-1 max-w-2xl leading-relaxed">
                      <strong>지역 5곳 · 골프장 · 여행/자유여행 · 숙박 4종 · 차량 4종 · 기타 부가서비스 3종</strong>의 명칭, 설명, 개별 단가($)를 수정·추가·삭제하면 고객 DIY 페이지와 실시간 견적에 즉시 반영됩니다.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleResetMasterOptionPool}
                      className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl font-bold text-xs transition flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer border border-red-200"
                    >
                      <span>🔄</span> 기본 풀로 초기화
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setNewPoolItem({
                          category: poolCategory,
                          name: '',
                          shortName: '',
                          icon: '✨',
                          location: '호치민',
                          holes: 18,
                          type: 'hotel_5star',
                          priceUSD: poolCategory === 'golf' ? 150 : poolCategory === 'tour' ? 80 : 50,
                          priceDeltaUSD: 0,
                          pricingUnit: 'per_person',
                          isFreeTravel: false,
                          description: '',
                          badge: ''
                        });
                        setShowAddPoolModal(true);
                      }}
                      className="px-5 py-2.5 bg-deepgreen text-white rounded-xl font-bold text-xs hover:bg-gold-600 transition flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
                    >
                      <span>➕</span> 새 옵션 항목 추가
                    </button>
                  </div>
                </div>

                {/* Pool Category Selector */}
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                  {[
                    { id: 'region' as const, label: '📍 지역 5곳', count: (masterOptionPool.diyRegions || INITIAL_MASTER_OPTION_POOL.diyRegions || []).length },
                    { id: 'golf' as const, label: '⛳ 골프장 풀', count: masterOptionPool.golfCourses?.length || 0 },
                    { id: 'tour' as const, label: '🗺️ 여행/자유여행', count: (masterOptionPool.tourOptions || INITIAL_MASTER_OPTION_POOL.tourOptions || []).length },
                    { id: 'hotel' as const, label: '🏨 숙박 4종 풀', count: (masterOptionPool.accommodationTiers || INITIAL_MASTER_OPTION_POOL.accommodationTiers || []).length },
                    { id: 'vehicle' as const, label: '🚐 차량 4종 풀', count: masterOptionPool.vehicles?.length || 0 },
                    { id: 'extra' as const, label: '✨ 기타 서비스 3종', count: (masterOptionPool.extraServices || INITIAL_MASTER_OPTION_POOL.extraServices || []).length },
                    { id: 'guide' as const, label: '👨‍💼 세부 가이드 풀', count: masterOptionPool.guides?.length || 0 },
                    { id: 'meal' as const, label: '🦞 세부 식사 풀', count: masterOptionPool.meals?.length || 0 },
                  ].map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setPoolCategory(cat.id)}
                      className={`px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm font-black whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                        poolCategory === cat.id
                          ? 'bg-deepgreen text-white shadow-md scale-102'
                          : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <span>{cat.label}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                        poolCategory === cat.id ? 'bg-gold-500 text-white' : 'bg-gray-100 text-gray-500'
                      }`}>
                        {cat.count}
                      </span>
                    </button>
                  ))}
                </div>

                {/* CATEGORY 0: DIY REGIONS (5곳) */}
                {poolCategory === 'region' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200">
                      <div className="text-xs text-emerald-900">
                        <strong className="font-black">📍 1단계 여행 지역 버튼 관리 (총 {(masterOptionPool.diyRegions || INITIAL_MASTER_OPTION_POOL.diyRegions || []).length}곳)</strong>
                        <span className="block text-[11px] text-emerald-700 mt-0.5">
                          호치민, 붕따우, 무이네, 나트랑, 달랏 등 1단계 지역 버튼 이름과 지역 기본 추가금($)을 수정할 수 있습니다.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setNewPoolItem({
                            category: 'region',
                            name: '',
                            icon: '🌴',
                            location: '호치민',
                            priceUSD: 0,
                            priceDeltaUSD: 0,
                            description: '',
                            badge: ''
                          });
                          setShowAddPoolModal(true);
                        }}
                        className="px-3.5 py-1.5 bg-deepgreen text-white text-xs font-bold rounded-xl shadow hover:bg-gold-600 transition shrink-0"
                      >
                        + 지역 추가
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {(masterOptionPool.diyRegions || INITIAL_MASTER_OPTION_POOL.diyRegions || []).map((reg) => (
                        <div key={reg.id} className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-3 flex flex-col justify-between">
                          <div className="space-y-2.5">
                            <div className="flex items-center justify-between gap-2">
                              <button
                                type="button"
                                onClick={() => openIconPicker('pool', 'region', reg.id, reg.name || '지역', reg.icon || '🌴')}
                                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-xl bg-gray-50 hover:bg-emerald-50 border border-gray-200 hover:border-emerald-400 transition cursor-pointer group"
                                title="클릭하여 아이콘 변경"
                              >
                                {isImageIconUrl(reg.icon) ? (
                                  <img src={getFreshImageUrl(reg.icon)} alt={reg.name} className="w-7 h-7 object-contain rounded-md shrink-0" />
                                ) : (
                                  <span className="text-2xl leading-none">{reg.icon || '🌴'}</span>
                                )}
                                <span className="text-[10px] font-bold text-gray-500 group-hover:text-deepgreen whitespace-nowrap">아이콘 변경</span>
                              </button>
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded whitespace-nowrap">
                                기본 추가금 ${reg.baseFeeUSD || 0}
                              </span>
                            </div>
                            <div className="grid grid-cols-12 gap-2 items-end">
                              <div className="col-span-5 sm:col-span-5">
                                <label className="text-[10px] font-bold text-gray-400 block mb-0.5">아이콘</label>
                                <button
                                  type="button"
                                  onClick={() => openIconPicker('pool', 'region', reg.id, reg.name || '지역', reg.icon || '🌴')}
                                  className="w-full h-9 px-2 bg-gray-50 hover:bg-emerald-50 border border-gray-200 hover:border-emerald-400 rounded-lg flex items-center justify-center gap-1.5 transition cursor-pointer group"
                                >
                                  {isImageIconUrl(reg.icon) ? (
                                    <img src={getFreshImageUrl(reg.icon)} alt={reg.name} className="w-5 h-5 object-contain rounded shrink-0" />
                                  ) : (
                                    <span className="text-base leading-none">{reg.icon || '🌴'}</span>
                                  )}
                                  <span className="text-[11px] font-bold text-deepgreen group-hover:text-emerald-700 whitespace-nowrap">변경</span>
                                </button>
                              </div>
                              <div className="col-span-7 sm:col-span-7">
                                <label className="text-[10px] font-bold text-gray-400 block mb-0.5">지역명</label>
                                <input
                                  type="text"
                                  value={reg.name}
                                  onChange={(e) => handleUpdateMasterOptionPoolItem('region', reg.id, 'name', e.target.value)}
                                  className="w-full font-bold text-sm text-gray-900 border-b border-gray-200 pb-1 outline-none focus:border-gold-500"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-gray-400 block mb-0.5">지역 기본 추가금 ($ USD)</label>
                              <input
                                type="number"
                                value={reg.baseFeeUSD}
                                onChange={(e) => handleUpdateMasterOptionPoolItem('region', reg.id, 'baseFeeUSD', Number(e.target.value) || 0)}
                                className="w-full p-1.5 bg-gray-50 border rounded-lg text-xs font-black text-deepgreen outline-none"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-gray-400 block mb-0.5">설명</label>
                              <input
                                type="text"
                                value={reg.subtitle}
                                onChange={(e) => handleUpdateMasterOptionPoolItem('region', reg.id, 'subtitle', e.target.value)}
                                className="w-full p-1.5 bg-gray-50 border rounded-lg text-xs text-gray-600 outline-none"
                              />
                            </div>
                          </div>
                          <div className="pt-2 border-t flex justify-end">
                            <button
                              type="button"
                              onClick={() => handleDeleteMasterOptionPoolItem('region', reg.id, reg.name)}
                              className="px-3 py-1 bg-red-50 hover:bg-red-500 text-red-500 hover:text-white rounded-lg text-xs font-bold transition"
                            >
                              삭제
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* CATEGORY 1: GOLF COURSES */}
                {poolCategory === 'golf' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200">
                      <div className="text-xs text-emerald-900">
                        <strong className="font-black">⛳ 등록된 라운딩 골프장: 총 {masterOptionPool.golfCourses?.length || 0}개</strong>
                        <span className="block text-[11px] text-emerald-700 mt-0.5">
                          3단계에서 고객이 &apos;골프&apos; 선택 시 열리는 팝업 목록과 1회 라운딩 단가($ USD)에 즉시 반영됩니다.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setNewPoolItem({
                            category: 'golf',
                            name: '',
                            location: '호치민',
                            holes: 18,
                            type: 'hotel_5star',
                            priceUSD: 155,
                            priceDeltaUSD: 0,
                            description: '',
                            badge: ''
                          });
                          setShowAddPoolModal(true);
                        }}
                        className="px-3.5 py-1.5 bg-deepgreen text-white text-xs font-bold rounded-xl shadow hover:bg-gold-600 transition shrink-0"
                      >
                        + 골프장 추가
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {masterOptionPool.golfCourses?.map((gc) => (
                        <div key={gc.id} className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition space-y-3 flex flex-col justify-between">
                          <div className="space-y-2.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="px-2.5 py-0.5 bg-deepgreen text-white text-[10px] font-bold rounded-md">
                                📍 {gc.location}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
                                  {gc.holes}홀
                                </span>
                                {gc.badge && (
                                  <span className="px-2 py-0.5 bg-gold-100 text-gold-800 text-[10px] font-bold rounded">
                                    {gc.badge}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div>
                              <label className="text-[10px] font-bold text-gray-400 block mb-0.5">골프장 명칭</label>
                              <input
                                type="text"
                                value={gc.name}
                                onChange={(e) => handleUpdateMasterOptionPoolItem('golf', gc.id, 'name', e.target.value)}
                                className="w-full font-bold text-sm text-gray-900 border-b border-gray-200 pb-1 outline-none focus:border-gold-500"
                              />
                            </div>

                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <div>
                                <label className="text-[10px] font-bold text-gray-400 block mb-0.5">지역</label>
                                <select
                                  value={gc.location}
                                  onChange={(e) => handleUpdateMasterOptionPoolItem('golf', gc.id, 'location', e.target.value)}
                                  className="w-full p-1.5 bg-gray-50 border rounded-lg text-xs font-bold outline-none"
                                >
                                  <option value="호치민">호치민</option>
                                  <option value="붕따우">붕따우</option>
                                  <option value="무이네">무이네</option>
                                  <option value="나트랑">나트랑</option>
                                  <option value="달랏">달랏</option>
                                </select>
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-gray-400 block mb-0.5">1회 단가($)</label>
                                <input
                                  type="number"
                                  value={gc.priceUSD ?? Math.max(80, 155 + (gc.priceDeltaUSD || 0))}
                                  onChange={(e) => handleUpdateMasterOptionPoolItem('golf', gc.id, 'priceUSD', Number(e.target.value) || 0)}
                                  className="w-full p-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-black text-deepgreen outline-none"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-gray-400 block mb-0.5">차액($)</label>
                                <input
                                  type="number"
                                  value={gc.priceDeltaUSD}
                                  onChange={(e) => handleUpdateMasterOptionPoolItem('golf', gc.id, 'priceDeltaUSD', Number(e.target.value) || 0)}
                                  className="w-full p-1.5 bg-gray-50 border rounded-lg text-xs font-bold text-gray-700 outline-none"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="text-[10px] font-bold text-gray-400 block mb-0.5">강조 뱃지 (선택)</label>
                              <input
                                type="text"
                                value={gc.badge || ''}
                                onChange={(e) => handleUpdateMasterOptionPoolItem('golf', gc.id, 'badge', e.target.value)}
                                placeholder="예: 인기 1위, KLPGA 대회 등"
                                className="w-full p-1.5 bg-gray-50 border rounded-lg text-xs outline-none"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] font-bold text-gray-400 block mb-0.5">골프장 설명</label>
                              <textarea
                                value={gc.description}
                                onChange={(e) => handleUpdateMasterOptionPoolItem('golf', gc.id, 'description', e.target.value)}
                                rows={2}
                                className="w-full p-2 bg-gray-50 border rounded-xl text-xs text-gray-600 outline-none resize-none"
                              />
                            </div>
                          </div>

                          <div className="pt-2 border-t flex justify-end">
                            <button
                              type="button"
                              onClick={() => handleDeleteMasterOptionPoolItem('golf', gc.id, gc.name)}
                              className="px-3 py-1 bg-red-50 hover:bg-red-500 text-red-500 hover:text-white rounded-lg text-xs font-bold transition"
                            >
                              삭제
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* CATEGORY 1.5: TOUR & FREE TRAVEL OPTIONS */}
                {poolCategory === 'tour' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200">
                      <div className="text-xs text-amber-950">
                        <strong className="font-black">🗺️ 3단계 &apos;여행 / 자유여행&apos; 팝업 상품 풀 (총 {(masterOptionPool.tourOptions || INITIAL_MASTER_OPTION_POOL.tourOptions || []).length}개)</strong>
                        <span className="block text-[11px] text-amber-800 mt-0.5">
                          고객이 3단계에서 &apos;여행&apos; 선택 시 나타나는 자유 여행 및 지역별 관광 상품 목록입니다.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setNewPoolItem({
                            category: 'tour',
                            name: '',
                            location: '호치민',
                            priceUSD: 80,
                            priceDeltaUSD: 0,
                            isFreeTravel: false,
                            description: '',
                            badge: '추천 투어'
                          });
                          setShowAddPoolModal(true);
                        }}
                        className="px-3.5 py-1.5 bg-deepgreen text-white text-xs font-bold rounded-xl shadow hover:bg-gold-600 transition shrink-0"
                      >
                        + 여행 상품 추가
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {(masterOptionPool.tourOptions || INITIAL_MASTER_OPTION_POOL.tourOptions || []).map((t) => (
                        <div key={t.id} className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-3 flex flex-col justify-between">
                          <div className="space-y-2.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="px-2.5 py-0.5 bg-amber-600 text-white text-[10px] font-bold rounded-md">
                                📍 {t.location}
                              </span>
                              <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${t.isFreeTravel ? 'bg-emerald-100 text-emerald-800' : 'bg-gold-100 text-gold-800'}`}>
                                {t.isFreeTravel ? '자유 여행 모드' : (t.badge || '관광 투어')}
                              </span>
                            </div>

                            <div>
                              <label className="text-[10px] font-bold text-gray-400 block mb-0.5">상품 / 투어 명칭</label>
                              <input
                                type="text"
                                value={t.name}
                                onChange={(e) => handleUpdateMasterOptionPoolItem('tour', t.id, 'name', e.target.value)}
                                className="w-full font-bold text-sm text-gray-900 border-b border-gray-200 pb-1 outline-none focus:border-gold-500"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <label className="text-[10px] font-bold text-gray-400 block mb-0.5">지역</label>
                                <select
                                  value={t.location}
                                  onChange={(e) => handleUpdateMasterOptionPoolItem('tour', t.id, 'location', e.target.value)}
                                  className="w-full p-1.5 bg-gray-50 border rounded-lg text-xs font-bold outline-none"
                                >
                                  <option value="전체">전체 (자유여행)</option>
                                  <option value="호치민">호치민</option>
                                  <option value="붕따우">붕따우</option>
                                  <option value="무이네">무이네</option>
                                  <option value="나트랑">나트랑</option>
                                  <option value="달랏">달랏</option>
                                </select>
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-gray-400 block mb-0.5">1인 단가 ($ USD)</label>
                                <input
                                  type="number"
                                  value={t.priceUSD}
                                  onChange={(e) => handleUpdateMasterOptionPoolItem('tour', t.id, 'priceUSD', Number(e.target.value) || 0)}
                                  className="w-full p-1.5 bg-amber-50 border border-amber-200 rounded-lg text-xs font-black text-amber-900 outline-none"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="text-[10px] font-bold text-gray-400 block mb-0.5">강조 뱃지</label>
                              <input
                                type="text"
                                value={t.badge || ''}
                                onChange={(e) => handleUpdateMasterOptionPoolItem('tour', t.id, 'badge', e.target.value)}
                                className="w-full p-1.5 bg-gray-50 border rounded-lg text-xs outline-none"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] font-bold text-gray-400 block mb-0.5">상품 설명</label>
                              <textarea
                                value={t.description}
                                onChange={(e) => handleUpdateMasterOptionPoolItem('tour', t.id, 'description', e.target.value)}
                                rows={2}
                                className="w-full p-2 bg-gray-50 border rounded-xl text-xs text-gray-600 outline-none resize-none"
                              />
                            </div>
                          </div>

                          <div className="pt-2 border-t flex justify-end">
                            <button
                              type="button"
                              onClick={() => handleDeleteMasterOptionPoolItem('tour', t.id, t.name)}
                              className="px-3 py-1 bg-red-50 hover:bg-red-500 text-red-500 hover:text-white rounded-lg text-xs font-bold transition"
                            >
                              삭제
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* CATEGORY 2: ACCOMMODATIONS (4종 메인 카드 + 지역별 상세 풀) */}
                {poolCategory === 'hotel' && (
                  <div className="space-y-6">
                    {/* DIY 4종 숙박 카드 관리 */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200">
                        <div className="text-xs text-emerald-950">
                          <strong className="font-black">🏨 4단계 숙박 4종 카드 단가·설명 관리</strong>
                          <span className="block text-[11px] text-emerald-800 mt-0.5">
                            DIY 4단계에 표시되는 고급 호텔, 럭셔리 프라이빗 풀빌라, 4성급 실속 호텔, 골프&비치 리조트의 1박 단가($)와 설명을 수정합니다.
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setNewPoolItem({
                              category: 'hotelTier',
                              name: '',
                              icon: '🏨',
                              location: '호치민',
                              priceUSD: 90,
                              priceDeltaUSD: 0,
                              description: '',
                              badge: ''
                            });
                            setShowAddPoolModal(true);
                          }}
                          className="px-3.5 py-1.5 bg-deepgreen text-white text-xs font-bold rounded-xl shadow hover:bg-gold-600 transition shrink-0"
                        >
                          + 숙박 타입 추가
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                        {(masterOptionPool.accommodationTiers || INITIAL_MASTER_OPTION_POOL.accommodationTiers || []).map((tier) => (
                          <div key={tier.id} className="bg-white p-4 rounded-2xl border-2 border-emerald-200/80 shadow-sm space-y-2.5 flex flex-col justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center justify-between gap-2">
                                <button
                                  type="button"
                                  onClick={() => openIconPicker('pool', 'hotelTier', tier.id, tier.name || '숙박', tier.icon || '🏨')}
                                  className="inline-flex items-center gap-1.5 px-2 py-1 rounded-xl bg-gray-50 hover:bg-emerald-50 border border-gray-200 hover:border-emerald-400 transition cursor-pointer group"
                                  title="클릭하여 아이콘 변경"
                                >
                                  {isImageIconUrl(tier.icon) ? (
                                    <img src={getFreshImageUrl(tier.icon)} alt={tier.name} className="w-6 h-6 object-contain rounded shrink-0" />
                                  ) : (
                                    <span className="text-xl leading-none">{tier.icon || '🏨'}</span>
                                  )}
                                  <span className="text-[10px] font-bold text-gray-500 group-hover:text-deepgreen whitespace-nowrap">변경</span>
                                </button>
                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded whitespace-nowrap">
                                  1박 ${tier.pricePerNightUSD}
                                </span>
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-gray-400 block mb-0.5">카드 명칭</label>
                                <input
                                  type="text"
                                  value={tier.name}
                                  onChange={(e) => handleUpdateMasterOptionPoolItem('hotelTier', tier.id, 'name', e.target.value)}
                                  className="w-full font-bold text-sm text-gray-900 border-b border-gray-200 pb-1 outline-none focus:border-emerald-500"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-gray-400 block mb-0.5">1박 1인 단가 ($ USD)</label>
                                <input
                                  type="number"
                                  value={tier.pricePerNightUSD}
                                  onChange={(e) => handleUpdateMasterOptionPoolItem('hotelTier', tier.id, 'pricePerNightUSD', Number(e.target.value) || 0)}
                                  className="w-full p-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-black text-deepgreen outline-none"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-gray-400 block mb-0.5">카드 설명</label>
                                <textarea
                                  value={tier.description}
                                  onChange={(e) => handleUpdateMasterOptionPoolItem('hotelTier', tier.id, 'description', e.target.value)}
                                  rows={2}
                                  className="w-full p-2 bg-gray-50 border rounded-xl text-xs text-gray-600 outline-none resize-none"
                                />
                              </div>
                            </div>
                            <div className="pt-2 border-t flex justify-end">
                              <button
                                type="button"
                                onClick={() => handleDeleteMasterOptionPoolItem('hotelTier', tier.id, tier.name)}
                                className="px-3 py-1 bg-red-50 hover:bg-red-500 text-red-500 hover:text-white rounded-lg text-xs font-bold transition"
                              >
                                삭제
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 지역별 세부 숙박 시설 풀 */}
                    <div className="flex justify-between items-center bg-blue-50/70 p-3.5 rounded-2xl border border-blue-200">
                      <div className="text-xs text-blue-900">
                        <strong className="font-black">🏨 지역별 세부 숙박/풀빌라 풀: 총 {masterOptionPool.accommodations?.length || 0}개</strong>
                        <span className="block text-[11px] text-blue-700 mt-0.5">
                          상세 견적서 화면에서 숙소를 특정 호텔·풀빌라로 교체할 때 표시되는 옵션 풀입니다.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setNewPoolItem({
                            category: 'hotel',
                            name: '',
                            location: '호치민',
                            holes: 18,
                            type: 'pool_villa',
                            priceDeltaUSD: 60,
                            description: '',
                            badge: '독채 풀빌라'
                          });
                          setShowAddPoolModal(true);
                        }}
                        className="px-3.5 py-1.5 bg-deepgreen text-white text-xs font-bold rounded-xl shadow hover:bg-gold-600 transition shrink-0"
                      >
                        + 세부 숙박 추가
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {masterOptionPool.accommodations?.map((acc) => (
                        <div key={acc.id} className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition space-y-3 flex flex-col justify-between">
                          <div className="space-y-2.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="px-2.5 py-0.5 bg-blue-700 text-white text-[10px] font-bold rounded-md">
                                📍 {acc.location}
                              </span>
                              <div className="flex items-center gap-1.5">
                                <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                                  acc.type === 'pool_villa' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {acc.type === 'pool_villa' ? '독채 풀빌라' : acc.type === 'hotel_5star' ? '고급 호텔' : acc.type === 'resort' ? '리조트' : '4성급 호텔'}
                                </span>
                                {acc.badge && (
                                  <span className="px-2 py-0.5 bg-gold-100 text-gold-800 text-[10px] font-bold rounded">
                                    {acc.badge}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div>
                              <label className="text-[10px] font-bold text-gray-400 block mb-0.5">숙박 명칭</label>
                              <input
                                type="text"
                                value={acc.name}
                                onChange={(e) => handleUpdateMasterOptionPoolItem('hotel', acc.id, 'name', e.target.value)}
                                className="w-full font-bold text-sm text-gray-900 border-b border-gray-200 pb-1 outline-none focus:border-gold-500"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <label className="text-[10px] font-bold text-gray-400 block mb-0.5">타입</label>
                                <select
                                  value={acc.type}
                                  onChange={(e) => handleUpdateMasterOptionPoolItem('hotel', acc.id, 'type', e.target.value as any)}
                                  className="w-full p-1.5 bg-gray-50 border rounded-lg text-xs font-bold outline-none"
                                >
                                  <option value="hotel_5star">고급 호텔</option>
                                  <option value="pool_villa">독채 풀빌라</option>
                                  <option value="resort">리조트</option>
                                  <option value="hotel_4star">4성급 호텔</option>
                                </select>
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-gray-400 block mb-0.5">1인 가격차액 ($ USD)</label>
                                <input
                                  type="number"
                                  value={acc.priceDeltaUSD}
                                  onChange={(e) => handleUpdateMasterOptionPoolItem('hotel', acc.id, 'priceDeltaUSD', Number(e.target.value) || 0)}
                                  className="w-full p-1.5 bg-gray-50 border rounded-lg text-xs font-black text-blue-700 outline-none"
                                />
                              </div>
                            </div>

                            <div>
                              <label className="text-[10px] font-bold text-gray-400 block mb-0.5">숙박 설명</label>
                              <textarea
                                value={acc.description}
                                onChange={(e) => handleUpdateMasterOptionPoolItem('hotel', acc.id, 'description', e.target.value)}
                                rows={2}
                                className="w-full p-2 bg-gray-50 border rounded-xl text-xs text-gray-600 outline-none resize-none"
                              />
                            </div>
                          </div>

                          <div className="pt-2 border-t flex justify-end">
                            <button
                              type="button"
                              onClick={() => handleDeleteMasterOptionPoolItem('hotel', acc.id, acc.name)}
                              className="px-3 py-1 bg-red-50 hover:bg-red-500 text-red-500 hover:text-white rounded-lg text-xs font-bold transition"
                            >
                              삭제
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* CATEGORY 3: VEHICLE 4종 */}
                {poolCategory === 'vehicle' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center bg-gray-50 p-3.5 rounded-2xl border border-gray-200">
                      <div className="text-xs text-gray-800">
                        <strong className="font-black">🚐 5단계 차량 4종 (7인승 · 9인승 · 16인승 · 26인승) 관리</strong>
                        <span className="block text-[11px] text-gray-500 mt-0.5">
                          차량 카드 표기명(7인승 등), 세부 명칭, 1일 1인 기준 단가($), 설명 수정 시 고객 페이지에 즉시 반영됩니다.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setNewPoolItem({
                            category: 'vehicle',
                            name: '',
                            shortName: '',
                            icon: '🚐',
                            location: '호치민',
                            priceUSD: 25,
                            priceDeltaUSD: 0,
                            description: '',
                            badge: ''
                          });
                          setShowAddPoolModal(true);
                        }}
                        className="px-3.5 py-1.5 bg-deepgreen text-white text-xs font-bold rounded-xl shadow hover:bg-gold-600 transition shrink-0"
                      >
                        + 차량 추가
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {(masterOptionPool.vehicles || []).map((item) => (
                        <div key={item.id} className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition space-y-2.5 flex flex-col justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <button
                                type="button"
                                onClick={() => openIconPicker('pool', 'vehicle', item.id, item.shortName || item.name || '차량', item.icon || '🚐')}
                                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-xl bg-gray-50 hover:bg-emerald-50 border border-gray-200 hover:border-emerald-400 transition cursor-pointer group"
                                title="클릭하여 아이콘 변경"
                              >
                                {isImageIconUrl(item.icon) ? (
                                  <img src={getFreshImageUrl(item.icon)} alt={item.name} className="w-6 h-6 object-contain rounded shrink-0" />
                                ) : (
                                  <span className="text-xl leading-none">{item.icon || '🚐'}</span>
                                )}
                                <span className="text-[10px] font-bold text-gray-500 group-hover:text-deepgreen whitespace-nowrap">변경</span>
                              </button>
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded whitespace-nowrap">
                                1일 ${item.pricePerDayUSD ?? 25} (팀/일)
                              </span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <label className="text-[10px] font-bold text-gray-400 block mb-0.5">단축명</label>
                                <input
                                  type="text"
                                  value={item.shortName || ''}
                                  onChange={(e) => handleUpdateMasterOptionPoolItem('vehicle', item.id, 'shortName', e.target.value)}
                                  placeholder="예: 7인승"
                                  className="w-full p-1.5 bg-gray-50 border rounded-lg text-xs font-black text-deepgreen outline-none"
                                />
                              </div>
                              <div className="col-span-2">
                                <label className="text-[10px] font-bold text-gray-400 block mb-0.5">차량 명칭</label>
                                <input
                                  type="text"
                                  value={item.name}
                                  onChange={(e) => handleUpdateMasterOptionPoolItem('vehicle', item.id, 'name', e.target.value)}
                                  className="w-full font-bold text-xs text-gray-900 border-b border-gray-200 pb-1 outline-none"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[10px] font-bold text-gray-400 block mb-0.5">1일 단가($/일·팀)</label>
                                <input
                                  type="number"
                                  value={item.pricePerDayUSD ?? 25}
                                  onChange={(e) => handleUpdateMasterOptionPoolItem('vehicle', item.id, 'pricePerDayUSD', Number(e.target.value) || 0)}
                                  className="w-full p-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-black text-deepgreen outline-none"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-gray-400 block mb-0.5">세부 차액($)</label>
                                <input
                                  type="number"
                                  value={item.priceDeltaUSD}
                                  onChange={(e) => handleUpdateMasterOptionPoolItem('vehicle', item.id, 'priceDeltaUSD', Number(e.target.value) || 0)}
                                  className="w-full p-1.5 bg-gray-50 border rounded-lg text-xs font-bold text-gray-700 outline-none"
                                />
                              </div>
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-gray-400 block mb-0.5">설명</label>
                              <textarea
                                value={item.description}
                                onChange={(e) => handleUpdateMasterOptionPoolItem('vehicle', item.id, 'description', e.target.value)}
                                rows={2}
                                className="w-full p-2 bg-gray-50 border rounded-xl text-xs text-gray-600 outline-none resize-none"
                              />
                            </div>
                          </div>
                          <div className="pt-2 border-t flex justify-end">
                            <button
                              type="button"
                              onClick={() => handleDeleteMasterOptionPoolItem('vehicle', item.id, item.name)}
                              className="px-3 py-1 bg-red-50 hover:bg-red-500 text-red-500 hover:text-white rounded-lg text-xs font-bold transition"
                            >
                              삭제
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* CATEGORY 4: EXTRA SERVICES (기타 부가서비스 3종: 가이드, 패스트 트랙, 마사지) */}
                {poolCategory === 'extra' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center bg-purple-50/70 p-3.5 rounded-2xl border border-purple-200">
                      <div className="text-xs text-purple-950">
                        <strong className="font-black">✨ 6단계 기타 부가서비스 3종 (가이드 · 패스트 트랙 · 마사지)</strong>
                        <span className="block text-[11px] text-purple-800 mt-0.5">
                          복수 선택이 가능한 6단계 부가 서비스의 명칭, 단가($ USD), 요금 적용 방식(일당/정액), 설명을 관리합니다.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setNewPoolItem({
                            category: 'extra',
                            name: '',
                            icon: '✨',
                            location: '전체',
                            priceUSD: 50,
                            priceDeltaUSD: 0,
                            pricingUnit: 'per_person',
                            description: '',
                            badge: ''
                          });
                          setShowAddPoolModal(true);
                        }}
                        className="px-3.5 py-1.5 bg-deepgreen text-white text-xs font-bold rounded-xl shadow hover:bg-gold-600 transition shrink-0"
                      >
                        + 서비스 추가
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {(masterOptionPool.extraServices || INITIAL_MASTER_OPTION_POOL.extraServices || []).map((svc) => (
                        <div key={svc.id} className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-2.5 flex flex-col justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <button
                                type="button"
                                onClick={() => openIconPicker('pool', 'extra', svc.id, svc.name || '부가서비스', svc.icon || '✨')}
                                className="inline-flex items-center gap-1.5 px-2 py-1 rounded-xl bg-gray-50 hover:bg-purple-50 border border-gray-200 hover:border-purple-400 transition cursor-pointer group"
                                title="클릭하여 아이콘 변경"
                              >
                                {isImageIconUrl(svc.icon) ? (
                                  <img src={getFreshImageUrl(svc.icon)} alt={svc.name} className="w-6 h-6 object-contain rounded shrink-0" />
                                ) : (
                                  <span className="text-xl leading-none">{svc.icon || '✨'}</span>
                                )}
                                <span className="text-[10px] font-bold text-gray-500 group-hover:text-purple-700 whitespace-nowrap">변경</span>
                              </button>
                              <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-bold rounded whitespace-nowrap">
                                {svc.pricingUnit === 'per_day' ? `1일 $${svc.priceUSD}` : `1인 $${svc.priceUSD}`}
                              </span>
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-gray-400 block mb-0.5">서비스명</label>
                              <input
                                type="text"
                                value={svc.name}
                                onChange={(e) => handleUpdateMasterOptionPoolItem('extra', svc.id, 'name', e.target.value)}
                                className="w-full font-bold text-sm text-gray-900 border-b border-gray-200 pb-1 outline-none"
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-[10px] font-bold text-gray-400 block mb-0.5">단가 ($ USD)</label>
                                <input
                                  type="number"
                                  value={svc.priceUSD}
                                  onChange={(e) => handleUpdateMasterOptionPoolItem('extra', svc.id, 'priceUSD', Number(e.target.value) || 0)}
                                  className="w-full p-1.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-black text-deepgreen outline-none"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] font-bold text-gray-400 block mb-0.5">과금 방식</label>
                                <select
                                  value={svc.pricingUnit}
                                  onChange={(e) => handleUpdateMasterOptionPoolItem('extra', svc.id, 'pricingUnit', e.target.value)}
                                  className="w-full p-1.5 bg-gray-50 border rounded-lg text-xs font-bold outline-none"
                                >
                                  <option value="per_day">1일당 (× 일정)</option>
                                  <option value="per_person">1인 정액</option>
                                </select>
                              </div>
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-gray-400 block mb-0.5">설명</label>
                              <textarea
                                value={svc.description}
                                onChange={(e) => handleUpdateMasterOptionPoolItem('extra', svc.id, 'description', e.target.value)}
                                rows={2}
                                className="w-full p-2 bg-gray-50 border rounded-xl text-xs text-gray-600 outline-none resize-none"
                              />
                            </div>
                          </div>
                          <div className="pt-2 border-t flex justify-end">
                            <button
                              type="button"
                              onClick={() => handleDeleteMasterOptionPoolItem('extra', svc.id, svc.name)}
                              className="px-3 py-1 bg-red-50 hover:bg-red-500 text-red-500 hover:text-white rounded-lg text-xs font-bold transition"
                            >
                              삭제
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* CATEGORIES 5, 6: GUIDE, MEAL */}
                {['guide', 'meal'].includes(poolCategory) && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center bg-gray-50 p-3.5 rounded-2xl border border-gray-200">
                      <div className="text-xs text-gray-800">
                        <strong className="font-black">
                          {poolCategory === 'guide' ? '👨‍💼 세부 가이드 옵션 풀' : '🦞 세부 식사 옵션 풀'}
                        </strong>
                        <span className="block text-[11px] text-gray-500 mt-0.5">
                          상세 견적서 화면에서 선택할 수 있는 {poolCategory === 'guide' ? '가이드' : '식사'} 목록입니다.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setNewPoolItem({
                            category: poolCategory as any,
                            name: '',
                            location: '호치민',
                            holes: 18,
                            type: 'hotel_5star',
                            priceDeltaUSD: 0,
                            description: '',
                            badge: ''
                          });
                          setShowAddPoolModal(true);
                        }}
                        className="px-3.5 py-1.5 bg-deepgreen text-white text-xs font-bold rounded-xl shadow hover:bg-gold-600 transition shrink-0"
                      >
                        + 새 옵션 추가
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {((poolCategory === 'guide' ? masterOptionPool.guides : masterOptionPool.meals) || []).map((item) => (
                        <div key={item.id} className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition space-y-3 flex flex-col justify-between">
                          <div className="space-y-2.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-sm text-gray-900">{item.name}</span>
                              <span className="px-2 py-0.5 bg-gold-100 text-gold-800 text-[10px] font-bold rounded">
                                {item.badge || '옵션'}
                              </span>
                            </div>

                            <div>
                              <label className="text-[10px] font-bold text-gray-400 block mb-0.5">항목명</label>
                              <input
                                type="text"
                                value={item.name}
                                onChange={(e) => handleUpdateMasterOptionPoolItem(poolCategory as any, item.id, 'name', e.target.value)}
                                className="w-full font-bold text-xs text-gray-900 border-b border-gray-200 pb-1 outline-none"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] font-bold text-gray-400 block mb-0.5">1인 가격차액 ($ USD)</label>
                              <input
                                type="number"
                                value={item.priceDeltaUSD}
                                onChange={(e) => handleUpdateMasterOptionPoolItem(poolCategory as any, item.id, 'priceDeltaUSD', Number(e.target.value) || 0)}
                                className="w-full p-1.5 bg-gray-50 border rounded-lg text-xs font-black text-deepgreen outline-none"
                              />
                            </div>

                            <div>
                              <label className="text-[10px] font-bold text-gray-400 block mb-0.5">설명</label>
                              <textarea
                                value={item.description}
                                onChange={(e) => handleUpdateMasterOptionPoolItem(poolCategory as any, item.id, 'description', e.target.value)}
                                rows={2}
                                className="w-full p-2 bg-gray-50 border rounded-xl text-xs text-gray-600 outline-none resize-none"
                              />
                            </div>
                          </div>

                          <div className="pt-2 border-t flex justify-end">
                            <button
                              type="button"
                              onClick={() => handleDeleteMasterOptionPoolItem(poolCategory as any, item.id, item.name)}
                              className="px-3 py-1 bg-red-50 hover:bg-red-500 text-red-500 hover:text-white rounded-lg text-xs font-bold transition"
                            >
                              삭제
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Modal: Add New Pool Item */}
            {showAddPoolModal && (
              <div className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
                <div className="bg-white max-w-lg w-full rounded-3xl p-6 shadow-2xl border border-gold-400 space-y-4 animate-scale-in">
                  <div className="flex justify-between items-center border-b pb-3">
                    <h4 className="text-base font-black text-deepgreen flex items-center gap-2">
                      <span>➕</span> 새 맞춤 풀(Pool) 옵션 항목 등록
                    </h4>
                    <button
                      type="button"
                      onClick={() => setShowAddPoolModal(false)}
                      className="text-gray-400 hover:text-gray-600 font-bold text-lg"
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleAddNewPoolItemSubmit} className="space-y-3.5 text-xs">
                    <div>
                      <label className="font-bold text-gray-700 block mb-1">옵션 분류</label>
                      <select
                        value={newPoolItem.category}
                        onChange={(e) => setNewPoolItem({ ...newPoolItem, category: e.target.value as any })}
                        className="w-full p-2.5 bg-white border border-gray-300 rounded-xl font-bold outline-none"
                      >
                        <option value="region">📍 1단계 여행 지역</option>
                        <option value="golf">⛳ 골프장 풀</option>
                        <option value="tour">🗺️ 여행/자유여행 상품 풀</option>
                        <option value="hotelTier">🏨 4단계 숙박 4종 카드</option>
                        <option value="hotel">🏨 지역별 세부 숙박/풀빌라 풀</option>
                        <option value="vehicle">🚐 5단계 차량 풀</option>
                        <option value="extra">✨ 6단계 기타 부가서비스</option>
                        <option value="guide">👨‍💼 세부 가이드 풀</option>
                        <option value="meal">🦞 세부 식사 풀</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-gray-700 block mb-1">항목명 *</label>
                      <input
                        type="text"
                        required
                        placeholder={
                          newPoolItem.category === 'region' ? '예: 푸꾸옥' :
                          newPoolItem.category === 'golf' ? '예: 빈펄 골프 나트랑 CC (18홀)' :
                          newPoolItem.category === 'tour' ? '예: 나트랑 스노클링 호핑 투어' :
                          newPoolItem.category === 'vehicle' ? '예: 9인승 VIP 리무진 밴' :
                          '항목명 입력'
                        }
                        value={newPoolItem.name}
                        onChange={(e) => setNewPoolItem({ ...newPoolItem, name: e.target.value })}
                        className="w-full p-2.5 bg-white border border-gray-300 rounded-xl font-bold outline-none focus:ring-2 focus:ring-gold-400"
                      />
                    </div>

                    {(newPoolItem.category === 'region' || newPoolItem.category === 'hotelTier' || newPoolItem.category === 'vehicle' || newPoolItem.category === 'extra') && (
                      <div className="grid grid-cols-2 gap-3">
                        {newPoolItem.category === 'vehicle' && (
                          <div>
                            <label className="font-bold text-gray-700 block mb-1">버튼 단축명</label>
                            <input
                              type="text"
                              placeholder="예: 7인승, 9인승"
                              value={newPoolItem.shortName || ''}
                              onChange={(e) => setNewPoolItem({ ...newPoolItem, shortName: e.target.value })}
                              className="w-full p-2.5 bg-white border border-gray-300 rounded-xl font-bold outline-none"
                            />
                          </div>
                        )}
                        <div className={newPoolItem.category === 'vehicle' ? '' : 'col-span-2'}>
                          <label className="font-bold text-gray-700 block mb-1">아이콘 선택 / 이미지 업로드</label>
                          <button
                            type="button"
                            onClick={() => openIconPicker(
                              'newPoolItem',
                              newPoolItem.category as 'region' | 'hotelTier' | 'vehicle' | 'extra',
                              undefined,
                              newPoolItem.name || '새 항목',
                              newPoolItem.icon || '🌴'
                            )}
                            className="w-full p-2.5 bg-gray-50 hover:bg-emerald-50 border border-gray-300 hover:border-emerald-400 rounded-xl font-bold flex items-center justify-between transition cursor-pointer"
                          >
                            <span className="flex items-center gap-2">
                              {isImageIconUrl(newPoolItem.icon) ? (
                                <img src={getFreshImageUrl(newPoolItem.icon)} alt="아이콘" className="w-6 h-6 object-contain rounded" />
                              ) : (
                                <span className="text-lg leading-none">{newPoolItem.icon || '🌴'}</span>
                              )}
                              <span className="text-gray-600 text-xs">현재 선택된 아이콘</span>
                            </span>
                            <span className="text-deepgreen text-xs font-extrabold whitespace-nowrap">아이콘 변경 &gt;</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {(newPoolItem.category === 'golf' || newPoolItem.category === 'hotel' || newPoolItem.category === 'tour') && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="font-bold text-gray-700 block mb-1">지역</label>
                          <select
                            value={newPoolItem.location}
                            onChange={(e) => setNewPoolItem({ ...newPoolItem, location: e.target.value })}
                            className="w-full p-2.5 bg-white border border-gray-300 rounded-xl font-bold outline-none"
                          >
                            {newPoolItem.category === 'tour' && <option value="전체">전체 (자유여행)</option>}
                            <option value="호치민">호치민</option>
                            <option value="붕따우">붕따우</option>
                            <option value="무이네">무이네</option>
                            <option value="나트랑">나트랑</option>
                            <option value="달랏">달랏</option>
                          </select>
                        </div>
                        {newPoolItem.category === 'golf' ? (
                          <div>
                            <label className="font-bold text-gray-700 block mb-1">홀수</label>
                            <select
                              value={newPoolItem.holes || 18}
                              onChange={(e) => setNewPoolItem({ ...newPoolItem, holes: Number(e.target.value) })}
                              className="w-full p-2.5 bg-white border border-gray-300 rounded-xl font-bold outline-none"
                            >
                              <option value={18}>18홀</option>
                              <option value={27}>27홀</option>
                              <option value={36}>36홀</option>
                            </select>
                          </div>
                        ) : newPoolItem.category === 'hotel' ? (
                          <div>
                            <label className="font-bold text-gray-700 block mb-1">숙박 형태</label>
                            <select
                              value={newPoolItem.type || 'hotel_5star'}
                              onChange={(e) => setNewPoolItem({ ...newPoolItem, type: e.target.value as any })}
                              className="w-full p-2.5 bg-white border border-gray-300 rounded-xl font-bold outline-none"
                            >
                              <option value="hotel_5star">고급 호텔</option>
                              <option value="pool_villa">독채 풀빌라</option>
                              <option value="resort">리조트</option>
                              <option value="hotel_4star">4성급 호텔</option>
                            </select>
                          </div>
                        ) : (
                          <div>
                            <label className="font-bold text-gray-700 block mb-1">과금 유형</label>
                            <select
                              value={newPoolItem.isFreeTravel ? 'free' : 'tour'}
                              onChange={(e) => setNewPoolItem({ ...newPoolItem, isFreeTravel: e.target.value === 'free' })}
                              className="w-full p-2.5 bg-white border border-gray-300 rounded-xl font-bold outline-none"
                            >
                              <option value="tour">추천 관광 상품</option>
                              <option value="free">자유 여행 옵션</option>
                            </select>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                      {['region', 'golf', 'tour', 'hotelTier', 'vehicle', 'extra'].includes(newPoolItem.category) ? (
                        <div>
                          <label className="font-bold text-gray-700 block mb-1">
                            {newPoolItem.category === 'hotelTier' ? '1박 단가 ($ USD)' :
                             newPoolItem.category === 'vehicle' ? '1일 단가 ($ USD · 팀 기준)' :
                             newPoolItem.category === 'golf' ? '1회 라운딩 단가 ($ USD)' :
                             '단가 ($ USD)'}
                          </label>
                          <input
                            type="number"
                            value={newPoolItem.priceUSD ?? 0}
                            onChange={(e) => setNewPoolItem({ ...newPoolItem, priceUSD: Number(e.target.value) })}
                            className="w-full p-2.5 bg-emerald-50 border border-emerald-300 rounded-xl font-black text-deepgreen outline-none"
                          />
                        </div>
                      ) : (
                        <div>
                          <label className="font-bold text-gray-700 block mb-1">1인 가격 차액 ($ USD)</label>
                          <input
                            type="number"
                            placeholder="0 (기준가 동일) 또는 +50, -30"
                            value={newPoolItem.priceDeltaUSD}
                            onChange={(e) => setNewPoolItem({ ...newPoolItem, priceDeltaUSD: Number(e.target.value) })}
                            className="w-full p-2.5 bg-white border border-gray-300 rounded-xl font-black text-deepgreen outline-none"
                          />
                        </div>
                      )}
                      <div>
                        <label className="font-bold text-gray-700 block mb-1">강조 뱃지 (선택)</label>
                        <input
                          type="text"
                          placeholder="예: 인기 1위, 바베큐 가능"
                          value={newPoolItem.badge}
                          onChange={(e) => setNewPoolItem({ ...newPoolItem, badge: e.target.value })}
                          className="w-full p-2.5 bg-white border border-gray-300 rounded-xl outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="font-bold text-gray-700 block mb-1">고객 안내용 세부 설명</label>
                      <textarea
                        rows={3}
                        placeholder="위치, 특장점, 시설 설명 또는 서비스 구성 안내"
                        value={newPoolItem.description}
                        onChange={(e) => setNewPoolItem({ ...newPoolItem, description: e.target.value })}
                        className="w-full p-2.5 bg-white border border-gray-300 rounded-xl outline-none resize-none"
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowAddPoolModal(false)}
                        className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition"
                      >
                        취소
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-3 bg-deepgreen hover:bg-gold-600 text-white font-black rounded-xl shadow transition"
                      >
                        등록 완료
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Modal: Icon Picker & Custom Image Upload */}
            {iconPickerTarget && (
              <div
                className="fixed inset-0 z-[10000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
                onClick={() => setIconPickerTarget(null)}
              >
                <div
                  className="bg-white max-w-md w-full rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl border border-emerald-200 space-y-4 animate-scale-in"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex justify-between items-center border-b pb-3 gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                        {isImageIconUrl(iconPickerTarget.currentIcon) ? (
                          <img src={getFreshImageUrl(iconPickerTarget.currentIcon)} alt="" className="w-7 h-7 object-contain rounded" />
                        ) : (
                          <span className="text-2xl leading-none">{iconPickerTarget.currentIcon || '🌴'}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm sm:text-base font-black text-deepgreen truncate">
                          {iconPickerTarget.label} 아이콘 변경
                        </h4>
                        <p className="text-[11px] text-gray-500">이모지를 클릭하거나 이미지 아이콘을 업로드하세요.</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIconPickerTarget(null)}
                      className="text-gray-400 hover:text-gray-700 font-bold text-lg px-2 py-1 shrink-0"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Preset Icon Grid */}
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 block mb-2">추천 아이콘 (클릭 시 즉시 적용)</label>
                    <div className="grid grid-cols-6 sm:grid-cols-7 gap-2 max-h-52 overflow-y-auto p-1">
                      {ICON_PRESETS_BY_CATEGORY[iconPickerTarget.category].map((emoji) => {
                        const isCurrent = iconPickerTarget.currentIcon === emoji;
                        return (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => applyPickedIcon(emoji)}
                            className={`h-11 rounded-xl border text-2xl flex items-center justify-center transition cursor-pointer ${
                              isCurrent
                                ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-300 shadow-xs'
                                : 'bg-gray-50 hover:bg-emerald-50 border-gray-200 hover:border-emerald-300'
                            }`}
                          >
                            {emoji}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Image File Upload */}
                  <div className="pt-2 border-t border-gray-100 space-y-2">
                    <label className="text-[11px] font-bold text-gray-500 block">직접 이미지 아이콘 업로드</label>
                    <label className="w-full py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-deepgreen border border-emerald-300 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer transition whitespace-nowrap">
                      <span>🖼️</span>
                      <span>내 기기에서 이미지 선택 (PNG / JPG / WebP)</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          handleFileUpload(e, (url) => {
                            applyPickedIcon(url);
                          });
                        }}
                      />
                    </label>
                  </div>

                  {/* Custom Emoji or Image URL Input */}
                  <div className="pt-2 border-t border-gray-100 space-y-2">
                    <label className="text-[11px] font-bold text-gray-500 block">직접 입력 (이모지 또는 이미지 URL)</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={iconCustomInput}
                        onChange={(e) => setIconCustomInput(e.target.value)}
                        placeholder="이모지 붙여넣기 또는 https://... 이미지 주소"
                        className="flex-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs sm:text-sm outline-none focus:border-emerald-500"
                      />
                      <button
                        type="button"
                        onClick={() => applyPickedIcon(iconCustomInput)}
                        className="px-4 py-2 bg-deepgreen hover:bg-gold-600 text-white text-xs font-bold rounded-xl transition whitespace-nowrap shrink-0"
                      >
                        적용
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Page Editor (Golf, Hotel, etc) */}
        {activeTab === 'pages' && (
          <div className="animate-fade-in-up px-2.5 sm:px-0">
            <div className="flex flex-wrap justify-between items-center gap-3 mb-5 sm:mb-8 border-b pb-4 sm:pb-6">
               <h3 className="text-lg sm:text-2xl font-bold text-gray-800 whitespace-nowrap">서브 페이지 통합 편집기</h3>
               <select 
                className="p-2.5 sm:p-3 bg-white border-2 border-deepgreen rounded-xl sm:rounded-2xl font-bold text-deepgreen shadow-md outline-none text-xs sm:text-sm"
                value={selectedPageId}
                onChange={(e) => setSelectedPageId(e.target.value)}
              >
                <option value="business">비지니스</option>
                <option value="golf">골프</option>
                <option value="hotel">호텔&빌라</option>
                <option value="food">먹거리</option>
                <option value="culture">베트남 문화</option>
                <option value="men">FOR MEN</option>
                <option value="tour">관광</option>
                <option value="event">이벤트</option>
              </select>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               {/* Hero & Intro Section */}
               <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-bold text-deepgreen uppercase tracking-wider flex items-center gap-2">
                        <span className="text-xl">1️⃣</span> 상단 배너 설정 (Hero)
                    </h4>
                    <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100 space-y-2 shadow-sm">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400">메인 타이틀</label>
                            <input className="w-full p-3 border rounded-xl font-bold shadow-sm focus:ring-2 focus:ring-gold-500 outline-none" value={pageForm.heroTitle} onChange={(e) => handlePageFieldChange('heroTitle', e.target.value)} placeholder="큰 제목" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400">서브 타이틀 (작은 글씨)</label>
                            <input className="w-full p-3 border rounded-xl font-bold shadow-sm focus:ring-2 focus:ring-gold-500 outline-none" value={pageForm.heroSubtitle} onChange={(e) => handlePageFieldChange('heroSubtitle', e.target.value)} placeholder="부제목" />
                        </div>
                        <div className="h-32 bg-white rounded-2xl overflow-hidden relative group border-2 border-white shadow-sm">
                        <img src={getFreshImageUrl(pageForm.heroImage)} className="w-full h-full object-cover" alt="Hero Banner" />
                        <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center text-white font-bold cursor-pointer text-xs">
                            <span className="text-2xl mb-1">🖼️</span> 배너 이미지 교체
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, (url) => handlePageFieldChange('heroImage', url))} />
                        </label>
                        </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                     <h4 className="font-bold text-deepgreen uppercase tracking-wider flex items-center gap-2">
                        <span className="text-xl">2️⃣</span> 소개 섹션 (Intro)
                    </h4>
                    <div className="bg-gray-50 p-4 rounded-3xl border border-gray-100 space-y-2 shadow-sm">
                        <input className="w-full p-3 border rounded-xl font-bold shadow-sm" value={pageForm.introTitle} onChange={(e) => handlePageFieldChange('introTitle', e.target.value)} placeholder="소개 제목" />
                        <textarea className="w-full p-3 border rounded-xl h-32 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-gold-500 resize-none" value={pageForm.introText} onChange={(e) => handlePageFieldChange('introText', e.target.value)} placeholder="소개글 본문" />
                        <div className="h-32 bg-white rounded-2xl overflow-hidden relative group border-2 border-white shadow-sm">
                            <img src={getFreshImageUrl(pageForm.introImage)} className="w-full h-full object-cover" alt="Intro Banner" />
                            <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center text-white font-bold cursor-pointer text-xs">
                                <span className="text-2xl mb-1">🖼️</span> 소개 이미지 교체
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, (url) => handlePageFieldChange('introImage', url))} />
                            </label>
                        </div>
                    </div>
                  </div>
               </div>

               {/* Sections & Gallery */}
               <div className="space-y-4">
                  {/* 갤러리 슬라이드 관리 */}
                  <div className="space-y-2">
                     <div className="flex justify-between items-center">
                        <h4 className="font-bold text-deepgreen uppercase tracking-wider flex items-center gap-2">
                           <span className="text-xl">🖼️</span> 갤러리 슬라이드 관리
                        </h4>
                        <label className="bg-gold-500 text-white text-[10px] px-3 py-1 rounded-full font-bold shadow-sm hover:bg-gold-600 transition cursor-pointer">
                          + 슬라이드 추가
                          <input type="file" className="hidden" accept="image/*" onChange={handlePageSlideAdd} />
                        </label>
                     </div>
                     <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                       {pageForm.slides?.map((slide, idx) => (
                         <div key={idx} className="bg-white p-3 rounded-2xl border border-gray-200 shadow-sm space-y-2 relative group">
                           <button 
                             onClick={() => handlePageSlideRemove(idx)}
                             className="absolute top-2 right-2 z-10 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition"
                           >
                             ✕
                           </button>
                           <div className="h-32 rounded-xl overflow-hidden bg-gray-100">
                             <img src={getFreshImageUrl(slide.image)} className="w-full h-full object-cover" alt={`Slide ${idx}`} />
                           </div>
                           <textarea 
                             className="w-full text-[10px] p-2 border rounded-lg h-12 resize-none outline-none focus:border-gold-500"
                             value={slide.description}
                             onChange={(e) => handlePageSlideChange(idx, 'description', e.target.value)}
                             placeholder="슬라이드 설명 (선택)"
                           />
                         </div>
                       ))}
                     </div>
                  </div>

                  <div className="space-y-4">
                     <div className="flex justify-between items-center">
                        <h4 className="font-bold text-deepgreen uppercase tracking-wider flex items-center gap-2">
                           <span className="text-xl">3️⃣</span> 텍스트 섹션 관리
                        </h4>
                        <button 
                          onClick={handleAddSection}
                          className="bg-deepgreen text-white text-[10px] px-3 py-1 rounded-full font-bold shadow-sm hover:bg-green-800 transition"
                        >
                          + 섹션 추가
                        </button>
                     </div>
                     <div className="space-y-3">
                        {pageForm.sections.map((section, idx) => (
                            <div key={idx} className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm space-y-2 relative group">
                                <button 
                                  onClick={() => handleRemoveSection(idx)}
                                  className="absolute top-2 right-2 w-6 h-6 bg-red-50 text-red-400 hover:text-red-600 hover:bg-red-100 rounded-full flex items-center justify-center transition-all shadow-sm z-10"
                                  title="섹션 삭제"
                                >
                                  ✕
                                </button>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="w-5 h-5 rounded-full bg-deepgreen text-white flex items-center justify-center text-[10px] font-bold">{idx + 1}</span>
                                    <input 
                                        className="flex-1 font-bold text-sm border-b focus:border-gold-500 outline-none" 
                                        value={section.title}
                                        onChange={(e) => handleSectionChange(idx, 'title', e.target.value)}
                                        placeholder="섹션 제목"
                                    />
                                </div>
                                <textarea 
                                    className="w-full text-xs text-gray-600 bg-gray-50 p-2 rounded-lg outline-none resize-none h-16 border-transparent focus:bg-white focus:border-gold-200 border"
                                    value={section.content}
                                    onChange={(e) => handleSectionChange(idx, 'content', e.target.value)}
                                    placeholder="섹션 요약 내용 (목록에 표시됨)"
                                />

                                {/* Detail Popup Management */}
                                <div className="pt-2 border-t border-gray-100 space-y-3">
                                    <div className="flex justify-between items-center">
                                        <label className="text-[10px] font-bold text-gold-600 uppercase">상세 팝업 관리</label>
                                    </div>
                                    <textarea 
                                        className="w-full text-xs text-gray-700 bg-gold-50/30 p-2 rounded-lg outline-none resize-none h-24 border-gold-100 focus:bg-white focus:border-gold-300 border"
                                        value={section.detailContent || ''}
                                        onChange={(e) => handleSectionChange(idx, 'detailContent', e.target.value)}
                                        placeholder="팝업 상세 내용 (상세보기 클릭 시 표시)"
                                    />
                                    
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-bold text-gray-400 block">팝업 상세 이미지 (여러 장 가능)</label>
                                        <div className="flex flex-wrap gap-2">
                                            {section.detailImages?.map((img, imgIdx) => (
                                                <div key={imgIdx} className="w-12 h-12 rounded-lg overflow-hidden relative group border shadow-sm">
                                                    <img src={getFreshImageUrl(img)} className="w-full h-full object-cover" alt={`Detail ${imgIdx}`} />
                                                    <button 
                                                        onClick={() => handleSectionDetailImageRemove(idx, imgIdx)}
                                                        className="absolute inset-0 bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-[10px] font-bold"
                                                    >
                                                        삭제
                                                    </button>
                                                </div>
                                            ))}
                                            <label className="w-12 h-12 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-300 hover:border-gold-400 hover:text-gold-400 transition cursor-pointer">
                                                <span className="text-xl">+</span>
                                                <input 
                                                    type="file" 
                                                    className="hidden" 
                                                    accept="image/*" 
                                                    onChange={(e) => handleSectionDetailImageAdd(idx, e)} 
                                                />
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {pageForm.sections.length === 0 && (
                          <p className="text-center text-gray-400 text-xs py-4 italic">등록된 섹션이 없습니다. [섹션 추가] 버튼을 눌러주세요.</p>
                        )}
                     </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h4 className="font-bold text-deepgreen uppercase tracking-wider flex items-center gap-2">
                            <span className="text-xl">4️⃣</span> 갤러리 이미지 (총 {pageForm.galleryImages.length}개)
                        </h4>
                        <label className="bg-gold-500 text-white text-[10px] px-3 py-1 rounded-full font-bold shadow-sm hover:bg-gold-600 transition cursor-pointer">
                          + 이미지 추가
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*" 
                            onChange={(e) => handleFileUpload(e, (url) => {
                              handlePageFieldChange('galleryImages', [...pageForm.galleryImages, url]);
                            })} 
                          />
                        </label>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        {pageForm.galleryImages.map((img, idx) => (
                            <div key={idx} className="aspect-square bg-gray-50 border rounded-2xl overflow-hidden relative group shadow-sm">
                            <img src={getFreshImageUrl(img)} className="w-full h-full object-cover" alt={`Gallery ${idx}`} />
                            <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-2">
                                <label className="bg-white text-deepgreen px-2 py-1 rounded-full text-[9px] font-bold cursor-pointer hover:bg-gray-100">
                                    교체
                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, (url) => {
                                    const ng = [...pageForm.galleryImages]; ng[idx] = url; handlePageFieldChange('galleryImages', ng);
                                    })} />
                                </label>
                                <button 
                                  onClick={() => handleRemoveGalleryImage(idx)}
                                  className="bg-red-500 text-white px-2 py-1 rounded-full text-[9px] font-bold hover:bg-red-600"
                                >
                                  삭제
                                </button>
                            </div>
                            </div>
                        ))}
                        {pageForm.galleryImages.length === 0 && (
                          <div className="col-span-3 aspect-video border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center text-gray-400 italic text-xs">
                            이미지가 없습니다.
                          </div>
                        )}
                    </div>
                  </div>
               </div>
            </div>

            <div className="mt-16 flex flex-col items-center">
               <button onClick={() => setCurrentPage('home')} className="bg-deepgreen text-white px-24 py-5 rounded-3xl font-bold text-xl hover:shadow-2xl transition transform active:scale-95 shadow-xl flex items-center gap-3">
                   <span>💾</span> 저장 후 홈으로 이동
               </button>
               <p className="text-gray-400 text-xs mt-3">※ 입력하신 내용은 자동으로 저장됩니다.</p>
            </div>
          </div>
        )}

        {/* Menu Icon Management */}
        {activeTab === 'menu' && (
           <div className="animate-fade-in-up px-2.5 sm:px-0">
            <h3 className="text-lg sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">메인 아이콘 메뉴 관리</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 sm:gap-6">
              {menuItems.map((item, idx) => (
                <div key={idx} className="border-2 border-gray-50 p-3 sm:p-4 rounded-2xl sm:rounded-[2.5rem] bg-gray-50 flex flex-col items-center group hover:bg-white hover:shadow-xl transition-all duration-300">
                  <div className="w-20 h-20 mb-3 bg-white rounded-3xl shadow-inner flex items-center justify-center p-4 relative overflow-hidden">
                    <img src={getFreshImageUrl(item.icon)} alt={item.label} className="w-full h-full object-contain transform group-hover:scale-110 transition" />
                    {item.icon.startsWith('data:') && (
                      <div className="absolute top-0 left-0 right-0 bg-red-500/80 text-white text-[7px] text-center py-0.5 font-bold">
                        Base64 ({(item.icon.length / 1024).toFixed(0)}KB)
                      </div>
                    )}
                    <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center cursor-pointer text-white text-[10px] font-bold flex-col whitespace-nowrap">
                      <span>🖼️</span>
                      <span>아이콘 변경</span>
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*" 
                        onChange={(e) => handleFileUpload(e, (url) => { 
                          const ni = [...menuItems]; 
                          ni[idx] = { ...ni[idx], icon: url }; 
                          setMenuItems(ni); 
                        })} 
                      />
                    </label>
                  </div>
                  <input 
                    className="w-full border-b-2 border-transparent bg-transparent text-center font-bold text-gray-800 focus:border-gold-500 outline-none transition text-sm py-1" 
                    value={item.label} 
                    onChange={(e) => { 
                      const ni = [...menuItems]; 
                      ni[idx] = { ...ni[idx], label: e.target.value }; 
                      setMenuItems(ni); 
                    }} 
                  />
                  <button 
                    onClick={() => {
                      if(confirm('이 메뉴 아이콘을 삭제하시겠습니까?')) {
                        const ni = menuItems.filter((_, i) => i !== idx);
                        setMenuItems(ni);
                      }
                    }}
                    className="mt-2 text-[10px] text-gray-400 hover:text-red-500 transition opacity-100 sm:opacity-0 sm:group-hover:opacity-100 whitespace-nowrap"
                  >
                    삭제
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-6 sm:mt-8 flex justify-center">
              <button 
                onClick={() => {
                  const newItem: MenuItem = { label: '새 메뉴', icon: 'https://cdn-icons-png.flaticon.com/512/1039/1039328.png' };
                  setMenuItems([...menuItems, newItem]);
                }}
                className="bg-deepgreen text-white px-6 sm:px-8 py-3 rounded-2xl font-bold shadow-lg hover:bg-gold-600 transition flex items-center gap-2 whitespace-nowrap text-xs sm:text-sm"
              >
                <span>➕</span> 메뉴 아이콘 추가
              </button>
            </div>
            <p className="text-center text-gray-400 text-xs mt-6 sm:mt-8 bg-gray-50 p-3 rounded-xl inline-block mx-auto">※ 아이콘 메뉴의 이름과 이미지를 자유롭게 수정하거나 추가/삭제할 수 있습니다. 변경사항은 실시간으로 저장됩니다.</p>
          </div>
        )}

        {/* Popup Management */}
        {activeTab === 'popup' && (
          <div className="animate-fade-in-up max-w-4xl mx-auto px-2 sm:px-0">
            <h3 className="text-lg sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">공지사항 팝업 관리</h3>
            <div className="bg-white rounded-2xl sm:rounded-[2.5rem] border border-gray-100 shadow-lg sm:shadow-xl overflow-hidden">
              <div className="p-3 sm:p-4 space-y-4">
                <div className="flex items-center justify-between bg-gray-50 p-3 sm:p-4 rounded-2xl sm:rounded-3xl">
                  <div>
                    <h4 className="font-bold text-gray-800">팝업 활성화 상태</h4>
                    <p className="text-xs text-gray-500">사용자가 웹을 열 때 팝업을 표시할지 결정합니다.</p>
                  </div>
                  <button 
                    onClick={() => handlePopupChange('isActive', !popup.isActive)}
                    className={`w-16 h-8 rounded-full transition-all relative ${popup.isActive ? 'bg-deepgreen' : 'bg-gray-300'}`}
                  >
                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${popup.isActive ? 'left-9' : 'left-1'}`}></div>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase ml-1">팝업 제목</label>
                      <input 
                        className="w-full p-4 bg-gray-50 rounded-2xl border-transparent focus:bg-white focus:border-gold-500 border outline-none font-bold"
                        value={popup.title}
                        onChange={(e) => handlePopupChange('title', e.target.value)}
                        placeholder="팝업 제목을 입력하세요"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase ml-1">팝업 내용</label>
                      <textarea 
                        className="w-full p-4 bg-gray-50 rounded-2xl border-transparent focus:bg-white focus:border-gold-500 border outline-none h-40 resize-none text-sm"
                        value={popup.content}
                        onChange={(e) => handlePopupChange('content', e.target.value)}
                        placeholder="팝업 내용을 입력하세요"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase ml-1">이동 링크 (선택)</label>
                      <input 
                        className="w-full p-4 bg-gray-50 rounded-2xl border-transparent focus:bg-white focus:border-gold-500 border outline-none text-sm"
                        value={popup.link || ''}
                        onChange={(e) => handlePopupChange('link', e.target.value)}
                        placeholder="https://..."
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-gray-500 uppercase ml-1 flex items-center gap-1.5">
                        <span>🖼️</span> 팝업 이미지 & 능동 조작 캔버스 (16:9 와이드)
                      </label>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-black bg-gold-100 text-deepgreen px-2 py-0.5 rounded-md border border-gold-300">
                          16:9 와이드 비율
                        </span>
                        {popup.image && (
                          <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            이미지 등록됨
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Active Interactive Image Canvas (16:9 Aspect Ratio) */}
                    <div 
                      className={`aspect-video w-full rounded-3xl bg-gray-950 relative overflow-hidden flex items-center justify-center border border-gray-800 shadow-inner group select-none ${
                        popupZoom > 1 ? 'cursor-grab active:cursor-grabbing' : ''
                      }`}
                      onMouseDown={handlePopupMouseDown}
                      onMouseMove={handlePopupMouseMove}
                      onMouseUp={handlePopupMouseUp}
                      onMouseLeave={handlePopupMouseUp}
                    >
                      {popup.image ? (
                        <>
                          {/* Ambient Blurred Backdrop */}
                          <img
                            src={getFreshImageUrl(popup.image)}
                            alt=""
                            aria-hidden="true"
                            className="absolute inset-0 w-full h-full object-cover filter blur-2xl opacity-40 scale-125 pointer-events-none transition-all duration-300"
                          />

                          {/* Interactive Foreground Image */}
                          <img 
                            src={getFreshImageUrl(popup.image)} 
                            alt="Popup Preview" 
                            style={{
                              transform: `scale(${popupZoom}) translate(${popupPan.x / popupZoom}px, ${popupPan.y / popupZoom}px)`,
                              transition: isPopupDragging ? 'none' : 'transform 0.2s ease-out',
                            }}
                            className={`relative z-10 max-h-full max-w-full duration-300 ${
                              popup.imageFit === 'cover' ? 'w-full h-full object-cover' : 'object-contain'
                            }`}
                            onDoubleClick={() => {
                              if (popupZoom === 1) setPopupZoom(1.5);
                              else handlePopupResetZoom();
                            }}
                            title="더블클릭: 확대/축소 토글"
                          />

                          {/* Top Floating Quick Control Bar */}
                          <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none gap-2">
                            {/* Status Pills */}
                            <div className="pointer-events-auto flex items-center gap-1.5 bg-black/70 backdrop-blur-md text-white px-3 py-1 rounded-full text-[11px] font-bold shadow-md border border-white/10">
                              <span className="text-gold-300 font-black">16:9</span>
                              <span className="text-white/40">|</span>
                              <span className="text-gold-200">{popup.imageFit === 'cover' ? '🔲 채우기' : '🖼️ 원본비율'}</span>
                              <span className="text-white/40">|</span>
                              <span className="text-white">{Math.round(popupZoom * 100)}%</span>
                              {popupZoom > 1 && (
                                <span className="text-emerald-400 font-extrabold text-[10px] bg-emerald-950/60 px-1.5 py-0.5 rounded">
                                  ✋ 드래그 이동
                                </span>
                              )}
                            </div>

                            {/* Zoom & Fullscreen Controls */}
                            <div className="pointer-events-auto flex items-center gap-1 bg-black/70 backdrop-blur-md p-1 rounded-full shadow-md border border-white/10">
                              <button
                                type="button"
                                onClick={handlePopupZoomOut}
                                disabled={popupZoom <= 1}
                                className="w-6 h-6 flex items-center justify-center text-white hover:text-gold-300 font-black rounded-full hover:bg-white/10 transition disabled:opacity-30 cursor-pointer text-xs"
                                title="축소"
                              >
                                －
                              </button>
                              <button
                                type="button"
                                onClick={handlePopupResetZoom}
                                className="px-1.5 py-0.5 text-white hover:text-gold-300 text-[10px] font-bold rounded hover:bg-white/10 transition cursor-pointer"
                                title="100% 리셋"
                              >
                                100%
                              </button>
                              <button
                                type="button"
                                onClick={handlePopupZoomIn}
                                disabled={popupZoom >= 3}
                                className="w-6 h-6 flex items-center justify-center text-white hover:text-gold-300 font-black rounded-full hover:bg-white/10 transition disabled:opacity-30 cursor-pointer text-xs"
                                title="확대"
                              >
                                ＋
                              </button>
                              <div className="w-[1px] h-3 bg-white/20 mx-0.5" />
                              <button
                                type="button"
                                onClick={() => setShowPopupFullscreen(true)}
                                className="px-2 py-0.5 text-white hover:text-gold-300 text-[11px] font-bold rounded-full hover:bg-white/10 transition cursor-pointer flex items-center gap-1"
                                title="전체화면으로 크게보기"
                              >
                                <span>🔍</span> 크게보기
                              </button>
                            </div>
                          </div>

                          {/* Bottom Action Bar */}
                          <div className="absolute bottom-3 left-3 right-3 z-20 flex items-center justify-center gap-2">
                            <label className="bg-white/90 hover:bg-white text-gray-800 px-3 py-1.5 rounded-xl font-bold text-xs cursor-pointer shadow-lg hover:shadow-xl transition flex items-center gap-1 active:scale-95">
                              <span>📁</span> 이미지 교체
                              <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, (url) => handlePopupChange('image', url))} />
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                setPopupUrlInput(popup.image || '');
                                setShowPopupUrlModal(true);
                              }}
                              className="bg-white/90 hover:bg-white text-gray-800 px-3 py-1.5 rounded-xl font-bold text-xs shadow-lg hover:shadow-xl transition flex items-center gap-1 active:scale-95 cursor-pointer"
                            >
                              <span>🔗</span> URL 입력
                            </button>
                            <button 
                              type="button"
                              onClick={() => {
                                if (confirm('팝업 이미지를 삭제하시겠습니까?')) {
                                  handlePopupChange('image', undefined);
                                }
                              }}
                              className="bg-red-500/90 hover:bg-red-600 text-white px-3 py-1.5 rounded-xl font-bold text-xs shadow-lg hover:shadow-xl transition flex items-center gap-1 active:scale-95 cursor-pointer"
                            >
                              <span>🗑️</span> 삭제
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center p-6 text-center space-y-3">
                          <span className="text-5xl animate-bounce">🖼️</span>
                          <div>
                            <p className="text-sm font-bold text-white">등록된 팝업 이미지가 없습니다</p>
                            <p className="text-xs text-gray-400 mt-1">이벤트 포스터나 안내 이미지를 업로드하세요</p>
                          </div>
                          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                            <label className="bg-deepgreen text-white px-4 py-2 rounded-xl font-bold text-xs cursor-pointer hover:bg-gold-600 transition shadow-md flex items-center gap-1.5">
                              <span>📁</span> 내 PC에서 파일 선택
                              <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, (url) => handlePopupChange('image', url))} />
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                setPopupUrlInput('');
                                setShowPopupUrlModal(true);
                              }}
                              className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl font-bold text-xs transition border border-white/20 flex items-center gap-1.5 cursor-pointer"
                            >
                              <span>🔗</span> 웹 URL 입력
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Display Control Options: Fit Mode & Height */}
                    <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-3">
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-[11px] font-bold text-gray-600">
                            1. 팝업 이미지 맞춤 방식 (Fit Mode)
                          </label>
                          <span className="text-[10px] text-gray-400">
                            {popup.imageFit === 'cover' ? '영역 꽉 채우기' : '원본 비율 유지 (권장)'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => handlePopupChange('imageFit', 'contain')}
                            className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                              popup.imageFit !== 'cover'
                                ? 'bg-deepgreen text-white shadow-md'
                                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                            }`}
                          >
                            <span>🖼️</span> 원본 비율 (Contain)
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePopupChange('imageFit', 'cover')}
                            className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                              popup.imageFit === 'cover'
                                ? 'bg-deepgreen text-white shadow-md'
                                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                            }`}
                          >
                            <span>🔲</span> 채우기 (Cover)
                          </button>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1 pl-1">
                          ※ 원본 비율 선택 시 세로형 포스터나 텍스트가 잘리지 않으며, 주변에 고급스러운 앰비언트 블러 배경이 채워집니다.
                        </p>
                      </div>

                      <div className="pt-2 border-t border-gray-200/60">
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-[11px] font-bold text-gray-600">
                            2. 팝업 이미지 비율 및 높이 규격 (Aspect / Height)
                          </label>
                          <span className="text-[10px] text-gray-400 font-bold text-deepgreen">
                            {popup.imageHeight === '16:9' || !popup.imageHeight ? '⭐ 16:9 와이드 (표준)' :
                             popup.imageHeight === 'compact' ? '슬림 190px' :
                             popup.imageHeight === 'large' ? '확장 340px' :
                             popup.imageHeight === 'auto' ? '자동 높이' : '표준 260px'}
                          </span>
                        </div>
                        <div className="grid grid-cols-5 gap-1.5">
                          {[
                            { key: '16:9', label: '16:9 와이드', sub: '표준 와이드' },
                            { key: 'medium', label: '표준 높이', sub: '260px' },
                            { key: 'compact', label: '슬림 높이', sub: '190px' },
                            { key: 'large', label: '확장 높이', sub: '340px' },
                            { key: 'auto', label: '자동 비율', sub: 'Auto' },
                          ].map((item) => {
                            const isSelected = (popup.imageHeight || '16:9') === item.key;
                            return (
                              <button
                                key={item.key}
                                type="button"
                                onClick={() => handlePopupChange('imageHeight', item.key)}
                                className={`py-1.5 px-1.5 rounded-xl text-center transition cursor-pointer ${
                                  isSelected
                                    ? 'bg-deepgreen text-white shadow-xs'
                                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                                }`}
                              >
                                <div className="text-[10px] xs:text-[11px] font-bold leading-tight">{item.label}</div>
                                <div className="text-[9px] opacity-75 mt-0.5">{item.sub}</div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-gray-200/60 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setShowPopupLivePreview(true)}
                          className="w-full py-2.5 bg-gold-500 hover:bg-gold-600 text-deepgreen rounded-xl font-black text-xs transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
                        >
                          <span>👁️</span> 방문자 실제 팝업 실시간 미리보기
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 p-6 text-center">
                <p className="text-xs text-gray-400 italic">※ 팝업 설정은 변경 즉시 실시간으로 반영됩니다.</p>
              </div>
            </div>
          </div>
        )}

        {/* User Admin */}
        {activeTab === 'users' && (() => {
          const adminUsers = [...users]
            .filter(u => u.role === 'admin')
            .sort((a, b) => {
              if (a.username === 'admin' && b.username !== 'admin') return -1;
              if (b.username === 'admin' && a.username !== 'admin') return 1;
              return (a.username || '').localeCompare(b.username || '');
            });

          const memberUsers = [...users]
            .filter(u => u.role !== 'admin')
            .sort((a, b) => (a.username || '').localeCompare(b.username || ''));

          const orderedGroups = [
            { key: 'admins', title: `👑 관리자 계정 (${adminUsers.length}명)`, list: adminUsers, isMemberGroup: false },
            { key: 'members', title: `👤 일반 회원 정보 (${memberUsers.length}명)`, list: memberUsers, isMemberGroup: true },
          ];

          return (
            <div className="animate-fade-in-up w-full">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 px-2.5 sm:px-0 mb-3 sm:mb-6">
                <div>
                  <h3 className="text-lg sm:text-2xl font-bold text-gray-800 flex flex-wrap items-center gap-2">
                    <span>👥 회원 및 관리자 계정 관리</span>
                    <span className="text-xs bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold tabular-nums whitespace-nowrap">
                      총 {users.length}명 (관리자 {adminUsers.length} · 회원 {memberUsers.length})
                    </span>
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    상단에 관리자 계정이 배치되며, 아래로 일반 회원 계정이 정렬됩니다.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(true)}
                  className="w-full sm:w-auto px-4 py-2.5 sm:py-2 bg-deepgreen text-white hover:bg-emerald-800 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition shadow-sm active:scale-98 shrink-0 whitespace-nowrap"
                >
                  <span>➕</span> 신규 회원/관리자 추가
                </button>
              </div>

              {/* Mobile Horizontal Scroll Hint */}
              <div className="md:hidden px-2.5 pb-1.5 flex items-center justify-between text-[11px] font-medium text-gray-400">
                <span>↔ 표를 좌우로 스크롤하여 전체 항목을 확인하세요</span>
              </div>

              {/* Full-Width Horizontally Scrollable Table (Mobile + Desktop Unified) */}
              <div className="w-full overflow-x-auto rounded-none sm:rounded-2xl border-y sm:border border-gray-200 shadow-xs bg-white">
                <table className="w-full min-w-[560px] text-xs sm:text-sm border-collapse">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="py-3 px-3 sm:p-4 text-left font-bold text-gray-600 whitespace-nowrap">아이디</th>
                      <th className="py-3 px-3 sm:p-4 text-left font-bold text-gray-600 whitespace-nowrap">닉네임</th>
                      <th className="py-3 px-3 sm:p-4 text-left font-bold text-gray-600 whitespace-nowrap">권한</th>
                      <th className="py-3 px-3 sm:p-4 text-center font-bold text-gray-600 whitespace-nowrap">권한 변경</th>
                      <th className="py-3 px-3 sm:p-4 text-right font-bold text-gray-600 whitespace-nowrap">계정 관리</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {orderedGroups.map((group) => (
                      <React.Fragment key={group.key}>
                        <tr className={group.isMemberGroup ? 'bg-slate-50/90' : 'bg-rose-50/60'}>
                          <td
                            colSpan={5}
                            className={`px-3 sm:px-4 py-2 sm:py-2.5 text-xs font-extrabold tracking-wide tabular-nums whitespace-nowrap ${
                              group.isMemberGroup ? 'text-slate-700' : 'text-rose-800'
                            }`}
                          >
                            {group.title}
                          </td>
                        </tr>
                        {group.list.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="p-6 text-center text-xs text-gray-400">
                              {group.isMemberGroup ? '등록된 일반 회원이 없습니다.' : '등록된 관리자가 없습니다.'}
                            </td>
                          </tr>
                        ) : (
                          group.list.map((u) => (
                            <tr key={u.id} className="hover:bg-gray-50/80 transition-colors">
                              <td className="py-3 px-3 sm:p-4 font-bold text-gray-800 font-mono whitespace-nowrap">
                                <div className="inline-flex items-center gap-1.5">
                                  <span>{u.username}</span>
                                  {u.username === 'admin' && (
                                    <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold whitespace-nowrap">
                                      최고관리자
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-3 sm:p-4 text-gray-700 font-medium whitespace-nowrap">{u.nickname || '-'}</td>
                              <td className="py-3 px-3 sm:p-4 whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap ${
                                    u.role === 'admin'
                                      ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                      : 'bg-blue-100 text-blue-700 border border-blue-200'
                                  }`}
                                >
                                  {u.role === 'admin' ? '👑 관리자' : '👤 일반회원'}
                                </span>
                              </td>
                              <td className="py-3 px-3 sm:p-4 text-center whitespace-nowrap">
                                {u.username !== 'admin' ? (
                                  <button
                                    type="button"
                                    onClick={() => handleToggleUserRole(u)}
                                    className="text-xs px-2.5 py-1 rounded-lg border border-gray-300 hover:bg-gray-100 text-gray-700 font-medium transition whitespace-nowrap"
                                  >
                                    {u.role === 'admin' ? '일반회원으로 변경' : '👑 관리자로 승격'}
                                  </button>
                                ) : (
                                  <span className="text-[11px] text-gray-400 italic whitespace-nowrap">변경 불가</span>
                                )}
                              </td>
                              <td className="py-3 px-3 sm:p-4 text-right whitespace-nowrap">
                                {u.username !== 'admin' ? (
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteUser(u)}
                                    className="text-xs px-2.5 py-1 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-bold transition border border-red-200 whitespace-nowrap"
                                  >
                                    🗑️ 삭제
                                  </button>
                                ) : (
                                  <span className="text-[11px] text-gray-400 italic whitespace-nowrap">영구 보호</span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>

            {/* 신규 회원 추가 모달 */}
            {showAddUserModal && (
              <div className="fixed inset-0 z-[10000] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
                <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-scale-in p-6">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                    <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <span>👤</span> 신규 회원/관리자 계정 추가
                    </h4>
                    <button
                      type="button"
                      onClick={() => setShowAddUserModal(false)}
                      className="text-gray-400 hover:text-gray-600 text-lg font-bold p-1"
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleAddUser} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">아이디 (ID) *</label>
                      <input
                        type="text"
                        value={newUsername}
                        onChange={e => setNewUsername(e.target.value)}
                        required
                        className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-deepgreen text-sm"
                        placeholder="예: mangotour_user"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">비밀번호 *</label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={e => setNewPassword(e.target.value)}
                        required
                        className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-deepgreen text-sm"
                        placeholder="비밀번호를 입력하세요"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">닉네임</label>
                      <input
                        type="text"
                        value={newNickname}
                        onChange={e => setNewNickname(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-deepgreen text-sm"
                        placeholder="예: 호치민골프러버"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">계정 권한</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setNewRole('user')}
                          className={`p-2.5 rounded-xl font-bold text-xs border transition ${
                            newRole === 'user'
                              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                              : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          👤 일반 회원
                        </button>
                        <button
                          type="button"
                          onClick={() => setNewRole('admin')}
                          className={`p-2.5 rounded-xl font-bold text-xs border transition ${
                            newRole === 'admin'
                              ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                              : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          👑 관리자
                        </button>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-3 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => setShowAddUserModal(false)}
                        className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition"
                      >
                        취소
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2.5 bg-deepgreen hover:bg-emerald-800 text-white font-bold rounded-xl text-xs transition shadow-md"
                      >
                        계정 생성 및 저장
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
          );
        })()}
      </div>

      {/* 0. General Product Delete Confirmation Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-red-200 overflow-hidden animate-scale-in p-6 text-center space-y-4">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-2xl mx-auto shadow-inner">
              🛍️
            </div>
            
            <div>
              <h4 className="text-lg font-black text-gray-900">일반 상품 삭제</h4>
              <p className="text-xs text-gray-500 mt-1">
                선택하신 상품을 상품 목록 및 DB에서 영구히 삭제하시겠습니까?
              </p>
            </div>

            <div className="bg-red-50/80 p-3.5 rounded-2xl border border-red-200 text-left flex items-center gap-3">
              {productToDelete.image && (
                <img 
                  src={getFreshImageUrl(productToDelete.image)} 
                  alt={productToDelete.title} 
                  className="w-12 h-12 rounded-xl object-cover border border-red-200 shrink-0" 
                />
              )}
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-bold text-red-600">[{productToDelete.type || '상품'}] {productToDelete.location} · {productToDelete.duration}</div>
                <div className="text-xs font-black text-gray-900 truncate">{productToDelete.title}</div>
                <div className="text-[11px] text-gray-500 font-bold mt-0.5">${productToDelete.price?.toLocaleString()}</div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteProduct}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-xl transition shadow-md shadow-red-200 active:scale-95 cursor-pointer flex items-center justify-center gap-1"
              >
                <span>🗑️</span> 영구 삭제하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. Custom Trip Package Delete Confirmation Modal */}
      {packageToDelete && (
        <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-red-200 overflow-hidden animate-scale-in p-6 text-center space-y-4">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center text-2xl mx-auto shadow-inner">
              🗑️
            </div>
            
            <div>
              <h4 className="text-lg font-black text-gray-900">맞춤 여행 상품 삭제</h4>
              <p className="text-xs text-gray-500 mt-1">
                선택하신 상품을 데이터베이스 및 목록에서 영구히 삭제하시겠습니까?
              </p>
            </div>

            <div className="bg-red-50/80 p-3.5 rounded-2xl border border-red-200 text-left flex items-center gap-3">
              {packageToDelete.image && (
                <img 
                  src={getFreshImageUrl(packageToDelete.image)} 
                  alt={packageToDelete.title} 
                  className="w-12 h-12 rounded-xl object-cover border border-red-200 shrink-0" 
                />
              )}
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-bold text-red-600">📍 {packageToDelete.location} · {packageToDelete.duration}</div>
                <div className="text-xs font-black text-gray-900 truncate">{packageToDelete.title}</div>
                <div className="text-[11px] text-gray-500 font-bold mt-0.5">기본 ${packageToDelete.basePriceUSD?.toLocaleString()}</div>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setPackageToDelete(null)}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleConfirmDeletePackage}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-xl transition shadow-md shadow-red-200 active:scale-95 cursor-pointer flex items-center justify-center gap-1"
              >
                <span>🗑️</span> 영구 삭제하기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Custom Trip Package Reset Confirmation Modal */}
      {showResetPackageModal && (
        <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-amber-200 overflow-hidden animate-scale-in p-6 text-center space-y-4">
            <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-2xl mx-auto shadow-inner">
              🔄
            </div>
            
            <div>
              <h4 className="text-lg font-black text-gray-900">맞춤 상품 목록 기본값 복구</h4>
              <p className="text-xs text-gray-500 mt-1">
                현재 등록/수정된 맞춤 여행 상품 목록을 초기 표준 10개 상품 데이터로 덮어쓰시겠습니까?
              </p>
            </div>

            <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200 text-xs text-amber-800 font-bold text-left">
              ⚠️ 주의: 사용자가 임의로 추가하거나 수정한 맞춤 여행 상품이 기본 템플릿 데이터로 초기화됩니다.
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowResetPackageModal(false)}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleConfirmResetPackages}
                className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs rounded-xl transition shadow-md shadow-amber-200 active:scale-95 cursor-pointer flex items-center justify-center gap-1"
              >
                <span>🔄</span> 기본값으로 복구
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. Popup Image URL Input Modal */}
      {showPopupUrlModal && (
        <div className="fixed inset-0 z-[10005] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-scale-in">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-black text-gray-900 flex items-center gap-2">
                <span>🔗</span> 팝업 이미지 웹 URL 입력
              </h4>
              <button
                type="button"
                onClick={() => setShowPopupUrlModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center font-bold text-sm transition"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-500">
              인터넷에 올라와 있는 이미지나 포스터 링크(URL)를 직접 붙여넣어 팝업으로 등록할 수 있습니다.
            </p>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-gray-400 uppercase">이미지 주소 (URL)</label>
              <input
                type="url"
                value={popupUrlInput}
                onChange={(e) => setPopupUrlInput(e.target.value)}
                placeholder="https://images.unsplash.com/... 또는 https://example.com/poster.jpg"
                className="w-full p-3.5 bg-gray-50 rounded-2xl border border-gray-200 focus:bg-white focus:border-deepgreen outline-none text-xs"
                autoFocus
              />
            </div>

            {popupUrlInput.trim() && (
              <div className="rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 h-36 flex items-center justify-center">
                <img
                  src={getFreshImageUrl(popupUrlInput.trim())}
                  alt="URL Preview"
                  className="max-h-full max-w-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowPopupUrlModal(false)}
                className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition cursor-pointer"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handlePopupApplyUrl}
                className="flex-1 py-3 bg-deepgreen hover:bg-gold-600 text-white font-bold text-xs rounded-xl transition shadow-md cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>✓</span> 이미지 적용
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Fullscreen Lightbox Modal for Notice Image */}
      {showPopupFullscreen && popup.image && (
        <div 
          className="fixed inset-0 z-[10010] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-fade-in select-none"
          onClick={() => setShowPopupFullscreen(false)}
        >
          {/* Top Control Bar */}
          <div 
            className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-white/10 backdrop-blur-md text-white px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 border border-white/20">
              <span className="text-gold-300">📢 팝업 공지 이미지 원본 보기</span>
              <span className="opacity-40">|</span>
              <span>{Math.round(popupZoom * 100)}%</span>
              {popupZoom > 1 && (
                <span className="text-emerald-400 text-[10px] bg-emerald-950/60 px-2 py-0.5 rounded font-extrabold">
                  드래그하여 이동
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Zoom Controls */}
              <div className="flex items-center gap-1 bg-white/10 backdrop-blur-md p-1 rounded-full border border-white/20 text-white">
                <button
                  type="button"
                  onClick={handlePopupZoomOut}
                  disabled={popupZoom <= 1}
                  className="w-7 h-7 flex items-center justify-center hover:text-gold-300 font-black rounded-full hover:bg-white/10 transition disabled:opacity-30 cursor-pointer text-sm"
                  title="축소"
                >
                  －
                </button>
                <button
                  type="button"
                  onClick={handlePopupResetZoom}
                  className="px-2 py-1 hover:text-gold-300 text-xs font-bold rounded hover:bg-white/10 transition cursor-pointer"
                  title="100% 리셋"
                >
                  100%
                </button>
                <button
                  type="button"
                  onClick={handlePopupZoomIn}
                  disabled={popupZoom >= 3}
                  className="w-7 h-7 flex items-center justify-center hover:text-gold-300 font-black rounded-full hover:bg-white/10 transition disabled:opacity-30 cursor-pointer text-sm"
                  title="확대"
                >
                  ＋
                </button>
              </div>

              {/* Close Button */}
              <button
                type="button"
                onClick={() => setShowPopupFullscreen(false)}
                className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center font-black text-base transition border border-white/30 cursor-pointer"
                title="닫기 (ESC)"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Canvas */}
          <div 
            className="w-full h-full max-w-5xl max-h-[85vh] relative flex items-center justify-center overflow-hidden rounded-3xl"
            onClick={(e) => e.stopPropagation()}
            onMouseDown={handlePopupMouseDown}
            onMouseMove={handlePopupMouseMove}
            onMouseUp={handlePopupMouseUp}
            onMouseLeave={handlePopupMouseUp}
          >
            {/* Ambient Blurred Backdrop */}
            <img
              src={getFreshImageUrl(popup.image)}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 w-full h-full object-cover filter blur-3xl opacity-30 scale-125 pointer-events-none"
            />
            {/* Foreground Main Poster */}
            <img
              src={getFreshImageUrl(popup.image)}
              alt="Popup Fullscreen"
              style={{
                transform: `scale(${popupZoom}) translate(${popupPan.x / popupZoom}px, ${popupPan.y / popupZoom}px)`,
                transition: isPopupDragging ? 'none' : 'transform 0.2s ease-out',
              }}
              className="relative z-10 max-w-full max-h-full object-contain cursor-grab active:cursor-grabbing"
              onDoubleClick={() => {
                if (popupZoom === 1) setPopupZoom(2);
                else handlePopupResetZoom();
              }}
            />
          </div>

          <div className="absolute bottom-4 text-center text-white/50 text-xs pointer-events-none">
            더블클릭으로 200% 확대 / 확대 후 마우스 드래그로 이동 / 바깥 영역 클릭 시 닫힙니다.
          </div>
        </div>
      )}

      {/* 5. Live Visitor Popup Preview Modal */}
      {showPopupLivePreview && (
        <div 
          className="fixed inset-0 z-[10008] bg-black/75 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-fade-in"
          onClick={() => setShowPopupLivePreview(false)}
        >
          {/* Header Banner */}
          <div 
            className="mb-4 bg-gold-400 text-deepgreen px-5 py-2 rounded-full font-black text-xs flex items-center gap-2 shadow-xl border border-gold-300"
            onClick={(e) => e.stopPropagation()}
          >
            <span>📱</span> [실제 방문자 화면 미리보기] 모드
            <span className="opacity-50">|</span>
            <span className="text-[11px] font-bold">배경 클릭 시 닫힙니다</span>
          </div>

          {/* Exact Visitor Popup Simulation */}
          <div 
            className="bg-white rounded-[2.5rem] overflow-hidden shadow-2xl max-w-sm w-full animate-scale-in border border-white/30 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close X */}
            <button
              type="button"
              onClick={() => setShowPopupLivePreview(false)}
              className="absolute top-3 right-3 z-30 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center font-bold text-sm transition"
            >
              ✕
            </button>

            {popup.image ? (
              <div className={`relative overflow-hidden bg-gray-950 flex items-center justify-center ${
                popup.imageHeight === 'compact' ? 'h-48' :
                popup.imageHeight === 'large' ? 'h-80' :
                popup.imageHeight === 'auto' ? 'min-h-[200px] max-h-[380px] h-auto' :
                popup.imageHeight === 'medium' ? 'h-64' :
                'aspect-video w-full'
              }`}>
                {/* Ambient Blurred Backdrop */}
                <img
                  src={getFreshImageUrl(popup.image)}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-cover filter blur-2xl opacity-45 scale-125 pointer-events-none"
                />
                {/* Foreground Notice Image */}
                <img
                  src={getFreshImageUrl(popup.image)}
                  className={`relative z-10 max-h-full max-w-full duration-300 ${
                    popup.imageFit === 'cover' ? 'w-full h-full object-cover' : 'object-contain'
                  }`}
                  alt={popup.title || 'Notification'}
                />
              </div>
            ) : (
              <div className="p-6 bg-deepgreen text-white">
                <h3 className="font-bold text-xl">{popup.title || '공지사항 제목'}</h3>
              </div>
            )}

            <div className="p-6 sm:p-8 space-y-4">
              {!popup.image && <h3 className="text-deepgreen font-bold text-xl">{popup.title || '공지사항'}</h3>}
              <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                {popup.content || '공지사항 내용이 여기에 표시됩니다.'}
              </p>
              
              <div className="pt-2 flex flex-col gap-2">
                {popup.link && (
                  <button 
                    type="button"
                    onClick={() => {
                      alert(`[링크 이동 테스트]\n${popup.link} 로 이동합니다.`);
                    }}
                    className="w-full py-3.5 bg-deepgreen text-white rounded-2xl font-bold shadow-lg hover:bg-gold-600 transition transform active:scale-95 text-sm"
                  >
                    자세히 보기
                  </button>
                )}
                <button 
                  type="button"
                  onClick={() => setShowPopupLivePreview(false)}
                  className="w-full py-3.5 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition text-sm cursor-pointer"
                >
                  미리보기 닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[10001] bg-gray-900/95 backdrop-blur-md text-white px-5 py-3 rounded-2xl shadow-2xl border border-white/20 flex items-center gap-3 animate-fade-in-up">
          <span className="text-sm font-black">{toastMessage}</span>
          <button 
            type="button" 
            onClick={() => setToastMessage(null)}
            className="text-white/60 hover:text-white text-xs font-bold ml-2"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
