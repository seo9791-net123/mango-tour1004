
import React, { useState, useRef, useEffect } from 'react';
import { User, Product, PageContent, MenuItem, VideoItem, CommunityPost, PopupNotification, PageSection, PageSlide, CustomTripPackage, PackageOptionItem } from '../types';
import { 
  INITIAL_PRODUCTS, 
  INITIAL_VIDEOS, 
  INITIAL_POSTS, 
  HERO_IMAGES, 
  SUB_MENU_ITEMS, 
  INITIAL_PAGE_CONTENTS,
  INITIAL_POPUP,
  INITIAL_CUSTOM_PACKAGES 
} from '../constants';
import { driveService } from '../services/googleDriveService';
import { fetchGoogleSheetData } from '../services/googleSheetService';
import { uploadFile, setCloudinaryConfig } from '../services/uploadService';
import { firestoreService } from '../services/firestoreService';
import { DEFAULT_FIREBASE_CONFIG, db } from '../services/firebaseConfig';
import { doc, deleteDoc } from 'firebase/firestore';
import { compressImage } from '../utils/imageUtils';
import BackButton from './BackButton';

interface Props {
  users: User[];
  heroImages: string[];
  setHeroImages: (images: string[]) => void;
  menuItems: MenuItem[];
  setMenuItems: (items: MenuItem[]) => void;
  products: Product[];
  setProducts: (products: Product[]) => void;
  customPackages?: CustomTripPackage[];
  setCustomPackages?: (packages: CustomTripPackage[]) => void;
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
  heroImages,
  setHeroImages,
  menuItems,
  setMenuItems,
  products,
  setProducts,
  customPackages = INITIAL_CUSTOM_PACKAGES,
  setCustomPackages,
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

  // Google Drive Config
  const [showDriveConfig, setShowDriveConfig] = useState(false);
  const [apiKey, setApiKey] = useState(localStorage.getItem('google_api_key') || '');
  const [clientId, setClientId] = useState(localStorage.getItem('google_client_id') || '');
  const [isDriveConnected, setIsDriveConnected] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Firebase Config
  const [showFirebaseConfig, setShowFirebaseConfig] = useState(false);
  const [fbApiKey, setFbApiKey] = useState(localStorage.getItem('fb_api_key') || '');
  const [fbAuthDomain, setFbAuthDomain] = useState(localStorage.getItem('fb_auth_domain') || '');
  const [fbProjectId, setFbProjectId] = useState(localStorage.getItem('fb_project_id') || '');
  const [fbStorageBucket, setFbStorageBucket] = useState(localStorage.getItem('fb_storage_bucket') || '');
  const [fbMessagingSenderId, setFbMessagingSenderId] = useState(localStorage.getItem('fb_messaging_sender_id') || '');
  const [fbAppId, setFbAppId] = useState(localStorage.getItem('fb_app_id') || '');
  const [fbDatabaseURL, setFbDatabaseURL] = useState(localStorage.getItem('fb_database_url') || '');
  const [fbMeasurementId, setFbMeasurementId] = useState(localStorage.getItem('fb_measurement_id') || '');

  // Cloudinary Config
  const [showCloudinaryConfig, setShowCloudinaryConfig] = useState(false);
  const [cloudName, setCloudName] = useState(localStorage.getItem('cloudinary_cloud_name') || '');
  const [uploadPreset, setUploadPreset] = useState(localStorage.getItem('cloudinary_upload_preset') || '');
  
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

