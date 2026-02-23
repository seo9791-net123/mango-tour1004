
import React, { useState, useRef, useEffect } from 'react';
import { User, Product, PageContent, MenuItem, VideoItem, CommunityPost, PopupNotification, PageSection } from '../types';
import { INITIAL_PAGE_CONTENTS } from '../constants';
import { driveService } from '../services/googleDriveService';
import { uploadFile } from '../services/uploadService';

interface Props {
  users: User[];
  heroImages: string[];
  setHeroImages: (images: string[]) => void;
  menuItems: MenuItem[];
  setMenuItems: (items: MenuItem[]) => void;
  products: Product[];
  setProducts: (products: Product[]) => void;
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
  const [activeTab, setActiveTab] = useState<'users' | 'hero' | 'products' | 'pages' | 'menu' | 'popup'>('users');
  
  const heroFileInputRef = useRef<HTMLInputElement>(null);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
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
        }
      });

      // 3. Request Token (Login Popup)
      driveService.requestAccessToken();
      
    } catch (e: any) {
      console.error(e);
      setIsConnecting(false);
      
      const errorMsg = getErrorMessage(e);
      
      // 403 API Not Enabled Error Check
      if (errorMsg.includes('has not been used in project') || errorMsg.includes('is disabled') || errorMsg.includes('PERMISSION_DENIED')) {
          alert(`[🚨 중요: 구글 드라이브 API 미활성화]\n\n구글 클라우드 콘솔에서 'Google Drive API'가 활성화되지 않았습니다.\n\n해결 방법:\n1. Google Cloud Console 접속\n2. 'Google Drive API' 검색 후 [사용(ENABLE)] 클릭\n3. 1~2분 뒤 다시 시도해주세요.\n\n(상세 에러: ${errorMsg})`);
      } else {
          alert(`연결 중 오류가 발생했습니다.\n\n${errorMsg}`);
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
      } catch (error) {
        console.error("Upload failed:", error);
        // Fallback: 로컬 미리보기 (Base64) - 서버 연동 없이도 작동하게 함
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = reader.result as string;
          await callback(base64);
          alert('이미지 서버 연결 실패로 로컬(Base64)로 저장되었습니다. 구글 드라이브 백업을 권장합니다.');
        };
        reader.readAsDataURL(file);
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

  const handleAddSection = () => {
    const newSections = [...pageForm.sections, { title: '새 섹션 제목', content: '새 섹션 내용을 입력하세요.' }];
    handlePageFieldChange('sections', newSections);
  };

  const handleRemoveSection = (index: number) => {
    if (!confirm('이 섹션을 삭제하시겠습니까?')) return;
    const newSections = pageForm.sections.filter((_, i) => i !== index);
    // Use functional update to ensure we have the latest state if needed, 
    // but here we are passing the new array directly to handlePageFieldChange
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
    alert('Firebase 설정이 저장되었습니다. 변경사항을 적용하기 위해 페이지가 새로고침됩니다.');
    window.location.reload();
  };

  const handleSaveCloudinaryConfig = () => {
    localStorage.setItem('cloudinary_cloud_name', cloudName);
    localStorage.setItem('cloudinary_upload_preset', uploadPreset);
    alert('Cloudinary 설정이 저장되었습니다.');
    setShowCloudinaryConfig(false);
  };

  const handleExportData = () => {
    const data = {
      heroImages,
      menuItems,
      products,
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

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 animate-fade-in-up">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h1 className="text-3xl font-bold text-deepgreen flex items-center gap-2">
           <span className="text-4xl">🛠️</span> MANGO TOUR 관리 센터
        </h1>
        <div className="flex gap-2">
            <button onClick={handleExportData} className="px-6 py-2 bg-gray-600 text-white rounded-full font-bold hover:bg-gray-700 transition text-sm flex items-center gap-2">
               <span>💾</span> 데이터 백업
            </button>
            <button onClick={() => setShowCloudinaryConfig(!showCloudinaryConfig)} className="px-6 py-2 bg-pink-50 text-pink-600 rounded-full font-bold hover:bg-pink-100 transition text-sm flex items-center gap-2">
               <span>🖼️</span> 이미지 서버 설정
            </button>
            <button onClick={() => setShowFirebaseConfig(!showFirebaseConfig)} className="px-6 py-2 bg-orange-50 text-orange-600 rounded-full font-bold hover:bg-orange-100 transition text-sm flex items-center gap-2">
               <span>🔥</span> Firebase 연동 설정
            </button>
            <button onClick={() => setShowDriveConfig(!showDriveConfig)} className="px-6 py-2 bg-blue-50 text-blue-600 rounded-full font-bold hover:bg-blue-100 transition text-sm flex items-center gap-2">
               <span>☁️</span> 구글 드라이브 연동 설정
            </button>
            <button onClick={() => setCurrentPage('home')} className="px-6 py-2 bg-gray-100 text-gray-600 rounded-full font-bold hover:bg-gray-200 transition text-sm">나가기</button>
        </div>
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
        <div className="bg-pink-50 border border-pink-100 rounded-2xl p-6 mb-8 animate-fade-in">
            <h3 className="text-lg font-bold text-pink-800 mb-4 flex items-center gap-2">🖼️ Cloudinary 이미지/비디오 서버 설정</h3>
            <p className="text-xs text-pink-600 mb-4">Firebase Storage 생성이 안 될 경우 사용하는 강력한 대안입니다. 무료로 사용 가능합니다.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                    <label className="block text-[10px] font-bold text-pink-600 mb-1">Cloud Name</label>
                    <input type="text" value={cloudName} onChange={e => setCloudName(e.target.value)} className="w-full p-2 rounded border focus:outline-none focus:ring-2 focus:ring-pink-300 text-sm" placeholder="your_cloud_name" />
                </div>
                <div>
                    <label className="block text-[10px] font-bold text-pink-600 mb-1">Upload Preset (Unsigned)</label>
                    <input type="text" value={uploadPreset} onChange={e => setUploadPreset(e.target.value)} className="w-full p-2 rounded border focus:outline-none focus:ring-2 focus:ring-pink-300 text-sm" placeholder="your_preset_name" />
                </div>
            </div>
            <div className="flex justify-end">
                <button 
                    onClick={handleSaveCloudinaryConfig} 
                    className="px-6 py-2 bg-pink-600 text-white rounded-lg font-bold text-sm hover:bg-pink-700 transition shadow-md"
                >
                    설정 저장
                </button>
            </div>
            <div className="mt-4 p-3 bg-white/50 rounded-xl text-[10px] text-pink-700 space-y-1">
                <p className="font-bold">설정 방법:</p>
                <p>1. <a href="https://cloudinary.com" target="_blank" className="underline">cloudinary.com</a> 가입</p>
                <p>2. Dashboard에서 <b>Cloud Name</b> 확인</p>
                <p>3. Settings &gt; Upload &gt; <b>Upload presets</b>에서 'Add upload preset' 클릭</p>
                <p>4. Signing Mode를 <b>Unsigned</b>로 변경하고 저장 후 해당 이름을 입력</p>
            </div>
        </div>
      )}

      {/* Firebase Config Panel */}
      {showFirebaseConfig && (
        <div className="bg-orange-50 border border-orange-100 rounded-2xl p-6 mb-8 animate-fade-in">
            <h3 className="text-lg font-bold text-orange-800 mb-4 flex items-center gap-2">🔥 Firebase 실시간 DB 설정</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                    <label className="block text-[10px] font-bold text-orange-600 mb-1">API Key</label>
                    <input type="password" value={fbApiKey} onChange={e => setFbApiKey(e.target.value)} className="w-full p-2 rounded border focus:outline-none focus:ring-2 focus:ring-orange-300 text-sm" placeholder="AIza..." />
                </div>
                <div>
                    <label className="block text-[10px] font-bold text-orange-600 mb-1">Auth Domain</label>
                    <input type="text" value={fbAuthDomain} onChange={e => setFbAuthDomain(e.target.value)} className="w-full p-2 rounded border focus:outline-none focus:ring-2 focus:ring-orange-300 text-sm" placeholder="your-project.firebaseapp.com" />
                </div>
                <div>
                    <label className="block text-[10px] font-bold text-orange-600 mb-1">Project ID</label>
                    <input type="text" value={fbProjectId} onChange={e => setFbProjectId(e.target.value)} className="w-full p-2 rounded border focus:outline-none focus:ring-2 focus:ring-orange-300 text-sm" placeholder="your-project-id" />
                </div>
                <div>
                    <label className="block text-[10px] font-bold text-orange-600 mb-1">Storage Bucket</label>
                    <input type="text" value={fbStorageBucket} onChange={e => setFbStorageBucket(e.target.value)} className="w-full p-2 rounded border focus:outline-none focus:ring-2 focus:ring-orange-300 text-sm" placeholder="your-project.appspot.com" />
                </div>
                <div>
                    <label className="block text-[10px] font-bold text-orange-600 mb-1">Messaging Sender ID</label>
                    <input type="text" value={fbMessagingSenderId} onChange={e => setFbMessagingSenderId(e.target.value)} className="w-full p-2 rounded border focus:outline-none focus:ring-2 focus:ring-orange-300 text-sm" placeholder="123456789" />
                </div>
                <div>
                    <label className="block text-[10px] font-bold text-orange-600 mb-1">App ID</label>
                    <input type="text" value={fbAppId} onChange={e => setFbAppId(e.target.value)} className="w-full p-2 rounded border focus:outline-none focus:ring-2 focus:ring-orange-300 text-sm" placeholder="1:123456:web:abc123" />
                </div>
            </div>
            <div className="flex justify-end">
                <button 
                    onClick={handleSaveFirebaseConfig} 
                    className="px-6 py-2 bg-orange-600 text-white rounded-lg font-bold text-sm hover:bg-orange-700 transition shadow-md"
                >
                    설정 저장 및 새로고침
                </button>
            </div>
            <p className="text-[10px] text-orange-400 mt-3">* Firebase 콘솔의 '프로젝트 설정'에서 확인한 값을 입력해 주세요. 저장 후 앱이 새로고침됩니다.</p>
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
      
      {/* Tabs */}
      <div className="flex gap-2 mb-8 border-b-2 border-gray-100 overflow-x-auto pb-1 scrollbar-hide">
        {[
          { id: 'users', label: '👥 회원' },
          { id: 'hero', label: '🖼️ 슬라이드' },
          { id: 'products', label: '🛍️ 상품' },
          { id: 'pages', label: '📄 페이지' },
          { id: 'popup', label: '🔔 팝업' },
          { id: 'menu', label: '🔘 메뉴' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-6 py-3 font-bold rounded-t-xl transition-all whitespace-nowrap ${
              activeTab === tab.id ? 'bg-deepgreen text-white shadow-lg -translate-y-1' : 'bg-gray-50 text-gray-400 hover:text-gray-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white p-6 md:p-8 rounded-3xl shadow-2xl border border-gray-50 min-h-[600px]">
        {/* Hero Slide */}
        {activeTab === 'hero' && (
           <div className="animate-fade-in-up">
            <h3 className="text-2xl font-bold text-gray-800 mb-6 font-serif">메인 슬라이드 이미지 (총 {heroImages.length}개)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {heroImages.map((img, idx) => (
                <div key={idx} className="relative group rounded-2xl overflow-hidden aspect-video shadow-md border bg-gray-50">
                  <img src={img} alt={`Slide ${idx}`} className="w-full h-full object-cover" />
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
              <button 
                onClick={() => {
                  const newProd: Product = { id: Date.now().toString(), title: '새 여행 상품', description: '상품 설명을 입력하세요.', image: 'https://via.placeholder.com/800x600', price: 0, location: '지역', duration: '3박 5일', type: 'tour', itinerary: [] };
                  setProducts([newProd, ...products]);
                }} 
                className="bg-gold-500 text-white px-5 py-2 rounded-xl font-bold shadow-lg"
              >
                + 새 상품 추가
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {products.map((p) => (
                 <div key={p.id} className={`flex flex-col border rounded-3xl bg-white shadow-xl overflow-hidden transition-all duration-300 ${editingProductId === p.id ? 'ring-4 ring-gold-400' : 'hover:shadow-2xl'}`}>
                   <div className="h-48 bg-gray-100 relative group">
                     <img src={p.image} className="w-full h-full object-cover" alt={p.title} />
                     <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center cursor-pointer text-white">
                        <span className="text-2xl mb-1">🖼️</span>
                        <span className="text-xs font-bold">사진 교체</span>
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleReplaceProductImage(p.id, e)} />
                     </label>
                   </div>
                   
                   <div className="p-6 space-y-4">
                     <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gold-600 uppercase">상품명</label>
                        <input className="w-full font-bold text-gray-800 border-b-2 border-transparent focus:border-gold-500 outline-none transition" value={p.title} onChange={e => handleProductFieldChange(p.id, 'title', e.target.value)} />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">가격 (VND)</label>
                          <input type="number" className="w-full text-red-600 font-bold border-b outline-none" value={p.price} onChange={e => handleProductFieldChange(p.id, 'price', parseInt(e.target.value) || 0)} />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-gray-400 uppercase">지역</label>
                          <input className="w-full text-gray-600 text-sm border-b outline-none" value={p.location} onChange={e => handleProductFieldChange(p.id, 'location', e.target.value)} />
                        </div>
                     </div>

                     {/* 상세 편집 모드에서만 보이는 추가 필드들 */}
                     {editingProductId === p.id && (
                       <div className="pt-4 border-t space-y-4 animate-fade-in">
                         <div className="grid grid-cols-2 gap-4">
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
                        <button onClick={() => setEditingProductId(editingProductId === p.id ? null : p.id)} className={`flex-1 py-2 rounded-xl font-bold text-xs transition ${editingProductId === p.id ? 'bg-gold-500 text-white' : 'bg-gray-100 text-gray-600'}`}>
                           {editingProductId === p.id ? '편집 완료' : '상세 편집'}
                        </button>
                        <button onClick={() => { if(confirm('이 상품을 영구 삭제하시겠습니까?')) setProducts(products.filter(item => item.id !== p.id)) }} className="px-4 py-2 bg-red-50 text-red-400 rounded-xl text-xs font-bold hover:bg-red-100 transition">삭제</button>
                     </div>
                   </div>
                 </div>
               ))}
            </div>
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
               {/* Hero & Intro Section */}
               <div className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="font-bold text-deepgreen uppercase tracking-wider flex items-center gap-2">
                        <span className="text-xl">1️⃣</span> 상단 배너 설정 (Hero)
                    </h4>
                    <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 space-y-4 shadow-sm">
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

                  <div className="space-y-4">
                     <h4 className="font-bold text-deepgreen uppercase tracking-wider flex items-center gap-2">
                        <span className="text-xl">2️⃣</span> 소개 섹션 (Intro)
                    </h4>
                    <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 space-y-4 shadow-sm">
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
               <div className="space-y-8">
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
                                  className="absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
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
                <div key={idx} className="border-2 border-gray-50 p-6 rounded-[2.5rem] bg-gray-50 flex flex-col items-center group hover:bg-white hover:shadow-xl transition-all duration-300">
                  <div className="w-20 h-20 mb-3 bg-white rounded-3xl shadow-inner flex items-center justify-center p-4 relative overflow-hidden">
                    <img src={item.icon} alt={item.label} className="w-full h-full object-contain transform group-hover:scale-110 transition" />
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
              <div className="p-8 space-y-8">
                <div className="flex items-center justify-between bg-gray-50 p-6 rounded-3xl">
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
    </div>
  );
};

export default AdminDashboard;