  const handleConfirmDeleteProduct = async () => {
    if (!productToDelete) return;
    const prodId = productToDelete.id;
    const updated = products.filter(item => item.id !== prodId);
    setProducts(updated);
    if (editingProductId === prodId) {
      setEditingProductId(null);
    }
    setProductToDelete(null);
    showToast('🗑️ 일반 상품이 삭제되었습니다.');
    try {
      if (db && navigator.onLine) {
        await deleteDoc(doc(db, 'products', prodId));
      }
    } catch (e) {
      console.warn("Direct Firestore delete failed for product:", e);
    }
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
      basePriceUSD: 1100,
      image: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?q=80&w=1200',
      summary: '원하는 골프장과 숙소, 옵션을 내 맘대로 조합하는 맞춤형 패키지',
      highlightBadges: ['54홀 라운딩', '전용 리무진 밴', '5성급 호텔'],
      itinerary: [
        { day: 1, title: '공항 도착 & 호텔 체크인', activities: ['공항 전용 픽업', '호텔 체크인 및 시내 자유시간'] },
        { day: 2, title: '18홀 라운딩', activities: ['조식 후 골프장 이동', '18홀 라운딩', '석식 및 자유시간'] },
        { day: 3, title: '18홀 라운딩', activities: ['18홀 챔피언십 코스', '클럽하우스 중식', '스파 마사지'] },
        { day: 4, title: '18홀 라운딩', activities: ['18홀 라운딩', '특식 석식'] },
        { day: 5, title: '체크아웃 & 시내 관광 후 공항 샌딩', activities: ['체크아웃 및 시내 쇼핑', '공항 전용 샌딩'] },
      ],
      options: [
        { id: `opt-${Date.now()}-1`, category: 'golf', name: '3회 그린피 (54홀)', description: '전 일정 54홀 그린피', priceUSD: 450, isDefaultIncluded: true, isRequired: true },
        { id: `opt-${Date.now()}-2`, category: 'golf', name: '전동카트 (2인 1카트)', description: '라운딩 전동 카트피', priceUSD: 100, isDefaultIncluded: true, isRequired: false },
        { id: `opt-${Date.now()}-3`, category: 'golf', name: '1인 1캐디피', description: '전 일정 1인 1전담 캐디', priceUSD: 90, isDefaultIncluded: true, isRequired: false },
        { id: `opt-${Date.now()}-4`, category: 'hotel', name: '5성급 럭셔리 호텔 (4박 2인1실)', description: '시내 중심 5성급 특급 호텔', priceUSD: 320, isDefaultIncluded: true, isRequired: false },
        { id: `opt-${Date.now()}-5`, category: 'vehicle', name: '전용 VIP 리무진 밴 (전 일정)', description: '공항/골프장 전용 기사 포함', priceUSD: 140, isDefaultIncluded: true, isRequired: false },
      ]
    };
    const updated = [newPkg, ...customPackages];
    setCustomPackages(updated);
    setEditingPackage(newPkg);
    setPackageModalTab('basic');
    showToast('✨ 새 맞춤 여행 상품이 생성되었습니다.');
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleRequestDeletePackage = (pkg: CustomTripPackage) => {
    setPackageToDelete(pkg);
  };

  const handleConfirmDeletePackage = async () => {
    if (!packageToDelete || !setCustomPackages) return;
    const pkgId = packageToDelete.id;
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
    showToast('🗑️ 상품이 성공적으로 삭제되었습니다.');

    // 5. Firebase Firestore 실시간 삭제
    try {
      if (db && navigator.onLine) {
        await deleteDoc(doc(db, 'custom_packages', pkgId));
      }
    } catch (e) {
      console.warn("Direct Firestore delete failed:", e);
    }
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

  const handleSaveFirebaseConfig = () => {
    localStorage.setItem('fb_api_key', fbApiKey);
    localStorage.setItem('fb_auth_domain', fbAuthDomain);
    localStorage.setItem('fb_project_id', fbProjectId);
    localStorage.setItem('fb_storage_bucket', fbStorageBucket);
    localStorage.setItem('fb_messaging_sender_id', fbMessagingSenderId);
    localStorage.setItem('fb_app_id', fbAppId);
    localStorage.setItem('fb_database_url', fbDatabaseURL);
    localStorage.setItem('fb_measurement_id', fbMeasurementId);
    alert('Firebase 설정이 로컬에 저장되었습니다. 변경사항을 적용하기 위해 페이지가 새로고침됩니다.');
    window.location.reload();
  };

  const handleResetFirebaseConfig = () => {
    if (!confirm('Firebase 설정을 기본 내장 표준 설정으로 복구하시겠습니까?')) return;
    setFbApiKey(DEFAULT_FIREBASE_CONFIG.apiKey);
    setFbAuthDomain(DEFAULT_FIREBASE_CONFIG.authDomain);
    setFbProjectId(DEFAULT_FIREBASE_CONFIG.projectId);
    setFbStorageBucket(DEFAULT_FIREBASE_CONFIG.storageBucket);
    setFbMessagingSenderId(DEFAULT_FIREBASE_CONFIG.messagingSenderId);
    setFbAppId(DEFAULT_FIREBASE_CONFIG.appId);
    setFbDatabaseURL(DEFAULT_FIREBASE_CONFIG.databaseURL);
    setFbMeasurementId(DEFAULT_FIREBASE_CONFIG.measurementId);
    
    localStorage.removeItem('fb_api_key');
    localStorage.removeItem('fb_auth_domain');
    localStorage.removeItem('fb_project_id');
    localStorage.removeItem('fb_storage_bucket');
    localStorage.removeItem('fb_messaging_sender_id');
    localStorage.removeItem('fb_app_id');
    localStorage.removeItem('fb_database_url');
    localStorage.removeItem('fb_measurement_id');
    alert('기본 Firebase 설정으로 복구되었습니다. 페이지가 새로고침됩니다.');
    window.location.reload();
  };

  const handleSaveCloudinaryConfig = async () => {
    localStorage.setItem('cloudinary_cloud_name', cloudName);
    localStorage.setItem('cloudinary_upload_preset', uploadPreset);
    setCloudinaryConfig(cloudName, uploadPreset);
    
    // Firestore 클라우드에도 저장하여 다른 컴퓨터에서 접속 시 자동으로 적용되도록 함
    try {
      await firestoreService.saveCloudinaryConfig(cloudName, uploadPreset);
      alert('✅ Cloudinary 이미지 서버 설정이 저장되었습니다!\n\n클라우드(Firestore)에도 동기화되어 이제 다른 컴퓨터 및 모바일 기기에서도 동일한 이미지 서버가 자동으로 적용됩니다.');
    } catch (e) {
      alert('Cloudinary 설정이 로컬에 저장되었습니다.');
    }
    setShowCloudinaryConfig(false);
  };

  // 다른 컴퓨터 동기화용 원클릭 링크 복사
  const handleCopySyncUrl = () => {
    const configPayload = {
      fbApiKey: fbApiKey || DEFAULT_FIREBASE_CONFIG.apiKey,
      fbAuthDomain: fbAuthDomain || DEFAULT_FIREBASE_CONFIG.authDomain,
      fbProjectId: fbProjectId || DEFAULT_FIREBASE_CONFIG.projectId,
      fbStorageBucket: fbStorageBucket || DEFAULT_FIREBASE_CONFIG.storageBucket,
      fbMessagingSenderId: fbMessagingSenderId || DEFAULT_FIREBASE_CONFIG.messagingSenderId,
      fbAppId: fbAppId || DEFAULT_FIREBASE_CONFIG.appId,
      fbDatabaseURL: fbDatabaseURL || DEFAULT_FIREBASE_CONFIG.databaseURL,
      fbMeasurementId: fbMeasurementId || DEFAULT_FIREBASE_CONFIG.measurementId,
      cloudName: cloudName,
      uploadPreset: uploadPreset
    };

    const encoded = btoa(encodeURIComponent(JSON.stringify(configPayload)));
    const origin = window.location.origin;
    const pathname = window.location.pathname;
    const syncUrl = `${origin}${pathname}?sync_config=${encoded}`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(syncUrl).then(() => {
        alert('🔗 [다른 컴퓨터 원클릭 동기화 링크]가 클립보드에 복사되었습니다!\n\n다른 컴퓨터나 휴대폰의 웹 브라우저에서 이 링크를 한 번만 열면 모든 Firebase 및 이미지 서버 설정이 즉시 자동으로 동기화됩니다.');
      }).catch(() => {
        prompt('아래 동기화 링크를 복사하여 다른 컴퓨터에서 접속하세요:', syncUrl);
      });
    } else {
      prompt('아래 동기화 링크를 복사하여 다른 컴퓨터에서 접속하세요:', syncUrl);
    }
  };

  // 전체 설정 코드 복사 (JSON)
  const handleCopyAllConfigJson = () => {
    const configPayload = {
      fbApiKey: fbApiKey || DEFAULT_FIREBASE_CONFIG.apiKey,
      fbAuthDomain: fbAuthDomain || DEFAULT_FIREBASE_CONFIG.authDomain,
      fbProjectId: fbProjectId || DEFAULT_FIREBASE_CONFIG.projectId,
      fbStorageBucket: fbStorageBucket || DEFAULT_FIREBASE_CONFIG.storageBucket,
      fbMessagingSenderId: fbMessagingSenderId || DEFAULT_FIREBASE_CONFIG.messagingSenderId,
      fbAppId: fbAppId || DEFAULT_FIREBASE_CONFIG.appId,
      fbDatabaseURL: fbDatabaseURL || DEFAULT_FIREBASE_CONFIG.databaseURL,
      fbMeasurementId: fbMeasurementId || DEFAULT_FIREBASE_CONFIG.measurementId,
      cloudName: cloudName,
      uploadPreset: uploadPreset
    };

    const jsonStr = JSON.stringify(configPayload, null, 2);
    if (navigator.clipboard) {
      navigator.clipboard.writeText(jsonStr).then(() => {
        alert('📋 [설정 JSON 코드]가 복사되었습니다!\n\n다른 컴퓨터의 관리자 화면에서 [📥 설정 코드 붙여넣기]를 눌러 적용하실 수 있습니다.');
      }).catch(() => {
        prompt('설정 JSON 코드:', jsonStr);
      });
    } else {
      prompt('설정 JSON 코드:', jsonStr);
    }
  };

  // 설정 코드 붙여넣기 / 불러오기
  const handlePasteAllConfigJson = () => {
    const input = prompt('복사한 설정 JSON 코드 또는 동기화 링크(?sync_config=...)를 붙여넣어 주세요:');
    if (!input || !input.trim()) return;

    try {
      let config: any = null;
      const trimmed = input.trim();
      
      if (trimmed.includes('sync_config=') || trimmed.includes('fb_config=')) {
        const match = trimmed.match(/[?&](?:sync_config|fb_config)=([^&#]+)/);
        if (match && match[1]) {
          const decoded = decodeURIComponent(atob(match[1]));
          config = JSON.parse(decoded);
        }
      } else {
        config = JSON.parse(trimmed);
      }

      if (!config) {
        alert('올바른 설정 코드가 아닙니다.');
        return;
      }

      if (config.fbApiKey) setFbApiKey(config.fbApiKey);
      if (config.fbAuthDomain) setFbAuthDomain(config.fbAuthDomain);
      if (config.fbProjectId) setFbProjectId(config.fbProjectId);
      if (config.fbStorageBucket) setFbStorageBucket(config.fbStorageBucket);
      if (config.fbMessagingSenderId) setFbMessagingSenderId(config.fbMessagingSenderId);
      if (config.fbAppId) setFbAppId(config.fbAppId);
      if (config.fbDatabaseURL) setFbDatabaseURL(config.fbDatabaseURL);
      if (config.fbMeasurementId) setFbMeasurementId(config.fbMeasurementId);
      if (config.cloudName) setCloudName(config.cloudName);
      if (config.uploadPreset) setUploadPreset(config.uploadPreset);

      // Save to localStorage directly
      if (config.fbApiKey) localStorage.setItem('fb_api_key', config.fbApiKey);
      if (config.fbAuthDomain) localStorage.setItem('fb_auth_domain', config.fbAuthDomain);
      if (config.fbProjectId) localStorage.setItem('fb_project_id', config.fbProjectId);
      if (config.fbStorageBucket) localStorage.setItem('fb_storage_bucket', config.fbStorageBucket);
      if (config.fbMessagingSenderId) localStorage.setItem('fb_messaging_sender_id', config.fbMessagingSenderId);
      if (config.fbAppId) localStorage.setItem('fb_app_id', config.fbAppId);
      if (config.fbDatabaseURL) localStorage.setItem('fb_database_url', config.fbDatabaseURL);
      if (config.fbMeasurementId) localStorage.setItem('fb_measurement_id', config.fbMeasurementId);
      if (config.cloudName) localStorage.setItem('cloudinary_cloud_name', config.cloudName);
      if (config.uploadPreset) localStorage.setItem('cloudinary_upload_preset', config.uploadPreset);

      if (config.cloudName && config.uploadPreset) {
        setCloudinaryConfig(config.cloudName, config.uploadPreset);
        firestoreService.saveCloudinaryConfig(config.cloudName, config.uploadPreset);
      }

      alert('🎉 설정이 성공적으로 적용되었습니다! 새로고침합니다.');
      window.location.reload();
    } catch (e: any) {
      alert('설정 코드를 파싱하는데 실패했습니다: ' + e.message);
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
    <div className="max-w-7xl mx-auto px-2 sm:px-4 py-3 sm:py-6 animate-fade-in-up">
      {/* Top Bar: Title & Back Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-deepgreen flex items-center gap-2">
            <span className="text-2xl sm:text-3xl">🛠️</span> MANGO TOUR 관리 센터
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">베트남 골프/투어 통합 관리 및 실시간 클라우드 연동</p>
        </div>
        <div className="self-end sm:self-auto shrink-0">
          <BackButton onClick={() => setCurrentPage('home')} variant="light" label="메인으로 나가기" className="px-3.5 py-2 text-xs sm:text-sm shadow-xs font-bold" />
        </div>
      </div>

      {/* Top Quick Actions Grid (좌우 여백 없이 칸에 딱 맞게 정렬) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 w-full mb-4">
        <button 
          type="button"
          onClick={handleResetToDefaults} 
          className="w-full py-2.5 px-3 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition shadow-xs active:scale-98"
        >
          <span className="shrink-0 text-base">🔄</span>
          <span className="truncate">데이터 초기화</span>
        </button>
        <button 
          type="button"
          onClick={handleExportData} 
          className="w-full py-2.5 px-3 bg-gray-700 hover:bg-gray-800 text-white border border-gray-700 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition shadow-xs active:scale-98"
        >
          <span className="shrink-0 text-base">💾</span>
          <span className="truncate">데이터 백업</span>
        </button>
        <button 
          type="button"
          onClick={() => setShowCloudinaryConfig(!showCloudinaryConfig)} 
          className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition shadow-xs border active:scale-98 ${
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
          onClick={() => setShowFirebaseConfig(!showFirebaseConfig)} 
          className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition shadow-xs border active:scale-98 ${
            showFirebaseConfig 
              ? 'bg-orange-600 text-white border-orange-600' 
              : 'bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200'
          }`}
        >
          <span className="shrink-0 text-base">🔥</span>
          <span className="truncate">Firebase 연동 설정</span>
        </button>
        <button 
          type="button"
          onClick={() => setShowDriveConfig(!showDriveConfig)} 
          className={`w-full py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition shadow-xs border active:scale-98 col-span-2 sm:col-span-1 md:col-span-1 ${
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
        <div className="bg-pink-50 border border-pink-100 rounded-2xl p-6 mb-8 animate-fade-in shadow-sm">
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

      {/* Firebase Config Panel */}
      {showFirebaseConfig && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-6 mb-8 animate-fade-in shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-lg font-bold text-orange-900 flex items-center gap-2">
                  🔥 Firebase 실시간 DB 및 다른 컴퓨터 연동
                  <span className="text-[10px] bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full font-bold border border-orange-300">
                    다중 컴퓨터/기기 동기화 지원
                  </span>
                </h3>
                <p className="text-xs text-orange-700 mt-1">
                  다른 컴퓨터나 모바일 기기에서도 동일한 실시간 데이터베이스를 사용하려면 아래의 <strong>[원클릭 동기화 링크]</strong> 또는 <strong>[설정 코드 복사]</strong> 기능을 사용하세요.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleCopySyncUrl}
                  className="px-3 py-1.5 bg-orange-600 text-white hover:bg-orange-700 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-sm"
                  title="다른 컴퓨터에서 열기만 하면 모든 연동 설정이 자동 완료되는 링크를 복사합니다."
                >
                  🔗 다른 PC 원클릭 동기화 링크 복사
                </button>
                <button
                  type="button"
                  onClick={handleCopyAllConfigJson}
                  className="px-3 py-1.5 bg-white border border-orange-300 text-orange-800 hover:bg-orange-100 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-xs"
                  title="전체 설정을 JSON 텍스트로 복사합니다."
                >
                  📋 설정 코드 복사 (JSON)
                </button>
                <button
                  type="button"
                  onClick={handlePasteAllConfigJson}
                  className="px-3 py-1.5 bg-white border border-orange-300 text-orange-800 hover:bg-orange-100 rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-xs"
                  title="복사한 JSON 또는 동기화 링크를 붙여넣어 즉시 적용합니다."
                >
                  📥 설정 코드 붙여넣기
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                <div>
                    <label className="block text-[10px] font-bold text-orange-700 mb-1">API Key</label>
                    <input type="password" value={fbApiKey} onChange={e => setFbApiKey(e.target.value)} className="w-full p-2.5 rounded-lg border border-orange-200 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm font-mono" placeholder="AIza..." />
                </div>
                <div>
                    <label className="block text-[10px] font-bold text-orange-700 mb-1">Auth Domain</label>
                    <input type="text" value={fbAuthDomain} onChange={e => setFbAuthDomain(e.target.value)} className="w-full p-2.5 rounded-lg border border-orange-200 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm font-mono" placeholder="your-project.firebaseapp.com" />
                </div>
                <div>
                    <label className="block text-[10px] font-bold text-orange-700 mb-1">Project ID</label>
                    <input type="text" value={fbProjectId} onChange={e => setFbProjectId(e.target.value)} className="w-full p-2.5 rounded-lg border border-orange-200 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm font-mono" placeholder="your-project-id" />
                </div>
                <div>
                    <label className="block text-[10px] font-bold text-orange-700 mb-1">Storage Bucket</label>
                    <input type="text" value={fbStorageBucket} onChange={e => setFbStorageBucket(e.target.value)} className="w-full p-2.5 rounded-lg border border-orange-200 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm font-mono" placeholder="your-project.appspot.com" />
                </div>
                <div>
                    <label className="block text-[10px] font-bold text-orange-700 mb-1">Messaging Sender ID</label>
                    <input type="text" value={fbMessagingSenderId} onChange={e => setFbMessagingSenderId(e.target.value)} className="w-full p-2.5 rounded-lg border border-orange-200 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm font-mono" placeholder="123456789" />
                </div>
                <div>
                    <label className="block text-[10px] font-bold text-orange-700 mb-1">App ID</label>
                    <input type="text" value={fbAppId} onChange={e => setFbAppId(e.target.value)} className="w-full p-2.5 rounded-lg border border-orange-200 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm font-mono" placeholder="1:123456:web:abc123" />
                </div>
                <div>
                    <label className="block text-[10px] font-bold text-orange-700 mb-1">Database URL (Optional)</label>
                    <input type="text" value={fbDatabaseURL} onChange={e => setFbDatabaseURL(e.target.value)} className="w-full p-2.5 rounded-lg border border-orange-200 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm font-mono" placeholder="https://your-db.firebaseio.com" />
                </div>
                <div>
                    <label className="block text-[10px] font-bold text-orange-700 mb-1">Measurement ID (Optional)</label>
                    <input type="text" value={fbMeasurementId} onChange={e => setFbMeasurementId(e.target.value)} className="w-full p-2.5 rounded-lg border border-orange-200 bg-white focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm font-mono" placeholder="G-XXXXXX" />
                </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleResetFirebaseConfig}
                  className="text-xs text-orange-700 hover:text-orange-900 underline font-semibold transition"
                >
                  🔄 기본 권장 설정으로 초기화
                </button>
                <div className="flex gap-2">
                  <button 
                      onClick={handleSaveFirebaseConfig} 
                      className="px-6 py-2 bg-orange-600 text-white rounded-lg font-bold text-sm hover:bg-orange-700 transition shadow-md flex items-center gap-1.5"
                  >
                      <span>💾</span> 설정 저장 및 새로고침
                  </button>
                </div>
            </div>

            {/* 다른 컴퓨터 접속 및 동기화 안내 박스 */}
            <div className="mt-4 p-4 bg-white/90 rounded-xl text-xs text-orange-900 border border-orange-200 space-y-2.5">
                <p className="font-bold text-sm text-orange-950 flex items-center gap-1.5">
                  💡 다른 컴퓨터에서 동일하게 연동하여 사용하는 3가지 방법
                </p>
                <ul className="space-y-1.5 text-[11px] leading-relaxed text-gray-700 pl-1">
                  <li>
                    <strong className="text-orange-800">방법 1 (가장 쉬움 - 원클릭 링크):</strong> 우측 상단의 <strong>[🔗 다른 PC 원클릭 동기화 링크 복사]</strong>를 클릭한 뒤, 다른 컴퓨터의 웹 브라우저 주소창에 붙여넣어 접속하시면 Firebase 및 이미지 서버 설정이 1초 만에 자동 동기화됩니다.
                  </li>
                  <li>
                    <strong className="text-orange-800">방법 2 (설정 코드 복사/붙여넣기):</strong> <strong>[📋 설정 코드 복사]</strong>를 눌러 코드를 복사한 뒤, 다른 컴퓨터의 관리자 화면에서 <strong>[📥 설정 코드 붙여넣기]</strong>를 누르면 즉시 모든 설정값이 채워지고 적용됩니다.
                  </li>
                  <li>
                    <strong className="text-orange-800">방법 3 (이미지 서버 자동 동기화):</strong> Cloudinary 이미지 서버 설정은 Firebase DB에 클라우드 자동 저장되므로, 동일한 Firebase 프로젝트에 연결되어 있다면 이미지 서버 설정은 아무것도 입력하지 않아도 자동으로 동기화됩니다.
                  </li>
                </ul>
            </div>
        </div>
      )}

      {/* Google Drive Config Panel */}
      {showDriveConfig && (
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 mb-8 animate-fade-in">
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
      <div className="w-full mb-5 bg-gray-100/90 p-1.5 rounded-2xl border border-gray-200/80 shadow-xs">
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
                className={`w-full py-2 sm:py-2.5 px-1 sm:px-2 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all text-center ${
                  isActive
                    ? 'bg-deepgreen text-white shadow-md'
                    : 'text-gray-600 hover:text-deepgreen hover:bg-white/80'
                }`}
              >
                <span className="text-sm shrink-0">{tab.icon}</span>
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl shadow-xl border border-gray-100 min-h-[600px]">
        {/* Hero Slide */}
        {activeTab === 'hero' && (
           <div className="animate-fade-in-up">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 font-serif">메인 슬라이드 이미지 (총 {heroImages.length}개)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {heroImages.map((img, idx) => (
                <div key={idx} className="relative group rounded-2xl overflow-hidden aspect-video shadow-md border bg-gray-50">
                  <img src={img} alt={`Slide ${idx}`} className="w-full h-full object-cover" />
                  {img.startsWith('data:') && (
                    <div className="absolute top-1 left-1 bg-red-500/80 text-white text-[8px] px-1.5 py-0.5 rounded-full font-bold backdrop-blur-sm">
                      Base64 ({(img.length / 1024).toFixed(0)}KB)
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center gap-2">
                    <label className="bg-white text-deepgreen px-3 py-1 rounded-full font-bold text-[10px] cursor-pointer hover:bg-gold-50 shadow-md">
                      교체 <input type="file" className="hidden" accept="image/*" onChange={(e) => handleReplaceHeroImage(idx, e)} />
                    </label>
                    <button onClick={() => setHeroImages(heroImages.filter((_, i) => i !== idx))} className="bg-red-600 text-white px-3 py-1 rounded-full font-bold text-[10px] shadow-md">삭제</button>
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
            <div className="flex justify-between items-center mb-8 border-b pb-4">
              <h3 className="text-2xl font-bold text-gray-800 font-serif">상품 카탈로그 관리</h3>
              <div className="flex gap-2">
                <button 
                  onClick={handleConvertVndToUsd}
                  className="bg-blue-500 text-white px-5 py-2 rounded-xl font-bold shadow-lg hover:bg-blue-600 transition text-sm"
                >
                  VND -&gt; USD 변환
                </button>
                <button 
                  onClick={handleSyncFromGoogleSheet}
                  disabled={isSyncing}
                  className={`bg-green-600 text-white px-5 py-2 rounded-xl font-bold shadow-lg hover:bg-green-700 transition text-sm flex items-center gap-2 ${isSyncing ? 'opacity-50 cursor-wait' : ''}`}
                >
                  {isSyncing ? '🔄 동기화 중...' : '📊 구글 시트 동기화'}
                </button>
                <button 
                  onClick={() => {
                    const newProd: Product = { id: Date.now().toString(), title: '새 여행 상품', description: '상품 설명을 입력하세요.', image: 'https://via.placeholder.com/800x600', price: 0, location: '지역', duration: '3박 5일', type: 'tour', itinerary: [] };
                    setProducts([newProd, ...products]);
                  }} 
                  className="bg-gold-500 text-white px-5 py-2 rounded-xl font-bold shadow-lg text-sm"
                >
                  + 새 상품 추가
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {products.map((p) => (
                 <div key={p.id} className={`flex flex-col border rounded-3xl bg-white shadow-xl overflow-hidden transition-all duration-300 ${editingProductId === p.id ? 'ring-4 ring-gold-400' : 'hover:shadow-2xl'}`}>
                   <div className="h-40 bg-gray-100 relative group">
                     <img src={p.image} className="w-full h-full object-cover" alt={p.title} />
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
                                             <img src={img} className="w-full h-full object-cover" alt={`Detail ${imgIdx}`} />
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
                       </div>
                     )}

                     <div className="flex gap-2 pt-2">
                        <button 
                          type="button"
                          onClick={() => setEditingProductId(editingProductId === p.id ? null : p.id)} 
                          className={`flex-1 py-2 rounded-xl font-bold text-xs transition cursor-pointer ${editingProductId === p.id ? 'bg-gold-500 text-white' : 'bg-gray-100 text-gray-600'}`}
                        >
                          {editingProductId === p.id ? '편집 완료' : '상세 편집'}
                        </button>
                        <button 
                          type="button"
                          onClick={() => setProductToDelete(p)} 
                          className="px-4 py-2 bg-red-50 text-red-500 hover:bg-red-500 hover:text-white rounded-xl text-xs font-bold transition border border-red-200 cursor-pointer active:scale-95"
                        >
                          삭제
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
          <div className="animate-fade-in-up space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b pb-6">
              <div>
                <h3 className="text-2xl font-bold text-gray-800 font-serif flex items-center gap-2">
                  <span>⛳</span> 맞춤 여행 / 골프 상품 관리 ({customPackages.length}개)
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  호치민, 붕따우, 달랏 등 다양한 지역의 맞춤 여행 상품을 관리하고, 기간(3박4일, 4박5일 등) 및 고객 선택 옵션(그린피, 호텔, 차량 등), 일차별 일정을 자유롭게 추가/축소할 수 있습니다.
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
                      <img src={pkg.image} alt={pkg.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
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
                      onClick={() => handleRequestDeletePackage(pkg)}
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

                    <div className="flex items-center gap-2 self-end sm:self-auto">
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
                              <img src={editingPackage.image} alt="Preview" className="w-full h-full object-cover" />
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
                              placeholder="예: 54홀 라운딩, 5성급 호텔, 전용 VIP 리무진"
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
          </div>
        )}

        {/* Page Editor (Golf, Hotel, etc) */}
        {activeTab === 'pages' && (
          <div className="animate-fade-in-up">
            <div className="flex justify-between items-center mb-8 border-b pb-6">
               <h3 className="text-2xl font-bold text-gray-800 font-serif">서브 페이지 통합 편집기</h3>
               <select 
                className="p-3 bg-white border-2 border-deepgreen rounded-2xl font-bold text-deepgreen shadow-md outline-none"
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
                        <img src={pageForm.heroImage} className="w-full h-full object-cover" alt="Hero Banner" />
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
                            <img src={pageForm.introImage} className="w-full h-full object-cover" alt="Intro Banner" />
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
                             <img src={slide.image} className="w-full h-full object-cover" alt={`Slide ${idx}`} />
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
                                                    <img src={img} className="w-full h-full object-cover" alt={`Detail ${imgIdx}`} />
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
                            <img src={img} className="w-full h-full object-cover" alt={`Gallery ${idx}`} />
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
           <div className="animate-fade-in-up">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 font-serif">메인 아이콘 메뉴 관리</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {menuItems.map((item, idx) => (
                <div key={idx} className="border-2 border-gray-50 p-4 rounded-[2.5rem] bg-gray-50 flex flex-col items-center group hover:bg-white hover:shadow-xl transition-all duration-300">
                  <div className="w-20 h-20 mb-3 bg-white rounded-3xl shadow-inner flex items-center justify-center p-4 relative overflow-hidden">
                    <img src={item.icon} alt={item.label} className="w-full h-full object-contain transform group-hover:scale-110 transition" />
                    {item.icon.startsWith('data:') && (
                      <div className="absolute top-0 left-0 right-0 bg-red-500/80 text-white text-[7px] text-center py-0.5 font-bold">
                        Base64 ({(item.icon.length / 1024).toFixed(0)}KB)
                      </div>
                    )}
                    <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center cursor-pointer text-white text-[10px] font-bold flex-col">
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
                    className="mt-2 text-[10px] text-gray-400 hover:text-red-500 transition opacity-0 group-hover:opacity-100"
                  >
                    삭제
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-8 flex justify-center">
              <button 
                onClick={() => {
                  const newItem: MenuItem = { label: '새 메뉴', icon: 'https://cdn-icons-png.flaticon.com/512/1039/1039328.png' };
                  setMenuItems([...menuItems, newItem]);
                }}
                className="bg-deepgreen text-white px-8 py-3 rounded-2xl font-bold shadow-lg hover:bg-gold-600 transition flex items-center gap-2"
              >
                <span>➕</span> 메뉴 아이콘 추가
              </button>
            </div>
            <p className="text-center text-gray-400 text-xs mt-8 bg-gray-50 p-3 rounded-xl inline-block mx-auto">※ 아이콘 메뉴의 이름과 이미지를 자유롭게 수정하거나 추가/삭제할 수 있습니다. 변경사항은 실시간으로 저장됩니다.</p>
          </div>
        )}

        {/* Popup Management */}
        {activeTab === 'popup' && (
          <div className="animate-fade-in-up max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 font-serif">공지사항 팝업 관리</h3>
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden">
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between bg-gray-50 p-4 rounded-3xl">
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
                    <label className="text-xs font-bold text-gray-400 uppercase ml-1">팝업 이미지</label>
                    <div className="aspect-square bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 overflow-hidden relative group">
                      {popup.image ? (
                        <>
                          <img src={popup.image} className="w-full h-full object-cover" alt="Popup Preview" />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-4">
                            <label className="bg-white text-deepgreen px-4 py-2 rounded-xl font-bold text-xs cursor-pointer hover:bg-gray-100">
                              이미지 교체
                              <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, (url) => handlePopupChange('image', url))} />
                            </label>
                            <button 
                              onClick={() => handlePopupChange('image', undefined)}
                              className="bg-red-500 text-white px-4 py-2 rounded-xl font-bold text-xs hover:bg-red-600"
                            >
                              삭제
                            </button>
                          </div>
                        </>
                      ) : (
                        <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-100 transition">
                          <span className="text-4xl mb-2">🖼️</span>
                          <span className="text-xs font-bold text-gray-400">이미지 업로드</span>
                          <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, (url) => handlePopupChange('image', url))} />
                        </label>
                      )}
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
        {activeTab === 'users' && (
          <div className="animate-fade-in-up">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 font-serif">Member Management</h3>
            <div className="overflow-x-auto rounded-2xl border border-gray-100">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr><th className="p-4 text-left font-bold text-gray-600">ID</th><th className="p-4 text-left font-bold text-gray-600">닉네임</th><th className="p-4 text-left font-bold text-gray-600">권한</th></tr>
                </thead>
                <tbody className="divide-y">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50">
                      <td className="p-4 font-bold text-gray-800">{u.username}</td>
                      <td className="p-4 text-gray-600">{u.nickname || '-'}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold ${u.role === 'admin' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>{u.role.toUpperCase()}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
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
                  src={productToDelete.image} 
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
                  src={packageToDelete.image} 
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

      {/* 3. Floating Toast Notification */}
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
